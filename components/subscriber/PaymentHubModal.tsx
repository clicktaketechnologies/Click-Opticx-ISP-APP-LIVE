import React, { useState, useRef } from 'react';
import { ISPUser, AppState, PaymentMethod, VerificationStatus } from '../../types';
import { db } from '../../db';
import { 
  X, CreditCard, Banknote, Landmark, Smartphone, 
  Upload, CheckCircle, Info, ArrowRight, ShieldCheck,
  AlertCircle, Camera, Image as ImageIcon, Loader2
} from 'lucide-react';
import Modal from '../shared/Modal';
import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

interface Props {
  user: ISPUser;
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PaymentHubModal: React.FC<Props> = ({ user, state, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Amount, 2: Method & Instructions, 3: Proof
  const [amount, setAmount] = useState<number>(1000);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const gateways = state.settings.paymentGateways || [];
  
  // Humanized Terminalogy from state
  const terms = state.settings.terminology;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProof(event.target?.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !proof || !amount) return;
    
    setIsSubmitting(true);
    try {
      await db.submitTopupRequest({ userId: user.id, userName: user.name, amount, paymentMethod: selectedMethod, proof });
      db.logNotification(user.id, 'success', 'Request Received', `Your payment load request for Rs. ${amount} has been logged for verification.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Payment Submission Error:', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const methods = [
    { id: PaymentMethod.JAZZCASH, label: 'JazzCash', icon: Smartphone, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: PaymentMethod.EASYPAISA, label: 'EasyPaisa', icon: Smartphone, color: 'text-green-600', bg: 'bg-green-50' },
    { id: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const getInstructions = () => {
    const gw = gateways.find(g => g.id === selectedMethod);
    if (!gw) return 'Please contact support for payment instructions.';
    return (
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] font-bold text-slate-600">
          Transfer the amount to the following account and upload the receipt screenshot.
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400">Account Name</span>
            <span className="text-xs font-black uppercase text-slate-900">{gw.merchantName || 'Click Opticx'}</span>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group">
            <span className="text-[10px] font-black uppercase text-slate-400">Account Number</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(gw.merchantId || '');
                alert('Copied to clipboard');
              }}
              className="text-xs font-black uppercase text-blue-600 flex items-center gap-2 hover:underline"
            >
              {gw.merchantId || '03001234567'} <Info size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Credit Load"
      type="info"
      icon={<Banknote size={24} className="text-blue-500" />}
    >
      <div className="py-4 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600 shadow-lg' : 'bg-slate-100'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 italic">Select Load Amount</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Enter the amount you wish to credit to your wallet</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[1000, 2000, 5000, 10000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`p-4 rounded-2xl border-2 transition-all font-black italic text-sm ${amount === amt ? 'bg-blue-600 text-white border-blue-400 shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                >
                  Rs. {amt.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">Custom:</span>
              <input 
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full pl-20 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all font-black text-lg text-slate-900"
                placeholder="0.00"
              />
            </div>

            <button 
              disabled={amount < 100}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Continue to {terms.gatewayName} <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 italic">Select Payment Mode</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Amount: Rs. {amount.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {methods.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${selectedMethod === m.id ? 'bg-white border-blue-500 shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === m.id ? 'bg-blue-600 text-white shadow-lg' : m.bg + ' ' + m.color}`}>
                      <m.icon size={22} />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${selectedMethod === m.id ? 'text-slate-900' : 'text-slate-500'}`}>{m.label}</span>
                  </div>
                  {selectedMethod === m.id && <CheckCircle size={20} className="text-blue-600 animate-in zoom-in" />}
                </button>
              ))}
            </div>

            {selectedMethod && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                {getInstructions()}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Back</button>
              <button 
                disabled={!selectedMethod}
                onClick={() => setStep(3)} 
                className="flex-[2] py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Upload Proof <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 italic">Submit Proof of Payment</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Finalize your credit request</p>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-[4/3] rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden group ${proof ? 'border-green-600 bg-green-50' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200'}`}
            >
              {proof ? (
                <>
                  <img src={proof} className="w-full h-full object-cover" alt="Proof" />
                  <div className="absolute inset-0 bg-green-600/10 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 p-4 rounded-2xl shadow-2xl flex items-center gap-2">
                       <Camera size={18} className="text-green-600" />
                       <span className="text-[10px] font-black uppercase text-green-600">Change Proof</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white text-slate-400 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:text-blue-500 transition-all duration-500">
                    {isUploading ? <Loader2 size={32} className="animate-spin" /> : <ImageIcon size={32} />}
                  </div>
                  <div className="text-center group-hover:translate-y-[-4px] transition-transform">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Select Image</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1 px-8 leading-relaxed">Screenshot or photo of your payment receipt</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Back</button>
              <button 
                disabled={!proof || isSubmitting}
                onClick={handleSubmit} 
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18} />}
                {isSubmitting ? 'Submitting...' : 'Confirm Payment'}
              </button>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <ShieldCheck size={18} className="text-blue-600 shrink-0" />
              <p className="text-[9px] font-bold text-blue-700 uppercase leading-relaxed tracking-tight">
                Our verification human-agents will verify your deposit within 15-30 minutes during business hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentHubModal;
