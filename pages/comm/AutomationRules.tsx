import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState } from 'react';
import { AppState, CommunicationAutomationRule } from '../../types';
import { db } from '../../db';
import { 
  Zap, Plus, Search, Filter, Code2, 
  RefreshCw, Power, CheckCircle, X, Save,
  ArrowRight, Activity, ShieldAlert, Layers, Clock,
  Smartphone, Mail, MessageSquare, Info, ShieldCheck, ChevronRight, Trash2
} from 'lucide-react';

const AutomationRules: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<CommunicationAutomationRule>>({
    name: '',
    trigger: 'Package_Expiry',
    condition: 'days_remaining <= 3',
    enabled: true,
    actions: [{ type: 'Email', templateId: state.emailTemplates[0]?.id || '' }]
  });

  const rules = state.commAutomationRules;

  const handleSave = async () => {
    if (!formData.name) return;
    setIsSaving(true);
    await db.saveCommRule(formData);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Zap className="text-amber-500" size={32} />
            Automatic Messages
          </h2>
          <p className="text-slate-500 font-medium">Set up automatic messages that send when certain things happen.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> + Add New Rule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {rules.map(rule => (
            <div key={rule.id} className={`bg-white rounded-[3rem] p-8 border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-xl ${rule.enabled ? 'border-amber-100' : 'border-slate-50 opacity-60 grayscale'}`}>
               <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:rotate-6 ${rule.enabled ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                     <Code2 size={28}/>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{rule.name}</h3>
                        <div className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                     </div>
                     <div className="flex flex-wrap items-center gap-4">
                        <span className="px-2 py-1 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">WHEN: {rule.trigger.replace('_', ' ')}</span>
                        <span className="text-slate-300 font-black">»</span>
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest">CONDITION: {rule.condition}</span>
                        <span className="text-slate-300 font-black">»</span>
                        <div className="flex gap-1">
                           {rule.actions.map((a, i) => (
                             <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                {a.type === 'Email' ? <Mail size={10}/> : <Smartphone size={10}/>} {a.type}
                             </span>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-3 shrink-0">
                  <button 
                   onClick={() => db.saveCommRule({...rule, enabled: !rule.enabled})}
                   className={`w-14 h-7 rounded-full relative transition-all duration-300 ${rule.enabled ? 'bg-emerald-50 shadow-emerald-200 shadow-lg' : 'bg-slate-300'}`}
                  >
                     <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${rule.enabled ? 'left-8' : 'left-1'}`}></div>
                  </button>
                  <button className="p-3.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100">
                     <ChevronRight size={20}/>
                  </button>
               </div>
            </div>
         ))}
         
         {rules.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
               <Zap className="text-slate-100 mb-6" size={80} />
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">No Automation Rules</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Click "Add New Rule" to start setup.</p>
            </div>
         )}
      </div>

      <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl">
         <div className="relative z-10 max-w-xl space-y-4">
            <div className="flex items-center gap-4 text-amber-400">
               <ShieldAlert size={28} />
               <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none">System Safety Info</h3>
            </div>
            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase opacity-80 italic">
               Automatic messages are handled safely by the system. They won't affect billing or main user data.
            </p>
         </div>
         <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <Zap size={28} fill="currentColor"/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Add New Rule</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Setup Automatic Message</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Rule Name</label>
                       <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-amber-500 transition-all" placeholder="e.g. 3 Days Before Expiry" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">When this happens...</label>
                          <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase outline-none focus:border-amber-500" value={formData.trigger} onChange={e => setFormData({...formData, trigger: e.target.value as any})}>
                             <option value="Package_Expiry">Package is about to expire</option>
                             <option value="Payment_Failed">Payment fails</option>
                             <option value="Emergency_Load_Active">Emergency credit used</option>
                             <option value="Outage_Detected">Network issue detected</option>
                             <option value="Signup_Approved">New user signs up</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Specific Condition</label>
                          <input className="w-full p-4 bg-slate-950 text-amber-400 font-mono text-xs rounded-2xl border-none shadow-inner" placeholder="e.g. days_left <= 3" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6 pt-6 border-t border-slate-50">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Then do this...</h4>
                    <div className="grid grid-cols-1 gap-3">
                       {formData.actions?.map((action, idx) => (
                         <div key={idx} className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border shadow-inner text-indigo-600">
                                  {action.type === 'Email' ? <Mail size={18}/> : <Smartphone size={18}/>}
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase">Send {action.type}</p>
                                  <select className="bg-transparent font-black text-[11px] uppercase outline-none text-slate-900" value={action.templateId} onChange={e => {
                                     const next = [...(formData.actions || [])];
                                     next[idx].templateId = e.target.value;
                                     setFormData({...formData, actions: next});
                                  }}>
                                     {state.emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                               </div>
                            </div>
                            <button className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex items-start gap-4">
                    <Info className="text-amber-600 mt-1 shrink-0" size={24} />
                    <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed tracking-tighter">
                       Rules run in the background. The system checks for these conditions every 15 minutes.
                    </p>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                 <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] py-5 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSaving ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18}/>}
                    Activate Rule
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AutomationRules;
