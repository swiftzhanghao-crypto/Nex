
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { registerAuthSessionBridge } from './authSessionBridge';
import { useUI } from './UIContext';
import type {
    Product, SalesMerchandise, AtomicCapability,
    AuthTypeData, Customer, Opportunity, Order,
    User, Department, RoleDefinition, Channel, Enterprise,
    Contract, Remittance, Invoice, Performance, Authorization, DeliveryInfo,
    OrderDraft, Subscription, WorkReport, Space, SalesOrg,
} from '../types';
import { initialSpaces } from '../data/spaceSeedData';
import {
    filterOrdersByRowPermissionsMulti,
    filterCustomersByRowPermissionsMulti,
    filterProductsByRowPermissionsMulti,
} from '../utils/rowPermissionFilter';

import {
    authApi, userApi, orderApi, customerApi, productApi, opportunityApi, financeApi, spaceApi,
    systemApi,
} from '../services/api';
import { buildSubscriptionsFromOrders } from '../data/subscriptionUtils';


// --- Mode detection: set VITE_API_MODE=true in .env to use backend ---
const USE_API = import.meta.env.VITE_API_MODE === 'true';

// --- Mock data: only loaded in non-API mode ---
let initialProducts: Product[] = [];
let initialMerchandises: SalesMerchandise[] = [];
let initialAtomicCapabilities: AtomicCapability[] = [];
let initialAuthTypes: AuthTypeData[] = [];
let initialDepartments: Department[] = [];
let initialRoles: RoleDefinition[] = [];
let initialUsers: User[] = [];
let initialChannels: Channel[] = [];
let initialStandaloneEnterprises: Enterprise[] = [];
let initialSalesOrgs: SalesOrg[] = [];
let productSalesOrgMap: Record<string, { salesOrg: string; businessShipProductName: string; materialType: string; authMaterialName: string; mediaMaterialName: string; supplyOrg: string }[]> = {};
let mockCustomers: Customer[] = [];
let mockOpportunities: Opportunity[] = [];
let mockContracts: Contract[] = [];
let mockOrders: Order[] = [];
let mockRemittances: Remittance[] = [];
let mockInvoices: Invoice[] = [];
let mockPerformances: Performance[] = [];
let mockAuthorizations: Authorization[] = [];
let mockDeliveryInfos: DeliveryInfo[] = [];
let _mockDataReady: Promise<void> | null = null;

const MOCK_DATA_VERSION = 23;

if (!USE_API) {
    _mockDataReady = (async () => {
        const [staticMod, genMod] = await Promise.all([
            import('../data/staticData'),
            import('../data/generators'),
        ]);
        initialProducts = staticMod.initialProducts;
        initialMerchandises = staticMod.initialMerchandises;
        initialAtomicCapabilities = staticMod.initialAtomicCapabilities;
        initialAuthTypes = staticMod.initialAuthTypes;
        initialDepartments = staticMod.initialDepartments;
        initialRoles = staticMod.initialRoles;
        initialUsers = staticMod.initialUsers;
        initialChannels = staticMod.initialChannels;
        initialStandaloneEnterprises = staticMod.initialStandaloneEnterprises;
        initialSalesOrgs = staticMod.initialSalesOrgs;
        productSalesOrgMap = staticMod.productSalesOrgMap;

        try {
            const customers = genMod.generateCustomers(initialUsers);
            const opportunities = genMod.generateOpportunities(customers);
            const contracts = genMod.generateContracts(customers);
            const chainOrders = genMod.generateSubscriptionChainOrders({
                customers,
                products: initialProducts,
                users: initialUsers,
            });
            const baseOrders = genMod.generateOrders({
                customers,
                products: initialProducts,
                users: initialUsers,
                merchandises: initialMerchandises,
                opportunities,
                channels: initialChannels,
                contracts,
            });
            mockOrders = [...chainOrders, ...baseOrders].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
            mockCustomers = customers;
            mockOpportunities = opportunities;
            mockContracts = contracts;
            mockRemittances = genMod.generateRemittances();
            mockInvoices = genMod.generateInvoices();
            mockPerformances = genMod.generatePerformances();
            mockAuthorizations = genMod.generateAuthorizations();
            mockDeliveryInfos = genMod.generateDeliveryInfos();
        } catch (e) {
            console.error('[MockData] Failed to generate mock data:', e);
        }
    })();
}

// ---------- Context shape ----------
interface AppContextType {
    apiMode: boolean;

    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    merchandises: SalesMerchandise[];
    setMerchandises: React.Dispatch<React.SetStateAction<SalesMerchandise[]>>;
    atomicCapabilities: AtomicCapability[];
    setAtomicCapabilities: React.Dispatch<React.SetStateAction<AtomicCapability[]>>;
    authTypes: AuthTypeData[];
    setAuthTypes: React.Dispatch<React.SetStateAction<AuthTypeData[]>>;

    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    opportunities: Opportunity[];
    setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;

    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;

    orderDrafts: OrderDraft[];
    setOrderDrafts: React.Dispatch<React.SetStateAction<OrderDraft[]>>;

    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    departments: Department[];
    setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
    roles: RoleDefinition[];
    setRoles: React.Dispatch<React.SetStateAction<RoleDefinition[]>>;

    channels: Channel[];
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
    standaloneEnterprises: Enterprise[];

    salesOrganizations: SalesOrg[];
    setSalesOrganizations: React.Dispatch<React.SetStateAction<SalesOrg[]>>;

    contracts: Contract[];
    remittances: Remittance[];
    invoices: Invoice[];
    performances: Performance[];
    authorizations: Authorization[];
    deliveryInfos: DeliveryInfo[];
    subscriptions: Subscription[];

    workReports: WorkReport[];
    addWorkReport: (report: WorkReport) => void;

    filteredOrders: Order[];
    filteredCustomers: Customer[];
    filteredProducts: Product[];

    /** Spaces（应用）列表 */
    spaces: Space[];
    setSpaces: React.Dispatch<React.SetStateAction<Space[]>>;
    refreshSpaces: () => Promise<void>;

    refreshOrders: () => Promise<void>;
    refreshCustomers: () => Promise<void>;
    refreshChannels: () => Promise<void>;

    /** 按需懒加载：仅在需要全量数据的页面（看板/详情/AI/统计）调用 */
    loadAllOrders: () => Promise<void>;
    loadAllCustomers: () => Promise<void>;
    loadAllOpportunities: () => Promise<void>;
    loadAllContracts: () => Promise<void>;
    loadAllRemittances: () => Promise<void>;
    loadAllInvoices: () => Promise<void>;
    loadAllPerformances: () => Promise<void>;
    loadAllAuthorizations: () => Promise<void>;
    loadAllDeliveryInfos: () => Promise<void>;

    loading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within <AppProvider>');
    return ctx;
}

/** 向后兼容：合并业务、认证、UI 上下文（优先使用 useAuth / useUI / useAppContext 以减少重渲染） */
export function useApp() {
    return { ...useAppContext(), ...useAuth(), ...useUI() };
}

export type LazyDataKey =
    | 'orders' | 'customers' | 'opportunities'
    | 'contracts' | 'remittances' | 'invoices'
    | 'performances' | 'authorizations' | 'deliveryInfos';

/**
 * 在组件中声明它依赖哪些“全量大表数据”，组件 mount 时按需懒加载。
 * 调用是幂等的：context 内部用 ref 去重，多次调用只会拉一次。
 *
 * 用法：
 *   useEnsureData(['orders', 'customers']);
 */
export function useEnsureData(keys: LazyDataKey[]) {
    const ctx = useAppContext();
    const { needsLogin } = useAuth();
    useEffect(() => {
        if (needsLogin) return;
        keys.forEach((k) => {
            switch (k) {
                case 'orders': ctx.loadAllOrders(); break;
                case 'customers': ctx.loadAllCustomers(); break;
                case 'opportunities': ctx.loadAllOpportunities(); break;
                case 'contracts': ctx.loadAllContracts(); break;
                case 'remittances': ctx.loadAllRemittances(); break;
                case 'invoices': ctx.loadAllInvoices(); break;
                case 'performances': ctx.loadAllPerformances(); break;
                case 'authorizations': ctx.loadAllAuthorizations(); break;
                case 'deliveryInfos': ctx.loadAllDeliveryInfos(); break;
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keys.join(','), needsLogin]);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        currentUser,
        setCurrentUser,
        needsLogin,
        setNeedsLogin,
    } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Product domain ---
    const [products, setProducts] = useState<Product[]>([]);
    const [merchandises, setMerchandises] = useState<SalesMerchandise[]>([]);
    const [atomicCapabilities, setAtomicCapabilities] = useState<AtomicCapability[]>([]);
    const [authTypes, setAuthTypes] = useState<AuthTypeData[]>([]);

    // --- CRM domain ---
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    // --- Order domain ---
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderDrafts, setOrderDrafts] = useState<OrderDraft[]>([]);

    // --- User & Org domain ---
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [roles, setRoles] = useState<RoleDefinition[]>([]);

    // --- Channel domain ---
    const [channels, setChannels] = useState<Channel[]>([]);
    const [standaloneEnterprises, setStandaloneEnterprises] = useState<Enterprise[]>([]);

    // --- Sales organizations ---
    const [salesOrganizations, setSalesOrganizations] = useState<SalesOrg[]>([]);

    // --- Space domain ---
    const [spaces, setSpacesRaw] = useState<Space[]>([]);
    // 包装 setter：Mock 模式下任何变更都同步写回 localStorage
    const setSpaces: React.Dispatch<React.SetStateAction<Space[]>> = useCallback((value) => {
        setSpacesRaw(prev => {
            const next = typeof value === 'function' ? (value as (p: Space[]) => Space[])(prev) : value;
            if (!USE_API) {
                try { localStorage.setItem('spaceMock:list', JSON.stringify(next)); } catch { /* noop */ }
            }
            return next;
        });
    }, []);

    // --- Read-only generated domains ---
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [remittances, setRemittances] = useState<Remittance[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [performances, setPerformances] = useState<Performance[]>([]);
    const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
    const [deliveryInfos, setDeliveryInfos] = useState<DeliveryInfo[]>([]);

    // --- WorkReports domain ---
    const [workReports, setWorkReports] = useState<WorkReport[]>([]);
    const addWorkReport = useCallback((report: WorkReport) => {
        setWorkReports(prev => [report, ...prev]);
    }, []);

    /** 聚合 orderRemark 为订阅链标记的演示单（订单号格式与普通订单一致）；无此类订单时列表为空 */
    const subscriptions = useMemo(
        () => buildSubscriptionsFromOrders(orders, customers, products),
        [orders, customers, products],
    );

    // --- Mock data version check: refresh stale data after HMR ---
    useEffect(() => {
        if (USE_API) return;
        const key = '__mock_data_ver__';
        const stored = sessionStorage.getItem(key);
        if (stored !== String(MOCK_DATA_VERSION)) {
            sessionStorage.setItem(key, String(MOCK_DATA_VERSION));
            setOrders(mockOrders);
            setCustomers(mockCustomers);
            setOpportunities(mockOpportunities);
            setContracts(mockContracts);
            setRemittances(mockRemittances);
            setInvoices(mockInvoices);
            setPerformances(mockPerformances);
            setAuthorizations(mockAuthorizations);
            setDeliveryInfos(mockDeliveryInfos);
        }
    }, []);

    // ============================================================
    // API data fetching
    //
    // 设计：
    //   - bootstrap 只加载“元数据”（当前用户/用户/部门/角色/产品/渠道/商机）
    //     体量小、几乎所有页面都要用，可以一次拉完。
    //   - orders / customers / 财务等大表不再首屏自动拉取，避免 N 万行进内存。
    //     由列表页（用 hooks/usePagedQuery 分页拉）和需要全量数据的页面
    //     （Dashboard / 详情 / AI 等）通过 `loadAllXxx()` 按需触发。
    //   - 已加载的全量数据通过 in-flight 标记去重，防重复请求。
    // ============================================================

    /** 大表 loadAll 的 in-flight + 首次完成标记 */
    const inFlightRef = useRef<Record<string, Promise<void> | null>>({});
    const loadedOnceRef = useRef<Record<string, boolean>>({});

    const dedupedLoad = useCallback(async (key: string, run: () => Promise<void>) => {
        if (!USE_API) return;
        if (loadedOnceRef.current[key]) return;
        const inflight = inFlightRef.current[key];
        if (inflight) return inflight;
        const p = (async () => {
            let ok = false;
            try {
                await run();
                ok = true;
            } catch (e) {
                // 仅在失败时打印，不标记为已加载——组件下次 mount 时会重试
                console.error(`[API] dedupedLoad "${key}" failed:`, e);
            } finally {
                inFlightRef.current[key] = null;
                if (ok) loadedOnceRef.current[key] = true;
            }
        })();
        inFlightRef.current[key] = p;
        return p;
    }, []);

    /** 拉取某个分页接口的全量数据：分批 size=200 直到 total 满 */
    async function fetchAllPaged<T>(
        fetcher: (params: { page: number; size: number }) => Promise<{ data: T[]; total: number; page: number; size: number }>,
        pageSize = 200,
    ): Promise<T[]> {
        const first = await fetcher({ page: 1, size: pageSize });
        const total = first.total ?? first.data.length;
        const acc: T[] = [...first.data];
        const pages = Math.ceil(total / pageSize);
        for (let p = 2; p <= pages; p++) {
            const r = await fetcher({ page: p, size: pageSize });
            acc.push(...r.data);
        }
        return acc;
    }

    // NOTE: 这里的 run 函数不再吞错误，失败会被 dedupedLoad 捕获
    // 并**不**标记为已加载，保证用户下次切换到相应页面时会自动重试。
    const loadAllOrders = useCallback(() => dedupedLoad('orders', async () => {
        const all = await fetchAllPaged((p) => orderApi.list(p));
        setOrders(all);
    }), [dedupedLoad]);

    const loadAllCustomers = useCallback(() => dedupedLoad('customers', async () => {
        const all = await fetchAllPaged((p) => customerApi.list(p));
        setCustomers(all);
    }), [dedupedLoad]);

    const loadAllOpportunities = useCallback(() => dedupedLoad('opportunities', async () => {
        const all = await fetchAllPaged((p) => opportunityApi.list(p));
        setOpportunities(all);
    }), [dedupedLoad]);

    const loadAllContracts = useCallback(() => dedupedLoad('contracts', async () => {
        const all = await fetchAllPaged((p) => financeApi.contracts(p));
        setContracts(all);
    }), [dedupedLoad]);

    const loadAllRemittances = useCallback(() => dedupedLoad('remittances', async () => {
        const all = await fetchAllPaged((p) => financeApi.remittances(p));
        setRemittances(all);
    }), [dedupedLoad]);

    const loadAllInvoices = useCallback(() => dedupedLoad('invoices', async () => {
        const all = await fetchAllPaged((p) => financeApi.invoices(p));
        setInvoices(all);
    }), [dedupedLoad]);

    const loadAllPerformances = useCallback(() => dedupedLoad('performances', async () => {
        const all = await fetchAllPaged((p) => financeApi.performances(p));
        setPerformances(all);
    }), [dedupedLoad]);

    const loadAllAuthorizations = useCallback(() => dedupedLoad('authorizations', async () => {
        const all = await fetchAllPaged((p) => financeApi.authorizations(p));
        setAuthorizations(all);
    }), [dedupedLoad]);

    const loadAllDeliveryInfos = useCallback(() => dedupedLoad('deliveryInfos', async () => {
        const all = await fetchAllPaged((p) => financeApi.deliveryInfos(p));
        setDeliveryInfos(all);
    }), [dedupedLoad]);

    /** 兼容旧接口：refreshXxx 强制重拉一次全量 */
    const refreshOrders = useCallback(async () => {
        loadedOnceRef.current.orders = false;
        await loadAllOrders();
    }, [loadAllOrders]);

    const refreshCustomers = useCallback(async () => {
        loadedOnceRef.current.customers = false;
        await loadAllCustomers();
    }, [loadAllCustomers]);

    const refreshChannels = useCallback(async () => {
        try {
            const channelList = await productApi.channels();
            setChannels(channelList);
        } catch (e) {
            console.error('[API] refreshChannels failed:', e);
        }
    }, [setChannels]);

    const refreshSpaces = useCallback(async () => {
        if (!USE_API) {
            // Mock 模式：优先恢复 localStorage 中的最新列表，避免覆盖用户本地新建/修改的应用
            try {
                const cached = localStorage.getItem('spaceMock:list');
                setSpaces(cached ? (JSON.parse(cached) as Space[]) : initialSpaces);
            } catch {
                setSpaces(initialSpaces);
            }
            return;
        }
        try {
            const list = await spaceApi.list();
            setSpaces(list as Space[]);
        } catch (e) {
            console.error('[API] refreshSpaces failed:', e);
        }
    }, [setSpaces]);

    const clearApiData = useCallback(() => {
        setCustomers([]);
        setOpportunities([]);
        setContracts([]);
        setOrders([]);
        setRemittances([]);
        setInvoices([]);
        setPerformances([]);
        setAuthorizations([]);
        setDeliveryInfos([]);
        setSpaces([]);
        loadedOnceRef.current = {};
        inFlightRef.current = {};
    }, []);

    const loadBootstrap = useCallback(async () => {
        if (!USE_API) {
            if (_mockDataReady) await _mockDataReady;
            setProducts(initialProducts.map(p => {
                const csvEntries = productSalesOrgMap[p.id];
                if (csvEntries && csvEntries.length > 0) {
                    const salesScope = csvEntries.map(e => ({
                        salesOrg: e.salesOrg,
                        businessShipProductName: e.businessShipProductName || p.name,
                        materialType: e.materialType,
                        authMaterialName: e.authMaterialName,
                        mediaMaterialName: e.mediaMaterialName,
                        supplyOrg: e.supplyOrg,
                        status: 'listed' as const,
                        billingStatus: 'unmaintained' as const,
                    }));
                    return { ...p, salesScope, salesOrgName: csvEntries[0].salesOrg };
                }
                return p;
            }));
            setMerchandises(initialMerchandises);
            setAtomicCapabilities(initialAtomicCapabilities);
            setAuthTypes(initialAuthTypes);
            setUsers(initialUsers);
            setDepartments(initialDepartments);
            setRoles(initialRoles);
            setCurrentUser(initialUsers[0]);
            setChannels(initialChannels);
            setStandaloneEnterprises(initialStandaloneEnterprises);
            setSalesOrganizations(initialSalesOrgs);
            setCustomers(mockCustomers);
            setOpportunities(mockOpportunities);
            setOrders(mockOrders);
            setContracts(mockContracts);
            setRemittances(mockRemittances);
            setInvoices(mockInvoices);
            setPerformances(mockPerformances);
            setAuthorizations(mockAuthorizations);
            setDeliveryInfos(mockDeliveryInfos);
            setSpaces(initialSpaces);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        let me: User;
        try {
            me = await authApi.me();
        } catch {
            clearApiData();
            setNeedsLogin(true);
            setLoading(false);
            return;
        }

        try {
            setCurrentUser(me);
            const [userListRes, deptList, roleList, prodListRes, channelList, oppList, spaceList, authTypeList, salesOrgList] = await Promise.all([
                userApi.list({ size: 500 }),
                userApi.departments(),
                userApi.roles(),
                productApi.list({ size: 2000 }),
                productApi.channels(),
                productApi.opportunities(),
                spaceApi.list({ silent: true }).catch(() => [] as Space[]),
                systemApi.listAuthTypes({ silent: true }).catch(() => [] as AuthTypeData[]),
                systemApi.listSalesOrgs({ silent: true }).catch(() => [] as SalesOrg[]),
            ]);
            setUsers(userListRes.data);
            setDepartments(deptList);
            setRoles(roleList);
            setProducts(prodListRes.data);
            setChannels(channelList as unknown as Channel[]);
            setOpportunities(oppList as unknown as Opportunity[]);
            setSpaces(spaceList as Space[]);
            if (authTypeList.length) setAuthTypes(authTypeList);
            if (salesOrgList.length) setSalesOrganizations(salesOrgList);

            setNeedsLogin(false);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '数据加载失败';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [clearApiData, setCurrentUser, setNeedsLogin]);

    useEffect(() => {
        loadBootstrap();
    }, [loadBootstrap]);

    useEffect(() => {
        if (!USE_API) return;
        const handler = () => {
            clearApiData();
            setNeedsLogin(true);
            setError('登录已过期，请重新登录');
        };
        window.addEventListener('auth:expired', handler);
        return () => window.removeEventListener('auth:expired', handler);
    }, [clearApiData, setNeedsLogin]);

    const resetLazyLoadMarkers = useCallback(() => {
        loadedOnceRef.current = {};
        inFlightRef.current = {};
    }, []);

    useEffect(() => {
        registerAuthSessionBridge({
            onBeforeLoginReset: resetLazyLoadMarkers,
            onAfterLogin: async () => {
                setError(null);
                await loadBootstrap();
            },
            onAfterLogout: () => {
                clearApiData();
                setError(null);
            },
        });
        return () => registerAuthSessionBridge(null);
    }, [loadBootstrap, clearApiData, resetLazyLoadMarkers]);

    // 多角色：取用户所有平台角色定义，行权限按角色取并集（任一角色可见即可见），与功能权限合并口径一致
    const currentUserRoles = useMemo(() =>
        roles.filter(r => currentUser.roles?.includes(r.id)),
        [roles, currentUser.roles]
    );

    const filteredOrders = useMemo(() =>
        filterOrdersByRowPermissionsMulti(orders, currentUserRoles, currentUser, users, departments),
        [orders, currentUserRoles, currentUser, users, departments]
    );

    const filteredCustomers = useMemo(() =>
        filterCustomersByRowPermissionsMulti(customers, currentUserRoles, currentUser, users, departments),
        [customers, currentUserRoles, currentUser, users, departments]
    );

    const filteredProducts = useMemo(() =>
        filterProductsByRowPermissionsMulti(products, currentUserRoles, currentUser, users, departments),
        [products, currentUserRoles, currentUser, users, departments]
    );

    const value = useMemo<AppContextType>(() => ({
        apiMode: USE_API,

        products, setProducts,
        merchandises, setMerchandises,
        atomicCapabilities, setAtomicCapabilities,
        authTypes, setAuthTypes,

        customers, setCustomers,
        opportunities, setOpportunities,

        orders, setOrders,
        orderDrafts, setOrderDrafts,

        users, setUsers,
        departments, setDepartments,
        roles, setRoles,

        channels, setChannels,
        standaloneEnterprises,

        salesOrganizations, setSalesOrganizations,

        contracts,
        remittances,
        invoices,
        performances,
        authorizations,
        deliveryInfos,
        subscriptions,

        workReports,
        addWorkReport,

        filteredOrders,
        filteredCustomers,
        filteredProducts,

        spaces, setSpaces,
        refreshSpaces,

        refreshOrders,
        refreshCustomers,
        refreshChannels,

        loadAllOrders,
        loadAllCustomers,
        loadAllOpportunities,
        loadAllContracts,
        loadAllRemittances,
        loadAllInvoices,
        loadAllPerformances,
        loadAllAuthorizations,
        loadAllDeliveryInfos,

        loading,
        error,
        setError,
    }), [
        products, merchandises, atomicCapabilities, authTypes,
        customers, opportunities, orders, orderDrafts,
        users, departments, roles, channels, standaloneEnterprises,
        salesOrganizations, contracts, remittances, invoices,
        performances, authorizations, deliveryInfos, subscriptions,
        workReports, addWorkReport,
        filteredOrders, filteredCustomers, filteredProducts,
        spaces, setSpaces, refreshSpaces,
        refreshOrders, refreshCustomers, refreshChannels,
        loadAllOrders, loadAllCustomers, loadAllOpportunities,
        loadAllContracts, loadAllRemittances, loadAllInvoices,
        loadAllPerformances, loadAllAuthorizations, loadAllDeliveryInfos,
        loading, error,
    ]);

    if (loading && !needsLogin) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-[#1d1d1f]">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
