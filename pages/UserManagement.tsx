import React, { useState, useMemo, useEffect } from 'react';
import { AppState, UserStatus, ISPUser, Role, PaymentStatus, Package, PaymentMethod, ConnectionStatus, VerificationStatus, LedgerType } from '../types';
import { 
  Search, UserPlus, ShieldAlert, ChevronRight, X, Activity, Trash2, 
  ChevronLeft, Pencil, Save, Info, Network, MapPin, HardDrive, 
  CheckCircle, AlertCircle, Clock, ShieldCheck, DollarSign, Wallet, CreditCard, Home, Ban, Flame,
  Square, CheckSquare, Layers, AlertTriangle, Key, Cpu, Zap, Calendar, Banknote, Globe, Loader2, XCircle, RotateCw, Lock, LogOut, Eye, UserCircle, Fingerprint, Map as MapIcon, Smartphone, Bell, ListChecks,
  User, Users, Hash, MessageSquare, Package as PackageIcon, LockKeyhole, ArrowRight, MousePointer2, Settings2, Power,
  SearchCode, EyeOff, ExternalLink, ArrowUpRight, ArrowDownLeft,
  Mail, Wifi, FileText, MoreHorizontal, Play, FileInput, Circle, RefreshCcw, Radio
} from 'lucide-react';
import { db } from '../db';
import PasswordInput from '../components/shared/PasswordInput';
import { Modal } from '../components/shared/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { enterpriseApi } from '../api/client';

const UserManagement: React.FC<{ state: AppState; searchTerm?: string; autoOpenAction?: string; navParams?: any }> = ({ state, searchTerm: globalSearchTerm, autoOpenAction, navParams }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = React.useDeferredValue(searchTerm);
  const [filterType, setFilterType] = useState<'All' | 'Expired' | 'Unpaid' | 'Paid' | 'Half Paid' | 'Half Data' | 'Unverified' | 'Verified' | 'Deleted'>('All');

  useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setSearchTerm(globalSearchTerm);
    }
  }, [globalSearchTerm]);

  useEffect(() => {
    if (autoOpenAction === 'add-user') {
      setOnboardingStep(1);
      setEditUserData({...initialUserForm});
      setIsNewUserModal(true);
    } else if (autoOpenAction === 'recovery') {
      setFilterType('Unpaid');
    }
  }, [autoOpenAction]);
  
  // Modal States
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [provisioningStep, setProvisioningStep] = useState(1);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [isEditUserModal, setIsEditUserModal] = useState(false);
  const [isResetPassModal, setIsResetPassModal] = useState(false);
  const [isEmergencyAuthModal, setIsEmergencyAuthModal] = useState(false);
  const [emergencyAuthMode, setEmergencyAuthMode] = useState<'Link' | 'TempPassword'>('Link');
  const [isViewUserModal, setIsViewUserModal] = useState(false);
  const [isSuspendModal, setIsSuspendModal] = useState(false);
  const [isReconnectModal, setIsReconnectModal] = useState(false);
  const [isActivationModal, setIsActivationModal] = useState(false);
  const [isCollectPaymentModal, setIsCollectPaymentModal] = useState(false);
  const [isManualUnpaidModal, setIsManualUnpaidModal] = useState(false);
  const [isRadiusModal, setIsRadiusModal] = useState(false);
  const [radiusAction, setRadiusAction] = useState<'disconnect' | 'coa'>('disconnect');
  const [radiusAttributes, setRadiusAttributes] = useState('Framed-IP-Address=0.0.0.0');

  // Bulk States
  const [isBulkGraceModal, setIsBulkGraceModal] = useState(false);
  const [isBulkPackageModal, setIsBulkPackageModal] = useState(false);
  const [isBulkFlashModal, setIsBulkFlashModal] = useState(false);
  const [flashConfirmText, setFlashConfirmText] = useState('');
  const [flashMonths, setFlashMonths] = useState(1);
  const [bulkGraceDate, setBulkGraceDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);

  // Form States
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [shouldActivatePkg, setShouldActivatePkg] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [newAuthSecret, setNewAuthSecret] = useState('');
  
  const [isImportUsersModal, setIsImportUsersModal] = useState(false);
  const [importCsvInput, setImportCsvInput] = useState('');
  
  const [isApplyDiscountModal, setIsApplyDiscountModal] = useState(false);
  const [bulkDiscountAmount, setBulkDiscountAmount] = useState('0');
  const [isBulkTagModal, setIsBulkTagModal] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  
  const [isGraceActive, setIsGraceActive] = useState(true); 
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualExpiryDate, setManualExpiryDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [manualUnpaidAmount, setManualUnpaidAmount] = useState<number>(0);
  const [isBulkSellerModal, setIsBulkSellerModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState('');
 
  useEffect(() => {
    if (navParams?.action === 'renew' && navParams?.userId) {
      const user = state.users.find(u => u.id === navParams.userId);
      if (user) {
        setSelectedUserId(user.id);
        setSelectedPkgId(user.packageId);
        const pkg = state.packages.find(p => p.id === user.packageId);
        setManualUnpaidAmount(pkg?.price || 0);
        setIsManualUnpaidModal(true);
      }
    }
  }, [navParams, state.users, state.packages]);

  const initialUserForm: Partial<ISPUser> = {
    name: '', username: '', password: '', packageId: '', connectionType: 'Fiber',
    cnic: '', phone: '', email: '', address: '', subarea: '',
    pppoeId: '', nasId: '', vlanId: '', oltNode: '', portalEnabled: true,
    status: UserStatus.PENDING_VERIFICATION,
    macLock: false, macAddress: '', boxNumber: '', boxAddress: '',
    uplinkPort: '', fiberCode: '', fiberColor: '', onuBoard: '', onuPort: '',
    backupConnection: '', electricityType: '', cableType: '',
    invoiceWithTax: false, taxExemption: false, autoRenewal: true
  };

  const [editUserData, setEditUserData] = useState<Partial<ISPUser>>(initialUserForm);
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const activeUsers = useMemo(() => state.users.filter(u => filterType === 'Deleted' ? !!u.deleted : !u.deleted), [state.users, filterType]);
  
  const filteredUsers = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim();
    let users = activeUsers;

    // Apply Filter Logic
    if (filterType !== 'All' && filterType !== 'Deleted') {
      users = users.filter(u => {
        const pkg = state.packages.find(p => p.id === u.packageId);
        switch (filterType) {
          case 'Expired': return u.status === UserStatus.EXPIRED || (u.expiryDate && new Date(u.expiryDate) < new Date());
          case 'Unpaid': return u.balance > 0;
          case 'Paid': return u.balance <= 0 && u.packageId;
          case 'Half Paid': return pkg && u.balance > 0 && u.balance < pkg.price;
          case 'Half Data': return (u.dataUsed ?? 0) && (u.dataLimit ?? 0) && ((u.dataUsed ?? 0) / (u.dataLimit ?? 0)) >= 0.5;
          case 'Unverified': return u.verificationStatus === VerificationStatus.UNVERIFIED || u.verificationStatus === VerificationStatus.PENDING || u.status === UserStatus.PENDING_VERIFICATION;
          case 'Verified': return u.verificationStatus === VerificationStatus.VERIFIED;
          default: return true;
        }
      });
    }

    return users.filter(u => 
      u.name.toLowerCase().includes(term) || 
      (u.connectionId || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.pppoeId || '').toLowerCase().includes(term) ||
      (u.macIp || '').toLowerCase().includes(term)
    );
  }, [activeUsers, deferredSearch, filterType, state.packages]);

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

  const handleRepairIntegrity = async () => {
    setIsRepairing(true);
    try {
      const res = await db.healUserRegistry();
      if (res.success) {
         db.logNotification('all', 'success', 'Registry Integrity Pulse Complete', `Successfully audited registry. ${res.recovered} ghost user nodes recovered.`);
      } else {
         db.logNotification('all', 'error', 'Integrity Protocol Error', 'IRS Handshake failed or returned invalid state.');
      }
    } catch (err: any) {
      db.logNotification('all', 'error', 'System Fault', err.message || 'Critical failure in integrity protocol.');
    } finally {
      setIsRepairing(false);
    }
  };

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

  const handleAction = async (user: ISPUser, action: string) => {
    setSelectedUserId(user.id);
    setEditUserData({ ...user });
    setNewAuthSecret('');
    
    // Reset Defaults
    setProvisioningStep(1);
    setPaymentStatus('Paid');
    setSelectedMethod(PaymentMethod.CASH);
    setCollectAmount(user.balance || 0);
    setIsGraceActive(true);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSelectedPkgId(user.packageId || '');
    setConfirmPassword('');

    if (action === 'unverify') {
      const confirmUnverify = window.confirm(`Are you sure you want to unverify ${user.name}? This will restrict their access to "Limited Mode".`);
      if (confirmUnverify) {
        setIsProcessing(true);
        const res = await db.unverifyUser(user.id);
        setIsProcessing(false);
        if (!res.success) alert(res.message);
      }
      return;
    } 
    
    if (action === 'verify') {
      const confirmVerify = window.confirm(`Manually verify ${user.name}? This grants full access immediately.`);
      if (confirmVerify) {
        setIsProcessing(true);
        const res = await db.adminVerifyUser(user.id);
        setIsProcessing(false);
        if (!res.success) alert(res.message);
      }
      return;
    }

    switch(action) {
      case 'edit': 
        setOnboardingStep(1);
        setIsEditUserModal(true); 
        break;
      case 'reset': setIsResetPassModal(true); break;
      case 'emergency_auth': setIsEmergencyAuthModal(true); break;
      case 'package': setIsActivationModal(true); break;
      case 'payment': setIsCollectPaymentModal(true); break;
      case 'view': setIsViewUserModal(true); break;
      case 'suspend': setIsSuspendModal(true); break;
      case 'reconnect': setIsReconnectModal(true); break;
      case 'unpaid_amount': 
         setManualExpiryDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
         setManualUnpaidAmount(user.balance || 0);
         setIsManualUnpaidModal(true); 
         break;
      case 'radius':
         setIsRadiusModal(true);
         break;
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
    if (!pkg) { setIsProcessing(false); return; }

    const isApprover = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN, Role.MANAGER].includes(currentUserRole as Role);

    if (!isApprover) {
      // Non-admin: route to Approval Desk
      await db.submitApprovalRequest(
        'Plan_Activation', selectedUserId,
        pkg.price, selectedMethod, '',
        { pkgId: selectedPkgId, amount: pkg.price, paymentStatus, method: selectedMethod,
          activationStartDate: new Date().toISOString().split('T')[0],
          details: { collectorName: state.currentUser?.name || 'Staff', collectionDate: new Date().toISOString().split('T')[0] }
        }
      );
      setIsProcessing(false);
      setIsActivationModal(false);
      setIsSuccessModal(true);
      return;
    }

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
    
    const isApprover = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN, Role.MANAGER].includes(currentUserRole as Role);

    if (!isApprover) {
      // Non-admin: route to Approval Desk
      await db.submitApprovalRequest(
        'Payment_Collection', selectedUserId,
        collectAmount, selectedMethod, '',
        { collectAmount, method: selectedMethod, shouldActivatePkg, isGraceActive,
          pkgId: selectedPkgId, taxMultiplier: 1 }
      );
      setIsProcessing(false);
      setIsCollectPaymentModal(false);
      setIsSuccessModal(true);
      return;
    }

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

  const handleExecuteManualUnpaid = async () => {
    if (!selectedUserId || !selectedPkgId) return;
    setIsProcessing(true);
    
    const pkg = state.packages.find(p => p.id === selectedPkgId);
    if (!pkg) { setIsProcessing(false); return; }

    if (pkg.price > manualUnpaidAmount) {
         const paidAmount = pkg.price - manualUnpaidAmount;
         await db.processTopup('Admin', selectedUserId, 'user', paidAmount);
         await db.addManualPayment(selectedUserId, paidAmount, PaymentMethod.CASH);
    }
    
    await db.activatePackage(selectedUserId, selectedPkgId);
    
    await db.updateUser(selectedUserId, {
        balance: manualUnpaidAmount,
        expiryDate: new Date(manualExpiryDate).toISOString(),
        status: manualUnpaidAmount > 0 ? UserStatus.ACTIVE_UNPAID : UserStatus.ACTIVE
    });

    setIsProcessing(false);
    setIsManualUnpaidModal(false);
    setIsSuccessModal(true);
  };

  const handleUpdateDossier = async () => {
    if (!selectedUserId) return;
    
    // Password validation if provided
    if (editUserData.password) {
      if (editUserData.password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
    }

    setIsProcessing(true);
    const res = await db.updateUser(selectedUserId, editUserData);
    setIsProcessing(false);
    
    if (res.success) {
      setIsEditUserModal(false);
      setIsSuccessModal(true);
    } else {
      alert(res.message);
    }
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
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.size} users?`)) return;
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

  const executeBulkSellerChange = async () => {
    if(!selectedSellerId) return;
    setIsProcessing(true);
    await db.bulkChangeSeller(Array.from(selectedIds), selectedSellerId);
    setIsBulkSellerModal(false);
    setSelectedIds(new Set());
    setIsProcessing(false);
    setIsSuccessModal(true);
  };

  const ActionIcon = ({ icon: Icon, color, label, onClick, disabled }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`p-2.5 rounded-xl transition-all border group relative ${
        disabled 
          ? 'bg-slate-50 text-slate-200 border-slate-50 grayscale cursor-not-allowed opacity-20' 
          : `${color} border-slate-100 shadow-sm hover:shadow-md hover:scale-110 active:scale-95 bg-white`
      }`}
    >
      <Icon size={16} strokeWidth={2.5} />
    </button>
  );

  const subAreas = ['Block A', 'Block B', 'Block C', 'Sector 1', 'Sector 2', 'Main Market', 'Garden Town', 'Phase 1', 'Phase 2'];

  return (
    <div className="min-h-screen overflow-y-auto space-y-6 pb-12">
      {/* 1. Header Zone */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
        <div className="hidden md:block">
          <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-black text-slate-900 tracking-tighter uppercase italic leading-none">Subscribers Hub</h2>
          <p className="text-[clamp(0.5rem,2vw,0.6rem)] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 italic border-l-2 border-indigo-500 pl-3">Advanced Registry & Lifecycle Engine</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0">
          <button 
             onClick={() => setIsImportUsersModal(true)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
             <FileInput size={14} /> Import
          </button>
          {isAdmin && (
             <button 
               onClick={handleRepairIntegrity}
               disabled={isRepairing}
               className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm border ${
                 isRepairing 
                   ? 'bg-slate-50 text-slate-400 border-slate-100' 
                   : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
               }`}
             >
               {isRepairing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
               <span>{isRepairing ? 'Healing...' : 'Fix Errors'}</span>
             </button>
          )}
          <button 
            onClick={() => { setOnboardingStep(1); setIsNewUserModal(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-2xl active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            <span>+ Add New User</span>
          </button>
        </div>
      </div>

      {/* 2. Subscriber Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {[
          { label: 'Total Base', count: state.users.length, icon: Users, grad: 'var(--grad-primary)', sub: 'Database Total' },
          { label: 'Payments Due', count: state.users.filter(u => u.balance > 0).length, icon: DollarSign, grad: 'var(--grad-error)', sub: 'Arrears Pipeline' },
          { label: 'Expired Link', count: state.users.filter(u => u.status === UserStatus.EXPIRED).length, icon: Activity, grad: 'var(--grad-warning)', sub: 'Inactive Nodes' },
          { label: 'Registry Queue', count: state.users.filter(u => u.verificationStatus !== VerificationStatus.VERIFIED).length, icon: ShieldAlert, grad: 'var(--grad-violet)', sub: 'Verification' },
        ].map((kpi, idx) => (
          <div key={idx} className="card relative overflow-hidden border-none shadow-2xl p-6 group transition-all hover:scale-[1.02]" style={{ backgroundImage: kpi.grad }}>
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-2xl -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700" />
             <div className="relative z-10 text-white flex flex-col gap-4">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-90">{kpi.label}</p>
                   <div className="p-2 rounded-xl bg-white/25 backdrop-blur-md">
                      <kpi.icon size={18} strokeWidth={2.5} />
                   </div>
                </div>
                <h3 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black italic tracking-tighter leading-none">{kpi.count}</h3>
                <p className="text-[9px] font-black uppercase opacity-70 mt-1 tracking-widest">{kpi.sub}</p>
             </div>
          </div>
        ))}
      </div>

      {/* 3. Global Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0">
        <div className="flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by Name, ID, Phone..." 
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-500 focus:bg-white text-[clamp(0.85rem,2vw,1rem)] font-black text-slate-900 placeholder:text-slate-400 placeholder:font-bold transition-all shadow-inner" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex items-center justify-between gap-4">
             <div className="scroll-x no-scrollbar flex-1">
               {(['All', 'Expired', 'Unpaid', 'Paid', 'Half Paid', 'Half Data', 'Unverified', 'Verified', 'Deleted'] as const).map(f => (
                 <button
                   key={f}
                   onClick={() => setFilterType(f)}
                   className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                     filterType === f 
                       ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                       : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                   }`}
                 >
                   {f}
                 </button>
               ))}
             </div>
             <button onClick={() => setSearchTerm('')} className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors"><RotateCw size={18} /></button>
          </div>
        </div>
      </div>

      {/* 4. Bulk Action Top Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 border border-white/5 shrink-0">
           <div className="flex items-center gap-6 border-b xl:border-b-0 xl:border-r border-white/10 pb-4 xl:pb-0 xl:pr-8 w-full xl:w-auto">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/20"><Layers size={28} /></div>
              <div>
                 <p className="text-xl font-black italic tracking-tighter leading-none">{selectedIds.size} Accounts</p>
                 <p className="text-[9px] text-indigo-400 font-black uppercase mt-2 tracking-[0.3em] italic">Batch Sector Active</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full xl:w-auto">
              <button onClick={() => setIsBulkGraceModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                 <Clock size={16} className="text-blue-400"/><span className="text-white">Extension</span>
              </button>
              <button onClick={() => { setSelectedPkgId(''); setIsBulkPackageModal(true); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                 <PackageIcon size={16} className="text-violet-400"/><span className="text-white">Plans</span>
              </button>
              <button onClick={async () => { 
                if(confirm(`Reset passwords for ${selectedIds.size} users?`)) {
                  setIsProcessing(true);
                  await db.bulkForcePasswordReset(Array.from(selectedIds)); 
                  setSelectedIds(new Set());
                  setIsProcessing(false);
                  setIsSuccessModal(true);
                }
              }} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                 <Lock size={16} className="text-amber-400"/><span className="text-white">Security</span>
              </button>
              <button onClick={() => setIsApplyDiscountModal(true)} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                 <Zap size={16} className="text-emerald-400"/><span className="text-white">Bonus</span>
              </button>
              <button onClick={() => { setBulkTagInput(''); setIsBulkTagModal(true); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                 <Smartphone size={16} className="text-sky-400"/><span className="text-white">Mapping</span>
              </button>
              <button onClick={() => { setSelectedSellerId(''); setIsBulkSellerModal(true); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all">
                 <UserPlus size={16} className="text-indigo-400"/><span className="text-white">Seller</span>
              </button>
              <button onClick={() => { if(confirm(`Confirm permanent erasure of ${selectedIds.size} accounts?`)) executeBulkPurge(); }} className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-500/20 text-rose-400 transition-all">
                 <Trash2 size={16}/><span className="text-rose-400">Purge</span>
              </button>
           </div>
           
           <button onClick={() => setSelectedIds(new Set())} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><X size={20} /></button>
        </div>
      )}

      {/* 5. Subscriber Data Registry */}
      <div className="flex-1 flex flex-col relative w-full space-y-4">
        <div className="flex items-center justify-between px-2 shrink-0">
           <div className="flex items-center gap-6">
              <button onClick={toggleSelectAll} className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all">
                 <div className="w-5 h-5 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                    {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 && <CheckSquare size={16} className="text-indigo-600" />}
                 </div>
                 Select All ({filteredUsers.length})
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedIds(new Set(filteredUsers.filter(u => u.status === UserStatus.EXPIRED).map(u => u.id)))} className="text-[9px] font-black text-rose-400 uppercase tracking-tighter hover:underline">Select Expired</button>
                 <button onClick={() => setSelectedIds(new Set(filteredUsers.filter(u => u.balance > 0).map(u => u.id)))} className="text-[9px] font-black text-amber-500 uppercase tracking-tighter hover:underline">Select Overdue</button>
              </div>
           </div>
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">ClickOptix Registry Core • v4.0</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto w-full min-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="!bg-slate-50 !border-b-2 !border-slate-100">
                <th className="w-16 p-6"></th>
                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Name / Username</th>
                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Package</th>
                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Seller</th>
                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Billing Status</th>
                <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</th>
                <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Expiry</th>
                <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center opacity-20">
                         <SearchCode size={80} className="mb-6 text-indigo-500" />
                         <p className="text-lg font-black uppercase tracking-[0.3em] text-slate-900">No Matched Records</p>
                         <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Adjust filters to broaden registry lookup</p>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (                  <tr key={user.id} className={`group transition-all ${selectedIds.has(user.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-6">
                       <button onClick={() => toggleSelect(user.id)} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selectedIds.has(user.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-slate-100 text-slate-100 hover:border-slate-300'}`}>
                          {selectedIds.has(user.id) ? <CheckSquare size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-100" />}
                       </button>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs group-hover:scale-110 transition-all ${selectedIds.has(user.id) ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                             {user.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic">{user.name}</p>
                             {user.username ? (
                               <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">@{user.username}</p>
                             ) : (
                               <p className="text-[8px] text-amber-500 font-black uppercase tracking-widest mt-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 inline-block">Pending Setup</p>
                             )}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       {(() => {
                         const pkg = state.packages.find(p => p.id === user.packageId);
                         return (
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 uppercase italic leading-none">{pkg?.name || 'No Plan'}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{pkg?.speed || '0 Mbps'}</span>
                           </div>
                         );
                       })()}
                    </td>
                    <td className="px-6 py-4">
                       {(() => {
                         const seller = state.staff.find(s => s.email === user.dealerId || s.dealerCode === user.dealerId);
                         return (
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                 <User size={12} className="text-slate-400" />
                              </div>
                              <span className="text-[10px] font-black text-slate-600 uppercase italic">{seller?.name || user.dealerId || 'System'}</span>
                           </div>
                         );
                       })()}
                    </td>
                    <td className="px-6 py-4">
                       {(() => {
                         const pkg = state.packages.find(p => p.id === user.packageId);
                         const price = pkg?.price || 0;
                         const unpaid = user.balance || 0;
                         const paid = Math.max(0, price - unpaid);
                         return (
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                 <span>Paid</span>
                                 <span className="text-emerald-500">Rs. {paid.toLocaleString()}</span>
                              </div>
                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
                                 <div className="bg-emerald-500 h-full" style={{ width: `${price > 0 ? (paid / price) * 100 : 0}%` }}></div>
                                 <div className="bg-rose-500 h-full" style={{ width: `${price > 0 ? (unpaid / price) * 100 : 0}%` }}></div>
                              </div>
                              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                 <span>Unpaid</span>
                                 <span className="text-rose-500">Rs. {unpaid.toLocaleString()}</span>
                              </div>
                           </div>
                         );
                       })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <p className={`text-sm font-black tabular-nums ${user.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Rs. {(user.balance || 0).toLocaleString()}</p>
                       <span className={`inline-flex items-center gap-1 text-[7px] font-black uppercase px-2 py-0.5 rounded-lg ${user.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {user.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {user.expiryDate ? (
                          <div className="flex flex-col items-center">
                             <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-xl shadow-sm ${new Date(user.expiryDate) < new Date() ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-sky-50 text-sky-600 border border-sky-100'}`}>
                               {new Date(user.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                             </span>
                             <span className="text-[7px] font-bold text-slate-300 uppercase mt-1">{new Date(user.expiryDate).toLocaleDateString('en-GB', { year: 'numeric' })}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 uppercase italic">Infinite</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleAction(user, 'view')} className="p-2.5 bg-blue-100/50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-blue-100" title="Full 360 View"><Eye size={14}/></button>
                          <button onClick={() => handleAction(user, 'edit')} className="p-2.5 bg-amber-100/50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-amber-100" title="Dossier Edit"><Pencil size={14}/></button>
                          <button onClick={() => {
                             setSelectedUserId(user.id);
                             setSelectedPkgId(user.packageId);
                             const pkg = state.packages.find(p => p.id === user.packageId);
                             setManualUnpaidAmount(pkg?.price || 0);
                             setIsManualUnpaidModal(true);
                           }} className="p-2.5 bg-indigo-100/50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-indigo-100" title="Quick Renew"><RefreshCcw size={14}/></button>
                          <button onClick={() => handleAction(user, 'package')} className="p-2.5 bg-violet-100/50 hover:bg-violet-600 text-violet-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-violet-100" title="Service Provisioning"><PackageIcon size={14}/></button>
                          <button onClick={() => handleAction(user, 'payment')} className="p-2.5 bg-emerald-100/50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-emerald-100" title="Collect Payment"><Banknote size={14}/></button>
                          <button onClick={() => handleAction(user, 'unpaid_amount')} className="p-2.5 bg-pink-100/50 hover:bg-pink-600 text-pink-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-pink-100" title="Amount Unpaid / Partial Payment"><Wallet size={14}/></button>
                          <button onClick={() => handleAction(user, 'emergency_auth')} className="p-2.5 bg-rose-100/50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-rose-100" title="Emergency Auth Reset"><LockKeyhole size={14}/></button>
                          <button onClick={() => handleAction(user, 'radius')} className="p-2.5 bg-slate-100/50 hover:bg-slate-900 text-slate-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm border border-slate-100" title="RADIUS Session Control"><Radio size={14}/></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isNewUserModal || (isEditUserModal && !!selectedUser)}
        onClose={() => { setIsNewUserModal(false); setIsEditUserModal(false); }}
        title={
          isEditUserModal ? `Edit Subscriber: ${selectedUser?.name}` :
          onboardingStep === 1 ? "General Information" :
          onboardingStep === 2 ? "Connection Information" :
          onboardingStep === 3 ? "Internet Data Plan" :
          "Confirm Registration"
        }
        icon={isEditUserModal ? <Pencil size={22} className="text-blue-400" /> : <div className="w-8 h-8 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 italic font-black text-xs">S{onboardingStep}</div>}
        maxWidth="max-w-3xl"
        scrollable
        footer={
          <div className="flex justify-between items-center w-full">
             <button onClick={() => setOnboardingStep(Math.max(1, onboardingStep - 1))} className="px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 transition-all border border-slate-700 hover:opacity-70 disabled:opacity-30" disabled={onboardingStep === 1}>Go Back</button>
             {onboardingStep < 4 ? (
               <button onClick={() => setOnboardingStep(onboardingStep + 1)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all active:scale-95">Next Phase <ChevronRight size={14}/></button>
             ) : (
               <button 
                onClick={async () => { 
                  if (editUserData.password && editUserData.password !== confirmPassword) {
                    alert("Passwords do not match!");
                    return;
                  }
                  setIsProcessing(true); 
                  const res = isEditUserModal 
                    ? await db.updateUser(selectedUserId!, editUserData)
                    : await db.addUser(editUserData); 
                  setIsProcessing(false); 
                  if (res.success) {
                    setIsEditUserModal(false); 
                    setIsNewUserModal(false);
                    setIsSuccessModal(true); 
                  } else {
                    alert(res.message);
                  }
                }} 
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-green-900/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50" 
                disabled={isProcessing}
               >
                  {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <ShieldCheck size={14}/>} {isEditUserModal ? 'Update Dossier' : 'Finalize & Register'}
               </button>
             )}
          </div>
        }
      >
         {(() => {
            switch(onboardingStep) {
              case 1: return (
                <div className="space-y-6 mb-4">
                   <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                     <h4 className="text-xs font-black uppercase text-slate-900 pb-4 flex items-center gap-2">
                       <User size={16} className="text-blue-600"/> General Information
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Name *</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} placeholder="e.g. John Smith" /></div>
                        
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Username *</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.username} onChange={e => setEditUserData({...editUserData, username: e.target.value})} placeholder="PPPoE Username" /></div>
                        
                        <PasswordInput label="Password *" value={editUserData.password || ''} onChange={v => setEditUserData({...editUserData, password: v})} showStrength />
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Confirm Password *</label>
                          <input 
                            type="password"
                            className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="Confirm Password"
                          />
                        </div>

                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">CNIC Number *</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.cnic} onChange={e => setEditUserData({...editUserData, cnic: e.target.value})} placeholder="e.g: 42201-1234567-8" /></div>
                        
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} placeholder="e.g: john@example.com" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})} placeholder="e.g: 0213-4123456" /></div>
                        
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mobile *</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.secondaryPhone} onChange={e => setEditUserData({...editUserData, secondaryPhone: e.target.value})} placeholder="e.g: 0333-12345678" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Address *</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.address} onChange={e => setEditUserData({...editUserData, address: e.target.value})} placeholder="e.g: Block #12 Phase 5" /></div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sub Area *</label>
                          <select className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm appearance-none" value={editUserData.subarea} onChange={e => setEditUserData({...editUserData, subarea: e.target.value})}>
                            <option value="">Select Sub Area</option>
                            {subAreas.map(sa => <option key={sa} value={sa}>{sa}</option>)}
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Invoice With Tax</label>
                          <select className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.invoiceWithTax ? 'true' : 'false'} onChange={e => setEditUserData({...editUserData, invoiceWithTax: e.target.value === 'true'})}>
                            <option value="false">Disable</option>
                            <option value="true">Enable</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tax Exemption</label>
                          <select className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.taxExemption ? 'true' : 'false'} onChange={e => setEditUserData({...editUserData, taxExemption: e.target.value === 'true'})}>
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Assigned Seller / Dealer</label>
                           <select 
                              className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm"
                              value={editUserData.dealerId || ''}
                              onChange={e => setEditUserData({...editUserData, dealerId: e.target.value})}
                           >
                              <option value="">System Default</option>
                              {state.staff.filter(s => s.role === Role.DEALER || s.role === Role.ADMIN || s.role === Role.MANAGER).map(s => (
                                 <option key={s.email} value={s.dealerCode || s.email}>{s.name} ({s.role})</option>
                              ))}
                           </select>
                        </div>

                        {isEditUserModal && (
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Account Status</label>
                             <select className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.status} onChange={e => setEditUserData({...editUserData, status: e.target.value as UserStatus})}>
                                {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                        )}

                        {isEditUserModal && (
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Expiry Date</label>
                             <input type="date" className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.expiryDate ? editUserData.expiryDate.split('T')[0] : ''} onChange={e => setEditUserData({...editUserData, expiryDate: e.target.value})} />
                          </div>
                        )}

                        <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm self-end">
                           <label className="text-[10px] font-black text-slate-400 uppercase flex-1">Auto Renewal</label>
                           <button 
                             onClick={() => setEditUserData({...editUserData, autoRenewal: !editUserData.autoRenewal})}
                             className={`w-12 h-6 rounded-full transition-all relative ${editUserData.autoRenewal ? 'bg-green-500' : 'bg-slate-200'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editUserData.autoRenewal ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                        
                        <div className="col-span-1 md:col-span-2 space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Internal Admin Notes</label>
                           <textarea className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm h-20 resize-none" placeholder="Private notes visible only to admins..." value={editUserData.internalNotes || ''} onChange={e => setEditUserData({...editUserData, internalNotes: e.target.value})} />
                        </div>
                     </div>
                   </div>
                </div>
              );
              case 2: return (
                <div className="space-y-6 mb-4">
                   <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                     <h4 className="text-xs font-black uppercase text-slate-900 pb-4 flex items-center gap-2">
                       <Network size={16} className="text-indigo-600"/> Connection Information
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Connection Type *</label>
                          <select className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.nasConnectionType} onChange={e => setEditUserData({...editUserData, nasConnectionType: e.target.value as any})}>
                            <option value="PPPoE">Radius PPPoE</option>
                            <option value="Hotspot">Hotspot</option>
                            <option value="Static IP">Static IP</option>
                            <option value="Manual">Manual</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">NAS *</label>
                          <select 
                            className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm"
                            value={editUserData.nasId || ''}
                            onChange={e => setEditUserData({...editUserData, nasId: e.target.value})}
                          >
                            <option value="">Select NAS</option>
                            {state.nas.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">MAC Lock</label>
                          <select className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.macLock ? 'true' : 'false'} onChange={e => setEditUserData({...editUserData, macLock: e.target.value === 'true'})}>
                            <option value="false">Disable</option>
                            <option value="true">Enable</option>
                          </select>
                        </div>

                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">MAC Address</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.macAddress} onChange={e => setEditUserData({...editUserData, macAddress: e.target.value})} placeholder="e.g: C8:3A:35:36:9D:00" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Box/POP Number</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.boxNumber} onChange={e => setEditUserData({...editUserData, boxNumber: e.target.value})} placeholder="e.g: 001" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Box/POP Address</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.boxAddress} onChange={e => setEditUserData({...editUserData, boxAddress: e.target.value})} placeholder="e.g: Hyperstar" /></div>
                        
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Uplink Port</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.uplinkPort} onChange={e => setEditUserData({...editUserData, uplinkPort: e.target.value})} placeholder="e.g: 4" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fiber Code/ID</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.fiberCode} onChange={e => setEditUserData({...editUserData, fiberCode: e.target.value})} placeholder="e.g: 6 Slate" /></div>
                        
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fiber Colors</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.fiberColor} onChange={e => setEditUserData({...editUserData, fiberColor: e.target.value})} placeholder="e.g: Blue" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">MC/Switch/ONU Board</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.onuBoard} onChange={e => setEditUserData({...editUserData, onuBoard: e.target.value})} placeholder="e.g: PoE Switch" /></div>
                        
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Switch/ONU Port</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.onuPort} onChange={e => setEditUserData({...editUserData, onuPort: e.target.value})} placeholder="e.g: 8" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Backup Connection</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.backupConnection} onChange={e => setEditUserData({...editUserData, backupConnection: e.target.value})} placeholder="e.g: Ocean Mall" /></div>
                        
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Electricity Type/Socket</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.electricityType} onChange={e => setEditUserData({...editUserData, electricityType: e.target.value})} placeholder="e.g: Type D" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cable Type</label><input className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-sm text-slate-900 shadow-sm" value={editUserData.cableType} onChange={e => setEditUserData({...editUserData, cableType: e.target.value})} placeholder="e.g: CAT6 / Fiber" /></div>
                     </div>
                   </div>
                </div>
              );
              case 3: return (
                <div className="space-y-6 mb-4">
                   <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                     <h4 className="text-xs font-black uppercase text-slate-900 pb-4 flex items-center gap-2">
                       <PackageIcon size={16} className="text-emerald-600"/> Internet Data Plan
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {state.packages.map(p => (
                          <button key={p.id} onClick={() => setEditUserData({...editUserData, packageId: p.id})} className={`p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${editUserData.packageId === p.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                             <div>
                               <p className="font-black uppercase text-[10px] text-slate-900">{p.name}</p>
                               <p className="text-[9px] font-black text-blue-600 mt-1">{p.speed} • Rs. {p.price.toLocaleString()}</p>
                             </div>
                             {editUserData.packageId === p.id && <CheckCircle size={20} className="text-blue-600"/>}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>
              );
              case 4: return (
                <div className="space-y-8 text-center py-10 mb-4">
                   <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <ShieldCheck size={48} className="animate-bounce" />
                   </div>
                   <h4 className="text-2xl font-black uppercase text-slate-900 italic tracking-tighter">Ready to Register</h4>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
                      All protocols verified. Subscriber account will be provisioned with full portal access and selected bandwidth parameters.
                   </p>
                </div>
              );
              default: return null;
            }
         })()}
      </Modal>

      {/* 2. PLAN PROVISIONING MODAL */}
      <Modal
        isOpen={isActivationModal && !!selectedUser}
        onClose={() => setIsActivationModal(false)}
        title="Activate Plan"
        icon={<PackageIcon size={22} className="text-green-400" />}
        message="Activate User Plan"
        maxWidth="max-w-2xl"
        scrollable
        hideCloseButton={false}
        footer={
           provisioningStep === 2 ? (
              <div className="flex justify-between items-center w-full">
                 <button onClick={() => setProvisioningStep(1)} className="px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 transition-all border border-slate-700 hover:opacity-70 disabled:opacity-30" disabled={isProcessing}>Back to Plans</button>
                 <button onClick={handleExecuteProvisioning} disabled={isProcessing} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/30 flex items-center gap-2 active:scale-95 transition-all">
                    {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <ShieldCheck size={14}/>} Confirm Activation
                 </button>
              </div>
           ) : <div/>
        }
      >
        {provisioningStep === 1 ? (
           <div className="space-y-6 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Step 1: Select Plan</p>
              <div className="grid grid-cols-1 gap-3">
                {state.packages.map(pkg => (
                  <button key={pkg.id} onClick={() => { setSelectedPkgId(pkg.id); setProvisioningStep(2); }} className="p-6 rounded-2xl border-2 border-transparent bg-slate-50 hover:bg-white text-slate-900 transition-all text-left flex items-center justify-between group">
                     <div><h4 className="font-black uppercase italic">{pkg.name}</h4><p className="text-[9px] font-bold text-slate-400 uppercase">{pkg.speed} • Rs. {pkg.price}</p></div>
                     <ChevronRight className="text-slate-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
           </div>
         ) : (
           <div className="space-y-8 animate-in slide-in-from-right duration-300 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic pt-2">Step 2: Payment Status</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setPaymentStatus('Paid')} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${paymentStatus === 'Paid' ? 'border-green-600 bg-green-50 text-green-700 shadow-xl' : 'border-transparent bg-slate-50 text-slate-400 grayscale opacity-90'}`}>
                    <CheckCircle size={32} /><span className="text-[11px] font-black uppercase tracking-widest">Paid</span>
                 </button>
                 <button onClick={() => setPaymentStatus('Unpaid')} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 ${paymentStatus === 'Unpaid' ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-xl' : 'border-transparent bg-slate-50 text-slate-400 grayscale opacity-90'}`}>
                    <Clock size={32} /><span className="text-[11px] font-black uppercase tracking-widest">Unpaid</span>
                 </button>
              </div>
              {paymentStatus === 'Paid' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                   <div className="grid grid-cols-4 gap-2">
                      {[PaymentMethod.CASH, 'Bank', 'Stripe', 'EasyPaisa'].map(m => (
                        <button key={m} onClick={() => setSelectedMethod(m as any)} className={`py-4 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all ${selectedMethod === m ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-500'}`}>{m}</button>
                      ))}
                   </div>
                </div>
              )}
           </div>
         )}
      </Modal>

      {/* Bulk Seller Change Modal */}
      <Modal
        isOpen={isBulkSellerModal}
        onClose={() => setIsBulkSellerModal(false)}
        title="Reassign Seller Identity"
        icon={<UserPlus size={24} className="text-indigo-600" />}
        maxWidth="max-w-md"
        footer={
           <button 
             onClick={executeBulkSellerChange}
             disabled={!selectedSellerId}
             className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/30 active:scale-95 transition-all disabled:opacity-30"
           >
              Transfer Registry Ownership
           </button>
        }
      >
         <div className="space-y-6">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Target Dealer/Seller</p>
               <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {state.staff.filter(s => [Role.DEALER, Role.SUB_DEALER, Role.FRANCHISE].includes(s.role as Role)).map(seller => (
                     <button
                        key={seller.id}
                        onClick={() => setSelectedSellerId(seller.email || seller.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                           selectedSellerId === (seller.email || seller.id)
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                              : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-600'
                        }`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${selectedSellerId === (seller.email || seller.id) ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                              {seller.name.charAt(0)}
                           </div>
                           <div className="text-left">
                              <p className="text-[11px] font-black uppercase italic">{seller.name}</p>
                              <p className={`text-[8px] font-bold uppercase tracking-tighter ${selectedSellerId === (seller.email || seller.id) ? 'text-indigo-200' : 'text-slate-400'}`}>{seller.role}</p>
                           </div>
                        </div>
                        {selectedSellerId === (seller.email || seller.id) && <CheckCircle size={18} />}
                     </button>
                  ))}
               </div>
            </div>
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
               <AlertTriangle className="text-amber-500 shrink-0" size={20} />
               <p className="text-[10px] font-black text-amber-900 uppercase leading-relaxed italic">
                  Critical: This will move {selectedIds.size} subscribers to the new seller. This affects billing cycles and reseller commissions.
               </p>
            </div>
         </div>
      </Modal>

      {/* 3. LOG COLLECTION MODAL */}
      <Modal
        isOpen={isCollectPaymentModal && !!selectedUser}
        onClose={() => setIsCollectPaymentModal(false)}
        title="Receive Payment"
        icon={<Banknote size={22} className="text-green-400" />}
        message={`Subscriber: ${selectedUser?.name}`}
        maxWidth="max-w-2xl"
        scrollable
        onConfirm={handleExecuteCollection}
        confirmLabel="Confirm Payment"
        isLoading={isProcessing || collectAmount <= 0}
      >
         <div className="space-y-4 mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2"><PackageIcon size={12}/> Select Plan</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {state.packages.filter(p => !p.deleted).map(pkg => (
                 <button 
                   key={pkg.id} 
                   onClick={() => setSelectedPkgId(pkg.id)}
                   className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedPkgId === pkg.id ? 'border-green-600 bg-green-50 shadow-md text-slate-900' : 'border-slate-100 bg-slate-50 hover:border-slate-300 text-slate-900'}`}
                 >
                    <p className="text-[11px] font-black uppercase">{pkg.name}</p>
                    <p className="text-[9px] font-bold text-slate-400">Rs. {pkg.price} + Tax</p>
                 </button>
               ))}
               <button 
                 onClick={() => { setSelectedPkgId(''); setCollectAmount(selectedUser?.balance || 0); }}
                 className={`p-4 rounded-2xl border-2 text-left transition-all ${!selectedPkgId ? 'border-blue-600 bg-blue-50 shadow-md text-slate-900' : 'border-slate-100 bg-slate-50 hover:border-slate-300 text-slate-900'}`}
               >
                  <p className="text-[11px] font-black uppercase">Custom Balance</p>
                  <p className="text-[9px] font-bold text-slate-400">Enter Custom Amount</p>
               </button>
            </div>
         </div>
         <div className="p-8 bg-slate-900 rounded-[2.5rem] border-b-8 border-green-600 shadow-inner mb-6">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block text-center italic">Calculated Receipt (Rs.)</label>
            <div className="relative">
               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-2xl">Rs.</span>
               <input 
                 type="number" 
                 className="w-full pl-20 pr-6 py-6 bg-transparent border-none rounded-[2.5rem] font-black text-4xl sm:text-5xl outline-none text-green-400 text-center transition-all" 
                 value={collectAmount} 
                 onChange={e => setCollectAmount(Number(e.target.value))} 
               />
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Calendar size={12}/> Settlement Date</label>
               <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-green-500 text-slate-900" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Clock size={12}/> Grace Period</label>
               <button onClick={() => setIsGraceActive(!isGraceActive)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${isGraceActive ? 'border-amber-50 bg-amber-50 shadow-md' : 'border-slate-100 bg-slate-50'}`}>
                  <span className={`text-[10px] font-black uppercase ${isGraceActive ? 'text-amber-700' : 'text-slate-400'}`}>3-Day Active Grace</span>
                  {isGraceActive ? <CheckCircle size={18} className="text-amber-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
               </button>
            </div>
         </div>
         <div className="space-y-4 mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {[PaymentMethod.CASH, 'Bank', 'EasyPaisa', 'JazzCash'].map(m => (
                 <button key={m} onClick={() => setSelectedMethod(m as any)} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${selectedMethod === m ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>{m}</button>
               ))}
            </div>
         </div>
         <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center justify-between shadow-sm mb-4">
            <div className="flex items-center gap-4">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${shouldActivatePkg ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}><Zap size={20} fill={shouldActivatePkg ? "currentColor" : "none"} /></div>
               <div><h5 className="text-xs font-black uppercase text-slate-900">Auto Activate Plan</h5><p className="text-[8px] text-slate-500 font-bold uppercase">Activate selected plan instantly</p></div>
            </div>
            <button onClick={() => setShouldActivatePkg(!shouldActivatePkg)} className={`w-12 h-6 rounded-full relative transition-all ${shouldActivatePkg ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shouldActivatePkg ? 'left-7' : 'left-1'}`}></div></button>
         </div>
      </Modal>



      {/* 5. AUTH RESET MODAL */}
      <Modal
        isOpen={isResetPassModal && !!selectedUser}
        onClose={() => setIsResetPassModal(false)}
        title="Auth Reset"
        icon={<LockKeyhole size={22} className="text-orange-400" />}
        maxWidth="max-w-md"
        onConfirm={handleAuthReset}
        confirmLabel="Update Password"
        isLoading={isProcessing || !newAuthSecret}
      >
         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">New Password</label>
            <div className="relative">
               <input 
                 type={showNewPass ? 'text' : 'password'}
                 className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl outline-none focus:border-orange-500 transition-all text-center"
                 value={newAuthSecret}
                 onChange={e => setNewAuthSecret(e.target.value)}
                 placeholder="••••••••"
               />
               <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                  {showNewPass ? <EyeOff size={24}/> : <Eye size={24}/>}
               </button>
            </div>
         </div>
      </Modal>
      
      {/* 5A. EMERGENCY AUTH RESET MODAL (CSAE) */}
      <Modal
        isOpen={isEmergencyAuthModal && !!selectedUser}
        onClose={() => setIsEmergencyAuthModal(false)}
        title="Emergency Auth Reset"
        icon={<LockKeyhole size={22} className="text-rose-500" />}
        maxWidth="max-w-md"
        onConfirm={async () => {
           setIsProcessing(true);
           const res = await db.adminEmergencyAuthReset(selectedUserId!, emergencyAuthMode, emergencyAuthMode === 'TempPassword' ? newAuthSecret : undefined);
           setIsProcessing(false);
           if (res.success) {
              setIsEmergencyAuthModal(false);
              setNewAuthSecret('');
              setIsSuccessModal(true);
           } else {
              alert(res.message);
           }
        }}
        confirmLabel={emergencyAuthMode === 'Link' ? "Dispatch Smart Link" : "Establish Force Password"}
        isLoading={isProcessing || (emergencyAuthMode === 'TempPassword' && !newAuthSecret)}
      >
         <div className="space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
               <div className="flex items-center gap-3 mb-2">
                  <ShieldAlert className="text-rose-600" size={18} />
                  <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest leading-none">Emergency Override Active</h4>
               </div>
               <p className="text-[9px] font-bold text-rose-500 uppercase leading-relaxed italic">Administrative reset for {selectedUser?.name}. All active sessions will be invalidated upon protocol completion.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => setEmergencyAuthMode('Link')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${emergencyAuthMode === 'Link' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
               >
                  <Cpu size={20} />
                  <span className="text-[9px] font-black uppercase">CSAE Smart Link</span>
               </button>
               <button 
                  onClick={() => setEmergencyAuthMode('TempPassword')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${emergencyAuthMode === 'TempPassword' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
               >
                  <Key size={20} />
                  <span className="text-[9px] font-black uppercase">Force Password</span>
               </button>
            </div>

            {emergencyAuthMode === 'Link' ? (
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Protocol Detail:</p>
                  <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase">Dispatches a secure, one-time reset link via optimal provider (Firebase/Email/WhatsApp) based on real-time delivery health.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Set Force Password</label>
                     <div className="relative">
                        <input 
                           type={showNewPass ? 'text' : 'password'}
                           className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl outline-none focus:border-rose-500 transition-all text-center"
                           value={newAuthSecret}
                           onChange={e => setNewAuthSecret(e.target.value)}
                           placeholder="••••••••"
                        />
                        <button onClick={() => setShowNewPass(!showNewPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                           {showNewPass ? <EyeOff size={24}/> : <Eye size={24}/>}
                        </button>
                     </div>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-xl flex items-center gap-2">
                     <AlertCircle size={14} />
                     <p className="text-[8px] font-black uppercase tracking-widest">User will be forced to rotate at next login.</p>
                  </div>
               </div>
            )}
         </div>
      </Modal>

      {/* 6. SUSPEND / SUSPEND MODAL */}
      <ConfirmDialog
        isOpen={isSuspendModal}
        onClose={() => setIsSuspendModal(false)}
        title="Suspend User?"
        message={`This will immediately disable internet service for ${selectedUser?.connectionId}.`}
        confirmLabel="Suspend User"
        danger
        onConfirm={() => handleStatusShift(UserStatus.SUSPENDED)}
        isLoading={isProcessing}
      />

      {/* 7. RECONNECT MODAL */}
      <ConfirmDialog
        isOpen={isReconnectModal}
        onClose={() => setIsReconnectModal(false)}
        title="Reconnect User?"
        message={`This will reactivate internet service for ${selectedUser?.name}.`}
        confirmLabel="Reactivate"
        onConfirm={() => handleStatusShift(UserStatus.ACTIVE)}
        isLoading={isProcessing}
      />

      {/* 8. CUSTOMER 360 MODAL */}
      <Modal
        isOpen={isViewUserModal && !!selectedUser}
        onClose={() => setIsViewUserModal(false)}
        title={selectedUser?.name || ''}
        icon={<Fingerprint size={24} className="text-blue-400" />}
        message={`User ID: ${selectedUser?.connectionId}`}
        maxWidth="max-w-5xl"
        scrollable
        hideCloseButton={false}
        footer={
           <div className="flex items-center justify-between w-full">
               <button 
                  onClick={async () => {
                      if (!selectedUser) return;
                      const isVerified = !!selectedUser.verifiedStatus?.identity;
                      await db.bulkVerifyUsers([selectedUser.id], !isVerified);
                  }}
                  className="flex items-center gap-4 group cursor-pointer hover:bg-slate-800 p-2 rounded-2xl transition-all"
               >
                  <ShieldCheck size={24} className={selectedUser?.verifiedStatus?.identity ? "text-green-500" : "text-slate-500 group-hover:text-green-400"} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300">
                      {selectedUser?.verifiedStatus?.identity ? 'Profile Verified' : 'Submit KYC / Verify'}
                  </p>
               </button>
               <button onClick={() => setIsViewUserModal(false)} className="px-10 py-4 bg-slate-950 border border-slate-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:border-blue-600 transition-all shadow-xl">Close</button>
           </div>
        }
      >
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {/* Subscriber Identity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4 italic"><User size={14} className="text-blue-500"/> Contact Details</h4>
               <div className="space-y-4">
                  <div className="flex items-center gap-3"><Smartphone size={16} className="text-slate-300"/><span className="text-xs font-bold text-slate-800">{selectedUser?.phone}</span></div>
                  <div className="flex items-center gap-3"><Mail size={16} className="text-slate-300"/><span className="text-xs font-bold lowercase text-slate-800">{selectedUser?.email || 'No email'}</span></div>
                  <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-300"/><span className="text-xs font-bold uppercase text-slate-800">{selectedUser?.area} {selectedUser?.subarea ? `• ${selectedUser.subarea}` : ''}</span></div>
                  <div className="flex items-center gap-3"><CreditCard size={16} className="text-slate-300"/><span className="text-xs font-bold text-slate-800">{selectedUser?.cnic || 'Not provided'}</span></div>
                  {(() => {
                    const seller = state.staff.find(s => s.email === selectedUser?.dealerId || s.dealerCode === selectedUser?.dealerId);
                    return (
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mt-4">
                        <User size={16} className="text-indigo-400"/>
                        <div>
                          <p className="text-[8px] font-black text-indigo-400 uppercase">Assigned Seller</p>
                          <p className="text-[10px] font-black text-indigo-900 uppercase italic leading-none mt-1">{seller?.name || selectedUser?.dealerId || 'System Default'}</p>
                        </div>
                      </div>
                    );
                  })()}
               </div>
            </div>

            {/* Fiscal Record */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4 italic"><DollarSign size={14} className="text-green-500"/> Billing Summary</h4>
               <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Outstanding Balance</p>
                     <p className={`text-2xl font-black ${selectedUser && selectedUser.balance > 0 ? 'text-rose-600' : 'text-green-600'}`}>Rs. {(selectedUser?.balance || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Credit Score</p>
                     <p className="text-2xl font-black text-blue-600 italic tracking-tighter">{selectedUser?.creditScore}</p>
                  </div>
               </div>
            </div>

            {/* Network Link Layer */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4 italic"><Wifi size={14} className="text-blue-500"/> Link Layer</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedUser?.status === UserStatus.ACTIVE ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>{selectedUser?.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Path</span>
                     <span className="text-[10px] font-black text-slate-900 uppercase italic">{selectedUser?.connectionType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Expiry Date</span>
                     <span className="text-[10px] font-black text-slate-900 italic">{selectedUser?.expiryDate ? new Date(selectedUser.expiryDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* History Panels */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><FileText size={16} className="text-blue-500"/> Invoice History</h4>
               </div>
               <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                  {userInvoices.map(inv => (
                    <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                       <div><p className="font-black text-slate-900 uppercase text-xs">{inv.packageName}</p><p className="text-[8px] text-slate-400 font-bold">{new Date(inv.createdAt).toLocaleDateString()}</p></div>
                       <div className="text-right"><p className="text-xs font-black text-slate-900 italic">Rs. {inv.totalAmount}</p><span className={`text-[7px] font-black uppercase ${inv.status === 'Paid' ? 'text-green-600' : 'text-rose-600'}`}>{inv.status}</span></div>
                    </div>
                  ))}
                  {userInvoices.length === 0 && <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No documents found.</div>}
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Layers size={16} className="text-blue-500"/> Payment History</h4>
               </div>
               <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar flex-1">
                  {userLedger.map(l => (
                    <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                       <div className="flex items-center gap-3">
                          {l.type === LedgerType.DEBIT ? <ArrowUpRight size={14} className="text-rose-500"/> : <ArrowDownLeft size={14} className="text-green-500"/>}
                          <div><p className="font-black text-slate-900 uppercase text-[10px]">{l.description}</p><p className="text-[8px] text-slate-400 font-bold">{new Date(l.timestamp).toLocaleString()}</p></div>
                       </div>
                       <p className={`text-xs font-black italic ${l.type === LedgerType.DEBIT ? 'text-rose-600' : 'text-green-600'}`}>Rs. {l.amount}</p>
                    </div>
                  ))}
                  {userLedger.length === 0 && <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No ledger activity found.</div>}
               </div>
            </div>
         </div>
      </Modal>

      {/* BULK GRACE MODAL */}
      <Modal
        isOpen={isBulkGraceModal}
        onClose={() => setIsBulkGraceModal(false)}
        title="Grace Period"
        icon={<Clock size={22} className="text-blue-400" />}
        message="Extend User Expiry"
        maxWidth="max-w-lg"
        onConfirm={executeBulkGrace}
        confirmLabel="Apply Grace Period"
        isLoading={isProcessing}
      >
         <div className="space-y-8 mb-4">
            <div className="space-y-3 text-center mb-6">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Selected: {selectedIds.size} Users</p>
               <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed">Set "Pay Later" status and extend expiry to the specified date.</p>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">New Expiry Date</label>
               <input type="date" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-xl outline-none focus:border-blue-600 transition-all text-center text-slate-900" value={bulkGraceDate} onChange={e => setBulkGraceDate(e.target.value)} />
            </div>
         </div>
      </Modal>

      {/* BULK PACKAGE MODAL */}
      <Modal
        isOpen={isBulkPackageModal}
        onClose={() => setIsBulkPackageModal(false)}
        title="Bulk Plan Assignment"
        icon={<PackageIcon size={22} className="text-blue-400" />}
        message="Global Plan Assignment"
        maxWidth="max-w-lg"
        onConfirm={async () => {
             if(!selectedPkgId) return;
             setIsProcessing(true);
             await db.bulkActivateSubscribers(Array.from(selectedIds), { packageId: selectedPkgId, paymentStatus: 'Unpaid', expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(), notes: 'Bulk Plan Assignment' });
             setIsBulkPackageModal(false);
             setSelectedIds(new Set());
             setIsProcessing(false);
             setIsSuccessModal(true);
        }}
        confirmLabel="Assign Plan"
        isLoading={isProcessing || !selectedPkgId}
      >
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-4">
            {state.packages.filter(p => !p.deleted).map(pkg => (
               <button 
                 key={pkg.id} 
                 onClick={() => setSelectedPkgId(pkg.id)}
                 className={`p-6 rounded-[2rem] border-2 text-left transition-all ${selectedPkgId === pkg.id ? 'border-blue-600 bg-blue-50 shadow-md text-slate-900' : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-900'}`}
               >
                  <h4 className="font-black uppercase italic">{pkg.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{pkg.speed} • Rs. {pkg.price}</p>
               </button>
            ))}
         </div>
      </Modal>

      {/* BULK FLASH MODAL */}
      <Modal
        isOpen={isBulkFlashModal}
        onClose={() => setIsBulkFlashModal(false)}
        title="Security Override: Flash Reset"
        icon={<Flame size={22} className="text-rose-400" />}
        message="Bulk Fiscal Data Purge"
        maxWidth="max-w-2xl"
        onConfirm={async () => {
             if (flashConfirmText.toUpperCase() !== 'FLASH RESET') {
                 db.logNotification('all', 'error', 'Authorization Failed', 'Incorrect confirmation text entered.');
                 return;
             }
             setIsProcessing(true);
             const res = await db.bulkFlashUsers(Array.from(selectedIds), flashMonths, state.currentUser?.email || 'admin@clickoptix.com');
             if (res.success) {
                 db.logNotification('all', 'success', 'Flash Authorized', `Successfully purged data for ${res.count} users.`);
                 setIsBulkFlashModal(false);
                 setSelectedIds(new Set());
                 setFlashConfirmText('');
                 setIsSuccessModal(true);
             }
             setIsProcessing(false);
        }}
        confirmLabel={flashMonths === -1 ? 'INITIALIZE HARD FULL WIPE' : 'EXECUTE SELECTIVE FLASH'}
        type="danger"
        confirmDanger
        isLoading={isProcessing || flashConfirmText.toUpperCase() !== 'FLASH RESET'}
      >
         <div className="space-y-8 mb-4">
            <div className="bg-rose-50/5 border border-rose-500/20 p-6 rounded-[2rem] space-y-2 text-center">
               <AlertTriangle className="text-rose-600 mx-auto mb-2" size={32} />
               <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">CRITICAL WARNING: DESTRUCTIVE ACTION</p>
               <p className="text-[10px] font-bold text-rose-400 uppercase leading-relaxed max-w-sm mx-auto">This will clear specific months of dues or perform a FULL WIPE for {selectedIds.size} users. This action CANNOT be undone.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Flash Scale (Months)</label>
                  <select 
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-sm outline-none focus:border-rose-500 transition-all text-center appearance-none text-slate-900" 
                    value={flashMonths} 
                    onChange={e => setFlashMonths(Number(e.target.value))}
                  >
                     <option value={1}>1 MONTH (Standard)</option>
                     <option value={2}>2 MONTHS</option>
                     <option value={3}>3 MONTHS</option>
                     <option value={6}>6 MONTHS (Deep Purge)</option>
                     <option value={12}>1 YEAR (Fiscal Flush)</option>
                     <option value={-1}>N/A: HARD FULL WIPE</option>
                  </select>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Type "FLASH RESET" to Authorize</label>
                  <input 
                     type="text" 
                     placeholder="Type code here..."
                     className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-lg outline-none focus:border-rose-500 transition-all text-center uppercase text-slate-900" 
                     value={flashConfirmText} 
                     onChange={e => setFlashConfirmText(e.target.value)} 
                  />
               </div>
            </div>
         </div>
      </Modal>

      {/* BULK DISCOUNT MODAL */}
      <Modal
        isOpen={isApplyDiscountModal}
        onClose={() => setIsApplyDiscountModal(false)}
        title="Bulk Discount"
        icon={<Zap size={22} className="text-green-400" />}
        message="Apply discount to users"
        maxWidth="max-w-md"
        onConfirm={async () => {
          setIsProcessing(true);
          await db.bulkBalanceUpdate(Array.from(selectedIds), parseFloat(bulkDiscountAmount), false);
          db.logNotification('all', 'success', 'Bulk Action', `Applied Rs.${bulkDiscountAmount} discount to ${selectedIds.size} users.`);
          setIsProcessing(false);
          setIsApplyDiscountModal(false);
          setSelectedIds(new Set());
          setIsSuccessModal(true);
        }}
        confirmLabel={`Apply Discount to ${selectedIds.size} Users`}
        isLoading={isProcessing || !bulkDiscountAmount}
      >
         <div className="space-y-2 mb-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount Amount (Rs.)</label>
            <input type="number" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl outline-none focus:border-green-500 transition-all text-center text-slate-900" value={bulkDiscountAmount} onChange={e => setBulkDiscountAmount(e.target.value)} />
         </div>
      </Modal>

      {/* BULK TAG MODAL */}
      <Modal
        isOpen={isBulkTagModal}
        onClose={() => setIsBulkTagModal(false)}
        title="Batch Tagging"
        icon={<ShieldCheck size={22} className="text-blue-400" />}
        message="Add custom tag"
        maxWidth="max-w-md"
        onConfirm={async () => {
          setIsProcessing(true);
          await db.bulkAddTag(Array.from(selectedIds), bulkTagInput);
          db.logNotification('all', 'success', 'Bulk Action', `Added tag ${bulkTagInput} to ${selectedIds.size} users.`);
          setIsProcessing(false);
          setIsBulkTagModal(false);
          setSelectedIds(new Set());
          setIsSuccessModal(true);
        }}
        confirmLabel={`Apply Tag to ${selectedIds.size} Users`}
        isLoading={isProcessing || !bulkTagInput}
      >
         <div className="space-y-2 mb-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tag Identifier (e.g. VIP)</label>
            <input type="text" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl outline-none focus:border-blue-500 transition-all text-center uppercase text-slate-900" value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)} placeholder="Tag Name..." />
         </div>
      </Modal>

      {/* IMPORT USERS MODAL */}
      <Modal
        isOpen={isImportUsersModal}
        onClose={() => setIsImportUsersModal(false)}
        title="Smart Import Engine"
        icon={<FileInput size={22} className="text-blue-400" />}
        message="Bulk CSV Ingestion"
        maxWidth="max-w-2xl"
        scrollable
        onConfirm={async () => {
          setIsProcessing(true);
          const lines = importCsvInput.split('\n').filter(l => l.trim());
          let successCount = 0;
          let conflictCount = 0;
          let errors = [];

          for(const line of lines) {
              const parts = line.split(',').map(p => p.trim());
              if (parts.length >= 2) {
                  const res = await db.addUser({
                      name: parts[0],
                      phone: parts[1],
                      packageId: parts[2] || '',
                      connectionId: parts[3] || `TMP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                      status: UserStatus.PENDING_VERIFICATION,
                      username: parts[4] || parts[0].toLowerCase().replace(/\s/g, '') + Math.floor(100 + Math.random() * 900)
                  } as any);
                  
                  if (res.success) successCount++;
                  else {
                    conflictCount++;
                    errors.push(`${parts[0]}: ${res.message}`);
                  }
              }
          }
          
          if (conflictCount > 0) {
            alert(`Import partially successful.\n\nSuccess: ${successCount}\nConflicts: ${conflictCount}\n\nFirst few errors:\n${errors.slice(0, 3).join('\n')}`);
          } else {
            db.logNotification('all', 'success', 'Import Complete', `Successfully imported ${successCount} users into the registry.`);
          }
          
          setIsProcessing(false);
          setIsImportUsersModal(false);
          setImportCsvInput('');
          setIsSuccessModal(true);
        }}
        confirmLabel="Initialize Bulk Ingestion"
        isLoading={isProcessing || !importCsvInput}
      >
         <div className="space-y-8 mb-4">
            <div className="bg-blue-50/5 border border-blue-500/20 p-6 rounded-2xl">
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Info size={14}/> CSV Format Guideline</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">Format: <code className="bg-slate-800 px-2 py-0.5 rounded text-blue-400 border border-slate-700">Name, Phone, Package_ID, Connection_ID, Username</code></p>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paste CSV Data or List</label>
               <textarea 
                 className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-mono text-sm outline-none focus:border-blue-600 transition-all custom-scrollbar resize-none text-slate-900" 
                 placeholder="John Doe, 03001234567, fiber-basic, CO-8822, jdoe123..."
                 value={importCsvInput}
                 onChange={e => setImportCsvInput(e.target.value)}
               />
            </div>
         </div>
      </Modal>

      {/* MANUAL UNPAID & ACTIVATION MODAL */}
      <Modal
        isOpen={isManualUnpaidModal && !!selectedUser}
        onClose={() => setIsManualUnpaidModal(false)}
        title="Custom Activation"
        icon={<Wallet size={22} className="text-pink-500" />}
        message={`Set unpaid amount and expiry for ${selectedUser?.name}`}
        maxWidth="max-w-2xl"
        scrollable
        onConfirm={handleExecuteManualUnpaid}
        confirmLabel="Confirm Custom Activation"
        isLoading={isProcessing || !selectedPkgId}
      >
         <div className="space-y-6 mb-6">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><PackageIcon size={12}/> 1. Select Activated Package</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {state.packages.filter(p => !p.deleted).map(pkg => (
                    <button 
                      key={pkg.id} 
                      onClick={() => {
                        setSelectedPkgId(pkg.id);
                        if (manualUnpaidAmount === 0) setManualUnpaidAmount(pkg.price);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedPkgId === pkg.id ? 'border-pink-600 bg-pink-50 shadow-md text-slate-900' : 'border-slate-100 bg-slate-50 hover:border-slate-300 text-slate-900'}`}
                    >
                       <p className="text-[11px] font-black uppercase">{pkg.name}</p>
                       <p className="text-[9px] font-bold text-slate-400">Rs. {pkg.price}</p>
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar size={12}/> 2. Set Expiry Date</label>
                  <input 
                    type="date" 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-pink-500 text-slate-900 transition-all" 
                    value={manualExpiryDate} 
                    onChange={e => setManualExpiryDate(e.target.value)} 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Wallet size={12}/> 3. Unpaid Amount (Rs.)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl outline-none focus:border-pink-500 text-slate-900 transition-all" 
                    value={manualUnpaidAmount} 
                    onChange={e => setManualUnpaidAmount(Number(e.target.value))} 
                    placeholder="e.g. 500"
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                    Amount left unpaid by the customer.
                  </p>
               </div>
            </div>
         </div>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal
        isOpen={isSuccessModal}
        onClose={() => setIsSuccessModal(false)}
        title="Operation Successful"
        icon={<CheckCircle size={22} className="text-emerald-500" />}
      >
         <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={40} />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Handshake Confirmed</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Registry updated and synchronized with live edge nodes</p>
            </div>
            <button onClick={() => setIsSuccessModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Acknowledge</button>
         </div>
      </Modal>
    </div>
  );
};


export default UserManagement;
