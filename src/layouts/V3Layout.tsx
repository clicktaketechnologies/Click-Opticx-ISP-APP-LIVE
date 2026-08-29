import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, User, LayoutDashboard, Zap, Settings, 
  ChevronLeft, ChevronRight, LogOut, Shield,
  Database, BarChart3, Globe, Mail,
  Smartphone, Activity, Command, Menu, X,
  ShieldAlert, BellRing, UserCheck, HardDrive,
  ChevronDown, Home, CreditCard, UserCircle, 
  ShieldCheck, Package, LifeBuoy, Calculator,
  Compass, Clock, Fingerprint, ListTodo, Box,
  Users, Wallet, Network
} from 'lucide-react';
import { AppState, Role } from '../../types';
import { NAVIGATION_CONFIG, NavSection, NavItem } from '../config/navigation';
import { V2Badge } from '../../components/v2/UIAtoms';
import { usePermissions } from '../hooks/usePermissions';

interface Props {
  state: AppState;
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const V3Layout: React.FC<Props> = ({ state, children, activePage, onNavigate, onLogout }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  
  const { canView, role, isSuperAdmin } = usePermissions(state);

  // Debug log for troubleshooting empty sidebars
  useEffect(() => {
    console.log('[V3-LAYOUT] Mounting with Role:', role, 'isSuperAdmin:', isSuperAdmin);
  }, [role, isSuperAdmin]);

  // Toggle Section for Accordion Sidebar
  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden font-sans selection:bg-blue-100">
      
      {/* 1. Glassmorphism Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col bg-slate-950/95 backdrop-blur-3xl border-r border-white/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-30 ${
          isSidebarCollapsed ? 'w-24' : 'w-80'
        }`}
      >
        {/* Animated Glow Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />

        {/* Premium Logo Section */}
        <div className="h-28 flex items-center px-8 relative overflow-hidden group">
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_8px_30px_rgb(59,130,246,0.3)] active:scale-90 transition-all duration-300 border border-white/20 group-hover:rotate-12">
                 <Zap className="text-white fill-white/20" size={24} />
              </div>
              {!isSidebarCollapsed && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <h1 className="text-xl font-black text-white tracking-tighter italic leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">CLICK OPTICX</h1>
                    <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      ISP CORE PLANE
                    </p>
                </div>
              )}
           </div>
        </div>

        {/* Enhanced Navigation List */}
        <nav className="flex-1 overflow-y-auto py-6 no-scrollbar px-5 space-y-3">
           {NAVIGATION_CONFIG.map((section: NavSection) => {
             // ABSOLUTE BYPASS: If SuperAdmin, we show EVERYTHING. 
             // Otherwise, we filter based on individual page permissions.
             const visibleItems = section.items.map(item => {
               if (isSuperAdmin) return item; // Bypass for SuperAdmin

               if (item.items) {
                 const visibleSubItems = item.items.filter(sub => canView(sub.id));
                 return visibleSubItems.length > 0 ? { ...item, items: visibleSubItems } : null;
               }
               return canView(item.id) ? item : null;
             }).filter(Boolean) as NavItem[];

             if (visibleItems.length === 0) return null;

             const isSectionOpen = openSection === section.title || visibleItems.some(i => i.id === activePage || i.items?.some(sub => sub.id === activePage));
             const isAnyItemActive = visibleItems.some(i => i.id === activePage || i.items?.some(sub => sub.id === activePage));

             return (
               <div key={section.title} className="space-y-1.5">
                  <button 
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 group ${
                      isSectionOpen || isAnyItemActive 
                        ? 'bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]' 
                        : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                     <div className={`transition-colors duration-300 ${isAnyItemActive ? 'text-blue-400' : 'group-hover:text-blue-300'}`}>
                        <section.icon size={20} />
                     </div>
                     {!isSidebarCollapsed && (
                       <span className="text-[11px] font-black uppercase tracking-[0.15em] flex-1 text-left italic truncate">{section.title}</span>
                     )}
                     {!isSidebarCollapsed && (
                       <ChevronDown size={14} className={`transition-transform duration-500 ${isSectionOpen ? 'rotate-180' : ''} opacity-40`} />
                     )}
                  </button>

                  {/* Enhanced Nested Items with Micro-interactions */}
                  {!isSidebarCollapsed && isSectionOpen && (
                    <div className="ml-6 pl-5 border-l border-white/10 space-y-1 animate-in slide-in-from-top-4 duration-500">
                      {visibleItems.map((item: NavItem) => (
                        <div key={item.id} className="pt-2 pb-1">
                          {item.items ? (
                            <div className="space-y-1.5">
                               <p className="px-3 py-1 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">{item.label}</p>
                               {item.items.map(sub => (
                                 <button
                                   key={sub.id}
                                   onClick={() => onNavigate(sub.id)}
                                   className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group/sub ${
                                     activePage === sub.id 
                                       ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-900/40 ring-1 ring-white/20' 
                                       : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                   }`}
                                 >
                                   <sub.icon size={15} className={`transition-transform duration-300 ${activePage === sub.id ? 'scale-110' : 'group-hover/sub:scale-110'}`} />
                                   <span className="text-[10px] font-black uppercase tracking-widest truncate">{sub.label}</span>
                                 </button>
                               ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => onNavigate(item.id)}
                              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group/sub ${
                                activePage === item.id 
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-900/40 ring-1 ring-white/20' 
                                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                              }`}
                            >
                               <item.icon size={15} className={`transition-transform duration-300 ${activePage === item.id ? 'scale-110' : 'group-hover/sub:scale-110'}`} />
                               <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.label}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
               </div>
             );
           })}
        </nav>

        {/* Premium Sidebar Footer */}
        <div className="p-8 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-5 px-5 py-5 rounded-[2rem] text-rose-500 hover:bg-rose-500/10 transition-all duration-500 group border border-transparent hover:border-rose-500/20 active:scale-95 shadow-inner"
           >
              <div className="p-2 bg-rose-500/10 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                <LogOut size={18} />
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <span className="block text-[11px] font-black uppercase tracking-[0.2em] italic">Deauthorize</span>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase mt-0.5">End Matrix Session</span>
                </div>
              )}
           </button>
        </div>

        {/* High-visibility Desktop Collapse Toggle */}
        <button 
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-5 top-14 w-10 h-10 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-slate-900 hover:text-blue-600 hover:shadow-blue-500/20 transition-all duration-500 z-40 border border-slate-100 group"
        >
           {isSidebarCollapsed ? <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />}
        </button>
      </aside>

      {/* 2. Overhauled Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Futuristic Glass Header */}
        <header className="h-24 bg-white/60 backdrop-blur-3xl border-b border-slate-200 flex items-center justify-between px-10 md:px-12 sticky top-0 z-20 shadow-[0_1px_40px_rgba(0,0,0,0.02)]">
            {/* Contextual Intelligence & Search */}
            <div className="flex items-center gap-10 flex-1 max-w-2xl hidden lg:flex">
               <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors duration-300">
                     <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Command Prompt: search subscribers, OLTs, or financial logs..." 
                    className="w-full bg-slate-100/50 border-2 border-transparent rounded-3xl py-4 pl-14 pr-10 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all duration-500 shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-6 flex items-center">
                     <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-xl text-[9px] font-black text-slate-400 border border-slate-200 shadow-sm uppercase tracking-tighter">
                       <Command size={10} /> <span>+ K</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Mobile-First Identity */}
            <div className="lg:hidden flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center shadow-xl shadow-slate-900/20 active:scale-95 transition-transform border border-white/10">
                  <Zap size={22} className="text-blue-500 fill-blue-500/20" />
               </div>
               <div>
                 <h1 className="text-sm font-black text-slate-950 tracking-tighter italic uppercase leading-none">CLICK OPTICX</h1>
                 <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1">MOBILE ACCESS</p>
               </div>
            </div>

            {/* System Status & Operator Profile */}
            <div className="flex items-center gap-5 lg:gap-8">
                <div className="hidden xl:flex flex-col items-end gap-1 border-r border-slate-200 pr-8">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{role}</span>
                   </div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Matrix Verified Access</p>
                </div>

               <div className="flex items-center gap-3 lg:gap-4 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                  <button className="p-3.5 bg-white text-slate-500 hover:text-blue-600 rounded-xl transition-all duration-300 relative shadow-sm border border-slate-200/50 group">
                     <Bell size={20} className="group-hover:rotate-12" />
                     <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-bounce"></span>
                  </button>
                  
                  <button onClick={() => onNavigate('admin-profile')} className="flex items-center gap-4 pl-1 pr-5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-500 group">
                     <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-white font-black text-sm overflow-hidden border border-white/10 shadow-lg group-hover:rotate-3 transition-transform">
                        {state.currentUser?.profileImage ? (
                          <img src={state.currentUser.profileImage} alt="Admin" className="w-full h-full object-cover" />
                        ) : (
                          state.currentUser?.name?.charAt(0) || 'A'
                        )}
                     </div>
                     {!isSidebarCollapsed && (
                       <div className="text-left hidden sm:block">
                          <p className="text-[10px] font-black text-slate-950 uppercase tracking-widest truncate max-w-[120px]">{state.currentUser?.name || 'ADMIN-01'}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 italic">Session Active</p>
                       </div>
                     )}
                  </button>
               </div>
            </div>
        </header>

        {/* Dynamic Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 bg-[#F0F2F5] pb-32 lg:pb-16 relative">
            {/* Visual Texture Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Minimalist Navigation Thread (Breadcrumbs) */}
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700 hidden md:block">
                <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md w-fit px-5 py-2.5 rounded-2xl border border-white/60 shadow-sm ring-1 ring-black/5">
                    <Home size={12} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">System</span>
                    <ChevronRight size={12} className="text-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.25em] italic">{activePage}</span>
                    </div>
                    <div className="h-3 w-px bg-slate-300/50 mx-2"></div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">Target Node: {window.location.hostname}</p>
                </div>
            </div>

            {/* Dynamic Module Interface with Pulse Backdrop */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
                {children}
            </div>
        </main>

        {/* 3. Mobile Navigation Architecture (<1024px) */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-slate-950/90 backdrop-blur-2xl border border-white/10 h-22 px-8 flex items-center justify-between z-[100] shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-[2.5rem] ring-1 ring-white/5">
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${activePage === 'dashboard' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}
            >
                <LayoutDashboard size={22} className={activePage === 'dashboard' ? 'fill-blue-400/20' : ''} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Index</span>
            </button>
            <button 
              onClick={() => onNavigate('users')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${activePage === 'users' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}
            >
                <Users size={22} className={activePage === 'users' ? 'fill-blue-400/20' : ''} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Users</span>
            </button>
            <div className="relative -top-10">
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="w-18 h-18 bg-gradient-to-br from-blue-500 to-indigo-700 text-white rounded-[2rem] flex items-center justify-center shadow-[0_15px_40px_rgba(59,130,246,0.4)] active:scale-90 transition-all duration-500 rotate-45 border-4 border-[#F0F2F5] ring-2 ring-blue-400/20"
                >
                    <div className="-rotate-45">
                        <Menu size={28} />
                    </div>
                </button>
            </div>
            <button 
              onClick={() => onNavigate('finance')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${activePage === 'finance' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}
            >
                <Wallet size={22} className={activePage === 'finance' ? 'fill-blue-400/20' : ''} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Fiscal</span>
            </button>
            <button 
              onClick={() => onNavigate('network')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${activePage === 'network' ? 'text-blue-400 scale-110' : 'text-slate-500'}`}
            >
                <Network size={22} className={activePage === 'network' ? 'fill-blue-400/20' : ''} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Ops</span>
            </button>
        </nav>

        {/* 4. Full-Screen Mobile Command Center */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-3xl z-[110] animate-in fade-in duration-500">
             <div className="absolute bottom-4 left-4 right-4 bg-white rounded-[3.5rem] p-10 pb-14 animate-in slide-in-from-bottom-full duration-700 max-h-[92vh] overflow-y-auto shadow-2xl shadow-black/50">
                <div className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-4">
                      {openSection && (
                        <button onClick={() => setOpenSection(null)} className="p-3 bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-transform">
                           <ChevronLeft size={24} />
                        </button>
                      )}
                      <div className="text-left">
                        <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">
                          {openSection || 'OPERATIONS MATRIX'}
                        </h3>
                        {!openSection && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Select Operational Domain</p>}
                      </div>
                   </div>
                   <button onClick={() => setMobileMenuOpen(false)} className="p-4 bg-slate-100 rounded-full active:scale-90 transition-transform"><X size={24} /></button>
                </div>
                
                {!openSection ? (
                  <div className="grid grid-cols-2 gap-5">
                      {NAVIGATION_CONFIG.map(section => {
                        const visibleItems = section.items.map(item => {
                          if (isSuperAdmin) return item;
                          if (item.items) {
                            const visibleSubItems = item.items.filter(sub => canView(sub.id));
                            return visibleSubItems.length > 0 ? { ...item, items: visibleSubItems } : null;
                          }
                          return canView(item.id) ? item : null;
                        }).filter(Boolean);

                        if (visibleItems.length === 0) return null;

                        return (
                          <button 
                            key={section.title}
                            onClick={() => setOpenSection(section.title)}
                            className="p-8 bg-slate-50 rounded-[3rem] flex flex-col items-center gap-4 border border-slate-100 active:scale-95 transition-all duration-300 shadow-sm"
                          >
                             <div className="p-4 bg-white rounded-[1.5rem] shadow-xl shadow-blue-500/5 text-blue-600 border border-slate-100">
                                <section.icon size={28} />
                             </div>
                             <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] text-center italic">{section.title}</span>
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-right duration-500">
                     {NAVIGATION_CONFIG.find(s => s.title === openSection)?.items.map(item => (
                        <div key={item.id} className="space-y-3">
                           {item.items ? (
                              <>
                                <div className="flex items-center gap-3 px-3">
                                  <div className="h-px bg-slate-100 flex-1"></div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{item.label}</p>
                                  <div className="h-px bg-slate-100 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                   {(isSuperAdmin ? item.items : item.items.filter(sub => canView(sub.id))).map(sub => (
                                      <button
                                        key={sub.id}
                                        onClick={() => { onNavigate(sub.id); setMobileMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all duration-300 ${
                                          activePage === sub.id 
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/40' 
                                            : 'bg-slate-50 text-slate-800 border border-slate-100 active:bg-slate-100'
                                        }`}
                                      >
                                         <div className="flex items-center gap-5">
                                            <sub.icon size={22} className={activePage === sub.id ? 'text-white' : 'text-blue-500'} />
                                            <span className="text-[11px] font-black uppercase tracking-[0.15em] italic">{sub.label}</span>
                                         </div>
                                         <ChevronRight size={18} className="opacity-40" />
                                      </button>
                                   ))}
                                </div>
                              </>
                           ) : (
                              (isSuperAdmin || canView(item.id)) && (
                                <button
                                  onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                                  className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] transition-all duration-300 ${
                                    activePage === item.id 
                                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/40' 
                                      : 'bg-slate-50 text-slate-800 border border-slate-100 active:bg-slate-100'
                                  }`}
                                >
                                   <div className="flex items-center gap-5">
                                      <item.icon size={22} className={activePage === item.id ? 'text-white' : 'text-blue-500'} />
                                      <span className="text-[11px] font-black uppercase tracking-[0.15em] italic">{item.label}</span>
                                   </div>
                                   <ChevronRight size={18} className="opacity-40" />
                                </button>
                              )
                           )}
                        </div>
                     ))}
                  </div>
                )}

                <div className="mt-12 pt-10 border-t border-slate-100">
                  <button 
                    onClick={onLogout}
                    className="w-full py-6 bg-rose-50 text-rose-600 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 border border-rose-100 shadow-sm shadow-rose-500/5 active:scale-95 transition-all"
                  >
                    <LogOut size={22} /> TERMINATE OPS SESSION
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default V3Layout;
