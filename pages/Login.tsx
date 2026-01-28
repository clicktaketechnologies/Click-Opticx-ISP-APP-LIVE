
import React, { useState } from 'react';
import {
   ShieldCheck, Signal, CheckCircle, ArrowLeft, Loader2, Cpu, Zap,
   User, Smartphone, AtSign, Contact, LayoutGrid, Clock, MapPin,
   AlertCircle, ShieldAlert, Key, Globe, Info, Package, Send, History, X, Scale
} from 'lucide-react';
import { db } from '../db';
import PasswordInput from '../components/shared/PasswordInput';

interface LoginProps {
   onLogin: (credential: string, pass: string) => any;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
   const state = db.getState();
   const branding = state.settings.branding;
   const legal = state.settings.legal;

   const [view, setView] = useState<'login' | 'signup' | 'pending' | 'reset_request' | 'reset_finalize'>('login');
   const [credential, setCredential] = useState('');
   const [password, setPassword] = useState('');
   const [rememberMe, setRememberMe] = useState(false);

   const [resetIdentifier, setResetIdentifier] = useState('');
   const [resetToken, setResetToken] = useState('');
   const [newPassword, setNewPassword] = useState('');

   const [error, setError] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [showLegalModal, setShowLegalModal] = useState<'terms' | 'agreement' | null>(null);

   // Signup Data
   const [signupData, setSignupData] = useState({
      name: '', username: '', email: '', phone: '', cnic: '',
      address: '', area: '', packageId: state.packages[0]?.id || '',
      password: '', confirmPassword: ''
   });

   const displayLogo = branding.logoLight || branding.logoSquare || branding.logoDark;

   const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsProcessing(true);

      const res = await onLogin(credential, password);
      setIsProcessing(false);

      if (!res.success) {
         if (res.message === 'PENDING_FEASIBILITY') {
            setView('pending');
         } else {
            setError(res.message || 'Login failed. Please check your credentials.');
         }
      }
   };

   const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (signupData.password !== signupData.confirmPassword) {
         setError("Passwords do not match.");
         return;
      }
      if (signupData.password.length < 8) {
         setError("Password must be at least 8 characters long.");
         return;
      }

      setIsProcessing(true);
      try {
         await db.submitSignupRequest(signupData);
         setView('pending');
      } catch (err: any) {
         setError(err.message);
      } finally {
         setIsProcessing(false);
      }
   };

   const handleResetRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessing(true);
      setTimeout(() => {
         setIsProcessing(false);
         setView('reset_finalize');
         db.logNotification('all', 'info', 'Password Reset Initiated', `Reset code sent to: ${resetIdentifier}`);
      }, 1000);
   };

   const handleResetFinalize = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessing(true);
      setTimeout(() => {
         setIsProcessing(false);
         setView('login');
         setError(null);
         alert("Success! Your password has been updated. You can now sign in.");
      }, 1500);
   };

   const renderLogin = () => (
      <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-500" autoComplete="off">
         <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or Username</label>
            <div className="relative group">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
               <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-800"
                  placeholder="e.g. john@example.com"
                  required
                  autoComplete="username"
               />
            </div>
         </div>

         <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
         />

         <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
               <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'}`}>
                  {rememberMe && <CheckCircle size={12} className="text-white" />}
               </div>
               <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">Remember Me</span>
            </label>
            <button type="button" onClick={() => setView('reset_request')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Forgot Password?</button>
         </div>

         <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-slate-950 text-white font-black py-5 rounded-[2rem] hover:bg-black shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
         >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            Sign In
         </button>

         <div className="text-center pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               Don't have an account? <button type="button" onClick={() => setView('signup')} className="text-indigo-600 hover:underline ml-1">Sign Up</button>
            </p>
         </div>
      </form>
   );

   const renderSignup = () => (
      <form onSubmit={handleSignup} className="space-y-4 animate-in slide-in-from-right duration-500">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
               <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" placeholder="e.g. John Doe" value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
               <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" placeholder="03XX-XXXXXXX" value={signupData.phone} onChange={e => setSignupData({ ...signupData, phone: e.target.value })} required />
            </div>
         </div>

         <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs" type="email" placeholder="name@example.com" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} required />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PasswordInput
               label="Create Password"
               value={signupData.password}
               onChange={(v) => setSignupData({ ...signupData, password: v })}
               showStrength
               className="md:col-span-1"
               autoComplete="new-password"
            />
            <PasswordInput
               label="Confirm Password"
               value={signupData.confirmPassword}
               onChange={(v) => setSignupData({ ...signupData, confirmPassword: v })}
               className="md:col-span-1"
               autoComplete="new-password"
            />
         </div>

         <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Installation Area</label>
            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs uppercase" placeholder="e.g. Gulshan, North Nazimabad" value={signupData.area} onChange={e => setSignupData({ ...signupData, area: e.target.value })} required />
         </div>

         <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <input type="checkbox" required className="mt-1 w-4 h-4 accent-indigo-600 rounded shrink-0" />
            <div className="text-[8px] font-bold text-indigo-700 uppercase leading-relaxed">
               I agree to the
               <button type="button" onClick={() => setShowLegalModal('agreement')} className="mx-1 text-indigo-900 underline font-black">Service Agreement</button>
               and
               <button type="button" onClick={() => setShowLegalModal('terms')} className="ml-1 text-indigo-900 underline font-black">Terms of Use</button>.
            </div>
         </div>

         <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
         >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Register Account
         </button>

         <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 font-black uppercase text-[9px] tracking-widest py-2">Back to Sign In</button>
      </form>
   );

   const renderResetRequest = () => (
      <form onSubmit={handleResetRequest} className="space-y-8 animate-in zoom-in duration-300">
         <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border-4 border-amber-100 shadow-xl">
               <Key size={28} />
            </div>
            <div className="space-y-1">
               <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Reset Password</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enter your account details to continue</p>
            </div>
         </div>

         <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email or Username</label>
            <input
               type="text"
               className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus:border-amber-500 transition-all text-center uppercase tracking-tighter"
               placeholder="Account Email or ID"
               value={resetIdentifier}
               onChange={e => setResetIdentifier(e.target.value)}
               required
            />
         </div>

         <button
            type="submit"
            disabled={isProcessing || !resetIdentifier}
            className="w-full py-5 bg-amber-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
         >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <History size={18} />}
            Send Reset Link
         </button>
         <button type="button" onClick={() => setView('login')} className="w-full text-slate-400 font-black uppercase text-[9px] tracking-widest">Cancel</button>
      </form>
   );

   const renderResetFinalize = () => (
      <form onSubmit={handleResetFinalize} className="space-y-8 animate-in slide-in-from-right duration-500">
         <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] flex items-start gap-4">
            <CheckCircle size={24} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-emerald-800 font-bold uppercase leading-relaxed">Reset code sent. Please check your email or mobile for the verification token.</p>
         </div>

         <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Verification Code</label>
               <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-xl tracking-[0.5em] focus:border-indigo-600 outline-none" placeholder="XXXXXX" value={resetToken} onChange={e => setResetToken(e.target.value)} maxLength={6} required />
            </div>

            <PasswordInput
               label="New Password"
               value={newPassword}
               onChange={setNewPassword}
               showStrength
               required
               autoComplete="new-password"
            />
         </div>

         <button
            type="submit"
            disabled={isProcessing || resetToken.length < 4}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
         >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
            Update Password
         </button>
      </form>
   );

   if (view === 'pending') {
      return (
         <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[3.5rem] sm:rounded-[4rem] shadow-2xl p-8 sm:p-12 text-center space-y-10 animate-in zoom-in duration-500 border border-slate-100">
               <div className="w-24 h-24 sm:w-28 sm:h-28 bg-emerald-50 text-emerald-600 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border-4 border-emerald-100 relative">
                  <Clock size={48} className="animate-spin-slow sm:w-14 sm:h-14" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                     <MapPin size={18} className="text-rose-500 sm:w-6 sm:h-6" />
                  </div>
               </div>
               <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Under Review</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-4 sm:px-6">
                     Our team is currently verifying network availability at your location. We will notify you via SMS within 24 hours.
                  </p>
               </div>
               <div className="grid grid-cols-1 gap-2 pt-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Current Status</span>
                     <span className="text-[9px] font-black text-indigo-600 uppercase italic">PENDING VERIFICATION</span>
                  </div>
               </div>
               <button
                  onClick={() => setView('login')}
                  className="w-full bg-slate-950 text-white font-black py-5 rounded-[2rem] hover:bg-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
               >
                  <ArrowLeft size={16} /> Return to Home
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
         <div className="max-w-md w-full bg-white rounded-[3rem] sm:rounded-[3.5rem] shadow-2xl p-8 sm:p-10 border border-slate-100 animate-in fade-in zoom-in duration-700 relative flex flex-col h-auto overflow-hidden">

            <div className="absolute top-4 right-8 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 z-10">
               <Cpu size={12} className="animate-pulse" />
               <span className="text-[8px] font-black uppercase tracking-widest">Portal v8.6</span>
            </div>

            <div className="flex flex-col items-center mb-8 pt-4">
               <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-950 rounded-3xl sm:rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-6 sm:mb-8 border-4 border-white overflow-hidden p-3 transform hover:rotate-3 transition-transform">
                  {displayLogo ? <img src={displayLogo} className="h-full object-contain" /> : <Signal className="text-emerald-400" size={40} />}
               </div>
               <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none text-center px-2">{branding.businessName}</h1>
               <p className="text-slate-400 mt-2 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.4em] italic opacity-80 text-center">
                  {view === 'login' ? 'Welcome Back' :
                     view === 'signup' ? 'Join Our Network' :
                        'Account Recovery'}
               </p>
            </div>

            {error && (
               <div className="p-4 mb-6 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in shake duration-500">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <p className="text-[9px] font-black uppercase leading-relaxed tracking-tight flex-1">{error}</p>
               </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar">
               {view === 'login' && renderLogin()}
               {view === 'signup' && renderSignup()}
               {view === 'reset_request' && renderResetRequest()}
               {view === 'reset_finalize' && renderResetFinalize()}
            </div>
         </div>

         {showLegalModal && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border-[6px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <Scale size={20} />
                        </div>
                        <h3 className="text-lg font-black uppercase italic tracking-tighter">
                           {showLegalModal === 'terms' ? 'Terms of Use' : 'Service Agreement'}
                        </h3>
                     </div>
                     <button onClick={() => setShowLegalModal(null)} className="p-2 text-slate-400 hover:text-white transition-all"><X size={20} /></button>
                  </div>
                  <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                     <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed uppercase italic whitespace-pre-wrap">
                        {showLegalModal === 'terms' ? legal.termsAndConditions : legal.serviceAgreement}
                     </p>
                  </div>
                  <div className="p-6 bg-white border-t flex justify-center shrink-0">
                     <button onClick={() => setShowLegalModal(null)} className="w-full max-w-[200px] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">I Accept</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Login;
