import React, { useState, useMemo } from 'react';
import { AppState, Role } from '../types';
import { db } from '../db';
import {
  UserPlus, Search, Filter, X, Shield, Unlock, Lock,
  ShieldAlert, Circle, Clock, Eye, EyeOff, Key,
  Users, ShieldCheck, Settings, Mail, Fingerprint,
  Check, Ban, Pencil, Trash2, Activity, LayoutDashboard, Brain, Mic, FileAudio, FileText, Terminal, Bell, Monitor, Server, Map, UserCircle, Smartphone, Briefcase, Receipt, CreditCard, Flame, Wallet, Landmark, Zap, Layers, FileInput, Archive, UserCheck, Globe, Headphones, RotateCw, ChevronRight, Sparkles, ClipboardList, Info, AlertTriangle, Plus, ArrowRight
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

// Human-readable mapping for module IDs (Shared)
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
  'permissions': { label: 'Access Control', icon: ShieldAlert },
  'business-settings': { label: 'Core Identity', icon: Globe },
  'about-us': { label: 'Brand Story', icon: Info },
  'tasks': { label: 'Mission Control', icon: ClipboardList },
  'tickets': { label: 'Support Handlers', icon: Headphones },
};

const GovernanceDesk: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeView, setActiveView] = useState<'personnel' | 'governance'>('personnel');
  
  // Personnel State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState<any>({
    email: '',
    name: '',
    password: '',
    role: Role.TEAM_MEMBER,
    status: 'Active'
  });

  // Governance State
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isDeletingRole, setIsDeletingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(Role.SUPER_ADMIN);

  const filteredStaff = useMemo(() => {
    return (state.staff || []).filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || s.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [state.staff, searchTerm, roleFilter, statusFilter]);

  const assignedStaffForRole = useMemo(() => {
    return (state.staff || []).filter(s => s.role === selectedRole);
  }, [state.staff, selectedRole]);

  // Personnel Handlers
  const handleOpenStaffModal = (staff?: any) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({ ...staff, password: staff.password || 'superpass' });
    } else {
      setEditingStaff(null);
      setFormData({ email: '', name: '', password: '', role: Role.TEAM_MEMBER, status: 'Active' });
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async () => {
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
    setIsStaffModalOpen(false);
  };

  const toggleStaffStatus = (email: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    db.updateStaff(email, { status: newStatus as 'Active' | 'Suspended' });
  };

  const handleBulkStatusUpdate = (newStatus: 'Active' | 'Suspended') => {
    selectedStaff.forEach(email => {
      db.updateStaff(email, { status: newStatus });
    });
    setSelectedStaff([]);
  };

  const handleTogglePermission = (moduleId: string, action: 'can_view' | 'can_edit' | 'can_delete', role: string) => {
    if (role === Role.SUPER_ADMIN) return;
    const perm = state.permissions?.find(p => p.role_id === role && p.page_id === moduleId);

    const currentValue = perm ? perm[action] : false;

    db.updateModulePermission(role, moduleId, { [action]: !currentValue });
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
          {activeView === 'personnel' ? (
            <button
              onClick={() => handleOpenStaffModal()}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-100 border border-white/10"
            >
              <UserPlus size={18} /> Provision Account
            </button>
          ) : (
            <button
              onClick={() => setIsAddRoleModalOpen(true)}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-100 border border-white/10"
            >
              <Shield size={18} /> Initialize Tier
            </button>
          )}
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
            <div className="relative flex-1">
              <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
              <select
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs font-black text-slate-700 appearance-none uppercase tracking-[0.2em]"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Nodes</option>
                <option value="Suspended">Suspended Nodes</option>
              </select>
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedStaff.length > 0 && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                  {selectedStaff.length}
                </div>
                <span className="text-sm font-black text-indigo-900 uppercase tracking-widest hidden sm:inline">Identities Selected</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkStatusUpdate('Active')}
                  className="px-4 sm:px-6 py-2.5 bg-white text-emerald-600 border border-emerald-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <Unlock size={14} className="hidden sm:inline" /> Activate
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('Suspended')}
                  className="px-4 sm:px-6 py-2.5 bg-white text-rose-600 border border-rose-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
                >
                  <Lock size={14} className="hidden sm:inline" /> Suspend
                </button>
                <button
                  onClick={() => setSelectedStaff([])}
                  className="p-2.5 bg-white text-slate-400 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                  title="Clear selection"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* PERSONNEL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredStaff.map(member => (
              <div key={member.email} className={`bg-white rounded-[3rem] border-2 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group ${member.status === 'Suspended' ? 'border-rose-100 bg-rose-50/20' : 'border-slate-50'}`}>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="pt-2">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedStaff.includes(member.email)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaff(prev => [...prev, member.email]);
                            } else {
                              setSelectedStaff(prev => prev.filter(email => email !== member.email));
                            }
                          }}
                        />
                      </div>
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-inner border-2 transition-all duration-500 group-hover:rotate-6 ${member.status === 'Suspended' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                        {member.name.charAt(0)}
                      </div>
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
                      onClick={() => handleOpenStaffModal(member)} 
                      className="flex-[2] py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                    >
                      Protocol Access
                    </button>
                    <button 
                      onClick={() => toggleStaffStatus(member.email, member.status)} 
                      className={`flex-1 flex items-center justify-center rounded-2xl transition-all active:scale-95 border-2 ${member.status === 'Active' ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                    >
                      {member.status === 'Active' ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                  </div>
                </div>

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
                  <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                      <tr>
                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Target System Modules</th>
                        <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Permission Matrix (Entry • Logic • Purge)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Object.keys(MODULE_METADATA).map(moduleId => {
                        const metadata = MODULE_METADATA[moduleId];
                        const Icon = metadata.icon;
                        const perm = state.permissions?.find(p => p.role_id === selectedRole && p.page_id === moduleId);
                        
                        const canView = (perm as any)?.can_view || false;
                        const canEdit = (perm as any)?.can_edit || false;
                        const canDelete = (perm as any)?.can_delete || false;
                        const isSuperAdmin = selectedRole === Role.SUPER_ADMIN;

                        return (
                          <tr key={moduleId} className="hover:bg-slate-50 transition-all group/row">
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
                                      {moduleId}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-6 sm:px-12 sm:py-10">
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1.5 bg-slate-50/50 p-2 rounded-[2rem] border border-slate-100/50 w-fit mx-auto shadow-inner">
                                <button
                                  onClick={() => handleTogglePermission(moduleId, 'can_view', selectedRole)}
                                  disabled={isSuperAdmin}
                                  className={`
                                    w-14 h-12 rounded-2xl flex items-center justify-center transition-all border relative group/tooltip
                                    ${isSuperAdmin || canView
                                      ? 'bg-blue-500 text-white border-blue-500/20 shadow-lg shadow-blue-500/30'
                                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                                    }
                                    ${isSuperAdmin ? 'cursor-not-allowed opacity-80' : ''}
                                  `}
                                  title={isSuperAdmin ? "Super Admin permissions cannot be modified" : "View Permission"}
                                >
                                  {isSuperAdmin ? <Check size={16} /> : (canView ? <Check size={16} /> : <X size={16} />)}
                                  {isSuperAdmin && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 text-white text-[9px] uppercase tracking-widest font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                      Immutable
                                    </div>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleTogglePermission(moduleId, 'can_edit', selectedRole)}
                                  disabled={isSuperAdmin}
                                  className={`
                                    w-14 h-12 rounded-2xl flex items-center justify-center transition-all border relative group/tooltip
                                    ${isSuperAdmin || canEdit
                                      ? 'bg-indigo-500 text-white border-indigo-500/20 shadow-lg shadow-indigo-500/30'
                                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                                    }
                                    ${isSuperAdmin ? 'cursor-not-allowed opacity-80' : ''}
                                  `}
                                  title={isSuperAdmin ? "Super Admin permissions cannot be modified" : "Edit Permission"}
                                >
                                  {isSuperAdmin ? <Check size={16} /> : (canEdit ? <Check size={16} /> : <X size={16} />)}
                                  {isSuperAdmin && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 text-white text-[9px] uppercase tracking-widest font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                      Immutable
                                    </div>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleTogglePermission(moduleId, 'can_delete', selectedRole)}
                                  disabled={isSuperAdmin}
                                  className={`
                                    w-14 h-12 rounded-2xl flex items-center justify-center transition-all border relative group/tooltip
                                    ${isSuperAdmin || canDelete
                                      ? 'bg-rose-500 text-white border-rose-500/20 shadow-lg shadow-rose-500/30'
                                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                                    }
                                    ${isSuperAdmin ? 'cursor-not-allowed opacity-80' : ''}
                                  `}
                                  title={isSuperAdmin ? "Super Admin permissions cannot be modified" : "Delete Permission"}
                                >
                                  {isSuperAdmin ? <Check size={16} /> : (canDelete ? <Check size={16} /> : <X size={16} />)}
                                  {isSuperAdmin && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 text-white text-[9px] uppercase tracking-widest font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                      Immutable
                                    </div>
                                  )}
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
                    {assignedStaffForRole.length} Nodes Online
                  </div>
                </div>

                {assignedStaffForRole.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {assignedStaffForRole.map(staff => (
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
                
                <Users className="absolute -right-20 -bottom-20 text-emerald-500/5 size-80 group-hover:scale-110 transition-transform duration-1000" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={editingStaff ? 'Modify Core Identity' : 'Provision Personnel'}
        type="form"
        icon={<UserPlus size={24} className="text-indigo-400" />}
        maxWidth="max-w-xl"
        scrollable
        onConfirm={handleSaveStaff}
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
                  placeholder="Enter access secret"
                  aria-label="Access Secret Password"
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

export default GovernanceDesk;
