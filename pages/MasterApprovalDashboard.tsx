import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, Role, UserStatus, PackageRequest, TopupRequest, EmergencyLoad, PaymentStatus, Package } from '../types';
import { db } from '../db';
import { 
  CheckCircle, XCircle, Clock, Zap, User, 
  ShieldCheck, ChevronRight, Activity, 
  HardDrive, AlertTriangle, Layers, Banknote, Globe, Landmark,
  ShieldAlert, RefreshCw, Search, Filter, Hash, Eye, Info,
  Wallet, Smartphone, AlertCircle, FileText, UserCircle, X
} from 'lucide-react';

interface Props {
  state: AppState;
  defaultTab?: 'all' | 'package' | 'topup' | 'emergency' | 'home';
}

const MasterApprovalDashboard: React.FC<Props> = ({ state, defaultTab = 'all' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
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
    const emer = (state.emergencyLoads || []).filter(l => l.status === 'Pending_Activation').map(l => ({ 
      ...l, 
      unifiedType: 'emergency' as const, 
      packageName: l.packageId ? (state.packages.find(p => p.id === l.packageId)?.name || 'Rescue') : 'Rescue Credit',
      paymentMethod: 'Auto-Advance'
    }));
    const signups = (state.signupRequests || []).filter(r => r.status === 'Pending').map(r => ({
      ...r,
      unifiedType: 'signup' as const,
      paymentMethod: 'N/A',
      amount: 0,
      userId: 'NEW',
      userName: r.name,
      packageName: 'New Connection'
    }));

    return [...pkgs, ...topups, ...emer, ...signups].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.packageRequests, state.topupRequests, state.emergencyLoads, state.signupRequests, state.packages]);

  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter(r => {
      const matchesTab = activeTab === 'all' || r.unifiedType === activeTab;
      const term = searchTerm.toLowerCase();
      const matchesSearch = r.userName.toLowerCase().includes(term) || 
                           r.userId.toLowerCase().includes(term) ||
                           (r as any).packageName?.toLowerCase().includes(term);
      const matchesStatus = r.status === 'Pending' || r.status === 'Pending_Activation';
      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [unifiedRequests, activeTab, searchTerm]);

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
         <div className="px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2">
            <Filter size={14}/> Showing: Pending Requests
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Type</th>
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
                          <div className="flex items-center gap-2">
                             {getIcon(req.unifiedType)}
                             <span className="text-xs font-black text-slate-700 uppercase italic">{(req as any).packageName || req.unifiedType}</span>
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
    </div>
  );
};

export default MasterApprovalDashboard;

