import React, { useState, useMemo } from 'react';
import { AppState, Role, StaffUser } from '../types';
import { db } from '../db';
import { UserCheck, Plus, Shield, Search, X, Edit, Power, ShieldAlert, Users, Lock, UserPlus, Key, BadgeCheck, Activity } from 'lucide-react';
import { Modal } from '../components/shared/Modal';

const StaffManagement: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [formData, setFormData] = useState<StaffUser>({
    email: '',
    name: '',
    role: Role.TEAM_MEMBER,
    status: 'Active'
  });

  const stats = useMemo(() => {
    const total = state.staff.length;
    const active = state.staff.filter(s => s.status === 'Active').length;
    const admins = state.staff.filter(s => s.role === Role.ADMIN || s.role === Role.SUPER_ADMIN).length;
    return { total, active, admins };
  }, [state.staff]);

  const handleOpenModal = (staff?: StaffUser) => {
    if (staff) {
      setEditingStaff(staff.email);
      setFormData({ ...staff });
    } else {
      setEditingStaff(null);
      setFormData({ email: '', name: '', role: Role.TEAM_MEMBER, status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.email || !formData.name) {
      return;
    }
    if (editingStaff) {
      db.updateStaff(editingStaff, formData);
    } else {
      db.addStaff(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 overflow-hidden relative pb-12 animate-in fade-in duration-500">
      {/* 1. Header Zone */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1 shrink-0">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none flex items-center gap-4">
             <Key className="text-indigo-600" size={32} />
             Access Registry
           </h2>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3 italic">
             Manage administrative nodes and role-based permissions
           </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black shadow-2xl active:scale-95 transition-all"
        >
          <UserPlus size={18} />
          <span>Provision New Access</span>
        </button>
      </div>

      {/* 2. KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
         {[
           { label: 'Network Personnel', count: stats.total, icon: Users, grad: 'var(--grad-primary)', sub: 'Cumulative Staff' },
           { label: 'Authorized Admins', count: stats.admins, icon: Shield, grad: 'var(--grad-violet)', sub: 'Elevated Privileges' },
           { label: 'Active Sessions', count: stats.active, icon: BadgeCheck, grad: 'var(--grad-success)', sub: 'Operational Integrity' },
         ].map((kpi, idx) => (
           <div key={idx} className="card relative overflow-hidden border-none shadow-xl px-8 py-10" style={{ backgroundImage: kpi.grad }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl -mr-12 -mt-12 rounded-full" />
              <div className="relative z-10 text-white">
                 <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{kpi.label}</p>
                    <kpi.icon size={20} className="opacity-70" />
                 </div>
                 <h3 className="text-4xl font-black italic tracking-tighter leading-none">{kpi.count}</h3>
                 <p className="text-[9px] font-bold uppercase opacity-50 mt-3 tracking-widest">{kpi.sub}</p>
              </div>
           </div>
         ))}
      </div>

      {/* 3. Table Container */}
      <div className="table-container !border-none !shadow-2xl !rounded-[3rem] overflow-hidden flex-1 flex flex-col">
        <table className="w-full">
          <thead>
            <tr className="!bg-slate-50 !border-b-2 !border-slate-100">
              <th className="p-8">Identity Metadata</th>
              <th className="text-center">Protocol Level</th>
              <th className="text-center">Integrity Status</th>
              <th className="text-right pr-12">Access Desk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {state.staff.map(staff => (
              <tr key={staff.email} className="group hover:bg-slate-50/50 transition-colors">
                <td className="p-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center text-indigo-500 overflow-hidden shrink-0 group-hover:scale-110 transition-all">
                       <UserCheck size={28} />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic truncate">{staff.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 lowercase">{staff.email}</div>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <span className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    <Shield size={14} />
                    {staff.role}
                  </span>
                </td>
                <td className="text-center">
                  <span className={`inline-flex px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                    staff.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {staff.status}
                  </span>
                </td>
                <td className="text-right pr-12">
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => handleOpenModal(staff)}
                      className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-400 transition-all shadow-sm active:scale-95"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => db.updateStaff(staff.email, { status: staff.status === 'Active' ? 'Suspended' : 'Active' })}
                      className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${
                        staff.status === 'Active' ? 'bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      <Power size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'UPDATE PERSONNEL METADATA' : 'PROVISION NEW PERSONNEL'}
        maxWidth="max-w-xl"
        scrollable
      >
        <div className="space-y-10 p-2">
           <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Full Legal Name</label>
                <input 
                  type="text" 
                  className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] outline-none font-black text-slate-950 focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Alice Integrity Smith"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Registry Email Link</label>
                <input 
                  type="email" 
                  className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] outline-none font-black text-slate-950 focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="name@clickopticx.com"
                  disabled={!!editingStaff}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Job Protocol Level</label>
                <div className="relative group">
                   <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                   <select 
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[3rem] outline-none focus:border-indigo-600 transition-all font-black text-slate-900 uppercase italic tracking-widest text-xs appearance-none cursor-pointer"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as Role})}
                  >
                    {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
              </div>
           </div>

           <div className="p-8 bg-indigo-950 text-white rounded-[3rem] flex items-start gap-6 shadow-2xl relative overflow-hidden">
              <ShieldAlert size={40} className="text-indigo-400 shrink-0 mt-1" />
              <div className="relative z-10">
                <h5 className="text-lg font-black uppercase italic tracking-tighter">Handshake Protocol</h5>
                <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed mt-2 italic">New personnel will initialize using 'superpass'. Session hard-key reset is mandatory after first discovery.</p>
              </div>
              <Activity className="absolute -right-12 -bottom-12 size-40 text-white/5 pointer-events-none" />
           </div>

           <div className="flex gap-4 pt-6">
             <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-6 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest transition-all"
             >
                Abort Provisioning
             </button>
             <button 
                onClick={handleSave}
                className="flex-[2] py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl hover:bg-black active:scale-95"
             >
                {editingStaff ? 'Commit Account Update' : 'Authorize Personnel'}
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffManagement;
