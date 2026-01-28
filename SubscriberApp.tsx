
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ISPUser, PaymentMethod, TopupRequest, Role, Invoice, AppPage, VerificationStatus, UserStatus } from './types';
import { db } from './db';
import { 
  Home, Wallet, Signal, User, Headphones, Zap, Menu, Bell, MessageSquare, Megaphone, Share2, BarChart3, ShieldAlert, Lock, RefreshCw, Eye, EyeOff, ShieldCheck, Smartphone, Network, Info, Globe, Monitor, Key, Gauge, AlertCircle, CheckCircle, X, ArrowRight, Clock, ChevronRight, LogOut, Cpu, Sparkles, History, Mic, Scale
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

type SubTab = 'home' | 'wallet' | 'packages' | 'billing' | 'profile' | 'namaz' | 'qibla' | 'tasbih' | 'quran' | 'weather' | 'network' | 'insights' | 'support' | 'cash_pay' | 'online_pay' | 'aichat' | 'referral' | 'news' | 'notifs' | 'emergency' | 'emergency-request' | 'emergency-history' | 'credit-score' | 'connection' | 'about-us' | 'live-usage' | 'connected-devices' | 'reset-password' | 'speed-test' | 'ai-control' | 'ai-home' | 'ai-insights' | 'ai-network' | 'ai-risk' | 'ai-suggestions' | 'ai-voice-call' | 'legal';

const SubscriberApp: React.FC<{ state: AppState; user: ISPUser; onLogout: () => void }> = ({ state, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('home');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [showWelcome, setShowWelcome] = useState(!user.welcomeChecklistShown && user.verificationStatus === VerificationStatus.UNVERIFIED);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(user.verificationStatus === VerificationStatus.VERIFIED && !user.verificationSuccessShown);

  const appearance = state.settings.appearance;
  const appPages = appearance.appPages || [];
  
  const pendingTopups = useMemo(() => (state.topupRequests || []).filter(r => r.userId === user.id && r.status === 'Pending'), [state.topupRequests, user.id]);
  const currentPkg = useMemo(() => state.packages.find(p => p.id === user.packageId), [state.packages, user.packageId]);
  const unreadCount = (state.notifications || []).filter(n => n.targetId === 'all' || n.targetId === user.id).filter(n => !n.read).length;
  const branding = state.settings.branding;

  const isPageEnabled = (id: string) => {
    if (['home', 'profile', 'ai-home', 'ai-insights', 'ai-network', 'ai-risk', 'ai-suggestions', 'aichat', 'emergency', 'emergency-request', 'emergency-history', 'ai-voice-call', 'legal'].includes(id)) return true;
    return appPages.find(p => p.id === id)?.enabled ?? false;
  };

  const handleTabChange = (tab: SubTab) => {
    if (!isPageEnabled(tab)) return;
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
                 This feature is currently disabled by administrator.
              </p>
           </div>
           <button onClick={() => setActiveTab('home')} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Return Home</button>
        </div>
      );
    }

    // Fixed: dbState replaced with state prop to resolve "Cannot find name 'dbState'" error
    switch (activeTab) {
      case 'home': return <SubscriberHome user={user} state={state} currentPkg={currentPkg} onAction={(t) => handleTabChange(t as SubTab)} isPaid={user.balance <= 0} lastPaymentDate={null} />;
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
      case 'news': return <SubscriberNews />;
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
    { id: 'packages', icon: Signal, label: 'Plans' },
  ].filter(item => item.id === 'home' || isPageEnabled(item.id));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-20">
      {showWelcome && <SubscriberWelcomeChecklist user={user} onComplete={() => setShowWelcome(false)} />}
      
      {showVerificationSuccess && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="bg-white rounded-[3.5rem] w-full max-w-sm shadow-2xl p-10 text-center space-y-8 animate-in zoom-in border-[8px] border-emerald-50">
              <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                 <CheckCircle size={56} strokeWidth={3}/>
              </div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Verified</h3>
              <button onClick={acknowledgeVerification} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest">Acknowledge</button>
           </div>
        </div>
      )}

      <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-[200] shrink-0 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center border shadow-inner">
               {branding.logoSquare ? <img src={branding.logoSquare} className="w-full h-full object-contain p-1.5" /> : <Globe size={18} className="text-indigo-600" />}
            </div>
            <h1 className="text-sm font-black uppercase italic tracking-tighter leading-none truncate max-w-[140px]">{branding.businessName}</h1>
         </div>
         <div className="flex items-center gap-3">
            {appearance.showAICalling && (
              <button onClick={() => handleTabChange('ai-voice-call')} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl relative group active:scale-90 transition-transform">
                <Mic size={18} className="group-hover:scale-110 transition-transform" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white animate-pulse"></span>
              </button>
            )}
            <button onClick={() => handleTabChange('notifs')} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl relative active:scale-90 transition-transform">
               <Bell size={18} />
               {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>}
            </button>
            <button onClick={() => handleTabChange('profile')} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden active:scale-90 transition-transform shadow-sm">
               {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
            </button>
         </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
         <div className="max-w-xl mx-auto">
            {renderContent()}
         </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 h-18 bg-white border-t border-slate-100 flex items-center justify-around px-4 z-[400] pb-2 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         {navItems.map(tab => (
           <button 
            key={tab.id} 
            onClick={() => handleTabChange(tab.id as SubTab)} 
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all py-1 active:scale-90 ${activeTab === tab.id || (activeTab.startsWith('ai-') && tab.id === 'ai-home') ? 'text-indigo-600' : 'text-slate-400'}`}
           >
              <div className={`p-1.5 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-50' : ''}`}>
                 <tab.icon size={20} strokeWidth={activeTab === tab.id ? 3 : 2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
           </button>
         ))}
      </nav>
    </div>
  );
};

export default SubscriberApp;
