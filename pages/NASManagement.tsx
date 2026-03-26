import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useState } from 'react';
import { 
   Server, ShieldCheck, Activity, RefreshCw, Plus, X, Pencil, Trash2, 
   Cpu, Wifi, Network, Globe, AlertTriangle, CheckCircle, Search, 
   ChevronRight, Zap, Info, DatabaseZap, HardDrive
} from 'lucide-react';
import { AppState, NASConfig } from '../types';
import { db } from '../db';

const NASManagement: React.FC<{ state: AppState }> = ({ state }) => {
   const [isAddModal, setIsAddModal] = useState(false);
   const [isEditModal, setIsEditModal] = useState(false);
   const [editingNAS, setEditingNAS] = useState<NASConfig | null>(null);
   const [isHealthCheckModal, setIsHealthCheckModal] = useState(false);
   const [healthCheckResult, setHealthCheckResult] = useState<any>(null);
   const [isChecking, setIsChecking] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');

   const [formData, setFormData] = useState<Partial<NASConfig>>({
      name: '', ip: '', secret: '', type: 'MikroTik', apiUsername: '', apiPassword: '',
      apiPort: 8728, coaEnabled: true, coaPort: 3799, location: ''
   });

   const filteredNodes = state.nasNodes.filter(n => 
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.ip.includes(searchTerm) || 
      n.location.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const handleAdd = async () => {
      await db.addNAS(formData);
      setIsAddModal(false);
      setFormData({ name: '', ip: '', secret: '', type: 'MikroTik', apiUsername: '', apiPassword: '', apiPort: 8728, coaEnabled: true, coaPort: 3799, location: '' });
   };

   const handleUpdate = async () => {
      if (!editingNAS) return;
      await db.updateNAS(editingNAS.id, formData);
      setIsEditModal(false);
      setEditingNAS(null);
   };

   const startHealthCheck = async (nas: NASConfig) => {
      setIsChecking(true);
      setIsHealthCheckModal(true);
      const res = await db.checkRouterHealth(nas.id);
      setHealthCheckResult({ ...res, name: nas.name });
      setIsChecking(false);
   };

   const StatusBadge = ({ status }: { status: string }) => (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
         status === 'Online' ? 'bg-emerald-100 text-emerald-600' : 
         status === 'Offline' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
      }`}>
         <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            status === 'Online' ? 'bg-emerald-500' : status === 'Offline' ? 'bg-rose-500' : 'bg-slate-400'
         }`}></div>
         {status}
      </span>
   );

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                  <Server size={32} />
               </div>
               <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Cloud NAS Control</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                     <Globe size={12} className="text-indigo-500" /> Radius Gateway Integration Active
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                     type="text" 
                     placeholder="Search Routers..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full md:w-64 font-bold text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                  />
               </div>
               <button 
                  onClick={() => setIsAddModal(true)}
                  className="px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"
               >
                  <Plus size={18} /> Add NAS
               </button>
            </div>
         </div>

         {/* STATS OVERVIEW */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
               { label: 'Total Nodes', value: state.nasNodes.length, icon: Server, color: 'indigo' },
               { label: 'Active Sessions', value: '1,242', icon: Activity, color: 'emerald' },
               { label: 'Cloud Gateway', value: 'Online', icon: Globe, color: 'blue' },
               { label: 'Radius Load', value: '14%', icon: Cpu, color: 'amber' }
            ].map((stat, i) => (
               <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                     <p className="text-xl font-black text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                     <stat.icon size={24} />
                  </div>
               </div>
            ))}
         </div>

         {/* NODES GRID */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredNodes.map(nas => (
               <div key={nas.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:border-indigo-200 transition-all">
                  <div className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                              <HardDrive size={28} />
                           </div>
                           <div>
                              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">{nas.name}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{nas.location}</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <StatusBadge status={nas.status} />
                           {nas.lastCheck && (
                              <p className="text-[8px] text-slate-300 font-black uppercase">Last Check: {new Date(nas.lastCheck).toLocaleTimeString()}</p>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">IP Address</p>
                           <p className="text-sm font-black text-slate-700">{nas.ip}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">API Port</p>
                           <p className="text-sm font-black text-slate-700">{nas.apiPort} <span className="text-[10px] text-slate-300 font-normal ml-1">/ {nas.type}</span></p>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        <button 
                           onClick={() => startHealthCheck(nas)}
                           className="flex-1 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                           <ShieldCheck size={16} /> Check Integrity
                        </button>
                        <button 
                           onClick={() => {
                              setEditingNAS(nas);
                              setFormData(nas);
                              setIsEditModal(true);
                           }}
                           className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                        >
                           <Pencil size={18} />
                        </button>
                        <button 
                           onClick={() => db.deleteNAS(nas.id)}
                           className="p-4 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </div>
                  
                  {/* BOTTOM INFO BAR */}
                  <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 opacity-60">
                           <Zap size={12} className="text-amber-500" />
                           <span className="text-[9px] font-black uppercase text-slate-500">CoA: {nas.coaEnabled ? 'ENABLED' : 'DISABLED'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-60">
                           <DatabaseZap size={12} className="text-indigo-500" />
                           <span className="text-[9px] font-black uppercase text-slate-500">API: {nas.apiUsername}</span>
                        </div>
                     </div>
                     <ChevronRight size={14} className="text-slate-300" />
                  </div>
               </div>
            ))}
         </div>

         {/* ADD/EDIT MODAL */}
         {(isAddModal || isEditModal) && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
               <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in flex flex-col max-h-[92vh]">
                  <header className="p-8 border-b bg-indigo-600 text-white flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><Server size={30} /></div>
                        <div>
                           <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                              {isEditModal ? 'Update Router Node' : 'Register New NAS'}
                           </h3>
                           <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">Final Architecture Cloud Node</p>
                        </div>
                     </div>
                     <button onClick={() => {setIsAddModal(false); setIsEditModal(false);}} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
                  </header>

                  <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Router Name</label>
                           <input type="text" placeholder="e.g. Tower A" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-300" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">IP Address</label>
                           <input type="text" placeholder="0.0.0.0" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-300" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Radius Secret</label>
                           <input type="password" value={formData.secret} onChange={e => setFormData({...formData, secret: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-300" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Radius CoA Port</label>
                           <input type="number" value={formData.coaPort} onChange={e => setFormData({...formData, coaPort: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Admin Username</label>
                           <input type="text" value={formData.apiUsername} onChange={e => setFormData({...formData, apiUsername: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Admin Password</label>
                           <input type="password" value={formData.apiPassword} onChange={e => setFormData({...formData, apiPassword: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Location</label>
                           <input type="text" placeholder="e.g. North Sector" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" />
                        </div>
                        <div className="space-y-1.5 flex items-center gap-4 h-full pt-6">
                           <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative">
                                 <input 
                                    type="checkbox" 
                                    checked={formData.coaEnabled} 
                                    onChange={e => setFormData({...formData, coaEnabled: e.target.checked})} 
                                    className="sr-only"
                                 />
                                 <div className={`w-12 h-6 rounded-full transition-colors ${formData.coaEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                 <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.coaEnabled ? 'translate-x-6' : ''}`}></div>
                              </div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Enable CoA Disconnect</span>
                           </label>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                     <button 
                        onClick={() => {setIsAddModal(false); setIsEditModal(false);}}
                        className="flex-1 py-5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={isEditModal ? handleUpdate : handleAdd}
                        className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-indigo-200/50 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                        {isEditModal ? <CheckCircle size={18} /> : <Plus size={18} />} 
                        {isEditModal ? 'Update Node' : 'Register NAS'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* HEALTH CHECK MODAL */}
         {isHealthCheckModal && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-500">
               <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl p-10 sm:p-12 text-center space-y-10 animate-in zoom-in border border-slate-100 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-2 ${isChecking ? 'bg-slate-100 overflow-hidden' : healthCheckResult?.status === 'Online' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-rose-500'}`}>
                     {isChecking && <div className="h-full bg-indigo-600 animate-loading-bar w-1/2"></div>}
                  </div>
                  
                  <div className="space-y-6">
                     <div className={`w-28 h-28 mx-auto rounded-[2.5rem] flex items-center justify-center shadow-inner border-4 border-white ${
                        isChecking ? 'bg-indigo-50 text-indigo-500' : 
                        healthCheckResult?.status === 'Online' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                     }`}>
                        {isChecking ? <Mini5GMicroLoader size={48} /> : 
                         healthCheckResult?.status === 'Online' ? <CheckCircle size={48} className="animate-bounce-slow" /> : <AlertTriangle size={48} />}
                     </div>
                     
                     <div className="space-y-3">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                           {isChecking ? 'Analyzing Node' : healthCheckResult?.status === 'Online' ? 'Node Integrity Verified' : 'Handshake Failed'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] px-8">
                           {isChecking ? `Contacting Router ${healthCheckResult?.name || ''}...` : `Remote Router Presence ${healthCheckResult?.status === 'Online' ? 'Confirmed' : 'Unreachable'}`}
                        </p>
                     </div>
                  </div>

                  {!isChecking && (
                     <div className="grid grid-cols-3 gap-3">
                        {[
                           { name: 'RADIUS', s: healthCheckResult?.radius },
                           { name: 'API', s: healthCheckResult?.api },
                           { name: 'CoA', s: healthCheckResult?.coa }
                        ].map((node, i) => (
                           <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-2">{node.name}</p>
                              <span className={`text-[9px] font-black italic uppercase ${node.s === 'Connected' || node.s === 'Enabled' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {node.s}
                              </span>
                           </div>
                        ))}
                     </div>
                  )}

                  <button 
                     onClick={() => setIsHealthCheckModal(false)}
                     disabled={isChecking}
                     className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
                  >
                     {isChecking ? <Plus className="animate-spin opacity-40" /> : <ShieldCheck size={18} />} 
                     {isChecking ? 'SECURE HANDSHAKE...' : 'Acknowledge Integrity'}
                  </button>
               </div>
            </div>
         )}
      </div>
   );
};

export default NASManagement;
