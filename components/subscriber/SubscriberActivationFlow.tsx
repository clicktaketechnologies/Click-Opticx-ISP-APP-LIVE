import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, ISPUser, Package, PaymentMethod, PaymentGateway, PaymentMethodUsage } from '../../types';
import { db } from '../../db';
import { 
  X, ShieldCheck, CreditCard, Banknote, Landmark, Wallet, Zap,
  CheckCircle, ChevronRight, Loader2, AlertTriangle, ShieldAlert, Globe, Smartphone,
  ArrowRight, Clock
} from 'lucide-react';
import Modal from '../shared/Modal';

interface Props {
  user: ISPUser;
  state: AppState;
  packageId?: string;
  isRepayment?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SubscriberActivationFlow: React.FC<Props> = ({ user, state, packageId, isRepayment, onClose, onSuccess }) => {
  const [step, setStep] = useState<'method' | 'confirm' | 'processing' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const appearance = state.settings.appearance;
  const pendingReq = db.getPendingUniversalRequest(user.id);
  const activeEL = state.emergencyLoads.find(l => l.userId === user.id && !l.repaid);

  const selectedPkgId = packageId || user.packageId || (state.packages[0]?.id);
  const selectedPkg = state.packages.find(p => p.id === selectedPkgId);
  const taxMultiplier = state.settings.enableTax ? (1 + (state.settings.autoTaxPercentage / 100)) : 1;
  const total = isRepayment ? 2500 : (selectedPkg ? Math.round(selectedPkg.price * taxMultiplier) : 0);

  const enabledGateways = useMemo(() => {
    let requiredUsage: PaymentMethodUsage = 'packages';
    if (isRepayment) requiredUsage = 'emergency';
    else if (!packageId) requiredUsage = 'wallet';

    return state.settings.paymentGateways
      .filter(g => g.enabled && g.allowedFor.includes(requiredUsage))
      .sort((a,b) => a.priority - b.priority);
  }, [state.settings.paymentGateways, packageId, isRepayment]);

  const canUseEmergency = useMemo(() => {
    return !activeEL && user.creditScore >= 600 && total <= state.settings.globalEmergencyLimit && !isRepayment;
  }, [activeEL, user.creditScore, total, state.settings.globalEmergencyLimit, isRepayment]);

  const handleMethodSelect = (m: PaymentMethod) => {
    setSelectedMethod(m);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedMethod) return;
    setStep('processing');
    setIsProcessing(true);

    let res;
    if (isRepayment) {
       res = await db.settleEmergencyLoad(user.id, selectedMethod);
    } else if (selectedMethod === 'Emergency Load') {
       res = await db.requestEmergencyLoad(user.id, selectedPkg?.id);
    } else {
       res = await db.submitUniversalActivation(user.id, selectedPkg?.id || '', selectedMethod);
    }
    
    setIsProcessing(false);
    if (res && res.success) {
      setStep('success');
    } else {
      alert(res?.message || "Protocol Failure");
      setStep('method');
    }
  };

  const handleCancelPending = async () => {
    if (pendingReq) {
      await db.cancelUniversalRequest(pendingReq.id);
      setStep('method');
      setSelectedMethod(null);
    }
  };

  const getGatewayIcon = (id: string) => {
    switch(id) {
      case 'stripe': return <Globe className="text-white" size={24} />;
      case 'paypal': return <CreditCard className="text-white" size={24} />;
      case 'easypaisa': case 'jazzcash': return <Smartphone className="text-white" size={24} />;
      case 'cash': return <Banknote className="text-white" size={24} />;
      case 'bank': return <Landmark className="text-white" size={24} />;
      default: return <CreditCard className="text-white" size={24} />;
    }
  };

  const getGatewayColor = (id: string) => {
    switch(id) {
      case 'stripe': return 'bg-blue-600';
      case 'easypaisa': return 'bg-green-600';
      case 'jazzcash': return 'bg-rose-600';
      case 'cash': return 'bg-slate-900';
      default: return 'bg-blue-600';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isRepayment ? "Repayment Protocol" : "Activate Package"}
      type="form"
      icon={isRepayment ? <Clock size={24} className="text-white" /> : <Zap size={24} className="text-white" fill="currentColor" />}
      maxWidth="max-w-lg"
    >
      {pendingReq && step === 'method' && !isRepayment ? (
        <div className="space-y-8 animate-in fade-in duration-300 py-6">
          <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto border border-orange-100 shadow-inner">
             <Clock size={40} className="animate-spin-slow" />
          </div>
          <div className="space-y-3 px-4 text-center">
             <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">REQUEST UNDER VERIFICATION</h3>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                You already have an active handshake ({'paymentMethod' in pendingReq ? (pendingReq as any).paymentMethod : 'Emergency Protocol'}) in progress. Duplicate activation protocols are restricted.
             </p>
          </div>
          <div className="flex gap-4">
             <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Close</button>
             <button onClick={handleCancelPending} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-orange-100">Cancel Pending Request</button>
          </div>
        </div>
      ) : (
        <div className="min-h-[400px]">
          {step === 'method' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 gap-3">
                 {!isRepayment && appearance.showWallet && (
                   <button 
                    onClick={() => handleMethodSelect(PaymentMethod.TOPUP_BALANCE)} 
                    disabled={user.balance < total}
                    className={`w-full p-6 border-2 transition-all flex items-center justify-between group rounded-3xl shrink-0 shadow-sm ${user.balance >= total ? 'bg-green-50 border-transparent hover:border-green-500' : 'bg-slate-50 border-transparent grayscale opacity-50 cursor-not-allowed'}`}
                   >
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${user.balance >= total ? 'bg-green-600 text-white' : 'bg-slate-300 text-white'}`}><Wallet size={24}/></div>
                         <div className="text-left"><p className="text-xs font-black uppercase text-slate-900">Wallet Balance</p><p className="text-[9px] text-slate-400 font-bold uppercase">Available: Rs. {(user.balance || 0).toLocaleString()}</p></div>
                      </div>
                      {user.balance >= total && <ChevronRight size={18} className="text-green-300 group-hover:translate-x-1 transition-transform" />}
                   </button>
                 )}

                 {canUseEmergency && appearance.showEmergencyLoad && (
                   <button onClick={() => handleMethodSelect(PaymentMethod.EMERGENCY_LOAD)} className="w-full p-6 bg-rose-50 border-2 border-transparent hover:border-rose-500 rounded-3xl flex items-center justify-between group transition-all shrink-0 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg`}><Zap size={24} fill="currentColor"/></div>
                         <div className="text-left"><p className="text-xs font-black uppercase text-rose-900 italic">Emergency Load (Rescue)</p><p className="text-[9px] text-rose-400 font-bold uppercase">Instant Credit Handshake</p></div>
                      </div>
                      <ChevronRight size={18} className="text-rose-300 group-hover:translate-x-1 transition-transform" />
                   </button>
                 )}

                 {enabledGateways.length > 0 && (
                   <div className="pt-4 border-t border-slate-50 mt-2 space-y-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">{isRepayment ? 'Repayment Options' : 'Gateway Handshake Options'}</p>
                      {enabledGateways.map(gateway => (
                        <button 
                          key={gateway.id} 
                          onClick={() => handleMethodSelect(gateway.name as PaymentMethod)} 
                          className="w-full p-6 bg-slate-50 border-2 border-slate-100 hover:border-blue-500 rounded-3xl flex items-center justify-between group transition-all shrink-0 shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 ${getGatewayColor(gateway.id)} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                                {getGatewayIcon(gateway.id)}
                             </div>
                             <div className="text-left">
                                <p className="text-xs font-black uppercase text-slate-900">{gateway.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{gateway.type} node</p>
                             </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                   </div>
                 )}
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300 py-4">
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 shadow-inner">
                    <ShieldCheck size={40} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Authorize Handshake</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase leading-relaxed px-6">
                    System will initialize activation for <span className="text-blue-600 font-black">{selectedPkg?.name || 'Rescue Credit'}</span> via <span className="text-slate-900 font-black">{selectedMethod}</span>.
                 </p>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 space-y-4 shadow-2xl">
                 <div className="flex justify-between items-center text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-white/5 pb-4">
                    <span className="text-slate-400">Service Tier</span>
                    <span className="text-white">{selectedPkg?.name || 'Manual Adjustment'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handshake Total</span>
                    <span className="text-3xl font-black text-blue-400 tracking-tighter italic">Rs. {total.toLocaleString()}</span>
                 </div>
              </div>

              {selectedMethod === 'Emergency Load' && (
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                   <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-0.5" />
                   <p className="text-[9px] text-rose-800 font-bold uppercase leading-relaxed">
                      Rescue protocol creates an immediate debt entry in your fiscal registry. Settle within 72 hours to prevent automated node suspension.
                   </p>
                </div>
              )}

              <div className="flex gap-4">
                 <button onClick={() => setStep('method')} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Back</button>
                 <button onClick={handleConfirm} className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl active:scale-95 transition-all uppercase text-[10px] tracking-widest">Confirm Activation</button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-20 text-center space-y-6">
              <Mini5GMicroLoader size={64} />
              <div className="space-y-1">
                 <h4 className="text-xl font-black uppercase italic tracking-tighter">Syncing Node...</h4>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Updating Persistent Registry</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-10 text-center space-y-10 animate-in zoom-in duration-500">
               <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce border-4 border-green-100">
                  <CheckCircle size={56} />
               </div>
               <div className="space-y-3">
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900">
                     {selectedMethod === 'Emergency Load' ? 'RESCUE ACTIVE' : 'REQUEST LOGGED'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed px-4">
                     {selectedMethod === 'Emergency Load' 
                       ? 'Emergency Link established. Your internet path has been re-authorized for the standard billing cycle.'
                       : 'Your request has been published to the authority registry. An administrator will verify the protocol within the SLA window.'}
                  </p>
               </div>
               
               <button onClick={() => { onSuccess(); onClose(); }} className="w-full py-6 bg-slate-900 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2">
                  Acknowledge Handshake <ArrowRight size={18} />
               </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default SubscriberActivationFlow;

