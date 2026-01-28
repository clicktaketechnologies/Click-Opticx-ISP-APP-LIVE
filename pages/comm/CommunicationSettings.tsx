
import React, { useState, useEffect } from 'react';
import { AppState, CommunicationSettings, EmailGatewayMode } from '../../types';
import { db } from '../../db';
// Added missing icons to imports
import {
   Settings, Mail, Globe, Clock, ShieldCheck,
   Save, RefreshCw, Smartphone, Key, Lock,
   AlertTriangle, Info, Bell, Zap, Database,
   ArrowLeft, ListChecks, SmartphoneIcon, Server, Cpu, EyeOff, Eye,
   Activity, Play, CheckCircle, ShieldAlert, Wifi, Flame, Send,
   XCircle, X, Terminal, Calendar
} from 'lucide-react';

const CommunicationSettingsPage: React.FC<{ state: AppState }> = ({ state }) => {
   const [formData, setFormData] = useState<CommunicationSettings>(state.settings.commConfig);
   const [isSaving, setIsSaving] = useState(false);
   const [showSecrets, setShowSecrets] = useState(false);
   const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
   const [isTesting, setIsTesting] = useState(false);

   // Test Email Modal State
   const [isTestModalOpen, setIsTestModalOpen] = useState(false);
   const [isSendingTest, setIsSendingTest] = useState(false);
   const [testEmailData, setTestEmailData] = useState({
      recipient: '',
      subject: 'Operational Test Dispatch - NetRecover',
      templateId: state.emailTemplates[0]?.id || ''
   });

   const handleSave = async () => {
      setIsSaving(true);
      await db.updateSettings({ ...state.settings, commConfig: formData });
      setTimeout(() => {
         setIsSaving(false);
         db.logNotification('all', 'success', 'Comm Layer Synced', 'Global communication parameters synchronized.');
      }, 800);
   };

   const handleRunDiagnostic = async () => {
      setIsTesting(true);
      setTestResult(null);
      const res = await db.testSMTPHandshake(formData.emailMode === 'PROVIDER_API' ? formData.providerConfig : formData.smtpConfig);
      setIsTesting(false);
      setTestResult(res);
   };

   const handleSendTestEmail = async () => {
      if (!testEmailData.recipient) return;
      setIsSendingTest(true);
      const config = formData.emailMode === 'PROVIDER_API' ? formData.providerConfig : formData.smtpConfig;
      const res = await db.sendTestEmail(config, testEmailData);
      setIsSendingTest(false);
      setTestResult(res);
      if (res.success) setIsTestModalOpen(false);
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'Healthy': return 'bg-emerald-500';
         case 'Slow': return 'bg-amber-500';
         case 'Failed': return 'bg-rose-500 animate-pulse';
         default: return 'bg-slate-400';
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                  <Settings className="text-indigo-600" size={32} />
                  Channel Parameters
               </h2>
               <p className="text-slate-500 font-medium">Provision global communication infrastructure and delivery handshakes.</p>
            </div>
            <div className="flex gap-3">
               <button
                  onClick={handleRunDiagnostic}
                  disabled={isTesting}
                  className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
               >
                  {isTesting ? <RefreshCw className="animate-spin" size={16} /> : <Activity size={16} className="text-blue-500" />}
                  Run Node Diag
               </button>
               <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
               >
                  {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                  Publish Global State
               </button>
            </div>
         </div>

         {/* Health Dashboard Layer */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gateway Pulse</p>
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${getStatusColor(formData.health.status)}`}></div>
                     <h4 className="text-lg font-black italic text-slate-900 uppercase">{formData.health.status}</h4>
                  </div>
               </div>
               <ShieldCheck size={28} className="text-emerald-500/20 group-hover:scale-110 transition-transform" />
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg. Latency</p>
                  <h4 className="text-lg font-black italic text-slate-900 uppercase">{formData.health.latency}ms</h4>
               </div>
               <Activity size={28} className="text-blue-500/20 group-hover:scale-110 transition-transform" />
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bounce Registry</p>
                  <h4 className="text-lg font-black italic text-slate-900 uppercase">{formData.health.bounceRate}%</h4>
               </div>
               <ShieldAlert size={28} className="text-rose-500/20 group-hover:scale-110 transition-transform" />
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Warm-up Cycle</p>
                  <h4 className="text-lg font-black italic text-slate-900 uppercase">Day {formData.warmup.currentDay} ({formData.warmup.limit})</h4>
               </div>
               <Flame size={28} className="text-orange-500/20 group-hover:scale-110 transition-transform" />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Config Terminal */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                     {[
                        { id: 'CUSTOM_SMTP', label: 'Custom SMTP', icon: Server, desc: 'Your own domain/hosting' },
                        { id: 'PROVIDER_API', label: 'Provider API', icon: Globe, desc: 'AWS SES, SendGrid, etc' },
                        { id: 'HYBRID', label: 'Hybrid Node', icon: Cpu, desc: 'Auto-fallback logic active' }
                     ].map((mode) => (
                        <button
                           key={mode.id}
                           onClick={() => setFormData({ ...formData, emailMode: mode.id as EmailGatewayMode })}
                           className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-xl transition-all ${formData.emailMode === mode.id ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <mode.icon size={20} />
                           <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
                        </button>
                     ))}
                  </div>

                  {testResult && (
                     <div className={`p-6 border-2 rounded-[2rem] flex items-center justify-between animate-in zoom-in ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-rose-50 border-rose-100 text-rose-900'}`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${testResult.success ? 'bg-emerald-500' : 'bg-rose-600'} text-white`}>
                              {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                           </div>
                           <div className="flex-1">
                              <p className="text-xs font-black uppercase">Handshake Result</p>
                              <p className="text-[9px] font-bold opacity-70 uppercase leading-relaxed">{testResult.message}</p>
                           </div>
                        </div>
                        <button onClick={() => setTestResult(null)} className="p-2 opacity-50 hover:opacity-100"><X size={18} /></button>
                     </div>
                  )}

                  {formData.emailMode === 'CUSTOM_SMTP' || formData.emailMode === 'HYBRID' ? (
                     <div className="space-y-8 animate-in slide-in-from-top-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <div className="flex items-center gap-3">
                              <Server className="text-indigo-600" size={24} />
                              <h3 className="text-lg font-black uppercase italic tracking-tighter">SMTP Registry Parameters</h3>
                           </div>
                           <button
                              onClick={() => setIsTestModalOpen(true)}
                              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                           >
                              <Send size={14} /> Test Dispatch
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic">Handshake Host</label>
                              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all" value={formData.smtpConfig.host} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, host: e.target.value } })} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic">Port Node</label>
                                 <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm" value={formData.smtpConfig.port} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, port: Number(e.target.value) } })} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic">Encryption</label>
                                 <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase" value={formData.smtpConfig.encryption} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, encryption: e.target.value as any } })}>
                                    <option value="TLS">STARTTLS</option>
                                    <option value="SSL">SSL/TLS</option>
                                    <option value="None">None (Insecure)</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                        <div className="p-8 bg-slate-950 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                           <div className="relative z-10 flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase italic tracking-widest text-indigo-400 flex items-center gap-2">
                                 <Key size={16} /> Node Auth Tokens
                              </h4>
                              <button onClick={() => setShowSecrets(!showSecrets)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">
                                 {showSecrets ? 'Mask Secrets' : 'Reveal Secrets'}
                              </button>
                           </div>
                           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Username / Identity</label>
                                 <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-black text-white text-xs" value={formData.smtpConfig.username} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, username: e.target.value } })} />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-500 uppercase ml-1">Access Secret (Password)</label>
                                 <input type={showSecrets ? 'text' : 'password'} placeholder="••••••••" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-black text-white text-xs focus:border-indigo-500" value={formData.smtpConfig.password || ''} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, password: e.target.value } })} />
                              </div>
                           </div>
                           <Terminal className="absolute -right-8 -bottom-8 opacity-5 scale-150 pointer-events-none" size={140} />
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <div className="flex items-center gap-3">
                              <Globe className="text-blue-600" size={24} />
                              <h3 className="text-lg font-black uppercase italic tracking-tighter">Provider API Gateway</h3>
                           </div>
                           <button
                              onClick={() => setIsTestModalOpen(true)}
                              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                           >
                              <Send size={14} /> Test Dispatch
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic">Relay Provider</label>
                              <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase" value={formData.emailProvider} onChange={e => setFormData({ ...formData, emailProvider: e.target.value as any })}>
                                 <option value="SendGrid">SendGrid Node</option>
                                 <option value="AWS_SES">Amazon SES Hub</option>
                                 <option value="Mailgun">Mailgun Protocol</option>
                                 <option value="Brevo">Brevo Hub</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic">Provisioned Domain</label>
                              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm" placeholder="e.g. mail.clickopticx.com" value={formData.providerConfig.senderDomain} onChange={e => setFormData({ ...formData, providerConfig: { ...formData.providerConfig, senderDomain: e.target.value } })} />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic">Production API Token</label>
                           <div className="relative">
                              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input type={showSecrets ? 'text' : 'password'} className="w-full pl-14 pr-16 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-lg focus:border-indigo-600 outline-none transition-all shadow-inner" placeholder="Enter API Key Node..." value={formData.providerConfig.apiKey} onChange={e => setFormData({ ...formData, providerConfig: { ...formData.providerConfig, apiKey: e.target.value } })} />
                              <button onClick={() => setShowSecrets(!showSecrets)} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600">
                                 {showSecrets ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Side Parameters */}
            <div className="space-y-6">
               <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                     <Zap size={14} className="text-amber-500" /> Dispatch Thresholds
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                     {[
                        { label: 'Max Emails / Hour', key: 'emailsPerHour', icon: Clock },
                        { label: 'Max Emails / Day', key: 'emailsPerDay', icon: Calendar },
                        { label: 'Burst Capacity', key: 'burstLimit', icon: Zap }
                     ].map(limit => (
                        <div key={limit.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-600 transition-all">
                           <div className="flex items-center gap-3 mb-2">
                              <limit.icon size={12} className="text-slate-400 group-hover:text-indigo-600" />
                              <span className="text-[8px] font-black uppercase text-slate-500">{limit.label}</span>
                           </div>
                           <input type="number" className="bg-transparent font-black text-xl italic outline-none w-full" value={(formData.rateLimits as any)[limit.key]} onChange={e => setFormData({ ...formData, rateLimits: { ...formData.rateLimits, [limit.key]: Number(e.target.value) } })} />
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Warm-up Protocol</h4>
                     <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                        <div>
                           <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Reputation Protection</p>
                           <p className="text-xs font-bold text-white uppercase italic">Active Level: HIGH</p>
                        </div>
                        <button
                           onClick={() => setFormData({ ...formData, warmup: { ...formData.warmup, enabled: !formData.warmup.enabled } })}
                           className={`w-12 h-6 rounded-full relative transition-all ${formData.warmup.enabled ? 'bg-emerald-50 shadow-lg' : 'bg-slate-700'}`}
                        >
                           <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${formData.warmup.enabled ? 'left-6.5' : 'left-0.5'}`}></div>
                        </button>
                     </div>
                  </div>
                  <Activity className="absolute -right-8 -bottom-8 opacity-5" size={140} />
               </div>

               <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
                  <ShieldCheck className="text-blue-600 mt-1 shrink-0" size={24} />
                  <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                     Dispatch queue is asynchronous. Global rate thresholds apply across manual campaigns and automated reminders to preserve domain authority.
                  </p>
               </div>
            </div>
         </div>

         {/* Test Email Modal */}
         {isTestModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col">
                  <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                           <Send size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black uppercase italic tracking-tighter">Test Dispatch</h3>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Verify Outbound Node Link</p>
                        </div>
                     </div>
                     <button onClick={() => setIsTestModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-10 space-y-8">
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Recipient Node (Email)</label>
                           <input
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all"
                              placeholder="admin@domain.com"
                              value={testEmailData.recipient}
                              onChange={e => setTestEmailData({ ...testEmailData, recipient: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Subject Payload</label>
                           <input
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-indigo-600 transition-all"
                              value={testEmailData.subject}
                              onChange={e => setTestEmailData({ ...testEmailData, subject: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Blueprint Template</label>
                           <select
                              className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:border-indigo-500"
                              value={testEmailData.templateId}
                              onChange={e => setTestEmailData({ ...testEmailData, templateId: e.target.value })}
                           >
                              {state.emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4 shadow-inner">
                        <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                        <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                           Test dispatch results are logged in the Transparency Registry. This handshake verifies both authentication and deliverability.
                        </p>
                     </div>

                     <button
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest || !testEmailData.recipient}
                        className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                     >
                        {isSendingTest ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                        {isSendingTest ? 'Initializing Handshake...' : 'Authorize Test Dispatch'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default CommunicationSettingsPage;
