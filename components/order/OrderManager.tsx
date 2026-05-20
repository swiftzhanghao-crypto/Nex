import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Order, OrderStatus, OrderDraft, User, OrderSource, Subscription, SubscriptionLineProductSnapshot } from '../../types';
import { subscriptionMostUrgentProductSnapshot } from '../../utils/subscriptionLineProduct';
import { Search, Plus, Trash2, Save, ChevronRight, ChevronDown, X, RotateCcw, SlidersHorizontal, Filter, Columns3, CheckSquare, Truck, FileCheck, CheckCircle, FileText, Disc, CreditCard, RefreshCcw, AlertCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import OrderCreateWizard from './OrderCreateWizard';
import StatusFilterCard from './StatusFilterCard';
import DeleteConfirmModal from './DeleteConfirmModal';
import UserDetailPanel from '../common/UserDetailPanel';
import EmployeeCardModal from '../common/EmployeeCardModal';
import { useAppContext, useEnsureData } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { buildOrderListFilters, orderListNeedsClientDataset, type OrderListFilters } from '../../hooks/buildOrderListParams';
import { orderApi } from '../../services/api';
import {
  loadViews, saveViews, loadActiveViewId, orderToDraft,
  DEFAULT_COLS, DEFAULT_VISIBLE, ACTIVE_VIEW_STORAGE_KEY,
  FilterCondition, OrderView, allColumns, colWidthMap,
  availableFilterFields, statusMap, buyerTypeMap,
  initValueForField, searchFieldOptions, getCheckboxOptions,
} from './manager/orderManagerUtils';
import { OrderFilterDrawerTab, OrderFilterDropdownPortal, ActiveDropdown } from './manager/OrderFilters';
import { OrderViewDropdown, OrderColumnDrawerTab } from './manager/OrderViewConfig';
import { OrderTable } from './manager/OrderTable';

const OrderManager: React.FC = () => {
  const { orders, setOrders, products, customers, filteredOrders: ctxFilteredOrders, users, setUsers, departments, opportunities, channels, roles, standaloneEnterprises, orderDrafts, setOrderDrafts, apiMode, refreshOrders } = useAppContext();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Permission Check
  const currentUserRole = roles.find(r => currentUser.roles?.includes(r.id));
  const permissions = currentUserRole?.permissions || [];
  const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);

  // Pipeline Status Definitions
  const pipelineStatuses = [
      { id: OrderStatus.DRAFT, label: '草稿', desc: '已暂存、待继续提交', icon: Save, permission: 'order_create' },
      { id: OrderStatus.PENDING_APPROVAL, label: '订单审批', desc: '等待经理或财务审批', icon: FileCheck, permission: 'order_view_pending_approval' },
      { id: OrderStatus.PENDING_CONFIRM, label: '订单确认', desc: '等待商务确认订单', icon: CheckSquare, permission: 'order_view_pending_confirm' },
      { id: 'STOCK_AUTH', label: '授权确认', desc: '生成并确认产品授权码', icon: CheckCircle, permission: 'order_view_auth_confirm' },
      { id: 'STOCK_PKG', label: '安装包核验', desc: '核对安装包版本及完整性', icon: FileText, permission: 'order_view_stock_pkg' },
      { id: 'STOCK_SHIP', label: '快递单填写', desc: '填写快递单及物流信息', icon: Truck, permission: 'order_view_stock_ship' },
      { id: 'STOCK_CD', label: '光盘刻录', desc: '刻录物理光盘介质', icon: Disc, permission: 'order_view_stock_cd' },
      { id: OrderStatus.PENDING_PAYMENT, label: '订单支付', desc: '等待客户完成支付', icon: CreditCard, permission: 'order_view_payment' }, 
      { id: OrderStatus.SHIPPED, label: '已发货', desc: '产品已发出，运输中', icon: Truck, permission: 'order_view_shipped' },
      { id: OrderStatus.DELIVERED, label: '已完成', desc: '客户已签收，流程结束', icon: CheckCircle, permission: 'order_view_completed' },
  ];

  // Exception Statuses
  const exceptionStatuses = [
      { id: OrderStatus.REFUND_PENDING, label: '退款中', desc: '处理客户退款申请', icon: RefreshCcw, permission: 'order_view_refund_pending' },
      { id: OrderStatus.REFUNDED, label: '已退款', desc: '退款流程已完成', icon: AlertCircle, permission: 'order_view_refunded' },
      { id: OrderStatus.CANCELLED, label: '已取消', desc: '订单已作废', icon: X, permission: 'order_view_cancelled' },
  ];

  const _initViews = useMemo(() => loadViews(DEFAULT_COLS), []);
  const _initActiveId = useMemo(() => loadActiveViewId(), []);
  const _initActiveView = useMemo(() => _initViews.find(v => v.id === _initActiveId) || _initViews[0], [_initViews, _initActiveId]);

  const [filterStatus, setFilterStatus] = useState<string>(() => {
    if (_initActiveView.filters?.filterStatus) return _initActiveView.filters.filterStatus;
    if (hasPermission('order_view_all')) return 'All';
    const firstAllowed = pipelineStatuses.find(step => hasPermission(step.permission));
    if (firstAllowed) return firstAllowed.id;
    const firstException = exceptionStatuses.find(step => hasPermission(step.permission));
    return firstException ? firstException.id : 'All';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'id' | 'customerName' | 'buyerName' | 'productName' | 'licensee'>('id');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
  
  // Advanced Filter State
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(() => (_initActiveView.filters?.advancedFilters?.length ?? 0) > 0);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'filter' | 'columns'>('filter');
  const closeFilterDrawer = () => {
      setIsFilterClosing(true);
      setTimeout(() => { setIsAdvancedFilterOpen(false); setIsFilterClosing(false); setDrawerTab('filter'); }, 280);
  };
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>(() => _initActiveView.filters?.advancedFilters || []);
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>(() => _initActiveView.filters?.advancedFilters || []);

  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (!activeDropdown) return;
      const handler = (e: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
              setActiveDropdown(null);
          }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
  }, [activeDropdown]);

  const toggleDropdown = (e: React.MouseEvent, filterId: string, type: 'field' | 'mode' | 'value') => {
      if (activeDropdown?.filterId === filterId && activeDropdown.type === type) {
          setActiveDropdown(null);
          return;
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const minW = type === 'field' ? 180 : type === 'value' ? 220 : 120;
      const width = Math.max(rect.width, minW);
      const estimatedH = 300;
      let top = rect.bottom + 4;
      if (rect.bottom + estimatedH > window.innerHeight - 8) {
          top = Math.max(8, rect.top - estimatedH);
      }
      let left = rect.left;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setActiveDropdown({ filterId, type, top, left, width });
  };

  const getFilterCheckboxOptions = useCallback(
    (fieldId: string) => getCheckboxOptions(fieldId, orders),
    [orders],
  );

  const addFilterCondition = () => {
      const unusedField = availableFilterFields.find(f => !advancedFilters.some(af => af.fieldId === f.id));
      if (unusedField) {
          setActiveDropdown(null);
          setAdvancedFilters([...advancedFilters, {
              id: Math.random().toString(36).substr(2, 9),
              fieldId: unusedField.id,
              mode: unusedField.defaultMode,
              value: initValueForField(unusedField.id, unusedField.defaultMode)
          }]);
      }
  };

  const toggleMultiValue = (filterId: string, val: string) => {
      setAdvancedFilters(prev => prev.map(f => {
          if (f.id !== filterId) return f;
          const arr = Array.isArray(f.value) ? f.value as string[] : [];
          return { ...f, value: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
      }));
  };

  const removeFilterCondition = (id: string) => {
      setActiveDropdown(prev => (prev?.filterId === id ? null : prev));
      setAdvancedFilters(advancedFilters.filter(f => f.id !== id));
  };

  const updateFilterCondition = (id: string, updates: Partial<FilterCondition>) => {
      if (updates.fieldId) {
          setActiveDropdown(null);
      }
      setAdvancedFilters(advancedFilters.map(f => f.id === id ? { ...f, ...updates } : f));
  };
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState<number | ''>('');
  const [filterAmountMax, setFilterAmountMax] = useState<number | ''>('');
  const [filterSource, setFilterSource] = useState<OrderSource | 'All'>('All');

  // Column Configuration State
  const [views, setViews] = useState<OrderView[]>(_initViews);
  const [activeViewId, setActiveViewId] = useState<string>(_initActiveId);
  const activeView = useMemo(() => views.find(v => v.id === activeViewId) || views[0], [views, activeViewId]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(activeView.columns);

  useEffect(() => { saveViews(views); }, [views]);
  useEffect(() => { localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, activeViewId); }, [activeViewId]);

  const switchView = useCallback((viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setActiveViewId(viewId);
      setVisibleColumns(view.columns);
      const f = view.filters;
      setFilterStatus(f?.filterStatus || 'All');
      const restored = f?.advancedFilters || [];
      setAdvancedFilters(restored);
      setAppliedFilters(restored);
      setIsAdvancedFilterOpen(restored.length > 0);
    }
  }, [views]);

  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingViewName, setEditingViewName] = useState('');
  const [viewMenuOpenId, setViewMenuOpenId] = useState<string | null>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  const addViewFromColumns = useCallback((columns: string[], name: string) => {
    const id = 'view_' + Date.now();
    const newView: OrderView = {
      id, name, columns: [...columns],
      filters: { filterStatus, advancedFilters: [...appliedFilters] },
    };
    setViews(prev => [...prev, newView]);
    setActiveViewId(id);
    setVisibleColumns(columns);
  }, [filterStatus, appliedFilters]);

  const deleteView = useCallback((viewId: string) => {
    setViews(prev => {
      const next = prev.filter(v => v.id !== viewId);
      if (next.length === 0) {
        const def: OrderView = { id: 'default', name: '全部订单', columns: DEFAULT_COLS, isDefault: true };
        return [def];
      }
      return next;
    });
    if (activeViewId === viewId) {
      const remaining = views.filter(v => v.id !== viewId);
      const fallback = remaining[0] || { id: 'default', columns: DEFAULT_COLS };
      setActiveViewId(fallback.id);
      setVisibleColumns(fallback.columns);
    }
    setViewMenuOpenId(null);
  }, [activeViewId, views]);

  const renameView = useCallback((viewId: string, newName: string) => {
    if (!newName.trim()) return;
    setViews(prev => prev.map(v => v.id === viewId ? { ...v, name: newName.trim() } : v));
    setEditingViewId(null);
  }, []);



  // Batch Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const orderNeedsClientDataset = useMemo(
    () =>
      !apiMode ||
      orderListNeedsClientDataset({
        filterStatus,
        appliedAdvancedCount: appliedFilters.length,
        hasDateOrAmountFilter:
          !!filterDateStart ||
          !!filterDateEnd ||
          filterAmountMin !== '' ||
          filterAmountMax !== '',
      }),
    [
      apiMode,
      filterStatus,
      appliedFilters.length,
      filterDateStart,
      filterDateEnd,
      filterAmountMin,
      filterAmountMax,
    ],
  );

  useEnsureData(orderNeedsClientDataset ? ['orders', 'customers', 'opportunities'] : ['customers', 'opportunities']);

  const debouncedSearch = useDebouncedValue(searchTerm, 350);
  const apiOrderFilters = useMemo(
    () => buildOrderListFilters(filterStatus, filterSource, debouncedSearch, searchField),
    [filterStatus, filterSource, debouncedSearch, searchField],
  );

  const orderQuery = usePagedQuery<Order, OrderListFilters>({
    fetcher: (p) =>
      orderApi.list({
        page: p.page,
        size: p.size,
        status: p.status || undefined,
        source: p.source || undefined,
        keyword: p.keyword || undefined,
      }),
    initialFilters: apiOrderFilters,
    initialSize: itemsPerPage,
    autoFetch: apiMode && !orderNeedsClientDataset,
  });

  useEffect(() => {
    if (!apiMode || orderNeedsClientDataset) return;
    orderQuery.setFilters(apiOrderFilters, { resetPage: true });
  }, [apiMode, orderNeedsClientDataset, apiOrderFilters]);

  useEffect(() => {
    if (!apiMode || orderNeedsClientDataset) return;
    orderQuery.setSize(itemsPerPage);
  }, [apiMode, orderNeedsClientDataset, itemsPerPage]);

  const refreshOrderList = useCallback(async () => {
    if (apiMode && !orderNeedsClientDataset) {
      await orderQuery.refresh();
    } else {
      await refreshOrders();
    }
  }, [apiMode, orderNeedsClientDataset, orderQuery, refreshOrders]);

  const useServerOrderPaging = apiMode && !orderNeedsClientDataset;

  // User Details Drawer State
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isEmployeeCardOpen, setIsEmployeeCardOpen] = useState(false);

  const closeDrawer = () => {
      setIsDrawerClosing(true);
      setTimeout(() => {
          setIsDrawerOpen(false);
          setDetailsUser(null);
          setIsDrawerClosing(false);
      }, 280);
  };

  const getDepartmentPath = (deptId?: string) => {
      if (!deptId) return '-';
      const path: string[] = [];
      let currentId = deptId;
      while (currentId) {
          const dept = departments.find(d => d.id === currentId);
          if (dept) {
              path.unshift(dept.name);
              currentId = dept.parentId || '';
          } else {
              break;
          }
      }
      return path.join(' / ');
  };

  const [productPopoverId, setProductPopoverId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const productPopoverRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!productPopoverId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (productPopoverRef.current && !productPopoverRef.current.contains(e.target as Node)) {
        setProductPopoverId(null);
        setPopoverPos(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [productPopoverId]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renewalOrder, setRenewalOrder] = useState<Order | undefined>(undefined);
  const [subscriptionCheckout, setSubscriptionCheckout] = useState<{
    subscription: Subscription;
    lineProduct: SubscriptionLineProductSnapshot;
    mode: 'renew' | 'addon';
  } | null>(null);
  const [resumeDraft, setResumeDraft] = useState<OrderDraft | undefined>(undefined);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const handleCopyOrderId = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id).then(() => {
          setCopiedOrderId(id);
          setTimeout(() => setCopiedOrderId(null), 1500);
      });
  };

  const [tableCopied, setTableCopied] = useState(false);
  const handleCopyTable = () => {
      const cols = visibleColumns.filter(id => id !== 'action').map(id => allColumns.find(c => c.id === id)!).filter(Boolean);
      const header = cols.map(c => c.label).join('\t');
      const statusMap: Record<string, string> = { DRAFT: '草稿', PENDING_CONFIRM: '待确认', CONFIRMED: '已确认', PENDING_SHIPMENT: '待发货', SHIPPED: '已发货', DELIVERED: '已交付', COMPLETED: '已完成', CANCELLED: '已取消', REFUNDED: '已退款', EXCEPTION: '异常' };
      const buyerTypeMap: Record<string, string> = { Customer: '直签订单', Channel: '渠道订单', SelfDeal: '自成交订单', RedeemCode: '兑换码订单' };
      const rows = currentOrders.map(o => cols.map(col => {
          switch (col.id) {
              case 'id': return o.id;
              case 'customer': return o.customerName;
              case 'buyer': return o.buyerName || o.customerName;
              case 'products': return (o.items || []).map(it => `${it.productName || ''}${it.skuName ? '/' + it.skuName : ''}${it.licenseType ? '/' + it.licenseType : ''} ×${it.quantity}${it.subUnits && it.subUnits.length > 0 ? ` [下级×${it.subUnits.length}]` : ''}`).join('; ');
              case 'sales': return o.salesRepName || '-';
              case 'businessManager': return o.businessManagerName || '-';
              case 'department': { const u = users.find(uu => uu.id === o.salesRepId); return getDepartmentPath(u?.departmentId); }
              case 'source': return o.source || '-';
              case 'buyerType': return buyerTypeMap[o.buyerType || ''] || '直签订单';
              case 'date': return new Date(o.date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
              case 'status': return statusMap[o.status] || o.status;
              case 'paymentStatus': return o.isPaid ? '已付款' : '未付款';
              case 'stockStatus': return o.status === OrderStatus.SHIPPED || o.status === OrderStatus.DELIVERED ? '已发货' : '待备货';
              case 'total': return (o.total ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              case 'payment': return o.paymentMethod || '-';
              case 'delivery': return o.deliveryMethod || '-';
              case 'address': return o.shippingAddress || '-';
              case 'invoice': return o.invoiceInfo?.title || '-';
              case 'licensee': return [...new Set((o.items || []).map(i => i.licensee).filter(Boolean))].join('、') || '-';
              case 'opportunity': return o.opportunityId || '-';
              default: return '-';
          }
      }).join('\t'));
      const tsv = [header, ...rows].join('\n');
      navigator.clipboard.writeText(tsv).then(() => {
          setTableCopied(true);
          setTimeout(() => setTableCopied(false), 2000);
      });
  };

  // --- Handle Renewal / Edit-Draft Initialization from navigation state ---
  useEffect(() => {
      const state = location.state as {
          initRenewal?: boolean;
          originalOrder?: Order;
          editDraftId?: string;
          initFromSubscription?: boolean;
          subscription?: Subscription;
          lineProduct?: SubscriptionLineProductSnapshot;
          mode?: 'renew' | 'addon';
      } | null;
      if (state?.initFromSubscription && state.subscription && state.mode) {
          const lp = state.lineProduct ?? subscriptionMostUrgentProductSnapshot(state.subscription);
          if (lp) {
              setSubscriptionCheckout({ subscription: state.subscription, lineProduct: lp, mode: state.mode });
              setRenewalOrder(undefined);
              setResumeDraft(undefined);
              setIsCreateOpen(true);
          }
          window.history.replaceState({}, document.title);
      } else if (state?.initRenewal && state?.originalOrder) {
          setRenewalOrder(state.originalOrder);
          setSubscriptionCheckout(null);
          setIsCreateOpen(true);
          window.history.replaceState({}, document.title);
      } else if (state?.editDraftId) {
          const draft = orderDrafts.find(d => d.id === state.editDraftId);
          if (draft) {
              setResumeDraft(draft);
              setIsCreateOpen(true);
          } else {
              const order = orders.find(o => o.id === state.editDraftId);
              if (order && order.status === OrderStatus.DRAFT) {
                  setResumeDraft(orderToDraft(order));
                  setIsCreateOpen(true);
              }
          }
          window.history.replaceState({}, document.title);
      }
  }, [location.state, orderDrafts, orders]);

  const getStatusBadge = useCallback((status: OrderStatus) => {
    const text = statusMap[status] || status;
    let className = '';
    switch (status) {
      case OrderStatus.DRAFT:             className = 'unified-tag-gray !rounded-full !border-dashed'; break;
      case OrderStatus.PENDING_PAYMENT:   className = 'unified-tag-blue !rounded-full';   break;
      case OrderStatus.PENDING_APPROVAL:  className = 'unified-tag-blue !rounded-full';   break;
      case OrderStatus.PENDING_CONFIRM:   className = 'unified-tag-blue !rounded-full';   break;
      case OrderStatus.PROCESSING_PROD:   className = 'unified-tag-blue !rounded-full';   break;
      case OrderStatus.SHIPPED:           className = 'unified-tag-indigo !rounded-full'; break;
      case OrderStatus.DELIVERED:         className = 'unified-tag-green !rounded-full';  break;
      case OrderStatus.CANCELLED:         className = 'unified-tag-gray !rounded-full';   break;
      case OrderStatus.REFUND_PENDING:    className = 'unified-tag-blue !rounded-full';   break;
      case OrderStatus.REFUNDED:          className = 'unified-tag-red !rounded-full';    break;
      default: className = 'unified-tag-gray !rounded-full';
    }
    return <span className={className}>{text}</span>;
  }, []);

  const getPaymentStatusBadge = useCallback((isPaid: boolean) => {
    return isPaid
        ? <span className="unified-tag-green !rounded-full">已支付</span>
        : <span className="unified-tag-blue !rounded-full">待支付</span>;
  }, []);

  const getStockStatusBadge = useCallback((order: Order) => {
    if (order.status === OrderStatus.DELIVERED)         return <span className="unified-tag-green !rounded-full">已完成</span>;
    if (order.status === OrderStatus.SHIPPED)           return <span className="unified-tag-indigo !rounded-full">已发货</span>;
    if (order.isShippingConfirmed)                      return <span className="unified-tag-blue !rounded-full">待发货</span>;
    if (order.isAuthConfirmed || order.isPackageConfirmed || order.status === OrderStatus.PROCESSING_PROD)
                                                        return <span className="unified-tag-orange !rounded-full">备货中</span>;
    return <span className="unified-tag-blue !rounded-full">待处理</span>;
  }, []);

  const getSourceBadge = useCallback((source: OrderSource) => {
      switch(source) {
          case 'Sales':        return <span className="unified-tag-blue">后台下单</span>;
          case 'ChannelPortal':return <span className="unified-tag-indigo">渠道下单</span>;
          case 'OnlineStore':  return <span className="unified-tag-orange">官网下单</span>;
          case 'APISync':      return <span className="unified-tag-green">三方平台</span>;
          case 'Renewal':      return <span className="unified-tag-green">客户续费</span>;
          default:             return <span className="unified-tag-gray">{source}</span>;
      }
  }, []);

  const clientFilteredOrders = useMemo(() => ctxFilteredOrders.filter(order => {
    let matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    // Handle sub-status filtering for PROCESSING_PROD
    if (filterStatus === 'STOCK_AUTH') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && !order.isAuthConfirmed;
    if (filterStatus === 'STOCK_PKG') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && !!order.isAuthConfirmed && !order.isPackageConfirmed;
    if (filterStatus === 'STOCK_SHIP') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && !!order.isPackageConfirmed && !order.isShippingConfirmed;
    if (filterStatus === 'STOCK_CD') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && !!order.isShippingConfirmed && !order.isCDBurned;

    const searchLower = searchTerm.toLowerCase();
    const safeItems = order.items || [];
    const matchesSearch = !searchTerm || (
        searchField === 'id'           ? (order.id || '').toLowerCase().includes(searchLower) :
        searchField === 'customerName' ? (order.customerName || '').toLowerCase().includes(searchLower) :
        searchField === 'productName'  ? safeItems.some(item => (item.productName || '').toLowerCase().includes(searchLower)) :
        searchField === 'licensee'     ? safeItems.some(item => (item.licensee || '').toLowerCase().includes(searchLower)) :
        (order.buyerName || order.customerName || '').toLowerCase().includes(searchLower)
    );
    const matchesSource = filterSource === 'All' || order.source === filterSource;
    const matchesDate = (!filterDateStart || new Date(order.date) >= new Date(filterDateStart)) &&
                        (!filterDateEnd || new Date(order.date) <= new Date(new Date(filterDateEnd).setHours(23, 59, 59, 999)));
    const matchesAmount = (filterAmountMin === '' || order.total >= filterAmountMin) &&
                          (filterAmountMax === '' || order.total <= filterAmountMax);

    // Dynamic Advanced Filters Logic
    const matchesAdvanced = appliedFilters.every(filter => {
        if (filter.value === '全部' || filter.value === '不限') return true;
        if (Array.isArray(filter.value) && (filter.value as string[]).length === 0) return true;
        if (typeof filter.value === 'string' && filter.value === '') return true;
        
        // This is a simplified implementation as we don't have all fields in the Order type yet
        // In a real app, we would map filter.fieldId to order properties
        switch (filter.fieldId) {
            case 'orderStatus': {
                const vals = Array.isArray(filter.value) ? filter.value as string[] : [filter.value as string];
                return vals.length === 0 || vals.includes('全部') || vals.includes('不限') || vals.includes(order.status);
            }
            case 'deliveryMethod':
                return order.deliveryMethod === filter.value;
            case 'orderSource': {
                const vals = Array.isArray(filter.value) ? filter.value : [filter.value];
                return vals.includes('全部') || vals.includes('不限') || vals.includes(order.source);
            }
            case 'orderType': {
                const vals = Array.isArray(filter.value) ? filter.value : [filter.value];
                return vals.includes('全部') || vals.includes('不限') || vals.includes(order.buyerType ?? '');
            }
            case 'paymentStatus': {
                const paymentVal = order.isPaid ? 'paid' : 'unpaid';
                const vals = Array.isArray(filter.value) ? filter.value as string[] : [filter.value as string];
                return vals.length === 0 || vals.includes(paymentVal);
            }
            case 'stockStatus': {
                const stockVal =
                    order.status === OrderStatus.DELIVERED ? 'completed' :
                    order.status === OrderStatus.SHIPPED ? 'shipped' :
                    order.isShippingConfirmed ? 'pendingShip' :
                    (order.isAuthConfirmed || order.isPackageConfirmed || order.status === OrderStatus.PROCESSING_PROD) ? 'processing' :
                    'pending';
                const vals = Array.isArray(filter.value) ? filter.value as string[] : [filter.value as string];
                return vals.length === 0 || vals.includes(stockVal);
            }
            case 'businessManager':
                return order.businessManagerId === filter.value;
            case 'orderDate': {
                const d = new Date(order.date);
                if (filter.mode === '时间段') {
                    const range = filter.value as { start: string; end: string };
                    if (!range.start && !range.end) return true;
                    const start = range.start ? new Date(range.start) : null;
                    const end = range.end ? new Date(new Date(range.end).setHours(23, 59, 59, 999)) : null;
                    return (!start || d >= start) && (!end || d <= end);
                }
                if (filter.mode === '时间点') {
                    if (!filter.value) return true;
                    const pt = new Date(filter.value as string);
                    return d.getFullYear() === pt.getFullYear() && d.getMonth() === pt.getMonth() && d.getDate() === pt.getDate();
                }
                return true;
            }
            case 'shippedDate': {
                if (filter.mode === '时间段') {
                    const range = filter.value as { start: string; end: string };
                    if (!range.start && !range.end) return true;
                    if (!order.shippedDate) return false;
                    const d = new Date(order.shippedDate);
                    const start = range.start ? new Date(range.start) : null;
                    const end = range.end ? new Date(new Date(range.end).setHours(23, 59, 59, 999)) : null;
                    return (!start || d >= start) && (!end || d <= end);
                }
                if (filter.mode === '时间点') {
                    if (!filter.value) return true;
                    if (!order.shippedDate) return false;
                    const d = new Date(order.shippedDate);
                    const pt = new Date(filter.value as string);
                    return d.getFullYear() === pt.getFullYear() && d.getMonth() === pt.getMonth() && d.getDate() === pt.getDate();
                }
                return true;
            }
            case 'orderAmount': {
                const av = filter.value as { min: string; max: string };
                const min = av.min !== '' ? Number(av.min) : null;
                const max = av.max !== '' ? Number(av.max) : null;
                if (min === null && max === null) return true;
                return (min === null || order.total >= min) && (max === null || order.total <= max);
            }
            case 'subUnitAuth': {
                const vals = Array.isArray(filter.value) ? filter.value as string[] : [filter.value as string];
                if (vals.length === 0) return true;
                const hasSubUnit = (order.items || []).some(it => it.subUnitAuthMode && it.subUnitAuthMode !== 'none' && it.subUnits && it.subUnits.length > 0);
                const itemMode = (order.items || []).find(it => it.subUnitAuthMode && it.subUnitAuthMode !== 'none')?.subUnitAuthMode;
                return vals.some(v => {
                    if (v === 'has_subunit') return hasSubUnit;
                    if (v === 'no_subunit') return !hasSubUnit;
                    return itemMode === v;
                });
            }
            case 'delayTime': {
                const dv = filter.value as { start: string; end: string };
                if (filter.mode === '时间段' && dv.start && dv.end) {
                    const orderDate = new Date(order.date);
                    return orderDate >= new Date(dv.start) && orderDate <= new Date(dv.end);
                }
                return true;
            }
            default:
                return true;
        }
    });

    return matchesStatus && matchesSearch && matchesSource && matchesDate && matchesAmount && matchesAdvanced;
  }), [ctxFilteredOrders, filterStatus, searchTerm, searchField, filterSource, filterDateStart, filterDateEnd, filterAmountMin, filterAmountMax, appliedFilters]);

  const serverPageOrders = useMemo(() => {
    if (!useServerOrderPaging) return [];
    const list = orderQuery.data;
    if (!searchTerm.trim()) return list;
    if (searchField === 'id' || searchField === 'customerName') return list;
    const searchLower = searchTerm.toLowerCase();
    const safeItems = (items: Order['items']) => items || [];
    return list.filter((order) => {
      if (searchField === 'productName') {
        return safeItems(order.items).some((item) => (item.productName || '').toLowerCase().includes(searchLower));
      }
      if (searchField === 'licensee') {
        return safeItems(order.items).some((item) => (item.licensee || '').toLowerCase().includes(searchLower));
      }
      return (order.buyerName || order.customerName || '').toLowerCase().includes(searchLower);
    });
  }, [useServerOrderPaging, orderQuery.data, searchTerm, searchField]);

  const filteredOrders = useServerOrderPaging ? serverPageOrders : clientFilteredOrders;
  const listTotal = useServerOrderPaging ? orderQuery.total : clientFilteredOrders.length;
  const activePage = useServerOrderPaging ? orderQuery.page : currentPage;
  const activePageSize = useServerOrderPaging ? orderQuery.size : itemsPerPage;

  const totalPages = Math.ceil(listTotal / activePageSize) || 1;
  const safePage = Math.min(activePage, totalPages);
  const currentOrders = useMemo(() => {
    if (useServerOrderPaging) return serverPageOrders;
    const indexOfLastItem = safePage * activePageSize;
    return clientFilteredOrders.slice(indexOfLastItem - activePageSize, indexOfLastItem);
  }, [useServerOrderPaging, serverPageOrders, clientFilteredOrders, safePage, activePageSize]);

  const toggleSelectOrder = useCallback((id: string) => {
      setSelectedOrderIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  }, []);

  const toggleSelectAll = () => {
      const currentPageIds = currentOrders.map(o => o.id);
      const allSelected = currentPageIds.every(id => selectedOrderIds.has(id));
      const newSet = new Set(selectedOrderIds);
      if (allSelected) currentPageIds.forEach(id => newSet.delete(id));
      else currentPageIds.forEach(id => newSet.add(id));
      setSelectedOrderIds(newSet);
  };

  const getEligibleCounts = () => {
      const selectedList = orders.filter(o => selectedOrderIds.has(o.id));
      return {
          confirm: selectedList.filter(o => o.status === OrderStatus.PENDING_CONFIRM).length,
          ship: selectedList.filter(o => o.status === OrderStatus.PROCESSING_PROD).length
      };
  };

  const handleBatchConfirm = async () => {
      const selectedList = orders.filter(o => selectedOrderIds.has(o.id));
      const eligible = selectedList.filter(o => o.status === OrderStatus.PENDING_CONFIRM);
      if (eligible.length === 0) return alert('未选中任何“待确认”状态的订单。');
      if (!confirm(`确定批量确认 ${eligible.length} 个订单吗？`)) return;
      const now = new Date().toISOString();
      if (apiMode) {
          try {
              const { orderApi } = await import('../../services/api');
              await Promise.all(eligible.map(o => orderApi.update(o.id, { ...o, status: OrderStatus.PROCESSING_PROD })));
              await refreshOrderList();
          } catch (e) { alert(e instanceof Error ? e.message : '批量确认失败'); return; }
      } else {
          const updatedOrders = orders.map(o => {
              if (selectedOrderIds.has(o.id) && o.status === OrderStatus.PENDING_CONFIRM) {
                  return { ...o, status: OrderStatus.PROCESSING_PROD, confirmedDate: now,
                      approvalRecords: [{ id: `op-batch-${Date.now()}-${o.id}`, operatorId: currentUser.id,
                          operatorName: currentUser.name, operatorRole: currentUser.roles?.join(',') || '',
                          actionType: 'Batch Confirm', result: 'Confirmed', timestamp: now, comment: '批量确认操作'
                      }, ...(o.approvalRecords || [])] };
              }
              return o;
          });
          setOrders(updatedOrders);
      }
      setSelectedOrderIds(new Set());
  };

  const handleBatchShip = async () => {
      const selectedList = orders.filter(o => selectedOrderIds.has(o.id));
      const eligible = selectedList.filter(o => o.status === OrderStatus.PROCESSING_PROD);
      if (eligible.length === 0) return alert('未选中任何“备货中”状态的订单。');
      const unpaidCount = eligible.filter(o => !o.isPaid).length;
      if (unpaidCount > 0) {
          if(!confirm(`其中有 ${unpaidCount} 个订单尚未支付，确定要强制发货吗？`)) return;
      } else {
          if(!confirm(`确定批量发货 ${eligible.length} 个订单吗？`)) return;
      }
      const now = new Date().toISOString();
      if (apiMode) {
          try {
              const { orderApi } = await import('../../services/api');
              await Promise.all(eligible.map(o => orderApi.update(o.id, { ...o, status: OrderStatus.SHIPPED, shippedDate: now })));
              await refreshOrderList();
          } catch (e) { alert(e instanceof Error ? e.message : '批量发货失败'); return; }
      } else {
          const updatedOrders = orders.map(o => {
              if (selectedOrderIds.has(o.id) && o.status === OrderStatus.PROCESSING_PROD) {
                  const isPhysical = o.deliveryMethod !== 'Online';
                  return { ...o, status: OrderStatus.SHIPPED, shippedDate: now,
                      carrier: isPhysical ? (o.carrier || 'Batch Ship') : undefined,
                      trackingNumber: isPhysical ? (o.trackingNumber || `BATCH-${Date.now()}`) : undefined,
                      isPackageConfirmed: true, isCDBurned: true,
                      approvalRecords: [{ id: `op-batch-ship-${Date.now()}-${o.id}`, operatorId: currentUser.id,
                          operatorName: currentUser.name, operatorRole: currentUser.roles?.join(',') || '',
                          actionType: 'Batch Ship', result: 'Shipped', timestamp: now, comment: '批量发货操作'
                      }, ...(o.approvalRecords || [])] };
              }
              return o;
          });
          setOrders(updatedOrders);
      }
      setSelectedOrderIds(new Set());
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const handleDeleteDraft = (e: React.MouseEvent, orderId: string) => {
      e.stopPropagation();
      setConfirmDeleteId(orderId);
  };
  const confirmDelete = useCallback(async () => {
      setConfirmDeleteId(prev => {
          if (!prev) return prev;
          setOrderDrafts(drafts => drafts.filter(d => d.id !== prev));
          if (apiMode) {
              import('../../services/api').then(({ orderApi }) => orderApi.delete(prev)).then(() => refreshOrderList()).catch(() => { /* error shown via global toast */ });
          }
          setOrders(ords => ords.filter(o => o.id !== prev));
          return null;
      });
  }, [setOrderDrafts, setOrders, apiMode, refreshOrders]);

  const getAction = (order: Order) => {
      const navigateToStep = (step: string) => navigate(`/orders/${order.id}`, { state: { openAction: step } });
      const btnCls = "px-1 py-0.5 text-[#0071E3] dark:text-[#0A84FF] hover:text-[#0060C0] dark:hover:text-[#007AEB] text-xs font-medium whitespace-nowrap transition";
      if (order.status === OrderStatus.DRAFT)
          return (
              <div className="flex items-center justify-end gap-1.5 mr-[-40px]">
                  <button
                      onClick={(e) => { e.stopPropagation(); const draft = orderDrafts.find(d => d.id === order.id) || orderToDraft(order); setResumeDraft(draft); setIsCreateOpen(true); }}
                      className={btnCls}
                  >继续编辑</button>
                  <button
                      onClick={(e) => handleDeleteDraft(e, order.id)}
                      className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-gray-600 transition"
                      title="删除草稿"
                  ><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
          );
      if (order.status === OrderStatus.PENDING_APPROVAL && hasPermission('order_workflow_approval'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('APPROVAL'); }} className={btnCls}>去审批</button>;
      if (order.status === OrderStatus.PENDING_CONFIRM && hasPermission('order_workflow_confirm'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('CONFIRM'); }} className={btnCls}>去确认</button>;
      if (order.status === OrderStatus.PENDING_PAYMENT && hasPermission('order_workflow_payment'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('PAYMENT'); }} className={btnCls}>去支付</button>;
      if (order.status === OrderStatus.PROCESSING_PROD && hasPermission('order_workflow_stock'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('STOCK_PREP'); }} className={btnCls}>去备货</button>;
      if (order.status === OrderStatus.SHIPPED && hasPermission('order_workflow_acceptance'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('ACCEPTANCE'); }} className={btnCls}>去验收</button>;
      return null;
  };

  const clearAdvancedFilters = () => {
      setAdvancedFilters([]);
      setAppliedFilters([]);
      setFilterDateStart('');
      setFilterDateEnd('');
      setFilterAmountMin('');
      setFilterAmountMax('');
      setFilterSource('All');
  };

  const applyFilters = () => {
      setAppliedFilters([...advancedFilters]);
      closeFilterDrawer();
  };

  const { confirm: confirmCount, ship: shipCount } = getEligibleCounts();

  const DEFAULT_VISIBLE = ['id', 'customer', 'buyer', 'products', 'sales', 'businessManager', 'department', 'source', 'buyerType', 'date', 'status', 'paymentStatus', 'stockStatus', 'total', 'action'];
  const FIXED_COLUMNS = useMemo(() => new Set(['id', 'action']), []);

  // Drawer-embedded column config state
  const [tempVisibleCols, setTempVisibleCols] = useState<string[]>(visibleColumns);
  const [colSearch, setColSearch] = useState('');
  const [colDragIdx, setColDragIdx] = useState<number | null>(null);
  const [showSaveView, setShowSaveView] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');
  useEffect(() => { if (isAdvancedFilterOpen) { setTempVisibleCols(visibleColumns); setShowSaveView(false); setSaveViewName(''); } }, [isAdvancedFilterOpen]);

  const saveCurrentAsView = useCallback((name: string) => {
    const cols = drawerTab === 'columns' ? tempVisibleCols : visibleColumns;
    const filters = drawerTab === 'filter' ? advancedFilters : appliedFilters;
    const id = 'view_' + Date.now();
    const newView: OrderView = {
      id, name, columns: [...cols],
      filters: { filterStatus, advancedFilters: [...filters] },
    };
    setViews(prev => [...prev, newView]);
    setActiveViewId(id);
    setVisibleColumns(cols);
    if (drawerTab === 'filter') {
      setAppliedFilters([...advancedFilters]);
    }
    setShowSaveView(false);
    setSaveViewName('');
    closeFilterDrawer();
  }, [drawerTab, tempVisibleCols, visibleColumns, advancedFilters, appliedFilters, filterStatus]);

  const handleColumnConfigConfirm = useCallback((cols: string[]) => {
    setVisibleColumns(cols);
    setViews(prev => prev.map(v => v.id === activeViewId ? {
      ...v,
      columns: [...cols],
      filters: { filterStatus, advancedFilters: [...appliedFilters] },
    } : v));
  }, [activeViewId, filterStatus, appliedFilters]);

  const searchFieldOptions: { value: 'id' | 'customerName' | 'buyerName' | 'productName' | 'licensee'; label: string; placeholder: string }[] = [
    { value: 'id',           label: '订单编号', placeholder: '搜索订单编号…' },
    { value: 'customerName', label: '客户名称', placeholder: '搜索客户名称…' },
    { value: 'buyerName',    label: '买方名称', placeholder: '搜索买方名称…' },
    { value: 'productName',  label: '产品名称', placeholder: '搜索产品名称…' },
    { value: 'licensee',     label: '被授权方', placeholder: '搜索被授权方…' },
  ];
  const currentSearchOption = searchFieldOptions.find(o => o.value === searchField)!;

  const colWidthMap: Record<string, number> = {
      id: 260, customer: 175, buyer: 165, products: 285,
      sales: 120, businessManager: 120, department: 190,
      source: 100, buyerType: 100, date: 150, status: 90,
      paymentStatus: 95, stockStatus: 90, total: 125,
      payment: 100, delivery: 100, address: 160, invoice: 140,
      licensee: 200, opportunity: 140, action: 85,
  };
  const orderedVisibleColumns = useMemo(() =>
      visibleColumns.map(id => allColumns.find(c => c.id === id)!).filter(Boolean),
      [visibleColumns, allColumns]
  );
  const tableColGroup = (
      <colgroup>
          <col style={{ width: 52 }} />
          {orderedVisibleColumns.map(col => (
              <col key={col.id} style={{ width: colWidthMap[col.id] || 120 }} />
          ))}
          <col style={{ width: 52 }} />
      </colgroup>
  );
  const tableWidth = 52 + orderedVisibleColumns.reduce((s, col) => s + (colWidthMap[col.id] || 120), 0) + 52;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    const proc = orders.filter(o => o.status === OrderStatus.PROCESSING_PROD);
    counts['STOCK_AUTH'] = proc.filter(o => !o.isAuthConfirmed).length;
    counts['STOCK_PKG'] = proc.filter(o => o.isAuthConfirmed && !o.isPackageConfirmed).length;
    counts['STOCK_SHIP'] = proc.filter(o => o.isPackageConfirmed && !o.isShippingConfirmed).length;
    counts['STOCK_CD'] = proc.filter(o => o.isShippingConfirmed && !o.isCDBurned).length;
    return counts;
  }, [orders]);

  return (
    <div className="page-container animate-page-enter pb-2 h-full flex flex-col gap-2.5 min-w-0 overflow-hidden">
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">订单管理</h1>
        <OrderViewDropdown
          views={views}
          activeViewId={activeViewId}
          activeView={activeView}
          viewMenuOpenId={viewMenuOpenId}
          editingViewId={editingViewId}
          editingViewName={editingViewName}
          viewMenuRef={viewMenuRef}
          onToggleMenu={() => setViewMenuOpenId(viewMenuOpenId ? null : '__dropdown__')}
          onCloseMenu={() => { setViewMenuOpenId(null); setEditingViewId(null); }}
          onSwitchView={(viewId) => { switchView(viewId); setViewMenuOpenId(null); }}
          onStartRename={(viewId, name) => { setEditingViewId(viewId); setEditingViewName(name); }}
          onRenameView={renameView}
          onCancelRename={() => setEditingViewId(null)}
          onEditingViewNameChange={setEditingViewName}
          onDeleteView={deleteView}
        />
        <div className="flex-1" />
        {/* Search bar - kept inline */}
        <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-[280px] lg:w-[320px] shrink-0 focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
            {/* Field selector */}
            <div className="relative flex-shrink-0">
                <button
                    onClick={() => setIsSearchFieldOpen(v => !v)}
                    className="h-full flex items-center gap-1.5 pl-3 pr-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-l-lg border-r border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors select-none whitespace-nowrap"
                >
                    {currentSearchOption.label}
                    <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-150 ${isSearchFieldOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSearchFieldOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSearchFieldOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-28 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 py-1 animate-fade-in">
                            {searchFieldOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setSearchField(opt.value); setSearchTerm(''); setIsSearchFieldOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${searchField === opt.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {/* Input */}
            <div className="relative flex-1 flex items-center min-w-0">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
                <input
                    type="text"
                    placeholder={currentSearchOption.placeholder}
                    className="w-full h-full pl-8 pr-8 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5 rounded">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>

        {/* 筛选 & 列配置（合并入口） */}
        <button 
            onClick={() => {
                if (!isAdvancedFilterOpen && advancedFilters.length === 0) {
                    const defaults = availableFilterFields.map((field, idx) => ({
                        id: String(idx + 1),
                        fieldId: field.id,
                        mode: field.defaultMode,
                        value: initValueForField(field.id, field.defaultMode),
                    }));
                    setAdvancedFilters(defaults);
                }
                setDrawerTab('filter');
                setIsAdvancedFilterOpen(!isAdvancedFilterOpen);
            }}
            className={`relative p-2 rounded-lg border transition shadow-apple ${isAdvancedFilterOpen ? 'bg-blue-50 border-blue-200 text-[#0071E3] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
            title="筛选与列配置"
        >
            <SlidersHorizontal className="w-4 h-4" />
            {appliedFilters.length > 0 && !isAdvancedFilterOpen && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]" />
            )}
        </button>

        {/* 重置按钮 */}
        <button
            onClick={() => {
                setSearchTerm('');
                setFilterStatus('All');
                setFilterDateStart('');
                setFilterDateEnd('');
                setFilterAmountMin('');
                setFilterAmountMax('');
                setFilterSource('All');
                setAdvancedFilters([]);
                setAppliedFilters([]);
            }}
            className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition shadow-apple"
            title="重置所有筛选"
        >
            <RotateCcw className="w-4 h-4" />
        </button>

        {hasPermission('order_create') && (
            <div className="flex items-center gap-2">
                {orderDrafts.length > 0 && (
                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition">
                            <Save className="w-3.5 h-3.5"/>
                            草稿箱
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">{orderDrafts.length}</span>
                        </button>
                        {/* Draft dropdown */}
                        <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden hidden group-focus-within:block group-hover:block">
                            <div className="p-3 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">暂存草稿</span>
                                <span className="text-xs text-gray-400">{orderDrafts.length} 条</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {orderDrafts.map(draft => (
                                    <div key={draft.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition group/item border-b border-gray-50 dark:border-white/5 last:border-0">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-500 dark:text-gray-400" style={{fontVariantNumeric:'tabular-nums'}}>{draft.id}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                第 {draft.currentStep} 步 · {draft.buyerType || '未选类型'}
                                                {draft.newOrderItems.length > 0 && ` · ${draft.newOrderItems.length} 个产品`}
                                            </div>
                                            <div className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">{new Date(draft.savedAt).toLocaleString('zh-CN')}</div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => { setResumeDraft(draft); setIsCreateOpen(true); }}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#0071E3] dark:text-[#FF2D55] bg-blue-50 dark:bg-white/5 rounded-lg hover:bg-blue-100 dark:hover:bg-white/10 transition"
                                            >
                                                继续 <ChevronRight className="w-3 h-3"/>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setOrderDrafts(prev => prev.filter(d => d.id !== draft.id));
                                                    if (apiMode) {
                                                        try { const { orderApi } = await import('../../services/api'); await orderApi.delete(draft.id); } catch {}
                                                    }
                                                    setOrders(prev => prev.filter(o => o.id !== draft.id));
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            >
                                                <X className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <button onClick={() => { setResumeDraft(undefined); setIsCreateOpen(true); }} className="unified-button-primary">
                    <Plus className="w-4 h-4" /> 新建订单
                </button>
            </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* Status Filter Tabs */}
      {(() => {
        const shippingIds = new Set(['STOCK_AUTH', 'STOCK_PKG', 'STOCK_SHIP', 'STOCK_CD']);
        const successIds = new Set<string>([OrderStatus.SHIPPED, OrderStatus.DELIVERED]);
        const warningIds = new Set<string>([OrderStatus.PENDING_PAYMENT]);
        const getVariant = (id: string): 'primary' | 'shipping' | 'warning' | 'success' | 'danger' | 'muted' => {
          if (shippingIds.has(id)) return 'shipping';
          if (successIds.has(id)) return 'success';
          if (warningIds.has(id)) return 'warning';
          return 'primary';
        };
        const approvalGroup = pipelineStatuses.filter(s => !shippingIds.has(s.id) && !successIds.has(s.id) && !warningIds.has(s.id)).filter(s => hasPermission(s.permission));
        const shippingGroup = pipelineStatuses.filter(s => shippingIds.has(s.id)).filter(s => hasPermission(s.permission));
        const paymentGroup = pipelineStatuses.filter(s => warningIds.has(s.id)).filter(s => hasPermission(s.permission));
        const sep = <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-0.5 self-center shrink-0" />;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {approvalGroup.map(step => (
              <StatusFilterCard key={step.id} id={step.id} label={step.label} icon={step.icon} count={statusCounts[step.id] || 0} isActive={filterStatus === step.id} variant={getVariant(step.id)} onClick={() => setFilterStatus(step.id)} />
            ))}
            {shippingGroup.length > 0 && sep}
            {shippingGroup.map(step => (
              <StatusFilterCard key={step.id} id={step.id} label={step.label} icon={step.icon} count={statusCounts[step.id] || 0} isActive={filterStatus === step.id} variant="shipping" onClick={() => setFilterStatus(step.id)} />
            ))}
            {paymentGroup.length > 0 && sep}
            {paymentGroup.map(step => (
              <StatusFilterCard key={step.id} id={step.id} label={step.label} icon={step.icon} count={statusCounts[step.id] || 0} isActive={filterStatus === step.id} variant="warning" onClick={() => setFilterStatus(step.id)} />
            ))}
          </div>
        );
      })()}
        <OrderTable
          currentOrders={currentOrders}
          filteredOrdersCount={listTotal}
          visibleColumns={visibleColumns}
          orderedVisibleColumns={orderedVisibleColumns}
          tableColGroup={tableColGroup}
          tableWidth={tableWidth}
          selectedOrderIds={selectedOrderIds}
          headerScrollRef={headerScrollRef}
          bodyScrollRef={bodyScrollRef}
          productPopoverId={productPopoverId}
          popoverPos={popoverPos}
          productPopoverRef={productPopoverRef}
          copiedOrderId={copiedOrderId}
          tableCopied={tableCopied}
          safePage={safePage}
          itemsPerPage={activePageSize}
          orders={orders}
          users={users}
          departments={departments}
          channels={channels}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOrder={toggleSelectOrder}
          onCopyOrderId={handleCopyOrderId}
          onCopyTable={handleCopyTable}
          onPageChange={(p) => {
            if (useServerOrderPaging) orderQuery.setPage(p);
            else setCurrentPage(p);
          }}
          onSizeChange={(s) => {
            setItemsPerPage(s);
            if (useServerOrderPaging) orderQuery.setSize(s);
            else setCurrentPage(1);
          }}
          onProductPopoverToggle={(orderId, rect) => {
            const popoverWidth = 288;
            const left = Math.max(4, rect.left - popoverWidth - 6);
            const top = rect.top - 8;
            setPopoverPos({ top, left });
            setProductPopoverId(orderId);
          }}
          onProductPopoverClose={() => { setProductPopoverId(null); setPopoverPos(null); }}
          onUserClick={(user) => { setDetailsUser(user); setIsDrawerOpen(true); }}
          getDepartmentPath={getDepartmentPath}
          getStatusBadge={getStatusBadge}
          getPaymentStatusBadge={getPaymentStatusBadge}
          getStockStatusBadge={getStockStatusBadge}
          getSourceBadge={getSourceBadge}
          getAction={getAction}
        />
      </div>

      {isAdvancedFilterOpen && (
        <ModalPortal>
        <div className="fixed inset-0 z-[500]">
          <div
            className={`absolute inset-0 pointer-events-auto ${isFilterClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'} bg-black/40 backdrop-blur-sm`}
            onClick={closeFilterDrawer}
          ></div>
          <div className={`absolute right-0 inset-y-0 w-full max-w-[560px] pointer-events-auto bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col border-l border-gray-200/50 dark:border-white/10 ${isFilterClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
            <div className="border-b border-gray-100 dark:border-white/10 shrink-0">
                <div className="px-5 pt-4 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
                        <button
                            onClick={() => setDrawerTab('filter')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${drawerTab === 'filter' ? 'bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#0A84FF] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            筛选条件
                            {appliedFilters.length > 0 && <span className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#0071E3] dark:bg-[#0A84FF] text-white text-[10px] font-bold px-1">{appliedFilters.length}</span>}
                        </button>
                        <button
                            onClick={() => setDrawerTab('columns')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${drawerTab === 'columns' ? 'bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#0A84FF] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <Columns3 className="w-3.5 h-3.5" />
                            显示列
                        </button>
                    </div>
                    <button onClick={closeFilterDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 transition">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
                <div className="h-3" />
            </div>
            {drawerTab === 'filter' && (
              <OrderFilterDrawerTab
                advancedFilters={advancedFilters}
                appliedFilters={appliedFilters}
                activeDropdown={activeDropdown}
                showSaveView={showSaveView}
                saveViewName={saveViewName}
                orders={orders}
                users={users}
                onAddFilter={addFilterCondition}
                onRemoveFilter={removeFilterCondition}
                onUpdateFilter={updateFilterCondition}
                onToggleDropdown={toggleDropdown}
                onToggleMultiValue={toggleMultiValue}
                onClearFilters={clearAdvancedFilters}
                onApplyFilters={applyFilters}
                onCloseDrawer={closeFilterDrawer}
                onShowSaveView={() => { setShowSaveView(true); setSaveViewName(''); }}
                onHideSaveView={() => setShowSaveView(false)}
                onSaveViewNameChange={setSaveViewName}
                onSaveCurrentAsView={saveCurrentAsView}
                getCheckboxOptions={getFilterCheckboxOptions}
              />
            )}
            {drawerTab === 'columns' && (
              <OrderColumnDrawerTab
                tempVisibleCols={tempVisibleCols}
                colSearch={colSearch}
                colDragIdx={colDragIdx}
                fixedColumns={FIXED_COLUMNS}
                showSaveView={showSaveView}
                saveViewName={saveViewName}
                onColSearchChange={setColSearch}
                onTempVisibleColsChange={setTempVisibleCols}
                onColDragIdxChange={setColDragIdx}
                onShowSaveView={() => { setShowSaveView(true); setSaveViewName(''); }}
                onHideSaveView={() => setShowSaveView(false)}
                onSaveViewNameChange={setSaveViewName}
                onSaveCurrentAsView={saveCurrentAsView}
                onRestoreDefault={() => setTempVisibleCols([...DEFAULT_VISIBLE])}
                onCloseDrawer={closeFilterDrawer}
                onConfirm={(cols) => { handleColumnConfigConfirm(cols); closeFilterDrawer(); }}
              />
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      <OrderFilterDropdownPortal
        activeDropdown={activeDropdown}
        advancedFilters={advancedFilters}
        orders={orders}
        users={users}
        dropdownRef={dropdownRef}
        onUpdateFilter={updateFilterCondition}
        onToggleMultiValue={toggleMultiValue}
        onCloseDropdown={() => setActiveDropdown(null)}
        getCheckboxOptions={getFilterCheckboxOptions}
      />
      {/* Batch Action Floating Bar */}
      {selectedOrderIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fade-in w-full px-4 md:w-auto md:px-0">
              <div className="unified-card bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl shadow-2xl border-gray-200 dark:border-white/10 rounded-full px-6 py-3 flex flex-wrap justify-center items-center gap-4 ring-1 ring-black/5 max-w-full">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white mr-2">
                      <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs">
                          {selectedOrderIds.size}
                      </div>
                      <span className="hidden sm:inline">已选择</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                  
                  {hasPermission('order_workflow_confirm') && (
                  confirmCount > 0 ? (
                      <button 
                          onClick={handleBatchConfirm}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold hover:bg-orange-200 transition"
                      >
                          <CheckSquare className="w-3.5 h-3.5" /> 批量确认 ({confirmCount})
                      </button>
                  ) : (
                      <button disabled className="hidden sm:block px-4 py-2 text-gray-400 text-xs font-bold cursor-not-allowed">
                          批量确认 (0)
                      </button>
                  ))}

                  {hasPermission('order_workflow_shipping') && (
                  shipCount > 0 ? (
                      <button 
                          onClick={handleBatchShip}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold hover:bg-blue-200 transition"
                      >
                          <Truck className="w-3.5 h-3.5" /> 批量发货 ({shipCount})
                      </button>
                  ) : (
                      <button disabled className="hidden sm:block px-4 py-2 text-gray-400 text-xs font-bold cursor-not-allowed">
                          批量发货 (0)
                      </button>
                  ))}
                  
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                  <button onClick={() => setSelectedOrderIds(new Set())} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition">
                      <X className="w-4 h-4" />
                  </button>
              </div>
          </div>
      )}


      {/* --- Create Order Wizard --- */}
      <OrderCreateWizard
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setRenewalOrder(undefined); setSubscriptionCheckout(null); setResumeDraft(undefined); }}
        renewalOrder={renewalOrder}
        subscriptionCheckout={subscriptionCheckout}
        initialDraft={resumeDraft}
      />

      {isDrawerOpen && detailsUser && (
        <UserDetailPanel
          user={detailsUser}
          isClosing={isDrawerClosing}
          onClose={closeDrawer}
          roles={roles}
          departments={departments}
          users={users}
          onEmployeeCard={() => setIsEmployeeCardOpen(true)}
          onSave={(updated) => {
            setUsers(prev => prev.map(u => u.id === detailsUser.id ? { ...u, ...updated } as User : u));
            setDetailsUser(prev => prev ? { ...prev, ...updated } as User : prev);
          }}
        />
      )}
      {isEmployeeCardOpen && detailsUser && (
        <EmployeeCardModal user={detailsUser} roles={roles} departments={departments} users={users} onClose={() => setIsEmployeeCardOpen(false)} />
      )}

      {confirmDeleteId && (
        <DeleteConfirmModal orderId={confirmDeleteId} onCancel={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
};

export default OrderManager;
