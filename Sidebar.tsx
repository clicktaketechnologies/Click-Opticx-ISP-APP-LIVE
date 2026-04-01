import React, { useState, useMemo } from 'react';
import { Role } from './types';
import {
  LayoutDashboard, Users, Package,
  Receipt, Wallet, ShieldCheck, LogOut,
  Wifi, Database, UserCheck, FileInput, ShieldAlert, Settings, Server, ChevronRight, DatabaseZap,
  Lock, Zap, Mail, Briefcase, Activity, BarChart3, Globe, Landmark,
  Smartphone, MessageSquare, Bell, ClipboardList, HardDrive, Cpu, 
  ChevronDown, Key, FileText, Headphones, Monitor, UserCircle
} from 'lucide-react';

interface SidebarProps {
  current: string;
  onNavigate: (page: any) => void;
  role: string;
  onLogout: () => void;
  isOpen?: boolean;
  businessName?: string;
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

const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate, role, onLogout, isOpen, businessName }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'operations': true,
    'network': true,
    'finance': true
  });

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const menuStructure: MenuSection[] = [
    {
      id: 'core',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Overview', icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.RECOVERY_MANAGER] }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Activity,
      items: [
        { id: 'approval-desk', label: 'Approval Center', icon: ShieldCheck, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
        { id: 'users', label: 'Subscribers', icon: Users, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECOVERY_MANAGER] },
        { id: 'connection-setup', label: 'Onboarding Hub', icon: Zap, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.FIELD_AGENT] },
        { id: 'tickets', label: 'Support Desk', icon: Headphones, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.SUPPORT_ADMIN] },
        { id: 'tasks', label: 'Field Tasks', icon: ClipboardList, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.FIELD_AGENT] },
        { id: 'import', label: 'Bulk Ops', icon: FileInput, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      ]
    },
    {
      id: 'network',
      label: 'Network Hub',
      icon: Server,
      items: [
        { id: 'noc-dashboard', label: 'NOC Health', icon: Activity, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'nas-management', label: 'NAS Control', icon: HardDrive, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'olt-management', label: 'OLT Systems', icon: Cpu, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'admin-live-monitoring', label: 'Live Traffic', icon: Monitor, roles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN] },
        { id: 'monitor', label: 'DB Engine', icon: Database, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      ]
    },
    {
      id: 'finance',
      label: 'Financials',
      icon: Wallet,
      items: [
        { id: 'accounting', label: 'Account Ledger', icon: Landmark, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
        { id: 'invoice-management', label: 'Billing Engine', icon: FileText, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
        { id: 'wallet', label: 'Client Wallets', icon: Wallet, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
        { id: 'recovery-dashboard', label: 'Recoveries', icon: Receipt, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.RECOVERY_MANAGER] },
        { id: 'emergency-load', label: 'Nano Credits', icon: Zap, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
      ]
    },
    {
      id: 'growth',
      label: 'Growth & AI',
      icon: Zap,
      items: [
        { id: 'ai-control', label: 'Control Plane', icon: Cpu, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'ai-calling', label: 'Voice AI', icon: MessageSquare, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN] },
        { id: 'comm-campaigns', label: 'Campaign Manager', icon: Mail, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN] },
        { id: 'comm-segments', label: 'Audience Segments', icon: Users, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN] },
        { id: 'comm-templates', label: 'Msg Templates', icon: FileText, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN] },
        { id: 'comm-push', label: 'Push Hub', icon: Bell, roles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN] },
        { id: 'comm-logs', label: 'Delivery Logs', icon: FileText, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      ]
    },
    {
      id: 'support',
      label: 'Support & Tasks',
      icon: Headphones,
      items: [
        { id: 'tickets', label: 'Support Desk', icon: Headphones, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.SUPPORT_ADMIN] },
        { id: 'tasks', label: 'Field Tasks', icon: ClipboardList, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.FIELD_AGENT] },
        { id: 'customer-360', label: 'Customer 360', icon: UserCheck, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN] },
        { id: 'admin-reminders', label: 'Site Reminders', icon: Bell, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: Settings,
      items: [
        { id: 'packages', label: 'ISP Plans', icon: Package, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
        { id: 'auth-control', label: 'Security Gate', icon: Lock, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'permissions', label: 'Global RBAC', icon: ShieldCheck, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'gateway-settings', label: 'Payment API', icon: Landmark, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'staff', label: 'Access Control', icon: ShieldAlert, roles: [Role.SUPER_ADMIN] },
        { id: 'business-settings', label: 'Branding', icon: Globe, roles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN] },
      ]
    },
    {
      id: 'system',
      label: 'System Utility',
      icon: Database,
      items: [
        { id: 'system-flash', label: 'Audit Trail', icon: DatabaseZap, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'archive', label: 'Archives', icon: HardDrive, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
        { id: 'cache', label: 'System Cache', icon: Cpu, roles: [Role.SUPER_ADMIN] },
        { id: 'about-us', label: 'Version Info', icon: Globe, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
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
    <aside className="w-72 bg-slate-950 text-white flex flex-col h-screen shrink-0 border-r border-slate-800 transition-all selection:bg-blue-500/30">
      {/* Brand Section */}
      <div className="p-8 flex items-center gap-4 border-b border-slate-800 bg-slate-950/50">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/20 rotate-3">
          <Wifi className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">{businessName || 'Click Opticx'}</h1>
          <p className="text-[8px] font-black text-blue-500 tracking-[0.4em] uppercase opacity-70">Core Engine</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar pt-8">
        {filteredStructure.map((section) => {
          const isExpanded = expandedSections[section.id];
          const hasActiveItem = section.items.some(i => i.id === current);
          
          return (
            <div key={section.id} className="space-y-3">
              {section.id !== 'core' && (
                <button 
                  onClick={(e) => toggleSection(section.id, e)}
                  className="flex items-center justify-between w-full px-4 group select-none"
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={14} className={`${hasActiveItem ? 'text-blue-500' : 'text-slate-600'} transition-colors group-hover:text-blue-400`} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${hasActiveItem ? 'text-slate-100' : 'text-slate-500'} group-hover:text-slate-300 transition-colors`}>
                      {section.label}
                    </span>
                  </div>
                  <ChevronDown 
                    size={12} 
                    className={`text-slate-600 group-hover:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              )}

              <div className={`space-y-1 overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {section.items.map((item) => {
                  const isActive = current === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-300 group relative ${isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                        : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon 
                          size={16} 
                          className={`${isActive ? 'text-blue-500' : 'text-slate-600 group-hover:text-blue-400'} transition-colors`} 
                        />
                        <span className={`font-bold text-[11px] tracking-wide ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                          {item.label}
                        </span>
                      </div>
                      
                      {isActive ? (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgb(59,130,246)]"></div>
                      ) : (
                        <ChevronRight size={12} className="text-slate-700 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
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
      <div className="mx-4 mb-4 p-5 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800/50 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
            <UserCircle size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-100 uppercase tracking-widest">{role}</p>
            <p className="text-[8px] font-bold text-blue-500 uppercase tracking-tight">Active Identity</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white/[0.03] hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 active:scale-95"
        >
          <LogOut size={14} />
          <span>Detach Link</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

