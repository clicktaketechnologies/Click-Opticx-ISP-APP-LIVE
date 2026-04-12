import React, { useState, useEffect, useMemo } from 'react';
import { Role } from '../types';
import { db } from '../db';
import {
  LayoutDashboard, Users, Package,
  Receipt, Wallet, ShieldCheck, LogOut,
  Wifi, Building2, FileText, Search, FileInput, ShieldAlert, Server, Smartphone, Zap, CreditCard, BarChart3, Trophy, ChevronRight, Network,
  ClipboardList, LifeBuoy, ListTodo, Info, Database, Monitor, Key, HardDrive, Map, Cpu, Sparkles, Calculator, History, Activity, Mic,
  Mail, Send, ListChecks, BellRing, Settings, UserCheck, ChevronDown, ChevronUp, UserCircle, RefreshCcw, DatabaseZap, PanelLeftClose, PanelLeft, Gauge,
  Ticket, Archive
} from 'lucide-react';
import { useBranding } from '../hooks/useBranding';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
  badgeColor?: 'red' | 'yellow' | 'green';
  items?: SidebarItem[]; 
}

interface SidebarSection {
  title: string | null;
  items: SidebarItem[];
}

interface SidebarProps {
  current: string;
  onNavigate: (page: string) => void;
  role: string;
  onLogout: () => void;
  isOpen: boolean; 
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  businessName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate, role, onLogout, isOpen, isCollapsed, onToggleCollapse, businessName }) => {
  const state = db.getState();
  const branding = useBranding();
  const appearance = state.settings.appearance;

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const safeLower = (val: any) => (val || "").toString().toLowerCase();

  // Calculate badges
  const newSignupsCount = (state.signupRequests || []).filter(r => r.status === 'Pending').length;
  const kycPendingCount = (state.users || []).filter(u => u.kyc_status === 'pending' || (u.isKYCSubmitted && !u.isKYCVerified)).length;
  const packageRequestsCount = (state.packageRequests || []).filter(r => r.status === 'Pending').length;
  const topupRequestsCount = (state.topupRequests || []).filter(r => r.status === 'Pending').length;
  const anyApprovalCount = ((state.approvalRequests || []) as any[]).filter(r => r.status === 'Pending').length;
  
  const pendingApprovals = newSignupsCount + kycPendingCount + packageRequestsCount + topupRequestsCount + anyApprovalCount;

  const pendingTicketsCount = (state.tickets || []).filter(t => t.status === 'Open').length;
  const emergencyCount = (state.emergencyLoads || []).filter(l => l.status === 'Pending_Activation' || l.status === 'Pending').length;
  const offlineUsersCount = (state.users || []).filter(u => ['Offline', 'Expired', 'Suspended'].includes(u.status)).length;
  const invoicePendingCount = (state.invoices || []).filter(i => i.status === 'Unpaid' || i.status === 'Overdue').length;

  const sections: SidebarSection[] = useMemo(() => [
    {
      title: 'Dashboard',
      items: [
        { id: 'dashboard', label: 'Business Overview', icon: LayoutDashboard },
        { id: 'monitor', label: 'System Status', icon: Server }
      ]
    },
    {
      title: 'AI & Automation',
      items: [
        { id: 'ai-control', label: 'AI System', icon: Cpu },
        { id: 'ai-central', label: 'AI Control Plane', icon: Sparkles },
        { id: 'ai-calling', label: 'AI Call System', icon: Mic },
        { id: 'ai-call-logs', label: 'Call Logs', icon: History },
        { 
          id: 'group-comms', label: 'Communications', icon: Mail, 
          items: [
             { id: 'notification-control', label: 'Notification Master', icon: BellRing },
             { id: 'comm-templates', label: 'Smart Templates', icon: FileText },
             { id: 'comm-campaigns', label: 'Email Campaigns', icon: Send },
             { id: 'admin-user-devices', label: 'Push Devices', icon: Smartphone },
             { id: 'comm-push', label: 'Manual Dispatch', icon: Zap },
             { id: 'comm-rules', label: 'Auto Actions', icon: Cpu },
             { id: 'comm-segments', label: 'Audiences', icon: Users },
             { id: 'comm-logs', label: 'Gateway Logs', icon: ListChecks },
             { id: 'comm-settings', label: 'Comms Setup', icon: Settings },
          ]
        }
      ]
    },
    {
      title: 'Network Management',
      items: [
        {
          id: 'group-monitoring', label: 'Monitoring', icon: Activity, badge: offlineUsersCount > 0 ? offlineUsersCount : undefined, badgeColor: 'red',
          items: [
            { id: 'admin-live-monitoring', label: 'Network Monitor', icon: Monitor, badge: offlineUsersCount > 0 ? offlineUsersCount : undefined, badgeColor: 'red' },
            { id: 'speed-test', label: 'Speed Test', icon: Gauge },
            { id: 'system-readiness', label: 'System Diagnostics', icon: Activity },
          ]
        },
        {
          id: 'group-infra', label: 'Infrastructure', icon: HardDrive,
          items: [
            { id: 'admin-devices', label: 'OLT Devices', icon: HardDrive },
            { id: 'olt-management', label: 'OLT Infrastructure', icon: Cpu },
            { id: 'nas-management', label: 'Router Settings', icon: Server },
            { id: 'system-config', label: 'System Gateway', icon: Settings },
          ]
        },
        {
          id: 'group-connectivity', label: 'User Connectivity', icon: Network,
          items: [
            { id: 'admin-device-mapping', label: 'User Device Mapping', icon: Map },
            { id: 'connection-setup', label: 'Setup Connection', icon: Network },
            { id: 'hotspot-tokens', label: 'Hotspot Desk', icon: Ticket },
            { id: 'noc-dashboard', label: 'Network Control Panel', icon: Zap },
          ]
        }
      ]
    },
    {
      title: 'Users & Access',
      items: [
        { id: 'users', label: 'All Users', icon: Users, badge: offlineUsersCount > 0 ? offlineUsersCount : undefined, badgeColor: 'red' },
        { id: 'customer-360', label: 'Find Users', icon: Search },
        {
          id: 'group-crm', label: 'Subscriber Relations', icon: Users,
          items: [
            { id: 'users', label: 'Subscriber Accounts', icon: UserCircle, badge: offlineUsersCount > 0 ? offlineUsersCount : undefined, badgeColor: 'red' },
            { id: 'approval-desk', label: 'Service Approvals', icon: UserCheck, badge: pendingApprovals > 0 ? pendingApprovals : undefined, badgeColor: 'yellow' },
            { id: 'packages', label: 'Resource Packages', icon: Package },
            { id: 'tickets', label: 'Support Queue', icon: LifeBuoy, badge: pendingTicketsCount > 0 ? pendingTicketsCount : undefined, badgeColor: 'yellow' },
          ]
        },
        {
          id: 'group-approvals', label: 'Approvals', icon: ShieldCheck, badge: pendingApprovals > 0 ? pendingApprovals : undefined, badgeColor: 'yellow',
          items: [
             { id: 'approval-desk', label: 'Approval Requests', icon: ShieldCheck, badge: pendingApprovals > 0 ? pendingApprovals : undefined, badgeColor: 'yellow' },
             { id: 'admin-password-requests', label: 'Password Reset Requests', icon: Key },
          ]
        },
        {
          id: 'group-partners', label: 'Partners', icon: Building2,
          items: [
            { id: 'dealers', label: 'Dealers / Partners', icon: Building2 }
          ]
        }
      ]
    },
    {
       title: 'Billing & Finance',
       items: [
         { id: 'invoice-engine', label: 'Billing System', icon: Calculator },
         { id: 'invoice-management', label: 'Invoices', icon: ClipboardList, badge: invoicePendingCount > 0 ? invoicePendingCount : undefined, badgeColor: 'yellow' },
         { id: 'gateway-settings', label: 'Payment Methods', icon: CreditCard },
         { id: 'accounting', label: 'Transaction History', icon: History },
         {
           id: 'group-advanced-finance', label: 'Advanced', icon: Wallet, badge: emergencyCount > 0 ? emergencyCount : undefined, badgeColor: 'red',
           items: [
             { id: 'recovery', label: 'Payment Recovery', icon: Receipt },
             { id: 'wallet', label: 'Wallet & Balance', icon: Wallet },
             { id: 'emergency-load', label: 'Emergency Balance', icon: Zap, badge: emergencyCount > 0 ? emergencyCount : undefined, badgeColor: 'red' },
             { id: 'admin-reminders', label: 'Admin Alerts', icon: BellRing },
           ]
         }
       ]
    },
    {
      title: 'Internet Services',
      items: [
        { id: 'packages', label: 'Internet Packages', icon: Package },
        { id: 'import', label: 'Import Users', icon: FileInput },
        { id: 'archive-records', label: 'Past Records', icon: Archive },
      ]
    },
    {
      title: 'Support & Tasks',
      items: [
        { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy, badge: pendingTicketsCount > 0 ? pendingTicketsCount : undefined, badgeColor: 'yellow' },
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
      ]
    },
    {
      title: 'Staff & Roles',
      items: [
        { id: 'staff', label: 'Staff Management', icon: ShieldAlert },
        { id: 'permissions', label: 'Roles & Permissions', icon: ShieldCheck },
      ]
    },
    {
      title: 'Compliance & Identity',
      items: [
        { 
          id: 'kyc-hub', 
          label: 'KYC Hub', 
          icon: ShieldCheck, 
          badge: db.getPendingKYCCount() || undefined 
        },
        { id: 'cloud-storage', label: 'Multi-Cloud Sync', icon: HardDrive },
      ]
    },
    {
      title: 'System Configuration',
      items: [
        {
          id: 'group-core-settings', label: 'Core Settings', icon: Settings,
          items: [
             { id: 'user-app', label: 'App Settings', icon: Smartphone },
             { id: 'business-settings', label: 'Brand Settings', icon: Building2 },
             { id: 'about-us', label: 'About Us', icon: Info },
          ]
        },
        {
           id: 'group-system-tools', label: 'System Tools', icon: DatabaseZap,
           items: [
             { id: 'system-flash', label: 'System Flash', icon: Zap },
             { id: 'auth-control', label: 'Smart Auth (CSAE)', icon: ShieldCheck },
             { id: 'system-deployment', label: 'Deployment Hub', icon: ShieldCheck },
           ]
        }
      ]
    }
  ], [pendingApprovals, pendingTicketsCount, role, state.settings.appearance, state.users, state.permissions]);

  const hasAccess = (id: string) => {
    if (role === Role.SUPER_ADMIN) return true;
    if (id === 'ai-calling' && !appearance.showAICalling) return false;
    
    if (id.startsWith('group-')) return true;

    const modulePerm = state.permissions.find(p => p.id === id);
    if (modulePerm) return modulePerm.view.includes(role);
    if (role === Role.ADMIN) return true;
    if (role === Role.BUSINESS_ADMIN && ['business-settings', 'dashboard', 'about-us', 'auth-control', 'notification-control', 'notification-analytics', 'comm-templates', 'comm-logs', 'admin-user-devices'].includes(id)) return true;
    if (role === Role.FINANCE_ADMIN && ['approval-desk', 'wallet', 'recovery', 'accounting', 'invoice-engine', 'invoice-management', 'gateway-settings', 'emergency-load'].includes(id)) return true;
    if (role === Role.SUPPORT_ADMIN && ['approval-desk', 'customer-360', 'user-app', 'tickets', 'about-us', 'admin-password-requests', 'notification-control', 'comm-templates', 'admin-user-devices'].includes(id)) return true;
    if (role === Role.NETWORK_ADMIN && ['admin-live-monitoring', 'admin-devices', 'admin-device-mapping', 'connection-setup', 'about-us', 'system-readiness', 'noc-dashboard', 'olt-management', 'nas-management', 'system-config'].includes(id)) return true;
    if (['tasks', 'about-us'].includes(id)) return true;
    return false;
  };

  useEffect(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.items) {
          if (item.items.some(subItem => subItem.id === current || (subItem.id === 'gateway-settings' && current.startsWith('gateway-')))) {
            setOpenDropdown(item.id);
            return;
          }
        }
      }
    }
  }, [current, sections]);

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCollapsed) {
       onToggleCollapse();
       setOpenDropdown(id);
    } else {
       setOpenDropdown(prev => prev === id ? null : id);
    }
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    if (item.items) {
       const visibleChildren = item.items.filter(child => hasAccess(child.id) && (searchQuery === '' || safeLower(child.label).includes(searchQuery.toLowerCase())));
       if (visibleChildren.length === 0) return null;

       const isOpen = (openDropdown === item.id || searchQuery !== '') && !isCollapsed;
       const isChildActive = item.items.some(sub => current === sub.id || (sub.id === 'gateway-settings' && current.startsWith('gateway-')));

       return (
         <div key={item.id} className="mb-0.5 relative group/dropdown">
           <button
             onClick={(e) => toggleDropdown(item.id, e)}
             className={`w-full flex items-center justify-between px-3 h-[44px] rounded-lg transition-colors duration-[150ms] active:scale-[0.98] group relative ${isOpen || isChildActive ? 'hover:bg-[#1E293B]' : 'hover:bg-[#1E293B]'} ${level > 0 && !isCollapsed ? 'ml-3 w-[calc(100%-0.75rem)]' : ''}`}
           >
             {/* Smooth Active Indicator Bar */}
             <div className={`absolute left-0 top-1 bottom-1 w-[3px] bg-[#3B82F6] rounded-r-full transition-transform duration-[200ms] ease-out origin-center ${isChildActive && !isOpen ? 'scale-y-100' : 'scale-y-0'}`}></div>

             <div className="flex items-center gap-[12px] w-full">
               <div className="relative shrink-0 flex items-center justify-center">
                 <item.icon size={20} style={{ transitionDuration: '150ms' }} className={`transition-transform group-hover:scale-105 group-hover:text-white ${isChildActive || isOpen ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}`} />
                 {item.badge && isCollapsed && (
                    <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-[#0F172A]"></span>
                 )}
               </div>
               {!isCollapsed && (
                 <span className={`font-semibold text-[13px] tracking-wide transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${isChildActive ? 'text-white' : 'text-[#94A3B8]'}`}>
                   {item.label}
                 </span>
               )}
             </div>
             {!isCollapsed && (
               <div className="flex items-center gap-2 shrink-0">
                  {item.badge && <span className="bg-rose-500 shadow-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{item.badge}</span>}
                  <ChevronDown size={14} style={{ transitionDuration: '200ms' }} className={`text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
               </div>
             )}
           </button>
           
           {/* Tooltip for collapsed mode dropdown parent */}
           {isCollapsed && (
              <div className="absolute left-[75px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 translate-y-[2px] invisible group-hover/dropdown:opacity-100 group-hover/dropdown:translate-y-[-50%] group-hover/dropdown:visible transition-all duration-[150ms] whitespace-nowrap z-[200] shadow-xl pointer-events-none before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-800">
                 {item.label} {item.badge && `(${item.badge})`}
              </div>
           )}

           {/* Dropdown Items container */}
           <div 
             className="overflow-hidden transition-all duration-200 ease-out"
             style={{ 
               opacity: isOpen ? 1 : 0,
               maxHeight: isOpen ? '1000px' : '0px',
               transform: isOpen ? 'translateY(0)' : 'translateY(-5px)',
             }}
           >
             <div className="mt-1 mb-2 space-y-0.5 rounded-lg py-1 px-1">
               {visibleChildren.map(child => renderItem(child, level + 1))}
             </div>
           </div>
         </div>
       );
    }

    if (!hasAccess(item.id)) return null;
    if (searchQuery !== '' && !safeLower(item.label).includes(searchQuery.toLowerCase())) return null;

    const isActive = current === item.id || (item.id === 'gateway-settings' && current.startsWith('gateway-'));
    
    return (
      <div key={item.id} className="relative group/item mb-0.5 w-full">
         <button
           onClick={() => {
              if (isCollapsed) onToggleCollapse(); 
              onNavigate(item.id);
           }}
           className={`w-full flex items-center justify-between px-3 h-[44px] rounded-lg transition-all duration-[150ms] active:scale-[0.98] group overflow-hidden relative ${isActive
             ? 'bg-[rgba(59,130,246,0.12)]'
             : 'hover:bg-[#1E293B]'
             } ${level > 0 && !isCollapsed ? 'ml-3 w-[calc(100%-0.75rem)]' : ''}`}
         >
           {/* Smooth Active Indicator Bar */}
           <div className={`absolute left-0 top-1 bottom-1 w-[3px] bg-[#3B82F6] rounded-r-full transition-transform duration-[200ms] ease-out origin-center block ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></div>

           <div className="flex items-center gap-[12px] w-full">
             <div className="relative shrink-0 flex items-center justify-center">
                 <item.icon size={20} style={{ transitionDuration: '150ms' }} className={`transition-transform delay-75 group-hover:scale-105 group-hover:text-white ${isActive ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}`} />
                 {item.badge ? isCollapsed && (
                    <span className={`absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full border-2 border-[#0F172A] shadow-sm ${item.badgeColor === 'red' ? 'bg-rose-500' : item.badgeColor === 'green' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                 ) : null}
             </div>
             {!isCollapsed && (
               <span className={`font-semibold text-[13px] tracking-wide transition-colors duration-[150ms] whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-white'}`}>
                 {item.label}
               </span>
             )}
           </div>
           {!isCollapsed && (
             <div className="flex items-center shrink-0">
                 {item.badge ? <span className={`${item.badgeColor === 'red' ? 'bg-rose-500' : item.badgeColor === 'green' ? 'bg-emerald-500' : 'bg-amber-500'} text-white shadow-sm text-[10px] font-bold px-1.5 py-0.5 rounded-md`}>{item.badge}</span> : null}
             </div>
           )}
         </button>
         
         {/* Tooltip for collapsed mode item */}
         {isCollapsed && (
             <div className="absolute left-[75px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 translate-y-[2px] invisible group-hover/item:opacity-100 group-hover/item:translate-y-[-50%] group-hover/item:visible transition-all duration-[150ms] whitespace-nowrap z-[200] shadow-xl pointer-events-none before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-slate-800">
               {item.label}
            </div>
         )}
      </div>
    );
  };

  const renderSection = (section: SidebarSection, index: number) => {
    const visibleItemCount = section.items.reduce((count, item) => {
        if (item.items) {
           return count + item.items.filter(child => hasAccess(child.id) && (searchQuery === '' || safeLower(child.label).includes(searchQuery.toLowerCase()))).length;
        }
        return count + (hasAccess(item.id) && (searchQuery === '' || safeLower(item.label).includes(searchQuery.toLowerCase())) ? 1 : 0);
    }, 0);

    if (visibleItemCount === 0) return null;

    return (
      <div key={index} className="space-y-0.5 mb-[24px] relative">
        {!isCollapsed && section.title && (
          <h3 className="px-4 text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-2opacity-80 transition-all">
             {section.title}
          </h3>
        )}
        {/* Divider line for collapsed mode instead of text */}
        {isCollapsed && index > 0 && section.title && (
           <div className="w-8 h-px border-t border-white/5 mx-auto my-[12px]"></div>
        )}
        <div className="space-y-0.5">
          {section.items.map(item => renderItem(item))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay Background with Blur */}
      <div 
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[110] lg:hidden transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
      ></div>

      {/* Main Sidebar */}
      <aside 
         className={`fixed inset-y-0 left-0 z-[120] bg-slate-900 flex flex-col h-screen shrink-0 border-r border-slate-800 transition-[width,transform] duration-[250ms] ease-out will-change-[width,transform] shadow-xl ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
         } lg:translate-x-0 ${isCollapsed ? 'w-[72px]' : 'w-[260px] max-w-[80vw]'}`}
      >
        {/* Header / Logo Area */}
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/5 shrink-0 relative overflow-hidden">
          <div className="flex items-center gap-3 overflow-hidden w-full transition-all">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 group transition-colors bg-white/5 rounded-xl border border-white/10">
              {branding.logo || branding.logoDark || branding.logoSquare ? (
                <img 
                  src={branding.logo || branding.logoDark || branding.logoSquare} 
                  className="w-full h-full object-contain p-1.5" 
                  alt="Logo"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/favicon.png'; }}
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Monitor size={16} className="text-white" />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col transform transition-all duration-300 origin-left">
                <h4 className="text-sm text-white font-bold tracking-tight leading-tight truncate max-w-[140px]">
                    {branding.brandName || branding.appTitle || "ClickOptix"}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">
                    Administrator
                </p>
              </div>
            )}
          </div>
          
          {/* Desktop Toggle Button */}
          <button 
             onClick={onToggleCollapse}
             className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 w-7 h-12 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-400 items-center justify-center rounded-l-xl transition-all duration-200 shadow-xl border-y border-l border-white/5 z-50 translate-x-1/2 hover:translate-x-0"
             title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
             {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        
        {/* Search Area */}
        <div className={`p-4 shrink-0 transition-all duration-250 ${isCollapsed ? 'h-auto flex justify-center' : 'h-auto'}`}>
           {isCollapsed ? (
              <button 
                onClick={() => { onToggleCollapse(); setTimeout(() => document.getElementById('sidebar-search')?.focus(), 250); }}
                className="btn btn-icon btn-secondary !bg-white/5 !border-white/10 !text-slate-400 hover:!text-white hover:!bg-white/10"
              >
                 <Search size={18} />
              </button>
           ) : (
             <div className="relative group animate-in fade-in duration-200">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-blue-400' : 'text-slate-500'}`} size={16} />
                <input 
                   id="sidebar-search"
                   type="text" 
                   placeholder="Search menu..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onFocus={() => setIsSearchFocused(true)}
                   onBlur={() => setIsSearchFocused(false)}
                   className="w-full bg-black/20 border border-white/5 rounded-xl h-12 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
             </div>
           )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
          <div className="pt-2">
            {sections.map(renderSection)}
          </div>
        </nav>
        
        {/* Footer Area */}
        <div className="p-4 border-t border-white/5 shrink-0 relative overflow-hidden">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-lg border border-white/10">
                    {(state.currentUser?.name || "A").charAt(0)}
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-sm font-bold text-white truncate max-w-[100px]">{state.currentUser?.name || "Admin"}</p>
                   <p className="text-[10px] text-blue-400 font-bold uppercase truncate opacity-70 tracking-tighter">{role}</p>
                 </div>
              </div>
              <button 
                 onClick={onLogout} 
                 className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-all active:scale-95 group"
                 title="Logout"
              >
                 <LogOut size={16} className="group-hover:scale-110" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg border border-white/10 group relative cursor-pointer">
                  {(state.currentUser?.name || "A").charAt(0)}
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 translate-x-2 invisible group-hover:opacity-100 group-hover:translate-x-0 group-hover:visible transition-all whitespace-nowrap z-[200] shadow-2xl">
                     {state.currentUser?.name || "Admin"} ({role})
                  </div>
               </div>
               <button 
                  onClick={onLogout} 
                  className="btn btn-icon !bg-rose-500/10 !text-rose-500 hover:!bg-rose-500 hover:!text-white group relative"
               >
                  <LogOut size={18} />
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg opacity-0 translate-x-2 invisible group-hover:opacity-100 group-hover:translate-x-0 group-hover:visible transition-all whitespace-nowrap z-[200] shadow-2xl">
                     Logout System
                  </div>
               </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
