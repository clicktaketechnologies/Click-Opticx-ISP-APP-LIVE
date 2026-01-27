
import React, { useState, useMemo } from 'react';
import { 
  Gift, Share2, Users, Trophy, Wallet, Copy, CheckCircle, 
  Clock, AlertTriangle, ArrowRight, History, Zap, ShieldCheck,
  ChevronRight, Circle
} from 'lucide-react';
import { db } from '../../db';
import { ISPUser, AppState, ReferralRecord } from '../../types';

const SubscriberReferral: React.FC = () => {
  const [isConverting, setIsConverting] = useState(false);
  const state = db.getState();
  const user = state.currentUser as ISPUser;
  const config = state.settings.referral;

  const referrals = useMemo(() => 
    state.referrals.filter(r => r.referrerId === user.id), 
  [state.referrals, user.id]);

  const currentPoints = user.referralPoints || 0;
  const walletValue = currentPoints * config.conversionRatio;

  const handleCopyLink = () => {
    const link = `https://netrecover.pk/signup?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    alert("Referral link cloned to clipboard protocol.");
  };

  const handleConvert = async () => {
    if (currentPoints < 1000) {
      alert("Protocol Error: Minimum 1000 points required for conversion handshake.");
      return;
    }
    setIsConverting(true);
    const res = await db.convertPointsToWallet(user.id);
    setIsConverting(false);
    if (res.success) {
      alert(`Success: Rs. ${res.amount} provisioned to your Wallet Registry.`);
    }
  };

  if (!config.enabled) {
    return (
      <div className="p-10 text-center space-y-6 animate-in fade-in">
        <ShieldCheck size={64} className="mx-auto text-slate-200" />
        <h3 className="text-xl font-black uppercase text-slate-400">Referral Protocol Offline</h3>
        <p className="text-xs text-slate-500 font-bold uppercase">The administration has temporarily disabled the commission node.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* 1. Dashboard Card */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 space-y-10">
            <div className="flex justify-between items-start">
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                  <Trophy size={32} className="text-amber-400" />
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ratio: 1000 Pts = Rs 10</p>
                  <p className="text-xs font-black text-emerald-400 uppercase mt-1">Registry Verified</p>
               </div>
            </div>
            
            <div className="text-center">
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Available for Conversion</p>
               <h2 className="text-7xl font-black italic tracking-tighter text-white drop-shadow-2xl">{currentPoints.toLocaleString()}</h2>
               <p className="text-sm font-bold text-indigo-400 mt-2 uppercase tracking-widest">Est. Value: Rs. {walletValue.toLocaleString()}</p>
            </div>

            <div className="flex gap-4">
               <button 
                 onClick={handleConvert}
                 disabled={isConverting || currentPoints < 1000}
                 className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  <Wallet size={16} /> {isConverting ? 'Processing...' : 'Convert to Cash'}
               </button>
               <button onClick={handleCopyLink} className="px-8 py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 shadow-lg flex items-center gap-2">
                  <Copy size={16} /> Link
               </button>
            </div>
         </div>
         <Gift className="absolute -right-12 -bottom-12 opacity-5 scale-150" size={240} />
      </div>

      {/* 2. Rewards Roadmap */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Multi-Stage Commission Model
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Signup', pts: config.signupPoints },
              { label: '1st Pkg', pts: config.pkg1Points },
              { label: '2nd Pkg', pts: config.pkg2Points },
              { label: '3rd Pkg', pts: config.pkg3Points },
            ].map((stage, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                 <p className="text-[8px] font-black text-slate-400 uppercase">{stage.label}</p>
                 <p className="text-sm font-black text-slate-900">{stage.pts} Pts</p>
              </div>
            ))}
         </div>
      </div>

      {/* 3. History Feed */}
      <div className="space-y-4">
         <div className="flex justify-between items-end px-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Linked Node Registry</h3>
            <span className="text-[9px] font-black text-slate-500">{referrals.length} Total Friends</span>
         </div>
         
         <div className="space-y-3">
            {referrals.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                 <Users size={48} className="text-slate-100 mb-4" />
                 <p className="text-xs text-slate-400 font-black uppercase tracking-widest">No friends linked yet.</p>
                 <p className="text-[9px] text-slate-300 font-bold uppercase mt-2">Share your link to initialize nodes.</p>
              </div>
            ) : (
              referrals.map(ref => (
                <div key={ref.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl transition-all">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                            <Users size={24} />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{ref.referredUserName}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{ref.referredUserPhone}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black text-indigo-600 italic">+{ref.totalPointsEarned}</p>
                         <p className="text-[8px] text-slate-400 uppercase font-bold">Points Earned</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-4 gap-2 pt-2">
                      {ref.stages.map((stg, si) => (
                        <div key={si} className="flex flex-col items-center gap-2">
                           <div className={`w-full h-1.5 rounded-full ${stg.completed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-100'}`}></div>
                           <p className={`text-[7px] font-black uppercase text-center ${stg.completed ? 'text-emerald-600' : 'text-slate-300'}`}>{stg.label.split(' ')[0]}</p>
                        </div>
                      ))}
                   </div>
                </div>
              ))
            )}
         </div>
      </div>

      <button onClick={handleCopyLink} className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-[10px]">
         <Share2 size={24} /> Broadcast Invite Link
      </button>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4 mx-2">
         <AlertTriangle size={24} className="text-blue-500 mt-1 shrink-0" />
         <p className="text-[9px] text-blue-700 font-bold leading-relaxed uppercase opacity-80">
            Node Sync Rule: Points for activations are provisioned only for commercial plans (Rs 1000+). Trial nodes do not trigger commission handshakes.
         </p>
      </div>
    </div>
  );
};

export default SubscriberReferral;
