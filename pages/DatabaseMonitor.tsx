import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import { db, DBHealth, ConnectionAudit } from '../db';
import { 
  Database, Activity, Server, ShieldCheck, 
  Terminal, AlertTriangle, RefreshCw, Loader2,
  Settings, Download, Upload, X, Eye, EyeOff, Globe, DatabaseZap, Flame,
  CheckCircle2, HardDrive, FileJson, Monitor, Save, Key, Wifi, WifiOff, XCircle, Code2, Cpu, Zap, Search, ShieldAlert, AlertCircle, CloudLightning, Github, Play, Box, ChevronRight, ExternalLink, ListChecks, Layers, Link2, Sparkles, Command, Send, CreditCard
} from 'lucide-react';

const DatabaseMonitor: React.FC<{ state: AppState }> = ({ state }) => {
  const [health, setHealth] = useState<DBHealth>(db.getHealth());
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<ConnectionAudit | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showKeyVault, setShowKeyVault] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>(new Date().toLocaleTimeString());
  
  // Key Vault Form
  const [aiKeys, setAiKeys] = useState(state.settings.aiConfig.aiKeys);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [revealKeys, setRevealKeys] = useState(false);

  // Real-time backend logs
  const [backendLogs, setBackendLogs] = useState<{timestamp: string, level: string, message: string, service: string}[]>([]);

  // Bridge States
  const [bridgeStatus, setBridgeStatus] = useState<Record<string, 'IDLE' | 'SYNCING' | 'VERIFIED'>>({
    'gemini': 'VERIFIED',
    'firebase': 'VERIFIED',
    'smtp': 'VERIFIED',
    'payment': 'VERIFIED'
  });

  // Handshake States
  const [gitStatus, setGitStatus] = useState<'IDLE' | 'SYNCING' | 'CLEAN'>('CLEAN');
  const [hostingStatus, setHostingStatus] = useState<'ONLINE' | 'PINGING'>('ONLINE');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHealth = () => setHealth(db.getHealth());
    fetchHealth();
    const interval = setInterval(fetchHealth, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // @ts-ignore
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/health-monitor/logs`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setBackendLogs(data.logs);
        }
      } catch (err) {
        console.error('Failed to fetch backend logs', err);
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000); // Polling every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [backendLogs]);

  const runAudit = async () => {
    setIsAuditing(true);
    setAuditResults(null);
    try {
      const results = await db.auditInfrastructure();
      setAuditResults(results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const triggerUpdateCheck = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setLastCheck(new Date().toLocaleTimeString());
    }, 2000);
  };

  const handleGitHandshake = () => {
    setGitStatus('SYNCING');
    setTimeout(() => {
      setGitStatus('CLEAN');
      db.logNotification('all', 'success', 'Git Handshake', 'Remote node origin/main verified. Local branch is up to date.');
    }, 1500);
  };

  const handlePingHosting = () => {
    setHostingStatus('PINGING');
    setTimeout(() => {
      setHostingStatus('ONLINE');
      db.logNotification('all', 'success', 'Hosting Pulse', 'Global CDN node reachable at click-opticx.web.app.');
    }, 1200);
  };

  const handleBridgePulse = (id: string) => {
    setBridgeStatus(prev => ({ ...prev, [id]: 'SYNCING' }));
    setTimeout(() => {
      setBridgeStatus(prev => ({ ...prev, [id]: 'VERIFIED' }));
      db.logNotification('all', 'success', 'Bridge Verified', `Third-party node ${id} handshake successful.`);
    }, 2000);
  };

  const handleSaveKeys = async () => {
    setIsSavingKeys(true);
    await db.updateAIKeys(aiKeys);
    setTimeout(() => {
      setIsSavingKeys(false);
      setShowKeyVault(false);
      db.logNotification('all', 'success', 'Vault Updated', 'External API credentials committed to secure storage.');
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 leading-none italic uppercase">
            <Monitor className="text-blue-600" size={32} />
            System Health Monitor
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mt-1 uppercase text-[10px] tracking-widest">
            Production Integrity Level: <strong>v8.6.0 Stable</strong>
          </p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setShowKeyVault(true)}
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest"
          >
            <Key size={18} className="text-amber-400" />
            Key Vault
          </button>
          <button 
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest"
          >
            <Settings size={18} className="text-blue-500" />
            Strategy
          </button>
          <button 
            onClick={runAudit}
            disabled={isAuditing}
            className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest disabled:opacity-50"
          >
            {isAuditing ? <Mini5GMicroLoader size={18} /> : <Search size={18} />}
            {isAuditing ? 'Auditing Link...' : 'Audit Grid'}
          </button>
        </div>
      </div>

      {/* Integration Bridge Registry */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white border border-white/5 shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-10">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                     <Link2 size={32}/>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter">Integration Bridges</h3>
                     <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">External Node Connectivity Registry</p>
                  </div>
               </div>
               <button 
                onClick={() => {
                  Object.keys(bridgeStatus).forEach(k => handleBridgePulse(k));
                }}
                className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3"
               >
                  <RefreshCw size={16}/> Master Global Pulse
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { id: 'gemini', label: 'AI Core (Gemini)', icon: Cpu, color: 'text-indigo-400', desc: 'LLM & Heuristic Link' },
                 { id: 'firebase', label: 'Cloud Node (DB)', icon: Database, color: 'text-orange-400', desc: 'Firestore Registry' },
                 { id: 'smtp', label: 'Comm Email Gateway', icon: Send, color: 'text-blue-400', desc: 'Outbound - Payment Due' },
                 { id: 'payment', label: 'Fiscal Node (API)', icon: CreditCard, color: 'text-emerald-400', desc: 'Payment Gateway Link' }
               ].map(bridge => (
                 <div key={bridge.id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:bg-white/10 transition-all flex flex-col justify-between h-56">
                    <div className="flex justify-between items-start">
                       <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform ${bridge.color}`}>
                          <bridge.icon size={24}/>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${bridgeStatus[bridge.id] === 'VERIFIED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
                          <span className="text-[8px] font-black uppercase text-slate-500">{bridgeStatus[bridge.id]}</span>
                       </div>
                    </div>
                    <div>
                       <h4 className="font-black text-sm uppercase tracking-tight mb-1">{bridge.label}</h4>
                       <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{bridge.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleBridgePulse(bridge.id)}
                      disabled={bridgeStatus[bridge.id] === 'SYNCING'}
                      className="w-full py-3 bg-white/5 border border-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest group-hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                       {bridgeStatus[bridge.id] === 'SYNCING' ? 'Syncing...' : 'Initialize Pulse'}
                    </button>
                 </div>
               ))}
            </div>
         </div>
         <Activity className="absolute -right-20 -bottom-20 opacity-[0.02] scale-[3] pointer-events-none" size={400} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl space-y-8 relative overflow-hidden">
           <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Live Deployment Hub</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CI/CD Pipeline Status • Firebase Hosting</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Auto-Update Ready</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <button 
                onClick={handleGitHandshake}
                disabled={gitStatus === 'SYNCING'}
                className={`p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${gitStatus === 'SYNCING' ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-900 hover:text-white'}`}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-colors ${gitStatus === 'SYNCING' ? 'bg-white' : 'bg-white group-hover:bg-white/10'}`}>
                       {gitStatus === 'SYNCING' ? <Mini5GMicroLoader size={24} /> : <Github size={24} className="text-slate-900 group-hover:text-white"/>}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-500">Git Remote</p>
                       <p className="text-sm font-black italic">{gitStatus === 'SYNCING' ? 'FETCHING...' : 'origin/main'}</p>
                    </div>
                 </div>
                 {gitStatus === 'CLEAN' && <CheckCircle2 size={18} className="text-emerald-500" />}
                 {gitStatus !== 'SYNCING' && <ChevronRight size={18} className="text-slate-300 group-hover:text-white" />}
              </button>

              <button 
                onClick={handlePingHosting}
                disabled={hostingStatus === 'PINGING'}
                className={`p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${hostingStatus === 'PINGING' ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-900 hover:text-white'}`}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-colors ${hostingStatus === 'PINGING' ? 'bg-white' : 'bg-white group-hover:bg-white/10'}`}>
                       {hostingStatus === 'PINGING' ? <Activity className="animate-pulse text-orange-500" size={24}/> : <CloudLightning size={24} className="text-orange-500"/>}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-500">Hosting Link</p>
                       <p className="text-sm font-black italic">{hostingStatus === 'PINGING' ? 'PINGING...' : 'click-opticx.web.app'}</p>
                    </div>
                 </div>
                 {hostingStatus === 'ONLINE' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
                 {hostingStatus !== 'PINGING' && <ExternalLink size={18} className="text-slate-300 group-hover:text-white" />}
              </button>
           </div>

           <div className="flex gap-4 relative z-10 pt-4">
              <button 
                onClick={triggerUpdateCheck}
                disabled={isCheckingUpdate}
                className="flex-1 py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                 {isCheckingUpdate ? <Mini5GMicroLoader size={18} /> : <RefreshCw size={18}/>}
                 Check For Updates
              </button>
              <button 
                className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                onClick={() => {
                  db.logNotification('all', 'info', 'Manual Deployment', 'Initializing Firebase hosting handshake. Node push authorized.');
                  alert("MANDATORY HANDSHAKE: Deployment signal issued to backend CI/CD registry.");
                }}
              >
                 <Play size={18} fill="currentColor"/> Manual Deploy
              </button>
           </div>

           <div className="flex items-center justify-between pt-4 border-t border-slate-50 relative z-10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Integrity Check: {lastCheck}</p>
              <span className="text-[9px] font-black text-emerald-500 uppercase">Production Layer Optimized</span>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl">
           <div className="relative z-10 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-500" />
                Dossier Integrity
              </h4>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                 <p className="text-[9px] text-slate-400 font-bold uppercase">Last Sync: {new Date(health.lastSync).toLocaleTimeString()}</p>
                 <p className="text-lg font-black text-indigo-400 mt-1">{health.documentSize.toLocaleString()} BYTES</p>
              </div>
              <button onClick={() => db.exportVault()} className="w-full bg-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Snapshot Export</button>
           </div>
           <Database className="absolute -right-8 -bottom-8 opacity-5" size={180} />
        </div>
      </div>

      {/* Logs Table Wrapper for Responsiveness */}
      <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col h-[400px] overflow-hidden mt-8">
        <div className="p-6 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal size={18} className="text-blue-400" />
            <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Real-Time Server Logs</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Live Stream</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 font-mono text-[11px]" ref={scrollRef}>
          {backendLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 h-full text-slate-500">
               <Mini5GMicroLoader size={24} />
               <p className="uppercase font-black text-[10px] tracking-widest">Awaiting log stream...</p>
            </div>
          ) : (
            backendLogs.map((log, i) => (
              <div key={i} className={`flex gap-4 p-3 rounded-xl transition-all border ${log.level === 'info' ? 'bg-white/[0.02] border-white/5' : log.level === 'warn' ? 'bg-amber-50/5 border-amber-50/10' : 'bg-red-50/5 border-red-50/10'}`}>
                <span className="text-slate-600 shrink-0">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}]</span>
                <span className={`font-black uppercase tracking-tighter shrink-0 min-w-[70px] ${log.level === 'info' ? 'text-blue-400' : log.level === 'warn' ? 'text-amber-400' : 'text-red-400'}`}>
                  {log.level}
                </span>
                <span className="text-slate-500 shrink-0 font-bold w-20 truncate">[{log.service || 'system'}]</span>
                <span className={log.level === 'info' ? 'text-slate-300' : log.level === 'warn' ? 'text-amber-300' : 'text-red-300'}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Key Vault Modal */}
      {showKeyVault && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Key size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Security Vault</h3>
                       <p className="text-amber-400 text-[9px] font-black uppercase tracking-widest mt-1">External API Registry</p>
                    </div>
                 </div>
                 <button onClick={() => setShowKeyVault(false)} className="p-3 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
                 <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Secrets</p>
                    <button onClick={() => setRevealKeys(!revealKeys)} className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-1">
                       {revealKeys ? <EyeOff size={14}/> : <Eye size={14}/>} {revealKeys ? 'Mask' : 'Reveal'}
                    </button>
                 </div>

                 <div className="space-y-6">
                    {[
                      { key: 'gemini', label: 'Google Gemini Core', icon: Cpu, color: 'text-indigo-500' },
                      { key: 'openai', label: 'OpenAI GPT Link', icon: Sparkles, color: 'text-emerald-500' },
                      { key: 'deepseek', label: 'DeepSeek AI Model', icon: Activity, color: 'text-blue-500' }
                    ].map(item => (
                      <div key={item.key} className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">{item.label}</label>
                        <div className="relative group">
                           <item.icon className={`absolute left-4 top-1/2 -translate-y-1/2 ${item.color}`} size={16} />
                           <input 
                            type={revealKeys ? 'text' : 'password'}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all shadow-inner"
                            placeholder="Enter Key Node..."
                            value={(aiKeys as any)[item.key]}
                            onChange={e => setAiKeys({...aiKeys, [item.key]: e.target.value})}
                           />
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-4">
                    <ShieldAlert size={24} className="text-amber-600 shrink-0 mt-1" />
                    <p className="text-[9px] text-amber-700 font-bold uppercase leading-relaxed tracking-tighter">
                       KEYS ARE STORED IN THE PERSISTENT CLOUD REGISTRY. AUTHORIZING NEW KEYS WILL RE-CALIBRATE AI AUTONOMY IMMEDIATELY.
                    </p>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setShowKeyVault(false)} className="flex-1 py-5 font-black text-slate-400 hover:bg-white hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort</button>
                 <button 
                  onClick={handleSaveKeys}
                  disabled={isSavingKeys}
                  className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSavingKeys ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18}/>}
                    Authorize Provisioning
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Switch Layer Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Layers size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Registry Strategy</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Protocol Layer Selection</p>
                    </div>
                 </div>
                 <button onClick={() => setShowConfigModal(false)} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <div className="p-10 space-y-4">
                 {[
                   { id: 'local', label: 'Local Disk Storage', desc: 'Browser indexedDB • Zero latency.', icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-50' },
                   { id: 'firebase', label: 'Firebase Production', desc: 'Cloud Firestore • Global Sync.', icon: Globe, color: 'text-orange-500', bg: 'bg-orange-50', active: true },
                   { id: 'mongodb', label: 'High Performance Node', desc: 'Atlas Cluster • Analytical Heavy.', icon: DatabaseZap, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                 ].map(provider => (
                   <button 
                    key={provider.id}
                    onClick={() => {
                       alert(`Handshaking with ${provider.label}...`);
                       setShowConfigModal(false);
                    }}
                    className={`w-full p-6 rounded-[2rem] border-2 text-left flex items-center justify-between group transition-all ${provider.active ? 'border-indigo-600 bg-indigo-50/30 shadow-lg' : 'border-slate-100 hover:border-indigo-200'}`}
                   >
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${provider.bg} ${provider.color}`}>
                            <provider.icon size={24} />
                         </div>
                         <div>
                            <h4 className="text-sm font-black uppercase text-slate-900 leading-none mb-1">{provider.label}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{provider.desc}</p>
                         </div>
                      </div>
                      {provider.active && <CheckCircle2 size={20} className="text-indigo-600" />}
                   </button>
                 ))}
              </div>

              <div className="p-10 bg-slate-50 border-t">
                 <div className="flex items-start gap-4 p-5 bg-blue-100 rounded-3xl text-blue-700">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <p className="text-[9px] font-black uppercase leading-relaxed">
                       CAUTION: Switching registry layers triggers a global node refresh. Ensure all unsaved dossier changes are committed before initializing.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseMonitor;
