
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Order, OrderStatus, OrderItem, User, ApprovalRecord, OrderSource } from '../../types';
import { Search, Plus, Trash2, Disc, CheckCircle, FileText, CreditCard, Truck, X, Layers, Clock, AlertCircle, Network, Globe, Radio, RefreshCcw, FileCheck, CheckSquare, Package, Settings, Filter, ChevronDown, Calendar, Shield, RotateCcw } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import OrderCreateWizard from './OrderCreateWizard';
import { useAppContext } from '../../contexts/AppContext';

type FilterMode = '单选' | '多选' | '时间段' | '时间点' | '金额范围';

interface FilterCondition {
    id: string;
    fieldId: string;
    mode: FilterMode;
    value: string | number | boolean | { start: string; end: string } | { min: string; max: string } | string[];
}

const availableFilterFields = [
    { id: 'orderSource', label: '订单来源', defaultMode: '多选' as FilterMode },
    { id: 'orderType', label: '订单类型', defaultMode: '多选' as FilterMode },
    { id: 'businessManager', label: '商务', defaultMode: '单选' as FilterMode },
    { id: 'orderStatus', label: '订单状态', defaultMode: '多选' as FilterMode },
    { id: 'paymentStatus', label: '付款状态', defaultMode: '多选' as FilterMode },
    { id: 'stockStatus', label: '备货状态', defaultMode: '多选' as FilterMode },
    { id: 'orderDate', label: '提单时间', defaultMode: '时间段' as FilterMode },
    { id: 'shippedDate', label: '发货时间', defaultMode: '时间段' as FilterMode },
    { id: 'orderAmount', label: '订单应付金额', defaultMode: '金额范围' as FilterMode },
];

const orderSourceLabelMap: Record<string, string> = {
    Sales: '销售创建',
    ChannelPortal: '渠道门户',
    OnlineStore: '线上商城',
    APISync: 'API 同步',
    Renewal: '续费',
};


const statusMap: Record<string, string> = {
    [OrderStatus.PENDING_APPROVAL]: '待审批',
    [OrderStatus.PENDING_CONFIRM]: '待确认',
    [OrderStatus.PROCESSING_PROD]: '备货中',
    [OrderStatus.PENDING_PAYMENT]: '待支付',
    [OrderStatus.SHIPPED]: '已发货',
    [OrderStatus.DELIVERED]: '已完成',
    [OrderStatus.CANCELLED]: '已取消',
    [OrderStatus.REFUND_PENDING]: '退款中',
    [OrderStatus.REFUNDED]: '已退款',
};

const buyerTypeMap: Record<string, string> = {
    'Customer': '客户直签',
    'Channel': '渠道代理',
    'SelfDeal': '自主成交'
};

const deliveryMethodMap: Record<string, string> = {
    'Online': '线上发货',
    'Offline': '线下发货',
    'Hybrid': '混合发货'
};

const paymentMethodMap: Record<string, string> = {
    'Online': '在线支付',
    'Transfer': '银行转账',
    'COD': '货到付款'
};

const OrderManager: React.FC = () => {
  const { orders, setOrders, products, customers, currentUser, users, departments, opportunities, channels, roles, standaloneEnterprises } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Permission Check
  const currentUserRole = roles.find(r => r.id === currentUser.role);
  const permissions = currentUserRole?.permissions || [];
  const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);

  // Pipeline Status Definitions
  const pipelineStatuses = [
      { id: OrderStatus.PENDING_APPROVAL, label: '待审批', desc: '等待经理或财务审批', icon: FileCheck, permission: 'order_view_pending_approval' },
      { id: OrderStatus.PENDING_CONFIRM, label: '待确认', desc: '等待商务确认订单', icon: CheckSquare, permission: 'order_view_pending_confirm' },
      { id: 'STOCK_AUTH', label: '授权确认', desc: '生成并确认产品授权码', icon: CheckCircle, permission: 'order_view_auth_confirm' },
      { id: 'STOCK_PKG', label: '安装包核验', desc: '核对安装包版本及完整性', icon: FileText, permission: 'order_view_stock_pkg' },
      { id: 'STOCK_SHIP', label: '快递单填写', desc: '填写快递单及物流信息', icon: Truck, permission: 'order_view_stock_ship' },
      { id: 'STOCK_CD', label: '光盘刻录', desc: '刻录物理光盘介质', icon: Disc, permission: 'order_view_stock_cd' },
      { id: OrderStatus.PENDING_PAYMENT, label: '待支付', desc: '等待客户完成支付', icon: CreditCard, permission: 'order_view_payment' }, 
      { id: OrderStatus.SHIPPED, label: '已发货', desc: '产品已发出，运输中', icon: Truck, permission: 'order_view_shipped' },
      { id: OrderStatus.DELIVERED, label: '已完成', desc: '客户已签收，流程结束', icon: CheckCircle, permission: 'order_view_completed' },
  ];

  // Exception Statuses
  const exceptionStatuses = [
      { id: OrderStatus.REFUND_PENDING, label: '退款中', desc: '处理客户退款申请', icon: RefreshCcw, permission: 'order_view_refund_pending' },
      { id: OrderStatus.REFUNDED, label: '已退款', desc: '退款流程已完成', icon: AlertCircle, permission: 'order_view_refunded' },
      { id: OrderStatus.CANCELLED, label: '已取消', desc: '订单已作废', icon: X, permission: 'order_view_cancelled' },
  ];

  const [filterStatus, setFilterStatus] = useState<string>(() => {
    if (hasPermission('order_view_all')) return 'All';
    const firstAllowed = pipelineStatuses.find(step => hasPermission(step.permission));
    if (firstAllowed) return firstAllowed.id;
    const firstException = exceptionStatuses.find(step => hasPermission(step.permission));
    return firstException ? firstException.id : 'All';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'id' | 'customerName' | 'buyerName' | 'productName'>('id');
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false);
  
  // Advanced Filter State
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const closeFilterDrawer = () => {
      setIsFilterClosing(true);
      setTimeout(() => { setIsAdvancedFilterOpen(false); setIsFilterClosing(false); }, 280);
  };
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);
  // appliedFilters 是已点击「查询」后真正生效的筛选条件
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>([]);

  const multiCheckboxFields = ['orderSource', 'orderType', 'orderStatus', 'paymentStatus', 'stockStatus'];
  const personPickerFields = ['businessManager'];
  const dateFilterFields = ['orderDate', 'shippedDate'];
  const amountFilterFields = ['orderAmount'];

  const [activeDropdown, setActiveDropdown] = useState<{ filterId: string; type: 'field' | 'mode' | 'value'; top: number; left: number; width: number } | null>(null);
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

  const getCheckboxOptions = (fieldId: string): { value: string; label: string }[] => {
      const sourceKeys = [...new Set([...Object.keys(orderSourceLabelMap), ...orders.map(o => o.source as string).filter(Boolean)])];
      if (fieldId === 'orderSource') return sourceKeys.map(s => ({ value: s, label: orderSourceLabelMap[s as string] || s }));
      if (fieldId === 'orderType') {
          const fallback = ['新购订单', '续费订单', '增购订单', '降配订单', '退款订单'];
          return [...new Set([...fallback, ...orders.map(o => o.orderType as string).filter(Boolean)])].map(t => ({ value: t, label: t }));
      }
      if (fieldId === 'orderStatus') return Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v }));
      if (fieldId === 'paymentStatus') return [{ value: 'paid', label: '已支付' }, { value: 'unpaid', label: '待支付' }];
      if (fieldId === 'stockStatus') return [
          { value: 'pending', label: '待处理' }, { value: 'processing', label: '备货中' },
          { value: 'pendingShip', label: '待发货' }, { value: 'shipped', label: '已发货' }, { value: 'completed', label: '已完成' }
      ];
      return [];
  };

  const initValueForField = (fieldId: string, mode: string) => {
      if (multiCheckboxFields.includes(fieldId)) return [] as string[];
      if (amountFilterFields.includes(fieldId)) return { min: '', max: '' };
      if (mode === '时间段') return { start: '', end: '' };
      if (mode === '时间点') return '';
      return '全部';
  };

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
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
      'id', 'customer', 'buyer', 'products', 'sales', 'businessManager', 'department', 'source', 'buyerType', 'date', 'status', 'paymentStatus', 'stockStatus', 'total', 'action'
  ]);

  const allColumns = [
      { id: 'id', label: '订单编号' },
      { id: 'customer', label: '客户名称' },
      { id: 'buyer', label: '买方名称' },
      { id: 'products', label: '产品信息' },
      { id: 'sales', label: '销售' },
      { id: 'businessManager', label: '商务' },
      { id: 'department', label: '所属部门' },
      { id: 'source', label: '订单来源' },
      { id: 'buyerType', label: '订单类型' },
      { id: 'date', label: '提单时间' },
      { id: 'status', label: '订单状态' },
      { id: 'paymentStatus', label: '付款状态' },
      { id: 'stockStatus', label: '备货状态' },
      { id: 'total', label: '订单应付金额' },
      { id: 'payment', label: '支付方式' },
      { id: 'delivery', label: '发货方式' },
      { id: 'address', label: '收货地址' },
      { id: 'invoice', label: '发票抬头' },
      { id: 'opportunity', label: '关联商机' },
      { id: 'action', label: '操作' },
  ];

  // Batch Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // User Details Drawer State
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

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

  // --- Handle Renewal Initialization from navigation state ---
  useEffect(() => {
      const state = location.state as { initRenewal?: boolean; originalOrder?: Order } | null;
      if (state?.initRenewal && state?.originalOrder) {
          setRenewalOrder(state.originalOrder);
          setIsCreateOpen(true);
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const getStatusBadge = (status: OrderStatus) => {
    const text = statusMap[status] || status;
    let className = '';
    switch (status) {
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
  };

  const getPaymentStatusBadge = (isPaid: boolean) => {
    return isPaid
        ? <span className="unified-tag-green !rounded-full">已支付</span>
        : <span className="unified-tag-blue !rounded-full">待支付</span>;
  };

  const getStockStatusBadge = (order: Order) => {
    if (order.status === OrderStatus.DELIVERED)         return <span className="unified-tag-green !rounded-full">已完成</span>;
    if (order.status === OrderStatus.SHIPPED)           return <span className="unified-tag-indigo !rounded-full">已发货</span>;
    if (order.isShippingConfirmed)                      return <span className="unified-tag-blue !rounded-full">待发货</span>;
    if (order.isAuthConfirmed || order.isPackageConfirmed || order.status === OrderStatus.PROCESSING_PROD)
                                                        return <span className="unified-tag-orange !rounded-full">备货中</span>;
    return <span className="unified-tag-blue !rounded-full">待处理</span>;
  };

  const getSourceBadge = (source: OrderSource) => {
      switch(source) {
          case 'Sales':        return <span className="unified-tag-blue">后台下单</span>;
          case 'ChannelPortal':return <span className="unified-tag-indigo">渠道下单</span>;
          case 'OnlineStore':  return <span className="unified-tag-orange">官网下单</span>;
          case 'APISync':      return <span className="unified-tag-gray">第三方下单</span>;
          case 'Renewal':      return <span className="unified-tag-green">客户续费</span>;
          default:             return <span className="unified-tag-gray">{source}</span>;
      }
  };

  const filteredOrders = orders.filter(order => {
    let matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    // Handle sub-status filtering for PROCESSING_PROD
    if (filterStatus === 'STOCK_AUTH') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && !order.isAuthConfirmed;
    if (filterStatus === 'STOCK_PKG') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && order.isAuthConfirmed && !order.isPackageConfirmed;
    if (filterStatus === 'STOCK_SHIP') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && order.isPackageConfirmed && !order.isShippingConfirmed;
    if (filterStatus === 'STOCK_CD') matchesStatus = order.status === OrderStatus.PROCESSING_PROD && order.isShippingConfirmed && !order.isCDBurned;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
        searchField === 'id'           ? order.id.toLowerCase().includes(searchLower) :
        searchField === 'customerName' ? order.customerName.toLowerCase().includes(searchLower) :
        searchField === 'productName'  ? order.items.some(item => item.productName.toLowerCase().includes(searchLower)) :
        (order.buyerName || order.customerName).toLowerCase().includes(searchLower)
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
                return vals.includes('全部') || vals.includes('不限') || vals.includes(order.orderType ?? '');
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
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const indexOfLastItem = safePage * itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);

  const toggleSelectOrder = (id: string) => {
      const newSet = new Set(selectedOrderIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedOrderIds(newSet);
  };

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

  const handleBatchConfirm = () => {
      const selectedList = orders.filter(o => selectedOrderIds.has(o.id));
      const eligible = selectedList.filter(o => o.status === OrderStatus.PENDING_CONFIRM);
      if (eligible.length === 0) return alert('未选中任何“待确认”状态的订单。');
      if (confirm(`确定批量确认 ${eligible.length} 个订单吗？`)) {
          const now = new Date().toISOString();
          const updatedOrders = orders.map(o => {
              if (selectedOrderIds.has(o.id) && o.status === OrderStatus.PENDING_CONFIRM) {
                  return {
                      ...o,
                      status: OrderStatus.PROCESSING_PROD,
                      confirmedDate: now,
                      approvalRecords: [{
                          id: `op-batch-${Date.now()}-${o.id}`,
                          operatorId: currentUser.id,
                          operatorName: currentUser.name,
                          operatorRole: currentUser.role,
                          actionType: 'Batch Confirm',
                          result: 'Confirmed',
                          timestamp: now,
                          comment: '批量确认操作'
                      }, ...o.approvalRecords]
                  };
              }
              return o;
          });
          setOrders(updatedOrders);
          setSelectedOrderIds(new Set());
      }
  };

  const handleBatchShip = () => {
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
      const updatedOrders = orders.map(o => {
          if (selectedOrderIds.has(o.id) && o.status === OrderStatus.PROCESSING_PROD) {
              const isPhysical = o.deliveryMethod !== 'Online';
              return {
                  ...o,
                  status: OrderStatus.SHIPPED,
                  shippedDate: now,
                  carrier: isPhysical ? (o.carrier || 'Batch Ship') : undefined,
                  trackingNumber: isPhysical ? (o.trackingNumber || `BATCH-${Date.now()}`) : undefined,
                  isPackageConfirmed: true,
                  isCDBurned: true,
                  approvalRecords: [{
                      id: `op-batch-ship-${Date.now()}-${o.id}`,
                      operatorId: currentUser.id,
                      operatorName: currentUser.name,
                      operatorRole: currentUser.role,
                      actionType: 'Batch Ship',
                      result: 'Shipped',
                      timestamp: now,
                      comment: '批量发货操作'
                  }, ...o.approvalRecords]
              };
          }
          return o;
      });
      setOrders(updatedOrders);
      setSelectedOrderIds(new Set());
  };

  const getAction = (order: Order) => {
      const navigateToStep = (step: string) => navigate(`/orders/${order.id}`, { state: { openAction: step } });
      if (order.status === OrderStatus.PENDING_APPROVAL && hasPermission('order_workflow_approval'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('APPROVAL'); }} className="px-2 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg text-[10px] font-bold whitespace-nowrap transition border border-yellow-100 dark:border-yellow-800/30">去审批</button>;
      if (order.status === OrderStatus.PENDING_CONFIRM && hasPermission('order_workflow_confirm'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('CONFIRM'); }} className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg text-[10px] font-bold whitespace-nowrap transition border border-orange-100 dark:border-orange-800/30">去确认</button>;
      if (order.status === OrderStatus.PENDING_PAYMENT && hasPermission('order_workflow_payment'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('PAYMENT'); }} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-[10px] font-bold whitespace-nowrap transition border border-blue-100 dark:border-blue-800/30">去支付</button>;
      if (order.status === OrderStatus.PROCESSING_PROD && hasPermission('order_workflow_stock'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('STOCK_PREP'); }} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg text-[10px] font-bold whitespace-nowrap transition border border-indigo-100 dark:border-indigo-800/30">去备货</button>;
      if (order.status === OrderStatus.SHIPPED && hasPermission('order_workflow_acceptance'))
          return <button onClick={(e) => { e.stopPropagation(); navigateToStep('ACCEPTANCE'); }} className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-[10px] font-bold whitespace-nowrap transition border border-green-100 dark:border-green-800/30">去验收</button>;
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

  const toggleColumn = (id: string) => {
      setVisibleColumns(prev => 
          prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      );
  };

  const searchFieldOptions: { value: 'id' | 'customerName' | 'buyerName' | 'productName'; label: string; placeholder: string }[] = [
    { value: 'id',           label: '订单编号', placeholder: '搜索订单编号…' },
    { value: 'customerName', label: '客户名称', placeholder: '搜索客户名称…' },
    { value: 'buyerName',    label: '买方名称', placeholder: '搜索买方名称…' },
    { value: 'productName',  label: '产品名称', placeholder: '搜索产品名称…' },
  ];
  const currentSearchOption = searchFieldOptions.find(o => o.value === searchField)!;

  const colWidthMap: Record<string, number> = {
      id: 190, customer: 150, buyer: 140, products: 240,
      sales: 130, businessManager: 130, department: 200,
      source: 110, buyerType: 110, date: 165, status: 100,
      paymentStatus: 105, stockStatus: 100, total: 120,
      payment: 110, delivery: 110, address: 180, invoice: 160,
      opportunity: 160, action: 90,
  };
  const tableColGroup = (
      <colgroup>
          <col style={{ width: 52 }} />
          {allColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
              <col key={col.id} style={{ width: colWidthMap[col.id] || 120 }} />
          ))}
          <col style={{ width: 52 }} />
      </colgroup>
  );

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto space-y-4 animate-page-enter pb-2">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Left: title */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight shrink-0">订单管理</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Search bar */}
            <div className="flex items-stretch h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] w-full sm:w-[320px] focus-within:border-blue-400 dark:focus-within:border-blue-500/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition shadow-apple">
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

            {/* 筛选按钮（原设置字段位置） */}
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
                    setIsAdvancedFilterOpen(!isAdvancedFilterOpen);
                }}
                className={`p-2 rounded-lg border transition shadow-apple ${isAdvancedFilterOpen ? 'bg-blue-50 border-blue-200 text-[#0071E3] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
                title="高级筛选"
            >
                <Filter className="w-4 h-4" />
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
                }}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition shadow-apple"
                title="重置所有筛选"
            >
                <RotateCcw className="w-4 h-4" />
            </button>

            {/* 设置字段按钮（原筛选位置） */}
            {hasPermission('order_column_config') && (
            <div className="relative">
                <button 
                    onClick={() => setIsColumnConfigOpen(!isColumnConfigOpen)}
                    className={`p-2 rounded-lg border transition shadow-apple ${isColumnConfigOpen ? 'bg-blue-50 border-blue-200 text-[#0071E3] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
                    title="配置列"
                >
                    <Settings className="w-4 h-4" />
                </button>
                {isColumnConfigOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#2C2C2E] shadow-xl z-50 p-2 rounded-xl border border-gray-100 dark:border-white/10 animate-fade-in max-h-80 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-bold text-gray-400 uppercase px-2 py-1 mb-1">显示列配置</div>
                        {allColumns.map(col => (
                            <label key={col.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition">
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.includes(col.id)} 
                                    onChange={() => toggleColumn(col.id)}
                                    disabled={col.id === 'id' || col.id === 'action'} 
                                    className="w-4 h-4 rounded-lg border-gray-300 text-[#0071E3] focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            )}

            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

            {hasPermission('order_create') && (
                <button onClick={() => setIsCreateOpen(true)} className="unified-button-primary">
                    <Plus className="w-4 h-4" /> 新建订单
                </button>
            )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Cards Grid */}
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar no-scrollbar scroll-smooth snap-x snap-mandatory">
            {/* "All" Card */}
            {hasPermission('order_view_all') && (
                <button 
                    onClick={() => setFilterStatus('All')}
                    className={`relative p-2 rounded-xl border transition-all duration-300 text-left group min-w-[100px] flex-shrink-0 snap-start
                        ${filterStatus === 'All' 
                            ? 'bg-[#0071E3] border-[#0071E3] text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-[#0071E3]/40 dark:hover:border-blue-900'}
                    `}
                >
                    <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1 rounded-lg ${filterStatus === 'All' ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3]'}`}>
                            <Layers className="w-3.5 h-3.5" />
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${filterStatus === 'All' ? 'bg-white text-[#0071E3]' : 'bg-blue-100 text-[#0071E3] dark:bg-blue-900/40 dark:text-blue-400'}`}>
                            {orders.length}
                        </span>
                    </div>
                    <div className={`text-[11px] font-bold ${filterStatus === 'All' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>全部订单</div>
                    {filterStatus === 'All' && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-white rounded-full"></div>
                    )}
                </button>
            )}

            {pipelineStatuses.filter(step => hasPermission(step.permission)).map((step) => {
                const isActive = filterStatus === step.id;
                let count = 0;
                if (step.id === 'STOCK_AUTH') count = orders.filter(o => o.status === OrderStatus.PROCESSING_PROD && !o.isAuthConfirmed).length;
                else if (step.id === 'STOCK_PKG') count = orders.filter(o => o.status === OrderStatus.PROCESSING_PROD && o.isAuthConfirmed && !o.isPackageConfirmed).length;
                else if (step.id === 'STOCK_SHIP') count = orders.filter(o => o.status === OrderStatus.PROCESSING_PROD && o.isPackageConfirmed && !o.isShippingConfirmed).length;
                else if (step.id === 'STOCK_CD') count = orders.filter(o => o.status === OrderStatus.PROCESSING_PROD && o.isShippingConfirmed && !o.isCDBurned).length;
                else count = orders.filter(o => o.status === step.id).length;

                return (
                    <button
                        key={step.id}
                        onClick={() => setFilterStatus(step.id)}
                        className={`relative p-2 rounded-xl border transition-all duration-300 text-left group min-w-[100px] flex-shrink-0 snap-start
                            ${isActive 
                                ? 'bg-[#0071E3] border-[#0071E3] text-white shadow-lg shadow-blue-500/20' 
                                : 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-[#0071E3]/40 dark:hover:border-blue-900'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3]'}`}>
                                <step.icon className="w-3.5 h-3.5" />
                            </div>
                            {count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-[#0071E3]' : 'bg-blue-100 text-[#0071E3] dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                    {count}
                                </span>
                            )}
                        </div>
                        <div className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{step.label}</div>
                        {isActive && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-white rounded-full"></div>
                        )}
                    </button>
                );
            })}

            {exceptionStatuses.filter(step => hasPermission(step.permission)).map((step) => {
                const isActive = filterStatus === step.id;
                const count = orders.filter(o => o.status === step.id).length;
                const isCancelled = step.id === OrderStatus.CANCELLED;
                return (
                    <button
                        key={step.id}
                        onClick={() => setFilterStatus(step.id)}
                        className={`relative p-2 rounded-xl border transition-all duration-300 text-left group min-w-[100px] flex-shrink-0 snap-start
                            ${isActive 
                                ? isCancelled
                                    ? 'bg-gray-500 border-gray-500 text-white shadow-lg shadow-gray-400/20'
                                    : 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20'
                                : isCancelled
                                    ? 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-gray-400 dark:hover:border-gray-600'
                                    : 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-red-300 dark:hover:border-red-900'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20' : isCancelled ? 'bg-gray-100 dark:bg-white/10 text-gray-500' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                <step.icon className="w-3.5 h-3.5" />
                            </div>
                            {count > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive
                                    ? isCancelled ? 'bg-white text-gray-600' : 'bg-white text-red-600'
                                    : isCancelled ? 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                                    {count}
                                </span>
                            )}
                        </div>
                        <div className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{step.label}</div>
                        {isActive && (
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 ${isCancelled ? 'bg-white' : 'bg-white'} rounded-full`}></div>
                        )}
                    </button>
                );
            })}
        </div>

        <div className="unified-card overflow-hidden">
            {/* ── 固定表头（不在滚动容器内，滚动条不延伸至此） ── */}
            <div
                ref={headerScrollRef}
                className="overflow-x-auto no-scrollbar"
                onScroll={(e) => { if (bodyScrollRef.current) bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
            >
              <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
                {tableColGroup}
                <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
                  <tr>
                    <th className="pl-6 pr-2 py-3 sticky left-0 z-10 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200/50 dark:border-white/10 w-[52px] min-w-[52px] align-middle">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 align-middle"
                            onChange={toggleSelectAll}
                            checked={currentOrders.length > 0 && currentOrders.every(o => selectedOrderIds.has(o.id))}
                        />
                    </th>
                    {allColumns.map(col => visibleColumns.includes(col.id) && (
                        <th key={col.id} className={`px-4 py-3 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] ${
                            col.id === 'id'
                                ? 'sticky left-[52px] z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.3)]'
                                : col.id === 'action'
                                ? 'sticky right-[52px] z-10 shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.3)] text-center'
                                : ''
                        }`}>{col.label}</th>
                    ))}
                    <th className="px-4 py-3 sticky right-0 z-10 bg-gray-50 dark:bg-[#1C1C1E] border-b border-gray-200/50 dark:border-white/10 w-[52px] min-w-[52px]"></th>
                  </tr>
                </thead>
              </table>
            </div>
            {/* ── 可滚动表体（滚动条只在此区域） ── */}
            <div
                ref={bodyScrollRef}
                className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-370px)] custom-scrollbar"
                onScroll={(e) => { if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
            >
          <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
            {tableColGroup}
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {currentOrders.map(order => {
                const isSelected = selectedOrderIds.has(order.id);
                const stickyBg = isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-900/10'
                    : 'bg-white dark:bg-[#1C1C1E] group-hover:bg-gray-50 dark:group-hover:bg-white/[0.03]';
                return (
                <tr key={order.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0 ${isSelected ? '!bg-blue-50/50 dark:!bg-blue-900/10' : ''}`}>
                  <td className={`pl-6 pr-2 py-3 sticky left-0 z-20 ${stickyBg} transition-colors align-middle`}>
                      <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 align-middle"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                      />
                  </td>
                  {visibleColumns.includes('id') && (
                      <td
                          className={`px-4 py-3 font-mono font-bold text-[#0071E3] dark:text-[#FF2D55] whitespace-nowrap sticky left-[52px] z-20 ${stickyBg} shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.25)] transition-colors cursor-pointer hover:underline`}
                          onClick={() => navigate(`/orders/${order.id}`)}
                      >
                          {order.id}
                      </td>
                  )}
                  {visibleColumns.includes('customer') && (
                      <td className="px-4 py-3 max-w-[180px]">
                        <div 
                            className="font-bold text-[#0071E3] dark:text-[#0A84FF] hover:underline transition-colors break-words cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customers/${order.customerId}`);
                            }}
                        >
                            {order.customerName}
                        </div>
                      </td>
                  )}
                  {visibleColumns.includes('buyer') && (
                      <td className="px-4 py-3 max-w-[180px]">
                        {order.buyerType === 'Channel' ? (
                            <div 
                                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer break-words"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const channelId = order.buyerId || channels.find(c => c.name === order.buyerName)?.id;
                                    if (channelId) navigate(`/channels/${channelId}`);
                                }}
                            >
                                {order.buyerName}
                            </div>
                        ) : (
                            <div className="text-gray-500 dark:text-gray-400 break-words">
                                {order.customerName}
                            </div>
                        )}
                      </td>
                  )}
                  {visibleColumns.includes('products') && (
                      <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 max-w-[220px]">
                              {/* 只展示第一个产品 */}
                              {order.items.slice(0, 1).map((item, idx) => (
                                  <div key={idx} className="flex flex-col">
                                      <div className="flex items-center justify-between gap-2">
                                          <div className="truncate font-medium text-gray-700 dark:text-gray-300" title={item.productName}>{item.productName}</div>
                                          <span className="text-gray-400 shrink-0">×{item.quantity}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                          {item.skuName && <span className="inline-flex w-fit px-2 py-0.5 text-[10px] font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{item.skuName}</span>}
                                          {item.licenseType && <span className="inline-flex w-fit px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{item.licenseType}</span>}
                                      </div>
                                  </div>
                              ))}
                              {/* 更多按钮 + 气泡弹窗 */}
                              {order.items.length > 1 && (
                                  <div className="mt-1 self-end" ref={productPopoverId === order.id ? productPopoverRef : undefined}>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              if (productPopoverId === order.id) {
                                                  setProductPopoverId(null);
                                                  setPopoverPos(null);
                                              } else {
                                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                  const popoverWidth = 288;
                                                  // Always expand to the left; clamp so it doesn't go off-screen
                                                  const left = Math.max(4, rect.left - popoverWidth - 6);
                                                  const top = rect.top - 8;
                                                  setPopoverPos({ top, left });
                                                  setProductPopoverId(order.id);
                                              }
                                          }}
                                          className="text-[10px] font-semibold text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800 px-1.5 py-px rounded-full transition"
                                      >
                                          +{order.items.length - 1} 更多
                                      </button>
                                  </div>
                              )}
                          </div>
                      </td>
                  )}
                  {visibleColumns.includes('sales') && (
                      <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '120px' }}>
                          {(() => {
                              const user = users.find(u => u.id === order.salesRepId);
                              const rawName = order.salesRepName || '未分配';
                              const displayName = rawName.replace(/\s*\(.*\)\s*$/, '');
                              const initials = displayName.slice(0, 1);
                              return (
                                  <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-lg transition-all group/user" onClick={(e) => { e.stopPropagation(); if (user) { setDetailsUser(user); setIsDrawerOpen(true); } }}>
                                      <div className="relative shrink-0">
                                          <img src={user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${rawName}`} className="w-7 h-7 rounded-full object-cover bg-gray-100 border border-gray-200 dark:border-white/10 transition-transform group-hover/user:scale-110" alt={displayName}
                                              onError={(e) => { const t = e.currentTarget; t.style.display='none'; const f = t.nextElementSibling as HTMLElement; if(f) f.style.display='flex'; }} />
                                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white text-[10px] font-bold" style={{display:'none'}}>{initials}</div>
                                          {user?.status === 'Active' && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-2 border-white dark:border-[#1C1C1E] rounded-full"></div>}
                                      </div>
                                      <span className="font-semibold text-gray-900 dark:text-white group-hover/user:text-blue-600 transition-colors whitespace-nowrap">{displayName}</span>
                                  </div>
                              );
                          })()}
                      </td>
                  )}
                  {visibleColumns.includes('businessManager') && (
                      <td className="px-4 py-3 whitespace-nowrap" style={{ minWidth: '120px' }}>
                          {(() => {
                              const user = users.find(u => u.id === order.businessManagerId);
                              const rawName = order.businessManagerName || '未分配';
                              const displayName = rawName.replace(/\s*\(.*\)\s*$/, '');
                              const initials = displayName.slice(0, 1);
                              return (
                                  <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 rounded-lg transition-all group/user" onClick={(e) => { e.stopPropagation(); if (user) { setDetailsUser(user); setIsDrawerOpen(true); } }}>
                                      <div className="relative shrink-0">
                                          <img src={user?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${rawName}`} className="w-7 h-7 rounded-full object-cover bg-gray-100 border border-gray-200 dark:border-white/10 transition-transform group-hover/user:scale-110" alt={displayName}
                                              onError={(e) => { const t = e.currentTarget; t.style.display='none'; const f = t.nextElementSibling as HTMLElement; if(f) f.style.display='flex'; }} />
                                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 items-center justify-center text-white text-[10px] font-bold" style={{display:'none'}}>{initials}</div>
                                          {user?.status === 'Active' && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-2 border-white dark:border-[#1C1C1E] rounded-full"></div>}
                                      </div>
                                      <span className="font-semibold text-gray-900 dark:text-white group-hover/user:text-blue-600 transition-colors whitespace-nowrap">{displayName}</span>
                                  </div>
                              );
                          })()}
                      </td>
                  )}
                  {visibleColumns.includes('department') && (
                      <td className="px-4 py-3" style={{ minWidth: '240px', maxWidth: '300px' }}>
                          {(() => {
                              const user = users.find(u => u.id === order.salesRepId);
                              const fullPath = getDepartmentPath(user?.departmentId);
                              if (fullPath === '-') return <span className="text-gray-400">-</span>;
                              const parts = fullPath.split(' / ');
                              return (
                                  <div className="flex items-start gap-1 flex-wrap leading-snug">
                                      {parts.map((part, idx) => (
                                          <span key={idx} className="flex items-center gap-1">
                                              {idx > 0 && <span className="text-gray-300 dark:text-gray-600 text-[10px]">/</span>}
                                              <span className={`text-xs font-medium ${idx === parts.length - 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{part}</span>
                                          </span>
                                      ))}
                                  </div>
                              );
                          })()}
                      </td>
                  )}
                  {visibleColumns.includes('source') && <td className="px-4 py-3 whitespace-nowrap">{getSourceBadge(order.source)}</td>}
                  {visibleColumns.includes('buyerType') && (
                      <td className="px-4 py-3 whitespace-nowrap">
                          {order.buyerType === 'Channel'   && <span className="unified-tag-indigo">{buyerTypeMap['Channel']}</span>}
                          {order.buyerType === 'SelfDeal'  && <span className="unified-tag-orange">{buyerTypeMap['SelfDeal']}</span>}
                          {order.buyerType === 'Customer'  && <span className="unified-tag-blue">{buyerTypeMap['Customer']}</span>}
                          {!order.buyerType                && <span className="unified-tag-gray">{buyerTypeMap['Customer']}</span>}
                      </td>
                  )}
                  {visibleColumns.includes('date') && <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-[11px] whitespace-nowrap">{new Date(order.date).toLocaleString('zh-CN', { hour12: false })}</td>}
                  {visibleColumns.includes('status') && <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(order.status)}</td>}
                  {visibleColumns.includes('paymentStatus') && <td className="px-4 py-3 whitespace-nowrap">{getPaymentStatusBadge(order.isPaid)}</td>}
                  {visibleColumns.includes('stockStatus') && <td className="px-4 py-3 whitespace-nowrap">{getStockStatusBadge(order)}</td>}
                  {visibleColumns.includes('total') && <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap font-mono">¥{order.total.toLocaleString()}</td>}
                  {visibleColumns.includes('payment') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {order.paymentMethod ? paymentMethodMap[order.paymentMethod] : '-'}
                      </td>
                  )}
                  {visibleColumns.includes('delivery') && (
                      <td className="px-4 py-3">
                          {order.deliveryMethod ? (
                              <span className={`unified-tag ${
                                  order.deliveryMethod === 'Online'  ? 'unified-tag-blue' :
                                  order.deliveryMethod === 'Offline' ? 'unified-tag-orange' : 'unified-tag-indigo'
                              }`}>{deliveryMethodMap[order.deliveryMethod]}</span>
                          ) : <span className="text-gray-400">-</span>}
                      </td>
                  )}
                  {visibleColumns.includes('address') && (
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[180px] truncate" title={order.shippingAddress}>
                          {order.shippingAddress || '-'}
                      </td>
                  )}
                  {visibleColumns.includes('invoice') && (
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={order.invoiceInfo?.title}>
                          {order.invoiceInfo?.title || '-'}
                      </td>
                  )}
                  {visibleColumns.includes('opportunity') && (
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer max-w-[150px] truncate" title={order.opportunityName} onClick={(e) => { e.stopPropagation(); if (order.opportunityId) navigate(`/opportunities/${order.opportunityId}`); }}>
                          {order.opportunityName || '-'}
                      </td>
                  )}
                  {visibleColumns.includes('action') && (
                      <td className={`px-4 py-3 text-center whitespace-nowrap sticky right-[52px] z-20 ${stickyBg} shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.25)] transition-colors`}>
                          {getAction(order)}
                      </td>
                  )}
                  <td className={`px-4 py-3 sticky right-0 z-20 w-[52px] min-w-[52px] ${stickyBg} transition-colors`} />
                </tr>
                );
              })}
              {currentOrders.length === 0 && <tr><td colSpan={visibleColumns.length + 2} className="p-12 text-center text-gray-400">暂无订单数据</td></tr>}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
            <span className="text-xs text-gray-500 dark:text-gray-400">共 <span className="font-semibold text-[#0071E3] dark:text-[#0A84FF]">{filteredOrders.length}</span> 条</span>
            <div className="flex items-center gap-3">
                {/* 每页条数下拉 */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">每页</span>
                    <select
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="unified-card h-7 pl-2 pr-6 text-xs font-medium text-gray-700 dark:text-gray-200 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 outline-none appearance-none cursor-pointer hover:-[#0071E3]/50 transition"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                    >
                        {[20, 50, 100].map(n => <option key={n} value={n}>{n} 条</option>)}
                    </select>
                </div>
                {/* 页码信息 + 翻页 */}
                <span className="text-xs text-gray-400 dark:text-gray-500">第 {currentPage} / {totalPages} 页</span>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">上一页</button>
                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="unified-card px-3 py-1.5 dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/10 text-xs font-medium transition disabled:cursor-not-allowed">下一页</button>
                </div>
            </div>
        </div>
      </div>
    </div>

      {/* Product Popover — fixed to viewport, avoids table clipping */}
      {productPopoverId && popoverPos && (() => {
          const order = orders.find(o => o.id === productPopoverId);
          if (!order) return null;
          return (
              <div
                  ref={productPopoverRef}
                  style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, zIndex: 9999, width: 288 }}
                  className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">全部产品（{order.items.length}）</span>
                      <button onClick={() => { setProductPopoverId(null); setPopoverPos(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                          <X className="w-3.5 h-3.5" />
                      </button>
                  </div>
                  <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
                      {order.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1 pb-2.5 border-b border-gray-50 dark:border-white/5 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{item.productName}</span>
                                  <span className="text-xs text-gray-400 shrink-0">×{item.quantity}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.skuName && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-[#0071E3] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">{item.skuName}</span>}
                                  {item.licenseType && <span className="inline-flex px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">{item.licenseType}</span>}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      })()}

      {/* Advanced Filters Drawer */}
      {isAdvancedFilterOpen && (
        <ModalPortal>
        <div className="fixed inset-0 z-[500]">
          {/* Full-screen backdrop */}
          <div
            className={`absolute inset-0 pointer-events-auto ${isFilterClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'} bg-black/40 backdrop-blur-sm`}
            onClick={closeFilterDrawer}
          />
          {/* Drawer panel */}
          <div className={`absolute right-0 inset-y-0 w-full max-w-[480px] pointer-events-auto bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col border-l border-gray-200/50 dark:border-white/10 ${isFilterClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">设置筛选条件</h3>
                <button onClick={closeFilterDrawer} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 transition">
                    <X className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4 mb-8">
                    {advancedFilters.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                            <p className="text-sm text-gray-400">暂无筛选条件，点击下方按钮添加</p>
                        </div>
                    )}
                    {advancedFilters.map((filter) => {
                        const isMultiCheckbox = multiCheckboxFields.includes(filter.fieldId);
                        const isPersonPicker = personPickerFields.includes(filter.fieldId);
                        const isDateFilter = dateFilterFields.includes(filter.fieldId);
                        const isAmountFilter = amountFilterFields.includes(filter.fieldId);
                        const selectedArr = Array.isArray(filter.value) ? filter.value as string[] : [];
                        const amountVal = (filter.value && typeof filter.value === 'object' && 'min' in filter.value) ? filter.value as { min: string; max: string } : { min: '', max: '' };
                        const checkboxOpts = getCheckboxOptions(filter.fieldId);
                        const fieldLabel = availableFilterFields.find(f => f.id === filter.fieldId)?.label || '选择字段';
                        const isFieldOpen = activeDropdown?.filterId === filter.id && activeDropdown.type === 'field';
                        const isModeOpen = activeDropdown?.filterId === filter.id && activeDropdown.type === 'mode';
                        const isValueOpen = activeDropdown?.filterId === filter.id && activeDropdown.type === 'value';
                        const bmIds = isPersonPicker ? [...new Set(orders.filter(o => o.businessManagerId).map(o => o.businessManagerId as string))] : [];
                        const bmUsers = isPersonPicker ? bmIds.map(id => users.find(u => u.id === id)).filter(Boolean) as typeof users : [];
                        const selectedUser = isPersonPicker ? bmUsers.find(u => u.id === filter.value) : undefined;
                        return (
                        <div key={filter.id} className="flex items-start gap-2">
                            {/* Field */}
                            <div className="w-[120px] shrink-0">
                                <button
                                    onMouseDown={(e) => { e.stopPropagation(); toggleDropdown(e, filter.id, 'field'); }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isFieldOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                >
                                    <span className="text-gray-900 dark:text-white truncate">{fieldLabel}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 ml-1 transition-transform ${isFieldOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            {/* Mode */}
                            <div className="w-[64px] shrink-0">
                                {(isMultiCheckbox || isPersonPicker || isAmountFilter) ? (
                                    <div className="px-2 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-400 text-center select-none">
                                        {isMultiCheckbox ? '多选' : isPersonPicker ? '单选' : '范围'}
                                    </div>
                                ) : (
                                    <button
                                        onMouseDown={(e) => { e.stopPropagation(); toggleDropdown(e, filter.id, 'mode'); }}
                                        className={`w-full flex items-center justify-between px-2 py-2.5 text-xs bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isModeOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        <span className="text-gray-900 dark:text-white truncate">{filter.mode}</span>
                                        <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 ml-0.5 transition-transform ${isModeOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                            </div>
                            {/* Value */}
                            <div className="flex-1 min-w-0">
                                {isAmountFilter ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl">
                                        <span className="text-xs text-gray-400 shrink-0">¥</span>
                                        <input type="number" placeholder="最小" className="bg-transparent text-sm dark:text-white outline-none w-full min-w-0" value={amountVal.min} onChange={(e) => updateFilterCondition(filter.id, { value: { ...amountVal, min: e.target.value } })} />
                                        <span className="text-gray-300 shrink-0">—</span>
                                        <input type="number" placeholder="最大" className="bg-transparent text-sm dark:text-white outline-none w-full min-w-0" value={amountVal.max} onChange={(e) => updateFilterCondition(filter.id, { value: { ...amountVal, max: e.target.value } })} />
                                    </div>
                                ) : isDateFilter && filter.mode === '时间段' ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <input type="date" className="bg-transparent text-xs dark:text-white outline-none flex-1 min-w-0" value={(filter.value as any)?.start || ''} onChange={(e) => updateFilterCondition(filter.id, { value: { ...(filter.value as any), start: e.target.value } })} />
                                        <span className="text-gray-300 shrink-0">—</span>
                                        <input type="date" className="bg-transparent text-xs dark:text-white outline-none flex-1 min-w-0" value={(filter.value as any)?.end || ''} onChange={(e) => updateFilterCondition(filter.id, { value: { ...(filter.value as any), end: e.target.value } })} />
                                    </div>
                                ) : isDateFilter && filter.mode === '时间点' ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <input type="date" className="bg-transparent text-sm dark:text-white outline-none w-full" value={typeof filter.value === 'string' ? filter.value : ''} onChange={(e) => updateFilterCondition(filter.id, { value: e.target.value })} />
                                    </div>
                                ) : (isMultiCheckbox || isPersonPicker) ? (
                                    <button
                                        onMouseDown={(e) => { e.stopPropagation(); toggleDropdown(e, filter.id, 'value'); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isValueOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        {isPersonPicker ? (
                                            selectedUser ? (
                                                <span className="flex items-center gap-2 truncate">
                                                    <img src={selectedUser.avatar} className="w-5 h-5 rounded-full shrink-0" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=0071E3&color=fff&size=40`; }} />
                                                    <span className="text-gray-700 dark:text-gray-200 truncate">{selectedUser.name}</span>
                                                </span>
                                            ) : <span className="text-gray-400">点击选择…</span>
                                        ) : (
                                            <span className={`truncate ${selectedArr.length === 0 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {selectedArr.length === 0 ? '点击选择…' : selectedArr.map(v => checkboxOpts.find(o => o.value === v)?.label || v).join('、')}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 shrink-0 ml-2">
                                            {isMultiCheckbox && selectedArr.length > 0 && (
                                                <span className="unified-button-primary text-[10px] bg-[#0071E3] w-5 h-5">{selectedArr.length}</span>
                                            )}
                                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isValueOpen ? 'rotate-180' : ''}`} />
                                        </span>
                                    </button>
                                ) : (
                                    <button
                                        onMouseDown={(e) => { e.stopPropagation(); toggleDropdown(e, filter.id, 'value'); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isValueOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        <span className="text-gray-900 dark:text-white truncate">{filter.value as string || '全部'}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 ml-2 transition-transform ${isValueOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                            </div>
                            {/* Delete */}
                            <button onClick={() => removeFilterCondition(filter.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        );
                    })}
                </div>

                <button 
                    onClick={addFilterCondition}
                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl"
                >
                    <Plus className="w-4 h-4" />
                    添加筛选条件
                </button>
            </div>

            <div className="p-5 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={clearAdvancedFilters} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all">重置</button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={closeFilterDrawer} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">取消</button>
                    <button onClick={applyFilters} className="unified-button-primary bg-[#0071E3] shadow-blue-500/25">查询</button>
                </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Unified filter dropdown — rendered via portal to escape any ancestor transform/overflow */}
      {activeDropdown && (() => {
          const f = advancedFilters.find(x => x.id === activeDropdown.filterId);
          if (!f) return null;
          const isMultiCheckbox = multiCheckboxFields.includes(f.fieldId);
          const isPersonPicker = personPickerFields.includes(f.fieldId);
          const baseStyle: React.CSSProperties = { position: 'fixed', zIndex: 9999, top: activeDropdown.top, left: activeDropdown.left, width: activeDropdown.width };
          const baseClass = "bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden";

          let content: React.ReactNode = null;

          if (activeDropdown.type === 'field') {
              content = (
                  <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                      <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                          {availableFilterFields.map(field => {
                              const isSelected = f.fieldId === field.id;
                              const isUsed = advancedFilters.some(af => af.id !== f.id && af.fieldId === field.id);
                              return (
                                  <button key={field.id} disabled={isUsed} onMouseDown={(e) => { e.stopPropagation(); if (!isUsed) { updateFilterCondition(f.id, { fieldId: field.id, mode: field.defaultMode, value: initValueForField(field.id, field.defaultMode) }); setActiveDropdown(null); } }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${isUsed ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                      <span className="truncate">{field.label}</span>
                                      {isSelected && <CheckCircle className="w-4 h-4 text-[#0071E3] shrink-0" />}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              );
          } else if (activeDropdown.type === 'mode') {
              const modeOpts = dateFilterFields.includes(f.fieldId)
                  ? [{ value: '时间段', label: '时间段' }, { value: '时间点', label: '时间点' }]
                  : [{ value: '单选', label: '单选' }, { value: '多选', label: '多选' }];
              content = (
                  <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                      <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                          {modeOpts.map(opt => {
                              const isSelected = f.mode === opt.value;
                              return (
                                  <button key={opt.value} onMouseDown={(e) => { e.stopPropagation(); const newMode = opt.value as FilterMode; updateFilterCondition(f.id, { mode: newMode, value: newMode === '时间段' ? { start: '', end: '' } : newMode === '时间点' ? '' : initValueForField(f.fieldId, newMode) }); setActiveDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                      <span>{opt.label}</span>
                                      {isSelected && <CheckCircle className="w-4 h-4 text-[#0071E3] shrink-0" />}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              );
          } else if (activeDropdown.type === 'value') {
              if (isMultiCheckbox) {
                  const opts = getCheckboxOptions(f.fieldId);
                  const selectedArr = Array.isArray(f.value) ? f.value as string[] : [];
                  content = (
                      <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                          <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500">选择筛选值</span>
                              {selectedArr.length > 0 && <button onMouseDown={(e) => { e.stopPropagation(); updateFilterCondition(f.id, { value: [] }); }} className="text-xs text-gray-400 hover:text-red-500 transition">清除</button>}
                          </div>
                          <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                              {opts.map(opt => {
                                  const checked = selectedArr.includes(opt.value);
                                  return (
                                      <button key={opt.value} onMouseDown={(e) => { e.stopPropagation(); toggleMultiValue(f.id, opt.value); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${checked ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${checked ? 'bg-[#0071E3] border-[#0071E3]' : 'border-gray-300 dark:border-gray-500'}`}>
                                              {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                          </span>
                                          {opt.label}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  );
              } else if (isPersonPicker) {
                  const bmIds = [...new Set(orders.filter(o => o.businessManagerId).map(o => o.businessManagerId as string))];
                  const bmUsers = bmIds.map(id => users.find(u => u.id === id)).filter(Boolean) as typeof users;
                  content = (
                      <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                          <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500">选择商务</span>
                              {f.value && f.value !== '全部' && <button onMouseDown={(e) => { e.stopPropagation(); updateFilterCondition(f.id, { value: '全部' }); }} className="text-xs text-gray-400 hover:text-red-500 transition">清除</button>}
                          </div>
                          <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                              {bmUsers.map(user => {
                                  const checked = f.value === user.id;
                                  return (
                                      <button key={user.id} onMouseDown={(e) => { e.stopPropagation(); updateFilterCondition(f.id, { value: checked ? '全部' : user.id }); setActiveDropdown(null); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${checked ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                          <img src={user.avatar} className="w-6 h-6 rounded-full shrink-0" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0071E3&color=fff&size=40`; }} />
                                          <span className={`flex-1 text-left truncate ${checked ? 'text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200'}`}>{user.name}</span>
                                          {checked && <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3] shrink-0" />}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  );
              } else {
                  content = (
                      <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                          <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                              {[{ value: '全部', label: '全部' }, { value: '不限', label: '不限' }].map(opt => {
                                  const isSelected = f.value === opt.value;
                                  return (
                                      <button key={opt.value} onMouseDown={(e) => { e.stopPropagation(); updateFilterCondition(f.id, { value: opt.value }); setActiveDropdown(null); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                          <span>{opt.label}</span>
                                          {isSelected && <CheckCircle className="w-4 h-4 text-[#0071E3] shrink-0" />}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  );
              }
          }

          return content ? ReactDOM.createPortal(content, document.body) : null;
      })()}

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
        onClose={() => { setIsCreateOpen(false); setRenewalOrder(undefined); }}
        renewalOrder={renewalOrder}
      />

      {/* User Details Drawer */}
      {isDrawerOpen && detailsUser && (
        <ModalPortal>
        <div className="fixed inset-0 z-[500] flex justify-end">
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${isDrawerClosing ? 'animate-backdrop-exit' : 'animate-backdrop-enter'}`} onClick={closeDrawer}></div>
          <div className={`relative w-full max-w-md bg-white dark:bg-[#1C1C1E] shadow-2xl flex flex-col h-full border-l border-white/10 ${isDrawerClosing ? 'animate-drawer-exit' : 'animate-drawer-enter'}`}>
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">用户详情</h3>
                <button onClick={closeDrawer} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400 transition">
                    <X className="w-5 h-5"/>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative group">
                        <img 
                            src={detailsUser.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${detailsUser.name}`} 
                            className="w-24 h-24 rounded-full object-cover bg-gray-100 border-4 border-white dark:border-[#2C2C2E] shadow-xl" 
                            alt={detailsUser.name}
                            onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-[#2C2C2E] shadow-xl" style={{ display: 'none' }}>
                            {detailsUser.name.replace(/\s*\(.*\)\s*$/, '').slice(0, 1)}
                        </div>
                        {detailsUser.monthBadge && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-2 ring-white dark:ring-[#2C2C2E]">{detailsUser.monthBadge}</span>
                        )}
                        <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#1C1C1E] ${detailsUser.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{detailsUser.name}</h4>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold border border-gray-200 dark:border-white/20">{detailsUser.userType}</span>
                    </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-white/10">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">账号 ID</div>
                            <div className="text-sm font-mono text-gray-900 dark:text-white">{detailsUser.accountId}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">当前状态</div>
                            <div className={`text-sm font-bold ${detailsUser.status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>{detailsUser.status}</div>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">所属部门</div>
                            <div className="text-sm text-gray-900 dark:text-white">{getDepartmentPath(detailsUser.departmentId)}</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/10">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5"/> 权限概览
                    </h5>
                    <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            该用户拥有 <span className="text-blue-600 font-bold">{detailsUser.role}</span> 角色对应的功能权限。
                            数据权限受限于所属部门 <span className="text-gray-900 dark:text-white font-medium">{getDepartmentPath(detailsUser.departmentId)}</span> 及其下属机构。
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex gap-3">
                <button onClick={closeDrawer} className="flex-1 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 transition">关闭</button>
                <button 
                  onClick={() => {
                    closeDrawer();
                    navigate('/users', { state: { search: detailsUser.accountId } });
                  }}
                  className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-80 transition flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4"/> 管理账号
                </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default OrderManager;
