
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, Product, Customer, OrderItem, ActivationMethod, User, Department } from '../types';
import { Search, Eye, User as UserIcon, Plus, Trash2, MapPin, Building2, Briefcase, ChevronRight } from 'lucide-react';

interface OrderManagerProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  customers: Customer[];
  currentUser: User;
  users: User[];
  departments: Department[];
}

const OrderManager: React.FC<OrderManagerProps> = ({ orders, setOrders, products, customers, currentUser, users, departments }) => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Create Order State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  
  const [businessManagerId, setBusinessManagerId] = useState('');
  const [salesRepId, setSalesRepId] = useState('');
  
  const [tempProductId, setTempProductId] = useState('');
  const [tempSkuId, setTempSkuId] = useState('');
  const [tempPackageId, setTempPackageId] = useState(''); 
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempActivationMethod, setTempActivationMethod] = useState<ActivationMethod>('LicenseKey');

  const availableProducts = products.filter(p => p.status === 'OnShelf');
  const selectedProduct = availableProducts.find(p => p.id === tempProductId);
  const salesUsers = users.filter(u => u.role === 'Sales' || u.role === 'Admin');
  const businessUsers = users.filter(u => u.role === 'Business' || u.role === 'Admin');
  const canCreateOrder = currentUser.role === 'Admin' || currentUser.role === 'Sales';

  const getDepartmentPath = (deptId?: string) => {
       if (!deptId) return '';
      const path: string[] = [];
      let current = departments.find(d => d.id === deptId);
      const visited = new Set<string>();
      while (current && !visited.has(current.id)) {
          visited.add(current.id);
          path.unshift(current.name);
          if (current.parentId && current.parentId !== current.id) {
            current = departments.find(d => d.id === current.parentId);
          } else {
            current = undefined;
          }
      }
      return path.join(' / ');
  };

  const getStatusBadge = (status: OrderStatus) => {
    let color = '';
    switch (status) {
      case OrderStatus.PENDING_PAYMENT: color = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'; break;
      case OrderStatus.PENDING_APPROVAL: color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'; break;
      case OrderStatus.PENDING_CONFIRM: color = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'; break;
      case OrderStatus.PROCESSING_PROD: color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'; break;
      case OrderStatus.SHIPPED: color = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'; break;
      case OrderStatus.DELIVERED: color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'; break;
      case OrderStatus.CANCELLED: color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'; break;
      default: color = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
    return <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${color}`}>{status}</span>;
  };

  const handleAddItem = () => {
    if (!tempProductId || !tempSkuId || tempQuantity <= 0) return;
    const product = products.find(p => p.id === tempProductId);
    if (!product) return;
    const sku = product.skus.find(s => s.id === tempSkuId);
    if (!sku) return;
    let packageName = undefined;
    if (tempPackageId) {
        const pkg = product.installPackages?.find(p => p.id === tempPackageId);
        if (pkg) {
            packageName = pkg.name;
            if (pkg.version) packageName += ` (${pkg.version})`;
        }
    }
    const newItem: OrderItem = {
      productId: product.id, productName: product.name, skuId: sku.id, skuCode: sku.code, skuName: sku.name,
      quantity: tempQuantity, priceAtPurchase: sku.price, installPackageName: packageName, activationMethod: tempActivationMethod
    };
    setNewOrderItems([...newOrderItems, newItem]);
    setTempProductId(''); setTempSkuId(''); setTempPackageId(''); setTempQuantity(1); setTempActivationMethod('LicenseKey');
  };
  const handleRemoveItem = (index: number) => setNewOrderItems(prev => prev.filter((_, i) => i !== index));
  const calculateNewOrderTotal = () => newOrderItems.reduce((acc, item) => acc + (item.priceAtPurchase * item.quantity), 0);
  const handleCustomerChange = (customerId: string) => {
      setNewOrderCustomer(customerId);
      const customer = customers.find(c => c.id === customerId);
      if (customer && customer.ownerId) setSalesRepId(customer.ownerId); else setSalesRepId('');
  };
  const handleCreateOrder = () => {
    if (!newOrderCustomer || newOrderItems.length === 0) return;
    const customer = customers.find(c => c.id === newOrderCustomer);
    const salesUser = users.find(u => u.id === salesRepId);
    const businessUser = users.find(u => u.id === businessManagerId);
    let salesDeptId = undefined, salesDeptName = undefined;
    if (salesUser && salesUser.departmentId) {
        const dept = departments.find(d => d.id === salesUser.departmentId);
        if (dept) { salesDeptId = dept.id; salesDeptName = dept.name; }
    }
    const maxId = orders.reduce((max, o) => {
        const numStr = o.id.substring(1); 
        const num = parseInt(numStr, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `S${(maxId + 1).toString().padStart(8, '0')}`;
    const newOrder: Order = {
        id: newId, customerId: newOrderCustomer, customerName: customer ? customer.companyName : '未知客户', date: new Date().toISOString(),
        status: OrderStatus.PENDING_PAYMENT, total: calculateNewOrderTotal(), items: newOrderItems, shippingAddress: customer ? customer.address : '',
        isPaid: false, isPackageConfirmed: false, isCDBurned: false, approval: { salesApproved: false, businessApproved: false, financeApproved: false },
        approvalRecords: [], salesRepId: salesRepId, salesRepName: salesUser?.name, salesDepartmentId: salesDeptId, salesDepartmentName: salesDeptName,
        businessManagerId: businessManagerId, businessManagerName: businessUser?.name
    };
    setOrders([newOrder, ...orders]); setIsCreateOpen(false); setNewOrderCustomer(''); setNewOrderItems([]); setCurrentPage(1); navigate(`/orders/${newOrder.id}`);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);
  React.useEffect(() => setCurrentPage(1), [filterStatus, searchTerm]);


  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">订单管理</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理系统中的所有销售订单及交付流程。</p>
        </div>
        
        {canCreateOrder && (
            <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#0071E3] dark:bg-[#FF2D55] text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition shadow-lg text-sm font-medium"
            >
                <Plus className="w-4 h-4" /> 新建订单
            </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="搜索订单号或客户..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
          {['All', ...Object.values(OrderStatus)].map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200
                ${filterStatus === status 
                    ? 'bg-[#0071E3] dark:bg-[#FF2D55] text-white shadow-md' 
                    : 'bg-white dark:bg-[#1C1C1E] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-white/10'
                }`}
            >
              {status === 'All' ? '全部订单' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Table List */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-apple border border-gray-100/50 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-400 dark:text-gray-500 font-medium text-xs uppercase tracking-wider border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="p-5 pl-8">订单号</th>
                <th className="p-5">客户</th>
                <th className="p-5">归属</th>
                <th className="p-5">日期</th>
                <th className="p-5">状态</th>
                <th className="p-5 text-right">总金额</th>
                <th className="p-5 pr-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {currentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition cursor-pointer group" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td className="p-5 pl-8 font-semibold text-gray-900 dark:text-white text-sm">{order.id}</td>
                  <td className="p-5">
                    <div className="font-medium text-gray-900 dark:text-gray-200 text-sm">{order.customerName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3"/> {customers.find(c => c.id === order.customerId)?.region || '区域未知'}
                    </div>
                  </td>
                  <td className="p-5 text-sm">
                      <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-gray-900 dark:text-gray-300 font-medium text-xs">
                              <UserIcon className="w-3 h-3 text-blue-500"/> {order.salesRepName || '-'}
                          </span>
                          {order.salesDepartmentId && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 truncate max-w-[150px]" title={getDepartmentPath(order.salesDepartmentId)}>
                                 <Building2 className="w-3 h-3"/> {getDepartmentPath(order.salesDepartmentId)}
                              </span>
                          )}
                      </div>
                  </td>
                  <td className="p-5 text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(order.date).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="p-5">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="p-5 text-right font-bold text-gray-900 dark:text-white text-sm">
                    ¥{order.total.toLocaleString()}
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-[#FF2D55] transition" />
                  </td>
                </tr>
              ))}
              {currentOrders.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400">暂无订单数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex justify-between items-center p-5 border-t border-gray-100/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium shadow-sm transition"
                >
                    上一页
                </button>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    第 {currentPage} 页 / 共 {totalPages} 页
                </div>
                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium shadow-sm transition"
                >
                    下一页
                </button>
            </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-enter border border-white/10">
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">新建订单</h3>
                    <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition"><Trash2 className="w-5 h-5 rotate-45" /></button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">选择客户</label>
                        <div className="relative">
                             <select 
                                value={newOrderCustomer}
                                onChange={(e) => handleCustomerChange(e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500/20"
                             >
                                 <option value="">-- 请选择 --</option>
                                 {customers.map(c => (
                                     <option key={c.id} value={c.id}>{c.companyName}</option>
                                 ))}
                             </select>
                        </div>
                    </div>
                    
                     {/* Items Section */}
                     <div className="bg-gray-50 dark:bg-black/40 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <select value={tempProductId} onChange={(e) => { setTempProductId(e.target.value); setTempSkuId(''); }} className="p-3 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white">
                                <option value="">选择产品...</option>
                                {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select value={tempSkuId} onChange={e => setTempSkuId(e.target.value)} disabled={!selectedProduct} className="p-3 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white disabled:opacity-50">
                                <option value="">选择规格...</option>
                                {selectedProduct?.skus.map(s => <option key={s.id} value={s.id}>{s.name} - ¥{s.price}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                             <input type="number" min="1" value={tempQuantity} onChange={e => setTempQuantity(parseInt(e.target.value))} className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white" />
                             <button onClick={handleAddItem} disabled={!tempProductId} className="col-span-2 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-xl font-medium shadow-lg hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition disabled:opacity-50">添加</button>
                        </div>
                        
                        {/* List */}
                        {newOrderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-white/10 mb-2 shadow-sm">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.productName} - {item.skuName}</div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">x{item.quantity}</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">¥{(item.priceAtPurchase * item.quantity).toLocaleString()}</div>
                                    <button onClick={() => handleRemoveItem(idx)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-black/40">
                    <button onClick={() => setIsCreateOpen(false)} className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full font-medium transition">取消</button>
                    <button onClick={handleCreateOrder} disabled={!newOrderCustomer || newOrderItems.length === 0} className="px-8 py-3 bg-[#0071E3] dark:bg-[#FF2D55] text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#FF2D55]/80 transition font-medium shadow-lg disabled:opacity-50">
                        立即创建
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
