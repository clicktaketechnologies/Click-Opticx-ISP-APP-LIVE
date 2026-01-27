
import React, { useMemo } from 'react';
import { AppState, ISPUser } from '../../types';
import { 
  BarChart3, ShieldCheck, ShieldAlert, History, TrendingUp, 
  TrendingDown, Info, Zap, CheckCircle, AlertTriangle, Sparkles 
} from 'lucide-react';

const SubscriberCreditScore: React.FC<{ user: ISPUser, state: AppState }> = ({ user, state }) => {
  const logs = useMemo(() => {
    return state.creditLogs
      .filter(l => l.userId === user.id)
      .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.creditLogs, user.id]);

  const getScoreRange = (score: number) => {
    if (score >= 750) return { label: 'Excellent', color: 'text-emerald-500', bar: 'bg-emerald-500', risk: '🟢 Low Risk', desc: 'Authorized for all advanced system operations.' };
    if (score >= 600) return { label: 'Good', color: 'text-blue-500', bar: 'bg-blue-500', risk: '🟡 Medium', desc: 'Standard system authority handshakes active.' };
    if (score >= 450) return { label: 'Fair', color: 'text-orange-500', bar: 'bg-orange-500', risk: '🟠 Warning', desc: 'Limited emergency load eligibility detected.' };
    return { label: 'Poor', color: 'text-red-500', bar: 'bg-red-500', risk: '🔴 High Risk', desc: 'Emergency protocols disabled. Immediate settlement required.' };
  };

  const range = getScoreRange(user.creditScore);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* 1. Score Radial Gauge Simulation */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col items-center">
         <div className="relative z-10 text-center space-y-4">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Fiscal Authority Registry</h3>
            <div className="relative w-56 h-32 flex items-center justify-center overflow-hidden">
               {/* Semi-circle Gauge */}
               <div className="absolute top-0 w-56 h-56 rounded-full border-[18px] border-white/5"></div>
               <div 
                 className={`absolute top-0 w-56 h-56 rounded-full border-[18px] transition-all duration-1000 ease-out border-t-transparent border-l-transparent`} 
                 style={{ 
                   borderColor: 'currentColor', 
                   color: range.color.replace('text-', ''),
                   transform: `rotate(${((user.creditScore / 900) * 180) - 135}deg)` 
                 }}
               ></div>
               <div className="absolute bottom-0 flex flex-col items-center">
                  <h2 className="text-6xl font-black italic tracking-tighter leading-none">{user.creditScore}</h2>
                  <p className={`text-[10px] font-black uppercase mt-1 ${range.color}`}>{range.label}</p>
               </div>
            </div>
            <div className="pt-6">
               <span className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest">{range.risk}</span>
            </div>
         </div>
         <BarChart3 className="absolute -right-10 -bottom-10 opacity-5 scale-150" size={240} />
      </div>

      {/* 2. Impact Summary */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
         <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck size={18} className="text-indigo-600"/> Audit Parameters
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{range.desc}</p>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase mb-3">Positive Gains</p>
               <div className="flex items-center gap-3 text-emerald-600">
                  <TrendingUp size={24}/>
                  <span className="text-2xl font-black italic">+{logs.filter(l => l.delta > 0).reduce((a,b) => a + b.delta, 0)}</span>
               </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <p className="text-[8px] font-black text-slate-400 uppercase mb-3">Penalty Impact</p>
               <div className="flex items-center gap-3 text-rose-600">
                  <TrendingDown size={24}/>
                  <span className="text-2xl font-black italic">-{Math.abs(logs.filter(l => l.delta < 0).reduce((a,b) => a + b.delta, 0))}</span>
               </div>
            </div>
         </div>
      </div>

      {/* 3. Logic Tips */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl">
         <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
               <Sparkles size={24} className="text-amber-400" />
               <h4 className="text-xl font-black uppercase italic tracking-tighter">AI Optimization Tips</h4>
            </div>
            <ul className="space-y-4">
               {[
                 { tip: 'Automate payments using Stripe for a consistent +10 boost.', icon: Zap },
                 { tip: 'Settle emergency loads within 24 hours for +20 loyalty points.', icon: ShieldCheck },
                 { tip: 'Maintain a 3-month streak of zero overdue bills for +30 bonus.', icon: CheckCircle }
               ].map((item, i) => (
                 <li key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center shrink-0"><item.icon size={12}/></div>
                    <p className="text-[10px] font-bold leading-relaxed uppercase opacity-80">{item.tip}</p>
                 </li>
               ))}
            </ul>
         </div>
         <Sparkles className="absolute -right-10 -bottom-10 opacity-10" size={200} />
      </div>

      {/* 4. Full Audit Trail */}
      <div className="space-y-4">
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Registry Event Log</h4>
         <div className="space-y-3">
            {logs.slice(0, 10).map(log => (
              <div key={log.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group shadow-sm">
                 <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${log.delta >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                       {log.delta >= 0 ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                    </div>
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[180px]">{log.reason}</p>
                       <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <p className={`text-sm font-black italic tracking-tighter ${log.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {log.delta >= 0 ? '+' : ''}{log.delta}
                 </p>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No credit events detected.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SubscriberCreditScore;
