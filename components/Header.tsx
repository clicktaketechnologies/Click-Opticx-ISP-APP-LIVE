
import React, { useState, useMemo } from 'react';
import { Role } from '../types';
import { Bell, Search, UserCircle, Database, X, CheckCircle, Info, AlertTriangle, CloudOff, RefreshCw, CloudUpload, Menu, Globe, LogOut, Cloud, ListChecks, Zap, ShieldAlert } from 'lucide-react';
import { db } from '../db';

interface HeaderProps {
  user: { id?: string; email: string; role: Role; name: string };
  toggleSidebar: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  isPending?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar, onProfileClick, onLogout, searchTerm, onSearch, isPending }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const state = db.getState();
  const branding = state.settings.branding;
  
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
      default:
        return (
          <button 
            onClick={() => db.forceSync()}
            title="Attempt Cloud Reconnection"
            className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded-lg border border-red-100 whitespace-nowrap hover:bg-red-100 transition-all active:scale-95"
          >
             <CloudOff size={10} />
             <span className="text-[8px] font-black uppercase tracking-widest leading-none">Local</span>
          </button>
        );
    }
  };

  return (
    <header className="h-12 bg-white border-b border-slate-200 px-3 md:px-5 flex items-center justify-between sticky top-0 z-[60] shadow-sm relative overflow-hidden">
      {/* Page Transition Progress Bar */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 z-[70] animate-progress-glow overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer scale-x-150"></div>
        </div>
      )}

      <div className="flex items-center gap-2 md:gap-3 flex-1">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 md:pr-4 md:border-r border-slate-100 md:mr-1 group cursor-pointer">
           <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
              {branding.logoSquare ? (
                 <img src={branding.logoSquare} className="w-full h-full object-contain p-1" alt="Logo" />
              ) : (
                 <Globe size={14} className="text-blue-600" />
              )}
           </div>
           <div className="hidden lg:block">
              <p className="text-[8px] font-black uppercase tracking-tighter italic text-slate-800 leading-none">{branding.businessName}</p>
           </div>
        </div>

        <div className="relative hidden md:block w-36 lg:w-48 group">
          <Search className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-blue-500' : 'text-slate-400'}`} size={12} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Registry search..." 
            className="w-full pl-7 pr-7 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[9px] font-bold transition-all placeholder:text-slate-300"
          />
          {searchTerm && (
            <button 
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
        {renderConnectionBadge()}
      </div>

      <div className="flex items-center gap-2 md:gap-3 ml-2">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-1 rounded-lg transition-all ${showNotifications ? 'bg-slate-100 text-green-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 text-white text-[7px] flex items-center justify-center rounded-full font-bold shadow-sm ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 md:w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 overflow-hidden">
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
          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
        >
          <LogOut size={16} />
        </button>
        
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-2 md:gap-3 border-l pl-2 md:pl-4 border-slate-200 group transition-all"
        >
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-800 tracking-tight leading-none">{user.name.split(' ')[0]}</p>
            <p className="text-[7px] text-green-600 font-black uppercase tracking-widest mt-0.5 leading-none">{user.role}</p>
          </div>
          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 shadow-inner overflow-hidden shrink-0 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
             <UserCircle size={20} className="text-slate-400 group-hover:text-blue-400" />
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;

