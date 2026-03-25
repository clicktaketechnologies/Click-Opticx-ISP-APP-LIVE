import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { ISPUser, ConnectionStatus } from '../types';
import { Lock, Key, ShieldCheck, RefreshCw, X, Eye, EyeOff, Info, AlertTriangle, Zap, CheckCircle, Wifi, ShieldAlert } from 'lucide-react';

const ResetDevicePassword: React.FC<{ user: ISPUser }> = ({ user }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const mapping = useMemo(() => db.getMappingForUser(user.id), [user.id]);
  const isConfigured = mapping?.configured;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;

    if (newPass.length < 8) {
      alert("Validation Error: Access secret must be at least 8 characters.");
      return;
    }
    if (!/\d/.test(newPass)) {
      alert("Validation Error: Access secret requires at least 1 numerical token.");
      return;
    }
    if (newPass !== confirmPass) {
      alert("Protocol Error: Secrets do not match.");
      return;
    }

    setIsSubmitting(true);
    await db.submitWifiPasswordRequest(user.id, newPass);
    setIsSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-8 animate-in zoom-in duration-500">
         <div className="w-28 h-28 bg-emerald-50 text-emerald-600 rounded-[3rem] flex items-center justify-center shadow-inner animate-bounce border-4 border-emerald-100">
            <CheckCircle size={64} />
         </div>
         <div className="space-y-4">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Protocol Dispatched</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
               Wi-Fi password updated in global registry. Devices may disconnect temporarily as the local node re-synchronizes with the new security token.
            </p>
         </div>
         <button onClick={() => setSuccess(false)} className="w-full max-w-xs py-6 bg-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Dynamic Link Status Hero */}
      <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl transition-colors duration-700 ${isConfigured ? 'bg-slate-900' : 'bg-rose-600'}`}>
         <div className="relative z-10 flex flex-col space-y-10">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em] italic">Hardware Layer Sync</p>
                  <h3 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Security Override</h3>
               </div>
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 backdrop-blur-xl shadow-xl">
                  {isConfigured ? <Key size={32} className="text-amber-400" /> : <ShieldAlert size={32} className="text-white animate-pulse" />}
               </div>
            </div>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between shadow-inner">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Current SSID Target</p>
                  <p className="text-2xl font-black text-white uppercase italic tracking-tighter">
                     {isConfigured ? mapping?.ssidName : 'Dormant Node'}
                  </p>
               </div>
               <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border ${isConfigured ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/10 border-white/20 text-white opacity-50'}`}>
                  {isConfigured ? 'Link Ready' : 'Sync Required'}
               </div>
            </div>
         </div>
         <Wifi className="absolute -right-12 -bottom-12 opacity-5 scale-[2.5] pointer-events-none" size={240} />
      </div>

      {!isConfigured ? (
         <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto border border-slate-100"><ShieldAlert size={32}/></div>
            <div className="space-y-2">
               <h4 className="text-xl font-black text-slate-800 uppercase italic">Configuration Pending</h4>
               <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase max-w-xs mx-auto">
                  Your network device is not yet configured by admin in the authority registry. Please contact support for hardware mapping.
               </p>
            </div>
            <button className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 cursor-not-allowed">
               Protocol Blocked
            </button>
         </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-10">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <ShieldCheck size={24} className="text-indigo-600"/>
              <div>
                 <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Credential Rotation Protocol</h4>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Synchronization v8.5</p>
              </div>
           </div>

           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">New Node Secret</label>
                 <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      className="w-full pl-14 pr-16 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-600 font-black text-2xl transition-all shadow-inner"
                      placeholder="Min 8 chars, 1 number"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                       {showPass ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Verify Reset Token</label>
                 <div className="relative">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      className="w-full pl-14 pr-4 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-indigo-600 font-black text-2xl transition-all shadow-inner"
                      placeholder="Confirm secret"
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      required
                    />
                 </div>
              </div>

              <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-indigo-600 shadow-sm border border-indigo-50">
                    <Info size={24} />
                 </div>
                 <p className="text-[10px] text-indigo-700 font-bold uppercase leading-relaxed">
                    System Logic: Submitting this signal will temporarily disconnect all local identities. Your device will require a re-handshake using the new token once the OLT/Router node processes the push.
                 </p>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !newPass || !confirmPass}
                className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
              >
                 {isSubmitting ? <Mini5GMicroLoader size={20} /> : <Zap size={20} fill="currentColor"/>}
                 Authorize Security Push
              </button>
           </form>
        </div>
      )}

      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm mx-1">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-rose-600 shadow-sm border border-rose-50">
            <AlertTriangle size={24} />
         </div>
         <p className="text-[10px] text-rose-700 font-black leading-relaxed uppercase tracking-tighter">
            CRITICAL WARNING: Unauthorized credential rotation is a violation of the network charter. All rotation requests are logged in the global security audit trail with IP and device footprints.
         </p>
      </div>
    </div>
  );
};

export default ResetDevicePassword;
