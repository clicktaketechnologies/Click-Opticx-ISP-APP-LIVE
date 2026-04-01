import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, Role, UserStatus, PackageRequest, TopupRequest, EmergencyLoad, PaymentStatus, Package } from '../types';
import { db } from '../db';
import { 
  CheckCircle, XCircle, Clock, Zap, User, 
  ShieldCheck, ChevronRight, Activity, 
  HardDrive, AlertTriangle, Layers, Banknote, Globe, Landmark,
  ShieldAlert, RefreshCw, Search, Filter, Hash, Eye, Info,
  Wallet, Smartphone, AlertCircle, FileText, UserCircle, X, DatabaseZap
} from 'lucide-react';

interface Props {
  state: AppState;
  defaultTab?: 'all' | 'package' | 'topup' | 'emergency' | 'signup' | 'duplicates' | 'audit';
}

const MasterApprovalDashboard: React.FC<Props> = ({ state, defaultTab = 'all' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<{id: string, type: any} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentUserRole = state.currentUser?.role || Role.VIEWER;
  const canApprove = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER].includes(currentUserRole as Role);

  // Unified Request Mapper
  const unifiedRequests = useMemo(() => {
    const pkgs = (state.packageRequests || []).map(r => ({ ...r, unifiedType: 'package' as const }));
    const topups = (state.topupRequests || []).map(r => ({ ...r, unifiedType: 'topup' as const }));
    const emer = (state.emergencyLoads || []).map(l => ({ 
      ...l, 
      unifiedType: 'emergency' as const, 
      packageName: l.packageId ? (state.packages.find(p => p.id === l.packageId)?.name || 'Rescue') : 'Rescue Credit',
      paymentMethod: 'Auto-Advance',
      status: l.status === 'Pending_Activation' ? 'Pending' : (l.status === 'Active' || l.status === 'Paid' ? 'Approved' : 'Rejected')
    }));
    const signups = (state.signupRequests || []).map(r => ({
      ...r,
      unifiedType: 'signup' as const,
      paymentMethod: 'N/A',
      amount: 0,
      userId: 'NEW',
      userName: r.name,
      packageName: r.status === 'Duplicate' ? 'Conflict Detected' : 'New Connection'
    }));

    return [...pkgs, ...topups, ...emer, ...signups].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.packageRequests, state.topupRequests, state.emergencyLoads, state.signupRequests, state.packages]);

  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter(r => {
      // Tab Filter
      const matchesTab = activeTab === 'all' || r.unifiedType === activeTab || (activeTab === 'duplicates' && r.status === 'Duplicate');
      
      // Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending') matchesStatus = r.status === 'Pending' || r.status === 'Duplicate';
        else matchesStatus = r.status === statusFilter;
      }

      // Search Filter
      const term = searchTerm.toLowerCase();
      const matchesSearch = r.userName.toLowerCase().includes(term) || 
                           r.userId.toLowerCase().includes(term) ||
                           (r as any).packageName?.toLowerCase().includes(term);
      
      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [unifiedRequests, activeTab, statusFilter, searchTerm]);

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
      setSelectedRequestId(null);
    } else {
      alert((res as any).message || 'Request failed to process.');
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId || !rejectionReason) return;
    setIsProcessing(true);
    await db.rejectUnifiedRequest(selectedRequestId.id, selectedRequestId.type, rejectionReason);
    setIsProcessing(false);
    setSelectedRequestId(null);
    setRejectionReason('');
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'package': return <FileText className="text-blue-500" size={18} />;
      case 'topup': return <Wallet className="text-green-500" size={18} />;
      case 'emergency': return <Zap className="text-orange-500" size={18} />;
      case 'signup': return <User className="text-blue-500" size={18} />;
      default: return <FileText className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <ShieldCheck className="text-green-600" size={32} />
            Approval Center
          </h2>
          <p className="text-slate-500 font-medium text-[10px] tracking-widest uppercase">Review and approve user requests for packages, top-ups, and more.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'package', label: 'Package Requests' },
            { id: 'topup', label: 'Top-up Requests' },
            { id: 'emergency', label: 'Emergency Credit' },
            { id: 'signup', label: 'New User Requests' },
            { id: 'duplicates', label: 'Duplicates' },
            { id: 'audit', label: 'System Log System' },
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
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
                                <UserCircle size={24}/>
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
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                  req.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' :
                                  req.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  req.status === 'Duplicate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                  {req.status}
                                </span>
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
                          {new Date(req.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                       </td>
                       <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => setSelectedRequestId({id: req.id, type: req.unifiedType})}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all active:scale-90"
                          >
                             <Eye size={18}/>
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>

            {filteredRequests.length === 0 && (
              <div className="p-32 text-center flex flex-col items-center">
                 <ShieldCheck className="text-slate-100 mb-6" size={80} />
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">No Pending Requests</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Great! There are no requests waiting for your approval.</p>
              </div>
            )}
         </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedRequestId && selectedRequestData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg border border-white/10">
                       {getIcon(selectedRequestData.unifiedType)}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Review Request</h3>
                       <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Request ID: {selectedRequestData.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedRequestId(null)} className="p-3 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><X size={32} /></button>
              </div>

              <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">User</h4>
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border shadow-sm"><User size={28} className="text-slate-300"/></div>
                          <div>
                             <p className="font-black text-slate-900 uppercase text-lg leading-none">{selectedRequestData.userName}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref: {selectedRequestData.userId}</p>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Payment Details</h4>
                       <div className="space-y-1">
                          <p className="text-3xl font-black text-slate-900 italic">{state.settings.currency} {selectedRequestData.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Paid via {selectedRequestData.paymentMethod}</p>
                       </div>
                    </div>
                 </div>

                 {/* Duplicate Alert Panel */}
                 {selectedRequestData.status === 'Duplicate' && (
                   <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] space-y-4 shadow-sm animate-pulse">
                      <h4 className="text-[11px] font-black text-rose-700 uppercase tracking-[0.2em] flex items-center gap-2">
                         <ShieldAlert size={16} /> Identity Conflict Detected
                      </h4>
                      <p className="text-xs font-bold text-rose-600">
                        { (selectedRequestData as any).duplicateReason || 'A subscriber with these details already exists in the registry.' }
                      </p>
                      <p className="text-[10px] text-rose-500/80 font-medium">Verify the authenticity of this request before proceeding. Duplicates often indicate shared connections or re-registrations.</p>
                   </div>
                 )}

                 {/* System Pre-check Panel */}
                 <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] space-y-6 shadow-sm">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Activity size={16} className="text-blue-600" /> Automatic System Check
                    </h4>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Existing Package Check</span>
                          {(() => {
                             const user = state.users.find(u => u.id === selectedRequestData.userId);
                             let isExpired = true;
                             if (user?.expiryDate) {
                               const exp = new Date(user.expiryDate);
                               exp.setHours(0, 0, 0, 0);
                               const today = new Date();
                               today.setHours(0, 0, 0, 0);
                               isExpired = exp.getTime() < today.getTime();
                             }
                             return isExpired ? (
                               <span className="text-[9px] font-black text-green-600 uppercase flex items-center gap-1"><CheckCircle size={12}/> No Active Package</span>
                             ) : (
                               <span className="text-[9px] font-black text-rose-600 uppercase flex items-center gap-1"><AlertCircle size={12}/> User Already Has a Package</span>
                             );
                          })()}
                       </div>
                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Credit Score Check</span>
                          {(() => {
                             const user = state.users.find(u => u.id === selectedRequestData.userId);
                             const score = user?.creditScore || 0;
                             return score >= 600 ? (
                               <span className="text-[9px] font-black text-green-600 uppercase">Good ({score})</span>
                             ) : (
                               <span className="text-[9px] font-black text-orange-600 uppercase">Low Score ({score})</span>
                             );
                          })()}
                       </div>
                    </div>
                 </div>

                 {/* Audit Timeline Section */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex justify-between items-center">
                      Request Audit History
                      <span className="text-blue-600">LIVE FEED</span>
                    </h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {(state.auditLogs || [])
                        .filter(log => 
                          (log.userId && log.userId === selectedRequestData.userId) || 
                          (log.userName && log.userName === selectedRequestData.userName) ||
                          (log.metadata?.requestId === selectedRequestData.id)
                        )
                        .map(log => (
                          <div key={log.id} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className={`mt-1 p-1.5 rounded-lg ${
                              log.type === 'Approval' ? 'bg-green-100 text-green-600' :
                              log.type === 'Rejection' ? 'bg-rose-100 text-rose-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {log.type === 'Approval' ? <CheckCircle size={12}/> : 
                               log.type === 'Rejection' ? <XCircle size={12}/> : 
                               <Info size={12}/>}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-black text-slate-900 uppercase">{log.action}</p>
                                <span className="text-[8px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{log.details}</p>
                              {log.adminName && (
                                <p className="text-[8px] font-black text-blue-600 uppercase mt-1 italic">Performed by: {log.adminName}</p>
                              )}
                            </div>
                          </div>
                      ))}
                      {(state.auditLogs || []).filter(log => 
                          (log.userId && log.userId === selectedRequestData.userId) || 
                          (log.userName && log.userName === selectedRequestData.userName)
                        ).length === 0 && (
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No previous audit logs found</p>
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Rejection (Mandatory for Denials)</label>
                    <textarea 
                      className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] font-bold text-xs h-32 resize-none outline-none focus:border-rose-500 transition-all uppercase"
                      placeholder="Explain why this request is being rejected..."
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                    />
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button 
                  onClick={handleReject}
                  disabled={!rejectionReason || isProcessing}
                  className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                    <XCircle size={18}/> Reject Request
                 </button>
                 <button 
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    {isProcessing ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18}/>}
                    Approve and Activate
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'audit' && (
         <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40">
             <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"><Activity size={24}/></div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">System-Wide Audit Trail</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Historical record of all approval & signup handshakes</p>
                  </div>
               </div>
               <button onClick={() => window.print()} className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-200"><Hash size={20}/></button>
             </div>
 
             <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                {(state.auditLogs || []).length > 0 ? (
                  [...(state.auditLogs || [])].reverse().map(log => (
                    <div key={log.id} className="flex gap-6 items-start bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all shadow-sm group">
                       <div className="shrink-0 flex flex-col items-center gap-2">
                          <div className={`p-4 rounded-2xl ${
                            log.type === 'Approval' ? 'bg-green-50 text-green-600' :
                            log.type === 'Rejection' ? 'bg-rose-50 text-rose-600' :
                            log.type === 'System' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {log.type === 'Approval' ? <CheckCircle size={24}/> : 
                             log.type === 'Rejection' ? <XCircle size={24}/> : 
                             log.type === 'System' ? <ShieldCheck size={24}/> : <Info size={24}/>}
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
                     <DatabaseZap size={48} className="text-slate-100 mx-auto mb-4" />
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


