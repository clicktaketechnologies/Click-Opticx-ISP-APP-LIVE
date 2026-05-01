
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Role } from '../types';
import { Bell, Search, UserCircle, Database, X, CheckCircle, Info, AlertTriangle, CloudOff, RotateCw, CloudUpload, Menu, Globe, LogOut, Cloud, ListChecks, Zap, ShieldAlert, Moon, Sun } from 'lucide-react';
import { db } from '../db';
import { useBranding } from '../hooks/useBranding';

interface HeaderProps {
  user: { id?: string; email: string; role: Role; name: string; profileImage?: string };
  toggleSidebar: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  isPending?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar, onProfileClick, onLogout, searchTerm, onSearch, isPending }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const state = db.getState();
  const branding = useBranding();

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);
  
  const userNotifications = useMemo(() => {
    // ADMIN TERMINAL FILTER: Only show admin or system audience notifications
    return state.notifications.filter(n => 
      (n.audience === 'admin' || n.audience === 'system') && 
      (n.targetId === 'all' || n.targetId === user.email)
    );
  }, [state.notifications, user]);

  const unreadCount = userNotifications.filter(n => !n.read).length;
  const isSyncing = db.getSyncStatus();

  const getIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle size={14} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-orange-500" />;
      case 'error': return <X size={14} className="text-rose-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  const handleMarkAllRead = () => {
    db.markAllNotificationsRead(user.email, 'admin');
  };

  const renderConnectionBadge = () => {
    if (isSyncing) {
      return (
        <button 
          disabled
          className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 animate-pulse whitespace-nowrap cursor-wait"
        >
           <CloudUpload size={10} />
           <span className="text-[8px] font-black uppercase tracking-widest leading-none">Handshaking</span>
        </button>
      );
    }

    switch(state.connectionStatus) {
      case 'online':
        return (
          <button 
            onClick={() => db.forceSync()}
            title="Manual Registry Sync"
            className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-lg border border-green-100 whitespace-nowrap group hover:bg-green-100 transition-all active:scale-95"
          >
             <div className="relative">
                <Cloud size={10} />
                <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest leading-none">Synced</span>
          </button>
        );
    }
  };
  
  const [theme, setTheme] = useState(() => localStorage.getItem('click_opticx_theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('click_opticx_theme', newTheme);
  };

  return (
    <header className="h-[70px] bg-surface/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
      {/* Page Transition Progress Bar */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1570ef] z-[70] animate-progress-glow overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer scale-x-150"></div>
        </div>
      )}

      <div className="flex items-center gap-4 md:gap-8 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all active:scale-90"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3 pr-6 border-r border-slate-100 group cursor-pointer transition-all">
           <div className="w-10 h-10 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
              {(branding.logo || branding.logoSquare || branding.logoLight) ? (
                 <img 
                   src={branding.logoSquare || branding.logo || branding.logoLight} 
                   className="w-full h-full object-contain p-1.5" 
                   alt={branding.brandName || branding.businessName} 
                   onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/favicon.png'; }}
                 />
              ) : (
                 <Globe size={18} className="text-blue-500 animate-pulse" />
              )}
           </div>
           <div className="hidden xl:block">
              <h1 className="text-sm font-black uppercase tracking-tighter italic text-slate-900 leading-none">{branding.brandName || branding.businessName}</h1>
              <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1 italic opacity-60">Control Nexus</p>
           </div>
        </div>

        <div className="relative hidden lg:block w-72 group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchTerm ? 'text-blue-500' : 'text-slate-400'}`} size={16} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search connections..." 
            className="w-full pl-12 pr-10 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/50 rounded-2xl outline-none text-sm font-medium transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="hidden xxl:block">
           {renderConnectionBadge()}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 ml-4">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-2xl transition-all duration-300 ${showNotifications ? 'bg-slate-950 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
          >
            <Bell size={20} strokeWidth={showNotifications ? 3 : 2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[8px] flex items-center justify-center rounded-lg font-black shadow-lg ring-4 ring-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 md:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[200] animate-in fade-in slide-in-from-top-2 overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Activity Relay</span>
                <div className="flex gap-2">
                   {unreadCount > 0 && (
                     <button 
                        onClick={handleMarkAllRead}
                        className="text-[7px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1"
                     >
                        <ListChecks size={10} /> Mark All
                     </button>
                   )}
                   <button onClick={() => setShowNotifications(false)}><X size={12} className="text-slate-400" /></button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {userNotifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 italic text-[11px]">No updates</div>
                ) : (
                  userNotifications.sort((a,b) => b.createdAt - a.createdAt).map(n => (
                    <div 
                      key={n.id} 
                      className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-2 cursor-pointer relative ${!n.read ? 'bg-green-50/20' : ''}`}
                      onClick={() => db.markNotificationRead(n.id)}
                    >
                      {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>}
                      <div className="mt-0.5">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <p className={`text-[9px] font-black ${!n.read ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                           {n.priority === 'high' && <Zap size={8} className="text-amber-500 fill-amber-500" />}
                           {n.priority === 'critical' && <ShieldAlert size={10} className="text-rose-500 animate-pulse" />}
                        </div>
                        <p className="text-[8px] text-slate-500 mt-0.5 line-clamp-2 leading-tight uppercase">{n.message}</p>
                        <p className="text-[6px] text-slate-300 font-bold uppercase mt-1">Ref: {n.id.substr(-6)} • {new Date(n.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={onLogout}
          className="btn btn-icon btn-sm btn-secondary !p-2"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
        
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-3 border-l border-white/10 pl-4 group transition-all"
        >
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none mb-1">{user.name}</p>
            <p className="badge badge-success !text-[8px] !py-0.5">{user.role}</p>
          </div>
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden shrink-0 group-hover:scale-105 transition-all">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;

