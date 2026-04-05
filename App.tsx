import React, { useState, useEffect, useMemo, lazy, Suspense, Component, useTransition } from 'react';
import { db } from './db';
import { MasterApprovalDashboard } from './pages/MasterApprovalDashboard';
import { Role, AppState, SystemNotification, UserStatus } from './types';
import {
  Receipt, Wallet, ShieldCheck, LogOut,
  Wifi, Database, UserCheck, FileInput, ShieldAlert, Settings, Server, ChevronRight, DatabaseZap, Loader2, Cloud, X, Zap, RefreshCcw, CheckCircle
} from 'lucide-react';
import { PWAPrompt } from './components/PWAPrompt';
import Modal from './components/shared/Modal';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Recovery = lazy(() => import('./pages/Recovery'));
const RecoveryDashboard = lazy(() => import('./pages/RecoveryDashboard'));
const AccountingLedger = lazy(() => import('./pages/AccountingLedger'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const Header = lazy(() => import('./components/Header'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const AccessControlPage = lazy(() => import('./pages/AccessControlPage'));
const DealerManagement = lazy(() => import('./pages/DealerManagement'));
const PermissionsPage = lazy(() => import('./pages/PermissionsPage'));
const DataImportPage = lazy(() => import('./pages/DataImportPage'));
const DatabaseMonitor = lazy(() => import('./pages/DatabaseMonitor'));
const CacheManagement = lazy(() => import('./pages/CacheManagement'));
const BusinessSettings = lazy(() => import('./pages/BusinessSettings'));
const PaymentMethodsIndex = lazy(() => import('./pages/PaymentMethodsIndex'));
const StripeSettings = lazy(() => import('./pages/gateways/StripeSettings'));
const CashSettings = lazy(() => import('./pages/gateways/CashSettings'));
const JazzCashSettings = lazy(() => import('./pages/gateways/JazzCashSettings'));
const EasyPaisaSettings = lazy(() => import('./pages/gateways/EasyPaisaSettings'));
const PayPalSettings = lazy(() => import('./pages/gateways/PayPalSettings'));
const PayFastSettings = lazy(() => import('./pages/gateways/PayFastSettings'));
const HomeCollectionSettings = lazy(() => import('./pages/gateways/HomeCollectionSettings'));
const BankTransferSettings = lazy(() => import('./pages/gateways/BankTransferSettings'));
const InvoiceGenerator = lazy(() => import('./pages/InvoiceGenerator'));
const InvoiceManagementAdmin = lazy(() => import('./pages/InvoiceManagementAdmin'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const SubscriberApp = lazy(() => import('./SubscriberApp'));
const UserAppManagement = lazy(() => import('./pages/UserAppManagement'));
const WalletManagement = lazy(() => import('./pages/WalletManagement'));
const EmergencyLoadAdmin = lazy(() => import('./pages/EmergencyLoadAdmin'));
const CreditScoreAdmin = lazy(() => import('./pages/CreditScoreAdmin'));
const ReferralAdmin = lazy(() => import('./pages/ReferralAdmin'));
const ConnectionSetupAdmin = lazy(() => import('./pages/ConnectionSetupAdmin'));
const TicketManagementAdmin = lazy(() => import('./pages/TicketManagementAdmin'));
const TaskManagement = lazy(() => import('./pages/TaskManagement'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const AdminLiveMonitoring = lazy(() => import('./pages/AdminLiveMonitoring'));
const AdminPasswordRequests = lazy(() => import('./pages/AdminPasswordRequests'));
const UserDeviceMapping = lazy(() => import('./pages/UserDeviceMapping'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const AIControlPlane = lazy(() => import('./pages/AIControlPlane'));
const AICentralDashboard = lazy(() => import('./pages/AICentralDashboard'));
const AICallingAdmin = lazy(() => import('./pages/AICallingAdmin'));
const AICallLogs = lazy(() => import('./pages/AICallLogs'));
const EmailControlCenter = lazy(() => import('./pages/comm/EmailControlCenter'));
const AdminReminders = lazy(() => import('./pages/AdminReminders'));
const NASManagement = lazy(() => import('./pages/NASManagement'));
const OLTManagement = lazy(() => import('./pages/OLTManagement'));
const NOCDashboard = lazy(() => import('./pages/NOCDashboard'));
const AuthControlCenter = lazy(() => import('./pages/AuthControlCenter'));
const SystemFlash = lazy(() => import('./pages/SystemFlash'));
const SystemConfig = lazy(() => import('./pages/SystemConfig'));
const SystemReadiness = lazy(() => import('./pages/SystemReadiness'));
const SpeedTestPage = lazy(() => import('./pages/SpeedTestPage'));
const HotspotManager = lazy(() => import('./pages/HotspotManager'));
const PastRecords = lazy(() => import('./pages/PastRecords'));
import { Mini5GMicroLoader } from './components/Mini5GMicroLoader';

interface EBProps {
  children: React.ReactNode;
}

interface EBState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<EBProps, EBState> {
  state: EBState = { hasError: false, error: null };

  constructor(props: EBProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    // Auto-recovery for dynamic import failures (ChunkLoadError)
    const isChunkError = error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('last-chunk-reload');
      const now = Date.now();

      // Only auto-reload if we haven't tried in the last 10 seconds (prevent loops)
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('last-chunk-reload', now.toString());
        console.warn('[RECOVERY] Chunk load failure detected. Forcing manifest sync...');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message.includes('ChunkLoadError') ||
        this.state.error?.message.includes('Failed to fetch dynamically imported module');

      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white text-center">
          <ShieldAlert className="text-rose-500 mb-6" size={64} />
          <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-4">
            {isChunkError ? 'Asset Synchronization' : 'System Fault Detected'}
          </h1>
          <p className="text-slate-400 max-w-md text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
            {isChunkError
              ? 'A critical system update or network fluctuation has occurred. We are synchronizing your local cache with the latest server assets.'
              : 'An unexpected runtime error has occurred. Our secondary containment has isolated the issue. Detailed trace logged to console.'}
          </p>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-8 max-w-lg overflow-auto">
            <code className="text-rose-400 text-[10px] break-all">{this.state.error?.message}</code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <RefreshCcw size={16} className={isChunkError ? 'animate-spin' : ''} />
            {isChunkError ? 'Synchronizing Manifest...' : 'Re-Initialize System'}
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AppState['currentUser']>(db.getState().currentUser);
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [dbState, setDbState] = useState<AppState>(db.getState());
  const [isConfigured, setIsConfigured] = useState(db.isConfigured());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetAction, setTargetAction] = useState<string | null>(null);
  const [criticalAlert, setCriticalAlert] = useState<SystemNotification | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  useEffect(() => {
    // FORCE HARD REFRESH ON VERSION BUMP
    const SYSTEM_VERSION = '1.2.7'; // Increment this to force reload
    const lastVersion = localStorage.getItem('clickopticx_sys_version');
    if (lastVersion !== SYSTEM_VERSION) {
       console.warn('[SYSTEM] Version Mismatch. Clearing asset cache and re-initializing...');
       localStorage.setItem('clickopticx_sys_version', SYSTEM_VERSION);
       // Clear chunk reload tracking to ensure fresh start
       sessionStorage.removeItem('last-chunk-reload');
       window.location.reload();
       return;
    }

    const unsubscribe = db.onStateChange((newState) => {
      console.log('App state updated:', newState.currentUser?.email, 'Configured:', db.isConfigured());
      startTransition(() => {
        setDbState(newState);
        setAuthState(newState.currentUser);
        setIsConfigured(db.isConfigured());
      });

      // Global Branding Updates
      const branding = newState.settings.branding;
      document.title = branding.brandName || branding.appTitle || 'Click Opticx ISP';
      const link: any = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = branding.favicon || branding.logo || '/favicon.ico';
      document.getElementsByTagName('head')[0].appendChild(link);

      const user = newState.currentUser;
      if (user && user.role !== Role.CUSTOMER) {
        const criticals = newState.notifications.filter(n => !n.read && n.priority === 'critical' && (n.audience === 'admin' || n.audience === 'system'));
        if (criticals.length > 0) setCriticalAlert(criticals[0]);
      }
    });

    // Ensure state transition if already configured on mount
    if (db.isConfigured()) {
      setIsConfigured(true);
      const branding = db.getState().settings.branding;
      document.title = branding.brandName || branding.appTitle || 'Click Opticx ISP';
    }

    return () => unsubscribe();
  }, []);

  const handleLogin = async (credential: string, pass: string) => {
    console.log('App.tsx: Login attempt initiated for credential:', credential);
    const res = await db.login(credential, pass);
    console.log('App.tsx: Login result:', res.success ? 'Success' : 'Failed', res.message || '');
    return res;
  };
  const handleLogout = () => {
    console.log('App.tsx: Logout initiated.');
    db.logout();
    setCurrentPage('dashboard');
  };

  const navigateTo = (page: string, params?: { userId?: string, action?: string }) => {
    startTransition(() => {
      if (params?.userId) setTargetUserId(params.userId);
      else setTargetUserId(null);

      if (params?.action) setTargetAction(params.action);
      else setTargetAction(null);

      setCurrentPage(page);
      setIsSidebarOpen(false);
    });
  };

  const dismissCritical = () => {
    if (criticalAlert) db.markNotificationRead(criticalAlert.id);
    setCriticalAlert(null);
  };

  const renderConfiguring = () => {
    const branding = dbState.settings?.branding || { businessName: 'Click Opticx', shortName: 'CO ISP', logoLight: '', logoDark: '', logoSquare: '', favicon: '', primaryColor: '#1570ef', secondaryColor: '#32d583', accentColor: '#f59e0b', textColorLight: '#ffffff', textColorDark: '#0f172a', primaryFont: 'Inter', secondaryFont: 'Inter' };
    const profile = dbState.settings?.profile || { tagline: 'Connecting to Cloud Securely' };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center selection:bg-blue-500/30 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
          <div className="mb-12 relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-30 transition-opacity duration-1000"></div>
            <div className="w-28 h-28 flex items-center justify-center relative overflow-hidden">
              {branding.logoDark ? (
                <img 
                  src={branding.logoDark} 
                  className="w-full h-full object-contain animate-in zoom-in-50 duration-700" 
                  alt="Logo" 
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/favicon.png'; }}
                />
              ) : (
                <img src="/favicon.png" className="w-full h-full object-contain animate-pulse" alt="Click Opticx" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-slate-950 animate-bounce">
              <CheckCircle size={14} className="text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-500">
              {branding.shortName || branding.businessName}
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed opacity-80 max-w-[200px]">
              {profile.tagline || "Connecting to Cloud Securely"}
            </p>
          </div>

          <div className="mt-16 w-full max-w-[180px] space-y-6">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 w-full animate-loading-bar shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Mini5GMicroLoader size={24} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Synchronizing</span>
            </div>
          </div>
        </div>


      </div>
    );
  };

  const renderApp = () => {
    if (!isConfigured) return renderConfiguring();

    if (dbState.currentUser?.status === UserStatus.BLOCKED) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.1)_0%,transparent_70%)] animate-pulse"></div>
          <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center space-y-8 shadow-2xl relative z-10 border border-rose-100 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-rose-100 shadow-xl shadow-rose-500/10">
              <ShieldAlert size={48} strokeWidth={2.5} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Access Restricted</h2>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em]">Identity Node Locked</p>
              <p className="text-sm text-slate-500 font-medium leading-relaxed pt-4">
                Your account access has been restricted by the administration. All terminal operations and data transfers are currently suspended.
              </p>
            </div>
            <div className="pt-6">
              <button
                onClick={handleLogout}
                className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl"
              >
                Terminate Session
              </button>
              <p className="mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol ID: {dbState.currentUser.id}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!authState) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center"><Mini5GMicroLoader size={48} /><p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Security Handshake...</p></div>}>
          <Login onLogin={handleLogin} />
        </Suspense>
      );
    }

    if (authState.role === Role.CUSTOMER) {
      console.log('Rendering Customer Portal');
      return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center"><Mini5GMicroLoader size={48} /><p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Portal...</p></div>}>
          {dbState.isImpersonating && (
            <div className="fixed top-0 inset-x-0 bg-rose-600 text-white p-3 z-[1000] flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3"><ShieldAlert size={20} className="animate-pulse" /><p className="text-[10px] font-black uppercase tracking-widest">Admin View Active: Viewing as {authState.name}</p></div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg text-[9px] font-black uppercase"><LogOut size={12} /> Exit</button>
            </div>
          )}
          <SubscriberApp state={dbState} user={authState as any} onLogout={handleLogout} />
        </Suspense>
      );
    }

    console.log('Rendering Admin Layout, Page:', currentPage);
    return (
      <div className="flex min-h-screen bg-slate-50 overflow-hidden">
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-slate-950"><Mini5GMicroLoader size={48} /></div>}>
          <Modal
            isOpen={!!criticalAlert}
            onClose={dismissCritical}
            title={criticalAlert?.title || "System Alert"}
            type="danger"
            icon={<ShieldAlert size={24} className="text-white" />}
            footer={
              <button
                onClick={dismissCritical}
                className="w-full py-4 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Acknowledge Alert <ShieldCheck size={16} />
              </button>
            }
          >
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed text-center py-4">
              {criticalAlert?.message}
            </p>
          </Modal>

          {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)} />}
          <Sidebar
            current={currentPage}
            onNavigate={navigateTo}
            role={authState.role}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            businessName={dbState.settings.branding.businessName}
          />
          <div
            className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:pl-[70px]' : 'lg:pl-72'}`}
          >
            <Header
              user={authState as any}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onProfileClick={() => navigateTo('admin-profile')}
              onLogout={handleLogout}
              searchTerm={globalSearchTerm}
              onSearch={setGlobalSearchTerm}
              isPending={isPending}
            />
            <main className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
              <Suspense fallback={
                <div className="h-full w-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                  <div className="relative flex items-center justify-center h-20">
                    <Mini5GMicroLoader size={40} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse italic">Synchronizing Node...</p>
                </div>
              }>
                {(() => {
                  switch (currentPage) {
                    case 'dashboard': return <Dashboard state={dbState} onNavigate={navigateTo} searchTerm={globalSearchTerm} onClearSearch={() => setGlobalSearchTerm('')} />;
                    case 'ai-control': return <AIControlPlane state={dbState} />;
                    case 'ai-central': return <AICentralDashboard state={dbState} />;
                    case 'ai-calling': return <AICallingAdmin state={dbState} />;
                    case 'ai-call-logs': return <AICallLogs state={dbState} />;
                    case 'users': return <UserManagement state={dbState} autoOpenAction={targetAction || undefined} searchTerm={globalSearchTerm} />;
                    case 'packages': return <PackagesPage state={dbState} />;
                    case 'approval-desk': return <MasterApprovalDashboard state={dbState} />;
                    case 'recovery': return <Recovery state={dbState} autoOpenAction={targetAction || undefined} searchTerm={globalSearchTerm} />;
                    case 'recovery-dashboard': return <RecoveryDashboard state={dbState} />;
                    case 'accounting': return <AccountingLedger state={dbState} />;
                    case 'archive': return <ArchivePage state={dbState} />;
                    case 'staff': return <AccessControlPage state={dbState} />;
                    case 'system-flash': return <SystemFlash state={dbState} />;
                    case 'system-config': return <SystemConfig />;
                    case 'system-readiness': return <SystemReadiness />;
                    case 'permissions': return <PermissionsPage state={dbState} />;
                    case 'import': return <DataImportPage state={dbState} />;
                    case 'monitor': return <DatabaseMonitor state={dbState} />;
                    case 'cache': return <CacheManagement state={dbState} />;
                    case 'business-settings': return <BusinessSettings state={dbState} />;
                    case 'auth-control': return <AuthControlCenter state={dbState} />;
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
                    case 'admin-device-mapping': return <UserDeviceMapping state={dbState} />;
                    case 'admin-profile': return <AdminProfile state={dbState} />;
                    case 'tasks': return <TaskManagement state={dbState} />;
                    case 'comm-campaigns':
                    case 'comm-templates':
                    case 'comm-rules':
                    case 'notification-control':
                    case 'notification-analytics':
                    case 'admin-user-devices':
                    case 'comm-push':
                    case 'comm-segments':
                    case 'comm-logs':
                    case 'comm-settings':
                    case 'comm-identities':
                      return <EmailControlCenter state={dbState} activePage={currentPage} />;
                    case 'admin-reminders': return <AdminReminders state={dbState} onNavigate={navigateTo} />;
                    case 'nas-management': return <NASManagement state={dbState} />;
                    case 'olt-management': return <OLTManagement state={dbState} />;
                    case 'hotspot-tokens': return <HotspotManager state={dbState} />;
                    case 'archive-records': return <PastRecords state={dbState} />;
                    case 'noc-dashboard': return <NOCDashboard state={dbState} />;
                    case 'speed-test': return <SpeedTestPage />;
                    default: return <Dashboard state={dbState} onNavigate={navigateTo} onClearSearch={() => setGlobalSearchTerm('')} />;
                  }
                })()}
              </Suspense>
            </main>
          </div>
        </Suspense>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      {renderApp()}
      <PWAPrompt />
    </ErrorBoundary>
  );
};

export default App;

