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
  HardDrive, ShieldCheck, RotateCw, XCircle, PlayCircle, 
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

  // Resend Domains State
  const [domains, setDomains] = useState<any[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<any>(null);

  // Push Notification State
  const [pushTarget, setPushTarget] = useState('');
  const [pushPriority, setPushPriority] = useState('normal');
  const [pushMessage, setPushMessage] = useState('');
  const [pushSending, setPushSending] = useState(false);

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

  const fetchDomains = async () => {
    setDomainsLoading(true);
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/domains`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('clickopticx_admin_token')}`
            }
        });
        const data = await res.json();
        if (data.success) {
            setDomains(data.domains || []);
        }
    } catch (e) {
        console.error('Failed to fetch domains', e);
    } finally {
        setDomainsLoading(false);
    }
  };

  const handleSelectDomain = async (id: string) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/domains/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('clickopticx_admin_token')}`
            }
        });
        const data = await res.json();
        if (data.success) {
            setSelectedDomain(data.domain);
        } else {
            alert(data.error || 'Failed to fetch domain details');
        }
    } catch (e: any) {
        alert(e.message);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName) return;
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/domains`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('clickopticx_admin_token')}`
            },
            body: JSON.stringify({ name: newDomainName })
        });
        const data = await res.json();
        if (data.success) {
            setNewDomainName('');
            fetchDomains();
            alert('Domain added successfully! DNS records generated.');
        } else {
            alert(data.error || 'Failed to add domain');
        }
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleVerifyDomain = async (id: string) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/domains/${id}/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('clickopticx_admin_token')}`
            }
        });
        const data = await res.json();
        if (data.success) {
            alert('Verification triggered successfully!');
            fetchDomains();
        } else {
            alert(data.error || 'Failed to trigger verification');
        }
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleRemoveDomain = async (id: string) => {
    if (!confirm('Are you sure you want to remove this domain from Resend?')) return;
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/domains/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('clickopticx_admin_token')}`
            }
        });
        const data = await res.json();
        if (data.success) {
            setSelectedDomain(null);
            fetchDomains();
            alert('Domain removed successfully.');
        } else {
            alert(data.error || 'Failed to remove domain');
        }
    } catch (err: any) {
        alert(err.message);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchProviders();
    fetchDomains();
  }, []);

  // ─── Tabs Configuration ───────────────────────────────────────────────────────
  const tabs = [
    { id: 'monitor', label: 'Monitor', icon: Activity, desc: 'Realtime dashboard' },
    { id: 'setup', label: 'Providers', icon: Server, desc: 'Node config' },
    { id: 'automation', label: 'Auto', icon: Zap, desc: 'Rule builder' },
    { id: 'dispatch', label: 'Manual', icon: Send, desc: 'Audience builder' },
    { id: 'templates', label: 'Templates', icon: Layout, desc: 'HTML Templates' }
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
                        <button onClick={fetchDashboardData} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100"><RotateCw size={18} /></button>
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
                                <button 
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/v2/providers/${p.id}`, {
                                                method: 'PATCH',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${localStorage.getItem('clickopticx_admin_token')}`
                                                },
                                                body: JSON.stringify({ enabled: !p.enabled })
                                            });
                                            if (res.ok) {
                                                fetchProviders();
                                            } else {
                                                const data = await res.json();
                                                alert(`Failed to update provider: ${data.error || data.message || 'Unknown error'}`);
                                            }
                                        } catch (e: any) {
                                            alert(`Error updating provider: ${e.message}`);
                                        }
                                    }}
                                    className={`w-12 h-6 rounded-full relative p-1 transition-all ${p.enabled ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}
                                >
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

            {/* Resend Domains Orchestration Panel */}
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm mt-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Resend Domains Orchestrator</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Add and verify sending domains to allow Resend API delivery</p>
                    </div>
                    
                    <form onSubmit={handleAddDomain} className="flex gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="e.g. clickopticx.com"
                            value={newDomainName}
                            onChange={(e) => setNewDomainName(e.target.value)}
                            className="px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 transition-all flex-1 md:w-64"
                        />
                        <button 
                            type="submit"
                            className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={14}/> Add Domain
                        </button>
                    </form>
                </div>

                {domainsLoading ? (
                    <div className="flex justify-center py-12">
                        <Mini5GMicroLoader />
                    </div>
                ) : domains.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <GlobeIcon className="mx-auto text-slate-300 mb-4" size={40} />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">No domains configured yet</p>
                        <p className="text-xs text-slate-400 mt-1">Add a domain above to configure DNS verification records.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Side: Domains List */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Configured Domains</label>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {domains.map(d => (
                                        <div 
                                            key={d.id} 
                                            onClick={() => handleSelectDomain(d.id)}
                                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                                                selectedDomain?.id === d.id 
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                                                : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg text-slate-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <GlobeIcon size={20} className={selectedDomain?.id === d.id ? 'text-blue-400' : 'text-slate-400'} />
                                                <div>
                                                    <h5 className="font-black text-sm uppercase tracking-tight">{d.name}</h5>
                                                    <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${selectedDomain?.id === d.id ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        Region: {d.region || 'us-east-1'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    d.status === 'verified'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                    {d.status}
                                                </span>
                                                {d.status !== 'verified' && (
                                                    <button
                                                        onClick={() => handleVerifyDomain(d.id)}
                                                        title="Trigger Verification Check"
                                                        className={`p-2 rounded-xl transition-all ${
                                                            selectedDomain?.id === d.id 
                                                            ? 'bg-white/10 hover:bg-white/20 text-white' 
                                                            : 'bg-slate-200/50 hover:bg-slate-200 text-slate-600'
                                                        }`}
                                                    >
                                                        <RotateCw size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveDomain(d.id)}
                                                    title="Remove Domain"
                                                    className={`p-2 rounded-xl transition-all ${
                                                        selectedDomain?.id === d.id 
                                                        ? 'bg-red-500/20 hover:bg-red-500/40 text-red-400' 
                                                        : 'bg-red-50/50 hover:bg-red-50 text-red-600'
                                                    }`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Selected Domain Records & Details */}
                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between min-h-[300px]">
                                {selectedDomain ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start border-b border-slate-200/60 pb-4">
                                            <div>
                                                <h4 className="font-black text-lg text-slate-900 uppercase italic leading-none">{selectedDomain.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {selectedDomain.status} • Region: {selectedDomain.region}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleSelectDomain(selectedDomain.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-600 transition-all"
                                            >
                                                <RotateCw size={10} /> Refresh
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DNS Records to Configure</label>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Add these at your domain registrar</span>
                                            </div>

                                            <div className="space-y-3 overflow-y-auto max-h-[250px] pr-1">
                                                {selectedDomain.records && selectedDomain.records.length > 0 ? (
                                                    selectedDomain.records.map((r: any, idx: number) => (
                                                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-700 uppercase">{r.type || r.record}</span>
                                                                <span className={`text-[8px] font-black uppercase tracking-widest ${
                                                                    r.status === 'verified' || r.status === 'valid'
                                                                    ? 'text-emerald-500'
                                                                    : 'text-amber-500'
                                                                }`}>
                                                                    {r.status || 'pending'}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-1 text-[11px]">
                                                                <div>
                                                                    <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block">Host/Name</span>
                                                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                                                        <code className="text-xs font-mono text-slate-800 break-all select-all">{r.name}</code>
                                                                        <button 
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(r.name);
                                                                                alert('Host copied!');
                                                                            }}
                                                                            className="text-slate-400 hover:text-slate-600"
                                                                            title="Copy"
                                                                        >
                                                                            <Copy size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-1">
                                                                    <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block">Value/Target</span>
                                                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                                                        <code className="text-xs font-mono text-slate-800 break-all select-all">{r.value}</code>
                                                                        <button 
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(r.value);
                                                                                alert('Value copied!');
                                                                            }}
                                                                            className="text-slate-400 hover:text-slate-600"
                                                                            title="Copy"
                                                                        >
                                                                            <Copy size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">No DNS records returned for this domain. Try verifying or re-adding.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                                        <GlobeIcon className="text-slate-300 mb-3" size={32} />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Select a domain from the list</p>
                                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Click a domain to retrieve its DNS records and verification status.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* ─── Page: Manual Dispatch ────────────────────────────────────────────── */}
      {activeTab === 'dispatch' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Manual Dispatch</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execute targeted campaigns</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Audience</label>
                        <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-blue-500 transition-all">
                            <option value="all">All Active Subscribers</option>
                            <option value="unpaid">Unpaid Invoices</option>
                            <option value="expiring">Expiring within 7 Days</option>
                            <option value="offline">Currently Offline</option>
                            <option value="dealers">All Resellers / Dealers</option>
                            <option value="staff">Internal Staff</option>
                        </select>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Message Template</label>
                        <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-blue-500 transition-all">
                            <option value="t1">Standard Reminder</option>
                            <option value="t2">Service Outage Notice</option>
                            <option value="t3">Holiday Greeting</option>
                            <option value="t4">Promotional Offer</option>
                        </select>
                    </div>

                    <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <Send size={18} /> Execute Dispatch Protocol
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* ─── Page: Automation ────────────────────────────────────────────── */}
      {activeTab === 'automation' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Automation Rules</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System triggers and workflows</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {[
                        { title: 'Invoice Generated', desc: 'Triggered when a new invoice is created', enabled: true },
                        { title: 'Payment Received', desc: 'Triggered upon successful payment', enabled: true },
                        { title: 'Service Expiry', desc: 'Triggered 3 days before expiry', enabled: false },
                        { title: 'Connection Lost', desc: 'Triggered if NAS reports node offline for > 15m', enabled: false },
                    ].map((rule, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Zap size={20}/></div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase italic">{rule.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{rule.desc}</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full relative p-1 transition-all ${rule.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute transition-all ${rule.enabled ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm animate-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-8">Template Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Name</label>
                    <input id="tplName" placeholder="e.g. Welcome Message" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Type</label>
                    <select id="tplType" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none">
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                    </select>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Template Body</label>
                    <textarea id="tplBody" rows={6} placeholder="Hello {{name}}, welcome to our service!" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm outline-none resize-none" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                    <button 
                       onClick={async () => {
                           const name = (document.getElementById('tplName') as HTMLInputElement).value;
                           const type = (document.getElementById('tplType') as HTMLSelectElement).value;
                           const body = (document.getElementById('tplBody') as HTMLTextAreaElement).value;
                           if (!name || !body) return alert("Please fill all fields");
                           try {
                               const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/templates`, {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('clickopticx_admin_token')}` },
                                   body: JSON.stringify({ name, type, body })
                               });
                               const data = await res.json();
                               if (data.success) {
                                   alert('Template Saved Successfully!');
                                   (document.getElementById('tplName') as HTMLInputElement).value = '';
                                   (document.getElementById('tplBody') as HTMLTextAreaElement).value = '';
                               } else alert(data.message);
                           } catch (e: any) { alert(e.message); }
                       }}
                       className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl"
                    >
                        Save Template
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Campaign Orchestrator</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage email marketing and broadcast campaigns</p>
                    </div>
                    <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200"
                        onClick={() => {
                            const name = prompt("Campaign Name?");
                            const subject = prompt("Subject?");
                            if (name && subject) {
                                db.saveEmailCampaign({ name, subject, status: 'Draft', type: 'One-Time', templateId: state.emailTemplates[0]?.id || '', segmentId: state.audienceSegments[0]?.id || '', senderName: 'CO ISP', senderEmail: 'noreply@clickopticx.com' });
                            }
                        }}>
                        <Plus size={18}/> New Campaign
                    </button>
                </div>

                <div className="space-y-4">
                    {state.emailCampaigns?.map((c: any) => (
                        <div key={c.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Send size={20}/></div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase italic">{c.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Type: {c.type} • Status: {c.status}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    c.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                    c.status === 'Sending' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-slate-200 text-slate-600'
                                }`}>{c.status}</span>
                                {c.status === 'Draft' && (
                                    <button onClick={() => db.sendCampaign(c.id)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all">
                                        <PlayCircle size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {(!state.emailCampaigns || state.emailCampaigns.length === 0) && (
                        <p className="text-sm text-slate-400 italic text-center py-8">No campaigns created yet.</p>
                    )}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'push' && (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Push Dispatch Center</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Send real-time mobile push notifications</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Device / User ID</label>
                    <input 
                        value={pushTarget}
                        onChange={(e) => setPushTarget(e.target.value)}
                        placeholder="e.g. USR-12345 or 'All'" 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" 
                        disabled={pushSending}
                    />
                </div>
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                    <select 
                        value={pushPriority}
                        onChange={(e) => setPushPriority(e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                        disabled={pushSending}
                    >
                        <option value="normal">Normal</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notification Message</label>
                    <textarea 
                        value={pushMessage}
                        onChange={(e) => setPushMessage(e.target.value)}
                        rows={4} 
                        placeholder="Enter your push notification message..." 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm outline-none resize-none" 
                        disabled={pushSending}
                    />
                </div>
                <div className="md:col-span-2 flex justify-end">
                    <button 
                       onClick={async () => {
                           if (!pushTarget || !pushMessage) return alert("Please fill all fields");
                           setPushSending(true);
                           try {
                               await db.sendPushNotification(pushTarget, pushMessage, pushPriority as any);
                               alert('Push Notification Sent!');
                               setPushMessage('');
                           } catch (e: any) { 
                               alert(e.message); 
                           } finally {
                               setPushSending(false);
                           }
                       }}
                       disabled={pushSending || !pushTarget || !pushMessage}
                       className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50"
                    >
                        {pushSending ? (
                            <>
                                <Mini5GMicroLoader color="#fff" />
                                Sending...
                            </>
                        ) : (
                            'Send Push Notification'
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'audiences' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Audience Segments</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage subscriber targeting segments</p>
                    </div>
                    <button className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-200"
                        onClick={() => {
                            const name = prompt("Segment Name?");
                            const description = prompt("Description?");
                            if (name && description) {
                                db.saveAudienceSegment({ name, description, filters: {} });
                            }
                        }}>
                        <Plus size={18}/> New Segment
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {state.audienceSegments?.map((s: any) => (
                        <div key={s.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Users size={20}/></div>
                                <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                                    {s.subscriberCount} Subscribers
                                </span>
                            </div>
                            <h4 className="text-lg font-black text-slate-900 uppercase italic">{s.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{s.description}</p>
                        </div>
                    ))}
                    {(!state.audienceSegments || state.audienceSegments.length === 0) && (
                        <p className="text-sm text-slate-400 italic py-8">No audience segments defined.</p>
                    )}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Delivery Logs</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit trail for all communications</p>
                    </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {state.deliveryLogs?.slice().reverse().map((l: any) => (
                        <div key={l.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    l.channel === 'Email' ? 'bg-blue-100 text-blue-600' :
                                    l.channel === 'Push' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-slate-200 text-slate-600'
                                }`}>
                                    {l.channel === 'Email' ? <Mail size={16}/> : l.channel === 'Push' ? <Smartphone size={16}/> : <MessageSquare size={16}/>}
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase">{l.target}</h4>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(l.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    l.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                                    l.status === 'Failed' ? 'bg-red-500/10 text-red-500' :
                                    'bg-amber-500/10 text-amber-500'
                                }`}>{l.status}</span>
                                {l.provider && <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">{l.provider}</span>}
                            </div>
                        </div>
                    ))}
                    {(!state.deliveryLogs || state.deliveryLogs.length === 0) && (
                        <p className="text-sm text-slate-400 italic text-center py-8">No delivery logs found.</p>
                    )}
                </div>
            </div>
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
