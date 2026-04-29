import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Settings, History, Layout, Zap, 
  Plus, Search, Filter, Shield, 
  Send, AlertCircle, CheckCircle2, 
  Clock, Server, Globe as GlobeIcon, 
  ArrowRight, MoreVertical, Trash2, 
  Edit3, Copy, Eye, Power,
  BarChart3, User, Database,
  Repeat, Bell, Smartphone, Users,
  TrendingUp, Activity, Key, 
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Monitor, TrendingUp as TrendingIcon,
  HardDrive, ShieldCheck, RefreshCw, XCircle, PlayCircle
} from 'lucide-react';
import { db } from '../../db';
import { Modal } from '../../components/shared/Modal';
import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';
import { AppState, EmailTemplate, EmailProvider, Role } from '../../types';

interface Props {
  state: AppState;
  activePage?: string;
}

const EmailControlCenter: React.FC<Props> = ({ state, activePage }) => {
  const [activeTab, setActiveTab] = useState<'dashboard'|'infrastructure'|'queue'|'templates'|'automation'|'audiences'|'setup'>('dashboard');
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobStatus, setJobStatus] = useState<'waiting'|'active'|'completed'|'failed'|'delayed'>('waiting');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'infrastructure') fetchProviders();
    if (activeTab === 'queue') fetchJobs();
  }, [activeTab, jobStatus]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/provider-mgmt/email-providers`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) setProviders(data.providers);
    } catch (e) {
        console.error('Failed to fetch providers');
    } finally {
        setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/jobs?status=${jobStatus}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) setJobs(data.jobs);
    } catch (e) {
        console.error('Failed to fetch jobs');
    } finally {
        setLoading(false);
    }
  };

  const handleRetryJob = async (id: string) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/jobs/${id}/retry`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) fetchJobs();
    } catch (e) {
        alert('Retry failed');
    }
  };

  const handleCancelJob = async (id: string) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/email/jobs/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) fetchJobs();
    } catch (e) {
        alert('Cancel failed');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Monitor', icon: BarChart3 },
    { id: 'infrastructure', label: 'Infrastructure', icon: HardDrive },
    { id: 'queue', label: 'Manual Queue', icon: Clock },
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'audiences', label: 'Audiences', icon: Users },
    { id: 'setup', label: 'Setup', icon: Settings },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center shadow-2xl">
                <Mail className="text-blue-500" size={24} />
             </div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Comms Control Plane</h1>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] ml-[60px]">Global Relay Protocol • Hot-Swappable Nodes</p>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab.id 
                 ? 'bg-slate-950 text-white shadow-xl scale-105' 
                 : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
               }`}
             >
               <tab.icon size={14} />
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Conditional Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <StatCard title="Total Transmissions" value={state.commStats.totalSent} sub="Last 30 Days" icon={Send} color="blue" />
                <StatCard title="Handshake Success" value={`${((state.commStats.delivered/state.commStats.totalSent)*100).toFixed(1)}%`} sub="Delivery Rate" icon={CheckCircle2} color="emerald" />
                <StatCard title="Failover Count" value={state.commStats.providerUsage.backup} sub="Auto-Rerouted" icon={ShieldAlert} color="amber" />
                <StatCard title="Global Reputation" value="98.2%" sub="Sender Trust" icon={Activity} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Relay Infrastructure Status</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active nodes in the communication matrix</p>
                        </div>
                        <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                           Operational
                        </span>
                    </div>
                    <div className="space-y-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg"><Server size={20}/></div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase italic">Primary SMTP Node</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">relay.clickopticx.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-900">{state.commStats.providerUsage.smtp} Dispatches</p>
                                <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-blue-600 w-3/4"></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-400 text-white flex items-center justify-center shadow-lg"><GlobeIcon size={20}/></div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase italic">Cloud Failover Node</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resend API (Backup)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-900">{state.commStats.providerUsage.backup} Dispatches</p>
                                <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-slate-400 w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight italic mb-8">Node Policies</h3>
                        <div className="space-y-6">
                            <PolicyToggle label="Auto-Dispatcher" active />
                            <PolicyToggle label="Failover Protocol" active />
                            <PolicyToggle label="Strict SPF/DKIM" active />
                            <PolicyToggle label="Visual Rate-Limit" active />
                        </div>
                    </div>
                    <button className="w-full mt-10 py-4 bg-white/10 hover:bg-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10 active:scale-95">
                        Launch Global Handshake Test
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Managed Provider Registry</h3>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                    <Plus size={16}/> Provision Node
                </button>
            </div>
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Mini5GMicroLoader size={40} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Provider Nodes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providers.map(p => (
                        <div key={p.id} className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col ${p.enabled ? 'border-blue-100 shadow-blue-50 shadow-lg' : 'border-slate-50 grayscale opacity-70'}`}>
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${p.type === 'SMTP' ? 'bg-blue-600' : 'bg-indigo-600'}`}>
                                    {p.type === 'SMTP' ? <Server size={24}/> : <GlobeIcon size={24}/>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.priority === 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {p.priority === 1 ? 'Primary' : 'Backup'}
                                    </span>
                                    <button className={`w-10 h-5 rounded-full relative transition-all ${p.enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${p.enabled ? 'left-5.5' : 'left-0.5'}`}></div>
                                    </button>
                                </div>
                            </div>
                            <div className="mb-6 relative z-10">
                                <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{p.name}</h4>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{p.host || 'Cloud API Endpoint'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative z-10">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Reputation</p>
                                    <p className="text-sm font-black text-green-600 italic">99.9%</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Today Usage</p>
                                    <p className="text-sm font-black text-slate-900 italic">{p.usage_today || 0} Emails</p>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 relative z-10 shadow-xl">
                                <Settings2 size={14}/> Configure Node <ChevronRight size={14}/>
                            </button>
                            <ShieldCheck className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.8] transition-transform duration-1000" size={180} />
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    {['waiting', 'active', 'failed', 'completed'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setJobStatus(status as any)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${jobStatus === status ? 'bg-slate-950 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                        >
                            {status} ({jobs.length})
                        </button>
                    ))}
                </div>
                <button onClick={fetchJobs} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job ID & Timestamp</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipient & Payload</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Retry Count</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Emergency Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {jobs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic">No pending jobs in the {jobStatus} matrix</td>
                                </tr>
                            ) : jobs.map(job => (
                                <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Database size={18}/>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase">#JOB-{job.id}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(job.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-slate-800 italic">{job.data.to}</p>
                                        <p className="text-[10px] text-slate-500 font-bold truncate max-w-xs">{job.data.subject}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-2">
                                            <Repeat size={14} className="text-blue-500" />
                                            <span className="text-xs font-black text-slate-900">{job.attemptsMade} / 3</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right space-x-2">
                                        {jobStatus === 'failed' && (
                                            <button 
                                                onClick={() => handleRetryJob(job.id)}
                                                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <PlayCircle size={18}/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleCancelJob(job.id)}
                                            className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <XCircle size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Templates, Automation, etc. would go here (already implemented in original, just keeping it organized) */}
      
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
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
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

const PolicyToggle = ({ label, active }: { label: string, active?: boolean }) => (
    <div className="flex items-center justify-between group">
        <span className="text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-widest">{label}</span>
        <div className={`w-10 h-5 rounded-full relative p-1 transition-all ${active ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-800'}`}>
            <div className={`w-3 h-3 bg-white rounded-full absolute transition-all ${active ? 'right-1' : 'left-1'}`}></div>
        </div>
    </div>
);

export default EmailControlCenter;
