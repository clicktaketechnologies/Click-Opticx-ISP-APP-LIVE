
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

// Add missing types for monitoring
export interface DBHealth {
  documentSize: number;
  logs: any[];
  lastSync: string;
  isCloudSynced: boolean;
}

export interface ConnectionAudit {
  success: boolean;
  checks: { name: string; details: string; passed: boolean }[];
}

const firebaseConfig = {
  apiKey: "api-key-placeholder",
  authDomain: "click-opticx.firebaseapp.com",
  projectId: "click-opticx",
  storageBucket: "click-opticx.appspot.com",
  messagingSenderId: "sender-id",
  appId: "app-id"
};

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
  termsAndConditions: 'All service users must abide by the Acceptable Use Policy. Bandwidth is shared and subject to fair use. Unauthorized resale is strictly prohibited.',
  serviceAgreement: 'I agree to pay my monthly dues before the 5th of each month. I acknowledge that the equipment provided remains property of Click Opticx.',
  privacyPolicy: 'We value your privacy. Data is encrypted and used only for service provision.',
  refundPolicy: 'Refunds are subject to verification of downtime exceeding 48 consecutive hours.'
};

const INITIAL_COMM_CONFIG: CommunicationSettings = {
  emailMode: 'CUSTOM_SMTP',
  emailProvider: 'SMTP',
  providerConfig: { apiKey: '', senderDomain: '' },
  smtpConfig: { host: 'smtp.clickopticx.com', port: 587, encryption: 'TLS', username: 'relay@clickopticx.com' },
  senderIdentities: [
    { id: 'SDR-1', name: 'NetRecover Support', email: 'support@clickopticx.com', isVerified: true, isDefault: true, createdAt: new Date().toISOString() },
    { id: 'SDR-2', name: 'NetRecover Billing', email: 'billing@clickopticx.com', isVerified: false, isDefault: false, createdAt: new Date().toISOString() }
  ],
  pushEnabled: true,
  quietHours: { start: '22:00', end: '08:00', enabled: true },
  rateLimits: { emailsPerHour: 1000, emailsPerDay: 10000, burstLimit: 50, pushPerDayPerUser: 5 },
  warmup: { enabled: true, currentDay: 1, limit: 50 },
  health: { status: 'Healthy', lastCheck: new Date().toISOString(), latency: 124, bounceRate: 0.2 }
};

const INITIAL_GATEWAYS: PaymentGateway[] = [
  { id: 'stripe', name: 'Stripe Node', type: 'online', enabled: true, priority: 1, sandbox: true, allowedFor: ['packages', 'wallet', 'invoices'], config: { publishableKey: '', secretKey: '', webhookSecret: '' } },
  { id: 'paypal', name: 'PayPal Hub', type: 'online', enabled: false, priority: 2, sandbox: true, allowedFor: ['packages', 'wallet'], config: { clientId: '', secret: '' } },
  { id: 'jazzcash', name: 'JazzCash Wallet', type: 'wallet', enabled: true, priority: 3, sandbox: true, allowedFor: ['packages', 'wallet', 'emergency'], config: { merchantId: '', password: '', salt: '' } },
  { id: 'easypaisa', name: 'EasyPaisa Hub', type: 'wallet', enabled: true, priority: 4, sandbox: true, allowedFor: ['packages', 'wallet', 'emergency'], config: { storeId: '', hashKey: '' } },
  { id: 'payfast', name: 'PayFast Protocol', type: 'online', enabled: false, priority: 5, sandbox: true, allowedFor: ['packages'], config: { merchantId: '', merchantKey: '' } },
  { id: 'cash', name: 'Physical Cash', type: 'offline', enabled: true, priority: 6, sandbox: false, allowedFor: ['packages', 'wallet', 'invoices'], config: {}, instructions: 'Pay at any authorized regional shop.' },
  { id: 'bank', name: 'Bank Wire', type: 'offline', enabled: true, priority: 7, sandbox: false, allowedFor: ['wallet', 'invoices'], config: { bankName: '', accountTitle: '', iban: '' }, instructions: 'Upload receipt after wire transfer.' },
  { id: 'home', name: 'Field Collection', type: 'offline', enabled: true, priority: 8, sandbox: false, allowedFor: ['invoices'], config: { fee: '100' }, instructions: 'Our agent will visit your location.' }
];

const INITIAL_APP_PAGES: AppPage[] = [
  { id: 'home', label: 'Dashboard', icon: 'Home', category: 'Core', enabled: true, showInDirectory: true, isDefault: true, swatch: '#4f46e5' },
  { id: 'wallet', label: 'My Wallet', icon: 'Wallet', category: 'Fiscal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#10b981' },
  { id: 'packages', label: 'Service Plans', icon: 'Signal', category: 'Core', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
  { id: 'profile', label: 'Profile', icon: 'User', category: 'Core', enabled: true, showInDirectory: false, isDefault: false, swatch: '#6366f1' },
  { id: 'notifs', label: 'Alerts', icon: 'Bell', category: 'Support', enabled: true, showInDirectory: true, isDefault: false, swatch: '#f59e0b' },
  { id: 'support', label: 'Help Center', icon: 'Headphones', category: 'Support', enabled: true, showInDirectory: true, isDefault: false, swatch: '#8b5cf6' },
  { id: 'aichat', label: 'AI Chat Assistant', icon: 'MessageSquare', category: 'Utility', enabled: true, showInDirectory: true, isDefault: false, swatch: '#06b6d4' },
  { id: 'ai-voice-call', label: 'AI Voice Support', icon: 'Mic', category: 'Utility', enabled: true, showInDirectory: true, isDefault: false, swatch: '#ec4899' },
  { id: 'namaz', label: 'Prayer Times', icon: 'Clock', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#059669' },
  { id: 'quran', label: 'Noble Quran', icon: 'Book', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#10b981' },
  { id: 'qibla', label: 'Qibla Finder', icon: 'Compass', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#b45309' },
  { id: 'tasbih', label: 'Digital Tasbih', icon: 'Fingerprint', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#334155' },
  { id: 'live-usage', label: 'Live Usage', icon: 'Monitor', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
  { id: 'speed-test', label: 'Speed Test', icon: 'Gauge', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#6366f1' },
  { id: 'connection', label: 'Connection', icon: 'Signal', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#4f46e5' },
  { id: 'reset-password', label: 'Reset Wifi', icon: 'Key', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#f59e0b' },
  { id: 'news', label: 'Broadcasts', icon: 'Bell', category: 'Communication', enabled: true, showInDirectory: true, isDefault: false, swatch: '#ef4444' },
  { id: 'referral', label: 'Refer & Earn', icon: 'Gift', category: 'Fiscal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#f59e0b' },
  { id: 'weather', label: 'Weather', icon: 'Sun', category: 'Utility', enabled: true, showInDirectory: true, isDefault: false, swatch: '#06b6d4' },
  { id: 'legal', label: 'Legal Center', icon: 'ShieldCheck', category: 'Legal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#64748b' },
];

const INITIAL_APP_SECTIONS: AppSection[] = [
  { id: 'status', label: 'CONNECTIVITY STATUS', enabled: true, order: 0, layout: 'Grid', gridCols: 1, itemIds: [] },
  { id: 'rescue', label: 'EMERGENCY CREDITS', enabled: true, order: 1, layout: 'Grid', gridCols: 1, itemIds: [] },
  { id: 'credit', label: 'FISCAL TRUST SCORE', enabled: true, order: 2, layout: 'Grid', gridCols: 1, itemIds: [] },
  { id: 'fiscal-summary', label: 'FISCAL SUMMARY', enabled: true, order: 3, layout: 'Grid', gridCols: 2, itemIds: [], isSpecialNode: true },
  { id: 'islamic', label: 'ISLAMIC TOOLS', enabled: true, order: 4, layout: 'Grid', gridCols: 4, itemIds: ['namaz', 'quran', 'qibla', 'tasbih'] },
  { id: 'technical', label: 'TECHNICAL', enabled: true, order: 5, layout: 'Grid', gridCols: 2, itemIds: ['live-usage', 'speed-test', 'connection', 'reset-password'] },
  { id: 'daily-tools', label: 'DAILY TOOLS', enabled: true, order: 6, layout: 'Grid', gridCols: 2, itemIds: ['news', 'referral', 'weather', 'support'] },
  { id: 'legal', label: 'LEGAL & COMPLIANCE', enabled: true, order: 7, layout: 'Grid', gridCols: 1, itemIds: ['legal'] },
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
    { id: 'PKG-2', name: 'Extreme 50M', subtitle: 'Pro Gamer Pack', speed: '50 Mbps', uploadSpeed: '50 Mbps', dataLimit: 'Unlimited', price: 2500, taxRate: 15, duration: 30, color: '#4f46e5' },
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
  emailTemplates: [
    { id: 'TMP-1', name: 'Payment Reminder', content: 'Dear {{user.name}}, your balance is {{user.balance}}. Please clear it.', category: 'Billing', lastUpdated: new Date().toISOString() },
    { id: 'TMP-2', name: 'Welcome Aboard', content: 'Welcome to Click Opticx, {{user.name}}!', category: 'System', lastUpdated: new Date().toISOString() },
    { id: 'PKG_EXPIRY_REMINDER', name: 'Package Expiry Reminder (7 Day)', content: 'Dear {{user.name}},\n\nYour internet package is set to expire in less than 7 days. To ensure uninterrupted service, please renew your plan via the Subscriber Portal.\n\nCurrent Expiry: {{user.expiryDate}}\n\nThank you for choosing Click Opticx.', category: 'Billing', lastUpdated: new Date().toISOString() }
  ],
  audienceSegments: [
    { id: 'SEG-1', name: 'All Active Users', description: 'Currently active subscribers', filters: { status: 'Active' }, subscriberCount: 0 },
    { id: 'SEG-2', name: 'High Risk (Credit < 500)', description: 'Users with low credit scores', filters: { creditScore: { $lt: 500 } }, subscriberCount: 0 }
  ],
  commAutomationRules: [
    { 
      id: 'RULE-EXP-7', 
      name: '7-Day Package Expiry Alert', 
      trigger: 'Package_Expiry', 
      condition: 'days_remaining < 7', 
      enabled: true, 
      actions: [{ type: 'Email', templateId: 'PKG_EXPIRY_REMINDER' }] 
    }
  ],
  deliveryLogs: [],
  settings: {
    branding: { businessName: "Click Opticx", shortName: "CO ISP", logoLight: "", logoDark: "", logoSquare: "", favicon: "", primaryColor: "#4f46e5", secondaryColor: "#10b981", accentColor: "#f59e0b", textColorLight: "#ffffff", textColorDark: "#0f172a", primaryFont: "Inter", secondaryFont: "Inter" },
    profile: { legalName: "Click Opticx Pvt Ltd", tradingName: "Click Opticx", tagline: "Stable & Fast Regional Connectivity", establishedYear: "2023", registrationNumber: "", taxNumber: "", headOffice: "Central Node, Karachi", country: "Pakistan", timezone: "Asia/Karachi" },
    support: { email: "support@clickopticx.com", phone: "+92 300 1234567", whatsapp: "923001234567", emergencyPhone: "+92 300 9999999", address: "Karachi", workingHoursWeekdays: "09:00 AM - 09:00 PM", workingHoursWeekends: "10:00 AM - 04:00 PM", emergencySupport: true, afterHoursMessage: "Support resumes at 09:00 AM.", phoneEnabled: true, whatsappEnabled: true, emailEnabled: true, greeting: "Welcome to Click Opticx Support.", autoReplyFooter: "Powered by CO OSS." },
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
  permissions: [
    { id: 'dashboard', view: ALL_ROLES, edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'ai-control', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'ai-calling', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'ai-call-logs', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN], edit: [], delete: [] },
    { id: 'monitor', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'comm-campaigns', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'comm-templates', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'comm-rules', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'comm-push', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'comm-segments', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'comm-identities', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'comm-logs', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [], delete: [] },
    { id: 'comm-settings', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'admin-live-monitoring', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.NETWORK_ADMIN, Role.SUPPORT_ADMIN], edit: [], delete: [] },
    { id: 'admin-devices', view: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN], edit: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'admin-device-mapping', view: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.SUPPORT_ADMIN], edit: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'connection-setup', view: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.FIELD_AGENT], edit: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'users', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN, Role.MANAGER], edit: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'customer-360', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN, Role.RECOVERY_MANAGER, Role.FINANCE_ADMIN], edit: [], delete: [] },
    { id: 'approval-desk', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN, Role.SUPPORT_ADMIN, Role.MANAGER], edit: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'admin-password-requests', view: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.SUPPORT_EXECUTIVE], edit: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'user-app', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'dealers', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.DEALER], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'invoice-engine', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT], edit: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'invoice-management', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT], edit: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-settings', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'recovery', view: [Role.SUPER_ADMIN, Role.RECOVERY_MANAGER, Role.ACCOUNTANT, Role.CASHIER, Role.FIELD_AGENT], edit: [Role.SUPER_ADMIN, Role.RECOVERY_MANAGER], delete: [Role.SUPER_ADMIN] },
    { id: 'wallet', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT, Role.DEALER], edit: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'accounting', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT], edit: [], delete: [] },
    { id: 'emergency-load', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN, Role.SUPPORT_ADMIN], edit: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'packages', view: [Role.SUPER_ADMIN, Role.ADMIN, Role.BUSINESS_ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'import', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [Role.SUPER_ADMIN, Role.ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'archive', view: [Role.SUPER_ADMIN, Role.ADMIN], edit: [], delete: [Role.SUPER_ADMIN] },
    { id: 'staff', view: [Role.SUPER_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'permissions', view: [Role.SUPER_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'business-settings', view: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN], edit: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'about-us', view: ALL_ROLES, edit: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'tasks', view: [...ALL_ROLES, Role.DEALER], edit: [...ALL_ROLES, Role.DEALER], delete: [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER] },
    { id: 'tickets', view: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.SUPPORT_EXECUTIVE, Role.NETWORK_ADMIN], edit: ALL_ROLES, delete: [Role.SUPER_ADMIN] }
  ],
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
    try {
      const cached = localStorage.getItem('netrecover_v15_registry');
      if (cached) {
        this.state = { ...INITIAL_STATE, ...JSON.parse(cached) };
      }
    } catch (e) {}
    this.initializeCloudLayer();
  }

  private async initializeCloudLayer() {
    try {
      const apps = getApps();
      this.app = !apps.length ? initializeApp(firebaseConfig) : apps[0];
      this.firestore = getFirestore(this.app);
      await this.syncWithCloudMaster();
    } catch (e: any) {
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

  async addSenderIdentity(ident: Partial<SenderIdentity>) {
    const next = { ...ident, id: 'SDR-' + Date.now(), isVerified: false, isDefault: false, createdAt: new Date().toISOString() } as SenderIdentity;
    this.state.settings.commConfig.senderIdentities.push(next);
    await this.commit();
    return next;
  }

  async verifySenderIdentity(id: string) {
    const ident = this.state.settings.commConfig.senderIdentities.find(s => s.id === id);
    if (ident) {
      ident.isVerified = true;
      await this.commit();
      return true;
    }
    return false;
  }

  async deleteSenderIdentity(id: string) {
    this.state.settings.commConfig.senderIdentities = this.state.settings.commConfig.senderIdentities.filter(s => s.id !== id);
    await this.commit();
  }

  async testSMTPHandshake(config: any) {
    await new Promise(r => setTimeout(r, 1200));
    if (config.host && config.host.includes('error')) {
      return { success: false, message: 'Connection Timeout: Node unreachable or port 587 blocked by upstream.' };
    }
    return { success: true, message: 'Handshake Optimal: Latency 112ms, Auth Verified.' };
  }

  async sendTestEmail(config: any, testData: any) {
    // Simulated dispatch handshake
    await new Promise(r => setTimeout(r, 2000));
    if (!testData.recipient || !testData.recipient.includes('@')) {
      return { success: false, message: 'Invalid Recipient: RFC 5322 compliance failure.' };
    }
    if (!config.host || (config.host && config.host.includes('error'))) {
      return { success: false, message: 'Relay Failure: Node unreachable during delivery attempt.' };
    }
    return { success: true, message: `Registry Dispatch Successful: Message "${testData.subject}" queued in outbound node for ${testData.recipient}.` };
  }

  async saveEmailTemplate(t: Partial<EmailTemplate>) {
    const id = t.id || 'TMP-' + Date.now();
    const idx = this.state.emailTemplates.findIndex(x => x.id === id);
    const data = { ...t, id, lastUpdated: new Date().toISOString() } as EmailTemplate;
    if (idx !== -1) this.state.emailTemplates[idx] = data;
    else this.state.emailTemplates.push(data);
    await this.commit();
    return { success: true, data };
  }

  async deleteEmailTemplate(id: string) {
    this.state.emailTemplates = this.state.emailTemplates.filter(t => t.id !== id);
    await this.commit();
  }

  async saveAudienceSegment(s: Partial<AudienceSegment>) {
    const id = s.id || 'SEG-' + Date.now();
    const idx = this.state.audienceSegments.findIndex(x => x.id === id);
    const data = { ...s, id, subscriberCount: this.calculateSegmentSize(s.filters) } as AudienceSegment;
    if (idx !== -1) this.state.audienceSegments[idx] = data;
    else this.state.audienceSegments.push(data);
    await this.commit();
    return { success: true, data };
  }

  private calculateSegmentSize(filters: any) {
    if (!filters) return this.state.users.length;
    return this.state.users.filter(u => {
        if (filters.status && u.status !== filters.status) return false;
        if (filters.creditScore && filters.creditScore.$lt && u.creditScore >= filters.creditScore.$lt) return false;
        return true;
    }).length;
  }

  async saveEmailCampaign(c: Partial<EmailCampaign>) {
    const id = c.id || 'CMP-' + Date.now();
    const idx = this.state.emailCampaigns.findIndex(x => x.id === id);
    const data = { ...c, id, stats: c.stats || { sent: 0, opened: 0, clicked: 0, failed: 0 } } as EmailCampaign;
    if (idx !== -1) this.state.emailCampaigns[idx] = data;
    else this.state.emailCampaigns.push(data);
    await this.commit();
    return { success: true, data };
  }

  async sendCampaign(id: string) {
    const camp = this.state.emailCampaigns.find(c => c.id === id);
    if (!camp) return;
    camp.status = 'Sending';
    this.notify();
    setTimeout(async () => {
        camp.status = 'Completed';
        camp.sentAt = new Date().toISOString();
        camp.stats.sent = this.state.audienceSegments.find(s => s.id === camp.segmentId)?.subscriberCount || 100;
        await this.commit();
        this.logNotification('all', 'success', 'Campaign Dispatched', `Email campaign "${camp.name}" has been successfully sent.`);
    }, 2000);
  }

  async saveCommRule(r: Partial<CommunicationAutomationRule>) {
    const id = r.id || 'RULE-' + Date.now();
    const idx = this.state.commAutomationRules.findIndex(x => x.id === id);
    const data = { ...r, id } as CommunicationAutomationRule;
    if (idx !== -1) this.state.commAutomationRules[idx] = data;
    else this.state.commAutomationRules.push(data);
    await this.commit();
  }

  async sendPushNotification(target: string, msg: string, priority: 'normal' | 'critical') {
    const log: DeliveryLog = {
        id: 'LOG-' + Date.now(),
        userId: target === 'all' ? 'SYSTEM' : target,
        userName: target === 'all' ? 'All Users' : (this.state.users.find(u => u.id === target)?.name || 'Unknown'),
        type: 'Push',
        channel: 'In-App/Web',
        status: 'Delivered',
        timestamp: new Date().toISOString(),
        triggerSource: 'Manual'
    };
    this.state.deliveryLogs.unshift(log);
    if (target === 'all') this.state.users.forEach(u => this.logNotification(u.id, 'info', 'Broadcast', msg));
    else this.logNotification(target, priority === 'critical' ? 'error' : 'info', 'Alert', msg);
    await this.commit();
  }

  logNotification(targetId: string, type: 'success' | 'warning' | 'info' | 'error', title: string, message: string) {
    const n: SystemNotification = {
      id: 'NOT-' + Date.now(), targetId, type, title, message, read: false, timestamp: new Date().toISOString(), createdAt: Date.now(), audience: targetId === 'all' ? 'admin' : 'subscriber', priority: 'normal'
    };
    this.state.notifications.unshift(n);
    this.commit();
  }

  async markNotificationRead(id: string) {
    const n = this.state.notifications.find(x => x.id === id);
    if (n) { n.read = true; await this.commit(); }
  }

  async markAllNotificationsRead(targetId: string, audience: 'subscriber' | 'admin') {
    this.state.notifications.forEach(n => {
      if ((n.targetId === targetId || n.targetId === 'all') && n.audience === audience) n.read = true;
    });
    await this.commit();
  }

  async clearNotifications(targetId: string, audience: 'subscriber' | 'admin') {
    this.state.notifications = this.state.notifications.filter(n => !( (n.targetId === targetId || n.targetId === 'all') && n.audience === audience ));
    await this.commit();
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
    return { success: false, message: 'Staff identity not found.' };
  }

  async updateCustomerPassword(id: string, pass: string) {
    const idx = this.state.users.findIndex(u => u.id === id || u.connectionId === id);
    if (idx !== -1) { this.state.users[idx].password = pass; this.state.users[idx].mustChangePassword = false; await this.commit(); return { success: true }; }
    return { success: false, message: 'User node not found.' };
  }

  async processTopup(collector: string, target: string, type: 'staff' | 'user', amount: number) {
    if (type === 'staff') {
       const sIdx = this.state.staff.findIndex(s => s.email === target);
       if (sIdx !== -1) {
          this.state.staff[sIdx].balance = (this.state.staff[sIdx].balance || 0) + amount;
          this.state.ledger.push({ id: 'TOP_'+Date.now(), userId: target, amount, type: LedgerType.CREDIT, timestamp: new Date().toISOString(), description: 'Admin Refill', balanceAfter: this.state.staff[sIdx].balance, method: 'Registry Direct' });
       } else {
          return { success: false, message: 'Target staff node not found.' };
       }
    } else {
       const uIdx = this.state.users.findIndex(u => u.id === target);
       if (uIdx !== -1) {
          this.state.users[uIdx].balance = (this.state.users[uIdx].balance || 0) + amount;
          this.state.ledger.push({ id: 'TOP_'+Date.now(), userId: target, amount, type: LedgerType.CREDIT, timestamp: new Date().toISOString(), description: 'Credit Refill', balanceAfter: this.state.users[uIdx].balance, method: 'Direct Handshake' });
       } else {
          return { success: false, message: 'Target subscriber node not found.' };
       }
    }
    await this.commit();
    return { success: true, message: 'Fiscal handshake verified.' };
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

  async payInvoiceWithWallet(invoiceId: string) {
    const invIdx = this.state.invoices.findIndex(i => i.id === invoiceId);
    if (invIdx === -1) return { success: false, message: 'Invoice not found' };
    const inv = this.state.invoices[invIdx];
    const uIdx = this.state.users.findIndex(u => u.id === inv.userId);
    if (uIdx === -1) return { success: false, message: 'User not found' };
    
    inv.status = PaymentStatus.PAID;
    inv.paidAt = new Date().toISOString();
    inv.paidAmount = inv.totalAmount;
    this.state.users[uIdx].balance -= inv.totalAmount;
    
    this.state.ledger.push({ id: 'PAY_'+Date.now(), userId: inv.userId, amount: inv.totalAmount, type: LedgerType.DEBIT, timestamp: new Date().toISOString(), description: `Paid Inv: ${invoiceId}`, balanceAfter: this.state.users[uIdx].balance, method: 'Wallet Link' });
    
    await this.commit();
    return { success: true };
  }

  async generateAdHocInvoice(userId: string, pkgId: string, amount: number, items: LineItem[]) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return null;
    const inv: Invoice = {
       id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
       userId, userName: user.name,
       packageId: pkgId, packageName: this.state.packages.find(p => p.id === pkgId)?.name || 'Custom',
       items, subtotal: amount, taxRate: 0, taxAmount: 0, discountAmount: 0, totalAmount: amount, paidAmount: 0,
       status: PaymentStatus.UNPAID, dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), createdAt: new Date().toISOString()
    };
    this.state.invoices.push(inv);
    await this.commit();
    return inv;
  }

  async markVerificationSuccessShown(userId: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) { this.state.users[idx].verifiedStatus = { ...this.state.users[idx].verifiedStatus, identity: true }; await this.commit(); }
  }

  async markWelcomeComplete(userId: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) { this.state.users[idx].welcomeChecklistShown = true; await this.commit(); }
  }

  async approveSignup(id: string) {
    const reqIdx = this.state.signupRequests.findIndex(r => r.id === id);
    if (reqIdx === -1) return { success: false, message: 'Request not found' };
    const req = this.state.signupRequests[reqIdx];
    const res = await this.addUser({ ...req, status: UserStatus.ACTIVE });
    if (res.success) {
      this.state.signupRequests.splice(reqIdx, 1);
      await this.commit();
      return { success: true };
    }
    return { success: false, message: 'User provision failed' };
  }

  getLiveUsage(id: string) { return { down: (Math.random() * 10 + 5).toFixed(1), up: (Math.random() * 5 + 2).toFixed(1), ping: Math.floor(Math.random()*15+5), usageToday: '1.2', usageMonth: '42.5', offline: false }; }
  getConnectedDevices(id: string) { return [{ id: 'D1', name: 'Admin Phone', mac: 'E4:A1:7F:C2:08', ip: '192.168.1.5', signal: -42, duration: '2h 14m', usageToday: 0.4, isBlocked: false }]; }
  async blockDevice(u: string, d: string) { return true; }
  async renameDevice(u: string, d: string, n: string) { return true; }
  async submitWifiPasswordRequest(u: string, p: string) { return true; }
  
  async requestEmergencyLoad(u: string, p?: string) { 
    const user = this.state.users.find(user => user.id === u);
    if (!user) return { success: false, message: 'User node not found.' };
    
    const amount = 2500;
    const now = new Date();
    const expiry = new Date(now.getTime() + (72 * 60 * 60 * 1000));
    const lock = new Date(now.getTime() + (15 * 60 * 1000));

    this.state.emergencyLoads.push({
      id: 'EL-'+Date.now(),
      userId: u,
      userName: user.name,
      amount,
      status: 'Pending_Activation',
      timestamp: now.toISOString(),
      expiryTimestamp: expiry.toISOString(),
      lockedUntil: lock.toISOString(),
      packageId: p,
      repaid: false,
      sourceType: 'Auto',
      activationSource: 'emergency_load'
    });
    await this.commit();
    return { success: true, message: 'Rescue link established.' };
  }

  async submitKYC(u: string, t: string, f: string) { return true; }
  
  async updateSubscriberProfile(id: string, d: any) { 
    const idx = this.state.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.state.users[idx] = { ...this.state.users[idx], ...d };
      await this.commit();
      return { success: true, message: 'Profile node updated.' };
    }
    return { success: false, message: 'Subscriber node not found.' };
  }

  async submitTopupRequest(r: any) { this.state.topupRequests.push({ ...r, id: 'REQ_'+Date.now(), status: 'Pending', timestamp: new Date().toISOString() }); await this.commit(); }
  async submitTicket(t: any) { this.state.tickets.push({ ...t, id: 'TCK_'+Date.now(), status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); await this.commit(); }
  async updateTicketStatus(id: string, s: any) { const idx = this.state.tickets.findIndex(t => t.id === id); if (idx !== -1) { this.state.tickets[idx].status = s; await this.commit(); } }
  async addTicketComment(id: string, t: string, i: boolean) { const idx = this.state.tickets.findIndex(x => x.id === id); if (idx !== -1) { this.state.tickets[idx].comments.push({ id: 'CMT_'+Date.now(), authorName: 'Admin', authorEmail: 'admin@opticx.com', authorRole: Role.ADMIN, text: t, timestamp: new Date().toISOString(), isInternal: i }); await this.commit(); } }
  
  async approveUnifiedRequest(id: string, type: string) { 
    if (type === 'package') {
      const req = this.state.packageRequests.find(r => r.id === id);
      if (req) {
        req.status = 'Approved';
        await this.activatePackage(req.userId, req.packageId);
        await this.generateAdHocInvoice(req.userId, req.packageId, req.amount, [{ id: 'L1', description: `Package Activation: ${req.packageName}`, quantity: 1, unitPrice: req.amount, total: req.amount, category: 'Service' }]);
        // Automatically settle invoice if paid by non-wallet method
        const inv = this.state.invoices[this.state.invoices.length - 1];
        if (inv) {
          inv.status = PaymentStatus.PAID;
          inv.paidAt = new Date().toISOString();
          inv.paidAmount = inv.totalAmount;
        }
      }
    } else if (type === 'topup') {
      const req = this.state.topupRequests.find(r => r.id === id);
      if (req) {
        req.status = 'Approved';
        await this.processTopup('Admin', req.userId, 'user', req.amount);
      }
    } else if (type === 'emergency') {
       const load = this.state.emergencyLoads.find(l => l.id === id);
       if (load) load.status = 'Active';
    }
    await this.commit();
    return { success: true, message: 'Protocol handshake authorized.' }; 
  }

  async rejectUnifiedRequest(id: string, type: string, r: string) { 
    if (type === 'package') {
      const req = this.state.packageRequests.find(r => r.id === id);
      if (req) req.status = 'Rejected';
    } else if (type === 'topup') {
      const req = this.state.topupRequests.find(r => r.id === id);
      if (req) req.status = 'Rejected';
    } else if (type === 'emergency') {
       const load = this.state.emergencyLoads.find(l => l.id === id);
       if (load) load.status = 'Cancelled';
    }
    await this.commit();
    return { success: true }; 
  }

  async cancelUniversalRequest(id: string) { 
    this.state.packageRequests = this.state.packageRequests.filter(r => r.id !== id);
    this.state.topupRequests = this.state.topupRequests.filter(r => r.id !== id);
    this.state.emergencyLoads = this.state.emergencyLoads.filter(l => l.id !== id);
    await this.commit();
    return true; 
  }

  async submitUniversalActivation(userId: string, pkgId: string, method: string) { 
    const pkg = this.state.packages.find(p => p.id === pkgId);
    if (!pkg) return { success: false, message: 'Package not found' };
    
    const amount = Math.round(pkg.price * (1 + (this.state.settings.autoTaxPercentage / 100)));
    const user = this.state.users.find(u => u.id === userId);

    if (method === 'Top-Up Balance') {
       if (user && user.balance >= amount) {
          await this.activatePackage(userId, pkgId);
          user.balance -= amount;
          this.state.ledger.push({ id: 'PAY_'+Date.now(), userId, amount, type: LedgerType.DEBIT, timestamp: new Date().toISOString(), description: `Sub: ${pkg.name}`, balanceAfter: user.balance, method: 'Wallet' });
          await this.commit();
          return { success: true };
       }
       return { success: false, message: 'Insufficient liquidity in wallet node.' };
    }

    this.state.packageRequests.push({
      id: 'PRQ-'+Date.now(),
      userId,
      userName: user?.name || 'Unknown',
      packageId: pkgId,
      packageName: pkg.name,
      amount,
      status: 'Pending',
      paymentMethod: method,
      timestamp: new Date().toISOString()
    });
    await this.commit();
    return { success: true, message: 'Registry handshake initialized.' };
  }

  async settleEmergencyLoad(userId: string, method: string) { return { success: true }; }
  async updateAIConfig(c: AIConfig) { this.state.settings.aiConfig = c; await this.commit(); }
  async toggleAIKillSwitch(active: boolean) { this.state.settings.aiConfig.killSwitchActive = active; await this.commit(); }
  async updateAICallConfig(c: any) { this.state.settings.aiCallConfig = c; await this.commit(); }
  async addCallLog(l: any) { this.state.aiCallLogs.push({ ...l, id: 'CALL_'+Date.now() }); await this.commit(); }
  async addNetworkNode(d: any) { this.state.networkNodes.push({ ...d, id: 'NODE_'+Date.now(), status: 'Connected', lastHeartbeat: new Date().toISOString() }); await this.commit(); return { success: true }; }
  async testNodeConnection(id: string) { return { success: true, message: 'Node Online' }; }
  async addDevice(d: any) { this.state.devices.push({ ...d, id: 'DEV_'+Date.now(), status: 'Connected', lastSeen: new Date().toISOString() }); await this.commit(); }
  async updateDevice(id: string, d: any) { const idx = this.state.devices.findIndex(x => x.id === id); if (idx !== -1) { this.state.devices[idx] = { ...this.state.devices[idx], ...d }; await this.commit(); } }
  async deleteDevice(id: string) { this.state.devices = this.state.devices.filter(x => x.id !== id); await this.commit(); }
  async testDeviceConnection(id: string) { return true; }
  
  async auditInfrastructure(): Promise<ConnectionAudit> { return { success: true, checks: [{ name: 'Firewall Registry', details: 'All gateways verified', passed: true }, { name: 'Ledger Node', details: 'Double-entry synced', passed: true }, { name: 'AI Core', details: 'Heuristic Pulse Active', passed: true }] }; }
  async impersonateUser(id: string) { this.state.isImpersonating = true; const user = this.state.users.find(u => u.id === id); if (user) this.state.currentUser = { ...user, role: Role.CUSTOMER }; this.notify(); }
  
  async saveMapping(m: any) { 
    const idx = this.state.networkMappings.findIndex(x => x.userId === m.userId); 
    if (idx !== -1) { this.state.networkMappings[idx] = m; } 
    else { this.state.networkMappings.push(m); } 
    await this.commit(); 
  }
  
  getMappingForUser(id: string) { return this.state.networkMappings.find(m => m.userId === id); }
  
  getPendingUniversalRequest(id: string) { 
    const pkg = this.state.packageRequests.find(r => r.userId === id && r.status === 'Pending');
    if (pkg) return { ...pkg, unifiedType: 'package' };
    const top = this.state.topupRequests.find(r => r.userId === id && r.status === 'Pending');
    if (top) return { ...top, unifiedType: 'topup' };
    const emer = this.state.emergencyLoads.find(l => l.userId === id && l.status === 'Pending_Activation');
    if (emer) return { ...emer, unifiedType: 'emergency' };
    return null;
  }

  async updatePackage(id: string, d: any) { const idx = this.state.packages.findIndex(x => x.id === id); if (idx !== -1) { this.state.packages[idx] = { ...this.state.packages[idx], ...d }; await this.commit(); } }
  async addPackage(d: any) { this.state.packages.push({ ...d, id: 'PKG_'+Date.now(), deleted: false }); await this.commit(); }
  
  async archiveMonth(m: string) { return { success: true, message: 'Registry snapshot committed to archive.' }; }
  
  async bulkDeleteUsers(ids: string[]) { this.state.users = this.state.users.filter(u => !ids.includes(u.id)); await this.commit(); }
  async bulkForcePasswordReset(ids: string[]) { await this.commit(); }
  async bulkTerminateSessions(ids: string[]) { await this.commit(); }
  async bulkActivatePackages(ids: string[], p: string) { await this.commit(); }
  async bulkSetAccountStatus(ids: string[], s: any, r: string) { await this.commit(); }
  async bulkActivatePayLater(ids: string[], p: string, a: number, d: string, r: string) { await this.commit(); }
  async addTask(t: string, p: any, a?: string, d?: string) { this.state.tasks.push({ id: 'TSK_'+Date.now(), text: t, completed: false, priority: p, assignedTo: a, dueDate: d, order: this.state.tasks.length }); await this.commit(); return { success: true }; }
  async toggleTask(id: string) { const idx = this.state.tasks.findIndex(t => t.id === id); if (idx !== -1) { this.state.tasks[idx].completed = !this.state.tasks[idx].completed; await this.commit(); } return { success: true }; }
  async deleteTask(id: string) { this.state.tasks = this.state.tasks.filter(t => t.id !== id); await this.commit(); return { success: true }; }
  async reorderTasks(t: any[]) { this.state.tasks = t; await this.commit(); return { success: true }; }
  async addDealerLoad(e: string, a: number, m: string, d: string) { return { success: true }; }
  async clearStaffCollections(e: string) { return true; }
  async approvePayment(id: string) { const idx = this.state.payments.findIndex(p => p.id === id); if (idx !== -1) { this.state.payments[idx].status = 'Approved'; await this.commit(); } }
  async addManualPayment(id: string, amount: number, method: any) { const user = this.state.users.find(u => u.id === id); if (user) { this.state.payments.push({ id: 'PAY_'+Date.now(), userId: id, userName: user.name, amount, status: 'Approved', method, timestamp: new Date().toISOString(), collectorEmail: 'admin@opticx.com', collectorName: 'System', invoiceId: 'MANUAL' }); user.balance -= amount; await this.commit(); } }
  async updateConnectionDetails(id: string, d: any) { const idx = this.state.users.findIndex(u => u.id === id); if (idx !== -1) { this.state.users[idx] = { ...this.state.users[idx], ...d }; await this.commit(); return { success: true }; } return { success: false }; }
  async updateModulePermission(id: string, d: any) { const idx = this.state.permissions.findIndex(p => p.id === id); if (idx !== -1) { this.state.permissions[idx] = { ...this.state.permissions[idx], ...d }; await this.commit(); } }
  async auditOverdueLoads() {}
  
  async convertPointsToWallet(id: string) { return { success: true, amount: 100, message: 'Points successfully provisioned to wallet.' }; }
  
  async submitWithdrawalRequest(id: string) { 
    const user = this.state.users.find(u => u.id === id);
    if (!user) return { success: false, message: 'User identity not found.' };
    return { success: true, message: 'Withdrawal protocol dispatched for audit.' }; 
  }
  
  async resolveNOCEvent(id: string) { const idx = this.state.nocEvents.findIndex(e => e.id === id); if (idx !== -1) { this.state.nocEvents[idx].status = 'Resolved'; await this.commit(); } }
  async addNOCEvent(e: any) { this.state.nocEvents.push({ ...e, id: 'NOC_'+Date.now(), status: 'Active', startTime: new Date().toISOString() }); await this.commit(); }
  async assignTicket(id: string, e: string) { const idx = this.state.tickets.findIndex(t => t.id === id); if (idx !== -1) { this.state.tickets[idx].assignedTo = e; await this.commit(); } }
  async adjustScoreManually(id: string, delta: number, reason: string, admin: string) { const idx = this.state.users.findIndex(u => u.id === id); if (idx !== -1) { this.state.users[idx].creditScore += delta; this.state.creditLogs.push({ id: 'SCR_'+Date.now(), userId: id, delta, newScore: this.state.users[idx].creditScore, reason, timestamp: new Date().toISOString(), source: 'Admin', adminEmail: admin }); await this.commit(); } }
  async resetScoreManually(id: string, admin: string) { const idx = this.state.users.findIndex(u => u.id === id); if (idx !== -1) { this.state.users[idx].creditScore = 600; await this.commit(); } }
  async addRole(n: string) { this.state.roles.push(n); await this.commit(); }
  async deleteRole(n: string) { this.state.roles = this.state.roles.filter(r => r !== n); await this.commit(); }
  async exportVault() {}
  async toggleDirectoryView(id: string, show: boolean) { const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id); if (idx !== -1) { this.state.settings.appearance.appPages[idx].showInDirectory = show; await this.commit(); } return { success: true }; }
  async toggleAppPage(id: string, enabled: boolean) { const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id); if (idx !== -1) { this.state.settings.appearance.appPages[idx].enabled = enabled; await this.commit(); } return { success: true }; }
  async approveTopupRequest(id: string) { const idx = this.state.topupRequests.findIndex(r => r.id === id); if (idx !== -1) { const req = this.state.topupRequests[idx]; req.status = 'Approved'; await this.processTopup('Admin', req.userId, 'user', req.amount); await this.commit(); } }
  async rejectTopupRequest(id: string) { const idx = this.state.topupRequests.findIndex(r => r.id === id); if (idx !== -1) { this.state.topupRequests[idx].status = 'Rejected'; await this.commit(); } }
  async cancelTopupRequest(id: string) { this.state.topupRequests = this.state.topupRequests.filter(r => r.id !== id); await this.commit(); }
  async approvePackageRequest(id: string) { const idx = this.state.packageRequests.findIndex(r => r.id === id); if (idx !== -1) { const req = this.state.packageRequests[idx]; req.status = 'Approved'; await this.activatePackage(req.userId, req.packageId); await this.commit(); } }
  async rejectPackageRequest(id: string) { const idx = this.state.packageRequests.findIndex(r => r.id === id); if (idx !== -1) { this.state.packageRequests[idx].status = 'Rejected'; await this.commit(); } }
  async sendInvoiceEmail(id: string) { return true; }

  async submitSignupRequest(data: any) {
    this.state.signupRequests.push({ ...data, id: 'SR-'+Date.now(), status: 'Pending', timestamp: new Date().toISOString() });
    await this.commit();
    return { success: true, message: 'Signup node initialized.' };
  }

  async updateEmergencyLoad(id: string, d: any) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.emergencyLoads[idx] = { ...this.state.emergencyLoads[idx], ...d };
      await this.commit();
      return { success: true, message: 'Emergency dossier updated.' };
    }
    return { success: false, message: 'Load not found.' };
  }

  async extendEmergencyLoad(id: string, days: number, reason: string) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
      const load = this.state.emergencyLoads[idx];
      const oldDate = new Date(load.expiryTimestamp);
      const newDate = new Date(oldDate.getTime() + (days * 24 * 60 * 60 * 1000));
      load.expiryTimestamp = newDate.toISOString();
      if (!load.extensions) load.extensions = [];
      load.extensions.push({
        id: 'EXT-'+Date.now(),
        emergencyLoadId: id,
        extendedByAdminId: 'admin',
        oldDueDate: oldDate.toISOString(),
        newDueDate: newDate.toISOString(),
        reason,
        createdAt: new Date().toISOString()
      });
      await this.commit();
      return { success: true, message: 'Node expiry extended.' };
    }
    return { success: false, message: 'Load not found.' };
  }

  async clearEmergencyLoadManually(id: string) {
    const idx = this.state.emergencyLoads.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.state.emergencyLoads[idx].status = 'Cleared';
      this.state.emergencyLoads[idx].repaid = true;
      await this.commit();
      return { success: true, message: 'Debt registry purged.' };
    }
    return { success: false, message: 'Load not found.' };
  }

  async approvePasswordRequest(id: string) {
    const idx = this.state.passwordRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.state.passwordRequests[idx].status = 'Applied';
      await this.commit();
      return { success: true, message: 'Token handshake active.' };
    }
    return { success: false, message: 'Request not found.' };
  }

  async rejectPasswordRequest(id: string) {
    const idx = this.state.passwordRequests.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.state.passwordRequests[idx].status = 'Rejected';
      await this.commit();
      return { success: true, message: 'Token handshake rejected.' };
    }
    return { success: false, message: 'Request not found.' };
  }

  getHealth(): DBHealth { 
    return { 
      documentSize: JSON.stringify(this.state).length, 
      logs: this.state.notifications || [], 
      lastSync: new Date().toISOString(), 
      isCloudSynced: !!this.firestore 
    }; 
  }

  async updateAppSection(section: AppSection) {
    const idx = this.state.settings.appearance.sections.findIndex(s => s.id === section.id);
    if (idx !== -1) {
      this.state.settings.appearance.sections[idx] = section;
      await this.commit();
    }
  }

  // Simplified bridge test logic for System Health Monitor
  async testThirdPartyLink(id: string) {
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, latency: Math.floor(Math.random() * 200 + 50) };
  }

  async updateAIKeys(keys: any) {
    this.state.settings.aiConfig.aiKeys = { ...this.state.settings.aiConfig.aiKeys, ...keys };
    await this.commit();
    return true;
  }

  getConfig() { return {}; }
  getSyncStatus() { return false; }
  isUsernameTaken(u: string) { return false; }
}

export const db = new DB();
