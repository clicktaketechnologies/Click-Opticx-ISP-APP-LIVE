import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useState } from 'react';
import { 
   Server, ShieldCheck, Activity, Plus, Pencil, Trash2, Eye, EyeOff,
   Cpu, Globe, AlertTriangle, CheckCircle, Search,
   ChevronRight, Zap, DatabaseZap, HardDrive, ToggleLeft, ToggleRight,
   Network, Info, Wifi
} from 'lucide-react';
import { AppState, NASConfig, UserStatus } from '../types';
import { db } from '../db';
import Modal from '../components/shared/Modal';

const FIELD_GUIDE = [
  { num: 1, label: 'NAS IP', key: 'ip', hint: 'Insert NAS/Router IP address here without any block.', placeholder: '192.168.0.100', type: 'text' },
  { num: 2, label: 'NAS Name', key: 'name', hint: 'Give a name to your router so that it will be easy to identify later in the system.', placeholder: 'Tower A Router', type: 'text' },
  { num: 3, label: 'Radius Secret', key: 'radiusSecret', hint: 'Insert your radius secret here — it is like a password. Insert this same secret in your router radius section.', placeholder: 'radius_secret_key', type: 'password' },
  { num: 5, label: 'NAS Username', key: 'apiUsername', hint: 'Insert your router username. Make sure this user has permission on router API.', placeholder: 'admin', type: 'text' },
  { num: 6, label: 'NAS Password', key: 'apiPassword', hint: 'Insert your router password.', placeholder: '••••••••', type: 'password' },
  { num: 7, label: 'API Port', key: 'apiPort', hint: 'Insert API Port. Default MikroTik API port is 8728.', placeholder: '8728', type: 'number' },
  { num: 8, label: 'Incoming Port', key: 'coaPort', hint: 'Insert Incoming (CoA) Port. Used for disconnect/re-auth commands from server to router.', placeholder: '3799', type: 'number' },
];

const DEFAULT_FORM: Partial<NASConfig> = {
  name: '', ip: '', radiusSecret: '',
  apiEnabled: false,
  apiUsername: 'admin', apiPassword: '',
  apiPort: 8728, coaPort: 3799,
  coaEnabled: true,
  nasEnabled: true,
  hardwareModel: 'GENERIC',
  location: '',
  hotspotUrlMode: 'IP',
  authPort: 1812,
  accountingPort: 1813,
  maxCapacity: 200,
};

const NASManagement: React.FC<{ state: AppState }> = ({ state }) => {
   const [isAddModal, setIsAddModal]         = useState(false);
   const [isEditModal, setIsEditModal]       = useState(false);
   const [editingNAS, setEditingNAS]         = useState<NASConfig | null>(null);
   const [isHealthModal, setIsHealthModal]   = useState(false);
   const [healthResult, setHealthResult]     = useState<any>(null);
   const [isChecking, setIsChecking]         = useState(false);
   const [searchTerm, setSearchTerm]         = useState('');
   const [showPw, setShowPw]                 = useState(false);
   const [showSecret, setShowSecret]         = useState(false);
   const [formData, setFormData]             = useState<Partial<NASConfig>>(DEFAULT_FORM);

   const filteredNodes = state.nas.filter(n =>
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.ip.includes(searchTerm) ||
      (n.location || '').toLowerCase().includes(searchTerm.toLowerCase())
   );

   const set = (key: keyof NASConfig, val: any) => setFormData(f => ({ ...f, [key]: val }));

   const openAdd = () => { setFormData(DEFAULT_FORM); setIsAddModal(true); };
   const openEdit = (nas: NASConfig) => { setFormData(nas); setEditingNAS(nas); setIsEditModal(true); };
   const closeModal = () => { setIsAddModal(false); setIsEditModal(false); setEditingNAS(null); };

   const handleSave = async () => {
      if (isEditModal && editingNAS) {
         await db.updateNAS(editingNAS.id, formData);
      } else {
         await db.addNAS(formData);
      }
      closeModal();
   };

   const startHealthCheck = async (nas: NASConfig) => {
      setIsChecking(true);
      setHealthResult(null);
      setIsHealthModal(true);
      const res = await db.checkRouterHealth(nas.id);
      setHealthResult({ ...res, name: nas.name });
      setIsChecking(false);
   };

   const ToggleField = ({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
      <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
         <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
         >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-7' : ''}`} />
         </button>
         <div>
            <p className="text-sm font-black text-slate-900">{label}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">{hint}</p>
         </div>
         {checked ? <ToggleRight size={20} className="text-blue-500 ml-auto flex-shrink-0 mt-0.5" /> : <ToggleLeft size={20} className="text-slate-300 ml-auto flex-shrink-0 mt-0.5" />}
      </div>
   );

   const StatusDot = ({ status }: { status: string }) => (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
         status === 'Online' ? 'bg-green-100 text-green-700' :
         status === 'Offline' ? 'bg-rose-100 text-rose-700' :
         status === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
      }`}>
         <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            status === 'Online' ? 'bg-green-500' : status === 'Offline' ? 'bg-rose-500' : 'bg-amber-500'
         }`} />
         {status}
      </span>
   );

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

         {/* HEADER */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
                  <Server size={30} />
               </div>
               <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Router Settings</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                     <Globe size={12} className="text-blue-500" /> NAS / Radius Gateway Integration
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                     type="text"
                     placeholder="Search routers..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-500/10 outline-none w-56"
                  />
               </div>
               <button onClick={openAdd} className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all">
                  <Plus size={16} /> Add Router
               </button>
            </div>
         </div>

         {/* STATS */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
               { label: 'Total Routers', value: state.nas.length, icon: Server, color: 'blue' },
               { label: 'Online', value: state.nas.filter(n => n.status === 'Online').length, icon: CheckCircle, color: 'green' },
               { label: 'Active Users', value: state.users.filter(u => u.status === UserStatus.ACTIVE).length, icon: Activity, color: 'indigo' },
               { label: 'API Enabled', value: state.nas.filter(n => n.apiEnabled).length, icon: Zap, color: 'amber' },
            ].map((s, i) => (
               <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                     <p className="text-2xl font-black text-slate-900">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-${s.color}-50 text-${s.color}-500 flex items-center justify-center`}>
                     <s.icon size={22} />
                  </div>
               </div>
            ))}
         </div>

         {/* ROUTER CARDS */}
         {filteredNodes.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 flex flex-col items-center gap-4 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
                  <Server size={36} className="text-slate-300" />
               </div>
               <p className="text-xl font-black text-slate-900 uppercase italic">No Routers Configured</p>
               <p className="text-sm text-slate-400 font-medium max-w-sm">Add your first NAS/Router to enable RADIUS authentication and user disconnection via API.</p>
               <button onClick={openAdd} className="mt-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Plus size={14} /> Register First Router
               </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
               {filteredNodes.map(nas => (
                  <div key={nas.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
                     <div className="p-8">
                        {/* CARD HEADER */}
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                                 <HardDrive size={26} />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">{nas.name}</h3>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 font-mono">{nas.ip}</p>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-2">
                              <StatusDot status={nas.status} />
                              {nas.lastCheck && <p className="text-[8px] text-slate-300 font-black uppercase">Checked: {new Date(nas.lastCheck).toLocaleTimeString()}</p>}
                           </div>
                        </div>

                        {/* CONFIG GRID */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                           {[
                              { label: 'API Port', value: nas.apiPort },
                              { label: 'CoA Port', value: nas.coaPort },
                              { label: 'Auth Port', value: nas.authPort || 1812 },
                              { label: 'Acct Port', value: nas.accountingPort || 1813 },
                           ].map((f, i) => (
                              <div key={i} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{f.label}</p>
                                 <p className="text-sm font-black text-slate-800 font-mono">{f.value}</p>
                              </div>
                           ))}
                        </div>

                        {/* STATUS BADGES */}
                        <div className="flex flex-wrap gap-2 mb-6">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${nas.apiEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                              <Zap size={10} /> API {nas.apiEnabled ? 'ON' : 'OFF'}
                           </span>
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${nas.coaEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                              <Network size={10} /> CoA {nas.coaEnabled ? 'Enabled' : 'Disabled'}
                           </span>
                           <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                              <Cpu size={10} /> {nas.hardwareModel?.replace('_', ' ') || 'GENERIC'}
                           </span>
                           <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                              <DatabaseZap size={10} /> {nas.apiUsername}
                           </span>
                        </div>

                        {/* LOAD BAR */}
                        <div className="mb-6">
                           <div className="flex justify-between items-center mb-1.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Router Load</p>
                              <p className="text-[9px] font-black text-blue-600">{db.calculateNASLoad(nas.id)}%</p>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                 className={`h-full rounded-full transition-all ${db.calculateNASLoad(nas.id) > 80 ? 'bg-rose-500' : db.calculateNASLoad(nas.id) > 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                 style={{ width: `${db.calculateNASLoad(nas.id)}%` }}
                              />
                           </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-2">
                           <button onClick={() => startHealthCheck(nas)} className="flex-1 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                              <ShieldCheck size={14} /> Check Health
                           </button>
                           <button onClick={() => openEdit(nas)} className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-2xl transition-all">
                              <Pencil size={16} />
                           </button>
                           <button onClick={() => db.deleteNAS(nas.id)} className="p-3.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all">
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* ADD / EDIT MODAL */}
         <Modal
            isOpen={isAddModal || isEditModal}
            onClose={closeModal}
            title={isEditModal ? `Edit Router — ${editingNAS?.name}` : 'Register New Router / NAS'}
            type="form"
            message="Infrastructure → Router Settings"
            icon={<Server size={24} className="text-blue-500" />}
            confirmLabel={isEditModal ? 'Save Changes' : 'Register Router'}
            onConfirm={handleSave}
            maxWidth="max-w-2xl"
            scrollable
         >
            <div className="space-y-5 py-2">

               {/* INFO BANNER */}
               <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase tracking-wide">
                     Fill in all router details below. The Radius Secret must match exactly what is configured in your router's RADIUS client settings.
                  </p>
               </div>

               {/* === FIELD 1: NAS IP === */}
               <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">1</span>
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">NAS IP Address</label>
                  </div>
                  <input
                     type="text"
                     placeholder="192.168.0.100"
                     value={formData.ip || ''}
                     onChange={e => set('ip', e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-300"
                  />
                  <p className="text-[9px] text-slate-400 font-medium pl-1">Insert NAS/Router IP address here without any block. Example: 192.168.0.100</p>
               </div>

               {/* === FIELD 2: NAS NAME === */}
               <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">2</span>
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">NAS Name</label>
                  </div>
                  <input
                     type="text"
                     placeholder="e.g. Tower A Router"
                     value={formData.name || ''}
                     onChange={e => set('name', e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-300"
                  />
                  <p className="text-[9px] text-slate-400 font-medium pl-1">Give a name to your router so it will be easy to identify later in the system.</p>
               </div>

               {/* === FIELD 3: RADIUS SECRET === */}
               <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">3</span>
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Radius Secret</label>
                  </div>
                  <div className="relative">
                     <input
                        type={showSecret ? 'text' : 'password'}
                        placeholder="radius_shared_secret"
                        value={formData.radiusSecret || ''}
                        onChange={e => set('radiusSecret', e.target.value)}
                        className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-300"
                     />
                     <button type="button" onClick={() => setShowSecret(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium pl-1">Insert your radius secret — it is like a password. You must insert this same secret in your router radius section.</p>
               </div>

               {/* === FIELD 4: API ON/OFF === */}
               <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">4</span>
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">API Access</label>
                  </div>
                  <ToggleField
                     label="Enable Router API"
                     hint="You must enable API here if you want to see user graphs and use API-based user disconnection. Ensure API is also enabled on the router side."
                     checked={formData.apiEnabled ?? false}
                     onChange={v => set('apiEnabled', v)}
                  />
               </div>

               {/* === FIELDS 5 & 6: USERNAME / PASSWORD (shown when API is enabled) === */}
               <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 ${!formData.apiEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">5</span>
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">NAS Username</label>
                     </div>
                     <input
                        type="text"
                        placeholder="admin"
                        value={formData.apiUsername || ''}
                        onChange={e => set('apiUsername', e.target.value)}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-300"
                     />
                     <p className="text-[9px] text-slate-400 font-medium pl-1">Make sure this user has API permission on the router.</p>
                  </div>

                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">6</span>
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">NAS Password</label>
                     </div>
                     <div className="relative">
                        <input
                           type={showPw ? 'text' : 'password'}
                           placeholder="••••••••"
                           value={formData.apiPassword || ''}
                           onChange={e => set('apiPassword', e.target.value)}
                           className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-300"
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                           {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                     </div>
                     <p className="text-[9px] text-slate-400 font-medium pl-1">Insert your router API password.</p>
                  </div>
               </div>

               {/* === FIELDS 7 & 8: PORTS === */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">7</span>
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">API Port</label>
                     </div>
                     <input
                        type="number"
                        placeholder="8728"
                        value={formData.apiPort ?? 8728}
                        onChange={e => set('apiPort', Number(e.target.value))}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900"
                     />
                     <p className="text-[9px] text-slate-400 font-medium pl-1">Default MikroTik API port is 8728.</p>
                  </div>

                  <div className="space-y-1.5">
                     <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">8</span>
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Incoming Port (CoA)</label>
                     </div>
                     <input
                        type="number"
                        placeholder="3799"
                        value={formData.coaPort ?? 3799}
                        onChange={e => set('coaPort', Number(e.target.value))}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900"
                     />
                     <p className="text-[9px] text-slate-400 font-medium pl-1">Incoming CoA/Disconnect port. Default is 3799.</p>
                  </div>
               </div>

               {/* === ADVANCED: Hardware Model + Location === */}
               <div className="border-t border-slate-100 pt-5 space-y-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Advanced Settings</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hardware Model</label>
                        <select
                           value={formData.hardwareModel || 'GENERIC'}
                           onChange={e => set('hardwareModel', e.target.value as any)}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900"
                        >
                           <option value="GENERIC">Generic Router</option>
                           <option value="MIKROTIK_HEX_GR3">MikroTik hEX (gr3)</option>
                           <option value="MIKROTIK_OTHER">Other MikroTik</option>
                           <option value="OLT_1PON">OLT (1-PON Branch)</option>
                           <option value="OLT_OTHER">OLT (Other)</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Location / Site</label>
                        <input
                           type="text"
                           placeholder="e.g. Main Office, Tower A"
                           value={formData.location || ''}
                           onChange={e => set('location', e.target.value)}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 placeholder:text-slate-300"
                        />
                     </div>
                  </div>

                  {/* CoA Enable Toggle */}
                  <ToggleField
                     label="Enable CoA / Disconnect Commands"
                     hint="Allow server to send disconnect and re-authentication commands to this router when users are suspended or their package expires."
                     checked={formData.coaEnabled ?? true}
                     onChange={v => set('coaEnabled', v)}
                  />
               </div>

               {/* LIVE SUMMARY */}
               {(formData.ip || formData.apiPort) && (
                  <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Configuration Summary</p>
                     {[
                        { label: 'Router IP', val: formData.ip || '—' },
                        { label: 'API Endpoint', val: formData.apiEnabled ? `${formData.ip}:${formData.apiPort}` : 'API Disabled' },
                        { label: 'CoA Endpoint', val: formData.coaEnabled ? `${formData.ip}:${formData.coaPort}` : 'CoA Disabled' },
                        { label: 'Radius Auth', val: `${formData.ip}:${formData.authPort || 1812}` },
                     ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center">
                           <span className="text-[9px] font-bold text-slate-500 uppercase">{row.label}</span>
                           <span className="text-[10px] font-black text-white font-mono">{row.val}</span>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </Modal>

         {/* HEALTH CHECK MODAL */}
         <Modal
            isOpen={isHealthModal}
            onClose={() => setIsHealthModal(false)}
            title={isChecking ? 'Analyzing Router...' : healthResult?.status === 'Online' ? '✓ Router Online' : '✗ Connection Failed'}
            type={isChecking ? 'info' : healthResult?.status === 'Online' ? 'success' : 'danger'}
            message={isChecking ? `Contacting ${healthResult?.name || 'router'}...` : `Router ${healthResult?.status === 'Online' ? 'is reachable and responding' : 'is unreachable or misconfigured'}`}
            icon={isChecking ? <Mini5GMicroLoader size={48} /> : healthResult?.status === 'Online' ? <CheckCircle size={48} className="text-green-500" /> : <AlertTriangle size={48} className="text-rose-500" />}
            confirmLabel={isChecking ? 'Checking...' : 'Close'}
            onConfirm={() => setIsHealthModal(false)}
            hideCloseButton={isChecking}
         >
            {!isChecking && (
               <div className="grid grid-cols-3 gap-3 pt-4">
                  {[
                     { name: 'RADIUS', value: healthResult?.radius },
                     { name: 'API', value: healthResult?.api },
                     { name: 'CoA', value: healthResult?.coa },
                  ].map((node, i) => (
                     <div key={i} className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700/50 flex flex-col items-center gap-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{node.name}</p>
                        <span className={`text-[10px] font-black uppercase ${node.value === 'Connected' || node.value === 'Enabled' ? 'text-green-400' : 'text-rose-400'}`}>
                           {node.value || '—'}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${node.value === 'Connected' || node.value === 'Enabled' ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
                     </div>
                  ))}
               </div>
            )}
         </Modal>
      </div>
   );
};

export default NASManagement;
