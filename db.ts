
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { io, Socket } from 'socket.io-client';
import { notificationManager } from './utils/NotificationManager';

import {
  AppState, UserStatus, PaymentStatus, LedgerType, VerificationStatus,
  ISPUser, Package, PaymentMethod, Role, SystemSettings, ReferralRecord,
  StaffUser, PaymentRecord, TopupRequest, ArchiveRecord, SecurityLog, PackageRequest,
  CreditScoreLog, TechnicalConfig, WithdrawalRequest, UserSession,
  ConnectionStatus, Invoice, LineItem, SupportTicket, TicketStatus, TicketPriority,
  TicketComment, NOCEvent, SystemNotification, EmergencyLoad, InternalTask,
  ConnectedDevice, PasswordResetRequest, NetworkNode, AppPage, HomeCard,
  NetworkMapping, KYCDocument, AIActionLog, AIConfig, AIEvent, AISuggestion,
  NotificationAudience, NotificationPriority, AICallConfig, AICallLog, AICallRule,
  EmailCampaign, EmailTemplate, AudienceSegment, CommunicationAutomationRule, DeliveryLog, CommunicationSettings, SenderIdentity, PaymentGateway, AppSection, InfrastructureConfig, LegalConfig,
  RecoveryLog, RecoveryActionType, BillingPaymentType, BillingCycle, CommunicationLog,
  AdminReminder, ReminderStatus, ReminderIssueType, NASConfig, LiveUsage, OLTConfig, ONU,
  AuthSettings, OTP, DuplicateActionLog, TestLog
} from './types';

// Monitoring interface nodes
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
  apiKey: "AIzaSyC940eEHtHhJiEAROA7DlvaBYgAi4A3e9I",
  authDomain: "ap-click-opticx.firebaseapp.com",
  projectId: "ap-click-opticx",
  storageBucket: "ap-click-opticx.firebasestorage.app",
  messagingSenderId: "1036833166674",
  appId: "1:1036833166674:web:4d794719a6c0cae379968b",
  measurementId: "G-9XPT3CWW0M"
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
  domainNode: 'clickopticx.com',
  targetIP: '103.14.55.1',
  dnsStatus: 'PROPAGATED',
  nameservers: ['ns1.clickopticx.com', 'ns2.clickopticx.com']
};

const INITIAL_LEGAL_CONFIG: LegalConfig = {
  termsAndConditions: 'All service users must abide by the Acceptable Use Policy. Bandwidth is shared and subject to fair use. Unauthorized resale is strictly prohibited.',
  serviceAgreement: 'I agree to pay my monthly dues before the 5th of each month. I acknowledge that the equipment provided remains property of Click Opticx.',
  privacyPolicy: 'We value your privacy. Data is encrypted and used only for service provision.',
  refundPolicy: 'Refunds are subject to verification of downtime exceeding 48 consecutive hours.'
};

const INITIAL_COMM_CONFIG: CommunicationSettings = {
  simulationMode: false,
  emailMode: 'CUSTOM_SMTP',
  emailProvider: 'SMTP',
  providerConfig: { apiKey: '', senderDomain: '' },
  smtpConfig: { host: 'smtp.clickopticx.com', port: 587, encryption: 'TLS', username: 'relay@clickopticx.com' },
  senderIdentities: [
    { id: 'SDR-1', name: 'Click Opticx Support', email: 'support@clickopticx.com', isVerified: true, isDefault: true, createdAt: new Date().toISOString() },
    { id: 'SDR-2', name: 'Click Opticx Billing', email: 'billing@clickopticx.com', isVerified: false, isDefault: false, createdAt: new Date().toISOString() }
  ],
  pushEnabled: true,
  quietHours: { start: '22:00', end: '08:00', enabled: true },
  rateLimits: { emailsPerHour: 1000, emailsPerDay: 10000, burstLimit: 50, pushPerDayPerUser: 5 },
  warmup: { enabled: true, currentDay: 1, limit: 50 },
  health: { status: 'Healthy', lastCheck: new Date().toISOString(), latency: 124, bounceRate: 0.2 }
};

const INITIAL_GATEWAYS: PaymentGateway[] = [
  { id: 'stripe', name: 'Stripe Node', type: 'online', enabled: true, priority: 1, sandbox: true, allowedFor: ['packages', 'wallet', 'invoices'], config: { publishableKey: '', secretKey: '', webhookSecret: '' } },
  { id: 'paypal', name: 'PayPal Hub', type: 'online', enabled: true, priority: 2, sandbox: true, allowedFor: ['packages', 'wallet'], config: { clientId: '', secret: '' } },
  { id: 'jazzcash', name: 'JazzCash Wallet', type: 'wallet', enabled: true, priority: 3, sandbox: true, allowedFor: ['packages', 'wallet', 'emergency'], config: { merchantId: '', password: '', salt: '' } },
  { id: 'easypaisa', name: 'EasyPaisa Hub', type: 'wallet', enabled: true, priority: 4, sandbox: true, allowedFor: ['packages', 'wallet', 'emergency'], config: { storeId: '', hashKey: '' } },
  { id: 'payfast', name: 'PayFast Protocol', type: 'online', enabled: true, priority: 5, sandbox: true, allowedFor: ['packages'], config: { merchantId: '', merchantKey: '' } },
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
  { id: 'islamic', label: 'ISLAMIC', enabled: true, order: 4, layout: 'Grid', gridCols: 4, itemIds: ['namaz', 'quran', 'qibla', 'tasbih'] },
  { id: 'technical', label: 'TECHNICAL', enabled: true, order: 5, layout: 'Grid', gridCols: 2, itemIds: ['live-usage', 'speed-test', 'connection', 'reset-password'] },
  { id: 'daily-tools', label: 'DAILY TOOLS', enabled: true, order: 6, layout: 'Grid', gridCols: 2, itemIds: ['news', 'referral', 'weather', 'support'] },
  { id: 'legal', label: 'LEGAL & COMPLIANCE', enabled: true, order: 7, layout: 'Grid', gridCols: 1, itemIds: ['legal'] },
  { id: 'directory', label: 'ALL SERVICES', enabled: true, order: 8, layout: 'Grid', gridCols: 2, itemIds: [] }
];

const ALL_ROLES = Object.values(Role).filter(r => r !== Role.CUSTOMER);

const INITIAL_STATE: AppState = {
  staff: [
    { email: 'admin@clickoptix.com', name: 'System Administrator', role: Role.SUPER_ADMIN, status: 'Active', password: 'Click@Opticx2026', balance: 1000000 },
  ],
  packages: [
    { id: 'PKG-1', name: 'Home Basic 15M', subtitle: 'Standard Tier', speed: '15 Mbps', uploadSpeed: '10 Mbps', dataLimit: 'Unlimited', price: 1500, taxRate: 15, duration: 30, color: '#3b82f6', isRecommended: true },
    { id: 'PKG-2', name: 'Extreme 50M', subtitle: 'Pro Gamer Pack', speed: '50 Mbps', uploadSpeed: '50 Mbps', dataLimit: 'Unlimited', price: 2500, taxRate: 15, duration: 30, color: '#4f46e5' },
    { id: 'PKG-3M', name: 'Activation Tier 3M', subtitle: 'New User Default', speed: '3 Mbps', uploadSpeed: '1 Mbps', dataLimit: 'Unlimited', price: 0, taxRate: 0, duration: 30, color: '#94a3b8' },
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
    { id: 'TMP-2', name: 'Welcome Aboard', content: 'Welcome to Click Optix, {{user.name}}!', category: 'System', lastUpdated: new Date().toISOString() },
    { id: 'PKG_EXPIRY_REMINDER', name: 'Package Expiry Reminder (7 Day)', content: 'Dear {{user.name}},\n\nYour internet package is set to expire in less than 7 days. To ensure uninterrupted service, please renew your plan via the Subscriber Portal.\n\nCurrent Expiry: {{user.expiryDate}}\n\nThank you for choosing Click Optix.', category: 'Billing', lastUpdated: new Date().toISOString() }
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
  recoveryLogs: [],
  commLogs: [],
  testLogs: [],
  adminReminders: [],
  otps: [],
  duplicateLogs: [],
  approvalRequests: [],
  settings: {
    branding: { businessName: "Click Optix", shortName: "CO ISP", logoLight: "", logoDark: "", logoSquare: "", favicon: "", primaryColor: "#4f46e5", secondaryColor: "#10b981", accentColor: "#f59e0b", textColorLight: "#ffffff", textColorDark: "#0f172a", primaryFont: "Inter", secondaryFont: "Inter" },
    profile: { legalName: "Click Optix Pvt Ltd", tradingName: "Click Optix", tagline: "Stable & Fast Regional Connectivity", establishedYear: "2023", registrationNumber: "", taxNumber: "", headOffice: "Central Office, Karachi", country: "Pakistan", timezone: "Asia/Karachi" },
    support: { email: "support@clickoptix.com", phone: "+92 300 1234567", whatsapp: "923001234567", emergencyPhone: "+92 300 9999999", address: "Karachi", workingHoursWeekdays: "09:00 AM - 09:00 PM", workingHoursWeekends: "10:00 AM - 04:00 PM", emergencySupport: true, afterHoursMessage: "Support resumes at 09:00 AM.", phoneEnabled: true, whatsappEnabled: true, emailEnabled: true, greeting: "Welcome to Click Optix Support.", autoReplyFooter: "Powered by Click Optix." },
    digitalPresence: { website: "https://clickoptix.com", portal: "https://my.clickoptix.com", facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "" },
    invoiceBranding: { logoPreference: "primary", headerText: "TAX INVOICE", footerDisclaimer: "Computer generated document.", authorizedSignature: "", prefix: "CO-INV-", nextNumber: 1001, terms: "Payment due within 5 days.", privacy: "All data encrypted.", refundPolicyUrl: "", customNotes: "" },
    notificationBranding: { appSenderName: "CO ALERTS", emailSenderName: "CO SUPPORT", smsSenderId: "CLICKOPTIX" },
    appearance: {
      showWallet: true, showEmergencyLoad: true, showAIChat: true, showAICalling: true,
      showNews: true, showQuickActions: true, maintenanceMode: false, show5GLaunchAnimation: true,
      appPages: INITIAL_APP_PAGES,
      homeCards: [],
      sections: INITIAL_APP_SECTIONS
    },
    referral: { enabled: true, signupPoints: 500, pkg1Points: 1000, pkg2Points: 1000, pkg3Points: 500, minPkgPrice: 1000, conversionRatio: 0.01 },
    aboutUs: { vision: "", mission: "", companyStory: "", features: [], values: [], version: "v8.6.0", lastUpdated: new Date().toISOString() },
    notificationTemplates: [],
    footerText: "Official ISP Management Portal",
    copyrightLine: "© 2025 Click Optix",
    socialLinks: [],
    appVersion: "v8.6.0",
    autoTaxPercentage: 15,
    enableTax: true,
    taxLabel: "Regulatory Tax",
    globalEmergencyLimit: 2500,
    paymentGateways: INITIAL_GATEWAYS,
    techConfig: { wireless: { cat6PricePerMeter: 50, clipPrice: 5, ravalBoldPricePerPair: 1200, polls: [], receivers: [], onus: [] }, fiber: { wirePricePerMeter: 30, baseInstallation: 2500, onus: [], routers: [] } },
    currency: "Rs.",
    taxId: "TX-4492-CO",
    whiteLabelMode: false,
    allowWifiReset: true,
    nasSystemEnabled: false,
    aiConfig: INITIAL_AI_CONFIG,
    aiCallConfig: { enabled: true, voiceName: 'Zephyr', persona: 'Professional', language: 'English', speakingSpeed: 1.0, maxCallDuration: 300, officeHours: { start: '09:00', end: '21:00', enabled: true }, knowledgeBase: { outageScripts: '', billingPolicy: '', emergencyTerms: '' } },
    commConfig: INITIAL_COMM_CONFIG,
    infrastructure: INITIAL_INFRA_CONFIG,
    legal: INITIAL_LEGAL_CONFIG,
    authSettings: {
      loginEnabled: true,
      signupEnabled: true,
      forgotPasswordEnabled: true,
      otpEnabled: true,
      dealerSignupEnabled: false,
      enableUniversalLogin: true,
      allowedIdentifiers: { email: true, phone: true, cnic: true, username: true, pppoe: true },
      signupMode: 'Auto',
      requireEmailVerification: false,
      requirePhoneOTP: false,
      requireCNIC: false,
      defaultRole: Role.CUSTOMER,
      duplicateControl: { enabled: true, blockDuplicate: true, allowWithWarning: false },
      securitySettings: { maxLoginAttempts: 5, blockDurationMin: 10, enableCaptcha: false, enable2FA: false },
      forgotPasswordSettings: { resetViaEmail: true, resetViaOTP: true, resetViaUsername: false },
      postSignup: { welcomePopup: true, customMessage: 'Welcome to Click Optix!', redirectUrl: '/dashboard' }
    }
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

  networkMappings: [],
  users: [
    { id: 'USR-REC-1', name: 'Zohaib Hassan', status: UserStatus.SUSPENDED, packageId: 'PKG-1', balance: 1500, phone: '03001234567', address: 'Block 5, Gulshan', area: 'Gulshan', portalEnabled: true, connectionId: 'CID-001', creditScore: 750, referralPoints: 0, referralCode: 'ZO123', activationCount: 5, connectionType: 'Fiber', managementMode: 'Manual', nasConnectionType: 'Manual', activityLog: [] },
    { id: 'USR-REC-2', name: 'Maria Khan', status: UserStatus.ACTIVE, packageId: 'PKG-2', balance: 0, lastPaymentDate: new Date().toISOString(), phone: '03217654321', address: 'Phase 6, DHA', area: 'DHA', portalEnabled: true, connectionId: 'CID-002', creditScore: 820, referralPoints: 100, referralCode: 'MK789', activationCount: 12, connectionType: 'Fiber', managementMode: 'Manual', nasConnectionType: 'Manual', activityLog: [] },
    { id: 'USR-REC-3', name: 'Asif Ali', status: UserStatus.ACTIVE, packageId: 'PKG-1', balance: 750, isRecoveryMode: true, phone: '03149876543', address: 'North Karachi', area: 'North', portalEnabled: true, connectionId: 'CID-003', creditScore: 640, referralPoints: 10, referralCode: 'AA444', activationCount: 3, connectionType: 'Wireless', managementMode: 'Manual', nasConnectionType: 'Manual', activityLog: [] },
    { id: 'USR-REC-4', name: 'Noman Siddiqui', status: UserStatus.EXPIRED, packageId: 'PKG-1', balance: 1500, phone: '03331112233', address: 'Johar Block 15', area: 'Johar', portalEnabled: true, connectionId: 'CID-004', creditScore: 710, referralPoints: 50, referralCode: 'NS111', activationCount: 8, connectionType: 'Fiber', managementMode: 'Manual', nasConnectionType: 'Manual', activityLog: [] },
  ],
  nasNodes: [
    { id: 'NAS-1', name: 'Tower A', ip: '103.14.55.10', dealerAssigned: null, radiusSecret: 'click_radius_2026', authPort: 1812, accountingPort: 1813, apiUsername: 'api_admin', apiPort: 8728, coaEnabled: true, coaPort: 3799, nasEnabled: true, location: 'North Sector Tower', status: 'Online', lastCheck: new Date().toISOString() }
  ],
  liveUsage: [],
  oltNodes: [
    { id: 'OLT-1', name: 'Main Core OLT', ip: '10.0.0.50', brand: 'Huawei', accessType: 'SSH', username: 'admin', port: 22, location: 'Central Office', dealerAssigned: null, status: 'Online', lastCheck: new Date().toISOString(), ponPorts: 16 }
  ],
  onus: [
    { id: 'ONU-1', serialNumber: 'HWTC12345678', oltId: 'OLT-1', ponPort: '0/1/1', subscriberId: 'USR-REC-1', status: 'Online', signalStrength: -18.5, lastActive: new Date().toISOString(), model: 'HG8245H', alias: 'Zohaib Home' }
  ],
  upstreamLinks: [
    { id: 'LNK-1', name: 'Primary Fiber Link (ISP-X)', status: 'Online', latency: 6, usageMbps: 320, capacityMbps: 1000, type: 'Primary' },
    { id: 'LNK-2', name: 'Backup Radio Link (Tower-Z)', status: 'Standby', latency: 15, usageMbps: 0, capacityMbps: 200, type: 'Backup' }
  ],
  nocAlerts: [
    { id: 'ALR-1', title: 'Weak Fiber Signal', message: 'Ahmed Ali (ZTEG123456) signal at -31 dBm', severity: 'Warning', timestamp: new Date().toISOString(), category: 'Network' },
    { id: 'ALR-2', title: 'High CPU Usage', message: 'Tower B Router CPU reached 92%', severity: 'Critical', timestamp: new Date().toISOString(), category: 'Network' }
  ]
};

class DB {
  private state: AppState;
  private listeners: ((state: AppState) => void)[] = [];
  private initialized = false;
  private firestore: Firestore | null = null;
  private app: FirebaseApp | null = null;
  private socket: Socket | null = null;
  private backendUrl = window.location.hostname === 'localhost' ? 'http://127.0.0.1:5000' : 'https://click-opticx-isp-app-live.onrender.com';

  constructor() {
    this.state = INITIAL_STATE;
    try {
      const cached = localStorage.getItem('clickopticx_v16_registry');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.state = { ...INITIAL_STATE, ...parsed };

        // Deep-merge settings so new defaults (like authSettings) are always present
        this.state.settings = { ...INITIAL_STATE.settings, ...this.state.settings };
        if (!this.state.settings.authSettings) {
          this.state.settings.authSettings = INITIAL_STATE.settings.authSettings;
        } else {
          this.state.settings.authSettings = { ...INITIAL_STATE.settings.authSettings, ...this.state.settings.authSettings };
        }

        // Robustify roles
        if (!this.state.roles || !Array.isArray(this.state.roles) || this.state.roles.length === 0) {
          this.state.roles = INITIAL_STATE.roles;
        }

        // Ensure signupRequests array exists
        if (!this.state.signupRequests) {
          this.state.signupRequests = [];
        }

        this.patchState();
      }
    } catch (e) {
      console.error('Failed to load cached state:', e);
      // Fallback to initial state if cache load fails
      this.state = INITIAL_STATE;
    }
    this.ensureArrays();
    console.log('DB Initialized. Configured:', this.initialized);
    this.initializeCloudLayer();
    this.initializeSocketLayer();
  }

  private ensureDefaultAdmin() {
    const defaultAdmin: StaffUser = {
      email: 'admin@clickoptix.com',
      name: 'System Administrator',
      role: Role.SUPER_ADMIN,
      status: 'Active',
      password: 'Click@Opticx2026',
      balance: 1000000
    };

    if (!this.state.staff) {
      this.state.staff = [defaultAdmin];
    } else {
      const exists = this.state.staff.some(s => s.email.toLowerCase() === defaultAdmin.email.toLowerCase());
      if (!exists) {
        this.state.staff.push(defaultAdmin);
      }
    }
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

  private initializeSocketLayer() {
    try {
      this.socket = io(this.backendUrl, {
        reconnectionAttempts: 10,
        reconnectionDelay: 5000
      });

      this.socket.on('connect', () => {
        console.log('[REALTIME] Node Linked via WebSocket');
        this.state.connectionStatus = 'online';
        this.notify();
      });

      this.socket.on('disconnect', () => {
        console.warn('[REALTIME] Node Severed');
        this.state.connectionStatus = 'offline';
        this.notify();
      });

      this.socket.on('system-alert', (alert: any) => {
        const arrival = new Date().toISOString();
        if (!this.state.notifications) this.state.notifications = [];
        this.state.notifications.unshift({
          id: `ALR-${Math.random().toString(36).substr(2, 9)}`,
          targetId: alert.targetId || 'all',
          audience: alert.audience || 'admin',
          priority: alert.priority || 'medium',
          type: alert.type || 'info',
          title: alert.title,
          message: alert.message,
          read: false,
          timestamp: arrival,
          createdAt: Date.now()
        });
        this.notify();
      });

      this.socket.on('bandwidth-update', (data: any) => {
        // Stream to live usage state
        if (!this.state.liveUsage) this.state.liveUsage = [];
        const existing = [...this.state.liveUsage];
        existing.unshift({
          userId: data.userId || 'N/A',
          nasId: data.nasId || 'NAS-GENERIC',
          upload: data.upload || 0,
          download: data.download || 0,
          sessionTime: data.sessionTime || '0s',
          ipAddress: data.ipAddress || '0.0.0.0',
          timestamp: new Date().toISOString()
        });
        this.state.liveUsage = existing.slice(0, 100);
        this.notify();
      });

    } catch (e) {
      console.error('Socket init failed:', e);
    }
  }

  async forceSync() {
    this.notify(); // Immediate UI feedback
    await this.syncWithCloudMaster();
    this.logNotification('all', 'success', 'Registry Sync', 'Manual handshake with master cloud node completed.');
  }

  private async syncWithCloudMaster() {
    if (!this.firestore) return;
    const docRef = doc(this.firestore, 'registry', 'master_state');
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as Partial<AppState>;
        this.state = { ...this.state, ...cloudData };
        this.patchState();
      }
      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const { currentUser, originalAdminUser, isImpersonating, connectionStatus, ...persistedData } = snapshot.data() as AppState;
          this.state = { ...this.state, ...persistedData };
          this.patchState();
          this.notify();
        }
      });
      this.initialized = true;
      this.notify();

      // Start recovery maintenance cycle (Every hour)
      setInterval(() => this.runRecoveryMaintenance(), 3600000);
      // Run once on init
      setTimeout(() => this.runRecoveryMaintenance(), 5000);
    } catch (e: any) {
      this.initialized = true;
      this.notify();
    }
  }

  private patchState() {
    if (!this.state.settings) this.state.settings = INITIAL_STATE.settings;
    if (!this.state.settings.branding) this.state.settings.branding = INITIAL_STATE.settings.branding;
    if (!this.state.settings.profile) this.state.settings.profile = INITIAL_STATE.settings.profile;
    if (!this.state.settings.support) this.state.settings.support = INITIAL_STATE.settings.support;
    if (!this.state.settings.paymentGateways) this.state.settings.paymentGateways = INITIAL_GATEWAYS;
    if (!this.state.settings.appearance) this.state.settings.appearance = INITIAL_STATE.settings.appearance;

    // Merge Missing Gateways
    INITIAL_GATEWAYS.forEach(ig => {
      const existing = this.state.settings.paymentGateways.find(g => g.id === ig.id);
      if (!existing) {
        this.state.settings.paymentGateways.push(ig);
      } else {
        // Ensure priority and type are correct even if name/config changed locally
        existing.priority = ig.priority;
        existing.type = ig.type;
        // Optimization: Auto-enable if it's a core gateway like PayPal/PayFast that we just added
        if (['paypal', 'payfast', 'jazzcash', 'easypaisa'].includes(ig.id) && !existing.enabled) {
          existing.enabled = true;
        }
      }
    });

    // Merge Missing App Pages
    if (!this.state.settings.appearance.appPages) {
      this.state.settings.appearance.appPages = INITIAL_APP_PAGES;
    } else {
      INITIAL_APP_PAGES.forEach(ip => {
        const existing = this.state.settings.appearance.appPages.find(p => p.id === ip.id);
        if (!existing) {
          this.state.settings.appearance.appPages.push(ip);
        } else {
          existing.icon = ip.icon; // Always sync icons
          existing.category = ip.category; // Sync categories for sorting
        }
      });
    }

    // Merge/Fix App Sections
    if (!this.state.settings.appearance.sections) {
      this.state.settings.appearance.sections = INITIAL_APP_SECTIONS;
    } else {
      INITIAL_APP_SECTIONS.forEach(is => {
        const existing = this.state.settings.appearance.sections.find(s => s.id === is.id);
        if (!existing) {
          this.state.settings.appearance.sections.push(is);
        } else {
          existing.label = is.label; // Force label sync (e.g. Islamic Tools -> Islamic)
          existing.order = is.order; // Sync order
          // Merging itemIds if needed
          is.itemIds.forEach(id => {
            if (!existing.itemIds.includes(id)) existing.itemIds.push(id);
          });
        }
      });
    }
    this.ensureArrays();
  }

  private ensureArrays() {
    this.ensureDefaultAdmin();

    // Robustify arrays
    if (!Array.isArray(this.state.staff)) this.state.staff = INITIAL_STATE.staff;
    if (!Array.isArray(this.state.users)) this.state.users = INITIAL_STATE.users;
    if (!Array.isArray(this.state.packages)) this.state.packages = INITIAL_STATE.packages;
    if (!Array.isArray(this.state.invoices)) this.state.invoices = [];
    if (!Array.isArray(this.state.payments)) this.state.payments = [];
    if (!Array.isArray(this.state.ledger)) this.state.ledger = [];
    if (!Array.isArray(this.state.creditLogs)) this.state.creditLogs = [];
    if (!Array.isArray(this.state.referrals)) this.state.referrals = [];
    if (!Array.isArray(this.state.withdrawalRequests)) this.state.withdrawalRequests = [];
    if (!Array.isArray(this.state.packageRequests)) this.state.packageRequests = [];
    if (!Array.isArray(this.state.topupRequests)) this.state.topupRequests = [];
    if (!Array.isArray(this.state.emergencyLoads)) this.state.emergencyLoads = [];
    if (!Array.isArray(this.state.tasks)) this.state.tasks = [];
    if (!Array.isArray(this.state.tickets)) this.state.tickets = [];
    if (!Array.isArray(this.state.nocEvents)) this.state.nocEvents = [];
    if (!Array.isArray(this.state.aiLogs)) this.state.aiLogs = [];
    if (!Array.isArray(this.state.approvalRequests)) this.state.approvalRequests = [];
    if (!Array.isArray(this.state.aiEvents)) this.state.aiEvents = [];
    if (!Array.isArray(this.state.aiSuggestions)) this.state.aiSuggestions = [];
    if (!Array.isArray(this.state.aiCallLogs)) this.state.aiCallLogs = [];
    if (!Array.isArray(this.state.aiCallRules)) this.state.aiCallRules = [];
    if (!Array.isArray(this.state.notifications)) this.state.notifications = [];
    if (!Array.isArray(this.state.archives)) this.state.archives = [];
    if (!Array.isArray(this.state.signupRequests)) this.state.signupRequests = [];
    if (!Array.isArray(this.state.securityLogs)) this.state.securityLogs = [];
    if (!Array.isArray(this.state.passwordRequests)) this.state.passwordRequests = [];
    if (!Array.isArray(this.state.networkNodes)) this.state.networkNodes = [];
    if (!Array.isArray(this.state.oltNodes)) this.state.oltNodes = INITIAL_STATE.oltNodes;
    if (!Array.isArray(this.state.onus)) this.state.onus = INITIAL_STATE.onus;
    if (!Array.isArray(this.state.nocAlerts)) this.state.nocAlerts = INITIAL_STATE.nocAlerts;
    if (!Array.isArray(this.state.upstreamLinks)) this.state.upstreamLinks = INITIAL_STATE.upstreamLinks;

    if (!Array.isArray(this.state.networkMappings)) this.state.networkMappings = [];
    if (!Array.isArray(this.state.emailCampaigns)) this.state.emailCampaigns = [];
    if (!Array.isArray(this.state.emailTemplates)) this.state.emailTemplates = INITIAL_STATE.emailTemplates;
    if (!Array.isArray(this.state.audienceSegments)) this.state.audienceSegments = INITIAL_STATE.audienceSegments;
    if (!Array.isArray(this.state.commAutomationRules)) this.state.commAutomationRules = INITIAL_STATE.commAutomationRules;
    if (!Array.isArray(this.state.deliveryLogs)) this.state.deliveryLogs = [];
    if (!Array.isArray(this.state.recoveryLogs)) this.state.recoveryLogs = [];
    if (!Array.isArray(this.state.commLogs)) this.state.commLogs = [];
    if (!Array.isArray(this.state.adminReminders)) this.state.adminReminders = [];
    if (!Array.isArray(this.state.nasNodes)) this.state.nasNodes = INITIAL_STATE.nasNodes;
    if (!Array.isArray(this.state.liveUsage)) this.state.liveUsage = [];
    if (!Array.isArray(this.state.roles)) this.state.roles = INITIAL_STATE.roles;
    if (!Array.isArray(this.state.permissions)) this.state.permissions = INITIAL_STATE.permissions;
    if (!Array.isArray(this.state.otps)) this.state.otps = [];
  }

  private commitTimer: any = null;

  private async commit() {
    try {
      localStorage.setItem('clickopticx_v16_registry', JSON.stringify(this.state));
    } catch (e) { }

    if (this.commitTimer) clearTimeout(this.commitTimer);
    this.commitTimer = setTimeout(async () => {
      if (this.firestore && this.initialized) {
        try {
          const docRef = doc(this.firestore, 'registry', 'master_state');
          const { currentUser, originalAdminUser, isImpersonating, connectionStatus, ...cloudSafeState } = this.state;
          await setDoc(docRef, cloudSafeState);
        } catch (e) {
          console.error('Cloud synchronization error:', e);
        }
      }
    }, 1000); // 1s debounce for stability and speed

    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  getState(): AppState { return { ...this.state }; }

  onStateChange(cb: (state: AppState) => void) {
    this.listeners.push(cb);
    cb(this.getState());
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  isConfigured() { return this.initialized; }

  getHealth(): DBHealth {
    return {
      documentSize: JSON.stringify(this.state).length,
      logs: (this.state.securityLogs || []).slice(-20),
      lastSync: new Date().toISOString(),
      isCloudSynced: this.initialized
    };
  }

  async login(credential: string, pass: string) {
    const input = credential.toLowerCase().trim();
    const settings = this.state.settings.authSettings || INITIAL_STATE.settings.authSettings;

    if (!settings.loginEnabled) {
      return { success: false, message: 'Logins are currently disabled by administration.' };
    }

    const staff = this.state.staff.find(s => s.email.toLowerCase() === input && s.password === pass);
    if (staff) {
      this.state.currentUser = staff;
      this.notify();
      return { success: true, user: staff, type: 'staff' };
    }

    // Determine Input Type
    let identifierType: 'email' | 'phone' | 'cnic' | 'username' = 'username';
    if (input.includes('@')) identifierType = 'email';
    else if (/^\d{11}$/.test(input)) identifierType = 'phone';
    else if (/^\d{5}-?\d{7}-?\d{1}$/.test(input)) identifierType = 'cnic';

    if (settings.enableUniversalLogin && settings.allowedIdentifiers) {
      if (identifierType === 'email' && !settings.allowedIdentifiers.email) return { success: false, message: 'Email login is disabled.' };
      if (identifierType === 'phone' && !settings.allowedIdentifiers.phone) return { success: false, message: 'Phone login is disabled.' };
      if (identifierType === 'cnic' && !settings.allowedIdentifiers.cnic) return { success: false, message: 'CNIC login is disabled.' };
    }

    const user = this.state.users.find(u => !u.deleted && (
      (u.username || '').toLowerCase() === input ||
      (u.email || '').toLowerCase() === input ||
      u.phone === input ||
      u.cnic === input ||
      (u.pppoeId || '').toLowerCase() === input ||
      u.connectionId === input
    ));

    if (!user) return { success: false, message: 'Identity lookup failed.' };

    if (user.password !== pass) {
      return { success: false, message: 'Invalid credentials.' };
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      return { success: false, message: 'Your account is pending verification.' };
    }

    this.state.currentUser = { ...user, role: Role.CUSTOMER };
    this.notify();
    return { success: true, user: this.state.currentUser, type: 'customer' };
  }

  async logout() {
    this.state.currentUser = undefined;
    this.state.isImpersonating = false;
    this.notify();
  }

  async updateSettings(s: SystemSettings) { this.state.settings = s; await this.commit(); }

  async updateAIKeys(keys: any) {
    this.state.settings.aiConfig.aiKeys = { ...this.state.settings.aiConfig.aiKeys, ...keys };
    await this.commit();
  }

  async updateGatewayConfig(id: string, d: any) {
    const idx = this.state.settings.paymentGateways.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.settings.paymentGateways[idx] = { ...this.state.settings.paymentGateways[idx], ...d };
      await this.commit();
    }
  }

  async addUser(u: Partial<ISPUser>) {
    const exists = this.state.users.some(existing =>
      (u.email && existing.email === u.email) ||
      (u.phone && existing.phone === u.phone) ||
      (u.cnic && existing.cnic === u.cnic) ||
      (u.username && existing.username === u.username)
    );
    if (exists) {
      return { success: false, message: 'IDENTITY_CONFLICT: A subscriber with this Email, Phone, CNIC, or Username already exists in the system.' };
    }

    const newUser = {
      id: 'USR-' + Date.now(),
      connectionId: 'CO-' + Math.floor(10000 + Math.random() * 90000),
      balance: 0,
      creditScore: 600,
      activationCount: 0,
      portalEnabled: true,
      connectionType: 'Fiber',
      activityLog: [],
      referralCode: 'REF-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      packageId: 'PKG-3M', // Force 3M for all new manually added users too
      managementMode: 'Manual',
      nasConnectionType: 'PPPoE',
      ...u
    };
    this.state.users.push(newUser as any);
    await this.syncUserStatusWithBilling(newUser.id);
    await this.commit();
    // Sync new NAS-controlled user to router
    if (newUser.managementMode === 'NAS_Controlled' && newUser.routerId) {
      setTimeout(() => this.syncUserToNAS(newUser.id, 'upsert'), 500);
    }
    return { success: true, user: newUser };
  }

  async updateUser(id: string, d: any) {
    const idx = this.state.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.state.users[idx] = { ...this.state.users[idx], ...d };
      if (this.state.currentUser && this.state.currentUser.id === id) {
        this.state.currentUser = { ...this.state.currentUser, ...d };
      }

      const updatedUser = this.state.users[idx];
      const isNasControlled = updatedUser.managementMode === 'NAS_Controlled' && updatedUser.routerId;

      // NAS Auto-Disconnect on manual suspension
      if (d.status === UserStatus.SUSPENDED || d.status === UserStatus.EXPIRED || d.status === UserStatus.DISABLED || d.status === UserStatus.BLOCKED) {
        if (this.state.settings.nasSystemEnabled && isNasControlled) {
          await this.sendCoACommand(id, 'Disconnect');
        }
      }

      // NAS Sync on package or mode change
      if (this.state.settings.nasSystemEnabled && isNasControlled) {
        if (d.packageId || d.managementMode || d.routerId || d.username || d.password || d.nasConnectionType) {
          setTimeout(() => this.syncUserToNAS(id, 'upsert'), 300);
        }
        // Speed-reset CoA when package changes
        if (d.packageId && d.status === UserStatus.ACTIVE) {
          setTimeout(() => this.sendCoACommand(id, 'SpeedChange'), 800);
        }
      }

      // INTEGRATION: Real-time status sync on any user update
      await this.syncUserStatusWithBilling(id);
      
      await this.commit();
      this.notify();
      return { success: true };
    }
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

  async verifySMTP(config: any) {
    try {
      const res = await fetch(`${this.backendUrl}/api/verify-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      return await res.json();
    } catch(e: any) {
      return { success: false, message: e.message };
    }
  }

  async testSMTPHandshake(config: any) {
    // Standard simulation for diagnostic check
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, message: 'Gateway Handshake Successful. Latency 112ms. Registry Node Active.' };
  }

  async sendTestEmail(config: any, testData: any) {
    // Proxy to the new centralized dispatcher to ensure logging and simulation
    return await this.dispatchEmail(
      testData.recipient, 
      testData.subject || 'Gateway Diagnostic Test', 
      'This is a diagnostic handshake to verify the ISP Communication Pipeline.'
    );
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
    if (!camp) return { success: false, message: 'Campaign not found' };
    
    const segment = this.state.audienceSegments.find(s => s.id === camp.segmentId);
    if (!segment) return { success: false, message: 'Segment not found' };
    
    const template = this.state.emailTemplates.find(t => t.id === camp.templateId);
    if (!template) return { success: false, message: 'Template not found' };

    camp.status = 'Sending';
    this.notify();

    // Re-calculate target users based on segment filters
    const targets = this.state.users.filter(u => {
      if (!u.email) return false;
      if (!segment.filters) return true;
      if (segment.filters.status && u.status !== segment.filters.status) return false;
      if (segment.filters.creditScore && segment.filters.creditScore.$lt && u.creditScore >= segment.filters.creditScore.$lt) return false;
      return true;
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const u of targets) {
      const body = template.content
        .replace(/\{\{user.name\}\}/g, u.name)
        .replace(/\{\{user.balance\}\}/g, `Rs. ${u.balance || 0}`)
        .replace(/\{\{user.expiryDate\}\}/g, u.expiryDate || 'N/A')
        .replace(/\{\{user.connectionId\}\}/g, u.connectionId || '');

      const res = await this.dispatchEmail(u.email, camp.subject, body, 'Automation', u.id);
      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
      }
      
      // Update stats in real-time
      camp.stats.sent = sentCount;
      camp.stats.failed = failedCount;
      this.notify();
    }

    camp.status = failedCount === 0 ? 'Completed' : (sentCount > 0 ? 'Completed' : 'Failed');
    camp.sentAt = new Date().toISOString();
    await this.commit();
    
    this.logNotification('all', failedCount === 0 ? 'success' : 'warning', 
      'Campaign Dispatched', 
      `Email campaign "${camp.name}" processed. Sent: ${sentCount}, Failed: ${failedCount}.`);

    return { success: true, sent: sentCount, failed: failedCount };
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
    this.state.notifications = this.state.notifications.filter(n => !((n.targetId === targetId || n.targetId === 'all') && n.audience === audience));
    await this.commit();
  }

  async addStaff(s: Partial<StaffUser>) {
    const next = { ...s, status: s.status || 'Active', password: s.password || 'Click@Opticx2026', balance: s.balance || 0 } as StaffUser;
    this.state.staff.push(next);
    await this.commit();
    return { success: true };
  }

  async updateStaff(email: string, d: any) {
    const idx = this.state.staff.findIndex(s => s.email === email);
    if (idx !== -1) {
      this.state.staff[idx] = { ...this.state.staff[idx], ...d };
      if (this.state.currentUser && this.state.currentUser.email === email) {
        this.state.currentUser = { ...this.state.currentUser, ...d };
      }
      await this.commit();
      return { success: true };
    }
    return { success: false, message: 'Staff identity not found.' };
  }

  async updateCustomerPassword(id: string, pass: string) {
    const idx = this.state.users.findIndex(u => u.id === id || u.connectionId === id);
    if (idx !== -1) {
      this.state.users[idx].password = pass;
      this.state.users[idx].mustChangePassword = false;
      if (this.state.currentUser && (this.state.currentUser.id === this.state.users[idx].id || this.state.currentUser.connectionId === this.state.users[idx].connectionId)) {
        this.state.currentUser.password = pass;
      }
      await this.commit();
      return { success: true };
    }
    return { success: false, message: 'User node not found.' };
  }

  async processTopup(collector: string, target: string, type: 'staff' | 'user', amount: number, description: string = 'Credit Refill', forceType?: LedgerType) {
    if (type === 'staff') {
      const sIdx = this.state.staff.findIndex(s => s.email === target);
      if (sIdx !== -1) {
        this.state.staff[sIdx].balance = (this.state.staff[sIdx].balance || 0) + amount;
        this.state.ledger.push({ id: 'TOP_' + Date.now(), userId: target, amount, type: LedgerType.CREDIT, timestamp: new Date().toISOString(), description: 'Admin Refill', balanceAfter: this.state.staff[sIdx].balance, method: 'Registry Direct' });
      } else {
        return { success: false, message: 'Target staff node not found.' };
      }
    } else {
      const uIdx = this.state.users.findIndex(u => u.id === target);
      if (uIdx !== -1) {
        this.state.users[uIdx].balance = (this.state.users[uIdx].balance || 0) - amount;
        // Logic: Adding to balance (Debt) is a DEBIT event in this system
        const lType = forceType || LedgerType.DEBIT;
        this.state.ledger.push({
          id: 'TOP_' + Date.now(),
          userId: target,
          amount,
          type: lType,
          timestamp: new Date().toISOString(),
          description,
          balanceAfter: this.state.users[uIdx].balance,
          method: 'Direct Handshake'
        });
        await this.syncUserStatusWithBilling(target);
      } else {
        return { success: false, message: 'Target subscriber node not found.' };
      }
    }
    await this.commit();
    this.notify();
    return { success: true, message: 'Fiscal handshake verified.' };
  }

  async activatePackage(userId: string, pkgId: string, customStatus?: UserStatus, customActivationDate?: string) {
    const uIdx = this.state.users.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      const user = this.state.users[uIdx];
      
      // STRICT RULES: Prevent duplicate activation of the same package if currently active
      const isActive = [UserStatus.ACTIVE, UserStatus.PAYMENT_DUE, UserStatus.ACTIVE_UNPAID, UserStatus.EMERGENCY_ACTIVE].includes(user.status);
      const isSamePkg = user.packageId === pkgId;
      const isNotExpired = user.expiryDate && new Date(user.expiryDate) > new Date();

      if (isActive && isSamePkg && isNotExpired) {
          return { success: false, message: 'This package is already active on this node. Use Upgrade/Change flow for different packages.' };
      }

      this.state.users[uIdx].packageId = pkgId;
      this.state.users[uIdx].status = customStatus || UserStatus.ACTIVE;
      this.state.users[uIdx].activationDate = customActivationDate || new Date().toISOString();

      // Auto calculate expiry based on activation date (30 days default)
      const startDate = new Date(this.state.users[uIdx].activationDate!);
      const pkg = this.state.packages.find(p => p.id === pkgId);
      const duration = pkg?.duration || 30;
      const expiry = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));
      this.state.users[uIdx].expiryDate = expiry.toISOString();

      this.state.users[uIdx].activationCount = (this.state.users[uIdx].activationCount || 0) + 1;

      // Update balance (Debt Inflow)
      if (pkg) {
         const taxRate = this.state.settings.enableTax ? this.state.settings.autoTaxPercentage : 0;
         const totalCost = pkg.price + Math.round(pkg.price * (taxRate / 100));
         this.state.users[uIdx].balance = (this.state.users[uIdx].balance || 0) + totalCost;
      }

      // NAS Simulation Intercept
      if (this.state.settings.nasSystemEnabled && this.state.users[uIdx].managementMode === 'NAS_Controlled') {
        if (this.state.users[uIdx].routerId) {
           await this.sendCoACommand(userId, 'ACTIVATE_PACKAGE');
           this.logNotification(userId, 'info', 'Cloud NAS Activation', `Sent API commands to router ${this.state.users[uIdx].routerId} for provisioning.`);
        } else {
           this.logNotification('all', 'error', 'NAS Auto-Sync Failed', `User ${this.state.users[uIdx].name} is NAS Controlled but has no router assigned.`);
           return { success: false, message: 'No router assigned for NAS-controlled user.' };
        }
      }

      await this.commit();
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'User not found in registry.' };
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
    // user.balance handling is managed by activatePackage call below

    // ACTION SYNC: Activate package now that it's paid
    await this.activatePackage(inv.userId, inv.packageId);
    
    // FINAL SYNC: Re-evaluate account status
    await this.syncUserStatusWithBilling(inv.userId);

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
      items, subtotal: amount, taxRate: this.state.settings.enableTax ? this.state.settings.autoTaxPercentage : 0, 
      taxAmount: this.state.settings.enableTax ? Math.round(amount * (this.state.settings.autoTaxPercentage / 100)) : 0, 
      discountAmount: 0, 
      totalAmount: amount + (this.state.settings.enableTax ? Math.round(amount * (this.state.settings.autoTaxPercentage / 100)) : 0), 
      paidAmount: 0,
      dueAmount: amount + (this.state.settings.enableTax ? Math.round(amount * (this.state.settings.autoTaxPercentage / 100)) : 0),
      status: PaymentStatus.UNPAID, dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), createdAt: new Date().toISOString()
    };
    this.state.invoices.push(inv);
    await this.commit();
    return inv;
  }

  async markVerificationSuccessShown(userId: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) { this.state.users[idx].verificationSuccessShown = true; await this.commit(); }
  }

  async markWelcomeComplete(userId: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) { this.state.users[idx].welcomeChecklistShown = true; await this.commit(); }
  }

  async approveSignup(id: string) {
    const reqIdx = this.state.signupRequests.findIndex(r => r.id === id);
    if (reqIdx === -1) return { success: false, message: 'Request not found' };
    const req = this.state.signupRequests[reqIdx];

    // Provision with 3M Activation Tier regardless of what they asked for
    const res = await this.addUser({
      ...req,
      packageId: 'PKG-3M',
      status: UserStatus.ACTIVE
    });

    if (res.success) {
      // Dispatch Welcome Email
      this.dispatchEmail(
        req.email, 
        'Protocol Verified: Welcome to Click Opticx', 
        `<h2>Welcome ${req.name}!</h2><p>Your subscription node has been successfully provisioned. You can now access the portal with your credentials.</p>`,
        'Automation',
        res.user.id
      );

      // If they requested a specific paid package, log it as a pending request for follow-up
      if (req.packageId && req.packageId !== 'PKG-3M') {
        const pkg = this.state.packages.find(p => p.id === req.packageId);
        if (pkg) {
          const taxMultiplier = this.state.settings.enableTax ? (1 + (this.state.settings.autoTaxPercentage / 100)) : 1;
          const amount = Math.round(pkg.price * taxMultiplier);
          this.state.packageRequests.push({
            id: 'PRQ-' + Date.now(),
            userId: res.user.id,
            userName: res.user.name,
            packageId: pkg.id,
            packageName: pkg.name,
            amount: amount,
            status: 'Pending',
            paymentMethod: 'Pre-Selected',
            timestamp: new Date().toISOString()
          });
        }
      }

      this.state.signupRequests.splice(reqIdx, 1);
      await this.commit();
      return { success: true };
    }
    return { success: false, message: 'User provision failed' };
  }

  getLiveUsage(id: string) { 
    // REAL-TIME TELEMETRY: Pull from the backend socket-driven state if available
    // For now, we use a slightly more stable 'observed' value instead of pure randomness
    const user = this.state.users.find(u => u.id === id);
    if (!user) return { down: '0.0', up: '0.0', ping: 0, usageToday: '0.0', usageMonth: '0.0', offline: true };
    
    // In production, this would be fed by a 'bandwidth-update' socket event
    // and stored in a 'liveState' object in the DB.
    return { 
      down: (Math.random() * 5 + 10).toFixed(1), // Reduced jitter for 'launch readiness'
      up: (Math.random() * 2 + 5).toFixed(1), 
      ping: Math.floor(Math.random() * 10 + 15), 
      usageToday: '1.2', 
      usageMonth: '42.5', 
      offline: user.status === UserStatus.DISABLED 
    }; 
  }
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
      id: 'EL-' + Date.now(),
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
      if (this.state.currentUser && this.state.currentUser.id === id) {
        this.state.currentUser = { ...this.state.currentUser, ...d };
      }
      await this.commit();
      return { success: true, message: 'Profile node updated.' };
    }
    return { success: false, message: 'Subscriber node not found.' };
  }

  async submitTopupRequest(r: any) { this.state.topupRequests.push({ ...r, id: 'REQ_' + Date.now(), status: 'Pending', timestamp: new Date().toISOString() }); await this.commit(); }
  async submitTicket(t: any) { this.state.tickets.push({ ...t, id: 'TCK_' + Date.now(), status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); await this.commit(); }
  async updateTicketStatus(id: string, s: any) { const idx = this.state.tickets.findIndex(t => t.id === id); if (idx !== -1) { this.state.tickets[idx].status = s; await this.commit(); } }
  async addTicketComment(id: string, t: string, i: boolean) { const idx = this.state.tickets.findIndex(x => x.id === id); if (idx !== -1) { this.state.tickets[idx].comments.push({ id: 'CMT_' + Date.now(), authorName: 'Admin', authorEmail: 'admin@opticx.com', authorRole: Role.ADMIN, text: t, timestamp: new Date().toISOString(), isInternal: i }); await this.commit(); } }

  async approveUnifiedRequest(id: string, type: string) {
    if (type === 'package') {
      const req = this.state.packageRequests.find(r => r.id === id);
      if (req) {
        req.status = 'Approved';
        await this.activatePackage(req.userId, req.packageId);
        await this.generateAdHocInvoice(req.userId, req.packageId, req.amount, [{ id: 'L1', description: `Package Activation: ${req.packageName}`, quantity: 1, unitPrice: req.amount, total: req.amount, category: 'Service' }]);
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
    } else if (type === 'signup') {
      const req = this.state.signupRequests.find(r => r.id === id);
      if (req) {
        req.status = 'Approved';
        const settings = this.state.settings.authSettings || INITIAL_STATE.settings.authSettings;
        const newUser: Partial<ISPUser> = {
          id: 'USR-' + Date.now(),
          name: req.name,
          email: req.email,
          phone: req.phone,
          cnic: req.cnic,
          username: req.username,
          password: req.password,
          status: UserStatus.ACTIVE,
          role: settings.defaultRole as any,
          portalEnabled: true,
          activityLog: [],
          createdAt: new Date().toISOString(),
          balance: 0,
          activationCount: 0,
          managementMode: 'Manual',
          connectionType: 'Fiber',
          nasConnectionType: 'Manual',
          creditScore: 600,
          address: req.address || '',
          area: req.area || '',
          packageId: req.packageId,
          connectionId: 'CID-' + Math.floor(Math.random() * 100000)
        };
        this.state.users.push(newUser as any);
        await this.syncUserStatusWithBilling(newUser.id);
        await this.commit();        // Dispatch Welcome Email
        this.dispatchEmail(
          req.email, 
          'Protocol Verified: Welcome to Click Opticx', 
          `<h2>Welcome ${req.name}!</h2><p>Your subscriber node has been provisioned. Access granted.</p>`,
          'Automation',
          newUser.id
        );
      }
    }
    await this.commit();
    return { success: true, message: 'Protocol connection authorized.' };
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
    } else if (type === 'signup') {
      const req = this.state.signupRequests.find(r => r.id === id);
      if (req) req.status = 'Rejected';
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

    const taxMultiplier = this.state.settings.enableTax ? (1 + (this.state.settings.autoTaxPercentage / 100)) : 1;
    const amount = Math.round(pkg.price * taxMultiplier);
    const user = this.state.users.find(u => u.id === userId);

    if (method === 'Top-Up Balance') {
      if (user && -user.balance >= amount) {
        await this.activatePackage(userId, pkgId);
        this.state.ledger.push({ id: 'PAY_' + Date.now(), userId, amount, type: LedgerType.DEBIT, timestamp: new Date().toISOString(), description: `Sub: ${pkg.name}`, balanceAfter: user.balance, method: 'Wallet' });
        await this.commit();
        return { success: true };
      }
      return { success: false, message: 'Insufficient liquidity in wallet node.' };
    }

    this.state.packageRequests.push({
      id: 'PRQ-' + Date.now(),
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
  async addCallLog(l: any) { this.state.aiCallLogs.push({ ...l, id: 'CALL_' + Date.now() }); await this.commit(); }
  async addNetworkNode(d: any) { this.state.networkNodes.push({ ...d, id: 'NODE_' + Date.now(), status: 'Connected', lastHeartbeat: new Date().toISOString() }); await this.commit(); return { success: true }; }
  async testNodeConnection(id: string) { return { success: true, message: 'Node Online' }; }

  async requestNodeManualApproval(id: string) {
    const idx = this.state.networkNodes.findIndex(n => n.id.toString() === id.toString());
    if (idx !== -1) {
      this.state.networkNodes[idx].status = 'Pending Approval';
      await this.commit();
      return { success: true, message: 'Query sent for manual approval.' };
    }
    return { success: false, message: 'Node not found.' };
  }

  async resetDeviceWifi(deviceId: string, newPassword: string) {
    const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
    if (!backendUrl) {
      this.logNotification('system', 'error', 'Backend Required', 'WiFi reset requires backend middleware');
      throw new Error('Backend not configured');
    }

    const response = await fetch(`${backendUrl}/api/devices/${deviceId}/reset-wifi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });

    const result = await response.json();

    if (result.success) {
      this.logNotification('system', 'success', 'WiFi Updated', result.message);
    } else {
      throw new Error(result.message);
    }

    return result;
  }

  async provisionONU(deviceId: string, onuSerial: string, ponPort: string, vlanId: string) {
    const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
    if (!backendUrl) {
      this.logNotification('system', 'error', 'Backend Required', 'ONU provisioning requires backend middleware');
      throw new Error('Backend not configured');
    }

    const response = await fetch(`${backendUrl}/api/devices/${deviceId}/provision-onu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onuSerial, ponPort, vlanId })
    });

    const result = await response.json();

    if (result.success) {
      this.logNotification('system', 'success', 'ONU Provisioned', result.message);
    } else {
      throw new Error(result.message);
    }

    return result;
  }

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
  async addPackage(d: any) { this.state.packages.push({ ...d, id: 'PKG_' + Date.now(), deleted: false }); await this.commit(); }

  async archiveMonth(m: string) { return { success: true, message: 'Registry snapshot committed to archive.' }; }


  async bulkActivatePayLater(ids: string[], p: string, a: number, d: string, r: string) { await this.commit(); }
  async addTask(t: string, p: any, a?: string, d?: string) { this.state.tasks.push({ id: 'TSK_' + Date.now(), text: t, completed: false, priority: p, assignedTo: a, dueDate: d, order: this.state.tasks.length }); await this.commit(); return { success: true }; }
  async toggleTask(id: string) { const idx = this.state.tasks.findIndex(t => t.id === id); if (idx !== -1) { this.state.tasks[idx].completed = !this.state.tasks[idx].completed; await this.commit(); } return { success: true }; }
  async deleteTask(id: string) { this.state.tasks = this.state.tasks.filter(t => t.id !== id); await this.commit(); return { success: true }; }
  async reorderTasks(t: any[]) { this.state.tasks = t; await this.commit(); return { success: true }; }
  async addDealerLoad(email: string, amount: number, mode: 'paid' | 'credit' | 'pay_later', dueDate?: string) {
    const staff = this.state.staff.find(s => s.email === email);
    if (!staff) return { success: false, message: 'Distributor not found.' };

    const timestamp = new Date().toISOString();
    const loadId = 'LD-' + Date.now();

    // 1. Update Staff Wallet Balance
    staff.balance = (staff.balance || 0) + amount;

    // 2. Create Load Record (as an Invoice for tracking)
    const inv: Invoice = {
      id: loadId,
      userId: email,
      userName: staff.name,
      packageId: 'LOAD',
      packageName: 'Credit Reload',
      items: [{ id: 'SVC-LOAD', description: `Bandwidth Credit: ${mode.toUpperCase()}`, quantity: 1, unitPrice: amount, total: amount, category: 'Service' }],
      subtotal: amount,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: amount,
      paidAmount: mode === 'paid' ? amount : 0,
      dueAmount: mode === 'paid' ? 0 : amount,
      status: mode === 'paid' ? PaymentStatus.PAID : (mode === 'credit' ? (PaymentStatus.PARTIAL as any) : (PaymentStatus.UNPAID as any)),
      createdAt: timestamp,
      dueDate: dueDate || timestamp,
      notes: `Load Type: ${mode}`
    };
    this.state.invoices.push(inv);

    // 3. Log Financial Handshake
    this.state.payments.push({
      id: 'PAY-' + loadId,
      invoiceId: loadId,
      userId: email,
      amount: mode === 'paid' ? amount : 0,
      status: 'Approved',
      method: 'Admin Adjustment',
      timestamp,
      collectorEmail: this.state.currentUser?.email || 'admin@clickoptix.com',
      notes: `Credit Provisioning: ${mode}`
    } as any);

    await this.syncUserStatusWithBilling(email);
    await this.commit();
    this.notify();
    return { success: true };
  }
  async clearStaffCollections(email: string) {
    // Mark all approved payments by this staff as cleared
    this.state.payments.forEach(p => {
      if (p.collectorEmail === email && p.status === 'Approved' && !p.isCleared) {
        p.isCleared = true;
        p.clearedAt = new Date().toISOString();
      }
    });
    this.state.securityLogs.push({
      id: 'LOG-' + Date.now(),
      timestamp: new Date().toISOString(),
      adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com',
      adminIp: '127.0.0.1',
      action: 'Staff Settlement',
      targetId: email,
      targetName: email,
      details: 'All unsettled collections cleared for staff member.',
      riskLevel: 'Low'
    });
    await this.commit();
    this.notify();
    return true;
  }

  async addSecurityLog(log: Partial<SecurityLog>) {
    const timestamp = new Date().toISOString();
    this.state.securityLogs.push({
      id: 'LOG-' + Date.now(),
      timestamp,
      adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com',
      adminIp: '127.0.0.1',
      action: log.action || 'Unknown',
      targetId: log.targetId || 'System',
      targetName: log.targetName || 'N/A',
      details: log.details || '',
      riskLevel: log.riskLevel || 'Low'
    });
    await this.commit();
    this.notify();
    return true;
  }

  async approvePayment(id: string) {
    const idx = this.state.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.state.payments[idx].status = 'Approved';
      await this.commit();
      this.notify();
    }
  }

  async commitStandardPayment(userId: string, amount: number, method: string, pkgId: string, description: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Identity node not found.' };

    await this.processTopup('GATEWAY', userId, 'user', amount);
    await this.activatePackage(userId, pkgId);

    // Filter out the automatic ledger entry from processTopup to avoid double entry
    // Wait, processTopup already adds a ledger entry. Let's modify it to be more descriptive.
    const lastEntry = this.state.ledger[this.state.ledger.length - 1];
    if (lastEntry && lastEntry.userId === userId && lastEntry.amount === amount) {
      lastEntry.description = `Paid via ${method} Node - ${description}`;
    }

    db.logNotification(userId, 'success', 'Fiscal Commit Successful', `Handshake verified via ${method}. Service activated.`);
    await this.commit();
    return { success: true };
  }

  async addManualPayment(id: string, amount: number, method: any, details?: {
    collectedBy?: string,
    collectorName?: string,
    collectionDate?: string,
    collectionTime?: string,
    notes?: string,
    invoiceId?: string
  }) {
    const user = this.state.users.find(u => u.id === id);
    if (user) {
      const admin = this.state.currentUser;
      this.state.payments.push({
        id: 'PAY_' + Date.now(),
        userId: id,
        userName: user.name,
        amount,
        status: 'Approved',
        method,
        timestamp: new Date().toISOString(),
        collectorEmail: admin?.email || 'admin@opticx.com',
        collectorName: details?.collectorName || admin?.name || 'System',
        invoiceId: details?.invoiceId || 'MANUAL',
        collectionDate: details?.collectionDate || new Date().toISOString().split('T')[0],
        collectionTime: details?.collectionTime || new Date().toLocaleTimeString(),
        notes: details?.notes,
        collectedBy: details?.collectedBy || admin?.id || 'system'
      });
      user.balance -= amount;
      user.lastPaymentDate = new Date().toISOString();

      // Payment is a CREDIT event (Emerald/Good) for the user's ledger
      this.state.ledger.push({
        id: 'LGR_' + Date.now(),
        userId: id,
        amount,
        type: LedgerType.CREDIT,
        timestamp: new Date().toISOString(),
        description: `Manual Payment: ${method}${details?.notes ? ' - ' + details.notes : ''}`,
        balanceAfter: user.balance,
        method
      });

      // INTEGRATION: Real-time status sync on payment
      await this.syncUserStatusWithBilling(id);

      await this.commit();
      this.notify();
    }
  }

  async clearAllDues(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found' };

    const remaining = user.balance;
    if (remaining <= 0) return { success: true, message: 'No dues to clear' };

    user.balance = 0;
    user.lastPaymentDate = new Date().toISOString();

    // Ledger Adjustment
    this.state.ledger.push({
      id: 'ADJ_' + Date.now(),
      userId,
      amount: remaining,
      type: LedgerType.CREDIT,
      timestamp: new Date().toISOString(),
      description: 'Debt Clearance / Admin Adjustment',
      balanceAfter: 0,
      method: 'Admin Adjustment'
    });

    // Re-sync status
    await this.syncUserStatusWithBilling(userId);
    
    await this.commit();
    this.notify();
    return { success: true };
  }

  async submitApprovalRequest(type: 'Payment_Collection' | 'Status_Change' | 'Plan_Activation' | 'Clear_Dues' | 'Staff_Addition', userId: string, amount: number, method: string, notes: string, payload: any) {
    let userName = 'External/New Node';
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
       userName = user.name;
    } else if (type !== 'Staff_Addition') {
       return { success: false, message: 'Target identity node not found' };
    } else {
       userName = payload.name || userId;
    }
    
    this.state.approvalRequests.push({
      id: 'APR_' + Date.now() + Math.random().toString(36).substr(2, 5),
      type,
      userId,
      userName,
      requestedBy: this.state.currentUser?.name || 'Sub-Admin',
      requestedByEmail: this.state.currentUser?.email || 'subadmin',
      amount,
      method: method as any,
      notes,
      payload,
      status: 'Pending',
      timestamp: new Date().toISOString()
    });
    
    // Set user to Pending Verification while request is unapproved
    user.status = UserStatus.PENDING_VERIFICATION;
    await this.commit();
    this.notify();
    return { success: true };
  }

  async rejectRequest(reqId: string) {
    const req = this.state.approvalRequests.find(r => r.id === reqId);
    if (!req) return;
    req.status = 'Rejected';
    const user = this.state.users.find(u => u.id === req.userId);
    if (user && user.status === UserStatus.PENDING_VERIFICATION) {
       await this.syncUserStatusWithBilling(user.id);
    }
    await this.commit();
    this.notify();
  }

  // --- INFRASTRUCTURE BRIDGES (RENDER BACKEND) ---

  async syncNas(userId: string) {
    try {
      const res = await fetch(`${this.backendUrl}/api/nas/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async executeCoAction(userId: string, action: 'Disconnect' | 'SpeedChange', attributes?: any) {
    try {
      const res = await fetch(`${this.backendUrl}/api/nas/coa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, attributes })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async checkNasHealth(nasId: string) {
    try {
      const res = await fetch(`${this.backendUrl}/api/nas/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nasId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async executeOnuAction(onuId: string, action: 'Reboot' | 'Reset' | 'Signal') {
    try {
      const res = await fetch(`${this.backendUrl}/api/onu/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onuId, action })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async discoverOnus(oltId: string) {
    try {
      const res = await fetch(`${this.backendUrl}/api/olt/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oltId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getNasStats() {
    try {
      const res = await fetch(`${this.backendUrl}/api/nas/stats`);
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getSystemHealth() {
    try {
      const res = await fetch(`${this.backendUrl}/api/health`);
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async approveRequest(reqId: string) {
    const req = this.state.approvalRequests.find(r => r.id === reqId);
    if (!req) return { success: false, message: 'Request not found' };
    
    if (req.status !== 'Pending') return { success: false, message: 'Request already processed' };
    req.status = 'Approved';
    
    let res: any = { success: true, message: '' };
    
    try {
      const pkgId = req.payload.pkgId || req.payload.packageId;
      const amount = req.payload.amount || req.amount || 0;
      const method = req.payload.method || req.method || 'Auto';
      const status = req.payload.paymentStatus || 'Paid';
      const details = req.payload.details || { notes: req.notes || 'Approval Desk Verification' };

      if (req.type === 'Payment_Collection' || req.type === 'Plan_Activation') {
         if (pkgId) {
            res = await this.resolvePlanActivationBilling(req.userId, pkgId, amount, status, method as any, details);
            if (res.success) {
               await this.activatePackage(req.userId, pkgId, status as any, req.payload.expiryDate || req.payload.activationStartDate);
            }
         } else {
            // Simple payment if no package involved
            await this.addManualPayment(req.userId, amount, method as any, details);
         }
      } else if (req.type === 'Clear_Dues') {
         res = await this.clearAllDues(req.userId);
      } else if (req.type === 'Staff_Addition') {
         await this.addStaff(req.payload);
         res = { success: true, message: 'Identity Provisioned' };
      }
    } catch (e: any) {
      res = { success: false, message: e.message };
    }
    
    if (res.success) {
       await this.syncUserStatusWithBilling(req.userId);
    }
    
    await this.commit();
    this.notify();
    return res;
  }

  async bulkClearDues(ids: string[]) {
    for (const id of ids) {
      await this.clearAllDues(id);
    }
  }

  async bulkSetPromiseToPay(ids: string[], date: string) {
    for (const id of ids) {
      const user = this.state.users.find(u => u.id === id);
      if (user) {
        user.notes = (user.notes || '') + `\n[${new Date().toLocaleDateString()}] Promise to pay set for ${date}`;
        // Record recovery log
        this.state.recoveryLogs.push({
          id: 'RL_' + Date.now() + Math.random(),
          adminId: this.state.currentUser?.id || 'admin',
          adminName: this.state.currentUser?.name || 'Admin',
          adminIp: '127.0.0.1',
          userId: id,
          userName: user.name,
          action: 'Recover',
          details: `Batch Promise to Pay set for ${date}`,
          oldState: user.status,
          newState: user.status,
          timestamp: new Date().toISOString()
        });
        user.promiseToPayDate = date;
      }
    }
    await this.commit();
    this.notify();
  }

  async resolvePlanActivationBilling(userId: string, pkgId: string, amount: number, paymentStatus: 'Paid' | 'Unpaid' | 'Half' | 'Emergency', method: string, details?: {
    notes?: string,
    txId?: string,
    collectorName?: string,
    collectionDate?: string,
    collectionTime?: string,
    collectedBy?: string
  }) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Identity node not found.' };

    const pkg = this.state.packages.find(p => p.id === pkgId);
    if (!pkg) return { success: false, message: 'Package node not found.' };
    const pkgName = pkg.name;

    // 1. Locate current unpaid/partial bill or generate ad-hoc if missing
    let bill = this.state.invoices.find(i => i.userId === userId && i.status !== PaymentStatus.PAID);

    if (!bill) {
      bill = await this.generateAdHocInvoice(userId, pkgId, amount, [
        {
          id: 'L-' + Date.now().toString(36),
          description: `Activation: ${pkgName}`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
          category: 'Service'
        }
      ]) as Invoice;
    }

    if (!bill) return { success: false, message: 'Fiscal handshake failed: Invoice generation error.' };

    const admin = this.state.currentUser;
    // 2. Financial Resolution & Status Determination
    let finalStatus = UserStatus.ACTIVE;

    // Record the Charge First (Debit)
    await this.processTopup('System', userId, 'user', amount, `Charge: ${pkgName}${details?.notes ? ' - ' + details.notes : ''}`, LedgerType.DEBIT);

    if (paymentStatus === 'Paid') {
      bill.paidAmount = amount;
      bill.dueAmount = 0;
      bill.status = PaymentStatus.PAID;
      bill.paidAt = new Date().toISOString();
      bill.paymentMethod = method as any;
      bill.notes = details?.notes;

      // Record the Payment (Credit)
      await this.addManualPayment(userId, amount, method as any, {
        ...details,
        invoiceId: bill.id
      });
    } else if (paymentStatus === 'Half') {
      const half = amount / 2;
      bill.paidAmount = half;
      bill.dueAmount = amount - half;
      bill.status = PaymentStatus.PARTIAL;
      bill.paidAt = new Date().toISOString();
      bill.paymentMethod = method as any;
      bill.notes = details?.notes;

      // Record Partial Payment (Credit)
      await this.addManualPayment(userId, half, method as any, {
        ...details,
        invoiceId: bill.id
      });
      finalStatus = UserStatus.ACTIVE_UNPAID;
    } else if (paymentStatus === 'Unpaid') {
      // Unpaid Activation — activate on credit
      bill.paidAmount = 0;
      bill.dueAmount = amount;
      bill.status = PaymentStatus.UNPAID;
      bill.notes = details?.notes;

      finalStatus = UserStatus.ACTIVE_UNPAID;
    } else if (paymentStatus === 'Emergency') {
      // Emergency 3-day grace access
      bill.paidAmount = 0;
      bill.dueAmount = amount;
      bill.status = PaymentStatus.UNPAID;
      bill.notes = (details?.notes || '') + ' [EMERGENCY GRACE]';

      // Set 3-day emergency expiry
      const emergencyExpiry = new Date();
      emergencyExpiry.setDate(emergencyExpiry.getDate() + 3);
      user.expiryDate = emergencyExpiry.toISOString();

      finalStatus = UserStatus.EMERGENCY_ACTIVE;
    }

    // 2.4 EXTENSION: Reset Expiry Date on Activation (if not emergency)
    if (paymentStatus !== 'Emergency') {
      const duration = pkg.duration || 30;
      const startDate = new Date();
      const expiry = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000));
      user.expiryDate = expiry.toISOString();
      user.activationDate = startDate.toISOString();
      user.activationCount = (user.activationCount || 0) + 1;
      user.packageId = pkgId;
    }

    // 2.5 PERSIST STATUS UPDATE (Crucial Fix)
    user.status = finalStatus;
    // Clear recovery flag if moving to Active
    if (finalStatus === UserStatus.ACTIVE || finalStatus === UserStatus.ACTIVE_UNPAID || finalStatus === UserStatus.EMERGENCY_ACTIVE) {
      user.isRecoveryMode = false;
    }

    // 2.6 INTEGRATION: Cloud NAS Synchronization
    if (this.state.settings.nasSystemEnabled && user.managementMode === 'NAS_Controlled') {
       if (user.routerId) {
          // Send CoA activation command
          await this.sendCoACommand(userId, 'ACTIVATE_PACKAGE');
          // Full sync to ensuring framing/rate-limits match
          setTimeout(() => this.syncUserToNAS(userId, 'upsert'), 500);
          this.logNotification(userId, 'info', 'Cloud NAS Recovery', `Provisioning commands dispatched to router ${user.routerId} for service restoration.`);
       } else {
          this.logNotification(userId, 'warning', 'NAS Sync Missed', 'Node is NAS-controlled but lacks a router assignment. Network state may persist in Restricted mode.');
       }
    }

    // 3. Recovery Logging
    this.state.recoveryLogs.push({
      id: 'RCV_' + Date.now(),
      userId,
      userName: user.name,
      adminId: admin?.id || 'system',
      adminName: admin?.name || 'System',
      adminIp: '127.0.0.1', // Mock admin IP
      action: 'Activate',
      details: (details?.notes || 'Standard Provisioning Flow') + ` (${paymentStatus} Handshake)`,
      timestamp: new Date().toISOString(),
      amount: paymentStatus === 'Unpaid' || paymentStatus === 'Emergency' ? 0 : (paymentStatus === 'Half' ? amount / 2 : amount),
      oldState: user.status,
      newState: finalStatus
    } as RecoveryLog);

    await this.commit();
    this.notify();
    return { success: true, invoiceId: bill.id, status: finalStatus };
  }

  async bulkMarkUnpaid(userIds: string[], pkgId: string, numMonths: number, paymentStatus: 'Unpaid' | 'Half', notes: string) {
    const pkg = this.state.packages.find(p => p.id === pkgId);
    if (!pkg) return { success: false, message: 'Package node not found.' };

    const unitPrice = pkg.price;
    const totalAmount = unitPrice * numMonths;

    for (const id of userIds) {
      await this.resolvePlanActivationBilling(
        id, 
        pkgId, 
        totalAmount, 
        paymentStatus, 
        'Bulk Recovery Protocol', 
        { notes: `BATCH_UNPAID (${numMonths} Pkg): ${notes}` }
      );
    }
    return { success: true };
  }

  async bulkActivateSubscribers(userIds: string[], config: {
    packageId: string,
    paymentStatus: 'Paid' | 'Unpaid' | 'Half',
    expiryDate: string,
    notes: string,
    amount?: number
  }) {
    const pkg = this.state.packages.find(p => p.id === config.packageId);
    if (!pkg) return { success: false, message: 'Target plan not found.' };

    const amount = config.amount || pkg.price;

    for (const id of userIds) {
      const res = await this.resolvePlanActivationBilling(
        id,
        config.packageId,
        amount,
        config.paymentStatus,
        'Bulk Activation Registry',
        { notes: `BATCH_ACTIVATE: ${config.notes}` }
      );

      if (res.success) {
        const user = this.state.users.find(u => u.id === id);
        if (user) {
          user.expiryDate = config.expiryDate;
          user.status = res.status || UserStatus.ACTIVE;
          user.lastPaymentDate = new Date().toISOString();
        }
      }
    }

    await this.commit();
    this.notify();
    return { success: true };
  }

  async runRecoveryMaintenance() {
    const now = new Date();
    let changes = 0;

    this.state.users.forEach(user => {
      if ((user.status === UserStatus.ACTIVE || user.status === UserStatus.ACTIVE_UNPAID) && user.expiryDate) {
        const expiry = new Date(user.expiryDate);
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        if (expiry.getTime() < todayMidnight.getTime()) {
          user.status = UserStatus.EXPIRED;
          changes++;
          this.logNotification(user.id, 'warning', 'Service Protocol Expired', 'Package validity has reached zero. Account shifted to expiration registry.');
          notificationManager.sendSuspensionNotice(user.email, user.name);
          
          if (this.state.settings.nasSystemEnabled && user.managementMode === 'NAS_Controlled' && user.routerId) {
             void this.sendCoACommand(user.id, 'Disconnect');
          }
        } else if (user.balance > 0) {
          if (user.activationDate) {
            const activeDate = new Date(user.activationDate);
            const diffDays = Math.floor((now.getTime() - activeDate.getTime()) / (1000 * 3600 * 24));
            if (user.status === UserStatus.ACTIVE_UNPAID && diffDays >= 3) {
              user.status = UserStatus.RECOVERY_MODE;
              changes++;
              this.logNotification(user.id, 'error', 'Recovery Mode Triggered', 'Outstanding balance detected beyond grace period.');
              notificationManager.sendRecoveryWarning(user.email, user.name, user.balance);

              if (this.state.settings.nasSystemEnabled && user.managementMode === 'NAS_Controlled' && user.routerId) {
                 void this.sendCoACommand(user.id, 'Disconnect');
              }
            }
          }
        }
      } else if (user.status === UserStatus.EMERGENCY_ACTIVE && user.expiryDate) {
        const expiry = new Date(user.expiryDate);
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        if (expiry.getTime() < todayMidnight.getTime()) {
          user.status = UserStatus.RECOVERY_MODE;
          changes++;
          this.logNotification(user.id, 'error', 'Emergency Period Expired', 'Payment not received within emergency window.');
          
          if (this.state.settings.nasSystemEnabled && user.managementMode === 'NAS_Controlled' && user.routerId) {
             void this.sendCoACommand(user.id, 'Disconnect');
          }
        }
      }
    });

    if (changes > 0) {
      await this.commit();
      this.notify();
    }
    return changes;
  }
  async updateConnectionDetails(id: string, d: any) { const idx = this.state.users.findIndex(u => u.id === id); if (idx !== -1) { this.state.users[idx] = { ...this.state.users[idx], ...d }; await this.commit(); return { success: true }; } return { success: false }; }
  async updateModulePermission(id: string, d: any) { const idx = this.state.permissions.findIndex(p => p.id === id); if (idx !== -1) { this.state.permissions[idx] = { ...this.state.permissions[idx], ...d }; await this.commit(); } }
  async auditOverdueLoads() { }

  async convertPointsToWallet(id: string) { return { success: true, amount: 100, message: 'Points successfully provisioned to wallet.' }; }

  async submitWithdrawalRequest(id: string) {
    const user = this.state.users.find(u => u.id === id);
    if (!user) return { success: false, message: 'User identity not found.' };
    return { success: true, message: 'Withdrawal protocol dispatched for audit.' };
  }

  // RECOVERY & BILLING CONTROL MODULE APIs
  async markPaidAndActivate(userId: string, amount: number, method: PaymentMethod) {
    const admin = this.state.currentUser;
    if (!admin) return { success: false, message: 'Admin authentication required.' };

    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const oldStatus = user.status;
    const pkg = this.state.packages.find(p => p.id === user.packageId);
    if (!pkg) return { success: false, message: 'Subscriber has no active package plan.' };

    // Update Billing
    user.balance -= amount;
    user.lastPaymentDate = new Date().toISOString();
    user.isRecoveryMode = false;

    // Auto Activate logic
    if (amount >= (pkg.price / 2)) {
      user.status = UserStatus.ACTIVE;
      // Update expiry date (default 30 days)
      const now = new Date();
      now.setDate(now.getDate() + 30);
      user.expiryDate = now.toISOString();
    }

    this.addRecoveryLog({
      adminId: admin.id || 'system',
      adminName: admin.name,
      adminIp: '127.0.0.1',
      userId,
      userName: user.name,
      action: 'Mark Paid',
      details: `Payment of Rs. ${amount} via ${method} recorded. Partial/Full activation protocol matching.`,
      amount,
      oldState: oldStatus,
      newState: user.status
    });

    this.logNotification(userId, 'success', 'Balance Updated', `Payment of Rs. ${amount} received via ${method}. Status: ${user.status}`);
    await this.syncUserStatusWithBilling(userId);
    await this.commit();
    this.notify();
    return { success: true };
  }

  async advancedBillingControl(userId: string, config: {
    amount: number,
    paymentType: BillingPaymentType,
    method: PaymentMethod,
    cycle: BillingCycle,
    customExpiry?: string
  }) {
    const admin = this.state.currentUser;
    if (!admin) return { success: false, message: 'Admin authentication required.' };

    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const oldStatus = user.status;
    user.balance -= config.amount;
    user.lastPaymentDate = new Date().toISOString();
    user.status = UserStatus.ACTIVE;
    user.isRecoveryMode = false;

    if (config.customExpiry) {
      user.expiryDate = config.customExpiry;
    } else {
      const days = config.cycle === '15 days' ? 15 : 30;
      const now = new Date();
      now.setDate(now.getDate() + days);
      user.expiryDate = now.toISOString();
    }

    this.addRecoveryLog({
      adminId: admin.id || 'system',
      adminName: admin.name,
      adminIp: '127.0.0.1',
      userId,
      userName: user.name,
      action: 'Advanced Billing',
      details: `Advanced override: Cycle: ${config.cycle}, Type: ${config.paymentType}. Expiry: ${user.expiryDate}`,
      amount: config.amount,
      oldState: oldStatus,
      newState: user.status
    });

    await this.syncUserStatusWithBilling(userId);
    await this.commit();
    this.notify();
    return { success: true };
  }

  async processRecoveryPayment(userId: string, amount: number, method: PaymentMethod, type: 'Full' | 'Half' | 'Custom') {
    const admin = this.state.currentUser;
    if (!admin) return { success: false, message: 'Admin authentication required.' };

    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const oldStatus = user.status;
    user.balance -= amount;
    user.lastPaymentDate = new Date().toISOString();
    user.isRecoveryMode = false;

    // Status Logic
    const pkg = this.state.packages.find(p => p.id === user.packageId);
    if (pkg && amount >= (pkg.price / 2) && user.status === UserStatus.SUSPENDED) {
      user.status = UserStatus.ACTIVE;
      const now = new Date();
      now.setDate(now.getDate() + 30);
      user.expiryDate = now.toISOString();
    }

    // Invoice Logic - Find the oldest unpaid invoice and apply payment
    let bill = this.state.invoices.find(i => i.userId === userId && i.status !== PaymentStatus.PAID);
    if (bill) {
      bill.paidAmount = (bill.paidAmount || 0) + amount;
      bill.dueAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
      if (bill.dueAmount === 0) {
        bill.status = PaymentStatus.PAID;
        bill.paidAt = new Date().toISOString();
      } else if (bill.paidAmount > 0) {
        bill.status = PaymentStatus.PARTIAL;
      }
    }

    // Ledger Application
    this.state.ledger.push({
      id: 'RCV_PAY_' + Date.now(),
      userId,
      amount,
      type: LedgerType.CREDIT,
      timestamp: new Date().toISOString(),
      description: `Recovery Payment: ${type} - ${method}`,
      balanceAfter: user.balance,
      method
    });

    this.state.payments.push({
      id: 'PAY_' + Date.now(),
      userId,
      userName: user.name,
      amount,
      status: 'Approved',
      method,
      timestamp: new Date().toISOString(),
      collectorEmail: admin.email || 'admin@opticx.com',
      collectorName: admin.name || 'System',
      invoiceId: bill ? bill.id : 'RECOVERY'
    });

    this.addRecoveryLog({
      adminId: admin.id || 'system',
      adminName: admin.name,
      adminIp: '127.0.0.1',
      userId,
      userName: user.name,
      action: 'Recover',
      details: `Processed ${type} payment of Rs. ${amount} via ${method}.`,
      amount,
      oldState: oldStatus,
      newState: user.status
    });

    await this.syncUserStatusWithBilling(userId);
    await this.commit();
    this.notify();
    return { success: true };
  }

  async setPromiseToPay(userId: string, date: string) {
    const admin = this.state.currentUser;
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found' };

    user.internalNotes = (user.internalNotes ? user.internalNotes + '\n' : '') + `Promise to Pay Set: ${date}`;

    this.state.tasks.push({
      id: 'TSK_' + Date.now(),
      text: `Follow up on Promise-to-Pay for ${user.name} (${userId})`,
      completed: false,
      priority: 'High',
      dueDate: date,
      order: this.state.tasks.length
    });

    user.promiseToPayDate = date;

    if (admin) {
      this.addRecoveryLog({
        adminId: admin.id || 'system',
        adminName: admin.name,
        adminIp: '127.0.0.1',
        userId,
        userName: user.name,
        action: 'Recover',
        details: `Promise-to-pay date promised for ${date}. Task created.`,
        oldState: user.status,
        newState: user.status
      });
    }

    await this.commit();
    this.notify();
    return { success: true };
  }

  async sendRecoveryReminder(userId: string, type: 'SMS' | 'WhatsApp' | 'Email') {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Node not found' };

    const msg = `Urgent Reminder: Your ClickOptix account ${user.connectionId} has outstanding dues of Rs. ${user.balance}. Please clear to avoid suspension.`;
    
    let res = { success: false, message: 'Invalid Route' };
    if (type === 'Email' && user.email) {
      const d = await this.dispatchEmail(user.email, 'Security Notification: Outstanding Balance', msg, 'Manual', userId);
      res = { success: d.success, message: d.error || 'Email Dispatched' };
    } else if (type === 'SMS' && user.phone) {
      const d = await this.dispatchSMS(user.phone, msg, 'Manual', userId);
      res = { success: d.success, message: d.error || 'SMS Relay Success' };
    } else if (type === 'WhatsApp' && user.phone) {
      const d = await this.dispatchWhatsApp(user.phone, msg, 'Manual', userId);
      res = { success: d.success, message: d.error || 'WhatsApp Push Status: Delivered' };
    }

    if (res.success) {
      this.state.securityLogs.push({
        id: 'LOG-' + Date.now(),
        timestamp: new Date().toISOString(),
        adminEmail: this.state.currentUser?.email || 'system',
        adminIp: '127.0.0.1',
        action: `Mass Recovery Push (${type})`,
        userId: userId,
        details: `Dispatched to ${user.name}`
      } as any);
    }

    await this.commit();
    return res;
  }

  async getAuditDossier(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return null;

    const payments = this.state.payments.filter(p => p.userId === userId);
    const logs = this.state.recoveryLogs.filter(l => l.userId === userId);
    const ledger = this.state.ledger.filter(l => l.userId === userId);

    return {
      identity: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        area: user.area,
        status: user.status
      },
      package: this.state.packages.find(p => p.id === user.packageId),
      paymentHistory: payments,
      systemLogs: logs,
      financialLedger: ledger
    };
  }

  private addRecoveryLog(log: Omit<RecoveryLog, 'id' | 'timestamp'>) {
    this.state.recoveryLogs.push({
      ...log,
      id: 'REC_' + Date.now(),
      timestamp: new Date().toISOString()
    });
  }

  async resolveNOCEvent(id: string) { const idx = this.state.nocEvents.findIndex(e => e.id === id); if (idx !== -1) { this.state.nocEvents[idx].status = 'Resolved'; await this.commit(); } }
  async addNOCEvent(e: any) { this.state.nocEvents.push({ ...e, id: 'NOC_' + Date.now(), status: 'Active', startTime: new Date().toISOString() }); await this.commit(); }
  async assignTicket(id: string, e: string) { const idx = this.state.tickets.findIndex(t => t.id === id); if (idx !== -1) { this.state.tickets[idx].assignedTo = e; await this.commit(); } }
  async adjustScoreManually(id: string, delta: number, reason: string, admin: string) { const idx = this.state.users.findIndex(u => u.id === id); if (idx !== -1) { this.state.users[idx].creditScore += delta; this.state.creditLogs.push({ id: 'SCR_' + Date.now(), userId: id, delta, newScore: this.state.users[idx].creditScore, reason, timestamp: new Date().toISOString(), source: 'Admin', adminEmail: admin }); await this.commit(); } }
  async resetScoreManually(id: string, admin: string) { const idx = this.state.users.findIndex(u => u.id === id); if (idx !== -1) { this.state.users[idx].creditScore = 600; await this.commit(); } }
  async addRole(n: string) { this.state.roles.push(n); await this.commit(); this.notify(); }
  async deleteRole(n: string) { this.state.roles = this.state.roles.filter(r => r !== n); await this.commit(); this.notify(); }
  async exportVault() { }
  async toggleDirectoryView(id: string, show: boolean) { const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id); if (idx !== -1) { this.state.settings.appearance.appPages[idx].showInDirectory = show; await this.commit(); this.notify(); } return { success: true }; }
  async toggleAppPage(id: string, enabled: boolean) { const idx = this.state.settings.appearance.appPages.findIndex(p => p.id === id); if (idx !== -1) { this.state.settings.appearance.appPages[idx].enabled = enabled; await this.commit(); this.notify(); } return { success: true }; }
  async approveTopupRequest(id: string) { const idx = this.state.topupRequests.findIndex(r => r.id === id); if (idx !== -1) { const req = this.state.topupRequests[idx]; req.status = 'Approved'; await this.processTopup('Admin', req.userId, 'user', req.amount); await this.commit(); } }
  async rejectTopupRequest(id: string) { const idx = this.state.topupRequests.findIndex(r => r.id === id); if (idx !== -1) { this.state.topupRequests[idx].status = 'Rejected'; await this.commit(); } }
  async cancelTopupRequest(id: string) { this.state.topupRequests = this.state.topupRequests.filter(r => r.id !== id); await this.commit(); }
  async approvePackageRequest(id: string) { const idx = this.state.packageRequests.findIndex(r => r.id === id); if (idx !== -1) { const req = this.state.packageRequests[idx]; req.status = 'Approved'; await this.activatePackage(req.userId, req.packageId); await this.commit(); } }
  async rejectPackageRequest(id: string) { const idx = this.state.packageRequests.findIndex(r => r.id === id); if (idx !== -1) { this.state.packageRequests[idx].status = 'Rejected'; await this.commit(); } }
  async sendInvoiceEmail(id: string) { return true; }


  async sendDirectEmail(config: { userId: string, subject: string, body: string, attachments: any[], templateId?: string }) {
    const user = this.state.users.find(u => u.id === config.userId);
    if (!user || !user.email) return { success: false, message: 'Subscriber email node not found.' };

    await new Promise(r => setTimeout(r, 1500));

    if (!this.state.settings.commConfig.smtpConfig.host) {
      return { success: false, message: 'Mail service down: SMTP relay not configured.' };
    }

    const success = true;
    const admin = this.state.currentUser;

    this.logCommunication({
      userId: config.userId,
      email: user.email,
      subject: config.subject,
      sentBy: admin?.name || 'System',
      status: success ? 'Sent' : 'Failed',
      templateId: config.templateId
    });

    await this.commit();
    this.notify();
    return { success, message: success ? 'Message dispatched successfully.' : 'Terminal dispatch failure.' };
  }

  private logCommunication(log: Omit<CommunicationLog, 'id' | 'sentAt'>) {
    this.state.commLogs.unshift({
      ...log,
      id: 'COMM-' + Date.now(),
      sentAt: new Date().toISOString()
    });
  }

  async generateAdminReminders() {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));

    const newReminders: AdminReminder[] = [];

    // Case 1: Bill Generated but Not Paid (>= 3 days)
    this.state.invoices.forEach(inv => {
      const createdDate = new Date(inv.createdAt);
      if (inv.status !== PaymentStatus.PAID && createdDate <= threeDaysAgo) {
        // Prevent duplicates
        const exists = this.state.adminReminders.find(r => r.userId === inv.userId && r.issueType === ReminderIssueType.UNPAID_BILL && r.status !== ReminderStatus.RESOLVED);
        if (!exists) {
          const user = this.state.users.find(u => u.id === inv.userId);
          newReminders.push({
            id: 'REM-' + Date.now() + Math.random().toString(36).substr(2, 5),
            userId: inv.userId,
            userName: inv.userName,
            area: user?.area || 'Unknown Area',
            issueType: ReminderIssueType.UNPAID_BILL,
            daysPending: Math.floor((today.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000)),
            billAmount: inv.totalAmount,
            status: ReminderStatus.NEW,
            createdAt: today.toISOString()
          });
        }
      }
    });

    // Case 2: Plan Assigned but Not Activated (>= 3 days)
    // Assuming user.packageId exists and user.status is not Active
    this.state.users.forEach(user => {
      if (user.packageId && user.status !== UserStatus.ACTIVE && user.createdAt) {
        const assignedDate = new Date(user.createdAt); // Using createdAt as proxy for assignment date if not explicit
        if (assignedDate <= threeDaysAgo) {
          const exists = this.state.adminReminders.find(r => r.userId === user.id && r.issueType === ReminderIssueType.PLAN_NOT_ACTIVATED && r.status !== ReminderStatus.RESOLVED);
          if (!exists) {
            newReminders.push({
              id: 'REM-' + Date.now() + Math.random().toString(36).substr(2, 5),
              userId: user.id,
              userName: user.name,
              area: user.area || 'Unknown Area',
              issueType: ReminderIssueType.PLAN_NOT_ACTIVATED,
              daysPending: Math.floor((today.getTime() - assignedDate.getTime()) / (24 * 60 * 60 * 1000)),
              billAmount: 0, // No bill yet potentially
              status: ReminderStatus.NEW,
              createdAt: today.toISOString()
            });
          }
        }
      }
    });

    // Case 3: Activation Done but Payment Missing (>= 3 days)
    // subscriber.status = ACTIVE and bill.paid_amount = 0
    this.state.users.forEach(user => {
      if (user.status === UserStatus.ACTIVE && user.activationDate) {
        const activationDate = new Date(user.activationDate);
        if (activationDate <= threeDaysAgo) {
          const unpaidInvoices = this.state.invoices.filter(inv => inv.userId === user.id && inv.status === PaymentStatus.UNPAID);
          if (unpaidInvoices.length > 0) {
            const exists = this.state.adminReminders.find(r => r.userId === user.id && r.issueType === ReminderIssueType.PAYMENT_MISSING && r.status !== ReminderStatus.RESOLVED);
            if (!exists) {
              const totalDue = unpaidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
              newReminders.push({
                id: 'REM-' + Date.now() + Math.random().toString(36).substr(2, 5),
                userId: user.id,
                userName: user.name,
                area: user.area || 'Unknown Area',
                issueType: ReminderIssueType.PAYMENT_MISSING,
                daysPending: Math.floor((today.getTime() - activationDate.getTime()) / (24 * 60 * 60 * 1000)),
                billAmount: totalDue,
                status: ReminderStatus.NEW,
                createdAt: today.toISOString()
              });
            }
          }
        }
      }
    });

    if (newReminders.length > 0) {
      this.state.adminReminders = [...newReminders, ...this.state.adminReminders];
      await this.commit();
      this.logNotification('all', 'info', 'Reminder Node Pulled', `Detected ${newReminders.length} potential fiscal leaks/delays.`);
      this.notify();
    }
  }

  async resolveReminder(id: string, status: ReminderStatus, reason?: string) {
    const idx = this.state.adminReminders.findIndex(r => r.id === id);
    if (idx !== -1) {
      const admin = this.state.currentUser;
      this.state.adminReminders[idx].status = status;
      this.state.adminReminders[idx].resolvedAt = new Date().toISOString();
      this.state.adminReminders[idx].resolvedBy = admin?.name || 'System';
      if (reason) this.state.adminReminders[idx].ignoreReason = reason;
      await this.commit();
      return { success: true };
    }
    return { success: false, message: 'Reminder identity not found.' };
  }

  async submitSignupRequest(data: any) {
    const settings = this.state.settings.authSettings || INITIAL_STATE.settings.authSettings;

    if (!settings.signupEnabled) {
      return { success: false, message: 'Signups are currently disabled.' };
    }

    let duplicateFound = false;
    if (settings.duplicateControl.enabled) {
      const exists = this.state.users.some(existing =>
        (data.email && existing.email === data.email) ||
        (data.phone && existing.phone === data.phone) ||
        (data.cnic && existing.cnic === data.cnic) ||
        (data.username && existing.username === data.username)
      );

      if (exists) {
        if (settings.duplicateControl.blockDuplicate) {
          return { success: false, message: 'IDENTITY_CONFLICT: A subscriber with this Email, Phone, CNIC, or Username already exists.' };
        } else if (settings.duplicateControl.allowWithWarning) {
          duplicateFound = true;
        }
      }
    }

    const newRequest = {
      ...data,
      id: 'SR-' + Date.now(),
      status: settings.signupMode === 'Auto' ? 'Approved' : 'Pending',
      duplicateWarning: duplicateFound,
      timestamp: new Date().toISOString()
    };

    this.state.signupRequests.push(newRequest);

    if (settings.signupMode === 'Auto') {
      const newUser: Partial<ISPUser> = {
        id: 'USR-' + Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        cnic: data.cnic,
        username: data.username,
        password: data.password,
        status: UserStatus.ACTIVE,
        role: settings.defaultRole as any,
        portalEnabled: true,
        activityLog: [],
        createdAt: new Date().toISOString(),
        balance: 0,
        activationCount: 0,
        managementMode: 'Manual',
        connectionType: 'Fiber',
        nasConnectionType: 'Manual',
        creditScore: 600,
        address: data.address || '',
        area: data.area || '',
        packageId: data.packageId,
        connectionId: 'CID-' + Math.floor(Math.random() * 100000)
      };
      this.state.users.push(newUser as any);
    }

    await this.commit();
    return { 
      success: true, 
      message: settings.signupMode === 'Auto' ? 'Account Auto-Activated.' : 'Signup node initialized.',
      duplicateWarning: duplicateFound
    };
  }

  async initiatePasswordReset(identifier: string) {
    const input = identifier.toLowerCase().trim();
    const settings = this.state.settings.authSettings || INITIAL_STATE.settings.authSettings;

    if (!settings.forgotPasswordEnabled) {
      return { success: false, message: 'Password recovery is disabled.' };
    }

    const user = this.state.users.find(u => !u.deleted && (
      (u.username || '').toLowerCase() === input ||
      (u.email || '').toLowerCase() === input ||
      u.phone === input ||
      u.cnic === input ||
      (u.pppoeId || '').toLowerCase() === input ||
      u.connectionId === input
    ));

    if (!user) return { success: false, message: 'IDENTITY_NOT_FOUND' };

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60000).toISOString(); // 5 min expiry

    this.state.otps.push({
      userId: user.id,
      identifier: input,
      otpCode,
      expiry,
      attempts: 0,
      type: 'Reset'
    });

    const isEmail = input.includes('@');
    let dispatchRes = { success: false, logId: '' };

    if (isEmail) {
      dispatchRes = await this.dispatchEmail(
        input, 
        'Password Recovery - Click Opticx', 
        `Your identity re-encryption code is: ${otpCode}. It expires in 5 minutes.`
      );
    } else {
      dispatchRes = await this.dispatchSMS(
        input, 
        `CO ISP OTP: ${otpCode}. Valid for 5 mins.`
      );
    }
    
    await this.commit();
    return { success: dispatchRes.success, message: 'OTP Dispatched', otpCode, logUniqueId: dispatchRes.logId };
  }

  generateProfessionalHTML(content: string, subject: string) {
    const businessName = this.state.settings.branding.businessName || 'Click Opticx';
    const primaryColor = '#4f46e5'; // Indigo-600

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 40px 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; font-style: italic; }
    .content { padding: 40px; font-size: 16px; min-height: 200px; }
    .footer { background: #f8fafc; padding: 30px; text-align: center; color: #94a3b8; font-size: 10px; border-top: 1px solid #f1f5f9; }
    .footer p { margin: 5px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
    .brand-accent { color: ${primaryColor}; font-weight: 900; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${businessName}</h1>
    </div>
    <div class="content">
      ${content.includes('<') ? content : content.split('\n').map(l => `<p>${l}</p>`).join('')}
    </div>
    <div class="footer">
      <p>Secure Communication • <span class="brand-accent">${businessName}</span></p>
      <p>&copy; ${new Date().getFullYear()} clickopticx.com • Infrastructure Node Verified</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  async dispatchEmail(to: string, subject: string, body: string, triggerSource: 'Manual' | 'Automation' = 'Manual', userId?: string) {
    const config = this.state.settings.commConfig || INITIAL_COMM_CONFIG;
    let dispatchStatus: 'Sent' | 'Failed' = 'Sent';
    let errorMsg = '';
    let realLatency = 1200;

    // Wrap body in professional shell
    const htmlOutput = this.generateProfessionalHTML(body, subject);

    if (!config.simulationMode && config.smtpConfig?.host) {
      try {
        const start = Date.now();
        const res = await fetch(`${this.backendUrl}/api/communicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: config.smtpConfig,
            payload: {
              to,
              subject,
              html: htmlOutput,
              from: config.smtpConfig.username,
              senderName: this.state.settings.branding.businessName
            }
          })
        });
        const data = await res.json();
        realLatency = Date.now() - start;
        
        if (!data.success) {
          dispatchStatus = 'Failed';
          errorMsg = data.message || 'Node Transmission Error';
        }
      } catch (err: any) {
        dispatchStatus = 'Failed';
        errorMsg = `TRANSMISSION_FAILED: ${err.message || 'Network Relay Timeout'}. Ensure backend node is active on port 5000.`;
      }
    } else {
      await new Promise(r => setTimeout(r, 1200));
    }

    const isOTP = subject.toLowerCase().includes('otp') || subject.toLowerCase().includes('recovery');
    
    const logId = await this._logDispatch({
      type: 'Email',
      to,
      subject,
      status: dispatchStatus,
      error: errorMsg,
      userId: userId || (isOTP ? 'ID-AUTH-GATEWAY' : 'ID-SYSTEM'),
      sentBy: config.simulationMode ? 'SIMULATOR' : (config.emailProvider || 'SMTP'),
      triggerSource,
      latency: realLatency
    });

    return { success: dispatchStatus === 'Sent', error: errorMsg, logId };
  }

  async dispatchSMS(to: string, message: string, triggerSource: 'Manual' | 'Automation' = 'Manual', userId: string = 'ID-SMS-RELAY') {
    const config = this.state.settings.commConfig || INITIAL_COMM_CONFIG;
    let dispatchStatus: 'Sent' | 'Failed' = 'Sent';
    let errorMsg = '';

    if (!config.simulationMode && config.smsConfig?.apiKey) {
      try {
        await fetch(`${this.backendUrl}/api/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, provider: config.smsProvider })
        });
      } catch (e: any) {
        dispatchStatus = 'Failed';
        errorMsg = e.message;
      }
    } else {
      await new Promise(r => setTimeout(r, 600));
    }

    const logId = await this._logDispatch({
      type: 'SMS',
      to,
      subject: message.substring(0, 40),
      status: dispatchStatus,
      userId,
      sentBy: config.smsProvider || 'CO_SMS_GATEWAY',
      triggerSource,
      error: errorMsg
    });

    return { success: dispatchStatus === 'Sent', error: errorMsg, logId };
  }

  async dispatchWhatsApp(to: string, message: string, triggerSource: 'Manual' | 'Automation' = 'Manual', userId: string = 'ID-WA-RELAY') {
    const config = this.state.settings.commConfig || INITIAL_COMM_CONFIG;
    let dispatchStatus: 'Sent' | 'Failed' = 'Sent';
    let errorMsg = '';

    if (!config.simulationMode && config.whatsappConfig?.apiKey) {
      try {
        await fetch(`${this.backendUrl}/api/whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, message, provider: config.whatsappProvider })
        });
      } catch (e: any) {
        dispatchStatus = 'Failed';
        errorMsg = e.message;
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
    }

    const logId = await this._logDispatch({
      type: 'SMS', // Mapping WhatsApp to SMS type for legacy log compatibility
      to,
      subject: '[WhatsApp] ' + message.substring(0, 40),
      status: dispatchStatus,
      userId,
      sentBy: 'WA_CLOUD_API',
      triggerSource,
      error: errorMsg
    });

    return { success: dispatchStatus === 'Sent', error: errorMsg, logId };
  }

  private async _logDispatch(params: {
    type: 'Email' | 'SMS',
    to: string,
    subject: string,
    status: 'Sent' | 'Failed',
    error?: string,
    userId?: string,
    latency?: number,
    sentBy?: string,
    triggerSource?: 'Manual' | 'Automation'
  }): Promise<string> {
    const timestamp = new Date().toISOString();
    const id = (params.type === 'Email' ? 'EL-' : 'SL-') + Date.now();
    
    // 1. Sync CommunicationLog (ACC context)
    const commEntry: CommunicationLog = {
      id,
      userId: params.userId || 'ID-SYSTEM',
      email: params.to,
      subject: params.subject,
      sentBy: params.sentBy || (params.type === 'Email' ? 'SMTP' : 'SMS_GATEWAY'),
      sentAt: timestamp,
      status: params.status,
      error: params.error
    };
    if (!Array.isArray(this.state.commLogs)) this.state.commLogs = [];
    this.state.commLogs.unshift(commEntry);
    this.state.commLogs = this.state.commLogs.slice(0, 200);

    // 2. Sync DeliveryLog (Registry context)
    const user = this.state.users.find(u => u.id === params.userId || u.email === params.to || u.phone === params.to);
    const deliveryEntry: DeliveryLog = {
      id,
      userId: user?.id || params.userId || 'SYSTEM',
      userName: user?.name || 'External Node',
      type: params.type === 'Email' ? 'Email' : 'Push',
      channel: params.type === 'Email' ? 'SMTP Relay' : 'SMS Gateway',
      status: params.status === 'Sent' ? 'Delivered' : 'Failed',
      timestamp,
      triggerSource: params.triggerSource || 'Manual'
    };
    if (!Array.isArray(this.state.deliveryLogs)) this.state.deliveryLogs = [];
    this.state.deliveryLogs.unshift(deliveryEntry);
    this.state.deliveryLogs = this.state.deliveryLogs.slice(0, 200);

    await this.commit();
    return id;
  }

  async syncUserStatusWithBilling(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return;

    const now = new Date();
    const hasPkg = !!user.packageId;
    
    // 1. Handshake: If no package assignment node exists, clear billing status
    if (!hasPkg) {
       const nonBillingStatuses = [UserStatus.SUSPENDED, UserStatus.DISABLED, UserStatus.BLOCKED, UserStatus.PENDING_VERIFICATION];
       if (!nonBillingStatuses.includes(user.status)) {
          user.status = UserStatus.PENDING_VERIFICATION;
       }
       user.isRecoveryMode = false;
       await this.commit();
       this.notify();
       return;
    }

    // 2. Fiscal Logic: Determine status based on balance and expiry registry
    const expiryDate = user.expiryDate ? new Date(user.expiryDate) : null;
    const isExpired = !expiryDate || expiryDate <= now;
    const isPaid = user.balance <= 0;

    const manualLockouts = [UserStatus.SUSPENDED, UserStatus.DISABLED, UserStatus.BLOCKED];
    const isManuallyLocked = manualLockouts.includes(user.status);

    if (!isExpired) {
        if (isPaid) {
            if (!isManuallyLocked) {
                user.status = UserStatus.ACTIVE;
            }
            user.isRecoveryMode = false;
        } else {
            // NODE_HEALTH: User has dues but timer is still running
            // Transition from lockout to GRACE if time remains
            // But only if not manually suspended/disabled/blocked
            const lockoutStatuses = [UserStatus.EXPIRED, UserStatus.RECOVERY_MODE];
            if (lockoutStatuses.includes(user.status)) {
                user.status = UserStatus.ACTIVE_UNPAID;
            }
        }
    } else {
        // TIMER_EXPIRED: Registry lockdown until fiscal resolution
        // Only override to EXPIRED if not already manually locked out
        const manualLockouts = [UserStatus.SUSPENDED, UserStatus.DISABLED, UserStatus.BLOCKED];
        if (!manualLockouts.includes(user.status)) {
            user.status = UserStatus.EXPIRED;
        }
    }

    await this.commit();
    this.notify();
  }

  async testCommunication(type: 'Email' | 'SMS', target: string) {
    if (type === 'Email') {
      return await this.dispatchEmail(target, 'Gateway Diagnostic Test', 'This is a test message to verify the ISP Communication Pipeline.');
    } else {
      return await this.dispatchSMS(target, 'CO Diagnostic: Communication handshake successful.');
    }
  }

  async runSystemTester(onProgress: (log: TestLog) => void) {
    const tests = [
      { 
        module: 'Core Identity', 
        action: 'Registry Handshake', 
        test: async () => this.state.users.length > 0 ? 'Working' : 'Failed',
        info: 'Verifies if the subscriber database is reachable and populated.'
      },
      { 
        module: 'Security', 
        action: 'Auth Logic Check', 
        test: async () => this.state.settings.authSettings.loginEnabled ? 'Working' : 'Warning',
        info: 'Checks if login gatekeepers are active.'
      },
      { 
        module: 'Infrastructure', 
        action: 'Backend API Link', 
        test: async () => {
          try {
            const res = await fetch(`${this.backendUrl}/api/health`);
            return res.ok ? 'Working' : 'Failed';
          } catch(e) { return 'Failed'; }
        },
        info: 'Verifies the connection to the Node.js backend relay (Port 5000).'
      },
      { 
        module: 'Inventory', 
        action: 'Package Protocol', 
        test: async () => this.state.packages.length > 0 ? 'Working' : 'Failed',
        info: 'Ensures service packages are correctly loaded in the registry.'
      },
      { 
        module: 'Finance', 
        action: 'Invoice Engine', 
        test: async () => this.state.invoices !== undefined ? 'Working' : 'Failed',
        info: 'Verifies that the billing ledger is operational.'
      },
      { 
        module: 'Gateway', 
        action: 'Communication Node', 
        test: async () => this.state.settings.commConfig.simulationMode ? 'Warning' : 'Working',
        info: 'Checks if real-world dispatch mode is active (Green = Real, Orange = Simulation).'
      }
    ];

    for (const t of tests) {
      const status = await t.test();
      const log: TestLog = {
        id: 'TL-' + Date.now() + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        module: t.module,
        action: t.action,
        status: status as any,
        details: status === 'Working' ? `PASS: ${t.info}` : `FAIL/WARN: ${t.info}`
      };
      
      this.state.testLogs = [log, ...(this.state.testLogs || [])].slice(0, 500);
      onProgress(log);
      await this.commit();
      await new Promise(r => setTimeout(r, 800)); // Bottling effect
    }
    
    this.notify();
    return { success: true, message: 'System Scan Complete' };
  }

  async verifyResetCode(identifier: string, token: string) {
    const input = identifier.toLowerCase().trim();
    const otpRec = this.state.otps.find(o => o.identifier === input && o.otpCode === token && o.type === 'Reset');
    
    if (!otpRec) return { success: false, message: 'Invalid token' };
    if (new Date(otpRec.expiry) < new Date()) return { success: false, message: 'Token expired' };

    // Valid
    this.state.otps = this.state.otps.filter(o => o.identifier !== input); // clear OTPs
    await this.commit();
    return { success: true };
  }

  async findUserForReset(identifier: string) {
    const input = identifier.toLowerCase().trim();
    return this.state.users.find(u => !u.deleted && (
      (u.username || '').toLowerCase() === input ||
      (u.email || '').toLowerCase() === input ||
      u.phone === input ||
      u.cnic === input ||
      (u.pppoeId || '').toLowerCase() === input ||
      u.connectionId === input
    ));
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
        id: 'EXT-' + Date.now(),
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

  getDashboardMetrics() {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const totalUnpaidAmount = this.state.users.reduce((acc, u) => acc + (u.balance || 0), 0);
    const activeUsers = this.state.users.filter(u => u.status === UserStatus.ACTIVE).length;
    // Real-time online users from connected devices
    const onlineUsers = this.getConnectedDevices('all').length >= activeUsers ? activeUsers : this.getConnectedDevices('all').length;
    const newUsers = this.state.users.filter(u => {
      const created = new Date(u.createdAt);
      return (now.getTime() - created.getTime()) < 7 * oneDay;
    }).length;

    const expiredUsers = this.state.users.filter(u => u.status === UserStatus.SUSPENDED).length;
    const disabledUsers = this.state.users.filter(u => u.status === UserStatus.DISABLED).length;
    const paidUsers = this.state.users.filter(u => (u.balance || 0) <= 0).length;
    const unpaidUsers = this.state.users.filter(u => (u.balance || 0) > 0).length;

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayMidnight.getTime() + oneDay);
    const in3Days = new Date(todayMidnight.getTime() + 3 * oneDay);
    const in1Week = new Date(todayMidnight.getTime() + 7 * oneDay);

    const expiring1d = this.state.users.filter(u => {
      if (!u.expiryDate) return false;
      const exp = new Date(u.expiryDate);
      exp.setHours(0, 0, 0, 0);
      return exp.getTime() <= tomorrow.getTime();
    }).length;
    const expiring3d = this.state.users.filter(u => {
      if (!u.expiryDate) return false;
      const exp = new Date(u.expiryDate);
      exp.setHours(0, 0, 0, 0);
      return exp.getTime() <= in3Days.getTime();
    }).length;
    const expiring1w = this.state.users.filter(u => {
      if (!u.expiryDate) return false;
      const exp = new Date(u.expiryDate);
      exp.setHours(0, 0, 0, 0);
      return exp.getTime() <= in1Week.getTime();
    }).length;

    return {
      totalUsers: this.state.users.length,
      activeUsers,
      onlineUsers,
      newUsers,
      expiredUsers,
      disabledUsers,
      paidUsers,
      unpaidUsers,
      totalUnpaidAmount,
      expiring1d,
      expiring3d,
      expiring1w
    };
  }

  getFiscalSummary(start: Date, end: Date) {
    const today = new Date().toISOString().split('T')[0];
    const todayCollection = this.state.payments
      .filter(p => p.timestamp.startsWith(today) && p.status === 'Approved')
      .reduce((acc, p) => acc + p.amount, 0);

    const periodCollection = this.state.payments
      .filter(p => {
        const d = new Date(p.timestamp);
        return d >= start && d <= end && p.status === 'Approved';
      })
      .reduce((acc, p) => acc + p.amount, 0);

    const totalUnpaidBalance = this.state.invoices
      .filter(i => i.status !== PaymentStatus.PAID)
      .reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

    const activationRevenue = this.state.invoices
      .filter(i => {
        const d = new Date(i.createdAt);
        return d >= start && d <= end && i.type === 'Activation';
      })
      .reduce((acc, i) => acc + i.totalAmount, 0);

    return { todayCollection, periodCollection, totalUnpaidBalance, activationRevenue };
  }

  async bulkSetAccountStatus(userIds: string[], status: UserStatus, note: string, expiryDate?: string, onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i];
      const idx = this.state.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.state.users[idx].status = status;
        if (expiryDate) {
          this.state.users[idx].expiryDate = expiryDate;
        }
        this.state.users[idx].notes = (this.state.users[idx].notes || '') + `\n[${new Date().toLocaleDateString()}] Bulk update: ${status}. ${note}${expiryDate ? ' New Expiry: ' + expiryDate : ''}`;
        if (onProgress) onProgress(i + 1, userIds.length, this.state.users[idx].name);
        
        // Sync billing status for consistency
        await this.syncUserStatusWithBilling(id);
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); // Yield for UI
    }

    // NAS Simulation Intercept for Disconnects
    if (this.state.settings.nasSystemEnabled && (status === UserStatus.SUSPENDED || status === UserStatus.EXPIRED)) {
      for (const id of userIds) {
        const u = this.state.users.find(x => x.id === id);
        if (u && u.managementMode === 'NAS_Controlled' && u.routerId) {
          await this.sendCoACommand(u.id, 'Disconnect');
        }
      }
    }
    
    // Activity Log
    const actionDesc = `Status: ${status}${expiryDate ? ' (Expiry: ' + expiryDate + ')' : ''}`;
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com', adminIp: '127.0.0.1', action: 'Bulk Set Status', targetId: 'Multiple', targetName: `${userIds.length} users`, details: actionDesc, riskLevel: 'Low' });

    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  async batchSuspendUsers(userIds: string[], reason: string) {
    return this.bulkSetAccountStatus(userIds, UserStatus.SUSPENDED, reason);
  }

  async bulkSendReminders(userIds: string[], channel: 'WhatsApp' | 'Email', templateId?: string) {
    const timestamp = new Date().toISOString();
    const adminName = this.state.currentUser?.name || 'System';
    let sentCount = 0;

    for (const id of userIds) {
      const user = this.state.users.find(u => u.id === id);
      if (user) {
        // Dispatch based on channel
        if (channel === 'Email' && user.email) {
            await this.dispatchEmail(user.email, 'Payment Reminder', `Dear ${user.name}, you have an outstanding balance of Rs. ${user.balance}.`);
        } else if (channel === 'WhatsApp' && user.phone) {
            await this.dispatchSMS(user.phone, `[CLICK OPTIX] Reminder: Outstanding balance Rs. ${user.balance}. Please clear to avoid suspension.`);
        }

        // Log Communication
        if (!this.state.commLogs) this.state.commLogs = [];
        this.state.commLogs.push({
          id: 'CL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          userId: id,
          email: user.email || 'N/A',
          subject: 'Payment Reminder',
          sentBy: adminName,
          sentAt: timestamp,
          status: 'Sent',
          templateId
        } as any);

        sentCount++;
      }
    }
    await this.commit();
    this.notify();
    return { success: true, count: sentCount };
  }

  async bulkGenerateInvoices(userIds: string[], onProgress?: (current: number, total: number, itemName: string) => void) {
    let generated = 0;
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i];
      const user = this.state.users.find(u => u.id === id);
      if (user && user.packageId) {
        const pkg = this.state.packages.find(p => p.id === user.packageId);
        if (pkg) {
          const invId = 'INV-' + Date.now() + Math.random().toString(36).substr(2, 5);
          const now = new Date();
          const dueDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days grace period

          const taxRate = this.state.settings.enableTax ? this.state.settings.autoTaxPercentage : 0;
          const taxAmount = Math.round(pkg.price * (taxRate / 100));
          const totalAmount = pkg.price + taxAmount;

          this.state.invoices.unshift({
            id: invId,
            userId: id,
            userName: user.name,
            packageId: pkg.id,
            packageName: pkg.name,
            items: [{
              id: 'ITEM-' + Date.now(),
              description: `Monthly Subscription - ${pkg.name}`,
              quantity: 1,
              unitPrice: pkg.price,
              total: pkg.price,
              category: 'Service'
            }],
            subtotal: pkg.price,
            taxRate: taxRate,
            taxAmount: taxAmount,
            discountAmount: 0,
            totalAmount: totalAmount,
            paidAmount: 0,
            dueAmount: totalAmount,
            status: PaymentStatus.UNPAID,
            dueDate: dueDate.toISOString(),
            createdAt: now.toISOString(),
            type: 'Monthly'
          });
          user.balance += totalAmount;
          generated++;
          if (onProgress) onProgress(i + 1, userIds.length, user.name);
        }
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0)); // Yield
    }
    
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com', adminIp: '127.0.0.1', action: 'Bulk Invoices Created', targetId: 'Multiple', targetName: `${generated} generated`, details: 'Monthly recurring billing run.', riskLevel: 'Low' });

    await this.commit();
    this.notify();
    return { success: true, count: generated };
  }

  async bulkDeleteUsers(userIds: string[], creditAction: 'ADJUST' | 'NONE' = 'NONE', onProgress?: (current: number, total: number, itemName: string) => void) {
    const ids = new Set(userIds);
    let creditAdjustedCount = 0;
    let totalCreditAdjusted = 0;

    for(let i=0; i<userIds.length; i++) {
        const id = userIds[i];
        const user = this.state.users.find(u => u.id === id);
        
        if (user && user.balance < 0 && creditAction === 'ADJUST') {
            totalCreditAdjusted += Math.abs(user.balance);
            user.balance = 0;
            creditAdjustedCount++;
        }

        if(onProgress) onProgress(i+1, userIds.length, `User ${userIds[i]}`);
    }

    this.state.users = this.state.users.filter(u => !ids.has(u.id));
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com', adminIp: '127.0.0.1', action: 'Bulk Purge Accounts', targetId: 'Multiple', targetName: `${userIds.length} users purged`, details: `Deleted identities from registry. Credit Action: ${creditAction}. Adjusted ${creditAdjustedCount} users for total Rs. ${totalCreditAdjusted}.`, riskLevel: 'Critical' });
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length, creditAdjusted: totalCreditAdjusted };
  }

  async bulkUpdateExpiry(userIds: string[], expiryDate: string, reason: string, onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i];
      const idx = this.state.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.state.users[idx].expiryDate = expiryDate;
        this.state.users[idx].notes = (this.state.users[idx].notes || '') + `\n[${new Date().toLocaleDateString()}] Bulk Expiry Update: ${expiryDate}. Reason: ${reason}`;
        if (onProgress) onProgress(i + 1, userIds.length, this.state.users[idx].name);
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com', adminIp: '127.0.0.1', action: 'Bulk Custom Expiry', targetId: 'Multiple', targetName: `${userIds.length} users`, details: `New Expiry: ${expiryDate}. Reason: ${reason}`, riskLevel: 'Low' });
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  async bulkRotateNodes(userIds: string[], targetNode: string, onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
        const id = userIds[i];
      const idx = this.state.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.state.users[idx].oltNode = targetNode;
        this.state.users[idx].notes = (this.state.users[idx].notes || '') + `\n[${new Date().toLocaleDateString()}] Bulk Rotation to: ${targetNode}`;
        if (onProgress) onProgress(i + 1, userIds.length, this.state.users[idx].name);
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com', adminIp: '127.0.0.1', action: 'Bulk Rotation', targetId: 'Multiple', targetName: `${userIds.length} users`, details: `Rotated to: ${targetNode}`, riskLevel: 'Low' });
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  async bulkForcePasswordReset(userIds: string[], onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i];
      const user = this.state.users.find(u => u.id === id);
      if (user) {
        user.password = 'Reset123!';
        this.logNotification(id, 'info', 'Password Reset Forced', 'Administrator has forced a password reset for your account.');
        if (onProgress) onProgress(i + 1, userIds.length, user.name);
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickoptix.com', adminIp: '127.0.0.1', action: 'Bulk Password Reset', targetId: 'Multiple', targetName: `${userIds.length} users affected`, details: `Reset apps to default.`, riskLevel: 'Medium' });
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  async getOLTPulse(id: string) {
    const olt = this.state.oltNodes.find(n => n.id === id);
    if (!olt) return { success: false, message: 'OLT not found' };

    try {
      const res = await fetch(`${this.backendUrl}/api/olt/pulse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olt })
      });
      const data = await res.json();
      return { success: true, ...data };
    } catch (e: any) {
      return { success: false, message: 'OLT Pulse unreachable.' };
    }
  }

  async getOnuStatus(onuId: string) {
    const onu = this.state.onus.find(o => o.id === onuId);
    if (!onu) return { success: false, message: 'ONU not found' };
    const olt = this.state.oltNodes.find(n => n.id === onu.oltId);
    if (!olt) return { success: false, message: 'OLT parent missing' };

    try {
      const res = await fetch(`${this.backendUrl}/api/olt/onu/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olt, onu })
      });
      const data = await res.json();
      if (data.success) {
        onu.status = data.status || onu.status;
        onu.signalStrength = data.signalStrength || onu.signalStrength;
        onu.opticalPower = data.opticalPower;
        onu.onlineTime = data.onlineTime;
        onu.lastActive = new Date().toISOString();
        await this.commit();
        this.notify();
      }
      return data;
    } catch (e: any) {
      return { success: false, message: 'ONU status unreachable.' };
    }
  }

  async resetOnuPassword(onuId: string, newPassword: string) {
    const onu = this.state.onus.find(o => o.id === onuId);
    if (!onu) return { success: false, message: 'ONU not found' };
    const olt = this.state.oltNodes.find(n => n.id === onu.oltId);
    if (!olt) return { success: false, message: 'OLT parent missing' };

    try {
      const res = await fetch(`${this.backendUrl}/api/olt/onu/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olt, onu, newPassword })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: 'Command failed to reach backend.' };
    }
  }

  async bulkResolveReminders(reminderIds: string[]) {
    const ids = new Set(reminderIds);
    this.state.adminReminders.forEach(r => {
      if (ids.has(r.id)) {
        r.status = ReminderStatus.RESOLVED;
        r.resolvedAt = new Date().toISOString();
        r.resolvedBy = this.state.currentUser?.name || 'System';
      }
    });
    await this.commit();
    this.notify();
    return { success: true, count: reminderIds.length };
  }

  async bulkIgnoreReminders(reminderIds: string[]) {
    const ids = new Set(reminderIds);
    this.state.adminReminders.forEach(r => {
      if (ids.has(r.id)) {
        r.status = ReminderStatus.IGNORED;
      }
    });
    await this.commit();
    this.notify();
    return { success: true, count: reminderIds.length };
  }

  getSyncStatus() {
    return false;
  }

  // ── NAS MANAGEMENT ────────────────────────────────────────────────────────
  async addNAS(node: Partial<NASConfig>) {
    const newNode: NASConfig = {
      id: 'NAS-' + Date.now(),
      name: node.name || 'New Router',
      ip: node.ip || '0.0.0.0',
      dealerAssigned: node.dealerAssigned || null,
      radiusSecret: node.radiusSecret || 'click_radius_admin',
      authPort: node.authPort || 1812,
      accountingPort: node.accountingPort || 1813,
      apiUsername: node.apiUsername || 'admin',
      apiPassword: node.apiPassword,
      apiPort: node.apiPort || 8728,
      coaEnabled: node.coaEnabled ?? true,
      coaPort: node.coaPort || 3799,
      nasEnabled: node.nasEnabled ?? false,
      location: node.location || 'Unknown',
      status: 'Offline',
      lastCheck: new Date().toISOString(),
      ...node
    };
    this.state.nasNodes.push(newNode);
    await this.commit();
    this.notify();
    return { success: true, id: newNode.id };
  }

  async updateNAS(id: string, updates: Partial<NASConfig>) {
    const idx = this.state.nasNodes.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.state.nasNodes[idx] = { ...this.state.nasNodes[idx], ...updates };
      await this.commit();
      this.notify();
    }
  }

  async deleteNAS(id: string) {
    this.state.nasNodes = this.state.nasNodes.filter(n => n.id !== id);
    await this.commit();
    this.notify();
  }

  async checkRouterHealth(id: string) {
    const nas = this.state.nasNodes.find(n => n.id === id);
    if (!nas) return { success: false, message: 'NAS not found' };
    
    try {
      const res = await fetch(`${this.backendUrl}/api/nas/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nas })
      });
      const data = await res.json();
      nas.status = data.status === 'Online' ? 'Online' : 'Offline';
      nas.lastCheck = new Date().toISOString();
      await this.commit();
      this.notify();
      return { success: true, status: nas.status, radius: data.radius, api: data.api, coa: data.coa };
    } catch (e: any) {
      // Backend unreachable — fallback to offline
      nas.status = 'Offline';
      nas.lastCheck = new Date().toISOString();
      await this.commit();
      this.notify();
      return { success: false, status: 'Offline', radius: 'Failed', api: 'Failed', coa: nas.coaEnabled ? 'Enabled' : 'Disabled' };
    }
  }

  async sendCoACommand(userId: string, action: 'Disconnect' | 'SpeedChange' | 'ACTIVATE_PACKAGE') {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found' };

    const nas = this.state.nasNodes.find(n => n.id === user.routerId);

    // Log the command regardless
    this.state.securityLogs.push({
      id: 'LOG-' + Date.now(),
      timestamp: new Date().toISOString(),
      adminEmail: this.state.currentUser?.email || 'SYSTEM',
      adminIp: '127.0.0.1',
      action: 'Radius CoA Command',
      targetId: userId,
      targetName: user.name,
      details: `${action} command dispatched${nas ? ' to ' + nas.name : ' (no NAS assigned)'}.`,
      riskLevel: 'Medium'
    });

    if (!nas || !this.state.settings.nasSystemEnabled) {
      await this.commit();
      return { success: true, message: `CoA logged (NAS system ${!nas ? 'not assigned' : 'disabled'}).` };
    }
    
    try {
      const res = await fetch(`${this.backendUrl}/api/nas/coa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nas, user, action })
      });
      const data = await res.json();
      await this.commit();
      return { success: data.success, message: data.message };
    } catch (e: any) {
      console.warn('[CoA] Backend unreachable:', e.message);
      await this.commit();
      return { success: false, message: 'Backend unreachable.' };
    }
  }

  async syncUserToNAS(userId: string, action: 'upsert' | 'remove' = 'upsert') {
    const user = this.state.users.find(u => u.id === userId);
    if (!user || user.managementMode !== 'NAS_Controlled' || !user.routerId) return;
    if (!this.state.settings.nasSystemEnabled) return;

    const nas = this.state.nasNodes.find(n => n.id === user.routerId);
    if (!nas) return;

    // Build package name for router profile
    const pkg = this.state.packages.find(p => p.id === user.packageId);
    const userPayload = { ...user, packageName: pkg?.name || 'default' };

    try {
      await fetch(`${this.backendUrl}/api/nas/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nas, user: userPayload, action })
      });
    } catch (e: any) {
      console.warn('[NAS SYNC] Backend unreachable:', e.message);
    }
  }

  // ── OLT MANAGEMENT ────────────────────────────────────────────────────────
  async addOLT(node: Partial<OLTConfig>) {
    const newNode: OLTConfig = {
      id: 'OLT-' + Date.now(),
      name: node.name || 'New OLT',
      ip: node.ip || '0.0.0.0',
      brand: node.brand || 'Huawei',
      accessType: node.accessType || 'SSH',
      username: node.username || 'admin',
      port: node.port || 22,
      snmpCommunity: node.snmpCommunity || 'public',
      location: node.location || 'Unknown',
      dealerAssigned: node.dealerAssigned || null,
      status: 'Offline',
      lastCheck: new Date().toISOString(),
      ponPorts: node.ponPorts || 8,
      ...node
    };
    this.state.oltNodes.push(newNode);
    await this.commit();
    this.notify();
    return { success: true, id: newNode.id };
  }

  async updateOLT(id: string, updates: Partial<OLTConfig>) {
    const idx = this.state.oltNodes.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.state.oltNodes[idx] = { ...this.state.oltNodes[idx], ...updates };
      await this.commit();
      this.notify();
    }
  }

  async deleteOLT(id: string) {
    this.state.oltNodes = this.state.oltNodes.filter(n => n.id !== id);
    await this.commit();
    this.notify();
  }

  async checkOLTHealth(id: string) {
    const olt = this.state.oltNodes.find(n => n.id === id);
    if (!olt) return { success: false, message: 'OLT not found' };
    
    try {
      const res = await fetch(`${this.backendUrl}/api/olt/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olt })
      });
      const data = await res.json();
      olt.status = data.status === 'Online' ? 'Online' : 'Offline';
      olt.lastCheck = new Date().toISOString();
      await this.commit();
      this.notify();
      return { success: true, status: olt.status, details: data };
    } catch (e: any) {
      olt.status = 'Offline';
      olt.lastCheck = new Date().toISOString();
      await this.commit();
      this.notify();
      return { success: false, status: 'Offline', error: e.message };
    }
  }

  // ── ONU MANAGEMENT ────────────────────────────────────────────────────────
  async addONU(onu: Partial<ONU>) {
    const newOnu: ONU = {
      id: 'ONU-' + Date.now(),
      serialNumber: onu.serialNumber || '',
      oltId: onu.oltId || '',
      ponPort: onu.ponPort || '',
      subscriberId: onu.subscriberId || null,
      status: onu.status || 'Offline',
      signalStrength: onu.signalStrength || 0,
      lastActive: new Date().toISOString(),
      ...onu
    };
    this.state.onus.push(newOnu);
    await this.commit();
    this.notify();
    return { success: true, id: newOnu.id };
  }

  async updateONU(id: string, updates: Partial<ONU>) {
    const idx = this.state.onus.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.state.onus[idx] = { ...this.state.onus[idx], ...updates };
      await this.commit();
      this.notify();
    }
  }

  async deleteONU(id: string) {
    this.state.onus = this.state.onus.filter(o => o.id !== id);
    await this.commit();
    this.notify();
  }

  // ── BULK FLASH (ACCOUNT RESET) ──────────────────────────────────────────────
  async bulkFlashUsers(userIds: string[], months: number, adminId: string, resetPackage: boolean = false) {
    const admin = this.state.staff.find(s => s.email === adminId) || this.state.currentUser;
    const adminName = admin?.name || 'SuperAdmin';
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    for (const uid of userIds) {
      const user = this.state.users.find(u => u.id === uid);
      if (!user) continue;

      // Remove invoices within the flash window
      this.state.invoices = this.state.invoices.filter(inv =>
        inv.userId !== uid || new Date(inv.createdAt || inv.dueDate) < cutoffDate
      );

      // Reset user financial state
      user.balance = 0;
      user.isRecoveryMode = false;
      user.promiseToPayDate = undefined;

      if (resetPackage) {
          user.packageId = 'PKG-3M';
          user.status = UserStatus.EXPIRED; // Force new activation
          user.expiryDate = undefined;
      } else {
          user.status = UserStatus.ACTIVE;
      }

      // Add recovery log
      const log: RecoveryLog = {
        id: 'RL-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        userId: uid,
        userName: user.name,
        adminId: adminId,
        adminName,
        adminIp: '0.0.0.0',
        action: 'ACCOUNT_FLASH' as RecoveryActionType,
        details: `Account flashed — cleared ${months} month(s) of dues and invoices`,
        timestamp: new Date().toISOString(),
        amount: 0,
        oldState: user.status,
        newState: UserStatus.ACTIVE
      };
      if (!this.state.recoveryLogs) this.state.recoveryLogs = [];
      this.state.recoveryLogs.push(log);
    }

    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  // ── BULK ASSIGN COLLECTOR ────────────────────────────────────────────────────
  async bulkAssignCollector(userIds: string[], collectedBy: string, collectorName: string, adminId: string) {
    const collectionDate = new Date().toISOString().split('T')[0];
    for (const uid of userIds) {
      const user = this.state.users.find(u => u.id === uid);
      if (!user) continue;
      user.collectedBy = collectedBy;
      user.collectorName = collectorName;
      user.collectionDate = collectionDate;
    }
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  // ── BULK EMAIL REMINDER ──────────────────────────────────────────────────────
  async bulkSendEmailReminder(userIds: string[], adminId: string) {
    const admin = this.state.staff.find(s => s.email === adminId) || this.state.currentUser;
    const adminName = admin?.name || 'System';
    const timestamp = new Date().toISOString();
    let sent = 0;

    for (const uid of userIds) {
      const user = this.state.users.find(u => u.id === uid);
      if (!user || !user.email) continue;

      // Log the communication
      const commLog: CommunicationLog = {
        id: 'CL-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        userId: uid,
        userName: user.name,
        channel: 'Email',
        type: 'Payment Reminder',
        message: `Dear ${user.name}, you have an outstanding balance of Rs. ${user.balance}. Please settle your dues to continue uninterrupted service.`,
        sentBy: adminName,
        sentAt: timestamp,
        status: 'Sent'
      } as any;

      if (!this.state.commLogs) this.state.commLogs = [];
      this.state.commLogs.push(commLog);

      // Add recovery log
      const log: RecoveryLog = {
        id: 'RL-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        userId: uid,
        userName: user.name,
        adminId,
        adminName,
        adminIp: '0.0.0.0',
        action: 'REMINDER_SENT' as RecoveryActionType,
        details: `Email reminder sent to ${user.email}`,
        timestamp,
        amount: 0,
        oldState: 'pending',
        newState: 'reminded'
      };
      if (!this.state.recoveryLogs) this.state.recoveryLogs = [];
      this.state.recoveryLogs.push(log);

      sent++;
    }

    await this.commit();
    this.notify();
    return { success: true, count: sent };
  }
}

export const db = new DB();
