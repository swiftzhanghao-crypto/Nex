
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Menu, X, Bell, ChevronDown, Shield, Building2, Network, Target, Moon, Sun, Settings, Activity, Maximize, Minimize, PanelLeftClose, PanelLeftOpen, Layers, BarChart3, PieChart, Contact2, Zap, FileText, ArrowUpCircle, Database, Link as LinkIcon, Settings2, Monitor, LayoutList } from 'lucide-react';
import { User, RoleDefinition } from '../types';
import WPSLogo from './WPSLogo';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  roles: RoleDefinition[];
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, users, setCurrentUser, roles }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTopNav, setActiveTopNav] = useState<'DASHBOARD' | 'ORDER_CENTER' | 'PRODUCT_CENTER' | 'OPERATIONS_CENTER' | 'SYSTEM_CONFIG' | 'LEADS_CENTER'>('DASHBOARD');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const location = useLocation();
  const navigate = useNavigate();
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
    } else if (location.pathname.startsWith('/organization') || location.pathname.startsWith('/users') || location.pathname.startsWith('/roles')) {
          setActiveTopNav('SYSTEM_CONFIG');
      } else if (location.pathname.startsWith('/products') || location.pathname.startsWith('/merchandises') || location.pathname.startsWith('/catalog') || location.pathname.startsWith('/product-center')) {
          setActiveTopNav('PRODUCT_CENTER');
      } else {
          setActiveTopNav('ORDER_CENTER');
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

  const renderSectionGroup = (id: string, label: string, children: React.ReactNode) => {
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
      { id: 'ORDER_CENTER', label: '订单中心', path: '/orders', permissions: ['order_view_all', 'order_view_pending_approval', 'order_view_pending_confirm', 'order_view_auth_confirm', 'order_view_stock_prep', 'customer_view', 'opportunity_manage', 'channel_view'] },
      { id: 'PRODUCT_CENTER', label: '产品中心', path: '/product-center', permissions: ['product_view', 'merchandise_view'] },
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

  const NavItem = ({ to, icon: Icon, label, alsoMatch }: { to: string; icon: React.ElementType; label: string; alsoMatch?: string[] }) => {
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
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 z-30 sticky top-0 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 dark:bg-[#1C1C1E]/70 dark:border-white/10 transition-all">
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

            <button className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition relative rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
            </button>
            
            <div className="relative pl-2 border-l border-gray-200 dark:border-white/10 ml-1">
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 py-1 px-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
                >
                    <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        className="w-8 h-8 rounded-full object-cover shadow-apple border border-gray-200 dark:border-white/10"
                    />
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                    <div className="unified-card absolute right-0 top-full mt-3 w-64 /90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl -gray-200/50 dark:-white/10 p-2 z-50 animate-modal-enter origin-top-right">
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
                                    <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />
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
              <div className="unified-card w-full h-full /60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl -gray-200/50 dark:-white/10 flex flex-col">
                  
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
                          <NavItem to="/orders" icon={ShoppingCart} label="订单列表" />
                        )}
                        {renderSectionGroup('order_resources', '资源信息',
                          <>
                            <NavItem to="/customers" icon={Users} label="客户信息" />
                            <NavItem to="/opportunities" icon={Target} label="商机信息" />
                            <NavItem to="/channels" icon={Network} label="渠道管理" />
                          </>
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
                        {renderSectionGroup('product_main', '产品中心',
                          <>
                            <NavItem to="/product-center" icon={Layers} label="产品展示" alsoMatch={['/catalog']} />
                            <NavItem to="/products" icon={Package} label="产品列表" />
                          </>
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
          <main className="flex-1 overflow-auto scroll-smooth relative custom-scrollbar p-0 lg:p-0">
              {children}
          </main>
      </div>
    </div>
  );
};

export default Layout;
