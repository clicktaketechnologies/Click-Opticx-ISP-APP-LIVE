
import React, { useState, useMemo } from 'react';
import { AppState, ISPUser, CreditScoreLog, Role } from '../types';
import { db } from '../db';
import { 
  BarChart3, Search, UserCircle, ShieldCheck, ShieldAlert, History, 
  RefreshCw, TrendingUp, TrendingDown, ArrowRight, X, Save, Shield, Lock, AlertTriangle 
} from 'lucide-react';

const CreditScoreAdmin: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ISPUser | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredUsers = useMemo(() => {
    return state.users.filter(u => 
      !u.deleted && 
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.connectionId.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.creditScore - b.creditScore); // Lowest score first for priority auditing
  }, [state.users, searchTerm]);

  const selectedUserLogs = useMemo(() => {
    if (!selectedUser) return [];
    return state.creditLogs
      .filter(l => l.userId === selectedUser.id)
      .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.creditLogs, selectedUser]);

  const getScoreRange = (score: number) => {
    if (score >= 750) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score >= 600) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 450) return { label: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const handleAdjust = async () => {
    if (!selectedUser || !reason || delta === 0) return;
    setIsSaving(true);
    await db.adjustScoreManually(selectedUser.id, delta, reason, state.currentUser?.email || 'Admin');
    setIsSaving(false);
    setIsAdjustModalOpen(false);
    setDelta(0);
    setReason('');
    setSelectedUser(state.users.find(u => u.id === selectedUser.id) || null);
  };

  const handleReset = async () => {
    if (!selectedUser || state.currentUser?.role !== Role.SUPER_ADMIN) return;
    if (confirm(`CRITICAL OVERRIDE: Reset ${selectedUser.name}'s credit score to 600 (System Default)?`)) {
      await db.resetScoreManually(selectedUser.id, state.currentUser.email);
      setSelectedUser(state.users.find(u => u.id === selectedUser.id) || null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <BarChart3 className="text-indigo-600" size={32} />
            Fiscal Risk Audit
          </h2>
          <p className="text-slate-500 font-medium">Monitoring subscriber behavior, automated credit scoring, and emergency load eligibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* User List */}
         <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-900"
                    placeholder="Audit identity scores..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
               <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber Registry</h3>
                  <span className="text-[9px] font-black text-slate-500 uppercase">Sort: Risk High to Low</span>
               </div>
               <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
                  {filteredUsers.map(u => {
                    const range = getScoreRange(u.creditScore);
                    const isActive = selectedUser?.id === u.id;
                    return (
                      <button 
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`w-full p-6 flex items-center justify-between transition-all group ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${isActive ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                               <UserCircle size={24} />
                            </div>
                            <div className="text-left">
                               <p className="font-black uppercase tracking-tight text-sm truncate w-32">{u.name}</p>
                               <p className={`text-[10px] font-bold uppercase ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{u.connectionId}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={`text-xl font-black italic tracking-tighter ${isActive ? 'text-white' : range.color}`}>{u.creditScore}</p>
                            <p className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-300' : 'text-slate-400'}`}>{range.label}</p>
                         </div>
                      </button>
                    );
                  })}
               </div>
            </div>
         </div>

         {/* Audit Detail */}
         <div className="xl:col-span-2 space-y-6">
            {!selectedUser ? (
              <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20">
                 <ShieldCheck className="text-slate-100 mb-8" size={80} />
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Select an identity to audit</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mt-2 leading-relaxed">
                    View detailed behavioral logs, adjust fiscal health scores, and enforce risk protocol overrides.
                 </p>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                 <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                       <div className="space-y-6 flex-1">
                          <div className="flex items-center gap-4">
                             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5"><ShieldCheck size={32} className="text-indigo-400" /></div>
                             <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter italic">{selectedUser.name}</h3>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.4em]">{selectedUser.connectionId}</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Registry Score</p>
                                <div className="flex items-end gap-3">
                                   <span className="text-5xl font-black italic tracking-tighter text-emerald-400">{selectedUser.creditScore}</span>
                                   <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${getScoreRange(selectedUser.creditScore).color}`}>{getScoreRange(selectedUser.creditScore).label}</span>
                                </div>
                             </div>
                             <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col justify-center items-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">EL Protocol Access</p>
                                {selectedUser.creditScore >= 600 ? (
                                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
                                     <Shield size={14} /> <span className="text-[10px] font-black uppercase">AUTHORIZED</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20 animate-pulse">
                                     <Lock size={14} /> <span className="text-[10px] font-black uppercase">BLOCKED</span>
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col gap-3 shrink-0">
                          <button 
                            onClick={() => setIsAdjustModalOpen(true)}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20"
                          >
                             Manual Adjustment
                          </button>
                          {state.currentUser?.role === Role.SUPER_ADMIN && (
                            <button 
                              onClick={handleReset}
                              className="px-8 py-4 bg-slate-800 hover:bg-white hover:text-slate-900 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-700"
                            >
                               Reset to Default
                            </button>
                          )}
                       </div>
                    </div>
                    <BarChart3 className="absolute -right-12 -bottom-12 opacity-5 scale-[3]" size={200} />
                 </div>

                 {/* History Table */}
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <History size={20} className="text-indigo-600" />
                          <h3 className="text-sm font-black uppercase tracking-widest italic">Fiscal Behavior Log</h3>
                       </div>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedUserLogs.length} Events Logged</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] custom-scrollbar">
                       {selectedUserLogs.map(log => (
                         <div key={log.id} className="p-8 flex items-start justify-between gap-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start gap-6">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border ${log.delta >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                  {log.delta >= 0 ? <TrendingUp size={24}/> : <TrendingDown size={24}/>}
                               </div>
                               <div>
                                  <div className="flex items-center gap-3 mb-1">
                                     <span className={`text-[10px] font-black uppercase tracking-widest ${log.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {log.delta >= 0 ? 'Positive Impact' : 'Negative Impact'}
                                     </span>
                                     <span className="text-[10px] text-slate-300">•</span>
                                     <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                                  </div>
                                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{log.reason}</h4>
                                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">Source: {log.source} {log.adminEmail ? `(${log.adminEmail})` : ''}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className={`text-2xl font-black italic tracking-tighter ${log.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {log.delta >= 0 ? '+' : ''}{log.delta}
                               </p>
                               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Score: {log.newScore}</p>
                            </div>
                         </div>
                       ))}
                       {selectedUserLogs.length === 0 && (
                         <div className="p-20 text-center text-slate-300 italic font-black uppercase text-[10px] tracking-widest">No credit behavioral logs found for this identity.</div>
                       )}
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Manual Adjustment Modal */}
      {isAdjustModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-white/20 flex flex-col">
              <div className="px-10 py-8 bg-indigo-600 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Risk Adjustment</h3>
                    <p className="text-indigo-100 text-[10px] font-bold uppercase mt-1 tracking-widest">Target: {selectedUser.name}</p>
                 </div>
                 <button onClick={() => setIsAdjustModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-indigo-100 hover:text-white"><X size={28} /></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Score Delta (Add or Subtract)</label>
                    <div className="flex items-center gap-6">
                       <input 
                        type="number" 
                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-5xl outline-none focus:border-indigo-500 transition-all text-slate-900 shadow-inner text-center"
                        value={delta}
                        onChange={e => setDelta(Number(e.target.value))}
                      />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mandatory Override Reason</label>
                    <textarea 
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 h-32 resize-none uppercase"
                      placeholder="Audit justification protocol..."
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                 </div>

                 <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4 shadow-inner">
                    <AlertTriangle className="text-amber-600 mt-1 shrink-0" size={24} />
                    <p className="text-[10px] text-amber-900 font-bold uppercase leading-relaxed">
                       Manual score adjustments directly bypass the automated logic engine. All overrides are permanent and logged for supervisory audit.
                    </p>
                 </div>

                 <button 
                  onClick={handleAdjust}
                  disabled={!reason || delta === 0 || isSaving}
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-[2rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 uppercase tracking-[0.3em] text-xs active:scale-95 disabled:grayscale disabled:opacity-50"
                 >
                    {isSaving ? 'Synchronizing...' : 'Authorize Adjustment'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CreditScoreAdmin;
