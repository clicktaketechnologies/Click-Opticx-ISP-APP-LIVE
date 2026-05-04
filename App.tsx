import React, { useState, useEffect, useMemo, lazy, Suspense, Component, useTransition } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import InventoryManagement from './pages/InventoryManagement';
import { db } from './db';
import { MasterApprovalDashboard } from './pages/MasterApprovalDashboard';
import { Role, AppState, SystemNotification, UserStatus } from './types';
import {
  Receipt, Wallet, ShieldCheck, LogOut,
  Wifi, Database, UserCheck, FileInput, ShieldAlert, Settings, Server, ChevronRight, DatabaseZap, Loader2, Cloud, X, Zap, RotateCw, RefreshCcw, CheckCircle
} from 'lucide-react';
import { PWAPrompt } from './components/PWAPrompt';
import Modal from './components/shared/Modal';
import { useToast } from './components/shared/Toast';
import { Mini5GMicroLoader } from './components/Mini5GMicroLoader';
import { initDualWrite } from './lib/db-adapter';
import { isRoleRoutingEnabled, recordCrash, clearCrashRecord } from './lib/integrityCheck';
import { getLayoutForRole, getDefaultPathForRole, getRoutesForRole, canRoleAccessPath } from './lib/roleRouter';
import SubscriberLayout from './layouts/SubscriberLayout';
import V3Layout from './src/layouts/V3Layout';
import AdminLayoutWrapper from './src/layouts/AdminLayoutWrapper';
import './public/design-system.css';
import './src/styles/design-tokens.css';

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
const EmailControlCenter = lazyWithRetry(() => import('./pages/comm/EmailControlCenter'));
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
const UnifiedCommunication = lazyWithRetry(() => import('./pages/UnifiedCommunication'));
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

const FinanceDashboard = lazyWithRetry(() => import('./pages/FinanceDashboard'));
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

// ─── Role-Router Error Boundary ──────────────────────────────────────────────
// Wraps ONLY the new role-based routing system. On crash, records it and
// falls back to the legacy <LegacyRoutes /> component. DOES NOT affect the
// global ErrorBoundary which continues to protect the full app tree.
class RoleRouterBoundary extends React.Component<
  { children: React.ReactNode; onFallback: () => void },
  { hasCrashed: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasCrashed: false };
  }

  static getDerivedStateFromError() {
    return { hasCrashed: true };
  }

  componentDidCatch(error: Error) {
    recordCrash(error);
    this.props.onFallback();
  }

  render() {
    if (this.state.hasCrashed) return null;
    return this.props.children;
  }
}

// ─── Global Error Boundary ────────────────────────────────────────────────────
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

interface LegacyRoutesProps {
  dbState: AppState;
  navigateTo: (page: string, params?: any) => void;
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
  navParams: any;
}

const LegacyRoutes: React.FC<LegacyRoutesProps> = ({ 
  dbState, 
  navigateTo, 
  globalSearchTerm, 
  setGlobalSearchTerm, 
  navParams 
}) => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard state={dbState} onNavigate={navigateTo} searchTerm={globalSearchTerm} onClearSearch={() => setGlobalSearchTerm('')} />} />
      <Route path="/ai-control" element={<AIControlPlane state={dbState} />} />
      <Route path="/ai-central" element={<AICentralDashboard state={dbState} />} />
      <Route path="/ai-calling" element={<AICallingAdmin state={dbState} />} />
      <Route path="/ai-call-logs" element={<AICallLogs state={dbState} />} />
      <Route path="/users" element={<UserManagement state={dbState} searchTerm={globalSearchTerm} navParams={navParams} />} />
      <Route path="/packages" element={<PackagesPage state={dbState} />} />
      <Route path="/approval-desk" element={<MasterApprovalDashboard state={dbState} />} />
      <Route path="/recovery" element={<Recovery state={dbState} searchTerm={globalSearchTerm} />} />
      <Route path="/recovery-dashboard" element={<RecoveryDashboard state={dbState} />} />
      <Route path="/accounting" element={<AccountingLedger state={dbState} />} />
      <Route path="/archive" element={<ArchivePage state={dbState} />} />
      <Route path="/staff" element={<AccessControlPage state={dbState} />} />
      <Route path="/system-flash" element={<SystemFlash state={dbState} />} />
      <Route path="/system-config" element={<SystemConfig />} />
      <Route path="/system-readiness" element={<SystemReadiness />} />
      <Route path="/reseller-management" element={<ResellerManagement state={dbState} />} />
      <Route path="/permissions" element={<PermissionsPage state={dbState} />} />
      <Route path="/import" element={<DataImportPage state={dbState} />} />
      <Route path="/monitor" element={<DatabaseMonitor state={dbState} />} />
      <Route path="/cache" element={<CacheManagement state={dbState} />} />
      <Route path="/business-settings" element={<BusinessSettings state={dbState} />} />
      <Route path="/auth-control" element={<AuthControlCenter state={dbState} />} />
      <Route path="/system-deployment" element={<SystemDeploymentCenter state={dbState} />} />
      <Route path="/migration-dashboard" element={<MigrationDashboard state={dbState} />} />
      <Route path="/fiscal-monitor" element={<FinanceDashboard state={dbState} />} />
      <Route path="/response-mapper" element={<ResponseMapperConfig state={dbState} />} />
      <Route path="/provider-config" element={<SystemConfig />} />
      <Route path="/gateway-settings" element={<PaymentMethodsIndex state={dbState} onNavigate={navigateTo} />} />
      <Route path="/gateway-stripe" element={<StripeSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/gateway-cash" element={<CashSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/gateway-jazzcash" element={<JazzCashSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/gateway-easypaisa" element={<EasyPaisaSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/gateway-paypal" element={<PayPalSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/gateway-payfast" element={<PayFastSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/gateway-home" element={<HomeCollectionSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/gateway-bank" element={<BankTransferSettings state={dbState} onBack={() => navigateTo('gateway-settings')} />} />
      <Route path="/invoice-engine" element={<InvoiceGenerator state={dbState} onNavigate={navigateTo} />} />
      <Route path="/invoice-management" element={<InvoiceManagementAdmin state={dbState} onNavigate={navigateTo} />} />
      <Route path="/customer-360" element={<CustomerPortal state={dbState} />} />
      <Route path="/user-app" element={<UserAppManagement state={dbState} />} />
      <Route path="/wallet" element={<WalletManagement state={dbState} />} />
      <Route path="/dealers" element={<ResellerManagement state={dbState} />} />
      <Route path="/emergency-load" element={<EmergencyLoadAdmin state={dbState} />} />
      <Route path="/connection-setup" element={<ConnectionSetupAdmin state={dbState} />} />
      <Route path="/tickets" element={<TicketManagementAdmin state={dbState} />} />
      <Route path="/about-us" element={<AboutUs state={dbState} />} />
      <Route path="/admin-live-monitoring" element={<AdminLiveMonitoring state={dbState} />} />
      <Route path="/admin-password-requests" element={<AdminPasswordRequests state={dbState} />} />
      <Route path="/admin-device-mapping" element={<UserDeviceMapping state={dbState} />} />
      <Route path="/admin-profile" element={<AdminProfile state={dbState} />} />
      <Route path="/tasks" element={<TaskManagement state={dbState} />} />
      <Route path="/comm-center" element={<UnifiedCommunication state={dbState} />} />
      <Route path="/admin-reminders" element={<AdminReminders state={dbState} onNavigate={navigateTo} />} />
      <Route path="/kyc-hub" element={<KYCManagement state={dbState} />} />
      <Route path="/cloud-storage" element={<MultiCloudSync state={dbState} />} />
      <Route path="/nas-management" element={<NASManagement state={dbState} />} />
      <Route path="/olt-management" element={<OLTManagement state={dbState} />} />
      <Route path="/hotspot-tokens" element={<HotspotManager state={dbState} />} />
      <Route path="/archive-records" element={<PastRecords state={dbState} />} />
      <Route path="/inventory-management" element={<InventoryManagement state={dbState} />} />
      <Route path="/noc-dashboard" element={<NOCDashboard state={dbState} />} />
      <Route path="/speed-test" element={<SpeedTestPage state={dbState} />} />
      <Route path="/notification-control" element={<NotificationControl state={dbState} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [dbState, setDbState] = useState<AppState>(db.getState());
  const [authState, setAuthState] = useState(db.getState().auth);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = location.pathname.substring(1) || 'dashboard';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState<any>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [navParams, setNavParams] = useState<any>(null);
  const { success } = useToast();

  useEffect(() => {
    const unsubscribe = db.onStateChange((newState) => {
      startTransition(() => {
        setDbState(newState);
        setAuthState(newState.auth);
        
        // Handle Theme Hydration from State / LocalStorage
        const theme = (newState.settings?.appearance as any)?.theme || localStorage.getItem('clickopticx_theme') || 'light';
        const brandColor = (newState.settings?.appearance as any)?.primaryColor || localStorage.getItem('clickopticx_brand_color') || '#6366F1';
        
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        
        document.documentElement.style.setProperty('--bg-primary', brandColor);
        document.documentElement.style.setProperty('--grad-primary', `linear-gradient(135deg, ${brandColor}, #4F46E5)`);
      });
    });

    // 2. Initial Background Audit
    db.auditOverdueLoads();
    db.reconcileData('entire');

    // 3. Background Cron (Audit & Reconciliation every 5 mins)
    const cronInterval = setInterval(() => {
      console.log('[SYSTEM] Running 5-min background health & data audit...');
      db.auditOverdueLoads();
      db.reconcileData('entire');
    }, 5 * 60 * 1000);

    // 4. Initialize Dual-Write Adapter (Phase 1-2)
    initDualWrite();

    // Aggressive Cache Busting for v9.5.3
    const currentAppVersion = '9.5.4';
    if (localStorage.getItem('clickopticx_app_version') !== currentAppVersion) {
      console.warn(`[UPDATE] New version detected: ${currentAppVersion}. Purging old caches...`);
      localStorage.setItem('clickopticx_app_version', currentAppVersion);
      if ('caches' in window) {
        caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))));
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }
      // Force reload once to fetch new files
      setTimeout(() => window.location.reload(), 500);
    }

    // 5. Multi-Tab Session Sync — listen for logout from other tabs
    let authChannel: BroadcastChannel | null = null;
    try {
      authChannel = new BroadcastChannel('clickopticx_auth');
      authChannel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          console.warn('[MULTI-TAB] Logout signal received from another tab');
          db.commit({ auth: { isLoggedIn: false }, view: 'login', currentUser: undefined });
          sessionStorage.clear();
        }
      };
    } catch (e) {
      // Fallback: listen for storage changes
      const onStorageChange = (e: StorageEvent) => {
        if (e.key === 'clickopticx_auth_token' && !e.newValue) {
          console.warn('[MULTI-TAB] Auth token removed in another tab — forcing logout');
          db.commit({ auth: { isLoggedIn: false }, view: 'login', currentUser: undefined });
          sessionStorage.clear();
        }
      };
      window.addEventListener('storage', onStorageChange);
    }

    // 6. Register Service Worker with versioned URL
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js?v=9.5.4').catch(err => {
        console.warn('[SW] Registration failed:', err);
      });
    }

    return () => {
      unsubscribe();
      clearInterval(cronInterval);
      if (authChannel) authChannel.close();
    };
  }, []);

  const handleLogin = async (cred: string, pass: string, rememberMe?: boolean) => {
    return await db.login(cred, pass, rememberMe);
  };

  const handleLogout = () => {
    // 1. Clear ALL auth tokens from localStorage
    localStorage.removeItem('clickopticx_auth_token');
    localStorage.removeItem('clickopticx_admin_token');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('clickopticx_v16_registry');
    
    // 2. Clear sessionStorage entirely
    sessionStorage.clear();
    
    // 3. Purge ALL Service Worker caches
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    
    // 4. Signal Service Worker to purge its caches
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage('LOGOUT_PURGE');
    }
    
    // 5. Broadcast logout to all other tabs
    try {
      const bc = new BroadcastChannel('clickopticx_auth');
      bc.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
      bc.close();
    } catch (e) {
      // BroadcastChannel not supported — fallback to storage event
      localStorage.setItem('clickopticx_logout_signal', Date.now().toString());
      localStorage.removeItem('clickopticx_logout_signal');
    }
    
    // 6. Reset app state
    db.commit({ auth: { isLoggedIn: false }, view: 'login', currentUser: undefined });
    success('System Logout', 'Session tokens securely cleared.');
  };

  const navigateTo = (page: string, params: any = null) => {
    startTransition(() => {
      setNavParams(params);
      navigate(`/${page}`);
    });
  };

  // ─── RENDER LOGIC ──────────────────────────────────────────────────────────
  // Priority order:
  // 1. Login screen (not authenticated)
  // 2. Subscriber portal (isolated SubscriberLayout — zero admin leakage)
  // 3. NEW: Role-based routing (if VITE_ENABLE_ROLE_ROUTING=true AND integrity is healthy)
  // 4. LEGACY FALLBACK: V3 layout (if ?layout=v3)
  // 5. LEGACY FALLBACK: Default V2/sidebar layout
  const [useRoleFallback, setUseRoleFallback] = useState(false);
  const roleRoutingActive = !useRoleFallback && isRoleRoutingEnabled();

const renderApp = () => {
    const enableNewUI = import.meta.env.VITE_ENABLE_NEW_UI === 'true';

    if (dbState.view === 'login') return <Login onLogin={handleLogin} />;

    // ── 2. SUBSCRIBER PORTAL — Admin-Isolated Shell ──────────────────────────
    if (authState.role === 'Subscriber' || authState.role === 'Customer') {
      const activeUser = dbState.currentUser || dbState.users.find(u => u.id === authState.id) || authState;
      return (
        <SubscriberLayout
          user={activeUser as any}
          onLogout={handleLogout}
          onNavigate={navigateTo}
          activeRoute={location.pathname}
          businessName={dbState?.settings?.branding?.businessName || 'ClickOptix'}
          businessLogo={(dbState?.settings?.branding as any)?.logoUrl}
        >
          <Suspense fallback={<Mini5GMicroLoader size={40} />}>
            <SubscriberApp state={dbState} user={activeUser as any} onLogout={handleLogout} />
          </Suspense>
        </SubscriberLayout>
      );
    }

    // ── 3. NEW ROLE-BASED ROUTING ────────────────────────────────────────────
    if (roleRoutingActive) {
      const userRole = authState.role || 'Admin';
      const allowedRoutes = getRoutesForRole(userRole);
      const defaultPath = getDefaultPathForRole(userRole);
      
      // Let SuperAdmins access any path, otherwise strict check against allowedRoutes
      const isSuperAdmin = ['superadmin', 'admin'].includes(userRole.toLowerCase().replace(/\s/g, ''));
      const isPathInRoutes = canRoleAccessPath(userRole, location.pathname);
      const pathAllowed = isSuperAdmin || isPathInRoutes;

      return (
        <RoleRouterBoundary onFallback={() => setUseRoleFallback(true)}>
          <Suspense fallback={<Mini5GMicroLoader size={60} />}>
            {/* Role-specific V3 Layout wrapper */}
            <V3Layout state={dbState} activePage={currentPage} onNavigate={navigateTo} onLogout={handleLogout}>
              <Routes>
                {allowedRoutes.map(route => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      React.createElement(route.component as any, {
                        state: dbState,
                        onNavigate: navigateTo,
                      })
                    }
                  />
                ))}
                
                {/* Fallback to LegacyRoutes if path is allowed but not in allowedRoutes */}
                {pathAllowed ? (
                  <Route path="*" element={
                    <LegacyRoutes 
                      dbState={dbState} 
                      navigateTo={navigateTo} 
                      globalSearchTerm={globalSearchTerm} 
                      setGlobalSearchTerm={setGlobalSearchTerm} 
                      navParams={navParams} 
                    />
                  } />
                ) : (
                  <Route path="*" element={<Navigate to={defaultPath} replace />} />
                )}
              </Routes>
            </V3Layout>
          </Suspense>
        </RoleRouterBoundary>
      );
    }

    // ── 4 & 5. LEGACY FALLBACK (unchanged) ──────────────────────────────────
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
                default: return (
                  <LegacyRoutes 
                    dbState={dbState} 
                    navigateTo={navigateTo} 
                    globalSearchTerm={globalSearchTerm} 
                    setGlobalSearchTerm={setGlobalSearchTerm} 
                    navParams={navParams} 
                  />
                );
              }
            })()}
          </Suspense>
        </V3Layout>
      );
    }

    if (enableNewUI) {
      return (
        <AdminLayoutWrapper
          state={dbState}
          current={currentPage}
          onNavigate={navigateTo}
          onLogout={handleLogout}
          user={dbState.currentUser as any}
          globalSearchTerm={globalSearchTerm}
          setGlobalSearchTerm={setGlobalSearchTerm}
          isPending={isPending}
          businessName={dbState?.settings?.branding?.businessName || 'Click Opticx'}
        >
          <Suspense fallback={<Mini5GMicroLoader size={40} />}>
            <LegacyRoutes 
              dbState={dbState} 
              navigateTo={navigateTo} 
              globalSearchTerm={globalSearchTerm} 
              setGlobalSearchTerm={setGlobalSearchTerm} 
              navParams={navParams} 
            />
          </Suspense>
          
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
        </AdminLayoutWrapper>
      );
    }

    return (
      <div className="flex min-h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          current={currentPage}
          onNavigate={(p) => {
            navigateTo(p);
            if (isSidebarOpen) setIsSidebarOpen(false);
          }}
          role={authState.role}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          businessName={dbState?.settings?.branding?.businessName || 'ClickOptix'}
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
            user={dbState.currentUser as any}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onProfileClick={() => navigateTo('admin-profile')}
            onLogout={handleLogout}
            searchTerm={globalSearchTerm}
            onSearch={setGlobalSearchTerm}
            isPending={isPending}
            onNavigate={navigateTo}
          />
          <main className="p-3 md:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
            <Suspense fallback={<Mini5GMicroLoader size={40} />}>
              <LegacyRoutes 
                dbState={dbState} 
                navigateTo={navigateTo} 
                globalSearchTerm={globalSearchTerm} 
                setGlobalSearchTerm={setGlobalSearchTerm} 
                navParams={navParams} 
              />
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

const AppWrapper = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default AppWrapper;
