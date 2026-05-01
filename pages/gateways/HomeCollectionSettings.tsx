import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState, PaymentGateway } from '../../types';
import { db } from '../../db';
import { 
  Landmark, ArrowLeft, Save, ShieldCheck, RotateCw, 
  MapPin, DollarSign, ListChecks, Smartphone, Globe, AlertCircle
} from 'lucide-react';

interface Props {
  state: AppState;
  onBack: () => void;
}

const HomeCollectionSettings: React.FC<Props> = ({ state, onBack }) => {
  const gateway = state.settings.paymentGateways.find(g => g.id === 'home')!;
  const [formData, setFormData] = useState<PaymentGateway>({ ...gateway });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await db.updateGatewayConfig('home', formData);
    setTimeout(() => {
      setIsSaving(false);
      db.logNotification('all', 'success', 'Field Node Ready', 'Home collection protocol rules updated.');
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
            <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Field Agent (Home Collection)</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Manual Asset Recovery Management</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Service Fee (Rs.)</label>
                    <div className="relative">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input 
                        type="number"
                        className="w-full pl-10 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg focus:border-blue-500 outline-none transition-all" 
                        value={formData.config.fee} 
                        onChange={e => updateConfig('fee', e.target.value)} 
                       />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Agent Instructions</label>
                  <textarea 
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-xs h-32 resize-none outline-none focus:border-blue-600 uppercase"
                    placeholder="Instructions for subscribers requesting home pickup..."
                    value={formData.instructions || ''}
                    onChange={e => setFormData({...formData, instructions: e.target.value})}
                  />
               </div>

               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Allowed Payment Methods</h4>
                  <div className="grid grid-cols-2 gap-4">
                     {['packages', 'wallet', 'emergency', 'invoices'].map((usage: any) => {
                       const active = formData.allowedFor.includes(usage);
                       return (
                         <button 
                          key={usage}
                          onClick={() => {
                            const next = active ? formData.allowedFor.filter(u => u !== usage) : [...formData.allowedFor, usage];
                            setFormData({...formData, allowedFor: next});
                          }}
                          className={`p-6 rounded-[2rem] border-2 text-left flex items-center justify-between transition-all ${active ? 'bg-blue-50 border-blue-600 shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                         >
                            <span className="text-[11px] font-black uppercase tracking-widest">{usage}</span>
                            <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${active ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                               {active && <ShieldCheck size={14} className="text-white"/>}
                            </div>
                         </button>
                       );
                     })}
                  </div>
               </div>

               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
               >
                  {isSaving ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20}/>}
                  Authorize Field Protocol
               </button>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10 space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-tight italic text-green-400">Logistics Control</h3>
                  <ul className="space-y-4">
                     {[
                       { label: 'Area Specific Fee', icon: MapPin },
                       { label: 'Agent Verification', icon: ListChecks },
                       { label: 'Immediate Ledger Update', icon: RotateCw }
                     ].map(r => (
                       <li key={r.label} className="flex items-center gap-4 text-slate-400">
                          <r.icon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                       </li>
                     ))}
                  </ul>
               </div>
               <Globe className="absolute -right-16 -bottom-16 opacity-5" size={200} />
            </div>
         </div>
      </div>
    </div>
  );
};

export default HomeCollectionSettings;

