
import React from 'react';
import { ISPUser, AppState } from '../../../types';
import { ArrowLeft, Wifi, Activity, ShieldCheck, HardDrive, Cpu, Zap, Wifi } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
}

const SubscriberAINetwork: React.FC<Props> = ({ user, state, onBack }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
      <div className="flex items-center gap-4 px-2">
         <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 active:scale-90 transition-all shadow-sm">
            <ArrowLeft size={20} />
         </button>
         <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Network Pulse</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Infrastructure Handshake Audit</p>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col items-center text-center space-y-10">
            <div className="space-y-2">
               <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Stability Rank</p>
               <h3 className="text-7xl font-black text-emerald-400 italic tracking-tighter leading-none">EXCEL</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-8 w-full border-t border-white/5 pt-10">
               <div className="flex flex-col items-center gap-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase">Jitter Node</span>
                  <p className="text-lg font-black italic">1.2<span className="text-[9px] opacity-30">ms</span></p>
               </div>
               <div className="flex flex-col items-center gap-2 border-x border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase">Packet Loss</span>
                  <p className="text-lg font-black italic">0.0<span className="text-[9px] opacity-30">%</span></p>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase">Signal Power</span>
                  <p className="text-lg font-black italic">-18.4<span className="text-[9px] opacity-30">dBm</span></p>
               </div>
            </div>
         </div>
         <Wifi className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-8">
         <div className="flex items-center gap-3">
            <Cpu size={24} className="text-indigo-600" />
            <h4 className="text-sm font-black uppercase italic tracking-widest text-slate-900">AI Observation Log</h4>
         </div>
         <div className="space-y-4">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-start gap-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
               <p className="text-[10px] text-slate-600 font-bold uppercase leading-relaxed">"Your connection is stable. Minor fluctuations detected at night due to regional node humidity variance, but link integrity remained at 99.4%."</p>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-start gap-4">
               <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
               <p className="text-[10px] text-slate-600 font-bold uppercase leading-relaxed">"Authorized Link: Handshake established with OLT-CENTRAL-05 via GPON protocol."</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 text-center">
            <Wifi size={24} className="text-blue-500" />
            <p className="text-[10px] font-black text-slate-900 uppercase">DNS Response</p>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black">FAST</span>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 text-center">
            <ShieldCheck size={24} className="text-indigo-500" />
            <p className="text-[10px] font-black text-slate-900 uppercase">Enc. Handshake</p>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black">SECURE</span>
         </div>
      </div>
    </div>
  );
};

export default SubscriberAINetwork;
