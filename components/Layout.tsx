import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Menu, X, Bell, ChevronDown, Shield, Building2, Network, Target, Moon, Sun } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, users, setCurrentUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const location = useLocation();

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

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 font-medium text-base
          ${isActive 
            ? 'bg-blue-50 text-[#0071E3] shadow-sm dark:bg-white/10 dark:text-white' 
            : 'text-gray-500 hover:bg-gray-50/80 hover:text-black dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
          }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="h-screen flex font-sans overflow-hidden bg-[#F5F5F7] dark:bg-black transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Glassmorphism */}
      <aside className={`fixed lg:static top-0 left-0 z-50 h-full w-[280px] flex-shrink-0 transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white/70 backdrop-blur-xl border-r border-gray-200/50
        dark:bg-[#1C1C1E]/70 dark:border-white/10
      `}>
        <div className="p-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0071E3] dark:bg-[#0A84FF] rounded-md flex items-center justify-center shadow-lg transition-colors">
               <span className="text-white font-bold text-xs tracking-tighter">WPS</span>
            </div>
            <span className="text-xl font-bold text-black dark:text-white tracking-tight">WPS365业务平台</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-4 py-2 space-y-1.5 overflow-y-auto h-[calc(100%-80px)] custom-scrollbar">
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 mb-2 mt-2">概览</div>
          <NavItem to="/" icon={LayoutDashboard} label="仪表盘" />
          
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 mb-2 mt-6">销售与交付</div>
          <NavItem to="/opportunities" icon={Target} label="商机管理" />
          <NavItem to="/orders" icon={ShoppingCart} label="订单中心" />
          
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 mb-2 mt-6">资源中心</div>
          <NavItem to="/customers" icon={Users} label="客户档案" />
          <NavItem to="/channels" icon={Network} label="渠道管理" />
          <NavItem to="/products" icon={Package} label="商品中心" />
          
          {currentUser.role === 'Admin' && (
            <>
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 mb-2 mt-6">系统配置</div>
              <NavItem to="/organization" icon={Building2} label="组织架构" />
              <NavItem to="/users" icon={Shield} label="用户权限" />
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F5F7] dark:bg-black transition-colors duration-300">
        {/* Header - Glassmorphism */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-8 z-30 sticky top-0
          bg-white/80 backdrop-blur-xl border-b border-gray-200/50
          dark:bg-[#1C1C1E]/80 dark:border-white/10
        ">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 rounded-md transition">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-gray-900 dark:text-white text-lg">WPS365业务平台</span>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-5">
             {/* Theme Toggle */}
             <button 
                onClick={toggleTheme}
                className="p-2.5 text-gray-400 hover:text-[#0071E3] dark:text-gray-400 dark:hover:text-white transition rounded-md hover:bg-gray-100/50 dark:hover:bg-white/10"
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="p-2.5 text-gray-400 hover:text-[#0071E3] dark:text-gray-400 dark:hover:text-white transition relative hover:bg-gray-100/50 dark:hover:bg-white/10 rounded-md">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-black"></span>
            </button>
            
            {/* User Switcher / Profile */}
            <div className="relative">
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-md hover:bg-gray-100/80 dark:hover:bg-white/10 transition border border-transparent hover:border-gray-200/50 dark:hover:border-white/10"
                >
                    <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        className="w-9 h-9 rounded-full object-cover shadow-sm"
                    />
                    <div className="text-left hidden md:block">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{currentUser.name}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-100/50 dark:border-white/10 py-2 z-50 animate-fade-in ring-1 ring-black/5">
                        <div className="px-4 py-3 border-b border-gray-100/50 dark:border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            切换账号
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        setCurrentUser(user);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition text-left mb-1
                                        ${currentUser.id === user.id ? 'bg-blue-50 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/10'}
                                    `}
                                >
                                    <img src={user.avatar} className="w-9 h-9 rounded-full" alt="" />
                                    <div>
                                        <div className={`text-sm font-medium ${currentUser.id === user.id ? 'text-[#0071E3] dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{user.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                                    </div>
                                    {currentUser.id === user.id && <div className="ml-auto w-2 h-2 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto scroll-smooth relative custom-scrollbar">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;