
import React from 'react';
import { 
  X, Zap, Gauge, Headphones, RefreshCw, 
  ShieldAlert, Globe, Activity, Smartphone, Signal 
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onAction: (tab: string) => void;
}

const OperationalToolOverlay: React.FC<Props> = ({ onClose, onAction }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[600] flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-t-[3.5rem] p-10 space-y-10 animate-in slide-in-from-bottom duration-500 border-t-8 border-indigo-600">
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Zap size={24} fill="currentColor" />
               </div>
               <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Operational Core</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Override v5.2</p>
               </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl active:scale-90 transition-transform">
               <X size={24} />
            </button>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { onAction('network'); onClose(); }}
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-emerald-500 transition-all text-left group"
            >
               <Gauge size={28} className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Diagnostic Scan</h4>
               <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Full Link Handshake</p>
            </button>
            <button 
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-500 transition-all text-left group"
              onClick={() => { alert("Router Restart Signal Dispatched to Node MAC..."); onClose(); }}
            >
               <RefreshCw size={28} className="text-blue-500 mb-4 group-hover:rotate-180 transition-transform duration-700" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Node Reset</h4>
               <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Cold Boot Protocol</p>
            </button>
            <button 
              onClick={() => { onAction('support'); onClose(); }}
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-500 transition-all text-left group"
            >
               <Headphones size={28} className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Registry Help</h4>
               <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Human Dispatch</p>
            </button>
            <button 
              className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 hover:bg-rose-600 hover:text-white transition-all text-left group"
              onClick={() => { onAction('wallet'); onClose(); }}
            >
               <ShieldAlert size={28} className="text-rose-600 mb-4 group-hover:text-white group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Emergency Credit</h4>
               <p className="text-[8px] font-black mt-2 uppercase opacity-60">Handshake Override</p>
            </button>
         </div>

         <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Network POP Node</p>
               <h4 className="text-xl font-black italic text-indigo-400">KHI-NORTH-Z2</h4>
            </div>
            <Signal className="text-white/10 absolute -right-4 -bottom-4" size={120} />
            <div className="relative z-10 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase">
               Synced
            </div>
         </div>
      </div>
    </div>
  );
};

export default OperationalToolOverlay;
