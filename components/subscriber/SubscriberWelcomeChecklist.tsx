
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, CheckCircle, Smartphone, ShieldCheck, Bell, Fingerprint, 
  ArrowRight, Zap, ListChecks, Upload, Camera, Key, Lock, 
  Eye, EyeOff, Hash, UserCheck, ShieldAlert, Loader2, FileText, Info, RefreshCw,
  ArrowLeft, FastForward, ChevronRight
} from 'lucide-react';
import { ISPUser, VerificationStatus } from '../../types';
import { db } from '../../db';

interface Props {
  user: ISPUser;
  onComplete: () => void;
}

const SubscriberWelcomeChecklist: React.FC<Props> = ({ user, onComplete }) => {
  const [activeSubStep, setActiveSubStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const [kycDocType, setKycDocType] = useState<'CNIC' | 'Passport' | 'Driving License'>('CNIC');
  const [kycFile, setKycFile] = useState<string | null>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);

  const [passView, setPassView] = useState<'confirm' | 'change'>('confirm');
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const steps = useMemo(() => {
    if (user.firstLoginChecklist && user.firstLoginChecklist.length > 0) return user.firstLoginChecklist;
    return ['Verify Identity', 'Setup Secure Password', 'Link Mobile Node'];
  }, [user.firstLoginChecklist]);

  const handleKYCUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setKycFile(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitKYCProtocol = async () => {
    if (!kycFile) return;
    setIsProcessing(true);
    try {
      await db.submitKYC(user.id, kycDocType, kycFile);
      markStepComplete('Verify Identity');
      setActiveSubStep(null);
    } catch (err) {
      alert("Registry Uplink Failure.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordConfirm = () => {
    markStepComplete('Setup Secure Password');
    setActiveSubStep(null);
  };

  const handlePasswordChange = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await db.updateCustomerPassword(user.id, newPass);
      if (res.success) {
        markStepComplete('Setup Secure Password');
        setPassView('confirm');
        setActiveSubStep(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const markStepComplete = (step: string) => {
    const next = new Set(completedSteps);
    next.add(step);
    setCompletedSteps(next);
  };

  const handleFinish = async () => {
    setIsProcessing(true);
    await db.markWelcomeComplete(user.id);
    setIsProcessing(false);
    onComplete();
  };

  const renderSubStep = () => {
    switch (activeSubStep) {
      case 'Verify Identity':
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-2">
               <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800 leading-none">KYC Identity</h4>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Provision documentation to verify node security.
               </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {['CNIC', 'Passport', 'Driving License'].map((t: any) => (
                    <button key={t} onClick={() => setKycDocType(t)} className={`px-4 py-2.5 rounded-xl border-2 text-[9px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${kycDocType === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                       {t}
                    </button>
                  ))}
               </div>
               <div onClick={() => kycInputRef.current?.click()} className={`h-40 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 relative overflow-hidden ${kycFile ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                  {kycFile ? <img src={kycFile} className="h-full object-contain" alt="KYC" /> : <><Upload className="text-slate-300 mb-1" size={24} /><p className="text-[8px] font-black text-slate-400 uppercase">Upload Front</p></>}
                  <input type="file" ref={kycInputRef} className="hidden" accept="image/*" onChange={handleKYCUpload} />
               </div>
            </div>
            <button onClick={submitKYCProtocol} disabled={!kycFile || isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
               {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16}/>} Authorize Uplink
            </button>
            <button onClick={() => setActiveSubStep(null)} className="w-full py-2 text-slate-400 font-black text-[9px] uppercase tracking-widest">Cancel</button>
          </div>
        );
      case 'Setup Secure Password':
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <div className="space-y-2">
               <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800 leading-none">Auth Security</h4>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Validate or rotate your secret.</p>
            </div>
            {passView === 'confirm' ? (
              <div className="space-y-4">
                <div className="p-8 bg-slate-900 rounded-[2rem] text-center border-b-4 border-slate-950">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Registry Token</p>
                   <h2 className="text-xl font-black text-indigo-400 italic">{(user.password || '******').toUpperCase()}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setPassView('change')} className="py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[9px] uppercase">Rotate</button>
                   <button onClick={handlePasswordConfirm} className="py-4 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase shadow-lg">Verify</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-lg outline-none focus:border-indigo-600" placeholder="New Secret" value={newPass} onChange={e => setNewPass(e.target.value)} />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                 </div>
                 <button onClick={handlePasswordChange} disabled={isProcessing || newPass.length < 6} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl">
                    {isProcessing ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Synchronize'}
                 </button>
              </div>
            )}
            <button onClick={() => setActiveSubStep(null)} className="w-full py-2 text-slate-400 font-black text-[9px] uppercase tracking-widest">Back</button>
          </div>
        );
      case 'Link Mobile Node':
        return (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
             <div className="space-y-2">
               <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800 leading-none">Mobile Mapping</h4>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Validate handles to finalize handshake.</p>
            </div>
            <div className="space-y-3">
               <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div><p className="text-[7px] font-black text-slate-400 uppercase">Handle</p><p className="text-xs font-black text-slate-900 uppercase italic">{user.username || user.connectionId}</p></div>
                  <UserCheck className="text-emerald-500" size={18} />
               </div>
               <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div><p className="text-[7px] font-black text-slate-400 uppercase">Logic</p><p className="text-xs font-black text-slate-900 uppercase italic">{user.pppoeId || 'P-NODE-LINK'}</p></div>
                  <Hash className="text-indigo-500" size={18} />
               </div>
            </div>
            <button onClick={() => { markStepComplete('Link Mobile Node'); setActiveSubStep(null); }} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95">Commit Mapping</button>
            <button onClick={() => setActiveSubStep(null)} className="w-full py-2 text-slate-400 font-black text-[9px] uppercase">Back</button>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-start gap-3 shadow-inner">
               <Zap className="text-indigo-600 mt-0.5 shrink-0" size={20} />
               <p className="text-[9px] text-slate-600 font-bold leading-relaxed uppercase">
                  Complete these identity protocols to activate your global subscriber terminal.
               </p>
            </div>
            <div className="space-y-2.5">
               {steps.map((step, idx) => (
                 <button key={idx} disabled={completedSteps.has(step)} onClick={() => setActiveSubStep(step)} className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group shadow-sm ${completedSteps.has(step) ? 'bg-emerald-50 border-emerald-500 opacity-60 grayscale' : 'bg-white border-slate-50 hover:border-indigo-100 active:scale-[0.98]'}`}>
                    <div className="flex items-center gap-4">
                       <div className={`w-9 h-9 rounded-xl flex items-center justify-center border font-black text-[10px] ${completedSteps.has(step) ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                          {completedSteps.has(step) ? <CheckCircle size={18} /> : idx + 1}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${completedSteps.has(step) ? 'text-emerald-900' : 'text-slate-600'}`}>{step}</span>
                    </div>
                    {!completedSteps.has(step) && <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1" />}
                 </button>
               ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border-[6px] border-slate-50 flex flex-col max-h-[92vh] animate-in zoom-in duration-300 relative">
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
           <div className="relative z-10 space-y-1">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">REGISTRY SYNC</h3>
              <p className="text-emerald-400 text-[8px] font-black uppercase tracking-[0.4em]">Handshake Protocol v8.6</p>
           </div>
           <ShieldCheck size={100} className="absolute -right-6 -bottom-6 opacity-10 rotate-12" fill="currentColor" />
        </div>
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
           {renderSubStep()}
        </div>
        <div className="p-8 bg-slate-50 border-t flex flex-col gap-3 shrink-0">
           {completedSteps.size >= steps.length && !activeSubStep ? (
             <button onClick={handleFinish} disabled={isProcessing} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <>FINALIZE_SYNC <ArrowRight size={18}/></>}
             </button>
           ) : (
             <div className="flex gap-2.5">
                <button onClick={onComplete} className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest">Remind</button>
                <button onClick={onComplete} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-black active:scale-95 flex items-center justify-center gap-1">
                   Skip <FastForward size={14} />
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SubscriberWelcomeChecklist;
