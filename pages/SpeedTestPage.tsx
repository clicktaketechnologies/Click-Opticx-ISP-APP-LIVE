
import React, { useState } from 'react';
import { Gauge, Play, Loader2, ArrowDownCircle, ArrowUpCircle, Activity, Globe, Wifi, ShieldCheck, History } from 'lucide-react';

const SpeedTestPage: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{dl: number, ul: number, ping: number} | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);

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
        const finalResults = {
          dl: Number((Math.random() * 40 + 60).toFixed(1)),
          ul: Number((Math.random() * 20 + 30).toFixed(1)),
          ping: Math.floor(Math.random() * 15 + 5)
        };
        setResults(finalResults);
        setTestHistory(prev => [{ ...finalResults, timestamp: new Date().toLocaleString() }, ...prev].slice(0, 5));
      }
    }, 50);
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Infrastructure Audit</h3>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Network Performance Handshake</h2>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center z-10">
           <div className="absolute inset-0 rounded-full border-[15px] border-slate-50 shadow-inner"></div>
           <div className="absolute inset-0 rounded-full border-[15px] border-indigo-600 transition-all duration-300 border-t-transparent border-r-transparent border-l-transparent" style={{ transform: `rotate(${progress * 3.6}deg)` }}></div>
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
          className="w-full max-w-sm py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4 relative z-10"
        >
           {isTesting ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
           {isTesting ? 'Initializing Scans...' : 'Execute Full Audit'}
        </button>

        <Activity className="absolute -right-12 -bottom-12 opacity-[0.03] scale-[4] pointer-events-none text-indigo-900" size={200} />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 group hover:bg-blue-50 transition-all">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <ArrowUpCircle size={28} />
            </div>
            <div className="text-center">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Upload</p>
               <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{results?.ul || '0.0'} Mbps</p>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 group hover:bg-emerald-50 transition-all">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <Activity size={28} />
            </div>
            <div className="text-center">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Link Latency</p>
               <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{results?.ping || '0'} ms</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <History size={14} className="text-indigo-600"/> Audit History
            </h3>
         </div>
         <div className="divide-y divide-slate-50">
            {testHistory.map((test, i) => (
              <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600"><Wifi size={18}/></div>
                    <div>
                       <p className="text-xs font-black text-slate-900 uppercase">Speed Handshake</p>
                       <p className="text-[8px] text-slate-400 font-bold uppercase">{test.timestamp}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black text-slate-800">{test.dl} / {test.ul} Mbps</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase">{test.ping}ms Latency</p>
                 </div>
              </div>
            ))}
            {testHistory.length === 0 && (
              <div className="p-10 text-center text-slate-300 font-black uppercase text-[9px] tracking-widest">No previous audit logs.</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SpeedTestPage;
