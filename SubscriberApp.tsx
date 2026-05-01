import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ISPUser, PaymentMethod, TopupRequest, Role, Invoice, AppPage, VerificationStatus, UserStatus } from './types';
import { db } from './db';
import {
   Home, Wallet, Wifi, User, Headphones, Zap, Menu, Bell, MessageSquare, Megaphone, Share2, BarChart3, ShieldAlert, Lock, RotateCw, Eye, EyeOff, ShieldCheck, Smartphone, Network, Info, Globe, Monitor, Key, Gauge, AlertCircle, CheckCircle, X, ArrowRight, Clock, ChevronRight, LogOut, Cpu, Sparkles, History, Mic, Scale
} from 'lucide-react';

import SubscriberHome from './components/subscriber/SubscriberHome';
import SubscriberWallet from './components/subscriber/SubscriberWallet';
import SubscriberPackages from './components/subscriber/SubscriberPackages';
import SubscriberBilling from './components/subscriber/SubscriberBilling';
import SubscriberProfile from './components/subscriber/SubscriberProfile';
import SubscriberNamaz from './components/subscriber/SubscriberNamaz';
import SubscriberQibla from './components/subscriber/SubscriberQibla';
import SubscriberTasbih from './components/subscriber/SubscriberTasbih';
import SubscriberQuran from './components/subscriber/SubscriberQuran';
import SubscriberWeather from './components/subscriber/SubscriberWeather';
import SubscriberNetwork from './components/subscriber/SubscriberNetwork';
import SubscriberInsights from './components/subscriber/SubscriberInsights';
import SubscriberSupport from './components/subscriber/SubscriberSupport';
import SubscriberCashPayment from './components/subscriber/SubscriberCashPayment';
import SubscriberOnlinePayment from './components/subscriber/SubscriberOnlinePayment';
import SubscriberAIChat from './components/subscriber/SubscriberAIChat';
import SubscriberReferral from './components/subscriber/SubscriberReferral';
import SubscriberNews from './components/subscriber/SubscriberNews';
import SubscriberNotifications from './components/subscriber/SubscriberNotifications';
import SubscriberQuickActions from './components/subscriber/SubscriberQuickActions';
import SubscriberCreditScore from './components/subscriber/SubscriberCreditScore';
import SubscriberConnection from './components/subscriber/SubscriberConnection';
import SubscriberInvoiceViewer from './components/subscriber/SubscriberInvoiceViewer';
import SubscriberWelcomeChecklist from './components/subscriber/SubscriberWelcomeChecklist';
import SubscriberAIHome from './components/subscriber/ai/SubscriberAIHome';
import SubscriberAIInsights from './components/subscriber/ai/SubscriberAIInsights';
import SubscriberAINetwork from './components/subscriber/ai/SubscriberAINetwork';
import SubscriberAIRisk from './components/subscriber/ai/SubscriberAIRisk';
import SubscriberAISuggestions from './components/subscriber/ai/SubscriberAISuggestions';
import SubscriberAICall from './pages/SubscriberAICall';
import AICentralDashboard from './pages/AICentralDashboard';
import LiveUsage from './pages/LiveUsage';
import ConnectedDevices from './pages/ConnectedDevices';
import ResetDevicePassword from './pages/ResetDevicePassword';
import SpeedTestPage from './pages/SpeedTestPage';
import AboutUs from './pages/AboutUs';
import EmergencyLoadDashboard from './components/subscriber/EmergencyLoadDashboard';
import RequestEmergencyLoad from './components/subscriber/RequestEmergencyLoad';
import EmergencyLoadHistory from './components/subscriber/EmergencyLoadHistory';
import SubscriberLegalCenter from './components/subscriber/SubscriberLegalCenter';
import SmartKYCPopup from './components/subscriber/SmartKYCPopup';
import Modal from './components/shared/Modal';

type SubTab = 'home' | 'wallet' | 'packages' | 'billing' | 'profile' | 'namaz' | 'qibla' | 'tasbih' | 'quran' | 'weather' | 'network' | 'insights' | 'support' | 'cash_pay' | 'online_pay' | 'aichat' | 'referral' | 'news' | 'notifs' | 'emergency' | 'emergency-request' | 'emergency-history' | 'credit-score' | 'connection' | 'about-us' | 'live-usage' | 'connected-devices' | 'reset-password' | 'speed-test' | 'ai-control' | 'ai-home' | 'ai-insights' | 'ai-network' | 'ai-risk' | 'ai-suggestions' | 'ai-voice-call' | 'legal';

const SubscriberApp: React.FC<{ state: AppState; user: ISPUser; onLogout: () => void }> = ({ state, user, onLogout }) => {
   const [activeTab, setActiveTab] = useState<SubTab>('home');
   const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
   const [showQuickActions, setShowQuickActions] = useState(false);
   const [isKYCOpen, setIsKYCOpen] = useState(false);
   const [kycIntent, setKycIntent] = useState<SubTab | null>(null);

    // Verification Overlay Logic
    const [showWelcome, setShowWelcome] = useState(!user.welcomeChecklistShown && user.verificationStatus === VerificationStatus.UNVERIFIED);
    const [showVerificationSuccess, setShowVerificationSuccess] = useState(user.verificationStatus === VerificationStatus.VERIFIED && !user.verificationSuccessShown);

    const appearance = state.settings.appearance;
    const appPages = appearance.appPages || [];

    // AUTO-TRIGGER KYC FOR NEW USERS
    useEffect(() => {
       // Show if NOT verified AND (NOT submitted OR requires revision)
       if (!user.isKYCVerified && (!user.isKYCSubmitted || user.verificationStatus === VerificationStatus.REVISION)) {
          const timer = setTimeout(() => setIsKYCOpen(true), 1500);
          return () => clearTimeout(timer);
       }
    }, [user.isKYCSubmitted, user.isKYCVerified, user.verificationStatus]);

    const pendingTopups = useMemo(() => (state.topupRequests || []).filter(r => r.userId === user.id && r.status === 'Pending'), [state.topupRequests, user.id]);
    const currentPkg = useMemo(() => state.packages.find(p => p.id === user.packageId), [state.packages, user.packageId]);
    const unreadCount = (state.notifications || []).filter(n => n.targetId === 'all' || n.targetId === user.id).filter(n => !n.read).length;
    const branding = state.settings.branding;

   const isPageEnabled = (id: string) => {
      if (['home', 'profile', 'ai-home', 'ai-insights', 'ai-network', 'ai-risk', 'ai-suggestions', 'aichat', 'emergency', 'emergency-request', 'emergency-history', 'ai-voice-call', 'legal', 'namaz', 'qibla', 'tasbih', 'quran'].includes(id)) return true;
      return appPages.find(p => p.id === id)?.enabled ?? false;
   };

   const handleTabChange = (tab: SubTab) => {
      if (!isPageEnabled(tab)) return;

      // KYC Enforcement: Block fiscal/network tabs if KYC is not verified
      const allowedWithoutKYC: SubTab[] = ['home', 'profile', 'support', 'legal', 'notifs', 'namaz', 'quran', 'qibla', 'tasbih'];
      if (!allowedWithoutKYC.includes(tab) && user.kyc_status !== 'verified') {
         setKycIntent(tab);
         setIsKYCOpen(true);
         setActiveTab('home');
         return;
      }

      // Approval Enforcement: Mirror KYC rules for pending approvals
      const allowedWithoutApproval: SubTab[] = ['home', 'profile', 'support', 'legal', 'notifs', 'namaz', 'quran', 'qibla', 'tasbih'];
      if (!allowedWithoutApproval.includes(tab) && user.approval_status !== 'approved') {
         alert("Your account is pending admin approval. Some features are restricted.");
         return;
      }

      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   const acknowledgeVerification = async () => {
      await db.markVerificationSuccessShown(user.id);
      setShowVerificationSuccess(false);
   };

   const renderContent = () => {
      if (activeTab === 'profile') return <SubscriberProfile user={user} onLogout={onLogout} />;

      if (!isPageEnabled(activeTab)) {
         return (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6">
               <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center shadow-inner border border-slate-200">
                  <Lock size={40} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Access Restricted</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase leading-relaxed tracking-widest">
                     This feature is currently disabled. Please contact support if you believe this is an error.
                  </p>
               </div>
               <button onClick={() => setActiveTab('home')} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Return to Dashboard</button>
            </div>
         );
      }

      switch (activeTab) {
         case 'home':
            return <SubscriberHome user={user} state={state} currentPkg={currentPkg} onAction={(t) => handleTabChange(t as SubTab)} isPaid={user.balance <= 0} lastPaymentDate={null} />;
         case 'wallet': return <SubscriberWallet user={user} state={state} pendingTopups={pendingTopups} />;
         case 'packages': return <SubscriberPackages user={user} state={state} />;
         case 'billing': return <SubscriberBilling user={user} state={state} onViewInvoice={setSelectedInvoice} />;
         case 'credit-score': return <SubscriberCreditScore user={user} state={state} />;
         case 'connection': return <SubscriberConnection user={user} state={state} />;
         case 'support': return <SubscriberSupport />;
         case 'namaz': return <SubscriberNamaz />;
         case 'qibla': return <SubscriberQibla />;
         case 'tasbih': return <SubscriberTasbih />;
         case 'quran': return <SubscriberQuran />;
         case 'weather': return <SubscriberWeather />;
         case 'network': return <SubscriberNetwork />;
         case 'insights': return <SubscriberInsights />;
         case 'cash_pay': return <SubscriberCashPayment user={user} state={state} onSuccess={() => handleTabChange('wallet')} />;
         case 'online_pay': return <SubscriberOnlinePayment user={user} state={state} onSuccess={() => handleTabChange('home')} />;
         case 'aichat': return <SubscriberAIChat user={user} state={state} />;
         case 'ai-voice-call': return <SubscriberAICall user={user} state={state} onBack={() => setActiveTab('home')} />;
         case 'referral': return <SubscriberReferral />;
         case 'news': return <SubscriberNews state={state} />;
         case 'notifs': return <SubscriberNotifications user={user} state={state} />;
         case 'live-usage': return <LiveUsage user={user} />;
         case 'connected-devices': return <ConnectedDevices user={user} />;
         case 'reset-password': return <ResetDevicePassword user={user} />;
         case 'speed-test': return <SpeedTestPage />;
         case 'about-us': return <AboutUs state={state} />;
         case 'ai-control': return <AICentralDashboard state={state} />;
         case 'ai-home': return <SubscriberAIHome user={user} state={state} onNavigate={(t) => handleTabChange(t as SubTab)} />;
         case 'ai-insights': return <SubscriberAIInsights user={user} state={state} onBack={() => setActiveTab('ai-home')} />;
         case 'ai-network': return <SubscriberAINetwork user={user} state={state} onBack={() => setActiveTab('ai-home')} />;
         case 'ai-risk': return <SubscriberAIRisk user={user} state={state} onBack={() => setActiveTab('ai-home')} />;
         case 'ai-suggestions': return <SubscriberAISuggestions user={user} state={state} onBack={() => setActiveTab('ai-home')} onAction={(t) => handleTabChange(t as SubTab)} />;
         case 'emergency': return <EmergencyLoadDashboard user={user} state={state} onAction={(t) => handleTabChange(t as SubTab)} />;
         case 'emergency-request': return <RequestEmergencyLoad user={user} state={state} onBack={() => setActiveTab('emergency')} onFinish={() => setActiveTab('emergency')} />;
         case 'emergency-history': return <EmergencyLoadHistory user={user} state={state} onBack={() => setActiveTab('emergency')} />;
         case 'legal': return <SubscriberLegalCenter state={state} onBack={() => setActiveTab('home')} />;
         default: return null;
      }
   };

    const navItems = [
       { id: 'home', icon: Home, label: 'Home' },
       { id: 'ai-home', icon: Sparkles, label: 'AI' },
       { id: 'live-usage', icon: Monitor, label: 'Live' },
       { id: 'wallet', icon: Wallet, label: 'Wallet' },
       { id: 'packages', icon: Wifi, label: 'Plans' },
    ].filter(item => {
       if (user.kyc_status !== 'verified' && item.id !== 'home') return false;
       return item.id === 'home' || isPageEnabled(item.id);
    });

   return (
      <div className="h-screen bg-slate-50 flex flex-col overflow-hidden text-slate-900">
         <SmartKYCPopup 
            user={user} 
            isOpen={isKYCOpen} 
            onClose={() => setIsKYCOpen(false)} 
            onSuccess={() => {
               setIsKYCOpen(false);
               if (kycIntent) {
                  setKycIntent(null);
               }
            }} 
         />
         {showWelcome && <SubscriberWelcomeChecklist user={user} onComplete={() => setShowWelcome(false)} />}
         <Modal
            isOpen={showVerificationSuccess}
            onClose={acknowledgeVerification}
            title="Account Verified"
            type="success"
            icon={<ShieldCheck size={24} className="text-white" />}
            footer={
               <button 
                 onClick={acknowledgeVerification} 
                 className="w-full py-4 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl transition-all"
               >
                 Explore Home
               </button>
            }
          >
             <div className="py-6 text-center space-y-4">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-green-100">
                   <CheckCircle size={44} />
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-6">
                   Your identity has been verified. Your account is now fully active and all features are unlocked.
                </p>
             </div>
          </Modal>
         <header className="h-[72px] bg-white px-5 flex items-center justify-between sticky top-0 z-[200] shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border-b border-slate-50">
            <div className="flex items-center gap-3">
               {branding.favicon ? (
                 <img src={branding.favicon} className="w-10 h-10 object-contain drop-shadow-sm" alt="Logo" />
               ) : (
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Globe size={20} className="animate-pulse" />
                 </div>
               )}
               <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                     <h1 className="text-[15px] font-black uppercase tracking-tighter leading-none text-slate-900">{branding.businessName}</h1>
                     {user.isKYCVerified && (
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md shadow-sm border border-blue-200">
                           <ShieldCheck size={10} strokeWidth={3} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Verified Account</span>
                        </div>
                     )}
                     {user.activationCount === 0 && !user.isKYCVerified && (
                        <div className="hidden sm:block animate-in fade-in zoom-in slide-in-from-left-2 duration-700">
                           <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Welcome Aboard</span>
                        </div>
                     )}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[180px] sm:max-w-xs">{branding.tagline || 'Reliable Connectivity'}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
               {appearance.showAICalling && (
                  <button onClick={() => handleTabChange('ai-voice-call')} className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl relative transition-colors shadow-sm">
                     <Mic size={18} />
                     <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                  </button>
               )}
               <button onClick={() => handleTabChange('notifs')} className="p-2 sm:p-2.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl relative shadow-sm hover:text-slate-900 hover:bg-slate-100 transition-colors">
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-sm border border-white"></span>}
               </button>
               <div className="relative">
                  {user.activationCount === 0 && (
                     <span className="absolute -top-1 -left-1 z-10 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm animate-pulse">New</span>
                  )}
                  <button onClick={() => handleTabChange('profile')} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm overflow-hidden hover:border-blue-300 transition-all">
                     {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><User size={20} className="text-slate-400" /></div>}
                  </button>
               </div>
            </div>
         </header>
         <main className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
            <div className="max-w-xl mx-auto h-full space-y-4 pt-1">
                {/* KYC Enforcement Banner */}
                {user.kyc_status === 'pending' && user.verificationStatus !== VerificationStatus.REVISION && (
                   <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                            <ShieldAlert size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-tight text-amber-900 leading-none">Verification Required</p>
                            <p className="text-[9px] font-bold uppercase text-amber-600 mt-0.5 tracking-widest leading-none">Complete your identity verification for full access</p>
                         </div>
                      </div>
                      <button 
                         onClick={() => setIsKYCOpen(true)}
                         className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg active:scale-95"
                      >
                         Verify Now
                      </button>
                   </div>
                )}

                {/* KYC Revision Required Banner */}
                {user.verificationStatus === VerificationStatus.REVISION && (
                   <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col gap-4 animate-in shake duration-500 shadow-md">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                              <ShieldAlert size={20} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-tight text-rose-900 leading-none">Action Required: Resubmission Needed</p>
                              <p className="text-[9px] font-bold uppercase text-rose-500 mt-0.5 tracking-widest leading-none">Your documents were declined</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setIsKYCOpen(true)}
                           className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95"
                        >
                           Fix Now
                        </button>
                      </div>
                      <div className="p-3 bg-white/50 border border-rose-100 rounded-xl">
                         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Reason:</p>
                        <p className="text-[11px] font-black text-rose-700 leading-tight italic">
                           "{user.kyc_rejected_reason || 'Documents need to be clearer. Please provide higher quality photos.'}"
                        </p>
                      </div>
                   </div>
                )}

               {/* Approval Progress Banner */}
               {user.kyc_status === 'submitted' && user.approval_status === 'pending' && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                           <History size={20} className="animate-spin-slow relative z-10" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-tight text-blue-900 leading-none">Under Review</p>
                           <p className="text-[9px] font-bold uppercase text-blue-400 mt-0.5 tracking-widest leading-none">Your documents are being reviewed by our team</p>
                        </div>
                     </div>
                     <div className="px-3 py-1 bg-blue-600/10 rounded-full border border-blue-600/20">
                        <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Reviewing</span>
                     </div>
                  </div>
               )}

               {/* Waiting for Approval Screen (Only if not verified and not pending KYC) */}
               {user.kyc_status === 'verified' && user.approval_status === 'pending' && (
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col gap-6 animate-in slide-in-from-top-4 duration-500 shadow-2xl overflow-hidden relative group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                     <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                           <Clock size={28} className="animate-pulse" />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">Approval in Progress</h4>
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-relaxed">Your documents are verified. We are finalizing your account activation.</p>
                        </div>
                     </div>
                     <div className="space-y-4 pt-2 relative z-10">
                        <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-500 tracking-widest">
                           <span>Account Setup</span>
                           <span className="text-blue-400">95% Complete</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                           <div className="h-full bg-blue-600 animate-pulse w-[95%]"></div>
                        </div>
                     </div>
                  </div>
               )}

               {renderContent()}
            </div>
         </main>
         <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-[400] pb-1 shadow-2xl">
            {navItems.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as SubTab)}
                  className={`flex flex-col items-center gap-1 flex-1 transition-all py-1 ${activeTab === tab.id || (activeTab.startsWith('ai-') && tab.id === 'ai-home') ? 'text-blue-600' : 'text-slate-400'}`}
               >
                  <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
               </button>
            ))}
            <button onClick={onLogout} className="flex flex-col items-center gap-1 flex-1 py-1 text-slate-400">
               <LogOut size={18} />
               <span className="text-[8px] font-black uppercase tracking-widest">Sign Out</span>
            </button>
         </nav>

         {/* Quick Actions Floating Core */}
         {user.kyc_status === 'verified' && (
            <button
               onClick={() => setShowQuickActions(true)}
               className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl z-[500] flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-b-4 border-blue-800"
            >
               <Zap size={28} fill="currentColor" />
            </button>
         )}

         {showQuickActions && (
            <SubscriberQuickActions
               onClose={() => setShowQuickActions(false)}
               onAction={(t) => {
                  handleTabChange(t as SubTab);
                  setShowQuickActions(false);
               }}
            />
         )}

      </div>
   );
};

export default SubscriberApp;

