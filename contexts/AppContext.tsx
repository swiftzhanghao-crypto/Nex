
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
    Product, SalesMerchandise, AtomicCapability, ProductRightDefinition,
    RightPackage, LicenseTypeDefinition, Customer, Opportunity, Order,
    User, Department, RoleDefinition, Channel, Enterprise,
    Contract, Remittance, Invoice, Performance, Authorization, DeliveryInfo,
    Project, OrderDraft,
} from '../types';

import {
    initialProducts, initialMerchandises, initialAtomicCapabilities,
    initialProductRights, initialRightPackages, initialLicenseDefs,
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

// --- Mock data fallback (computed once, v2) ---
const mockCustomers = generateCustomers(initialUsers);
const mockOpportunities = generateOpportunities(mockCustomers);
const mockContracts = generateContracts(mockCustomers);
const mockOrders = generateOrders({
    customers: mockCustomers, products: initialProducts, users: initialUsers,
    merchandises: initialMerchandises, opportunities: mockOpportunities, channels: initialChannels,
    contracts: mockContracts,
});

// ---------- Context shape ----------
interface AppContextType {
    apiMode: boolean;

    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    merchandises: SalesMerchandise[];
    setMerchandises: React.Dispatch<React.SetStateAction<SalesMerchandise[]>>;
    atomicCapabilities: AtomicCapability[];
    setAtomicCapabilities: React.Dispatch<React.SetStateAction<AtomicCapability[]>>;
    productRights: ProductRightDefinition[];
    setProductRights: React.Dispatch<React.SetStateAction<ProductRightDefinition[]>>;
    rightPackages: RightPackage[];
    setRightPackages: React.Dispatch<React.SetStateAction<RightPackage[]>>;
    licenseDefs: LicenseTypeDefinition[];
    setLicenseDefs: React.Dispatch<React.SetStateAction<LicenseTypeDefinition[]>>;

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

    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;

    refreshOrders: () => Promise<void>;
    refreshCustomers: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within <AppProvider>');
    return ctx;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- Product domain ---
    const [products, setProducts] = useState(initialProducts);
    const [merchandises, setMerchandises] = useState(initialMerchandises);
    const [atomicCapabilities, setAtomicCapabilities] = useState(initialAtomicCapabilities);
    const [productRights, setProductRights] = useState(initialProductRights);
    const [rightPackages, setRightPackages] = useState(initialRightPackages);
    const [licenseDefs, setLicenseDefs] = useState(initialLicenseDefs);

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
    const [performances] = useState<Performance[]>(() => generatePerformances());
    const [authorizations] = useState<Authorization[]>(() => generateAuthorizations());
    const [deliveryInfos] = useState<DeliveryInfo[]>(() => generateDeliveryInfos());

    // --- Project domain ---
    const [projects, setProjects] = useState<Project[]>([]);

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
            console.log('[API] No auth token, using mock data as fallback');
            return;
        }

        (async () => {
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

                const [contractRes, remittanceRes, invoiceRes] = await Promise.all([
                    financeApi.contracts({ size: '500' }),
                    financeApi.remittances({ size: '500' }),
                    financeApi.invoices({ size: '500' }),
                ]);
                setContracts(contractRes.data);
                setRemittances(remittanceRes.data);
                setInvoices(invoiceRes.data);

                console.log('[API] All data loaded from backend');
            } catch (e) {
                console.error('[API] Initialization failed:', e);
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value: AppContextType = {
        apiMode: USE_API,

        products, setProducts,
        merchandises, setMerchandises,
        atomicCapabilities, setAtomicCapabilities,
        productRights, setProductRights,
        rightPackages, setRightPackages,
        licenseDefs, setLicenseDefs,

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

        projects, setProjects,

        refreshOrders,
        refreshCustomers,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
