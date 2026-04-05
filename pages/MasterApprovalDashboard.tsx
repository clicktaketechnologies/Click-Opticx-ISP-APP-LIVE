import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo, useTransition } from 'react';
import { AppState, Role, UserStatus, PackageRequest, TopupRequest, EmergencyLoad, PaymentStatus, Package, VerificationStatus } from '../types';
import { db } from '../db';
import {
  CheckCircle, XCircle, Clock, Zap, User,
  ShieldCheck, ChevronRight, Activity,
  HardDrive, AlertTriangle, Layers, Banknote, Globe, Landmark,
  ShieldAlert, RefreshCw, Search, Filter, Hash, Eye, Info,
  Wallet, Smartphone, AlertCircle, FileText, UserCircle, X, Database, MapPin, Fingerprint, Package as PackageIcon
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

// Safe Icon Wrapper to prevent #306 "Element type is invalid" if an icon is undefined or not a component
const SafeIcon: React.FC<{ icon: any; size?: number; className?: string; strokeWidth?: number }> = ({ icon: Icon, size = 18, className = '', strokeWidth }) => {
  if (!Icon) return <div style={{ width: size, height: size }} className={`bg-slate-200/50 rounded-full ${className}`} />;

  // Robust check for Icon being a valid React component type (function or string)
  const isValidType = typeof Icon === 'function' || typeof Icon === 'string' || (typeof Icon === 'object' && Icon !== null && '$$typeof' in Icon);
  if (!isValidType) {
    console.warn('[306 PROTECT] Invalid icon type passed to SafeIcon:', typeof Icon);
    return <div style={{ width: size, height: size }} className={`bg-slate-200/50 rounded-full ${className}`} />;
  }

  return <Icon size={size} className={className} strokeWidth={strokeWidth} />;
};

interface Props {
  state: AppState;
  defaultTab?: 'all' | 'package' | 'topup' | 'emergency' | 'signup' | 'active-users' | 'kyc' | 'duplicates' | 'audit' | 'login';
}

export const MasterApprovalDashboard: React.FC<Props> = ({ state, defaultTab = 'all' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = React.useDeferredValue(searchTerm);
  const [selectedRequestId, setSelectedRequestId] = useState<{ id: string, type: any } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const isPending = false; // Transition bypass

  const currentUserRole = state.currentUser?.role || Role.VIEWER;
  const canApprove = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER].includes(currentUserRole as Role);

  // Unified Request Mapper - Optimized for Tab-Specific Loading
  const unifiedRequests = useMemo(() => {
    // Only map the relevant slices of state based on activeTab to avoid O(N) overhead on every render
    let pkgs: any[] = [];
    let topups: any[] = [];
    let emer: any[] = [];
    let signups: any[] = [];
    let kycRequests: any[] = [];
    let allUsers: any[] = [];

    if (activeTab === 'all' || activeTab === 'package') {
      pkgs = (state.packageRequests || []).map(r => ({ ...r, unifiedType: 'package' as const }));
    }
    
    if (activeTab === 'all' || activeTab === 'topup') {
      topups = (state.topupRequests || []).map(r => ({ ...r, unifiedType: 'topup' as const }));
    }

    if (activeTab === 'all' || activeTab === 'emergency') {
      emer = (state.emergencyLoads || []).map(l => ({
        ...l,
        unifiedType: 'emergency' as const,
        packageName: l.packageId ? (state.packages.find(p => p.id === l.packageId)?.name || 'Rescue') : 'Rescue Credit',
        paymentMethod: 'Auto-Advance',
        status: l.status === 'Pending_Activation' ? 'Pending' : (l.status === 'Active' || l.status === 'Paid' ? 'Approved' : 'Rejected')
      }));
    }

    if (activeTab === 'all' || activeTab === 'signup' || activeTab === 'duplicates') {
      signups = (state.signupRequests || []).map(r => ({
        ...r,
        unifiedType: 'signup' as const,
        paymentMethod: 'N/A',
        amount: 0,
        userId: r.userId || 'REQ',
        userName: r.name,
        packageName: r.status === 'Duplicate' ? 'Identity Conflict' : 'New Account Request',
        kycDocuments: state.users.find(u => u.id === r.userId)?.kycDocuments || []
      }));
    }

    if (activeTab === 'all' || activeTab === 'kyc') {
      kycRequests = state.users
        .filter(u => u.isKYCSubmitted && !u.isKYCVerified)
        .map(u => ({
          id: u.id,
          userId: u.id,
          userName: u.name,
          amount: 0,
          status: (u.verificationStatus === VerificationStatus.PENDING ? 'Pending' : 'Approved') as any,
          unifiedType: 'kyc' as const,
          paymentMethod: 'Identity Artifacts',
          packageName: 'KYC Verification',
          timestamp: u.kycSubmissionDate || u.createdAt || new Date().toISOString(),
          kycMethod: u.kycMethod,
          kycDocuments: u.kycDocuments
        }));
    }

    if (activeTab === 'all' || activeTab === 'active-users') {
      // Limit list to prevent DOM bloat during large re-renders
      allUsers = state.users.slice(0, 1000).map(u => ({
        id: u.id,
        userId: u.id,
        userName: u.name,
        amount: 0,
        status: u.status as any,
        unifiedType: 'active-users' as const,
        paymentMethod: u.managementMode || 'Manual',
        packageName: state.packages.find(p => p.id === u.packageId)?.name || 'Subscriber',
        timestamp: u.createdAt || new Date().toISOString(),
        userStatus: u.status
      }));
    }

    return [...pkgs, ...topups, ...emer, ...signups, ...kycRequests, ...allUsers].sort((a, b) => {
      const timeA = a.timestamp || '';
      const timeB = b.timestamp || '';
      return timeB.localeCompare(timeA);
    });
  }, [state.packageRequests, state.topupRequests, state.emergencyLoads, state.signupRequests, state.packages, state.users, activeTab]);

  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter(r => {
      // Tab Filter
      const matchesTab = activeTab === 'all' || r.unifiedType === activeTab || (activeTab === 'duplicates' && r.status === 'Duplicate');

      // Status Filter
      let matchesStatus = true;
      if (activeTab === 'active-users') {
        if (statusFilter === 'Pending') matchesStatus = r.status === 'Active'; // Show active by default in this tab
        else if (statusFilter === 'Rejected') matchesStatus = r.status === 'Blocked'; // Map Rejected filter to Blocked for users
        else matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      } else if (statusFilter !== 'All') {
        if (statusFilter === 'Pending') matchesStatus = r.status === 'Pending' || r.status === 'Duplicate';
        else matchesStatus = r.status === statusFilter;
      }

      // Search Filter - uses deferredSearch for performance
      const term = deferredSearch.toLowerCase();
      const matchesSearch = (r.userName || '').toLowerCase().includes(term) ||
        (r.userId || '').toLowerCase().includes(term) ||
        (r as any).email?.toLowerCase().includes(term) ||
        (r as any).username?.toLowerCase().includes(term) ||
        (r as any).pppoeId?.toLowerCase().includes(term) ||
        (r as any).packageName?.toLowerCase().includes(term);

      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [unifiedRequests, activeTab, statusFilter, deferredSearch]);

  const selectedRequestData = useMemo(() => {
    if (!selectedRequestId) return null;
    return unifiedRequests.find(r => r.id === selectedRequestId.id && r.unifiedType === selectedRequestId.type);
  }, [selectedRequestId, unifiedRequests]);

  const handleApprove = async () => {
    if (!selectedRequestId) return;
    setIsProcessing(true);
    const res = await db.approveUnifiedRequest(selectedRequestId.id, selectedRequestId.type);
    setIsProcessing(false);
    if (res.success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedRequestId(null);
      }, 1500);
    } else {
      alert((res as any).message || 'Handshake Protocol Failure: Request could not be authorized.');
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId || !rejectionReason) return;
    setIsProcessing(true);
    const res = await db.rejectUnifiedRequest(selectedRequestId.id, selectedRequestId.type, rejectionReason);
    setIsProcessing(false);

    if (res.success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedRequestId(null);
        setRejectionReason('');
      }, 1500);
    } else {
      alert((res as any).message || 'Rejection Fault: System failed to commit rejection.');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'package': return <SafeIcon icon={FileText} className="text-blue-500" size={18} />;
      case 'topup': return <SafeIcon icon={Wallet} className="text-green-500" size={18} />;
      case 'emergency': return <SafeIcon icon={Zap} className="text-orange-500" size={18} />;
      case 'signup': return <SafeIcon icon={User} className="text-slate-400" size={18} />;
      case 'active-users': return <SafeIcon icon={UserCircle} className="text-blue-500" size={18} />;
      case 'kyc': return <SafeIcon icon={ShieldCheck} className="text-blue-600" size={18} />;
      default: return <SafeIcon icon={FileText} className="text-slate-400" size={18} />;
    }
  };

  const tabs: { id: Props['defaultTab'], label: string }[] = [
    { id: 'all', label: 'Overview' },
    { id: 'package', label: 'Package Req' },
    { id: 'topup', label: 'Refills' },
    { id: 'signup', label: 'Signups' },
    { id: 'active-users', label: 'Active Users (Auto)' },
    { id: 'kyc', label: 'KYC Checks' },
    { id: 'duplicates', label: 'Conflicts' },
    { id: 'login', label: 'Auth Logs' },
    { id: 'audit', label: 'Full Audit' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <SafeIcon icon={ShieldCheck} className="text-green-600" size={32} />
            Approval Center
          </h2>
          <p className="text-slate-500 font-medium text-[10px] tracking-widest uppercase">Review and approve user requests for packages, top-ups, and more.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[2.5rem] border border-slate-200 overflow-x-auto custom-scrollbar no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3.5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
        <div className="flex bg-white p-1.5 rounded-3xl border border-slate-100 shadow-sm">
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f as any)}
              className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {activeTab === 'active-users' ? (f === 'Pending' ? 'Active' : (f === 'Rejected' ? 'Blocked' : f)) : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <SafeIcon icon={Search} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
            placeholder="Search for a user or request..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request & Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all shadow-sm">
                        <SafeIcon icon={UserCircle} size={24} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase text-sm leading-none mb-1">{req.userName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        {getIcon(req.unifiedType)}
                        <span className="text-xs font-black uppercase text-slate-700 italic">
                          {(req as any).packageName || req.unifiedType}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${req.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' :
                          req.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            req.status === 'Duplicate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          {req.status}
                        </span>
                        {(req.unifiedType === 'signup' || req.unifiedType === 'kyc') && (
                          <>
                            {(req as any).kyc_status && (
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${(req as any).kyc_status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                KYC: {(req as any).kyc_status}
                              </span>
                            )}
                            {(req as any).approval_status && (
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${(req as any).approval_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                Auth: {(req as any).approval_status}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{req.paymentMethod}</span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">
                    {state.settings.currency} {req.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase">
                    {req.timestamp ? new Date(req.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => setSelectedRequestId({ id: req.id, type: req.unifiedType })}
                      className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all active:scale-90"
                    >
                      {isPending && selectedRequestId?.id === req.id ? <Mini5GMicroLoader size={18} /> : <SafeIcon icon={Eye} size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="p-32 text-center flex flex-col items-center">
              <SafeIcon icon={ShieldCheck} className="text-slate-100 mb-6" size={80} />
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">No Pending Requests</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Great! There are no requests waiting for your approval.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedRequestId && !!selectedRequestData}
        onClose={() => setSelectedRequestId(null)}
        title="Review Request"
        type="info"
        maxWidth="max-w-2xl"
        scrollable
        hideCloseButton={false}
        footer={
          <div className="flex gap-3 w-full">
            {selectedRequestData?.unifiedType === 'active-users' ? (
              <>
                {selectedRequestData?.status === UserStatus.BLOCKED ? (
                  <button onClick={async () => {
                    setIsProcessing(true);
                    const res = await db.unblockUser(selectedRequestData.id);
                    setIsProcessing(false);
                    if (res.success) {
                      setSelectedRequestId(null);
                    } else {
                      alert(res.message || 'Restoration Fault: Access could not be restored.');
                    }
                  }}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <SafeIcon icon={CheckCircle} size={16} /> Restore Full Access
                  </button>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input
                          value={blockReason}
                          onChange={e => setBlockReason(e.target.value)}
                          placeholder="Enter block reason..."
                          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <button
                          onClick={async () => {
                            if (!blockReason) return;
                            setIsProcessing(true);
                            const res = await db.blockUser(selectedRequestData.id, blockReason);
                            setIsProcessing(false);
                            if (res.success) {
                              setSelectedRequestId(null);
                              setBlockReason('');
                            } else {
                              alert(res.message || 'Block Fault: Failed to restrict access.');
                            }
                          }}
                          disabled={!blockReason || isProcessing}
                          className="px-5 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-40 flex items-center gap-2"
                        >
                          {isProcessing ? <Mini5GMicroLoader size={14} /> : <SafeIcon icon={ShieldAlert} size={14} />}
                          Block
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    className="w-full h-20 bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-500/10"
                    placeholder="Denial context (Required for rejection)..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={!rejectionReason || isProcessing}
                      className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <SafeIcon icon={XCircle} size={16} /> Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Mini5GMicroLoader size={16} /> : <SafeIcon icon={ShieldCheck} size={16} />}
                      Approve & Activate
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        }
      >
        {showSuccess ? (
          <div className="py-20 text-center animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-500/20">
                <SafeIcon icon={CheckCircle} size={56} strokeWidth={3}/>
             </div>
             <h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-3">Protocol Executed</h4>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto">
               Registry status has been synchronized. System link is now active.
             </p>
          </div>
        ) : selectedRequestData && (
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">User Identity</h4>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm"><SafeIcon icon={User} size={28} className="text-slate-400" /></div>
                  <div>
                    <p className="font-black text-slate-900 uppercase text-lg leading-none">{selectedRequestData.userName}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase mt-1 tracking-widest">{selectedRequestData.userId}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Fiscal Record</h4>
                <div>
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{state.settings.currency} {selectedRequestData.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Instrument: {selectedRequestData.paymentMethod}</p>
                </div>
              </div>
            </div>

            {selectedRequestData.unifiedType === 'signup' && (
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-slate-400"><SafeIcon icon={Fingerprint} size={20} /></div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Identity Artifact (CNIC)</p>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{(selectedRequestData as any).cnic || 'Not Provided'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-slate-400"><SafeIcon icon={MapPin} size={20} /></div>
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Operational Node (Location)</p>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{(selectedRequestData as any).area || 'Central'}, {(selectedRequestData as any).address || 'Registry Address'}</p>
                       </div>
                    </div>
                 </div>
                 <div className="p-4 bg-white/50 border border-slate-200 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <SafeIcon icon={PackageIcon} size={16} className="text-blue-600" />
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Service Provisioning:</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 uppercase italic tracking-widest bg-blue-50 px-3 py-1 rounded-lg">
                      {state.packages.find(p => p.id === (selectedRequestData as any).packageId)?.name || 'Basic Link'}
                    </span>
                 </div>
              </div>
            )}

            {(selectedRequestData.unifiedType === 'kyc' || selectedRequestData.unifiedType === 'signup') && (selectedRequestData as any).kycDocuments?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest border-b border-blue-900/50 pb-2 flex items-center gap-2">
                  <SafeIcon icon={ShieldCheck} size={12} /> Identity Artifacts ({(selectedRequestData as any).kycMethod || 'Manual'})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {((selectedRequestData as any).kycDocuments || []).map((doc: any, i: number) => (
                    <div key={i} className="group relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 aspect-video">
                      <img src={doc.fileUrl || doc.documentUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="KYC" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                        <p className="text-[10px] font-black text-white uppercase">{doc.type || doc.documentType || 'Identity'}</p>
                      </div>
                      <button onClick={() => window.open(doc.fileUrl || doc.documentUrl, '_blank')} className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <SafeIcon icon={Eye} size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRequestData.status === 'Duplicate' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2"><SafeIcon icon={ShieldAlert} size={14} /> Identity Conflict Detected</h4>
                <p className="text-xs font-bold text-rose-500">{(selectedRequestData as any).duplicateReason || 'A subscriber with these details already exists.'}</p>
              </div>
            )}

            <div className="p-4 bg-blue-50/50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><SafeIcon icon={Activity} size={12} className="text-blue-500" /> System Check</h4>
              <div className="flex items-center justify-between py-2 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Existing Package Check</span>
                {(() => {
                  const user = state.users.find(u => u.id === selectedRequestData.userId); const exp = user?.expiryDate ? new Date(user.expiryDate) < new Date() : true;
                  return exp ? <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1"><SafeIcon icon={CheckCircle} size={11} /> No Active Package</span>
                    : <span className="text-[9px] font-black text-rose-600 uppercase flex items-center gap-1"><SafeIcon icon={AlertCircle} size={11} /> Has Active Package</span>;
                })()}
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Credit Score</span>
                {(() => {
                  const score = state.users.find(u => u.id === selectedRequestData.userId)?.creditScore || 0;
                  return score >= 600 ? <span className="text-[9px] font-black text-emerald-600 uppercase">Good ({score})</span>
                    : <span className="text-[9px] font-black text-orange-500 uppercase">Low ({score})</span>;
                })()}
              </div>
            </div>

            {selectedRequestData.unifiedType !== 'active-users' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejection Reason (Required for Denials)</label>
                <textarea className="w-full h-24 resize-none" placeholder="Explain why this request is being rejected..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
              </div>
            )}
          </div>
        )}
      </Modal>

      {activeTab === 'login' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-100 shadow-inner">
                  <SafeIcon icon={ShieldAlert} size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Authentication Monitor</h3>
                  <p className="text-blue-600/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">Real-time terminal access auditing</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Attempts</p>
                  <p className="text-xl font-black text-slate-800 italic">{(state.auditLogs || []).filter(l => l.type === 'Login').length}</p>
                </div>
                <div className="px-6 py-3 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[8px] font-black text-rose-500 uppercase mb-1">Failed</p>
                  <p className="text-xl font-black text-rose-600 italic">{(state.auditLogs || []).filter(l => l.type === 'Login' && (l.action.includes('Failed') || l.action.includes('Invalid'))).length}</p>
                </div>
              </div>
            </div>
            <SafeIcon icon={Activity} className="absolute -right-20 -bottom-20 text-white/5 scale-150 pointer-events-none" size={300} />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Access Registry (Newest First)</h4>
              <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase">
                <SafeIcon icon={RefreshCw} size={12} className={isPending ? 'animate-spin' : ''} /> Live Stream
              </div>
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[600px] custom-scrollbar">
              {(state.auditLogs || [])
                .filter(log => log.type === 'Login')
                .map(log => (
                  <div key={log.id} className={`p-6 hover:bg-slate-50 transition-all flex items-center justify-between group ${log.action.includes('Failed') || log.action.includes('Invalid') ? 'bg-rose-50/30' : ''}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${log.action.includes('Failed') || log.action.includes('Invalid') ? 'bg-rose-50 text-rose-500 border-rose-100' :
                        log.action.includes('Suspended') ? 'bg-amber-50 text-amber-500 border-amber-100' :
                          'bg-green-50 text-green-500 border-green-100'
                        }`}>
                        <SafeIcon icon={log.action.includes('Failed') || log.action.includes('Invalid') ? XCircle : ShieldCheck} size={22} strokeWidth={3} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-slate-900 uppercase italic leading-none">{log.action}</p>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed">{log.details}</p>
                        {log.userName && <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Identity: {log.userName}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(log.timestamp).toLocaleDateString()}</p>
                      <div className={`inline-flex px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${log.action.includes('Failed') || log.action.includes('Invalid') ? 'bg-rose-600 text-white border-rose-700 shadow-md' : 'bg-slate-100 text-slate-900 border-slate-200'
                        }`}>
                        {log.action.includes('Failed') ? 'Access Denied' : 'Session OK'}
                      </div>
                    </div>
                  </div>
                ))}
              {(state.auditLogs || []).filter(log => log.type === 'Login').length === 0 && (
                <div className="p-32 text-center flex flex-col items-center">
                  <SafeIcon icon={Database} className="text-slate-100 mb-6" size={80} />
                  <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest italic">Registry Void</h3>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-2">No authentication handshakes captured in this cycle.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"><SafeIcon icon={Activity} size={24} /></div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">System-Wide Audit Trail</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Historical record of all approval & signup handshakes</p>
                </div>
              </div>
              <button onClick={() => window.print()} className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200"><SafeIcon icon={Hash} size={20} /></button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
              {(state.auditLogs || []).length > 0 ? (
                [...(state.auditLogs || [])].reverse().map(log => (
                  <div key={log.id} className="flex gap-6 items-start bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all shadow-sm group">
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <div className={`p-4 rounded-2xl ${log.type === 'Approval' ? 'bg-green-50 text-green-600' :
                        log.type === 'Rejection' ? 'bg-rose-50 text-rose-600' :
                          log.type === 'System' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                        <SafeIcon icon={log.type === 'Approval' ? CheckCircle : (log.type === 'Rejection' ? XCircle : (log.type === 'System' ? ShieldCheck : Info))} size={24} />
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase italic whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">{log.action}</h4>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{log.details}</p>
                      {(log.userName || log.adminName) && (
                        <div className="flex gap-4 pt-2">
                          {log.userName && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-widest italic">User: {log.userName}</span>}
                          {log.adminName && <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-widest italic">Actor: {log.adminName}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                  <SafeIcon icon={Database} size={48} className="text-slate-100 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">No Audit Fragments Detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default MasterApprovalDashboard;
