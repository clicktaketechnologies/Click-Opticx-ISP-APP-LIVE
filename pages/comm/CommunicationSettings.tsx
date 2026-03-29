import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState, useEffect, useMemo } from 'react';
import { AppState, CommunicationSettings, EmailGatewayMode, SenderIdentity } from '../../types';
import { db } from '../../db';
import {
   Settings, Mail, Globe, Clock, ShieldCheck,
   Save, RefreshCw, Smartphone, Key, Lock,
   AlertTriangle, Info, Bell, Zap, Database,
   ArrowLeft, ListChecks, SmartphoneIcon, Server, Cpu, EyeOff, Eye,
   Activity, Play, CheckCircle, ShieldAlert, Wifi, Flame, Send,
   XCircle, X, Terminal, Calendar, UserCheck, Plus, Trash2, Sliders, Heart
} from 'lucide-react';

const CommunicationSettingsPage: React.FC<{ state: AppState }> = ({ state }) => {
   const [formData, setFormData] = useState<CommunicationSettings>(state.settings.commConfig);
   const [isSaving, setIsSaving] = useState(false);
   const [showSecrets, setShowSecrets] = useState(false);
   const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
   const [isTesting, setIsTesting] = useState(false);
   const [activeTab, setActiveTab] = useState<'gateway' | 'identities' | 'advanced'>('gateway');

   // Sender Identity State
   const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
   const [newIdentity, setNewIdentity] = useState({ name: '', email: '' });
   const [isProcessing, setIsProcessing] = useState<string | null>(null);

   // Test Email Modal State
   const [isTestModalOpen, setIsTestModalOpen] = useState(false);
   const [isSendingTest, setIsSendingTest] = useState(false);
   const [testEmailData, setTestEmailData] = useState({
      recipient: '',
      subject: 'Operational Test - Payment Due - Click Opticx',
      templateId: state.emailTemplates[0]?.id || ''
   });

   const handleSave = async () => {
      setIsSaving(true);
      try {
         await db.updateSettings({ ...state.settings, commConfig: formData });
         setTimeout(() => {
            setIsSaving(false);
            db.logNotification('all', 'success', 'Settings Saved', 'Message settings have been updated successfully.');
         }, 800);
      } catch (err) {
         setIsSaving(false);
         alert('Update Failed: The system could not save the changes.');
      }
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

   const addIdentity = async () => {
      if (!newIdentity.name || !newIdentity.email) return;
      setIsProcessing('new');
      await db.addSenderIdentity(newIdentity);
      setIsProcessing(null);
      setIsIdentityModalOpen(false);
      setNewIdentity({ name: '', email: '' });
   };

   const deleteIdentity = async (id: string) => {
      if (confirm('Revoke this Caller Details authorization?')) {
         await db.deleteSenderIdentity(id);
      }
   };

   const makeDefaultIdentity = async (id: string) => {
      const nextIdentities = formData.senderIdentities.map(i => ({
         ...i,
         isDefault: i.id === id
      }));
      setFormData({ ...formData, senderIdentities: nextIdentities });
      await db.updateSettings({ ...state.settings, commConfig: { ...formData, senderIdentities: nextIdentities } });
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'Healthy': return 'bg-green-500';
         case 'Slow': return 'bg-amber-500';
         case 'Failed': return 'bg-rose-500 animate-pulse';
         default: return 'bg-slate-400';
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
                  <Mail className="text-blue-600" size={32} />
                  Message Center Settings
               </h2>
               <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">Manage how the system sends emails and messages.</p>
            </div>
            <div className="flex gap-3">
               <button
                  onClick={handleRunDiagnostic}
                  disabled={isTesting}
                  className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
               >
                  {isTesting ? <Mini5GMicroLoader size={16} /> : <Activity size={16} className="text-blue-600" />}
                  Test Connection
               </button>
               <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-50"
               >
                  {isSaving ? <Mini5GMicroLoader size={18} /> : <Save size={18} />}
                  Save Settings
               </button>
            </div>
         </div>

         <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
            <button
               onClick={() => setActiveTab('gateway')}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'gateway' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
               <Server size={14} /> Message Gateway
            </button>
            <button
               onClick={() => setActiveTab('identities')}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'identities' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
               <UserCheck size={14} /> Sender Accounts
            </button>
            <button
               onClick={() => setActiveTab('advanced')}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'advanced' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
               <Sliders size={14} /> Automated Rules
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
               { label: 'System Status', value: formData.health.status, icon: ShieldCheck, color: getStatusColor(formData.health.status) },
               { label: 'Response Time', value: `${formData.health.latency}ms`, icon: Activity, color: 'bg-blue-500' },
               { label: 'Bounce Rate', value: `${formData.health.bounceRate}%`, icon: ShieldAlert, color: 'bg-rose-500' },
               { label: 'Scaling Status', value: `Day ${formData.warmup.currentDay}`, icon: Flame, color: 'bg-orange-500' },
            ].map((kpi, idx) => (
               <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${kpi.color} ${kpi.label === 'Gateway Node' && formData.health.status === 'Failed' ? 'animate-pulse' : ''}`}></div>
                        <h4 className="text-lg font-black italic text-slate-900 uppercase tracking-tighter">{kpi.value}</h4>
                     </div>
                  </div>
                  <kpi.icon size={28} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
               </div>
            ))}
         </div>

         {testResult && (
            <div className={`p-6 border-2 rounded-[2rem] flex items-center justify-between animate-in zoom-in slide-in-from-top-4 ${testResult.success ? 'bg-green-50 border-green-100 text-green-900' : 'bg-rose-50 border-rose-100 text-rose-900'}`}>
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${testResult.success ? 'bg-green-500 shadow-green-500/20' : 'bg-rose-600 shadow-rose-600/20'} text-white shadow-xl`}>
                     {testResult.success ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  </div>
                  <div>
                     <p className="text-xs font-black uppercase">Connection Test Result</p>
                     <p className="text-[10px] font-bold opacity-75 uppercase tracking-wide">{testResult.message}</p>
                  </div>
               </div>
               <button onClick={() => setTestResult(null)} className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all"><X size={18} /></button>
            </div>
         )}

         {activeTab === 'gateway' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl space-y-10 animate-in slide-in-from-left-4">
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                     {[
                        { id: 'CUSTOM_SMTP', label: 'Standard Email (SMTP)', icon: Server, desc: 'Your own domain/hosting' },
                        { id: 'PROVIDER_API', label: 'Cloud Service (API)', icon: Globe, desc: 'AWS SES, SendGrid, etc' },
                        { id: 'HYBRID', label: 'Automatic (Hybrid)', icon: Cpu, desc: 'Auto-fallback logic active' }
                     ].map((mode) => (
                        <button
                           key={mode.id}
                           onClick={() => setFormData({ ...formData, emailMode: mode.id as EmailGatewayMode })}
                           className={`flex-1 flex flex-col items-center gap-1 py-4 rounded-xl transition-all ${formData.emailMode === mode.id ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <mode.icon size={20} />
                           <span className="text-[9px] font-black uppercase tracking-widest">{mode.label}</span>
                        </button>
                     ))}
                  </div>

                  {formData.emailMode === 'CUSTOM_SMTP' || formData.emailMode === 'HYBRID' ? (
                     <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <div className="flex items-center gap-3">
                              <Server className="text-blue-600" size={24} />
                              <h3 className="text-lg font-black uppercase italic tracking-tighter">Email Server Settings (SMTP)</h3>
                           </div>
                           <button
                              onClick={() => setIsTestModalOpen(true)}
                              className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-3 shadow-sm"
                           >
                              <Send size={14} /> Send Test Email
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic tracking-widest">Server Address</label>
                              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-blue-600 transition-all shadow-inner" value={formData.smtpConfig.host} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, host: e.target.value } })} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic tracking-widest">Port</label>
                                 <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm shadow-inner" value={formData.smtpConfig.port} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, port: Number(e.target.value) } })} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic tracking-widest">TLS/SSL</label>
                                 <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase shadow-inner" value={formData.smtpConfig.encryption} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, encryption: e.target.value as any } })}>
                                    <option value="TLS">STARTTLS</option>
                                    <option value="SSL">SSL/TLS</option>
                                    <option value="None">None (Insecure)</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                        <div className="p-8 bg-slate-950 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden border border-white/5">
                           <div className="relative z-10 flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase italic tracking-widest text-blue-400 flex items-center gap-3">
                                 <Key size={18} /> Login Details
                              </h4>
                              <button onClick={() => setShowSecrets(!showSecrets)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                                 {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />} {showSecrets ? 'Mask' : 'Reveal'}
                              </button>
                           </div>
                           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Username</label>
                                 <input className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-black text-white text-xs outline-none focus:border-blue-500" value={formData.smtpConfig.username} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, username: e.target.value } })} />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Password</label>
                                 <input type={showSecrets ? 'text' : 'password'} placeholder="••••••••" className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-black text-white text-xs focus:border-blue-500 outline-none" value={formData.smtpConfig.password || ''} onChange={e => setFormData({ ...formData, smtpConfig: { ...formData.smtpConfig, password: e.target.value } })} />
                              </div>
                           </div>
                           <Terminal className="absolute -right-8 -bottom-8 opacity-5 scale-150 pointer-events-none" size={140} />
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                           <div className="flex items-center gap-3">
                              <Globe className="text-blue-600" size={24} />
                              <h3 className="text-lg font-black uppercase italic tracking-tighter">Cloud Email Provider</h3>
                           </div>
                           <button
                              onClick={() => setIsTestModalOpen(true)}
                              className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-3 shadow-sm"
                           >
                              <Send size={14} /> Run Test
                           </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic tracking-widest">Protocol Provider</label>
                              <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase shadow-inner" value={formData.emailProvider} onChange={e => setFormData({ ...formData, emailProvider: e.target.value as any })}>
                                 <option value="SendGrid">SendGrid</option>
                                 <option value="AWS_SES">Amazon SES (SES-v2)</option>
                                 <option value="Mailgun">Mailgun API</option>
                                 <option value="Brevo">Brevo Hub</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic tracking-widest">Relay Domain</label>
                              <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm shadow-inner" placeholder="e.g. relay.clickopticx.com" value={formData.providerConfig.senderDomain} onChange={e => setFormData({ ...formData, providerConfig: { ...formData.providerConfig, senderDomain: e.target.value } })} />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1 italic tracking-widest">Primary API Access Key</label>
                           <div className="relative">
                              <input type={showSecrets ? 'text' : 'password'} className="w-full pl-6 pr-16 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-lg focus:border-blue-600 outline-none transition-all shadow-inner" placeholder="Enter authorization token..." value={formData.providerConfig.apiKey} onChange={e => setFormData({ ...formData, providerConfig: { ...formData.providerConfig, apiKey: e.target.value } })} />
                              <button onClick={() => setShowSecrets(!showSecrets)} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-slate-300 hover:text-slate-600 bg-white rounded-xl shadow-sm border border-slate-100 transition-all">
                                 {showSecrets ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
                     <Activity className="absolute -right-8 -top-8 opacity-5" size={120} />
                     <h4 className="text-sm font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <Heart size={18} className="text-rose-500" /> Infrastructure Node Health
                     </h4>

                     <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Auth Status</p>
                           <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-[9px] font-black uppercase">{formData.health.status}</span>
                           </div>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Ping Latency</p>
                           <p className="text-xl font-black italic tracking-tighter text-blue-400">{formData.health.latency}ms</p>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Drop rate</p>
                           <p className="text-xl font-black italic tracking-tighter text-rose-400">{formData.health.bounceRate}%</p>
                        </div>
                        <div className="pt-4 flex items-center gap-2">
                           <Database size={12} className="text-slate-500" />
                           <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] italic">Last Sync: {new Date(formData.health.lastCheck).toLocaleString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                        <Zap size={14} className="text-amber-500" /> Message Limits
                     </h3>
                     <div className="space-y-4">
                        {[
                           { label: 'Max Emails / Hour', key: 'emailsPerHour', icon: Clock },
                           { label: 'Max Emails / Day', key: 'emailsPerDay', icon: Calendar },
                        ].map(limit => (
                           <div key={limit.key} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-600 transition-all shadow-inner">
                              <div className="flex items-center gap-3 mb-2">
                                 <limit.icon size={14} className="text-slate-400 group-hover:text-blue-600" />
                                 <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{limit.label}</span>
                              </div>
                              <input type="number" className="bg-transparent font-black text-2xl italic outline-none w-full text-slate-900" value={(formData.rateLimits as any)[limit.key]} onChange={e => setFormData({ ...formData, rateLimits: { ...formData.rateLimits, [limit.key]: Number(e.target.value) } })} />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'identities' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
               <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border shadow-xl text-blue-600">
                        <UserCheck size={32} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Approved Senders List</h3>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Emails that are allowed to send messages.</p>
                     </div>
                  </div>
                  <button
                     onClick={() => setIsIdentityModalOpen(true)}
                     className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3"
                  >
                     <Plus size={18} /> Add New Sender
                  </button>
               </div>

               <div className="p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {formData.senderIdentities.map(identity => (
                        <div key={identity.id} className={`p-8 rounded-[2.5rem] border-2 transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col ${identity.isVerified ? 'bg-white border-slate-100' : 'bg-amber-50/30 border-amber-100 shadow-lg shadow-amber-50/50'}`}>
                           <div className="flex justify-between items-start mb-8">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${identity.isVerified ? 'bg-blue-50 text-blue-600 border-blue-50' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                                 <Mail size={28} />
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${identity.isVerified ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'}`}>
                                    {identity.isVerified ? 'Verified node' : 'Handshake Pending'}
                                 </div>
                                 {identity.isDefault && <span className="text-[8px] font-black text-blue-600 uppercase italic tracking-widest">⭐ Default Primary</span>}
                              </div>
                           </div>

                           <div className="space-y-2 mb-8 flex-1">
                              <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate group-hover:text-blue-600 transition-colors leading-none">{identity.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate italic">{identity.email}</p>
                           </div>

                           <div className="flex gap-2 pt-6 border-t border-slate-50">
                              {!identity.isDefault && identity.isVerified && (
                                 <button onClick={() => makeDefaultIdentity(identity.id)} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">Set Primary</button>
                              )}
                              {!identity.isVerified && (
                                 <button className="flex-1 py-4 bg-amber-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all">Verify Node</button>
                              )}
                              <button onClick={() => deleteIdentity(identity.id)} className="p-4 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                           </div>
                           <Activity className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 text-blue-900" size={140} />
                        </div>
                     ))}

                     {formData.senderIdentities.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center">
                           <UserCheck size={80} className="text-slate-200 mb-6" />
                           <h3 className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter">Identity Grid Dormant</h3>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest max-w-sm leading-relaxed mt-2">NO AUTHORIZED SENDER Users IDENTIFIED. PROVISION YOUR FIRST IDENTITY TO ENABLE CORPORATE DISPATCH PROTOCOLS.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'advanced' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
               <div className="p-10 border-b border-slate-50 flex items-center gap-5 bg-slate-50/50">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border shadow-xl text-blue-600">
                     <Sliders size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Automatic Action Settings</h3>
                     <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">Settings for automatic messages and system health.</p>
                  </div>
               </div>

               <div className="p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <div className="space-y-2">
                           <h4 className="text-sm font-black text-blue-600 uppercase italic tracking-widest flex items-center gap-3">
                              <Bell size={18} /> System Alerts
                           </h4>
                           <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">Automatic messages sent by the system.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           {[
                              { label: 'Push Notifications', key: 'pushEnabled', icon: Smartphone, desc: 'Mobile terminal push notification socket' },
                              { label: 'Do Not Disturb Hours', key: 'quietHoursEnabled', icon: Clock, desc: 'Don\'t send automatic messages during these times.' }
                           ].map((rule) => (
                              <div key={rule.key} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-blue-600 transition-all">
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                                       <rule.icon size={24} />
                                    </div>
                                    <div>
                                       <h5 className="text-[11px] font-black uppercase italic text-slate-900 tracking-tighter leading-none mb-1">{rule.label}</h5>
                                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{rule.desc}</p>
                                    </div>
                                 </div>
                                 <button
                                    onClick={() => {
                                       if (rule.key === 'pushEnabled') setFormData({ ...formData, pushEnabled: !formData.pushEnabled });
                                       else setFormData({ ...formData, quietHours: { ...formData.quietHours, enabled: !formData.quietHours.enabled } });
                                    }}
                                    className={`w-14 h-7 rounded-full transition-all relative ${((rule.key === 'pushEnabled' ? formData.pushEnabled : formData.quietHours.enabled)) ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-200'}`}
                                 >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${((rule.key === 'pushEnabled' ? formData.pushEnabled : formData.quietHours.enabled)) ? 'left-8' : 'left-1'}`}></div>
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="space-y-2">
                           <h4 className="text-sm font-black text-green-600 uppercase italic tracking-widest flex items-center gap-3">
                              <Flame size={18} /> Gradual Scaling
                           </h4>
                           <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">Slowly increase message limits to stay safe.</p>
                        </div>

                        <div className="p-10 bg-green-50 border border-green-100 rounded-[3rem] space-y-8 shadow-inner shadow-green-500/5">
                           <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-green-100">
                              <div>
                                 <p className="text-[10px] font-black text-green-700 uppercase italic tracking-widest leading-none mb-1">Protection System</p>
                                 <p className="text-[8px] font-bold text-green-600/60 uppercase">Increases daily limits automatically</p>
                              </div>
                              <button
                                 onClick={() => setFormData({ ...formData, warmup: { ...formData.warmup, enabled: !formData.warmup.enabled } })}
                                 className={`w-14 h-7 rounded-full transition-all relative ${formData.warmup.enabled ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-slate-200'}`}
                              >
                                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.warmup.enabled ? 'left-8' : 'left-1'}`}></div>
                              </button>
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-green-800 uppercase italic tracking-widest ml-1">Current Limit</label>
                                 <div className="p-4 bg-white border border-green-100 rounded-2xl font-black text-2xl text-green-900 italic shadow-sm">
                                    {formData.warmup.limit} <span className="text-[10px] font-bold uppercase text-green-500">Msg/Day</span>
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-green-800 uppercase italic tracking-widest ml-1">Target Intensity</label>
                                 <input
                                    type="number"
                                    className="w-full p-4 bg-white border border-green-100 rounded-2xl font-black text-2xl text-green-900 italic outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                                    value={formData.warmup.limit}
                                    onChange={e => setFormData({ ...formData, warmup: { ...formData.warmup, limit: Number(e.target.value) } })}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Test Email Modal */}
         {isTestModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col">
                  <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                           <Send size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black uppercase italic tracking-tighter">Connection Test</h3>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Test if the system can send messages.</p>
                        </div>
                     </div>
                     <button onClick={() => setIsTestModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-10 space-y-8">
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Send Test To (Email)</label>
                           <input
                              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-blue-600 transition-all shadow-inner"
                              placeholder="admin@domain.com"
                              value={testEmailData.recipient}
                              onChange={e => setTestEmailData({ ...testEmailData, recipient: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Test Subject</label>
                           <input
                              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-blue-600 transition-all shadow-inner"
                              value={testEmailData.subject}
                              onChange={e => setTestEmailData({ ...testEmailData, subject: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-5 shadow-inner">
                        <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                        <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                           ➡ Note: Test messages are logged for security. This helps ensure your connection is working correctly.
                        </p>
                     </div>

                     <button
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest || !testEmailData.recipient}
                        className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                     >
                        {isSendingTest ? <Mini5GMicroLoader size={18} /> : <Send size={18} />}
                        {isSendingTest ? 'SENDING...' : 'SEND TEST'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Caller Details Modal */}
         {isIdentityModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col">
                  <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                           <UserCheck size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black uppercase italic tracking-tighter">Add New Sender</h3>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Adding New Sender</p>
                        </div>
                     </div>
                     <button onClick={() => setIsIdentityModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-10 space-y-8">
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Friendly Signature Name</label>
                           <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-blue-600 transition-all shadow-inner uppercase" placeholder="e.g. SYSTEM NOTIFICATIONS" value={newIdentity.name} onChange={e => setNewIdentity({ ...newIdentity, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized - Payment Due Email</label>
                           <input type="email" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-sm outline-none focus:border-blue-600 transition-all shadow-inner" placeholder="notify@clickopticx.com" value={newIdentity.email} onChange={e => setNewIdentity({ ...newIdentity, email: e.target.value })} />
                        </div>
                     </div>

                     <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-5 shadow-inner">
                        <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                        <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                           ➡ After adding, we will send a verification email. The account will stay 'pending' until verified.
                        </p>
                     </div>
                  </div>

                  <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                     <button onClick={() => setIsIdentityModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Abort</button>
                     <button
                        onClick={addIdentity}
                        disabled={isProcessing === 'new' || !newIdentity.email || !newIdentity.name}
                        className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                     >
                        {isProcessing === 'new' ? <Mini5GMicroLoader size={18} /> : <Plus size={18} />}
                        Save Sender
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default CommunicationSettingsPage;

