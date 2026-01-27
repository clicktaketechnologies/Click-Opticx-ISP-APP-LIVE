
import React, { useMemo, useState, useEffect } from 'react';
import { ISPUser, AppState, EmergencyLoad } from '../../types';
import { db } from '../../db';
// Added missing Activity and Info icons to imports
import { Zap, ShieldAlert, Clock, ArrowRight, History, CreditCard, AlertTriangle, CheckCircle, Smartphone, RefreshCw, BarChart3, Activity, Info } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onAction: (tab: string) => void;
}

const EmergencyLoadDashboard: React.FC<Props> = ({ user, state, onAction }) => {
  const activeEL = useMemo(() => 
    state.emergencyLoads.find(l => l.userId === user.id && !l.repaid && l.status !== 'Cancelled'),
  [state.emergencyLoads, user.id]);

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!activeEL) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = activeEL.status === 'Pending_Activation' 
        ? new Date(activeEL.lockedUntil).getTime()
        : new Date(activeEL.expiryTimestamp).getTime();
      
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(activeEL.status === 'Pending_Activation' ? 'Syncing...' : 'Expired');
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEL]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Dynamic Status Hero */}
      {!activeEL ? (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-8">
             <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                   <Zap size={32} fill="currentColor"/>
                </div>
                <div className="px-4 py-1.5 bg-white/10 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-indigo-300">Rescue Node Available</div>
             </div>
             <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Emergency Rescue</h2>
                <p className="text-xs font-bold text-slate-400 uppercase mt-2 opacity-80 leading-relaxed max-w-sm">
                   Need instant connectivity? Authorize a Rs. 2,500 emergency advance to reactivate your link for 72 hours.
                </p>
             </div>
             <button onClick={() => onAction('emergency-request')} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                Initialize Protocol <ArrowRight size={18} />
             </button>
          </div>
          <AlertTriangle className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
        </div>
      ) : (
        <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all duration-700 ${activeEL.status === 'Overdue' ? 'bg-rose-600' : activeEL.status === 'Pending_Activation' ? 'bg-indigo-600' : 'bg-amber-600'}`}>
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                 <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
                    {activeEL.status === 'Pending_Activation' ? <RefreshCw className="animate-spin" size={32} /> : <ShieldAlert size={32} />}
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Protocol Status</p>
                    <p className="text-lg font-black italic uppercase tracking-tighter leading-none mt-1">{activeEL.status.replace('_', ' ')}</p>
                 </div>
              </div>

              <div className="space-y-2">
                 <p className="text-5xl font-black italic tracking-tighter drop-shadow-lg">Rs. {activeEL.amount}</p>
                 <p className="text-[10px] font-black uppercase text-white/70 tracking-[0.4em]">Settlement Balance Due</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 bg-white/10 rounded-[2rem] border border-white/10">
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Time Remaining</p>
                    <p className="text-xl font-black italic leading-none">{timeLeft}</p>
                 </div>
                 <div className="p-5 bg-white/10 rounded-[2rem] border border-white/10">
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Due Threshold</p>
                    <p className="text-xl font-black italic leading-none">{new Date(activeEL.expiryTimestamp).toLocaleDateString()}</p>
                 </div>
              </div>

              {activeEL.status !== 'Pending_Activation' && (
                 <button onClick={() => onAction('wallet')} className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    Settle Handshake Now <CreditCard size={18} />
                 </button>
              )}
           </div>
           {/* Activity icon fixed */}
           <Activity className="absolute -right-16 -bottom-16 opacity-5 scale-[2.5]" size={280} />
        </div>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 gap-4">
         <button onClick={() => onAction('emergency-history')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
               <History size={24} />
            </div>
            <div>
               <p className="text-xs font-black text-slate-900 uppercase">Audit Log</p>
               <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">History Registry</p>
            </div>
         </button>
         <button onClick={() => onAction('ai-risk')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
               <BarChart3 size={24} />
            </div>
            <div>
               <p className="text-xs font-black text-slate-900 uppercase">Eligibility</p>
               <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Trust Ranking</p>
            </div>
         </button>
      </div>

      {/* Rules Note */}
      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[3rem] space-y-4">
         <div className="flex items-center gap-3 text-blue-600">
            {/* Info icon fixed */}
            <Info size={24} />
            <h4 className="text-xs font-black uppercase tracking-widest">System Protocols</h4>
         </div>
         <ul className="space-y-3">
            {[
              { label: 'Settlement Window', text: '72 hours to settle the debt registry.' },
              { label: 'Overdue Penalty', text: '-25 Credit Score impact on failure.' },
              { label: 'Frequency Node', text: 'Limited to once per monthly cycle.' }
            ].map((r, i) => (
              <li key={i} className="flex gap-3">
                 <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5"></div>
                 <p className="text-[10px] text-blue-800 font-bold uppercase leading-relaxed">
                   <span className="opacity-60">{r.label}:</span> {r.text}
                 </p>
              </li>
            ))}
         </ul>
      </div>
    </div>
  );
};

export default EmergencyLoadDashboard;
