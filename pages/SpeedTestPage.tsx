

import React, { useState, useEffect } from 'react';
import { Gauge, Play, Loader2, ArrowDownCircle, ArrowUpCircle, Activity, Globe, Wifi, ShieldCheck, History } from 'lucide-react';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import { runPingTest, runDownloadTest, runUploadTest } from '../utils/speedtest';

const SpeedTestPage: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'completed'>('idle');
  const [results, setResults] = useState<{dl: number, ul: number, ping: number} | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);

  useEffect(() => {
     const savedHistory = localStorage.getItem('isp_speedHistory');
     if (savedHistory) {
         try { setTestHistory(JSON.parse(savedHistory)); } catch (e) {}
     }
  }, []);

  const startTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setResults({ dl: 0, ul: 0, ping: 0 });
    setPhase('ping');

    // Ping
    const pingRes = await runPingTest();
    setResults(prev => ({ ...prev!, ping: pingRes }));

    // Download
    setPhase('download');
    const dlRes = await runDownloadTest((progressDl) => {
        setResults(prev => ({ ...prev!, dl: progressDl }));
    });
    setResults(prev => ({ ...prev!, dl: dlRes }));

    // Upload
    setPhase('upload');
    const ulRes = await runUploadTest((progressUl) => {
        setResults(prev => ({ ...prev!, ul: progressUl }));
    });

    const finalResults = { dl: dlRes, ul: ulRes, ping: pingRes };
    setResults(finalResults);
    setPhase('completed');

    const newEntry = { ...finalResults, timestamp: new Date().toLocaleString() };
    const newHistory = [newEntry, ...testHistory].slice(0, 5);
    setTestHistory(newHistory);
    localStorage.setItem('isp_speedHistory', JSON.stringify(newHistory));

    setIsTesting(false);
  };

  // Visual Progress calculation
  let progress = 0;
  if (phase === 'ping') progress = 10;
  else if (phase === 'download') progress = 10 + (results ? Math.min((results.dl / 100) * 40, 40) : 0);
  else if (phase === 'upload') progress = 50 + (results ? Math.min((results.ul / 50) * 50, 50) : 0);
  else if (phase === 'completed') progress = 100;

  const displayValue = phase === 'idle' || phase === 'completed'
     ? (results ? results.dl.toFixed(1) : '0.0')
     : phase === 'download'
         ? (results ? results.dl.toFixed(1) : '0.0')
         : phase === 'upload'
             ? (results ? results.ul.toFixed(1) : '0.0')
             : (results?.ping ? results.ping.toString() : '0');

  const displayLabel = phase === 'idle' || phase === 'completed'
      ? 'Mbps Download'
      : phase === 'ping'
          ? 'Measuring Ping (ms)...'
          : phase === 'download'
              ? 'Downloading...'
              : 'Uploading...';

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Infrastructure Audit</h3>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Network Performance Handshake</h2>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center z-10">
           <div className="absolute inset-0 rounded-full border-[15px] border-slate-50 shadow-inner"></div>
           <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
             <circle
               cx="50%" cy="50%" r="44%" fill="none" stroke="currentColor" strokeWidth="15"
               strokeDasharray="276" strokeDashoffset={`${276 - (276 * progress) / 100}`}
               className={`transition-all duration-300 ${phase === 'upload' ? 'text-emerald-500' : 'text-indigo-600'}`}
             />
           </svg>
           <div className="flex flex-col items-center z-10">
              <h2 className="text-6xl font-black text-slate-900 italic tracking-tighter">
                {displayValue}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{displayLabel}</p>
           </div>
        </div>

        <button 
          onClick={startTest}
          disabled={isTesting}
          className="w-full max-w-sm py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4 relative z-10"
        >
           {isTesting ? <Mini5GMicroLoader size={20} /> : <Play size={20} fill="currentColor" />}
           {isTesting ? 'Initializing Scans...' : (phase === 'completed' ? 'Restart Audit' : 'Execute Full Audit')}
        </button>

        <Activity className="absolute -right-12 -bottom-12 opacity-[0.03] scale-[4] pointer-events-none text-indigo-900" size={200} />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className={`p-8 rounded-[2rem] border shadow-sm flex flex-col items-center gap-4 transition-all ${phase === 'upload' ? 'bg-white border-emerald-400 scale-105 z-10' : 'bg-white border-slate-100 hover:bg-emerald-50'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${phase === 'upload' ? 'bg-emerald-100 text-emerald-600 animate-bounce' : 'bg-slate-50 text-emerald-600'}`}>
               <ArrowUpCircle size={28} />
            </div>
            <div className="text-center">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Upload</p>
               <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{results?.ul ? results.ul.toFixed(1) : '0.0'} Mbps</p>
            </div>
         </div>
         <div className={`p-8 rounded-[2rem] border shadow-sm flex flex-col items-center gap-4 transition-all ${phase === 'ping' ? 'bg-white border-blue-400 scale-105 z-10' : 'bg-white border-slate-100 hover:bg-blue-50'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${phase === 'ping' ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-slate-50 text-blue-600'}`}>
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
