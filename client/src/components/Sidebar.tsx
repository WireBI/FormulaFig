'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Database,
  DollarSign,
  Home,
  Layers,
  LayoutDashboard,
  Menu,
  PieChart,
  Settings,
  TrendingUp,
  Users,
  Activity,
  LogOut,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
  href?: string;
  children?: { label: string; href: string }[];
}

const SidebarItem = ({ icon: Icon, label, isCollapsed, isActive, href, children }: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const content = (
    <div className="flex items-center gap-3">
      <Icon size={20} className={cn(!isActive && "group-hover:text-blue-400")} />
      {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
    </div>
  );

  const buttonClasses = cn(
    "w-full flex items-center p-2.5 rounded-xl transition-all duration-200 group mb-1",
    isActive 
      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
      : "text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent",
    isCollapsed ? "justify-center" : "justify-between"
  );

  if (href && !children) {
    return (
      <button onClick={() => router.push(href)} className={buttonClasses}>
        {content}
      </button>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => children && setIsOpen(!isOpen)}
        className={buttonClasses}
      >
        {content}
        {!isCollapsed && children && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={14} />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {!isCollapsed && isOpen && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-9 mt-1 flex flex-col gap-1 overflow-hidden"
          >
            {children.map((child) => (
              <button
                key={child.label}
                onClick={() => router.push(child.href)}
                className="py-2 px-3 text-xs text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50 text-left"
              >
                {child.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{name?: string, email?: string} | null>(null);

  useEffect(() => {
    // Basic user info from local storage or token payload if available
    const token = localStorage.getItem('google_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ name: payload.name, email: payload.email });
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('google_token');
    router.push('/login');
  };

  const navigation = [
    {
      icon: BarChart3,
      label: 'Pivot Reports',
      href: '/pivot',
      isActive: pathname === '/pivot'
    },
    {
      icon: TrendingUp,
      label: 'Sales Reports',
      children: [
        { label: 'Overview', href: '/reports/sales' },
        { label: 'Forecasts', href: '/reports/forecasts' },
      ]
    },
    {
      icon: Users,
      label: 'Clients',
      href: '/clients'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings'
    }
  ];

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="h-screen bg-slate-950/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col transition-all duration-300 relative z-20"
    >
      <div className={cn(
        "p-6 flex items-center mb-6",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">FF</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">Formula Fig</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Analytics</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-1">
        {!isCollapsed && (
          <div className="px-3 mb-4">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-400 transition-colors" size={14} />
                <input 
                    type="text" 
                    placeholder="Search reports..." 
                    className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                />
             </div>
          </div>
        )}
        
        {navigation.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isCollapsed={isCollapsed}
            isActive={item.isActive}
            href={item.href}
            children={item.children}
          />
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-slate-800/50 bg-slate-900/20">
        <div className={cn(
          "flex items-center gap-3 group px-2 py-3 rounded-2xl hover:bg-slate-800/30 transition-all duration-200 cursor-pointer",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs text-white font-bold shadow-lg shadow-blue-950/50 group-hover:scale-105 transition-transform">
            {user?.name?.substring(0, 2).toUpperCase() || 'FF'}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-500 truncate font-medium">{user?.email || 'Authorized'}</span>
            </div>
          )}
        </div>
        
        <button 
            onClick={handleLogout}
            className={cn(
                "w-full mt-2 flex items-center gap-3 p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-all group",
                isCollapsed ? "justify-center" : "px-3"
            )}
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
};
