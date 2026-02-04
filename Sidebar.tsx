
import React from 'react';
import { Role } from './types';
import {
  LayoutDashboard, Users, Package,
  Receipt, Wallet, ShieldCheck, LogOut,
  Signal, Database, UserCheck, FileInput, ShieldAlert, Settings, Server, ChevronRight, MessageSquare
} from 'lucide-react';

interface SidebarProps {
  current: string;
  onNavigate: (page: any) => void;
  role: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate, role, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.RECOVERY_MANAGER] },
    { id: 'users', label: 'User Registry', icon: Users, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.RECOVERY_MANAGER] },
    { id: 'packages', label: 'ISP Packages', icon: Package, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
    { id: 'recovery', label: 'Recoveries', icon: Receipt, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.RECOVERY_MANAGER, Role.FIELD_AGENT, Role.TEAM_MEMBER] },
    { id: 'accounting', label: 'Accounting Ledger', icon: Wallet, roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT] },
    { id: 'import', label: 'Bulk Operations', icon: FileInput, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    { id: 'archive', label: 'System Archive', icon: Database, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    { id: 'staff', label: 'Access Control', icon: ShieldAlert, roles: [Role.SUPER_ADMIN] },
    { id: 'permissions', label: 'Governance Matrix', icon: ShieldCheck, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    { id: 'comm-settings', label: 'Communication Hub', icon: MessageSquare, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
    { id: 'monitor', label: 'Database Monitor', icon: Server, roles: [Role.SUPER_ADMIN, Role.ADMIN] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(role as Role));

  return (
    <aside className="w-64 bg-slate-950 text-white flex flex-col h-screen shrink-0 border-r border-slate-800 transition-all">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <Signal className="text-indigo-500" size={28} />
        <h1 className="text-xl font-black tracking-tighter uppercase italic">Click Opticx</h1>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {allowedItems.map((item) => {
          const isActive = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 border-l-4 border-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
                <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-white/50" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="mb-4 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Session Role</p>
          <p className="text-[10px] font-black text-indigo-400 truncate tracking-tight uppercase">{role}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
