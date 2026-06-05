
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ISPUser, PaymentMethod, TopupRequest, Role, Invoice, AppPage, VerificationStatus, UserStatus } from '../types';
import { db } from '../db';
import { 
  Home, Wallet, Wifi, User, Headphones, Zap, Menu, Bell, MessageSquare, Megaphone, Share2, BarChart3, ShieldAlert, Lock, RotateCw, Eye, EyeOff, ShieldCheck, Smartphone, Network, Info, Globe, Monitor, Key, Gauge, AlertCircle, CheckCircle, X, ArrowRight, Clock, ChevronRight, LogOut, Cpu, Sparkles, History, Mic
} from 'lucide-react';
import Modal from '../components/shared/Modal';

import SubscriberHome from '../components/subscriber/SubscriberHome';
import SubscriberWallet from '../components/subscriber/SubscriberWallet';
import SubscriberPackages from '../components/subscriber/SubscriberPackages';
import SubscriberBilling from '../components/subscriber/SubscriberBilling';
import SubscriberProfile from '../components/subscriber/SubscriberProfile';
import SubscriberNamaz from '../components/subscriber/SubscriberNamaz';
import SubscriberQibla from '../components/subscriber/SubscriberQibla';
import SubscriberTasbih from '../components/subscriber/SubscriberTasbih';
import SubscriberQuran from '../components/subscriber/SubscriberQuran';
import SubscriberWeather from '../components/subscriber/SubscriberWeather';
import SubscriberNetwork from '../components/subscriber/SubscriberNetwork';
import SubscriberInsights from '../components/subscriber/SubscriberInsights';
import SubscriberSupport from '../components/subscriber/SubscriberSupport';
import SubscriberCashPayment from '../components/subscriber/SubscriberCashPayment';
import SubscriberOnlinePayment from '../components/subscriber/SubscriberOnlinePayment';
import SubscriberAIChat from '../components/subscriber/SubscriberAIChat';
import SubscriberReferral from '../components/subscriber/SubscriberReferral';
import SubscriberNews from '../components/subscriber/SubscriberNews';
import SubscriberNotifications from '../components/subscriber/SubscriberNotifications';
import SubscriberQuickActions from '../components/subscriber/SubscriberQuickActions';
import SubscriberCreditScore from '../components/subscriber/SubscriberCreditScore';
import SubscriberConnection from '../components/subscriber/SubscriberConnection';
import SubscriberInvoiceViewer from '../components/subscriber/SubscriberInvoiceViewer';
import SubscriberWelcomeChecklist from '../components/subscriber/SubscriberWelcomeChecklist';
import SubscriberAIHome from '../components/subscriber/ai/SubscriberAIHome';
import SubscriberAIInsights from '../components/subscriber/ai/SubscriberAIInsights';
import SubscriberAINetwork from '../components/subscriber/ai/SubscriberAINetwork';
import SubscriberAIRisk from '../components/subscriber/ai/SubscriberAIRisk';
import SubscriberAISuggestions from '../components/subscriber/ai/SubscriberAISuggestions';
import SubscriberAICall from './SubscriberAICall';
import AICentralDashboard from './AICentralDashboard';
import LiveUsage from './LiveUsage';
import ConnectedDevices from './ConnectedDevices';
import ResetDevicePassword from './ResetDevicePassword';
import SpeedTestPage from './SpeedTestPage';
import AboutUs from './AboutUs';
import EmergencyLoadDashboard from '../components/subscriber/EmergencyLoadDashboard';
import RequestEmergencyLoad from '../components/subscriber/RequestEmergencyLoad';
import EmergencyLoadHistory from '../components/subscriber/EmergencyLoadHistory';
import SmartKYCPopup from '../components/subscriber/SmartKYCPopup';

type SubTab = 'home' | 'wallet' | 'packages' | 'billing' | 'profile' | 'namaz' | 'qibla' | 'tasbih' | 'quran' | 'weather' | 'network' | 'insights' | 'support' | 'cash_pay' | 'online_pay' | 'aichat' | 'referral' | 'news' | 'notifs' | 'emergency' | 'emergency-request' | 'emergency-history' | 'credit-score' | 'connection' | 'about-us' | 'live-usage' | 'connected-devices' | 'reset-password' | 'speed-test' | 'ai-control' | 'ai-home' | 'ai-insights' | 'ai-network' | 'ai-risk' | 'ai-suggestions' | 'ai-voice-call';

const SubscriberApp: React.FC<{ state: AppState; user: ISPUser; onLogout: () => void }> = ({ state, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<SubTab>(user.isKYCVerified ? 'home' : 'quran');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [kycIntent, setKycIntent] = useState<SubTab | null>(null);

  // Auto-open KYC if required
  useEffect(() => {
    if (user.isKYCVerified) {
      setIsKYCOpen(false);
      return;
    }
    if (!user.isKYCSubmitted || user.verificationStatus === VerificationStatus.REVISION) {
      setIsKYCOpen(true);
    }
  }, [user.isKYCVerified, user.isKYCSubmitted, user.verificationStatus]);

  // Real-time KYC status polling on app focus/resume (10s fallback)
  useEffect(() => {
    if (user.isKYCVerified) return; // Already approved, skip polling
    let interval: ReturnType<typeof setInterval> | null = null;
    const pollKYCStatus = async () => {
      try {
        const res = await fetch(`${db.backendUrl}/api/kyc/status?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.isKYCVerified) {
          // Instant unlock — update user state without page refresh
          await db.updateUser(user.id, {
            isKYCVerified: true,
            kyc_status: 'approved',
            verificationStatus: VerificationStatus.VERIFIED
          });
          setIsKYCOpen(false);
          setActiveTab('home');
        }
      } catch (_) { /* silent */ }
    };
    // Poll every 10s
    interval = setInterval(pollKYCStatus, 10000);
    // Also poll on window focus
    const onFocus = () => pollKYCStatus();
    window.addEventListener('focus', onFocus);
    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [user.id, user.isKYCVerified]);

  // Verification Overlay Logic (Synchronized with user props)
  const [showWelcome, setShowWelcome] = useState(false);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

  useEffect(() => {
    if (!user.welcomeChecklistShown && user.verificationStatus === VerificationStatus.UNVERIFIED) {
      setShowWelcome(true);
    }
    if (user.verificationStatus === VerificationStatus.VERIFIED && !user.verificationSuccessShown) {
      setShowVerificationSuccess(true);
    }
  }, [user.verificationStatus, user.verificationSuccessShown, user.welcomeChecklistShown]);

  const appearance = state.settings.appearance;
  const appPages = appearance.appPages || [];
  
  const pendingTopups = useMemo(() => (state.topupRequests || []).filter(r => r.userId === user.id && r.status === 'Pending'), [state.topupRequests, user.id]);
  const currentPkg = useMemo(() => state.packages.find(p => p.id === user.packageId), [state.packages, user.packageId]);
  const unreadCount = (state.notifications || []).filter(n => n.targetId === 'all' || n.targetId === user.id).filter(n => !n.read).length;
  const branding = state.settings.branding;

  const isPageEnabled = (id: string) => {
    if (['home', 'profile', 'ai-home', 'ai-insights', 'ai-network', 'ai-risk', 'ai-suggestions', 'aichat', 'emergency', 'emergency-request', 'emergency-history', 'ai-voice-call'].includes(id)) return true;
    return appPages.find(p => p.id === id)?.enabled ?? false;
  };

  const handleTabChange = (tab: SubTab) => {
    if (!isPageEnabled(tab)) return;

    // SAFE MODE GATING (Identity-Based Access Control)
    // Only Islamic Notes and AI Chatbot are accessible
    const safeTabs: SubTab[] = ['quran', 'tasbih', 'qibla', 'namaz', 'aichat', 'ai-home', 'ai-voice-call', 'profile', 'support'];
    
    if (!user.isKYCVerified && !safeTabs.includes(tab)) {
      setKycIntent(tab);
      setIsKYCOpen(true);
      return;
    }

    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMandatoryReset = async () => {
    if (!newPass || newPass.length < 6) {
      alert("Validation failure: At least 6 characters required.");
      return;
    }
    setIsRotating(true);
    const res = await db.updateCustomerPassword(user.id, newPass);
    if (res.success) {
      db.logNotification(user.id, 'success', 'Password Updated', 'Your Wi-Fi password has been changed successfully.');
      setIsRotating(false);
    }
  };

  const isReadOnly = state.isImpersonating;
  const mustChange = user.mustChangePassword && !isReadOnly;

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
              <h3 className="text-xl font-bold text-slate-800">Feature Unavailable</h3>
              <p className="text-sm text-slate-500">
                 This feature has been disabled by your administrator.
              </p>
           </div>
           <button onClick={() => setActiveTab('home')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg">Back to Home</button>
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
      default: return null;
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'ai-home', icon: Sparkles, label: 'AI' },
    { id: 'live-usage', icon: Monitor, label: 'Live' },
    { id: 'wallet', icon: Wallet, label: 'My Wallet' },
    { id: 'packages', icon: Wifi, label: 'Service Plans' },
  ].filter(item => item.id === 'home' || isPageEnabled(item.id));

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden text-slate-900 pt-12 md:pt-0">
      <SmartKYCPopup 
        user={user} 
        isOpen={isKYCOpen} 
        onClose={() => setIsKYCOpen(false)} 
        onSuccess={() => {
          setIsKYCOpen(false);
          if (kycIntent) {
            setActiveTab(kycIntent);
            setKycIntent(null);
          }
        }} 
      />
      {showWelcome && <SubscriberWelcomeChecklist user={user} onComplete={() => setShowWelcome(false)} />}
      {/* VERIFICATION SUCCESS MODAL */}
      <Modal
        isOpen={showVerificationSuccess}
        onClose={acknowledgeVerification}
        title="Identity Verified"
        type="success"
        icon={<CheckCircle size={24} className="text-blue-500" />}
        maxWidth="max-w-md"
        footer={
          <button 
            onClick={acknowledgeVerification} 
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
          >
            Continue to Dashboard
          </button>
        }
      >
        <div className="py-10 text-center space-y-6">
           <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-green-500/20 animate-bounce">
              <CheckCircle size={56} strokeWidth={3}/>
           </div>
           <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
             Your identity has been verified successfully. All features are now unlocked.
           </p>
        </div>
      </Modal>
      <header className="h-14 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-[200] shrink-0 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border shadow-inner">
               {branding.logoSquare ? <img src={branding.logoSquare} className="w-full h-full object-contain p-1" /> : <Globe size={16} className="text-blue-600" />}
            </div>
            <h1 className="text-xs font-black uppercase italic tracking-tighter leading-none truncate max-w-[120px]">{branding.businessName}</h1>
         </div>
         <div className="flex items-center gap-2">
            {appearance.showAICalling && (
              <button onClick={() => handleTabChange('ai-voice-call')} className="p-2 bg-blue-50 text-blue-600 rounded-xl relative group">
                <Mic size={16} className="group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></span>
              </button>
            )}
            <button onClick={() => handleTabChange('notifs')} className="p-2 bg-slate-100 text-slate-400 rounded-xl relative">
               <Bell size={16} />
               {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>}
            </button>
            <button onClick={() => handleTabChange('profile')} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
               {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <User size={18} className="text-slate-400" />}
            </button>
         </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar relative">
         <div className="max-w-xl mx-auto h-full space-y-4">
            {!user.isKYCVerified && (
               <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500 ${
                  user.verificationStatus === VerificationStatus.REVISION ? 'bg-rose-50 border-rose-100' : 
                  user.kyc_status === 'submitted' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'
               }`}>
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        user.verificationStatus === VerificationStatus.REVISION ? 'bg-rose-500/10 text-rose-600' : 
                        user.kyc_status === 'submitted' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                     }`}>
                        {user.verificationStatus === VerificationStatus.REVISION ? <AlertCircle size={20} /> : 
                         user.kyc_status === 'submitted' ? <Clock size={20} /> : <ShieldAlert size={20} />}
                     </div>
                     <div>
                        <p className={`text-xs font-bold ${
                           user.verificationStatus === VerificationStatus.REVISION ? 'text-rose-600' : 
                           user.kyc_status === 'submitted' ? 'text-blue-600' : 'text-amber-600'
                        }`}>
                           {user.verificationStatus === VerificationStatus.REVISION ? 'Documents Need Revision' : 
                            user.kyc_status === 'submitted' ? 'Under Review' : 'Verify Your Identity'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                           {user.verificationStatus === VerificationStatus.REVISION ? 'Your documents were rejected. Please resubmit.' : 
                            user.kyc_status === 'submitted' ? 'Documents under review. Full access coming soon.' : 'Submit KYC to unlock full app access.'}
                        </p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsKYCOpen(true)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                       user.verificationStatus === VerificationStatus.REVISION ? 'bg-rose-600 text-white' : 
                       user.kyc_status === 'submitted' ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                     {user.verificationStatus === VerificationStatus.REVISION ? 'Resubmit' : 
                      user.kyc_status === 'submitted' ? 'View Status' : 'Verify Now'}
                  </button>
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
            <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
         </button>
      </nav>
    </div>
  );
};

export default SubscriberApp;

