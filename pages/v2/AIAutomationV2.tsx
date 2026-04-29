import React, { useState, useMemo } from 'react';
import { 
  Zap, Brain, MessageSquare, Smartphone, 
  Settings, Play, Pause, RefreshCw,
  Search, ShieldCheck, ShieldAlert, BarChart3,
  ArrowRight, Sparkles, Activity, Clock,
  CheckCircle2, XCircle, AlertTriangle, Filter,
  PhoneCall, Mic2, FileText, ChevronDown,
  Repeat, Database, Target, Layers
} from 'lucide-react';
import { AppState } from '../../types';
import { V2Badge, V2Button, V2Card } from '../../components/v2/UIAtoms';
import { V2SmartTable, V2SlideOver, V2TableRow, V2TableCell } from '../../components/v2/TableAndSlide';

const AIAutomationV2: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'campaigns' | 'logs'>('modules');
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 1. Module Matrix
  const aiModules = [
    { id: 'billing_ai', name: 'Billing Intelligence', desc: 'Predicts churn and automates fiscal recovery remidners.', active: true, icon: Database },
    { id: 'support_ai', name: 'Support Neural', desc: 'Auto-categorizes tickets and suggests resolution protocols.', active: true, icon: Brain },
    { id: 'calling_ai', name: 'Voice Automated', desc: 'Autonomous outbound calling for recovery and feedback.', active: false, icon: PhoneCall },
    { id: 'network_ai', name: 'Infrastructure Pulse', desc: 'Predictive node optimization based on latency trends.', active: true, icon: Zap }
  ];

  const stats = {
    autonomousActions: 1250,
    successRate: '94.2%',
    activeThreads: 8,
    savedHours: 450
  };

  return (
    <div className="space-y-10">
      {/* Neural Pulse Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <V2Card className="bg-slate-950 text-white shadow-2xl">
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Sparkles size={24} />
                </div>
                <V2Badge label="OPTIMIZED" color="blue" variant="solid" icon={ShieldCheck} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Autonomous Yield</p>
            <h4 className="text-2xl font-black italic tracking-tighter">{stats.autonomousActions.toLocaleString()} Actions</h4>
        </V2Card>
        <MiniAIStat label="Operational Success" value={stats.successRate} sub="Aggregate Precision" color="emerald" icon={CheckCircle2} />
        <MiniAIStat label="Neural Threads" value={stats.activeThreads} sub="Concurrent Agents" color="indigo" icon={Activity} />
        <MiniAIStat label="Resource Yield" value={`${stats.savedHours}h`} sub="Human Hours Saved" color="amber" icon={Clock} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
         <div className="flex gap-2 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            {[
                { id: 'modules', label: 'Neural Matrix', icon: Layers },
                { id: 'campaigns', label: 'AI Campaigns', icon: Target },
                { id: 'logs', label: 'Call Telemetry', icon: Mic2 }
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
         {activeTab === 'modules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
               {aiModules.map(m => (
                 <V2Card key={m.id} className="hover:-translate-y-2">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                            m.active ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-300'
                        }`}>
                            <m.icon size={24} />
                        </div>
                        <div className="flex items-center gap-4">
                           <V2Badge 
                                label={m.active ? 'ACTIVE' : 'DORMANT'} 
                                color={m.active ? 'emerald' : 'slate'} 
                                icon={m.active ? Zap : Pause} 
                            />
                            <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${m.active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-all ${m.active ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                    <div className="mb-8">
                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-2 leading-none">{m.name}</h4>
                        <p className="text-sm font-bold text-slate-400 leading-relaxed italic">{m.desc}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Decision Yield</p>
                            <p className="text-sm font-black text-slate-900 italic">98.4%</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Resource Gain</p>
                            <p className="text-sm font-black text-indigo-600 italic">2.4h / day</p>
                        </div>
                    </div>
                 </V2Card>
               ))}
               <V2Card className="bg-indigo-50 border-indigo-100 flex flex-col items-center justify-center py-20">
                    <Sparkles size={48} className="text-indigo-400 mb-4 animate-pulse" />
                    <h3 className="text-lg font-black text-indigo-900 uppercase italic tracking-tighter mb-2">Neural Expansion</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center px-12">New autonomous modules currently training in the cloud matrix.</p>
               </V2Card>
            </div>
         )}

         {activeTab === 'campaigns' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4 flex-1 max-w-xl">
                     <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search active AI campaigns..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                        />
                     </div>
                  </div>
                  <V2Button label="Initialize AI Agent" icon={Plus} />
               </div>
               
               <V2SmartTable headers={['Agent Protocol', 'Objective Plane', 'Status Yield', 'Actions']}>
                   {/* Example Campaign Row */}
                   <V2TableRow>
                       <V2TableCell>
                           <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                   <PhoneCall size={20} />
                               </div>
                               <div>
                                   <p className="text-sm font-black text-slate-900 uppercase italic leading-none mb-1">Recovery Caller A1</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol: Outbound Voice</p>
                               </div>
                           </div>
                       </V2TableCell>
                       <V2TableCell>
                            <V2Badge label="Fiscal Recovery" color="indigo" />
                       </V2TableCell>
                       <V2TableCell>
                            <div className="flex items-center gap-4">
                                <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-[64%]" />
                                </div>
                                <span className="text-[9px] font-black text-blue-600">64%</span>
                            </div>
                       </V2TableCell>
                       <V2TableCell>
                            <div className="flex gap-2">
                                <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><Pause size={16}/></button>
                                <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><BarChart3 size={16}/></button>
                            </div>
                       </V2TableCell>
                   </V2TableRow>
               </V2SmartTable>
            </div>
         )}

         {activeTab === 'logs' && (
            <div className="space-y-8">
                <V2SmartTable headers={['Time Trace', 'Subscriber Node', 'Objective', 'Sentiment', 'Telemetry']}>
                    {/* Example Log Row */}
                    {[1, 2, 3, 4, 5].map(i => (
                        <V2TableRow key={i} onClick={() => { setSelectedCall({ id: i }); setIsDetailOpen(true); }}>
                            <V2TableCell>
                                <p className="text-[11px] font-black text-slate-500 uppercase">Apr 29, 02:1{i} PM</p>
                            </V2TableCell>
                            <V2TableCell>
                                <p className="text-sm font-black text-slate-900 uppercase italic">Subscriber #{1000 + i}</p>
                            </V2TableCell>
                            <V2TableCell>
                                <V2Badge label="Billing Recovery" color="blue" variant="ghost" />
                            </V2TableCell>
                            <V2TableCell>
                                <V2Badge label="Positive" color="emerald" variant="solid" icon={CheckCircle2} />
                            </V2TableCell>
                            <V2TableCell>
                                <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                    EXPAND <ChevronDown size={14} />
                                </button>
                            </V2TableCell>
                        </V2TableRow>
                    ))}
                </V2SmartTable>
            </div>
         )}
      </div>

      {/* Call Telemetry Slide-Over */}
      <V2SlideOver
        isOpen={isDetailOpen && !!selectedCall}
        onClose={() => setIsDetailOpen(false)}
        title={`Neural Interaction Telemetry`}
        subtitle={`Session ID: NC-${selectedCall?.id || 0}99X`}
        footer={
            <div className="flex gap-4">
                <V2Button label="Manual Review" variant="secondary" className="flex-1" icon={Edit3} />
                <V2Button label="Confirm Resolution" variant="primary" className="flex-1" icon={CheckCircle2} />
            </div>
        }
      >
        {selectedCall && (
            <div className="space-y-10">
                {/* Voice Pulse */}
                <V2Card className="bg-slate-950 text-white shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col items-center justify-center py-12 relative z-10">
                        <div className="flex items-end gap-1 mb-6">
                            {[1, 2, 4, 2, 5, 8, 4, 6, 2, 4, 3, 7, 2, 5, 4].map((h, i) => (
                                <div key={i} className="w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ height: `${h * 6}px`, animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                        <h4 className="text-2xl font-black italic tracking-tighter mb-2">04:12m</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Total AI Interaction Duration</p>
                    </div>
                    <div className="absolute top-0 right-0 p-8">
                        <Mic2 size={32} className="text-blue-500/20" />
                    </div>
                </V2Card>

                {/* Transcript Matrix */}
                <V2Card title="Interaction Transcript" className="bg-slate-50/50">
                    <div className="space-y-6 mt-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                                <Brain size={16} />
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm italic text-sm">
                                "Hello, I am calling from Click Opticx NOC regarding your pending fiscal ingestion. How can we assist in clearing this node?"
                            </div>
                        </div>
                        <div className="flex gap-4 justify-end">
                            <div className="p-4 bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-lg italic text-sm">
                                "Oh, I was busy. Can I pay via JazzCash right now?"
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-white shrink-0">
                                <User size={16} />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                                <Brain size={16} />
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm italic text-sm">
                                "Affirmative. I have dispatched a secure payment signal to your relay. Please confirm receipt."
                            </div>
                        </div>
                    </div>
                </V2Card>

                {/* Outcome Matrix */}
                <div className="grid grid-cols-2 gap-6">
                    <InfoCard icon={ShieldCheck} label="Sentiment Confidence" value="98.5%" />
                    <InfoCard icon={Target} label="Resolution" value="Payment Dispatched" />
                </div>
            </div>
        )}
      </V2SlideOver>
    </div>
  );
};

const MiniAIStat = ({ label, value, sub, color, icon: Icon }: any) => {
    const colors: any = {
        emerald: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        indigo: 'text-indigo-500 bg-indigo-50 border-indigo-100',
        amber: 'text-amber-500 bg-amber-50 border-amber-100',
    };
    return (
        <V2Card className="p-6">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl border ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <Sparkles size={16} className="text-slate-300" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{value}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{sub}</p>
            </div>
        </V2Card>
    );
};

const InfoCard = ({ icon: Icon, label, value }: any) => (
    <div className="p-6 bg-white border border-slate-100 rounded-3xl">
        <div className="flex items-center gap-3 mb-3">
            <Icon size={14} className="text-blue-500" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
    </div>
);

const User = ({ className, size }: any) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default AIAutomationV2;
