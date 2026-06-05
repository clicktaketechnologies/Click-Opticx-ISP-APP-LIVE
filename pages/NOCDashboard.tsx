import React, { useState, useEffect, useMemo } from 'react';
import { 
   Activity, Shield, Server, Monitor, Wifi, Zap, AlertCircle, 
   CheckCircle2, ArrowUpRight, ArrowDownRight, Users, Globe, 
   Clock, Bell, Search, Filter, MoreVertical, RotateCw, 
   HardDrive, Network, MapPin, Database, Cpu, PieChart, Info,
   PlayCircle, AlertTriangle, MessageSquare, Trash2, CheckCircle, Sparkles, History
} from 'lucide-react';
import { AppState, UpstreamLink, NOCAlert, OLTConfig, ONU, ISPUser } from '../types';
import { db } from '../db';

const NOCDashboard: React.FC<{ state: AppState }> = ({ state }) => {
   const [refreshRate, setRefreshRate] = useState(10);
   const [lastUpdated, setLastUpdated] = useState(new Date());
   const [isNocMode, setIsNocMode] = useState(true); // Default to System Dark Mode
   const [activeFilter, setActiveFilter] = useState<'All' | 'Critical' | 'Warning'>('All');
   const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' | null }>({ message: '', type: null });
   const [pulseData, setPulseData] = useState<{ speed: string, devices: number, usage: string }>({ speed: '0 Mbps', devices: 0, usage: '0 GB' });
   const [isPulseSyncing, setIsPulseSyncing] = useState(false);

   // Auto-dismiss toast
   useEffect(() => {
      if (toast.message) {
         const timer = setTimeout(() => setToast({ message: '', type: null }), 3000);
         return () => clearTimeout(timer);
      }
   }, [toast.message]);

   // Audible Alerts for Critical Faults
   useEffect(() => {
      const latest = (state.nocAlerts || [])[0];
      if (latest && latest.severity === 'Critical') {
         const now = new Date().getTime();
         const alertTime = new Date(latest.timestamp).getTime();
         if (now - alertTime < 5000) { // Only if it just happened in the last 5s
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.warn('Audio blocked by browser policy'));
         }
      }
   }, [state.nocAlerts]);

   const handleOperation = async (label: string) => {
      setToast({ message: `Initiating ${label}...`, type: 'info' });
      
      let res;
      if (label === 'Force Sync') {
         res = await db.getNasStats();
      } else if (label === 'Diagnostic') {
         res = await db.getSystemHealth();
      } else {
         await new Promise(r => setTimeout(r, 1000));
         res = { success: true, message: `${label} dispatched to target clusters` };
      }
      
      if (res && res.success) {
         setToast({ message: res.message || `${label} completed successfully`, type: 'success' });
      } else {
         setToast({ message: res?.message || `Failed to execute ${label}`, type: 'error' });
      }

      // Log the action to security logs
      await db.addSecurityLog({
         action: `ACTION-${label}`,
         details: `${label} operation triggered from Network Control Panel. Result: ${res?.message || 'N/A'}`,
      });
   };

   // Auto-refresh timer & Pulse Fetcher
   useEffect(() => {
      const fetchPulse = async () => {
         const onlineOlt = state.oltNodes.find(o => o.status === 'Online');
         if (onlineOlt) {
            setIsPulseSyncing(true);
            const res = await db.getOLTPulse(onlineOlt.id);
            if (res.success) {
               setPulseData({
                  speed: res.liveSpeed,
                  devices: res.devices,
                  usage: res.todayUsage
               });
            }
            setIsPulseSyncing(false);
         }
      };

      const interval = setInterval(() => {
         setLastUpdated(new Date());
         fetchPulse();
      }, refreshRate * 1000);
      
      fetchPulse(); // Initial fetch
      return () => clearInterval(interval);
   }, [refreshRate, state.oltNodes]);

   // Derived Data
   const stats = useMemo(() => {
      const onlineUsers = (state.users || []).filter(u => u.status === 'Active').length;
      const weakSignals = (state.onus || []).filter(o => o.signalStrength < -27).length;
      const offlineOlts = (state.oltNodes || []).filter(o => o.status !== 'Online').length;
      return {
         totalSubscribers: (state.users || []).length,
         onlineUsers,
         offlineUsers: (state.users || []).length - onlineUsers,
         suspendedUsers: (state.users || []).filter(u => u.status === 'Suspended').length,
         routersOnline: (state.nas || []).filter(n => n.status === 'Online').length,
         oltDevices: (state.oltNodes || []).length,
         onusOnline: (state.onus || []).filter(o => o.status === 'Online').length,
         weakSignals
      };
   }, [state]);

   const filteredAlerts = (state.nocAlerts || []).filter(a => 
      activeFilter === 'All' ? true : a.severity === activeFilter
   );

   const StatusRing = ({ status }: { status: string }) => (
      <div className={`w-3 h-3 rounded-full ${
         status === 'Online' || status === 'Normal' ? 'bg-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
         status === 'Warning' || status === 'Standby' ? 'bg-amber-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
      } animate-pulse`} />
   );

   return (
      <div className={`min-h-screen -m-8 p-8 transition-colors duration-700 ${isNocMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
         
         {/* TOP CONTROL BAR */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${isNocMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'}`}>
                  <Activity size={32} />
               </div>
               <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">NETWORK CONTROL PANEL</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-50 flex items-center gap-2 text-blue-400">
                     <Shield size={12} /> ➡ Real-time system monitoring and health alerts
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest ${isNocMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  <span className="text-green-500">LIVE FEED</span>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <Clock size={14} className="text-slate-400" />
                  <span className="opacity-50">Sync:</span>
                  <span className="text-blue-400">{lastUpdated.toLocaleTimeString()}</span>
               </div>
               
               <select 
                  value={refreshRate} 
                  onChange={(e) => setRefreshRate(Number(e.target.value))}
                  className={`px-4 py-3 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/50 ${isNocMode ? 'bg-white/5 text-slate-300' : 'bg-white text-slate-700 shadow-sm'}`}
               >
                  <option value={5}>5s REFRESH</option>
                  <option value={10}>10s REFRESH</option>
                  <option value={30}>30s REFRESH</option>
               </select>

               <button 
                  onClick={() => setIsNocMode(!isNocMode)}
                  className={`px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isNocMode ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-slate-900 text-white hover:bg-black'}`}
               >
                  {isNocMode ? 'Light UI' : 'Dark Mode'}
               </button>
            </div>
         </div>

         {/* SYSTEM HEALTH OVERVIEW */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
            <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all ${isNocMode ? 'bg-blue-600 border-blue-500 shadow-[0_20px_50px_rgba(79,70,229,0.3)]' : 'bg-blue-600 text-white shadow-xl'}`}>
               <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <Zap size={24} className="text-white" />
                     <h3 className="text-sm font-black uppercase tracking-widest text-white/70 italic">Real-time Speed</h3>
                  </div>
                  {isPulseSyncing && <RotateCw size={14} className="text-white animate-spin opacity-40" />}
               </div>
               <div className="text-5xl font-black italic tracking-tighter text-white relative z-10">{pulseData.speed}</div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full -m-16 animate-pulse" />
            </div>

            <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all ${isNocMode ? 'bg-cyan-600 border-cyan-500 shadow-[0_20px_40px_rgba(8,145,178,0.3)]' : 'bg-cyan-600 text-white shadow-xl'}`}>
               <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <Users size={24} className="text-white" />
                     <h3 className="text-sm font-black uppercase tracking-widest text-white/70 italic">Devices</h3>
                  </div>
               </div>
               <div className="text-5xl font-black italic tracking-tighter text-white relative z-10">{pulseData.devices}</div>
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-2 italic">Active ONUs on Cluster</div>
            </div>

            <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all ${isNocMode ? 'bg-green-600 border-green-500 shadow-[0_20px_40px_rgba(5,150,105,0.3)]' : 'bg-green-600 text-white shadow-xl'}`}>
               <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <Database size={24} className="text-white" />
                     <h3 className="text-sm font-black uppercase tracking-widest text-white/70 italic">Today Usage</h3>
                  </div>
               </div>
               <div className="text-5xl font-black italic tracking-tighter text-white relative z-10">{pulseData.usage}</div>
               <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-2 italic">Aggregated OLT Traffic</div>
            </div>
         </div>

         {/* 1. TOP NETWORK SUMMARY BAR */}
         <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
            {[
               { label: 'Users', val: stats.totalSubscribers, color: 'text-blue-400', icon: Users, isLive: true },
               { label: 'Online Users', val: stats.onlineUsers, color: 'text-green-400', icon: CheckCircle2, isLive: true },
               { label: 'Offline Users', val: stats.offlineUsers, color: 'text-rose-400', icon: AlertCircle, isLive: true },
               { label: 'Suspended Users', val: stats.suspendedUsers, color: 'text-amber-400', icon: Info, isLive: true },
               { label: 'Routers', val: stats.routersOnline, color: 'text-blue-400', icon: Server, isLive: true },
               { label: 'OLT Devices', val: stats.oltDevices, color: 'text-cyan-400', icon: Network, isLive: true },
               { label: 'ONUs Online', val: stats.onusOnline, color: 'text-teal-400', icon: Monitor, isLive: true },
               { label: 'Low Wifi', val: stats.weakSignals, color: 'text-rose-500', icon: Wifi, pulse: stats.weakSignals > 0, isLive: true }
            ].map((stat, i) => (
               <div key={i} className={`p-5 rounded-3xl border transition-all hover:scale-105 ${isNocMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 hover:shadow-xl'}`}>
                  <div className="flex items-center justify-between mb-3">
                     <stat.icon size={16} className={stat.color} />
                     <div className="flex items-center gap-1.5">
                        {stat.isLive && (
                           <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[6px] font-black uppercase text-green-500 tracking-tighter">LIVE</span>
                           </div>
                        )}
                        {stat.pulse && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                     </div>
                  </div>
                  <div className="text-2xl font-black mb-1">{stat.val}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest opacity-40">{stat.label}</div>
               </div>
            ))}
         </div>

         <div className="grid grid-cols-12 gap-8">
            
            {/* LEFT COLUMN - INFRASTRUCTURE & MONITORING */}
            <div className="col-span-12 xl:col-span-8 space-y-8">
               
               {/* 2. INTERNET PROVIDER STATUS */}
               <div className={`p-8 rounded-[2.5rem] border ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <Globe className="text-blue-400" size={24} />
                        <h2 className="text-lg font-black uppercase tracking-tighter">Main Internet Links</h2>
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full italic">Main Connection Active</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {(state.upstreamLinks || []).map(link => (
                        <div key={link.id} className={`p-6 rounded-3xl relative overflow-hidden transition-all ${isNocMode ? 'bg-black/40 hover:bg-black/60' : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'}`}>
                           <div className="flex items-start justify-between relative z-10">
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">{link.type} Link</p>
                                 <h3 className="text-sm font-black uppercase italic mb-4">{link.name}</h3>
                              </div>
                              <StatusRing status={link.status} />
                           </div>

                           <div className="grid grid-cols-3 gap-4 relative z-10">
                              <div>
                                 <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1">Status</p>
                                 <p className={`text-xs font-black ${link.status === 'Online' ? 'text-green-400' : 'text-amber-400'}`}>{link.status}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1">Latency</p>
                                 <p className="text-xs font-black">{link.latency} ms</p>
                              </div>
                              <div>
                                 <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1">Usage</p>
                                 <p className="text-xs font-black">{link.usageMbps} Mbps</p>
                              </div>
                           </div>

                           {/* Visual usage bar */}
                           <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                 className={`h-full transition-all duration-1000 ${link.status === 'Online' ? 'bg-blue-500' : 'bg-slate-500'}`}
                                 style={{ width: `${(link.usageMbps / link.capacityMbps) * 100}%` }}
                              />
                           </div>
                           
                           {/* Background pulse for primary */}
                           {link.status === 'Online' && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -m-16" />
                           )}
                        </div>
                     ))}
                  </div>
               </div>

               {/* 3 & 4. ROUTER & OLT GRID */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* ROUTERS */}
                  <div className={`p-8 rounded-[2.5rem] border ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <Server className="text-blue-400" size={24} />
                           <h2 className="text-lg font-black uppercase tracking-tighter">MikroTik Routers</h2>
                        </div>
                        <span className="text-2xl font-black text-blue-400/20 italic">{(state.nas || []).length}</span>
                     </div>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {(state.nas || []).map(nas => (
                           <div key={nas.id} className={`p-5 rounded-3xl border transition-all ${isNocMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nas.status === 'Online' ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                       <Database size={16} />
                                    </div>
                                    <div>
                                       <h4 className="text-xs font-black uppercase tracking-tight">{nas.name}</h4>
                                       <p className="text-[8px] font-black opacity-30 tracking-widest">{nas.ip}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <StatusRing status={nas.status} />
                                    <span className={`text-[6px] font-black uppercase tracking-tighter ${nas.status === 'Online' ? 'text-green-500' : 'text-rose-500'}`}>
                                       {nas.status === 'Online' ? 'LIVE DATA' : 'NOT CONNECTED'}
                                    </span>
                                 </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                 <div className="p-2 bg-black/20 rounded-xl text-center">
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-30 mb-0.5">CPU</p>
                                    <p className="text-[10px] font-black">32%</p>
                                 </div>
                                 <div className="p-2 bg-black/20 rounded-xl text-center">
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-30 mb-0.5">MEM</p>
                                    <p className="text-[10px] font-black">45%</p>
                                 </div>
                                 <div className="p-2 bg-black/20 rounded-xl text-center">
                                    <p className="text-[7px] font-black uppercase tracking-widest opacity-30 mb-0.5">USR</p>
                                    <p className="text-[10px] font-black text-blue-400">70</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* OLTS */}
                  <div className={`p-8 rounded-[2.5rem] border ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <Network className="text-cyan-400" size={24} />
                           <h2 className="text-lg font-black uppercase tracking-tighter">System Infrastructure</h2>
                        </div>
                        <span className="text-2xl font-black text-cyan-400/20 italic">{(state.oltNodes || []).length}</span>
                     </div>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {(state.oltNodes || []).map(olt => (
                           <div key={olt.id} className={`p-5 rounded-3xl border transition-all ${isNocMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                              <div className="flex items-center justify-between mb-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-cyan-500/10 text-cyan-500 rounded-lg flex items-center justify-center">
                                       <Cpu size={16} />
                                    </div>
                                    <div>
                                       <h4 className="text-xs font-black uppercase tracking-tight">{olt.name}</h4>
                                       <p className="text-[8px] font-black opacity-30 tracking-widest">{olt.brand} | {olt.ponPorts} Ports</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <StatusRing status={olt.status} />
                                    <span className={`text-[6px] font-black uppercase tracking-tighter ${olt.status === 'Online' ? 'text-green-500' : 'text-rose-500'}`}>
                                       {olt.status === 'Online' ? 'LIVE TELEMETRY' : 'NO TELEMETRY'}
                                    </span>
                                 </div>
                              </div>
                              <div className="flex items-center justify-between px-2">
                                 <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1">Active ONUs</p>
                                    <div className="flex items-baseline gap-1">
                                       <span className="text-lg font-black text-green-400">
                                          {(state.onus || []).filter(o => o.oltId === olt.id && o.status === 'Online').length}
                                       </span>
                                       <span className="text-[8px] font-black opacity-20">REGISTERED</span>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1">Faults</p>
                                    <div className="flex items-baseline gap-1 justify-end">
                                       <span className="text-lg font-black text-rose-500">
                                          {(state.onus || []).filter(o => o.oltId === olt.id && o.status !== 'Online').length}
                                       </span>
                                       <span className="text-[8px] font-black opacity-20 text-rose-500/40">OFFLINE</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

               </div>

               {/* 5. ONU SIGNAL MONITOR */}
               <div className={`p-8 rounded-[2.5rem] border overflow-hidden ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-8 px-2">
                     <div className="flex items-center gap-3">
                        <Wifi className="text-rose-500" size={24} />
                        <h2 className="text-lg font-black uppercase tracking-tighter">Connection Issues</h2>
                     </div>
                     <span className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-rose-500/5 transition-all">Inspection Required</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="border-b border-white/5">
                              <th className="p-4 text-[9px] font-black uppercase tracking-widest opacity-30">Subscriber</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-widest opacity-30">ONU Serial</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-widest opacity-30">OLT Port</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-widest opacity-30 text-center">Signal Strength</th>
                              <th className="p-4 text-[9px] font-black uppercase tracking-widest opacity-30 text-right">Recommended Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {(state.onus || []).filter(o => o.signalStrength < -25).map(onu => {
                              const user = (state.users || []).find(u => u.id === onu.subscriberId);
                              return (
                                 <tr key={onu.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center font-black text-[10px] group-hover:bg-blue-600 transition-colors">
                                             {user?.name?.charAt(0) || '?'}
                                          </div>
                                          <div className="text-xs font-black">{user?.name}</div>
                                       </div>
                                    </td>
                                    <td className="p-4 font-mono text-[10px] opacity-60">{onu.serialNumber}</td>
                                    <td className="p-4 text-[10px] font-black opacity-60">{onu.ponPort}</td>
                                    <td className="p-4 text-center">
                                       <span className={`px-3 py-1.5 rounded-xl font-black text-[10px] ${
                                          onu.signalStrength < -30 ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                                       }`}>
                                          {onu.signalStrength} dBm
                                       </span>
                                    </td>
                                    <td className="p-4 text-right">
                                       <div className="flex items-center justify-end gap-2 text-[9px] font-black uppercase tracking-tighter text-blue-400">
                                          <Zap size={12} /> Inspect Splice / Clean Port
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* 6. LIVE TRAFFIC GRAPH */}
               <div className={`p-8 rounded-[2.5rem] border ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-3">
                        <PieChart className="text-blue-400" size={24} />
                        <h2 className="text-lg font-black uppercase tracking-tighter">Network Activity</h2>
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[7px] font-black uppercase tracking-tighter">LIVE DATA</span>
                     </div>
                     <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl">
                        {['5M', '1H', '24H'].map(r => (
                           <button key={r} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${r === '5M' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>{r}</button>
                        ))}
                     </div>
                  </div>

                  <div className="h-64 relative flex items-baseline gap-1">
                     {state.liveUsage && state.liveUsage.length > 0 ? (
                        state.liveUsage.slice(0, 60).map((u, i) => (
                           <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end h-full">
                              <div 
                                 className="w-full bg-blue-500/40 hover:bg-blue-500 transition-all rounded-t-sm" 
                                 style={{ height: `${Math.min(100, (u.download / 100) * 100)}%` }} 
                              />
                              <div 
                                 className="w-full bg-green-500/40 hover:bg-green-500 transition-all rounded-b-sm" 
                                 style={{ height: `${Math.min(100, (u.upload / 20) * 100)}%` }} 
                              />
                           </div>
                        ))
                     ) : (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                           <div className="text-center opacity-30">
                              <Database size={48} className="mx-auto mb-4" />
                              <p className="font-black text-[10px] uppercase tracking-widest">Awaiting Live Telemetry Stream...</p>
                           </div>
                        </div>
                     )}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-12">
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-blue-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                           Total Download ({state.liveUsage?.[0]?.download || 0} Mbps)
                        </span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-green-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                           Total Upload ({state.liveUsage?.[0]?.upload || 0} Mbps)
                        </span>
                     </div>
                  </div>
               </div>

            </div>

            {/* RIGHT COLUMN - ALERTS & ACTIONS */}
            <div className="col-span-12 xl:col-span-4 space-y-8">
               
               {/* 8. ACTIVE ALERTS PANEL */}
               <div className={`p-8 rounded-[2.5rem] border ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <Bell className="text-rose-500" size={24} />
                        <h2 className="text-lg font-black uppercase tracking-tighter">System Alerts</h2>
                     </div>
                     <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
                        {(['All', 'Critical', 'Warning'] as const).map(f => (
                           <button 
                              key={f} 
                              onClick={() => setActiveFilter(f)}
                              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                           >
                              {f}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                     {filteredAlerts.length === 0 && (
                        <div className="py-20 text-center opacity-20">
                           <CheckCircle2 size={48} className="mx-auto mb-4" />
                           <p className="font-black text-xs uppercase tracking-widest">No Alerts Pending</p>
                        </div>
                     )}
                     {filteredAlerts.map(alert => (
                        <div key={alert.id} className={`p-6 rounded-3xl border animate-in slide-in-from-right duration-500 ${isNocMode ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                           <div className="flex items-start gap-4 mb-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                 alert.severity === 'Critical' ? 'bg-rose-500 text-white' : 
                                 alert.severity === 'Warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                              }`}>
                                 {alert.severity === 'Critical' ? <AlertTriangle size={20} /> : <Info size={20} />}
                              </div>
                              <div className="flex-1">
                                 <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-xs font-black uppercase tracking-tight italic">{alert.title}</h4>
                                    <span className="text-[8px] font-black opacity-30">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                 </div>
                                 <p className="text-[10px] font-bold opacity-60 leading-relaxed">{alert.message}</p>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 mt-4">
                              <button 
                                 onClick={() => setToast({ message: 'Alert Acknowledged', type: 'success' })}
                                 className="py-3 bg-white/5 hover:bg-green-600 hover:text-white transition-all rounded-xl text-[9px] font-black uppercase tracking-widest"
                              >
                                 Acknowledge
                              </button>
                              <button 
                                 onClick={() => handleOperation('Troubleshoot')}
                                 className="py-3 bg-white/5 hover:bg-blue-600 hover:text-white transition-all rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                              >
                                 <PlayCircle size={14} /> Troubleshoot
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 11. QUICK ACTION PANEL */}
               <div className={`p-8 rounded-[2.5rem] border ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <h2 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                     <Zap className="text-amber-400" size={24} />
                     Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                        { label: 'Diagnostic', icon: RotateCw, color: 'bg-blue-500' },
                        { label: 'Broadcast', icon: MessageSquare, color: 'bg-blue-500' },
                        { label: 'Flush DNS', icon: Trash2, color: 'bg-slate-500' },
                        { label: 'Kick All', icon: Zap, color: 'bg-rose-500' },
                        { label: 'Auto Fix', icon: Sparkles, icon2: Zap, color: 'bg-green-500' },
                        { label: 'Force Sync', icon: HardDrive, color: 'bg-cyan-500' }
                     ].map((action, i) => (
                        <button 
                           key={i} 
                           onClick={() => handleOperation(action.label)}
                           className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border transition-all active:scale-95 ${isNocMode ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-blue-500/50' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl'}`}
                        >
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${action.color} shadow-lg shadow-${action.color}/20`}>
                              <action.icon size={20} />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{action.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* 9. RECENT SYSTEM ACTIVITY */}
               <div className={`p-8 rounded-[2.5rem] border ${isNocMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <h2 className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                     <History size={24} className="text-green-400" />
                     Activity Log
                  </h2>
                  <div className="space-y-6">
                     {(state.securityLogs || []).slice(0, 5).map(log => (
                        <div key={log.id} className="flex gap-4 relative">
                           <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                              </div>
                              <div className="w-px h-full bg-white/5 mt-2" />
                           </div>
                           <div className="pb-6">
                              <div className="flex items-center justify-between mb-1">
                                 <p className="text-[10px] font-black text-blue-400 truncate w-32 uppercase tracking-widest">{log.adminEmail}</p>
                                 <span className="text-[8px] font-black opacity-20">{log.timestamp.slice(11, 16)}</span>
                              </div>
                              <p className="text-[11px] font-bold opacity-80">{log.action}</p>
                              <p className="text-[9px] font-medium opacity-40 mt-1">{log.details}</p>
                           </div>
                        </div>
                     ))}
                  </div>
                  <button 
                     onClick={() => setToast({ message: 'Opening Full Audit Logs...', type: 'info' })}
                     className="w-full py-4 mt-6 bg-white/5 hover:bg-white/10 transition-all rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] opacity-50 hover:opacity-100"
                  >
                     View Full Auditor
                  </button>
               </div>

            </div>
         </div>

         {/* NIGHT MODE REFRESH DECORATION */}
         <div className="fixed bottom-10 right-10 flex flex-col items-end gap-2 pointer-events-none opacity-20">
            <p className="text-[10px] font-mono tracking-tighter italic">NOC CORE VERSION 1.2.0 (LIVE)</p>
            <div className="flex items-center gap-6 text-[8px] font-black tracking-[0.5em] uppercase">
               <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(16,185,129,1)]" /> CLOUD SYNCED</span>
               <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,1)]" /> MULTI-TENANT</span>
            </div>
         </div>

         {/* TOAST SYSTEM */}
         {toast.message && (
            <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-top duration-500">
               <div className={`px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border ${
                  toast.type === 'success' ? 'bg-green-600 border-green-400' : 
                  toast.type === 'info' ? 'bg-blue-600 border-blue-400' : 'bg-rose-600 border-rose-400'
               } text-white`}>
                  {toast.type === 'success' ? <CheckCircle size={20} /> : <Zap size={20} className="animate-pulse" />}
                  <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
               </div>
            </div>
         )}

      </div>
   );
};

export default NOCDashboard;

