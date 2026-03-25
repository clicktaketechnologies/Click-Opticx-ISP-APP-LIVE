import { Mini5GMicroLoader } from '../Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { ISPUser, AppState, UserStatus, Package, PaymentStatus, VerificationStatus, AppSection, AppPage } from '../../types';
import { db } from '../../db';
import {
  Wifi, Zap, Globe, Timer, Target, BookOpen, Gauge,
  ArrowRight, Receipt, Cloud, Sparkles, Activity, ShieldCheck, Wallet, ChevronRight,
  AlertTriangle, Clock, X, ShieldAlert, Sun, Bot, CheckCircle, BarChart3, RefreshCw,
  CreditCard, LayoutGrid, Smartphone, MapPin, MessageSquare, Headphones,
  Bell, History, Gift, User, FileText, Network, Compass, Fingerprint, Loader2,
  Info, Home, Signal, Monitor, Key, Book, HelpCircle, UserCheck, Shield, HardDrive,
  Cpu, Megaphone, Mic, PhoneCall, Moon, Box, Heart, ChevronDown, ChevronUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SubscriberActivationFlow from './SubscriberActivationFlow';
import SubscriberQuickStatus from './SubscriberQuickStatus';

interface Props {
  user: ISPUser;
  state: AppState;
  currentPkg: Package | undefined;
  onAction: (tab: string) => void;
  isPaid: boolean;
  lastPaymentDate: string | null;
}

const iconMap: Record<string, LucideIcon> = {
  Home, Wallet, Signal, User, Headphones, Zap, LayoutGrid, Monitor, Smartphone, Key, Gauge, Bell, MessageSquare, Globe, ShieldCheck, Clock, Book, History, HelpCircle, UserCheck, Shield, Activity, Wifi, HardDrive, BookOpen, FileText, CreditCard, Target, Compass, Fingerprint, Mic, Sun, Gift, Megaphone, Moon, Box, Heart
};

const SubscriberHome: React.FC<Props> = ({
  user, state, currentPkg, onAction, isPaid, lastPaymentDate
}) => {
  const [showActivation, setShowActivation] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('Initializing...');
  const [isDirectoryExpanded, setIsDirectoryExpanded] = useState(false);

  const appearance = state.settings.appearance;
  const appPages = appearance.appPages || [];
  const sections = useMemo(() => {
    return [...(appearance.sections || [])].sort((a, b) => a.order - b.order);
  }, [appearance.sections]);

  let isExpired = true;
  if (user.expiryDate) {
    const exp = new Date(user.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    isExpired = exp.getTime() < today.getTime();
  }
  const pendingPkgReq = db.getPendingUniversalRequest(user.id);
  const activeEL = state.emergencyLoads.find(l => l.userId === user.id && (l.status === 'Active' || l.status === 'Pending_Activation' || l.status === 'Overdue'));

  const isELPastDue = activeEL?.status === 'Overdue';
  const isELPending = activeEL?.status === 'Pending_Activation';

  useEffect(() => {
    if (!activeEL || activeEL.status !== 'Pending_Activation') return;
    const tick = () => {
      const now = new Date().getTime();
      const lock = new Date(activeEL.lockedUntil).getTime();
      const diff = lock - now;
      if (diff <= 0) {
        setTimeLeft('Complete');
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeEL]);

  const activeUnpaidCount = useMemo(() =>
    state.invoices.filter(i => i.userId === user.id && i.status !== PaymentStatus.PAID).length,
    [state.invoices, user.id]);

  const scoreRange = useMemo(() => {
    if (user.creditScore >= 750) return { label: 'Excellent', color: 'text-emerald-500', risk: '🟢 Low Risk' };
    if (user.creditScore >= 600) return { label: 'Good', color: 'text-blue-500', risk: '🟡 Medium' };
    return { label: 'Fair', color: 'text-orange-500', risk: '🟠 Warning' };
  }, [user.creditScore]);

  const renderSection = (section: AppSection) => {
    if (!section.enabled) return null;

    if (section.id === 'status') {
      return (
        <div key="status" className="space-y-6">
          <SubscriberQuickStatus user={user} currentPkg={currentPkg} />

          {/* Transaction Heartbeat Node - Orange Card */}
          {pendingPkgReq && (
            <div className="mx-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 animate-pulse">
                  <Clock size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none mb-1">Verifying Protocol</p>
                  {/* Fix: Safely access packageName using type assertion to avoid union property error */}
                  <h4 className="text-sm font-black text-amber-950 uppercase italic tracking-tight">{(pendingPkgReq as any).packageName || 'Activation'} Handshake</h4>
                  <p className="text-[9px] text-amber-700 font-bold uppercase mt-1">Awaiting Administrative Clearance...</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (confirm("ABORT PROTOCOL: Cancel your pending activation request and restore the terminal?")) {
                    await db.cancelUniversalRequest(pendingPkgReq.id);
                  }
                }}
                className="p-3 bg-white border border-amber-200 text-amber-400 hover:text-rose-600 rounded-xl transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* 🤖 Intelligent Node Section */}
          <div className="space-y-4 px-4">
            <div className="flex justify-between items-end px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">🤖 Intelligent Node</h3>
              <span className="text-[8px] font-black text-indigo-600 animate-pulse">Core Pulse Active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {appearance.showAICalling && (
                <button
                  onClick={() => onAction('ai-voice-call')}
                  className="p-6 bg-slate-900 rounded-3xl border border-white/5 shadow-2xl text-left group overflow-hidden relative active:scale-95 transition-all md:col-span-1 border-b-8 border-indigo-900 hover:scale-[1.02] hover:-rotate-1"
                >
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30 group-hover:scale-110 transition-transform shadow-lg">
                      <PhoneCall size={24} />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">AI Call</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Instant Voice Support</p>
                  </div>
                  <Mic size={100} className="absolute -right-4 -bottom-4 opacity-10 text-indigo-400 pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                </button>
              )}

              <div className={`grid grid-cols-2 gap-3 ${appearance.showAICalling ? 'md:col-span-2' : 'md:col-span-3'}`}>
                <button onClick={() => onAction('ai-home')} className="p-5 bg-slate-900 rounded-2xl border border-white/5 shadow-xl text-left group overflow-hidden relative active:scale-95 transition-all border-b-8 border-slate-950 hover:scale-[1.02]">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-2 border border-indigo-500/30 group-hover:scale-110 transition-transform shadow-md">
                    <Cpu size={20} />
                  </div>
                  <h4 className="text-[10px] font-black text-white uppercase italic tracking-tighter">AI Insight</h4>
                  <Activity size={40} className="absolute -right-2 -bottom-2 opacity-10 text-indigo-400 pointer-events-none" />
                </button>
                {appearance.showAIChat && (
                  <button onClick={() => onAction('aichat')} className="p-5 bg-indigo-600 rounded-2xl border border-indigo-400 shadow-xl text-left group overflow-hidden relative active:scale-95 transition-all border-b-8 border-indigo-800 hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-2 border border-white/30 group-hover:scale-110 transition-transform shadow-md">
                      <MessageSquare size={20} fill="currentColor" />
                    </div>
                    <h4 className="text-[10px] font-black text-white uppercase italic tracking-tighter">AI Chat</h4>
                    <Sparkles size={40} className="absolute -right-2 -bottom-2 opacity-20 text-white pointer-events-none" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`mx-4 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl transition-all duration-700 border-b-8 hover:scale-[1.02] ${user.status === UserStatus.ACTIVE && !isExpired ? 'bg-indigo-600 border-indigo-800 shadow-indigo-200' : 'bg-rose-600 border-rose-800 shadow-rose-200'}`}>
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${!isExpired ? 'bg-emerald-400 animate-pulse' : 'bg-white shadow-[0_0_10px_white]'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{isExpired ? 'Service Expired' : 'Active Link'}</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">{currentPkg?.name || 'OFFLINE'}</h2>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md overflow-hidden p-2 shrink-0 shadow-lg">
                  <Wifi size={24} className={!isExpired ? 'text-emerald-300' : 'text-white'} />
                </div>
              </div>

              {pendingPkgReq ? (
                <div className="p-6 bg-white/10 border border-white/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-white shadow-lg animate-pulse"><Clock size={18} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-white leading-none mb-1">Verifying Request</p>
                      <p className="text-[8px] font-bold uppercase text-indigo-200 tracking-widest truncate max-w-[180px]">Administrator clearance in progress...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setShowActivation(true)} className="flex-1 py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-slate-200">
                    <Zap size={16} fill="currentColor" /> {isExpired ? 'Renew Link' : 'Modify Tier'}
                  </button>
                  <button onClick={() => onAction('packages')} className="px-8 py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all border-b-4 border-white/5">
                    Plans
                  </button>
                </div>
              )}
            </div>
            <Globe className="absolute -right-16 -bottom-16 opacity-10" size={280} />
          </div>
        </div>
      );
    }

    if (section.id === 'rescue' && activeEL) {
      return (
        <div key="rescue" className="space-y-4 px-4">
          <div className={`p-8 rounded-3xl border-4 shadow-xl flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 border-b-8 hover:scale-[1.02] ${isELPastDue ? 'bg-rose-600 border-rose-400 text-white border-b-rose-800' : isELPending ? 'bg-indigo-600 border-indigo-400 text-white border-b-indigo-800' : 'bg-amber-600 border-amber-400 text-white border-b-amber-800'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 text-center sm:text-left">
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10 shrink-0 shadow-lg">
                  {isELPending ? <Mini5GMicroLoader size={36} /> : <ShieldAlert size={36} />}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-black uppercase tracking-tight leading-none mb-1">
                    {isELPending ? 'Provisioning...' : isELPastDue ? 'Risk Threshold Passed' : 'Emergency Link Active'}
                  </h4>
                  <p className="text-[10px] font-bold uppercase opacity-90 tracking-widest leading-relaxed max-w-xs">
                    {isELPending ? `Verifying advance Rs. ${activeEL.amount}. Ready in: ${timeLeft}` : isELPastDue ? `Settle Rs. ${activeEL.amount} immediately to prevent suspension.` : `Rs. ${activeEL.amount} credit. Clear by ${new Date(activeEL.expiryTimestamp).toLocaleDateString()}.`}
                  </p>
                </div>
              </div>
              {!isELPending && (
                <button onClick={() => onAction('wallet')} className="w-full sm:w-auto px-8 py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 flex items-center justify-center gap-2 border-b-4 border-slate-200">
                  Settle Now <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (section.id === 'credit') {
      return (
        <button
          key="credit"
          onClick={() => onAction('ai-risk')}
          className="bg-white rounded-3xl p-6 border-b-8 border-slate-100 shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all mx-4 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-200"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform"><BarChart3 size={28} /></div>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Trust Score</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black italic tracking-tighter text-slate-900">{user.creditScore}</span>
                <span className={`text-[9px] font-black uppercase ${scoreRange.color}`}>{scoreRange.label}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" size={24} />
        </button>
      );
    }

    if (section.id === 'fiscal-summary' && appearance.showWallet) {
      return (
        <div key="fiscal-summary" className="bg-white rounded-3xl border-b-8 border-slate-100 shadow-xl overflow-hidden flex flex-col mx-4 animate-in fade-in duration-700 hover:shadow-2xl transition-all hover:-translate-y-1">
          <div className="p-6 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Receipt size={14} className="text-indigo-600" /> {section.label}</h3>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase">Synced</span>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry Expiry</p><p className={`text-xs font-black uppercase tracking-tight ${isExpired ? 'text-red-600' : 'text-slate-900'}`}>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'OFFLINE'}</p></div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${isExpired ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: isExpired ? '100%' : '65%' }}></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Unpaid Dues</p><p className="text-lg font-black text-slate-900">{activeUnpaidCount}</p></div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Balance</p><p className={`text-lg font-black ${user.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rs. {user.balance.toLocaleString()}</p></div>
            </div>
          </div>
        </div>
      );
    }

    const allItems = section.id === 'directory'
      ? appPages.filter(p => p.enabled && p.showInDirectory)
      : appPages.filter(p => section.itemIds.includes(p.id) && p.enabled);

    // Limit Directory section to 4 cards if not expanded
    const isDirectory = section.id === 'directory';
    const items = (isDirectory && !isDirectoryExpanded) ? allItems.slice(0, 4) : allItems;

    if (allItems.length === 0) return null;

    const gridClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-2 md:grid-cols-4'
    };

    return (
      <div key={section.id} className="space-y-6 px-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">{section.label}</h3>
          {isDirectory && allItems.length > 4 && (
            <button
              onClick={() => setIsDirectoryExpanded(!isDirectoryExpanded)}
              className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
            >
              {isDirectoryExpanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View {allItems.length} Nodes</>}
            </button>
          )}
        </div>

        <div className={`grid ${gridClasses[section.gridCols]} gap-4`}>
          {items.map(item => {
            const Icon = iconMap[item.icon] || Info;
            return (
              <button
                key={item.id}
                onClick={() => onAction(item.id)}
                style={{
                  borderBottom: `8px solid ${item.swatch ? item.swatch + '55' : '#f1f5f9'}`
                }}
                className="p-6 bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2 hover:-rotate-1 transition-all duration-300 active:scale-95 group text-left flex flex-col gap-4 relative overflow-hidden h-full"
              >
                {/* Categorical Background Glow */}
                <div
                  className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none"
                  style={{ backgroundColor: item.swatch || '#f1f5f9' }}
                />

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] transition-all group-hover:scale-110 group-hover:rotate-6 z-10"
                  style={{
                    background: `linear-gradient(135deg, ${item.swatch ? item.swatch + '20' : '#f8fafc'} 0%, ${item.swatch ? item.swatch + '40' : '#f1f5f9'} 100%)`,
                    color: item.swatch || '#94a3b8',
                    borderColor: item.swatch ? item.swatch + '30' : '#f1f5f9',
                    boxShadow: item.swatch ? `0 8px 25px -6px ${item.swatch}55` : 'none'
                  }}
                >
                  <Icon size={28} strokeWidth={3} />
                </div>
                <div className="z-10">
                  <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">{item.label}</h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{item.category} Node</p>
                </div>
                <Icon
                  size={100}
                  className="absolute -right-6 -bottom-6 opacity-[0.04] text-slate-950 pointer-events-none group-hover:scale-150 transition-transform duration-700"
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32">
      {sections.map(renderSection)}
      {showActivation && <SubscriberActivationFlow user={user} state={state} onClose={() => setShowActivation(false)} onSuccess={() => { setShowActivation(false); onAction('home'); }} />}
    </div>
  );
};

export default SubscriberHome;
