import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

import React, { useState } from 'react';
import { X, ShieldCheck, Wallet, ArrowRight, CheckCircle, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { db } from '../../db';
import { ISPUser } from '../../types';

interface Props {
  onClose: () => void;
  onWithdraw: () => void;
}

const ReferralWithdrawalRequest: React.FC<Props> = ({ onClose, onWithdraw }) => {
  const user = db.getState().currentUser as ISPUser;
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setStep('processing');
    const res = await db.submitWithdrawalRequest(user.id);
    setIsProcessing(false);
    if (res.success) {
      setStep('success');
    } else {
      alert(res.message);
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[800] flex items-center justify-center p-6">
      <div className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300">
        
        {step === 'form' && (
          <div className="p-10 space-y-10">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Withdrawal Protocol</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fiscal Conversion Handshake</p>
               </div>
               <button onClick={onClose} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="space-y-6 text-center">
               <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Payout Value</p>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">Rs. {(user.referralPoints * 0.01).toLocaleString()}</h2>
                  <p className="text-[10px] text-indigo-600 font-black uppercase mt-3 tracking-widest">Points: {user.referralPoints.toLocaleString()}</p>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-2xl text-blue-700 text-left">
                     <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tighter opacity-80">
                        Conversion requires administrator clearance. Funds will be provisioned to your Wallet Registry once the audit node confirms referred node activations.
                     </p>
                  </div>
                  <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-2xl text-amber-700 text-left">
                     <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold uppercase leading-relaxed tracking-tighter opacity-80">
                        Points will be burned immediately upon submission. Rejection will trigger a registry rollback and point refund.
                     </p>
                  </div>
               </div>
            </div>

            <div className="flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
               <button onClick={handleConfirm} className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl active:scale-95 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">
                  Authorize Conversion <ArrowRight size={16} />
               </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-24 text-center space-y-8 animate-pulse">
            <Mini5GMicroLoader size={64} />
            <div className="space-y-1">
               <h4 className="text-xl font-black uppercase italic tracking-tighter">Registry Syncing...</h4>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Submitting Payout Request</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-16 text-center space-y-10 animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle size={56} />
             </div>
             <div className="space-y-3">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">Request - Payment Dueed</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed px-4">
                  Conversion protocol initiated. An administrator will audit the linked nodes. You will be notified via the alert relay upon clearance.
                </p>
             </div>
             <button onClick={() => { onWithdraw(); onClose(); }} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-[0.2em]">
                Back to List
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralWithdrawalRequest;
