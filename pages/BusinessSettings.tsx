
import React, { useState, useRef } from 'react';
import { AppState, SystemSettings } from '../types';
import { db } from '../db';
// Add missing Wallet and Megaphone icons to imports
import { 
  Building2, Image as ImageIcon, Headphones, Smartphone, Bell, 
  Save, Eye, Globe, MessageSquare, ShieldCheck, 
  Trash2, Plus, X, ArrowRight, Zap, CheckCircle, Flame, RefreshCw,
  FileText, Share2, Type, Palette, MapPin, Clock, Phone, Mail,
  SmartphoneIcon, Facebook, Instagram, Twitter, Linkedin, Youtube,
  FileSignature, AlertTriangle, Shield, CheckSquare, Info, Upload,
  Calendar, Timer, Activity, Bot, Map, LocateFixed, Key, Cpu, Sparkles, Database,
  Lock as LockIcon, Sliders, ListChecks, Power, UserCheck, Mic, Scale, Wallet, Megaphone
} from 'lucide-react';

const BusinessSettings: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'profile' | 'support' | 'digital' | 'invoices' | 'notifications' | 'appearance' | 'ai-agent' | 'legal'>('branding');
  const [formData, setFormData] = useState<SystemSettings>(state.settings);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    await db.updateSettings(formData);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'Global Settings Applied', 'Organizational architecture and branding nodes synchronized.');
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: string, parent: 'branding' | 'invoiceBranding') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [slot]: base64
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (slot: string, parent: 'branding' | 'invoiceBranding' = 'branding') => {
    // Current target selection logic
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleFileUpload(e as any, slot, parent);
    input.click();
  };

  const tabs = [
    { id: 'branding', label: 'Brand Identity', icon: ImageIcon },
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'support', label: 'Contact & Support', icon: Headphones },
    { id: 'digital', label: 'Digital Presence', icon: Globe },
    { id: 'invoices', label: 'Invoice Branding', icon: FileText },
    { id: 'notifications', label: 'Message Identity', icon: Bell },
    { id: 'appearance', label: 'UI Parameters', icon: Smartphone },
    { id: 'ai-agent', label: 'AI Agent (Global)', icon: Bot },
    { id: 'legal', label: 'Legal Policies', icon: Scale },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <Building2 className="text-blue-600" size={32} />
            Architecture Command
          </h2>
          <p className="text-slate-500 font-medium">Provision global organizational identity and functional scope control.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <button 
             onClick={() => setShowPreview(!showPreview)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
           >
              <Eye size={18} /> {showPreview ? 'Hide Preview' : 'Live Preview'}
           </button>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 disabled:opacity-50"
           >
             {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
             Authorize Publishing
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-4 flex flex-col gap-1.5 sticky top-24">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-between px-6 py-5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 translate-x-1' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-4"><tab.icon size={18} /> {tab.label}</div>
                  <ArrowRight size={14} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
                </button>
              ))}
           </div>
        </div>

        <div className="xl:col-span-3">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl min-h-[650px] overflow-hidden flex flex-col">
            <div className="p-10 space-y-12 flex-1 overflow-y-auto custom-scrollbar bg-white">
              
              {/* BRANDING TAB */}
              {activeTab === 'branding' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Palette className="text-indigo-600" size={32}/> Brand Identity</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Visual Registry Node</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Trading Name</label>
                      <input type="text" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-indigo-500 transition-all outline-none" value={formData.branding.businessName} onChange={e => setFormData({...formData, branding: {...formData.branding, businessName: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Registry Short Name</label>
                      <input type="text" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-indigo-600 outline-none transition-all" value={formData.branding.shortName} onChange={e => setFormData({...formData, branding: {...formData.branding, shortName: e.target.value}})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['logoLight', 'logoDark', 'logoSquare'].map((slot: any) => (
                      <div key={slot} className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">{slot.replace(/([A-Z])/g, ' $1')}</label>
                        <div onClick={() => triggerUpload(slot)} className="h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group overflow-hidden">
                           {(formData.branding as any)[slot] ? (
                             <img src={(formData.branding as any)[slot]} className="h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                           ) : (
                             <Upload className="text-slate-300" size={32} />
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BUSINESS PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Building2 className="text-indigo-600" size={32}/> Organizational Dossier</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Legal Corporate Name</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.profile.legalName} onChange={e => setFormData({...formData, profile: {...formData.profile, legalName: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Head Office Location</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.profile.headOffice} onChange={e => setFormData({...formData, profile: {...formData.profile, headOffice: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">NTN / Registration Number</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.profile.registrationNumber} onChange={e => setFormData({...formData, profile: {...formData.profile, registrationNumber: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">System Timezone</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.profile.timezone} onChange={e => setFormData({...formData, profile: {...formData.profile, timezone: e.target.value}})}>
                         <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                         <option value="UTC">Universal Time (UTC)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTACT & SUPPORT TAB */}
              {activeTab === 'support' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Headphones className="text-indigo-600" size={32}/> Contact & Support</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Support Email Node</label>
                      <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.support.email} onChange={e => setFormData({...formData, support: {...formData.support, email: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Support Phone Relay</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.support.phone} onChange={e => setFormData({...formData, support: {...formData.support, phone: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">WhatsApp API Node</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.support.whatsapp} onChange={e => setFormData({...formData, support: {...formData.support, whatsapp: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Emergency Hotline</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.support.emergencyPhone} onChange={e => setFormData({...formData, support: {...formData.support, emergencyPhone: e.target.value}})} />
                    </div>
                  </div>
                  <div className="p-8 bg-slate-950 rounded-[2.5rem] space-y-6">
                     <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase text-indigo-400 italic">Support Handshake Hours</h4>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${formData.support.emergencySupport ? 'bg-emerald-50 text-white' : 'bg-slate-700 text-slate-400'}`}>Emergency Link: {formData.support.emergencySupport ? 'Active' : 'Standby'}</div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase">Weekdays Node</label>
                           <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-xs" value={formData.support.workingHoursWeekdays} onChange={e => setFormData({...formData, support: {...formData.support, workingHoursWeekdays: e.target.value}})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase">Weekend Node</label>
                           <input className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-xs" value={formData.support.workingHoursWeekends} onChange={e => setFormData({...formData, support: {...formData.support, workingHoursWeekends: e.target.value}})} />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* DIGITAL PRESENCE TAB */}
              {activeTab === 'digital' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Globe className="text-indigo-600" size={32}/> Digital Presence</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Main Domain Node</label>
                      <input type="url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.digitalPresence.website} onChange={e => setFormData({...formData, digitalPresence: {...formData.digitalPresence, website: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Subscriber Portal Hub</label>
                      <input type="url" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.digitalPresence.portal} onChange={e => setFormData({...formData, digitalPresence: {...formData.digitalPresence, portal: e.target.value}})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].map((social: any) => (
                      <div key={social} className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{social}</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs" value={(formData.digitalPresence as any)[social]} onChange={e => setFormData({...formData, digitalPresence: {...formData.digitalPresence, [social]: e.target.value}})} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INVOICE BRANDING TAB */}
              {activeTab === 'invoices' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><FileText className="text-indigo-600" size={32}/> Fiscal Branding</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Invoice Prefix</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm" value={formData.invoiceBranding.prefix} onChange={e => setFormData({...formData, invoiceBranding: {...formData.invoiceBranding, prefix: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Next Sequence Number</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm" value={formData.invoiceBranding.nextNumber} onChange={e => setFormData({...formData, invoiceBranding: {...formData.invoiceBranding, nextNumber: Number(e.target.value)}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Currency Symbol</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Header Logic</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm" value={formData.invoiceBranding.headerText} onChange={e => setFormData({...formData, invoiceBranding: {...formData.invoiceBranding, headerText: e.target.value}})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Signature Node</label>
                      <div onClick={() => triggerUpload('authorizedSignature', 'invoiceBranding')} className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group overflow-hidden">
                         {formData.invoiceBranding.authorizedSignature ? (
                           <img src={formData.invoiceBranding.authorizedSignature} className="h-full object-contain p-4 grayscale group-hover:grayscale-0 transition-all" />
                         ) : (
                           <FileSignature className="text-slate-300" size={32} />
                         )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Footer Compliance disclaimer</label>
                      <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs h-32 resize-none" value={formData.invoiceBranding.footerDisclaimer} onChange={e => setFormData({...formData, invoiceBranding: {...formData.invoiceBranding, footerDisclaimer: e.target.value}})} />
                    </div>
                  </div>
                </div>
              )}

              {/* MESSAGE IDENTITY TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Bell className="text-indigo-600" size={32}/> Message Identity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">App Notification Sender</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm uppercase" value={formData.notificationBranding.appSenderName} onChange={e => setFormData({...formData, notificationBranding: {...formData.notificationBranding, appSenderName: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email Sender Hub Name</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm uppercase" value={formData.notificationBranding.emailSenderName} onChange={e => setFormData({...formData, notificationBranding: {...formData.notificationBranding, emailSenderName: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">SMS Alpha Sender ID</label>
                      <input type="text" maxLength={11} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm uppercase" value={formData.notificationBranding.smsSenderId} onChange={e => setFormData({...formData, notificationBranding: {...formData.notificationBranding, smsSenderId: e.target.value}})} />
                    </div>
                  </div>
                </div>
              )}

              {/* UI PARAMETERS TAB */}
              {activeTab === 'appearance' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Smartphone className="text-indigo-600" size={32}/> UI Parameters</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'showWallet', label: 'Fiscal Wallet Node', icon: Wallet },
                      { key: 'showEmergencyLoad', label: 'Rescue Credit Protocol', icon: Zap },
                      { key: 'showAIChat', label: 'AI Intelligent Chat', icon: MessageSquare },
                      { key: 'showAICalling', label: 'Autonomous Voice Link', icon: Mic },
                      { key: 'showNews', label: 'Global Broadcast System', icon: Megaphone },
                      { key: 'maintenanceMode', label: 'Global Maintenance Lockdown', icon: Power, dangerous: true },
                    ].map(param => (
                      <div key={param.key} className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all group ${ (formData.appearance as any)[param.key] ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-100 bg-slate-50 opacity-60' }`}>
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${ (formData.appearance as any)[param.key] ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400' }`}>
                               <param.icon size={20}/>
                            </div>
                            <span className="text-xs font-black uppercase text-slate-900">{param.label}</span>
                         </div>
                         <button 
                           onClick={() => setFormData({...formData, appearance: {...formData.appearance, [param.key]: !(formData.appearance as any)[param.key]}})}
                           className={`w-12 h-6 rounded-full relative transition-all ${ (formData.appearance as any)[param.key] ? (param.dangerous ? 'bg-rose-600' : 'bg-emerald-600') : 'bg-slate-300' }`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ (formData.appearance as any)[param.key] ? 'left-7' : 'left-1' }`}></div>
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI AGENT TAB */}
              {activeTab === 'ai-agent' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Bot className="text-indigo-600" size={32}/> Global AI Orchestrator</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Vocal Identity (Voice)</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm uppercase" value={formData.aiCallConfig.voiceName} onChange={e => setFormData({...formData, aiCallConfig: {...formData.aiCallConfig, voiceName: e.target.value as any}})}>
                           <option value="Zephyr">Zephyr (Deep Male)</option>
                           <option value="Kore">Kore (Soft Female)</option>
                           <option value="Charon">Charon (Neutral)</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Vocal Persona</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm uppercase" value={formData.aiCallConfig.persona} onChange={e => setFormData({...formData, aiCallConfig: {...formData.aiCallConfig, persona: e.target.value as any}})}>
                           <option value="Professional">Professional (Registry Standard)</option>
                           <option value="Friendly">Friendly (Casual)</option>
                           <option value="Strict">Strict (Protocol Driven)</option>
                        </select>
                     </div>
                  </div>
                  <div className="p-8 bg-slate-950 rounded-[2.5rem] space-y-6">
                     <h4 className="text-xs font-black uppercase text-indigo-400 italic">Heuristic Office Hours</h4>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase">Commencement</label>
                           <input type="time" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-sm" value={formData.aiCallConfig.officeHours.start} onChange={e => setFormData({...formData, aiCallConfig: {...formData.aiCallConfig, officeHours: {...formData.aiCallConfig.officeHours, start: e.target.value}}})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase">Cease</label>
                           <input type="time" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white text-sm" value={formData.aiCallConfig.officeHours.end} onChange={e => setFormData({...formData, aiCallConfig: {...formData.aiCallConfig, officeHours: {...formData.aiCallConfig.officeHours, end: e.target.value}}})} />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* LEGAL POLICIES TAB */}
              {activeTab === 'legal' && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 uppercase italic tracking-tighter"><Scale className="text-indigo-600" size={32}/> Legal Policy Control</h3>
                     <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Update terms, agreements, and policies used in signup and checkout handshakes.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Master Terms & Conditions</label>
                      <textarea 
                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-xs h-48 outline-none focus:border-indigo-600 resize-none" 
                        value={formData.legal.termsAndConditions} 
                        onChange={e => setFormData({...formData, legal: {...formData.legal, termsAndConditions: e.target.value}})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Signup / Service Agreement</label>
                      <textarea 
                        className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-xs h-48 outline-none focus:border-indigo-600 resize-none" 
                        value={formData.legal.serviceAgreement} 
                        onChange={e => setFormData({...formData, legal: {...formData.legal, serviceAgreement: e.target.value}})} 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Privacy Policy</label>
                        <textarea 
                          className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-xs h-32 outline-none focus:border-indigo-600 resize-none" 
                          value={formData.legal.privacyPolicy} 
                          onChange={e => setFormData({...formData, legal: {...formData.legal, privacyPolicy: e.target.value}})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Refund & Cancellation Policy</label>
                        <textarea 
                          className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-xs h-32 outline-none focus:border-indigo-600 resize-none" 
                          value={formData.legal.refundPolicy} 
                          onChange={e => setFormData({...formData, legal: {...formData.legal, refundPolicy: e.target.value}})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
               <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                 {isSaving ? <RefreshCw className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
                 {isSaving ? 'Synchronizing Cluster...' : 'Publish Global State'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
