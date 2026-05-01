import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Mail, Settings, History, Layout, Zap, 
  Plus, Search, Filter, Shield, ShieldAlert,
  Send, AlertCircle, CheckCircle2, 
  Clock, Server, Globe as GlobeIcon, 
  ArrowRight, MoreVertical, Trash2, 
  Edit3, Copy, Eye, Power,
  BarChart3, User, Database,
  Repeat, Bell, Smartphone, Users,
  TrendingUp, Activity, Key, Settings2,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Monitor, TrendingUp as TrendingIcon,
  HardDrive, ShieldCheck, RefreshCw, XCircle, PlayCircle, 
  MessageSquare, Share2, Sparkles, Command, Smartphone as Mobile,
  MousePointer2, ListChecks, Layers, Link2, ListFilter, Sliders
} from 'lucide-react';
import { db } from '../../db';
import { Modal } from '../../components/shared/Modal';
import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';
import { AppState, EmailTemplate, EmailProvider } from '../../types';

interface Props {
  state: AppState;
}

const EmailControlCenter: React.FC<Props> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'monitor'|'master'|'templates'|'campaigns'|'push'|'dispatch'|'automation'|'audiences'|'logs'|'setup'>('monitor');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/v2/stats`);
        const data = await res.json();
        if (data.success) {
            setStats(data.stats);
            setLogs(data.stats.recent_logs || []);
        }
    } catch (e) {
        console.error('Failed to fetch stats');
    } finally {
        setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/v2/providers`);
        const data = await res.json();
        if (data.success) setProviders(data.providers);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDashboardData();
    fetchProviders();
  }, []);

  // ─── Tabs Configuration ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'monitor', label: 'Dashboard', icon: BarChart3, desc: 'Real-time telemetry' },
    { id: 'master', label: 'Notification Master', icon: Sparkles, desc: 'Omni-channel hub' },
    { id: 'templates', label: 'Smart Templates', icon: Layout, desc: 'WYSIWYG builder' },
    { id: 'campaigns', label: 'Campaigns', icon: TrendingUp, desc: 'Mass dispatch' },
    { id: 'push', label: 'Push Devices', icon: Mobile, desc: 'FCM management' },
    { id: 'dispatch', label: 'Manual Dispatch', icon: Send, desc: 'One-click audience' },
    { id: 'automation', label: 'Auto-Actions', icon: Zap, desc: 'Rule builder' },
    { id: 'audiences', label: 'Audiences', icon: Users, desc: 'Segment filters' },
    { id: 'logs', label: 'Gateway Logs', icon: Database, desc: 'Real-time stream' },
    { id: 'setup', label: 'Comms Setup', icon: Settings, desc: 'Node config' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-3xl bg-slate-900 flex items-center justify-center shadow-2xl border border-white/10">
                <Mail className="text-blue-500" size={28} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Comms Control Plane</h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">v2.0 Orchestrator • Global Relay Protocol</p>
             </div>
          </div>
        </div>
        
        {/* Responsive Tab Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-[2.5rem] border border-slate-200">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab.id 
                 ? 'bg-slate-950 text-white shadow-xl scale-105' 
                 : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
               }`}
             >
               <tab.icon size={16} />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* ─── Page 1: Monitor Dashboard ────────────────────────────────────────── */}
      {activeTab === 'monitor' && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Transmissions" value={stats?.total_sent || 0} sub="Last 24h" icon={Send} color="blue" />
                <StatCard title="Success Rate" value={`${(stats?.success_rate || 0).toFixed(1)}%`} sub="Delivery" icon={CheckCircle2} color="emerald" />
                <StatCard title="Active Nodes" value={stats?.active_nodes || 0} sub="Infrastructure" icon={Server} color="amber" />
                <StatCard title="Reputation" value="99.2%" sub="Global Score" icon={ShieldCheck} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Infrastructure Pulse</h3>
                        <button onClick={fetchDashboardData} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100"><RefreshCw size={18} /></button>
                    </div>
                    <div className="space-y-6">
                        {providers.map(p => (
                            <div key={p.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${p.enabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <Server size={24}/>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none mb-1">{p.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.host || 'Cloud API'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reputation</p>
                                        <p className="text-sm font-black text-emerald-600 uppercase">Excellent</p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${p.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <h3 className="text-lg font-black uppercase tracking-tight italic mb-8 relative z-10">Real-Time Queue</h3>
                        <div className="space-y-4 relative z-10">
                            {[1,2,3].map(i => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-tighter">Package Renewal #{i*124}</p>
                                        <p className="text-[8px] text-slate-500 uppercase tracking-widest">Waiting for Handshake...</p>
                                    </div>
                                    <Clock size={14} className="text-slate-600" />
                                </div>
                            ))}
                        </div>
                        <Activity className="absolute -right-10 -bottom-10 opacity-[0.03] scale-[2.5]" size={200} />
                    </div>

                    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Security & Limits</h3>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase">
                                <span className="text-slate-500">Daily Cap</span>
                                <span className="text-slate-900">5,000 / 10,000</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full w-1/2"></div>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-black uppercase mt-4">
                                <span className="text-slate-500">Encryption Layer</span>
                                <span className="text-emerald-500 flex items-center gap-2">
                                    <ShieldCheck size={14}/> TLS 1.3
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ─── Page 2: Notification Master ────────────────────────────────────────── */}
      {activeTab === 'master' && (
        <div className="space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Omni-Channel Orchestrator</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Synchronized Delivery across all end-points</p>
                    </div>
                    <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">New Broadcast</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { id: 'email', label: 'Email Relay', icon: Mail, color: 'blue' },
                        { id: 'sms', label: 'SMS Gateway', icon: MessageSquare, color: 'emerald' },
                        { id: 'push', label: 'Push Hub', icon: Smartphone, color: 'indigo' },
                        { id: 'wa', label: 'WhatsApp Link', icon: Share2, color: 'green' },
                        { id: 'voice', label: 'Voice Node', icon: Bell, color: 'amber' },
                        { id: 'internal', label: 'App Portal', icon: Layout, color: 'rose' }
                    ].map(ch => (
                        <div key={ch.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] group hover:bg-slate-900 hover:text-white transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${ch.color === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>
                                    <ch.icon size={28}/>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            </div>
                            <h4 className="text-lg font-black uppercase italic tracking-tighter mb-2">{ch.label}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-500">Active • 99% Success</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* ─── Page 10: Comms Setup (Provider Config) ────────────────────────────── */}
      {activeTab === 'setup' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-end">
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Global Node Registry</h3>
                <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200">
                    <Plus size={18}/> Provision New Provider
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {providers.map(p => (
                    <div key={p.id} className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative group overflow-hidden">
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 ${p.enabled ? 'bg-slate-900 text-blue-500' : 'bg-slate-100 text-slate-400'}`}>
                                    {p.id.includes('gmail') ? <GlobeIcon size={32}/> : <Server size={32}/>}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1">{p.name}</h4>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{p.type} • PRIORITY {p.priority}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <button className={`w-12 h-6 rounded-full relative p-1 transition-all ${p.enabled ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full absolute transition-all ${p.enabled ? 'right-1' : 'left-1'}`}></div>
                                </button>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.enabled ? 'Operational' : 'Hibernating'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Host Endpoint</p>
                                <p className="text-xs font-black text-slate-800">{p.host || 'Dynamic API'}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Auth Profile</p>
                                <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                                    <Key size={14} className="text-amber-500" /> Secure Key Vault
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4 relative z-10">
                            <button className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                <Sliders size={14}/> Parameters
                            </button>
                            <button className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                <Activity size={14}/> Telemetry
                            </button>
                        </div>
                        <Shield className="absolute -right-12 -bottom-12 opacity-[0.01] scale-150" size={200} />
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Pages 3-9: Placeholder logic with premium aesthetics */}
      {['templates', 'campaigns', 'push', 'dispatch', 'automation', 'audiences', 'logs'].includes(activeTab) && (
        <div className="flex flex-col items-center justify-center h-[50vh] animate-in zoom-in-95">
            <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse mb-8">
                <Command size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{activeTab.replace('_', ' ')} Module</h3>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Provisioning in Progress • Phase 2 Deploy</p>
            <button onClick={() => setActiveTab('monitor')} className="mt-8 px-8 py-3 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Back to Control Plane</button>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, sub, icon: Icon, color }: any) => {
    const colors: any = {
      blue: 'bg-blue-600 text-white shadow-blue-500/20',
      emerald: 'bg-emerald-500 text-white shadow-emerald-500/20',
      amber: 'bg-amber-500 text-white shadow-amber-500/20',
      indigo: 'bg-indigo-600 text-white shadow-indigo-500/20',
    };
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group hover:shadow-2xl transition-all relative overflow-hidden">
         <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 relative z-10 ${colors[color]}`}>
            <Icon size={24} />
         </div>
         <div className="relative z-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 italic tracking-tighter">{value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{sub}</span>
            </div>
         </div>
         <Icon className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.8] transition-transform duration-1000" size={160} />
      </div>
    );
};

export default EmailControlCenter;
