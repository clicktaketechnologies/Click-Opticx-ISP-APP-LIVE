
import React from 'react';
import { AppState, ISPUser } from '../../../types';
// Added Info to the imports
import { 
  Bot, Sparkles, BarChart3, ShieldAlert, 
  Zap, ChevronRight, Activity, Cpu, 
  MessageSquare, LayoutGrid, HeartPulse, Info
} from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onNavigate: (tab: string) => void;
}

const SubscriberAIHome: React.FC<Props> = ({ user, state, onNavigate }) => {
  const aiActions = [
    { id: 'ai-insights', label: 'Internet Insights', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Usage behavior analysis' },
    { id: 'ai-risk', label: 'Risk & Alerts', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Trust & credit rank audit' },
    { id: 'ai-suggestions', label: 'AI Suggestions', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Personalized plan optimization' },
    { id: 'aichat', label: 'Talk to AI', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Ask about bills or speed' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* AI Hero Banner */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
               <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
                  <Cpu size={28} className="text-blue-400 animate-pulse" />
               </div>
               <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-blue-300">Heuristic Node v8.5</span>
            </div>
            <div>
               <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">AI Command Center</h2>
               <p className="text-xs font-bold text-slate-400 uppercase mt-2 opacity-80">Autonomous Advisor for your Subscriber Link</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Advisor Status: Operational</span>
            </div>
         </div>
         <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
      </div>

      {/* Credit Summary Insight - Now points to the Control Plane for WOW factor */}
      <button 
        onClick={() => onNavigate('ai-control')}
        className="w-full bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
      >
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-950 text-blue-400 rounded-3xl flex items-center justify-center border border-slate-800 shadow-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
               <Cpu size={32} className="animate-pulse" />
            </div>
            <div className="text-left">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Central Intelligence Hub</p>
               <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">AI Control Plane</h4>
               <p className="text-[9px] text-blue-600 font-bold uppercase mt-1">Smart Access Node {user?.creditScore || 600} Integrity</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Enter Plane</span>
            <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" size={24} />
         </div>
      </button>

      {/* Grid of AI Sub-Modules */}
      <div className="grid grid-cols-2 gap-4">
         {aiActions.map(action => (
           <button 
             key={action.id}
             onClick={() => onNavigate(action.id)}
             className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col gap-4 text-left relative overflow-hidden"
           >
              <div className={`w-14 h-14 ${action.bg} ${action.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform z-10`}>
                 <action.icon size={28} />
              </div>
              <div className="z-10">
                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{action.label}</h4>
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{action.desc}</p>
              </div>
              <action.icon size={80} className="absolute -right-4 -bottom-4 opacity-[0.02] text-slate-950 pointer-events-none group-hover:scale-125 transition-transform duration-700" />
           </button>
         ))}
      </div>

      {/* Info Card */}
      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[3rem] flex items-start gap-6 shadow-sm mx-1">
         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-blue-600 border border-blue-50">
            <Info size={28} />
         </div>
         <div className="flex-1">
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1">Architecture Note</p>
            <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase opacity-80">
               Your AI Advisor analyze historical node handshakes. No administrative data is exposed. AI acts as a read-only telemetry consumer.
            </p>
         </div>
      </div>
    </div>
  );
};

export default SubscriberAIHome;

