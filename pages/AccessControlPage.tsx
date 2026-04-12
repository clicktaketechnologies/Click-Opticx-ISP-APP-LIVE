
import React, { useState, useMemo } from 'react';
import { AppState, Role } from '../types';
import { db } from '../db';
import {
  UserPlus, Search, Filter, X,
  Shield, Unlock, Lock,
  ShieldAlert, Circle, Clock, Eye, EyeOff, Key,
  Users, ShieldCheck, Settings, Mail, Fingerprint,
  Check, Ban, Pencil, Trash2, Activity, LayoutDashboard, Brain, Mic, FileAudio, FileText, Terminal, Bell, Monitor, Server, Map, UserCircle, Smartphone, Briefcase, Receipt, CreditCard, Flame, Wallet, Landmark, Zap, Layers, FileInput, Archive, UserCheck, Globe, Headphones, RefreshCw, ChevronRight, Sparkles, ClipboardList, Info
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

// Human-readable mapping for module IDs (Shared with PermissionsPage)
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
    return (state.staff || []).filter(s => {
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
      const res = await db.updateStaff(editingStaff.email, formData);
      if (res.success) {
        db.logNotification('all', 'info', 'Personnel Update', `Identity ${formData.name} modified by ${state.currentUser?.name}.`);
      } else {
        alert(res.message);
        return;
      }
    } else {
      if (isAdmin) {
        const res = await db.addStaff(formData);
        if (res.success) {
          db.logNotification('all', 'success', 'Personnel Provisioned', `New identity ${formData.name} authorized by ${state.currentUser?.name}.`);
        } else {
          alert(res.message);
          return;
        }
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
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* ─── HEADER SECTION ─── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
             <ShieldCheck className="text-indigo-600" size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 leading-none">Access Control Plane</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic leading-none">
            Authority Command
          </h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-tight opacity-70">Manage personnel credentials and defined system scope.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveView('personnel')}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeView === 'personnel' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={16} /> Personnel
            </button>
            <button
              onClick={() => setActiveView('governance')}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeView === 'governance' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShieldAlert size={16} /> Scope Matrix
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-100 border border-white/10"
          >
            <UserPlus size={18} /> Provision Account
          </button>
        </div>
      </div>

      {activeView === 'personnel' ? (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          {/* SEARCH & FILTER */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row gap-4">
            <div className="relative flex-[2]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
              <input
                type="text"
                placeholder="Audit identity by name or corporate email..."
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
              <select
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs font-black text-slate-700 appearance-none uppercase tracking-[0.2em]"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="All">All Scope Tiers</option>
                {state.roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* PERSONNEL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredStaff.map(member => (
              <div key={member.email} className={`bg-white rounded-[3rem] border-2 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group ${member.status === 'Suspended' ? 'border-rose-100 bg-rose-50/20' : 'border-slate-50'}`}>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start relative z-10">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-inner border-2 transition-all duration-500 group-hover:rotate-6 ${member.status === 'Suspended' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 border ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        <Circle size={8} fill="currentColor" className={member.status === 'Active' ? 'animate-pulse' : ''} />
                        {member.status}
                      </div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">CODE: {member.email.split('@')[0]}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 relative z-10">
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{member.name}</h4>
                    <p className="text-xs font-bold text-slate-400 truncate flex items-center gap-2"><Mail size={14} className="text-indigo-400" /> {member.email}</p>
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-5 border border-slate-100 flex items-center justify-between group-hover:bg-white transition-all duration-500 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Shield size={14} className="text-indigo-500" />
                      </div>
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{member.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-tighter">
                      <Clock size={14} />
                      {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'NO LOGS'}
                    </div>
                  </div>

                  <div className="flex gap-3 relative z-10">
                    <button 
                      onClick={() => handleOpenModal(member)} 
                      className="flex-[2] py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                    >
                      Protocol Access
                    </button>
                    <button 
                      onClick={() => toggleStatus(member.email, member.status)} 
                      className={`flex-1 flex items-center justify-center rounded-2xl transition-all active:scale-95 border-2 ${member.status === 'Active' ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                    >
                      {member.status === 'Active' ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                  </div>
                </div>

                {/* Background decorative icon with increased visibility */}
                <Fingerprint className="absolute -right-12 -bottom-12 opacity-[0.08] scale-150 pointer-events-none group-hover:scale-[1.8] group-hover:rotate-12 transition-all duration-700 text-indigo-900" size={240} />
                
                {member.status === 'Suspended' && (
                  <div className="absolute top-4 left-4">
                     <ShieldAlert size={24} className="text-rose-600 opacity-20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-4 duration-500">
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[600px] relative">
            <div className="p-10 bg-slate-950 text-white flex justify-between items-center sticky top-0 z-20 border-b border-white/5">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                   <Settings size={32} className="animate-[spin_10s_linear_infinite]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none mb-1">Infrastructure Governance</h3>
                   <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Authority Matrix</p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-10">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Entry</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Logic</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Purge</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-100 uppercase tracking-[0.4em]">
                  <tr>
                    <th className="px-10 py-8 text-[11px] font-black text-slate-400 min-w-[300px]">Strategic Modules</th>
                    {state.roles.map(role => (
                      <th key={role} className="px-8 py-8 text-[11px] font-black text-indigo-600 text-center min-w-[200px] border-l border-slate-50">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(state.permissions || []).map(perm => {
                    const metadata = MODULE_METADATA[perm.id] || { label: perm.id, icon: Activity };
                    const Icon = metadata.icon;

                    return (
                      <tr key={perm.id} className="hover:bg-slate-50 transition-all group/row">
                        <td className="px-10 py-10">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/row:bg-indigo-600 group-hover/row:text-white group-hover/row:shadow-xl group-hover/row:shadow-indigo-100 transition-all duration-500">
                               <Icon size={24} />
                            </div>
                            <div>
                              <span className="font-black text-slate-900 uppercase tracking-tight text-sm block leading-none mb-2">{metadata.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                                  <Lock size={10} className="text-indigo-500" />
                                  {perm.id}
                                </span>
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
                            <td key={role} className={`px-6 py-6 border-l border-slate-50 ${isSuperAdmin ? 'bg-indigo-50/10' : ''}`}>
                              <div className="flex items-center justify-center gap-2 bg-slate-100/30 p-2 rounded-[2rem] border border-slate-100 shadow-inner">
                                {/* HORIZONTAL TOGGLES */}
                                <button
                                  onClick={() => handleTogglePermission(perm.id, 'view', role)}
                                  disabled={isSuperAdmin}
                                  className={`p-3.5 rounded-2xl transition-all border-2 ${
                                    canView 
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-100 scale-110' 
                                    : 'bg-white border-slate-100 text-slate-300'
                                  } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:-translate-y-1 active:scale-95'}`}
                                >
                                  <Eye size={16} strokeWidth={3} />
                                </button>

                                <button
                                  onClick={() => handleTogglePermission(perm.id, 'edit', role)}
                                  disabled={isSuperAdmin || !canView}
                                  className={`p-3.5 rounded-2xl transition-all border-2 ${
                                    canEdit 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100 scale-110' 
                                    : 'bg-white border-slate-100 text-slate-300'
                                  } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:-translate-y-1 active:scale-95'} ${!canView && !isSuperAdmin ? 'opacity-20 grayscale' : ''}`}
                                >
                                  <Pencil size={16} strokeWidth={3} />
                                </button>

                                <button
                                  onClick={() => handleTogglePermission(perm.id, 'delete', role)}
                                  disabled={isSuperAdmin || !canView || !canEdit}
                                  className={`p-3.5 rounded-2xl transition-all border-2 ${
                                    canDelete 
                                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-100 scale-110' 
                                    : 'bg-white border-slate-100 text-slate-300'
                                  } ${isSuperAdmin ? 'cursor-default opacity-100' : 'hover:-translate-y-1 active:scale-95'} ${(!canView || !canEdit) && !isSuperAdmin ? 'opacity-20 grayscale' : ''}`}
                                >
                                  <Trash2 size={16} strokeWidth={3} />
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROVISIONING MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Modify Core Identity' : 'Provision Personnel'}
        type="form"
        icon={<UserPlus size={24} className="text-indigo-400" />}
        maxWidth="max-w-xl"
        scrollable
        onConfirm={handleSave}
        confirmLabel={editingStaff ? 'Protocol Update' : 'Initialize Agent'}
        cancelLabel="Relinquish"
      >
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Full Identity Name</label>
            <div className="relative">
               <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
               <input 
                 type="text" 
                 className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xl tracking-tighter" 
                 value={formData.name} 
                 onChange={e => setFormData({ ...formData, name: e.target.value })} 
                 placeholder="E.G. HARIS AHMED" 
                />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Scope Designation</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <select 
                  className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase tracking-widest text-[11px] appearance-none" 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  {state.roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Access Secret</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  className="w-full pl-12 pr-14 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg tracking-widest" 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="••••••••" 
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">
                  {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Corporate Communication (Email)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
              <input 
                type="email" 
                className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                placeholder="identity@clickopticx.com" 
                disabled={!!editingStaff} 
              />
            </div>
          </div>

          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-start gap-4">
             <Sparkles className="text-indigo-600 mt-1 shrink-0" size={24} />
             <div className="space-y-1">
                <p className="text-[10px] text-indigo-900 font-black uppercase tracking-widest italic">Governance Directive</p>
                <p className="text-[10px] text-indigo-700 font-bold uppercase leading-relaxed opacity-70">New identities inherit the base permissions of their assigned tier. Revocation and status changes propagate across the global cluster in real-time.</p>
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccessControlPage;

