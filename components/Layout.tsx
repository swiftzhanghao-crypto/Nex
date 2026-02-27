
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Menu, X, Bell, ChevronDown, Shield, Building2, Network, Target, Moon, Sun, Settings, Activity, Maximize, Minimize, PanelLeftClose, PanelLeftOpen, Layers } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, users, setCurrentUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTopNav, setActiveTopNav] = useState<'ORDER_CENTER' | 'PRODUCT_CENTER' | 'WPS_OPERATIONS' | 'SYSTEM_CONFIG'>('ORDER_CENTER');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const hideSidebar = location.pathname === '/product-center' || location.pathname.includes('/preview');

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
      if (location.pathname.startsWith('/operations')) {
          setActiveTopNav('WPS_OPERATIONS');
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

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
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
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 z-30 sticky top-0
          bg-white/70 backdrop-blur-xl border-b border-gray-200/50
          dark:bg-[#1C1C1E]/70 dark:border-white/10 transition-all
      ">
          <div className="flex items-center gap-6">
              {/* Logo Area */}
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full p-2 transition">
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-9 h-9 bg-gradient-to-br from-[#0071E3] to-[#42A5F5] dark:from-[#0A84FF] dark:to-[#5E5CE6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                       <span className="text-white font-black text-xs tracking-tighter">WPS</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">WPS365</span>
                </div>
              </div>

              {/* Desktop Tabs */}
              <nav className="hidden md:flex items-center gap-1 ml-6">
                  {[
                      { id: 'ORDER_CENTER', label: '订单中心', path: '/' },
                      { id: 'PRODUCT_CENTER', label: '商品中心', path: '/product-center' },
                      { id: 'WPS_OPERATIONS', label: 'WPS运营', path: '/operations' },
                      { id: 'SYSTEM_CONFIG', label: '系统配置', path: '/organization' }
                  ].map((item) => (
                      <button 
                          key={item.id}
                          onClick={() => navigate(item.path)}
                          className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              activeTopNav === item.id 
                              ? 'bg-[#0071E3] text-white shadow-md shadow-blue-500/20' 
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
                        className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-200 dark:border-white/10"
                    />
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl rounded-2xl shadow-apple border border-gray-200/50 dark:border-white/10 p-2 z-50 animate-modal-enter origin-top-right">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
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
                                        <div className="text-[10px] text-gray-400">{user.role}</div>
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
            <aside className={`absolute inset-y-0 left-4 top-4 bottom-4 z-40 transform transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] lg:relative lg:translate-x-0 lg:top-0 lg:bottom-0 lg:left-0 lg:py-6 lg:pl-6
              ${isSidebarOpen ? 'translate-x-0 w-[240px]' : '-translate-x-[110%] lg:translate-x-0'}
              ${isCollapsed ? 'lg:w-[88px]' : 'lg:w-[240px]'}
              flex flex-col gap-1
            `}>
              {/* Sidebar visual container */}
              <div className="w-full h-full bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-apple flex flex-col overflow-hidden">
                  
                  {/* Mobile Sidebar Header */}
                  <div className="lg:hidden h-14 flex items-center justify-between px-5 border-b border-gray-100 dark:border-white/5 shrink-0">
                      <span className="font-bold text-gray-900 dark:text-white">菜单</span>
                      <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
                    {activeTopNav === 'ORDER_CENTER' && (
                        <>
                            <div className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-6 transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:mt-0 lg:overflow-hidden' : ''}`}>销售与交付</div>
                            <NavItem to="/opportunities" icon={Target} label="商机管理" />
                            <NavItem to="/orders" icon={ShoppingCart} label="订单中心" />
                            
                            <div className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-6 transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:mt-0 lg:overflow-hidden' : ''}`}>资源中心</div>
                            <NavItem to="/customers" icon={Users} label="客户档案" />
                            <NavItem to="/channels" icon={Network} label="渠道管理" />
                        </>
                    )}

                    {activeTopNav === 'PRODUCT_CENTER' && (
                        <>
                            <div className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-1 transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:mt-0 lg:overflow-hidden' : ''}`}>商品管理</div>
                            <NavItem to="/products" icon={Package} label="商品列表" />
                        </>
                    )}

                    {activeTopNav === 'WPS_OPERATIONS' && (
                        <>
                            <div className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-1 transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:mt-0 lg:overflow-hidden' : ''}`}>运营中心</div>
                            <NavItem to="/operations" icon={Settings} label="运营管理" />
                        </>
                    )}

                    {activeTopNav === 'SYSTEM_CONFIG' && currentUser.role === 'Admin' && (
                        <>
                            <div className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-1 transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:h-0 lg:mb-0 lg:mt-0 lg:overflow-hidden' : ''}`}>系统配置</div>
                            <NavItem to="/organization" icon={Building2} label="组织架构" />
                            <NavItem to="/users" icon={Users} label="用户管理" />
                            <NavItem to="/roles" icon={Shield} label="角色管理" />
                        </>
                    )}
                  </nav>

                  {/* Sidebar Footer - Collapse Button */}
                  <div className="p-3 border-t border-gray-100 dark:border-white/5 shrink-0 hidden lg:flex">
                      <button 
                          onClick={() => setIsCollapsed(!isCollapsed)} 
                          className={`flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl p-2.5 transition-all duration-300 w-full ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                          title={isCollapsed ? '展开菜单' : '收起菜单'}
                      >
                          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                          {!isCollapsed && <span className="text-sm font-medium">收起菜单</span>}
                      </button>
                  </div>
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
