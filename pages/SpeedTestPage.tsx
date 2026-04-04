
import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, Zap, Activity, AlertTriangle } from 'lucide-react';
import PremiumSpeedTest from '../components/shared/PremiumSpeedTest';
import { db } from '../db';

const SpeedTestPage: React.FC = () => {
  const [testHistory, setTestHistory] = useState<any[]>([]);

  useEffect(() => {
    const state = db.getState();
    if (state.speedTestHistory) {
      setTestHistory(state.speedTestHistory.slice(0, 10));
    }
    
    return db.onStateChange((newState) => {
      setTestHistory((newState.speedTestHistory || []).slice(0, 10));
    });
  }, []);

  const handleTestComplete = (results: any) => {
    const currentUser = db.getState().currentUser;
    db.addSpeedTestHistory({
      userId: currentUser?.id || 'ANON',
      userName: currentUser?.name || 'Anonymous',
      downloadMbps: results.dl,
      uploadMbps: results.ul,
      pingMs: results.ping,
      jitterMs: results.jitter,
      packetLoss: results.packetLoss,
      server: results.server || 'Auto-Select',
      ip: results.ip || 'N/A',
      isp: results.isp || 'N/A',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      
      {/* Premium Test Engine */}
      <section>
        <PremiumSpeedTest onComplete={handleTestComplete} />
      </section>

      {/* Historical Diagnostics */}
      <section className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
         <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50">
            <div>
               <h3 className="text-slate-900 font-black text-xl italic uppercase tracking-tighter flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100"><HistoryIcon size={24}/></div>
                  Diagnostic History
               </h3>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 leading-none ml-14">Previous 10 session captures registered</p>
            </div>
            <button 
              onClick={() => { setTestHistory([]); localStorage.removeItem('click_speedHistory'); }}
              className="px-6 py-3 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-200"
            >
               Flush Registry
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                     <th className="px-10 py-5">Temporal Node</th>
                     <th className="px-10 py-5">Downlink</th>
                     <th className="px-10 py-5">Uplink</th>
                     <th className="px-10 py-5">Latency/Jitter</th>
                     <th className="px-10 py-5">Integrity</th>
                     <th className="px-10 py-5 text-right">Metric Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {testHistory.map((test) => (
                    <tr key={test.id} className="hover:bg-blue-50/30 transition-colors group">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                <Clock size={16}/>
                             </div>
                             <span className="text-xs font-bold text-slate-600 italic tracking-tight">{test.timestamp}</span>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-1">
                             <span className="text-xl font-black text-slate-900 italic tracking-tighter">{test.downloadMbps.toFixed(1)}</span>
                             <span className="text-[10px] font-black text-slate-300 uppercase italic">Mbps</span>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-1">
                             <span className="text-lg font-black text-slate-400 italic tracking-tighter">{test.uploadMbps.toFixed(1)}</span>
                             <span className="text-[9px] font-black text-slate-200 uppercase italic">Mbps</span>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-slate-800 italic">{test.pingMs} ms</span>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mt-1">Jitter: {test.jitterMs}ms</span>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-xs font-black uppercase italic tracking-widest text-slate-400 group-hover:text-rose-500 transition-colors">
                         {test.packetLoss}% Fragmentation
                       </td>
                       <td className="px-10 py-6 text-right">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                             test.downloadMbps > 30 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                          } shadow-sm italic`}>
                             <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                             {test.downloadMbps > 30 ? 'Optimal' : 'Standard'}
                          </span>
                       </td>
                    </tr>
                  ))}
                  {testHistory.length === 0 && (
                    <tr>
                       <td colSpan={6} className="px-10 py-32 text-center">
                          <Activity size={56} className="mx-auto mb-6 text-slate-100 animate-pulse" />
                          <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] italic">No local diagnostic clusters detected</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* Warning/Guide Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
         <div className="flex items-start gap-6 group">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
               <Zap size={28} />
            </div>
            <div>
               <h4 className="text-slate-900 font-black uppercase italic tracking-tighter mb-2">Protocol Optimization</h4>
               <p className="text-slate-400 text-xs leading-relaxed font-bold">For accurate diagnostic results, disable high-bandwidth background processes and local file synchronizations before testing.</p>
            </div>
         </div>
         <div className="flex items-start gap-6 group">
            <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 shadow-inner group-hover:scale-110 transition-transform">
               <AlertTriangle size={28} />
            </div>
            <div>
               <h4 className="text-slate-900 font-black uppercase italic tracking-tighter mb-2">Signal Interference</h4>
               <p className="text-slate-400 text-xs leading-relaxed font-bold">Environmental hardware obstructions or proximity to the ONU unit can severely affect Jitter and Packet Integrity metrics.</p>
            </div>
         </div>
      </div>

    </div>
  );
};

export default SpeedTestPage;

