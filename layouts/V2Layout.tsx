import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, User, LayoutDashboard, Users, 
  Wallet, Network, MessageSquare, Zap, Settings, 
  ChevronLeft, ChevronRight, LogOut, Shield,
  Database, BarChart3, Globe, Mail,
  Smartphone, Activity, Command, Menu, X,
  ShieldAlert, BellRing, UserCheck, HardDrive
} from 'lucide-react';
import { AppState, Role } from '../types';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { V2Badge } from '../components/v2/UIAtoms';
import { db } from '../db';

interface Props {
  state: AppState;
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const V2Layout: React.FC<Props> = ({ state, children, activePage, onNavigate, onLogout }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, canAccess } = useRoleAccess(state);

  const menuItems = [
    { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard, group: 'Core' },
    { id: 'users', label: 'User Matrix', icon: Users, group: 'Core', badge: state.stats?.activeUsers },
    
    { id: 'finance', label: 'Fiscal Hub', icon: Wallet, group: 'Operations', access: 'finance' },
    { id: 'network', label: 'Network Plane', icon: Network, group: 'Operations', access: 'network' },
    { id: 'kyc', label: 'Identity/KYC', icon: UserCheck, group: 'Operations', access: 'kyc', badge: state.kycStats?.pending },
    
    { id: 'comm-center', label: 'Comms Plane', icon: Mail, group: 'Matrix', access: 'admin' },
    { id: 'automation', label: 'Neural/AI', icon: Zap, group: 'Matrix', access: 'admin' },
    { id: 'cloud-storage', label: 'Cloud Vault', icon: HardDrive, group: 'Matrix', access: 'admin' },
    
    { id: 'setup', label: 'System Opts', icon: Settings, group: 'Protocol', access: 'admin' },
    { id: 'migration-dashboard', label: 'Migration Matrix', icon: Shield, group: 'Protocol', access: 'admin' },
    { id: 'database-monitor', label: 'Kernel Logs', icon: Database, group: 'Protocol', access: 'admin' },
  ];

  const filteredMenu = menuItems.filter(item => !item.access || canAccess(item.access));
  const groups = Array.from(new Set(filteredMenu.map(i => i.group)));

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-blue-100">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-500 ease-in-out relative z-30 ${
          isSidebarCollapsed ? 'w-24' : 'w-72'
        }`}
      >
        {/* Logo Section */}
        <div className="h-24 flex items-center px-8 border-b border-slate-50 relative overflow-hidden">
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center shadow-2xl shadow-blue-500/20 active:scale-95 transition-transform">
                 <Zap className="text-blue-500 fill-blue-500" size={20} />
              </div>
              {!isSidebarCollapsed && (
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tighter italic leading-none">CLICK OPTICX</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ISP Command Plane</p>
                </div>
              )}
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-8 no-scrollbar">
           {groups.map(group => (
             <div key={group} className="mb-8 px-6">
                {!isSidebarCollapsed && (
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">{group}</h2>
                )}
                <div className="space-y-1">
                   {filteredMenu.filter(i => i.group === group).map(item => (
                     <button
                       key={item.id}
                       onClick={() => onNavigate(item.id)}
                       className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${
                         activePage === item.id 
                         ? 'bg-slate-950 text-white shadow-xl shadow-slate-900/10' 
                         : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                       }`}
                     >
                        <item.icon size={20} className={activePage === item.id ? 'text-blue-400' : 'group-hover:text-blue-600'} />
                        {!isSidebarCollapsed && (
                          <span className="text-[11px] font-black uppercase tracking-widest flex-1 text-left italic">{item.label}</span>
                        )}
                        {!isSidebarCollapsed && item.badge && item.badge > 0 && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full shadow-lg shadow-blue-500/20">
                            {item.badge}
                          </span>
                        )}
                        {isSidebarCollapsed && activePage === item.id && (
                          <div className="absolute left-0 w-1.5 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        )}
                     </button>
                   ))}
                </div>
             </div>
           ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-6 border-t border-slate-50">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all group"
           >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest italic">Terminate Session</span>}
           </button>
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all"
        >
           {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Global Header */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-20">
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
               {state.auth?.isImpersonating ? (
                  <div className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-3 flex items-center justify-between animate-pulse shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                           <ShieldAlert size={18} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-amber-900 uppercase italic leading-none">Impersonating {state.currentUser?.name}</p>
                           <p className="text-[8px] font-bold text-amber-700 uppercase tracking-widest mt-1">Admin ID: {state.auth?.impersonatorId}</p>
                        </div>
                    </div>
                    <button 
                      onClick={() => (db as any).logoutImpersonation()}
                      className="px-4 py-2 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                    >
                      Exit Session
                    </button>
                  </div>
               ) : (
                  <div className="relative group flex-1">
                     <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Command size={18} />
                     </div>
                     <input 
                       type="text" 
                       placeholder="Command + K to search matrix..." 
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-inner"
                     />
                     <div className="absolute inset-y-0 right-4 flex items-center">
                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 shadow-sm">CTRL + K</span>
                     </div>
                  </div>
               )}
            </div>

            <div className="flex items-center gap-4 lg:gap-8 ml-8">
                <div className="hidden md:flex items-center gap-3">
                   <V2Badge label={role} color="indigo" variant="solid" icon={Shield} />
                   {(state.emergencyCount || 0) > 0 && (
                     <V2Badge label={`${state.emergencyCount} ALERTS`} color="rose" icon={ShieldAlert} />
                   )}
                </div>

               <div className="flex items-center gap-2 lg:gap-4 border-l border-slate-100 pl-4 lg:pl-8">
                  <button className="p-3.5 bg-slate-50 text-slate-500 hover:bg-slate-950 hover:text-white rounded-2xl transition-all relative shadow-inner hover:shadow-xl hover:scale-105 active:scale-95">
                     <Bell size={20} />
                     <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></span>
                  </button>
                  <button className="flex items-center gap-4 p-1.5 pr-6 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-[2rem] transition-all shadow-inner group">
                     <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform overflow-hidden">
                        <User size={20} />
                     </div>
                      <div className="hidden sm:block text-left">
                         <p className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{state.auth?.name || 'Operator'}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {state.auth?.id?.slice(0, 8) || 'N/A'}</p>
                      </div>
                  </button>
               </div>
            </div>
        </header>

        {/* Workspace Container */}
        <section className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar bg-[#F8FAFC]">
            {/* Breadcrumb / Title Area */}
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  <span>Click Opticx</span>
                  <ChevronRight size={10} />
                  <span className="text-blue-500 italic">{activePage}</span>
               </div>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-3">
                        {filteredMenu.find(i => i.id === activePage)?.label || activePage}
                    </h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Node Control Plane</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-2xl transition-all shadow-sm">
                        <BarChart3 size={20} />
                     </button>
                     <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 flex items-center gap-3 active:scale-95">
                        <Zap size={16} className="fill-blue-400 text-blue-400" /> Executive Pulse
                     </button>
                  </div>
               </div>
            </div>

            {/* Viewport Content */}
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                {children}
            </div>
        </section>
      </main>

      {/* Mobile Menu Overlay */}
      <button 
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl z-50 active:scale-90 transition-transform"
      >
        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-40 animate-in fade-in slide-in-from-bottom-full duration-500 p-12">
            {/* Mobile Nav Content (Simplified for now) */}
            <div className="space-y-8 mt-12">
                {filteredMenu.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-6"
                    >
                        <item.icon size={32} className={activePage === item.id ? 'text-blue-500' : 'text-slate-400'} />
                        <span className={`text-2xl font-black uppercase italic ${activePage === item.id ? 'text-slate-950' : 'text-slate-400'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default V2Layout;
