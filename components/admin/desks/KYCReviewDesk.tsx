import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, ShieldAlert, Eye, CheckCircle, XCircle, 
  RotateCw, Clock, User, Fingerprint, Camera, FileText, 
  Search, Filter, ChevronRight, Activity, Database, Lock,
  Maximize2, ZoomIn, Info, AlertCircle, X, UserCircle, UserCheck, Smartphone
} from 'lucide-react';
import { db } from '../../../db';
import { AppState, ISPUser, VerificationStatus, KYCMethod } from '../../../types';
import { Modal } from '../../shared/Modal';
import { Mini5GMicroLoader } from '../../Mini5GMicroLoader';

interface Props {
  state: AppState;
}

export const KYCReviewDesk: React.FC<Props> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Verified' | 'Revision' | 'Not Started'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revisionDocsCount, setRevisionDocsCount] = useState<number>(state.settings.requiredKycDocs || 10);
  const [isProcessing, setIsProcessing] = useState(false);

  const kycUsers = useMemo(() => {
    return state.users.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (u.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const isPending = u.isKYCSubmitted && !u.isKYCVerified;
      const isVerified = u.isKYCVerified || u.kyc_status === 'verified';
      const isRevision = u.kyc_status === 'rejected' || u.verificationStatus === VerificationStatus.REVISION;
      const isNotStarted = !u.isKYCSubmitted && !u.isKYCVerified;

      const matchesStatus = statusFilter === 'All' || 
                           (statusFilter === 'Pending' && isPending) ||
                           (statusFilter === 'Verified' && isVerified) ||
                           (statusFilter === 'Revision' && isRevision) ||
                           (statusFilter === 'Not Started' && isNotStarted);
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      // Sort pending to top
      if (a.kyc_status === 'pending' && b.kyc_status !== 'pending') return -1;
      if (a.kyc_status !== 'pending' && b.kyc_status === 'pending') return 1;
      return (b.kycSubmissionDate || '').localeCompare(a.kycSubmissionDate || '');
    });
  }, [state.users, searchTerm, statusFilter]);

  const selectedUser = useMemo(() => {
    return state.users.find(u => u.id === selectedUserId);
  }, [state.users, selectedUserId]);

  const handleApprove = async (userId: string) => {
    setIsProcessing(true);
    const res = await db.approveKYC(userId);
    setIsProcessing(false);
    if (res.success) {
      setSelectedUserId(null);
    } else {
      alert(res.message || 'Verification Error');
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason) {
      alert("Handshake perspective required for rejection protocols.");
      return;
    }
    setIsProcessing(true);
    const res = await db.rejectKYC(userId, rejectionReason, { revisionDocsCount });
    setIsProcessing(false);
    if (res.success) {
      setSelectedUserId(null);
      setRejectionReason('');
    } else {
      alert(res.message || 'Processing Error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3 italic uppercase">
            <ShieldCheck className="text-blue-600" size={28} />
            Identity Verification Desk
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic border-l-4 border-blue-500 pl-4">Subscriber Authenticity & KYC Management</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
          {['All', 'Pending', 'Verified', 'Revision', 'Not Started'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f as any)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex gap-4 items-center group">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 font-bold text-slate-900 shadow-inner transition-all placeholder:text-slate-400"
            placeholder="Query subscribers by identity token or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Side */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col max-h-[750px]">
            <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Nodes Captured ({kycUsers.length})</span>
              {state.settings.aiAgentEnabled && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
                  <Activity size={14} className="text-blue-600 animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-blue-600">AI Monitor</span>
                </div>
              )}
            </div>
            
            <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
              {kycUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full p-6 text-left flex items-center justify-between transition-all group ${
                    selectedUserId === user.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      selectedUserId === user.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white border border-slate-200 text-slate-300'
                    }`}>
                      <UserCircle size={24} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-slate-900 uppercase italic leading-none truncate max-w-[120px]">{user.name}</p>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2">{user.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                      user.kyc_status === 'verified' || user.isKYCVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      user.kyc_status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      user.isKYCSubmitted ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {user.kyc_status === 'verified' || user.isKYCVerified ? 'Verified' : 
                       (user.kyc_status === 'pending' || user.isKYCSubmitted) ? 'Review' : 
                       user.kyc_status === 'rejected' ? 'Revision' : 'No Data'}
                    </span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                      {user.kycSubmissionDate ? new Date(user.kycSubmissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Standby'}
                    </span>
                  </div>
                </button>
              ))}
              {kycUsers.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center gap-6">
                  <Database className="text-slate-100" size={64} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching identities in registry</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="lg:col-span-2">
          {selectedUser ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-right-8 duration-700 min-h-[750px] flex flex-col">
                <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white/10 rounded-[2rem] border border-white/20 flex items-center justify-center backdrop-blur-md shadow-2xl">
                        <Fingerprint size={40} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{selectedUser.name}</h3>
                        <div className="flex items-center gap-4 mt-3">
                           <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">{selectedUser.id}</span>
                           <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                           <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{selectedUser.kycMethod || 'Direct Handshake'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <X className="absolute top-8 right-8 text-white/30 cursor-pointer hover:text-white transition-colors" onClick={() => setSelectedUserId(null)} />
                  <Activity className="absolute -right-20 -bottom-20 text-white/5 size-80 pointer-events-none" />
                </div>

                <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
                   {/* Demographics Area */}
                   <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-wrap gap-8 items-center justify-between shadow-sm">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12}/> CNIC</p>
                         <p className="font-black text-slate-800 text-sm">{selectedUser.cnic || 'Not Provided'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smartphone size={12}/> Phone</p>
                         <p className="font-black text-slate-800 text-sm">{selectedUser.phone || 'Not Provided'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Email</p>
                         <p className="font-black text-slate-800 text-sm">{selectedUser.email || 'Not Provided'}</p>
                      </div>
                      <div className="space-y-1 max-w-[200px]">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={12}/> Address</p>
                         <p className="font-black text-slate-800 text-sm truncate" title={selectedUser.address || 'Not Provided'}>{selectedUser.address || 'Not Provided'}</p>
                      </div>
                   </div>

                   {/* Documents Grid */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                            <Database size={16} className="text-blue-500" /> 
                            Identity Artifacts
                         </h4>
                         <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-[1.5rem] border border-blue-100 shadow-sm">
                             <Lock size={14} />
                             <span className="text-[10px] font-black uppercase tracking-widest">TLS-Encrypted Archival</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {selectedUser.kycDocuments && selectedUser.kycDocuments.length > 0 ? (
                           selectedUser.kycDocuments.map((doc, idx) => (
                             <div key={idx} className="group relative aspect-video rounded-[2.5rem] border-2 border-slate-100 overflow-hidden bg-slate-50 transition-all hover:border-blue-500 shadow-xl shadow-slate-100/50">
                               <img src={doc.fileUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Verification Doc" />
                               <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex justify-between items-end">
                                     <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">{doc.type}</p>
                                        <p className="text-sm font-black text-white uppercase italic">Subscriber Identity Leak-Test</p>
                                     </div>
                                     <button 
                                        onClick={() => window.open(doc.fileUrl, '_blank')}
                                        className="p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all shadow-2xl"
                                     >
                                        <Maximize2 size={20} />
                                     </button>
                                  </div>
                               </div>
                             </div>
                           ))
                         ) : (
                           <div className="col-span-2 p-24 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[3.5rem] flex flex-col items-center gap-6">
                              <Camera size={64} className="text-slate-200" />
                              <div className="text-center">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Awaiting Document Upload</p>
                                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2 italic">No electronic artifacts linked to this identity node.</p>
                              </div>
                           </div>
                         )}
                      </div>
                   </div>

                   {/* Decision Controls */}
                   <div className="space-y-6 bg-slate-50/80 p-8 rounded-[3rem] border border-slate-200 shadow-inner">
                      <div className="flex items-center justify-between px-2">
                         <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Handshake Perspective</label>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{rejectionReason.length} chars</span>
                      </div>
                      <textarea 
                        className="w-full h-32 bg-white border border-slate-200 rounded-[2.5rem] p-8 text-sm font-bold text-slate-900 outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/30 placeholder:text-slate-300 resize-none transition-all shadow-sm"
                        placeholder="Provide deep-dive context for rejection or resubmission protocols..."
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                      />
                      
                      <div className="flex items-center justify-between px-2 pt-2">
                         <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic flex items-center gap-2">
                           <FileText size={14} /> Required Revision Documents
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
                      
                      <div className="flex gap-6 pt-2">
                         <button 
                           onClick={() => handleReject(selectedUser.id)}
                           disabled={!rejectionReason || isProcessing}
                           className="flex-1 py-5 bg-white text-rose-600 border border-rose-100 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-50 transition-all disabled:opacity-40 shadow-sm"
                         >
                            <RotateCw size={18} /> Request Identity Refresh
                         </button>
                         <button 
                           onClick={() => handleApprove(selectedUser.id)}
                           disabled={isProcessing}
                           className="flex-[2] py-5 bg-slate-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:bg-black active:scale-95 transition-all"
                         >
                            {isProcessing ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20} className="text-emerald-400" />}
                            Execute Authorized Access
                         </button>
                      </div>
                   </div>
                </div>
              </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-32 space-y-8 animate-in zoom-in-95 duration-700">
               <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full scale-150 animate-pulse" />
                  <div className="w-44 h-44 bg-slate-50 rounded-[4rem] flex items-center justify-center text-slate-100 border-[8px] border-dashed border-slate-100 relative shadow-inner">
                      <ShieldCheck size={100} strokeWidth={1} />
                      <div className="absolute -top-6 -right-6 w-16 h-16 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-blue-500 border border-slate-100">
                        <UserCheck size={32} />
                      </div>
                  </div>
               </div>
               <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-300 uppercase italic tracking-tighter leading-none">Awaiting Identity Node</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">Select a subscriber from the operational registry to initiate a deep-dive identity handshake and artifact audit.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
