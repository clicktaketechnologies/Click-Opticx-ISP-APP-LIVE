
import React, { useState, useMemo } from 'react';
import { ISPUser, AppState } from '../../types';
import { db } from '../../db';
// Added missing ChevronRight and RefreshCw icons to imports
import { Zap, ShieldCheck, AlertTriangle, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle, Info, Activity, ShieldAlert, Smartphone, ChevronRight, RefreshCw } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onBack: () => void;
  onFinish: () => void;
}

const RequestEmergencyLoad: React.FC<Props> = ({ user, state, onBack, onFinish }) => {
  const [step, setStep] = useState<'check' | 'confirm' | 'processing' | 'success'>('check');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibility = useMemo(() => {
    const checks = [
      { name: 'Credit Score Threshold (600+)', passed: user.creditScore >= 600, val: user.creditScore },
      { name: 'Monthly Frequency Registry', passed: true, val: 'Verified' }, // Simplified for mock
      { name: 'Identity Node Status', passed: user.status !== 'Blocked', val: user.status },
      { name: 'Previous Debt Clearance', passed: !state.emergencyLoads.some(l => l.userId === user.id && !l.repaid), val: 'Clean' }
    ];
    const overall = checks.every(c => c.passed);
    return { overall, checks };
  }, [user, state.emergencyLoads]);

  const handleInitialize = () => {
    if (!eligibility.overall) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setStep('processing');
    
    // Simulate OLT Provisioning handshake
    const res = await db.requestEmergencyLoad(user.id, user.packageId || state.packages[0].id);
    
    setTimeout(() => {
      setIsProcessing(false);
      if (res.success) {
        setStep('success');
        db.logNotification(user.id, 'warning', 'Rescue Link Initialized', 'Rs. 2500 credit provisioned. Registry lock: 15m.');
      } else {
        setError(res.message || "Protocol rejection from registry node.");
        setStep('check');
      }
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
      {step === 'check' && (
        <div className="space-y-8">
           <div className="flex items-center gap-4 px-2">
              <button onClick={onBack} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm active:scale-90 transition-all">
                 <ArrowLeft size={20} />
              </button>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">Eligibility Audit</h2>
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">AI Protocol: Risk Gating v2.1</p>
              </div>
           </div>

           {error && (
             <div className="mx-2 p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-600 animate-in shake">
                <ShieldAlert size={24} />
                <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
             </div>
           )}

           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
                       <Smartphone size={28} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Handshake Status</h4>
                       <p className={`text-[10px] font-bold uppercase ${eligibility.overall ? 'text-green-600' : 'text-rose-600'}`}>{eligibility.overall ? 'Node Authorized' : 'Protocol Denied'}</p>
                    </div>
                 </div>
                 <Sparkles className={eligibility.overall ? 'text-amber-400 animate-pulse' : 'text-slate-200'} size={24} />
              </div>

              <div className="space-y-3">
                 {eligibility.checks.map((check, i) => (
                   <div key={i} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${check.passed ? 'bg-slate-50 border-slate-50' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                      <div className="flex items-center gap-4">
                         {check.passed ? <CheckCircle className="text-green-500" size={18} /> : <AlertTriangle className="text-rose-500" size={18} />}
                         <span className="text-[10px] font-black uppercase tracking-tight opacity-70">{check.name}</span>
                      </div>
                      <span className="text-[11px] font-black italic">{check.val}</span>
                   </div>
                 ))}
              </div>

              {/* ChevronRight icon fixed */}
              <button 
                onClick={handleInitialize}
                disabled={!eligibility.overall}
                className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${eligibility.overall ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed grayscale'}`}
              >
                 Authorize Protocol <ChevronRight size={18} />
              </button>
           </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 space-y-10 animate-in zoom-in duration-300">
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto border-4 border-amber-100 shadow-xl">
                 <Zap size={40} fill="currentColor" />
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Authorize Advance</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed px-6">
                 Provisioning Rs. 2,500 credit node to your current identity. 
              </p>
           </div>

           <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Credit</span>
                 <span className="text-2xl font-black italic text-amber-400 tracking-tighter">Rs. 2,500</span>
              </div>
              <div className="flex justify-between items-center relative z-10 pt-4 border-t border-white/5">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Settlement Deadline</span>
                 <span className="text-xs font-bold uppercase text-white">72 Hours (3 Days)</span>
              </div>
              <Activity className="absolute -right-8 -bottom-8 opacity-10" size={140} />
           </div>

           <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
              <Info size={24} className="text-blue-500 shrink-0 mt-1" />
              <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed">
                 Settling within the grace window preserves your credit rank. Overdue status triggers automated node suspension and rank deduction.
              </p>
           </div>

           <div className="flex gap-4">
              <button onClick={() => setStep('check')} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Back</button>
              <button onClick={handleConfirm} className="flex-[2] py-5 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all">Publish Advance</button>
           </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="h-[500px] flex flex-col items-center justify-center text-center p-10 space-y-8 bg-white rounded-[3rem] shadow-xl border-4 border-blue-50">
           <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              {/* RefreshCw icon fixed */}
              <RefreshCw size={48} className="text-blue-600 animate-pulse" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Synchronizing Node</h3>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.4em] animate-pulse">OLT Hardware Handshake in progress</p>
           </div>
           <p className="text-xs text-slate-400 font-bold uppercase leading-relaxed max-w-xs">
              Direct physical path established. Updating behavioral registry and provisioning link layer.
           </p>
        </div>
      )}

      {step === 'success' && (
        <div className="p-16 text-center bg-white rounded-[4rem] border-[12px] border-green-50 shadow-2xl space-y-10 animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              <CheckCircle size={56} strokeWidth={3}/>
           </div>
           <div className="space-y-3">
              <h3 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900">Rescue Active</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed px-4">
                 Your link has been re-authorized. There is a **15-minute registry sync window** before full bandwidth throughput activates.
              </p>
           </div>
           
           <div className="p-6 bg-slate-900 rounded-[2.5rem] flex items-center justify-between text-white">
              <div className="text-left">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Sync Ready In</p>
                 <p className="text-xl font-black italic text-green-400">14:59s</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-right">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                 <span className="text-[10px] font-black uppercase text-white animate-pulse">Establishing...</span>
              </div>
           </div>

           <button onClick={onFinish} className="w-full py-6 bg-slate-950 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2">
              Acknowledge - Payment Due <ArrowRight size={18} />
           </button>
        </div>
      )}
    </div>
  );
};

export default RequestEmergencyLoad;

