
import React, { useState } from 'react';
import { AppState } from '../../types';
import {
   ShieldCheck, ArrowLeft, FileText, Scale,
   Info, ChevronRight, Lock, Globe, AlertTriangle, Activity
} from 'lucide-react';

interface Props {
   state: AppState;
   onBack: () => void;
}

const SubscriberLegalCenter: React.FC<Props> = ({ state, onBack }) => {
   const [activeDoc, setActiveDoc] = useState<'terms' | 'agreement' | 'privacy' | 'refund' | null>(null);
   const legal = state.settings.legal;

   const docs = [
      { id: 'terms', label: 'Terms & Conditions', icon: FileText, content: legal.termsAndConditions },
      { id: 'agreement', label: 'Service Agreement', icon: ShieldCheck, content: legal.serviceAgreement },
      { id: 'privacy', label: 'Privacy Policy', icon: Lock, content: legal.privacyPolicy },
      { id: 'refund', label: 'Refund & Cancellation', icon: Scale, content: legal.refundPolicy },
   ];

   if (activeDoc) {
      const doc = docs.find(d => d.id === activeDoc)!;
      return (
         <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
            <div className="flex items-center gap-4 px-2">
               <button onClick={() => setActiveDoc(null)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 active:scale-90 transition-all shadow-sm">
                  <ArrowLeft size={20} />
               </button>
               <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{doc.label}</h2>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Official Document</p>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-10">
               <div className="prose prose-slate max-w-none">
                  <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase whitespace-pre-wrap italic">
                     {doc.content}
                  </p>
               </div>
               <div className="p-6 bg-slate-900 rounded-[2.5rem] flex items-center justify-between text-white relative overflow-hidden">
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Verified Content</p>
                     <h4 className="text-xl font-black text-indigo-400 uppercase italic">Current Version</h4>
                  </div>
                  <ShieldCheck className="text-white/10 absolute -right-4 -bottom-4" size={100} />
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-24">
         <div className="flex items-center gap-4 px-2">
            <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 active:scale-90 transition-all shadow-sm">
               <ArrowLeft size={20} />
            </button>
            <div>
               <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Legal Center</h2>
               <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Policies & Agreements</p>
            </div>
         </div>

         <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-3 text-indigo-400">
                  <ShieldCheck size={28} />
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Service Agreements</h3>
               </div>
               <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase opacity-80 italic">
                  Review the terms, conditions, and privacy policies governing your account.
               </p>
            </div>
            <Activity className="absolute -right-16 -bottom-16 opacity-5 scale-150 pointer-events-none" size={300} />
         </div>

         <div className="grid grid-cols-1 gap-4">
            {docs.map(doc => (
               <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id as any)}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-500 hover:shadow-xl transition-all text-left flex items-center justify-between group active:scale-[0.98]"
               >
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <doc.icon size={28} />
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{doc.label}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Official Policy</p>
                     </div>
                  </div>
                  <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" size={24} />
               </button>
            ))}
         </div>

         <div className="p-8 bg-amber-50 border border-amber-100 rounded-[3rem] flex items-start gap-6 shadow-sm mx-1">
            <AlertTriangle className="text-amber-600 mt-1 shrink-0" size={28} />
            <div className="flex-1">
               <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1 italic">Compliance Notice</p>
               <p className="text-[9px] text-amber-700 font-bold leading-relaxed uppercase opacity-80">
                  By using our services, you agree to our Master Service Agreement.
               </p>
            </div>
         </div>
      </div>
   );
};

export default SubscriberLegalCenter;
