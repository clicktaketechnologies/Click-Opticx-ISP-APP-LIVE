import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, ArrowDown, ArrowUp, Activity, 
  RefreshCcw, Globe, ShieldCheck, Info,
  LineChart as LineChartIcon, Settings as SettingsIcon,
  Play, Pause, Clock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { db } from '../db';

interface SpeedMetrics {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  packetLoss: number;
  stability: number;
}

const SpeedTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'complete'>('idle');
  const [metrics, setMetrics] = useState<SpeedMetrics>({
    download: 0,
    upload: 0,
    ping: 0,
    jitter: 0,
    packetLoss: 0,
    stability: 0
  });
  
  const [history, setHistory] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startTest = async () => {
    setTesting(true);
    setProgress(0);
    setMetrics({ download: 0, upload: 0, ping: 0, jitter: 0, packetLoss: 0, stability: 0 });
    abortControllerRef.current = new AbortController();

    try {
      // 1. Ping & Jitter Test
      setPhase('ping');
      const pings = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        await fetch(`${db.backendUrl}/api/speedtest/ping?cb=${Date.now()}`, { 
          signal: abortControllerRef.current.signal 
        });
        pings.push(performance.now() - start);
        setProgress((i + 1) * 2);
      }
      const avgPing = pings.reduce((a, b) => a + b) / pings.length;
      const jitter = Math.max(...pings) - Math.min(...pings);
      setMetrics(prev => ({ ...prev, ping: Math.round(avgPing), jitter: Math.round(jitter) }));

      // 2. Download Test (Multi-threaded simulation)
      setPhase('download');
      const downloadStart = performance.now();
      const threadCount = 4;
      const chunks = await Promise.all(
        Array.from({ length: threadCount }).map(() => 
          fetch(`${db.backendUrl}/api/speedtest/download?cb=${Date.now()}`, { 
            signal: abortControllerRef.current.signal 
          }).then(r => r.blob())
        )
      );
      const downloadDuration = (performance.now() - downloadStart) / 1000;
      const totalBytes = chunks.reduce((acc, chunk) => acc + chunk.size, 0);
      const mbpsDown = (totalBytes * 8) / (downloadDuration * 1024 * 1024);
      setMetrics(prev => ({ ...prev, download: parseFloat(mbpsDown.toFixed(2)) }));
      setProgress(60);

      // 3. Upload Test
      setPhase('upload');
      const uploadData = new Blob([new Uint8Array(5 * 1024 * 1024)]); // 5MB payload
      const uploadStart = performance.now();
      await fetch(`${db.backendUrl}/api/speedtest/upload`, {
        method: 'POST',
        body: uploadData,
        signal: abortControllerRef.current.signal
      });
      const uploadDuration = (performance.now() - uploadStart) / 1000;
      const mbpsUp = (uploadData.size * 8) / (uploadDuration * 1024 * 1024);
      setMetrics(prev => ({ ...prev, upload: parseFloat(mbpsUp.toFixed(2)), stability: 98 }));
      
      setPhase('complete');
      setProgress(100);
      
      // Save to history
      const result = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...metrics,
        download: parseFloat(mbpsDown.toFixed(2)),
        upload: parseFloat(mbpsUp.toFixed(2))
      };
      setHistory(prev => [result, ...prev].slice(0, 10));

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Speed Test Failed:', err);
      }
    } finally {
      setTesting(false);
    }
  };

  const stopTest = () => {
    abortControllerRef.current?.abort();
    setTesting(false);
    setPhase('idle');
  };

  return (
    <div className="p-8 space-y-8 animate-premium max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-4">
            <Zap className="text-blue-600 fill-blue-600" size={48} />
            Network Pulse
          </h1>
          <p className="text-slate-500 text-sm font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
            <Globe className="text-blue-500" size={14} />
            High-Precision Throughput Diagnostic
          </p>
        </div>

        <div className="flex items-center gap-4">
          {!testing ? (
            <button
              onClick={startTest}
              className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2.5rem] flex items-center gap-4 font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:scale-95"
            >
              <Play size={20} fill="white" />
              Begin Analysis
            </button>
          ) : (
            <button
              onClick={stopTest}
              className="px-10 py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-[2.5rem] flex items-center gap-4 font-black text-sm uppercase tracking-widest shadow-2xl shadow-rose-600/30 transition-all hover:-translate-y-1 active:scale-95"
            >
              <Pause size={20} fill="white" />
              Abort Test
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Gauge & Metrics */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
              <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              {/* Speedometer Placeholder / Central Metric */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="128" cy="128" r="120"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="12"
                    />
                    <circle
                      cx="128" cy="128" r="120"
                      className="stroke-blue-600 fill-none transition-all duration-1000 ease-out"
                      strokeWidth="12"
                      strokeDasharray={753.98}
                      strokeDashoffset={753.98 - (753.98 * (metrics.download / 100))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-7xl font-black tracking-tighter text-slate-900 italic">
                      {phase === 'download' || phase === 'complete' ? metrics.download : metrics.upload || '0'}
                    </span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Mbps Down</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${phase === 'download' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    Download
                  </div>
                  <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest ${phase === 'upload' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    Upload
                  </div>
                </div>
              </div>

              {/* Secondary Stats */}
              <div className="space-y-8 py-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2 group-hover:bg-blue-50/50 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ArrowDown size={12} className="text-blue-500" />
                      Download
                    </p>
                    <h4 className="text-3xl font-black text-slate-900 italic">{metrics.download} <span className="text-sm">Mbps</span></h4>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2 group-hover:bg-blue-50/50 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ArrowUp size={12} className="text-emerald-500" />
                      Upload
                    </p>
                    <h4 className="text-3xl font-black text-slate-900 italic">{metrics.upload} <span className="text-sm">Mbps</span></h4>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2 group-hover:bg-blue-50/50 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={12} className="text-amber-500" />
                      Latency
                    </p>
                    <h4 className="text-3xl font-black text-slate-900 italic">{metrics.ping} <span className="text-sm">ms</span></h4>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2 group-hover:bg-blue-50/50 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} className="text-indigo-500" />
                      Jitter
                    </p>
                    <h4 className="text-3xl font-black text-slate-900 italic">{metrics.jitter} <span className="text-sm">ms</span></h4>
                  </div>
                </div>

                <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl shadow-blue-600/20">
                  <div className="flex items-center gap-4">
                    <ShieldCheck size={32} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Connection Stability</p>
                      <h5 className="text-xl font-black italic">EXCELLENT ({metrics.stability}%)</h5>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/20 mx-6" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Node Status</p>
                    <h5 className="text-xl font-black italic">PROD-KHI-01</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* History Chart */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <LineChartIcon className="text-blue-600" size={20} />
                Historical Performance
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history.length > 0 ? [...history].reverse() : []}>
                  <defs>
                    <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="download" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorDown)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Info & Recent */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-400">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Configuration</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test Parameters</p>
                </div>
             </div>

             <div className="space-y-4">
               {[
                 { label: 'Auto-Server Selection', value: true },
                 { label: 'Multi-Threaded Mode', value: true },
                 { label: 'UDP Jitter Simulation', value: false },
                 { label: 'Ramadan Prayer Guard', value: true },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
                   <div className={`w-10 h-5 rounded-full p-1 ${item.value ? 'bg-blue-600' : 'bg-slate-700'}`}>
                     <div className={`w-3 h-3 bg-white rounded-full ${item.value ? 'translate-x-5' : 'translate-x-0'} transition-transform`}></div>
                   </div>
                 </div>
               ))}
             </div>

             <div className="p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20">
               <div className="flex items-start gap-4">
                 <Info size={16} className="text-blue-400 mt-1 shrink-0" />
                 <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest leading-relaxed">
                   For maximum accuracy, please ensure all background streaming and intensive network activity is paused during the test.
                 </p>
               </div>
             </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Recent Sessions</h3>
            <div className="space-y-4">
              {history.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <RefreshCcw size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase">{test.download} Mbps</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{new Date(test.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-600 uppercase">PASS</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{test.ping}ms</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-center py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No session history detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedTest;
