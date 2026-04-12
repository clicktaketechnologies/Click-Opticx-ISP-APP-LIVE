
import React, { useState, useMemo } from 'react';
import { AppState, Role } from '../types';
import { db } from '../db';
import {
  ShieldCheck, Lock, Unlock, Eye, Pencil, Trash2,
  Plus, X, Shield, Activity, Info, AlertTriangle,
  Settings, UserPlus, Users, Check, Ban, ShieldAlert,
  ArrowRight, Fingerprint, Key, Zap, RefreshCw, Layers,
  LayoutDashboard, Brain, Mic, FileAudio, Mail, FileText, 
  Terminal, Bell, Monitor, Server, Map, UserCircle, Search, 
  Smartphone, Briefcase, Receipt, CreditCard, Flame, Wallet, 
  Landmark, FileInput, Archive, UserCheck, Globe, Headphones, 
  ChevronRight, Sparkles, ClipboardList
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

// Human-readable mapping for module IDs
const MODULE_METADATA: Record<string, { label: string; icon: any }> = {
  'dashboard': { label: 'Global Overview', icon: LayoutDashboard },
  'ai-control': { label: 'AI Intelligence Plane', icon: Brain },
  'ai-calling': { label: 'Voice AI Agents', icon: Mic },
  'ai-call-logs': { label: 'AI Voice Telemetry', icon: FileAudio },
  'monitor': { label: 'Engine Integrity', icon: Activity },
  'comm-campaigns': { label: 'Distribution Hub', icon: Mail },
  'comm-templates': { label: 'Blueprint Registry', icon: FileText },
  'comm-rules': { label: 'Logic Automations', icon: Terminal },
  'comm-push': { label: 'Pulse Notifications', icon: Bell },
  'comm-segments': { label: 'Audience Sectors', icon: Users },
  'comm-identities': { label: 'Sender Protocols', icon: Fingerprint },
  'comm-logs': { label: 'Broadcast History', icon: ClipboardList },
  'comm-settings': { label: 'Communication Core', icon: Settings },
  'admin-live-monitoring': { label: 'Vital Telemetry', icon: Monitor },
  'admin-devices': { label: 'Network Nodes', icon: Server },
  'admin-device-mapping': { label: 'Infrastructure Grid', icon: Map },
  'connection-setup': { label: 'Service Activation', icon: Zap },
  'users': { label: 'Identity Registry', icon: UserCircle },
  'customer-360': { label: 'Full Dossier View', icon: Search },
  'approval-desk': { label: 'Compliance Vault', icon: ShieldCheck },
  'admin-password-requests': { label: 'Security Requests', icon: Key },
  'user-app': { label: 'Subscriber Portal', icon: Smartphone },
  'dealers': { label: 'Partner Network', icon: Briefcase },
  'invoice-engine': { label: 'Fiscal Generator', icon: Receipt },
  'invoice-management': { label: 'Billing Records', icon: FileText },
  'gateway-settings': { label: 'Payment Protocols', icon: CreditCard },
  'recovery': { label: 'Arrears Management', icon: Flame },
  'wallet': { label: 'Capital Registry', icon: Wallet },
  'accounting': { label: 'Fiscal Ledger', icon: Landmark },
  'emergency-load': { label: 'Nano Credits', icon: Zap },
  'packages': { label: 'Service Catalog', icon: Layers },
  'import': { label: 'Mass Operations', icon: FileInput },
  'archive': { label: 'Vault Archives', icon: Archive },
  'staff': { label: 'Personnel Registry', icon: UserCheck },
  'permissions': { label: 'Matrix Governance', icon: ShieldAlert },
  'business-settings': { label: 'Core Identity', icon: Globe },
  'about-us': { label: 'Brand Story', icon: Info },
  'tasks': { label: 'Mission Control', icon: ClipboardList },
  'tickets': { label: 'Support Handlers', icon: Headphones },
};

const PermissionsPage: React.FC<{ state: AppState }> = ({ state }) => {
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isDeletingRole, setIsDeletingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(Role.SUPER_ADMIN);

  const handleTogglePermission = (moduleId: string, action: 'view' | 'edit' | 'delete', role: string) => {
    if (role === Role.SUPER_ADMIN) return;

    const module = state.permissions.find(p => p.id === moduleId);
    if (!module) return;

    const currentRoles = [...(module[action] || [])];
    const hasRole = currentRoles.includes(role);

    const newRoles = hasRole
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    db.updateModulePermission(moduleId, { [action]: newRoles });
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    const roleId = newRoleName.trim().toUpperCase();
    await db.addRole(roleId);
    setNewRoleName('');
    setIsAddRoleModalOpen(false);
    setSelectedRole(roleId);
  };

  const handleDeleteRole = async (roleName: string) => {
    if (roleName === Role.SUPER_ADMIN) return;
    await db.deleteRole(roleName);
    setIsDeletingRole(null);
    if (selectedRole === roleName) {
      setSelectedRole(Role.SUPER_ADMIN);
    }
  };

  const assignedStaff = useMemo(() => {
    return (state.staff || []).filter(s => s.role === selectedRole);
  }, [state.staff, selectedRole]);

  return (
    <div className="min-h-screen animate-in fade-in duration-700 pb-20 space-y-10">
      {/* ─── HEADER SECTION ─── */}
      <div className="relative overflow-hidden bg-slate-950 rounded-[4rem] p-12 text-white shadow-2xl border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-500/30">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Identity Architecture Console</span>
            </div>
            <h2 className="text-6xl font-black tracking-tight italic flex items-center gap-4 leading-none">
              Matrix Governance
              <span className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.6)]"></span>
            </h2>
            <p className="text-slate-400 font-bold max-w-2xl text-sm leading-relaxed uppercase tracking-tight">
              Manage system-wide scope tiers and cryptographic module access. Authority protocols are hierarchical and propagate instantly across node endpoints.
            </p>
          </div>

          <button
            onClick={() => setIsAddRoleModalOpen(true)}
            className="group flex items-center gap-4 px-10 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl uppercase tracking-[0.2em] relative overflow-hidden shrink-0 border border-white/10"
          >
            <div className="absolute inset-y-0 left-0 w-1.5 bg-white/20 transition-all group-hover:w-3"></div>
            <UserPlus size={18} />
            Initialize Tier
          </button>
        </div>
        
        {/* Decorative elements */}
        <Layers className="absolute -right-20 -bottom-20 text-indigo-500/10 scale-[12] rotate-12" />
        <Fingerprint className="absolute right-40 top-10 text-white/5 size-64 rotate-12" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/10 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ─── LEFT PANEL: ROLE SELECTOR ─── */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl p-8 space-y-8 sticky top-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Shield size={16} className="text-indigo-600" />
                Sovereign Tiers
              </h3>
              <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-indigo-600">{state.roles.length} Nodes</span>
            </div>

            <div className="space-y-2">
              {state.roles.map(role => {
                const isActive = selectedRole === role;
                const staffCount = (state.staff || []).filter(s => s.role === role).length;
                
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full group flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden ${
                      isActive 
                      ? 'bg-slate-950 border-slate-900 text-white shadow-2xl scale-[1.02]' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-600/30 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-600/40' : 'bg-slate-50 border border-slate-100 group-hover:bg-white'
                      }`}>
                        {role === Role.SUPER_ADMIN ? <Key size={16} /> : <Shield size={16} className={isActive ? 'text-white' : 'text-slate-400'} />}
                      </div>
                      <div className="text-left">
                        <span className={`text-[11px] font-black uppercase tracking-tight block ${isActive ? 'text-white' : 'text-slate-900'}`}>{role}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                            {staffCount} {staffCount === 1 ? 'AGENT' : 'AGENTS'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isActive && (
                      <ChevronRight size={14} className="text-slate-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    )}
                    {isActive && (
                      <div className="absolute inset-y-0 right-0 w-1.5 bg-indigo-500"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] relative overflow-hidden">
               <Sparkles className="absolute -right-4 -bottom-4 text-indigo-500/5 size-20" />
               <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase italic relative z-10">
                 Select a tier to audit its cryptographic permissions and personnel distribution.
               </p>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL: MATRIX & STAFF ─── */}
        <div className="lg:col-span-9 space-y-10">
          {/* PERMISSION MATRIX */}
          <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col h-[750px] relative">
            <div className="p-10 bg-slate-950 text-white flex justify-between items-center sticky top-0 z-20 border-b border-white/5">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                   {selectedRole === Role.SUPER_ADMIN ? <Key size={32} /> : <ShieldAlert size={32} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-none">{selectedRole}</h3>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black tracking-widest uppercase border border-white/10">Scope Protocol v1.2</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Activity size={12} className="text-indigo-500" />
                    Cryptographic Permission Matrix
                  </p>
                </div>
              </div>

              {selectedRole !== Role.SUPER_ADMIN && (
                 <button
                   onClick={() => setIsDeletingRole(selectedRole)}
                   className="flex items-center gap-3 px-6 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all font-black text-[9px] uppercase tracking-widest border border-rose-500/20 active:scale-95 shadow-xl"
                 >
                   <Trash2 size={14} />
                   Revoke Entire Tier
                 </button>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                  <tr>
                    <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Target System Modules</th>
                    <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Authority Matrix (Entry • Logic • Purge)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {state.permissions.map(perm => {
                    const metadata = MODULE_METADATA[perm.id] || { label: perm.id, icon: Activity };
                    const Icon = metadata.icon;
                    const canView = perm.view?.includes(selectedRole) || false;
                    const canEdit = perm.edit?.includes(selectedRole) || false;
                    const canDelete = perm.delete?.includes(selectedRole) || false;
                    const isSuperAdmin = selectedRole === Role.SUPER_ADMIN;

                    return (
                      <tr key={perm.id} className="hover:bg-slate-50 transition-all group/row">
                        <td className="px-12 py-10">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/row:bg-indigo-600 group-hover/row:text-white group-hover/row:shadow-xl group-hover/row:shadow-indigo-100 transition-all duration-500">
                               <Icon size={24} />
                            </div>
                            <div>
                              <span className="font-black text-slate-900 uppercase tracking-tight text-base block leading-none mb-2">{metadata.label}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Lock size={10} className="text-indigo-500" />
                                  {perm.id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-10">
                          <div className="flex items-center justify-center gap-1.5 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100/50 w-fit mx-auto shadow-inner">
                            {/* HORIZONTAL TOGGLES */}
                            <button
                              onClick={() => handleTogglePermission(perm.id, 'view', selectedRole)}
                              disabled={isSuperAdmin}
                              className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] transition-all border-2 font-black text-[10px] uppercase tracking-widest ${
                                canView 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-slate-100 text-slate-300'
                              } ${isSuperAdmin ? 'cursor-default' : 'hover:-translate-y-1 active:scale-95 hover:shadow-xl'}`}
                            >
                              <Eye size={14} strokeWidth={canView ? 3 : 2} />
                              Entry
                            </button>

                            <div className="w-px h-6 bg-slate-200 mx-1"></div>

                            <button
                              onClick={() => handleTogglePermission(perm.id, 'edit', selectedRole)}
                              disabled={isSuperAdmin || !canView}
                              className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] transition-all border-2 font-black text-[10px] uppercase tracking-widest ${
                                canEdit 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-slate-100 text-slate-300'
                              } ${isSuperAdmin ? 'cursor-default' : 'hover:-translate-y-1 active:scale-95'}`}
                            >
                              <Pencil size={14} strokeWidth={canEdit ? 3 : 2} />
                              Logic
                            </button>

                            <div className="w-px h-6 bg-slate-200 mx-1"></div>

                            <button
                              onClick={() => handleTogglePermission(perm.id, 'delete', selectedRole)}
                              disabled={isSuperAdmin || !canView || !canEdit}
                              className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] transition-all border-2 font-black text-[10px] uppercase tracking-widest ${
                                canDelete 
                                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-100' 
                                : 'bg-white border-slate-100 text-slate-300'
                              } ${isSuperAdmin ? 'cursor-default' : 'hover:-translate-y-1 active:scale-95'}`}
                            >
                              <Trash2 size={14} strokeWidth={canDelete ? 3 : 2} />
                              Purge
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ASSIGNED PERSONNEL */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-xl p-12 space-y-10 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                   <UserCheck size={18} className="text-emerald-500" />
                   Active Guardians
                </h4>
                <p className="text-2xl font-black tracking-tight text-slate-900 italic">Personnel Assigned to {selectedRole}</p>
              </div>
              <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {assignedStaff.length} Nodes Online
              </div>
            </div>

            {assignedStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {assignedStaff.map(staff => (
                  <div key={staff.email} className="group/staff flex items-center gap-5 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-500">
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover/staff:bg-emerald-600 group-hover/staff:text-white transition-all shadow-sm">
                       <UserCircle size={32} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none mb-1">{staff.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 lowercase italic opacity-80">{staff.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[3rem] relative z-10">
                 <AlertTriangle className="size-16 text-slate-200 mx-auto mb-6" />
                 <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No active nodes registered for this scope tier.</p>
              </div>
            )}
            
            {/* Background decorative staff icon */}
            <Users className="absolute -right-20 -bottom-20 text-emerald-500/5 size-80 group-hover:scale-110 transition-transform duration-1000" />
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Tier Forge"
        type="form"
        icon={<UserPlus size={20} className="text-indigo-400" />}
        maxWidth="max-w-lg"
        onConfirm={handleAddRole}
        confirmLabel="Authorize Tier"
      >
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block italic">Scope Descriptor</label>
          <div className="relative">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
            <input
              type="text"
              autoFocus
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-xl text-slate-900 uppercase tracking-tighter placeholder:text-slate-300"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="E.G. TECHNICAL_UNIT"
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!isDeletingRole}
        onClose={() => setIsDeletingRole(null)}
        title="Revoke Tier?"
        type="danger"
        maxWidth="max-w-md"
        onConfirm={() => isDeletingRole && handleDeleteRole(isDeletingRole)}
        confirmLabel="Purge Identity"
        confirmDanger
        cancelLabel="Relinquish"
        message={`Destroying the "${isDeletingRole}" scope tier will instantly purge system access for all node agents.`}
      />
    </div>
  );
};

export default PermissionsPage;


