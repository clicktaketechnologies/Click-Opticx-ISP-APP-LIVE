
import React from 'react';
import { Megaphone, Calendar, Clock, ArrowRight, Zap, Info, ShieldAlert, BadgeCheck } from 'lucide-react';

const SubscriberNews: React.FC = () => {
  const newsItems = [
    { id: 1, type: 'Maintenance', title: 'North Node Uplink Maintenance', date: '24 May 2025', desc: 'Brief handshake disruptions expected between 02:00 and 04:00 AM for infrastructure optimization.', priority: 'High' },
    { id: 2, type: 'Promo', title: 'Eid-ul-Adha Double Data Blast', date: '10 Jun 2025', desc: 'Active subscribers get 100% data allocation bonus during the Eid holidays. Registry auto-updates enabled.', priority: 'Normal' },
    { id: 3, type: 'Update', title: 'AI Support Engine v5.2 Live', date: '15 May 2025', desc: 'Our new intelligent support node is now operational. Access it via the Home dashboard for 24/7 assistance.', priority: 'Normal' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
           <Megaphone size={14} className="text-blue-500" /> System Broadcast Registry
        </h3>
        
        <div className="space-y-4">
           {newsItems.map(item => (
             <div key={item.id} className={`bg-white rounded-[2.5rem] border-2 shadow-sm p-8 transition-all hover:shadow-xl group ${item.priority === 'High' ? 'border-rose-100' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start mb-6">
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.type === 'Maintenance' ? 'bg-rose-50 text-rose-600 border-rose-100' : item.type === 'Promo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {item.type}
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase">
                      <Calendar size={12} />
                      {item.date}
                   </div>
                </div>
                
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic group-hover:text-blue-600 transition-colors">{item.title}</h4>
                <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase mt-4">{item.desc}</p>
                
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-widest">
                      Full Dispatch <ArrowRight size={14} />
                   </button>
                   {item.priority === 'High' && (
                     <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                        <ShieldAlert size={14} />
                        <span className="text-[9px] font-black uppercase">Critical Relay</span>
                     </div>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriberNews;
