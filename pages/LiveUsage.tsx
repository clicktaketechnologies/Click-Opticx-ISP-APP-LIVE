
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { ISPUser } from '../types';
import { 
  TrendingUp, Download, Upload, Activity, 
  RefreshCw, Globe, ArrowUpRight, ArrowDownLeft, Gauge,
  ShieldAlert, HardDrive, Clock, Pause, Play
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LiveUsage: React.FC<{ user: ISPUser }> = ({ user }) => {
  const [stats, setStats] = useState(db.getLiveUsage(user.id));
  const [history, setHistory] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newStats = db.getLiveUsage(user.id);
      setStats(newStats);

      if (!newStats.offline) {
        setHistory(prev => {
          const next = [
            ...prev, 
            { 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
              down: parseFloat(newStats.down), 
              up: parseFloat(newStats.up) 
            }
          ];
          // Sliding window: Keep last 30 intervals (approx 60 seconds)
          if (next.length > 30) return next.slice(1);
          return next;
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [user.id, isPaused]);

  // If no hardware is mapped, show the fallback UI
  if (stats.offline) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-24">
        <div className="text-center space-y-4 pt-10">
           <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300 border-4 border-white shadow-inner">
              <ShieldAlert size={48} />
           </div>
           <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Live Data Unavailable</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Registry Node: UNCONFIGURED</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 opacity-40 grayscale pointer-events-none">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse">
              <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Download</p>
              <h3 className="text-4xl font-black text-slate-200 tracking-tighter">0.00</h3>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse">
              <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Upload</p>
              <h3 className="text-4xl font-black text-slate-200 tracking-tighter">0.00</h3>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-6">
           <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase max-w-xs">
              Your network device isn’t fully set up yet. Status: Not configured. Please contact support to map your hardware.
           </p>
           <button disabled className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200">
              Setup Pending
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Live Network Status</h2>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Real-time Connection: ACTIVE</p>
          </div>
        </div>
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className={`p-4 rounded-2xl transition-all shadow-sm active:scale-95 border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isPaused ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
        >
          {isPaused ? <><Play size={14} fill="currentColor"/> Resume</> : <><Pause size={14} fill="currentColor"/> Pause Pulse</>}
        </button>
      </div>

      {/* Speed Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 text-indigo-400">
              <Download size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Download Speed</span>
            </div>
            <div>
               <h3 className="text-6xl font-black italic tracking-tighter leading-none">{stats.down}</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Mbps</p>
            </div>
          </div>
          <ArrowDownLeft className="absolute -right-4 -bottom-4 opacity-10 text-indigo-500 pointer-events-none" size={120} />
        </div>
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 text-emerald-400">
              <Upload size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Upload Speed</span>
            </div>
            <div>
               <h3 className="text-6xl font-black italic tracking-tighter leading-none">{stats.up}</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Mbps / 2.0s Refresh</p>
            </div>
          </div>
          <ArrowUpRight className="absolute -right-4 -bottom-4 opacity-10 text-emerald-500 pointer-events-none" size={120} />
        </div>
      </div>

      {/* Real-time Pulse Chart */}
      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm h-80 flex flex-col">
        <div className="flex justify-between items-center mb-8 px-2">
           <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Traffic</h4>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-600"></div><span className="text-[8px] font-black uppercase text-slate-400">DL</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[8px] font-black uppercase text-slate-400">UL</span></div>
           </div>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 'auto']} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
              />
              <Area type="monotone" dataKey="down" stroke="#4f46e5" fillOpacity={1} fill="url(#colorDown)" strokeWidth={4} isAnimationActive={false} />
              <Area type="monotone" dataKey="up" stroke="#10b981" fillOpacity={1} fill="url(#colorUp)" strokeWidth={4} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latency & Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-lg transition-all flex flex-col items-center gap-3">
           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner group-hover:scale-110 transition-transform">
              <Activity size={24}/>
           </div>
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ping / Latency</p>
              <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{stats.ping} ms</h4>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-lg transition-all flex flex-col items-center gap-3">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner group-hover:scale-110 transition-transform">
              <Globe size={24}/>
           </div>
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Traffic & Usage Today</p>
              <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{stats.usageToday} GB</h4>
           </div>
        </div>
      </div>
      
      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm mx-1">
         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-blue-600">
            <Gauge size={28} />
         </div>
         <div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1 italic">Network Health</p>
            <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed opacity-80">
               Infrastructure is healthy ✅. Network performance monitored continuously.
            </p>
         </div>
      </div>
    </div>
  );
};

export default LiveUsage;
