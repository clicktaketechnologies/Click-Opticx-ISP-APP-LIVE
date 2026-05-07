import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Bell, Search, UserCircle, X, CheckCircle, Info, AlertTriangle, 
  Menu, LogOut, Zap, ShieldAlert, Moon, Sun, ChevronDown, 
  Settings, User, CreditCard, BellRing
} from 'lucide-react';
import { AppState, Role } from '../../types';
import { db } from '../../db';

interface HeaderProps {
  user: { id?: string; email: string; role: Role; name: string; profileImage?: string };
  toggleSidebar: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  isPending?: boolean;
  onNavigate?: (page: string, params?: any) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, toggleSidebar, onProfileClick, onLogout, 
  searchTerm, onSearch, isPending, onNavigate 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('clickopticx_theme') || 'light');
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const state = db.getState();

  // Handle clicks outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications = useMemo(() => {
    return state.notifications
      .filter(n => (n.audience === 'admin' || n.audience === 'system') && (n.targetId === 'all' || n.targetId === user?.email))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.notifications, user?.email]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('clickopticx_theme', newTheme);
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
      case 'error': return <X className="text-rose-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[100]">
      {/* Progress Line */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 animate-pulse overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Left Section: Mobile Toggle + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90"
        >
          <Menu size={24} />
        </button>

        <div className="hidden md:flex items-center gap-3 w-96 px-4 py-2.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all group">
          <Search className={`transition-colors duration-300 ${searchTerm ? 'text-indigo-500' : 'text-slate-400'}`} size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search connections, invoices, or users..." 
            className="w-full bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchTerm && (
            <button onClick={() => onSearch('')} className="text-slate-400 hover:text-rose-500">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right Section: Actions + Profile */}
      <div className="flex items-center gap-2 md:gap-6">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-2xl transition-all relative border border-transparent 
              ${showNotifications ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'}
            `}
          >
            <Bell size={20} strokeWidth={showNotifications ? 2.5 : 2} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-lg ring-2 ring-white dark:ring-slate-950 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Relay</span>
                <button 
                  onClick={() => db.markAllNotificationsRead(user?.email || 'admin@clickopticx.com', 'admin')}
                  className="text-[10px] font-black uppercase text-indigo-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <BellRing className="text-slate-200 dark:text-white/5" size={48} />
                    <p className="text-sm font-bold text-slate-400">No new alerts</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-5 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-4 ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                      onClick={() => {
                        db.markNotificationRead(n.id);
                        if (n.target && onNavigate) onNavigate(n.target);
                        setShowNotifications(false);
                      }}
                    >
                      <div className="shrink-0 mt-1">{getNotifIcon(n.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{n.title}</p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">
                {user?.name?.split(' ')[0] || 'Admin'}
              </p>
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-md">
                {user?.role || 'Admin'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user?.name || 'Admin'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <UserCircle className="text-slate-400" size={24} />
                </div>
              )}
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 p-2">
              <button 
                onClick={() => { onProfileClick(); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all group"
              >
                <User size={18} className="text-slate-400 group-hover:text-indigo-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Admin Profile</span>
              </button>
              <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all group">
                <CreditCard size={18} className="text-slate-400 group-hover:text-indigo-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Billing Overview</span>
              </button>
              <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all group">
                <Settings size={18} className="text-slate-400 group-hover:text-indigo-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Preferences</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-white/5 my-2 mx-4" />
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-4 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all group"
              >
                <LogOut size={18} className="text-slate-400 group-hover:text-rose-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-500">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
