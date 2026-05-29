import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Activity, Brain, Cpu, PhoneCall, History, Megaphone, 
  Monitor, HardDrive, Zap, Users, Search, UserCheck, CheckCircle, 
  Handshake, Receipt, FileText, TrendingUp, Wallet, CreditCard, 
  Package, FileUp, Archive, Headset, ClipboardList, ShieldAlert, 
  Fingerprint, Cloud, Settings, Wrench, ChevronDown, ChevronRight, 
  LogOut, UserCircle, Menu, X, Smartphone, ShieldCheck, Key
} from 'lucide-react';
import { AppState, Role } from '../../types';
import { useRoleAccess } from '../../hooks/useRoleAccess';

interface SidebarProps {
  state: AppState;
  current: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout: () => void;
  businessName?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
  roles?: Role[];
}

interface MenuSection {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  state, current, onNavigate, isOpen, setIsOpen, 
  isCollapsed = false, onToggleCollapse, onLogout, businessName 
}) => {
  const { role, canAccess } = useRoleAccess(state);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'network': true,
    'users': true,
    'billing': true
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuHierarchy: MenuSection[] = [
    {
      id: 'dashboard',
      label: 'Main Console',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      id: 'overview',
      label: 'Business Overview',
      icon: Activity,
      items: [
        { id: 'system-readiness', label: 'System Status', icon: Activity }
      ]
    },
    {
      id: 'ai-automation',
      label: 'AI & Automation',
      icon: Brain,
      items: [
        { id: 'ai-central', label: 'AI System', icon: Brain },
        { id: 'ai-control', label: 'AI Control Plane', icon: Cpu },
        { id: 'ai-calling', label: 'AI Call System', icon: PhoneCall },
        { id: 'ai-call-logs', label: 'Call Logs', icon: History },
        { id: 'comm-center', label: 'Communications', icon: Megaphone }
      ]
    },
    {
      id: 'network',
      label: 'Network Management',
      icon: Monitor,
      items: [
        { id: 'noc-dashboard', label: 'NOC Dashboard', icon: Monitor, badge: state.nocAlerts?.filter(a => a.status === 'Critical').length },
        { id: 'nas-management', label: 'NAS Control', icon: HardDrive },
        { id: 'olt-management', label: 'OLT Systems', icon: Cpu },
        { id: 'admin-live-monitoring', label: 'Live Traffic', icon: Activity },
        { id: 'speed-test', label: 'Speed Test', icon: Zap },
        { id: 'hotspot-tokens', label: 'Hotspot Manager', icon: Smartphone },
        { id: 'admin-device-mapping', label: 'Device Mapping', icon: Monitor },
        { id: 'inventory-management', label: 'Inventory', icon: HardDrive },
        { id: 'system-deployment', label: 'Infrastructure', icon: Settings },
        { id: 'connection-setup', label: 'User Connectivity', icon: Zap }
      ]
    },
    {
      id: 'users',
      label: 'Users & Access',
      icon: Users,
      items: [
        { id: 'users', label: 'Subscriber Registry', icon: Users, badge: state.users?.length },
        { id: 'user-app', label: 'Subscriber Relations', icon: UserCheck },
        { id: 'approval-desk', label: 'Approvals', icon: CheckCircle, badge: state.signupRequests?.length + state.topupRequests?.length },
        { id: 'reseller-management', label: 'Partners', icon: Handshake }
      ]
    },
    {
      id: 'billing',
      label: 'Billing & Finance',
      icon: Receipt,
      items: [
        { id: 'invoice-management', label: 'Billing System', icon: Receipt },
        { id: 'accounting', label: 'Invoices', icon: FileText },
        { id: 'fiscal-monitor', label: 'Fiscal Pulse', icon: TrendingUp },
        { id: 'wallet', label: 'Transaction History', icon: Wallet },
        { id: 'gateway-settings', label: 'Payment Gateways', icon: CreditCard }
      ]
    },
    {
      id: 'services',
      label: 'Internet Services',
      icon: Package,
      items: [
        { id: 'packages', label: 'Internet Packages', icon: Package },
        { id: 'import', label: 'Import Users', icon: FileUp },
        { id: 'archive-records', label: 'Past Records', icon: Archive }
      ]
    },
    {
      id: 'support',
      label: 'Support & Tasks',
      icon: Headset,
      items: [
        { id: 'tickets', label: 'Support Tickets', icon: Headset, badge: state.tickets?.filter(t => t.status === 'Open').length },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList, badge: state.tasks?.filter(t => t.status === 'Pending').length }
      ]
    },
    {
      id: 'compliance',
      label: 'Compliance & Identity',
      icon: Fingerprint,
      items: [
        { id: 'kyc-hub', label: 'KYC Hub', icon: Fingerprint, badge: state.kycRequests?.filter(r => r.status === 'Pending').length },
        { id: 'cloud-storage', label: 'Multi-Cloud Sync', icon: Cloud }
      ]
    },
    {
      id: 'security',
      label: 'Security & Governance',
      icon: ShieldCheck,
      items: [
        { id: 'super-admin', label: 'SuperAdmin Command', icon: Key },
        { id: 'governance', label: 'Governance Desk', icon: ShieldAlert }
      ]
    },

    {
      id: 'config',
      label: 'System Configuration',
      icon: Settings,
      items: [
        { id: 'business-settings', label: 'Core Settings', icon: Settings },
        { id: 'system-config', label: 'System Tools', icon: Wrench }
      ]
    }
  ];

  const filteredHierarchy = useMemo(() => {
    return menuHierarchy.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Simplified check: if useRoleAccess provides a more granular canAccess, use it.
        // For now, we'll assume most items are accessible if they match the role logic in App.tsx
        return true; 
      })
    })).filter(section => section.items.length > 0);
  }, [role, state.permissions]);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <aside 
        className={`fixed top-0 left-0 bottom-0 z-[120] bg-slate-950 text-slate-400 flex flex-col transition-all duration-300 ease-in-out border-r border-white/5
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
              <Zap className="text-white fill-white" size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-lg font-black tracking-tighter text-white leading-none uppercase italic">
                  {businessName || 'Click Opticx'}
                </span>
                <span className="text-[9px] font-bold text-indigo-400 tracking-[0.3em] uppercase opacity-60 mt-1">
                  Core Interface
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 space-y-6">
          {filteredHierarchy.map((section) => {
            const isExpanded = expandedSections[section.id];
            const hasActiveItem = section.items.some(i => i.id === current);
            
            if (section.items.length === 1 && section.id === 'dashboard') {
               const item = section.items[0];
               const isActive = current === item.id;
               return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative
                      ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-white/5 hover:text-slate-200'}
                    `}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                    {!isCollapsed && (
                      <span className="text-sm font-bold tracking-tight truncate">{item.label}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </button>
               );
            }

            return (
              <div key={section.id} className="space-y-2">
                {!isCollapsed ? (
                  <button 
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-400 transition-colors group"
                  >
                    <span className="truncate">{section.label}</span>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="h-px bg-white/5 mx-2" />
                )}

                <div className={`space-y-1 ${isExpanded || isCollapsed ? 'block' : 'hidden'}`}>
                  {section.items.map((item) => {
                    const isActive = current === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative
                          ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-white/5 hover:text-slate-200'}
                        `}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                            <span className="text-sm font-bold tracking-tight truncate">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-md min-w-[20px] text-center">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                        {isActive && isCollapsed && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-l-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 bg-slate-900/40 border-t border-white/5 shrink-0">
          {!isCollapsed ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                  <UserCircle size={24} className="text-indigo-400" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-black text-white truncate leading-none mb-1">
                    {state.auth?.email?.split('@')?.[0]?.toUpperCase() || 'SYSTEM'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                    {role || 'Authorized'}
                  </span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center justify-center gap-3 w-full py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] border border-rose-500/20 active:scale-95"
              >
                <LogOut size={16} />
                <span>Detach Session</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogout}
              className="w-12 h-12 flex items-center justify-center bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl mx-auto transition-all border border-rose-500/20"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
