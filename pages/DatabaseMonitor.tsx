import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState } from '../types';
import { db } from '../db';
import { 
  Database, Activity, Server, ShieldCheck, 
  Terminal, AlertTriangle, RefreshCw, Loader2,
  Settings, Download, Upload, X, Eye, EyeOff, Globe, DatabaseZap, Flame,
  CheckCircle2, HardDrive, FileJson, Monitor, Save, Key, Wifi, WifiOff, XCircle, Code2, Cpu, Zap, Search, ShieldAlert, AlertCircle, CloudLightning, Github, Play, Box, ChevronRight, ExternalLink, ListChecks, Layers, Link2, Sparkles, Command, Send, CreditCard, Clock
} from 'lucide-react';
import { Modal } from '../components/shared/Modal';

interface HealthData {
    timestamp: number;
    components: {
        ai: any;
        db: any;
        email: any;
        payments: any;
    };
    system_score: number;
    latency_ms: number;
}

const DatabaseMonitor: React.FC<{ state: AppState }> = ({ state }) => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [backendLogs, setBackendLogs] = useState<{timestamp: string, level: string, message: string, service: string}[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showKeyVault, setShowKeyVault] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [aiKeys, setAiKeys] = useState(state.settings.aiConfig.aiKeys);
  const [revealKeys, setRevealKeys] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  const isAdmin = state.auth?.role === 'SuperAdmin' || state.auth?.role === 'NetworkAdmin';

  // ─── Real-Time WebSocket Integration ──────────────────────────────────────────
  useEffect(() => {
    const socket = db.getSocket();
    if (!socket) return;

    // 1. Subscribe to Health Stream
    socket.on('health:update', (data: HealthData) => {
      setHealthData(data);
    });

    // 2. Subscribe to Live Logs
    socket.on('logs:stream', (log: any) => {
      setBackendLogs(prev => {
        const next = [...prev, log];
        return next.slice(-200); // Keep last 200 logs
      });
    });

    // Initial Request
    socket.emit('health:request');

    return () => {
      socket.off('health:update');
      socket.off('logs:stream');
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [backendLogs, autoScroll]);

  // ─── Computed Stats ────────────────────────────────────────────────────────────
  const isStale = useMemo(() => {
    if (!healthData) return true;
    return (Date.now() - healthData.timestamp) > 30000;
  }, [healthData]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return backendLogs;
    return backendLogs.filter(l => l.level === logFilter);
  }, [backendLogs, logFilter]);

  // ─── Actions ──────────────────────────────────────────────────────────────────
  const runAudit = async () => {
    setIsAuditing(true);
    db.getSocket()?.emit('health:request');
    setTimeout(() => setIsAuditing(false), 2000);
  };

  const handleSaveKeys = async () => {
    setIsSavingKeys(true);
    await db.updateAIKeys(aiKeys);
    setIsSavingKeys(false);
    setShowKeyVault(false);
    db.logNotification('all', 'success', 'Vault Updated', 'External API credentials committed to secure storage.');
  };

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(backendLogs, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString()}.txt`;
    a.click();
  };

  // ─── Render Helpers ──────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse">
                <ShieldCheck size={48} />
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic">System Integrity: {healthData?.system_score || 100}%</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">All core modules operational • Security Gated</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 leading-none italic uppercase">
            <Monitor className="text-blue-600" size={32} />
            System Health Monitor
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">
                Production Integrity Level: <strong>v8.6.0 Stable</strong>
             </p>
             {isStale && (
               <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Clock size={10} /> Stale Data
               </span>
             )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => setShowKeyVault(true)} className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest">
            <Key size={18} className="text-amber-400" /> Key Vault
          </button>
          <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest">
            <Settings size={18} className="text-blue-500" /> Strategy
          </button>
          <button onClick={runAudit} disabled={isAuditing} className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest disabled:opacity-50">
            {isAuditing ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
            {isAuditing ? 'Auditing Link...' : 'Audit Grid'}
          </button>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white border border-white/5 shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-10">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
               <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${healthData?.system_score && healthData.system_score > 90 ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                     <Zap size={32}/>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter">System Integrity: {healthData?.system_score || '--'}%</h3>
                     <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Real-Time Global Node Pulse</p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg Latency</p>
                     <p className="text-lg font-black text-white">{healthData?.latency_ms || '--'}ms</p>
                  </div>
                  <button onClick={() => db.getSocket()?.emit('health:request')} className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all">
                    <RefreshCw size={20} className={isAuditing ? 'animate-spin' : ''} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { id: 'ai', label: 'AI Core', icon: Cpu, color: 'text-blue-400', key: 'ai' },
                 { id: 'db', label: 'Cloud Node', icon: Database, color: 'text-orange-400', key: 'db' },
                 { id: 'email', label: 'Comm Email', icon: Send, color: 'text-blue-400', key: 'email' },
                 { id: 'payments', label: 'Fiscal Node', icon: CreditCard, color: 'text-green-400', key: 'payments' }
               ].map(bridge => {
                  const status = healthData?.components[bridge.key] || { status: 'pending' };
                  return (
                    <div key={bridge.id} className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:bg-white/10 transition-all flex flex-col justify-between h-56">
                       <div className="flex justify-between items-start">
                          <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform ${bridge.color}`}>
                             <bridge.icon size={24}/>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${status.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : status.status === 'degraded' ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`}></div>
                             <span className="text-[8px] font-black uppercase text-slate-500">{status.status}</span>
                          </div>
                       </div>
                       <div>
                          <h4 className="font-black text-sm uppercase tracking-tight mb-1">{bridge.label}</h4>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                            {status.latency_ms ? `Latency: ${status.latency_ms}ms` : 'Telemetry Pending...'}
                          </p>
                       </div>
                       <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${status.status === 'healthy' ? 'bg-emerald-500 w-full' : status.status === 'degraded' ? 'bg-amber-500 w-1/2' : 'w-0'}`} />
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Logs Panel */}
        <div className="lg:col-span-2 bg-slate-950 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col h-[600px] overflow-hidden">
          <div className="p-6 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-blue-400" />
              <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Real-Time Server Logs</h3>
              <div className="flex gap-2 ml-4">
                 {['all', 'info', 'warn', 'error'].map(f => (
                   <button key={f} onClick={() => setLogFilter(f as any)} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${logFilter === f ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}>
                     {f}
                   </button>
                 ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setAutoScroll(!autoScroll)} className={`text-[9px] font-black uppercase tracking-widest ${autoScroll ? 'text-blue-400' : 'text-slate-500'}`}>
                {autoScroll ? 'Auto-Scroll ON' : 'Auto-Scroll OFF'}
              </button>
              <button onClick={exportLogs} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                <Download size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 font-mono text-[11px]" ref={scrollRef}>
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 h-full text-slate-500 text-center">
                 <Mini5GMicroLoader size={24} />
                 <p className="uppercase font-black text-[10px] tracking-widest mt-4">Awaiting live log stream...</p>
                 <p className="text-[8px] uppercase tracking-widest mt-1 opacity-50">Authorized Handshake: Online</p>
              </div>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className={`flex gap-4 p-3 rounded-xl transition-all border group hover:bg-white/[0.04] ${log.level === 'info' ? 'bg-white/[0.02] border-white/5' : log.level === 'warn' ? 'bg-amber-50/5 border-amber-50/10' : 'bg-red-50/5 border-red-50/10'}`}>
                  <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
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

        <div className="space-y-6">
           {/* Dossier Card */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-6">
                <Database size={14} className="text-blue-500" /> Dossier Integrity
              </h4>
              <div className="space-y-4">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total State Payload</p>
                    <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{(JSON.stringify(state).length / 1024).toFixed(2)} KB</p>
                 </div>
                 <button onClick={() => db.exportVault()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Snapshot Export
                 </button>
              </div>
              <DatabaseZap className="absolute -right-8 -bottom-8 opacity-[0.02]" size={150} />
           </div>

           {/* Deployment Card */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-6">
                <CloudLightning size={14} className="text-orange-500" /> Deployment Hub
              </h4>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Github size={18} className="text-slate-900" />
                       <span className="text-[10px] font-black uppercase italic">origin/main</span>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-500" />
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <Globe size={18} className="text-orange-500" />
                       <span className="text-[10px] font-black uppercase italic">hosting_node_prod</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 </div>
                 <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">
                    Trigger Manual Push
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Key Vault Modal (Existing logic preserved) */}
      <Modal isOpen={showKeyVault} onClose={() => setShowKeyVault(false)} title="Security Vault" type="info" icon={<Key size={24} className="text-blue-500" />} maxWidth="max-w-lg"
        footer={
          <div className="flex gap-4 w-full">
            <button onClick={() => setShowKeyVault(false)} className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort</button>
            <button onClick={handleSaveKeys} disabled={isSavingKeys} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
              {isSavingKeys ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18}/>}
              Authorize Provisioning
            </button>
          </div>
        }
      >
        <div className="space-y-8">
          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Protocol Secrets</p>
            <button onClick={() => setRevealKeys(!revealKeys)} className="text-[9px] font-black uppercase text-blue-400 flex items-center gap-1">
              {revealKeys ? <EyeOff size={14}/> : <Eye size={14}/>} {revealKeys ? 'Mask' : 'Reveal'}
            </button>
          </div>
          <div className="space-y-6">
            {[{ key: 'gemini', label: 'Google Gemini Core', icon: Cpu, color: 'text-blue-400' }, { key: 'openai', label: 'OpenAI GPT Link', icon: Sparkles, color: 'text-amber-400' }].map(item => (
              <div key={item.key} className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic">{item.label}</label>
                <div className="relative group">
                   <item.icon className={`absolute left-4 top-1/2 -translate-y-1/2 ${item.color}`} size={16} />
                   <input type={revealKeys ? 'text' : 'password'} className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl font-black text-sm text-white outline-none focus:border-blue-500 transition-all" value={(aiKeys as any)[item.key]} onChange={e => setAiKeys({...aiKeys, [item.key]: e.target.value})} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Registry Strategy Modal */}
      <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Registry Strategy" type="info" icon={<Layers size={24} className="text-blue-500" />} maxWidth="max-w-lg">
        <div className="space-y-4">
          {[{ id: 'local', label: 'Local Disk Storage', desc: 'indexedDB', icon: HardDrive, color: 'text-blue-400' }, { id: 'supabase', label: 'Supabase Matrix', desc: 'PostgreSQL • Primary', icon: Database, color: 'text-emerald-400', active: true }].map(provider => (
            <button key={provider.id} className={`w-full p-5 rounded-2xl border transition-all text-left flex items-center justify-between ${provider.active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${provider.color} bg-white`}>
                  <provider.icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase leading-none mb-1">{provider.label}</h4>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{provider.desc}</p>
                </div>
              </div>
              {provider.active && <CheckCircle2 size={18} className="text-blue-500" />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default DatabaseMonitor;
