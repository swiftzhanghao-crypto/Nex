
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Menu, X, ChevronDown, Shield, Building2, Network, Target, Moon, Sun, Settings, Activity, Maximize, Minimize, PanelLeftClose, PanelLeftOpen, Layers, BarChart3, PieChart, Contact2, Zap, FileText, ArrowUpCircle, Database, Link as LinkIcon, Settings2, Monitor, LayoutList, BookOpen, FileBadge, Banknote, Receipt, TrendingUp, KeyRound, PackageCheck, ListTree, HardDriveDownload, FileKey, SlidersHorizontal, Tag, MessageSquarePlus, Send, Star, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import manualContent from '../../docs/产品说明文档.md?raw';
import { useAppContext } from '../../contexts/AppContext';
import WPSLogo from '../common/WPSLogo';

interface LayoutProps {
  children: React.ReactNode;
}

interface PageTab {
  id: string;
  title: string;
  path: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, users, setCurrentUser, roles } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTopNav, setActiveTopNav] = useState<'DASHBOARD' | 'ORDER_CENTER' | 'PRODUCT_CENTER' | 'PERFORMANCE_CENTER' | 'CHANNEL_CENTER' | 'LEADS_CENTER' | 'OPERATIONS_CENTER' | 'SYSTEM_CONFIG'>('DASHBOARD');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Tab Bar ────────────────────────────────────────────────
  const [tabs, setTabs] = useState<PageTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  const getTabTitle = (pathname: string): string => {
    const staticMap: Record<string, string> = {
      '/': '数据看板',
      '/orders': '订单管理',
      '/customers': '客户信息',
      '/opportunities': '商机信息',
      '/contracts': '合同信息',
      '/remittances': '汇款管理',
      '/invoices': '发票管理',
      '/authorizations': '授权信息',
      '/delivery-info': '交付信息',
      '/products': '产品列表',
      '/product-center': '产品目录',
      '/product-manage/component-pool': '组件池',
      '/product-manage/packages': '安装包管理',
      '/product-manage/license-templates': '产品授权模板',
      '/product-manage/attr-config': '属性配置',
      '/performance': '业绩管理',
      '/channels': '渠道管理',
      '/leads': '线索中心',
      '/wps-ops': '运营中心',
      '/ops/dashboard': '指标看板',
      '/ops/enterprise': '企业管理',
      '/organization': '组织架构',
      '/users': '用户管理',
      '/roles': '角色管理',
      '/merchandises': '商品管理',
      '/product-pricing/msrp': '建议售价',
      '/product-pricing/channel': '渠道价格',
    };
    if (staticMap[pathname]) return staticMap[pathname];
    const m = pathname.match(/^\/orders\/(.+)$/);
    if (m) return `订单 ${m[1]}`;
    const c = pathname.match(/^\/customers\/(.+)$/);
    if (c) return `客户详情`;
    const ch = pathname.match(/^\/channels\/(.+)$/);
    if (ch) return `渠道详情`;
    return '页面';
  };

  useEffect(() => {
    const path = location.pathname;
    const title = getTabTitle(path);
    setTabs(prev => {
      if (prev.find(t => t.id === path)) return prev;
      return [...prev, { id: path, title, path }];
    });
    setActiveTabId(path);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const closeTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const idx = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (tabId === activeTabId) {
      if (newTabs.length > 0) {
        const next = newTabs[Math.max(0, idx - 1)];
        navigate(next.path);
      } else {
        navigate('/');
      }
    }
  };
  // ── End Tab Bar ────────────────────────────────────────────

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const resetFeedback = () => {
    setFeedbackType('bug');
    setFeedbackRating(0);
    setFeedbackTitle('');
    setFeedbackContent('');
    setFeedbackContact('');
    setFeedbackSubmitted(false);
  };
  const handleFeedbackSubmit = () => {
    if (!feedbackTitle.trim() || !feedbackContent.trim()) return;
    console.log('Feedback submitted:', { type: feedbackType, rating: feedbackRating, title: feedbackTitle, content: feedbackContent, contact: feedbackContact, user: currentUser.name });
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setIsFeedbackOpen(false);
      setTimeout(resetFeedback, 300);
    }, 2000);
  };

  const hideSidebar = false;

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname.startsWith('/dashboard')) {
        setActiveTopNav('DASHBOARD');
    } else if (location.pathname.startsWith('/leads')) {
        setActiveTopNav('LEADS_CENTER');
    } else if (location.pathname.startsWith('/wps-ops') || location.pathname.startsWith('/ops')) {
        setActiveTopNav('OPERATIONS_CENTER');
    } else if (location.pathname.startsWith('/channels')) {
        setActiveTopNav('CHANNEL_CENTER');
    } else if (location.pathname.startsWith('/customers') || location.pathname.startsWith('/opportunities') || location.pathname.startsWith('/contracts') || location.pathname.startsWith('/remittances') || location.pathname.startsWith('/invoices') || location.pathname.startsWith('/authorizations') || location.pathname.startsWith('/delivery-info')) {
        setActiveTopNav('ORDER_CENTER');
    } else if (location.pathname.startsWith('/organization') || location.pathname.startsWith('/users') || location.pathname.startsWith('/roles')) {
          setActiveTopNav('SYSTEM_CONFIG');
      } else if (location.pathname.startsWith('/products') || location.pathname.startsWith('/merchandises') || location.pathname.startsWith('/catalog') || location.pathname.startsWith('/product-center') || location.pathname.startsWith('/product-pricing') || location.pathname.startsWith('/product-manage')) {
          setActiveTopNav('PRODUCT_CENTER');
      } else if (location.pathname.startsWith('/performance')) {
          setActiveTopNav('PERFORMANCE_CENTER');
      } else {
          setActiveTopNav('ORDER_CENTER');
      }
    if (/^\/orders\/[^/]+$/.test(location.pathname)) {
        setIsCollapsed(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const currentUserRole = roles.find(r => r.id === currentUser.role);
  const permissions = currentUserRole?.permissions || [];
  const hasPermission = (perm: string) => permissions.includes('all') || permissions.includes(perm);

  const renderSectionGroup = (id: string, label: string, children: React.ReactNode, requiredPermissions?: string[]) => {
    if (requiredPermissions && requiredPermissions.length > 0 && !requiredPermissions.some(p => hasPermission(p))) return null;
    const isOpen = !collapsedSections[id];
    return (
      <div key={id} className="mb-1">
        {!isCollapsed && (
          <button
            onClick={() => toggleSection(id)}
            className="flex items-center justify-between w-full px-4 py-1.5 mt-3 mb-0.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</span>
            <ChevronDown className={`w-3 h-3 text-gray-300 dark:text-gray-600 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        )}
        {(isOpen || isCollapsed) && <div className="space-y-0.5">{children}</div>}
      </div>
    );
  };

  const topNavItems = [
      { id: 'DASHBOARD', label: '数据看板', path: '/', permissions: ['dashboard_view'] },
      { id: 'ORDER_CENTER', label: '订单中心', path: '/orders', permissions: ['order_list_view', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'contract_view', 'remittance_view', 'invoice_manage', 'authorization_view', 'delivery_info_view'] },
      { id: 'PRODUCT_CENTER', label: '产品中心', path: '/product-center', permissions: ['product_display_view', 'product_display_preview', 'product_view', 'merchandise_view', 'product_msrp_view', 'product_channel_price_view', 'product_component_pool_view', 'product_package_view', 'product_license_template_view', 'product_attr_config_view'] },
      { id: 'PERFORMANCE_CENTER', label: '业绩中心', path: '/performance', permissions: ['performance_view'] },
      { id: 'CHANNEL_CENTER', label: '渠道中心', path: '/channels', permissions: ['channel_view'] },
      { id: 'LEADS_CENTER', label: '线索中心', path: '/leads', permissions: ['leads_view'] },
      { id: 'OPERATIONS_CENTER', label: '运营中心', path: '/wps-ops', permissions: ['wps_ops_view'] },
      { id: 'SYSTEM_CONFIG', label: '系统配置', path: '/organization', permissions: ['admin_view', 'user_manage', 'role_manage', 'org_manage'] }
  ].filter(item => item.permissions.some(p => hasPermission(p)));

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const NavItem = ({ to, icon: Icon, label, alsoMatch, permission }: { to: string; icon: React.ElementType; label: string; alsoMatch?: string[]; permission?: string }) => {
    if (permission && !hasPermission(permission)) return null;
    const isActive = location.pathname === to
      || (to !== '/' && location.pathname.startsWith(to))
      || (alsoMatch?.some(p => location.pathname.startsWith(p)) ?? false);
    return (
      <Link 
        to={to} 
        title={isCollapsed ? label : ''}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm group relative
          ${isActive 
            ? 'bg-[#0071E3] text-white shadow-lg shadow-blue-500/30' 
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'
          }
          ${isCollapsed ? 'justify-center lg:px-2' : ''}
        `}
        onClick={() => setIsSidebarOpen(false)}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors'} shrink-0`} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'lg:w-0 lg:opacity-0 lg:hidden' : 'w-auto opacity-100'}`}>
            {label}
        </span>
      </Link>
    );
  };

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[#F5F5F7] dark:bg-black transition-colors duration-300 selection:bg-blue-500/30">
      
      {/* Top Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 z-30 sticky top-0 bg-white border-b border-gray-200/50 dark:bg-[#1C1C1E] dark:border-white/10 transition-all">
          <div className="flex items-center gap-6">
              {/* Logo Area */}
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full p-2 transition">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
                    <WPSLogo className="h-[18px] w-auto group-hover:scale-105 transition-transform duration-300" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">业务平台</span>
                </div>
              </div>

              {/* Desktop Tabs */}
              <nav className="hidden md:flex items-center gap-1 ml-6">
                  {topNavItems.map((item) => (
                      <button 
                          key={item.id}
                          onClick={() => navigate(item.path)}
                          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              activeTopNav === item.id 
                              ? 'bg-[#0071E3] text-white shadow-apple shadow-blue-500/20' 
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10'
                          }`}
                      >
                          {item.label}
                      </button>
                  ))}
              </nav>
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={toggleFullScreen}
                className="hidden sm:block p-2 text-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                title={isFullScreen ? "退出全屏" : "全屏模式"}
            >
                {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

             <button 
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-amber-500 dark:text-gray-400 dark:hover:text-yellow-400 transition rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
            >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsManualOpen(true)}
              className="p-2 text-gray-400 hover:text-[#0071E3] dark:text-gray-400 dark:hover:text-blue-400 transition rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              title="产品使用说明手册"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            
            <div className="relative pl-2 border-l border-gray-200 dark:border-white/10 ml-1">
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 py-1 px-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
                >
                    <div className="relative">
                        <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            className="w-8 h-8 rounded-full object-cover shadow-apple border border-gray-200 dark:border-white/10"
                        />
                        {currentUser.monthBadge && (
                            <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[7px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{currentUser.monthBadge}</span>
                        )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                    <div className="unified-card absolute right-0 top-full mt-3 w-64 /90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl border-gray-200/50 dark:border-white/10 p-2 z-50 animate-modal-enter origin-top-right">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">切换账号</div>
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        setCurrentUser(user);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition text-left mb-1
                                        ${currentUser.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
                                    `}
                                >
                                    <div className="relative flex-shrink-0">
                                        <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />
                                        {user.monthBadge && (
                                            <span className="absolute -bottom-0.5 -right-1 px-0.5 py-px text-[6px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xs font-medium truncate ${currentUser.id === user.id ? 'text-[#0071E3] dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{user.name}</div>
                                    </div>
                                    {currentUser.id === user.id && <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          {!hideSidebar && (
            <aside className={`absolute inset-y-0 left-4 top-4 bottom-4 z-40 transform transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] lg:relative lg:translate-x-0 lg:top-0 lg:bottom-0 lg:left-0 lg:pt-2 lg:pb-2 lg:pl-2 lg:pr-3
              ${isSidebarOpen ? 'translate-x-0 w-[240px]' : '-translate-x-[110%] lg:translate-x-0'}
              ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[240px]'}
              flex flex-col gap-1
            `}>
              {/* Sidebar visual container */}
              <div className="unified-card w-full h-full /60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border-gray-200/50 dark:border-white/10 flex flex-col">
                  
                  {/* Mobile Sidebar Header */}
                  <div className="lg:hidden h-14 flex items-center justify-between px-5 border-b border-gray-100 dark:border-white/5 shrink-0">
                      <span className="font-bold text-gray-900 dark:text-white">菜单</span>
                      <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Desktop Sidebar Header - Top */}
                  <div className={`px-3 py-3 border-b border-gray-100 dark:border-white/5 shrink-0 hidden lg:flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                      {!isCollapsed && (
                          <span className="text-base font-bold text-gray-800 dark:text-gray-100 pl-3 truncate">
                              {topNavItems.find(item => item.id === activeTopNav)?.label ?? '菜单'}
                          </span>
                      )}
                      <button 
                          onClick={() => setIsCollapsed(!isCollapsed)} 
                          className="flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl p-2 transition-all duration-300 shrink-0"
                          title={isCollapsed ? '展开菜单' : '收起菜单'}
                      >
                          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                      </button>
                  </div>

                  <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar">

                    {activeTopNav === 'DASHBOARD' && (
                      <>
                        {renderSectionGroup('dash_main', '数据看板',
                          <NavItem to="/" icon={LayoutDashboard} label="数据看板" />
                        )}
                      </>
                    )}

                    {activeTopNav === 'ORDER_CENTER' && (
                      <>
                        {renderSectionGroup('order_main', '订单中心',
                          <>
                            <NavItem to="/orders" icon={ShoppingCart} label="订单管理" />
                            <NavItem to="/remittances" icon={Banknote} label="汇款管理" permission="remittance_view" />
                            <NavItem to="/invoices" icon={Receipt} label="发票管理" permission="invoice_manage" />
                          </>,
                          ['order_list_view', 'order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_pkg', 'order_view_stock_ship', 'order_view_stock_cd', 'order_view_payment', 'order_view_shipped', 'order_view_completed', 'remittance_view', 'invoice_manage']
                        )}
                        {renderSectionGroup('order_fulfillment', '履约信息',
                          <>
                            <NavItem to="/contracts" icon={FileBadge} label="合同信息" permission="contract_view" />
                            <NavItem to="/authorizations" icon={KeyRound} label="授权信息" permission="authorization_view" />
                            <NavItem to="/delivery-info" icon={PackageCheck} label="交付信息" permission="delivery_info_view" />
                          </>,
                          ['contract_view', 'authorization_view', 'delivery_info_view']
                        )}
                        {renderSectionGroup('crm_info', 'CRM 信息',
                          <>
                            <NavItem to="/customers" icon={Users} label="客户信息" permission="customer_view" />
                            <NavItem to="/opportunities" icon={Target} label="商机信息" permission="opportunity_manage" />
                          </>,
                          ['customer_view', 'opportunity_manage']
                        )}
                      </>
                    )}

                    {activeTopNav === 'LEADS_CENTER' && (
                      <>
                        {renderSectionGroup('leads_main', '线索管理',
                          <NavItem to="/leads" icon={Target} label="线索列表" />
                        )}
                      </>
                    )}

                    {activeTopNav === 'PRODUCT_CENTER' && (
                      <>
                        {renderSectionGroup('product_catalog', '产品目录',
                          <>
                            <NavItem to="/product-center" icon={Layers} label="产品目录" alsoMatch={['/catalog']} permission="product_display_view" />
                          </>,
                          ['product_display_view', 'product_display_preview']
                        )}
                        {renderSectionGroup('product_manage', '产品管理',
                          <>
                            <NavItem to="/products" icon={Package} label="产品列表" permission="product_view" />
                            <NavItem to="/product-manage/component-pool" icon={ListTree} label="组件池" permission="product_component_pool_view" />
                            <NavItem to="/product-manage/packages" icon={HardDriveDownload} label="安装包管理" permission="product_package_view" />
                            <NavItem to="/product-manage/license-templates" icon={FileKey} label="产品授权模板" permission="product_license_template_view" />
                            <NavItem to="/product-manage/attr-config" icon={SlidersHorizontal} label="属性配置" permission="product_attr_config_view" />
                          </>,
                          ['product_view', 'merchandise_view', 'product_component_pool_view', 'product_package_view', 'product_license_template_view', 'product_attr_config_view']
                        )}
                        {renderSectionGroup('product_pricing', '产品报价',
                          <>
                            <NavItem to="/product-pricing/msrp" icon={Tag} label="建议销售价" permission="product_msrp_view" />
                            <NavItem to="/product-pricing/channel" icon={Network} label="渠道价格" permission="product_channel_price_view" />
                          </>,
                          ['product_msrp_view', 'product_channel_price_view']
                        )}
                      </>
                    )}

                    {activeTopNav === 'PERFORMANCE_CENTER' && (
                      <>
                        {renderSectionGroup('perf_main', '业绩中心',
                          <>
                            <NavItem to="/performance" icon={TrendingUp} label="业绩管理" />
                          </>
                        )}
                      </>
                    )}

                    {activeTopNav === 'CHANNEL_CENTER' && (
                      <>
                        {renderSectionGroup('channel_main', '渠道中心',
                          <>
                            <NavItem to="/channels" icon={Network} label="渠道管理" permission="channel_view" />
                          </>,
                          ['channel_view']
                        )}
                      </>
                    )}

                    {activeTopNav === 'OPERATIONS_CENTER' && (
                      <>
                        {renderSectionGroup('ops_core', '核心业务',
                          <>
                            <NavItem to="/ops/dashboard" icon={BarChart3} label="指标看板" />
                            <NavItem to="/ops/enterprise" icon={Building2} label="企业管理" />
                            <NavItem to="/ops/crm" icon={Users} label="CRM" />
                            <NavItem to="/ops/orders" icon={ShoppingCart} label="订单管理" />
                          </>
                        )}
                        {renderSectionGroup('ops_manage', '运营管理',
                          <>
                            <NavItem to="/ops/ops-mgmt" icon={Activity} label="运营管理" />
                            <NavItem to="/ops/strategy" icon={Target} label="策略管理" />
                            <NavItem to="/ops/menu-mgmt" icon={LayoutList} label="菜单管理" />
                            <NavItem to="/ops/client" icon={Monitor} label="专属客户端" />
                          </>
                        )}
                        {renderSectionGroup('ops_data', '数据与分析',
                          <>
                            <NavItem to="/ops/stats" icon={PieChart} label="数据统计" />
                            <NavItem to="/ops/portrait" icon={Contact2} label="企业画像" />
                            <NavItem to="/ops/efficiency" icon={Zap} label="效率平台" />
                          </>
                        )}
                        {renderSectionGroup('ops_system', '系统工具',
                          <>
                            <NavItem to="/ops/logs" icon={FileText} label="日志管理" />
                            <NavItem to="/ops/isolation" icon={ArrowUpCircle} label="升级隔离" />
                            <NavItem to="/ops/settings" icon={Settings} label="系统设置" />
                            <NavItem to="/ops/migration" icon={Database} label="数据迁移" />
                            <NavItem to="/ops/connector" icon={LinkIcon} label="连接器" />
                            <NavItem to="/ops/connector-admin" icon={Settings2} label="连接器管理" />
                          </>
                        )}
                      </>
                    )}

                    {activeTopNav === 'SYSTEM_CONFIG' && currentUser.role === 'Admin' && (
                      <>
                        {renderSectionGroup('system_main', '系统配置',
                          <>
                            <NavItem to="/organization" icon={Building2} label="组织架构" />
                            <NavItem to="/users" icon={Users} label="用户管理" />
                            <NavItem to="/roles" icon={Shield} label="角色管理" />
                          </>
                        )}
                      </>
                    )}

                  </nav>

              </div>
            </aside>
          )}

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Bar */}
            {tabs.length > 0 && (
              <div className="shrink-0 flex items-end bg-[#F0F0F2] dark:bg-[#111] border-b border-gray-200 dark:border-white/10 px-2 overflow-x-auto no-scrollbar" style={{ height: 36 }}>
                {tabs.map(tab => {
                  const isActive = activeTabId === tab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => navigate(tab.path)}
                      className={`group relative flex items-center gap-1.5 px-3 cursor-pointer shrink-0 select-none transition-colors duration-150 rounded-t-lg mr-0.5 ${
                        isActive
                          ? 'bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white shadow-[0_-1px_0_0_#e5e7eb] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]'
                          : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/8 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                      style={{ height: 34, maxWidth: 160 }}
                    >
                      <span className="text-xs font-medium truncate max-w-[110px] whitespace-nowrap">{tab.title}</span>
                      <button
                        onClick={(e) => closeTab(e, tab.id)}
                        className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all hover:bg-gray-200 dark:hover:bg-white/20 ${
                          isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100'
                        }`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0071E3] dark:bg-[#0A84FF] rounded-t-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <main className="flex-1 overflow-auto scroll-smooth relative custom-scrollbar p-0 lg:p-0">
                {children}
            </main>
          </div>
      </div>

      {/* Manual Panel Overlay */}
      {isManualOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          onClick={() => setIsManualOpen(false)}
        />
      )}

      {/* Manual Side Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl z-50 flex flex-col bg-white dark:bg-[#1C1C1E] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isManualOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#0071E3]" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">产品使用说明手册</h2>
          </div>
          <button
            onClick={() => setIsManualOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
          <ReactMarkdown
            components={{
              h1: ({children}) => <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-4 pb-2 border-b border-gray-100 dark:border-white/10">{children}</h1>,
              h2: ({children}) => <h2 className="text-base font-bold text-gray-900 dark:text-white mt-8 mb-3 flex items-center gap-2 before:content-[''] before:w-1 before:h-4 before:bg-[#0071E3] before:rounded-full before:shrink-0">{children}</h2>,
              h3: ({children}) => <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-5 mb-2">{children}</h3>,
              h4: ({children}) => <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-4 mb-1.5">{children}</h4>,
              p: ({children}) => <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({children}) => <li className="text-sm text-gray-600 dark:text-gray-300">{children}</li>,
              strong: ({children}) => <strong className="font-semibold text-gray-800 dark:text-gray-100">{children}</strong>,
              em: ({children}) => <em className="italic text-gray-600 dark:text-gray-300">{children}</em>,
              code: ({children, className}) => {
                const isBlock = className?.includes('language-');
                return isBlock
                  ? <code className="block text-xs font-mono text-gray-700 dark:text-gray-200">{children}</code>
                  : <code className="text-xs font-mono text-[#0071E3] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{children}</code>;
              },
              pre: ({children}) => <pre className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-xs overflow-x-auto mb-4">{children}</pre>,
              table: ({children}) => <div className="overflow-x-auto mb-4"><table className="w-full text-sm border-collapse">{children}</table></div>,
              thead: ({children}) => <thead className="bg-gray-50 dark:bg-white/5">{children}</thead>,
              th: ({children}) => <th className="text-left text-xs font-semibold text-gray-700 dark:text-gray-200 px-3 py-2 border-b border-gray-200 dark:border-white/10">{children}</th>,
              td: ({children}) => <td className="text-xs text-gray-600 dark:text-gray-300 px-3 py-2 border-b border-gray-100 dark:border-white/5">{children}</td>,
              tr: ({children}) => <tr className="hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors">{children}</tr>,
              blockquote: ({children}) => <blockquote className="border-l-2 border-[#0071E3] pl-4 my-3 text-sm text-gray-500 dark:text-gray-400 italic">{children}</blockquote>,
              hr: () => <hr className="my-6 border-gray-100 dark:border-white/10" />,
              a: ({children, href}) => <a href={href} className="text-[#0071E3] dark:text-blue-400 hover:underline">{children}</a>,
            }}
          >
            {manualContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Feedback FAB */}
      {!isFeedbackOpen && (
        <div className="fixed bottom-[104px] right-0 z-[60]">
          <button
            onClick={() => { resetFeedback(); setIsFeedbackOpen(true); }}
            className="flex items-center gap-2 bg-white dark:bg-[#232326] text-[#0071E3] dark:text-blue-400 pl-4 pr-5 py-2.5 rounded-l-full shadow-md border border-gray-200 dark:border-white/10 translate-x-[calc(100%-40px)] hover:translate-x-0 transition-transform duration-300 ease-in-out active:scale-95"
          >
            <MessageSquarePlus className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">反馈</span>
          </button>
        </div>
      )}

      {/* Feedback Panel */}
      {isFeedbackOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60]" onClick={() => { setIsFeedbackOpen(false); setTimeout(resetFeedback, 300); }} />
          <div className="fixed bottom-[104px] right-[8px] z-[61] w-[420px] max-h-[85vh] flex flex-col bg-white dark:bg-[#232326] rounded-2xl shadow-2xl shadow-black/20 border border-gray-200/60 dark:border-white/10 overflow-hidden animate-feedback-enter">
            {feedbackSubmitted ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">感谢您的反馈！</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">我们已收到您的意见，将尽快处理。</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0071E3] to-[#34AADC] flex items-center justify-center">
                      <MessageSquarePlus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">意见反馈</h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">您的反馈对我们非常重要</p>
                    </div>
                  </div>
                  <button onClick={() => { setIsFeedbackOpen(false); setTimeout(resetFeedback, 300); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">反馈类型</label>
                    <div className="flex gap-2">
                      {([
                        { key: 'bug' as const, label: '问题缺陷', color: 'red' },
                        { key: 'feature' as const, label: '功能建议', color: 'blue' },
                        { key: 'other' as const, label: '其他反馈', color: 'gray' },
                      ]).map(t => (
                        <button
                          key={t.key}
                          onClick={() => setFeedbackType(t.key)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all duration-200 ${
                            feedbackType === t.key
                              ? t.color === 'red'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                                : t.color === 'blue'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300'
                              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">满意度评分</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setFeedbackRating(n)}
                          className="p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
                        >
                          <Star className={`w-6 h-6 transition-colors duration-200 ${n <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                        </button>
                      ))}
                      {feedbackRating > 0 && (
                        <span className="ml-2 text-xs text-gray-400 self-center">
                          {['', '非常不满意', '不满意', '一般', '满意', '非常满意'][feedbackRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      标题 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={feedbackTitle}
                      onChange={e => setFeedbackTitle(e.target.value)}
                      placeholder="请简要描述您的反馈..."
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] dark:focus:border-[#0071E3] transition"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      详细描述 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={feedbackContent}
                      onChange={e => setFeedbackContent(e.target.value)}
                      placeholder="请详细描述您遇到的问题或建议，帮助我们更好地改进..."
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] dark:focus:border-[#0071E3] transition resize-none"
                    />
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">联系方式（选填）</label>
                    <input
                      type="text"
                      value={feedbackContact}
                      onChange={e => setFeedbackContact(e.target.value)}
                      placeholder="邮箱或手机号，以便我们联系您"
                      className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 focus:border-[#0071E3] dark:focus:border-[#0071E3] transition"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10 shrink-0">
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackTitle.trim() || !feedbackContent.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-[#0060C0] hover:to-[#006AD8] disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Send className="w-4 h-4" />
                    提交反馈
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;
