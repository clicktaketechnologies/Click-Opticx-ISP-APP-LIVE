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

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Recovery = lazy(() => import('./pages/Recovery'));
const RecoveryDashboard = lazy(() => import('./pages/RecoveryDashboard'));
const AccountingLedger = lazy(() => import('./pages/AccountingLedger'));
import Sidebar from './components/Sidebar';
import Header from './components/Header';
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const AccessControlPage = lazy(() => import('./pages/AccessControlPage'));
const ResellerManagement = lazy(() => import('./pages/ResellerManagement'));
const PermissionsPage = lazy(() => import('./pages/PermissionsPage'));
const DataImportPage = lazy(() => import('./pages/DataImportPage'));
const DatabaseMonitor = lazy(() => import('./pages/DatabaseMonitor'));
const FiscalMonitor = lazy(() => import('./pages/FiscalMonitor'));
const ResponseMapperConfig = lazy(() => import('./pages/ResponseMapperConfig'));
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
const MultiCloudSync = lazy(() => import('./pages/MultiCloudSync'));
const SystemDeploymentCenter = lazy(() => import('./pages/SystemDeploymentCenter'));
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
const KYCManagement = lazy(() => import('./pages/KYCManagement'));
const ProviderConfigPage = lazy(() => import('./pages/ProviderConfigPage'));
const MigrationDashboard = lazy(() => import('./pages/MigrationDashboard'));
import { Mini5GMicroLoader } from './components/Mini5GMicroLoader';
import { initDualWrite } from './lib/db-adapter';
import V2Layout from './layouts/V2Layout';
const DashboardV2 = lazy(() => import('./pages/v2/DashboardV2'));
const UserManagementV2 = lazy(() => import('./pages/v2/UserManagementV2'));
const FiscalHubV2 = lazy(() => import('./pages/v2/FiscalHubV2'));
const NetworkPlaneV2 = lazy(() => import('./pages/v2/NetworkPlaneV2'));
const CommCenterV2 = lazy(() => import('./pages/v2/CommCenterV2'));
const AIAutomationV2 = lazy(() => import('./pages/v2/AIAutomationV2'));

const NotificationControl = lazy(() => import('./pages/admin/NotificationControl'));
const AdminUserDevices = lazy(() => import('./pages/admin/AdminUserDevices'));
const NotificationAnalytics = lazy(() => import('./pages/admin/NotificationAnalytics'));

const SafeStub = ({ name, route }: { name: string, route: string }) => (
  <div className="p-10 text-center animate-in fade-in h-full flex flex-col items-center justify-center">
    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4"><Zap size={24} /></div>
    <h2 className="text-2xl font-black text-slate-900 mb-2">{name}</h2>
    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Route: {route} • Status: Awaiting Implementation</p>
  </div>
);

const AdminDevicesStub = lazy(() => Promise.resolve({ default: () => <SafeStub name="OLT Devices" route="/admin-devices" /> }));

// Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-20 text-center"><h1>System Fault Detected</h1><button onClick={() => window.location.reload()}>Reboot Protocol</button></div>;
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
    return db.onStateChange((state) => {
      setDbState(state);
      setAuthState(state.auth);
    });
  }, []);

  const handleLogin = async (credential: string, pass: string) => {
    const res = await db.login(credential, pass);
    if (res.success) {
      db.commit({ 
        auth: { 
          isLoggedIn: true,
          role: res.user.role,
          id: res.user.id,
          email: res.user.email,
          name: res.user.name
        }, 
        view: res.type === 'customer' ? 'portal' : 'admin' 
      });
    }
    return res;
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
    if (authState.role === 'Subscriber') return <SubscriberApp state={dbState} user={authState as any} onLogout={handleLogout} />;

    const v2Pref = localStorage.getItem('v2_enabled');
    const isV2 = v2Pref === 'true' || import.meta.env.VITE_ADMIN_V2_ENABLED === 'true';
    const adminV2Enabled = isV2 && authState.role !== 'Subscriber';

    if (adminV2Enabled) {
      return (
        <V2Layout state={dbState} activePage={currentPage} onNavigate={navigateTo} onLogout={handleLogout}>
          <Suspense fallback={<Mini5GMicroLoader size={60} />}>
            {(() => {
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
        </V2Layout>
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
