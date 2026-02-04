
import React, { useMemo } from 'react';
import { ISPUser, AppState } from '../../../types';
import { ArrowLeft, BarChart3, ShieldCheck, ShieldAlert, History, TrendingUp, Sparkles, Activity, Clock } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
}

const SubscriberAIRisk: React.FC<Props> = ({ user, state, onBack }) => {
  const range = useMemo(() => {
    const score = user.creditScore;
    if (score >= 750) return { label: 'Excellent', color: 'text-emerald-500', bar: 'bg-emerald-500', icon: ShieldCheck, desc: 'Highest trust node level active.' };
    if (score >= 600) return { label: 'Good', color: 'text-blue-500', bar: 'bg-blue-500', icon: ShieldCheck, desc: 'Stable system handshake maintained.' };
    return { label: 'Fair', color: 'text-amber-500', bar: 'bg-amber-500', icon: ShieldAlert, desc: 'Node requires behavioral optimization.' };
  }, [user.creditScore]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
      <div className="flex items-center gap-4 px-2">
         <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 active:scale-90 transition-all shadow-sm">
            <ArrowLeft size={20} />
         </button>
         <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Fiscal Risk</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Trust Registry Pulse</p>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col items-center">
         <div className="relative z-10 text-center space-y-6 w-full">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-10">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Identity Trust Node</p>
               <range.icon size={20} className={range.color} />
            </div>
            
            <div className="flex flex-col items-center">
               <h2 className="text-8xl font-black italic tracking-tighter text-white leading-none drop-shadow-2xl">{user.creditScore}</h2>
               <p className={`text-sm font-black uppercase mt-4 ${range.color} tracking-[0.3em]`}>{range.label} RANK</p>
            </div>

            <div className="pt-10 w-full space-y-2">
               <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 px-1">
                  <span>Baseline 300</span>
                  <span>Max 900</span>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div className={`h-full ${range.bar} transition-all duration-1000 ease-out`} style={{ width: `${((user.creditScore - 300) / 600) * 100}%` }}></div>
               </div>
            </div>
         </div>
         <BarChart3 className="absolute -right-12 -bottom-12 opacity-5 scale-[2.5]" size={240} />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-8">
         <div className="flex items-center gap-3">
            <History size={24} className="text-indigo-600" />
            <h4 className="text-sm font-black uppercase italic tracking-widest text-slate-900">Behavioral Synthesis</h4>
         </div>
         <div className="space-y-4">
            {[
              { label: 'Payment Consistency', impact: '+12', color: 'text-emerald-600', icon: TrendingUp },
              { label: 'Emergency Load Usage', impact: '-5', color: 'text-rose-600', icon: Activity },
              { label: 'Registry Loyalty', impact: '+8', color: 'text-emerald-600', icon: Sparkles }
            ].map(log => (
              <div key={log.label} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 border shadow-sm">
                       <log.icon size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{log.label}</span>
                 </div>
                 <span className={`text-sm font-black italic ${log.color}`}>{log.impact}</span>
              </div>
            ))}
         </div>
      </div>

      <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm mx-1">
         <ShieldAlert className="text-amber-600 mt-1 shrink-0" size={28} />
         <div>
            <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1 italic">Eligibility Insight</p>
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase opacity-80">
               Maintain a score above 600 to keep the Emergency Load protocol active. Automated settlement triggers a +20 point bonus handshake.
            </p>
         </div>
      </div>
    </div>
  );
};

export default SubscriberAIRisk;
