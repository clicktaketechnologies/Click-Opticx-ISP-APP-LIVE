import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import { Modal } from '../components/shared/Modal';
import { useToast } from '../components/shared/Toast';

import React, { useState, useCallback } from 'react';
import { AppState, PaymentGateway, Role } from '../types';
import { db } from '../db';
import {
   CreditCard, ShieldCheck, Globe, Smartphone, Banknote,
   Settings2, RotateCw, Save, X, Eye, EyeOff, Trash2,
   Landmark, Zap, ShieldAlert, CheckCircle, Info, ChevronRight,
   HelpCircle, AlertTriangle, ExternalLink, Play, Activity, Server,
   Copy, Webhook, Wifi, WifiOff, Loader2
} from 'lucide-react';
import { getBackendUrl } from '../utils/env';

const PaymentGatewaySettings: React.FC<{ state: AppState }> = ({ state }) => {
   const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
   const [activeTab, setActiveTab] = useState<'all' | 'online' | 'wallet' | 'offline'>('all');
   const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
   const [isConfigOpen, setIsConfigOpen] = useState(false);
   const [showSecrets, setShowSecrets] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [isTesting, setIsTesting] = useState(false);
   const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

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
      // Validate required config fields before saving
      const emptyKeys = Object.entries(selectedGateway.config)
         .filter(([k, v]) => !v && !k.toLowerCase().includes('optional'))
         .map(([k]) => k);
      if (emptyKeys.length > 0 && selectedGateway.type !== 'offline') {
         toastError(`Missing required fields: ${emptyKeys.join(', ')}`);
         return;
      }
      setIsSaving(true);
      try {
         await db.updateGatewayConfig(selectedGateway.id, selectedGateway);
         db.logNotification('all', 'success', 'Config Synchronized', `${selectedGateway.name} Connection Parameters updated.`);
         toastSuccess(`${selectedGateway.name} configuration saved successfully.`);
         setIsConfigOpen(false);
      } catch (e: any) {
         toastError(`Save failed: ${e.message}`);
      } finally {
         setIsSaving(false);
      }
   };

   const handleTestConnection = useCallback(async () => {
      if (!selectedGateway) return;
      setIsTesting(true);
      setTestResult(null);
      try {
         const baseUrl = getBackendUrl();
         const res = await fetch(`${baseUrl}/api/payments/test-gateway`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${localStorage.getItem('clickopticx_admin_token')}`,
            },
            body: JSON.stringify({
               gatewayId: selectedGateway.id,
               config: selectedGateway.config,
               sandbox: selectedGateway.sandbox,
            }),
         });
         const data = await res.json();
         if (data.success) {
            setTestResult({ ok: true, msg: data.message || 'Connection pulse successful — gateway is reachable.' });
            toastSuccess(`${selectedGateway.name}: Gateway reachable ✓`);
         } else {
            setTestResult({ ok: false, msg: data.message || 'Gateway rejected the connection pulse.' });
            toastError(`${selectedGateway.name}: ${data.message}`);
         }
      } catch (e: any) {
         setTestResult({ ok: false, msg: `Network error: ${e.message}` });
         toastError(`Connection test failed: ${e.message}`);
      } finally {
         setIsTesting(false);
      }
   }, [selectedGateway, toastSuccess, toastError]);

   const getWebhookUrl = (gatewayId: string) => {
      const base = getBackendUrl();
      return `${base}/api/webhooks/${gatewayId}`;
   };

   const copyWebhookUrl = (gatewayId: string) => {
      navigator.clipboard.writeText(getWebhookUrl(gatewayId))
         .then(() => toastSuccess('Webhook URL copied to clipboard.'))
         .catch(() => toastError('Failed to copy — please copy manually.'));
   };

   const getGatewayIcon = (id: string) => {
      switch (id) {
         case 'stripe': return <Globe className="text-blue-500" size={24} />;
         case 'paypal': return <CreditCard className="text-blue-500" size={24} />;
         case 'payfast': return <Zap className="text-amber-500" size={24} />;
         case 'easypaisa': return <Smartphone className="text-green-500" size={24} />;
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
               <p className="text-slate-500 font-medium">Centrally manage payment methods, API credentials, and system-wide visibility.</p>
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
                     className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  >
                     {tab.label}
                  </button>
               ))}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGateways.map(gateway => (
               <div key={gateway.id} className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all hover:shadow-xl group relative overflow-hidden flex flex-col ${gateway.enabled ? 'border-green-100 shadow-green-50' : 'border-slate-50 opacity-60 grayscale'}`}>
                  <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform">
                        {getGatewayIcon(gateway.id)}
                     </div>
                     <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${gateway.enabled ? 'bg-green-50 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                           {gateway.enabled ? 'Operational' : 'Disabled'}
                        </div>
                        {canEdit && (
                           <button
                              onClick={() => handleToggleGateway(gateway)}
                              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${gateway.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
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
                           <div className={`w-2 h-2 rounded-full ${gateway.sandbox ? 'bg-amber-500' : 'bg-blue-500'} animate-pulse`}></div>
                           <span className="text-[9px] font-black uppercase text-slate-500">{gateway.sandbox ? 'Sandbox Mode' : 'Production Node'}</span>
                        </div>
                     )}
                     <button
                        onClick={() => { setSelectedGateway({ ...gateway }); setIsConfigOpen(true); }}
                        className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
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
               <div className="flex items-center gap-3 text-blue-400">
                  <ShieldAlert size={28} />
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Registry Node Monitor</h3>
               </div>
               <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase">
                  All digital payments are encrypted via 256-bit AES protocols. Unauthorized gateway configuration changes trigger high-priority system alerts.
               </p>
            </div>
            <div className="relative z-10 flex gap-4">
               <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Listeners</p>
                  <div className="flex items-center justify-center gap-2">
                     <Activity size={14} className="text-green-500 animate-pulse" />
                     <p className="text-2xl font-black text-blue-400">{gateways.filter(g => g.enabled).length}</p>
                  </div>
               </div>
               <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Latency Tier</p>
                  <div className="flex items-center justify-center gap-2">
                     <Server size={14} className="text-blue-500" />
                     <p className="text-2xl font-black text-green-400">ULTRA</p>
                  </div>
               </div>
            </div>
            <Globe className="absolute -right-20 -bottom-20 opacity-5 scale-[2] pointer-events-none" size={300} />
         </div>

         {/* Configuration Modal */}
         <Modal
           isOpen={isConfigOpen && !!selectedGateway}
           onClose={() => { setIsConfigOpen(false); setTestResult(null); }}
           title={selectedGateway ? `${selectedGateway.name} Configuration` : 'Configuration'}
           type="form"
           icon={selectedGateway ? getGatewayIcon(selectedGateway.id) : undefined}
           maxWidth="max-w-2xl"
           scrollable
           isLoading={isSaving}
           footer={
             <div className="flex gap-3">
               <button onClick={() => setIsConfigOpen(false)} disabled={isSaving} className="flex-1 py-3 font-black text-slate-400 hover:bg-white/5 rounded-xl transition-all uppercase tracking-widest text-[10px] disabled:opacity-30">Abort Updates</button>
               <button
                 onClick={handleSaveConfig}
                 disabled={isSaving}
                 className="flex-[2] py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95"
               >
                 {isSaving ? <Mini5GMicroLoader size={16} /> : <ShieldCheck size={16} />}
                 Authorize & Publish
               </button>
             </div>
           }
         >
           {selectedGateway && (
             <div className="space-y-6">
               {selectedGateway.type !== 'offline' && (
                 <div className="p-4 bg-slate-800 rounded-2xl flex items-center justify-between">
                   <div>
                     <h4 className="text-sm font-black uppercase text-white">Environment</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Toggle between Sandbox and Production nodes</p>
                   </div>
                   <div className="flex p-1 bg-slate-700 rounded-xl">
                     <button
                       onClick={() => setSelectedGateway({ ...selectedGateway, sandbox: true })}
                       className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${selectedGateway.sandbox ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'}`}
                     >Sandbox</button>
                     <button
                       onClick={() => setSelectedGateway({ ...selectedGateway, sandbox: false })}
                       className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${!selectedGateway.sandbox ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                     >Live Node</button>
                   </div>
                 </div>
               )}
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={12}/> Subscriber Guidance</label>
                 <textarea
                   className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs h-20 outline-none focus:border-blue-500 uppercase text-white"
                   placeholder="Instructions displayed to the user during payment..."
                   value={selectedGateway.instructions || ''}
                   onChange={e => setSelectedGateway({ ...selectedGateway, instructions: e.target.value })}
                 />
               </div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connection Parameters</h4>
                   <button
                     onClick={() => setShowSecrets(!showSecrets)}
                     className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-400"
                   >
                     {showSecrets ? <EyeOff size={12}/> : <Eye size={12}/>} {showSecrets ? 'Mask Tokens' : 'Reveal Secrets'}
                   </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.keys(selectedGateway.config).map(key => (
                     <div key={key} className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{key.replace(/([A-Z])/g, ' $1')}</label>
                       <input
                         type={!showSecrets && (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('password')) ? 'password' : 'text'}
                         className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs outline-none focus:border-blue-500 text-white"
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
                     <div className="col-span-2 p-8 text-center border border-dashed border-slate-700 rounded-2xl">
                       <p className="text-[10px] font-black text-slate-500 uppercase">No manual parameters required for this node type.</p>
                     </div>
                   )}
                 </div>
               </div>
               {/* Webhook URL Panel */}
               {selectedGateway.type !== 'offline' && (
                 <div className="p-4 bg-slate-800 rounded-2xl space-y-2 border border-slate-700">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Webhook size={12} className="text-blue-400" /> Webhook Endpoint URL
                   </label>
                   <div className="flex items-center gap-2">
                     <code className="flex-1 text-[10px] font-mono text-green-400 bg-black/30 px-3 py-2 rounded-lg truncate">
                       {getWebhookUrl(selectedGateway.id)}
                     </code>
                     <button
                       onClick={() => copyWebhookUrl(selectedGateway!.id)}
                       className="p-2 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all"
                       title="Copy webhook URL"
                     >
                       <Copy size={14} />
                     </button>
                   </div>
                   <p className="text-[9px] text-slate-500 font-bold uppercase">Register this URL in your gateway's dashboard to receive payment notifications.</p>
                 </div>
               )}

               {/* Test Result Banner */}
               {testResult && (
                 <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
                   testResult.ok
                     ? 'bg-emerald-900/20 border-emerald-700 text-emerald-400'
                     : 'bg-rose-900/20 border-rose-700 text-rose-400'
                 }`}>
                   {testResult.ok ? <Wifi size={16} className="mt-0.5 shrink-0" /> : <WifiOff size={16} className="mt-0.5 shrink-0" />}
                   <p className="text-[10px] font-bold uppercase tracking-wide">{testResult.msg}</p>
                 </div>
               )}

               <div className="pt-4 border-t border-white/5 flex gap-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12}/>}
                    {isTesting ? 'Testing...' : 'Test Connection Pulse'}
                  </button>
                  <button
                    onClick={() => window.open(`https://docs.${selectedGateway.id}.com`, '_blank')}
                    className="flex-1 py-3 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={12}/> Documentation API
                  </button>
                </div>
             </div>
           )}
         </Modal>
      </div>
   );
};

export default PaymentGatewaySettings;

