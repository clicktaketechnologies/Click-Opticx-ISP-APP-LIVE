import React, { useState, useEffect, useMemo, lazy, Suspense, Component, useTransition } from 'react';
import { db } from './db';
import { MasterApprovalDashboard } from './pages/MasterApprovalDashboard';
import { Role, AppState, SystemNotification, UserStatus } from './types';
import {
  Receipt, Wallet, ShieldCheck, LogOut,
  Wifi, Database, UserCheck, FileInput, ShieldAlert, Settings, Server, ChevronRight, DatabaseZap, Loader2, Cloud, X, Zap, RotateCw, RefreshCcw, CheckCircle
} from 'lucide-react';
import { PWAPrompt } from './components/PWAPrompt';
import Modal from './components/shared/Modal';
import { Mini5GMicroLoader } from './components/Mini5GMicroLoader';
import { initDualWrite } from './lib/db-adapter';

// Helper to handle chunk loading errors (force reload on new deployments)
const lazyWithRetry = (componentImport: () => Promise<any>) => 
  lazy(() => componentImport().catch(() => {
    window.location.reload();
    return { default: () => null };
  }));

// Lazy load pages
const Login = lazyWithRetry(() => import('./pages/Login'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const UserManagement = lazyWithRetry(() => import('./pages/UserManagement'));
const Recovery = lazyWithRetry(() => import('./pages/Recovery'));
const RecoveryDashboard = lazyWithRetry(() => import('./pages/RecoveryDashboard'));
const AccountingLedger = lazyWithRetry(() => import('./pages/AccountingLedger'));
import Sidebar from './components/Sidebar';
import Header from './components/Header';
const PackagesPage = lazyWithRetry(() => import('./pages/PackagesPage'));
const ArchivePage = lazyWithRetry(() => import('./pages/ArchivePage'));
const AccessControlPage = lazyWithRetry(() => import('./pages/AccessControlPage'));
const ResellerManagement = lazyWithRetry(() => import('./pages/ResellerManagement'));
const PermissionsPage = lazyWithRetry(() => import('./pages/PermissionsPage'));
const DataImportPage = lazyWithRetry(() => import('./pages/DataImportPage'));
const DatabaseMonitor = lazyWithRetry(() => import('./pages/DatabaseMonitor'));
const FiscalMonitor = lazyWithRetry(() => import('./pages/FiscalMonitor'));
const ResponseMapperConfig = lazyWithRetry(() => import('./pages/ResponseMapperConfig'));
const CacheManagement = lazyWithRetry(() => import('./pages/CacheManagement'));
const BusinessSettings = lazyWithRetry(() => import('./pages/BusinessSettings'));
const PaymentMethodsIndex = lazyWithRetry(() => import('./pages/PaymentMethodsIndex'));
const StripeSettings = lazyWithRetry(() => import('./pages/gateways/StripeSettings'));
const CashSettings = lazyWithRetry(() => import('./pages/gateways/CashSettings'));
const JazzCashSettings = lazyWithRetry(() => import('./pages/gateways/JazzCashSettings'));
const EasyPaisaSettings = lazyWithRetry(() => import('./pages/gateways/EasyPaisaSettings'));
const PayPalSettings = lazyWithRetry(() => import('./pages/gateways/PayPalSettings'));
const PayFastSettings = lazyWithRetry(() => import('./pages/gateways/PayFastSettings'));
const HomeCollectionSettings = lazyWithRetry(() => import('./pages/gateways/HomeCollectionSettings'));
const BankTransferSettings = lazyWithRetry(() => import('./pages/gateways/BankTransferSettings'));
const InvoiceGenerator = lazyWithRetry(() => import('./pages/InvoiceGenerator'));
const InvoiceManagementAdmin = lazyWithRetry(() => import('./pages/InvoiceManagementAdmin'));
const CustomerPortal = lazyWithRetry(() => import('./pages/CustomerPortal'));
const SubscriberApp = lazyWithRetry(() => import('./SubscriberApp'));
const UserAppManagement = lazyWithRetry(() => import('./pages/UserAppManagement'));
const WalletManagement = lazyWithRetry(() => import('./pages/WalletManagement'));
const EmergencyLoadAdmin = lazyWithRetry(() => import('./pages/EmergencyLoadAdmin'));
const CreditScoreAdmin = lazyWithRetry(() => import('./pages/CreditScoreAdmin'));
const ReferralAdmin = lazyWithRetry(() => import('./pages/ReferralAdmin'));
const ConnectionSetupAdmin = lazyWithRetry(() => import('./pages/ConnectionSetupAdmin'));
const TicketManagementAdmin = lazyWithRetry(() => import('./pages/TicketManagementAdmin'));
const TaskManagement = lazyWithRetry(() => import('./pages/TaskManagement'));
const MultiCloudSync = lazyWithRetry(() => import('./pages/MultiCloudSync'));
const SystemDeploymentCenter = lazyWithRetry(() => import('./pages/SystemDeploymentCenter'));
const AboutUs = lazyWithRetry(() => import('./pages/AboutUs'));
const AdminLiveMonitoring = lazyWithRetry(() => import('./pages/AdminLiveMonitoring'));
const AdminPasswordRequests = lazyWithRetry(() => import('./pages/AdminPasswordRequests'));
const UserDeviceMapping = lazyWithRetry(() => import('./pages/UserDeviceMapping'));
const AdminProfile = lazyWithRetry(() => import('./pages/AdminProfile'));
const AIControlPlane = lazyWithRetry(() => import('./pages/AIControlPlane'));
const AICentralDashboard = lazyWithRetry(() => import('./pages/AICentralDashboard'));
const AICallingAdmin = lazyWithRetry(() => import('./pages/AICallingAdmin'));
const AICallLogs = lazyWithRetry(() => import('./pages/AICallLogs'));
const EmailControlCenter = lazyWithRetry(() => import('./pages/comm/EmailControlCenter'));
const AdminReminders = lazyWithRetry(() => import('./pages/AdminReminders'));
const NASManagement = lazyWithRetry(() => import('./pages/NASManagement'));
const OLTManagement = lazyWithRetry(() => import('./pages/OLTManagement'));
const NOCDashboard = lazyWithRetry(() => import('./pages/NOCDashboard'));
const AuthControlCenter = lazyWithRetry(() => import('./pages/AuthControlCenter'));
const SystemFlash = lazyWithRetry(() => import('./pages/SystemFlash'));
const SystemConfig = lazyWithRetry(() => import('./pages/SystemConfig'));
const SystemReadiness = lazyWithRetry(() => import('./pages/SystemReadiness'));
const SpeedTestPage = lazyWithRetry(() => import('./pages/SpeedTestPage'));
const HotspotManager = lazyWithRetry(() => import('./pages/HotspotManager'));
const PastRecords = lazyWithRetry(() => import('./pages/PastRecords'));
const KYCManagement = lazyWithRetry(() => import('./pages/KYCManagement'));
const ProviderConfigPage = lazyWithRetry(() => import('./pages/ProviderConfigPage'));
const MigrationDashboard = lazyWithRetry(() => import('./pages/MigrationDashboard'));
const DashboardV2 = lazyWithRetry(() => import('./pages/v2/DashboardV2'));
const UserManagementV2 = lazyWithRetry(() => import('./pages/v2/UserManagementV2'));
const FiscalHubV2 = lazyWithRetry(() => import('./pages/v2/FiscalHubV2'));
const NetworkPlaneV2 = lazyWithRetry(() => import('./pages/v2/NetworkPlaneV2'));
const CommCenterV2 = lazyWithRetry(() => import('./pages/v2/CommCenterV2'));
const AIAutomationV2 = lazyWithRetry(() => import('./pages/v2/AIAutomationV2'));

const NotificationControl = lazyWithRetry(() => import('./pages/admin/NotificationControl'));
const AdminUserDevices = lazyWithRetry(() => import('./pages/admin/AdminUserDevices'));
const NotificationAnalytics = lazyWithRetry(() => import('./pages/admin/NotificationAnalytics'));

const SafeStub = ({ name, route }: { name: string, route: string }) => (
  <div className="p-10 text-center animate-in fade-in h-full flex flex-col items-center justify-center">
    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4"><Zap size={24} /></div>
    <h2 className="text-2xl font-black text-slate-900 mb-2">{name}</h2>
    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Route: {route} • Status: Awaiting Implementation</p>
  </div>
);

const AdminDevicesStub = lazyWithRetry(() => Promise.resolve({ default: () => <SafeStub name="OLT Devices" route="/admin-devices" /> }));

// Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[SYSTEM-FAULT]", error, errorInfo);
    db.logAudit('System Fault', 'ERROR', `UI Crash detected: ${error.message}`, 'SYSTEM', 'UI_ENGINE');
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 font-sans">
           <div className="max-w-2xl w-full bg-slate-900 rounded-[3rem] p-12 border border-slate-800 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-500/20 shadow-inner">
                  <ShieldAlert className="text-rose-500 animate-pulse" size={48} />
                </div>
                
                <h1 className="text-4xl font-black text-white italic tracking-tighter mb-4 leading-none">System Fault Detected</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">ISP Admin Protocol V2 • Emergency Halt</p>
                
                <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 mb-10 text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Diagnostic Kernel Trace</p>
                  </div>
                  <code className="text-xs text-slate-500 font-mono break-all leading-relaxed">
                    {this.state.error?.stack?.split('\n').slice(0, 3).join('\n') || 'Stack trace unavailable'}
                  </code>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-3 py-5 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-750 transition-all active:scale-95 border border-slate-700"
                  >
                    <RotateCw size={16} />
                    Reboot Protocol
                  </button>
                  <button 
                    onClick={this.handleReset}
                    className="flex items-center justify-center gap-3 py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-900/40 hover:bg-rose-700 transition-all active:scale-95"
                  >
                    <Zap size={16} />
                    Factory Reset
                  </button>
                </div>
                
                <p className="mt-8 text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
                  Critical Error logged to NOC audit stream. If issue persists, contact DevOps.
                </p>
              </div>
              
              <div className="absolute -right-20 -bottom-20 opacity-[0.03] rotate-12 scale-150 pointer-events-none">
                <ShieldAlert size={300} />
              </div>
           </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [dbState, setDbState] = useState<AppState>(db.getState());
  const [authState, setAuthState] = useState(db.getState().auth);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState<any>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // 1. Subscribe to State Updates
    const unsubscribe = db.onStateChange((state) => {
      setDbState(state);
      setAuthState(state.auth);
    });

    // 2. Initial Background Audit
    db.auditOverdueLoads();
    db.reconcileData('entire');

    // 3. System Cron Job (Runs every 5 minutes)
    const systemCron = setInterval(() => {
      console.log("[SYSTEM] Executing Background Maintenance...");
      db.auditOverdueLoads();
      db.reconcileData('entire');
    }, 5 * 60 * 1000);

    // 4. Initialize Dual-Write Adapter (Phase 1-2)
    initDualWrite();

    return () => {
      unsubscribe();
      clearInterval(systemCron);
    };
  }, []);

  const handleLogin = async (credential: string, pass: string) => {
    return await db.login(credential, pass);
  };

  const handleLogout = () => {
    db.commit({ auth: { isLoggedIn: false }, view: 'login' });
  };

  const navigateTo = (page: string) => {
    startTransition(() => {
      setCurrentPage(page);
    });
  };

  const renderLegacyPage = (p: string) => {
    switch (p) {
      case 'dashboard': return <Dashboard state={dbState} onNavigate={navigateTo} searchTerm={globalSearchTerm} onClearSearch={() => setGlobalSearchTerm('')} />;
      case 'ai-control': return <AIControlPlane state={dbState} />;
      case 'ai-central': return <AICentralDashboard state={dbState} />;
      case 'ai-calling': return <AICallingAdmin state={dbState} />;
      case 'ai-call-logs': return <AICallLogs state={dbState} />;
      case 'users': return <UserManagement state={dbState} searchTerm={globalSearchTerm} />;
      case 'packages': return <PackagesPage state={dbState} />;
      case 'approval-desk': return <MasterApprovalDashboard state={dbState} />;
      case 'recovery': return <Recovery state={dbState} searchTerm={globalSearchTerm} />;
      case 'recovery-dashboard': return <RecoveryDashboard state={dbState} />;
      case 'accounting': return <AccountingLedger state={dbState} />;
      case 'archive': return <ArchivePage state={dbState} />;
      case 'staff': return <AccessControlPage state={dbState} />;
      case 'system-flash': return <SystemFlash state={dbState} />;
      case 'system-config': return <SystemConfig />;
      case 'system-readiness': return <SystemReadiness />;
      case 'reseller-management': return <ResellerManagement state={dbState} />;
      case 'permissions': return <PermissionsPage state={dbState} />;
      case 'import': return <DataImportPage state={dbState} />;
      case 'monitor': return <DatabaseMonitor state={dbState} />;
      case 'cache': return <CacheManagement state={dbState} />;
      case 'business-settings': return <BusinessSettings state={dbState} />;
      case 'auth-control': return <AuthControlCenter state={dbState} />;
      case 'system-deployment': return <SystemDeploymentCenter state={dbState} />;
      case 'provider-config': return <ProviderConfigPage state={dbState} />;
      case 'migration-dashboard': return <MigrationDashboard state={dbState} />;
      case 'gateway-settings': return <PaymentMethodsIndex state={dbState} onNavigate={navigateTo} />;
      case 'fiscal-monitor': return <FiscalMonitor state={dbState} />;
      case 'response-mapper': return <ResponseMapperConfig state={dbState} />;
      case 'gateway-stripe': return <StripeSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'gateway-cash': return <CashSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'gateway-jazzcash': return <JazzCashSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'gateway-easypaisa': return <EasyPaisaSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'gateway-paypal': return <PayPalSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'gateway-payfast': return <PayFastSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'gateway-home': return <HomeCollectionSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'gateway-bank': return <BankTransferSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />;
      case 'invoice-engine': return <InvoiceGenerator state={dbState} onNavigate={navigateTo} />;
      case 'invoice-management': return <InvoiceManagementAdmin state={dbState} onNavigate={navigateTo} />;
      case 'customer-360': return <CustomerPortal state={dbState} />;
      case 'user-app': return <UserAppManagement state={dbState} />;
      case 'wallet': return <WalletManagement state={dbState} />;
      case 'dealers': return <ResellerManagement state={dbState} />;
      case 'emergency-load': return <EmergencyLoadAdmin state={dbState} />;
      case 'connection-setup': return <ConnectionSetupAdmin state={dbState} />;
      case 'tickets': return <TicketManagementAdmin state={dbState} />;
      case 'about-us': return <AboutUs state={dbState} />;
      case 'admin-live-monitoring': return <AdminLiveMonitoring state={dbState} />;
      case 'admin-password-requests': return <AdminPasswordRequests state={dbState} />;
      case 'admin-device-mapping': return <UserDeviceMapping state={dbState} />;
      case 'admin-profile': return <AdminProfile state={dbState} />;
      case 'tasks': return <TaskManagement state={dbState} />;
      case 'comm-center': return <EmailControlCenter state={dbState} activePage={p} />;
      case 'admin-reminders': return <AdminReminders state={dbState} onNavigate={navigateTo} />;
      case 'kyc-hub': return <KYCManagement state={dbState} />;
      case 'cloud-storage': return <MultiCloudSync state={dbState} />;
      case 'nas-management': return <NASManagement state={dbState} />;
      case 'olt-management': return <OLTManagement state={dbState} />;
      case 'hotspot-tokens': return <HotspotManager state={dbState} />;
      case 'archive-records': return <PastRecords state={dbState} />;
      case 'noc-dashboard': return <NOCDashboard state={dbState} />;
      case 'speed-test': return <SpeedTestPage />;
      case 'notification-control': return <NotificationControl state={dbState} />;
      case 'admin-user-devices': return <AdminUserDevices state={dbState} />;
      case 'comm-logs': return <NotificationAnalytics state={dbState} />;
      case 'admin-devices': return <AdminDevicesStub />;
      case 'comm-templates': 
      case 'comm-campaigns': 
      case 'comm-push': 
      case 'comm-rules': 
      case 'comm-segments': 
      case 'comm-settings': 
        return <EmailControlCenter state={dbState} activePage={p} />;
      default: return <Dashboard state={dbState} onNavigate={navigateTo} onClearSearch={() => setGlobalSearchTerm('')} />;
    }
  };

  const renderApp = () => {
    if (dbState.view === 'login') return <Login onLogin={handleLogin} />;
    if (authState.role === 'Subscriber' || authState.role === 'Customer') return <SubscriberApp state={dbState} user={authState as any} onLogout={handleLogout} />;

    // V2 Layout is now the DEFAULT admin experience
    // V3 layout available via ?layout=v3 URL param
    const forceV3 = new URLSearchParams(window.location.search).get('layout') === 'v3';

    if (forceV3) {
      return (
        <V3Layout state={dbState} activePage={currentPage} onNavigate={navigateTo} onLogout={handleLogout}>
          <Suspense fallback={<Mini5GMicroLoader size={60} />}>
            {(() => {
              // Route to new V2 dashboards if available, else fallback to legacy components
              switch (currentPage) {
                case 'dashboard': return <DashboardV2 state={dbState} />;
                case 'users': return <UserManagementV2 state={dbState} />;
                case 'finance': return <FiscalHubV2 state={dbState} />;
                case 'network': return <NetworkPlaneV2 state={dbState} />;
                case 'comm-center': return <CommCenterV2 state={dbState} />;
                case 'automation': return <AIAutomationV2 state={dbState} />;
                default: return renderLegacyPage(currentPage);
              }
            })()}
          </Suspense>
        </V3Layout>
      );
    }

    return (
      <div className="flex min-h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          current={currentPage}
          onNavigate={navigateTo}
          role={authState.role}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          businessName={dbState.settings.branding.businessName}
          state={dbState}
        />
        {/* Mobile overlay to capture clicks and close sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-[119] bg-black/30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isCollapsed ? 'lg:pl-[70px]' : 'lg:pl-72'}`}>
          <Header
            user={authState as any}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onProfileClick={() => navigateTo('admin-profile')}
            onLogout={handleLogout}
            searchTerm={globalSearchTerm}
            onSearch={setGlobalSearchTerm}
            isPending={isPending}
          />
          <main className="p-3 md:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
            <Suspense fallback={<Mini5GMicroLoader size={40} />}>
              {renderLegacyPage(currentPage)}
            </Suspense>
          </main>
        </div>
        <Modal
            isOpen={!!criticalAlert}
            onClose={() => setCriticalAlert(null)}
            title={criticalAlert?.title || "System Alert"}
            type="danger"
            icon={<ShieldAlert size={24} className="text-white" />}
            footer={
              <button onClick={() => setCriticalAlert(null)} className="w-full py-4 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2">
                Acknowledge Alert <ShieldCheck size={16} />
              </button>
            }
        >
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed text-center py-4">{criticalAlert?.message}</p>
        </Modal>

        {new URLSearchParams(window.location.search).get('debug') === 'sidebar' && (
          <div className="fixed bottom-4 left-4 z-[999] bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-rose-500/30 text-xs w-80 font-mono">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
              <strong className="text-rose-400">SIDEBAR DIAGNOSTICS</strong>
              <button onClick={() => window.history.replaceState({}, '', window.location.pathname)}><X size={14}/></button>
            </div>
            <p>Auth Role: <span className="text-emerald-400">{authState.role || 'UNDEFINED'}</span></p>
            <p>Permissions Loaded: <span className="text-emerald-400">{dbState.permissions?.length || 0}</span></p>
            <p>Active Route ID: <span className="text-blue-400">{currentPage}</span></p>
            <div className="mt-2 pt-2 border-t border-white/10">
               <p className="text-[9px] text-slate-400">If items are missing, check console or App.tsx routing map.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<Mini5GMicroLoader size={60} />}>
        {renderApp()}
      </Suspense>
      <PWAPrompt />
    </ErrorBoundary>
  );
};

export default App;
