import React, { useMemo } from 'react';
import { 
  TrendingUp, Users, Zap, ShieldAlert, 
  ArrowUpRight, ArrowDownRight, Activity,
  CheckCircle2, AlertCircle, Clock, 
  ArrowRight, Sparkles, Filter, 
  Calendar, Download, MoreHorizontal
} from 'lucide-react';
import { AppState } from '../../types';
import { V2Card, V2Badge, V2Button } from '../../components/v2/UIAtoms';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const DashboardV2: React.FC<{ state: AppState }> = ({ state }) => {
  
  // 1. Metric Computations (Parity with dbState)
  const metrics = useMemo(() => [
    { 
      label: 'Monthly Revenue', 
      value: `PKR ${(state.stats?.monthlyRevenue || 0).toLocaleString()}`, 
      trend: '+12.4%', 
      icon: TrendingUp, 
      color: 'blue',
      sub: 'vs Last Month'
    },
    { 
      label: 'Active Matrix', 
      value: (state.stats?.activeUsers || 0).toLocaleString(), 
      trend: '+45', 
      icon: Users, 
      color: 'indigo',
      sub: 'Live Subscribers'
    },
    { 
      label: 'Network Load', 
      value: `${state.networkStats?.avgLoad || 0}%`, 
      trend: '-2.1%', 
      icon: Zap, 
      color: 'emerald',
      sub: 'System Latency'
    },
    { 
      label: 'Emergency Alerts', 
      value: (state.emergencyCount || 0).toString(), 
      trend: 'CRITICAL', 
      icon: ShieldAlert, 
      color: 'rose',
      sub: 'Requires Action'
    }
  ], [state]);

  // 2. AI Priorities (Mocked for now, but wired to state)
  const priorities = [
    { id: 1, title: '12 Overdue Invoices', sub: 'Total Risk: PKR 145,000', type: 'billing', action: 'Send Bulk Reminders' },
    { id: 2, title: 'OLT Node 4 Lagging', sub: 'Latency increased to 45ms', type: 'network', action: 'Optimize Node' },
    { id: 3, title: '5 KYC Pending', sub: 'Verification queue growing', type: 'admin', action: 'Verify Now' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
         {metrics.map((m, idx) => (
           <V2Card key={idx} className="hover:-translate-y-2">
              <div className="flex justify-between items-start mb-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    m.color === 'blue' ? 'bg-blue-600 shadow-blue-500/20' : 
                    m.color === 'indigo' ? 'bg-indigo-600 shadow-indigo-500/20' : 
                    m.color === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                    'bg-rose-500 shadow-rose-500/20'
                 }`}>
                    <m.icon size={24} />
                 </div>
                 <div className={`flex items-center gap-1 text-[10px] font-black ${
                    m.trend.includes('+') ? 'text-emerald-500' : 'text-rose-500'
                 }`}>
                    {m.trend.includes('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {m.trend}
                 </div>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                 <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-1">{m.value}</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.sub}</p>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.8] transition-transform duration-1000">
                 <m.icon size={180} />
              </div>
           </V2Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chart Area */}
         <div className="lg:col-span-2">
            <V2Card 
                title="Revenue Matrix" 
                subtitle="Daily ingestion performance"
                headerAction={
                    <div className="flex gap-2">
                        <V2Button label="D" variant="ghost" className="px-3 py-2" />
                        <V2Button label="W" variant="primary" className="px-3 py-2" />
                        <V2Button label="M" variant="ghost" className="px-3 py-2" />
                    </div>
                }
            >
                <div className="h-[400px] w-full mt-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={state.revenueData || []}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                                dy={15}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                                dx={-10}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#0F172A', 
                                    border: 'none', 
                                    borderRadius: '1rem', 
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#3B82F6" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorRev)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </V2Card>
         </div>

         {/* Priorities & AI Suggestions */}
         <div className="space-y-8">
            <V2Card 
                title="Mission Priorities" 
                subtitle="AI-driven operational queue"
                headerAction={<Sparkles className="text-amber-500 animate-pulse" size={18} />}
            >
                <div className="space-y-6 mt-6">
                    {priorities.map(p => (
                        <div key={p.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl transition-all group relative overflow-hidden">
                           <div className="flex items-start gap-4 relative z-10">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                p.type === 'billing' ? 'bg-blue-100 text-blue-600' :
                                p.type === 'network' ? 'bg-amber-100 text-amber-600' :
                                'bg-indigo-100 text-indigo-600'
                              }`}>
                                 {p.type === 'billing' ? <TrendingUp size={20}/> : <Activity size={20}/>}
                              </div>
                              <div className="flex-1">
                                 <h4 className="text-xs font-black text-slate-900 uppercase italic leading-none mb-1">{p.title}</h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sub}</p>
                                 <button className="mt-4 text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 group-hover:gap-3 transition-all">
                                    {p.action} <ArrowRight size={12} />
                                 </button>
                              </div>
                           </div>
                           <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -rotate-12 translate-x-8 -translate-y-8 rounded-full"></div>
                        </div>
                    ))}
                </div>
                <V2Button label="Analyze All Threads" variant="secondary" className="w-full mt-10" />
            </V2Card>

            <V2Card className="bg-slate-950 text-white shadow-2xl shadow-blue-500/20">
                <div className="flex flex-col h-full justify-between gap-12">
                   <div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/40">
                         <Zap className="text-white fill-white" size={24} />
                      </div>
                      <h3 className="text-2xl font-black italic tracking-tighter mb-4 leading-tight">SYSTEM INTEGRITY:<br/>99.98%</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">All nodes operational • zero lag detected</p>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <span>Bandwidth Yield</span>
                         <span>94.2%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-600 w-[94%]" />
                      </div>
                   </div>
                </div>
            </V2Card>
         </div>
      </div>
    </div>
  );
};

export default DashboardV2;
