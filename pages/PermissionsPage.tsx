
import React, { useState } from 'react';
import { AppState, Role } from '../types';
import { db } from '../db';
import { 
  ShieldCheck, Lock, Unlock, Eye, Pencil, Trash2, 
  Plus, X, Shield, Activity, Info, AlertTriangle, 
  Settings, UserPlus, Users, Check, Ban, ShieldAlert
} from 'lucide-react';

const PermissionsPage: React.FC<{ state: AppState }> = ({ state }) => {
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isDeletingRole, setIsDeletingRole] = useState<string | null>(null);

  const handleTogglePermission = (moduleId: string, action: 'view' | 'edit' | 'delete', role: string) => {
    if (role === Role.SUPER_ADMIN) return;

    const module = state.permissions.find(p => p.id === moduleId);
    if (!module) return;

    const currentRoles = [...module[action]];
    const hasRole = currentRoles.includes(role);
    
    const newRoles = hasRole 
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    db.updateModulePermission(moduleId, { [action]: newRoles });
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    await db.addRole(newRoleName.trim());
    setNewRoleName('');
    setIsAddRoleModalOpen(false);
  };

  const handleDeleteRole = async (roleName: string) => {
    if (roleName === Role.SUPER_ADMIN) return;
    await db.deleteRole(roleName);
    setIsDeletingRole(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={32} />
            Governance & Scope Matrix
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mt-1">
            Centrally authorize system access on a per-module basis. If a role is removed from "View" scope, the module is physically disabled for those users.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddRoleModalOpen(true)}
          className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 uppercase tracking-widest"
        >
          <UserPlus size={18} />
          Create New Scope Tier
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Roles Management Column */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={14} className="text-indigo-500" />
                Defined Roles
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{state.roles.length}</span>
            </div>

            <div className="space-y-2">
              {state.roles.map(role => (
                <div key={role} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${role === Role.SUPER_ADMIN ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-100 group'}`}>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className={role === Role.SUPER_ADMIN ? 'text-amber-400' : 'text-indigo-500'} />
                    <span className="text-xs font-black uppercase tracking-tight">{role}</span>
                  </div>
                  {role !== Role.SUPER_ADMIN && (
                    <button 
                      onClick={() => setIsDeletingRole(role)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl space-y-3 shadow-inner">
               <div className="flex items-center gap-2 text-emerald-700">
                  <Info size={16} />
                  <span className="text-[10px] font-black uppercase">Instructional Note</span>
               </div>
               <p className="text-[10px] text-emerald-800 font-bold leading-relaxed uppercase opacity-80">
                  Access is additive. Remove a role from the "View" row to hide that specific module from the sidebar and block entry entirely.
               </p>
            </div>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[750px]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20 shadow-lg">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-indigo-400" />
                <h3 className="text-lg font-black tracking-tight uppercase">Authority Infrastructure</h3>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Read Scope</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Write Scope</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Drop Scope</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px] shadow-sm">Module Target</th>
                    {state.roles.map(role => (
                      <th key={role} className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center min-w-[150px] border-l border-slate-100 shadow-sm">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.permissions.map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Activity size={16} className="text-indigo-500" />
                          <span className="font-black text-slate-900 uppercase tracking-tight text-xs">{perm.id}</span>
                        </div>
                      </td>
                      {state.roles.map(role => {
                        const canView = perm.view.includes(role);
                        const canEdit = perm.edit.includes(role);
                        const canDelete = perm.delete.includes(role);
                        const isSuperAdmin = role === Role.SUPER_ADMIN;

                        return (
                          <td key={role} className="px-4 py-6 border-l border-slate-50">
                            <div className="flex flex-col gap-2 items-center">
                              {/* VIEW TOGGLE */}
                              <button 
                                onClick={() => handleTogglePermission(perm.id, 'view', role)}
                                disabled={isSuperAdmin}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl w-full transition-all border ${
                                  canView 
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
                                    : 'bg-slate-50 text-slate-300 border-slate-100'
                                } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:scale-[1.03] active:scale-95'}`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest">Access</span>
                                {canView ? <Check size={12} strokeWidth={4} /> : <Ban size={12} />}
                              </button>
                              
                              {/* EDIT TOGGLE */}
                              <button 
                                onClick={() => handleTogglePermission(perm.id, 'edit', role)}
                                disabled={isSuperAdmin || !canView}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl w-full transition-all border ${
                                  canEdit 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                                    : 'bg-slate-50 text-slate-300 border-slate-100'
                                } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:scale-[1.03] active:scale-95'} ${!canView && !isSuperAdmin ? 'opacity-30 grayscale' : ''}`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest">Modify</span>
                                {canEdit ? <Pencil size={12} strokeWidth={3} /> : <Ban size={12} />}
                              </button>

                              {/* DELETE TOGGLE */}
                              <button 
                                onClick={() => handleTogglePermission(perm.id, 'delete', role)}
                                disabled={isSuperAdmin || !canView || !canEdit}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl w-full transition-all border ${
                                  canDelete 
                                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100' 
                                    : 'bg-slate-50 text-slate-300 border-slate-100'
                                } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:scale-[1.03] active:scale-95'} ${(!canView || !canEdit) && !isSuperAdmin ? 'opacity-30 grayscale' : ''}`}
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
                                {canDelete ? <Trash2 size={12} strokeWidth={3} /> : <Ban size={12} />}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Role Creation Modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-slate-100">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Provision Access Tier</h3>
                <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-widest">Identity Protocol Factory</p>
              </div>
              <button onClick={() => setIsAddRoleModalOpen(false)} className="p-2.5 hover:bg-red-50 text-slate-400 rounded-2xl transition-all hover:text-red-600"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tier Descriptor</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-800 uppercase tracking-tighter"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. FIELD_TECHNICIAN"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setIsAddRoleModalOpen(false)} className="flex-1 py-4 font-black text-slate-500 hover:bg-red-50 rounded-2xl uppercase tracking-widest text-[10px]">Abandon</button>
                <button onClick={handleAddRole} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px]">Create Tier</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Deletion Confirmation */}
      {isDeletingRole && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-sm shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-slate-100">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-red-100">
                <ShieldAlert size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Revoke Authority Tier?</h3>
                <p className="text-slate-500 font-bold leading-relaxed text-sm uppercase">
                  Destroying the <span className="text-red-600 font-black">"{isDeletingRole}"</span> tier will instantly revoke system access for all associated staff members.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsDeletingRole(null)} className="flex-1 py-4 font-black text-slate-500 hover:bg-slate-100 rounded-2xl uppercase tracking-widest text-[10px]">Cancel</button>
                <button onClick={() => handleDeleteRole(isDeletingRole)} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest text-[10px]">Destroy Tier</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsPage;
