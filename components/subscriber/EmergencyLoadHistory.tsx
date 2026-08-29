
import React, { useMemo } from 'react';
import { ISPUser, AppState } from '../../types';
import { db } from '../../db';
// Added missing CheckCircle icon to imports
import { ArrowLeft, History, ShieldCheck, Zap, CreditCard, ChevronRight, Clock, ShieldAlert, Circle, Activity, CheckCircle } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
}

const EmergencyLoadHistory: React.FC<Props> = ({ user, state, onBack }) => {
  const history = useMemo(() => 
    state.emergencyLoads
      .filter(l => l.userId === user.id)
      .sort((a,b) => b.timestamp.localeCompare(a.timestamp)),
  [state.emergencyLoads, user.id]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Settled': case 'Paid': return 'text-green-500 bg-green-50 border-green-100';
      case 'Overdue': return 'text-rose-500 bg-rose-50 border-rose-100';
      case 'Active': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'Pending_Activation': return 'text-blue-500 bg-blue-50 border-blue-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
       <div className="flex items-center gap-4 px-2">
          <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm active:scale-90 transition-all">
             <ArrowLeft size={20} />
          </button>
          <div>
             <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Rescue Audit</h2>
             <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Registry Timeline Handshakes</p>
          </div>
       </div>

       <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b bg-slate-50 flex items-center justify-between sticky top-0 z-20">
             <div className="flex items-center gap-3">
                <History size={20} className="text-blue-600" />
                <h3 className="text-sm font-black uppercase tracking-widest italic">Behavioral Cycle Log</h3>
             </div>
             <span className="px-3 py-1 bg-white border rounded-full text-[9px] font-black text-slate-400 uppercase">{history.length} Handshakes</span>
          </div>

          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[700px] custom-scrollbar">
             {history.length === 0 ? (
               <div className="p-32 text-center flex flex-col items-center">
                  <ShieldCheck size={64} className="text-slate-50 mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No rescue events recorded in node registry.</p>
               </div>
             ) : (
               history.map(log => (
                 <div key={log.id} className="p-8 hover:bg-slate-50 transition-all group border-l-4 border-transparent hover:border-blue-600">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-all ${log.repaid ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                             {/* CheckCircle icon fixed */}
                             {log.repaid ? <CheckCircle size={24}/> : <Zap size={24}/>}
                          </div>
                          <div>
                             <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Cycle #{log.id.split('-').pop()}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()} • Authorized Rs. {log.amount}</p>
                          </div>
                       </div>
                       <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusColor(log.status)}`}>
                          {log.status.replace('_', ' ')}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                       <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Settlement Pulse</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase italic">
                             {log.repaid ? `Settled ${new Date(log.settledAt || log.timestamp).toLocaleDateString()}` : 'Outstanding Registry Debt'}
                          </p>
                       </div>
                       <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorized Plan</p>
                          <p className="text-[10px] font-bold text-slate-600 uppercase italic truncate">
                             {log.packageId ? (state.packages.find(p => p.id === log.packageId)?.name || 'Rescue Tier') : 'Manual Credit'}
                          </p>
                       </div>
                    </div>
                    
                    {log.extensions && log.extensions.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
                         <div className="flex items-center gap-2 text-blue-600">
                            <Clock size={12} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Admin Extensions Granted</span>
                         </div>
                         {log.extensions.map(ext => (
                           <div key={ext.id} className="text-[9px] text-blue-800 font-bold uppercase leading-none italic pl-2 border-l border-blue-200">
                              New Due: {new Date(ext.newDueDate).toLocaleDateString()} • {ext.reason}
                           </div>
                         ))}
                      </div>
                    )}
                 </div>
               ))
             )}
          </div>
       </div>

       <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex items-center justify-between relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
             <h4 className="text-xl font-black italic uppercase tracking-tighter text-blue-400">Heuristic Summary</h4>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total Lifetime Rescue Credits: {history.length}</p>
          </div>
          <Activity className="absolute -right-10 -bottom-10 opacity-10" size={140} />
          <div className="relative z-10 px-5 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase">
             Trust Tier: Standard
          </div>
       </div>
    </div>
  );
};

export default EmergencyLoadHistory;

