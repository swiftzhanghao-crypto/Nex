
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Menu, X, LogOut, Bell, ChevronDown, Shield, Building2 } from 'lucide-react';
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
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
        onClick={() => setIsSidebarOpen(false)}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">NexOrder</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-2 flex-1">
          <NavItem to="/" icon={LayoutDashboard} label="仪表盘" />
          <NavItem to="/orders" icon={ShoppingCart} label="订单管理" />
          <NavItem to="/products" icon={Package} label="产品管理" />
          <NavItem to="/customers" icon={Users} label="客户管理" />
          {currentUser.role === 'Admin' && (
            <>
              <div className="my-4 border-t border-gray-100"></div>
              <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">系统管理</div>
              <NavItem to="/organization" icon={Building2} label="组织架构" />
              <NavItem to="/users" icon={Shield} label="用户权限" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
           <button className="flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-red-600 transition w-full">
             <LogOut className="w-5 h-5" />
             <span className="font-medium">退出登录</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1"></div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* User Switcher / Profile */}
            <div className="relative">
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition"
                >
                    <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    />
                    <div className="text-left hidden md:block">
                        <div className="text-sm font-bold text-gray-800 leading-none">{currentUser.name}</div>
                        <div className="text-xs text-indigo-600 font-medium mt-0.5">{currentUser.role}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                        <div className="px-4 py-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                            切换演示用户
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        setCurrentUser(user);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${currentUser.id === user.id ? 'bg-indigo-50' : ''}`}
                                >
                                    <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                                    <div>
                                        <div className={`text-sm font-medium ${currentUser.id === user.id ? 'text-indigo-700' : 'text-gray-700'}`}>{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.role}</div>
                                    </div>
                                    {currentUser.id === user.id && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-600"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
