import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, CheckCircle, Smartphone, ShieldCheck, Bell, Fingerprint,
  ArrowRight, Zap, ListChecks, Upload, Camera, Key, Lock,
  Eye, EyeOff, Hash, UserCheck, ShieldAlert, Loader2, FileText, Info, RefreshCw,
  ArrowLeft, FastForward
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

  // KYC State
  const [kycDocType, setKycDocType] = useState<'CNIC' | 'Passport' | 'Driving License'>('CNIC');
  const [kycFile, setKycFile] = useState<string | null>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [passView, setPassView] = useState<'confirm' | 'change'>('confirm');
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Robust step fallback
  // Fix: Added useMemo to the imports to resolve 'Cannot find name useMemo' error
  const steps = useMemo(() => {
    if (user.firstLoginChecklist && user.firstLoginChecklist.length > 0) return user.firstLoginChecklist;
    return ['Verify Identity', 'Setup Secure Password', 'Link Account'];
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
      alert("Identity Verification Failed.");
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
    e.stopPropagation();

    if (!newPass || newPass.length < 6) {
      alert("Security: Password must be at least 6 characters.");
      return;
    }

    setIsProcessing(true);
    try {
      const targetId = user.id || user.connectionId;
      const res = await db.updateCustomerPassword(targetId, newPass);

      if (res.success) {
        markStepComplete('Setup Secure Password');
        setNewPass('');
        setPassView('confirm');
        setActiveSubStep(null);
        db.logNotification(user.id, 'success', 'Password Updated', 'Your password has been updated in your account settings.');
      } else {
        alert("Verification Failed: Connection failed. Please try again.");
      }
    } catch (err) {
      console.error("Password update error:", err);
      alert("Password Update Failed.");
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
    try {
      await db.markWelcomeComplete(user.id);
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = async () => {
    if (confirm("Permanently skip these steps? You won't be prompted again, but some network features may be restricted until manual verification.")) {
      setIsProcessing(true);
      try {
        await db.markWelcomeComplete(user.id);
        onComplete();
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const renderSubStep = () => {
    switch (activeSubStep) {
      case 'Verify Identity':
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800">Verify Your Identity</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                Provide valid documentation to secure your account.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Document Architecture</label>
              <div className="grid grid-cols-3 gap-2">
                {['CNIC', 'Passport', 'Driving License'].map((t: any) => (
                  <button
                    key={t}
                    onClick={() => setKycDocType(t)}
                    className={`py-3 rounded-xl border-2 text-[8px] font-black uppercase tracking-tight transition-all ${kycDocType === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div
              onClick={() => kycInputRef.current?.click()}
              className={`h-48 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 relative overflow-hidden ${kycFile ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
            >
              {kycFile ? (
                <img src={kycFile} className="h-full object-contain" alt="KYC Preview" />
              ) : (
                <>
                  <Upload className="text-slate-300 mb-2" size={32} />
                  <p className="text-[9px] font-black text-slate-400 uppercase">Upload Front of {kycDocType}</p>
                </>
              )}
              <input type="file" ref={kycInputRef} className="hidden" accept="image/*" onChange={handleKYCUpload} />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={submitKYCProtocol}
                disabled={!kycFile || isProcessing}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Mini5GMicroLoader size={16} /> : <ShieldCheck size={16} />}
                Submit for Verification
              </button>
              <button
                onClick={() => setActiveSubStep(null)}
                className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Back to Steps
              </button>
            </div>
          </div>
        );

      case 'Setup Secure Password':
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800">Password Verification</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                Verify or change your account password.
              </p>
            </div>

            {passView === 'confirm' ? (
              <div className="space-y-6">
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-center border-4 border-slate-800 shadow-inner">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Current Password</p>
                  <h2 className="text-2xl font-black text-indigo-400 italic tracking-tighter">{(user.password || '******').toUpperCase()}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setPassView('change')} className="py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Change Password</button>
                  <button onClick={handlePasswordConfirm} className="py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95">Confirm Current</button>
                </div>
                <button
                  onClick={() => setActiveSubStep(null)}
                  className="w-full py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password (Min 6 Characters)</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg outline-none focus:border-indigo-500 transition-all text-slate-900 shadow-inner"
                      placeholder="••••••••"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                    />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                      {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePasswordChange}
                    disabled={isProcessing || newPass.length < 6}
                    className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <Mini5GMicroLoader size={16} /> : <RefreshCw size={16} />}
                    Update Password
                  </button>
                  <button
                    onClick={() => setPassView('confirm')}
                    className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={14} /> Back to Existing
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'Link Account':
        return (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800">Personal Information Validation</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                Confirm your account details to finalize the setup.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between shadow-inner">
                <div><p className="text-[8px] font-black text-slate-400 uppercase">App Account</p><p className="text-sm font-black text-slate-900 uppercase italic">{user.username || user.connectionId}</p></div>
                <UserCheck className="text-emerald-500" size={20} />
              </div>
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between shadow-inner">
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Connection ID</p><p className="text-sm font-black text-slate-900 uppercase italic">{user.pppoeId || 'P-CLICK-OPTICX'}</p></div>
                <Hash className="text-indigo-500" size={20} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { markStepComplete('Link Account'); setActiveSubStep(null); }}
                className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap size={18} fill="currentColor" /> Complete Setup
              </button>
              <button
                onClick={() => setActiveSubStep(null)}
                className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Back to Steps
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-8">
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-start gap-4 shadow-inner">
              <Zap className="text-indigo-600 mt-1 shrink-0" size={24} />
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed uppercase">
                Your account details have been received. Complete these steps to fully activate your dashboard.
              </p>
            </div>

            <div className="space-y-3 px-2">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  disabled={completedSteps.has(step)}
                  onClick={() => setActiveSubStep(step)}
                  className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between group shadow-sm ${completedSteps.has(step) ? 'bg-emerald-50 border-emerald-500 opacity-60 grayscale' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg active:scale-[0.98]'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${completedSteps.has(step) ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                      {completedSteps.has(step) ? <CheckCircle size={20} /> : <div className="font-black text-xs">{idx + 1}</div>}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-tight ${completedSteps.has(step) ? 'text-emerald-900' : 'text-slate-600'}`}>{step}</span>
                  </div>
                  {!completedSteps.has(step) && <ArrowRight size={18} className="text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-2 text-center opacity-60">
                <Fingerprint size={20} className="text-indigo-400" />
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Biometric Ready</p>
              </div>
              <div className="flex-1 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-2 text-center opacity-60">
                <Bell size={20} className="text-indigo-400" />
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Notifications Active</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border-[8px] border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300 relative">
        <div className="p-10 bg-slate-900 text-white relative overflow-hidden shrink-0">
          <div className="relative z-10 flex justify-between items-center pr-10">
            <div className="space-y-2">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">WELCOME</h3>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">Initial Account Setup</p>
            </div>
          </div>
          <ShieldCheck size={140} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" fill="currentColor" />
        </div>

        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
          {renderSubStep()}
        </div>

        <div className="p-10 bg-slate-50 border-t flex flex-col gap-4 shrink-0">
          {completedSteps.size >= steps.length && !activeSubStep ? (
            <button
              onClick={handleFinish}
              disabled={isProcessing}
              className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isProcessing ? <Mini5GMicroLoader size={20} /> : <>GET STARTED <ArrowRight size={20} /></>}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onComplete}
                className="flex-1 py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
              >
                Remind Later
              </button>
              <button
                onClick={handleSkip}
                disabled={isProcessing}
                className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-xl"
              >
                {isProcessing ? <Mini5GMicroLoader size={14} /> : <><span className="text-[9px]">Skip Setup</span> <FastForward size={16} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriberWelcomeChecklist;
