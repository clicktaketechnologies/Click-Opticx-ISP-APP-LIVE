
import React from 'react';
import { AppState, ISPUser } from '../../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowLeft, BarChart3, Zap, Globe, Sparkles } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
}

const SubscriberAIInsights: React.FC<Props> = ({ user, state, onBack }) => {
  const data = [
    { name: 'Mon', usage: 42 }, { name: 'Tue', usage: 38 }, { name: 'Wed', usage: 65 },
    { name: 'Thu', usage: 82 }, { name: 'Fri', usage: 94 }, { name: 'Sat', usage: 120 },
    { name: 'Sun', usage: 105 },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
      <div className="flex items-center gap-4 px-2">
         <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 active:scale-90 transition-all shadow-sm">
            <ArrowLeft size={20} />
         </button>
         <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Traffic Insights</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Behavioral Handshake Analysis</p>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm h-80 flex flex-col">
        <div className="flex justify-between items-center mb-8 px-2">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" />
              Node Consumption (Weekly)
           </h3>
           <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase italic">Peak Load Detect</span>
        </div>
        <div className="flex-1 min-h-0">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {[
           { label: 'Uptime Grade', value: '99.98%', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Peak Interval', value: '18:00 - 22:00', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
         ].map(item => (
           <div key={item.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5">
              <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center border shadow-inner`}>
                 <item.icon size={28} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                 <p className="text-xl font-black text-slate-900 italic tracking-tighter">{item.value}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-6 shadow-2xl relative overflow-hidden">
         <div className="relative z-10 flex items-center gap-4">
            <Sparkles className="text-amber-400" size={24} />
            <h4 className="text-xl font-black uppercase italic tracking-tighter">AI Efficiency Tips</h4>
         </div>
         <div className="relative z-10 space-y-4">
            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase italic">"Upgrade not required: Your current Home Tier fits 85% of your peak load. Optimize background downloads for better ping."</p>
            <div className="h-px bg-white/5"></div>
            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase italic">"Best time for massive downloads is between 02:00 and 06:00 AM when regional node load is minimal."</p>
         </div>
      </div>
    </div>
  );
};

export default SubscriberAIInsights;
