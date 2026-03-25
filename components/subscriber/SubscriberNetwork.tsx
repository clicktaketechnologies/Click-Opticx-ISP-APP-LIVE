import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

import React, { useState } from 'react';
import { Gauge, Play, Loader2, ArrowDownCircle, ArrowUpCircle, Activity, Globe, Wifi, ShieldCheck, HardDrive } from 'lucide-react';

const SubscriberNetwork: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ dl: number, ul: number, ping: number } | null>(null);

  const startTest = () => {
    setIsTesting(true);
    setResults(null);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsTesting(false);
        setResults({
          dl: Number((Math.random() * 40 + 60).toFixed(1)),
          ul: Number((Math.random() * 20 + 30).toFixed(1)),
          ping: Math.floor(Math.random() * 15 + 5)
        });
      }
    }, 50);
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Network Status</h3>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Connection Check</h2>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center z-10">
          <div className="absolute inset-0 rounded-full border-[15px] border-slate-50"></div>
          <div className="absolute inset-0 rounded-full border-[15px] border-blue-500 transition-all duration-300 border-t-transparent border-r-transparent border-l-transparent" style={{ transform: `rotate(${progress * 3.6}deg)` }}></div>
          <div className="flex flex-col items-center">
            <h2 className="text-6xl font-black text-slate-900 italic tracking-tighter">
              {isTesting ? (progress * 0.96).toFixed(1) : (results ? results.dl : '0.0')}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Mbps Download</p>
          </div>
        </div>

        <button
          onClick={startTest}
          disabled={isTesting}
          className="w-full max-w-sm py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4 relative z-10"
        >
          {isTesting ? <Mini5GMicroLoader size={20} /> : <Play size={20} fill="currentColor" />}
          {isTesting ? 'Checking Connection...' : 'Start Test'}
        </button>

        <Activity className="absolute -right-12 -bottom-12 opacity-[0.03] scale-[4] pointer-events-none" size={200} />
      </div>

      {results && !isTesting && (
        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 group hover:bg-blue-50 transition-all">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpCircle size={28} />
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Upload</p>
              <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{results.ul} Mbps</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 group hover:bg-emerald-50 transition-all">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity size={28} />
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Link Latency</p>
              <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{results.ping} ms</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={14} className="text-blue-400" /> Connection Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {[
            { label: 'Public IP', value: '182.164.3.42', icon: Wifi },
            { label: 'MAC Address', value: 'E4:A1:7F:C2:08', icon: ShieldCheck },
            { label: 'Regional Server', value: 'KHI-NORTH-B2', icon: HardDrive },
            { label: 'Uptime Rank', value: '99.98%', icon: Activity }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400"><item.icon size={20} /></div>
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                <p className="text-xs font-black text-slate-200 tracking-tight">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <Globe className="absolute -right-20 -bottom-20 opacity-5 scale-[2]" size={300} />
      </div>
    </div>
  );
};

export default SubscriberNetwork;
