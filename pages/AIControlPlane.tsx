
import React, { useState, useMemo } from 'react';
import { AppState, Role, AIConfig, AIActionLog, UserStatus } from '../types';
import { db } from '../db';
import { 
  Cpu, ShieldAlert, Zap, Layers, Terminal, Activity, 
  Settings, RefreshCw, BarChart3, TrendingUp, Search,
  Lock, ShieldCheck, Play, Box, Info, X, ChevronRight,
  Database, Eye, EyeOff, Bot, Sparkles, Sliders, ListChecks,
  AlertTriangle, History, Power, Scale, Briefcase, FileSearch,
  Plus, Code2, CreditCard, Globe, FileText, HeartPulse, Fingerprint,
  TrendingDown, Gauge, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type SubView = 'dashboard' | 'confidence' | 'rules' | 'ledger' | 'emergency' | 'training' | 'killswitch' | 'logs';

const AIControlPlane: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeView, setActiveView] = useState<SubView>('dashboard');
  const [config, setConfig] = useState<AIConfig>(state.settings.aiConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveConfig = async (newConfig: AIConfig) => {
    setIsSaving(true);
    await db.updateAIConfig(newConfig);
    setConfig(newConfig);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'AI Node Updated', 'Handshake synchronized across the heuristic grid.');
    }, 600);
  };

  const handleToggleKillSwitch = async () => {
    const next = !config.killSwitchActive;
    if (next && !confirm("GLOBAL SHUTDOWN: Are you sure you want to disable all autonomous AI operations? Suggestions and automation will cease immediately.")) return;
    
    setIsSaving(true);
    await db.toggleAIKillSwitch(next);
    setConfig(prev => ({ ...prev, killSwitchActive: next }));
    setIsSaving(false);
  };

  const healthScore = useMemo(() => {
    if (config.killSwitchActive) return 0;
    const errorFactor = Math.max(0, 10 - (state.aiEvents.filter(e => e.isError).length / 10));
    return Math.round(90 + errorFactor);
  }, [state.aiEvents, config.killSwitchActive]);

  const frictionScore = useMemo(() => {
    const failures = state.aiEvents.filter(e => e.action.includes('failure')).length;
    return Math.min(100, failures * 5);
  }, [state.aiEvents]);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className={`p-10 rounded-[3rem] border-4 transition-all duration-700 relative overflow-hidden shadow-2xl ${config.killSwitchActive ? 'bg-rose-950 border-rose-500' : 'bg-slate-950 border-indigo-600'}`}>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.killSwitchActive ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                  <h3 className="text-xl font-black uppercase tracking-widest text-white">System Status: {config.killSwitchActive ? 'OFFLINE (KILL-SWITCH ACTIVE)' : 'OPERATIONAL'}</h3>
               </div>
               <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed max-w-xl italic">
                  Registry integrity verified at {healthScore}%. AI core is currently processing regional behavioral telemetry.
               </p>
            </div>
            <button 
              onClick={handleToggleKillSwitch}
              className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 ${config.killSwitchActive ? 'bg-emerald-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-rose-600 text-white shadow-[0_0_40px_rgba(225,29,72,0.3)]'}`}
            >
               <Power size={18} />
               {config.killSwitchActive ? 'Re-Initialize Core' : 'Global Kill-Switch'}
            </button>
         </div>
         <Cpu className="absolute -right-20 -bottom-20 opacity-5 scale-[3] text-indigo-400" size={300} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'System Health', value: `${healthScore}%`, icon: HeartPulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'UX Friction', value: `${frictionScore}%`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Bug Alerts', value: state.aiEvents.filter(e => e.isError).length, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Active Rules', value: '14', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className={`${kpi.bg} ${kpi.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><kpi.icon size={20}/></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
             <h3 className="text-2xl font-black text-slate-900 mt-1 italic tracking-tighter">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={14} className="text-rose-500" /> Confusing Pages Registry</h3>
               <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase">Friction Detected</span>
            </div>
            <div className="space-y-3">
               {[
                 { page: 'Payment Modal', msg: 'Users clicking 3+ times before confirmation.', friction: 'High' },
                 { page: 'Identity Reset', msg: 'Drop-off rate exceeded 40% on Step 2.', friction: 'High' },
                 { page: 'Plan Switch', msg: 'Conflicting clicks detected on toggle nodes.', friction: 'Medium' }
               ].map((alert, i) => (
                 <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-rose-200 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-1.5 h-8 bg-rose-500 rounded-full group-hover:scale-y-125 transition-transform"></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">{alert.page}</p>
                          <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">{alert.msg}</p>
                       </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-indigo-500" /> Heuristic Insight Queue</h3>
               <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase">{state.aiSuggestions.length} Operations</span>
            </div>
            <div className="space-y-3">
               {state.aiSuggestions.slice(0, 3).map((sug, i) => (
                 <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all"><Zap size={16}/></div>
                       <div>
                          <span className="text-[8px] font-black text-indigo-600 uppercase">{sug.category}</span>
                          <p className="text-[10px] text-slate-900 font-bold uppercase line-clamp-1">{sug.title}</p>
                       </div>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[8px] uppercase tracking-widest active:scale-95 transition-all">View</button>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );

  const renderConfidence = () => (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-12 animate-in slide-in-from-right-4 duration-500">
       <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Confidence Scoring Architecture</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol: Decision Gating v4.0</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-10">
             {[
               { id: 'block', label: 'Safety Cut-off (Block)', color: 'rose' },
               { id: 'suggest', label: 'Suggestion Floor', color: 'amber' },
               { id: 'confirm', label: 'Autonomous Limit', color: 'emerald' }
             ].map((th) => (
               <div key={th.id} className="space-y-4">
                  <div className="flex justify-between items-end">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{th.label}</label>
                     <span className={`text-xl font-black italic text-${th.color}-600`}>{(config.thresholds as any)[th.id].toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01" 
                    className={`w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-${th.color}-600`}
                    value={(config.thresholds as any)[th.id]}
                    onChange={e => {
                      const next = { ...config, thresholds: { ...config.thresholds, [th.id]: parseFloat(e.target.value) } };
                      setConfig(next);
                    }}
                  />
               </div>
             ))}
             <button onClick={() => handleSaveConfig(config)} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Synchronize Thresholds</button>
          </div>

          <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-8 border border-slate-100 shadow-inner">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Logic Outcome Preview</h4>
             <div className="space-y-4">
                <div className="p-5 bg-white rounded-2xl border-2 border-rose-100 flex justify-between items-center opacity-40 grayscale">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Score &lt; {config.thresholds.block}</span>
                   <span className="text-[9px] font-black text-rose-600 uppercase border border-rose-200 px-3 py-1 rounded-full">ACTION_BLOCKED</span>
                </div>
                <div className="p-5 bg-white rounded-2xl border-2 border-amber-100 flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-800 uppercase">Score {config.thresholds.block} - {config.thresholds.suggest}</span>
                   <span className="text-[9px] font-black text-amber-600 uppercase border border-amber-200 px-3 py-1 rounded-full">UI_SUGGESTION_ONLY</span>
                </div>
                <div className="p-5 bg-white rounded-2xl border-2 border-blue-100 flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-800 uppercase">Score {config.thresholds.suggest} - {config.thresholds.confirm}</span>
                   <span className="text-[9px] font-black text-blue-600 uppercase border border-blue-200 px-3 py-1 rounded-full">ADMIN_CONFIRMATION</span>
                </div>
                <div className="p-5 bg-white rounded-2xl border-2 border-emerald-100 flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-800 uppercase">Score &gt; {config.thresholds.confirm}</span>
                   <span className="text-[9px] font-black text-emerald-600 uppercase border border-emerald-200 px-3 py-1 rounded-full">AUTONOMOUS_EXECUTION</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderRules = () => (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10 animate-in slide-in-from-right-4 duration-500">
       <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Heuristic Rulebook (DSL)</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol: Behavioral Guardrails</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95"><Plus size={16}/> New Rule</button>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {[
            { name: 'EmergencyLoadSafety', code: 'WHEN emergency_requests > 2 IN 10 DAYS\nAND confidence < 0.65\nTHEN\n  BLOCK emergency_load\n  SHOW message "Please clear previous dues"', status: 'ACTIVE' },
            { name: 'FraudScoreAutoDeduct', code: 'WHEN payment_decline_streak >= 3\nAND risk_rank > HIGH\nTHEN\n  SUGGEST credit_adjustment -50\n  WARN admin "Potential fraud node detected"', status: 'ACTIVE' },
            { name: 'PeakHourThrottle', code: 'WHEN node_load > 90%\nTHEN\n  NOTIFY admin "Port saturation alert"\n  SUGGEST dynamic_bandwidth_limit', status: 'STANDBY' }
          ].map((rule, i) => (
            <div key={i} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row gap-8 ${rule.status === 'ACTIVE' ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-50 bg-slate-50 grayscale opacity-60'}`}>
               <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                     <Code2 size={20} className="text-indigo-500" />
                     <h4 className="text-lg font-black uppercase italic text-slate-900">{rule.name}</h4>
                     <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>{rule.status}</span>
                  </div>
                  <pre className="p-6 bg-slate-950 text-indigo-400 rounded-3xl font-mono text-[11px] leading-relaxed shadow-inner">
                    {rule.code}
                  </pre>
               </div>
               <div className="md:w-48 flex flex-col gap-3 shrink-0 justify-center">
                  <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[9px] uppercase hover:bg-slate-50 shadow-sm transition-all">Simulation Test</button>
                  <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase shadow-xl transition-all">Modify Rule</button>
                  <button className="w-full py-3 text-rose-500 font-black text-[9px] uppercase hover:bg-rose-50 rounded-xl transition-all">Destroy Node</button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );

  const renderLedgerSafety = () => (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-12 animate-in slide-in-from-right-4 duration-500">
       <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 border border-rose-100 shadow-inner">
             <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Fiscal Air-Gap (Immutable)</h3>
            <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest">Hard Security Logic: AI CAN NEVER WRITE TO LEDGER</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { level: 'READ', icon: Eye, status: 'AUTHORIZED', desc: 'Full telemetry access to invoices, ledger, and payment nodes.', color: 'text-emerald-500' },
            { level: 'SUGGEST', icon: Sparkles, status: 'AUTHORIZED', desc: 'Identify inconsistencies and flag potential manual adjustments.', color: 'text-emerald-500' },
            { level: 'EXECUTE', icon: Zap, status: 'HARD_LOCKED', desc: 'Creating double-entry items or modifying wallet balances.', color: 'text-rose-600' }
          ].map(l => (
            <div key={l.level} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all h-64">
               <div>
                  <div className="flex justify-between items-start mb-6">
                     <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform ${l.color}`}>
                        <l.icon size={24}/>
                     </div>
                     <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${l.status === 'AUTHORIZED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {l.status}
                     </span>
                  </div>
                  <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">LVL_{l.level}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{l.desc}</p>
               </div>
               <div className={`h-1.5 w-full rounded-full ${l.status === 'AUTHORIZED' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            </div>
          ))}
       </div>

       <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-start gap-6">
          <Info size={24} className="text-indigo-600 shrink-0 mt-1" />
          <div>
            <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest mb-1">Safety Scenario 42-A</p>
            <p className="text-[10px] text-indigo-700 font-bold leading-relaxed uppercase opacity-80">
               If AI detects an Invoice (2000) vs Wallet Deduction (1800) mismatch, it will trigger an **Administrative Alert** but is physically blocked from creating the Rs 200 balancing entry.
            </p>
          </div>
       </div>
    </div>
  );

  const renderKillSwitch = () => (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-12 animate-in slide-in-from-right-4 duration-500">
       <div className="text-center max-w-2xl mx-auto space-y-8">
          <div className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto transition-all duration-700 border-[10px] ${config.killSwitchActive ? 'bg-emerald-500 text-white border-emerald-100 shadow-[0_0_60px_rgba(16,185,129,0.4)]' : 'bg-rose-600 text-white border-rose-100 shadow-[0_0_60px_rgba(225,29,72,0.4)] animate-pulse'}`}>
             <Power size={64} />
          </div>
          <div className="space-y-4">
             <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Emergency Null Protocol</h3>
             <p className="text-sm font-bold text-slate-500 uppercase leading-relaxed px-12">
               Activating the master kill-switch immediately severs all digital handshakes between the heuristic core and the production registry.
             </p>
          </div>
          <button 
            onClick={handleToggleKillSwitch}
            className={`w-full py-8 rounded-[2.5rem] font-black text-lg uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-6 ${config.killSwitchActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
          >
             {config.killSwitchActive ? <RefreshCw className="animate-spin-slow" size={32}/> : <ShieldAlert size={32} />}
             {config.killSwitchActive ? 'RE-INITIALIZE AUTONOMY' : 'ENGAGE TOTAL KILL-SWITCH'}
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(config.modules).map(([name, mod]: [string, any]) => (
            <div key={name} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center gap-4 group">
               <div className={`p-4 rounded-2xl transition-all ${mod.enabled ? 'bg-white text-indigo-600 shadow-sm group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                  {name === 'payments' ? <CreditCard size={24}/> : name === 'emergency' ? <Zap size={24}/> : name === 'network' ? <Globe size={24}/> : <ShieldAlert size={24}/>}
               </div>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{name} AI Node</span>
               <button 
                onClick={() => {
                   const next = { ...config, modules: { ...config.modules, [name]: { ...mod, enabled: !mod.enabled } } };
                   handleSaveConfig(next);
                }}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 ${mod.enabled && !config.killSwitchActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
               >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${mod.enabled && !config.killSwitchActive ? 'left-7' : 'left-1'}`}></div>
               </button>
            </div>
          ))}
       </div>

       <div className="p-10 bg-slate-950 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-2">
             <h4 className="text-xl font-black italic uppercase text-indigo-400">Registry Rollback</h4>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Revert AI state nodes to a known clean timestamp.</p>
          </div>
          <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center gap-3">
             <RefreshCw size={18} /> Revert AI State v8.4.2
          </button>
       </div>
    </div>
  );

  const renderLogs = () => (
    <div className="bg-slate-950 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col h-[750px] overflow-hidden animate-in slide-in-from-right-4 duration-500">
       <div className="p-8 bg-slate-900/50 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Terminal size={28} />
             </div>
             <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Transparency Ledger</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">Audit Trail v4.2 • Registry Handshakes: {state.aiLogs.length}</p>
             </div>
          </div>
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white outline-none focus:border-indigo-500 transition-all" placeholder="Audit logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">Export JSON</button>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white/[0.01]">
          <div className="grid grid-cols-1 gap-2">
             {state.aiLogs.filter(log => log.action.includes(searchTerm.toUpperCase()) || log.reason.includes(searchTerm)).map(log => (
               <div key={log.id} className="group p-5 hover:bg-white/[0.03] border border-white/5 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5 flex-1">
                     <div className="w-1.5 h-10 bg-indigo-500 rounded-full group-hover:scale-y-125 transition-transform shrink-0"></div>
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{log.action}</span>
                           <span className="text-[8px] text-slate-600 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-300 uppercase leading-relaxed">{log.reason}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-8 shrink-0">
                     <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                           <span className="text-[8px] font-black uppercase text-emerald-500">Conf: {Math.round(log.confidence * 100)}%</span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Node: {log.targetId}</p>
                     </div>
                     <button className="p-3 bg-white/5 text-slate-500 rounded-xl hover:text-white transition-colors">
                        <Box size={18}/>
                     </button>
                  </div>
               </div>
             ))}
          </div>
       </div>
    </div>
  );

  const renderTrainingData = () => (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-12 animate-in slide-in-from-right-4 duration-500">
       <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Heuristic Training Schema</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol: Knowledge Distillation Registry</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(config.trainingSources).map(([source, active]: [string, any]) => (
            <div key={source} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col gap-6 ${active ? 'border-emerald-100 bg-white shadow-lg' : 'border-slate-50 bg-slate-50 grayscale opacity-60'}`}>
               <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-300'}`}>
                     {source === 'invoices' ? <FileText size={20}/> : source === 'ledger' ? <Database size={20}/> : source === 'emergency' ? <Zap size={20}/> : <Activity size={20}/>}
                  </div>
                  <button 
                    onClick={() => {
                       const next = { ...config, trainingSources: { ...config.trainingSources, [source]: !active } };
                       handleSaveConfig(next);
                    }}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-emerald-600 shadow-xl' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase text-slate-900 leading-none mb-1">{source} Data Node</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Read-Only Link Active</p>
               </div>
            </div>
          ))}
       </div>

       <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-6 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-3">
                <Scale className="text-indigo-400" size={24}/>
                <h4 className="text-xl font-black uppercase italic tracking-tighter">AI Knowledge Sanitization</h4>
             </div>
             <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase italic">AI distillation uses anonymized subscriber IDs. Individual node privacy is preserved at the cryptographic handshake layer.</p>
             <button className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Clear AI Collective Memory</button>
          </div>
          <Layers className="absolute -right-16 -bottom-16 opacity-5 scale-150" size={300} />
       </div>
    </div>
  );

  const renderEmergencyAI = () => (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-12 animate-in slide-in-from-right-4 duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Emergency Load Eligibility Core</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol: ELGuardian v2.1 (Behavioral Lock)</p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4">
             <ShieldCheck className="text-emerald-600" size={32}/>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Suppression</p>
                <p className="text-lg font-black text-emerald-700 italic leading-none">HIGH EFFICACY</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100 pb-2">Active Abuse Watchlist</h4>
             <div className="space-y-3">
                {[
                  { user: 'USR-842', risk: 0.94, reason: 'Cyclical EL Default' },
                  { user: 'USR-112', risk: 0.88, reason: 'Rapid Package Migration' },
                  { user: 'USR-339', risk: 0.82, reason: 'High Wallet Volatility' }
                ].map(r => (
                  <div key={r.user} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-rose-300 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border shadow-sm group-hover:bg-rose-500 group-hover:text-white transition-all"><FileSearch size={18}/></div>
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase">{r.user}</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase">{r.reason}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-lg font-black text-rose-600 italic">{(r.risk * 100).toFixed(0)}%</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase">RISK RANK</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-8">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100 pb-2">Eligibility Formula Synthesis</h4>
             <div className="bg-slate-950 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-4 text-center">
                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-indigo-300 uppercase">Base System Rule (600+)</div>
                   <div className="text-slate-500 text-xl font-black">+</div>
                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-emerald-400 uppercase">AI Confidence Score (&gt;0.65)</div>
                   <div className="text-slate-500 text-xl font-black">+</div>
                   <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-rose-400 uppercase">Risk Behavior Audit</div>
                   <div className="text-indigo-600 text-3xl font-black">=</div>
                   <div className="p-6 bg-indigo-600 rounded-2xl text-lg font-black uppercase italic tracking-tighter">FINAL SUGGESTION</div>
                </div>
                <Activity className="absolute -right-12 -bottom-12 opacity-5 scale-[2]" size={200} />
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-8 pb-32">
       {/* Global Sub-Nav */}
       <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1 shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Cpu },
            { id: 'confidence', label: 'Confidence Gating', icon: Sliders },
            { id: 'rules', label: 'Automation Rules', icon: Code2 },
            { id: 'ledger', label: 'Ledger Safety', icon: Lock },
            { id: 'emergency', label: 'Load Guardian', icon: ShieldCheck },
            { id: 'training', label: 'Training Data', icon: Database },
            { id: 'killswitch', label: 'Master Override', icon: Power },
            { id: 'logs', label: 'Transparency', icon: ListChecks }
          ].map(view => (
            <button 
              key={view.id}
              onClick={() => setActiveView(view.id as SubView)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === view.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
               <view.icon size={14} />
               {view.label}
            </button>
          ))}
       </div>

       {/* View Renderer */}
       <div className="flex-1">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'confidence' && renderConfidence()}
          {activeView === 'rules' && renderRules()}
          {activeView === 'ledger' && renderLedgerSafety()}
          {activeView === 'emergency' && renderEmergencyAI()}
          {activeView === 'training' && renderTrainingData()}
          {activeView === 'killswitch' && renderKillSwitch()}
          {activeView === 'logs' && renderLogs()}
       </div>
    </div>
  );
};

export default AIControlPlane;
