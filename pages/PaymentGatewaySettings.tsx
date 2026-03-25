import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState, PaymentGateway, Role } from '../types';
import { db } from '../db';
import {
   CreditCard, ShieldCheck, Globe, Smartphone, Banknote,
   Settings2, RefreshCw, Save, X, Eye, EyeOff, Trash2,
   Landmark, Zap, ShieldAlert, CheckCircle, Info, ChevronRight,
   HelpCircle, AlertTriangle, ExternalLink, Play, Activity, Server
} from 'lucide-react';

const PaymentGatewaySettings: React.FC<{ state: AppState }> = ({ state }) => {
   const [activeTab, setActiveTab] = useState<'all' | 'online' | 'wallet' | 'offline'>('all');
   const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
   const [isConfigOpen, setIsConfigOpen] = useState(false);
   const [showSecrets, setShowSecrets] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   const currentUserRole = state.currentUser?.role || Role.VIEWER;
   const canEdit = [Role.SUPER_ADMIN, Role.FINANCE_ADMIN].includes(currentUserRole as Role);

   const gateways = state.settings.paymentGateways.sort((a, b) => a.priority - b.priority);

   const filteredGateways = gateways.filter(g =>
      activeTab === 'all' || g.type === activeTab
   );

   const handleToggleGateway = async (gateway: PaymentGateway) => {
      if (!canEdit) return;
      await db.updateGatewayConfig(gateway.id, { enabled: !gateway.enabled });
      db.logNotification('all', 'info', 'Gateway Protocol', `${gateway.name} node has been ${!gateway.enabled ? 'activated' : 'deactivated'}.`);
   };

   const handleSaveConfig = async () => {
      if (!selectedGateway || !canEdit) return;
      setIsSaving(true);
      await db.updateGatewayConfig(selectedGateway.id, selectedGateway);
      setTimeout(() => {
         setIsSaving(false);
         setIsConfigOpen(false);
         db.logNotification('all', 'success', 'Config Synchronized', `${selectedGateway.name} Connection Parameters updated.`);
      }, 600);
   };

   const getGatewayIcon = (id: string) => {
      switch (id) {
         case 'stripe': return <Globe className="text-blue-500" size={24} />;
         case 'paypal': return <CreditCard className="text-indigo-500" size={24} />;
         case 'payfast': return <Zap className="text-amber-500" size={24} />;
         case 'easypaisa': return <Smartphone className="text-emerald-500" size={24} />;
         case 'jazzcash': return <Smartphone className="text-rose-500" size={24} />;
         case 'cash': return <Banknote className="text-slate-600" size={24} />;
         case 'bank': return <Landmark className="text-blue-600" size={24} />;
         case 'home': return <Landmark className="text-purple-600" size={24} />;
         default: return <Settings2 size={24} />;
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                  <CreditCard className="text-blue-600" size={32} />
                  Fiscal Gateway Control
               </h2>
               <p className="text-slate-500 font-medium">Centrally manage payment handshakes, API credentials, and system-wide visibility.</p>
            </div>
            <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto">
               {[
                  { id: 'all', label: 'All Methods' },
                  { id: 'online', label: 'Gateways' },
                  { id: 'wallet', label: 'Wallets' },
                  { id: 'offline', label: 'Retail/Manual' }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGateways.map(gateway => (
               <div key={gateway.id} className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all hover:shadow-xl group relative overflow-hidden flex flex-col ${gateway.enabled ? 'border-emerald-100 shadow-emerald-50' : 'border-slate-50 opacity-60 grayscale'}`}>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform">
                        {getGatewayIcon(gateway.id)}
                     </div>
                     <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${gateway.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                           {gateway.enabled ? 'Operational' : 'Disabled'}
                        </div>
                        {canEdit && (
                           <button
                              onClick={() => handleToggleGateway(gateway)}
                              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${gateway.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                           >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${gateway.enabled ? 'left-7' : 'left-1'}`}></div>
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="space-y-1 mb-8 relative z-10">
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">{gateway.name}</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{gateway.type} protocol</p>
                  </div>

                  <div className="mt-auto space-y-4 relative z-10">
                     {gateway.type !== 'offline' && (
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${gateway.sandbox ? 'bg-amber-500' : 'bg-indigo-500'} animate-pulse`}></div>
                           <span className="text-[9px] font-black uppercase text-slate-500">{gateway.sandbox ? 'Sandbox Mode' : 'Production Node'}</span>
                        </div>
                     )}
                     <button
                        onClick={() => { setSelectedGateway({ ...gateway }); setIsConfigOpen(true); }}
                        className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                        <Settings2 size={16} /> Configuration
                     </button>
                  </div>

                  <ShieldCheck className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-[1.7] transition-transform duration-500" size={180} />
               </div>
            ))}
         </div>

         {/* Production Health Banner */}
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl border border-white/5">
            <div className="relative z-10 max-w-xl space-y-4">
               <div className="flex items-center gap-3 text-indigo-400">
                  <ShieldAlert size={28} />
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Registry Node Monitor</h3>
               </div>
               <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
                  All digital payment handshakes are encrypted via 256-bit AES registry protocols. Unauthorized gateway configuration changes trigger high-priority system alerts.
               </p>
            </div>
            <div className="relative z-10 flex gap-4">
               <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Listeners</p>
                  <div className="flex items-center justify-center gap-2">
                     <Activity size={14} className="text-emerald-500 animate-pulse" />
                     <p className="text-2xl font-black text-indigo-400">{gateways.filter(g => g.enabled).length}</p>
                  </div>
               </div>
               <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Latency Tier</p>
                  <div className="flex items-center justify-center gap-2">
                     <Server size={14} className="text-blue-500" />
                     <p className="text-2xl font-black text-emerald-400">ULTRA</p>
                  </div>
               </div>
            </div>
            <Globe className="absolute -right-20 -bottom-20 opacity-5 scale-[2] pointer-events-none" size={300} />
         </div>

         {/* Configuration Modal */}
         {isConfigOpen && selectedGateway && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
               <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
                  <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border shadow-sm">
                           {getGatewayIcon(selectedGateway.id)}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{selectedGateway.name} Configuration</h3>
                           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Gateway Profile</p>
                        </div>
                     </div>
                     <button onClick={() => setIsConfigOpen(false)} className="p-3 hover:bg-red-50 rounded-2xl text-slate-400 hover:text-red-600"><X size={28} /></button>
                  </div>

                  <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                     {selectedGateway.type !== 'offline' && (
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                           <div>
                              <h4 className="text-sm font-black uppercase text-slate-900">Handshake Environment</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Toggle between Sandbox and Production nodes</p>
                           </div>
                           <div className="flex p-1 bg-white border rounded-2xl shadow-sm">
                              <button
                                 onClick={() => setSelectedGateway({ ...selectedGateway, sandbox: true })}
                                 className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedGateway.sandbox ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'}`}
                              >
                                 Sandbox
                              </button>
                              <button
                                 onClick={() => setSelectedGateway({ ...selectedGateway, sandbox: false })}
                                 className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!selectedGateway.sandbox ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                              >
                                 Live Node
                              </button>
                           </div>
                        </div>
                     )}

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Info size={14} /> Subscriber Guidance</label>
                        <textarea
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs h-24 outline-none focus:border-indigo-500 uppercase"
                           placeholder="Instructions displayed to the user during payment..."
                           value={selectedGateway.instructions || ''}
                           onChange={e => setSelectedGateway({ ...selectedGateway, instructions: e.target.value })}
                        />
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Connection Parameters</h4>
                           <button
                              onClick={() => setShowSecrets(!showSecrets)}
                              className="flex items-center gap-2 text-[9px] font-black uppercase text-indigo-600"
                           >
                              {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />} {showSecrets ? 'Mask Tokens' : 'Reveal Secrets'}
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {Object.keys(selectedGateway.config).map(key => (
                              <div key={key} className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">{key.replace(/([A-Z])/g, ' $1')}</label>
                                 <input
                                    type={!showSecrets && (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('password')) ? 'password' : 'text'}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-indigo-500"
                                    value={selectedGateway.config[key]}
                                    onChange={e => {
                                       const newConfig = { ...selectedGateway.config };
                                       newConfig[key] = e.target.value;
                                       setSelectedGateway({ ...selectedGateway, config: newConfig });
                                    }}
                                 />
                              </div>
                           ))}
                           {Object.keys(selectedGateway.config).length === 0 && (
                              <div className="col-span-2 p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                 <ShieldAlert className="text-slate-100 mx-auto mb-4" size={32} />
                                 <p className="text-[10px] font-black text-slate-300 uppercase">No manual parameters required for this node type.</p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
                        <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2">
                           <Play size={14} /> Test Connection Pulse
                        </button>
                        <button className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2">
                           <ExternalLink size={14} /> Documentation API
                        </button>
                     </div>
                  </div>

                  <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                     <button onClick={() => setIsConfigOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all uppercase tracking-widest text-[11px]">Abort Updates</button>
                     <button
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        className="flex-[2] py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95"
                     >
                        {isSaving ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20} />}
                        Authorize & Publish
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default PaymentGatewaySettings;
