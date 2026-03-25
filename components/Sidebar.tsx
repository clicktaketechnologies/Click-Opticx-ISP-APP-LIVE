
import React from 'react';
import { Role } from '../types';
import { db } from '../db';
import {
  LayoutDashboard, Users, Package,
  Receipt, Wallet, ShieldCheck, LogOut,
  Signal, Building2, FileText, Search, FileInput, ShieldAlert, Server, Smartphone, Zap, CreditCard, BarChart3, Trophy, ChevronRight, Network,
  ClipboardList, LifeBuoy, ListTodo, Info, Database, Monitor, Key, HardDrive, Map, Cpu, Sparkles, Calculator, History, Activity, Mic,
  Mail, Send, ListChecks, BellRing, Settings, UserCheck
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
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
  businessName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate, role, onLogout, isOpen, businessName }) => {
  const state = db.getState();
  const branding = state.settings.branding;
  const appearance = state.settings.appearance;

  const sections: SidebarSection[] = [
    {
      title: null,
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    },
    {
      title: 'AI & Automation',
      items: [
        { id: 'ai-control', label: 'AI Control Plane', icon: Cpu },
        { id: 'ai-calling', label: 'AI Voice Relay', icon: Mic },
        { id: 'ai-call-logs', label: 'AI Call History', icon: History },
        { id: 'monitor', label: 'System Health', icon: Server },
      ]
    },
    {
      title: 'Communication Hub',
      items: [
        { id: 'comm-campaigns', label: 'Email Campaigns', icon: Send },
        { id: 'comm-templates', label: 'Email Templates', icon: FileText },
        { id: 'comm-rules', label: 'Automation Rules', icon: Zap },
        { id: 'comm-push', label: 'Push Relay', icon: BellRing },
        { id: 'comm-segments', label: 'Segments', icon: Users },
        { id: 'comm-logs', label: 'Delivery Logs', icon: ListChecks },
        { id: 'comm-settings', label: 'Dispatch Hub', icon: Zap },
      ]

    },
    {
      title: 'Network Operations',
      items: [
        { id: 'admin-live-monitoring', label: 'Network Monitor', icon: Monitor },
        { id: 'noc-dashboard', label: 'NOC Command Center', icon: Zap },
        { id: 'admin-devices', label: 'Network Devices', icon: HardDrive },
        { id: 'admin-device-mapping', label: 'Device Mapping', icon: Map },
        { id: 'connection-setup', label: 'Connection Setup', icon: Network },
        { id: 'nas-management', label: 'NAS Control Plane', icon: Server },
        { id: 'olt-management', label: 'OLT Control Hub', icon: Monitor },
        { id: 'tasks', label: 'Task Manager', icon: ListTodo },
        { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
      ]
    },
    {
      title: 'User Management',
      items: [
        { id: 'users', label: 'User Database', icon: Users },
        { id: 'customer-360', label: 'Search Users', icon: Search },
        { id: 'approval-desk', label: 'Approval Desk', icon: ShieldCheck },
        { id: 'admin-password-requests', label: 'Reset Requests', icon: Key },
        { id: 'user-app', label: 'User App Settings', icon: Smartphone },
        { id: 'dealers', label: 'Partners', icon: Building2 },
      ]
    },
    {
      title: 'Payments & Finance',
      items: [
        { id: 'invoice-engine', label: 'Billing Engine', icon: Calculator },
        { id: 'invoice-management', label: 'Invoices', icon: ClipboardList },
        { id: 'gateway-settings', label: 'Payment Gateways', icon: CreditCard },
        { id: 'recovery', label: 'Recovery Module', icon: Receipt },
        { id: 'wallet', label: 'Financial Wallet', icon: Wallet },
        { id: 'accounting', label: 'Financial Ledger', icon: History },
        { id: 'emergency-load', label: 'Emergency Loads', icon: Zap },
        { id: 'admin-reminders', label: 'Admin Reminders', icon: BellRing },
      ]
    },
    {
      title: 'Packages & Plans',
      items: [
        { id: 'packages', label: 'ISP Packages', icon: Package },
        { id: 'import', label: 'Bulk Operations', icon: FileInput },
        { id: 'archive', label: 'Archives', icon: Database },
      ]
    },
    {
      title: 'Security & Permissions',
      items: [
        { id: 'staff', label: 'Staff Accounts', icon: ShieldAlert },
        { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
        { id: 'auth-control', label: 'Auth Control Center', icon: Key },
      ]
    },
    {
      title: 'Branding & Info',
      items: [
        { id: 'business-settings', label: 'Brand Settings', icon: Building2 },
        { id: 'about-us', label: 'About Us', icon: Info },
      ]
    }
  ];

  const filterItem = (item: SidebarItem) => {
    if (role === Role.SUPER_ADMIN) return true;
    if (item.id === 'ai-calling' && !appearance.showAICalling) return false;
    const modulePerm = state.permissions.find(p => p.id === item.id);
    if (modulePerm) return modulePerm.view.includes(role);
    if (role === Role.ADMIN) return true;
    if (role === Role.BUSINESS_ADMIN && ['business-settings', 'dashboard', 'about-us', 'auth-control'].includes(item.id)) return true;
    if (role === Role.FINANCE_ADMIN && ['approval-desk', 'wallet', 'recovery', 'accounting', 'invoice-engine', 'invoice-management', 'gateway-settings', 'emergency-load'].includes(item.id)) return true;
    if (role === Role.SUPPORT_ADMIN && ['approval-desk', 'customer-360', 'user-app', 'tickets', 'about-us', 'admin-password-requests'].includes(item.id)) return true;
    if (role === Role.NETWORK_ADMIN && ['admin-live-monitoring', 'admin-devices', 'admin-device-mapping', 'connection-setup', 'about-us'].includes(item.id)) return true;
    if (['tasks', 'about-us'].includes(item.id)) return true;
    return false;
  };

  const renderSection = (section: SidebarSection, index: number) => {
    const allowedItems = section.items.filter(filterItem);
    if (allowedItems.length === 0) return null;

    return (
      <div key={index} className="space-y-1 mb-6 last:mb-0">
        {section.title && (
          <h3 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{section.title}</h3>
        )}
        <div className="space-y-0.5">
          {allowedItems.map((item) => {
            const isActive = current === item.id || (item.id === 'gateway-settings' && current.startsWith('gateway-'));
            const isAI = item.id === 'ai-control' || item.id === 'ai-calling' || item.id === 'monitor' || item.id === 'ai-call-logs';
            const isComm = item.id.startsWith('comm-');

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                  ? isAI ? 'bg-slate-900 text-indigo-400 shadow-2xl border-l-4 border-indigo-500' : isComm ? 'bg-indigo-900 text-white border-l-4 border-emerald-400' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 border-l-4 border-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} className={isActive ? (isAI ? 'text-indigo-400' : 'text-white') : 'text-slate-500 group-hover:text-indigo-400'} />
                  <span className={`font-black text-[11px] uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </div>
                {isActive && !isAI && !isComm && <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>}
                {isAI && <Sparkles size={12} className="text-indigo-400 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-[120] w-64 bg-slate-950 text-white flex flex-col h-screen shrink-0 border-r border-slate-800 transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
      <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-white/5">
            {branding.logoDark ? (
              <img src={branding.logoDark} className="w-full h-full object-contain p-1.5" />
            ) : branding.logoSquare ? (
              <img src={branding.logoSquare} className="w-full h-full object-contain p-1" />
            ) : (
              <Signal className="text-indigo-500" size={24} />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter truncate w-32 uppercase italic leading-none">{branding.shortName || businessName}</h1>
            <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">v1.2.5-LIVE-PATCH</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {sections.map(renderSection)}
      </nav>
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-4 shrink-0">
        <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Active Role</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <p className="text-[10px] font-black text-indigo-400 uppercase truncate">{role}</p>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
