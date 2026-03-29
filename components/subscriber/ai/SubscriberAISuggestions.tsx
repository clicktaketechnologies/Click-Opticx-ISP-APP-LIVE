
import React from 'react';
import { AppState, ISPUser } from '../../../types';
import { ArrowLeft, Sparkles, Zap, Wallet, Trophy, ArrowRight, ChevronRight, Package, RefreshCw } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
  onAction: (tab: string) => void;
}

const SubscriberAISuggestions: React.FC<Props> = ({ user, state, onBack, onAction }) => {
  const suggestions = [
    { 
      id: 'upgrade', 
      title: 'Performance Link Optimal', 
      desc: 'High evening traffic detected. Moving to 50M tier would reduce buffer lag by 22%.',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      actionLabel: 'View Plans',
      actionTab: 'packages'
    },
    { 
      id: 'wallet', 
      title: 'Fiscal Handshake Required', 
      desc: 'Low balance (Rs. 240) detected. Top-up before Friday to prevent node suspension.',
      icon: Wallet,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      actionLabel: 'Refill Wallet',
      actionTab: 'wallet'
    },
    { 
      id: 'referral', 
      title: 'Registry Bonus Ready', 
      desc: 'You have 0 active referrals. Share your link to earn Rs 500 per node activation.',
      icon: Trophy,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      actionLabel: 'Get Credits',
      actionTab: 'referral'
    }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
      <div className="flex items-center gap-4 px-2">
         <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 active:scale-90 transition-all shadow-sm">
            <ArrowLeft size={20} />
         </button>
         <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Suggestions</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Optimization Orchestrator</p>
         </div>
      </div>

      <div className="space-y-4">
         {suggestions.map(sug => (
           <div key={sug.id} className="bg-white rounded-[3rem] p-8 border-2 border-slate-100 shadow-sm hover:border-blue-500 transition-all group overflow-hidden relative">
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 ${sug.bg} ${sug.color} rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110`}>
                       <sug.icon size={28} />
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight leading-none mb-1">{sug.title}</h4>
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Heuristic Recommendation</p>
                    </div>
                 </div>

                 <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase pl-1">{sug.desc}</p>

                 <button 
                  onClick={() => onAction(sug.actionTab)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-200"
                 >
                    {sug.actionLabel} <ArrowRight size={14} />
                 </button>
              </div>
              <sug.icon size={140} className="absolute -right-8 -bottom-8 opacity-[0.02] text-slate-950 pointer-events-none group-hover:scale-125 transition-transform duration-700" />
           </div>
         ))}
      </div>

      <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col items-center text-center space-y-4 relative overflow-hidden">
         <div className="relative z-10 w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/10 mb-2">
            <RefreshCw size={28} className="text-blue-400" />
         </div>
         <h4 className="relative z-10 text-xl font-black uppercase italic tracking-tight">Real-time Recalibration</h4>
         <p className="relative z-10 text-[9px] text-slate-500 font-bold uppercase leading-relaxed max-w-xs">AI suggestions refresh every 6 hours based on your node's physical and fiscal handshake data.</p>
         <Sparkles className="absolute -right-12 -bottom-12 opacity-5 scale-150" size={200} />
      </div>
    </div>
  );
};

export default SubscriberAISuggestions;

