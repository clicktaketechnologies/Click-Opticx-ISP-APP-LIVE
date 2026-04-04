import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, Role, UserStatus, LedgerType, AIActionLog, ISPUser } from '../types';
import { db } from '../db';
import { 
  Cpu, Activity, ShieldAlert, Zap, Globe, ShieldCheck, 
  Terminal, ArrowRight, BarChart3, TrendingUp, Search, 
  RefreshCw, Layers, Brain, Filter, HardDrive, 
  Wifi, Flame, Settings, CheckCircle, Info, Ban, Send,
  Lock, ArrowUpRight, Gauge, AlertCircle, FileText, Smartphone,
  UserCircle, CheckSquare, Square, Eye, MoreHorizontal,
  ChevronRight, Network, TrendingDown, X, EyeOff, Bot, Sparkles, 
  BadgeDollarSign, LifeBuoy, HeartPulse, UserCheck, Code2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Modal from '../components/shared/Modal';

type AIModuleId = 'observer' | 'risk' | 'auto_action' | 'payment' | 'emergency' | 'network' | 'admin_ast' | 'user_ast';

interface AIModule {
  id: AIModuleId;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  desc: string;
  status: 'OPTIMAL' | 'AUDITING' | 'ACTION_REQUIRED' | 'STANDBY';
  telemetry: string;
}

const AICentralDashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'pulse' | 'modules' | 'transparency'>('pulse');
  const [activeModuleId, setActiveModuleId] = useState<AIModuleId | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const currentUser = state.currentUser;
  const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN].includes(currentUser?.role as Role);

  // Configuration for the 8 AI Modules
  const aiModules: AIModule[] = [
    { id: 'observer', label: 'Link Observer', icon: Eye, color: 'text-blue-500', bgColor: 'bg-blue-500/10', desc: isAdmin ? 'Real-time log scanning and event pattern matching.' : 'Real-time monitoring of your fiber link latency.', status: 'OPTIMAL', telemetry: isAdmin ? '124 events/m' : '14ms Latency' },
    { id: 'risk', label: 'Trust Guard', icon: ShieldAlert, color: 'text-rose-500', bgColor: 'bg-rose-500/10', desc: isAdmin ? 'Subscriber behavioral trust and credit rank audit.' : 'AI audit of your account trust and credit rank.', status: 'OPTIMAL', telemetry: isAdmin ? '12 High Risk' : `Score: ${currentUser?.creditScore || 600}` },
    { id: 'auto_action', label: 'Smart Protocol', icon: Zap, color: 'text-amber-500', bgColor: 'bg-amber-500/10', desc: isAdmin ? 'Autonomous execution of validated protocol tasks.' : 'Automated optimizations applied to your connection.', status: 'OPTIMAL', telemetry: isAdmin ? '42 Active Rules' : 'Active' },
    { id: 'payment', label: 'Fiscal Intel', icon: BadgeDollarSign, color: 'text-green-500', bgColor: 'bg-green-500/10', desc: isAdmin ? 'Revenue forecasting and gateway performance analysis.' : 'Smart billing alerts and early payment rewards.', status: 'OPTIMAL', telemetry: isAdmin ? '94% Confidence' : 'Healthy' },
    { id: 'emergency', label: 'Load Guardian', icon: LifeBuoy, color: 'text-purple-500', bgColor: 'bg-purple-500/10', desc: isAdmin ? 'Ensures advance credit flows only to healthy nodes.' : 'Automatic eligibility for emergency data credits.', status: 'OPTIMAL', telemetry: isAdmin ? '4 Eligibles' : 'Eligible' },
    { id: 'network', label: 'Edge Health', icon: HeartPulse, color: 'text-blue-500', bgColor: 'bg-blue-500/10', desc: isAdmin ? 'Network telemetry synthesis and fault prediction.' : 'Local node health and signal stability report.', status: 'OPTIMAL', telemetry: isAdmin ? '99.8% Uptime' : '99.9%' },
    { id: 'admin_ast', label: isAdmin ? 'Admin Assistant' : 'Personal Scout', icon: Sparkles, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', desc: isAdmin ? 'Staff productivity and smart task generation node.' : 'AI-driven suggestions for your data usage patterns.', status: 'STANDBY', telemetry: isAdmin ? '6 Sug. Tasks' : 'No Alerts' },
    { id: 'user_ast', label: 'Support AI', icon: Bot, color: 'text-slate-500', bgColor: 'bg-slate-500/10', desc: isAdmin ? 'Sentiment monitoring for subscriber chat bot.' : 'Intelligent support bot for immediate resolution.', status: 'OPTIMAL', telemetry: isAdmin ? '88% Efficacy' : 'Online' },
  ];

  const chartData = useMemo(() => [
    { name: '00:00', load: 24, confidence: 92, packetLoss: 0.1 },
    { name: '04:00', load: 18, confidence: 94, packetLoss: 0.05 },
    { name: '08:00', load: 45, confidence: 91, packetLoss: 0.2 },
    { name: '12:00', load: 82, confidence: 88, packetLoss: 0.5 },
    { name: '16:00', load: 64, confidence: 95, packetLoss: 0.3 },
    { name: '20:00', load: 95, confidence: 97, packetLoss: 0.1 },
    { name: '23:59', load: 40, confidence: 93, packetLoss: 0.05 },
  ], []);

  const refreshAI = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const getStatusColor = (status: AIModule['status']) => {
    switch(status) {
      case 'OPTIMAL': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'ACTION_REQUIRED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse';
      case 'AUDITING': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  // Removed strict isAdmin check to allow unified Subscriber/Admin view

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Dynamic Command Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center border-4 border-blue-600 shadow-[0_0_40px_rgba(79,70,229,0.3)] group relative">
              <Cpu className="text-blue-400 group-hover:scale-110 transition-transform" size={32} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse"></div>
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">AI Control Plane</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3">AI Command Center v8.5</p>
           </div>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto">
           {[
             { id: 'pulse', label: 'Master Pulse', icon: Activity },
             { id: 'modules', label: 'Active Engines', icon: Layers },
             { id: 'transparency', label: 'Audit Trail', icon: Terminal },
           ].map(tab => (
             <button 
               key={tab.id} 
               onClick={() => setActiveTab(tab.id as any)} 
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               <tab.icon size={16} />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'pulse' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
           {/* Primary Heuristic Graph */}
           <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-12">
                 <div className="space-y-12 flex-1">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-[13px] font-black text-blue-400 uppercase tracking-[0.4em] italic mb-2">Computational Integrity</p>
                          <h2 className="text-8xl font-black italic tracking-tighter leading-none">98.4<span className="text-3xl opacity-30">%</span></h2>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={refreshAI} disabled={isSyncing} className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50">
                             {isSyncing ? <Mini5GMicroLoader size={24} /> : <RefreshCw size={24}/>}
                          </button>
                          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                             <p className="text-[9px] font-black text-slate-500 uppercase">Network Latency</p>
                             <p className="text-xl font-black text-green-400">14ms</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="h-48 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                             <defs>
                                <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1570ef" stopOpacity={0.2}/><stop offset="95%" stopColor="#1570ef" stopOpacity={0}/></linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                             <XAxis dataKey="name" hide />
                             <YAxis hide />
                             <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }} />
                             <Area type="monotone" dataKey="load" stroke="#1570ef" fillOpacity={1} fill="url(#colorConf)" strokeWidth={4} />
                             <Area type="monotone" dataKey="confidence" stroke="#32d583" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 
                 <div className="w-full md:w-80 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">Core Engine Status</h4>
                    <div className="space-y-4">
                       {aiModules.slice(0, 4).map(m => (
                         <div key={m.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all cursor-default">
                            <div className="flex items-center gap-4">
                               <m.icon className={m.color} size={18} />
                               <span className="text-[11px] font-black uppercase text-slate-300 tracking-tight">{m.label}</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${getStatusColor(m.status)}`}>
                               {m.status}
                            </div>
                         </div>
                       ))}
                    </div>
                    <button onClick={() => setActiveTab('modules')} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                       Full Service Grid <ChevronRight size={14} />
                    </button>
                 </div>
              </div>
              <Activity className="absolute -right-20 -bottom-20 opacity-[0.03] scale-[3] pointer-events-none" size={400} />
           </div>

           {/* Quick Suggestion Array */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-8">
                 <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                       <Sparkles size={20} className="text-blue-600" /> Administrative AI Assistant
                    </h3>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase italic">4 Valid Suggestions</span>
                 </div>
                 <div className="space-y-4">
                    {[
                      { type: 'FISCAL', msg: 'Identity USR-942 shows cyclical payment delays. Suggest risk-score deduction (-25).', priority: 'High', icon: TrendingDown },
                      { type: 'NETWORK', msg: 'MT-01 Node port saturation detected at 88%. Suggest hardware bandwidth limit.', priority: 'Normal', icon: Gauge },
                      { type: 'SUPPORT', msg: 'Unusual spike in "Activation Failure" queries. Probable gateway handshake fault.', priority: 'Critical', icon: AlertCircle }
                    ].map((s, i) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                               <s.icon size={24}/>
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{s.type}</span>
                                  <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${s.priority === 'Critical' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-slate-200 text-slate-500'}`}>{s.priority}</span>
                               </div>
                               <p className="text-xs font-bold text-slate-600 uppercase leading-relaxed line-clamp-1">{s.msg}</p>
                            </div>
                         </div>
                         <button className="px-6 py-3 bg-slate-950 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 active:scale-95 transition-all">Authorize Sequence</button>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between overflow-hidden relative">
                 <div className="space-y-6 relative z-10">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <LifeBuoy size={20} className="text-rose-500" /> Load Guardian
                    </h3>
                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] space-y-3">
                       <p className="text-[10px] font-black text-rose-900 uppercase">Eligibility Lockdown</p>
                       <p className="text-[9px] text-rose-700 font-bold uppercase leading-relaxed">
                          AI has restricted Emergency Access for 14 Caller Detailss due to high default correlation.
                       </p>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 px-1">
                          <span>Risk Suppression</span>
                          <span>74% Effectiveness</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 w-3/4"></div>
                       </div>
                    </div>
                 </div>
                 <ShieldAlert className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150" size={140} />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
           {aiModules.map(module => (
             <button 
               key={module.id}
               onClick={() => setActiveModuleId(module.id)}
               className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all hover:shadow-2xl hover:-translate-y-1 text-left relative overflow-hidden group ${activeModuleId === module.id ? 'border-blue-600 shadow-xl' : 'border-slate-100'}`}
             >
                <div className="relative z-10 flex flex-col h-full space-y-6">
                   <div className="flex justify-between items-start">
                      <div className={`w-14 h-14 ${module.bgColor} ${module.color} rounded-2xl flex items-center justify-center border-2 border-current/10 shadow-inner group-hover:scale-110 transition-transform`}>
                         <module.icon size={28} />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(module.status)}`}>
                         {module.status}
                      </div>
                   </div>
                   
                   <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{module.label}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{module.desc}</p>
                   </div>

                   <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-600 uppercase italic">{module.telemetry}</span>
                      <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                   </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Settings size={14} className="text-slate-300 animate-spin-slow" />
                </div>
             </button>
           ))}

           {/* Module Detail Overlay */}
           <Modal
              isOpen={!!activeModuleId}
              onClose={() => setActiveModuleId(null)}
              title={activeModuleId ? `${aiModules.find(m => m.id === activeModuleId)!.label} Core` : ''}
              message="Handshake Active • Node_v4.2"
              icon={activeModuleId ? React.createElement(aiModules.find(m => m.id === activeModuleId)!.icon, { size: 28, className: 'text-blue-400' }) : undefined}
              maxWidth="max-w-2xl"
              hideCloseButton={false}
              footer={
                 <button onClick={() => setActiveModuleId(null)} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all active:scale-95">Re-Calibrate Intelligence Core</button>
              }
           >
              <div className="space-y-10">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Operational Bias</p>
                       <p className="text-lg font-black text-slate-900 uppercase italic">FISCAL_SAFETY_FIRST</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Audit Interval</p>
                       <p className="text-lg font-black text-slate-900 uppercase italic">REAL_TIME_PULSE</p>
                    </div>
                 </div>
                 <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Settings size={14}/> Engine Parameters</h4>
                    <div className="grid grid-cols-1 gap-4">
                       {[
                         { label: 'Heuristic Sensitivity', val: '84%', active: true },
                         { label: 'Auto-Commit Authorization', val: 'OFF', active: false },
                         { label: 'Cross-Node Communication', val: 'SYNCED', active: true }
                       ].map(param => (
                         <div key={param.label} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                            <span className="text-[9px] font-black text-slate-400 uppercase">{param.label}</span>
                            <span className={`text-[10px] font-black uppercase ${param.active ? 'text-green-400' : 'text-rose-400'}`}>{param.val}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </Modal>
        </div>
      )}

      {activeTab === 'transparency' && (
        <div className="bg-slate-950 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[700px] animate-in slide-in-from-right-4 duration-500">
           <div className="p-8 bg-slate-900/50 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Terminal size={28} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Transparency Ledger</h3>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">Audit Trail v4.2 • Events: {state.aiLogs.length}</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                    <input className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white outline-none focus:border-blue-500 transition-all" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
                 <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">Export Log</button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white/[0.01]">
              <div className="grid grid-cols-1 gap-2">
                 {state.aiLogs.filter(log => log.action.includes(searchTerm.toUpperCase()) || log.reason.includes(searchTerm)).map(log => (
                   <div 
                    key={log.id} 
                    className="group p-5 hover:bg-white/[0.03] border border-white/5 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                   >
                      <div className="flex items-center gap-5 flex-1">
                         <div className="w-1.5 h-10 bg-blue-500 rounded-full group-hover:scale-y-125 transition-transform shrink-0"></div>
                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{log.action}</span>
                               <span className="text-[8px] text-slate-600 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-300 uppercase leading-relaxed">{log.reason}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8 shrink-0">
                         <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                               <span className="text-[8px] font-black uppercase text-green-500">Conf: {Math.round(log.confidence * 100)}%</span>
                            </div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">Node ID: {log.targetId}</p>
                         </div>
                         <button className="p-3 bg-white/5 text-slate-500 rounded-xl hover:text-white transition-colors">
                            <MoreHorizontal size={18}/>
                         </button>
                      </div>
                   </div>
                 ))}
                 {state.aiLogs.length === 0 && (
                   <div className="p-32 text-center opacity-20">
                      <Terminal size={64} className="mx-auto mb-4 text-white" />
                      <p className="text-sm font-black uppercase tracking-widest text-white">Registry Handshake Pending...</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AICentralDashboard;

