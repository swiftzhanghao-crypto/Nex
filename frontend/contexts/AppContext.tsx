
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
    Product, SalesMerchandise, AtomicCapability,
    AuthTypeData, Customer, Opportunity, Order,
    User, Department, RoleDefinition, Channel, Enterprise,
    Contract, Remittance, Invoice, Performance, Authorization, DeliveryInfo,
    OrderDraft,
} from '../types';

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
} from '../data/generators';

import {
    authApi, userApi, orderApi, customerApi, productApi, financeApi,
    setToken, getToken,
} from '../services/api';

// --- Mode detection: set VITE_API_MODE=true in .env to use backend ---
const USE_API = import.meta.env.VITE_API_MODE === 'true';

// --- Mock data fallback (bump version when schema changes to force refresh) ---
const MOCK_DATA_VERSION = 9;

function safeGenerateMockData() {
    try {
        const customers = generateCustomers(initialUsers);
        const opportunities = generateOpportunities(customers);
        const contracts = generateContracts(customers);
        const orders = generateOrders({
            customers, products: initialProducts, users: initialUsers,
            merchandises: initialMerchandises, opportunities, channels: initialChannels,
            contracts,
        });
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

    refreshOrders: () => Promise<void>;
    refreshCustomers: () => Promise<void>;

    loading: boolean;
    error: string | null;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within <AppProvider>');
    return ctx;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(USE_API);
    const [error, setError] = useState<string | null>(null);

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

    // --- API data fetching ---
    const refreshOrders = useCallback(async () => {
        if (!USE_API) return;
        try {
            const res = await orderApi.list({ size: '500' });
            setOrders(res.data);
        } catch (e) { console.error('[API] Failed to fetch orders:', e); }
    }, []);

    const refreshCustomers = useCallback(async () => {
        if (!USE_API) return;
        try {
            const res = await customerApi.list({ size: '500' });
            setCustomers(res.data);
        } catch (e) { console.error('[API] Failed to fetch customers:', e); }
    }, []);

    useEffect(() => {
        if (!USE_API) return;

        const token = getToken();
        if (!token) {
            console.log('[API] No auth token; CRM/订单/财务数据保持为空，请登录后刷新页面加载后端数据');
            setCustomers([]);
            setOpportunities([]);
            setContracts([]);
            setOrders([]);
            setRemittances([]);
            setInvoices([]);
            setPerformances([]);
            setAuthorizations([]);
            setDeliveryInfos([]);
            setLoading(false);
            setError('未登录，请先登录');
            return;
        }

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [me, userList, deptList, roleList, prodList, channelList, oppList] = await Promise.all([
                    authApi.me(),
                    userApi.list(),
                    userApi.departments(),
                    userApi.roles(),
                    productApi.list(),
                    productApi.channels(),
                    productApi.opportunities(),
                ]);
                setCurrentUser(me);
                setUsers(userList);
                setDepartments(deptList);
                setRoles(roleList);
                setProducts(prodList);
                setChannels(channelList);
                setOpportunities(oppList);

                await refreshOrders();
                await refreshCustomers();

                const [
                    contractRes, remittanceRes, invoiceRes,
                    performanceRes, authorizationRes, deliveryRes,
                ] = await Promise.all([
                    financeApi.contracts({ size: '500' }),
                    financeApi.remittances({ size: '500' }),
                    financeApi.invoices({ size: '500' }),
                    financeApi.performances({ size: '500' }),
                    financeApi.authorizations({ size: '500' }),
                    financeApi.deliveryInfos({ size: '500' }),
                ]);
                setContracts(contractRes.data);
                setRemittances(remittanceRes.data);
                setInvoices(invoiceRes.data);
                setPerformances(performanceRes.data);
                setAuthorizations(authorizationRes.data);
                setDeliveryInfos(deliveryRes.data);

                console.log('[API] All data loaded from backend');
            } catch (e: any) {
                console.error('[API] Initialization failed:', e);
                setError(e.message || '数据加载失败');
            } finally {
                setLoading(false);
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

        refreshOrders,
        refreshCustomers,

        loading,
        error,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
