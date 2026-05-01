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
  
  const { canView, role } = usePermissions(state);

  // Toggle Section for Accordion Sidebar
  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-blue-100">
      
      {/* 1. Desktop Sidebar (≥1024px) */}
      <aside 
        className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-500 ease-in-out relative z-30 ${
          isSidebarCollapsed ? 'w-24' : 'w-72'
        }`}
      >
        {/* Logo Section */}
        <div className="h-24 flex items-center px-8 border-b border-white/5 relative overflow-hidden">
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-2xl active:scale-95 transition-transform border border-white/10">
                 <Zap className="text-blue-400 fill-blue-400" size={20} />
              </div>
              {!isSidebarCollapsed && (
                <div>
                    <h1 className="text-lg font-black text-white tracking-tighter italic leading-none">CLICK OPTICX</h1>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">ISP Command Plane</p>
                </div>
              )}
           </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-6 no-scrollbar px-4 space-y-2">
           {NAVIGATION_CONFIG.map((section: NavSection) => {
             const visibleItems = section.items.map(item => {
               if (item.items) {
                 const visibleSubItems = item.items.filter(sub => canView(sub.id));
                 return visibleSubItems.length > 0 ? { ...item, items: visibleSubItems } : null;
               }
               return canView(item.id) ? item : null;
             }).filter(Boolean) as NavItem[];

             if (visibleItems.length === 0) return null;

             const isOpen = openSection === section.title || visibleItems.some(i => i.id === activePage || i.items?.some(sub => sub.id === activePage));
             const isAnyItemActive = visibleItems.some(i => i.id === activePage || i.items?.some(sub => sub.id === activePage));

             return (
               <div key={section.title} className="space-y-1">
                  <button 
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                      isOpen || isAnyItemActive ? 'bg-white/5 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                     <section.icon size={18} className={isAnyItemActive ? 'text-blue-400' : 'group-hover:text-blue-400'} />
                     {!isSidebarCollapsed && (
                       <span className="text-[11px] font-black uppercase tracking-widest flex-1 text-left italic truncate">{section.title}</span>
                     )}
                     {!isSidebarCollapsed && (
                       <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                     )}
                  </button>

                  {/* Nested Items */}
                  {!isSidebarCollapsed && isOpen && (
                    <div className="ml-4 pl-4 border-l border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {visibleItems.map((item: NavItem) => (
                        <div key={item.id}>
                          {item.items ? (
                            <div className="space-y-1">
                               <p className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                               {item.items.map(sub => (
                                 <button
                                   key={sub.id}
                                   onClick={() => onNavigate(sub.id)}
                                   className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                                     activePage === sub.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'
                                   }`}
                                 >
                                   <sub.icon size={14} />
                                   <span className="text-[10px] font-bold uppercase tracking-widest truncate">{sub.label}</span>
                                 </button>
                               ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => onNavigate(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                                activePage === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'
                              }`}
                            >
                               <item.icon size={14} />
                               <span className="text-[10px] font-bold uppercase tracking-widest truncate">{item.label}</span>
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

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/5">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all group"
           >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-widest italic">Terminate</span>}
           </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:shadow-lg transition-all z-40"
        >
           {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Global Header */}
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-20">
            {/* Search / Command Palette */}
            <div className="flex items-center gap-6 flex-1 max-w-xl hidden md:flex">
               <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                     <Command size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search ISP Matrix..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center">
                     <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 shadow-sm">CTRL + K</span>
                  </div>
               </div>
            </div>

            {/* Mobile Header Title */}
            <div className="md:hidden flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center">
                  <Zap size={16} className="text-blue-500 fill-blue-500" />
               </div>
               <h1 className="text-xs font-black text-slate-900 uppercase italic">Click Opticx</h1>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-3 lg:gap-6">
                <div className="hidden sm:flex items-center gap-2">
                   <V2Badge label={role} color="indigo" variant="solid" icon={Shield} />
                </div>

               <div className="flex items-center gap-2 border-l border-slate-100 pl-4 lg:pl-6">
                  <button className="p-3 bg-slate-50 text-slate-500 hover:bg-slate-950 hover:text-white rounded-xl transition-all relative">
                     <Bell size={18} />
                     <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                  </button>
                  
                  <button className="flex items-center gap-3 p-1 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all group">
                     <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                        {state.auth?.name?.charAt(0) || 'A'}
                     </div>
                  </button>
               </div>
            </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-[#F8FAFC] pb-32 lg:pb-12">
            {/* Title Bar */}
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">
                        <Home size={10} />
                        <span>System</span>
                        <ChevronRight size={10} />
                        <span className="text-blue-500">{activePage}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">
                        {activePage.replace('-', ' ')}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Operational Node: {window.location.hostname}</p>
                  </div>
                  
                  {/* Quick Actions Portal */}
                  <div className="flex items-center gap-2">
                      <button className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm">
                         <BarChart3 size={20} />
                      </button>
                      <button className="px-6 py-3 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/10 flex items-center gap-2 active:scale-95">
                         <Zap size={14} className="fill-blue-400 text-blue-400" /> Pulse Monitor
                      </button>
                  </div>
               </div>
            </div>

            {/* Dynamic Page Render */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </div>
        </main>

        {/* 3. Mobile Bottom Navigation (<1024px) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 px-6 flex items-center justify-between z-[100] shadow-[0_-10px_25px_rgba(0,0,0,0.05)] backdrop-blur-xl bg-white/90">
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`flex flex-col items-center gap-1 transition-all ${activePage === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <LayoutDashboard size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">Dash</span>
            </button>
            <button 
              onClick={() => onNavigate('users')}
              className={`flex flex-col items-center gap-1 transition-all ${activePage === 'users' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <Users size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">Users</span>
            </button>
            <div className="relative -top-6">
                <button 
                  onClick={() => setMobileMenuOpen(true)}
                  className="w-16 h-16 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 active:scale-90 transition-transform rotate-45 border-4 border-[#F8FAFC]"
                >
                    <div className="-rotate-45">
                        <Menu size={24} />
                    </div>
                </button>
            </div>
            <button 
              onClick={() => onNavigate('finance')}
              className={`flex flex-col items-center gap-1 transition-all ${activePage === 'finance' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <Wallet size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">Fiscal</span>
            </button>
            <button 
              onClick={() => onNavigate('network')}
              className={`flex flex-col items-center gap-1 transition-all ${activePage === 'network' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <Network size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">Ops</span>
            </button>
        </nav>

        {/* 4. Mobile Overlay Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[110] animate-in fade-in duration-300">
             <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom-full duration-500">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-black text-slate-900 italic tracking-tighter">System Matrix</h3>
                   <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-slate-100 rounded-full"><X size={20} /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    {NAVIGATION_CONFIG.map(section => {
                      const visibleItems = section.items.map(item => {
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
                          onClick={() => { setOpenSection(section.title); /* Expand and show sub-items? */ }}
                          className="p-6 bg-slate-50 rounded-[2rem] flex flex-col items-center gap-3 border border-slate-100 active:scale-95 transition-all"
                        >
                           <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                              <section.icon size={24} />
                           </div>
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] text-center">{section.title}</span>
                        </button>
                      );
                    })}
                </div>

                <button 
                  onClick={onLogout}
                  className="w-full mt-8 py-5 bg-rose-50 text-rose-600 rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 border border-rose-100"
                >
                  <LogOut size={18} /> Terminate All Sessions
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default V3Layout;
