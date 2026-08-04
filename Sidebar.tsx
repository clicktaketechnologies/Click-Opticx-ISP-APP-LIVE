import React, { useState, useMemo } from 'react';
import { Role } from './types';
import {
  LayoutDashboard, Users, Package,
  Receipt, Wallet, ShieldCheck, LogOut,
  Wifi, Database, UserCheck, FileInput, ShieldAlert, Settings, Server, ChevronRight, DatabaseZap,
  Lock, Zap, Mail, Briefcase, Activity, BarChart3, Globe, Landmark,
  Smartphone, MessageSquare, Bell, ClipboardList, HardDrive, Cpu,
  ChevronDown, Key, FileText, Headphones, Monitor, UserCircle, Layers as LayersIcon, CreditCard
} from 'lucide-react';

interface SidebarProps {
  current: string;
  onNavigate: (page: any) => void;
  role: string;
  onLogout: () => void;
  isOpen?: boolean;
  businessName?: string;
  onBackdropClick?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  roles: Role[];
}

interface MenuSection {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate, role, onLogout, isOpen, businessName, onBackdropClick }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'operations': true,
    'network': true,
    'finance': true,
    'core': true
  });

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuStructure: MenuSection[] = [
    {
      id: 'core',
      label: 'Mission Control',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Primary Terminal', icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.RECOVERY_MANAGER] }
      ]
    },
    {
      id: 'operations',
      label: 'Operational Grid',
      icon: Activity,
      items: [
        { id: 'approval-desk', label: 'Compliance Hub', icon: ShieldCheck, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
        { id: 'users', label: 'Subscriber Registry', icon: Users, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECOVERY_MANAGER] },
        { id: 'connection-setup', label: 'Activation Flow', icon: Zap, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.FIELD_AGENT] },
        { id: 'tickets', label: 'Support Desk', icon: Headphones, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.SUPPORT_ADMIN] },
        { id: 'tasks', label: 'Field Missions', icon: ClipboardList, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.FIELD_AGENT] },
        { id: 'import', label: 'Mass Operations', icon: FileInput, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      ]
    },
    {
      id: 'network',
      label: 'Network Infrastructure',
      icon: Server,
      items: [
        { id: 'noc-dashboard', label: 'NOC Health', icon: Activity, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'nas-management', label: 'NAS Control', icon: HardDrive, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'olt-management', label: 'OLT Systems', icon: Cpu, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'admin-live-monitoring', label: 'Real-time Traffic', icon: Monitor, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'monitor', label: 'Engine Integrity', icon: Database, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      ]
    },
    {
      id: 'finance',
      label: 'Fiscal Protocols',
      icon: Wallet,
      items: [
        { id: 'accounting', label: 'Fiscal Ledger', icon: Landmark, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
        { id: 'invoice-management', label: 'Billing Engine', icon: FileText, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
        { id: 'wallet', label: 'Capital Registry', icon: CreditCard, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
        { id: 'recovery-dashboard', label: 'Recovery Desk', icon: Receipt, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.RECOVERY_MANAGER] },
        { id: 'emergency-load', label: 'Nano Credits', icon: Zap, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
      ]
    },
    {
      id: 'growth',
      label: 'Growth Modules',
      icon: Zap,
      items: [
        { id: 'ai-control', label: 'AI Control Plane', icon: Cpu, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'ai-calling', label: 'Voice AI Agents', icon: MessageSquare, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN] },
        { id: 'comm-campaigns', label: 'Campaign Desk', icon: Mail, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN] },
      ]
    },
    {
      id: 'administration',
      label: 'System Admin',
      icon: Settings,
      items: [
        { id: 'packages', label: 'Connectivity Catalog', icon: LayersIcon, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
        { id: 'auth-control', label: 'Security Gate', icon: Lock, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'permissions', label: 'Access Control', icon: ShieldAlert, roles: [Role.SUPER_ADMIN] },
        { id: 'staff', label: 'Personnel Registry', icon: UserCheck, roles: [Role.SUPER_ADMIN] },
        { id: 'business-settings', label: 'Core Config', icon: Globe, roles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN] },
      ]
    }
  ];

  const filteredStructure = useMemo(() => {
    return menuStructure.map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(role as Role))
    })).filter(section => section.items.length > 0);
  }, [role]);

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] lg:hidden"
          onClick={onBackdropClick}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[120] w-72 bg-slate-950 text-white flex flex-col h-screen shrink-0 transition-all duration-300 transform lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:static selection:bg-indigo-500/30 overflow-hidden border-r border-white/5`}
      >
        {/* Brand Section */}
        <div className="p-8 flex items-center gap-5 bg-slate-950">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-900/40 rotate-12 group transition-all hover:rotate-0">
            <Wifi className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white leading-none">{businessName || 'CLICK OPTICX'}</h1>
            <p className="text-[8px] font-black text-indigo-400 tracking-[0.4em] uppercase opacity-70 mt-2">v9.5.4 Core Engine</p>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto no-scrollbar pt-8 pb-12">
          {filteredStructure.map((section) => {
            const isExpanded = expandedSections[section.id];
            const hasActiveItem = section.items.some(i => i.id === current);

            return (
              <div key={section.id} className="space-y-4">
                <button
                  onClick={(e) => toggleSection(section.id, e)}
                  className="flex items-center justify-between w-full px-4 group select-none transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-all ${hasActiveItem ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-700 group-hover:text-slate-400'}`}>
                      <section.icon size={14} strokeWidth={2.5} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${hasActiveItem ? 'text-slate-100' : 'text-slate-600'} group-hover:text-slate-400 transition-colors`}>
                      {section.label}
                    </span>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`text-slate-700 group-hover:text-slate-400 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                <div className={`space-y-1 overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {section.items.map((item) => {
                    const isActive = current === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-300 group relative ${isActive
                          ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 active:scale-95'
                          : 'text-slate-500 hover:bg-indigo-600/10 hover:text-indigo-500'
                          }`}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <item.icon
                            size={24}
                            strokeWidth={isActive ? 3 : 2}
                            className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-500'} transition-colors`}
                          />
                          <span className={`font-black text-[11px] uppercase italic tracking-wider ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-500'}`}>
                            {item.label}
                          </span>
                        </div>

                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-[1.5rem] shadow-xl"></div>
                        )}

                        {!isActive && (
                          <ChevronRight size={14} className="text-slate-800 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 relative z-10" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Identity Badge */}
        <div className="mx-6 mb-8 p-6 bg-slate-900/50 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-5 relative z-10">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
              <UserCircle size={28} className="text-indigo-400 group-hover:text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-100 uppercase tracking-widest leading-none mb-1 italic">{role}</p>
              <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest opacity-60">Authorized Identity</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-rose-600 text-slate-500 hover:text-white rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 active:scale-95 relative z-10"
          >
            <LogOut size={16} />
            <span>Detach Mission</span>
          </button>
          <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
