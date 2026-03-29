import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useState } from 'react';
import {
   ShieldCheck, Wifi, CheckCircle, ArrowLeft, Loader2, Cpu, Zap,
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
   const [rememberMe, setRememberMe] = useState(true);

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

   const handleGoogleLogin = async () => {
      setError(null);
      setIsProcessing(true);
      const res = await db.signInWithGoogle();
      setIsProcessing(false);
      if (!res.success) {
         setError(res.message || 'Google Sign-In failed.');
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
      setError(null);
      try {
         const res = await db.submitSignupRequest(signupData);
         if (res.success) {
            if (res.message === 'Account Auto-Activated.') {
               alert('✅ Account created successfully! You can now log in.');
               setView('login');
            } else {
               setView('pending');
            }
         } else {
            setError(res.message || 'Signup failed.');
         }
      } catch (err: any) {
         setError(err.message || 'An unexpected error occurred.');
      } finally {
         setIsProcessing(false);
      }
   };


   const handleResetRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsProcessing(true);

      const res = await db.initiatePasswordReset(resetIdentifier);

      if (res.success) {
         const isEmail = resetIdentifier.includes('@');
         const targetMask = isEmail 
            ? resetIdentifier.replace(/(.{2})(.*)(@.*)/, "$1***$3") 
            : resetIdentifier.replace(/(.{4})(.*)(.{3})/, "$1****$3");

         if (res.otpCode) {
            // Actual email dispatch
            if (isEmail) {
                await db.sendOTPRealEmail(resetIdentifier, res.otpCode);
            }
            alert(`🔐 Verification Code Sent to ${targetMask}\n\n[DISPATCH DONE]\nCheck your inbox for ${isEmail ? 'Email' : 'SMS'}.`);
         }
         setIsProcessing(false);
         setView('reset_finalize');
      } else {
         setIsProcessing(false);
         setError(res.message === 'IDENTITY_NOT_FOUND'
            ? "IDENTITY_NOT_FOUND: No Subscriber matches this identifier."
            : `DISPATCH_ERROR: ${res.message}`
         );
      }
   };

   const handleResetFinalize = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessing(true);

      const verify = await db.verifyResetCode(resetIdentifier, resetToken);

      if (verify.success) {
         const userNode = await db.findUserForReset(resetIdentifier);
         if (userNode) {
            await db.updateCustomerPassword(userNode.id, newPassword);
            setIsProcessing(false);
            setView('login');
            setError(null);
            alert("Success! Your password has been updated. You can now sign in.");
         } else {
            setIsProcessing(false);
            setError("Login verification timed out. Please try again.");
         }
      } else {
         setIsProcessing(false);
         setError("INVALID_TOKEN: The verification code provided does not match the dispatch registry.");
      }
   };


   const renderLogin = () => (
      <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-500" autoComplete="off">
         <div className="space-y-1.5 mb-2">
            <label className="text-sm font-semibold text-slate-700 block ml-1 mb-1">
               Mobile Number, Email or Username
            </label>
            <div className="relative group">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
               <input
                  type="text"
                  autoComplete="off"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Enter your details"
                  required
               />
            </div>
         </div>

         <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
         />

         <div className="flex flex-wrap items-center justify-between px-1 pt-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
               <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}>
                  {rememberMe && <CheckCircle size={12} className="text-white" />}
               </div>
               <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
               <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
            </label>
            <button type="button" onClick={() => setView('reset_request')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot Password?</button>
         </div>

         <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-slate-950 text-white font-bold py-4 rounded-2xl hover:bg-black shadow-lg shadow-black/5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm mt-6 disabled:opacity-50 group"
         >
            {isProcessing ? <Mini5GMicroLoader size={18} /> : null}
            Sign In to Account
         </button>

         <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase">Or continue with</span>
            <div className="flex-grow border-t border-slate-100"></div>
         </div>

         <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isProcessing}
            className="w-full bg-white border-2 border-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
         >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.27C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
               <path d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.71 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.86 14.07H2.18V16.92C3.99 20.53 7.71 23 12 23Z" fill="#34A853"/>
               <path d="M5.86 14.07C5.64 13.43 5.52 12.73 5.52 12C5.52 11.27 5.64 10.57 5.86 9.93V7.08H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.92L5.86 14.07Z" fill="#FBBC05"/>
               <path d="M12 5.36C13.62 5.36 15.06 5.92 16.21 7.02L19.34 3.89C17.45 2.13 14.97 1 12 1C7.71 1 3.99 3.47 2.18 7.08L5.86 9.93C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335"/>
            </svg>
            Google
         </button>

         <div className="text-center pt-2">
            <p className="text-sm font-medium text-slate-500">
               Don't have an account? <button type="button" onClick={() => setView('signup')} className="text-blue-600 font-bold hover:text-blue-700 ml-1">Sign Up</button>
            </p>
         </div>
      </form>
   );

   const renderSignup = () => (
      <form onSubmit={handleSignup} className="space-y-6 animate-in slide-in-from-bottom-10 duration-700" autoComplete="off">
         {/* Section 1: Identity Profile */}
         <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4 px-1">
               <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
               <h4 className="text-sm font-bold text-slate-900">Basic Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5 focus-within:z-10 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                  <label className="text-sm font-semibold text-slate-700 block ml-1 mb-1">Username</label>
                  <input className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 placeholder:text-slate-400" placeholder="Choose a username" value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} required autoComplete="off" />
               </div>
               <div className="space-y-1.5 focus-within:z-10 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                  <label className="text-sm font-semibold text-slate-700 block ml-1 mb-1">Contact Number</label>
                  <input className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 placeholder:text-slate-400" placeholder="03XX-XXXXXXX" value={signupData.phone} onChange={e => setSignupData({ ...signupData, phone: e.target.value })} required={state.settings.authSettings?.requirePhoneOTP} autoComplete="off" />
               </div>
            </div>

            {state.settings.authSettings?.requireCNIC && (
               <div className="space-y-1.5 focus-within:z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                  <label className="text-sm font-semibold text-slate-700 block ml-1 mb-1">National Identity (CNIC)</label>
                  <input className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 placeholder:text-slate-400" placeholder="XXXXX-XXXXXXX-X" value={signupData.cnic} onChange={e => setSignupData({ ...signupData, cnic: e.target.value })} required autoComplete="off" />
               </div>
            )}

            <div className="space-y-1.5 focus-within:z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
               <label className="text-sm font-semibold text-slate-700 block ml-1 mb-1">Email Address</label>
               <input className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 placeholder:text-slate-400" type="email" placeholder="name@domain.com" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} required={state.settings.authSettings?.requireEmailVerification} autoComplete="off" />
            </div>
         </div>

         {/* Section 2: Access Credentials */}
         <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 mb-4 px-1">
               <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
               <h4 className="text-sm font-bold text-slate-900">Account Credentials</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <PasswordInput
                  label="Create Password"
                  value={signupData.password}
                  onChange={(v) => setSignupData({ ...signupData, password: v })}
                  showStrength
                  className="md:col-span-1 animate-in fade-in slide-in-from-left-4 duration-500 delay-300"
                  autoComplete="new-password"
               />
               <PasswordInput
                  label="Retype Password"
                  value={signupData.confirmPassword}
                  onChange={(v) => setSignupData({ ...signupData, confirmPassword: v })}
                  className="md:col-span-1 animate-in fade-in slide-in-from-right-4 duration-500 delay-300"
                  autoComplete="new-password"
               />
            </div>
         </div>

         {/* Section 3: Physical Location */}
         <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 mb-4 px-1">
               <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
               <h4 className="text-sm font-bold text-slate-900">Installation Details</h4>
            </div>
            <div className="space-y-1.5 focus-within:z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
               <label className="text-sm font-semibold text-slate-700 block ml-1 mb-1">Installation Address</label>
               <input className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 placeholder:text-slate-400" placeholder="Complete Physical Address" value={signupData.area} onChange={e => setSignupData({ ...signupData, area: e.target.value })} required autoComplete="off" />
            </div>
         </div>

         <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
            <input type="checkbox" required className="mt-1 w-5 h-5 accent-blue-600 rounded-md border-slate-300 cursor-pointer" />
            <div className="text-sm font-medium text-slate-600 leading-relaxed">
               I have read and agree to the 
               <button type="button" onClick={() => setShowLegalModal('agreement')} className="mx-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors">Service Agreement</button>
               &
               <button type="button" onClick={() => setShowLegalModal('terms')} className="ml-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors">Terms of Use</button>.
            </div>
         </div>

         <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-600">
            <button
               type="submit"
               disabled={isProcessing}
               className="w-full bg-slate-950 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
               {isProcessing ? <Mini5GMicroLoader size={16} /> : null}
               Create Account
            </button>

            <div className="relative flex items-center py-2">
               <div className="flex-grow border-t border-slate-100"></div>
               <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase">Or continue with</span>
               <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button
               type="button"
               onClick={handleGoogleLogin}
               disabled={isProcessing}
               className="w-full bg-white border-2 border-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
            >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.27C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.27 20.34L15.71 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.86 14.07H2.18V16.92C3.99 20.53 7.71 23 12 23Z" fill="#34A853"/>
                  <path d="M5.86 14.07C5.64 13.43 5.52 12.73 5.52 12C5.52 11.27 5.64 10.57 5.86 9.93V7.08H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.92L5.86 14.07Z" fill="#FBBC05"/>
                  <path d="M12 5.36C13.62 5.36 15.06 5.92 16.21 7.02L19.34 3.89C17.45 2.13 14.97 1 12 1C7.71 1 3.99 3.47 2.18 7.08L5.86 9.93C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335"/>
               </svg>
               Google
            </button>

            <button type="button" onClick={() => setView('login')} className="w-full text-slate-500 font-semibold text-sm hover:text-slate-800 transition-colors flex items-center justify-center py-2">
               &larr; Back to Login
            </button>
         </div>
      </form>
   );

   const renderResetRequest = () => (
      <form onSubmit={handleResetRequest} className="space-y-8 animate-in zoom-in duration-300" autoComplete="off">
         <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border-2 border-amber-100/50 shadow-xl shadow-amber-500/5">
               <Key size={28} />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-bold text-slate-900">Forgot your password?</h3>
               <p className="text-sm text-slate-500">Reset your account securely.</p>
            </div>
         </div>

         <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Find Your Account</label>
            <input
               type="text"
               className="w-full py-4 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all text-slate-800 placeholder:text-slate-400"
               placeholder="Enter your email, phone number, CNIC, or username to locate your account"
               value={resetIdentifier}
               onChange={e => setResetIdentifier(e.target.value)}
               required
               autoComplete="off"
            />
         </div>

         <div className="space-y-3">
            <button
               type="submit"
               disabled={isProcessing || !resetIdentifier}
               className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/10 hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
               {isProcessing ? <Mini5GMicroLoader size={18} /> : null}
               Recover Account &rarr;
            </button>
            <button type="button" onClick={() => setView('login')} className="w-full py-3 text-slate-500 font-semibold text-sm hover:text-slate-700 transition-colors flex items-center justify-center">
               Cancel &rarr;
            </button>
         </div>
      </form>
   );

   const renderResetFinalize = () => (
      <form onSubmit={handleResetFinalize} className="space-y-8 animate-in slide-in-from-right duration-500" autoComplete="off">
         <div className="p-6 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-4">
            <CheckCircle size={20} className="text-green-500 shrink-0" />
            <p className="text-[9px] text-green-800 font-black uppercase tracking-widest leading-relaxed">Verification token dispatched. Enter code to unlock identity reset.</p>
         </div>

         <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Verification Code</label>
               <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-2xl tracking-[0.8em] focus:border-blue-600 focus:bg-white outline-none transition-all" placeholder="XXXXXX" value={resetToken} onChange={e => setResetToken(e.target.value)} maxLength={6} required autoComplete="off" />
            </div>

            <PasswordInput
               label="New Create Password"
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
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
         >
            {isProcessing ? <Mini5GMicroLoader size={18} /> : <ShieldCheck size={18} />}
            Re-Encrypt Identity
         </button>
      </form>
   );

   if (view === 'pending') {
      return (
         <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl p-8 md:p-12 text-center space-y-10 animate-in zoom-in duration-500 border border-slate-100 mx-auto">
               <div className="w-28 h-28 bg-green-50 text-green-600 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border-4 border-green-100 relative">
                  <Clock size={56} className="animate-spin-slow" />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                     <MapPin size={24} className="text-rose-500" />
                  </div>
               </div>
               <div className="space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Under Review</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-6">
                     Our team is currently verifying network availability at your location. We will notify you via SMS within 24 hours.
                  </p>
               </div>
               <div className="grid grid-cols-1 gap-2 pt-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <span className="text-[9px] font-black text-slate-400 uppercase">Current Status</span>
                     <span className="text-[9px] font-black text-blue-600 uppercase italic">PENDING VERIFICATION</span>
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
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden font-sans">
         {/* Animated Multi-Layer Mesh Gradient Background */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-400/10 blur-[100px] rounded-full animate-float-delayed"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]"></div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
         </div>

         <div className="container max-w-[1100px] mx-auto grid lg:grid-cols-2 gap-0 min-h-[700px] bg-white rounded-none sm:rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-slate-100/50">

            {/* Left Side: Visual/Branding (Desktop Only) */}
            <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-950 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-green-900/30"></div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-12">
                     <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                        {displayLogo ? <img src={displayLogo} className="h-8 object-contain" /> : <Wifi className="text-green-400" size={28} />}
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Click Optix</h2>
                        <p className="text-green-400/60 text-[8px] font-black uppercase tracking-[0.3em] mt-1">Fiber Infrastructure</p>
                     </div>
                  </div>

                  <div className="space-y-6 mt-20">
                     <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.9] max-w-[350px]">
                        Fast, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Reliable</span> <br />
                        Connection
                     </h1>
                     <div className="text-slate-400 text-sm font-medium leading-relaxed max-w-[350px] space-y-2 mt-4">
                        <p className="flex items-center gap-2">
                           <Loader2 size={16} className="animate-spin text-green-400" />
                           System initializing...
                        </p>
                        <p className="text-white/80 font-bold">
                           Click Optix – Your 5G Ultra Node
                        </p>
                        <p>
                           Ready to connect you.
                        </p>
                     </div>
                  </div>
               </div>

               <div className="relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                           <Zap className="text-blue-400" size={18} />
                        </div>
                        <div>
                           <p className="text-white text-[10px] font-black uppercase italic">Giga-Speed</p>
                           <p className="text-slate-500 text-[8px] font-bold uppercase">Optic Fiber</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                           <ShieldCheck className="text-green-400" size={18} />
                        </div>
                        <div>
                           <p className="text-white text-[10px] font-black uppercase italic">Ultra Secure</p>
                           <p className="text-slate-500 text-[8px] font-bold uppercase">End-to-End</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Background Decorative Element */}
               <div className="absolute bottom-[-5%] right-[-5%] opacity-10 scale-150 rotate-12">
                  <Wifi size={300} strokeWidth={0.5} className="text-white" />
               </div>
            </div>

            {/* Right Side: Form (All Screens) */}
            <div className="flex flex-col justify-center px-6 py-10 sm:p-14 lg:p-20 bg-white relative">
               {/* Mobile Logo (Visible only on small screens) */}
               <div className="lg:hidden flex flex-col items-center mb-8">
                  {displayLogo ? (
                     <img src={displayLogo} className="w-full max-w-[200px] h-auto object-contain mb-4" alt="5G Logo" />
                  ) : (
                     <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center shadow-xl mb-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Wifi className="text-green-400 relative z-10" size={32} />
                     </div>
                  )}
                  {!displayLogo && <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Click Optix</h1>}
               </div>

               <div className="max-w-[400px] mx-auto w-full">
                  {view !== 'reset_request' && (
                     <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">
                           {view === 'login' ? 'Login to Your Account' :
                              view === 'signup' ? 'Get Connected' :
                                 'Reset Password'}
                        </h3>
                        <p className="text-slate-400 mt-2 font-black text-[10px] uppercase tracking-[0.3em] opacity-80">
                           {view === 'login' ? 'Access your internet account easily' :
                              view === 'signup' ? 'Start Your Internet Connection' :
                                 'Enter verification code and new password'}
                        </p>
                     </div>
                  )}

                  {error && (
                     <div className="p-4 mb-8 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 text-rose-600 animate-in shake duration-500">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <p className="text-[11px] font-black uppercase leading-relaxed tracking-tight">{error}</p>
                     </div>
                  )}

                  <div className="min-h-[400px]">
                     {view === 'login' && renderLogin()}
                     {view === 'signup' && renderSignup()}
                     {view === 'reset_request' && renderResetRequest()}
                     {view === 'reset_finalize' && renderResetFinalize()}
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                        <Cpu size={10} className="animate-pulse" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Core v8.6.0-Live</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <Globe size={14} className="text-slate-300 hover:text-blue-500 transition-colors cursor-pointer" />
                        <Info size={14} className="text-slate-300 hover:text-blue-500 transition-colors cursor-pointer" />
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Legal Modals */}
         {showLegalModal && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                  <div className="p-8 border-b bg-slate-950 text-white flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                           <Scale size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">
                           {showLegalModal === 'terms' ? 'Terms of Use' : 'Service Agreement'}
                        </h3>
                     </div>
                     <button onClick={() => setShowLegalModal(null)} className="p-2 text-slate-400 hover:text-white transition-all"><X size={24} /></button>
                  </div>
                  <div className="p-10 flex-1 overflow-y-auto custom-scrollbar bg-white">
                     <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase italic whitespace-pre-wrap">
                        {showLegalModal === 'terms' ? legal.termsAndConditions : legal.serviceAgreement}
                     </p>
                  </div>
                  <div className="p-8 bg-slate-50 border-t flex justify-center shrink-0">
                     <button onClick={() => setShowLegalModal(null)} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">I Accept All Terms</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Login;

