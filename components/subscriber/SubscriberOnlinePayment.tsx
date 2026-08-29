
import React, { useState, useMemo } from 'react';
import { AppState, ISPUser, Package, PaymentGateway } from '../../types';
import { db } from '../../db';
import {
   Globe, CreditCard, ShieldCheck, Zap, ArrowRight, Loader2,
   Smartphone, Landmark, CheckCircle, AlertTriangle, AlertCircle,
   RotateCw, ShieldAlert, ArrowLeft, ExternalLink, Info, Banknote
} from 'lucide-react';

interface Props {
   user: ISPUser;
   state: AppState;
   onSuccess: () => void;
}

const SubscriberOnlinePayment: React.FC<Props> = ({ user, state, onSuccess }) => {
   const [selectedPkgId, setSelectedPkgId] = useState(user.packageId || '');
   const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [handshakeStep, setHandshakeStep] = useState<string>('');
   const [paymentError, setPaymentError] = useState<{ msg: string; type: 'config' | 'declined' } | null>(null);

   const enabledGateways = useMemo(() =>
      state.settings.paymentGateways.filter(g => g.enabled && g.type !== 'offline'),
      [state.settings.paymentGateways]);

   const selectedPkg = state.packages.find(p => p.id === selectedPkgId);
   const taxMultiplier = state.settings.enableTax ? (1 + (state.settings.autoTaxPercentage / 100)) : 1;
   const total = selectedPkg ? Math.round(selectedPkg.price * taxMultiplier) : 0;

   const handleInstantPay = async () => {
      if (!selectedPkgId || !selectedGateway) return;

      setIsProcessing(true);
      setPaymentError(null);

      try {
         const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'https://click-opticx-isp-app-live.onrender.com';
         
         let gatewaysToTry = [selectedGateway, ...enabledGateways.filter(g => g.id !== selectedGateway.id && g.type === 'online')];
         let lastError: any = null;
         let success = false;
         let finalGateway = selectedGateway;
         let transactionId = '';

         for (const gateway of gatewaysToTry) {
             try {
                setHandshakeStep(`Initializing TLS tunnel to ${gateway.name}...`);
                
                const response = await fetch(`${backendUrl}/api/payments/process`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                      gatewayId: gateway.id,
                      gatewayName: gateway.name,
                      config: gateway.config,
                      amount: total,
                      userId: user.id,
                      packageId: selectedPkgId
                   })
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                   throw new Error(result.message || 'Unknown registry error from backend.');
                }

                if (result.checkoutUrl) {
                   setHandshakeStep('Redirecting to Secure Gateway...');
                   window.location.href = result.checkoutUrl;
                   return;
                }

                // If no checkoutUrl, assume offline/manual gateway logic
                success = true;
                finalGateway = gateway;
                transactionId = result.transactionId || `TRX-${Math.random().toString(36).substring(7)}`;
                break;
             } catch (err: any) {
                lastError = err;
                setHandshakeStep(`Failover protocol engaging... Rerouting via secondary nodes`);
                await new Promise(r => setTimeout(r, 1000));
             }
         }

         if (!success) {
            throw lastError;
         }

         // Offline manual fallback (if any gateway actually returns success without a URL)
         setHandshakeStep('Request Pending...');
         setIsProcessing(false);
         onSuccess();
      } catch (err: any) {
         setIsProcessing(false);
         const isConfigError = err.message.includes('CONFIG');
         setPaymentError({
            msg: err.message || "Handshake Failure: Backend connection refused.",
            type: isConfigError ? 'config' : 'declined'
         });
      }
   };

   const getGatewayIcon = (id: string) => {
      switch (id) {
         case 'stripe': return <Globe size={24} />;
         case 'paypal': return <CreditCard size={24} />;
         case 'payfast': return <Zap size={24} />;
         case 'easypaisa': case 'jazzcash': return <Smartphone size={24} />;
         case 'bank': return <Landmark size={24} />;
         case 'cash': return <Banknote size={24} />;
         default: return <Landmark size={24} />;
      }
   };

   const getGatewayColor = (id: string) => {
      switch (id) {
         case 'stripe': return 'bg-blue-600';
         case 'paypal': return 'bg-blue-700';
         case 'payfast': return 'bg-amber-500';
         case 'easypaisa': return 'bg-green-600';
         case 'jazzcash': return 'bg-rose-600';
         case 'bank': return 'bg-blue-600';
         case 'cash': return 'bg-slate-600';
         default: return 'bg-slate-900';
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
         {isProcessing ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-center p-10 space-y-8 bg-white rounded-[3rem] shadow-xl border-4 border-blue-50">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  <RotateCw size={48} className="text-blue-600 animate-pulse" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Digital Handshake</h3>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.4em] animate-pulse">{handshakeStep}</p>
               </div>
               <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed max-w-xs">
                  Communicating with {selectedGateway?.name} production infrastructure. Do not reload the terminal.
               </p>
            </div>
         ) : (
            <>
               {/* Hero Branding */}
               <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 space-y-6">
                     <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-xl">
                           <Globe size={28} />
                        </div>
                        <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Authorized Gateway Hub</span>
                     </div>
                     <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Instant Pay</h3>
                        <p className="text-xs font-bold text-blue-300 uppercase mt-2 opacity-80 italic">Registry-Grade SSL Encryption Active</p>
                     </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                     <ShieldCheck size={240} />
                  </div>
               </div>

               {/* Detailed Error Handlers */}
               {paymentError && (
                  <div className={`p-8 border-4 rounded-[2.5rem] space-y-6 animate-in shake ${paymentError.type === 'config' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                     <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${paymentError.type === 'config' ? 'bg-amber-500' : 'bg-rose-600'} text-white`}>
                           <ShieldAlert size={28} />
                        </div>
                        <div>
                           <p className="text-sm font-black uppercase italic tracking-tight">Handshake Failed</p>
                           <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Code: {paymentError.type === 'config' ? 'NODE_AUTH_ERROR' : 'PROVIDER_DECLINE'}</p>
                        </div>
                     </div>

                     <p className="text-xs font-bold leading-relaxed uppercase">{paymentError.msg}</p>

                     <div className="p-5 bg-white/50 rounded-2xl border border-current/10 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest">Recommended Actions:</p>
                        <div className="grid grid-cols-1 gap-2">
                           <button
                              onClick={() => setSelectedGateway(null)}
                              className="w-full py-3 bg-white text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 shadow-sm flex items-center justify-center gap-2"
                           >
                              <ArrowLeft size={14} /> Try Different Method
                           </button>
                           {paymentError.type === 'config' ? (
                              <div className="flex items-center gap-2 p-3 bg-amber-100 rounded-xl text-amber-800">
                                 <Info size={14} />
                                 <span className="text-[9px] font-black uppercase">Admin must provide API Keys for this link.</span>
                              </div>
                           ) : (
                              <button
                                 onClick={handleInstantPay}
                                 className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                              >
                                 <RotateCw size={14} /> Retry Transaction
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
               )}

               {!paymentError && (
                  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Target Service Tier</label>
                        <select
                           className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-blue-500 transition-all shadow-inner"
                           value={selectedPkgId}
                           onChange={e => setSelectedPkgId(e.target.value)}
                        >
                           <option value="">Select Plan Registry...</option>
                           {state.packages.filter(p => !p.deleted).map(p => (
                              <option key={p.id} value={p.id}>{p.name} — Rs.{p.price}</option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Digital Handshake Nodes</label>
                           <span className="text-[8px] font-black text-slate-300 uppercase">Operational Gateways: {enabledGateways.length}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                           {enabledGateways.length === 0 ? (
                              <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                 <ShieldAlert size={32} className="text-slate-300 mx-auto mb-2" />
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No online nodes authorized by admin.</p>
                              </div>
                           ) : (
                              enabledGateways.map(m => (
                                 <button
                                    key={m.id}
                                    onClick={() => setSelectedGateway(m)}
                                    className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${selectedGateway?.id === m.id ? 'bg-blue-50 border-blue-600 shadow-xl scale-[1.02]' : 'bg-white border-slate-50 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}
                                 >
                                    <div className="flex items-center gap-5">
                                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${getGatewayColor(m.id)} text-white`}>
                                          {getGatewayIcon(m.id)}
                                       </div>
                                       <div className="text-left">
                                          <span className={`text-sm font-black uppercase tracking-tight block ${selectedGateway?.id === m.id ? 'text-blue-950' : 'text-slate-800'}`}>{m.name}</span>
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Handshake Registry active</span>
                                       </div>
                                    </div>
                                    {selectedGateway?.id === m.id ? (
                                       <CheckCircle size={24} className="text-blue-600" />
                                    ) : (
                                       <div className="w-6 h-6 rounded-full border-2 border-slate-100 group-hover:border-slate-200 transition-colors"></div>
                                    )}
                                 </button>
                              ))
                           )}
                        </div>
                     </div>

                     {selectedPkg && (
                        <div className="p-6 bg-slate-900 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
                           <div className="relative z-10">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Amount to Settle</p>
                              <h3 className="text-4xl font-black text-blue-400 italic tracking-tighter">Rs. {total.toLocaleString()}</h3>
                           </div>
                           <Zap className="absolute -right-4 -bottom-4 opacity-5" size={100} />
                        </div>
                     )}

                     <button
                        onClick={handleInstantPay}
                        disabled={!selectedPkgId || !selectedGateway}
                        className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 hover:bg-blue-700 flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs disabled:opacity-50 disabled:grayscale"
                     >
                        <ExternalLink size={20} />
                        Initialize Secure Tunnel
                     </button>
                  </div>
               )}
            </>
         )}
      </div>
   );
};

export default SubscriberOnlinePayment;

