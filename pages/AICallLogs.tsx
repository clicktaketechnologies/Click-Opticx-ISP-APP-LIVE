
import React, { useState, useMemo } from 'react';
import { AppState, AICallLog } from '../types';
import { db } from '../db';
import { 
  History, Search, Filter, PhoneCall, Clock, 
  UserCircle, ChevronRight, Activity, ShieldCheck, 
  Calendar, Download, X, Eye, FileText, ArrowUpRight,
  TrendingUp, TrendingDown, Info, ShieldAlert, Sparkles,
  RefreshCw, Hash
} from 'lucide-react';

const AICallLogs: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [escalationFilter, setEscalationFilter] = useState<'all' | 'needed' | 'resolved'>('all');
  const [selectedCall, setSelectedCall] = useState<AICallLog | null>(null);

  const logs = useMemo(() => {
    return (state.aiCallLogs || []).filter(log => {
      const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           log.userId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEscalation = escalationFilter === 'all' || 
                               (escalationFilter === 'needed' && log.escalationNeeded);
      return matchesSearch && matchesEscalation;
    }).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.aiCallLogs, searchTerm, escalationFilter]);

  const stats = useMemo(() => {
    const total = state.aiCallLogs.length;
    const escalated = state.aiCallLogs.filter(l => l.escalationNeeded).length;
    const avgDuration = total > 0 ? Math.round(state.aiCallLogs.reduce((acc, l) => acc + l.duration, 0) / total) : 0;
    const avgConf = total > 0 ? Math.round((state.aiCallLogs.reduce((acc, l) => acc + l.confidence, 0) / total) * 100) : 0;
    return { total, escalated, avgDuration, avgConf };
  }, [state.aiCallLogs]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none uppercase">
            <History className="text-blue-600" size={32} />
            Call Transparency Registry
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Heuristic Voice Handshake Audit Trail • v8.5</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all">
          <Download size={18} /> Export Full Registry
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Total Connected Calls', value: stats.total, icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Escalations', value: stats.escalated, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
           { label: 'Avg Pulse Width', value: formatDuration(stats.avgDuration), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
           { label: 'Decision Accuracy', value: `${stats.avgConf}%`, icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50' }
         ].map((kpi, idx) => (
           <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className={`${kpi.bg} ${kpi.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                 <kpi.icon size={20} />
              </div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 italic tracking-tighter">{kpi.value}</h3>
           </div>
         ))}
      </div>

      {/* Audit Search Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
              placeholder="Audit by Identity or Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Handshaking' },
              { id: 'needed', label: 'Escalations Required' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setEscalationFilter(f.id as any)}
                className={`px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${escalationFilter === f.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f.label}
              </button>
            ))}
         </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[1200px]">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Timestamp</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pulse Width</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Context Topics</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Heuristic Conf.</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Audit</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors shadow-inner">
                                <UserCircle size={28}/>
                             </div>
                             <div>
                                <p className="font-black text-slate-900 uppercase text-sm leading-none mb-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setSelectedCall(log)}>{log.userName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{log.userId}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <div className="space-y-1">
                             <p className="text-xs font-black text-slate-700 uppercase italic leading-none">{new Date(log.timestamp).toLocaleDateString()}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <Clock size={12} className="text-blue-500" />
                             <span className="text-sm font-black italic tabular-nums text-slate-900">{formatDuration(log.duration)}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                             {log.topics.map(t => (
                               <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[7px] font-black uppercase tracking-tighter">{t}</span>
                             ))}
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${log.confidence > 0.8 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${log.confidence * 100}%` }}></div>
                             </div>
                             <span className="text-[10px] font-black italic">{Math.round(log.confidence * 100)}%</span>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                             {log.escalationNeeded && (
                               <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center animate-pulse border border-rose-100" title="Escalation Required">
                                  <ShieldAlert size={16}/>
                               </div>
                             )}
                             <button onClick={() => setSelectedCall(log)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl shadow-sm transition-all active:scale-90">
                                <ChevronRight size={18}/>
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            
            {logs.length === 0 && (
              <div className="p-32 text-center flex flex-col items-center">
                 <ShieldCheck size={80} className="text-slate-100 mb-6" />
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">Registry Queue Synchronized</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No call artifacts detected in current node parameters.</p>
              </div>
            )}
         </div>
      </div>

      {/* Log Detail / Audit Overlay */}
      {selectedCall && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3.5rem] w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col">
              <header className="p-8 md:p-10 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center border-4 border-white/5 shadow-2xl">
                       <History size={32}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Call Audit: #{selectedCall.id.split('-').pop()}</h3>
                       <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Protocol Transparency v4.2</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all"><Download size={24}/></button>
                    <button onClick={() => setSelectedCall(null)} className="p-3 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl transition-all"><X size={32}/></button>
                 </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar bg-slate-50/50">
                 {/* Identity Summary */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">Caller Details</p>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border shadow-inner"><UserCircle size={28} className="text-slate-300"/></div>
                          <div>
                             <p className="font-black text-slate-900 uppercase text-lg leading-none">{selectedCall.userName}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref: {selectedCall.userId}</p>
                          </div>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">Fiscal Risk Audit</p>
                       <div className="flex justify-between items-end">
                          <p className="text-3xl font-black italic tracking-tighter text-slate-900">{Math.round(selectedCall.confidence * 100)}%</p>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedCall.confidence > 0.8 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                             {selectedCall.confidence > 0.8 ? 'Optimized' : 'Verification Required'}
                          </span>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">Handshake Metrics</p>
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <Clock size={16} className="text-blue-500"/>
                             <span className="text-xl font-black italic text-slate-900">{formatDuration(selectedCall.duration)}</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(selectedCall.timestamp).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </div>

                 {/* Topics & Transcription Area */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                       <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                          <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4 italic"><Sparkles size={14} className="text-amber-500"/> Heuristic Labels</h4>
                          <div className="space-y-2">
                             {selectedCall.topics.map(t => (
                               <div key={t} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                  <span className="text-[10px] font-black uppercase text-slate-700">{t}</span>
                                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className={`p-8 rounded-[2.5rem] border-2 space-y-4 shadow-xl ${selectedCall.escalationNeeded ? 'bg-rose-50 border-rose-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${selectedCall.escalationNeeded ? 'bg-rose-600' : 'bg-green-600'} text-white`}>
                                {selectedCall.escalationNeeded ? <ShieldAlert size={28}/> : <ShieldCheck size={28}/>}
                             </div>
                             <div>
                                <p className="text-sm font-black uppercase italic tracking-tight">{selectedCall.escalationNeeded ? 'Escalations Active' : 'Autonomous Resolution'}</p>
                                <p className={`text-[8px] font-black uppercase tracking-widest ${selectedCall.escalationNeeded ? 'text-rose-400' : 'text-green-400'}`}>Integrity Handshake</p>
                             </div>
                          </div>
                          <p className={`text-[10px] font-bold uppercase leading-relaxed ${selectedCall.escalationNeeded ? 'text-rose-800' : 'text-green-800'}`}>
                             {selectedCall.escalationNeeded 
                               ? 'AI core flagged this session for human audit due to sentiment mismatch or technical complexity.'
                               : 'AI autonomous engine completed the registry handshake without intervention.'}
                          </p>
                       </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                       <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={16} className="text-blue-600"/> Heuristic Transcription Output</h4>
                             <span className="text-[8px] font-black uppercase bg-white px-2 py-1 rounded border border-slate-200 text-slate-400">Node_v4.2_Logs</span>
                          </div>
                          <div className="p-8 flex-1 bg-white font-bold text-slate-700 leading-relaxed uppercase italic text-sm">
                             {selectedCall.transcription || 'NO TRANSCRIPTION METADATA AVAILABLE FOR THIS NODE PULSE.'}
                          </div>
                          <div className="p-4 bg-slate-900 border-t border-white/5 flex items-center justify-between text-white">
                             <div className="flex items-center gap-2">
                                <Activity size={12} className="text-green-400 animate-pulse"/>
                                <span className="text-[8px] font-black uppercase text-slate-500">Heuristic air-gap active</span>
                             </div>
                             <p className="text-[8px] font-black uppercase text-slate-600">Encrypted Pulse Stream</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Safety Footer / Actions */}
                 <div className="p-10 bg-blue-50 border border-blue-100 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex-1 space-y-2 text-center md:text-left">
                       <h4 className="text-xl font-black uppercase italic tracking-tighter text-blue-900 flex items-center justify-center md:justify-start gap-3"><ShieldCheck size={24}/> Integrity Verification</h4>
                       <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed">
                          All call artifacts are persistent and auditable. Reversing autonomous decisions (like credit adjustments) requires individual node rollback via the AI Control Plane.
                       </p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                       <button className="flex-1 py-4 px-8 bg-slate-950 text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl">Flag for Audit</button>
                       <button className="flex-1 py-4 px-8 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-xl">Acknowledge Link</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AICallLogs;

