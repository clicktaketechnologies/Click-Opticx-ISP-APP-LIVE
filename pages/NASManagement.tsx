import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useState } from 'react';
import { 
   Server, ShieldCheck, Activity, RefreshCw, Plus, X, Pencil, Trash2, 
   Cpu, Wifi, Network, Globe, AlertTriangle, CheckCircle, Search, 
   ChevronRight, Zap, Info, DatabaseZap, HardDrive
} from 'lucide-react';
import { AppState, NASConfig, UserStatus } from '../types';
import { db } from '../db';
import Modal from '../components/shared/Modal';

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

   const filteredNodes = state.nas.filter(n => 
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
         status === 'Online' ? 'bg-green-100 text-green-600' : 
         status === 'Offline' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
      }`}>
         <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            status === 'Online' ? 'bg-green-500' : status === 'Offline' ? 'bg-rose-500' : 'bg-slate-400'
         }`}></div>
         {status}
      </span>
   );

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
                  <Server size={32} />
               </div>
               <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Cloud NAS Control</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                     <Globe size={12} className="text-blue-500" /> Radius Gateway Integration Active
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                     type="text" 
                     placeholder="Search Routers..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full md:w-64 font-bold text-sm focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
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
               { label: 'Total Nodes', value: state.nas.length, icon: Server, color: 'indigo' },
               { label: 'Active Sessions', value: state.users.filter(u => u.status === UserStatus.ACTIVE).length, icon: Activity, color: 'emerald' },
               { label: 'Cloud Gateway', value: 'Online', icon: Globe, color: 'blue' },
               { label: 'Radius Load', value: `${state.nas.reduce((acc, n) => acc + db.calculateNASLoad(n.id), 0) / (state.nas.length || 1)}%`, icon: Cpu, color: 'amber' }
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

         {/* Users GRID */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredNodes.map(nas => (
               <div key={nas.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 transition-all">
                  <div className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
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

                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">IP Address</p>
                           <p className="text-sm font-black text-slate-700">{nas.ip}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">API Port</p>
                           <p className="text-sm font-black text-slate-700">{nas.apiPort} <span className="text-[10px] text-slate-300 font-normal ml-1">/ {nas.type}</span></p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hardware</p>
                           <p className="text-sm font-black text-slate-700">{nas.hardwareModel?.replace('_', ' ') || 'GENERIC'}</p>
                        </div>
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                           <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Load %</p>
                           <p className="text-sm font-black text-blue-600">{db.calculateNASLoad(nas.id)}%</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        <button 
                           onClick={() => startHealthCheck(nas)}
                           className="flex-1 py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
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
                           <DatabaseZap size={12} className="text-blue-500" />
                           <span className="text-[9px] font-black uppercase text-slate-500">API: {nas.apiUsername}</span>
                        </div>
                     </div>
                     <ChevronRight size={14} className="text-slate-300" />
                  </div>
               </div>
            ))}
         </div>

         {/* ADD/EDIT MODAL */}
         <Modal
            isOpen={isAddModal || isEditModal}
            onClose={() => {setIsAddModal(false); setIsEditModal(false);}}
            title={isEditModal ? 'Update Router Node' : 'Register New NAS'}
            type="form"
            message="Final Architecture Cloud Node"
            icon={<Server size={28} className="text-blue-500" />}
            confirmLabel={isEditModal ? 'Update Node' : 'Register NAS'}
            onConfirm={isEditModal ? handleUpdate : handleAdd}
            maxWidth="max-w-2xl"
         >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Router Name</label>
                  <input type="text" placeholder="e.g. Tower A" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-400" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">IP Address</label>
                  <input type="text" placeholder="0.0.0.0" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-400" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Radius Secret</label>
                  <input type="password" value={formData.secret} onChange={e => setFormData({...formData, secret: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-400" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hardware Model</label>
                  <select 
                     value={formData.hardwareModel} 
                     onChange={e => setFormData({...formData, hardwareModel: e.target.value as any, maxCapacity: e.target.value === 'OLT_1PON' ? 64 : (e.target.value === 'MIKROTIK_HEX_GR3' ? 200 : 250)})} 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900"
                  >
                     <option value="GENERIC">Generic Router</option>
                     <option value="MIKROTIK_HEX_GR3">MikroTik hEX (gr3)</option>
                     <option value="OLT_1PON">OLT (1-PON Branch)</option>
                     <option value="MIKROTIK_OTHER">Other MikroTik</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Admin Username</label>
                  <input type="text" value={formData.apiUsername} onChange={e => setFormData({...formData, apiUsername: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API Admin Password</label>
                  <input type="password" value={formData.apiPassword} onChange={e => setFormData({...formData, apiPassword: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hotspot Portal URL</label>
                  <div className="flex gap-2">
                     <select 
                        value={formData.hotspotUrlMode} 
                        onChange={e => setFormData({...formData, hotspotUrlMode: e.target.value as any})}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900"
                     >
                        <option value="IP">IP Link</option>
                        <option value="DOMAIN">Custom Domain</option>
                     </select>
                     <input 
                        type="text" 
                        placeholder={formData.hotspotUrlMode === 'IP' ? `http://${formData.ip}/login` : 'hotspot.yourisp.com'} 
                        value={formData.customHotspotUrl} 
                        onChange={e => setFormData({...formData, customHotspotUrl: e.target.value})} 
                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900" 
                     />
                  </div>
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
                        <div className={`w-12 h-6 rounded-full transition-colors ${formData.coaEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.coaEnabled ? 'translate-x-6' : ''}`}></div>
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Enable CoA Disconnect</span>
                  </label>
               </div>
            </div>
         </Modal>

         {/* HEALTH CHECK MODAL */}
         <Modal
            isOpen={isHealthCheckModal}
            onClose={() => setIsHealthCheckModal(false)}
            title={isChecking ? 'Analyzing Node' : healthCheckResult?.status === 'Online' ? 'Device Online' : 'Connection Failed'}
            type={isChecking ? 'info' : healthCheckResult?.status === 'Online' ? 'success' : 'danger'}
            message={isChecking ? `Contacting Router ${healthCheckResult?.name || ''}...` : `Remote Router Presence ${healthCheckResult?.status === 'Online' ? 'Confirmed' : 'Unreachable'}`}
            icon={
               isChecking ? <Mini5GMicroLoader size={48} /> : 
               healthCheckResult?.status === 'Online' ? <CheckCircle size={48} className="animate-bounce-slow text-green-500" /> : <AlertTriangle size={48} className="text-rose-500" />
            }
            confirmLabel={isChecking ? 'CHECKING STATUS...' : 'Confirm Status'}
            onConfirm={() => setIsHealthCheckModal(false)}
            hideCloseButton={isChecking}
            disableConfirm={isChecking}
         >
            {!isChecking && (
               <div className="grid grid-cols-3 gap-3 pt-4">
                  {[
                     { name: 'RADIUS', s: healthCheckResult?.radius },
                     { name: 'API', s: healthCheckResult?.api },
                     { name: 'CoA', s: healthCheckResult?.coa }
                  ].map((node, i) => (
                     <div key={i} className="bg-slate-800/80 p-4 rounded-3xl border border-slate-700/50">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2">{node.name}</p>
                        <span className={`text-[9px] font-black italic uppercase flex items-center justify-center ${node.s === 'Connected' || node.s === 'Enabled' ? 'text-green-500' : 'text-rose-500'}`}>
                           {node.s}
                        </span>
                     </div>
                  ))}
               </div>
            )}
         </Modal>
      </div>
   );
};

export default NASManagement;


