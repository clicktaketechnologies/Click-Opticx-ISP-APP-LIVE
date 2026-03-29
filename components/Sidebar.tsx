
import React from 'react';
import { Role } from '../types';
import { db } from '../db';
import {
  LayoutDashboard, Users, Package,
  Receipt, Wallet, ShieldCheck, LogOut,
  Wifi, Building2, FileText, Search, FileInput, ShieldAlert, Server, Smartphone, Zap, CreditCard, BarChart3, Trophy, ChevronRight, Network,
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
      items: [{ id: 'dashboard', label: 'Business Overview', icon: LayoutDashboard }]
    },
    {
      title: 'AI Assistant',
      items: [
        { id: 'ai-control', label: 'AI System', icon: Cpu },
        { id: 'ai-calling', label: 'AI Call System', icon: Mic },
        { id: 'ai-call-logs', label: 'Call Logs', icon: History },
        { id: 'monitor', label: 'System Status', icon: Server },
      ]
    },
    {
      title: 'Messages & Notifications',
      items: [
        { id: 'comm-campaigns', label: 'Email Messages', icon: Send },
        { id: 'comm-templates', label: 'Email Templates', icon: FileText },
        { id: 'comm-rules', label: 'Auto Messages', icon: Zap },
        { id: 'comm-push', label: 'Send Notifications', icon: BellRing },
        { id: 'comm-segments', label: 'User Groups', icon: Users },
        { id: 'comm-logs', label: 'Message History', icon: ListChecks },
        { id: 'comm-settings', label: 'Email Settings', icon: Zap },
      ]

    },
    {
      title: 'Network Monitor',
      items: [
        { id: 'admin-live-monitoring', label: 'Network Monitor', icon: Monitor },
        { id: 'noc-dashboard', label: 'Network Control Panel', icon: Zap },
        { id: 'admin-devices', label: 'OLT Devices', icon: HardDrive },
        { id: 'admin-device-mapping', label: 'User Device Mapping', icon: Map },
        { id: 'connection-setup', label: 'Setup Connection', icon: Network },
        { id: 'nas-management', label: 'Router Settings', icon: Server },
        { id: 'olt-management', label: 'OLT Settings', icon: Monitor },
        { id: 'tasks', label: 'Tasks', icon: ListTodo },
        { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
      ]
    },
    {
      title: 'Users & System',
      items: [
        { id: 'users', label: 'All Users', icon: Users },
        { id: 'customer-360', label: 'Find Users', icon: Search },
        { id: 'approval-desk', label: 'Approval Requests', icon: ShieldCheck },
        { id: 'admin-password-requests', label: 'Password Reset Requests', icon: Key },
        { id: 'user-app', label: 'App Settings', icon: Smartphone },
        { id: 'dealers', label: 'Dealers / Partners', icon: Building2 },
      ]
    },
    {
      title: 'Billing & Payments',
      items: [
        { id: 'invoice-engine', label: 'Billing System', icon: Calculator },
        { id: 'invoice-management', label: 'Invoices', icon: ClipboardList },
        { id: 'gateway-settings', label: 'Payment Methods', icon: CreditCard },
        { id: 'recovery', label: 'Payment Recovery', icon: Receipt },
        { id: 'wallet', label: 'Wallet & Balance', icon: Wallet },
        { id: 'accounting', label: 'Transaction History', icon: History },
        { id: 'emergency-load', label: 'Emergency Balance', icon: Zap },
        { id: 'admin-reminders', label: 'Admin Alerts', icon: BellRing },
      ]
    },
    {
      title: 'Internet Packages',
      items: [
        { id: 'packages', label: 'Internet Packages', icon: Package },
        { id: 'import', label: 'Import Users', icon: FileInput },
        { id: 'archive', label: 'Old Records', icon: Database },
      ]
    },
    {
      title: 'Staff Management',
      items: [
        { id: 'staff', label: 'Staff Management', icon: ShieldAlert },
        { id: 'permissions', label: 'Roles & Permissions', icon: ShieldCheck },
        { id: 'nas-management', label: 'MikroTik / NAS', icon: Server },
        { id: 'olt-management', label: 'OLT Infrastructure', icon: Cpu },
        { id: 'network-monitor', label: 'Network Monitor', icon: Monitor },
      ]
    },
    {
      title: 'System Diagnostics',
      items: [
        { id: 'system-readiness', label: 'Setup Readiness', icon: Activity },
        { id: 'system-config', label: 'System Gateway', icon: Settings },
        { id: 'system-flash', label: 'System Flash', icon: Zap },
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
                  ? isAI ? 'bg-slate-900 text-blue-400 shadow-2xl border-l-4 border-blue-500' : isComm ? 'bg-blue-900 text-white border-l-4 border-green-400' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 border-l-4 border-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} className={isActive ? (isAI ? 'text-blue-400' : 'text-white') : 'text-slate-500 group-hover:text-blue-400'} />
                  <span className={`font-black text-[11px] uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </div>
                {isActive && !isAI && !isComm && <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>}
                {isAI && <Sparkles size={12} className="text-blue-400 animate-pulse" />}
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
              <Wifi className="text-blue-500" size={24} />
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="text-[10px] text-white font-black uppercase italic tracking-tighter">
                {state.settings?.branding?.appTitle || "Click Optix ISP"}
            </h4>
            <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">
                {state.settings?.branding?.appSubtitle || "SYSTEM v1.2.6-LIVE"}
            </p>
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
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <p className="text-[10px] font-black text-blue-400 uppercase truncate">{role}</p>
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

