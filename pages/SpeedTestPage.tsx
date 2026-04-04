
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
      <section className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
               <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <HistoryIcon size={20} className="text-blue-400"/> Diagnostic History
               </h3>
               <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">Previous 10 session captures</p>
            </div>
            <button 
              onClick={() => { setTestHistory([]); localStorage.removeItem('click_speedHistory'); }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
               Clear Logs
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-white/5 text-white/20 text-[9px] font-black uppercase tracking-widest">
                     <th className="px-8 py-4">Session Timestamp</th>
                     <th className="px-8 py-4">Download</th>
                     <th className="px-8 py-4">Upload</th>
                     <th className="px-8 py-4">Ping/Jitter</th>
                     <th className="px-8 py-4">Packet Loss</th>
                     <th className="px-8 py-4 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {testHistory.map((test) => (
                    <tr key={test.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Clock size={14}/>
                             </div>
                             <span className="text-xs font-bold text-white/80">{test.timestamp}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-sm font-black text-white italic">{test.downloadMbps.toFixed(1)} <span className="text-[10px] font-medium text-white/20 not-italic ml-1">Mbps</span></td>
                       <td className="px-8 py-5 text-sm font-black text-white/60 italic">{test.uploadMbps.toFixed(1)} <span className="text-[10px] font-medium text-white/10 not-italic ml-1">Mbps</span></td>
                       <td className="px-8 py-5">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-white/70">{test.pingMs} ms</span>
                             <span className="text-[9px] font-black text-white/20 uppercase">Jitter: {test.jitterMs}ms</span>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-xs font-bold text-rose-400/60">{test.packetLoss}% Loss</td>
                       <td className="px-8 py-5 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                             test.downloadMbps > 30 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                             {test.downloadMbps > 30 ? 'Optimal' : 'Standard'}
                          </span>
                       </td>
                    </tr>
                  ))}
                  {testHistory.length === 0 && (
                    <tr>
                       <td colSpan={6} className="px-8 py-20 text-center">
                          <Activity size={40} className="mx-auto mb-4 text-white/5" />
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No diagnostic data in local registry</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* Warning/Guide Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-600/5 p-8 rounded-[2.5rem] border border-blue-500/10">
         <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
               <Zap size={24} />
            </div>
            <div>
               <h4 className="text-white font-bold mb-1">Optimizing Your Test</h4>
               <p className="text-white/40 text-xs leading-relaxed">For the most accurate diagnostic result, disconnect from VPNs and ensure no high-bandwidth background downloads are active.</p>
            </div>
         </div>
         <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
               <AlertTriangle size={24} />
            </div>
            <div>
               <h4 className="text-white font-bold mb-1">Environmental Factors</h4>
               <p className="text-white/40 text-xs leading-relaxed">WiFi interference and distance from the router can significantly impact the 'Signal @ ONU' and 'Jitter' metrics.</p>
            </div>
         </div>
      </div>

    </div>
  );
};

export default SpeedTestPage;

