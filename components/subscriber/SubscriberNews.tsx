
import React from 'react';
import { Megaphone, Calendar, Clock, ArrowRight, Zap, Info, ShieldAlert, BadgeCheck } from 'lucide-react';
import { AppState, NOCEvent } from '../../types';

interface Props {
  state: AppState;
}

const SubscriberNews: React.FC<Props> = ({ state }) => {
  // Filter active events and sort by start time (newest first)
  const activeEvents = (state.nocEvents || [])
    .filter(e => e.status === 'Active')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
           <Megaphone size={14} className="text-blue-500" /> System Broadcast Registry
        </h3>
        
        {activeEvents.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center">
               <BadgeCheck size={32} />
            </div>
            <div>
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Systems Nominal</h4>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">No active maintenance or alerts in your zone.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             {activeEvents.map(item => (
               <div key={item.id} className={`bg-white rounded-[2.5rem] border-2 shadow-sm p-8 transition-all hover:shadow-xl group ${item.severity === 'Critical' ? 'border-rose-100' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-6">
                     <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.severity === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : item.severity === 'Warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {item.severity === 'Info' ? 'Update' : item.severity}
                     </div>
                     <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase">
                        <Calendar size={12} />
                        {new Date(item.startTime).toLocaleString()}
                     </div>
                  </div>
                  
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic group-hover:text-blue-600 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase mt-4">{item.description}</p>
                  
                  <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                     <button className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-widest">
                        Full Dispatch <ArrowRight size={14} />
                     </button>
                     {item.severity === 'Critical' && (
                       <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                          <ShieldAlert size={14} />
                          <span className="text-[9px] font-black uppercase">Critical Relay</span>
                       </div>
                     )}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriberNews;
