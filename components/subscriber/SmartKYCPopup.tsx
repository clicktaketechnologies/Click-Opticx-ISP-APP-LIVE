import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Camera, Upload, CheckCircle, AlertCircle, X, 
  ChevronRight, ArrowLeft, Loader2, Smartphone, FileText, 
  UserSquare, Eye, Fingerprint, Zap
} from 'lucide-react';
import { db } from '../../db';
import { ISPUser, KYCMethod } from '../../types';
import { Mini5GMicroLoader } from '../Mini5GMicroLoader';
import Modal from '../shared/Modal';

interface SmartKYCPopupProps {
  user: ISPUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SmartKYCPopup: React.FC<SmartKYCPopupProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'methods' | 'upload' | 'success' | 'processing'>('methods');
  const [method, setMethod] = useState<KYCMethod | null>(null);
  const [files, setFiles] = useState<{ front?: string; back?: string; selfie?: string; document?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'selfie' | 'document' | null>(null);

  const handleMethodSelect = (m: KYCMethod) => {
    setMethod(m);
    setStep('upload');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeSide) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => ({ ...prev, [activeSide]: reader.result as string }));
        setActiveSide(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (side: 'front' | 'back' | 'selfie' | 'document') => {
    setActiveSide(side);
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!method) return;
    
    if (method === KYCMethod.CNIC && (!files.front || !files.back)) {
      setError("Please upload both front and back images of your CNIC.");
      return;
    }
    if (method === KYCMethod.PASSPORT && !files.document) {
      setError("Please upload your passport bio-data page.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStep('processing');

    try {
      const fileArray = Object.values(files).filter(Boolean) as string[];
      const res = await db.submitKYC(user.id, method, fileArray);
      
      if (res.success) {
        setStep('success');
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || "Failed to submit KYC.");
        setStep('upload');
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStep('upload');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMethods = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-4">
        {[
          { id: KYCMethod.CNIC, label: 'National ID (CNIC)', icon: UserSquare, desc: 'Scan front and back of your ID card', color: 'blue' },
          { id: KYCMethod.PASSPORT, label: 'Passport', icon: Smartphone, desc: 'Upload passport bio-data page', color: 'amber' },
          { id: KYCMethod.LIVE_SCAN, label: 'Live Face Scan', icon: Camera, desc: 'Instant biometric verification', color: 'green', disabled: true },
          { id: KYCMethod.MANUAL, label: 'Other Document', icon: FileText, desc: 'Driving license or utility bills', color: 'slate' },
        ].map((m) => (
          <button
            key={m.id}
            disabled={m.disabled}
            onClick={() => handleMethodSelect(m.id as KYCMethod)}
            className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all group relative overflow-hidden ${
              m.disabled ? 'opacity-50 grayscale cursor-not-allowed border-slate-100 bg-slate-50' : 
              'border-slate-100 bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98]'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              m.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              m.color === 'amber' ? 'bg-amber-50 text-amber-600' :
              m.color === 'green' ? 'bg-green-50 text-green-600' :
              'bg-slate-50 text-slate-600'
            }`}>
              <m.icon size={28} />
            </div>
            <div className="text-left">
              <p className="font-black text-slate-900 uppercase italic tracking-tighter leading-none">{m.label}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest leading-none">{m.desc}</p>
            </div>
            <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-500 transition-all" size={24} />
            {m.disabled && <span className="absolute top-2 right-4 text-[7px] font-black uppercase text-slate-400">Soon</span>}
          </button>
        ))}
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        {method === KYCMethod.CNIC && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => triggerUpload('front')}
              className={`aspect-[1.6/1] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden relative group ${
                files.front ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              {files.front ? (
                <>
                  <img src={files.front} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCw className="text-white animate-spin-slow" size={32} />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100"><Camera className="text-blue-500" /></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CNIC FRONT</p>
                </>
              )}
            </div>
            <div 
              onClick={() => triggerUpload('back')}
              className={`aspect-[1.6/1] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden relative group ${
                files.back ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              {files.back ? (
                <>
                  <img src={files.back} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCw className="text-white animate-spin-slow" size={32} />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100"><Camera className="text-blue-500" /></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CNIC BACK</p>
                </>
              )}
            </div>
          </div>
        )}

        {(method === KYCMethod.PASSPORT || method === KYCMethod.MANUAL) && (
          <div 
            onClick={() => triggerUpload('document')}
            className={`aspect-[1.6/1] w-full rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all cursor-pointer overflow-hidden relative group ${
              files.document ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            {files.document ? (
              <img src={files.document} className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="p-6 bg-white rounded-3xl shadow-lg border border-slate-100"><Upload className="text-blue-500" size={32} /></div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase text-slate-900 tracking-tighter italic">Drop Identity Artifact</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">High Resolution JPG or PNG</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake duration-300">
          <AlertCircle size={18} />
          <p className="text-[9px] font-black uppercase tracking-tight leading-none">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setStep('methods')}
          className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
        >
          &larr; Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-[2] py-5 bg-slate-950 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2"
        >
          Submit Identity Node
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500">
      <div className="relative">
        <div className="w-32 h-32 bg-blue-600/10 rounded-full flex items-center justify-center blur-2xl absolute inset-0 animate-pulse"></div>
        <div className="w-32 h-32 bg-white rounded-[3rem] border border-slate-100 shadow-2xl flex items-center justify-center relative">
          <Mini5GMicroLoader size={48} />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter italic leading-none">Scanning Biometrics</h3>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Vault relay in progress...</p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="py-12 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-50 duration-500">
      <div className="w-24 h-24 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-500/40 animate-bounce">
        <CheckCircle size={56} strokeWidth={3} />
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter italic leading-none">Node Submitted</h3>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed max-w-[250px] mx-auto">
          Your identity artifact has been relayed to the infrastructure vault. Review takes approx. 4-12 hours.
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
      >
        Acknowledge & Access Hub
      </button>
    </div>
  );

  const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Identity Node"
      type="info"
      icon={<Fingerprint size={24} className="text-white" />}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
           <div className="flex items-center gap-2">
              <ShieldCheck className="text-green-500" size={14} />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">End-to-End Encrypted</span>
           </div>
           <Zap className="text-amber-500 animate-pulse" size={14} />
        </div>
      }
    >
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-80">KYC Verification Protocol v2.4</p>
        </div>

        <div className="min-h-[300px]">
          {step === 'methods' && renderMethods()}
          {step === 'upload' && renderUpload()}
          {step === 'processing' && renderProcessing()}
          {step === 'success' && renderSuccess()}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>
    </Modal>
  );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

export default SmartKYCPopup;
