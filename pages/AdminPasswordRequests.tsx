import React, { useMemo, useState } from 'react';
import { db } from '../db';
import { AppState, PasswordResetRequest } from '../types';
import { 
  Key, Clock, CheckCircle, XCircle, User, 
  Monitor, ShieldAlert, History, ShieldCheck, 
  ArrowRight, Activity, Search, Filter, Ban, RefreshCw
} from 'lucide-react';

const AdminPasswordRequests: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const pendingRequests = useMemo(() => {
    return (state.passwordRequests || [])
      .filter(r => r.status === 'Pending')
      .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.passwordRequests]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setIsProcessing(id);
    if (action === 'approve') {
      await db.approvePasswordRequest(id);
    } else {
      await db.rejectPasswordRequest(id);
    }
    setIsProcessing(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <Key className="text-amber-500" size={32} />
            Hardware Credential Queue
          </h2>
          <p className="text-slate-500 font-medium">Auditing subscriber Wi-Fi password reset handshakes and OLT push requests.</p>
        </div>
        <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase text-slate-700">{pendingRequests.length} Pending Handshakes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {pendingRequests.map(req => (
           <div key={req.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-8 relative z-10">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center border border-amber-100 group-hover:rotate-6 transition-transform">
                       <User size={32} />
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic leading-none mb-1">{req.userName}</h4>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(req.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">WIFI Protocol Reset</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Target SSID</p>
                    <p className="text-lg font-black text-slate-800 uppercase tracking-tighter truncate">{req.ssid}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Proposed Secret</p>
                    <p className="text-lg font-black text-slate-800 uppercase tracking-tighter truncate">••••••••</p>
                 </div>
              </div>

              <div className="flex gap-4 relative z-10">
                 <button 
                   disabled={!!isProcessing}
                   onClick={() => handleAction(req.id, 'reject')}
                   className="flex-1 py-5 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95"
                 >
                    Reject Identity
                 </button>
                 <button 
                   disabled={!!isProcessing}
                   onClick={() => handleAction(req.id, 'approve')}
                   className="flex-[2] py-5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                    {isProcessing === req.id ? <RefreshCw className="animate-spin" /> : <ShieldCheck size={20} />}
                    Push to Node
                 </button>
              </div>
              <Activity className="absolute -right-12 -bottom-12 opacity-[0.03] scale-[3] text-indigo-900 pointer-events-none" size={200} />
           </div>
         ))}
         
         {pendingRequests.length === 0 && (
           <div className="col-span-full bg-white p-32 rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center text-center">
              <ShieldCheck className="text-slate-100 mb-8" size={80} />
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">Queue Synchronized</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pending password reset handshakes detected in the registry.</p>
           </div>
         )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <History size={14} className="text-indigo-600"/> Handshake Audit Trail
            </h3>
         </div>
         <div className="divide-y divide-slate-50">
            {state.passwordRequests.filter(r => r.status !== 'Pending').slice(0, 10).map(req => (
               <div key={req.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${req.status === 'Applied' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {req.status === 'Applied' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-900 uppercase italic">{req.userName}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{req.timestamp}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase text-slate-500">SSID: {req.ssid}</p>
                     <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${req.status === 'Applied' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{req.status}</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default AdminPasswordRequests;