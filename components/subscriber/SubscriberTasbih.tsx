
import React, { useState } from 'react';
import { RotateCcw, Target, Layers, Sparkles, Fingerprint, History } from 'lucide-react';

const SubscriberTasbih: React.FC = () => {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [isPulsing, setIsPulsing] = useState(false);

  const increment = () => {
    setCount(c => c + 1);
    setIsPulsing(true);
    if ('vibrate' in navigator) navigator.vibrate(10);
    setTimeout(() => setIsPulsing(false), 100);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 flex flex-col items-center">
      <div className="text-center space-y-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Digital Counting</h3>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Digital Tasbih</h2>
      </div>

      <div className="relative">
        <div className={`w-72 h-72 bg-slate-950 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border-[12px] border-slate-900 flex flex-col items-center justify-center transition-all duration-150 ${isPulsing ? 'scale-95 border-blue-600 shadow-blue-500/20' : ''}`}>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Current Count</p>
           <h2 className="text-8xl font-black text-white italic tracking-tighter leading-none">{count}</h2>
           <p className="text-[11px] font-black text-slate-600 uppercase mt-4">Target: {target}</p>
        </div>
        <button 
          onClick={() => setCount(0)}
          className="absolute -right-4 -top-4 p-5 bg-white rounded-3xl shadow-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90 border border-slate-100"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        {[33, 99, 1000].map(v => (
          <button 
            key={v}
            onClick={() => setTarget(v)}
            className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${target === v ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100'}`}
          >
            Tier {v}
          </button>
        ))}
      </div>

      <button 
        onClick={increment}
        className="w-48 h-48 bg-blue-600 text-white rounded-full shadow-[0_30px_60px_rgba(79,70,229,0.3)] hover:bg-blue-700 active:scale-90 transition-all flex flex-col items-center justify-center group border-[8px] border-white/20"
      >
        <Fingerprint size={64} className="group-hover:scale-110 transition-transform mb-2" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">Count</span>
      </button>

      <div className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm flex items-center justify-between text-white shadow-xl relative overflow-hidden">
         <div className="relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Progress Tiers</p>
            <h4 className="text-xl font-black text-blue-400 italic">Keep tracking your spiritual cycles digitally.</h4>
         </div>
         <History className="text-blue-500/20 absolute -right-4 -bottom-4" size={100} />
      </div>
    </div>
  );
};

export default SubscriberTasbih;

