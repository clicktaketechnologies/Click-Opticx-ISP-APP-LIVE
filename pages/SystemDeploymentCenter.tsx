import React, { useState } from 'react';
import { AppState, SystemSnapshot, DeploymentLog } from '../types';
import { db } from '../db';
import { 
  ShieldCheck, History, DatabaseZap, RefreshCcw, 
  ChevronRight, ArrowDownLeft, Clock, Server,
  AlertCircle, ShieldAlert, Cpu, CheckCircle2,
  Lock, Save, Download
} from 'lucide-react';

interface Props {
  state: AppState;
}

const SystemDeploymentCenter: React.FC<Props> = ({ state }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapshotReason, setSnapshotReason] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  const handleManualSnapshot = async () => {
    if (!snapshotReason.trim()) return;
    setIsProcessing(true);
    const res = await db.createSystemSnapshot(snapshotReason);
    setIsProcessing(false);
    if (res.success) {
      setSnapshotReason('');
      alert('🔒 Secure system snapshot stored in the multi-cloud vault.');
    } else {
      alert('Error creating snapshot: ' + res.message);
    }
  };

  const handleRestore = async (snapId: string) => {
    setIsProcessing(true);
    const res = await db.restoreSystemSnapshot(snapId);
    setIsProcessing(false);
    if (res.success) {
      setShowRestoreConfirm(null);
      alert('✅ PROPOSAL SUCCESS: System rolled back to target state.');
      window.location.reload();
    } else {
      alert('Restore failed: ' + res.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={32} />
            System Governance & Deployment
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
            Infrastructure Layer v{state.systemVersion} • Data Safety Protocol Active
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Build {state.systemVersion} - Optimized</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500"
            title="Refresh Environment"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Version Status */}
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 shadow-sm">
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Core Environment</p>
                <h2 className="text-xl font-black text-slate-900">Current Build Status</h2>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Cpu className="text-slate-400" size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Build Number</p>
                  <p className="text-lg font-black text-slate-900">#{state.systemVersion}</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-lg font-black text-green-600 flex items-center gap-2">
                    Stable <CheckCircle2 size={16} />
                  </p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">DB Schema</p>
                  <p className="text-lg font-black text-slate-900">v1.16</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Migrations</p>
                  <p className="text-lg font-black text-slate-900">Active</p>
               </div>
            </div>
          </div>

          {/* Secure Backup & Snapshot */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <DatabaseZap size={120} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-3 bg-white/10 rounded-2xl">
                      <Save className="text-blue-400" size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black">Secure System Snapshot</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pre-deployment Data Archiving</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex items-center gap-2">
                      <input 
                        className="flex-1 bg-transparent border-none text-white p-3 font-bold text-sm outline-none placeholder:text-slate-600"
                        placeholder="Purpose of snapshot (e.g. Before Cloud Integration)..."
                        value={snapshotReason}
                        onChange={e => setSnapshotReason(e.target.value)}
                        disabled={isProcessing}
                      />
                      <button 
                        onClick={handleManualSnapshot}
                        disabled={isProcessing || !snapshotReason.trim()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                      >
                        {isProcessing ? 'Snapshotting...' : 'Create Snapshot'}
                      </button>
                   </div>
                   <p className="text-[10px] text-slate-500 font-medium italic">
                     * Snapshots capture the entire system state (Users, Billing, Logs) and store it in a dedicated Firestore vault.
                   </p>
                </div>
             </div>
          </div>

          {/* Deployment Activity Logs */}
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-sm">
             <div className="p-8 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <History size={20} className="text-slate-400" />
                  Deployment Registry
                </h3>
             </div>
             <div className="divide-y divide-slate-100">
                {state.deploymentLogs && state.deploymentLogs.length > 0 ? (
                  state.deploymentLogs.map(log => (
                    <div key={log.id} className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.status === 'Success' ? 'bg-green-50 text-green-600' : (log.status === 'Rollback' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}`}>
                             {log.status === 'Success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Build {log.fromBuild} → {log.toBuild}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{log.status}</span>
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                               {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString()} • {log.migrationsRun.length} Migrations Applied
                             </p>
                          </div>
                       </div>
                       <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400">
                     <Clock className="mx-auto mb-3 opacity-20" size={48} />
                     <p className="text-xs font-black uppercase tracking-widest">No deployment history found</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Health Stats */}
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Environment Health</h4>
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Server size={16} /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-900 uppercase">Production Status</p>
                         <p className="text-[9px] font-bold text-slate-400">Stable Connection</p>
                      </div>
                   </div>
                   <div className="text-emerald-500 font-black text-xs uppercase">100%</div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Download size={16} /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-900 uppercase">Cloud Sync Latency</p>
                         <p className="text-[9px] font-bold text-slate-400">Firestore Master</p>
                      </div>
                   </div>
                   <div className="text-blue-500 font-black text-xs uppercase">24ms</div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Lock size={16} /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-900 uppercase">Lockdown Status</p>
                         <p className="text-[9px] font-bold text-slate-400">Write Protection</p>
                      </div>
                   </div>
                   <div className="text-amber-500 font-black text-xs uppercase">OFF</div>
                </div>
             </div>
          </div>

          {/* Manual Snapshots / Restore Points */}
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-sm">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Restore Points</h4>
             </div>
             <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {state.systemSnapshots && state.systemSnapshots.length > 0 ? (
                  state.systemSnapshots.map(snap => (
                    <div key={snap.id} className="p-4 hover:bg-slate-50 transition-all flex items-start justify-between gap-3">
                       <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${snap.label.startsWith('AUTO') ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                             <ArrowDownLeft size={16} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{snap.label}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 leading-tight">{snap.reason}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase mt-1">{new Date(snap.timestamp).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setShowRestoreConfirm(snap.id)}
                         className="p-2 bg-slate-100 hover:bg-amber-100 hover:text-amber-600 text-slate-400 rounded-lg transition-all"
                         title="Restore this Snapshot"
                       >
                          <RefreshCcw size={14} />
                       </button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 italic text-[10px]">
                     No snapshots available
                  </div>
                )}
             </div>
          </div>

          {/* Security Alert */}
          <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] space-y-3">
             <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">Data Safety Protocol</p>
             </div>
             <p className="text-[9px] font-bold text-rose-500 leading-relaxed uppercase italic">
               Destructive migrations are disabled by default. System updates only allow schema extensions. No existing billing or user records can be deleted by code deployments.
             </p>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal Shorthand */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl animate-premium">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <RefreshCcw size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-2">Emergency Rollback?</h3>
              <p className="text-sm font-bold text-slate-500 text-center uppercase tracking-widest leading-relaxed mb-8">
                This will overwrite the CURRENT system state with data from <span className="text-amber-600">{showRestoreConfirm}</span>.
                <br /><br />
                <span className="text-rose-600 italic">Warning: Progress since this snapshot will be reverted.</span>
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setShowRestoreConfirm(null)}
                   className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={() => handleRestore(showRestoreConfirm)}
                    disabled={isProcessing}
                    className="py-4 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-600/20 hover:bg-amber-500 active:scale-95 transition-all"
                 >
                    {isProcessing ? 'Restoring...' : 'Confim Restore'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SystemDeploymentCenter;
