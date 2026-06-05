import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Camera, Upload, CheckCircle, AlertCircle, X, 
  ChevronRight, ArrowLeft, Loader2, Smartphone, FileText, 
  UserSquare, Eye, Fingerprint, Zap, RotateCw, Cloud, HardDrive, Lock, Shield,
  Clock
} from 'lucide-react';
import { db } from '../../db';
import { ISPUser, KYCMethod, VerificationStatus } from '../../types';
import { Mini5GMicroLoader } from '../Mini5GMicroLoader';
import Modal from '../shared/Modal';
import FaceScanner from '../shared/FaceScanner';

interface SmartKYCPopupProps {
  user: ISPUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SmartKYCPopup: React.FC<SmartKYCPopupProps> = ({ user, isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'methods' | 'upload' | 'success' | 'processing' | 'pending_review'>(
    (user.isKYCSubmitted && user.verificationStatus === VerificationStatus.PENDING) ? 'pending_review' : 'methods'
  );
  const [method, setMethod] = useState<KYCMethod | null>(null);
  const [files, setFiles] = useState<{ front?: File; back?: File; selfie?: File; document?: File }>({});
  const [previews, setPreviews] = useState<{ front?: string; back?: string; selfie?: string; document?: string }>({});
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
      // Store the actual file object for real upload
      setFiles(prev => ({ ...prev, [activeSide]: file }));
      
      // Also generate a preview for the UI
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [activeSide]: reader.result as string }));
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
    if (method === KYCMethod.LIVE_SCAN && !files.selfie) {
      setError("Please complete the face scan verification.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('userName', user.name);
      formData.append('method', method);

      if (files.front) formData.append('files', files.front);
      if (files.back) formData.append('files', files.back);
      if (files.document) formData.append('files', files.document);
      if (files.selfie) formData.append('files', files.selfie);

      // Use absolute backend URL so this works in production (Firebase Hosting
      // cannot proxy /api/* to the external Render backend — relative paths
      // hit the SPA catch-all rewrite and return index.html, which causes the
      // "Unexpected token '<'" JSON parse error).
      const res = await fetch(`${db.backendUrl}/api/kyc/upload`, {
        method: 'POST',
        body: formData
      });

      // Guard against HTML error pages (404/500) before parsing JSON
      if (!res.ok) {
        const text = await res.text();
        const detail = text.startsWith('<') ? `Server returned HTTP ${res.status}` : text;
        throw new Error(detail);
      }

      const data = await res.json();
      
      if (data.success) {
        await db.updateUser(user.id, {
          isKYCSubmitted: true,
          kyc_status: 'submitted',
          verificationStatus: VerificationStatus.PENDING
        });
        setStep('success');
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || "Failed to submit KYC.");
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
          { id: KYCMethod.CNIC, label: 'National ID (CNIC)', icon: UserSquare, desc: 'Take photos of front & back of your CNIC', color: 'blue' },
          { id: KYCMethod.PASSPORT, label: 'Passport', icon: Smartphone, desc: 'Upload a photo of your passport page', color: 'amber' },
          { id: KYCMethod.LIVE_SCAN, label: 'Selfie Verification', icon: Camera, desc: 'Take a quick selfie to verify yourself', color: 'green' },
          { id: KYCMethod.MANUAL, label: 'Other Document', icon: FileText, desc: 'Driving license, utility bill, etc.', color: 'slate' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => handleMethodSelect(m.id as KYCMethod)}
            className="flex items-center gap-4 p-5 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98] transition-all group relative overflow-hidden"
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
               <p className="font-bold text-slate-900">{m.label}</p>
               <p className="text-xs text-slate-400 mt-1">{m.desc}</p>
            </div>
            <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-500 transition-all" size={24} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        {method === KYCMethod.LIVE_SCAN ? (
          <div className="space-y-6">
            <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                  <ShieldCheck size={24} />
               </div>
               <div>
                   <p className="text-xs font-bold text-green-600">Selfie Verification Active</p>
                   <p className="text-sm text-slate-600">Please take a selfie to verify your identity.</p>
               </div>
            </div>
            {previews.selfie ? (
               <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl group">
                  <img src={previews.selfie} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                     <button 
                      onClick={() => setFiles(prev => ({ ...prev, selfie: undefined }))}
                      className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                     >
                       Retake Scan
                     </button>
                  </div>
               </div>
            ) : (
               <FaceScanner 
                onCapture={(img) => {
                  setPreviews(prev => ({ ...prev, selfie: img }));
                  
                  // Convert base64 to File object
                  fetch(img)
                    .then(res => res.blob())
                    .then(blob => {
                      const file = new File([blob], "selfie.png", { type: "image/png" });
                      setFiles(prev => ({ ...prev, selfie: file }));
                    });
                }}
                onCancel={() => { setMethod(null); setStep('methods'); }}
               />
            )}
          </div>
        ) : (
          <>
            {method === KYCMethod.CNIC && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => triggerUpload('front')}
                  className={`aspect-[1.6/1] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden relative group ${
                    previews.front ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  {previews.front ? (
                    <>
                      <img src={previews.front} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <RotateCw className="text-white animate-spin" size={32} />
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
                    previews.back ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  {previews.back ? (
                    <>
                      <img src={previews.back} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <RotateCw className="text-white animate-spin" size={32} />
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
                  previews.document ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                {previews.document ? (
                  <>
                    <img src={previews.document} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <RotateCw className="text-white animate-spin" size={32} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-white rounded-3xl shadow-lg border border-slate-100"><Upload className="text-blue-500" size={32} /></div>
                    <div className="text-center">
                     <p className="text-sm font-bold text-slate-900">Upload Document</p>
                     <p className="text-xs text-slate-400 mt-1">High resolution JPG or PNG</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
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
          onClick={() => { setStep('methods'); setMethod(null); }}
          className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
        >
          &larr; Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (
            method === KYCMethod.CNIC ? (!files.front || !files.back) :
            method === KYCMethod.PASSPORT ? !files.document :
            method === KYCMethod.LIVE_SCAN ? !files.selfie :
            !files.document
          )}
          className={`flex-[2] py-4 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-950 hover:shadow-blue-500/10'}`}
        >
           {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : 'Submit Documents'}
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative w-24 h-24 bg-slate-900 rounded-[2.5rem] border-2 border-blue-500/30 flex items-center justify-center overflow-hidden">
           <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
         <h3 className="text-xl font-bold text-slate-900">Uploading Your Documents</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
              <Lock size={20} />
            </div>
            <div className="text-left flex-1">
               <div className="text-xs font-bold text-blue-600">Step 1: Securing</div>
              <div className="text-xs text-slate-500 font-bold">Encrypting your documents...</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
              <Cloud size={20} />
            </div>
            <div className="text-left flex-1">
               <div className="text-xs font-bold text-emerald-600">Step 2: Uploading</div>
              <div className="text-xs text-slate-500 font-bold">Saving to secure storage...</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
              <Shield size={20} />
            </div>
            <div className="text-left flex-1">
               <div className="text-xs font-bold text-purple-600">Step 3: Confirming</div>
              <div className="text-xs text-slate-500 font-bold">Almost done...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPendingReview = () => (
    <div className="py-12 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-50 duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
        <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-[2.5rem] flex items-center justify-center shadow-lg border-2 border-amber-100 relative">
          <Clock size={48} className="animate-spin-slow" />
        </div>
      </div>
       <div className="text-center space-y-3">
         <h3 className="text-xl font-bold text-slate-900">Under Review</h3>
         <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto px-4">
           Your documents have been received. Our team is reviewing them and you’ll be notified once approved.
         </p>
       </div>
       <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl flex items-center gap-3">
          <ShieldCheck size={18} />
          <span className="text-xs font-bold">Your data is encrypted and secure</span>
       </div>
       <button
         onClick={onClose}
         className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm transition-all border border-slate-200"
       >
         Waiting for Approval...
       </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="py-12 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-50 duration-500">
      <div className="w-24 h-24 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-500/40 animate-bounce">
        <CheckCircle size={56} strokeWidth={3} />
      </div>
       <div className="text-center space-y-3">
         <h3 className="text-xl font-bold text-slate-900">Documents Submitted!</h3>
         <p className="text-sm text-slate-500 leading-relaxed max-w-[280px] mx-auto">
           We've received your documents. Our team will review them shortly. You'll get a notification once approved.
         </p>
       </div>
       <button
         onClick={onClose}
         className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg transition-all"
       >
         Got it!
       </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Your Identity"
      type="info"
      icon={<Fingerprint size={24} className="text-blue-600" />}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
               <ShieldCheck className="text-green-500" size={14} />
               <span className="text-xs text-slate-500 font-medium">Encrypted & Secure</span>
            </div>
           <Zap className="text-amber-500 animate-pulse" size={14} />
        </div>
      }
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          {user.verificationStatus === VerificationStatus.REVISION ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2 text-left animate-in shake duration-500">
               <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle size={16} />
                   <p className="text-xs font-bold text-rose-600">Correction Required</p>
               </div>
               <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                 "{user.kyc_rejected_reason || 'Sensitive data artifacts did not meet resolution standards. Please resubmit clear photos.'}"
               </p>
               {user.requiredRevisionDocs && (
                 <div className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-100/50 p-2 rounded-lg inline-block border border-rose-200">
                   Required Resubmissions: {user.requiredRevisionDocs} Documents
                 </div>
               )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-80">One last step to unlock your account</p>
          )}
        </div>

        <div className="min-h-[200px]">
          {step === 'methods' && renderMethods()}
          {step === 'upload' && renderUpload()}
          {step === 'processing' && renderProcessing()}
          {step === 'success' && renderSuccess()}
          {step === 'pending_review' && renderPendingReview()}
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

export default SmartKYCPopup;
