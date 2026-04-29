import React, { useState, useMemo } from 'react';
import { 
  Wifi, Zap, Eye, CheckCircle, XCircle, 
  RefreshCw, Clock, User, HardDrive, Cpu, ShieldCheck,
  Search, Filter, ChevronRight, Activity, Database, Lock,
  Maximize2, ZoomIn, Info, AlertCircle, Share2, Network, Radio, Globe, UserCircle, Fingerprint, X
} from 'lucide-react';
import { db } from '../../../db';
import { AppState, PackageRequest, UserStatus, Role } from '../../../types';
import { Modal } from '../../shared/Modal';
import { Mini5GMicroLoader } from '../../Mini5GMicroLoader';

interface Props {
  state: AppState;
}

export const ProvisioningDesk: React.FC<Props> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const packageRequests = useMemo(() => {
    return (state.packageRequests || []).filter(r => {
      const matchesSearch = (r.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (r.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (r.packageName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [state.packageRequests, searchTerm, statusFilter]);

  const selectedRequest = useMemo(() => {
    return packageRequests.find(r => r.id === selectedRequestId);
  }, [packageRequests, selectedRequestId]);

  const handleApprove = async (requestId: string) => {
    setIsProcessing(true);
    const res = await db.approveUnifiedRequest(requestId, 'package');
    setIsProcessing(false);
    if (res.success) {
      setSelectedRequestId(null);
    } else {
      alert(res.message || 'Activation Error');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason) return;
    setIsProcessing(true);
    const res = await db.rejectUnifiedRequest(requestId, 'package', rejectionReason);
    setIsProcessing(false);
    if (res.success) {
      setSelectedRequestId(null);
      setRejectionReason('');
    } else {
      alert(res.message || 'Provisioning Rejection Error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3 italic uppercase leading-none">
            <Cpu className="text-blue-600" size={28} />
            Service Provisioning Desk
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic border-l-4 border-blue-500 pl-4">Network Link Deployment & Service Activation Registry</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
          {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
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
            placeholder="Search by subscriber, node ID, or service plan..."
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
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Service Nodes ({packageRequests.length})</span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100/50">
                  <Activity size={12} className="text-blue-600 animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-blue-600">Sync Pipeline</span>
                </div>
             </div>
             
             <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
                {packageRequests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`w-full p-6 text-left flex items-center justify-between transition-all group ${
                      selectedRequestId === req.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                        selectedRequestId === req.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white border border-slate-200 text-slate-300'
                      }`}>
                        <Zap size={24} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-slate-900 uppercase italic leading-none truncate max-w-[150px]">{req.userName}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2 truncate max-w-[150px]">{req.packageName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                       <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                         req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         req.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         'bg-blue-50 text-blue-600 border-blue-100'
                       }`}>
                         {req.status}
                       </span>
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                          {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </button>
                ))}
                {packageRequests.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-6">
                    <Database className="text-slate-100" size={64} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Clear</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="lg:col-span-2">
           {selectedRequest ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-right-8 duration-700 min-h-[750px] flex flex-col">
                 <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-8">
                       <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] border-4 border-white/10 flex items-center justify-center shadow-2xl animate-pulse">
                          <Wifi size={40} className="text-white" />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3 leading-none italic">Provisioning Link Active</p>
                          <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{selectedRequest.packageName}</h3>
                          <div className="flex items-center gap-4 mt-5">
                             <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                                <UserCircle size={14} className="text-blue-500" /> 
                                {selectedRequest.userName}
                             </div>
                             <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                             <span className="text-[11px] font-black uppercase tracking-widest text-blue-500/80">{selectedRequest.userId}</span>
                          </div>
                       </div>
                    </div>
                    <Radio className="absolute -right-20 -bottom-20 text-white/5 size-80 pointer-events-none animate-ping" />
                    <X className="absolute top-8 right-8 text-white/30 cursor-pointer hover:text-white transition-colors" onClick={() => setSelectedRequestId(null)} />
                 </div>

                 <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-8">
                          <div className="p-8 bg-slate-50/80 rounded-[3rem] border border-slate-100 space-y-6 shadow-inner">
                             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                <Network size={16} className="text-blue-500" /> 
                                Node Parameters
                             </h4>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Role</span>
                                   <span className="text-[10px] font-black text-slate-900 uppercase italic">Provisioning</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-slate-200/50">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol ID</span>
                                   <span className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[120px]">{selectedRequest.id}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transmission Time</span>
                                   <span className="text-[10px] font-black text-slate-900 uppercase">{new Date(selectedRequest.timestamp).toLocaleString()}</span>
                                </div>
                             </div>
                          </div>

                          <div className="p-8 bg-emerald-50/30 rounded-[3rem] border border-emerald-100/50 space-y-5">
                             <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-500/20">
                                   <Activity className="text-white" size={18} />
                                </div>
                                <span className="text-xs font-black uppercase italic text-slate-800 tracking-tight">Identity Compliance Audit</span>
                             </div>
                             <div className="space-y-3">
                                <div className="p-5 bg-white rounded-[1.5rem] border border-emerald-100 flex items-center justify-between shadow-sm">
                                   <div className="flex items-center gap-3">
                                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><ShieldCheck size={16} /></div>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">KYC Handshake</span>
                                   </div>
                                   <span className="text-[10px] font-black text-emerald-600 uppercase italic">Verified</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                             <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-center">
                                   <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest italic">Plan Specification</h4>
                                   <Zap size={24} className="text-amber-400 animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-3xl font-black uppercase italic leading-none">{selectedRequest.packageName}</p>
                                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest italic">{state.settings.currency} {(selectedRequest.amount || 0).toLocaleString()} / Cycle</p>
                                </div>
                             </div>
                             <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <Cpu size={250} />
                             </div>
                          </div>

                          <div className="p-8 bg-slate-50/80 rounded-[3rem] border border-slate-200 shadow-inner">
                             <div className="flex items-center gap-3 mb-4">
                                <Info className="text-slate-400" size={16} />
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic">Provisioning Context</span>
                             </div>
                             <textarea 
                                className="w-full h-32 bg-white border border-slate-200 rounded-[2rem] p-6 text-[11px] font-bold text-slate-900 outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/30 placeholder:text-slate-300 resize-none transition-all shadow-sm"
                                placeholder="Add deployment context or activation specific instructions for audit trail..."
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                             />
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-6">
                       <button 
                          onClick={() => handleReject(selectedRequest.id)}
                          disabled={!rejectionReason || isProcessing}
                          className="flex-1 py-5 bg-white text-rose-600 border border-rose-100 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-50 transition-all disabled:opacity-40 shadow-sm"
                       >
                          <XCircle size={20} /> Abort Deployment
                       </button>
                       <button 
                          onClick={() => handleApprove(selectedRequest.id)}
                          disabled={isProcessing}
                          className="flex-[2] py-5 bg-slate-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:bg-black active:scale-95 transition-all"
                       >
                          {isProcessing ? <Mini5GMicroLoader size={20} /> : <Zap size={20} className="text-blue-400" />}
                          Execute Logic & Activate
                       </button>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-32 space-y-10 animate-in zoom-in-95 duration-700">
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full scale-150 animate-pulse" />
                    <div className="w-48 h-48 bg-slate-50 rounded-[4rem] flex items-center justify-center text-slate-100 border-[8px] border-dashed border-slate-100 relative shadow-inner">
                       <Cpu size={120} strokeWidth={1} />
                       <div className="absolute -top-6 -left-6 w-16 h-16 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-blue-500 border border-slate-100">
                          <Zap size={36} />
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-300 uppercase italic tracking-tighter leading-none mb-2">Provisioning Hub Idle</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">Select a service request from the operational registry to initiate the network deployment handshake and activation.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
