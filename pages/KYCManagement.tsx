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
    // Simulate multi-cloud handshake with logging
    await db.syncArtifacts('GLOBAL_REGISTRY', [], (log) => {
        setCloudLogs(prev => [log, ...prev].slice(0, 50));
    });
    await db.forceSync();
    setIsSyncing(false);
  };

  const cloudConfig = state.settings.cloudStorage;

  const getStatusBadge = (user: ISPUser) => {
    const status = user.kyc_status;
    if (status === 'verified') return (
      <span className="badge badge-success !rounded-lg !text-[8px]">
        <BadgeCheck size={10} className="mr-1" /> VERIFIED
      </span>
    );
    if (status === 'rejected') return (
      <span className="badge badge-error !rounded-lg !text-[8px]">
        <ShieldAlert size={10} className="mr-1" /> REVISION
      </span>
    );
    if (user.isKYCSubmitted) return (
      <span className="badge badge-warning !rounded-lg !text-[8px]">
        <Clock size={10} className="mr-1" /> PENDING
      </span>
    );
    return (
      <span className="badge badge-info !bg-slate-100 !text-slate-500 !border-slate-200 !rounded-lg !text-[8px]">
        <Clock size={10} className="mr-1" /> INCOMPLETE
      </span>
    );
  };

  const REQUIRED_DOCS = state.settings.requiredKycDocs || 10;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden relative pb-4">
      {/* Header - Premium Light Theme */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1 shrink-0">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none">Compliance Hub</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Unified Identity Lifecycle & Document Vault
          </p>
        </div>
        <button 
          onClick={handleSyncAll}
          disabled={isSyncing}
          className={`btn ${isSyncing ? 'btn-secondary' : 'btn-primary'} !rounded-2xl`}
        >
          <RefreshCcw size={16} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Cloud Handshake...' : 'Multi-Cloud Sync'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Stats & Analytics */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card !p-6 space-y-4">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 italic mb-2">
              <BarChart3 size={16} className="text-blue-500" />
              Registry Health
            </h3>
            
            <div className="space-y-2">
              {[
                { label: 'Total Base', count: totalUsers, icon: User, color: 'blue', status: 'all' },
                { label: 'Awaiting Review', count: pendingUsers.length, icon: Clock, color: 'amber', status: 'pending' },
                { label: 'Verified Global', count: verifiedUsers.length, icon: UserCheck, color: 'emerald', status: 'verified' },
                { label: 'Revision Requests', count: rejectedUsers.length, icon: ShieldAlert, color: 'rose', status: 'rejected' }
              ].map(item => (
                <button 
                  key={item.label}
                  onClick={() => setFilterStatus(item.status as any)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left ${
                    filterStatus === item.status 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      filterStatus === item.status ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-100'
                    }`}>
                      <item.icon size={16} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === item.status ? 'text-white/80' : 'text-slate-400'}`}>{item.label}</p>
                      <p className={`text-lg font-black mt-0.5 ${filterStatus === item.status ? 'text-white' : 'text-slate-900'}`}>{item.count}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={filterStatus === item.status ? 'text-white/40' : 'text-slate-300'} />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Terminal size={120} className="text-blue-500" />
            </div>
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2 italic">
              <Code size={16} /> Cloud Sync Console
            </h3>
            
            <div className="space-y-3 h-[300px] overflow-y-auto custom-scrollbar pr-2 font-mono">
               {cloudLogs.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                    <Activity size={32} className="text-slate-600 mb-2" />
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">System Idle.<br/>Awaiting cloud handshake...</p>
                 </div>
               ) : (
                 cloudLogs.map((log, i) => (
                   <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
                     log.status === 'Success' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                     log.status === 'Streaming' ? 'bg-blue-500/5 border-blue-500/20' : 
                     'bg-slate-800 border-slate-700'
                   }`}>
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black uppercase text-blue-400">{log.provider}</span>
                         <span className={`text-[8px] font-black uppercase ${
                           log.status === 'Success' ? 'text-emerald-400' : 'text-blue-400 animate-pulse'
                         }`}>{log.status}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">{log.details}</p>
                      <span className="text-[7px] text-slate-600 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* User Registry Table */}
        <div className="lg:col-span-3 space-y-4 flex flex-col h-full overflow-hidden">
          <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-white rounded-[2rem] border border-white/5 shadow-sm">
            {/* Search & Bulk Filters */}
            <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col lg:flex-row gap-4 bg-slate-50/30">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search global registry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-14 pr-8 py-3 text-slate-900 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="scroll-x no-scrollbar bg-slate-100/50 p-1 rounded-xl shrink-0">
                {(['pending', 'verified', 'rejected', 'all'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filterStatus === s 
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-container flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th>Subscriber Identity</th>
                    <th className="text-center">KYC Flow Status</th>
                    <th className="text-center">Artifacts</th>
                    <th className="text-center">Progression</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                           <Database className="text-slate-200" size={32} />
                        </div>
                        <p className="text-slate-600 font-bold uppercase italic">Zero Registry Matches</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-blue-500 overflow-hidden shrink-0">
                              {user.faceData ? <img src={user.faceData} className="w-full h-full object-cover" /> : <UserCircle size={22} />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate uppercase">{user.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase truncate">Ref: {user.id.substr(0,8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          {getStatusBadge(user)}
                        </td>
                        <td className="text-center">
                          <span className="badge badge-info !rounded-lg">
                             <FileCheck size={12} className="mr-1" />
                             {user.kycDocuments?.length || 0} Files
                          </span>
                        </td>
                        <td className="text-center">
                          <div className={`text-[10px] font-bold uppercase ${
                            (REQUIRED_DOCS - (user.kycDocuments?.length || 0)) <= 0 ? 'text-emerald-500' : 'text-slate-400'
                          }`}>
                            {Math.max(0, REQUIRED_DOCS - (user.kycDocuments?.length || 0))} Needs
                          </div>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full mx-auto mt-2 overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-700 ${
                                  user.kyc_status === 'verified' ? 'bg-emerald-500' : 'bg-blue-500'
                                }`} 
                                style={{ width: `${Math.min(100, ((user.kycDocuments?.length || 0) / REQUIRED_DOCS) * 100)}%` }} 
                             />
                          </div>
                        </td>
                        <td className="text-right">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="btn btn-icon btn-sm btn-secondary"
                          >
                            <Eye size={16} />
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
        maxWidth="5xl"
      >
        {selectedUser && (
          <div className="space-y-8 p-4">
            {actionSuccess && (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                <CheckCircle size={32} className="text-emerald-500 flex-shrink-0" />
                <div>
                   <h4 className="text-sm font-black text-emerald-900 uppercase italic">Handshake Successful</h4>
                   <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mt-0.5">{actionSuccess}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1 bg-slate-50 rounded-[3rem] border border-slate-100 p-8 space-y-8 relative overflow-hidden">
                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-white border-4 border-white shadow-2xl overflow-hidden">
                        {selectedUser.faceData ? (
                            <img src={selectedUser.faceData} alt="Face Data" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={48} /></div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedUser.name}</h4>
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">{selectedUser.phone || 'NO_PHONE_LINKED'}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Verification Flow</div>
                        {getStatusBadge(selectedUser)}
                    </div>
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 italic">Encrypted UUID</div>
                        <div className="text-[10px] text-slate-900 font-black truncate">{selectedUser.id}</div>
                    </div>
                </div>
                
                <Activity className="absolute -right-20 -bottom-20 text-blue-500/5 size-64 pointer-events-none" />
              </div>

              {/* Action Pad & Docs */}
              <div className="lg:col-span-2 space-y-8">
                 <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-6 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                      <Lock size={16} className="text-blue-500" />
                      Administrative Controls
                    </h4>
                    
                    {selectedUser.kyc_status === 'verified' ? (
                      <div className="py-12 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 border-dashed text-center space-y-4">
                        <BadgeCheck size={64} className="text-emerald-500 mx-auto" />
                        <div>
                           <h5 className="text-xl font-black text-emerald-900 uppercase italic tracking-tight">Identity Authorized</h5>
                           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-1">Global registry updated at {new Date().toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleApprove(selectedUser.id)}
                            disabled={!!actionLoading}
                            className="p-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                        >
                            {actionLoading === 'approve' ? <RefreshCcw size={16} className="animate-spin text-blue-400" /> : <ShieldCheck size={18} className="text-emerald-400" />}
                            Authorized Approval
                        </button>
                        <button 
                            onClick={() => setShowRejectModal(true)}
                            className="p-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-100 transition-all active:scale-95"
                        >
                            <ShieldAlert size={18} /> Request Identity Revision
                        </button>
                      </div>
                    )}
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                         <FolderSync size={16} className="text-blue-500" />
                         Artifact Registry
                       </h4>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{selectedUser.kycDocuments?.length || 0} / {REQUIRED_DOCS} Files Captured</span>
                    </div>

                    {!selectedUser.kycDocuments || selectedUser.kycDocuments.length === 0 ? (
                      <div className="py-24 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-4">
                        <Database size={48} className="text-slate-100 mx-auto" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Electronic Handshakes Detected</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-6">
                        {selectedUser.kycDocuments.map((doc, idx) => (
                           <div key={idx} className="group relative aspect-video rounded-[2.5rem] border-2 border-slate-100 overflow-hidden bg-white shadow-sm hover:border-blue-500 transition-all">
                              <img src={doc.fileUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt={doc.type} />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="flex items-end justify-between">
                                    <div className="space-y-1">
                                       <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">{doc.type}</p>
                                       <p className="text-xs font-black text-white italic leading-none truncate max-w-[120px]">Artifact_{idx+1}</p>
                                    </div>
                                    <button 
                                      onClick={() => window.open(doc.fileUrl, '_blank')}
                                      className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-all"
                                    >
                                       <ExternalLink size={16} />
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
        title="IDENTITY REVISION HANDSHAKE"
        maxWidth="md"
      >
        <div className="space-y-6 p-4">
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-start gap-4">
                <AlertCircle className="text-rose-500 shrink-0 mt-1" size={24} />
                <div>
                   <h5 className="text-[10px] font-black text-rose-900 uppercase italic">Restricted Entry Protocol</h5>
                   <p className="text-[10px] text-rose-600 font-bold leading-relaxed mt-1 uppercase tracking-tight">Access to internal portals will be hard-locked for this subscriber until identity artifacts are refreshed.</p>
                </div>
            </div>
            
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">Auditor Context</label>
                <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Document identity discrepancies or artifact corruption details..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-slate-900 text-sm font-bold min-h-[160px] outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/30 transition-all shadow-inner placeholder:text-slate-300 resize-none"
                />
            </div>
            
            <div className="flex items-center justify-between px-2 pt-2">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic flex items-center gap-2">
                   <FileCheck size={14} /> Required Revision Documents
                 </label>
                 <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm">
                    <button 
                       onClick={() => setRevisionDocsCount(Math.max(1, revisionDocsCount - 1))}
                       className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all font-black text-xs"
                    >-</button>
                    <span className="text-sm font-black text-slate-800 w-6 text-center">{revisionDocsCount}</span>
                    <button 
                       onClick={() => setRevisionDocsCount(revisionDocsCount + 1)}
                       className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all font-black text-xs"
                    >+</button>
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setShowRejectModal(false)}
                    className="py-5 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all"
                >
                    Abort
                </button>
                <button 
                    onClick={handleReject}
                    disabled={!rejectionReason || actionLoading === 'reject'}
                    className="py-5 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl hover:bg-black disabled:opacity-50"
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
