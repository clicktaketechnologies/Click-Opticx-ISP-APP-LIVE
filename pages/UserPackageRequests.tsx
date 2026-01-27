import React, { useMemo, useState } from 'react';
import { AppState, PackageRequest } from '../types';
import { db } from '../db';
import { 
  CheckCircle, XCircle, Clock, Zap, 
  User, ShieldCheck, ChevronRight, Activity, 
  HardDrive, AlertTriangle, Layers, Banknote, Globe, Landmark,
  ShieldAlert, RefreshCw
} from 'lucide-react';

const UserPackageRequests: React.FC<{ state: AppState }> = ({ state }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const pendingRequests = useMemo(() => 
    state.packageRequests.filter(r => r.status === 'Pending').sort((a,b) => b.timestamp.localeCompare(a.timestamp)), 
    [state.packageRequests]
  );

  const handleApprove = async (reqId: string) => {
    const req = pendingRequests.find(r => r.id === reqId);
    setIsProcessing(reqId);
    await db.approvePackageRequest(reqId);
    setIsProcessing(null);
    db.logNotification(req?.userId || 'all', 'success', 'Request Approved', 'Subscribed provisioned.');
  };

  const handleReject = async (reqId: string) => {
    const reason = prompt("Enter Rejection Reason for Subscriber:");
    if (reason === null) return;
    setIsProcessing(reqId);
    await db.rejectPackageRequest(reqId);
    setIsProcessing(null);
  };

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'Cash': return <Banknote size={16} className="text-emerald-500" />;
      case 'Home Collection': return <Landmark size={16} className="text-purple-500" />;
      case 'Online': case 'Stripe': return <Globe size={16} className="text-blue-500" />;
      default: return <Activity size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Zap className="text-orange-500" size={32} />
            Activation Queue
          </h2>
          <p className="text-slate-500 font-medium">Provision bandwidth tiers for subscribers awaiting validation of offline payments.</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-sm font-black text-slate-700">{pendingRequests.length} Pending Actions</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {pendingRequests.map(req => (
           <div key={req.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border border-blue-100 group-hover:rotate-6 transition-transform">
                       <User size={32} />
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic leading-none mb-1">{req.userName}</h4>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(req.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">Verification Req.</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Target Tier</p>
                    <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">{req.packageName}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Payment Protocol</p>
                    <div className="flex items-center gap-2">
                       {getMethodIcon(req.paymentMethod)}
                       <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">{req.paymentMethod}</p>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 relative z-10">
                 <button 
                   disabled={!!isProcessing}
                   onClick={() => handleReject(req.id)}
                   className="flex-1 py-5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95"
                 >
                    Reject Identity
                 </button>
                 <button 
                   disabled={!!isProcessing}
                   onClick={() => handleApprove(req.id)}
                   className="flex-[2] py-5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    {isProcessing === req.id ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={20} />}
                    Authorize Provisioning
                 </button>
              </div>
              <Activity className="absolute -right-12 -bottom-12 opacity-[0.03] scale-[3]" size={200} />
           </div>
         ))}
         
         {pendingRequests.length === 0 && (
           <div className="col-span-full bg-white p-32 rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center text-center">
              <ShieldCheck className="text-slate-100 mb-8" size={80} />
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">Handshake Queue Synchronized</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pending activation requests detected in registry nodes.</p>
           </div>
         )}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
         <div className="relative z-10 max-w-xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
               <ShieldAlert size={28} />
               <h3 className="text-xl font-black uppercase tracking-tight">Authority Guideline</h3>
            </div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">Approving a request will immediately generate a validated invoice and update the subscriber's expiry date in the persistent registry. Rejected requests will notify the user via the ISP App dashboard.</p>
         </div>
         <HardDrive className="absolute -right-8 -bottom-8 opacity-5" size={240} />
      </div>
    </div>
  );
};

export default UserPackageRequests;