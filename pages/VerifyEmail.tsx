import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { ShieldCheck, Loader2, XCircle, CheckCircle2, ArrowRight, Globe } from 'lucide-react';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Initializing verification sequence...');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing or malformed.');
        return;
      }

      try {
        const response = await fetch(`${db.getBackendUrl()}/api/auth/verify-email?token=${token}`);
        const res = await response.json();
        
        if (res.success) {
          setStatus('success');
          setMessage(res.message || 'Account successfully activated in the master registry.');
        } else {
          setStatus('error');
          setMessage(res.message || 'Verification handshake failed.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage('Network error: Verification node unreachable.');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Visual background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center space-y-8 animate-in zoom-in duration-500">
        
        <div className="flex flex-col items-center gap-4">
           {status === 'loading' && (
             <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 animate-pulse shadow-inner">
               <Loader2 className="animate-spin" size={32} />
             </div>
           )}
           {status === 'success' && (
             <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
               <CheckCircle2 size={32} />
             </div>
           )}
           {status === 'error' && (
             <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
               <XCircle size={32} />
             </div>
           )}
           
           <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Account Verify</h1>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">Identity Handshake Protocol</p>
           </div>
        </div>

        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
           <p className={`text-xs font-bold leading-relaxed uppercase tracking-tight ${
             status === 'error' ? 'text-rose-600' : status === 'success' ? 'text-emerald-700' : 'text-slate-500'
           }`}>
             {message}
           </p>
        </div>

        {status !== 'loading' && (
          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            {status === 'success' ? 'Proceed to Login' : 'Back to Login'}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        <div className="pt-4 flex flex-col items-center gap-3">
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em]">
             Powered by <span className="text-blue-500/50">ClickTake Technologies</span>
           </p>
           <div className="flex items-center gap-1 text-[8px] text-slate-200 font-black uppercase">
             <Globe size={10} /> Secure Node Cluster PE-01
           </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
