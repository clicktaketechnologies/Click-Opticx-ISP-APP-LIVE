
import React, { useState, useMemo } from 'react';
import { ISPUser, AppState, TopupRequest } from '../../types';
import { db } from '../../db';
import {
   Wallet, Plus, CreditCard, Banknote, Clock,
   History, ShieldCheck, X, ChevronRight, AlertTriangle, CheckCircle,
   Zap, ShieldAlert
} from 'lucide-react';
import SubscriberActivationFlow from './SubscriberActivationFlow';
import PaymentHubModal from './PaymentHubModal';

interface Props {
   user: ISPUser;
   state: AppState;
   pendingTopups: TopupRequest[];
}

const SubscriberWallet: React.FC<Props> = ({ user, state, pendingTopups }) => {
   const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'connection' | 'registry' | 'audit'>('personal');
   const [showFlow, setShowFlow] = useState(false);
   const [flowMode, setFlowMode] = useState<'topup' | 'repay' | 'emergency'>('topup');
   const [showManualTopup, setShowManualTopup] = useState(false);

   const activeEL = state.emergencyLoads.find(l => l.userId === user.id && !l.repaid);
   const isBalanceLow = user.balance < 500 && !activeEL;

   const handleOpenFlow = (mode: 'topup' | 'repay' | 'emergency') => {
      setFlowMode(mode);
      setShowFlow(true);
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-24">
         {/* Balance Hub */}
         <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all duration-700 ${activeEL ? 'bg-orange-600' : isBalanceLow ? 'bg-rose-600' : 'bg-slate-900'}`}>
            <div className="relative z-10 space-y-12">
               <div className="flex justify-between items-start">
                  <div className="space-y-2">
                     <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em]">Available Balance</p>
                     <h3 className="text-6xl font-black italic tracking-tighter">Rs. {(user.balance || 0).toLocaleString()}</h3>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md`}>
                     {activeEL ? 'Advance Active' : isBalanceLow ? 'Topup Needed' : 'Account Verified'}
                  </div>
               </div>

               {activeEL && (
                  <div className="p-6 bg-black/20 rounded-3xl border border-white/10 space-y-3 animate-in slide-in-from-bottom-2">
                     <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Emergency Advance</p>
                        <span className="text-sm font-black italic">Rs. {(activeEL.amount || 0).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Due Date</p>
                        <span className="text-[10px] font-black uppercase">{new Date(activeEL.expiryTimestamp).toLocaleDateString()}</span>
                     </div>
                  </div>
               )}

               <div className="flex gap-4">
                  {activeEL ? (
                     <button
                        onClick={() => handleOpenFlow('repay')}
                        className="flex-1 py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        <ShieldCheck size={18} strokeWidth={4} /> Pay Advance
                     </button>
                  ) : (
                     <>
                        <button
                           onClick={() => setShowManualTopup(true)}
                           className="flex-1 py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                           <Plus size={18} strokeWidth={4} /> Load Credit
                        </button>
                        {!activeEL && (
                           <button
                              onClick={() => handleOpenFlow('emergency')}
                              className="px-6 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
                              title="Get Emergency Load"
                           >
                              <Zap size={20} fill="currentColor" />
                           </button>
                        )}
                     </>
                  )}
               </div>
            </div>
            <Wallet className="absolute -right-8 -bottom-8 opacity-5 scale-150" size={240} />
         </div>

         {/* Overdue Alert */}
         {activeEL && new Date(activeEL.expiryTimestamp) < new Date() && (
            <div className="bg-red-50 border-2 border-red-200 p-8 rounded-[3rem] flex items-start gap-6 animate-pulse">
               <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                  <ShieldAlert size={28} />
               </div>
               <div>
                  <p className="text-xs font-black text-red-900 uppercase tracking-widest mb-1">Repayment Overdue</p>
                  <p className="text-[10px] text-red-700 font-bold leading-relaxed uppercase">
                     The 72-hour emergency advance has expired. Pay the Rs. {activeEL.amount} balance immediately to prevent service suspension.
                  </p>
               </div>
            </div>
         )}

         {/* History / Pulse */}
         <div className="space-y-5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Transaction History</h4>
            <div className="space-y-3">
               {pendingTopups.map(req => (
                  <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-orange-100 flex items-center justify-between group shadow-sm">
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-500 border border-orange-100">
                           <Clock size={22} />
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Topup: Rs. {req.amount}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{req.paymentMethod} • Verifying</p>
                        </div>
                     </div>
                     <button onClick={() => db.cancelTopupRequest(req.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><X size={20} /></button>
                  </div>
               ))}
               {state.ledger.filter(l => l.userId === user.id).slice(0, 15).map(l => (
                  <div key={l.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
                     <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${l.type === 'Credit' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                           {l.type === 'Credit' ? <CheckCircle size={22} /> : <History size={22} />}
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[180px] md:max-w-full">{l.description}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(l.timestamp).toLocaleDateString()} • Method: {l.method || 'System'}</p>
                        </div>
                     </div>
                     <p className={`text-lg font-black italic tracking-tighter ${l.type === 'Credit' ? 'text-green-600' : 'text-slate-900'}`}>
                        {l.type === 'Credit' ? '+' : ''}{l.amount}
                     </p>
                  </div>
               ))}
            </div>
         </div>

         {showFlow && (
            <SubscriberActivationFlow
               user={user} state={state}
               isRepayment={flowMode === 'repay'}
               onClose={() => setShowFlow(false)}
               onSuccess={() => setShowFlow(false)}
            />
         )}

         <PaymentHubModal
            user={user}
            state={state}
            isOpen={showManualTopup}
            onClose={() => setShowManualTopup(false)}
            onSuccess={() => setShowManualTopup(false)}
         />
      </div>
   );
};

export default SubscriberWallet;

