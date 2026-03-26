
import React, { useMemo } from 'react';
import { 
  X, Zap, Gauge, Headphones, RefreshCw, 
  ShieldAlert, Globe, Activity, Smartphone, Wifi, Wallet, MessageSquare, Cpu
} from 'lucide-react';
import { Role } from '../../types';
import { db } from '../../db';

interface Props {
  onClose: () => void;
  onAction: (tab: any) => void;
}

const SubscriberQuickActions: React.FC<Props> = ({ onClose, onAction }) => {
  const state = db.getState();
  const isAdmin = useMemo(() => {
    const role = state.currentUser?.role;
    return role === Role.SUPER_ADMIN || role === Role.ADMIN;
  }, [state.currentUser]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[600] flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-t-[3.5rem] p-10 space-y-10 animate-in slide-in-from-bottom duration-500 border-t-8 border-indigo-600">
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Zap size={24} fill="currentColor" />
               </div>
               <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Command Override</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Direct Link v6.0</p>
               </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl active:scale-90 transition-transform">
               <X size={24} />
            </button>
         </div>

         <div className="grid grid-cols-2 gap-4">
            {isAdmin && (
              <button 
                onClick={() => { onAction('ai-control'); onClose(); }}
                className="p-8 bg-slate-950 rounded-[2.5rem] border border-indigo-900/20 hover:bg-indigo-900 transition-all text-left group shadow-2xl col-span-2"
              >
                 <Cpu size={28} className="text-indigo-400 group-hover:text-white mb-4 group-hover:scale-110 transition-transform animate-pulse" />
                 <h4 className="text-[11px] font-black uppercase tracking-widest leading-none text-white">Full AI Control Plane</h4>
                 <p className="text-[8px] font-bold mt-2 uppercase opacity-60 text-indigo-200">Administrative Oversight Handshake</p>
              </button>
            )}
            <button 
              onClick={() => { onAction('aichat'); onClose(); }}
              className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 hover:bg-blue-600 hover:text-white transition-all text-left group shadow-lg shadow-blue-100"
            >
               <MessageSquare size={28} className="text-blue-600 group-hover:text-white mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">AI Assistant</h4>
               <p className="text-[8px] font-bold mt-2 uppercase opacity-60">24/7 Digital Hub</p>
            </button>
            <button 
              onClick={() => { onAction('online_pay'); onClose(); }}
              className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all text-left group shadow-lg shadow-emerald-100"
            >
               <Globe size={28} className="text-emerald-600 group-hover:text-white mb-4 group-hover:rotate-180 transition-transform duration-700" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Quick Pay</h4>
               <p className="text-[8px] font-bold mt-2 uppercase opacity-60">Instant Link</p>
            </button>
            <button 
              onClick={() => { onAction('network'); onClose(); }}
              className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-slate-900 hover:text-white transition-all text-left group"
            >
               <Gauge size={28} className="text-slate-900 group-hover:text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Diag Pulse</h4>
               <p className="text-[8px] font-bold mt-2 uppercase opacity-60">System Check</p>
            </button>
            <button 
              className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 hover:bg-rose-600 hover:text-white transition-all text-left group shadow-lg shadow-rose-100"
              onClick={() => { onAction('emergency'); onClose(); }}
            >
               <ShieldAlert size={28} className="text-rose-600 group-hover:text-white mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">Rescue Load</h4>
               <p className="text-[8px] font-black mt-2 uppercase opacity-60">Force Active</p>
            </button>
         </div>

         <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Public Node IP</p>
               <h4 className="text-xl font-black italic text-emerald-400">182.164.3.42</h4>
            </div>
            <Wifi className="text-white/10 absolute -right-4 -bottom-4" size={120} />
            <div className="relative z-10 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase">
               Secured
            </div>
         </div>
      </div>
    </div>
  );
};

export default SubscriberQuickActions;
