
import React, { useMemo } from 'react';
import { ArrowLeft, History, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { db } from '../../db';
import { ISPUser } from '../../types';

interface Props {
  onClose: () => void;
}

const ReferralPointsHistory: React.FC<Props> = ({ onClose }) => {
  const state = db.getState();
  const user = state.currentUser as ISPUser;

  const logs = useMemo(() => {
    const activations = state.referrals
      .filter(r => r.referrerId === user.id && r.status === 'Activated')
      .map(r => ({
        id: r.id,
        type: 'Credit',
        amount: r.pointsAwarded,
        reason: `Friend Activated: ${r.referredUserName}`,
        timestamp: r.timestamp
      }));

    const withdrawals = state.withdrawalRequests
      .filter(w => w.userId === user.id)
      .map(w => ({
        id: w.id,
        type: 'Withdrawal',
        amount: -w.points,
        reason: `Conversion Payout (${w.status})`,
        timestamp: w.timestamp
      }));

    return [...activations, ...withdrawals].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.referrals, state.withdrawalRequests, user.id]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-24">
      <div className="flex items-center gap-4 px-4 pt-4">
         <button onClick={onClose} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 shadow-sm active:scale-90 transition-all">
            <ArrowLeft size={20} />
         </button>
         <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic">Registry History</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Audit Protocol v2.1</p>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col mx-2 min-h-[500px]">
         <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14} className="text-blue-500"/> Pulse Event Log</h3>
            <span className="text-[9px] font-black text-slate-500 bg-white border px-3 py-1 rounded-full">{logs.length} Events</span>
         </div>
         <div className="divide-y divide-slate-50 overflow-y-auto flex-1 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center">
                 <ShieldCheck size={48} className="text-slate-100 mb-6" />
                 <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Registry node empty.</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group">
                   <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${log.amount > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                         {log.amount > 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.reason}</p>
                         <div className="flex items-center gap-1.5 mt-1">
                            <Clock size={10} className="text-slate-300" />
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                         </div>
                      </div>
                   </div>
                   <p className={`text-lg font-black italic tracking-tighter ${log.amount > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                      {log.amount > 0 ? '+' : ''}{(log.amount || 0).toLocaleString()}
                   </p>
                </div>
              ))
            )}
         </div>
      </div>
    </div>
  );
};

export default ReferralPointsHistory;

