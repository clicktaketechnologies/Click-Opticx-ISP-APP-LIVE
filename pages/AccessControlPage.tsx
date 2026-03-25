
import React, { useState, useMemo } from 'react';
import { AppState, Role } from '../types';
import { db } from '../db';
import {
  UserPlus, Search, Filter, X,
  Shield, Unlock, Lock,
  ShieldAlert, Circle, Clock, Eye, EyeOff, Key,
  Users, ShieldCheck, Settings, Mail, Fingerprint,
  Check, Ban, Pencil, Trash2, Activity
} from 'lucide-react';

const AccessControlPage: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeView, setActiveView] = useState<'personnel' | 'governance'>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [showPass, setShowPass] = useState(false);

  const [formData, setFormData] = useState<any>({
    email: '',
    name: '',
    password: '',
    role: Role.TEAM_MEMBER,
    status: 'Active'
  });

  const filteredStaff = useMemo(() => {
    return state.staff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [state.staff, searchTerm, roleFilter]);

  const handleOpenModal = (staff?: any) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({ ...staff, password: staff.password || 'superpass' });
    } else {
      setEditingStaff(null);
      setFormData({ email: '', name: '', password: '', role: Role.TEAM_MEMBER, status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.email || !formData.name) {
      alert("Verification Failed: Corporate identity requires a name and email.");
      return;
    }

    const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(state.currentUser?.role as Role);

    if (editingStaff) {
      await db.updateStaff(editingStaff.email, formData);
      db.logNotification('all', 'info', 'Personnel Update', `Identity ${formData.name} modified by ${state.currentUser?.name}.`);
    } else {
      if (isAdmin) {
        await db.addStaff(formData);
        db.logNotification('all', 'success', 'Personnel Provisioned', `New identity ${formData.name} authorized by ${state.currentUser?.name}.`);
      } else {
        await db.submitApprovalRequest(
          'Staff_Addition',
          formData.email,
          0,
          'Auto',
          `New Staff Request: ${formData.name} (${formData.role})`,
          formData
        );
        alert('Provisioning Request Submitted: Your request for a new personnel identity has been routed to the Governance Authority for verification.');
      }
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (email: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    db.updateStaff(email, { status: newStatus as 'Active' | 'Suspended' });
  };

  const handleTogglePermission = (moduleId: string, action: 'view' | 'edit' | 'delete', role: string) => {
    if (role === Role.SUPER_ADMIN) return;
    const module = state.permissions.find(p => p.id === moduleId);
    if (!module) return;
    const currentRoles = [...module[action]];
    const hasRole = currentRoles.includes(role);
    const newRoles = hasRole ? currentRoles.filter(r => r !== role) : [...currentRoles, role];
    db.updateModulePermission(moduleId, { [action]: newRoles });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={32} />
            Authority Command
          </h2>
          <p className="text-slate-500 font-medium">Manage personnel credentials and defined system scope.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveView('personnel')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'personnel' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Users size={16} /> Personnel
            </button>
            <button
              onClick={() => setActiveView('governance')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'governance' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ShieldAlert size={16} /> Scope Matrix
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100 uppercase tracking-widest"
          >
            <UserPlus size={18} /> Provision Account
          </button>
        </div>
      </div>

      {activeView === 'personnel' ? (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-[2]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Find colleague by name or email..."
                className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs font-black text-slate-700 appearance-none uppercase tracking-widest"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="All">All Scope Tiers</option>
                {state.roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredStaff.map(member => (
              <div key={member.email} className={`bg-white rounded-[2.5rem] border shadow-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden group ${member.status === 'Suspended' ? 'border-red-100 bg-red-50/10 opacity-80' : 'border-slate-100'}`}>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-inner border-2 ${member.status === 'Suspended' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-1 ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        <Circle size={8} fill="currentColor" className={member.status === 'Active' ? 'animate-pulse' : ''} />
                        {member.status}
                      </div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">ID: {member.email.split('@')[0]}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{member.name}</h4>
                    <p className="text-xs font-bold text-slate-400 truncate flex items-center gap-1.5"><Mail size={12} /> {member.email}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{member.role}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase">
                      <Clock size={12} />
                      {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'No Auth Logs'}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => handleOpenModal(member)} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200">Edit Access</button>
                    <button onClick={() => toggleStatus(member.email, member.status)} className={`px-5 py-3.5 rounded-xl border-2 transition-all active:scale-95 ${member.status === 'Active' ? 'border-red-50 text-red-500 hover:bg-red-50' : 'border-emerald-50 text-emerald-600 hover:bg-emerald-50'}`}>{member.status === 'Active' ? <Lock size={18} /> : <Unlock size={18} />}</button>
                  </div>
                </div>
                <Fingerprint className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.7] transition-transform duration-500" size={180} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-4 duration-500">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[750px]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-indigo-400" />
                <h3 className="text-lg font-black tracking-tight uppercase">Governance Authority Infrastructure</h3>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="text-[10px] font-black uppercase text-slate-400">Read</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div><span className="text-[10px] font-black uppercase text-slate-400">Write</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div><span className="text-[10px] font-black uppercase text-slate-400">Drop</span></div>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px] shadow-sm">Module Target</th>
                    {state.roles.map(role => (
                      <th key={role} className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center min-w-[150px] border-l border-slate-100 shadow-sm">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(state.permissions || []).map(perm => (
                    <tr key={perm.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Activity size={16} className="text-indigo-500" />
                          <span className="font-black text-slate-900 uppercase tracking-tight text-xs">{perm.id}</span>
                        </div>
                      </td>
                      {(state.roles || []).map(role => {
                        const canView = perm.view?.includes(role) || false;
                        const canEdit = perm.edit?.includes(role) || false;
                        const canDelete = perm.delete?.includes(role) || false;
                        const isSuperAdmin = role === Role.SUPER_ADMIN;
                        return (
                          <td key={role} className="px-4 py-6 border-l border-slate-50">
                            <div className="flex flex-col gap-2 items-center">
                              <button onClick={() => handleTogglePermission(perm.id, 'view', role)} disabled={isSuperAdmin} className={`flex items-center justify-between px-3 py-2 rounded-xl w-full transition-all border ${canView ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 text-slate-300 border-slate-100'} ${isSuperAdmin ? 'opacity-100' : 'hover:scale-[1.03] active:scale-95'}`}>
                                <span className="text-[9px] font-black uppercase tracking-widest">Access</span>
                                {canView ? <Check size={12} strokeWidth={4} /> : <Ban size={12} />}
                              </button>
                              <button onClick={() => handleTogglePermission(perm.id, 'edit', role)} disabled={isSuperAdmin || !canView} className={`flex items-center justify-between px-3 py-2 rounded-xl w-full transition-all border ${canEdit ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-300 border-slate-100'} ${!canView && !isSuperAdmin ? 'opacity-30' : ''}`}>
                                <span className="text-[9px] font-black uppercase tracking-widest">Modify</span>
                                {canEdit ? <Pencil size={12} strokeWidth={3} /> : <Ban size={12} />}
                              </button>
                              <button onClick={() => handleTogglePermission(perm.id, 'delete', role)} disabled={isSuperAdmin || !canView || !canEdit} className={`flex items-center justify-between px-3 py-2 rounded-xl w-full transition-all border ${canDelete ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-slate-50 text-slate-300 border-slate-100'} ${(!canView || !canEdit) && !isSuperAdmin ? 'opacity-30' : ''}`}>
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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
            <div className="px-10 py-10 bg-slate-950 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">{editingStaff ? 'Update Creds' : 'Provision Identity'}</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase mt-1 tracking-[0.4em]">Protocol: Security Handshake</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"><X size={32} /></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Full Name</label>
                <input type="text" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-800 focus:border-indigo-500 transition-all text-lg shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Wick" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Scope</label>
                  <select className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-700 focus:border-indigo-500 transition-all uppercase tracking-tighter" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    {state.roles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Secret</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-700 focus:border-indigo-500 transition-all pr-14 shadow-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff size={22} /> : <Eye size={22} />}</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Identity (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="email" className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-800 disabled:opacity-50" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="id@clickopticx.com" disabled={!!editingStaff} />
                </div>
              </div>
              <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-4 shadow-inner">
                <Key className="text-indigo-500 mt-1 shrink-0" size={24} />
                <p className="text-[10px] text-indigo-700 font-bold uppercase leading-relaxed">Set unique access secrets. Users will be required to verify their corporate identity upon next login. Governance matrix overrides will apply immediately.</p>
              </div>
            </div>
            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all uppercase tracking-widest text-[11px]">Abort Mission</button>
              <button onClick={handleSave} className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">{editingStaff ? 'Authorize Updates' : 'Commit to Team'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControlPage;
