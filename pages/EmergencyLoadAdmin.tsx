
import React, { useMemo, useState, useEffect } from 'react';
import { AppState, EmergencyLoad, Role } from '../types';
import { db } from '../db';
import { 
  ShieldAlert, Zap, History, UserCircle, Search, Clock, 
  BadgeCheck, XCircle, AlertCircle, CheckCircle, Trash2,
  RefreshCw, Filter, DollarSign, Activity, TrendingUp, HandCoins,
  Pencil, Save, X, Layers, Box, Settings2, Calendar, ArrowUpRight
} from 'lucide-react';

const EmergencyLoadAdmin: React.FC<{ state: AppState }> = ({ state }) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Pending_Activation' | 'Overdue' | 'Settled'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLoad, setEditingLoad] = useState<EmergencyLoad | null>(null);
  
  // Extension State
  const [showExtensionModal, setShowExtensionModal] = useState<string | null>(null);
  const [extensionDays, setExtensionDays] = useState(3);
  const [extensionReason, setExtensionReason] = useState('Standard Technical Grace');

  useEffect(() => {
    db.auditOverdueLoads();
  }, []);

  const loads = useMemo(() => {
    let list = state.emergencyLoads || [];
    return list.filter(l => {
      const matchesSearch = l.userName.toLowerCase().includes(searchTerm.toLowerCase()) || l.userId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' || l.status === filter;
      return matchesSearch && matchesFilter;
    }).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.emergencyLoads, searchTerm, filter]);

  const handleUpdateLoad = async () => {
    if (!editingLoad) return;
    await db.updateEmergencyLoad(editingLoad.id, editingLoad);
    setEditingLoad(null);
    db.logNotification('all', 'info', 'Settings Updated', `Settings for ${editingLoad.userName} updated by admin.`);
  };

  const handleApplyExtension = async () => {
    if (!showExtensionModal) return;
    const res = await db.extendEmergencyLoad(showExtensionModal, extensionDays, extensionReason);
    if (res.success) {
      setShowExtensionModal(null);
      db.logNotification('all', 'success', 'Extension Granted', `EL deadline pushed by ${extensionDays} days.`);
    }
  };

  const handleClearManually = async (loadId: string) => {
    if (confirm("Confirm Manual Protocol Override? This will clear the debt entry from the subscriber's active status and apply a major credit penalty.")) {
       await db.clearEmergencyLoadManually(loadId);
       db.logNotification('all', 'warning', 'Force Clear', `Emergency debt for ${loadId} purged manually.`);
    }
  };

  const totals = useMemo(() => {
    return {
      active: loads.filter(l => l.status === 'Active' || l.status === 'Pending_Activation').reduce((a,b) => a + b.amount, 0),
      overdue: loads.filter(l => l.status === 'Overdue').reduce((a,b) => a + b.amount, 0),
      count: loads.filter(l => l.status !== 'Settled' && l.status !== 'Paid' && l.status !== 'Cancelled').length
    };
  }, [loads]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Zap className="text-orange-500" size={32} />
            Rescue Authority Grid
          </h2>
          <p className="text-slate-500 font-medium">Monitor advance credit requests and payment aging.</p>
        </div>
        <div className="flex bg-white px-8 py-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Market Exposure</p>
               <p className="text-2xl font-black text-orange-600 tabular-nums">Rs. {(totals.active + totals.overdue).toLocaleString()}</p>
            </div>
            <div className="w-px h-10 bg-slate-100"></div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Active Nodes</p>
               <p className="text-2xl font-black text-slate-900">{totals.count}</p>
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
             className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-black text-slate-900"
             placeholder="Search rescue queue by Name or ID..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {['All', 'Active', 'Pending_Activation', 'Overdue', 'Settled'].map((f: any) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[1200px]">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Provisioned Plan</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol State</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Registry</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit (Rs)</th>
                     <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loads.map(load => (
                    <tr key={load.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-all shadow-sm"><UserCircle size={24}/></div>
                            <div>
                               <p className="font-black text-slate-900 uppercase text-sm leading-none mb-1">{load.userName}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{load.userId}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="space-y-1">
                            <p className="text-xs font-black text-slate-700 uppercase italic">
                               {load.packageId ? state.packages.find(p => p.id === load.packageId)?.name : 'Balance Only'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                               <Layers size={10} className="text-blue-400"/> Handshake: {new Date(load.timestamp).toLocaleDateString()}
                            </p>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                           load.status === 'Settled' || load.status === 'Paid' ? 'bg-green-50 border-green-100 text-green-600' : 
                           load.status === 'Overdue' ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 
                           load.status === 'Pending_Activation' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                           'bg-orange-50 border-orange-100 text-orange-600'
                         }`}>
                            <Activity size={10} className={load.status === 'Active' ? 'animate-pulse' : ''} />
                            {load.status.replace('_', ' ')}
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="space-y-1">
                            <p className="text-xs font-black text-slate-800 uppercase italic">{new Date(load.expiryTimestamp).toLocaleDateString()}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Threshold Node</p>
                         </div>
                      </td>
                      <td className="px-8 py-5 font-black text-slate-900 text-right">Rs. {load.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex justify-end gap-1.5 pr-6">
                            <button 
                              onClick={() => setShowExtensionModal(load.id)}
                              title="Push Expiry Registry"
                              className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                            >
                               <Calendar size={16}/>
                            </button>
                            <button 
                              onClick={() => setEditingLoad({...load})}
                              title="Edit User"
                              className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                            >
                               <Pencil size={16}/>
                            </button>
                            <button 
                              onClick={() => handleClearManually(load.id)}
                              title="Purge Debt Registry"
                              className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            >
                               <Trash2 size={16}/>
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Extension Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl overflow-hidden border-[8px] border-slate-50">
              <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <Clock size={28} />
                    <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Push Expiry</h3>
                 </div>
                 <button onClick={() => setShowExtensionModal(null)} className="p-2 hover:bg-white/10 rounded-xl"><X size={24}/></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Extension Tier (Days)</label>
                    <div className="grid grid-cols-4 gap-2">
                       {[1, 3, 5, 7].map(d => (
                         <button 
                           key={d} 
                           onClick={() => setExtensionDays(d)}
                           className={`py-3 rounded-xl border-2 font-black text-sm transition-all ${extensionDays === d ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                         >
                            {d}d
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Logic Reason</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs h-24 resize-none outline-none focus:border-blue-600 transition-all uppercase"
                      value={extensionReason}
                      onChange={e => setExtensionReason(e.target.value)}
                    />
                 </div>
                 <button 
                  onClick={handleApplyExtension}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    <RefreshCw size={18}/> Authorize Registry Push
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Load Modal (Legacy logic kept but updated UI) */}
      {editingLoad && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1100] flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50">
              <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Settings2 size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Modify Rescue Node</h3>
                       <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-1">{editingLoad.userName}</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingLoad(null)} className="p-2 hover:bg-white/10 rounded-xl"><X size={28}/></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Advance Credit Override (Rs)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-lg" value={editingLoad.amount} onChange={e => setEditingLoad({...editingLoad, amount: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Registry State Transformation</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase" value={editingLoad.status} onChange={e => setEditingLoad({...editingLoad, status: e.target.value as any})}>
                       <option value="Pending_Activation">SYNCING (15m Lock)</option>
                       <option value="Active">ACTIVE LINK</option>
                       <option value="Overdue">DEFAULT RISK</option>
                       <option value="Settled">SETTLED LEDGER</option>
                    </select>
                 </div>
                 <button onClick={handleUpdateLoad} className="w-full py-5 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                    <Save size={18}/> Save Changes
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyLoadAdmin;

