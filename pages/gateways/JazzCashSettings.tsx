
import React, { useState } from 'react';
import { AppState, PaymentGateway } from '../../types';
import { db } from '../../db';
import { 
  Smartphone, ArrowLeft, Save, ShieldCheck, RefreshCw, 
  SmartphoneIcon, Lock, Key, Eye, EyeOff, Activity, CheckCircle, ShieldAlert
} from 'lucide-react';

interface Props {
  state: AppState;
  onBack: () => void;
}

const JazzCashSettings: React.FC<Props> = ({ state, onBack }) => {
  const gateway = state.settings.paymentGateways.find(g => g.id === 'jazzcash');

  if (!gateway) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-in zoom-in">
         <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center border border-rose-100 shadow-inner">
            <ShieldAlert size={40} />
         </div>
         <h3 className="text-xl font-black text-slate-900 uppercase italic">JazzCash Node Not Found</h3>
         <button onClick={onBack} className="px-8 py-3 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Back</button>
      </div>
    );
  }

  const [formData, setFormData] = useState<PaymentGateway>({ ...gateway });
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await db.updateGatewayConfig('jazzcash', formData);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'JazzCash Synced', 'Mobile wallet API tokens updated in node registry.');
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
         <button onClick={onBack} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-rose-600 transition-all active:scale-90">
            <ArrowLeft size={24} />
         </button>
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">JazzCash Node</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Mobile Wallet Digital Handshake Layer</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Merchant Identity</label>
                     <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm" value={formData.config.merchantId} onChange={e => updateConfig('merchantId', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Gateway Password</label>
                     <input type={showSecrets ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm" value={formData.config.password} onChange={e => updateConfig('password', e.target.value)} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Integrity Salt Token</label>
                  <div className="relative">
                     <input type={showSecrets ? 'text' : 'password'} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-lg focus:border-rose-500 transition-all outline-none" value={formData.config.salt} onChange={e => updateConfig('salt', e.target.value)} />
                     <button onClick={() => setShowSecrets(!showSecrets)} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600 transition-all">
                        {showSecrets ? <EyeOff size={20}/> : <Eye size={20}/>}
                     </button>
                  </div>
               </div>

               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
               >
                  {isSaving ? <RefreshCw className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                  Authorize JazzCash Node
               </button>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] italic text-rose-400">Usage Mapping</h3>
                  <div className="space-y-2">
                     {['packages', 'wallet', 'emergency', 'invoices'].map((usage: any) => {
                       const active = formData.allowedFor.includes(usage);
                       return (
                         <button key={usage} onClick={() => {
                            const next = active ? formData.allowedFor.filter(u => u !== usage) : [...formData.allowedFor, usage];
                            setFormData({...formData, allowedFor: next});
                         }} className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${active ? 'bg-white/10 border-rose-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{usage}</span>
                            {active && <CheckCircle size={14} className="text-rose-500"/>}
                         </button>
                       );
                     })}
                  </div>
               </div>
               <Activity className="absolute -right-8 -bottom-8 opacity-5 scale-150" size={140} />
            </div>
         </div>
      </div>
    </div>
  );
};

export default JazzCashSettings;
