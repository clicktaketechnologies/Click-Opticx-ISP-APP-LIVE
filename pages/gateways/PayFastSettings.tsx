import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState, PaymentGateway } from '../../types';
import { db } from '../../db';
import { 
  Zap, ArrowLeft, Save, ShieldCheck, Eye, EyeOff, 
  RefreshCw, Layers, ShieldAlert, Globe2, AlertCircle
} from 'lucide-react';

interface Props {
  state: AppState;
  onBack: () => void;
}

const PayFastSettings: React.FC<Props> = ({ state, onBack }) => {
  const gateway = state.settings.paymentGateways.find(g => g.id === 'payfast');

  if (!gateway) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-in zoom-in">
         <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center border border-rose-100 shadow-inner">
            <ShieldAlert size={40} />
         </div>
         <div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">PayFast Node Not Provisioned</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs">
              PayFast is not configured. Please enter your merchant details.
            </p>
         </div>
         <button onClick={onBack} className="px-8 py-3 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Back to Gateways</button>
      </div>
    );
  }

  const [formData, setFormData] = useState<PaymentGateway>({ ...gateway });
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!formData.config.merchantId || !formData.config.merchantKey) {
      setError("Error: Merchant ID and Key are required.");
      return;
    }

    setError(null);
    setIsSaving(true);
    await db.updateGatewayConfig('payfast', formData);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'PayFast Node Ready', 'PayFast API credentials updated in registry.');
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
         <button onClick={onBack} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all active:scale-90">
            <ArrowLeft size={24} />
         </button>
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">PayFast Node Protocol</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Regional Digital Settlement Interface</p>
         </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake">
           <AlertCircle size={20} />
           <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
               <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 leading-none mb-1">Integration Mode</h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase">Toggle Test Mode for Node Validation</p>
                  </div>
                  <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
                    <button onClick={() => setFormData({...formData, sandbox: true})} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.sandbox ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400'}`}>Test</button>
                    <button onClick={() => setFormData({...formData, sandbox: false})} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${!formData.sandbox ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400'}`}>Live</button>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Merchant Integration</h4>
                     <button onClick={() => setShowSecrets(!showSecrets)} className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-2">
                        {showSecrets ? <EyeOff size={14}/> : <Eye size={14}/>} {showSecrets ? 'Hide' : 'Show'} Keys
                     </button>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 italic">Merchant ID</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500 transition-all" value={formData.config.merchantId} onChange={e => updateConfig('merchantId', e.target.value)} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 italic">Merchant Key</label>
                        <input type={showSecrets ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:border-blue-500 transition-all" value={formData.config.merchantKey} onChange={e => updateConfig('merchantKey', e.target.value)} />
                     </div>
                  </div>
               </div>

               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
               >
                  {isSaving ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20}/>}
                  Update Registry Node
               </button>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <Layers size={20} className="text-amber-400" />
                     <h3 className="text-xs font-black uppercase tracking-widest italic">Allowed Usage</h3>
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
                          className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${active ? 'bg-white/10 border-amber-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                         >
                            <span className="text-[10px] font-black uppercase tracking-widest">{usage}</span>
                            {active ? <ShieldCheck size={14} className="text-amber-400"/> : <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>}
                         </button>
                       );
                     })}
                  </div>
               </div>
               <Globe2 className="absolute -right-10 -bottom-10 opacity-5" size={200} />
            </div>

            <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-4">
               <ShieldAlert className="text-amber-600 mt-1 shrink-0" size={20} />
               <p className="text-[9px] text-amber-700 font-bold leading-relaxed uppercase opacity-80">
                  PayFast requires valid Merchant credentials. Ensure <strong>Signature Passphrase</strong> is set in your PayFast dashboard to match registry security rules.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PayFastSettings;

