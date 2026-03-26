import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState, PaymentGateway } from '../../types';
import { db } from '../../db';
import { 
  Globe, ArrowLeft, Save, ShieldCheck, Eye, EyeOff, 
  RefreshCw, Layers, ShieldAlert, Zap, Globe2, CreditCard, AlertCircle
} from 'lucide-react';

interface Props {
  state: AppState;
  onBack: () => void;
}

const StripeSettings: React.FC<Props> = ({ state, onBack }) => {
  const gateway = state.settings.paymentGateways.find(g => g.id === 'stripe')!;
  const [formData, setFormData] = useState<PaymentGateway>({ ...gateway });
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!formData.config.publishableKey || !formData.config.secretKey) {
      setError("Error: API Publishable and Secret Keys are required.");
      return;
    }

    setError(null);
    setIsSaving(true);
    await db.updateGatewayConfig('stripe', formData);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'Stripe Node Ready', 'Production API credentials published to registry.');
    }, 800);
  };

  const updateConfig = (key: string, val: string) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: val }
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center gap-6">
         <button onClick={onBack} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 transition-all active:scale-90">
            <ArrowLeft size={24} />
         </button>
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Stripe Node Protocol</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Authorized Secure Payment Layer</p>
         </div>
      </div>

      {error && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-in shake">
           <AlertCircle size={24} />
           <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
               <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 leading-none mb-1">Environment</h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase">Toggle Sandbox vs Production</p>
                  </div>
                  <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
                    <button onClick={() => setFormData({...formData, sandbox: true})} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.sandbox ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'}`}>Test Node</button>
                    <button onClick={() => setFormData({...formData, sandbox: false})} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!formData.sandbox ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Live Link</button>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">API Tokens</h4>
                     <button onClick={() => setShowSecrets(!showSecrets)} className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-2">
                        {showSecrets ? <EyeOff size={14}/> : <Eye size={14}/>} {showSecrets ? 'Mask Tokens' : 'Reveal Tokens'}
                     </button>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 italic">Publishable Key</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-indigo-600 transition-all" value={formData.config.publishableKey} onChange={e => updateConfig('publishableKey', e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 italic">Secret Security Key</label>
                        <input type={showSecrets ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-indigo-600 transition-all" value={formData.config.secretKey} onChange={e => updateConfig('secretKey', e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 italic">Webhook Signing Secret</label>
                        <input type={showSecrets ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-indigo-600 transition-all" value={formData.config.webhookSecret} onChange={e => updateConfig('webhookSecret', e.target.value)} />
                     </div>
                  </div>
               </div>

               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
               >
                  {isSaving ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20}/>}
                  Save Settings
               </button>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <Zap size={20} className="text-blue-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest italic">Node Scope</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                     {['packages', 'wallet', 'emergency', 'invoices'].map((usage: any) => {
                       const active = formData.allowedFor.includes(usage);
                       return (
                         <button 
                          key={usage}
                          onClick={() => {
                            const next = active ? formData.allowedFor.filter(u => u !== usage) : [...formData.allowedFor, usage];
                            setFormData({...formData, allowedFor: next});
                          }}
                          className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${active ? 'bg-white/10 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                         >
                            <span className="text-[10px] font-black uppercase tracking-widest">{usage}</span>
                            {active ? <ShieldCheck size={14} className="text-blue-400"/> : <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>}
                         </button>
                       );
                     })}
                  </div>
               </div>
               <Globe2 className="absolute -right-10 -bottom-10 opacity-5" size={200} />
            </div>

            <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
               <ShieldAlert className="text-blue-600 mt-1 shrink-0" size={20} />
               <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase opacity-80">
                  Stripe Link requires webhook configuration in the Stripe Dashboard pointing to: <strong>https://api.clickopticx.com/webhooks/stripe</strong>. Enable 'checkout.session.completed' events for automatic node activation.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StripeSettings;
