
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Zap, Sparkles, Clock, Globe, ArrowRight } from 'lucide-react';

const SubscriberInsights: React.FC = () => {
  const data = [
    { name: '00:00', usage: 12 }, { name: '04:00', usage: 8 }, { name: '08:00', usage: 45 },
    { name: '12:00', usage: 82 }, { name: '16:00', usage: 64 }, { name: '20:00', usage: 95 },
    { name: '23:59', usage: 40 },
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Sparkles className="text-blue-600" size={32} />
            Smart Insights
          </h2>
          <p className="text-slate-500 font-medium">Deep-link analysis of your network bandwidth consumption.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-[400px] flex flex-col">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Traffic Pulse (24h)
           </h3>
           <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase">Consumption (GB)</span>
           </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#94a3b8" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="usage" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group hover:shadow-2xl transition-all">
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                     <Zap size={28} />
                  </div>
                  <span className="px-3 py-1 bg-white/10 text-green-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">AI Optimized</span>
               </div>
               <div>
                  <h4 className="text-xl font-black uppercase tracking-tight italic">Provision Recommendation</h4>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed mt-2 uppercase">Your peak usage suggests the 100M Fiber Tier would offer a 40% efficiency boost during high-load intervals.</p>
               </div>
               <button className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  Upgrade Service <ArrowRight size={14} />
               </button>
            </div>
            <Sparkles className="absolute -right-8 -bottom-8 opacity-5" size={200} />
         </div>

         <div className="space-y-4">
            {[
              { label: 'Average Speed', value: '42.4 Mbps', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Peak Hour', value: '20:00 - 22:00', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
              { label: 'Data Registry', value: '184.2 GB', icon: Globe, color: 'text-green-500', bg: 'bg-green-50' }
            ].map(kpi => (
              <div key={kpi.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-colors group">
                 <div className={`w-14 h-14 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center border border-slate-50 group-hover:rotate-6 transition-transform`}>
                    <kpi.icon size={28} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                    <p className="text-xl font-black text-slate-900 tracking-tighter italic">{kpi.value}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default SubscriberInsights;

