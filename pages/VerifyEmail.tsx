import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { ShieldCheck, Loader2, XCircle, CheckCircle2, ArrowRight, Globe, KeyRound, Mail } from 'lucide-react';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'otp_entry' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Initializing verification sequence...');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const performTokenVerification = async () => {
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

    if (token) {
      performTokenVerification();
    } else if (userId) {
      setStatus('otp_entry');
      setMessage('Please enter the 6-digit verification code.');
    } else {
      setStatus('error');
      setMessage('Verification parameters are missing or malformed.');
    }
  }, [token, userId]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setOtpError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    setIsSubmitting(true);
    setOtpError(null);

    try {
      const response = await fetch(`${db.getBackendUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: otpCode })
      });
      const res = await response.json();

      if (response.ok && res.success) {
        setStatus('success');
        setMessage(res.message || 'Account successfully activated!');
      } else {
        setOtpError(res.message || 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      setOtpError('Network error: Unable to connect to authorization nodes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
      {/* Visual premium space grid/background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[110px] rounded-full"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center space-y-8 animate-in zoom-in duration-500">
        
        <div className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-pulse shadow-inner">
              <Loader2 className="animate-spin" size={32} />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg animate-bounce">
              <CheckCircle2 size={36} className="animate-in zoom-in duration-300" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
              <XCircle size={32} />
            </div>
          )}
          {status === 'otp_entry' && (
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg">
              <KeyRound size={32} className="animate-in slide-in-from-bottom duration-500" />
            </div>
          )}
          
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
              {status === 'otp_entry' ? 'Enter Code' : 'Account Verify'}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">Identity Handshake Protocol</p>
          </div>
        </div>

        {status === 'otp_entry' ? (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center gap-3 text-left">
              <Mail className="text-blue-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Verification Target</p>
                <p className="text-sm font-semibold text-slate-200 break-all">{email || 'your email'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                6-Digit Security Handshake Code
              </label>
              
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-12 h-14 bg-slate-950 border border-slate-800 text-center text-xl font-bold rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-white placeholder:text-slate-700"
                    placeholder="•"
                    required
                  />
                ))}
              </div>
            </div>

            {otpError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <XCircle size={14} />
                {otpError}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Mini5GMicroLoader size={16} />
              ) : (
                <>
                  Verify Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <p className={`text-xs font-bold leading-relaxed uppercase tracking-tight ${
              status === 'error' ? 'text-rose-400' : status === 'success' ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {message}
            </p>
          </div>
        )}

        {status !== 'loading' && status !== 'otp_entry' && (
          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 bg-slate-100 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            {status === 'success' ? 'Proceed to Login' : 'Back to Login'}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        <div className="pt-4 flex flex-col items-center gap-3">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em]">
            Powered by <span className="text-blue-500/60 font-black">ClickTake Technologies</span>
          </p>
          <div className="flex items-center gap-1 text-[8px] text-slate-700 font-black uppercase tracking-[0.15em]">
            <Globe size={10} className="text-blue-500/40" /> Secure Node Cluster PE-01
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
