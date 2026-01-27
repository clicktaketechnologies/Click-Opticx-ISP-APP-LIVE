
import React, { useState, useMemo } from 'react';
import { AppState, AICallLog, AICallRule, Role, AICallConfig, AICallPersona } from '../types';
import { db } from '../db';
import { 
  Mic, Activity, ShieldAlert, History, Settings, Power, 
  Trash2, Plus, X, Search, Clock, CheckCircle, 
  PhoneCall, Zap, User, AlertCircle, Headphones, 
  Volume2, VolumeX, MessageSquare, Briefcase, RefreshCw, ChevronRight,
  ShieldCheck, Smartphone, Bot, Save, ListChecks, ArrowUpRight, ArrowRight, CreditCard, UserCircle, Timer, Sliders,
  HeadphonesIcon, Shield, AlertTriangle, Play, TrendingUp, Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AICallingAdmin: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'personality' | 'rules' | 'logs'>('dashboard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [callConfig, setCallConfig] = useState<AICallConfig>(state.settings.aiCallConfig);
  const [searchTerm, setSearchTerm] = useState('');
  const [takeoverSession, setTakeoverSession] = useState<AICallLog | null>(null);

  const totalCallsToday = useMemo(() => 
    state.aiCallLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length + 42,
  [state.aiCallLogs]);

  const stats = useMemo(() => {
     const issues = [
        { name: 'Internet Down', value: 42 },
        { name: 'Slow Speed', value: 31 },
        { name: 'Billing', value: 19 },
        { name: 'Device Issue', value: 8 }
     ];
     return { issues };
  }, []);

  const handleUpdateConfig = async (newConfig: AICallConfig) => {
    setIsProcessing(true);
    await db.updateAICallConfig(newConfig);
    setCallConfig(newConfig);
    setTimeout(() => setIsProcessing(false), 600);
    db.logNotification('all', 'success', 'Voice Registry Update', 'AI voice parameters synchronized globally.');
  };

  const toggleMaster = () => {
    handleUpdateConfig({ ...callConfig, enabled: !callConfig.enabled });
  };

  const handleTakeover = (log: any) => {
     setTakeoverSession(log);
     db.logNotification('all', 'warning', 'Human Takeover', `Agent joining live session with ${log.userName}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center border-4 border-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.3)] group relative">
              <Mic className="text-indigo-400 group-hover:scale-110 transition-transform" size={32} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse"></div>
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Voice AI Control Plane</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3">Autonomous Call Orchestration v9.0</p>
           </div>
        </div>
        <div className={`p-4 rounded-[2rem] border-2 flex items-center gap-6 transition-all ${!callConfig.enabled ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase text-slate-500">Node Status</p>
               <p className={`text-xs font-black uppercase italic ${!callConfig.enabled ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {callConfig.enabled ? 'OPERATIONAL' : 'LOCKED'}
               </p>
            </div>
            <button 
             onClick={toggleMaster}
             disabled={isProcessing}
             className={`w-14 h-7 rounded-full relative transition-all duration-500 ${callConfig.enabled ? 'bg-emerald-600 shadow-lg shadow-emerald-100' : 'bg-rose-600 shadow-lg shadow-rose-100'}`}
            >
               <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-500 ${callConfig.enabled ? 'left-8' : 'left-1'}`}></div>
            </button>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1">
        {[
          { id: 'dashboard', label: 'Overview', icon: Activity },
          { id: 'settings', label: 'Global Settings', icon: Settings },
          { id: 'personality', label: 'Voice & Personality', icon: HeadphonesIcon },
          { id: 'rules', label: 'Handoff Rules', icon: Zap },
          { id: 'logs', label: 'Call Registry', icon: History }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Active Sessions', value: 12, icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Avg Confidence', value: '91%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Escalation Rate', value: '18%', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Total Volume', value: totalCallsToday, icon: History, color: 'text-indigo-600', bg: 'bg-indigo-50' }
              ].map((kpi, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
                   <div className={`${kpi.bg} ${kpi.color} p-4 rounded-2xl w-fit mb-4`}><kpi.icon size={20}/></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">{kpi.label}</p>
                   <h3 className="text-3xl font-black text-slate-900 mt-1 italic tracking-tighter relative z-10">{kpi.value}</h3>
                </div>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" /> Topic Distribution
                 </h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats.issues}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Live AI Monitor</h3>
                    <div className="space-y-4">
                       {[
                         { user: 'Ahmed', issue: 'Internet Down', conf: 52 },
                         { user: 'Sara', issue: 'Billing Query', conf: 94 }
                       ].map(call => (
                         <div key={call.user} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div>
                               <p className="text-xs font-black uppercase">{call.user}</p>
                               <p className="text-[8px] text-slate-500 font-bold uppercase">{call.issue}</p>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className={`text-[10px] font-black italic ${call.conf < 60 ? 'text-rose-400' : 'text-emerald-400'}`}>{call.conf}%</span>
                               <button 
                                onClick={() => handleTakeover(call)}
                                className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all"
                               >
                                  <HeadphonesIcon size={14}/>
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <Activity className="absolute -right-12 -bottom-12 opacity-5 scale-[2]" size={180} />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-12 animate-in slide-in-from-right-4 duration-500">
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Global Voice Parameters</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Protocol: Operational Compliance v9.0</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                    <div>
                       <h4 className="text-xs font-black uppercase text-slate-900">Allow User Calls</h4>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">Toggle visibility on subscriber dashboard</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateConfig({...callConfig, enabled: !callConfig.enabled})}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${callConfig.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                       <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${callConfig.enabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Office Hours</label>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="relative">
                          <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="time" className="w-full pl-11 p-4 bg-slate-50 border rounded-2xl font-black text-sm" value={callConfig.officeHours.start} />
                       </div>
                       <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="time" className="w-full pl-11 p-4 bg-slate-50 border rounded-2xl font-black text-sm" value={callConfig.officeHours.end} />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Max Pulse Width (Duration Sec)</label>
                    <div className="flex items-center gap-6">
                       <input type="range" min="60" max="1800" step="60" className="flex-1 h-2 bg-slate-100 rounded-full appearance-none accent-indigo-600" value={callConfig.maxCallDuration} />
                       <span className="w-20 text-center py-2 bg-slate-950 text-white rounded-xl font-black text-xs italic">{Math.floor(callConfig.maxCallDuration / 60)}m</span>
                    </div>
                 </div>
                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
                    <Info className="text-blue-600 mt-1 shrink-0" size={24} />
                    <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed">
                       Shorter durations optimize node concurrency. High-priority escalations bypass these limits if a Human Agent takes over.
                    </p>
                 </div>
              </div>
           </div>
           
           <button onClick={() => handleUpdateConfig(callConfig)} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3">
              <Save size={20}/> Synchronize Registry Node
           </button>
        </div>
      )}

      {activeTab === 'personality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Vocal Architecture</h3>
              
              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Node Archetype (Persona)</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['Calm', 'Friendly', 'Professional', 'Strict'].map((p: any) => (
                         <button 
                          key={p}
                          onClick={() => setCallConfig({ ...callConfig, persona: p })}
                          className={`p-6 rounded-[2rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all ${callConfig.persona === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                         >
                            {p} Tone
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Voice Relay Engine</label>
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-sm uppercase">
                       <option value="Zephyr">Zephyr (Deep Male - UK)</option>
                       <option value="Kore">Kore (Soft Female - US)</option>
                       <option value="Puck">Puck (Energetic Male - PK)</option>
                    </select>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden flex flex-col justify-center text-center flex-1">
                 <div className="relative z-10 space-y-6">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border-4 border-white/5 group active:scale-95 transition-all cursor-pointer">
                       <Volume2 size={48} className="text-white animate-pulse" />
                    </div>
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Diagnostic Test</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Publish a diagnostic vocal broadcast to verify persona and language handshake.</p>
                 </div>
                 <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[3] text-indigo-400" size={300} />
              </div>
              <button className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Publish Vocal Transformation</button>
           </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-8 animate-in slide-in-from-right-4">
           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
              <div className="flex justify-between items-end">
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Handover Logic (Escalation)</h3>
                    <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Define conditional triggers for Human Takeover</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                 {[
                   { rule: 'Confidence Threshold', condition: 'Score < 0.60', action: 'Immediate Alert + Silent Ghost Mode', active: true },
                   { rule: 'Emotion Detection', condition: 'Sentiment == "FRUSTRATED" (3 cycles)', action: 'Auto-Handover to Senior Support', active: true },
                   { rule: 'Complexity Limit', condition: '4+ failed troubleshooting steps', action: 'Human Escalation Handshake', active: true }
                 ].map((rule, i) => (
                   <div key={i} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white hover:border-indigo-500 transition-all">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 border shadow-inner transition-colors"><Shield size={28}/></div>
                         <div>
                            <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none mb-1">{rule.rule}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Logic: {rule.condition}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[9px] font-black text-indigo-600 uppercase italic bg-indigo-50 px-3 py-1 rounded-full">{rule.action}</span>
                         <button className={`w-12 h-6 rounded-full relative transition-all ${rule.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rule.active ? 'left-7' : 'left-1'}`}></div>
                         </button>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-10 bg-emerald-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl shadow-emerald-100">
                 <div className="space-y-2 text-center md:text-left">
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase">Master Human Override</h4>
                    <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">Allows admins to physically sever AI link and speak directly.</p>
                 </div>
                 <button className="px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    <CheckCircle size={18}/> Authorize Takeover Layer
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[750px] animate-in slide-in-from-right-4">
           <div className="p-8 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-20">
              <div className="flex items-center gap-4">
                 <History size={24} className="text-indigo-600" />
                 <h3 className="text-lg font-black uppercase italic tracking-tighter">Call Registry</h3>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                 <input className="pl-9 pr-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase outline-none" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <table className="w-full text-left">
                 <thead className="sticky top-0 bg-slate-50 border-b z-10">
                    <tr>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Subscriber</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Handshake Metrics</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Result Node</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Audit</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {state.aiCallLogs.map(log => (
                      <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><UserCircle size={20}/></div>
                               <div>
                                  <p className="font-black text-slate-900 uppercase text-xs mb-1">{log.userName}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                               <span className={`text-[10px] font-black italic ${Math.round(log.confidence * 100)}% Conf.`}>{Math.round(log.confidence * 100)}% Conf.</span>
                               <span className="text-slate-300">|</span>
                               <span className="text-[10px] font-black text-slate-500 uppercase">{Math.floor(log.duration / 60)}m {log.duration % 60}s</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${log.resolutionType === 'Self-Fix' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                               {log.resolutionType.replace('_', ' ')}
                            </div>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ChevronRight size={18}/></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {takeoverSession && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1500] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] w-full max-w-xl shadow-2xl overflow-hidden border-[10px] border-indigo-600 flex flex-col">
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center border shadow-xl animate-pulse">
                       <Headphones size={32} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Live Intervention</h3>
                       <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Agent Link: STANDBY</p>
                    </div>
                 </div>
                 <button onClick={() => setTakeoverSession(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"><X size={32}/></button>
              </div>

              <div className="p-12 space-y-10">
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="flex justify-between items-center">
                       <h4 className="text-sm font-black uppercase text-slate-900">Handover Protocol</h4>
                       <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[8px] font-black uppercase">Low AI Confidence ({Math.round(takeoverSession.confidence * 100)}%)</span>
                    </div>
                    <div className="space-y-4">
                       <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed">
                          The subscriber is agitated regarding a billing mismatch. AI suggests manual verification.
                       </p>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Send Suggestion</button>
                    <button 
                      onClick={() => alert("COMM_CHANNEL_ESTABLISHED: AI Voice Muted. Human agent is live.")}
                      className="flex-1 py-6 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       <Play size={20} fill="currentColor"/> Join Live Call
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AICallingAdmin;
