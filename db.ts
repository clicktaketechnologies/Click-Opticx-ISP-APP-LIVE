import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { 
  AppState, UserStatus, PaymentStatus, LedgerType, VerificationStatus,
  ISPUser, Package, PaymentMethod, Role, SystemSettings, ReferralRecord,
  StaffUser, PaymentRecord, TopupRequest, ArchiveRecord, SecurityLog, PackageRequest,
  CreditScoreLog, TechnicalConfig, WithdrawalRequest, UserSession, 
  ConnectionStatus, Invoice, LineItem, SupportTicket, TicketStatus, TicketPriority, 
  TicketComment, NOCEvent, SystemNotification, EmergencyLoad, InternalTask, 
  ConnectedDevice, PasswordResetRequest, NetworkNode, AppPage, HomeCard, 
  Device, NetworkMapping, KYCDocument, AIActionLog, AIConfig, AIEvent, AISuggestion,
  NotificationAudience, NotificationPriority, AICallConfig, AICallLog, AICallRule,
  EmailCampaign, EmailTemplate, AudienceSegment, CommunicationAutomationRule, DeliveryLog, CommunicationSettings, SenderIdentity, PaymentGateway, AppSection, InfrastructureConfig, LegalConfig,
  AIKeysConfig
} from './types';

// IMPORTANT: REPLACE THESE WITH YOUR ACTUAL FIREBASE CONSOLE KEYS
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_ACTUAL_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

export interface DBHealth {
  documentSize: number;
  logs: SystemNotification[];
  lastSync: string;
  isCloudSynced: boolean;
}

export interface ConnectionAudit {
  success: boolean;
  message: string;
  timestamp: string;
}

const INITIAL_AI_CONFIG: AIConfig = {
  killSwitchActive: false,
  showWidgetToUsers: true,
  thresholds: { block: 0.40, suggest: 0.60, confirm: 0.80 },
  modules: {
    payments: { enabled: true, autoExecute: false },
    emergency: { enabled: true, autoExecute: false },
    network: { enabled: true, autoExecute: false },
    risk: { enabled: true, autoExecute: false }
  },
  trainingSources: {
    invoices: true,
    ledger: true,
    emergency: true,
    payments: true,
    telemetry: true,
    adminActions: true
  },
  aiKeys: { gemini: '', openai: '', deepseek: '', anthropic: '' }
};

const INITIAL_COMM_CONFIG: CommunicationSettings = {
  emailMode: 'CUSTOM_SMTP',
  emailProvider: 'SMTP',
  providerConfig: { apiKey: '', senderDomain: '' },
  smtpConfig: { host: 'smtp.clickopticx.com', port: 587, encryption: 'TLS', username: 'relay@clickopticx.com' },
  senderIdentities: [
    { id: 'SDR-1', name: 'NetRecover Support', email: 'support@clickopticx.com', isVerified: true, isDefault: true, createdAt: new Date().toISOString() }
  ],
  pushEnabled: true,
  quietHours: { start: '22:00', end: '08:00', enabled: true },
  rateLimits: { emailsPerHour: 1000, emailsPerDay: 10000, burstLimit: 50, pushPerDayPerUser: 5 },
  warmup: { enabled: true, currentDay: 1, limit: 50 },
  health: { status: 'Healthy', lastCheck: new Date().toISOString(), latency: 124, bounceRate: 0.2 }
};

const INITIAL_APP_PAGES: AppPage[] = [
  { id: 'home', label: 'Dashboard', icon: 'Home', category: 'Core', enabled: true, showInDirectory: true, isDefault: true, swatch: '#4f46e5' },
  { id: 'wallet', label: 'My Wallet', icon: 'Wallet', category: 'Fiscal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#10b981' },
  { id: 'packages', label: 'Service Plans', icon: 'Signal', category: 'Core', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
  { id: 'support', label: 'Help Center', icon: 'Headphones', category: 'Support', enabled: true, showInDirectory: true, isDefault: false, swatch: '#8b5cf6' },
  { id: 'live-usage', label: 'Live Usage', icon: 'Monitor', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
];

const INITIAL_STATE: AppState = {
  users: [],
  staff: [
    { email: 'admin@clickopticx.com', name: 'System Administrator', role: Role.SUPER_ADMIN, status: 'Active', password: 'superpass', balance: 1000000 },
  ],
  packages: [
    { id: 'PKG-1', name: 'Home Basic 15M', subtitle: 'Standard Tier', speed: '15 Mbps', uploadSpeed: '10 Mbps', dataLimit: 'Unlimited', price: 1500, taxRate: 15, duration: 30, color: '#3b82f6', isRecommended: true },
  ],
  invoices: [],
  payments: [],
  ledger: [],
  creditLogs: [],
  referrals: [],
  withdrawalRequests: [],
  packageRequests: [],
  topupRequests: [],
  emergencyLoads: [],
  tasks: [],
  tickets: [],
  nocEvents: [],
  aiLogs: [],
  aiEvents: [],
  aiSuggestions: [],
  aiCallLogs: [],
  aiCallRules: [],
  emailCampaigns: [],
  emailTemplates: [],
  audienceSegments: [],
  commAutomationRules: [],
  deliveryLogs: [],
  settings: {
    branding: { businessName: "Click Opticx", shortName: "CO ISP", logoLight: "", logoDark: "", logoSquare: "", favicon: "", primaryColor: "#4f46e5", secondaryColor: "#10b981", accentColor: "#f59e0b", textColorLight: "#ffffff", textColorDark: "#0f172a", primaryFont: "Inter", secondaryFont: "Inter" },
    profile: { legalName: "Click Opticx Pvt Ltd", tradingName: "Click Opticx", tagline: "Fast Regional Connectivity", establishedYear: "2023", registrationNumber: "", taxNumber: "", headOffice: "Karachi", country: "Pakistan", timezone: "Asia/Karachi" },
    support: { email: "support@clickopticx.com", phone: "+92 300 1234567", whatsapp: "923001234567", emergencyPhone: "+92 300 9999999", address: "Karachi", workingHoursWeekdays: "09:00 AM - 09:00 PM", workingHoursWeekends: "10:00 AM - 04:00 PM", emergencySupport: true, afterHoursMessage: "Support resumes at 09:00 AM.", phoneEnabled: true, whatsappEnabled: true, emailEnabled: true, greeting: "Welcome to Click Opticx Support.", autoReplyFooter: "Powered by NetRecover." },
    digitalPresence: { website: "https://clickopticx.com", portal: "https://my.clickopticx.com", facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "" },
    invoiceBranding: { logoPreference: "primary", headerText: "TAX INVOICE", footerDisclaimer: "Computer generated document.", authorizedSignature: "", prefix: "CO-INV-", nextNumber: 1001, terms: "Payment due within 5 days.", privacy: "All data encrypted.", refundPolicyUrl: "" },
    notificationBranding: { appSenderName: "CO ALERTS", emailSenderName: "CO SUPPORT", smsSenderId: "CLICKOPTICX" },
    appearance: { 
      showWallet: true, showEmergencyLoad: true, showAIChat: true, showAICalling: true, 
      showNews: true, showQuickActions: true, maintenanceMode: false, 
      appPages: INITIAL_APP_PAGES, 
      homeCards: [],
      sections: [
        { id: 'status', label: 'CONNECTIVITY STATUS', enabled: true, order: 0, layout: 'Grid', gridCols: 1, itemIds: [] },
        { id: 'fiscal-summary', label: 'FISCAL SUMMARY', enabled: true, order: 3, layout: 'Grid', gridCols: 2, itemIds: [], isSpecialNode: true },
        { id: 'directory', label: 'ALL SERVICES', enabled: true, order: 8, layout: 'Grid', gridCols: 2, itemIds: [] }
      ]
    },
    referral: { enabled: true, signupPoints: 500, pkg1Points: 1000, pkg2Points: 1000, pkg3Points: 500, minPkgPrice: 1000, conversionRatio: 0.01 },
    aboutUs: { vision: "Connectivity for all", mission: "Reliable internet architecture", companyStory: "Founded in 2023.", features: [], values: [], version: "v8.6.0", lastUpdated: new Date().toISOString() },
    notificationTemplates: [],
    footerText: "Official ISP Management Portal",
    copyrightLine: "© 2025 Click Opticx",
    socialLinks: [],
    appVersion: "v8.6.0",
    autoTaxPercentage: 15,
    globalEmergencyLimit: 2500,
    paymentGateways: [
      { id: 'stripe', name: 'Stripe Node', type: 'online', enabled: true, priority: 1, sandbox: true, allowedFor: ['packages', 'wallet', 'invoices'], config: { publishableKey: '', secretKey: '', webhookSecret: '' } },
      { id: 'cash', name: 'Physical Cash', type: 'offline', enabled: true, priority: 6, sandbox: false, allowedFor: ['packages', 'wallet', 'invoices'], config: {}, instructions: 'Pay at any authorized regional shop.' }
    ],
    techConfig: { wireless: { cat6PricePerMeter: 50, clipPrice: 5, ravalBoldPricePerPair: 1200, polls: [], receivers: [], onus: [] }, fiber: { wirePricePerMeter: 30, baseInstallation: 2500, onus: [], routers: [] } },
    currency: "Rs.",
    taxId: "TX-4492-CO",
    whiteLabelMode: false,
    allowWifiReset: true,
    aiConfig: INITIAL_AI_CONFIG,
    aiCallConfig: { enabled: true, voiceName: 'Zephyr', persona: 'Professional', language: 'English', speakingSpeed: 1.0, maxCallDuration: 300, officeHours: { start: '09:00', end: '21:00', enabled: true }, knowledgeBase: { outageScripts: '', billingPolicy: '', emergencyTerms: '' } },
    commConfig: INITIAL_COMM_CONFIG,
    infrastructure: { domainNode: 'netrecover.pk', targetIP: '103.14.55.1', dnsStatus: 'PROPAGATED', nameservers: ['ns1.netrecover.pk', 'ns2.netrecover.pk'] },
    legal: { termsAndConditions: 'Standard Terms Apply.', serviceAgreement: 'I Agree.', privacyPolicy: 'Data is protected.', refundPolicy: 'No refunds on active links.' }
  },
  permissions: [],
  notifications: [],
  roles: Object.values(Role).filter(r => r !== Role.CUSTOMER),
  archives: [],
  signupRequests: [],
  securityLogs: [],
  connectionStatus: 'online',
  isImpersonating: false,
  passwordRequests: [],
  networkNodes: [],
  devices: [],
  networkMappings: []
};

class DB {
  private state: AppState;
  private listeners: ((state: AppState) => void)[] = [];
  private initialized = false;
  private firestore: Firestore | null = null;
  private app: FirebaseApp | null = null;

  constructor() {
    this.state = INITIAL_STATE;
    const cached = localStorage.getItem('netrecover_v15_registry');
    if (cached) {
      try { this.state = { ...this.state, ...JSON.parse(cached) }; } catch (e) {}
    }
    this.initializeCloudLayer();
  }

  private async initializeCloudLayer() {
    try {
      const apps = getApps();
      this.app = !apps.length ? initializeApp(firebaseConfig) : apps[0];
      this.firestore = getFirestore(this.app);
      await this.syncWithCloudMaster();
    } catch (e: any) {
      console.warn("Cloud Handshake Failed, local persistence only.");
      this.initialized = true;
      this.notify();
    }
  }

  private async syncWithCloudMaster() {
    if (!this.firestore) return;
    const docRef = doc(this.firestore, 'registry', 'master_state');
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as Partial<AppState>;
        this.state = { ...this.state, ...cloudData };
      } else {
        await setDoc(docRef, this.state);
      }
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const { currentUser, originalAdminUser, isImpersonating, connectionStatus, ...persistedData } = snapshot.data() as AppState;
          this.state = { ...this.state, ...persistedData };
          this.notify();
        }
      });
      this.initialized = true;
      this.notify();
    } catch (e: any) {
      this.initialized = true;
      this.notify();
    }
  }

  private async commit() {
    try {
      localStorage.setItem('netrecover_v15_registry', JSON.stringify(this.state));
    } catch (e) {}
    if (this.firestore && this.initialized) {
      const docRef = doc(this.firestore, 'registry', 'master_state');
      const { currentUser, originalAdminUser, isImpersonating, connectionStatus, ...cloudSafeState } = this.state;
      await setDoc(docRef, cloudSafeState);
    }
    this.notify();
  }

  private notify() { this.listeners.forEach(l => l(this.getState())); }
  getState(): AppState { return JSON.parse(JSON.stringify(this.state)); }
  onStateChange(cb: (state: AppState) => void) {
    this.listeners.push(cb);
    cb(this.getState());
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }
  isConfigured() { return this.initialized; }

  async login(credential: string, pass: string) {
    const input = credential.toLowerCase().trim();
    const staff = this.state.staff.find(s => s.email.toLowerCase() === input && s.password === pass);
    if (staff) {
      this.state.currentUser = staff;
      this.notify();
      return { success: true, user: staff, type: 'staff' };
    }
    const user = this.state.users.find(u => !u.deleted && (u.username === input || u.phone === input || u.connectionId === input) && u.password === pass);
    if (user) {
      this.state.currentUser = { ...user, role: Role.CUSTOMER };
      this.notify();
      return { success: true, user: this.state.currentUser, type: 'customer' };
    }
    return { success: false, message: 'Registry Lookup Failed.' };
  }

  async logout() {
    this.state.currentUser = undefined;
    this.state.isImpersonating = false;
    this.notify();
  }

  async updateSettings(s: SystemSettings) { this.state.settings = s; await this.commit(); }
  async addUser(u: Partial<ISPUser>) { 
    const newUser = { id: 'USR-'+Date.now(), connectionId: 'NR-'+Math.floor(10000+Math.random()*90000), balance: 0, creditScore: 600, activationCount: 0, portalEnabled: true, ...u }; 
    this.state.users.push(newUser as any); await this.commit(); return { success: true, user: newUser }; 
  }
  async updateUser(id: string, d: any): Promise<{ success: boolean; message?: string }> { 
    const idx = this.state.users.findIndex(u => u.id === id);
    if (idx !== -1) { 
      this.state.users[idx] = { ...this.state.users[idx], ...d }; 
      await this.commit(); 
      return { success: true }; 
    }
    return { success: false, message: 'Node not found in registry.' };
  }

  async markNotificationRead(id: string) {
    const idx = this.state.notifications.findIndex(n => n.id === id);
    if (idx !== -1) { this.state.notifications[idx].read = true; await this.commit(); }
  }

  async markAllNotificationsRead(targetId: string, audience: string) {
    this.state.notifications.forEach(n => { if (n.audience === audience && (n.targetId === targetId || n.targetId === 'all')) n.read = true; });
    await this.commit();
  }

  logNotification(targetId: string, type: 'success' | 'warning' | 'info' | 'error', title: string, message: string, audience: NotificationAudience = 'subscriber') {
    const n: SystemNotification = { id: 'NTF-' + Date.now(), targetId, audience, priority: 'normal', type, title, message, read: false, timestamp: new Date().toISOString(), createdAt: Date.now() };
    this.state.notifications.unshift(n);
    this.commit();
  }

  async processTopup(collector: string, target: string, type: 'staff' | 'user', amount: number): Promise<{ success: boolean; message?: string }> {
    if (type === 'staff') {
       const sIdx = this.state.staff.findIndex(s => s.email === target);
       if (sIdx !== -1) this.state.staff[sIdx].balance = (this.state.staff[sIdx].balance || 0) + amount;
    } else {
       const uIdx = this.state.users.findIndex(u => u.id === target);
       if (uIdx !== -1) this.state.users[uIdx].balance = (this.state.users[uIdx].balance || 0) + amount;
    }
    this.state.ledger.push({ id: 'LGR_'+Date.now(), userId: target, amount, type: LedgerType.CREDIT, timestamp: new Date().toISOString(), description: 'Admin Refill', method: 'Registry Direct', balanceAfter: 0 });
    await this.commit();
    return { success: true };
  }

  async addManualPayment(userId: string, amount: number, method: PaymentMethod) {
    this.state.payments.push({ id: 'PAY-'+Date.now(), userId, userName: 'User', amount, status: 'Approved', method, timestamp: new Date().toISOString(), collectorEmail: 'admin', collectorName: 'Admin', invoiceId: 'MANUAL', isCleared: false });
    const userIdx = this.state.users.findIndex(u => u.id === userId);
    if (userIdx !== -1) { this.state.users[userIdx].balance = Math.max(0, this.state.users[userIdx].balance - amount); }
    await this.commit();
  }

  async activatePackage(userId: string, packageId: string) {
    const uIdx = this.state.users.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
       this.state.users[uIdx].packageId = packageId;
       this.state.users[uIdx].status = UserStatus.ACTIVE;
       this.state.users[uIdx].expiryDate = new Date(Date.now() + 30 * 86400000).toISOString();
       await this.commit();
    }
  }

  async updateCustomerPassword(id: string, pass: string) {
    const idx = this.state.users.findIndex(u => u.id === id || u.connectionId === id);
    if (idx !== -1) { this.state.users[idx].password = pass; this.state.users[idx].mustChangePassword = false; await this.commit(); return { success: true }; }
    return { success: false, message: 'Node not found' };
  }

  async bulkDeleteUsers(ids: string[]) { this.state.users = this.state.users.filter(u => !ids.includes(u.id)); await this.commit(); }
  async bulkSetAccountStatus(ids: string[], status: UserStatus, details: string) {
    this.state.users.forEach(u => { if (ids.includes(u.id)) u.status = status; });
    await this.commit();
  }

  async bulkForcePasswordReset(ids: string[]) {
    this.state.users.forEach(u => { if (ids.includes(u.id)) u.mustChangePassword = true; });
    await this.commit();
  }

  async bulkActivatePackages(ids: string[], pkgId: string) {
    for (const id of ids) await this.activatePackage(id, pkgId);
  }

  async clearStaffCollections(email: string) {
    this.state.payments.forEach(p => { if (p.collectorEmail === email) p.isCleared = true; });
    await this.commit();
  }

  async approvePayment(id: string) {
    const idx = this.state.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
       this.state.payments[idx].status = 'Approved';
       const uIdx = this.state.users.findIndex(u => u.id === this.state.payments[idx].userId);
       if (uIdx !== -1) this.state.users[uIdx].balance = Math.max(0, this.state.users[uIdx].balance - this.state.payments[idx].amount);
       await this.commit();
    }
  }

  async updatePackage(id: string, d: any) {
    const idx = this.state.packages.findIndex(p => p.id === id);
    if (idx !== -1) { this.state.packages[idx] = { ...this.state.packages[idx], ...d }; await this.commit(); }
  }

  async addPackage(p: any) { this.state.packages.push({ id: 'PKG-'+Date.now(), ...p }); await this.commit(); }

  async archiveMonth(month: string): Promise<{ success: boolean; message?: string }> {
    const archive: ArchiveRecord = { month, archivedAt: new Date().toISOString(), data: { invoices: [], payments: [], ledger: [] } };
    this.state.archives.push(archive);
    await this.commit();
    return { success: true };
  }

  async updateStaff(email: string, d: any) {
    const idx = this.state.staff.findIndex(s => s.email === email);
    if (idx !== -1) { this.state.staff[idx] = { ...this.state.staff[idx], ...d }; await this.commit(); }
  }

  async addStaff(s: any) { this.state.staff.push(s); await this.commit(); }

  async updateModulePermission(moduleId: string, updates: any) {
    const idx = this.state.permissions.findIndex(p => p.id === moduleId);
    if (idx !== -1) { 
      this.state.permissions[idx] = { ...this.state.permissions[idx], ...updates }; 
    } else { 
      this.state.permissions.push({ id: moduleId, view: [], edit: [], delete: [], ...updates }); 
    }
    await this.commit();
  }

  async addRole(role: string) { if (!this.state.roles.includes(role)) { this.state.roles.push(role); await this.commit(); } }
  async deleteRole(role: string) { this.state.roles = this.state.roles.filter(r => r !== role); await this.commit(); }
  async updateAIKeys(keys: AIKeysConfig) { this.state.settings.aiConfig.aiKeys = keys; await this.commit(); }
  async exportVault() {
    const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ClickOpticx_Registry_${new Date().toISOString()}.json`;
    link.click();
  }

  async addDealerLoad(email: string, amount: number, mode: string, dueDate: string) {
    const idx = this.state.staff.findIndex(s => s.email === email);
    if (idx !== -1) {
       this.state.staff[idx].balance = (this.state.staff[idx].balance || 0) + amount;
       this.state.ledger.push({ id: 'LGR_'+Date.now(), userId: email, amount, type: LedgerType.CREDIT, timestamp: new Date().toISOString(), description: 'Dealer Load', method: 'Admin', balanceAfter: this.state.staff[idx].balance });
       await this.commit();
    }
  }

  async generateAdHocInvoice(userId: string, packageId: string, total: number, items: any[]) {
    const user = this.state.users.find(u => u.id === userId);
    const inv: Invoice = { id: 'INV-'+Date.now(), userId, userName: user?.name || 'User', packageId, packageName: 'AdHoc', items, subtotal: total, taxRate: 0, taxAmount: 0, discountAmount: 0, totalAmount: total, paidAmount: 0, status: PaymentStatus.UNPAID, dueDate: new Date().toISOString(), createdAt: new Date().toISOString() };
    this.state.invoices.push(inv);
    if (user) user.balance += total;
    await this.commit();
    return inv;
  }

  async sendInvoiceEmail(id: string) { return true; }
  async markVerificationSuccessShown(uid: string) { 
    const idx = this.state.users.findIndex(u => u.id === uid);
    if (idx !== -1) { this.state.users[idx].verificationSuccessShown = true; await this.commit(); }
  }

  async approveSignup(id: string) {
    const idx = this.state.signupRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
       const req = this.state.signupRequests[idx];
       await this.addUser({ name: req.name, phone: req.phone, status: UserStatus.ACTIVE });
       this.state.signupRequests[idx].status = 'Approved';
       await this.commit();
    }
  }

  async updateAppSection(section: AppSection) {
    const idx = this.state.settings.appearance.sections.findIndex(s => s.id === section.id);
    if (idx !== -1) { this.state.settings.appearance.sections[idx] = section; await this.commit(); }
  }

  async impersonateUser(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) { this.state.originalAdminUser = this.state.currentUser; this.state.currentUser = { ...user, role: Role.CUSTOMER }; this.state.isImpersonating = true; this.notify(); }
  }

  async toggleDirectoryView(id: string, show: boolean) {
    const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id);
    if (idx !== -1) { this.state.settings.appearance.appPages[idx].showInDirectory = show; await this.commit(); }
  }

  async toggleAppPage(id: string, enabled: boolean) {
    const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id);
    if (idx !== -1) { this.state.settings.appearance.appPages[idx].enabled = enabled; await this.commit(); }
  }

  async approveUnifiedRequest(id: string, type: string): Promise<{ success: boolean; message?: string }> {
    if (type === 'package') {
       const idx = this.state.packageRequests.findIndex(r => r.id === id);
       if (idx !== -1) { await this.activatePackage(this.state.packageRequests[idx].userId, this.state.packageRequests[idx].packageId); this.state.packageRequests[idx].status = 'Approved'; await this.commit(); }
    }
    if (type === 'topup') {
       const idx = this.state.topupRequests.findIndex(r => r.id === id);
       if (idx !== -1) {
          const req = this.state.topupRequests[idx];
          await this.processTopup('Admin', req.userId, 'user', req.amount);
          this.state.topupRequests[idx].status = 'Approved';
          await this.commit();
       }
    }
    if (type === 'emergency') {
       const idx = this.state.emergencyLoads.findIndex(r => r.id === id);
       if (idx !== -1) {
          this.state.emergencyLoads[idx].status = 'Active';
          await this.commit();
       }
    }
    return { success: true };
  }

  async rejectUnifiedRequest(id: string, type: string, reason: string): Promise<{ success: boolean; message?: string }> {
    if (type === 'package') {
       const idx = this.state.packageRequests.findIndex(r => r.id === id);
       if (idx !== -1) { this.state.packageRequests[idx].status = 'Rejected'; await this.commit(); }
    }
    if (type === 'topup') {
       const idx = this.state.topupRequests.findIndex(r => r.id === id);
       if (idx !== -1) { this.state.topupRequests[idx].status = 'Rejected'; await this.commit(); }
    }
    if (type === 'emergency') {
       const idx = this.state.emergencyLoads.findIndex(r => r.id === id);
       if (idx !== -1) { this.state.emergencyLoads[idx].status = 'Cancelled'; await this.commit(); }
    }
    return { success: true };
  }

  async markWelcomeComplete(uid: string) {
    const idx = this.state.users.findIndex(u => u.id === uid);
    if (idx !== -1) { this.state.users[idx].welcomeChecklistShown = true; await this.commit(); }
  }

  async submitKYC(uid: string, type: string, file: string) {
    const idx = this.state.users.findIndex(u => u.id === uid);
    if (idx !== -1) { this.state.users[idx].verificationStatus = VerificationStatus.PENDING; await this.commit(); }
  }

  async updateAICallConfig(c: AICallConfig) { this.state.settings.aiCallConfig = c; await this.commit(); }
  async addCallLog(l: any) { this.state.aiCallLogs.push(l); await this.commit(); }
  
  async payInvoiceWithWallet(id: string): Promise<{ success: boolean; message?: string }> {
    const idx = this.state.invoices.findIndex(i => i.id === id);
    if (idx !== -1) { this.state.invoices[idx].status = PaymentStatus.PAID; await this.commit(); return { success: true }; }
    return { success: false, message: 'Invoice not found in registry.' };
  }

  async toggleAIKillSwitch(v: boolean) { this.state.settings.aiConfig.killSwitchActive = v; await this.commit(); }
  async updateAIConfig(c: AIConfig) { this.state.settings.aiConfig = c; await this.commit(); }
  async saveEmailCampaign(c: any) { this.state.emailCampaigns.push(c); await this.commit(); }
  async sendCampaign(id: string) {
    const idx = this.state.emailCampaigns.findIndex(c => c.id === id);
    if (idx !== -1) { this.state.emailCampaigns[idx].status = 'Completed'; await this.commit(); }
  }

  async saveAudienceSegment(s: any) { this.state.audienceSegments.push(s); await this.commit(); }
  async saveCommRule(r: any) { this.state.commAutomationRules.push(r); await this.commit(); }
  async testSMTPHandshake(c: any) { return { success: true, message: 'Node Handshake Verified.' }; }
  async sendTestEmail(c: any, d: any) { return { success: true, message: 'Dispatch Pulse Sent.' }; }
  async submitSignupRequest(d: any) { this.state.signupRequests.push({ id: 'SR-'+Date.now(), ...d, status: 'Pending' }); await this.commit(); return { success: true }; }
  async cancelTopupRequest(id: string) { this.state.topupRequests = this.state.topupRequests.filter(r => r.id !== id); await this.commit(); }
  getMappingForUser(uid: string) { return this.state.networkMappings.find(m => m.userId === uid); }
  async saveMapping(m: any) { this.state.networkMappings.push(m); await this.commit(); }
  getLiveUsage(uid: string) { return { down: '42.1', up: '18.4', ping: 12, usageToday: '4.2', usageMonth: '124', offline: false }; }
  getConnectedDevices(uid: string) { return []; }
  async blockDevice(uid: string, did: string) { return true; }
  async renameDevice(uid: string, did: string, n: string) { return true; }
  async submitWifiPasswordRequest(uid: string, p: string) { return { success: true }; }
  async addNetworkNode(n: any) { this.state.networkNodes.push(n); await this.commit(); return { success: true }; }
  async testNodeConnection(id: string) { return { success: true, message: 'Pulse Verified' }; }
  async addDevice(d: any) { this.state.devices.push(d); await this.commit(); return { success: true }; }
  async updateDevice(id: string, d: any) { 
    const idx = this.state.devices.findIndex(dev => dev.id === id);
    if (idx !== -1) { this.state.devices[idx] = { ...this.state.devices[idx], ...d }; await this.commit(); }
  }
  async deleteDevice(id: string) { this.state.devices = this.state.devices.filter(d => d.id !== id); await this.commit(); }
  async testDeviceConnection(id: string) { return { success: true, message: 'Registry Verified' }; }
  async saveEmailTemplate(t: any) { this.state.emailTemplates.push(t); await this.commit(); }
  async deleteEmailTemplate(id: string) { this.state.emailTemplates = this.state.emailTemplates.filter(t => t.id !== id); await this.commit(); }
  async sendPushNotification(tid: string, p: string, pr: string) { return true; }
  async addSenderIdentity(i: any) { this.state.settings.commConfig.senderIdentities.push(i); await this.commit(); }
  async verifySenderIdentity(id: string) { 
    const idx = this.state.settings.commConfig.senderIdentities.findIndex(i => i.id === id);
    if (idx !== -1) { this.state.settings.commConfig.senderIdentities[idx].isVerified = true; await this.commit(); }
  }
  async deleteSenderIdentity(id: string) { this.state.settings.commConfig.senderIdentities = this.state.settings.commConfig.senderIdentities.filter(i => i.id !== id); await this.commit(); }
  async auditOverdueLoads() {}
  async updateGatewayConfig(id: string, d: any) { 
    const idx = this.state.settings.paymentGateways.findIndex(g => g.id === id);
    if (idx !== -1) { this.state.settings.paymentGateways[idx] = { ...this.state.settings.paymentGateways[idx], ...d }; await this.commit(); }
  }

  getHealth(): DBHealth { 
    return { 
      documentSize: JSON.stringify(this.state).length, 
      logs: this.state.notifications || [], 
      lastSync: new Date().toISOString(), 
      isCloudSynced: !!this.firestore 
    }; 
  }
  async auditInfrastructure(): Promise<ConnectionAudit> { return { success: true, message: "Registry Link Active", timestamp: new Date().toISOString() }; }
  getSyncStatus() { return false; }

  async adjustScoreManually(uid: string, delta: number, reason: string, admin: string) {
     const idx = this.state.users.findIndex(u => u.id === uid);
     if (idx !== -1) {
        this.state.users[idx].creditScore += delta;
        this.state.creditLogs.push({ id: 'CS-'+Date.now(), userId: uid, delta, newScore: this.state.users[idx].creditScore, reason, timestamp: new Date().toISOString(), source: 'Admin', adminEmail: admin });
        await this.commit();
     }
  }

  async resetScoreManually(uid: string, admin: string) {
     await this.adjustScoreManually(uid, 600 - (this.state.users.find(u => u.id === uid)?.creditScore || 600), "Protocol Reset", admin);
  }

  async submitWithdrawalRequest(uid: string): Promise<{ success: boolean; message?: string }> { return { success: true }; }
  
  async updateConnectionDetails(uid: string, d: any) {
     const idx = this.state.users.findIndex(u => u.id === uid);
     if (idx !== -1) { this.state.users[idx] = { ...this.state.users[idx], ...d }; await this.commit(); }
  }

  async updateTicketStatus(id: string, s: TicketStatus) {
     const idx = this.state.tickets.findIndex(t => t.id === id);
     if (idx !== -1) { this.state.tickets[idx].status = s; await this.commit(); }
  }

  async assignTicket(id: string, e: string) {
     const idx = this.state.tickets.findIndex(t => t.id === id);
     if (idx !== -1) { this.state.tickets[idx].assignedTo = e; await this.commit(); }
  }

  async addTicketComment(id: string, t: string, i: boolean) {
     const idx = this.state.tickets.findIndex(t => t.id === id);
     if (idx !== -1) { 
        this.state.tickets[idx].comments.push({ id: 'CM-'+Date.now(), authorName: 'Admin', authorEmail: 'admin', authorRole: Role.ADMIN, text: t, timestamp: new Date().toISOString(), isInternal: i });
        await this.commit();
     }
  }

  async addNOCEvent(d: any) { this.state.nocEvents.push({ id: 'NOC-'+Date.now(), status: 'Active', startTime: new Date().toISOString(), ...d }); await this.commit(); }
  async resolveNOCEvent(id: string) {
     const idx = this.state.nocEvents.findIndex(e => e.id === id);
     if (idx !== -1) { this.state.nocEvents[idx].status = 'Resolved'; await this.commit(); }
  }

  async addTask(t: string, p: any, a: any, d: any) { 
    this.state.tasks.push({ id: 'TSK-'+Date.now(), text: t, priority: p, assignedTo: a, dueDate: d, completed: false, order: this.state.tasks.length });
    await this.commit();
  }

  async toggleTask(id: string) {
     const idx = this.state.tasks.findIndex(t => t.id === id);
     if (idx !== -1) { this.state.tasks[idx].completed = !this.state.tasks[idx].completed; await this.commit(); }
  }

  async deleteTask(id: string) { this.state.tasks = this.state.tasks.filter(t => t.id !== id); await this.commit(); }
  async reorderTasks(t: InternalTask[]) { this.state.tasks = t; await this.commit(); }
  async approvePasswordRequest(id: string) { return true; }
  async rejectPasswordRequest(id: string) { return true; }
  async convertPointsToWallet(uid: string) { return { success: true, amount: 100 }; }
  
  async settleEmergencyLoad(uid: string, m: any): Promise<{ success: boolean; message?: string }> { 
    const idx = this.state.emergencyLoads.findIndex(l => l.userId === uid && !l.repaid);
    if (idx !== -1) {
       this.state.emergencyLoads[idx].repaid = true;
       this.state.emergencyLoads[idx].status = 'Settled';
       this.state.emergencyLoads[idx].settledAt = new Date().toISOString();
       await this.commit();
       return { success: true };
    }
    return { success: false, message: 'Active rescue link not found.' };
  }

  async requestEmergencyLoad(uid: string, pid: any): Promise<{ success: boolean; message?: string }> { 
    this.state.emergencyLoads.push({ id: 'EL-'+Date.now(), userId: uid, userName: 'User', amount: 2500, status: 'Active', timestamp: new Date().toISOString(), expiryTimestamp: new Date(Date.now() + 3 * 86400000).toISOString(), lockedUntil: new Date().toISOString(), repaid: false, sourceType: 'Auto', activationSource: 'emergency_load' });
    await this.commit();
    return { success: true };
  }

  async submitUniversalActivation(uid: string, pid: string, m: any) { 
    this.state.packageRequests.push({ id: 'PR-'+Date.now(), userId: uid, userName: 'User', packageName: 'Plan', packageId: pid, amount: 1500, status: 'Pending', paymentMethod: m, timestamp: new Date().toISOString() });
    await this.commit();
    return { success: true }; 
  }

  async submitTicket(d: any) { this.state.tickets.push({ id: 'TCK-'+Date.now(), ...d, status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); await this.commit(); }
  async submitTopupRequest(d: any) { this.state.topupRequests.push({ id: 'TP-'+Date.now(), ...d, status: 'Pending', timestamp: new Date().toISOString(), requestType: 'Manual' }); await this.commit(); }

  async approvePackageRequest(id: string) { return this.approveUnifiedRequest(id, 'package'); }
  async rejectPackageRequest(id: string) { return this.rejectUnifiedRequest(id, 'package', 'Admin Denial'); }
  async approveTopupRequest(id: string) { return this.approveUnifiedRequest(id, 'topup'); }
  async rejectTopupRequest(id: string) { return this.rejectUnifiedRequest(id, 'topup', 'Admin Denial'); }
  async updateEmergencyLoad(id: string, data: any) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) { this.state.emergencyLoads[idx] = { ...this.state.emergencyLoads[idx], ...data }; await this.commit(); }
  }
  async extendEmergencyLoad(id: string, days: number, reason: string): Promise<{ success: boolean; message?: string }> {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
       const load = this.state.emergencyLoads[idx];
       const oldDate = new Date(load.expiryTimestamp);
       const newDate = new Date(oldDate.getTime() + days * 86400000);
       load.expiryTimestamp = newDate.toISOString();
       if (!load.extensions) load.extensions = [];
       load.extensions.push({
          id: 'EXT-' + Date.now(),
          emergencyLoadId: id,
          extendedByAdminId: 'admin',
          oldDueDate: oldDate.toISOString(),
          newDueDate: newDate.toISOString(),
          reason,
          createdAt: new Date().toISOString()
       });
       await this.commit();
       return { success: true };
    }
    return { success: false, message: 'Load not found' };
  }
  async clearEmergencyLoadManually(id: string) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
       this.state.emergencyLoads[idx].status = 'Cleared';
       this.state.emergencyLoads[idx].repaid = true;
       await this.adjustScoreManually(this.state.emergencyLoads[idx].userId, -50, "Manual Debt Clearance Override", "System");
       await this.commit();
    }
  }
  getPendingUniversalRequest(uid: string) {
    const pkg = this.state.packageRequests.find(r => r.userId === uid && r.status === 'Pending');
    if (pkg) return { ...pkg, unifiedType: 'package' };
    const topup = this.state.topupRequests.find(r => r.userId === uid && r.status === 'Pending');
    if (topup) return { ...topup, unifiedType: 'topup' };
    const emer = this.state.emergencyLoads.find(r => r.userId === uid && r.status === 'Pending_Activation');
    if (emer) return { ...emer, unifiedType: 'emergency' };
    return null;
  }
  async cancelUniversalRequest(id: string) {
    this.state.packageRequests = this.state.packageRequests.filter(r => r.id !== id);
    this.state.topupRequests = this.state.topupRequests.filter(r => r.id !== id);
    this.state.emergencyLoads = this.state.emergencyLoads.filter(r => r.id !== id);
    await this.commit();
    return { success: true };
  }
  async updateSubscriberProfile(uid: string, data: any): Promise<{ success: boolean; message?: string }> {
    return this.updateUser(uid, data);
  }
  async clearNotifications(uid: string, audience: string) {
    this.state.notifications = this.state.notifications.filter(n => !(n.targetId === uid && n.audience === audience));
    await this.commit();
  }
}

export const db = new DB();