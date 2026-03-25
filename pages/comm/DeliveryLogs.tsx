
import React, { useState, useMemo } from 'react';
import { AppState, DeliveryLog } from '../../types';
import { db } from '../../db';
import { 
  ListChecks, Search, Filter, Mail, Smartphone, 
  Clock, CheckCircle, XCircle, UserCircle, 
  ChevronRight, ArrowRight, Download, Activity,
  Globe, ShieldCheck, History, Eye, ExternalLink,
  Hash, LayoutGrid, Zap
} from 'lucide-react';

const DeliveryLogs: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Email' | 'Push'>('All');

  // Added safety fallback for deliveryLogs array
  const logs = useMemo(() => {
    return (state.deliveryLogs || []).filter(log => {
      const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           log.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || log.type === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.deliveryLogs, searchTerm, typeFilter]);

  // Added safety check for stats calculation to prevent crash if deliveryLogs is undefined
  const stats = useMemo(() => {
    const deliveryLogs = state.deliveryLogs || [];
    const emailCount = deliveryLogs.filter(l => l.type === 'Email').length;
    const pushCount = deliveryLogs.filter(l => l.type === 'Push').length;
    const failRate = deliveryLogs.length > 0 ? Math.round((deliveryLogs.filter(l => l.status === 'Failed').length / deliveryLogs.length) * 100) : 0;
    return { emailCount, pushCount, failRate };
  }, [state.deliveryLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <ListChecks className="text-indigo-600" size={32} />
            Transparency Registry
          </h2>
          <p className="text-slate-500 font-medium">Global audit trail for all digital communications and protocol handshakes.</p>
        </div>
        <div className="flex gap-4">
           <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
             <Download size={16}/> Export Ledger
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Email Dispatches', val: stats.emailCount, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Push Handshakes', val: stats.pushCount, icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Registry Failure', val: `${stats.failRate}%`, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
         ].map(stat => (
           <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
              <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center border border-current/10 shadow-inner group-hover:scale-105 transition-transform`}><stat.icon size={28}/></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                 <h4 className="text-2xl font-black text-slate-900 italic tracking-tighter">{stat.val}</h4>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-900"
              placeholder="Audit by ID or Subscriber Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {['All', 'Email', 'Push'].map((f: any) => (
              <button 
                key={f} 
                onClick={() => setTypeFilter(f)}
                className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${typeFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Caller Details</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Connection Status</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trigger Source</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Audit</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             {log.type === 'Email' ? <Mail size={16} className="text-blue-500" /> : <Smartphone size={16} className="text-indigo-500" />}
                             <span className="font-black text-slate-900 uppercase tracking-tight text-xs">{log.type} Relay</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors border shadow-inner"><UserCircle size={18}/></div>
                             <div className="space-y-0.5">
                                <p className="font-black text-slate-900 uppercase text-xs leading-none">{log.userName}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{log.userId}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${log.status === 'Delivered' || log.status === 'Opened' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                             {log.status}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase italic">
                          {new Date(log.timestamp).toLocaleString()}
                       </td>
                       <td className="px-8 py-5">
                          {/* Fixed syntax error (missing closing bracket) and invalid component interpolation in className */}
                          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded border border-slate-200 text-[8px] font-black uppercase tracking-widest">
                             {log.triggerSource === 'Automation' ? <Zap size={10}/> : <LayoutGrid size={10}/>}
                             {log.triggerSource}
                          </div>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all active:scale-90"><ChevronRight size={18}/></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            
            {logs.length === 0 && (
              <div className="p-32 text-center flex flex-col items-center">
                 <ShieldCheck className="text-slate-100 mb-6" size={80} />
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">Registry Log Blank</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No communication nodes have attempted handshake yet.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default DeliveryLogs;
