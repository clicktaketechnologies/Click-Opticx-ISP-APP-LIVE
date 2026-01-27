
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './db';
import { Role, AppState, SystemNotification } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import RecoveryDashboard from './pages/RecoveryDashboard';
import AccountingLedger from './pages/AccountingLedger';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PackagesPage from './pages/PackagesPage';
import ArchivePage from './pages/ArchivePage';
import AccessControlPage from './pages/AccessControlPage';
import DealerManagement from './pages/DealerManagement';
import PermissionsPage from './pages/PermissionsPage';
import DataImportPage from './pages/DataImportPage';
import DatabaseMonitor from './pages/DatabaseMonitor';
import BusinessSettings from './pages/BusinessSettings';
import PaymentMethodsIndex from './pages/PaymentMethodsIndex';
import StripeSettings from './pages/gateways/StripeSettings';
import CashSettings from './pages/gateways/CashSettings';
import JazzCashSettings from './pages/gateways/JazzCashSettings';
import EasyPaisaSettings from './pages/gateways/EasyPaisaSettings';
import PayPalSettings from './pages/gateways/PayPalSettings';
import PayFastSettings from './pages/gateways/PayFastSettings';
import HomeCollectionSettings from './pages/gateways/HomeCollectionSettings';
import BankTransferSettings from './pages/gateways/BankTransferSettings';
import InvoiceGenerator from './pages/InvoiceGenerator';
import InvoiceManagementAdmin from './pages/InvoiceManagementAdmin';
import CustomerPortal from './pages/CustomerPortal';
import SubscriberApp from './SubscriberApp';
import UserAppManagement from './pages/UserAppManagement';
import WalletManagement from './pages/WalletManagement';
import EmergencyLoadAdmin from './pages/EmergencyLoadAdmin';
import CreditScoreAdmin from './pages/CreditScoreAdmin';
import ReferralAdmin from './pages/ReferralAdmin';
import ConnectionSetupAdmin from './pages/ConnectionSetupAdmin';
import TicketManagementAdmin from './pages/TicketManagementAdmin';
import TaskManagement from './pages/TaskManagement';
import AboutUs from './pages/AboutUs';
import AdminLiveMonitoring from './pages/AdminLiveMonitoring';
import AdminPasswordRequests from './pages/AdminPasswordRequests';
import DeviceManagement from './pages/DeviceManagement';
import UserDeviceMapping from './pages/UserDeviceMapping';
import MasterApprovalDashboard from './pages/MasterApprovalDashboard';
import AdminProfile from './pages/AdminProfile';
import AIControlPlane from './pages/AIControlPlane';
import AICallingAdmin from './pages/AICallingAdmin';
import AICallLogs from './pages/AICallLogs';
import AIAgentWidget from './components/AIAgentWidget';
import EmailCampaigns from './pages/comm/EmailCampaigns';
import EmailTemplates from './pages/comm/EmailTemplates';
import AutomationRules from './pages/comm/AutomationRules';
import PushNotifications from './pages/comm/PushNotifications';
import AudienceSegments from './pages/comm/AudienceSegments';
import DeliveryLogs from './pages/comm/DeliveryLogs';
import CommunicationSettingsPage from './pages/comm/CommunicationSettings';
import SenderIdentities from './pages/comm/SenderIdentities';
import { Loader2, ShieldAlert, LogOut, Cloud, X, Zap, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AppState['currentUser']>(db.getState().currentUser);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [dbState, setDbState] = useState<AppState>(db.getState());
  const [isConfigured, setIsConfigured] = useState(db.isConfigured());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [criticalAlert, setCriticalAlert] = useState<SystemNotification | null>(null);

  useEffect(() => {
    const unsubscribe = db.onStateChange((newState) => {
      setDbState(newState);
      setAuthState(newState.currentUser);
      setIsConfigured(db.isConfigured());
      const user = newState.currentUser;
      if (user && user.role !== Role.CUSTOMER) {
         const criticals = newState.notifications.filter(n => !n.read && n.priority === 'critical' && (n.audience === 'admin' || n.audience === 'system'));
         if (criticals.length > 0) setCriticalAlert(criticals[0]);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="relative mb-8"><Cloud className="text-blue-500 animate-pulse" size={64} /><div className="absolute inset-0 flex items-center justify-center"><Loader2 className="text-white animate-spin" size={32} /></div></div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Click Opticx</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Cloud Node Handshake in Progress...</p>
      </div>
    );
  }

  const handleLogin = (credential: string, pass: string) => db.login(credential, pass);
  const handleLogout = () => { db.logout(); setCurrentPage('dashboard'); };
  
  const navigateTo = (page: string, params?: { userId?: string }) => { 
    if (params?.userId) setTargetUserId(params.userId);
    else setTargetUserId(null);
    setCurrentPage(page); 
    setIsSidebarOpen(false); 
  };

  const dismissCritical = () => {
    if (criticalAlert) db.markNotificationRead(criticalAlert.id);
    setCriticalAlert(null);
  };

  if (!authState) return <Login onLogin={handleLogin} />;
  
  if (authState.role === Role.CUSTOMER) {
    return (
      <>
        {dbState.isImpersonating && (
          <div className="fixed top-0 inset-x-0 bg-rose-600 text-white p-3 z-[1000] flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
             <div className="flex items-center gap-3"><ShieldAlert size={20} className="animate-pulse" /><p className="text-[10px] font-black uppercase tracking-widest">Admin View Active: Viewing as {authState.name}</p></div>
             <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase"><LogOut size={12} /> Exit</button>
          </div>
        )}
        <SubscriberApp state={dbState} user={authState as any} onLogout={handleLogout} />
        <AIAgentWidget state={dbState} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      {criticalAlert && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[3000] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3.5rem] w-full max-lg shadow-2xl overflow-hidden border-[8px] border-rose-500 animate-in zoom-in duration-300">
              <div className="p-10 text-center space-y-8">
                 <div className="w-24 h-24 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse"><ShieldAlert size={56} strokeWidth={3}/></div>
                 <div className="space-y-3"><h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">{criticalAlert.title}</h3><p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed px-4">{criticalAlert.message}</p></div>
                 <button onClick={dismissCritical} className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2">Acknowledge Handshake <ShieldCheck size={18}/></button>
              </div>
           </div>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar current={currentPage} onNavigate={navigateTo} role={authState.role} onLogout={handleLogout} isOpen={isSidebarOpen} businessName={dbState.settings.branding.businessName} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={authState as any} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onProfileClick={() => navigateTo('admin-profile')} onLogout={handleLogout} />
        <main className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
           {(() => {
              switch (currentPage) {
                case 'dashboard': return <Dashboard state={dbState} />;
                case 'ai-control': return <AIControlPlane state={dbState} />;
                case 'ai-calling': return <AICallingAdmin state={dbState} />;
                case 'ai-call-logs': return <AICallLogs state={dbState} />;
                case 'users': return <UserManagement state={dbState} />;
                case 'packages': return <PackagesPage state={dbState} />;
                case 'approval-desk': return <MasterApprovalDashboard state={dbState} />;
                case 'recovery': return <RecoveryDashboard state={dbState} />;
                case 'accounting': return <AccountingLedger state={dbState} />;
                case 'archive': return <ArchivePage state={dbState} />;
                case 'staff': return <AccessControlPage state={dbState} />;
                case 'permissions': return <PermissionsPage state={dbState} />;
                case 'import': return <DataImportPage state={dbState} />;
                case 'monitor': return <DatabaseMonitor state={dbState} />;
                case 'business-settings': return <BusinessSettings state={dbState} />;
                case 'gateway-settings': return <PaymentMethodsIndex state={dbState} onNavigate={navigateTo} />;
                case 'gateway-stripe': return <StripeSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'gateway-cash': return <CashSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'gateway-jazzcash': return <JazzCashSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'gateway-easypaisa': return <EasyPaisaSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'gateway-paypal': return <PayPalSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'gateway-payfast': return <PayFastSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'gateway-home': return <HomeCollectionSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'gateway-bank': return <BankTransferSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
                case 'invoice-engine': return <InvoiceGenerator state={dbState} preSelectedUserId={targetUserId || undefined} onNavigate={navigateTo} />;
                case 'invoice-management': return <InvoiceManagementAdmin state={dbState} onNavigate={navigateTo} />;
                case 'customer-360': return <CustomerPortal state={dbState} />;
                case 'user-app': return <UserAppManagement state={dbState} />;
                case 'wallet': return <WalletManagement state={dbState} />;
                case 'dealers': return <DealerManagement state={dbState} />;
                case 'emergency-load': return <EmergencyLoadAdmin state={dbState} />;
                case 'connection-setup': return <ConnectionSetupAdmin state={dbState} />;
                case 'tickets': return <TicketManagementAdmin state={dbState} />;
                case 'about-us': return <AboutUs state={dbState} />;
                case 'admin-live-monitoring': return <AdminLiveMonitoring state={dbState} />;
                case 'admin-password-requests': return <AdminPasswordRequests state={dbState} />;
                case 'admin-devices': return <DeviceManagement state={dbState} />;
                case 'admin-device-mapping': return <UserDeviceMapping state={dbState} />;
                case 'admin-profile': return <AdminProfile state={dbState} />;
                case 'tasks': return <TaskManagement state={dbState} />;
                // Communication Hub
                case 'comm-campaigns': return <EmailCampaigns state={dbState} />;
                case 'comm-templates': return <EmailTemplates state={dbState} />;
                case 'comm-rules': return <AutomationRules state={dbState} />;
                case 'comm-push': return <PushNotifications state={dbState} />;
                case 'comm-segments': return <AudienceSegments state={dbState} />;
                case 'comm-logs': return <DeliveryLogs state={dbState} />;
                case 'comm-settings': return <CommunicationSettingsPage state={dbState} />;
                case 'comm-identities': return <SenderIdentities state={dbState} />;
                default: return <Dashboard state={dbState} />;
              }
           })()}
        </main>
      </div>
      <AIAgentWidget state={dbState} />
    </div>
  );
};

export default App;
