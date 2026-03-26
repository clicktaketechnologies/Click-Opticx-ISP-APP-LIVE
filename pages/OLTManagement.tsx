import React, { useState } from 'react';
import { 
   Cpu, Wifi, Network, Globe, Plus, X, Pencil, Trash2, 
   Activity, RefreshCw, AlertTriangle, CheckCircle, Search, 
   ChevronRight, Zap, Info, DatabaseZap, Monitor, HardDrive, Settings, Trash, Eye
} from 'lucide-react';
import { AppState, OLTConfig, ONU } from '../types';
import { db } from '../db';

const OLTManagement: React.FC<{ state: AppState }> = ({ state }) => {
   const [isAddModal, setIsAddModal] = useState(false);
   const [isEditModal, setIsEditModal] = useState(false);
   const [editingOLT, setEditingOLT] = useState<OLTConfig | null>(null);
   const [isHealthCheckModal, setIsHealthCheckModal] = useState(false);
   const [healthCheckResult, setHealthCheckResult] = useState<any>(null);
   const [isChecking, setIsChecking] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');
   const [activeTab, setActiveTab] = useState<'OLTs' | 'ONUs' | 'Discovery'>('OLTs');

   const [formData, setFormData] = useState<Partial<OLTConfig>>({
      name: '', ip: '', brand: 'Huawei', accessType: 'SSH', username: 'admin', password: '',
      port: 22, snmpCommunity: 'public', location: '', ponPorts: 8
   });

   const filteredOLTs = state.oltNodes.filter(n => 
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      n.ip.includes(searchTerm) || 
      n.location.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const handleAddOLT = async () => {
      await db.addOLT(formData);
      setIsAddModal(false);
      resetForm();
   };

   const handleUpdateOLT = async () => {
      if (!editingOLT) return;
      await db.updateOLT(editingOLT.id, formData);
      setIsEditModal(false);
      setEditingOLT(null);
      resetForm();
   };

   const resetForm = () => {
      setFormData({
         name: '', ip: '', brand: 'Huawei', accessType: 'SSH', username: 'admin', password: '',
         port: 22, snmpCommunity: 'public', location: '', ponPorts: 8
      });
   };

   const startHealthCheck = async (olt: OLTConfig) => {
      setIsChecking(true);
      setIsHealthCheckModal(true);
      const res = await db.checkOLTHealth(olt.id);
      setHealthCheckResult({ ...res, name: olt.name });
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

   const SignalBadge = ({ dbm }: { dbm: number }) => {
      const color = dbm > -25 ? 'text-emerald-500' : dbm > -28 ? 'text-amber-500' : 'text-rose-500';
      return (
         <span className={`font-black ${color}`}>
            {dbm} dBm
         </span>
      );
   };

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
                  <Monitor size={32} />
               </div>
               <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">OLT Management</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                     <Wifi size={12} className="text-blue-500" /> Infrastructure Access Hub
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                     type="text" 
                     placeholder="Search..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full md:w-64 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                  />
               </div>
               <button 
                  onClick={() => setIsAddModal(true)}
                  className="px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all"
               >
                  <Plus size={18} /> Add OLT
               </button>
            </div>
         </div>

         {/* NAVIGATION TABS */}
         <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl w-fit">
            {(['OLTs', 'ONUs', 'Discovery'] as const).map(tab => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                     activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
               >
                  {tab}
               </button>
            ))}
         </div>

         {activeTab === 'OLTs' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredOLTs.map(olt => (
                  <div key={olt.id} className="group bg-white rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1">
                     <div className="p-8">
                        <div className="flex items-start justify-between mb-8">
                           <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${olt.status === 'Online' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                 <Network size={28} />
                              </div>
                              <div>
                                 <h3 className="font-black text-slate-800 text-lg tracking-tight leading-none mb-1.5">{olt.name}</h3>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{olt.ip}</p>
                              </div>
                           </div>
                           <StatusBadge status={olt.status} />
                        </div>

                        <div className="space-y-4 mb-8">
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Brand</span>
                              <span className="text-xs font-black text-slate-700">{olt.brand}</span>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">PON Ports</span>
                              <span className="text-xs font-black text-slate-700">{olt.ponPorts} Active</span>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Location</span>
                              <span className="text-xs font-black text-slate-700 text-right">{olt.location}</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <button 
                              onClick={() => startHealthCheck(olt)}
                              className="flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                           >
                              <Zap size={16} /> Health
                           </button>
                           <div className="flex gap-2">
                              <button 
                                 onClick={() => {
                                    setEditingOLT(olt);
                                    setFormData(olt);
                                    setIsEditModal(true);
                                 }}
                                 className="flex-1 flex items-center justify-center bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                              >
                                 <Pencil size={18} />
                              </button>
                              <button 
                                 onClick={async () => {
                                    if (confirm('Delete this OLT?')) await db.deleteOLT(olt.id);
                                 }}
                                 className="flex-1 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          )}

         {activeTab === 'ONUs' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ONU Serial</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">OLT / Port</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {state.onus.map(onu => {
                        const olt = state.oltNodes.find(n => n.id === onu.oltId);
                        const user = state.users.find(u => u.id === onu.subscriberId);
                        return (
                           <tr key={onu.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-6">
                                 <div className="font-black text-slate-800 tracking-tight">{onu.serialNumber}</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{onu.model || 'GENERIC ONU'}</div>
                              </td>
                              <td className="p-6">
                                 <div className="text-xs font-black text-slate-700">{olt?.name || 'Unknown'}</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Port {onu.ponPort}</div>
                              </td>
                              <td className="p-6">
                                 {user ? (
                                    <div className="flex items-center gap-2">
                                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-black text-[10px] uppercase">
                                          {user.name.charAt(0)}
                                       </div>
                                       <div>
                                          <div className="text-xs font-black text-slate-800">{user.name}</div>
                                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.connectionId}</div>
                                       </div>
                                    </div>
                                 ) : (
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Unlinked</span>
                                 )}
                              </td>
                              <td className="p-6">
                                 <StatusBadge status={onu.status} />
                              </td>
                               <td className="p-6">
                                 <div className="flex flex-col">
                                    <SignalBadge dbm={onu.signalStrength} />
                                    {onu.opticalPower !== undefined && (
                                       <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                                          Power: {onu.opticalPower} dBm
                                       </div>
                                    )}
                                    {onu.onlineTime && (
                                       <div className="text-[9px] font-bold text-blue-400 uppercase">
                                          Uptime: {onu.onlineTime}
                                       </div>
                                    )}
                                 </div>
                              </td>
                               <td className="p-6">
                                 <div className="flex gap-2">
                                    <button 
                                       onClick={async () => {
                                          const btn = document.getElementById(`refresh-onu-${onu.id}`);
                                          btn?.classList.add('animate-spin');
                                          await db.getOnuStatus(onu.id);
                                          btn?.classList.remove('animate-spin');
                                       }}
                                       title="Refresh Status"
                                       className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                                    >
                                       <RefreshCw id={`refresh-onu-${onu.id}`} size={16} />
                                    </button>
                                    <button 
                                       onClick={() => {
                                          const newPass = prompt('Enter New WiFi/Admin Password:');
                                          if (newPass) db.resetOnuPassword(onu.id, newPass).then(res => alert(res.message));
                                       }}
                                       title="Reset Password"
                                       className="p-2 bg-slate-50 text-slate-400 hover:text-amber-500 rounded-lg transition-colors"
                                    >
                                       <Zap size={16} />
                                    </button>
                                    <button onClick={() => db.deleteONU(onu.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"><Trash size={16} /></button>
                                 </div>
                              </td>
                           </tr>
                        );
                     })}
                     {state.onus.length === 0 && (
                        <tr>
                           <td colSpan={6} className="p-20 text-center">
                              <div className="flex flex-col items-center gap-4">
                                 <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                                    <DatabaseZap size={40} />
                                 </div>
                                 <div className="text-sm font-black text-slate-300 uppercase tracking-widest">No ONUs Registered Yet</div>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         )}

         {activeTab === 'Discovery' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                     <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">ONU Auto-Discovery</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Scan PON ports for unconfigured hardware</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <select 
                        id="discovery-olt-select"
                        className="px-6 py-4 bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest outline-none border-none focus:ring-2 focus:ring-blue-500/10"
                     >
                        <option value="">Select OLT to Scan</option>
                        {state.oltNodes.map(olt => <option key={olt.id} value={olt.id}>{olt.name} ({olt.ip})</option>)}
                     </select>
                     <button 
                        onClick={async () => {
                           const oltId = (document.getElementById('discovery-olt-select') as HTMLSelectElement).value;
                           if (!oltId) return alert('Please select an OLT first');
                           const btn = document.getElementById('scan-btn');
                           btn?.classList.add('opacity-50', 'pointer-events-none');
                           const result = await db.discoverOnus(oltId);
                           btn?.classList.remove('opacity-50', 'pointer-events-none');
                           setHealthCheckResult({ ...result, discovery: true });
                           setIsHealthCheckModal(true);
                        }}
                        id="scan-btn"
                        className="px-8 py-4 bg-blue-600 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-200"
                     >
                        Start Scan
                     </button>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center">
                  <div className="flex flex-col items-center gap-6">
                     <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Cpu size={48} />
                     </div>
                     <div className="max-w-md">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Ready to Discover</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                           Select an OLT node above to initiate a real-time discovery sequence. 
                           The system will query for all unauthenticated ONUs across all PON ports.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ADD/EDIT MODAL */}
         {(isAddModal || isEditModal) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white/50">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                           <Plus size={24} />
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                           {isEditModal ? 'Update OLT Node' : 'Register New OLT'}
                        </h2>
                     </div>
                     <button onClick={() => { setIsAddModal(false); setIsEditModal(false); resetForm(); }} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-10 bg-white grid grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Name</label>
                        <input 
                           value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IP Address</label>
                        <input 
                           value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand</label>
                        <select 
                           value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value as any })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none capitalize"
                        >
                           {['Huawei', 'ZTE', 'BDCOM', 'VSOL', 'Raisecom', 'FiberHome'].map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location / Sector</label>
                        <input 
                           value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                        <input 
                           value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <input 
                           type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PON Port Count</label>
                        <input 
                           type="number" value={formData.ponPorts} onChange={e => setFormData({ ...formData, ponPorts: parseInt(e.target.value) })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SSH Port</label>
                        <input 
                           type="number" value={formData.port} onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                           className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                     </div>
                  </div>

                  <div className="px-10 py-8 bg-slate-50 flex items-center justify-end gap-3">
                     <button 
                        onClick={() => { setIsAddModal(false); setIsEditModal(false); resetForm(); }}
                        className="px-8 py-4 bg-white text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={isEditModal ? handleUpdateOLT : handleAddOLT}
                        className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                     >
                        {isEditModal ? 'Save Changes' : 'Confirm Registration'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* HEALTH CHECK / DISCOVERY MODAL */}
         {isHealthCheckModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white/50">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${healthCheckResult?.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                           {healthCheckResult?.discovery ? <Search size={24} /> : (healthCheckResult?.success ? <CheckCircle size={24} /> : <AlertTriangle size={24} />)}
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                           {healthCheckResult?.discovery ? 'Discovery Results' : 'Diagnostic Report'}
                        </h2>
                     </div>
                     <button onClick={() => setIsHealthCheckModal(false)} className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                     {isChecking ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-6">
                           <RefreshCw className="animate-spin text-blue-500" size={48} />
                           <div className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Interrogating OLT Hardware...</div>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</span>
                              <StatusBadge status={healthCheckResult?.status || (healthCheckResult?.success ? 'Online' : 'Offline')} />
                           </div>

                           {healthCheckResult?.discovery ? (
                              <div className="space-y-4">
                                 <div className="p-6 bg-slate-900 rounded-3xl text-white">
                                    <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                       <DatabaseZap className="text-blue-400" size={16} /> Raw Discovery Data
                                    </h3>
                                    <pre className="text-[10px] font-mono opacity-80 whitespace-pre-wrap break-all leading-relaxed h-48 overflow-y-auto pr-2 custom-scrollbar">
                                       {healthCheckResult.rawDiscovery || "Internal scanning complete. No unconfigured ONUs found responding to discovery packets."}
                                    </pre>
                                 </div>
                                 <div className="text-center p-4">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Parsing active... Found unregistered SNs will appear in the registry auto-add stream.</p>
                                 </div>
                              </div>
                           ) : (
                              <div className="space-y-4">
                                 <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Details</h3>
                                    <div className="flex justify-between">
                                       <span className="text-xs text-slate-600 font-bold">Node Identity</span>
                                       <span className="text-xs text-slate-900 font-black">{healthCheckResult?.name || 'Remote Link'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                       <span className="text-xs text-slate-600 font-bold">Latency Check</span>
                                       <span className="text-xs text-emerald-500 font-black">Success</span>
                                    </div>
                                 </div>
                                 {healthCheckResult?.error && (
                                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 italic">
                                       DEBUG: {healthCheckResult.error}
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  <div className="px-10 py-8 bg-slate-50 flex items-center justify-end">
                     <button 
                        onClick={() => setIsHealthCheckModal(false)}
                        className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                     >
                        Dissolve Report
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default OLTManagement;
