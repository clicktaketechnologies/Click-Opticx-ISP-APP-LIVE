
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, UserStatus, ISPUser, Role, PaymentStatus, Package, PaymentMethod, ConnectionStatus, VerificationStatus, LedgerType } from '../types';
import { 
  Search, UserPlus, ShieldAlert, ChevronRight, X, Activity, Trash2, 
  ChevronLeft, Pencil, Save, Info, Network, MapPin, HardDrive, 
  CheckCircle, AlertCircle, Clock, ShieldCheck, DollarSign, Wallet, CreditCard, Home, Ban,
  Square, CheckSquare, Layers, AlertTriangle, Key, Cpu, Zap, SignalHigh, Calendar, Banknote, Globe, Loader2, XCircle, RefreshCw, Lock, LogOut, Eye, UserCircle, Fingerprint, Map as MapIcon, Smartphone, Bell, ListChecks,
  User, Hash, MessageSquare, Package as PackageIcon, LockKeyhole, ArrowRight, MousePointer2, Settings2, Power,
  SearchCode, EyeOff, ExternalLink, ArrowUpRight, ArrowDownLeft,
  Mail, Signal, FileText
} from 'lucide-react';
import { db } from '../db';
import PasswordInput from '../components/shared/PasswordInput';

const UserManagement: React.FC<{ state: AppState }> = ({ state }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [provisioningStep, setProvisioningStep] = useState(1);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [isEditUserModal, setIsEditUserModal] = useState(false);
  const [isResetPassModal, setIsResetPassModal] = useState(false);
  const [isViewUserModal, setIsViewUserModal] = useState(false);
  const [isSuspendModal, setIsSuspendModal] = useState(false);
  const [isReconnectModal, setIsReconnectModal] = useState(false);
  const [isActivationModal, setIsActivationModal] = useState(false);
  const [isCollectPaymentModal, setIsCollectPaymentModal] = useState(false);

  // Bulk States
  const [isBulkGraceModal, setIsBulkGraceModal] = useState(false);
  const [isBulkPackageModal, setIsBulkPackageModal] = useState(false);
  const [bulkGraceDate, setBulkGraceDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);

  // Form States for Handshakes
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [shouldActivatePkg, setShouldActivatePkg] = useState(true);
  const [isGraceActive, setIsGraceActive] = useState(true); 
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [newAuthSecret, setNewAuthSecret] = useState('');

  const initialUserForm: Partial<ISPUser> = {
    name: '', username: '', password: '', packageId: '', connectionType: 'Fiber',
    cnic: '', phone: '', email: '', address: '', subarea: '',
    pppoeId: '', nasId: '', vlanId: '', oltNode: '', portalEnabled: true,
    status: UserStatus.PENDING_VERIFICATION
  };

  const [editUserData, setEditUserData] = useState<Partial<ISPUser>>(initialUserForm);
  const [newUserData, setNewUserData] = useState<Partial<ISPUser>>(initialUserForm);
  
  const activeUsers = useMemo(() => state.users.filter(u => !u.deleted), [state.users]);
  
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return activeUsers.filter(u => 
      u.name.toLowerCase().includes(term) || 
      (u.connectionId || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(term) ||
      (u.macIp || '').toLowerCase().includes(term)
    );
  }, [activeUsers, searchTerm]);

  const selectedUser = useMemo(() => activeUsers.find(u => u.id === selectedUserId), [activeUsers, selectedUserId]);

  const userInvoices = useMemo(() => {
    if (!selectedUser) return [];
    return state.invoices.filter(i => i.userId === selectedUser.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.invoices, selectedUser]);

  const userLedger = useMemo(() => {
    if (!selectedUser) return [];
    return state.ledger.filter(l => l.userId === selectedUser.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.ledger, selectedUser]);
  
  const currentUserRole = state.currentUser?.role || Role.VIEWER;
  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(currentUserRole as Role);
  const canPerformAction = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.FINANCE_ADMIN].includes(currentUserRole as Role);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length && filteredUsers.length > 0) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAction = (user: ISPUser, action: string) => {
    setSelectedUserId(user.id);
    setEditUserData({ ...user });
    setNewAuthSecret('');
    
    // Reset Handshake Defaults
    setProvisioningStep(1);
    setPaymentStatus('Paid');
    setSelectedMethod('Cash');
    setCollectAmount(user.balance || 0);
    setIsGraceActive(true);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSelectedPkgId(user.packageId || '');

    switch(action) {
      case 'edit': setIsEditUserModal(true); break;
      case 'reset': setIsResetPassModal(true); break;
      case 'package': setIsActivationModal(true); break;
      case 'payment': setIsCollectPaymentModal(true); break;
      case 'view': setIsViewUserModal(true); break;
      case 'suspend': setIsSuspendModal(true); break;
      case 'reconnect': setIsReconnectModal(true); break;
    }
  };

  useEffect(() => {
    if (isCollectPaymentModal && selectedPkgId) {
      const pkg = state.packages.find(p => p.id === selectedPkgId);
      if (pkg) {
        const total = Math.round(pkg.price * (1 + (state.settings.autoTaxPercentage / 100)));
        setCollectAmount(total);
      }
    }
  }, [selectedPkgId, isCollectPaymentModal, state.packages, state.settings.autoTaxPercentage]);

  const handleExecuteProvisioning = async () => {
    if (!selectedUserId || !selectedPkgId) return;
    setIsProcessing(true);
    const pkg = state.packages.find(p => p.id === selectedPkgId);
    if (!pkg) return;

    if (paymentStatus === 'Paid') {
      await db.processTopup('Admin', selectedUserId, 'user', pkg.price);
      await db.addManualPayment(selectedUserId, pkg.price, selectedMethod);
    }
    
    await db.activatePackage(selectedUserId, selectedPkgId);
    
    if (paymentStatus === 'Unpaid') {
       const graceExpiry = new Date(Date.now() + 3 * 86400000).toISOString();
       await db.updateUser(selectedUserId, { status: UserStatus.PAYMENT_DUE, expiryDate: graceExpiry });
    }

    setIsProcessing(false);
    setIsActivationModal(false);
    setIsSuccessModal(true);
  };

  const handleExecuteCollection = async () => {
    if (!selectedUserId || collectAmount <= 0) return;
    setIsProcessing(true);
    
    await db.addManualPayment(selectedUserId, collectAmount, selectedMethod);
    
    const updates: any = {};
    if (shouldActivatePkg && selectedPkgId) {
       await db.activatePackage(selectedUserId, selectedPkgId);
    }

    if (isGraceActive) {
      const graceThreshold = new Date();
      graceThreshold.setDate(graceThreshold.getDate() + 3);
      updates.status = UserStatus.GRACE_PERIOD;
      updates.expiryDate = graceThreshold.toISOString();
    }

    if (Object.keys(updates).length > 0) {
      await db.updateUser(selectedUserId, updates);
    }

    setIsProcessing(false);
    setIsCollectPaymentModal(false);
    setIsSuccessModal(true);
  };

  const handleUpdateDossier = async () => {
    if (!selectedUserId) return;
    setIsProcessing(true);
    await db.updateUser(selectedUserId, editUserData);
    setIsProcessing(false);
    setIsEditUserModal(false);
    setIsSuccessModal(true);
  };

  const handleAuthReset = async () => {
    if (!selectedUserId || !newAuthSecret) return;
    setIsProcessing(true);
    await db.updateCustomerPassword(selectedUserId, newAuthSecret);
    setIsProcessing(false);
    setIsResetPassModal(false);
    setIsSuccessModal(true);
  };

  const handleStatusShift = async (status: UserStatus) => {
    if (!selectedUserId) return;
    setIsProcessing(true);
    await db.updateUser(selectedUserId, { status });
    setIsProcessing(false);
    setIsSuspendModal(false);
    setIsReconnectModal(false);
    setIsSuccessModal(true);
  };

  const executeBulkPurge = async () => {
    if (!confirm(`PURGE PROTOCOL: Permanently destroy ${selectedIds.size} identities from registry?`)) return;
    setIsProcessing(true);
    await db.bulkDeleteUsers(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsProcessing(false);
  };

  const executeBulkGrace = async () => {
    setIsProcessing(true);
    await db.bulkSetAccountStatus(Array.from(selectedIds), UserStatus.GRACE_PERIOD, `Bulk Grace until ${bulkGraceDate}`);
    setIsBulkGraceModal(false);
    setSelectedIds(new Set());
    setIsProcessing(false);
  };

  const ActionIcon = ({ icon: Icon, color, label, onClick, disabled }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-2.5 rounded-xl transition-all border group relative ${
        disabled 
          ? 'bg-slate-50 text-slate-200 border-slate-50 grayscale cursor-not-allowed opacity-20' 
          : `${color} border-slate-100 shadow-sm hover:shadow-md hover:scale-110 active:scale-95 bg-white`
      }`}
    >
      <Icon size={16} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden relative pb-4">
      {/* Header Zone */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Subscriber Database</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identity & Link Registry Node</p>
        </div>
        <button 
          onClick={() => { setOnboardingStep(1); setIsNewUserModal(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black shadow-2xl active:scale-95 transition-all"
        >
          <UserPlus size={18} />
          <span>Provision User</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-slate-100 shadow-sm shrink-0">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Registry Scan: Name, Link ID, Phone, or MAC..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-base font-black placeholder:text-slate-300 transition-all shadow-inner" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Bulk Action Top Bar - UPDATED COLORS */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 border border-white/5 shrink-0">
           <div className="flex items-center gap-4 border-r-0 sm:border-r border-white/10 pr-0 sm:pr-6 shrink-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse"><Layers size={20} /></div>
              <div>
                 <p className="text-sm font-black italic tracking-tighter leading-none">{selectedIds.size} Linked Nodes</p>
                 <p className="text-[8px] text-indigo-400 font-black uppercase mt-1 tracking-widest italic">Batch Node Ready</p>
              </div>
           </div>
           <div className="flex items-center gap-2 flex-wrap justify-center">
              <button onClick={() => setIsBulkGraceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/20">
                 <Clock size={16}/><span className="text-[9px] font-black uppercase">Grace Node</span>
              </button>
              <button onClick={() => { setSelectedPkgId(''); setIsBulkPackageModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all border border-indigo-500/20">
                 <PackageIcon size={16}/><span className="text-[9px] font-black uppercase">Mass Prov.</span>
              </button>
              <button onClick={async () => { 
                if(confirm(`AUTHORIZE ROTATION: Force credential reset for ${selectedIds.size} nodes?`)) {
                  setIsProcessing(true);
                  await db.bulkForcePasswordReset(Array.from(selectedIds)); 
                  setSelectedIds(new Set());
                  setIsProcessing(false);
                  setIsSuccessModal(true);
                }
              }} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl transition-all border border-orange-500/20">
                 <Key size={16}/><span className="text-[9px] font-black uppercase">Rotation</span>
              </button>
              <button onClick={executeBulkPurge} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all border border-rose-500/20">
                 <Trash2 size={16}/><span className="text-[9px] font-black uppercase">Purge</span>
              </button>
           </div>
           <button onClick={() => setSelectedIds(new Set())} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><X size={18} /></button>
        </div>
      )}

      {/* Main Registry Node */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col relative">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left min-w-[1150px] border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-30 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-10">
                   <button onClick={toggleSelectAll} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors">
                      {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare size={22} className="text-indigo-600" /> : <Square size={22} />}
                   </button>
                </th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Identity</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Node Ref</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry State</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">O/S Balance</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Protocol Handshakes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                         <SearchCode size={64} className="mb-4" />
                         <p className="text-sm font-black uppercase tracking-widest">No nodes detected in current scan</p>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(user.id) ? 'bg-indigo-50/40' : ''}`}>
                    <td className="px-6 py-5">
                       <button onClick={() => toggleSelect(user.id)} className={`p-1 transition-all ${selectedIds.has(user.id) ? 'text-indigo-600 scale-110' : 'text-slate-200 hover:text-slate-400'}`}>
                          {selectedIds.has(user.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                       </button>
                    </td>
                    <td className="px-4 py-5">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 ${selectedIds.has(user.id) ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white border-slate-100 text-slate-400 shadow-sm'}`}>
                             <UserCircle size={22}/>
                          </div>
                          <div className="min-w-0">
                             <div className="font-black text-slate-900 uppercase italic text-sm group-hover:text-indigo-600 transition-colors leading-none mb-1 truncate">{user.name}</div>
                             <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{user.phone}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase italic shadow-sm">{user.connectionId}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full shrink-0 ${user.status === UserStatus.ACTIVE ? 'bg-emerald-500 animate-pulse' : user.status === UserStatus.GRACE_PERIOD ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                         <span className="text-[10px] font-black uppercase text-slate-600 italic tracking-tight whitespace-nowrap">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right font-black text-base text-slate-900 italic tracking-tighter">
                      Rs. {user.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 transition-all">
                        <ActionIcon icon={Pencil} color="text-blue-600" label="Modify Dossier" onClick={() => handleAction(user, 'edit')} disabled={!canPerformAction} />
                        <ActionIcon icon={LockKeyhole} color="text-orange-600" label="Auth Reset" onClick={() => handleAction(user, 'reset')} disabled={!canPerformAction} />
                        <ActionIcon icon={PackageIcon} color="text-indigo-600" label="Provision Plan" onClick={() => handleAction(user, 'package')} disabled={!canPerformAction} />
                        <ActionIcon icon={Banknote} color="text-emerald-600" label="Fiscal Collect" onClick={() => handleAction(user, 'payment')} disabled={!canPerformAction} />
                        <ActionIcon icon={Eye} color="text-slate-600" label="Customer 360" onClick={() => handleAction(user, 'view')} />
                        <ActionIcon icon={Ban} color="text-rose-600" label="Kill-Switch" onClick={() => handleAction(user, 'suspend')} disabled={!isAdmin} />
                        <ActionIcon icon={RefreshCw} color="text-purple-600" label="Cold Boot" onClick={() => handleAction(user, 'reconnect')} disabled={!isAdmin} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ONBOARDING WIZARD */}
      {isNewUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 sm:p-6">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in flex flex-col max-h-[95vh]">
              <header className="p-6 sm:p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl italic font-black">S{onboardingStep}</div>
                    <div>
                       <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">Onboarding Protocol</h3>
                       <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Handshake Phase {onboardingStep} of 5</p>
                    </div>
                 </div>
                 <button onClick={() => setIsNewUserModal(false)} className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"><X size={28}/></button>
              </header>
              <div className="p-6 sm:p-10 flex-1 overflow-y-auto custom-scrollbar">
                 {(() => {
                    switch(onboardingStep) {
                      case 1: return (
                        <div className="space-y-6">
                           <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-2 italic">1. Identity (KYC) Registry</h4>
                           <div className="space-y-4">
                              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Identity Full Name</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} /></div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">CNIC Node</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.cnic} onChange={e => setNewUserData({...newUserData, cnic: e.target.value})} /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mobile Relay</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.phone} onChange={e => setNewUserData({...newUserData, phone: e.target.value})} /></div>
                              </div>
                           </div>
                        </div>
                      );
                      case 2: return (
                        <div className="space-y-6">
                           <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-2 italic">2. Service Layer Mapping</h4>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select Bandwidth Tier</label>
                              <div className="grid grid-cols-1 gap-2">
                                 {state.packages.map(p => (
                                   <button key={p.id} onClick={() => setNewUserData({...newUserData, packageId: p.id})} className={`p-4 sm:p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${newUserData.packageId === p.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'bg-slate-50 border-transparent'}`}>
                                      <div><p className="font-black uppercase text-xs">{p.name}</p><p className="text-[9px] font-bold text-slate-400">{p.speed} • Rs.{p.price}</p></div>
                                      {newUserData.packageId === p.id && <CheckCircle size={20} className="text-indigo-600"/>}
                                   </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                      );
                      case 3: return (
                        <div className="space-y-6">
                           <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-2 italic">3. Topology Registry</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">PPPoE Link ID</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.pppoeId} onChange={e => setNewUserData({...newUserData, pppoeId: e.target.value})} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">NAS Identity</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.nasId} onChange={e => setNewUserData({...newUserData, nasId: e.target.value})} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Target OLT Node</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.oltNode} onChange={e => setNewUserData({...newUserData, oltNode: e.target.value})} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">VLAN Index</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.vlanId} onChange={e => setNewUserData({...newUserData, vlanId: e.target.value})} /></div>
                           </div>
                        </div>
                      );
                      case 4: return (
                        <div className="space-y-6">
                           <h4 className="text-xs font-black uppercase text-slate-900 border-b pb-2 italic">4. Authentication Logic</h4>
                           <div className="space-y-4">
                              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Registry Username</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-black text-sm" value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} /></div>
                              <PasswordInput label="Access Secret" value={newUserData.password || ''} onChange={v => setNewUserData({...newUserData, password: v})} showStrength />
                           </div>
                        </div>
                      );
                      case 5: return (
                        <div className="space-y-8 text-center py-10">
                           <h4 className="text-xl font-black uppercase text-slate-900 italic">5. Authorize Provisioning</h4>
                           <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed max-w-md mx-auto">
                              Ready to synchronize identity nodes. This will enable portal access and initialize the physical internet handshake protocol.
                           </p>
                           <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl inline-flex items-center gap-4 shadow-sm">
                              <ShieldCheck className="text-emerald-600" size={32}/>
                              <div className="text-left">
                                 <p className="text-[10px] font-black text-emerald-900 uppercase">System Ready</p>
                                 <p className="text-[8px] font-black text-emerald-600 uppercase">Integrity Score: Optimal</p>
                              </div>
                           </div>
                        </div>
                      );
                      default: return null;
                    }
                 })()}
              </div>
              <footer className="p-6 sm:p-10 bg-slate-50 border-t flex justify-between items-center shrink-0">
                 <button onClick={() => setOnboardingStep(Math.max(1, onboardingStep - 1))} className="text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 disabled:opacity-0" disabled={onboardingStep === 1}>Previous Phase</button>
                 {onboardingStep < 5 ? (
                   <button onClick={() => setOnboardingStep(onboardingStep + 1)} className="px-6 sm:px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">Advance Sequence <ChevronRight size={14}/></button>
                 ) : (
                   <button onClick={async () => { setIsProcessing(true); await db.addUser(newUserData); setIsProcessing(false); setIsNewUserModal(false); setIsSuccessModal(true); }} className="px-6 sm:px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">Commit Synchronize <ShieldCheck size={18}/></button>
                 )}
              </footer>
           </div>
        </div>
      )}

      {/* 2. PLAN PROVISIONING MODAL */}
      {isActivationModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in flex flex-col max-h-[90vh]">
              <header className="p-8 border-b bg-emerald-600 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-lg"><PackageIcon size={28}/></div>
                    <div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Override Provisioning</h3>
                       <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-1">Protocol: Forced Activation Cycle</p>
                    </div>
                 </div>
                 <button onClick={() => setIsActivationModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={32}/></button>
              </header>
              <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                 {provisioningStep === 1 ? (
                   <div className="space-y-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Phase 1: Select Functional Tier</p>
                      <div className="grid grid-cols-1 gap-3">
                        {state.packages.map(pkg => (
                          <button key={pkg.id} onClick={() => { setSelectedPkgId(pkg.id); setProvisioningStep(2); }} className="p-6 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:border-emerald-600 hover:bg-white transition-all text-left flex items-center justify-between group">
                             <div><h4 className="font-black text-slate-900 uppercase italic">{pkg.name}</h4><p className="text-[9px] font-bold text-slate-400 uppercase">{pkg.speed} • Rs. {pkg.price}</p></div>
                             <ChevronRight className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-10 animate-in slide-in-from-right duration-300">
                      <div className="flex items-center gap-4">
                         <button onClick={() => setProvisioningStep(1)} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600"><ChevronLeft size={20}/></button>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Phase 2: Settlement Handshake</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <button onClick={() => setPaymentStatus('Paid')} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${paymentStatus === 'Paid' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xl' : 'border-slate-50 bg-slate-50 text-slate-300 grayscale opacity-60'}`}>
                            <CheckCircle size={32} /><span className="text-[11px] font-black uppercase tracking-widest">Handshake: Paid</span>
                         </button>
                         <button onClick={() => setPaymentStatus('Unpaid')} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${paymentStatus === 'Unpaid' ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-xl' : 'border-slate-50 bg-slate-50 text-slate-300 grayscale opacity-60'}`}>
                            <Clock size={32} /><span className="text-[11px] font-black uppercase tracking-widest">Handshake: Due</span>
                         </button>
                      </div>
                      {paymentStatus === 'Paid' && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Relay Method</label>
                           <div className="grid grid-cols-4 gap-2">
                              {['Cash', 'Bank', 'Stripe', 'EasyPaisa'].map(m => (
                                <button key={m} onClick={() => setSelectedMethod(m as any)} className={`py-4 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${selectedMethod === m ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{m}</button>
                              ))}
                           </div>
                        </div>
                      )}
                      <button onClick={handleExecuteProvisioning} disabled={isProcessing} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                         {isProcessing ? <RefreshCw className="animate-spin" size={18}/> : <ShieldCheck size={18}/>} Authorize Synchronization
                      </button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* 3. LOG COLLECTION MODAL */}
      {isCollectPaymentModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in flex flex-col max-h-[95vh]">
              <header className="p-8 sm:p-10 border-b bg-emerald-600 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-3xl flex items-center justify-center border-4 border-white/5 shadow-2xl"><Banknote size={32}/></div>
                    <div>
                       <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter leading-none">Fiscal Collection</h3>
                       <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-1">Subscriber: {selectedUser.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsCollectPaymentModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white"><X size={32}/></button>
              </header>
              <div className="p-8 sm:p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2"><PackageIcon size={12}/> Package Registry</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {state.packages.filter(p => !p.deleted).map(pkg => (
                         <button 
                           key={pkg.id} 
                           onClick={() => setSelectedPkgId(pkg.id)}
                           className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedPkgId === pkg.id ? 'border-emerald-600 bg-emerald-50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                         >
                            <p className="text-[11px] font-black text-slate-900 uppercase">{pkg.name}</p>
                            <p className="text-[9px] font-bold text-slate-400">Rs. {pkg.price} + Tax</p>
                         </button>
                       ))}
                       <button 
                         onClick={() => { setSelectedPkgId(''); setCollectAmount(selectedUser.balance); }}
                         className={`p-4 rounded-2xl border-2 text-left transition-all ${!selectedPkgId ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                       >
                          <p className="text-[11px] font-black text-slate-900 uppercase">Custom Balance</p>
                          <p className="text-[9px] font-bold text-slate-400">Manual Node Override</p>
                       </button>
                    </div>
                 </div>
                 <div className="p-8 bg-slate-900 rounded-[2.5rem] border-b-8 border-emerald-600 shadow-inner">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block text-center italic">Calculated Receipt (Rs.)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-2xl">Rs.</span>
                       <input 
                         type="number" 
                         className="w-full pl-16 pr-6 py-6 bg-transparent border-none rounded-[2.5rem] font-black text-4xl sm:text-5xl outline-none text-emerald-400 text-center transition-all" 
                         value={collectAmount} 
                         onChange={e => setCollectAmount(Number(e.target.value))} 
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Calendar size={12}/> Settlement Date</label>
                       <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-emerald-500" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Clock size={12}/> Grace Protocol</label>
                       <button onClick={() => setIsGraceActive(!isGraceActive)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isGraceActive ? 'border-amber-50 bg-amber-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                          <span className={`text-[10px] font-black uppercase ${isGraceActive ? 'text-amber-700' : 'text-slate-400'}`}>3-Day Active Grace</span>
                          {isGraceActive ? <CheckCircle size={18} className="text-amber-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
                       </button>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                       {['Cash', 'Bank', 'EasyPaisa', 'JazzCash'].map(m => (
                         <button key={m} onClick={() => setSelectedMethod(m as any)} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${selectedMethod === m ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>{m}</button>
                       ))}
                    </div>
                 </div>
                 <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${shouldActivatePkg ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}><Zap size={20} fill={shouldActivatePkg ? "currentColor" : "none"} /></div>
                       <div><h5 className="text-xs font-black uppercase text-slate-900">Push Link Update</h5><p className="text-[8px] text-slate-500 font-bold uppercase">Activate package node instantly</p></div>
                    </div>
                    <button onClick={() => setShouldActivatePkg(!shouldActivatePkg)} className={`w-12 h-6 rounded-full relative transition-all ${shouldActivatePkg ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shouldActivatePkg ? 'left-7' : 'left-1'}`}></div></button>
                 </div>
              </div>
              <div className="p-8 sm:p-10 bg-slate-50 border-t shrink-0">
                <button onClick={handleExecuteCollection} disabled={isProcessing || collectAmount <= 0} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Commit Ledger Pulse
                </button>
              </div>
           </div>
        </div>
      )}

      {/* 4. EDIT USER DOSSIER MODAL */}
      {isEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in flex flex-col max-h-[90vh]">
              <header className="p-8 border-b bg-indigo-600 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><Pencil size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Modify Dossier</h3>
                       <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">Ref: {selectedUser.connectionId}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsEditUserModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={32}/></button>
              </header>
              <div className="p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Name</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Relay</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KYC Node (CNIC)</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={editUserData.cnic} onChange={e => setEditUserData({...editUserData, cnic: e.target.value})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Username</label><input className="w-full p-4 bg-slate-50 border rounded-xl font-bold" value={editUserData.username} onChange={e => setEditUserData({...editUserData, username: e.target.value})} /></div>
                 </div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Functional Address</label><textarea className="w-full p-4 bg-slate-50 border rounded-xl font-bold h-24" value={editUserData.address} onChange={e => setEditUserData({...editUserData, address: e.target.value})} /></div>
              </div>
              <footer className="p-8 bg-slate-50 border-t">
                 <button onClick={handleUpdateDossier} disabled={isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Authorize Updates</button>
              </footer>
           </div>
        </div>
      )}

      {/* 5. AUTH RESET MODAL */}
      {isResetPassModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-md shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in">
              <header className="p-8 bg-orange-500 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <LockKeyhole size={28}/>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Auth Reset</h3>
                 </div>
                 <button onClick={() => setIsResetPassModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={28}/></button>
              </header>
              <div className="p-10 space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">New Node Secret</label>
                    <div className="relative">
                       <input 
                         type={showNewPass ? 'text' : 'password'}
                         className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl outline-none focus:border-orange-500 transition-all text-center"
                         value={newAuthSecret}
                         onChange={e => setNewAuthSecret(e.target.value)}
                         placeholder="••••••••"
                       />
                       <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                          {showNewPass ? <EyeOff size={24}/> : <Eye size={24}/>}
                       </button>
                    </div>
                 </div>
                 <button onClick={handleAuthReset} disabled={isProcessing || !newAuthSecret} className="w-full py-6 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Commit Rotation</button>
              </div>
           </div>
        </div>
      )}

      {/* 6. SUSPEND / KILL-SWITCH MODAL */}
      {isSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-md shadow-2xl border-[12px] border-rose-50 overflow-hidden animate-in zoom-in">
              <div className="p-10 text-center space-y-8">
                 <div className="w-24 h-24 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse"><ShieldAlert size={56}/></div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Engage Kill-Switch?</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed px-4">Severing this link will immediately disable internet throughput for node {selectedUser.connectionId}.</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setIsSuspendModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px]">Abort</button>
                    <button onClick={() => handleStatusShift(UserStatus.SUSPENDED)} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">Suspend Node</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 7. RECONNECT MODAL */}
      {isReconnectModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-md shadow-2xl border-[12px] border-indigo-50 overflow-hidden animate-in zoom-in">
              <div className="p-10 text-center space-y-8">
                 <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl"><RefreshCw size={56}/></div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Authorize Cold Boot?</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed px-4">Push a re-authorization signal to OLT/Router for identity {selectedUser.name}.</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setIsReconnectModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px]">Cancel</button>
                    <button onClick={() => handleStatusShift(UserStatus.ACTIVE)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">Provision Active</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 8. CUSTOMER 360 MODAL */}
      {isViewUserModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
           <div className="bg-white rounded-[3.5rem] w-full max-w-5xl shadow-2xl border-[8px] border-slate-50 flex flex-col h-[90vh] animate-in zoom-in duration-300 overflow-hidden">
              <header className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                       <Fingerprint size={32} className="text-indigo-400" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{selectedUser.name}</h3>
                       <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Dossier ID: {selectedUser.connectionId}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsViewUserModal(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"><X size={32}/></button>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-50/50 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Identity Node */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4 italic"><User size={14} className="text-indigo-500"/> Node Parameters</h4>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3"><Smartphone size={16} className="text-slate-300"/><span className="text-xs font-bold">{selectedUser.phone}</span></div>
                          <div className="flex items-center gap-3"><Mail size={16} className="text-slate-300"/><span className="text-xs font-bold lowercase">{selectedUser.email || 'NO_MAIL_LINK'}</span></div>
                          <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-300"/><span className="text-xs font-bold uppercase">{selectedUser.area}</span></div>
                          <div className="flex items-center gap-3"><CreditCard size={16} className="text-slate-300"/><span className="text-xs font-bold">{selectedUser.cnic || 'NO_KYC_NODE'}</span></div>
                       </div>
                    </div>

                    {/* Fiscal Node */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4 italic"><DollarSign size={14} className="text-emerald-500"/> Fiscal Health</h4>
                       <div className="space-y-6">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Outstanding Balance</p>
                             <p className={`text-2xl font-black ${selectedUser.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Rs. {selectedUser.balance.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Credit Trust Score</p>
                             <p className="text-2xl font-black text-indigo-600 italic tracking-tighter">{selectedUser.creditScore}</p>
                          </div>
                       </div>
                    </div>

                    {/* Link Layer Node */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4 italic"><Signal size={14} className="text-blue-500"/> Link Layer</h4>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedUser.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{selectedUser.status}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black text-slate-400 uppercase">Path</span>
                             <span className="text-[10px] font-black text-slate-900 uppercase italic">{selectedUser.connectionType}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black text-slate-400 uppercase">Expiry Node</span>
                             <span className="text-[10px] font-black text-slate-900 italic">{selectedUser.expiryDate ? new Date(selectedUser.expiryDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* History Panels */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                       <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><FileText size={16} className="text-blue-500"/> Document Audit</h4>
                       </div>
                       <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                          {userInvoices.map(inv => (
                            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                               <div><p className="font-black text-slate-900 uppercase text-xs">{inv.packageName}</p><p className="text-[8px] text-slate-400 font-bold">{new Date(inv.createdAt).toLocaleDateString()}</p></div>
                               <div className="text-right"><p className="text-xs font-black text-slate-900 italic">Rs. {inv.totalAmount}</p><span className={`text-[7px] font-black uppercase ${inv.status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>{inv.status}</span></div>
                            </div>
                          ))}
                          {userInvoices.length === 0 && <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No documents found.</div>}
                       </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                       <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Layers size={16} className="text-indigo-500"/> Ledger Audit Trail</h4>
                       </div>
                       <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                          {userLedger.map(l => (
                            <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                               <div className="flex items-center gap-3">
                                  {l.type === LedgerType.DEBIT ? <ArrowUpRight size={14} className="text-rose-500"/> : <ArrowDownLeft size={14} className="text-emerald-500"/>}
                                  <div><p className="font-black text-slate-900 uppercase text-[10px]">{l.description}</p><p className="text-[8px] text-slate-400 font-bold">{new Date(l.timestamp).toLocaleString()}</p></div>
                               </div>
                               <p className={`text-xs font-black italic ${l.type === LedgerType.DEBIT ? 'text-rose-600' : 'text-emerald-600'}`}>Rs. {l.amount}</p>
                            </div>
                          ))}
                          {userLedger.length === 0 && <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No ledger activity found.</div>}
                       </div>
                    </div>
                 </div>
              </div>

              <footer className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <ShieldCheck size={24} className="text-emerald-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossier Integrity Verified</p>
                 </div>
                 <button onClick={() => setIsViewUserModal(false)} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Close Handshake</button>
              </footer>
           </div>
        </div>
      )}

      {/* BULK GRACE MODAL */}
      {isBulkGraceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] w-full max-lg shadow-2xl border-[8px] border-slate-50 overflow-hidden animate-in zoom-in">
              <header className="p-8 sm:p-10 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"><Clock size={28}/></div>
                    <div><h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter leading-none">Grace Protocol</h3><p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">Transactional Expiry Extension</p></div>
                 </div>
                 <button onClick={() => setIsBulkGraceModal(false)} className="p-3 hover:bg-white/10 rounded-2xl"><X size={32}/></button>
              </header>
              <div className="p-8 sm:p-10 space-y-10">
                 <div className="space-y-3 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">TARGET: {selectedIds.size} NODES</p>
                    <p className="text-sm font-bold text-slate-600 uppercase leading-relaxed">Assign "Pay Later" status and push physical registry expiry to the specified date.</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Expiry Date</label>
                    <input type="date" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-xl outline-none focus:border-indigo-600 transition-all text-center" value={bulkGraceDate} onChange={e => setBulkGraceDate(e.target.value)} />
                 </div>
                 <button onClick={executeBulkGrace} disabled={isProcessing} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Authorize Mass Extension
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* BULK PACKAGE MODAL */}
      {isBulkPackageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] w-full max-lg shadow-2xl border-[8px] border-slate-50 overflow-hidden animate-in zoom-in">
              <header className="p-8 sm:p-10 border-b bg-indigo-600 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg"><PackageIcon size={28}/></div>
                    <div><h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter leading-none">Mass Provisioning</h3><p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">Global Plan Assignment</p></div>
                 </div>
                 <button onClick={() => setIsBulkPackageModal(false)} className="p-3 hover:bg-white/10 rounded-2xl"><X size={32}/></button>
              </header>
              <div className="p-8 sm:p-10 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {state.packages.filter(p => !p.deleted).map(pkg => (
                       <button 
                         key={pkg.id} 
                         onClick={() => setSelectedPkgId(pkg.id)}
                         className={`p-6 rounded-[2rem] border-2 text-left transition-all ${selectedPkgId === pkg.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                       >
                          <h4 className="font-black text-slate-900 uppercase italic">{pkg.name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{pkg.speed} • Rs. {pkg.price}</p>
                       </button>
                    ))}
                 </div>
                 <button 
                   onClick={async () => {
                     if(!selectedPkgId) return;
                     setIsProcessing(true);
                     await db.bulkActivatePackages(Array.from(selectedIds), selectedPkgId);
                     setIsBulkPackageModal(false);
                     setSelectedIds(new Set());
                     setIsProcessing(false);
                     setIsSuccessModal(true);
                   }} 
                   disabled={isProcessing || !selectedPkgId} 
                   className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Authorize Mass Provision
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {isSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="bg-white rounded-[3.5rem] w-full max-sm shadow-2xl p-10 sm:p-12 text-center space-y-8 animate-in zoom-in border-[8px] border-emerald-50">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce"><CheckCircle size={56} strokeWidth={3}/></div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-slate-900">Handshake Verified</h3>
              <button onClick={() => setIsSuccessModal(false)} className="w-full py-4 sm:py-5 bg-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest">Return to Registry</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
