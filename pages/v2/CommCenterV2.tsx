import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, Mail, Zap, ShieldCheck, 
  ShieldAlert, Search, Plus, RefreshCw, 
  BarChart3, ArrowRight, Settings, 
  Send, Users, Layout, Smartphone,
  Globe, Clock, CheckCircle2, XCircle,
  AlertTriangle, Filter, MoreHorizontal,
  ChevronRight, Database, HardDrive, 
  Eye, Repeat, Trash2, Edit3, Sparkles
} from 'lucide-react';
import { AppState, EmailProvider, Campaign, EmailJob } from '../../types';
import { V2Badge, V2Button, V2Card } from '../../components/v2/UIAtoms';
import { V2SmartTable, V2SlideOver, V2TableRow, V2TableCell } from '../../components/v2/TableAndSlide';

const CommCenterV2: React.FC<{ state: AppState }> = ({ state }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'campaigns' | 'queue'>('campaigns');

  // 1. Data Aggregation
  const providers = state.emailProviders || [];
  const campaigns = state.campaigns || [];
  const jobs = state.emailJobs || [];

  const stats = {
    totalSent: 14500, // Mocked for now
    healthRate: '98.5%',
    activeProviders: providers.filter(p => p.enabled).length,
    queuedJobs: jobs.length
  };

  return (
    <div className="space-y-10">
      {/* Transmission Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <V2Card className="bg-slate-950 text-white shadow-2xl">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Send size={24} />
                </div>
                <V2Badge label="Live" color="emerald" variant="solid" icon={ShieldCheck} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Transmission</p>
            <h4 className="text-2xl font-black italic tracking-tighter">{(stats.totalSent || 0).toLocaleString()} Dispatches</h4>
        </V2Card>
        <MiniCommStat label="Delivery Success" value={stats.healthRate} sub="Aggregate Yield" color="emerald" icon={CheckCircle2} />
        <MiniCommStat label="Active Nodes" value={stats.activeProviders} sub="Infrastructure Relays" color="blue" icon={Database} />
        <MiniCommStat label="Queue Depth" value={stats.queuedJobs} sub="Awaiting Relay" color="amber" icon={Clock} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
         <div className="flex gap-2 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            {[
                { id: 'campaigns', label: 'Campaign Matrix', icon: Layout },
                { id: 'infrastructure', label: 'Infra Hub', icon: HardDrive },
                { id: 'queue', label: 'Manual Queue', icon: Database }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                        ? 'bg-slate-950 text-white shadow-xl shadow-slate-950/20' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
         {activeTab === 'campaigns' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4 flex-1 max-w-xl">
                     <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search campaigns..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                        />
                     </div>
                  </div>
                  <V2Button label="Initialize Campaign" icon={Plus} />
               </div>

               <V2SmartTable headers={['Campaign Node', 'Transmission Plan', 'Target Audience', 'Yield Status', 'Control']}>
                  {campaigns.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-10 py-20 text-center">
                            <p className="text-sm font-black text-slate-300 uppercase italic tracking-[0.4em]">No active campaigns in matrix</p>
                        </td>
                    </tr>
                  ) : campaigns.map(c => (
                    <V2TableRow key={c.id}>
                        <V2TableCell>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <MessageSquare size={20} />
                                </div>
                                <p className="text-sm font-black text-slate-900 uppercase italic leading-none">{c.name}</p>
                            </div>
                        </V2TableCell>
                        <V2TableCell>
                            <V2Badge label={c.type} color="blue" variant="ghost" />
                        </V2TableCell>
                        <V2TableCell>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{c.targetCount} Nodes</p>
                        </V2TableCell>
                        <V2TableCell>
                            <div className="flex items-center gap-4">
                                <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[75%]" />
                                </div>
                                <span className="text-[9px] font-black text-blue-500">75%</span>
                            </div>
                        </V2TableCell>
                        <V2TableCell>
                            <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                                <Eye size={16} />
                            </button>
                        </V2TableCell>
                    </V2TableRow>
                  ))}
               </V2SmartTable>
            </div>
         )}

         {activeTab === 'infrastructure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {providers.map(p => (
                 <V2Card key={p.id} className="hover:-translate-y-2">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                            p.enabled ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-300'
                        }`}>
                            {p.id === 'resend' ? <Zap size={24} /> : <Mail size={24} />}
                        </div>
                        <div className="flex items-center gap-2">
                            {p.enabled ? (
                                <V2Badge label="Healthy" color="emerald" icon={ShieldCheck} />
                            ) : (
                                <V2Badge label="Inactive" color="rose" icon={XCircle} />
                            )}
                        </div>
                    </div>
                    <div className="mb-8">
                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-1 leading-none">{p.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.id.toUpperCase()} RELAY NODE</p>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                        <div className="text-center flex-1 border-r border-slate-200">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Latency</p>
                            <p className="text-sm font-black text-slate-900 italic">45ms</p>
                        </div>
                        <div className="text-center flex-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Success</p>
                            <p className="text-sm font-black text-emerald-600 italic">99.2%</p>
                        </div>
                    </div>
                    <V2Button label="Configure Node" variant="secondary" className="w-full" icon={Settings} />
                 </V2Card>
               ))}
               <V2Card className="border-dashed border-2 flex flex-col items-center justify-center py-20 text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all cursor-pointer">
                  <Plus size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Connect New Relay</p>
               </V2Card>
            </div>
         )}

         {activeTab === 'queue' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Manual Queue Manager</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BullMQ Background Relay Control</p>
                  </div>
                  <div className="flex gap-3">
                     <V2Button label="Purge Failed" variant="danger" icon={Trash2} />
                     <V2Button label="Resume Matrix" variant="secondary" icon={RefreshCw} />
                  </div>
               </div>
               <V2SmartTable headers={['Job ID', 'Recipient Relay', 'Attempt Node', 'Fiscal Pulse', 'Actions']}>
                  {jobs.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-10 py-20 text-center">
                            <p className="text-sm font-black text-slate-300 uppercase italic tracking-[0.4em]">No pending dispatches</p>
                        </td>
                    </tr>
                  ) : jobs.map(j => (
                    <V2TableRow key={j.id}>
                        <V2TableCell>
                            <p className="text-sm font-black text-slate-900 italic leading-none mb-1">#{j.id}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{j.name}</p>
                        </V2TableCell>
                        <V2TableCell>
                            <p className="text-[11px] font-black text-slate-500 italic">{j.data.to}</p>
                        </V2TableCell>
                        <V2TableCell>
                            <V2Badge label={`${j.attemptsMade || 0} Attempts`} color="amber" variant="ghost" />
                        </V2TableCell>
                        <V2TableCell>
                             <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                Processing
                            </span>
                        </V2TableCell>
                        <V2TableCell>
                            <div className="flex gap-2">
                                <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Repeat size={16}/></button>
                                <button className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={16}/></button>
                            </div>
                        </V2TableCell>
                    </V2TableRow>
                  ))}
               </V2SmartTable>
            </div>
         )}
      </div>

      {/* Campaign Slide-Over */}
      <V2SlideOver
        isOpen={isDetailOpen && !!selectedCampaign}
        onClose={() => setIsDetailOpen(false)}
        title={selectedCampaign?.name || ''}
        subtitle="Campaign Transmission Detail"
        footer={
            <div className="flex gap-4">
                <V2Button label="Pause Transmission" variant="secondary" className="flex-1" icon={XCircle} />
                <V2Button label="Duplicate Plane" variant="primary" className="flex-1" icon={Layout} />
            </div>
        }
      >
        {selectedCampaign && (
            <div className="space-y-10">
                {/* Visual Progress Hub */}
                <V2Card className="bg-slate-950 text-white shadow-2xl">
                    <div className="flex flex-col gap-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-3xl font-black italic tracking-tighter mb-2">92.4%</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Delivery Yield</p>
                            </div>
                            <Sparkles className="text-blue-400" size={32} />
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-[92.4%]" />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <TelemetryBit icon={CheckCircle2} label="Delivered" value="12,450" color="emerald" />
                            <TelemetryBit icon={Clock} label="Pending" value="850" color="amber" />
                            <TelemetryBit icon={XCircle} label="Failed" value="200" color="rose" />
                        </div>
                    </div>
                </V2Card>

                {/* Audience Snapshot */}
                <V2Card title="Audience Matrix" className="bg-slate-50/50">
                    <div className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-slate-100 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">14,500 Subscribers</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Sector Alpha</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <V2Badge label="Status: Active" color="emerald" />
                        <V2Badge label="Sector: All" color="blue" />
                        <V2Badge label="Package: Fiber-Prime" color="indigo" />
                    </div>
                </V2Card>

                {/* Template Preview */}
                <V2Card title="Message Template Plane" className="bg-white">
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm text-slate-600 leading-relaxed italic">
                        "Dear Subscriber, Your Click Opticx node will be optimized today at 02:00 AM. Expect zero lag during this protocol shift. Regards, NOC."
                    </div>
                </V2Card>
            </div>
        )}
      </V2SlideOver>
    </div>
  );
};

const MiniCommStat = ({ label, value, sub, color, icon: Icon }: any) => {
    const colors: any = {
        emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        blue: 'text-blue-500 bg-blue-50 border-blue-100',
        amber: 'text-amber-500 bg-amber-50 border-amber-100',
    };
    return (
        <V2Card className="p-6">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl border ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <Send size={16} className="text-slate-300" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{value}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{sub}</p>
            </div>
        </V2Card>
    );
};

const TelemetryBit = ({ icon: Icon, label, value, color }: any) => {
    const colors: any = {
        emerald: 'text-emerald-400',
        blue: 'text-blue-400',
        amber: 'text-amber-400',
        rose: 'text-rose-400',
    };
    return (
        <div className="flex flex-col items-center text-center">
            <Icon size={20} className={`${colors[color]} mb-3`} />
            <p className="text-lg font-black italic">{value}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
};

export default CommCenterV2;
