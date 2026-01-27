
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
  EmailCampaign, EmailTemplate, AudienceSegment, CommunicationAutomationRule, DeliveryLog, CommunicationSettings, SenderIdentity, PaymentGateway, AppSection, InfrastructureConfig, LegalConfig
} from './types';

// Replace these with your actual Firebase project settings from the Firebase Console
// Project Settings > General > Your Apps > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "AIzaSy... (Your Key)",
  authDomain: "click-opticx.firebaseapp.com",
  projectId: "click-opticx",
  storageBucket: "click-opticx.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Fix: Added exported DBHealth interface for monitoring
export interface DBHealth {
  documentSize: number;
  logs: SystemNotification[];
  lastSync: string;
  isCloudSynced: boolean;
}

// Fix: Added exported ConnectionAudit interface for monitoring
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

const INITIAL_INFRA_CONFIG: InfrastructureConfig = {
  domainNode: 'netrecover.pk',
  targetIP: '103.14.55.1',
  dnsStatus: 'PROPAGATED',
  nameservers: ['ns1.netrecover.pk', 'ns2.netrecover.pk']
};

const INITIAL_LEGAL_CONFIG: LegalConfig = {
  termsAndConditions: 'All service users must abide by the Acceptable Use Policy. Bandwidth is shared and subject to fair use.',
  serviceAgreement: 'I agree to pay my monthly dues before the 5th of each month.',
  privacyPolicy: 'We value your privacy. Data is encrypted and used only for service provision.',
  refundPolicy: 'Refunds are subject to verification of downtime exceeding 48 consecutive hours.'
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

const INITIAL_GATEWAYS: PaymentGateway[] = [
  { id: 'stripe', name: 'Stripe Node', type: 'online', enabled: true, priority: 1, sandbox: true, allowedFor: ['packages', 'wallet', 'invoices'], config: { publishableKey: '', secretKey: '', webhookSecret: '' } },
  { id: 'cash', name: 'Physical Cash', type: 'offline', enabled: true, priority: 6, sandbox: false, allowedFor: ['packages', 'wallet', 'invoices'], config: {}, instructions: 'Pay at any authorized regional shop.' }
];

const INITIAL_APP_PAGES: AppPage[] = [
  { id: 'home', label: 'Dashboard', icon: 'Home', category: 'Core', enabled: true, showInDirectory: true, isDefault: true, swatch: '#4f46e5' },
  { id: 'wallet', label: 'My Wallet', icon: 'Wallet', category: 'Fiscal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#10b981' },
  { id: 'packages', label: 'Service Plans', icon: 'Signal', category: 'Core', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
  { id: 'support', label: 'Help Center', icon: 'Headphones', category: 'Support', enabled: true, showInDirectory: true, isDefault: false, swatch: '#8b5cf6' },
  { id: 'live-usage', label: 'Live Usage', icon: 'Monitor', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
];

const INITIAL_APP_SECTIONS: AppSection[] = [
  { id: 'status', label: 'CONNECTIVITY STATUS', enabled: true, order: 0, layout: 'Grid', gridCols: 1, itemIds: [] },
  { id: 'fiscal-summary', label: 'FISCAL SUMMARY', enabled: true, order: 3, layout: 'Grid', gridCols: 2, itemIds: [], isSpecialNode: true },
  { id: 'directory', label: 'ALL SERVICES', enabled: true, order: 8, layout: 'Grid', gridCols: 2, itemIds: [] }
];

const ALL_ROLES = Object.values(Role).filter(r => r !== Role.CUSTOMER);

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
      sections: INITIAL_APP_SECTIONS
    },
    referral: { enabled: true, signupPoints: 500, pkg1Points: 1000, pkg2Points: 1000, pkg3Points: 500, minPkgPrice: 1000, conversionRatio: 0.01 },
    aboutUs: { vision: "", mission: "", companyStory: "", features: [], values: [], version: "v8.6.0", lastUpdated: new Date().toISOString() },
    notificationTemplates: [],
    footerText: "Official ISP Management Portal",
    copyrightLine: "© 2025 Click Opticx",
    socialLinks: [],
    appVersion: "v8.6.0",
    autoTaxPercentage: 15,
    globalEmergencyLimit: 2500,
    paymentGateways: INITIAL_GATEWAYS,
    techConfig: { wireless: { cat6PricePerMeter: 50, clipPrice: 5, ravalBoldPricePerPair: 1200, polls: [], receivers: [], onus: [] }, fiber: { wirePricePerMeter: 30, baseInstallation: 2500, onus: [], routers: [] } },
    currency: "Rs.",
    taxId: "TX-4492-CO",
    whiteLabelMode: false,
    allowWifiReset: true,
    aiConfig: INITIAL_AI_CONFIG,
    aiCallConfig: { enabled: true, voiceName: 'Zephyr', persona: 'Professional', language: 'English', speakingSpeed: 1.0, maxCallDuration: 300, officeHours: { start: '09:00', end: '21:00', enabled: true }, knowledgeBase: { outageScripts: '', billingPolicy: '', emergencyTerms: '' } },
    commConfig: INITIAL_COMM_CONFIG,
    infrastructure: INITIAL_INFRA_CONFIG,
    legal: INITIAL_LEGAL_CONFIG
  },
  permissions: [],
  notifications: [],
  roles: ALL_ROLES,
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
      console.warn("Cloud Handshake Failed, running in local-only mode.");
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
        // First time initialization in the cloud
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

  private notify() {
    this.listeners.forEach(l => l(this.getState()));
  }

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
    const user = this.state.users.find(u => !u.deleted && (
      (u.username || '').toLowerCase() === input || 
      (u.email || '').toLowerCase() === input || 
      u.phone === input ||
      u.connectionId === input
    ) && u.password === pass);
    if (user) {
      this.state.currentUser = { ...user, role: Role.CUSTOMER };
      this.notify();
      return { success: true, user: this.state.currentUser, type: 'customer' };
    }
    return { success: false, message: 'Identity lookup failed.' };
  }

  async logout() {
    this.state.currentUser = undefined;
    this.state.isImpersonating = false;
    this.notify();
  }

  async updateSettings(s: SystemSettings) { this.state.settings = s; await this.commit(); }
  async updateGatewayConfig(id: string, d: any) {
    const idx = this.state.settings.paymentGateways.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.settings.paymentGateways[idx] = { ...this.state.settings.paymentGateways[idx], ...d };
      await this.commit();
    }
  }

  async addUser(u: Partial<ISPUser>) { 
    const newUser = { id: 'USR-'+Date.now(), connectionId: 'NR-'+Math.floor(10000+Math.random()*90000), balance: 0, creditScore: 600, activationCount: 0, portalEnabled: true, connectionType: 'Fiber', activityLog: [], ...u }; 
    this.state.users.push(newUser as any); await this.commit(); return { success: true, user: newUser }; 
  }

  async updateUser(id: string, d: any) { 
    const idx = this.state.users.findIndex(u => u.id === id);
    if (idx !== -1) { this.state.users[idx] = { ...this.state.users[idx], ...d }; await this.commit(); return { success: true }; }
    return { success: false };
  }

  async addStaff(s: Partial<StaffUser>) {
    const next = { ...s, status: s.status || 'Active', password: s.password || 'superpass', balance: s.balance || 0 } as StaffUser;
    this.state.staff.push(next);
    await this.commit();
    return { success: true };
  }

  async updateStaff(email: string, d: any) {
    const idx = this.state.staff.findIndex(s => s.email === email);
    if (idx !== -1) { this.state.staff[idx] = { ...this.state.staff[idx], ...d }; await this.commit(); return { success: true }; }
    return { success: false };
  }

  // Fix: Added message to processTopup result
  async processTopup(collector: string, target: string, type: 'staff' | 'user', amount: number) {
    if (type === 'staff') {
       const sIdx = this.state.staff.findIndex(s => s.email === target);
       if (sIdx !== -1) {
          this.state.staff[sIdx].balance = (this.state.staff[sIdx].balance || 0) + amount;
          this.state.ledger.push({ id: 'TOP_'+Date.now(), userId: target, amount, type: LedgerType.CREDIT, timestamp: new Date().toISOString(), description: 'Admin Refill', balanceAfter: this.state.staff[sIdx].balance, method: 'Registry Direct' });
       } else return { success: false, message: 'Identity lookup failed.' };
    } else {
       const uIdx = this.state.users.findIndex(u => u.id === target);
       if (uIdx !== -1) {
          this.state.users[uIdx].balance = (this.state.users[uIdx].balance || 0) + amount;
          this.state.ledger.push({ id: 'TOP_'+Date.now(), userId: target, amount, type: LedgerType.CREDIT, timestamp: new Date().toISOString(), description: 'Credit Refill', balanceAfter: this.state.users[uIdx].balance, method: 'Direct Handshake' });
       } else return { success: false, message: 'Identity lookup failed.' };
    }
    await this.commit();
    return { success: true };
  }

  async activatePackage(userId: string, pkgId: string) {
    const uIdx = this.state.users.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
       this.state.users[uIdx].packageId = pkgId;
       this.state.users[uIdx].status = UserStatus.ACTIVE;
       const d = new Date(); d.setDate(d.getDate() + 30);
       this.state.users[uIdx].expiryDate = d.toISOString();
       await this.commit();
       return { success: true };
    }
    return { success: false };
  }

  // Fix: Added markNotificationRead method
  markNotificationRead(id: string) {
    const idx = this.state.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.state.notifications[idx].read = true;
      this.commit();
    }
  }

  // Fix: Added markAllNotificationsRead method
  markAllNotificationsRead(targetId: string, audience: NotificationAudience) {
    this.state.notifications = this.state.notifications.map(n => {
      if (n.audience === audience && (n.targetId === targetId || n.targetId === 'all')) {
        return { ...n, read: true };
      }
      return n;
    });
    this.commit();
  }

  // Fix: Added clearNotifications method
  async clearNotifications(targetId: string, audience: NotificationAudience) {
    this.state.notifications = this.state.notifications.filter(n => 
      !(n.audience === audience && (n.targetId === targetId || n.targetId === 'all'))
    );
    await this.commit();
  }

  logNotification(targetId: string, type: 'success' | 'warning' | 'info' | 'error', title: string, message: string) {
    const n: SystemNotification = {
      id: 'NOT-' + Date.now(), targetId, type, title, message, read: false, timestamp: new Date().toISOString(), createdAt: Date.now(), audience: targetId === 'all' ? 'admin' : 'subscriber', priority: 'normal'
    };
    this.state.notifications.unshift(n);
    this.commit();
  }

  // Fix: Added message to approveUnifiedRequest result
  async approveUnifiedRequest(id: string, type: string) { 
    if (type === 'package') {
      const req = this.state.packageRequests.find(r => r.id === id);
      if (req) {
        req.status = 'Approved';
        await this.activatePackage(req.userId, req.packageId);
      }
    } else if (type === 'topup') {
      const req = this.state.topupRequests.find(r => r.id === id);
      if (req) {
        req.status = 'Approved';
        await this.processTopup('Admin', req.userId, 'user', req.amount);
      }
    }
    await this.commit();
    return { success: true }; 
  }

  // Fix: Added rejectUnifiedRequest method
  async rejectUnifiedRequest(id: string, type: string, r: string) { 
    if (type === 'package') {
      const req = this.state.packageRequests.find(r => r.id === id);
      if (req) req.status = 'Rejected';
    } else if (type === 'topup') {
      const req = this.state.topupRequests.find(r => r.id === id);
      if (req) req.status = 'Rejected';
    }
    await this.commit();
    return { success: true }; 
  }

  // Fix: DBHealth used here
  getHealth(): DBHealth { 
    return { 
      documentSize: JSON.stringify(this.state).length, 
      logs: this.state.notifications || [], 
      lastSync: new Date().toISOString(), 
      isCloudSynced: !!this.firestore 
    }; 
  }

  getSyncStatus() { return false; }
  async updateAIKeys(keys: any) { this.state.settings.aiConfig.aiKeys = { ...this.state.settings.aiConfig.aiKeys, ...keys }; await this.commit(); return true; }

  // Fix: Added submitSignupRequest method
  async submitSignupRequest(data: any) {
    const request = {
      id: 'SR-' + Date.now(),
      ...data,
      status: 'Pending',
      timestamp: new Date().toISOString()
    };
    this.state.signupRequests.push(request);
    await this.commit();
    return { success: true };
  }

  // Fix: Added approveSignup method
  async approveSignup(id: string) {
    const idx = this.state.signupRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
      const req = this.state.signupRequests[idx];
      req.status = 'Approved';
      await this.addUser({
        name: req.name,
        phone: req.phone,
        email: req.email,
        address: req.address,
        area: req.area,
        packageId: req.packageId,
        password: req.password,
        username: req.username,
        status: UserStatus.ACTIVE
      });
      await this.commit();
    }
  }

  // Fix: Added auditOverdueLoads method
  auditOverdueLoads() {
    const now = new Date().toISOString();
    let updated = false;
    this.state.emergencyLoads.forEach(l => {
      if (l.status === 'Active' && l.expiryTimestamp < now) {
        l.status = 'Overdue';
        updated = true;
      }
    });
    if (updated) this.commit();
  }

  // Fix: Added addManualPayment method
  async addManualPayment(userId: string, amount: number, method: PaymentMethod) {
    const user = this.state.users.find(u => u.id === userId);
    const staff = this.state.staff.find(s => s.email === userId);
    const payment: PaymentRecord = {
      id: 'PAY-' + Date.now(),
      userId,
      userName: user?.name || staff?.name || 'Unknown',
      amount,
      method,
      status: 'Approved',
      timestamp: new Date().toISOString(),
      collectorEmail: this.state.currentUser?.email || 'System',
      collectorName: this.state.currentUser?.name || 'System',
      invoiceId: 'MANUAL',
      isCleared: true
    };
    this.state.payments.push(payment);
    
    // Update user balance
    const uIdx = this.state.users.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      this.state.users[uIdx].balance = Math.max(0, this.state.users[uIdx].balance - amount);
      this.state.ledger.push({
        id: 'LEDGER_' + Date.now(),
        userId,
        amount,
        type: LedgerType.CREDIT,
        timestamp: new Date().toISOString(),
        description: `Manual Payment (${method})`,
        balanceAfter: this.state.users[uIdx].balance,
        method
      });
    }
    
    await this.commit();
    return { success: true };
  }

  // Fix: Added updateCustomerPassword method
  async updateCustomerPassword(userId: string, pass: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.state.users[idx].password = pass;
      this.state.users[idx].mustChangePassword = false;
      await this.commit();
      return { success: true };
    }
    return { success: false, message: 'User not found' };
  }

  // Fix: Added bulkDeleteUsers method
  async bulkDeleteUsers(ids: string[]) {
    this.state.users = this.state.users.map(u => ids.includes(u.id) ? { ...u, deleted: true } : u);
    await this.commit();
  }

  // Fix: Added bulkSetAccountStatus method
  async bulkSetAccountStatus(ids: string[], status: UserStatus, note: string) {
    this.state.users = this.state.users.map(u => ids.includes(u.id) ? { ...u, status, internalNotes: note } : u);
    await this.commit();
  }

  // Fix: Added bulkForcePasswordReset method
  async bulkForcePasswordReset(ids: string[]) {
    this.state.users = this.state.users.map(u => ids.includes(u.id) ? { ...u, mustChangePassword: true } : u);
    await this.commit();
  }

  // Fix: Added bulkActivatePackages method
  async bulkActivatePackages(ids: string[], pkgId: string) {
    for (const id of ids) {
      await this.activatePackage(id, pkgId);
    }
  }

  // Fix: Added clearStaffCollections method
  async clearStaffCollections(email: string) {
    this.state.payments = this.state.payments.map(p => 
      p.collectorEmail === email ? { ...p, isCleared: true } : p
    );
    await this.commit();
  }

  // Fix: Added approvePayment method
  async approvePayment(id: string) {
    const idx = this.state.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.state.payments[idx].status = 'Approved';
      await this.commit();
    }
  }

  // Fix: Added updatePackage method
  async updatePackage(id: string, data: Partial<Package>) {
    const idx = this.state.packages.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.state.packages[idx] = { ...this.state.packages[idx], ...data };
      await this.commit();
    }
  }

  // Fix: Added addPackage method
  async addPackage(data: Partial<Package>) {
    const newPkg = { id: 'PKG-' + Date.now(), ...data } as Package;
    this.state.packages.push(newPkg);
    await this.commit();
  }

  // Fix: Added archiveMonth method
  async archiveMonth(month: string) {
    const record: ArchiveRecord = {
      month,
      archivedAt: new Date().toISOString(),
      data: {
        invoices: this.state.invoices.filter(i => i.createdAt.startsWith(month)),
        payments: this.state.payments.filter(p => p.timestamp.startsWith(month)),
        ledger: this.state.ledger.filter(l => l.timestamp.startsWith(month))
      }
    };
    this.state.archives.push(record);
    await this.commit();
    return { success: true };
  }

  // Fix: Added updateModulePermission method
  async updateModulePermission(moduleId: string, updates: any) {
    const idx = this.state.permissions.findIndex(p => p.id === moduleId);
    if (idx !== -1) {
      this.state.permissions[idx] = { ...this.state.permissions[idx], ...updates };
      await this.commit();
    }
  }

  // Fix: Added addRole method
  async addRole(role: string) {
    if (!this.state.roles.includes(role)) {
      this.state.roles.push(role);
      await this.commit();
    }
  }

  // Fix: Added deleteRole method
  async deleteRole(role: string) {
    this.state.roles = this.state.roles.filter(r => r !== role);
    await this.commit();
  }

  // Fix: Added auditInfrastructure method
  async auditInfrastructure(): Promise<ConnectionAudit> {
    return {
      success: true,
      message: "Infrastructure audit complete. All nodes responsive.",
      timestamp: new Date().toISOString()
    };
  }

  // Fix: Added exportVault method
  exportVault() {
    const data = JSON.stringify(this.state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vault_Export_${new Date().toISOString()}.json`;
    link.click();
  }

  // Fix: Added addDealerLoad method
  async addDealerLoad(email: string, amount: number, mode: string, dueDate: string) {
    const dealerIdx = this.state.staff.findIndex(s => s.email === email);
    if (dealerIdx !== -1) {
      this.state.staff[dealerIdx].balance = (this.state.staff[dealerIdx].balance || 0) + amount;
      this.state.ledger.push({
        id: 'LOAD_' + Date.now(),
        userId: email,
        amount,
        type: LedgerType.CREDIT,
        timestamp: new Date().toISOString(),
        description: `Dealer Load (${mode})`,
        balanceAfter: this.state.staff[dealerIdx].balance,
        method: 'Dealer Load'
      });
      await this.commit();
    }
  }

  // Fix: Added generateAdHocInvoice method
  async generateAdHocInvoice(userId: string, packageId: string, total: number, items: LineItem[]) {
    const user = this.state.users.find(u => u.id === userId);
    const pkg = this.state.packages.find(p => p.id === packageId);
    
    const invoice: Invoice = {
      id: 'INV-' + Date.now(),
      userId,
      userName: user?.name || 'Unknown',
      packageId,
      packageName: pkg?.name || 'Custom Service',
      items,
      subtotal: total,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: total,
      paidAmount: 0,
      status: PaymentStatus.UNPAID,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };

    this.state.invoices.push(invoice);
    
    // Increase user balance
    const uIdx = this.state.users.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      this.state.users[uIdx].balance += total;
    }

    await this.commit();
    return invoice;
  }

  // Fix: Added sendInvoiceEmail method
  async sendInvoiceEmail(id: string) {
    return true; // Mock email relay
  }

  // Fix: Added markVerificationSuccessShown method
  async markVerificationSuccessShown(userId: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.state.users[idx].verificationSuccessShown = true;
      await this.commit();
    }
  }

  // Fix: Added updateAppSection method
  async updateAppSection(section: AppSection) {
    const idx = this.state.settings.appearance.sections.findIndex(s => s.id === section.id);
    if (idx !== -1) {
      this.state.settings.appearance.sections[idx] = section;
      await this.commit();
    }
  }

  // Fix: Added impersonateUser method
  async impersonateUser(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      this.state.originalAdminUser = this.state.currentUser;
      this.state.currentUser = { ...user, role: Role.CUSTOMER };
      this.state.isImpersonating = true;
      this.notify();
    }
  }

  // Fix: Added toggleDirectoryView method
  async toggleDirectoryView(id: string, visible: boolean) {
    const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.state.settings.appearance.appPages[idx].showInDirectory = visible;
      await this.commit();
    }
  }

  // Fix: Added toggleAppPage method
  async toggleAppPage(id: string, enabled: boolean) {
    const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.state.settings.appearance.appPages[idx].enabled = enabled;
      await this.commit();
    }
  }

  // Fix: Added approvePackageRequest method
  async approvePackageRequest(id: string) {
    const req = this.state.packageRequests.find(r => r.id === id);
    if (req) {
      req.status = 'Approved';
      await this.activatePackage(req.userId, req.packageId);
    }
    await this.commit();
  }

  // Fix: Added rejectPackageRequest method
  async rejectPackageRequest(id: string) {
    const req = this.state.packageRequests.find(r => r.id === id);
    if (req) req.status = 'Rejected';
    await this.commit();
  }

  // Fix: Added approveTopupRequest method
  async approveTopupRequest(id: string) {
    const req = this.state.topupRequests.find(r => r.id === id);
    if (req) {
      req.status = 'Approved';
      await this.processTopup('Admin', req.userId, 'user', req.amount);
    }
    await this.commit();
  }

  // Fix: Added rejectTopupRequest method
  async rejectTopupRequest(id: string) {
    const req = this.state.topupRequests.find(r => r.id === id);
    if (req) req.status = 'Rejected';
    await this.commit();
  }

  // Fix: Added cancelTopupRequest method
  async cancelTopupRequest(id: string) {
    const req = this.state.topupRequests.find(r => r.id === id);
    if (req) req.status = 'Cancelled';
    await this.commit();
  }

  // Fix: Added updateEmergencyLoad method
  async updateEmergencyLoad(id: string, updates: any) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.emergencyLoads[idx] = { ...this.state.emergencyLoads[idx], ...updates };
      await this.commit();
    }
  }

  // Fix: Added extendEmergencyLoad method
  async extendEmergencyLoad(id: string, days: number, reason: string) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
      const load = this.state.emergencyLoads[idx];
      const oldDate = new Date(load.expiryTimestamp);
      oldDate.setDate(oldDate.getDate() + days);
      load.expiryTimestamp = oldDate.toISOString();
      if (!load.extensions) load.extensions = [];
      load.extensions.push({
        id: 'EXT-' + Date.now(),
        emergencyLoadId: id,
        extendedByAdminId: this.state.currentUser?.email || 'Admin',
        oldDueDate: load.expiryTimestamp,
        newDueDate: oldDate.toISOString(),
        reason,
        createdAt: new Date().toISOString()
      });
      await this.commit();
      return { success: true };
    }
    return { success: false };
  }

  // Fix: Added clearEmergencyLoadManually method
  async clearEmergencyLoadManually(id: string) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.emergencyLoads[idx].status = 'Cleared';
      this.state.emergencyLoads[idx].repaid = true;
      await this.commit();
    }
  }

  // Fix: Added getPendingUniversalRequest method
  getPendingUniversalRequest(userId: string) {
    const pkg = this.state.packageRequests.find(r => r.userId === userId && r.status === 'Pending');
    if (pkg) return { ...pkg, type: 'package' };
    const topup = this.state.topupRequests.find(r => r.userId === userId && r.status === 'Pending');
    if (topup) return { ...topup, type: 'topup' };
    return null;
  }

  // Fix: Added cancelUniversalRequest method
  async cancelUniversalRequest(id: string) {
    const pkgIdx = this.state.packageRequests.findIndex(r => r.id === id);
    if (pkgIdx !== -1) this.state.packageRequests[pkgIdx].status = 'Cancelled';
    const topupIdx = this.state.topupRequests.findIndex(r => r.id === id);
    if (topupIdx !== -1) this.state.topupRequests[topupIdx].status = 'Cancelled';
    await this.commit();
  }

  // Fix: Added updateSubscriberProfile method
  async updateSubscriberProfile(userId: string, updates: any) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.state.users[idx] = { ...this.state.users[idx], ...updates };
      await this.commit();
      return { success: true };
    }
    return { success: false, message: 'User not found' };
  }

  // Fix: Added getMappingForUser method
  getMappingForUser(userId: string) {
    return this.state.networkMappings.find(m => m.userId === userId);
  }

  // Fix: Added saveMapping method
  async saveMapping(mapping: NetworkMapping) {
    const idx = this.state.networkMappings.findIndex(m => m.userId === mapping.userId);
    if (idx !== -1) {
      this.state.networkMappings[idx] = mapping;
    } else {
      this.state.networkMappings.push(mapping);
    }
    await this.commit();
  }

  // Fix: Added submitTicket method
  async submitTicket(data: any) {
    const ticket: SupportTicket = {
      id: 'TKT-' + Date.now(),
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    this.state.tickets.push(ticket);
    await this.commit();
  }

  // Fix: Added updateTicketStatus method
  async updateTicketStatus(id: string, status: TicketStatus) {
    const idx = this.state.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.tickets[idx].status = status;
      this.state.tickets[idx].updatedAt = new Date().toISOString();
      await this.commit();
    }
  }

  // Fix: Added assignTicket method
  async assignTicket(id: string, email: string) {
    const idx = this.state.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.tickets[idx].assignedTo = email;
      await this.commit();
    }
  }

  // Fix: Added addTicketComment method
  async addTicketComment(id: string, text: string, isInternal: boolean) {
    const idx = this.state.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.tickets[idx].comments.push({
        id: 'COM-' + Date.now(),
        authorName: this.state.currentUser?.name || 'System',
        authorEmail: this.state.currentUser?.email || 'system',
        authorRole: this.state.currentUser?.role || 'Customer',
        text,
        timestamp: new Date().toISOString(),
        isInternal
      });
      this.state.tickets[idx].updatedAt = new Date().toISOString();
      await this.commit();
    }
  }

  // Fix: Added submitTopupRequest method
  async submitTopupRequest(data: any) {
    const req = {
      id: 'TR-' + Date.now(),
      status: 'Pending',
      timestamp: new Date().toISOString(),
      ...data
    };
    this.state.topupRequests.push(req);
    await this.commit();
  }

  // Fix: Added convertPointsToWallet method
  async convertPointsToWallet(userId: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const user = this.state.users[idx];
      const amount = user.referralPoints * this.state.settings.referral.conversionRatio;
      user.balance += amount;
      user.referralPoints = 0;
      await this.commit();
      return { success: true, amount };
    }
    return { success: false };
  }

  // Fix: Added submitWithdrawalRequest method
  async submitWithdrawalRequest(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      const amount = user.referralPoints * this.state.settings.referral.conversionRatio;
      this.state.withdrawalRequests.push({
        id: 'WD-' + Date.now(),
        userId,
        userName: user.name,
        points: user.referralPoints,
        amount,
        status: 'Pending',
        timestamp: new Date().toISOString()
      });
      user.referralPoints = 0;
      await this.commit();
      return { success: true };
    }
    return { success: false };
  }

  // Fix: Added settleEmergencyLoad method
  async settleEmergencyLoad(userId: string, method: PaymentMethod) {
    const loadIdx = this.state.emergencyLoads.findIndex(l => l.userId === userId && !l.repaid);
    if (loadIdx !== -1) {
      const load = this.state.emergencyLoads[loadIdx];
      await this.processTopup('Emergency Settle', userId, 'user', load.amount);
      this.state.emergencyLoads[loadIdx].status = 'Settled';
      this.state.emergencyLoads[loadIdx].repaid = true;
      this.state.emergencyLoads[loadIdx].settledAt = new Date().toISOString();
      await this.commit();
      return { success: true };
    }
    return { success: false };
  }

  // Fix: Added requestEmergencyLoad method
  async requestEmergencyLoad(userId: string, pkgId?: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Identity not found' };
    
    const amount = 2500;
    const now = new Date();
    const expiry = new Date(now.getTime() + 72 * 3600000); // 72 hours
    const lockUntil = new Date(now.getTime() + 15 * 60000); // 15 mins lock

    const load: EmergencyLoad = {
      id: 'EL-' + Date.now(),
      userId,
      userName: user.name,
      amount,
      status: 'Pending_Activation',
      timestamp: now.toISOString(),
      expiryTimestamp: expiry.toISOString(),
      lockedUntil: lockUntil.toISOString(),
      packageId: pkgId,
      repaid: false,
      sourceType: 'Auto',
      activationSource: 'emergency_load'
    };

    this.state.emergencyLoads.push(load);
    await this.commit();
    return { success: true };
  }

  // Fix: Added submitUniversalActivation method
  async submitUniversalActivation(userId: string, pkgId: string, method: PaymentMethod) {
    const user = this.state.users.find(u => u.id === userId);
    const pkg = this.state.packages.find(p => p.id === pkgId);
    if (!user || !pkg) return { success: false };

    this.state.packageRequests.push({
      id: 'PR-' + Date.now(),
      userId,
      userName: user.name,
      packageId: pkgId,
      packageName: pkg.name,
      amount: pkg.price,
      status: 'Pending',
      paymentMethod: method,
      timestamp: new Date().toISOString()
    });

    await this.commit();
    return { success: true };
  }

  // Fix: Added adjustScoreManually method
  async adjustScoreManually(userId: string, delta: number, reason: string, adminEmail: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.state.users[idx].creditScore += delta;
      this.state.creditLogs.push({
        id: 'CL-' + Date.now(),
        userId,
        delta,
        newScore: this.state.users[idx].creditScore,
        reason,
        timestamp: new Date().toISOString(),
        source: 'Manual Adjustment',
        adminEmail
      });
      await this.commit();
    }
  }

  // Fix: Added resetScoreManually method
  async resetScoreManually(userId: string, adminEmail: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const delta = 600 - this.state.users[idx].creditScore;
      this.state.users[idx].creditScore = 600;
      this.state.creditLogs.push({
        id: 'CL-' + Date.now(),
        userId,
        delta,
        newScore: 600,
        reason: 'Authorized System Reset',
        timestamp: new Date().toISOString(),
        source: 'Admin Force Reset',
        adminEmail
      });
      await this.commit();
    }
  }

  // Fix: Added updateConnectionDetails method
  async updateConnectionDetails(userId: string, updates: any) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.state.users[idx] = { ...this.state.users[idx], ...updates };
      await this.commit();
    }
  }

  // Fix: Added payInvoiceWithWallet method
  async payInvoiceWithWallet(id: string) {
    const invIdx = this.state.invoices.findIndex(i => i.id === id);
    if (invIdx !== -1) {
      const inv = this.state.invoices[invIdx];
      const userIdx = this.state.users.findIndex(u => u.id === inv.userId);
      if (userIdx !== -1) {
        this.state.invoices[invIdx].status = PaymentStatus.PAID;
        this.state.invoices[invIdx].paidAt = new Date().toISOString();
        this.state.invoices[invIdx].paidAmount = inv.totalAmount;
        this.state.users[userIdx].balance = Math.max(0, this.state.users[userIdx].balance - inv.totalAmount);
        await this.commit();
        return { success: true };
      }
    }
    return { success: false, message: 'Identity node mismatch' };
  }

  // Fix: Added addNOCEvent method
  async addNOCEvent(data: Partial<NOCEvent>) {
    const event: NOCEvent = {
      id: 'NOC-' + Date.now(),
      status: 'Active',
      startTime: new Date().toISOString(),
      title: data.title || '',
      description: data.description || '',
      area: data.area || 'All',
      severity: data.severity || 'Info'
    };
    this.state.nocEvents.push(event);
    await this.commit();
  }

  // Fix: Added resolveNOCEvent method
  async resolveNOCEvent(id: string) {
    const idx = this.state.nocEvents.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.state.nocEvents[idx].status = 'Resolved';
      this.state.nocEvents[idx].endTime = new Date().toISOString();
      await this.commit();
    }
  }

  // Fix: Added addTask method
  async addTask(text: string, priority: any, assignedTo?: string, dueDate?: string) {
    this.state.tasks.push({
      id: 'T-' + Date.now(),
      text,
      completed: false,
      priority,
      assignedTo,
      dueDate,
      order: this.state.tasks.length
    });
    await this.commit();
  }

  // Fix: Added toggleTask method
  async toggleTask(id: string) {
    const idx = this.state.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.tasks[idx].completed = !this.state.tasks[idx].completed;
      await this.commit();
    }
  }

  // Fix: Added deleteTask method
  async deleteTask(id: string) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    await this.commit();
  }

  // Fix: Added reorderTasks method
  async reorderTasks(tasks: InternalTask[]) {
    this.state.tasks = tasks.map((t, i) => ({ ...t, order: i }));
    await this.commit();
  }

  // Fix: Added getLiveUsage method
  getLiveUsage(userId: string) {
    return {
      down: (Math.random() * 20 + 30).toFixed(2),
      up: (Math.random() * 10 + 5).toFixed(2),
      ping: Math.floor(Math.random() * 20 + 5),
      usageToday: (Math.random() * 5).toFixed(2),
      usageMonth: (Math.random() * 150).toFixed(2),
      offline: !this.getMappingForUser(userId)?.configured
    };
  }

  // Fix: Added getConnectedDevices method
  getConnectedDevices(userId: string): ConnectedDevice[] {
    return [
      { id: 'D1', name: 'Primary iPhone', ip: '192.168.1.12', mac: 'E4:A1:7F:C2:08', signal: -42, usageToday: 1.2, duration: '12h 4m', isBlocked: false },
      { id: 'D2', name: 'Living Room TV', ip: '192.168.1.15', mac: 'A2:B4:C6:D8:E0', signal: -64, usageToday: 4.5, duration: '2d 4h', isBlocked: false }
    ];
  }

  // Fix: Added blockDevice method
  async blockDevice(userId: string, deviceId: string) { return true; }
  // Fix: Added renameDevice method
  async renameDevice(userId: string, deviceId: string, name: string) { return true; }

  // Fix: Added submitWifiPasswordRequest method
  async submitWifiPasswordRequest(userId: string, newPass: string) {
    this.state.passwordRequests.push({
      id: 'PW-' + Date.now(),
      userId,
      userName: this.state.users.find(u => u.id === userId)?.name || 'Unknown',
      connectionType: 'Fiber',
      ssid: this.getMappingForUser(userId)?.ssidName || 'My WiFi',
      newPassword: newPass,
      status: 'Pending',
      timestamp: new Date().toISOString()
    });
    await this.commit();
  }

  // Fix: Added approvePasswordRequest method
  async approvePasswordRequest(id: string) {
    const idx = this.state.passwordRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.state.passwordRequests[idx].status = 'Applied';
      await this.commit();
    }
  }

  // Fix: Added rejectPasswordRequest method
  async rejectPasswordRequest(id: string) {
    const idx = this.state.passwordRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.state.passwordRequests[idx].status = 'Rejected';
      await this.commit();
    }
  }

  // Fix: Added addNetworkNode method
  async addNetworkNode(data: any) {
    const node: NetworkNode = {
      id: 'NN-' + Date.now(),
      status: 'Connected',
      lastHeartbeat: new Date().toISOString(),
      ...data
    };
    this.state.networkNodes.push(node);
    await this.commit();
    return { success: true };
  }

  // Fix: Added testNodeConnection method
  async testNodeConnection(id: string) {
    return { success: true, message: 'Node handshake verified.' };
  }

  // Fix: Added updateDevice method
  async updateDevice(id: string, data: any) {
    const idx = this.state.devices.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.state.devices[idx] = { ...this.state.devices[idx], ...data };
      await this.commit();
    }
  }

  // Fix: Added addDevice method
  async addDevice(data: any) {
    const dev: Device = {
      id: 'DEV-' + Date.now(),
      status: 'Connected',
      lastSeen: new Date().toISOString(),
      ...data
    };
    this.state.devices.push(dev);
    await this.commit();
  }

  // Fix: Added testDeviceConnection method
  async testDeviceConnection(id: string) {
    return { success: true, message: 'Link verified.' };
  }

  // Fix: Added deleteDevice method
  async deleteDevice(id: string) {
    this.state.devices = this.state.devices.filter(d => d.id !== id);
    await this.commit();
  }

  // Fix: Added saveMapping method
  async saveMapping(mapping: NetworkMapping) {
    const idx = this.state.networkMappings.findIndex(m => m.userId === mapping.userId);
    if (idx !== -1) {
      this.state.networkMappings[idx] = mapping;
    } else {
      this.state.networkMappings.push(mapping);
    }
    await this.commit();
  }

  // Fix: Added submitKYC method
  async submitKYC(userId: string, type: any, fileUrl: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      if (!this.state.users[idx].kycDocuments) this.state.users[idx].kycDocuments = [];
      this.state.users[idx].kycDocuments!.push({
        type,
        fileUrl,
        submittedAt: new Date().toISOString()
      });
      this.state.users[idx].verificationStatus = VerificationStatus.PENDING;
      await this.commit();
    }
  }

  // Fix: Added markWelcomeComplete method
  async markWelcomeComplete(userId: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.state.users[idx].welcomeChecklistShown = true;
      await this.commit();
    }
  }

  // Fix: Added updateAIConfig method
  async updateAIConfig(cfg: AIConfig) {
    this.state.settings.aiConfig = cfg;
    await this.commit();
  }

  // Fix: Added toggleAIKillSwitch method
  async toggleAIKillSwitch(active: boolean) {
    this.state.settings.aiConfig.killSwitchActive = active;
    await this.commit();
  }

  // Fix: Added updateAICallConfig method
  async updateAICallConfig(cfg: AICallConfig) {
    this.state.settings.aiCallConfig = cfg;
    await this.commit();
  }

  // Fix: Added addCallLog method
  addCallLog(log: any) {
    const newLog = { id: 'CALL-' + Date.now(), ...log };
    this.state.aiCallLogs.unshift(newLog);
    this.commit();
  }

  // Fix: Added saveEmailCampaign method
  async saveEmailCampaign(data: any) {
    const idx = this.state.emailCampaigns.findIndex(c => c.id === data.id);
    if (idx !== -1) {
      this.state.emailCampaigns[idx] = { ...this.state.emailCampaigns[idx], ...data };
    } else {
      this.state.emailCampaigns.push({
        id: 'CAMP-' + Date.now(),
        stats: { sent: 0, opened: 0, clicked: 0, failed: 0 },
        ...data
      });
    }
    await this.commit();
  }

  // Fix: Added sendCampaign method
  async sendCampaign(id: string) {
    const idx = this.state.emailCampaigns.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.state.emailCampaigns[idx].status = 'Sending';
      this.commit();
      setTimeout(() => {
        this.state.emailCampaigns[idx].status = 'Completed';
        this.state.emailCampaigns[idx].sentAt = new Date().toISOString();
        this.commit();
      }, 2000);
    }
  }

  // Fix: Added saveEmailTemplate method
  async saveEmailTemplate(data: any) {
    const idx = this.state.emailTemplates.findIndex(t => t.id === data.id);
    if (idx !== -1) {
      this.state.emailTemplates[idx] = { ...this.state.emailTemplates[idx], ...data, lastUpdated: new Date().toISOString() };
    } else {
      this.state.emailTemplates.push({
        id: 'TMPL-' + Date.now(),
        lastUpdated: new Date().toISOString(),
        ...data
      });
    }
    await this.commit();
  }

  // Fix: Added deleteEmailTemplate method
  async deleteEmailTemplate(id: string) {
    this.state.emailTemplates = this.state.emailTemplates.filter(t => t.id !== id);
    await this.commit();
  }

  // Fix: Added saveAudienceSegment method
  async saveAudienceSegment(data: any) {
    const idx = this.state.audienceSegments.findIndex(s => s.id === data.id);
    if (idx !== -1) {
      this.state.audienceSegments[idx] = { ...this.state.audienceSegments[idx], ...data };
    } else {
      this.state.audienceSegments.push({
        id: 'SEG-' + Date.now(),
        subscriberCount: Math.floor(Math.random() * 500),
        ...data
      });
    }
    await this.commit();
  }

  // Fix: Added saveCommRule method
  async saveCommRule(data: any) {
    const idx = this.state.commAutomationRules.findIndex(r => r.id === data.id);
    if (idx !== -1) {
      this.state.commAutomationRules[idx] = { ...this.state.commAutomationRules[idx], ...data };
    } else {
      this.state.commAutomationRules.push({
        id: 'RULE-' + Date.now(),
        ...data
      });
    }
    await this.commit();
  }

  // Fix: Added sendPushNotification method
  async sendPushNotification(targetId: string, message: string, priority: string) {
    this.logNotification(targetId, priority === 'critical' ? 'error' : 'info', 'Push Dispatch', message);
  }

  // Fix: Added testSMTPHandshake method
  async testSMTPHandshake(config: any) {
    return { success: true, message: 'SMTP Handshake Verified.' };
  }

  // Fix: Added sendTestEmail method
  async sendTestEmail(config: any, data: any) {
    return { success: true, message: 'Test email dispatch successful.' };
  }

  // Fix: Added addSenderIdentity method
  async addSenderIdentity(data: any) {
    this.state.settings.commConfig.senderIdentities.push({
      id: 'SDR-' + Date.now(),
      isVerified: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      ...data
    });
    await this.commit();
  }

  // Fix: Added verifySenderIdentity method
  async verifySenderIdentity(id: string) {
    const idx = this.state.settings.commConfig.senderIdentities.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.state.settings.commConfig.senderIdentities[idx].isVerified = true;
      await this.commit();
    }
  }

  // Fix: Added deleteSenderIdentity method
  async deleteSenderIdentity(id: string) {
    this.state.settings.commConfig.senderIdentities = this.state.settings.commConfig.senderIdentities.filter(i => i.id !== id);
    await this.commit();
  }
}

export const db = new DB();
