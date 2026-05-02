import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { 
  ShieldCheck, Search, Filter, Eye, CheckCircle, XCircle, 
  Cloud, HardDrive, RefreshCcw, ExternalLink, User, Calendar, 
  ChevronRight, AlertCircle, Trash2, Database, FolderSync, Lock, BarChart3,
  FileCheck, Clock, ShieldAlert, UserCheck, BadgeCheck, Code, Activity, Terminal, UserCircle
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';
import { VerificationStatus, ISPUser, KYCDocument, AppState } from '../types';

interface KYCProps {
  state?: AppState;
}

const KYCManagement: React.FC<KYCProps> = ({ state: propState }) => {
  const [internalState, setInternalState] = useState(db.getState());
  const state = propState || internalState;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'verified' | 'rejected' | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<ISPUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revisionDocsCount, setRevisionDocsCount] = useState<number>(state.settings.requiredKycDocs || 10);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [cloudLogs, setCloudLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = db.onStateChange((newState: any) => {
      setInternalState(newState);
      if (selectedUser) {
        const updatedUser = newState.users.find((u: ISPUser) => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
      setCloudLogs(db.getCloudLogs());
    });
    return () => unsubscribe();
  }, [selectedUser?.id]);

  const pendingUsers = state.users.filter(u => u.isKYCSubmitted && u.kyc_status === 'pending');
  const verifiedUsers = state.users.filter(u => u.kyc_status === 'verified');
  const rejectedUsers = state.users.filter(u => u.kyc_status === 'rejected');
  const totalUsers = state.users.length;

  const filteredUsers = useMemo(() => {
    return state.users.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'pending') return matchesSearch && u.isKYCSubmitted && u.kyc_status === 'pending';
      return matchesSearch && u.kyc_status === filterStatus;
    }).sort((a, b) => {
      // Sort pending to top
      if (a.kyc_status === 'pending' && b.kyc_status !== 'pending') return -1;
      if (a.kyc_status !== 'pending' && b.kyc_status === 'pending') return 1;
      return 0;
    });
  }, [state.users, searchQuery, filterStatus]);

  const handleApprove = async (userId: string) => {
    setActionLoading('approve');
    const res = await db.approveUnifiedRequest(userId, 'kyc');
    setActionLoading(null);
    if (res.success) {
      setActionSuccess('Identity verified successfully!');
      setTimeout(() => {
        setActionSuccess(null);
        setSelectedUser(null);
      }, 1800);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason) return;
    setActionLoading('reject');
    const res = await db.rejectUnifiedRequest(selectedUser.id, 'kyc', rejectionReason, { revisionDocsCount });
    setActionLoading(null);
    if (res.success) {
      setActionSuccess('Identity flagged for revision.');
      setTimeout(() => {
        setActionSuccess(null);
        setShowRejectModal(false);
        setSelectedUser(null);
        setRejectionReason('');
      }, 1500);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    await db.syncArtifacts('GLOBAL_REGISTRY', [], (log) => {
        setCloudLogs(prev => [log, ...prev].slice(0, 50));
    });
    await db.forceSync();
    setIsSyncing(false);
  };

  const REQUIRED_DOCS = state.settings.requiredKycDocs || 10;

  return (
    <div className="min-h-screen overflow-y-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none flex items-center gap-4">
             <ShieldCheck className="text-indigo-600" size={32} />
             Compliance Hub
          </h2>
          <div className="flex items-center gap-3 mt-3">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic leading-none">
                Unified Identity Lifecycle & Document Vault
             </p>
          </div>
        </div>
        <button 
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold transition-all"
        >
          <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Multi-Cloud Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Stats Console */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
            <div>
               <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 italic">
                 <BarChart3 size={18} className="text-indigo-500" />
                 Registry Pulse
               </h3>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Total Base', count: totalUsers, icon: User, grad: 'var(--grad-primary)', status: 'all', sub: 'Cumulative' },
                { label: 'Awaiting Review', count: pendingUsers.length, icon: Clock, grad: 'var(--grad-warning)', status: 'pending', sub: 'Critical Sector' },
                { label: 'Verified Global', count: verifiedUsers.length, icon: UserCheck, grad: 'var(--grad-success)', status: 'verified', sub: 'Authorized' },
                { label: 'Revision Requests', count: rejectedUsers.length, icon: ShieldAlert, grad: 'var(--grad-error)', status: 'rejected', sub: 'Audit Flagged' }
              ].map(item => (
                <button 
                  key={item.label}
                  onClick={() => setFilterStatus(item.status as any)}
                  className={`w-full group relative overflow-hidden p-6 rounded-[2rem] transition-all border-none text-left ${
                    filterStatus === item.status 
                      ? 'shadow-2xl scale-105 z-10' 
                      : 'bg-slate-50 opacity-60 hover:opacity-100 hover:scale-[1.02]'
                  }`}
                  style={{ backgroundImage: filterStatus === item.status ? item.grad : undefined }}
                >
                  {filterStatus === item.status && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-2xl -mr-8 -mt-8 rounded-full" />
                  )}
                  <div className="relative z-10 flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${filterStatus === item.status ? 'text-white' : 'text-slate-500'}`}>{item.label}</span>
                        <div className={`p-2 rounded-xl ${filterStatus === item.status ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-slate-100 text-slate-400'}`}>
                           <item.icon size={16} strokeWidth={2.5} />
                        </div>
                     </div>
                     <h4 className={`text-[clamp(1.25rem,3vw,1.75rem)] font-black italic tracking-tighter leading-none ${filterStatus === item.status ? 'text-white' : 'text-slate-900'}`}>{item.count}</h4>
                     <p className={`text-[8px] font-bold uppercase tracking-widest ${filterStatus === item.status ? 'text-white/60' : 'text-slate-400'}`}>{item.sub}</p>
                   </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
              <Terminal size={160} className="text-indigo-400" />
            </div>
            <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
              <Code size={18} /> Activity Logs
            </h3>
            
            <div className="space-y-4 h-[300px] overflow-y-auto custom-scrollbar pr-2 font-mono">
               {cloudLogs.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <Activity size={40} className="text-slate-600 mb-4 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-relaxed">System Idle.<br/>Awaiting Handshake...</p>
                 </div>
               ) : (
                 cloudLogs.map((log, i) => (
                   <div key={i} className={`p-4 rounded-[1.5rem] border-none flex flex-col gap-2 transition-all ${
                     log.status === 'Success' ? 'bg-emerald-500/10' : 
                     log.status === 'Streaming' ? 'bg-indigo-500/10' : 
                     'bg-white/5'
                   }`}>
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black uppercase text-indigo-400">{log.provider}</span>
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${
                           log.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400 animate-pulse'
                         }`}>{log.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight font-black">{log.details}</p>
                      <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* User Registry Table */}
        <div className="xl:col-span-3 space-y-6 flex flex-col min-h-[500px]">
          <div className="flex-1 flex flex-col relative w-full space-y-4">
            {/* Search & Bulk Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0 flex flex-col gap-6">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Deep Lookup Identity Registry (Name, UUID, Artifacts...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-8 py-4 text-slate-900 text-sm font-black outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center justify-between px-2">
                 <div className="scroll-x no-scrollbar flex bg-slate-50 p-1.5 rounded-2xl shrink-0 border border-slate-100">
                   {(['pending', 'verified', 'rejected', 'all'] as const).map(s => (
                     <button
                       key={s}
                       onClick={() => setFilterStatus(s)}
                       className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                         filterStatus === s 
                           ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                           : 'text-slate-400 hover:text-slate-600'
                       }`}
                     >
                       {s}
                     </button>
                   ))}
                 </div>
                 <p className="hidden md:block text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Identity Lifecycle Engine v4.0</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto w-full min-w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="!bg-slate-50 !border-b-2 !border-slate-100">
                    <th className="p-8">Subscriber Identity</th>
                    <th className="text-center">Engine Access</th>
                    <th className="text-center">Artifact Count</th>
                    <th className="text-center">Verification Flow</th>
                    <th className="text-right pr-10">Access Desk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-40 text-center">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-indigo-100">
                           <Database className="text-indigo-200" size={40} />
                        </div>
                        <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Zero Discovery Matches</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Adjust search parameters for broader lookup</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="p-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-100 shadow-xl flex items-center justify-center text-indigo-500 overflow-hidden shrink-0 group-hover:scale-110 transition-all">
                              {user.faceData ? <img src={user.faceData} className="w-full h-full object-cover" /> : <UserCircle size={28} />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic truncate">{user.name}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry_{user.id.substr(0,8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                           <div className="inline-flex flex-col items-center">
                             {(user.kyc_status === 'verified') ? (
                               <span className="px-5 py-2 rounded-2xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <BadgeCheck size={14} /> Authorized
                               </span>
                             ) : (user.kyc_status === 'rejected') ? (
                               <span className="px-5 py-2 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <ShieldAlert size={14} /> Rejected
                               </span>
                             ) : (
                               <span className="px-5 py-2 rounded-2xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <Clock size={14} /> Pending Audit
                               </span>
                             )}
                           </div>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                             <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                <FileCheck size={16} />
                             </div>
                             <span className="text-[11px] font-black text-slate-900">{user.kycDocuments?.length || 0} Artifacts</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="flex flex-col items-center gap-2">
                             <div className={`text-[10px] font-black uppercase tracking-widest ${
                               (REQUIRED_DOCS - (user.kycDocuments?.length || 0)) <= 0 ? 'text-emerald-500' : 'text-slate-400'
                             }`}>
                               {Math.max(0, REQUIRED_DOCS - (user.kycDocuments?.length || 0))} Slots Remaining
                             </div>
                             <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div 
                                   className={`h-full transition-all duration-1000 ${
                                     user.kyc_status === 'verified' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]'
                                   }`} 
                                   style={{ width: `${Math.min(100, ((user.kycDocuments?.length || 0) / REQUIRED_DOCS) * 100)}%` }} 
                                />
                             </div>
                          </div>
                        </td>
                        <td className="text-right pr-10">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="p-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl transition-all shadow-sm active:scale-95"
                            title="Audit Identity"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* KYC View Modal */}
      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => { setSelectedUser(null); setActionSuccess(null); }}
        title="IDENTITY AUDIT TERMINAL"
        maxWidth="max-w-6xl"
        scrollable
      >
        {selectedUser && (
          <div className="space-y-10 p-2">
            {actionSuccess && (
              <div className="p-8 bg-emerald-50 border-none rounded-[3rem] flex items-center gap-6 animate-in slide-in-from-top-6 duration-700 shadow-xl shadow-emerald-500/10">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><CheckCircle size={36} /></div>
                <div className="flex-1">
                   <h4 className="text-[clamp(1rem,3vw,1.25rem)] font-black text-emerald-900 uppercase italic tracking-tighter">Handshake Successful</h4>
                   <p className="text-emerald-600 text-[clamp(0.6rem,2vw,0.7rem)] font-black uppercase tracking-[0.3em] mt-1">{actionSuccess}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Profile Sector */}
               <div className="lg:col-span-4 space-y-6">
                 <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-6 relative overflow-hidden shadow-inner">
                    <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                        <div className="w-48 h-48 rounded-[2rem] bg-white border-8 border-white shadow-lg overflow-hidden group">
                            {selectedUser.faceData ? (
                                <img src={selectedUser.faceData} alt="Face Data" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-100 bg-slate-50"><User size={80} /></div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedUser.name}</h4>
                            <p className="text-indigo-600 text-[11px] font-black uppercase tracking-[0.4em] mt-4">{selectedUser.phone || 'NO_LINKED_AUTH'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Flow Integrity</span>
                            {(selectedUser.kyc_status === 'verified') ? (
                              <span className="text-[10px] font-black text-emerald-500 uppercase italic">Authorized</span>
                            ) : (
                              <span className="text-[10px] font-black text-amber-500 uppercase italic">Review Req</span>
                            )}
                        </div>
                        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2 italic">Registry Mapping ID</div>
                            <div className="text-[11px] text-slate-900 font-black truncate font-mono bg-slate-50 p-3 rounded-xl">{selectedUser.id}</div>
                        </div>
                    </div>
                    
                    <Activity className="absolute -right-24 -bottom-24 text-indigo-500/5 size-80 pointer-events-none" />
                 </div>
              </div>

              {/* Action & Artifact Sector */}
              <div className="lg:col-span-8 space-y-6">
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                         <Lock size={18} className="text-indigo-500" />
                         Mission Control
                       </h4>
                       <div className="px-5 py-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auditor: {state.currentUser?.name}</span>
                       </div>
                    </div>
                    
                    {selectedUser.kyc_status === 'verified' ? (
                      <div className="py-20 bg-emerald-500 text-white rounded-[3.5rem] text-center space-y-6 shadow-2xl shadow-emerald-500/20 group">
                        <BadgeCheck size={96} strokeWidth={1} className="mx-auto group-hover:scale-110 transition-transform duration-700" />
                        <div>
                           <h5 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Security Authorized</h5>
                           <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-4 opacity-60 italic">Registry Synchronized • {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                            onClick={() => handleApprove(selectedUser.id)}
                            disabled={!!actionLoading}
                            className="flex flex-col items-center justify-center gap-6 p-10 bg-emerald-600 text-white rounded-[3rem] group hover:bg-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all active:scale-95 shadow-xl disabled:opacity-50 border-4 border-emerald-500/20"
                        >
                            <div className="w-20 h-20 rounded-[1.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-all shadow-lg border border-white/30">
                               {actionLoading === 'approve' ? <RefreshCcw size={40} className="animate-spin text-white" /> : <CheckCircle size={40} className="text-white" />}
                            </div>
                            <div className="text-center">
                               <p className="text-2xl font-black uppercase italic tracking-tighter leading-none">Authorize Access</p>
                               <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.3em] mt-3 opacity-70 italic">Finalize Identity Protocol</p>
                            </div>
                        </button>
                        <button 
                            onClick={() => setShowRejectModal(true)}
                            className="flex flex-col items-center justify-center gap-6 p-10 bg-slate-900 text-white rounded-[3rem] group hover:bg-rose-600 hover:shadow-2xl hover:shadow-rose-600/20 transition-all active:scale-95 shadow-xl border-4 border-white/5"
                        >
                            <div className="w-20 h-20 rounded-[1.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center group-hover:rotate-12 transition-all shadow-lg border border-white/10">
                               <XCircle size={40} className="text-white" />
                            </div>
                            <div className="text-center">
                               <p className="text-2xl font-black uppercase italic tracking-tighter leading-none">Flag Discrepancy</p>
                               <p className="text-[10px] font-black text-slate-400 group-hover:text-rose-100 uppercase tracking-[0.3em] mt-3 opacity-70 italic">Request Correction Flow</p>
                            </div>
                        </button>
                      </div>
                    )}
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-8">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                         <FolderSync size={18} className="text-indigo-500" />
                         Captured Evidence
                       </h4>
                       <span className="bg-slate-900 text-white px-5 py-2.5 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest shadow-xl">
                          {selectedUser.kycDocuments?.length || 0} / {REQUIRED_DOCS} Artifacts
                       </span>
                    </div>

                    {!selectedUser.kycDocuments || selectedUser.kycDocuments.length === 0 ? (
                      <div className="py-40 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                        <Database size={64} className="text-slate-100" />
                        <div>
                           <p className="text-xl font-black text-slate-400 uppercase italic tracking-tighter">Digital Void Detected</p>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2 italic">Awaiting document handshake from subscriber portal</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-8">
                        {selectedUser.kycDocuments.map((doc, idx) => (
                           <div key={idx} className="group relative aspect-video rounded-[3rem] border-none overflow-hidden bg-white shadow-2xl hover:scale-105 transition-all duration-500">
                              <img src={doc.fileUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" alt={doc.type} />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                 <div className="flex items-end justify-between">
                                    <div className="space-y-2">
                                       <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg tracking-widest">{doc.type}</span>
                                       <p className="text-lg font-black text-white italic tracking-tighter leading-none mt-2">Evidence_{idx+1}</p>
                                    </div>
                                    <button 
                                      onClick={() => window.open(doc.fileUrl, '_blank')}
                                      className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center shadow-2xl"
                                    >
                                       <ExternalLink size={24} />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="REVISION PROTOCOL"
        maxWidth="max-w-md"
      >
        <div className="space-y-8 p-4">
            <div className="p-8 bg-rose-50 border-none rounded-[3rem] flex items-start gap-6 shadow-xl shadow-rose-500/5">
                <AlertCircle className="text-rose-500 shrink-0 mt-1" size={32} strokeWidth={2.5} />
                <div>
                   <h5 className="text-lg font-black text-rose-900 uppercase italic tracking-tighter">Security Alert</h5>
                   <p className="text-[10px] text-rose-600 font-black leading-relaxed mt-2 uppercase tracking-widest opacity-80 italic">Identity discrepancy detected. Portal session will be hard-locked for re-verification.</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4 italic">Auditor Context Registry</label>
                <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Document exact discrepancies or evidence corruption details for the subscriber..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[3rem] p-8 text-slate-900 text-sm font-black min-h-[180px] outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-300 resize-none"
                />
            </div>
            
            <div className="flex items-center justify-between px-4">
                 <label className="text-xs font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
                   <FileCheck size={18} className="text-indigo-500" /> Revision Quota
                 </label>
                 <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 shadow-inner">
                    <button 
                       onClick={() => setRevisionDocsCount(Math.max(1, revisionDocsCount - 1))}
                       className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-rose-600 rounded-full transition-all font-black"
                    >-</button>
                    <span className="text-base font-black text-slate-900 w-8 text-center tabular-nums">{revisionDocsCount}</span>
                    <button 
                       onClick={() => setRevisionDocsCount(revisionDocsCount + 1)}
                       className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-emerald-600 rounded-full transition-all font-black"
                    >+</button>
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setShowRejectModal(false)}
                    className="py-6 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                    Abort Control
                </button>
                <button 
                    onClick={handleReject}
                    disabled={!rejectionReason || actionLoading === 'reject'}
                    className="py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl hover:bg-rose-600 hover:shadow-rose-600/20 disabled:opacity-50"
                >
                    {actionLoading === 'reject' ? 'Transmitting...' : 'Flag Revision'}
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default KYCManagement;
