
import React, { useState } from 'react';
import { AppState, Role } from '../types';
import { db } from '../db';
import {
  ShieldCheck, Lock, Unlock, Eye, Pencil, Trash2,
  Plus, X, Shield, Activity, Info, AlertTriangle,
  Settings, UserPlus, Users, Check, Ban, ShieldAlert,
  ArrowRight, Fingerprint, Key, Zap, RefreshCw, Layers
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

const PermissionsPage: React.FC<{ state: AppState }> = ({ state }) => {
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isDeletingRole, setIsDeletingRole] = useState<string | null>(null);

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
    await db.addRole(newRoleName.trim().toUpperCase());
    setNewRoleName('');
    setIsAddRoleModalOpen(false);
  };

  const handleDeleteRole = async (roleName: string) => {
    if (roleName === Role.SUPER_ADMIN) return;
    await db.deleteRole(roleName);
    setIsDeletingRole(null);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 rounded-full border border-blue-500/30">
              <ShieldCheck size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Identity Architecture Console</span>
            </div>
            <h2 className="text-5xl font-black tracking-tight italic flex items-center gap-4 leading-none">
              Authority Matrix
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
            </h2>
            <p className="text-slate-400 font-bold max-w-2xl text-sm leading-relaxed uppercase tracking-tight">
              Manage system-wide scope tiers and cryptographic module access. Authority protocols are hierarchical and propagate instantly across node endpoints.
            </p>
          </div>

          <button
            onClick={() => setIsAddRoleModalOpen(true)}
            className="group flex items-center gap-4 px-8 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs hover:bg-slate-50 transition-all active:scale-95 shadow-2xl uppercase tracking-[0.2em] relative overflow-hidden shrink-0"
          >
            <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-600 transition-all group-hover:w-3"></div>
            <UserPlus size={18} className="text-blue-600" />
            Provision New Tier
          </button>
        </div>
        
        {/* Decorative elements */}
        <Layers className="absolute -right-20 -bottom-20 text-blue-500/10 scale-[8]" />
        <Fingerprint className="absolute right-40 top-10 text-white/5 size-48 rotate-12" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* SIDEBAR: ROLES MANAGEMENT */}
        <div className="xl:col-span-1 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-10 space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Users size={16} className="text-blue-500" />
                Auth Tiers
              </h3>
              <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black text-slate-900">{state.roles.length} Active</span>
            </div>

            <div className="space-y-3 relative z-10">
              {state.roles.map(role => (
                <div key={role} className={`group flex items-center justify-between p-5 rounded-3xl border transition-all ${
                  role === Role.SUPER_ADMIN 
                  ? 'bg-slate-950 border-slate-900 text-white shadow-2xl' 
                  : 'bg-white border-slate-100 text-slate-700 hover:border-blue-600/30 hover:shadow-lg'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${role === Role.SUPER_ADMIN ? 'bg-blue-600' : 'bg-slate-50 border border-slate-100'}`}>
                      {role === Role.SUPER_ADMIN ? <Key size={14} /> : <Shield size={14} className="text-slate-400" />}
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-tight block">{role}</span>
                      {role === Role.SUPER_ADMIN && <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Root Protocol</span>}
                    </div>
                  </div>
                  {role !== Role.SUPER_ADMIN && (
                    <button
                      onClick={() => setIsDeletingRole(role)}
                      className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 bg-blue-50/50 border border-blue-100/50 rounded-[2rem] space-y-4 relative z-10">
              <div className="flex items-center gap-3 text-blue-700">
                <Info size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Security Directive</span>
              </div>
              <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase opacity-70 italic">
                Permissions are additive. Root users bypass all matrix checks. Sub-tiers require explicit view-scope for terminal initialization.
              </p>
            </div>
          </div>

          <div className="bg-green-600 rounded-[3rem] p-10 text-white shadow-xl shadow-green-50 space-y-4 relative overflow-hidden group">
            <Zap className="absolute -right-4 -bottom-4 size-32 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Authority Pulse</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic tracking-tighter">99.2%</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-green-300">Entropy Compliance</span>
            </div>
            <p className="text-[10px] leading-relaxed font-bold uppercase opacity-60">Matrix synchronization verified across all clusters.</p>
          </div>
        </div>

        {/* MAIN CONSOLE: PERMISSION MATRIX */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200 overflow-hidden flex flex-col h-[850px]">
            <div className="p-10 bg-slate-950 text-white flex justify-between items-center sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                   <Settings size={28} className="text-white animate-[spin_8s_linear_infinite]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Scope Terminal</h3>
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Real-time Cryptographic Matrix</p>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-10">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Entry</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-600 uppercase">View Scope</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Logic</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-600 uppercase">Edit Scope</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Purge</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-600 uppercase">Drop Scope</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl">
                  <tr className="border-b border-slate-100">
                    <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] min-w-[250px] bg-slate-50/50">Cryptic Module Targets</th>
                    {state.roles.map(role => (
                      <th key={role} className={`px-8 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-center min-w-[180px] border-l border-slate-100 shadow-sm ${role === Role.SUPER_ADMIN ? 'text-blue-600 bg-blue-50/30' : 'text-slate-500 bg-slate-50/10'}`}>
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(state.permissions || []).map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-50 group/row transition-all duration-300">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover/row:bg-blue-600 group-hover/row:text-white group-hover/row:shadow-lg group-hover/row:shadow-blue-100 transition-all">
                             <Activity size={18} />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 uppercase tracking-tight text-sm block leading-none mb-1">{perm.id}</span>
                            <div className="flex items-center gap-2">
                              <RefreshCw size={10} className="text-green-500" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Sink</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {(state.roles || []).map(role => {
                        const canView = perm.view?.includes(role) || false;
                        const canEdit = perm.edit?.includes(role) || false;
                        const canDelete = perm.delete?.includes(role) || false;
                        const isSuperAdmin = role === Role.SUPER_ADMIN;

                        return (
                          <td key={role} className={`px-6 py-6 border-l border-slate-50 ${isSuperAdmin ? 'bg-blue-50/10' : ''}`}>
                            <div className="flex flex-col gap-3 items-center">
                              {/* VIEW TOGGLE */}
                              <button
                                onClick={() => handleTogglePermission(perm.id, 'view', role)}
                                disabled={isSuperAdmin}
                                className={`flex items-center justify-between px-4 py-3 rounded-2xl w-full transition-all border-2 ${canView
                                    ? 'bg-green-600 border-green-500 text-white shadow-xl shadow-green-100'
                                    : 'bg-white text-slate-300 border-slate-100 opacity-60'
                                  } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:-translate-y-1 active:scale-95'}`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest">Entry</span>
                                {canView ? <Check size={14} strokeWidth={4} /> : <Ban size={14} />}
                              </button>

                              {/* EDIT TOGGLE */}
                              <button
                                onClick={() => handleTogglePermission(perm.id, 'edit', role)}
                                disabled={isSuperAdmin || !canView}
                                className={`flex items-center justify-between px-4 py-3 rounded-2xl w-full transition-all border-2 ${canEdit
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-100'
                                    : 'bg-white text-slate-300 border-slate-100 opacity-60'
                                  } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:-translate-y-1 active:scale-95'} ${!canView && !isSuperAdmin ? 'opacity-20 grayscale pointer-events-none' : ''}`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest">Logic</span>
                                {canEdit ? <Pencil size={12} strokeWidth={3} /> : <Ban size={12} />}
                              </button>

                              {/* DELETE TOGGLE */}
                              <button
                                onClick={() => handleTogglePermission(perm.id, 'delete', role)}
                                disabled={isSuperAdmin || !canView || !canEdit}
                                className={`flex items-center justify-between px-4 py-3 rounded-2xl w-full transition-all border-2 ${canDelete
                                    ? 'bg-rose-600 border-rose-500 text-white shadow-xl shadow-rose-100'
                                    : 'bg-white text-slate-300 border-slate-100 opacity-60'
                                  } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:-translate-y-1 active:scale-95'} ${(!canView || !canEdit) && !isSuperAdmin ? 'opacity-20 grayscale pointer-events-none' : ''}`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest">Purge</span>
                                {canDelete ? <Trash2 size={12} strokeWidth={3} /> : <Ban size={12} />}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* FOOTER PADDING */}
                  <tr><td colSpan={state.roles.length + 1} className="py-20 opacity-0 italic text-center uppercase font-black text-slate-300 tracking-[1em]">End of Cryptic Terminal</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title="Tier Forge"
        type="form"
        icon={<UserPlus size={20} className="text-blue-400" />}
        maxWidth="max-w-lg"
        onConfirm={handleAddRole}
        confirmLabel="Authorize Tier"
      >
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block italic">Scope Descriptor</label>
          <div className="relative">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
            <input
              type="text"
              autoFocus
              className="w-full pl-12 pr-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl outline-none focus:border-blue-500 transition-all font-black text-xl text-white uppercase tracking-tighter"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="E.G. TECHNICAL_UNIT"
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Role Confirm Modal */}
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


