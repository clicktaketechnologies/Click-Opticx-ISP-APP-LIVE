import React, { useMemo } from 'react';
import { AppState, DeliveryLog } from '../../types';
import { 
  BarChart3, PieChart, Activity, TrendingUp, TrendingDown,
  CheckCircle, XCircle, RefreshCw, Smartphone, MessageSquare,
  Clock, Zap, Layout, ShieldCheck, Filter, Download
} from 'lucide-react';

const NotificationAnalytics: React.FC<{ state: AppState }> = ({ state }) => {
  const logs = state.deliveryLogs || [];

  const stats = useMemo(() => {
    const total = logs.length;
    const firebase = logs.filter(l => l.gatewayUsed === 'Firebase').length;
    const sms = logs.filter(l => l.gatewayUsed === 'SMS' || l.fallbackUsed === 'SMS').length;
    const delivered = logs.filter(l => l.status === 'Delivered').length;
    const failed = logs.filter(l => l.status === 'Failed').length;
    const retried = logs.reduce((acc, log) => acc + (log.retryCount || 0), 0);

    return {
      total,
      firebase,
      sms,
      delivered,
      failed,
      retried,
      pushSuccess: firebase ? Math.round((logs.filter(l => l.gatewayUsed === 'Firebase' && l.status === 'Delivered').length / firebase) * 100) : 0,
      smsSuccess: sms ? Math.round((logs.filter(l => (l.gatewayUsed === 'SMS' || l.fallbackUsed === 'SMS') && l.status === 'Delivered').length / sms) * 100) : 0,
    };
  }, [logs]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                <BarChart3 size={28} />
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Notification Analytics</h2>
          </div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-16">Real-time Performance Metrics & Delivery Health</p>
        </div>
        <div className="flex gap-3">
            <button className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <Filter size={16} className="text-blue-600" /> Filter Logs
            </button>
            <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3">
                <Download size={18} /> Export Data
            </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Messages', val: stats.total, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Push Success', val: `${stats.pushSuccess}%`, icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'SMS Success', val: `${stats.smsSuccess}%`, icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Failed Count', val: stats.failed, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Retry Count', val: stats.retried, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-6 shadow-inner`}>
                <kpi.icon size={24} />
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <h4 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">{kpi.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Graphs Placeholder Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Channel Distribution</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Firebase vs SMS Delivery Volume</p>
                </div>
                <PieChart className="text-slate-200" size={32} />
              </div>
              
              <div className="h-64 flex items-center justify-center relative bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                  <div className="absolute inset-0 opacity-5 pointer-events-none p-10">
                      <div className="w-full h-full border-4 border-dashed border-slate-900 rounded-full"></div>
                  </div>
                  <div className="z-10 flex gap-12">
                      <div className="text-center">
                          <p className="text-4xl font-black italic text-blue-600 tracking-tighter">{stats.firebase}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firebase Dispatches</p>
                      </div>
                      <div className="w-[1px] h-12 bg-slate-200 my-auto"></div>
                      <div className="text-center">
                          <p className="text-4xl font-black italic text-green-600 tracking-tighter">{stats.sms}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMS Fallbacks</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <TrendingUp className="absolute -right-10 -top-10 opacity-10" size={180} />
              <div className="flex items-center justify-between relative z-10">
                <div>
                   <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">System Reliability</h3>
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Delivery Handshake Latency & Success</p>
                </div>
                <ShieldCheck className="text-blue-500" size={32} />
              </div>

              <div className="mt-12 space-y-6 relative z-10">
                  <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Avg. Handshake Time</p>
                        <p className="text-2xl font-black italic text-blue-400 tracking-tighter uppercase">124 MS</p>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 w-[70%]" />
                      </div>
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">API Uptime (99.9%)</p>
                        <p className="text-2xl font-black italic text-green-400 tracking-tighter uppercase">Healthy</p>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[99%]" />
                      </div>
                  </div>
              </div>

              <button className="w-full mt-12 py-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest transition-all">
                  Run Deep System Scan
              </button>
          </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Dispatch History</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit trail for all active notifications</p>
              </div>
              <Layout size={24} className="text-slate-300" />
          </div>
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                      <tr className="border-b border-slate-50 text-left">
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Timestamp</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">User</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Event</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Gateway</th>
                          <th className="p-8 text-[9px] font-black text-slate-400 uppercase tracking-widest italic text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {logs.slice(0, 10).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                               <td className="p-8 font-bold text-xs text-slate-500 uppercase italic">{new Date(log.timestamp).toLocaleString()}</td>
                               <td className="p-8 font-black text-slate-800 uppercase tracking-tighter italic">{log.userName}</td>
                               <td className="p-8 font-black text-blue-600 uppercase tracking-widest text-[10px]">{log.event || 'GENERAL'}</td>
                               <td className="p-8">
                                   <div className="flex items-center gap-2">
                                       <span className="font-black text-slate-800 text-[10px] uppercase">{log.gatewayUsed || 'Firebase'}</span>
                                       {log.fallbackUsed && (
                                           <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-black uppercase border border-amber-100 italic">Fallback: {log.fallbackUsed}</span>
                                       )}
                                   </div>
                               </td>
                               <td className="p-8">
                                   <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest mx-auto w-fit ${log.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                                       {log.status}
                                   </div>
                               </td>
                          </tr>
                      ))}
                      {logs.length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-20 text-center">
                                  <Clock size={48} className="text-slate-100 mx-auto mb-6" />
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Dispatch Logs Found in Registry</p>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default NotificationAnalytics;
