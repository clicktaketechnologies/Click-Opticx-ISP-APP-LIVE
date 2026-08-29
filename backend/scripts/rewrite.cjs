const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const legacyRoutesReplacement = `
  const LegacyRoutes = () => {
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
        <Route path="/gateway-settings" element={<SystemConfig />} />
        <Route path="/gateway-stripe" element={<SystemConfig />} />
        <Route path="/gateway-cash" element={<SystemConfig />} />
        <Route path="/gateway-jazzcash" element={<SystemConfig />} />
        <Route path="/gateway-easypaisa" element={<SystemConfig />} />
        <Route path="/gateway-paypal" element={<SystemConfig />} />
        <Route path="/gateway-payfast" element={<SystemConfig />} />
        <Route path="/gateway-home" element={<SystemConfig />} />
        <Route path="/gateway-bank" element={<SystemConfig />} />
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
        <Route path="/speed-test" element={<SpeedTestPage />} />
        <Route path="/notification-control" element={<NotificationControl state={dbState} />} />
        <Route path="/admin-user-devices" element={<AdminUserDevices state={dbState} />} />
        <Route path="/comm-logs" element={<NotificationAnalytics state={dbState} />} />
        <Route path="/admin-devices" element={<AdminDevicesStub />} />
        
        {/* Wildcard to match any comm-* path for EmailControlCenter */}
        <Route path="/comm-templates" element={<EmailControlCenter state={dbState} activePage="comm-templates" />} />
        <Route path="/comm-campaigns" element={<EmailControlCenter state={dbState} activePage="comm-campaigns" />} />
        <Route path="/comm-push" element={<EmailControlCenter state={dbState} activePage="comm-push" />} />
        <Route path="/comm-rules" element={<EmailControlCenter state={dbState} activePage="comm-rules" />} />
        <Route path="/comm-segments" element={<EmailControlCenter state={dbState} activePage="comm-segments" />} />
        <Route path="/comm-settings" element={<EmailControlCenter state={dbState} activePage="comm-settings" />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  };
`;

code = code.replace(/const renderLegacyPage = \(p: string\) => \{[\s\S]*?default: return <Dashboard state=\{dbState\} onNavigate=\{navigateTo\} onClearSearch=\{[^}]+\} \/>;\s*\}\s*\};\s*/, legacyRoutesReplacement);

// Replace the renderLegacyPage(currentPage) calls
code = code.replace(/\{renderLegacyPage\(currentPage\)\}/g, '<LegacyRoutes />');

// Remove V3Layout renderLegacyPage call
code = code.replace(/default: return renderLegacyPage\(currentPage\);/g, 'default: return <LegacyRoutes />;');

// Add EmailControlCenter stub if it's not imported properly
if (!code.includes('import EmailControlCenter')) {
   code = code.replace("import Header from './components/Header';", "import Header from './components/Header';\nconst EmailControlCenter = lazyWithRetry(() => import('./pages/admin/EmailControlCenter'));");
}

fs.writeFileSync('App.tsx', code);
console.log('Successfully rewrote switch statement to React Router <Routes>!');
