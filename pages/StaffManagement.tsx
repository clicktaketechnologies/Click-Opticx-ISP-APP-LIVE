import React, { useState } from 'react';
import { AppState, Role, StaffUser } from '../types';
import { db } from '../db';
import { UserCheck, Plus, Shield, Search, X, Edit, Power } from 'lucide-react';

const StaffManagement: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [formData, setFormData] = useState<StaffUser>({
    email: '',
    name: '',
    role: Role.TEAM_MEMBER,
    status: 'Active'
  });

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
      alert("Please fill all mandatory fields.");
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Staff Management</h2>
          <p className="text-slate-500">Add and manage your team members, their roles, and what they can access in the system.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={18} />
          + Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name / Email</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {state.staff.map(staff => (
              <tr key={staff.email} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{staff.name}</div>
                  <div className="text-xs text-slate-500 font-medium">{staff.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                    <Shield size={12} />
                    {staff.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {staff.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(staff)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => db.updateStaff(staff.email, { status: staff.status === 'Active' ? 'Suspended' : 'Active' })}
                      className={`p-2 rounded-lg transition-all ${staff.status === 'Active' ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                      title={staff.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden border border-slate-100">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Alice Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="name@clickopticx.com"
                  disabled={!!editingStaff}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Job Role / Permission Level</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-700"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                >
                  {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-xs text-blue-700 font-medium">
                <Shield size={16} className="shrink-0" />
                <p>Note: New staff members can login using 'superpass' initially. They should change their password after the first login.</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all"
              >
                {editingStaff ? 'Update Account' : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
