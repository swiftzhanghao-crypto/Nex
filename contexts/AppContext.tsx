
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
    Product, SalesMerchandise, AtomicCapability,
    AuthTypeData, Customer, Opportunity, Order,
    User, Department, RoleDefinition, Channel, Enterprise,
    Contract, Remittance, Invoice, Performance, Authorization, DeliveryInfo,
    OrderDraft, Subscription, WorkReport, Space,
} from '../types';
import { initialSpaces } from '../data/spaceSeedData';
import {
    filterOrdersByRowPermissions,
    filterCustomersByRowPermissions,
    filterProductsByRowPermissions,
} from '../utils/rowPermissionFilter';

import {
    initialProducts, initialMerchandises, initialAtomicCapabilities,
    initialAuthTypes,
    initialDepartments, initialRoles, initialUsers, initialChannels,
    initialStandaloneEnterprises,
} from '../data/staticData';

import {
    generateCustomers, generateOpportunities, generateOrders,
    generateContracts, generateRemittances, generateInvoices,
    generatePerformances, generateAuthorizations, generateDeliveryInfos,
    generateSubscriptionChainOrders, buildSubscriptionsFromOrders,
} from '../data/generators';

import {
    authApi, userApi, orderApi, customerApi, productApi, opportunityApi, financeApi, spaceApi,
    setToken, getToken,
} from '../services/api';

// --- Mode detection: set VITE_API_MODE=true in .env to use backend ---
const USE_API = import.meta.env.VITE_API_MODE === 'true';

// --- Mock data fallback (bump version when schema changes to force refresh) ---
const MOCK_DATA_VERSION = 23;

function safeGenerateMockData() {
    try {
        const customers = generateCustomers(initialUsers);
        const opportunities = generateOpportunities(customers);
        const contracts = generateContracts(customers);
        const chainOrders = generateSubscriptionChainOrders({
            customers,
            products: initialProducts,
            users: initialUsers,
        });
        const baseOrders = generateOrders({
            customers,
            products: initialProducts,
            users: initialUsers,
            merchandises: initialMerchandises,
            opportunities,
            channels: initialChannels,
            contracts,
        });
        const orders = [...chainOrders, ...baseOrders].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        return { customers, opportunities, contracts, orders };
    } catch (e) {
        console.error('[MockData] Failed to generate mock data, using empty fallback:', e);
        return { customers: [] as Customer[], opportunities: [] as Opportunity[], contracts: [] as Contract[], orders: [] as Order[] };
    }
}

const { customers: mockCustomers, opportunities: mockOpportunities, contracts: mockContracts, orders: mockOrders } = safeGenerateMockData();

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
    currentUser: User;
    setCurrentUser: (user: User) => void;

    channels: Channel[];
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
    standaloneEnterprises: Enterprise[];

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

    needsLogin: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within <AppProvider>');
    return ctx;
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
    useEffect(() => {
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
    }, [keys.join(',')]);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(USE_API);
    const [error, setError] = useState<string | null>(null);
    const [needsLogin, setNeedsLogin] = useState<boolean>(USE_API && !getToken());

    // --- Product domain ---
    const [products, setProducts] = useState(() => {
        const salesOrgs = ['珠海金山办公有限公司', '北京金山办公有限公司', '武汉金山办公有限公司'];
        return initialProducts.map((p, i) => p.salesOrgName ? p : { ...p, salesOrgName: salesOrgs[i % salesOrgs.length] });
    });
    const [merchandises, setMerchandises] = useState(initialMerchandises);
    const [atomicCapabilities, setAtomicCapabilities] = useState(initialAtomicCapabilities);
    const [authTypes, setAuthTypes] = useState(initialAuthTypes);

    // --- CRM domain ---
    const [customers, setCustomers] = useState(USE_API ? [] as Customer[] : mockCustomers);
    const [opportunities, setOpportunities] = useState(USE_API ? [] as Opportunity[] : mockOpportunities);

    // --- Order domain ---
    const [orders, setOrders] = useState(USE_API ? [] as Order[] : mockOrders);
    const [orderDrafts, setOrderDrafts] = useState<OrderDraft[]>([]);

    // --- User & Org domain ---
    const [users, setUsers] = useState(initialUsers);
    const [departments, setDepartments] = useState(initialDepartments);
    const [roles, setRoles] = useState(initialRoles);
    const [currentUser, setCurrentUser] = useState(initialUsers[0]);

    // --- Channel domain ---
    const [channels, setChannels] = useState(initialChannels);
    const [standaloneEnterprises] = useState(initialStandaloneEnterprises);

    // --- Space domain ---
    // Mock 模式下优先从 localStorage 恢复（含用户新建/修改过的应用），无则用 seed
    const [spaces, setSpacesRaw] = useState<Space[]>(() => {
        if (USE_API) return [];
        try {
            const cached = localStorage.getItem('spaceMock:list');
            if (cached) return JSON.parse(cached) as Space[];
        } catch { /* noop */ }
        return initialSpaces;
    });
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
    const [contracts, setContracts] = useState<Contract[]>(() => USE_API ? [] : mockContracts);
    const [remittances, setRemittances] = useState<Remittance[]>(() => USE_API ? [] : generateRemittances());
    const [invoices, setInvoices] = useState<Invoice[]>(() => USE_API ? [] : generateInvoices());
    const [performances, setPerformances] = useState<Performance[]>(() =>
        USE_API ? [] : generatePerformances());
    const [authorizations, setAuthorizations] = useState<Authorization[]>(() =>
        USE_API ? [] : generateAuthorizations());
    const [deliveryInfos, setDeliveryInfos] = useState<DeliveryInfo[]>(() =>
        USE_API ? [] : generateDeliveryInfos());

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
            setRemittances(generateRemittances());
            setInvoices(generateInvoices());
            setPerformances(generatePerformances());
            setAuthorizations(generateAuthorizations());
            setDeliveryInfos(generateDeliveryInfos());
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
        if (!USE_API) return;
        if (!getToken()) {
            clearApiData();
            setLoading(false);
            setError('未登录，请先登录');
            setNeedsLogin(true);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [me, userListRes, deptList, roleList, prodListRes, channelList, oppList, spaceList] = await Promise.all([
                authApi.me(),
                userApi.list({ size: 500 }),
                userApi.departments(),
                userApi.roles(),
                productApi.list({ size: 500 }),
                productApi.channels(),
                productApi.opportunities(),
                spaceApi.list().catch(() => [] as any[]),
            ]);
            setCurrentUser(me);
            setUsers(userListRes.data);
            setDepartments(deptList);
            setRoles(roleList);
            setProducts(prodListRes.data);
            setChannels(channelList);
            setOpportunities(oppList);
            setSpaces(spaceList as Space[]);

            setNeedsLogin(false);
            console.log('[API] Bootstrap (metadata only) loaded');
        } catch (e: any) {
            console.error('[API] Initialization failed:', e);
            setError(e.message || '数据加载失败');
        } finally {
            setLoading(false);
        }
    }, [clearApiData]);

    useEffect(() => {
        if (!USE_API) return;
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
    }, [clearApiData]);

    const login = useCallback(async (email: string, password: string) => {
        const { token, user } = await authApi.login(email, password);
        setToken(token);
        setCurrentUser(user);
        setNeedsLogin(false);
        await loadBootstrap();
    }, [loadBootstrap]);

    const logout = useCallback(() => {
        setToken(null);
        clearApiData();
        setNeedsLogin(true);
        setError(null);
    }, [clearApiData]);

    // 多角色：取用户所有平台角色定义，行权限取并集
    const currentUserRoles = useMemo(() =>
        roles.filter(r => currentUser.roles?.includes(r.id)),
        [roles, currentUser.roles]
    );
    // 兼容：很多地方还只接受单个 RoleDefinition，取第一个（优先级最高的）
    const currentUserRole = currentUserRoles[0] ?? undefined;

    const filteredOrders = useMemo(() =>
        filterOrdersByRowPermissions(orders, currentUserRole, currentUser, users, departments),
        [orders, currentUserRole, currentUser, users, departments]
    );

    const filteredCustomers = useMemo(() =>
        filterCustomersByRowPermissions(customers, currentUserRole, currentUser, users, departments),
        [customers, currentUserRole, currentUser, users, departments]
    );

    const filteredProducts = useMemo(() =>
        filterProductsByRowPermissions(products, currentUserRole, currentUser, users, departments),
        [products, currentUserRole, currentUser, users, departments]
    );

    const value: AppContextType = {
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
        currentUser, setCurrentUser,

        channels, setChannels,
        standaloneEnterprises,

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

        needsLogin,
        login,
        logout,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
