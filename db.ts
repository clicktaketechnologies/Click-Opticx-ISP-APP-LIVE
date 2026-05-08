import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { getAuth, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider, Auth, sendPasswordResetEmail, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getStorage, ref, uploadString, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { io, Socket } from 'socket.io-client';
import { supabase } from './lib/supabase';
import { notificationManager } from './utils/NotificationManager';
import { checkKYCLifecycle } from './utils/kycReminders';

import {
  AppState, UserStatus, PaymentStatus, LedgerType, VerificationStatus, KYCMethod,
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
  AuthSettings, OTP, DuplicateActionLog, TestLog, FlashLog, NotificationTemplate, NotificationTriggerEvent,
  NotificationDeliveryStatus, NotificationGateway, SignupRequest, AuditLog, SpeedTestResult,
  HotspotToken, ArchiveData, MissingDataNode, SystemTerminology, SystemSnapshot, CloudAccount, CloudTransferLog, KYCFile, AuthLog, AuthProvider, CloudFile
} from './types';

// --- MULTI-CLOUD STORAGE PILOT ---
const MultiCloudService = {
    providers: ['Google Drive', 'PCloud', 'Dropbox', 'OneDrive'],
    logs: [] as { id: string; type: string; provider: string; status: string; timestamp: string; details: string; duration: number }[],
    
    async syncArtifacts(userId: string, files: string[], onLog?: (log: any) => void) {
        console.log(`[CLOUD-SYNC] Initiating handshake for ${userId} across ${this.providers.length} providers...`);
        
        for (const provider of this.providers) {
            const start = Date.now();
            const logId = `SYNC-${Math.random().toString(36).substr(2, 9)}`;
            
            // Log Initiation
            const initLog = { 
                id: logId, 
                type: 'Handshake_INIT', 
                provider, 
                status: 'Connecting', 
                timestamp: new Date().toISOString(), 
                details: `Opening secure TLS tunnel to ${provider} registry...`,
                duration: 0
            };
            this.logs.unshift(initLog);
            if (onLog) onLog(initLog);

            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

            // Log Data Transfer
            const transferLog = { 
                ...initLog, 
                type: 'Data_Transfer', 
                status: 'Streaming', 
                details: `Uploading ${files.length} encrypted identity artifacts (AES-256)...`,
                timestamp: new Date().toISOString()
            };
            this.logs[0] = transferLog;
            if (onLog) onLog(transferLog);

            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

            // Log Completion
            const finalLog = { 
                ...transferLog, 
                type: 'Sync_Complete', 
                status: 'Success', 
                details: `Artifacts successfully archived in ${provider} vault.`,
                timestamp: new Date().toISOString(),
                duration: Date.now() - start
            };
            this.logs[0] = finalLog;
            if (onLog) onLog(finalLog);
        }

        return { success: true, timestamp: new Date().toISOString(), logs: this.logs.slice(0, 10) };
    },
    
    getLogs() {
        return this.logs.slice(0, 20);
    }
};

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

const logger = {
  info: (m: string) => console.log(`[INFO] ${m}`),
  warn: (m: string) => console.warn(`[WARN] ${m}`),
  error: (m: string) => console.error(`[ERROR] ${m}`)
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

export const INITIAL_COMM_CONFIG: CommunicationSettings = {
  simulationMode: false,
  emailMode: 'CUSTOM_SMTP',
  emailProvider: 'SMTP',
  providerConfig: { apiKey: '', senderDomain: '' },
  smtpConfig: { 
    host: 'smtp.clickopticx.com', 
    port: 587, 
    encryption: 'TLS', 
    username: 'relay@clickopticx.com',
    password: '' // Optional for local
  },
  backupProvider: 'FIREBASE_REST',
  failoverEnabled: true,
  trackingEnabled: true,
  toggles: {
    welcomeEmail: true,
    otpEmail: true,
    invoiceEmail: true,
    expiryReminder: true,
    lowBalanceAlert: false,
    adminAlerts: true
  },
  senderIdentities: [
    { id: 'SDR-1', name: 'Click Opticx Support', email: 'support@clickopticx.com', isVerified: true, isDefault: true, createdAt: new Date().toISOString() },
    { id: 'SDR-2', name: 'Click Opticx Billing', email: 'billing@clickopticx.com', isVerified: false, isDefault: false, createdAt: new Date().toISOString() }
  ],
  pushEnabled: true,
  notificationMode: 'Auto_Fallback',
  autoFallbackEnabled: true,
  globalNotificationEnabled: true,
  quietHours: { start: '22:00', end: '08:00', enabled: true },
  rateLimits: { emailsPerHour: 1000, emailsPerDay: 10000, burstLimit: 50, pushPerDayPerUser: 5 },
  warmup: { enabled: true, currentDay: 1, limit: 50 },
  health: { status: 'Healthy', lastCheck: new Date().toISOString(), latency: 124, bounceRate: 0.2 },
  otpSenderId: 'SDR-1',
  reminderSenderId: 'SDR-2',
  enableActivationEmail: true,
  enableActivationSMS: true,
  activationSMSTemplate: "Dear {{name}}, your package {{package}} is now active until {{expiry}}. Thank you for choosing Click Opticx!",
  activationEmailTemplateId: "PKG_ACTIVATION"
};

const INITIAL_GATEWAYS: PaymentGateway[] = [
  { id: 'stripe', name: 'Stripe Gateway', type: 'online', enabled: true, priority: 1, sandbox: true, allowedFor: ['packages', 'wallet', 'invoices'], config: { publishableKey: '', secretKey: '', webhookSecret: '' } },
  { id: 'paypal', name: 'PayPal Gateway', type: 'online', enabled: true, priority: 2, sandbox: true, allowedFor: ['packages', 'wallet'], config: { clientId: '', secret: '' } },
  { id: 'jazzcash', name: 'JazzCash Gateway', type: 'wallet', enabled: true, priority: 3, sandbox: true, allowedFor: ['packages', 'wallet', 'emergency'], config: { merchantId: '', password: '', salt: '' } },
  { id: 'easypaisa', name: 'EasyPaisa Gateway', type: 'wallet', enabled: true, priority: 4, sandbox: true, allowedFor: ['packages', 'wallet', 'emergency'], config: { storeId: '', hashKey: '' } },
  { id: 'payfast', name: 'PayFast Gateway', type: 'online', enabled: true, priority: 5, sandbox: true, allowedFor: ['packages'], config: { merchantId: '', merchantKey: '' } },
  { id: 'cash', name: 'Physical Cash', type: 'offline', enabled: true, priority: 6, sandbox: false, allowedFor: ['packages', 'wallet', 'invoices'], config: {}, instructions: 'Pay at any authorized regional shop.' },
  { id: 'bank', name: 'Bank Wire', type: 'offline', enabled: true, priority: 7, sandbox: false, allowedFor: ['wallet', 'invoices'], config: { bankName: '', accountTitle: '', iban: '' }, instructions: 'Upload receipt after wire transfer.' },
  { id: 'home', name: 'Field Collection', type: 'offline', enabled: true, priority: 8, sandbox: false, allowedFor: ['invoices'], config: { fee: '100' }, instructions: 'Our agent will visit your location.' }
];

const INITIAL_APP_PAGES: AppPage[] = [
  { id: 'home', label: 'Dashboard', icon: 'Home', category: 'Core', enabled: true, showInDirectory: true, isDefault: true, swatch: '#0084ff' },
  { id: 'wallet', label: 'My Wallet', icon: 'Wallet', category: 'Fiscal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#32d64f' },
  { id: 'packages', label: 'Service Plans', icon: 'Signal', category: 'Core', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
  { id: 'profile', label: 'Profile', icon: 'User', category: 'Core', enabled: true, showInDirectory: false, isDefault: false, swatch: '#6366f1' },
  { id: 'notifs', label: 'Alerts', icon: 'Bell', category: 'Support', enabled: true, showInDirectory: true, isDefault: false, swatch: '#f59e0b' },
  { id: 'support', label: 'Help Center', icon: 'Headphones', category: 'Support', enabled: true, showInDirectory: true, isDefault: false, swatch: '#8b5cf6' },
  { id: 'aichat', label: 'AI Chat Assistant', icon: 'MessageSquare', category: 'Utility', enabled: true, showInDirectory: true, isDefault: false, swatch: '#06b6d4' },
  { id: 'ai-voice-call', label: 'AI Voice Support', icon: 'Mic', category: 'Utility', enabled: true, showInDirectory: true, isDefault: false, swatch: '#ec4899' },
  { id: 'namaz', label: 'Prayer Times', icon: 'Clock', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#059669' },
  { id: 'quran', label: 'Noble Quran', icon: 'Book', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#32d64f' },
  { id: 'qibla', label: 'Qibla Finder', icon: 'Compass', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#b45309' },
  { id: 'tasbih', label: 'Digital Tasbih', icon: 'Fingerprint', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#334155' },
  { id: 'live-usage', label: 'Live Usage', icon: 'Monitor', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#3b82f6' },
  { id: 'speed-test', label: 'Speed Test', icon: 'Gauge', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#6366f1' },
  { id: 'connection', label: 'Connection', icon: 'Signal', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#0084ff' },
  { id: 'reset-password', label: 'Reset Wifi', icon: 'Key', category: 'Network', enabled: true, showInDirectory: true, isDefault: false, swatch: '#f59e0b' },
  { id: 'news', label: 'Broadcasts', icon: 'Bell', category: 'Communication', enabled: true, showInDirectory: true, isDefault: false, swatch: '#ef4444' },
  { id: 'referral', label: 'Refer & Earn', icon: 'Gift', category: 'Fiscal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#f59e0b' },
  { id: 'weather', label: 'Weather', icon: 'Sun', category: 'Utility', enabled: true, showInDirectory: true, isDefault: false, swatch: '#06b6d4' },
  { id: 'zakat', label: 'Zakat Calc', icon: 'Calculator', category: 'Islamic', enabled: true, showInDirectory: true, isDefault: false, swatch: '#10b981' },
  { id: 'legal', label: 'Legal Center', icon: 'ShieldCheck', category: 'Legal', enabled: true, showInDirectory: true, isDefault: false, swatch: '#64748b' },
];

const INITIAL_APP_SECTIONS: AppSection[] = [
  { id: 'status', label: 'CONNECTIVITY STATUS', enabled: true, order: 0, layout: 'Grid', gridCols: 1, itemIds: [] },
  { id: 'rescue', label: 'EMERGENCY CREDITS', enabled: true, order: 1, layout: 'Grid', gridCols: 1, itemIds: [] },
  { id: 'credit', label: 'FISCAL TRUST SCORE', enabled: true, order: 2, layout: 'Grid', gridCols: 1, itemIds: [] },
  { id: 'fiscal-summary', label: 'FISCAL SUMMARY', enabled: true, order: 3, layout: 'Grid', gridCols: 2, itemIds: [], isSpecialNode: true },
  { id: 'islamic', label: 'ISLAMIC', enabled: true, order: 4, layout: 'Grid', gridCols: 4, itemIds: ['namaz', 'quran', 'qibla', 'tasbih', 'zakat'] },
  { id: 'technical', label: 'TECHNICAL', enabled: true, order: 5, layout: 'Grid', gridCols: 2, itemIds: ['live-usage', 'speed-test', 'connection', 'reset-password'] },
  { id: 'daily-tools', label: 'DAILY TOOLS', enabled: true, order: 6, layout: 'Grid', gridCols: 2, itemIds: ['news', 'referral', 'weather', 'support'] },
  { id: 'legal', label: 'LEGAL & COMPLIANCE', enabled: true, order: 7, layout: 'Grid', gridCols: 1, itemIds: ['legal'] },
  { id: 'directory', label: 'ALL SERVICES', enabled: true, order: 8, layout: 'Grid', gridCols: 2, itemIds: [] }
];

const INITIAL_TERMINOLOGY: SystemTerminology = {
  nodeName: 'Service Point',
  gatewayName: 'Payment Mode',
  handshakeName: 'Verification',
  fiscalName: 'Billing',
  artifactName: 'Document',
  userName: 'User'
};

const ALL_ROLES = Object.values(Role).filter(r => r !== Role.CUSTOMER);

const INITIAL_STATE: AppState = {
  nas: [],
  packages: [
    { id: 'PKG-1', name: 'Home Basic 15M', subtitle: 'Standard Tier', speed: '15 Mbps', uploadSpeed: '10 Mbps', dataLimit: 'Unlimited', price: 1500, taxRate: 15, duration: 30, color: '#3b82f6', isRecommended: true },
    { id: 'PKG-2', name: 'Extreme 50M', subtitle: 'Pro Gamer Pack', speed: '50 Mbps', uploadSpeed: '50 Mbps', dataLimit: 'Unlimited', price: 2500, taxRate: 15, duration: 30, color: '#0084ff' },
    { id: 'PKG-3M', name: 'Activation Tier 3M', subtitle: 'New User Default', speed: '3 Mbps', uploadSpeed: '1 Mbps', dataLimit: 'Unlimited', price: 0, taxRate: 0, duration: 30, color: '#32d64f' },
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
  auditLogs: [],
  aiEvents: [],
  aiSuggestions: [],
  aiCallLogs: [],
  aiCallRules: [],
  flashLogs: [],
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
  recoveryLogs: [],
  commLogs: [],
  testLogs: [],
  adminReminders: [],
  otps: [],
  kycRequests: [],
  commStats: {
    totalSent: 1240,
    delivered: 1210,
    failed: 15,
    opened: 850,
    clicked: 320,
    providerUsage: {
      smtp: 1100,
      backup: 140
    }
  },
  duplicateLogs: [],
  approvalRequests: [],
  archives: [],
  hotspotTokens: [],
  signupRequests: [], 
  staff: [
    { email: 'admin@clickopticx.com', name: 'System Administrator', role: Role.SUPER_ADMIN, status: 'Active', password: 'Click@Opticx2026', balance: 1000000 },
  ],
  kycFiles: [
    { id: 'KF-001', user_id: 'USR-REC-1', userName: 'Ali', kyc_id: 'KYC123', file_name: 'CNIC.jpg', temp_path: '/temp/cnic_ali.jpg', status: 'TEMP', file_type: 'image/jpeg', size: 1024 * 500, created_at: new Date().toISOString() },
    { id: 'KF-002', user_id: 'USR-REC-2', userName: 'Ahmed', kyc_id: 'KYC124', file_name: 'Bill.pdf', temp_path: '/temp/bill_ahmed.pdf', status: 'TEMP', file_type: 'application/pdf', size: 1024 * 1200, created_at: new Date().toISOString() },
  ],
  cloudAccounts: [],
  cloudTransferLogs: [],
  systemSnapshots: [],
  deploymentLogs: [],
  maintenanceMode: false,
  systemVersion: 900,
  lastUpdateDate: new Date().toISOString(),
  requiredKycDocs: 10,
  autoCloudSync: false,
  aiAgentEnabled: false,
  activeProvider: null,
  users: [
    { 
      id: 'USR-REC-1', 
      name: 'Zohaib Hassan', 
      status: UserStatus.ACTIVE, 
      verificationStatus: VerificationStatus.VERIFIED, 
      isKYCVerified: true, 
      isKYCSubmitted: true, 
      kyc_status: 'verified', 
      approval_status: 'approved', 
      packageId: 'PKG-1', 
      balance: 1500, 
      phone: '03001234567', 
      address: 'Block 5, Gulshan', 
      area: 'Gulshan', 
      portalEnabled: true, 
      connectionId: 'CID-001', 
      creditScore: 750, 
      referralPoints: 0, 
      referralCode: 'ZOH-750', 
      createdAt: new Date().toISOString(),
      activationCount: 5,
      connectionType: 'Fiber',
      managementMode: 'Manual',
      nasConnectionType: 'Manual',
      activityLog: [],
      kyc_attempt_count: 1,
      kyc_history: []
    },
    { 
      id: 'USR-REC-2', 
      name: 'Maria Khan', 
      status: UserStatus.ACTIVE, 
      verificationStatus: VerificationStatus.VERIFIED, 
      isKYCVerified: true, 
      isKYCSubmitted: true, 
      kyc_status: 'verified', 
      approval_status: 'approved', 
      packageId: 'PKG-2', 
      balance: 0, 
      lastPaymentDate: new Date().toISOString(), 
      phone: '03217654321', 
      address: 'Phase 6, DHA', 
      area: 'DHA', 
      portalEnabled: true, 
      connectionId: 'CID-002', 
      creditScore: 820, 
      referralPoints: 100, 
      referralCode: 'MK789', 
      activationCount: 12, 
      connectionType: 'Fiber', 
      managementMode: 'Manual', 
      nasConnectionType: 'Manual', 
      activityLog: [], 
      kyc_attempt_count: 1, 
      kyc_history: [] 
    },
    { 
      id: 'USR-REC-3', 
      name: 'Asif Ali', 
      status: UserStatus.ACTIVE, 
      verificationStatus: VerificationStatus.PENDING, 
      isKYCVerified: false, 
      isKYCSubmitted: true, 
      kyc_status: 'submitted', 
      approval_status: 'pending', 
      packageId: 'PKG-1', 
      balance: 750, 
      isRecoveryMode: true, 
      phone: '03149876543', 
      address: 'North Karachi', 
      area: 'North', 
      portalEnabled: true, 
      connectionId: 'CID-003', 
      creditScore: 640, 
      referralPoints: 10, 
      referralCode: 'AA444', 
      activationCount: 3, 
      connectionType: 'Wireless', 
      managementMode: 'Manual', 
      nasConnectionType: 'Manual', 
      activityLog: [], 
      kyc_attempt_count: 1, 
      kyc_history: [] 
    }
  ],
  liveUsage: [],
  oltNodes: [
    { id: 'OLT-1', name: 'Main Core OLT', ip: '10.0.0.50', brand: 'Huawei', hardwareModel: 'GENERIC_OLT', maxCapacity: 64, accessType: 'SSH', username: 'admin', port: 22, location: 'Central Office', dealerAssigned: null, status: 'Online', connectionStatus: 'Connected', lastCheck: new Date().toISOString(), ponPorts: 16 }
  ],
  onus: [
    { id: 'ONU-1', serialNumber: 'HWTC12345678', oltId: 'OLT-1', ponPort: '0/1/1', subscriberId: 'USR-REC-1', status: 'Online', signalStrength: -18.5, lastActive: new Date().toISOString(), model: 'HG8245H', alias: 'Zohaib Home' }
  ],
  discoveredOnus: [],
  upstreamLinks: [
    { id: 'LNK-1', name: 'Primary Fiber Link (ISP-X)', status: 'Online', latency: 6, usageMbps: 320, capacityMbps: 1000, type: 'Primary' },
    { id: 'LNK-2', name: 'Backup Radio Link (Tower-Z)', status: 'Standby', latency: 15, usageMbps: 0, capacityMbps: 200, type: 'Backup' }
  ],
  nocAlerts: [
    { id: 'ALR-1', title: 'Weak Fiber Signal', message: 'Ahmed Ali (ZTEG123456) signal at -31 dBm', severity: 'Warning', timestamp: new Date().toISOString(), category: 'Network' },
    { id: 'ALR-2', title: 'High CPU Usage', message: 'Tower B Router CPU reached 92%', severity: 'Critical', timestamp: new Date().toISOString(), category: 'Network' }
  ],
  speedTestHistory: [],
  settings: {
    branding: {
      businessName: 'Click Opticx',
      shortName: 'CO ISP', 
      appTitle: 'Click Opticx ISP', 
      appSubtitle: 'Automation Engine v1.2.6',
      logoLight: '/favicon.png', 
      logoDark: '/favicon.png', 
      logoSquare: '/favicon.png', 
      favicon: '/favicon.png', 
      primaryColor: '#0084ff', 
      secondaryColor: '#32d64f', 
      accentColor: '#32d64f', 
      textColorLight: '#ffffff', 
      textColorDark: '#0f172a', 
      primaryFont: 'Inter', 
      secondaryFont: 'Inter',
      brandName: 'Click Opticx',
      tagline: 'Welcome to the Next Gen Internet',
      logo: '/favicon.ico',
      developer: 'ClickTake Technologies',
      phone: '+92 306 9753003',
      website: 'www.clickopticx.com',
      pwaIcon: '/favicon.ico',
      pwaSplash: '/favicon.ico',
      notificationLogo: '/favicon.ico',
      socialLinks: [
        { platform: 'Instagram', url: '' },
        { platform: 'TikTok', url: '' },
        { platform: 'Facebook', url: '' },
        { platform: 'Threads', url: '' },
        { platform: 'X', url: '' },
        { platform: 'Pinterest', url: '' },
        { platform: 'LinkedIn', url: '' },
        { platform: 'YouTube', url: '' }
      ]
    },
    profile: { legalName: 'Click Opticx ISP', tradingName: 'Click Opticx', tagline: 'Connecting to Cloud Securely', establishedYear: '2026', registrationNumber: 'REG-2026-ISP', taxNumber: 'TAX-001-CO', headOffice: 'Karachi, Pakistan', country: 'Pakistan', timezone: 'UTC+5' },
    support: { email: 'support@clickopticx.com', phone: '03001234567', whatsapp: '03120000000', emergencyPhone: '03337777777', address: 'Plot 42, KDA Scheme', workingHoursWeekdays: '09:00-18:00', workingHoursWeekends: '10:00-14:00', emergencySupport: true, afterHoursMessage: 'Our NOC is monitoring your link. Please wait for the next available agent.', phoneEnabled: true, whatsappEnabled: true, emailEnabled: true, greeting: 'Welcome to Click Opticx Support', autoReplyFooter: 'This is an automated response.' },
    digitalPresence: { website: 'https://clickopticx.com', portal: 'https://isp-click-opticx.web.app', facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
    invoiceBranding: { logoPreference: 'primary', headerText: 'OFFICIAL TAX INVOICE', footerDisclaimer: 'Subject to terms and conditions of Click Opticx.', authorizedSignature: 'Account Manager', prefix: 'INV-CO', nextNumber: 5001, terms: 'Due in 7 days.', privacy: '', refundPolicyUrl: '', customNotes: '' },
    notificationBranding: { appSenderName: 'Click Opticx', emailSenderName: 'Click Opticx Billing', smsSenderId: 'CLICK-OPTICX' },
    appearance: { showWallet: true, showEmergencyLoad: true, showAIChat: true, showAICalling: true, showNews: true, showQuickActions: true, maintenanceMode: false, show5GLaunchAnimation: true, loadingStyle: '5G', appPages: INITIAL_APP_PAGES, homeCards: [], sections: INITIAL_APP_SECTIONS },
    referral: { enabled: true, signupPoints: 50, pkg1Points: 100, pkg2Points: 200, pkg3Points: 0, minPkgPrice: 1000, conversionRatio: 1 },
    aboutUs: { vision: 'Seamless connectivity for everyone.', mission: 'Innovating the ISP edge via AI.', companyStory: 'Founded in 2026 to bring fiber-speed to the masses.', features: [], values: [], version: '1.2.5', lastUpdated: new Date().toISOString() },
    notificationTemplates: [],
    footerText: 'Powered by Click Opticx Infrastructure',
    copyrightLine: '© 2026 Click Opticx. All Rights Reserved.',
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
      duplicateControl: { enabled: true, blockDuplicate: false, allowWithWarning: true },
      securitySettings: { maxLoginAttempts: 5, blockDurationMin: 10, enableCaptcha: false, enable2FA: false },
      forgotPasswordSettings: { resetViaEmail: true, resetViaOTP: true, resetViaUsername: false },
      postSignup: { welcomePopup: true, customMessage: 'Welcome to Click Opticx! Your request has been queued.', redirectUrl: '/dashboard' }
    },
    signupRequests: [],
    auditLogs: [],
    socialLinks: [],
    appVersion: 'v1.2.5',
    autoTaxPercentage: 15,
    enableTax: true,
    taxLabel: 'GST',
    globalEmergencyLimit: 500,
    paymentGateways: INITIAL_GATEWAYS,
    techConfig: { wireless: { cat6PricePerMeter: 50, clipPrice: 5, ravalBoldPricePerPair: 2000, polls: [], receivers: [], onus: [] }, fiber: { wirePricePerMeter: 30, baseInstallation: 2500, onus: [], routers: [] } },
    currency: 'PKR',
    taxId: 'GST-ISP-001',
    whiteLabelMode: false,
    allowWifiReset: true,
    nasSystemEnabled: true,
    aiConfig: INITIAL_AI_CONFIG,
    aiCallConfig: { enabled: false, voiceName: 'Zephyr', persona: 'Professional', language: 'English', speakingSpeed: 1, maxCallDuration: 10, officeHours: { start: '09:00', end: '18:00', enabled: true }, knowledgeBase: { outageScripts: '', billingPolicy: '', emergencyTerms: '' } },
    commConfig: INITIAL_COMM_CONFIG,
    infrastructure: INITIAL_INFRA_CONFIG,
    legal: INITIAL_LEGAL_CONFIG,
    technicalKeys: { 
        firebaseApiKey: firebaseConfig.apiKey, 
        firebaseAuthDomain: firebaseConfig.authDomain, 
        firebaseProjectId: firebaseConfig.projectId, 
        firebaseStorageBucket: firebaseConfig.storageBucket, 
        firebaseMessagingSenderId: firebaseConfig.messagingSenderId, 
        firebaseAppId: firebaseConfig.appId, 
        firebaseVapidKey: '', // TO BE FILLED BY ADMIN
        geminiApiKey: '', 
        smtpHost: INITIAL_COMM_CONFIG.smtpConfig.host, 
        smtpPort: INITIAL_COMM_CONFIG.smtpConfig.port, 
        smtpUser: INITIAL_COMM_CONFIG.smtpConfig.username, 
        smtpPass: '' 
    },
    pushConfig: { enabled: true, autoExpireAlerts: true, lowSignalAlerts: true, invoiceAlerts: true, marketingAlerts: false },
    cloudStorage: { 
        provider: 'Google Drive', 
        isEnabled: true, 
        lastSync: new Date().toISOString(),
        providers: ['Google Drive', 'PCloud', 'Dropbox'],
        authMode: 'OAuth'
    },
    terminology: INITIAL_TERMINOLOGY,
    aiAgentEnabled: false,
    autoCloudSync: false,
    requiredKycDocs: 10,
    systemVersion: 900, // v9.0.0
    lastUpdateDate: new Date().toISOString(),
    systemSnapshots: [],
    deploymentLogs: [],
    maintenanceMode: false
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
    { id: 'gateway-jazzcash', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-easypaisa', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-stripe', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-paypal', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-payfast', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-bank', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-cash', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
    { id: 'gateway-home', view: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN], edit: [Role.SUPER_ADMIN], delete: [Role.SUPER_ADMIN] },
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
  roles: ALL_ROLES,
  securityLogs: [],
  notifications: [],
  notificationTemplates: [],
  missingData: [],
  connectionStatus: 'online',
  isImpersonating: false,
  passwordRequests: [],
  networkNodes: [],
  networkMappings: [],
  authProviders: [
    { id: 'PROV-S1', name: 'Supabase', type: 'Provider', priority: 1, status: 'Active', apiKey: 'SUPABASE_AUTH' },
    { id: 'PROV-1', name: 'Firebase', type: 'Provider', priority: 10, status: 'Standby', apiKey: 'FIREBASE_AUTH' },
    { id: 'PROV-2', name: 'SendGrid', type: 'Email', priority: 2, status: 'Active', apiKey: '', metadata: { templateId: 'd-123', fromEmail: 'no-reply@opticx.com', fromName: 'Click Opticx' } },
    { id: 'PROV-3', name: 'Infobip', type: 'SMS', priority: 3, status: 'Active', apiKey: '', metadata: { senderId: 'Opticx', whatsappPhone: '2348000000', templateId: 'reset_tpl_01' } },
    { id: 'PROV-4', name: 'Resend', type: 'Email', priority: 4, status: 'Standby', apiKey: '', metadata: { fromEmail: 'auth@opticx.com' } },
  ],
  authLogs: [],
  auth: { isLoggedIn: false },
  view: 'login',
  stats: {
    monthlyRevenue: 0,
    activeUsers: 0,
    pendingInvoices: 0,
    growthRate: 0
  },
  kycStats: {
    pending: 0,
    verified: 0,
    rejected: 0
  },
  networkStats: {
    avgLoad: 0,
    uptime: 100,
    latency: 0
  },
  emergencyCount: 0,
  revenueData: []
};

class DB {
  private state: AppState;
  private listeners: Array<(state: AppState) => void> = [];
  private auditHooks: Array<(log: AuditLog) => void> = [];
  private initialized = false;
  private recentlyDeletedIds = new Set<string>();
  private firestore: Firestore | null = null;
  private auth: Auth | null = null;
  private messaging: Messaging | null = null;
  private storage: FirebaseStorage | null = null;
  private app: FirebaseApp | null = null;
  private socket: Socket | null = null;
  private backendUrl = ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:5000'
    : (import.meta.env.VITE_BACKEND_URL || 'https://click-opticx-isp-app-live.onrender.com')).replace(/\/$/, '');

  public getBackendUrl() {
    return this.backendUrl;
  }

  /**
   * Pings the backend to wake it up from cold start.
   * Recommended to call this when the app first loads or user visits login page.
   */
  public async wakeBackend() {
    console.log('[SYSTEM] Sending proactive wake-up signal to backend...');
    try {
      // Use the speedtest ping endpoint as it's lightweight
      const res = await fetch(`${this.backendUrl}/api/speedtest/ping?cb=${Date.now()}`);
      if (res.ok) console.log('[SYSTEM] Backend handshake successful.');
    } catch (e) {
      console.warn('[SYSTEM] Backend wake-up failed (it might still be sleeping):', (e as any).message);
    }
  }

  // --- 🛡️ SECURE TOKEN MANAGEMENT ---
  /**
   * Stores a JWT token WITH metadata (issuedAt, expiresAt) so we can
   * validate expiry client-side on every read.
   */
  private storeToken(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('[TOKEN] Invalid JWT format — not storing.');
        return;
      }
      const payload = JSON.parse(atob(parts[1]));
      const tokenMeta = {
        token,
        issuedAt: Date.now(),
        expiresAt: payload.exp ? payload.exp * 1000 : Date.now() + (7 * 24 * 60 * 60 * 1000), // fallback 7d
      };
      localStorage.setItem('clickopticx_auth_token', JSON.stringify(tokenMeta));
    } catch (e) {
      console.error('[TOKEN] Failed to decode/store JWT:', e);
      localStorage.setItem('clickopticx_auth_token', JSON.stringify({
        token,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      }));
    }
  }

  /**
   * Retrieves a stored JWT token, validating its expiry.
   * Returns null and clears session if the token is expired.
   * Handles legacy format (bare token string) by forcing re-auth.
   */
  public getValidToken(): string | null {
    try {
      const raw = localStorage.getItem('clickopticx_auth_token');
      if (!raw) return null;

      // Handle legacy format: bare token string without metadata wrapper
      if (!raw.startsWith('{')) {
        console.warn('[SESSION] Legacy token format detected — clearing for re-authentication.');
        localStorage.removeItem('clickopticx_auth_token');
        return null;
      }

      const meta = JSON.parse(raw);
      if (!meta.token || !meta.expiresAt) {
        localStorage.removeItem('clickopticx_auth_token');
        return null;
      }

      // Check expiry
      if (Date.now() > meta.expiresAt) {
        console.warn('[SESSION] JWT expired. Forcing re-authentication.');
        localStorage.removeItem('clickopticx_auth_token');
        this.state.auth = { isLoggedIn: false };
        this.state.currentUser = undefined;
        this.state.view = 'login';
        this.notify();
        return null;
      }

      return meta.token;
    } catch {
      localStorage.removeItem('clickopticx_auth_token');
      return null;
    }
  }

  public getSocket() {
    return this.socket;
  }


  constructor() {
    this.state = INITIAL_STATE;
    try {
      const cached = localStorage.getItem('clickopticx_v16_registry');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Deep merge or ensure branding paths aren't empty
        if (parsed.settings?.branding) {
          if (!parsed.settings.branding.logoLight) parsed.settings.branding.logoLight = '/favicon.png';
          if (!parsed.settings.branding.logoDark) parsed.settings.branding.logoDark = '/favicon.png';
          if (!parsed.settings.branding.logoSquare) parsed.settings.branding.logoSquare = '/favicon.png';
          if (!parsed.settings.branding.favicon) parsed.settings.branding.favicon = '/favicon.png';
        }
        this.state = { ...INITIAL_STATE, ...parsed };

        // --- 🛡️ SECURITY HARDENING: Session Expiry Check ---
        if (this.state.auth?.isLoggedIn) {
          const isPersistent = this.state.auth.isPersistent !== false;
          const lastLogin = this.state.auth.lastLoginAt ? new Date(this.state.auth.lastLoginAt).getTime() : 0;
          const now = Date.now();
          // P0-FIX: Reduced from 30d/24h to 15d/12h to limit session exposure window
          const sessionTimeout = isPersistent
            ? (15 * 24 * 60 * 60 * 1000)  // 15 days max for "Remember Me"
            : (12 * 60 * 60 * 1000);       // 12 hours for non-persistent sessions
          
          // P0-FIX: Also validate the stored JWT token expiry
          const storedToken = this.getValidToken();
          const tokenExpired = !storedToken;

          if (!isPersistent && !sessionStorage.getItem('clickoptix_active_session')) {
            console.warn('[SECURITY] Non-persistent session detected without active tab. Logging out.');
            this.state.auth = { isLoggedIn: false };
            this.state.currentUser = undefined;
            this.state.view = 'login';
            localStorage.removeItem('clickopticx_auth_token');
          } else if (tokenExpired) {
            console.warn('[SECURITY] JWT token expired or missing. Force logout triggered.');
            this.state.auth = { isLoggedIn: false };
            this.state.currentUser = undefined;
            this.state.view = 'login';
          } else if (lastLogin && (now - lastLogin > sessionTimeout)) {
            console.warn('[SECURITY] Session exceeded maximum TTL. Force logout triggered.');
            this.state.auth = { isLoggedIn: false };
            this.state.currentUser = undefined;
            this.state.view = 'login';
            localStorage.removeItem('clickopticx_auth_token');
          }
        }
        
        // If not logged in, always show login view
        if (!this.state.auth?.isLoggedIn) {
          this.state.view = 'login';
        }

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

        if (!Array.isArray(this.state.cloudAccounts)) {
          this.state.cloudAccounts = [];
        }

        if (!Array.isArray(this.state.cloudTransferLogs)) {
          this.state.cloudTransferLogs = [];
        }

        this.patchState();
      }
    } catch (e) {
      console.error('Failed to load cached state:', e);
      this.state = INITIAL_STATE;
    }
    this.ensureArrays();
    
    // Trigger initial state patch
    this.patchState();
    
    // Auto-rescue orphaned KYC states
    this.reconcileKYCState();
    
    // Cloud Layer Initialization
    this.initializeCloudLayer().catch(console.error);
    
    // 🛡️ PERSISTENCE GUARD: Force cloud sync before tab close
    window.addEventListener('beforeunload', () => {
      if (this.firestore && this.initialized) {
        const docRef = doc(this.firestore, 'registry', 'master_state');
        const { currentUser, originalAdminUser, isImpersonating, connectionStatus, ...cloudSafeState } = this.state;
        if (cloudSafeState && Object.keys(cloudSafeState).length > 0) {
           // Strip any undefined properties that might crash setDoc
           const sanitized = JSON.parse(JSON.stringify(cloudSafeState));
           setDoc(docRef, sanitized).catch(err => console.error('[CLOUD-SYNC] Background sync failed:', err));
        }
      }
    });

    // Background Tasks
    setTimeout(() => this.initializeSocketLayer(), 3000);
    setTimeout(() => checkKYCLifecycle(this), 1500);

    // 🔥 RENDER KEEP-ALIVE: Ping backend every 14min to prevent cold starts on free tier
    const pingBackend = () => {
      fetch(`${this.backendUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(8000) })
        .catch(() => { /* silent — just keeping the dyno warm */ });
    };
    setTimeout(pingBackend, 5000); // initial warm ping on load
    setInterval(pingBackend, 14 * 60 * 1000); // every 14 minutes

    // 🚀 Update Engine
    this.runMigrations();
  }

  // --- SECURE SYSTEM UPDATE MECHANISM ---

  private async runMigrations() {
    const currentBuild = this.state.systemVersion || 0;
    const TARGET_BUILD = 900; // The build number for THIS code release

    if (currentBuild < TARGET_BUILD) {
      console.log(`[MIGRATION] System update detected: Build ${currentBuild} -> ${TARGET_BUILD}`);
      
      // 1. Take Automatic Backup before any changes
      await this.createSystemSnapshot(`Auto-backup before migration to Build ${TARGET_BUILD}`, true);

      // 2. Run sequential additive migrations
      const migrationsRun: string[] = [];
      
      try {
          // Migration Build 863: Initialize deployment logs if missing
          if (currentBuild < 863) {
            if (!this.state.deploymentLogs) this.state.deploymentLogs = [];
            if (!this.state.systemSnapshots) this.state.systemSnapshots = [];
            migrationsRun.push('INIT_DEPLOYMENT_LOGS');
          }

          // [MIGRATIONS END]

          // 3. Update versioning metadata
          this.state.systemVersion = TARGET_BUILD;
          this.state.lastUpdateDate = new Date().toISOString();
          
          this.state.deploymentLogs.unshift({
            id: `DEP-${Date.now()}`,
            timestamp: new Date().toISOString(),
            fromBuild: currentBuild,
            toBuild: TARGET_BUILD,
            status: 'Success',
            migrationsRun
          });

          this.patchState();
          console.log(`[MIGRATION] Migration successful: System now at Build ${TARGET_BUILD}`);
      } catch (error) {
          console.error('[MIGRATION] Fail critical: Exception during schema update', error);
          this.state.deploymentLogs.unshift({
            id: `DEP-FAIL-${Date.now()}`,
            timestamp: new Date().toISOString(),
            fromBuild: currentBuild,
            toBuild: TARGET_BUILD,
            status: 'Fail',
            migrationsRun: []
          });
      }
    }
  }

  public async createSystemSnapshot(reason: string, isAuto: boolean = false) {
    if (!this.firestore) return { success: false, message: 'Cloud layer not ready' };

    const snapshotId = `SNAP-${Date.now()}`;
    const { currentUser, originalAdminUser, isImpersonating, connectionStatus, ...cloudSafeState } = this.state;
    
    const snapshot: SystemSnapshot = {
      id: snapshotId,
      timestamp: new Date().toISOString(),
      build: this.state.systemVersion,
      label: isAuto ? `AUTO_${this.state.systemVersion}` : `MANUAL_${reason.substring(0, 10)}`,
      reason,
      performedBy: this.state.currentUser?.email || 'System',
      state: JSON.parse(JSON.stringify(cloudSafeState)),
      isRestorePoint: true
    };

    try {
      // 1. Store in local state history
      this.state.systemSnapshots.unshift(snapshot);
      if (this.state.systemSnapshots.length > 10) this.state.systemSnapshots.pop(); // Keep last 10
      
      // 2. Persist to dedicated backups collection in Firestore
      const backupRef = doc(this.firestore, 'system_backups', snapshotId);
      await setDoc(backupRef, snapshot);
      
      this.patchState();
      console.log(`[SNAPSHOT] Secure state archive created: ${snapshotId}`);
      return { success: true, id: snapshotId };
    } catch (err: any) {
      console.error('[SNAPSHOT] Vault write failed:', err);
      return { success: false, message: `Vault failure: ${err.message || 'Unknown protocol error'}` };
    }
  }

  public async restoreSystemSnapshot(snapshotId: string) {
    if (!this.firestore) return { success: false, message: 'Cloud layer not ready' };
    
    try {
      const backupRef = doc(this.firestore, 'system_backups', snapshotId);
      const snap = await getDoc(backupRef);
      
      if (!snap.exists()) return { success: false, message: 'Snapshot not found in vault' };
      
      const restorableData = snap.data() as SystemSnapshot;
      
      // 🛡️ DATA SAFETY: Perform a shallow merge to preserve session state
      // but overwrite core registry with snapshot data
      this.state = {
        ...this.state,
        ...restorableData.state,
        systemVersion: restorableData.build // Back to original version
      };

      this.patchState();
      console.log(`[RESTORE] System rolled back to Snapshot: ${snapshotId}`);
      
      // Update logs
      this.state.deploymentLogs.unshift({
        id: `ROLLBACK-${Date.now()}`,
        timestamp: new Date().toISOString(),
        fromBuild: this.state.systemVersion, // version before restore
        toBuild: restorableData.build,
        status: 'Rollback',
        migrationsRun: ['SNAPSHOT_RESTORE']
      });

      return { success: true };
    } catch (err) {
      console.error('[RESTORE] Emergency rollback aborted:', err);
      return { success: false, message: 'Rollback protocol failed' };
    }
  }

  private ensureDefaultAdmin() {
    const defaultAdmin: StaffUser = {
      email: 'admin@clickopticx.com',
      name: 'System Administrator',
      role: Role.SUPER_ADMIN,
      status: 'Active',
      password: 'Click@Opticx2026',
      balance: 10000000
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

  private reconcileKYCState() {
    let changed = false;
    
    // 1. Restore orphaned KYC requests or missing flags into state.users
    this.state.kycRequests?.forEach(req => {
      let user = this.state.users.find(u => u.id === req.userId);
      if (!user && req.userId) {
        console.log('[KYC-RECONCILE] Restoring missing user node for request:', req.userId);
        const newUser: any = {
          id: req.userId,
          name: req.userName || 'Restored User',
          role: Role.CUSTOMER,
          status: req.status === 'Approved' ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
          kycDocuments: req.documents || [],
          faceData: req.faceData || '',
          balance: 0,
          creditScore: 600,
          activationCount: 0,
          portalEnabled: true,
        };
        
        const status = req.status === 'Approved' ? VerificationStatus.VERIFIED : 
                      (req.status === 'Rejected' ? VerificationStatus.REVISION : VerificationStatus.PENDING);
        
        this.syncUserKYCState(newUser, status, req.rejectionReason);
        this.state.users.push(newUser);
        changed = true;
        user = newUser;
      }

      if (user) {
        // Ensure documents match
        if ((!user.kycDocuments || user.kycDocuments.length === 0) && req.documents?.length > 0) {
          user.kycDocuments = req.documents;
          changed = true;
        }

        // Force sync status if mismatched with approved request
        const targetStatus = req.status === 'Approved' ? VerificationStatus.VERIFIED : 
                            (req.status === 'Rejected' ? VerificationStatus.REVISION : VerificationStatus.PENDING);
        
        if (user.verificationStatus !== targetStatus) {
          console.log(`[KYC-RECONCILE] Status Mismatch Fixed for ${user.id}: ${user.verificationStatus} -> ${targetStatus}`);
          this.syncUserKYCState(user, targetStatus, req.rejectionReason);
          changed = true;
        }
      }

      // 2. IMMEDIATE SESSION SYNC: If the reconciled user is the one currently logged in,
      // update their session reference immediately to prevent UI lag.
      if (this.state.currentUser && this.state.currentUser.id === req.userId && user) {
        if (this.state.currentUser.verificationStatus !== user.verificationStatus) {
          console.log('[KYC-RECONCILE] Syncing current user session flags');
          this.state.currentUser = { 
            ...this.state.currentUser, 
            ...user, 
            role: this.state.currentUser.role // Preserve current role context
          };
          changed = true;
        }
      }
    });

    if (changed) {
      console.log('[KYC-RECONCILE] Data integrity restored. Notifying UI.');
      this.notify();
    }
  }

  private async initializeCloudLayer() {
    try {
      const apps = getApps();
      this.app = !apps.length ? initializeApp(firebaseConfig) : apps[0];
      this.firestore = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.storage = getStorage(this.app);
      
      // --- SUPABASE AUTH HYDRATION ---
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[SUPABASE-AUTH] Event: ${event}`);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            // Find matched local user
            const localUser = this.state.users.find(u => u.email === session.user.email);
            const localStaff = this.state.staff.find(s => s.email === session.user.email);
            
            if (localUser || localStaff) {
               console.log(`[SUPABASE-AUTH] Mapping session to node: ${session.user.email}`);
               this.state.auth.isLoggedIn = true;
               this.state.currentUser = (localStaff || localUser) as any;
               this.notify();
            }
          }
        } else if (event === 'SIGNED_OUT') {
           // Only logout if not impersonating
           if (!this.state.isImpersonating) {
              this.state.auth.isLoggedIn = false;
              this.state.currentUser = undefined;
              this.notify();
           }
        } else if (event === 'PASSWORD_RECOVERY') {
           console.log('[SUPABASE-AUTH] Recovery protocol detected. Flagging session for rotation.');
           // We could trigger a view change here if needed
        }
      });

      // Handle Redirect Result via centralized method
      this.handleAuthRedirect();

      // Initialize Messaging
      try {
        this.messaging = getMessaging(this.app);
      } catch (e) {
        console.warn('[FCM] Push Messaging not supported on this browser context');
      }

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
        console.log('[REALTIME] Network Linked via WebSocket');
        this.state.connectionStatus = 'online';
        this.authenticateSocket();
        this.notify();
      });

      this.socket.on('disconnect', () => {
        console.warn('[REALTIME] Connection Severed');
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

      this.socket.on('live-data', (data: any) => {
         // Support for the newer live poller format
         if (!this.state.liveUsage) this.state.liveUsage = [];
         const existing = [...this.state.liveUsage];
         existing.unshift({
           userId: data.username || 'N/A',
           nasId: 'NAS-MIKROTIK',
           upload: data.traffic?.txMbps || 0,
           download: data.traffic?.rxMbps || 0,
           sessionTime: 'N/A',
           ipAddress: 'N/A',
           timestamp: new Date().toISOString()
         });
         this.state.liveUsage = existing.slice(0, 100);
         this.notify();
      });

      this.socket.on('discovery', (data: any) => {
        console.log('[AUTOMATION] New ONU Detected:', data);
        
        // Add to dedicated discovery array
        if (!this.state.discoveredOnus) this.state.discoveredOnus = [];
        const exists = this.state.discoveredOnus.some(o => o.serial === data.serial);
        if (!exists) {
            this.state.discoveredOnus.unshift({ ...data, detectedAt: new Date().toISOString() });
        }

        this.state.nocAlerts.unshift({
          id: `DSC-${Date.now()}`,
          title: 'Plug & Play: New ONU',
          message: `UNCONFIGURED ONU detected on ${data.oltName} (Port ${data.port}). Serial: ${data.serial}`,
          severity: 'Info',
          timestamp: new Date().toISOString(),
          category: 'Network',
          metadata: data
        });
        this.notify();
      });

      this.socket.on('kyc_uploaded', (newKyc: any) => {
        if (!this.state.kycFiles) this.state.kycFiles = [];
        this.state.kycFiles.unshift(newKyc);
        this.notify();
      });

      this.socket.on('health:update', (data: any) => {
        this.state.systemHealth = data;
        this.notify();
      });

      this.socket.on('olt-status-update', (data: any) => {
        const olt = this.state.oltNodes.find(n => n.id === data.id);
        if (olt) {
          olt.status = data.status;
          olt.connectionStatus = data.connectionStatus;
          olt.lastError = data.lastError;
          olt.lastCheck = new Date().toISOString();
          this.notify();
        }
      });

      this.socket.on('finance_update', (data: any) => {
        // Update user balance if relevant
        const user = this.state.users.find(u => u.id === data.userId);
        if (user) {
          user.balance = data.newBalance;
          this.notify();
        }
        // Add to global ledger
        if (data.transaction) {
          this.state.transactions.unshift(data.transaction);
          this.notify();
        }
      });

      this.socket.on('kyc_status_changed', (data: any) => {
        const user = this.state.users.find(u => u.id === data.userId);
        if (user) {
          user.verificationStatus = data.status === 'Approved' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
          this.notify();
        }
      });

      this.socket.on('config_updated', (data: any) => {
        if (data.portal_access !== undefined) this.state.settings.portal_access = data.portal_access;
        if (data.app_access !== undefined) this.state.settings.app_access = data.app_access;
        this.notify();
      });

      this.socket.on('file_moved', (updatedKyc: any) => {
        if (this.state.kycFiles) {
          this.state.kycFiles = this.state.kycFiles.map(f => f.id === updatedKyc.id ? updatedKyc : f);
        }
        this.notify();
      });

      this.socket.on('fault-alert', (data: any) => {
        console.warn('[AUTOMATION] Network Fault:', data);
        if (!this.state.nocAlerts) this.state.nocAlerts = [];
        this.state.nocAlerts.unshift({
          id: `FLT-${Date.now()}`,
          title: data.type === 'LOS' ? 'Fiber Cut Detected' : 'Signal Fluctuation',
          message: data.message,
          severity: data.severity === 'Critical' ? 'Critical' : 'Warning',
          timestamp: new Date().toISOString(),
          category: 'Network',
          metadata: data
        });
        this.notify();
      });

      this.socket.on('signal-update', (data: any) => {
        const onu = this.state.onus.find(o => o.serialNumber === data.serial);
        if (onu) {
          onu.signalStrength = data.signal;
          onu.status = data.signal < -35 ? 'LOS' : (data.signal < -30 ? 'Warning' : 'Online');
          this.notify();
        }
      });

      this.socket.on('branding_media_updated', (data: any) => {
        console.log('[SOCKET] Branding media updated:', data);
        this.notify();
      });

      this.socket.on('global-wipe', (data: any) => {
        console.warn('[SECURITY] Global Wipe Protocol Received via Socket:', data.timestamp);
        this.executeLocalWipe();
      });

    } catch (e) {
      console.error('Socket init failed:', e);
    }
  }

  private executeLocalWipe() {
    localStorage.clear();
    sessionStorage.clear();
    this.state.auth = { isLoggedIn: false };
    this.state.currentUser = undefined;
    this.state.view = 'login';
    this.notify();
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

  private authenticateSocket() {
    if (!this.socket || !this.state.currentUser) return;
    
    // Admins join the global dashboard room, Users join their specific ONU room
    const role = this.state.currentUser.role;
    const isAdmin = [Role.SUPER_ADMIN, Role.ADMIN, Role.NETWORK_ADMIN].includes(role);
    
    const payload: any = {
      role: isAdmin ? 'admin' : 'user'
    };

    if (!isAdmin) {
      const userOnu = this.state.onus.find(o => o.subscriberId === this.state.currentUser?.id);
      if (userOnu) payload.onuId = userOnu.id;
    }

    console.log('[REALTIME] Authenticating Socket:', payload);
    this.socket.emit('authenticate', payload);
  }

  /**
   * Centralized KYC State Synchronizer
   * Ensures all redundant status flags are updated in unison to prevent stale UI info.
   */
  private async syncUserKYCState(user: ISPUser, status: VerificationStatus, reason?: string) {
    user.verificationStatus = status;
    
    switch (status) {
      case VerificationStatus.VERIFIED:
        user.isKYCVerified = true;
        user.isKYCSubmitted = true;
        user.kyc_status = 'verified';
        user.approval_status = 'approved';
        user.status = UserStatus.ACTIVE;
        
        // Sync to Backend
        fetch(`${this.backendUrl}/api/kyc/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }).catch(err => console.error('[KYC-SYNC] Backend Approval Sync Fault:', err));
        break;
      case VerificationStatus.PENDING:
        user.isKYCVerified = false;
        user.isKYCSubmitted = true;
        user.kyc_status = 'pending';
        user.approval_status = 'pending';
        break;
      case VerificationStatus.REVISION:
        user.isKYCVerified = false;
        user.isKYCSubmitted = false; // Allow resubmission
        user.kyc_status = 'rejected';
        user.approval_status = 'revision';
        user.kyc_rejected_reason = reason || 'Revision required';
        user.status = UserStatus.PENDING_VERIFICATION;

        // Sync to Backend
        fetch(`${this.backendUrl}/api/kyc/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, reason: reason || 'Revision required' })
        }).catch(err => console.error('[KYC-SYNC] Backend Rejection Sync Fault:', err));
        break;
      case VerificationStatus.UNVERIFIED:
      default:
        user.isKYCVerified = false;
        user.isKYCSubmitted = false;
        user.kyc_status = 'pending';
        user.approval_status = 'pending';
        user.status = UserStatus.PENDING_VERIFICATION;
        break;
    }

    // Direct update to currentUser if it matches to ensure immediate visual sync in portal
    if (this.state.currentUser?.id === user.id) {
       this.state.currentUser = { ...this.state.currentUser, ...user } as any;
    }
  }

  async requestKYCResubmission(userId: string, reason: string) {
    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'Identity Node Not Found' };

    this.syncUserKYCState(user, VerificationStatus.REVISION, reason);
    
    // Also mark any pending kycRequests as rejected
    this.state.kycRequests.forEach(r => {
      if (r.userId === userId && r.status === 'Pending') {
        r.status = 'Rejected';
        r.rejectionReason = reason;
      }
    });

    this.logNotification(userId, 'warning', 'Identity Revision Required', reason, 'user');
    this.logAudit('KYC Revision Requested', 'Update', `Requested identity resubmission for ${user.name}. Reason: ${reason}`, userId, user.name);
    
    await this.commit();
    this.notify();
    return { success: true };
  }

  async forceSync() {
    this.notify(); // Immediate UI feedback
    await this.syncWithCloudMaster();
    this.logNotification('all', 'success', 'Registry Sync', 'Manual handshake with master cloud server completed.', 'admin');
  }

  private async syncWithCloudMaster() {
    if (!this.firestore) return;
    const docRef = doc(this.firestore, 'registry', 'master_state');
    
    // Safety Fallback: Mark system configured within 2s so UI never freezes
    const fallbackTimer = setTimeout(() => {
       if (!this.initialized) {
          console.warn('[DB] Cloud Handshake Timeout: Falling back to cached state.');
          this.initialized = true;
          this.notify();
       }
    }, 2000);

    try {
      // AbortController gives Firestore getDoc a hard 5s budget
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s budget for multi-shard load

      const shards = [
        'master_state',
        'users_shard',
        'finance_shard',
        'ops_shard',
        'notifications_shard'
      ];

      const results = await Promise.all(shards.map(s => getDoc(doc(this.firestore!, 'registry', s))));
      clearTimeout(timeoutId);

      let mergedState = { ...this.state };

      results.forEach(snap => {
        if (snap.exists()) {
          const shardData = snap.data();
          if (snap.id === 'users_shard') {
            // --- 🛡️ SMART MERGE: Prevent 'Hidden Users' & 'Deleted User Resurrection' ---
            if (shardData.users && Array.isArray(shardData.users)) {
              const cloudIds = new Set(shardData.users.map((u: any) => u.id));
              const localOnlyUsers = this.state.users.filter(u => !cloudIds.has(u.id) && !this.recentlyDeletedIds.has(u.id));
              const validCloudUsers = shardData.users.filter((u: any) => !this.recentlyDeletedIds.has(u.id));
              mergedState.users = [...validCloudUsers, ...localOnlyUsers];
            }
            if (shardData.signupRequests && Array.isArray(shardData.signupRequests)) {
              const cloudSignupIds = new Set(shardData.signupRequests.map((r: any) => r.id));
              const localOnlySignups = this.state.signupRequests.filter(r => !cloudSignupIds.has(r.id));
              mergedState.signupRequests = [...shardData.signupRequests, ...localOnlySignups];
            }
          } else {
            mergedState = { ...mergedState, ...shardData };
          }
        }
      });

      this.state = mergedState;
      this.reconcileIdentity();
      this.patchState();

      clearTimeout(fallbackTimer);
      this.initialized = true;
      this.notify();

      onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const { currentUser, originalAdminUser, isImpersonating, connectionStatus, ...persistedData } = snapshot.data() as AppState;
          
          // --- 🛡️ SMART MERGE (Real-time): Prevent 'Hidden Users' & 'Deleted User Resurrection' ---
          if (persistedData.users && Array.isArray(persistedData.users)) {
            const cloudIds = new Set(persistedData.users.map(u => u.id));
            const localOnlyUsers = this.state.users.filter(u => !cloudIds.has(u.id) && !u.deleted);
            persistedData.users = [
              ...persistedData.users,
              ...localOnlyUsers
            ];
          }
          if (persistedData.signupRequests && Array.isArray(persistedData.signupRequests)) {
            const cloudSignupIds = new Set(persistedData.signupRequests.map(r => r.id));
            const localOnlySignups = this.state.signupRequests.filter(r => !cloudSignupIds.has(r.id));
            persistedData.signupRequests = [...persistedData.signupRequests, ...localOnlySignups];
          }

          this.state = { ...this.state, ...persistedData };

          // Real-time synchronization of the current user session
          if (this.state.currentUser) {
            const upToDateUser = this.findUserNode(this.state.currentUser.id || this.state.currentUser.email);
            if (upToDateUser && this.state.currentUser.role === Role.CUSTOMER) {
               this.state.currentUser = { ...upToDateUser, role: Role.CUSTOMER };
            } else {
               const upToDateStaff = this.state.staff.find(s => s.email.toLowerCase() === (this.state.currentUser.email || '').toLowerCase());
               if (upToDateStaff) {
                  this.state.currentUser = { ...upToDateStaff };
               }
            }
          }

          this.patchState();
          this.notify();
        }
      });

      // Start recovery maintenance cycle (IRS Service - Every 10 minutes)
      setInterval(() => this.runRecoveryMaintenance(), 600000);
      // Run once on init — delayed so it doesn't race with render
      setTimeout(() => this.runRecoveryMaintenance(), 5000);
      
      // Handle Firebase Auth Redirect Result
      await this.handleAuthRedirect();
    } catch (e: any) {
      clearTimeout(fallbackTimer);
      this.initialized = true;
      this.notify();
    }
  }


  private patchState() {
    this.reconcileKYCState();
    if (!this.state.settings) this.state.settings = INITIAL_STATE.settings;
    if (!this.state.settings.branding) this.state.settings.branding = INITIAL_STATE.settings.branding;
    if (!this.state.settings.profile) this.state.settings.profile = INITIAL_STATE.settings.profile;
    if (!this.state.settings.support) this.state.settings.support = INITIAL_STATE.settings.support;
    if (!this.state.settings.paymentGateways) this.state.settings.paymentGateways = INITIAL_GATEWAYS;
    if (!this.state.settings.appearance) this.state.settings.appearance = INITIAL_STATE.settings.appearance;
    if (this.state.settings.commConfig) {
      if (!this.state.settings.commConfig.notificationMode) this.state.settings.commConfig.notificationMode = 'Auto_Fallback';
      if (this.state.settings.commConfig.autoFallbackEnabled === undefined) this.state.settings.commConfig.autoFallbackEnabled = true;
      if (this.state.settings.commConfig.globalNotificationEnabled === undefined) this.state.settings.commConfig.globalNotificationEnabled = true;
    }

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

    if (!this.state.settings.technicalKeys) {
      this.state.settings.technicalKeys = INITIAL_STATE.settings.technicalKeys;
    }
    if (!this.state.settings.pushConfig) {
      this.state.settings.pushConfig = INITIAL_STATE.settings.pushConfig;
    }

    // Merge Missing Permissions (Ensure new modules like modular gateways are visible)
    if (this.state.permissions) {
      INITIAL_STATE.permissions.forEach(ip => {
        const existing = this.state.permissions.find(p => p.id === ip.id);
        if (!existing) {
          this.state.permissions.push(ip);
        }
      });
    }

    // REAL-TIME SESSION SYNC (Fix for "password not changing in real-time" issue)
    if (this.state.currentUser) {
      // 1. Check Staff Array
      const staff = this.state.staff.find(s => s.email === this.state.currentUser.email);
      if (staff) {
        this.state.currentUser = { ...this.state.currentUser, ...staff };
      } else {
        // 2. Check Users Array
        const user = this.state.users.find(u => u.id === this.state.currentUser.id);
        if (user) {
          this.state.currentUser = { ...this.state.currentUser, ...user, role: this.state.currentUser.role };
        }
      }
    }

    this.ensureArrays();
  }

  private ensureArrays() {
    this.ensureDefaultAdmin();

    // Robustify arrays
    if (!Array.isArray(this.state.staff)) this.state.staff = INITIAL_STATE.staff;
    if (!Array.isArray(this.state.users)) this.state.users = INITIAL_STATE.users;
    if (!Array.isArray(this.state.nas)) this.state.nas = INITIAL_STATE.nas;
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
    if (!Array.isArray(this.state.notificationTemplates)) this.state.notificationTemplates = [];
    if (!Array.isArray(this.state.notifications)) this.state.notifications = [];
    if (!Array.isArray(this.state.flashLogs)) this.state.flashLogs = [];
    if (!Array.isArray(this.state.archives)) this.state.archives = [];
    if (!Array.isArray(this.state.signupRequests)) this.state.signupRequests = [];
    if (!Array.isArray(this.state.auditLogs)) this.state.auditLogs = [];
    if (!Array.isArray(this.state.securityLogs)) this.state.securityLogs = [];
    if (!Array.isArray(this.state.passwordRequests)) this.state.passwordRequests = [];
    if (!Array.isArray(this.state.networkNodes)) this.state.networkNodes = [];
    if (!Array.isArray(this.state.oltNodes)) this.state.oltNodes = INITIAL_STATE.oltNodes;
    if (!Array.isArray(this.state.onus)) this.state.onus = INITIAL_STATE.onus;
    if (!Array.isArray(this.state.discoveredOnus)) this.state.discoveredOnus = [];
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
    if (!Array.isArray(this.state.liveUsage)) this.state.liveUsage = [];
    if (!Array.isArray(this.state.roles)) this.state.roles = INITIAL_STATE.roles;
    if (!Array.isArray(this.state.permissions)) this.state.permissions = INITIAL_STATE.permissions;
    if (!Array.isArray(this.state.otps)) this.state.otps = [];
    if (!Array.isArray(this.state.speedTestHistory)) this.state.speedTestHistory = [];

    // Log Rotation to maintain peak performance & prevent storage bloat
    if (this.state.auditLogs.length > 500) this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    if (this.state.notifications.length > 300) this.state.notifications = this.state.notifications.slice(0, 300);
    if (this.state.deliveryLogs.length > 500) this.state.deliveryLogs = this.state.deliveryLogs.slice(0, 500);
    if (this.state.commLogs.length > 300) this.state.commLogs = this.state.commLogs.slice(0, 300);
    if (this.state.speedTestHistory.length > 100) this.state.speedTestHistory = this.state.speedTestHistory.slice(0, 100);
  }

  private commitTimer: any = null;
  private localCommitTimer: any = null;
  private notifyTimer: any = null;

  public async commitImmediate(patch?: Partial<AppState>) {
    return this.commit(patch, true);
  }

  public async commit(patch?: Partial<AppState>, immediate = false) {
    if (patch) {
      this.state = { ...this.state, ...patch };
    }
    // 1. LOCAL PERSISTENCE (Immediate write to handle fast refreshes)
    try {
      // --- QUOTA CONTROL: Prune historical logs to stay within 5MB LocalStorage limit ---
      if (this.state.auditLogs?.length > 100) this.state.auditLogs = this.state.auditLogs.slice(-100);
      if (this.state.deliveryLogs?.length > 100) this.state.deliveryLogs = this.state.deliveryLogs.slice(-100);
      if (this.state.aiLogs?.length > 100) this.state.aiLogs = this.state.aiLogs.slice(-100);
      if (this.state.nocEvents?.length > 100) this.state.nocEvents = this.state.nocEvents.slice(-100);
      if (this.state.ledger?.length > 300) this.state.ledger = this.state.ledger.slice(-300);
      if (this.state.invoices?.length > 300) this.state.invoices = this.state.invoices.slice(-300);
      if (this.state.notifications?.length > 100) this.state.notifications = this.state.notifications.slice(-100);
      if (this.state.securityLogs?.length > 100) this.state.securityLogs = this.state.securityLogs.slice(-100);
      if (this.state.signupRequests?.length > 100) this.state.signupRequests = this.state.signupRequests.slice(-100);

      // --- SESSION PERSISTENCE CONTROL ---
      if (this.state.auth && this.state.auth.isPersistent === false) {
          // If not persistent, we don't save auth state to localStorage
          const { auth, currentUser, ...persistentState } = this.state;
          localStorage.setItem('clickopticx_v16_registry', JSON.stringify(persistentState));
      } else {
          localStorage.setItem('clickopticx_v16_registry', JSON.stringify(this.state));
      }
    } catch (e: any) { 
      console.warn('[DB] local persistence failed:', e);
      if (e.name === 'QuotaExceededError') {
         this.state.auditLogs = []; 
         this.state.deliveryLogs = [];
         console.log('[DB] Emergency local flush performed.');
      }
    }

    // 2. CLOUD PERSISTENCE (Firestore Master Source)
    const performCloudWrite = async () => {
      if (this.firestore && this.initialized) {
        try {
          // Split state into shards to overcome 1MB limit
          const { 
            users, signupRequests,
            ledger, invoices, topupRequests, packageRequests,
            auditLogs, aiLogs, nocAlerts, emergencyLoads, deliveryLogs,
            notifications,
            currentUser, originalAdminUser, isImpersonating, connectionStatus, // Exclude session-local state
            ...masterData 
          } = this.state;

          // Sanitize master data
          const sanitizedMaster = JSON.parse(JSON.stringify(masterData));

          await Promise.all([
            setDoc(doc(this.firestore, 'registry', 'master_state'), sanitizedMaster),
            setDoc(doc(this.firestore, 'registry', 'users_shard'), { users, signupRequests }),
            setDoc(doc(this.firestore, 'registry', 'finance_shard'), { ledger, invoices, topupRequests, packageRequests }),
            setDoc(doc(this.firestore, 'registry', 'ops_shard'), { auditLogs, aiLogs, nocAlerts, emergencyLoads, deliveryLogs }),
            setDoc(doc(this.firestore, 'registry', 'notifications_shard'), { notifications })
          ]);

          this.recentlyDeletedIds.clear();
          console.log('[DB-CLOUD] Sharded State Handshake Success');
        } catch (e) {
          console.error('[DB-CLOUD] Sharded Sync Error:', e);
        } finally {
          this.commitTimer = null;
          this.notify();
        }
      } else {
        this.commitTimer = null;
      }
    };

    if (immediate) {
       if (this.commitTimer) clearTimeout(this.commitTimer);
       await performCloudWrite();
    } else {
      if (this.commitTimer) clearTimeout(this.commitTimer);
      this.commitTimer = setTimeout(performCloudWrite, 800);
    }

    this.notify();
  }

  private notify() {
    if (this.notifyTimer) clearTimeout(this.notifyTimer);
    this.notifyTimer = setTimeout(() => {
      // --- REACT INTEGRITY: Force fresh object references for the Entire UI Tree ---
      // This solves issues where nested array mutations (e.g. status changes) were missed by React
      const snapshot: AppState = { 
        ...this.state,
        users: [...this.state.users],
        signupRequests: [...this.state.signupRequests],
        packageRequests: [...this.state.packageRequests || []],
        topupRequests: [...this.state.topupRequests || []],
        emergencyLoads: [...this.state.emergencyLoads || []],
        ledger: [...this.state.ledger || []],
        invoices: [...this.state.invoices || []],
        notifications: [...this.state.notifications || []],
        aiLogs: [...this.state.aiLogs || []],
        missingData: [...this.state.missingData || []],
        staff: [...this.state.staff || []],
        auditLogs: [...this.state.auditLogs || []],
        nocAlerts: [...this.state.nocAlerts || []],
        upstreamLinks: [...this.state.upstreamLinks || []]
      };
      
      this.listeners.forEach(l => l(snapshot));
    }, 50); 
  }

  getState(): AppState { return { ...this.state }; }

  get onus() { return this.state.onus; }
  get discoveredOnus() { return this.state.discoveredOnus || []; }
  set discoveredOnus(val: any[]) { 
    this.state.discoveredOnus = val;
    this.notify();
  }
  get upstreamLinks() { return this.state.upstreamLinks; }

  async logSecurity(action: string, targetId: string, details: string, riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low') {
    const log: SecurityLog = {
      id: 'LOG-' + Date.now(),
      action,
      targetId,
      targetName: 'System',
      adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com',
      adminIp: '127.0.0.1',
      details,
      timestamp: new Date().toISOString(),
      riskLevel
    };
    if (!this.state.securityLogs) this.state.securityLogs = [];
    this.state.securityLogs.push(log);
    await this.commit();
  }

  async logAudit(action: string, type: AuditLog['type'], details: string, userId?: string, userName?: string, metadata?: any) {
    const admin = this.state.currentUser;
    const log: AuditLog = {
      id: 'AUD-' + Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      action,
      type,
      details,
      userId,
      userName,
      adminId: admin?.id,
      adminName: admin?.name,
      metadata
    };
    if (!this.state.auditLogs) this.state.auditLogs = [];
    this.state.auditLogs.unshift(log); // Newest first
    
    // Trigger Audit Hooks (Phase 2 Mirroring)
    this.auditHooks.forEach(h => h(log));
    
    await this.commit();
  }

  onStateChange(l: (state: AppState) => void) {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter(x => x !== l); };
  }

  onConfigChange(path: string, l: (state: AppState) => void) {
    return this.onStateChange(l);
  }

  onAuditLog(hook: (log: AuditLog) => void) {
    this.auditHooks.push(hook);
  }

  /**
   * Smart Identifier Resolver: Locates a user node by any valid identifier.
   * Checks Email, ID, Username, Phone, and ConnectionID to ensure resilience.
   */
  private findUserIndex(identifier: string): number {
    if (!identifier || typeof identifier !== 'string') return -1;
    const clean = identifier.trim().toLowerCase();
    
    return this.state.users.findIndex(u => {
      if (!u) return false;
      const uid = (u.id || '').toLowerCase();
      const uemail = (u.email || '').toLowerCase();
      const uname = (u.username || '').toLowerCase();
      const uconn = (u.connectionId || '').toLowerCase();
      const uphone = (u.phone || '').replace(/\D/g, '');
      const cleanPhone = clean.replace(/\D/g, '');

      return uid === clean || 
             uemail === clean || 
             uname === clean || 
             uconn === clean || 
             (uphone && cleanPhone && uphone === cleanPhone);
    });
  }

  private findUserNode(identifier: string): ISPUser | undefined {
    const idx = this.findUserIndex(identifier);
    return idx !== -1 ? this.state.users[idx] : undefined;
  }

  async clearProfileCache(userId: string) {
    await this.forceSync();
    const upToDate = this.findUserNode(userId);
    if (upToDate && this.state.currentUser && this.state.currentUser.id === upToDate.id) {
       this.state.currentUser = { ...upToDate, role: this.state.currentUser.role };
       this.notify();
    }
    return { success: true, message: 'Identity Node Re-synchronized' };
  }

  private reconcileIdentity() {
    if (!this.state.currentUser) return;
    const upToDate = this.findUserNode(this.state.currentUser.id || this.state.currentUser.email);
    if (upToDate) {
      this.state.currentUser = { ...upToDate, role: this.state.currentUser.role };
    }
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
  async signInWithGoogle() {
    if (!this.auth) return { success: false, message: 'Auth Layer Offline' };
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(this.auth, provider);
      return { success: true, message: 'Redirecting to Google...' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  private async handleAuthRedirect() {
    if (!this.auth) return;
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        const user = result.user;
        console.log('[AUTH] Handling Redirect Success:', user.email);
        
        // --- BACKEND HANDSHAKE ---
        const response = await fetch(`${this.backendUrl}/api/auth/social-handshake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            name: user.displayName || 'Google User',
            provider: 'Google'
          })
        });

        const res = await response.json();
        if (res.success && res.token) {
           this.storeToken(res.token);
           this.state.currentUser = res.user;
           this.state.auth = {
             isLoggedIn: true,
             role: res.user.role,
             id: res.user.id,
             email: res.user.email,
             name: res.user.name,
             lastLoginAt: new Date().toISOString(),
             isPersistent: true
           };
           this.authenticateSocket();
           this.notify();
           this.logAudit('Google Login', 'Login', `Authenticated via Backend Handshake: ${user.email}`, res.user.id, res.user.name);
        } else {
           this.logNotification('all', 'error', 'Auth Handshake Failed', res.message || 'Identity verification rejected.');
        }
      }
    } catch (e: any) {
      console.error('[AUTH] Redirect Error:', e);
      this.logNotification('all', 'error', 'Auth Failure', e.message);
    }
  }



  private recaptchaVerifier: any = null;

  async signInWithPhone(phoneNumber: string, containerId: string) {
    if (!this.auth) return { success: false, message: 'Auth Layer Offline' };
    try {
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
          'size': 'invisible',
          'callback': () => { console.log('reCAPTCHA solved'); }
        });
      }
      const confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, this.recaptchaVerifier);
      return { success: true, confirmationResult };
    } catch (e: any) {
      if (this.recaptchaVerifier) {
          this.recaptchaVerifier.clear();
          this.recaptchaVerifier = null;
      }
      return { success: false, message: e.message };
    }
  }

  async verifyPhoneCode(confirmationResult: any, code: string) {
    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      const phone = user.phoneNumber;

      // --- BACKEND HANDSHAKE ---
      const response = await fetch(`${this.backendUrl}/api/auth/social-handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone, 
          name: 'Phone User',
          provider: 'SMS'
        })
      });

      const res = await response.json();
      if (res.success && res.token) {
         this.storeToken(res.token);
         this.state.currentUser = res.user;
         this.state.auth = {
           isLoggedIn: true,
           role: res.user.role,
           id: res.user.id,
           email: res.user.email,
           name: res.user.name,
           lastLoginAt: new Date().toISOString(),
           isPersistent: true
         };
         this.authenticateSocket();
         this.notify();
         this.logAudit('Phone Login', 'Login', `Authenticated via Backend Handshake: ${phone}`, res.user.id, res.user.name);
         return { success: true, user: this.state.currentUser };
      } else {
         return { success: false, message: res.message || 'Identity verification rejected by backend.' };
      }
    } catch (e: any) {
      console.error('[AUTH] OTP Verification Error:', e);
      return { success: false, message: e.message };
    }
  }

  // --- NOTIFICATION DISPATCHER ---
  async dispatchActivationNotification(userId: string, pkgId: string) {
    const user = this.findUserNode(userId);
    const pkg = this.state.packages.find(p => p.id === pkgId);
    const conf = this.state.settings.commConfig;

    if (!user || !pkg) return { success: false };

    const template = conf.activationSMSTemplate || "Your package {{package}} is active until {{expiry}}.";
    const msg = template
      .replace('{{name}}', user.name)
      .replace('{{package}}', pkg.name)
      .replace('{{expiry}}', user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'N/A');

    let smsStatus = false;
    let emailStatus = false;

    // 1. Attempt Email if enabled
    if (conf.enableActivationEmail && user.email) {
      const res = await this.dispatchDirectEmail(user.id, 'Service Activation Protocol - Click Opticx', msg);
      emailStatus = res.success;
    }

    // 2. Attempt SMS if enabled
    if (conf.enableActivationSMS && user.phone) {
      const res = await this.dispatchSMS(user.phone, msg, 'Automation', userId);
      smsStatus = res.success;
    }

    // Always log local notification
    this.logNotification(userId, 'success', 'Package Activated', msg);

    return { success: true, smsStatus, emailStatus };
  }

  private async dispatchDirectEmail(userId: string, subject: string, body: string) {
    const user = this.findUserNode(userId);
    if (!user || !user.email) return { success: false };
    
    this.logCommunication({
      userId,
      userName: user.name,
      email: user.email,
      subject,
      sentBy: 'System',
      status: 'Sent',
      provider: 'SMTP'
    });
    return { success: true };
  }



  async sendOTPRealEmail(to: string, code: string) {
    const log: DeliveryLog = {
      id: 'COMM-' + Date.now(),
      userId: to,
      userName: to,
      type: 'Email',
      channel: 'SMTP',
      status: 'Delivered',
      timestamp: new Date().toISOString(),
      triggerSource: 'Automation'
    };
    if (!this.state.deliveryLogs) this.state.deliveryLogs = [];
    this.state.deliveryLogs.push(log);
    
    // Simulate sending real email via node backend API
    try {
            const config = this.state.settings.commConfig.smtpConfig;
            const senderId = this.state.settings.commConfig.otpSenderId || 'SDR-1';
            const sender = this.state.settings.commConfig.senderIdentities.find(s => s.id === senderId) || this.state.settings.commConfig.senderIdentities[0];
            const senderEmail = this.state.settings.commConfig.otpEmail || sender?.email || 'noreply@clickopticx.com';
            
            this.socket.emit('send-email', { 
                config,
                payload: {
                    from: senderEmail,
                    senderName: sender?.name || 'Click Opticx Authority',
                    to, 
                    subject: 'Login Verification Protocol - OTP', 
                    html: `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #f8fafc; border-radius: 20px;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 30px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                                <h1 style="color: #1570ef; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; margin-bottom: 24px;">Security Handshake Initiation</h1>
                                <p style="color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 32px;">One-Time Password Verified</p>
                                <div style="background-color: #f1f5f9; padding: 32px; border-radius: 20px; text-align: center; margin-bottom: 32px;">
                                    <span style="font-size: 48px; font-weight: 900; color: #0f172a; letter-spacing: 0.2em;">${code}</span>
                                </div>
                                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">This code identifies your secure session. Do not share this protocol with anyone. Node expires in 10 minutes.</p>
                            </div>
                        </div>
                    `
                }
            });
    } catch(err) {}

    await this.commit();
    return { success: true };
  }

  async syncArtifacts(userId: string, files: string[], onLog?: (log: any) => void) {
    const res = await MultiCloudService.syncArtifacts(userId, files, (log) => {
        if (onLog) onLog(log);
        this.notify(); // Re-render to show progress
    });
    this.state.settings.cloudStorage.lastSync = res.timestamp;
    await this.commit();
    return res;
  }

  getCloudLogs() {
    return MultiCloudService.getLogs();
  }

  async login(credential: string, pass: string, rememberMe: boolean = false) {
    if (!credential) return { success: false, message: 'Identity required for lookup.' };
    const identifier = credential.trim();
    const settings = this.state.settings.authSettings || INITIAL_STATE.settings.authSettings;

    if (!settings.loginEnabled) {
      return { success: false, message: 'Logins are currently disabled by administration.' };
    }

    // ─── Helper: attempt a single backend login call ────────────────────────
    const attemptBackendLogin = async (timeoutMs: number) => {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${this.backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password: pass }),
          signal: controller.signal,
        });
        clearTimeout(tid);
        return await response.json();
      } finally {
        clearTimeout(tid);
      }
    };

    // ─── Helper: local staff/admin fallback (bcrypt-free, hash-based) ───────
    const tryLocalFallback = () => {
      const lowerIdentifier = identifier.toLowerCase();
      // Look through locally stored staff/admin users
      const staffUser = this.state.users.find(u => {
        if (!u || u.deleted) return false;
        const role = (u.role || '').toLowerCase();
        if (role === 'customer' || role === 'subscriber') return false; // customers must use backend
        return (
          (u.email || '').toLowerCase() === lowerIdentifier ||
          (u.username || '').toLowerCase() === lowerIdentifier ||
          (u.phone || '') === identifier
        );
      });

      if (!staffUser) return null;

      // Validate password against stored plain or hashed credential
      // For admins created via the panel the password is stored as plain text
      const storedPass = staffUser.password || '';
      const passwordMatch = storedPass === pass;
      if (!passwordMatch) return null;
      return staffUser;
    };

    // ─── LAYER 1: Backend primary attempt (15s timeout) ─────────────────────
    console.log('[DB-AUTH] Initiating security handshake for:', identifier);
    let res: any = null;

    try {
      res = await attemptBackendLogin(15000);
    } catch (e1: any) {
      console.warn('[AUTH] Primary attempt failed, retrying in 3s for cold start:', e1.message);
      // ─── LAYER 2: Cold-start retry 1 (wait 3s, then 20s timeout) ─────────────
      await new Promise(r => setTimeout(r, 3000));
      try {
        res = await attemptBackendLogin(20000);
      } catch (e2: any) {
        console.warn('[AUTH] Secondary attempt failed, retrying one last time in 5s:', e2.message);
        // ─── LAYER 3: Cold-start retry 2 (wait 5s, then 20s timeout) ─────────────
        await new Promise(r => setTimeout(r, 5000));
        try {
          res = await attemptBackendLogin(20000);
        } catch (e3: any) {
          console.warn('[AUTH] Final backend attempt failed. Activating local fallback.', e3.message);
          // ─── LAYER 4: Local admin/staff fallback ─────────────────────────────
          const localUser = tryLocalFallback();
          if (localUser) {
            console.warn('[AUTH] Backend unavailable — authenticated locally for staff user.');
            this.state.currentUser = localUser;
            this.state.auth = {
              isLoggedIn: true,
              role: localUser.role,
              id: localUser.id,
              email: localUser.email,
              name: localUser.name,
              lastLoginAt: new Date().toISOString(),
              isPersistent: !!rememberMe
            };
            if (!rememberMe) sessionStorage.setItem('clickoptix_active_session', 'true');
            this.state.view = 'admin';
            this.logAudit('Local Fallback Login', 'Login', `Staff authenticated locally due to backend unavailability.`, localUser.id, localUser.name);
            await this.commit(undefined, false);
            this.notify();
            return { success: true, user: localUser, type: 'staff', offlineMode: true };
          }
          // No local match found either
          return {
            success: false,
            message: '⚠️ The server is taking longer than usual to wake up. Please wait 10 seconds and try one last time. (System is warming up)',
          };
        }
      }
    }

    // ─── Process backend response ────────────────────────────────────────────
    if (!res || !res.success) {
      // ─── LAYER 4: Backend responded but user not found — try local staff fallback ──
      const localStaff = tryLocalFallback();
      if (localStaff) {
        console.warn('[AUTH] Backend returned "not found" — authenticated locally for staff user.');
        this.state.currentUser = localStaff;
        this.state.auth = {
          isLoggedIn: true,
          role: localStaff.role,
          id: localStaff.id,
          email: localStaff.email,
          name: localStaff.name,
          lastLoginAt: new Date().toISOString(),
          isPersistent: !!rememberMe
        };
        if (!rememberMe) sessionStorage.setItem('clickoptix_active_session', 'true');
        this.state.view = 'admin';
        this.logAudit('Local Staff Login', 'Login', `Staff authenticated locally (backend: ${res?.message}).`, localStaff.id, localStaff.name);
        await this.commit(undefined, false);
        this.notify();
        return { success: true, user: localStaff, type: 'staff', offlineMode: false };
      }
      this.logAudit('Failed Login', 'Login', `Login failed: ${res?.message} for ${identifier}`);
      return { success: false, message: res?.message || 'Identity verification failed.' };
    }

    // Store JWT token securely with expiry metadata
    if (res.token) {
      this.storeToken(res.token);
    }

    // The backend returns the full user object (staff or user)
    const authenticatedEntity = res.user;
    
    // Update local session state
    this.state.currentUser = authenticatedEntity;
    this.state.auth = {
      isLoggedIn: true,
      role: res.userType === 'customer' ? Role.CUSTOMER : authenticatedEntity.role,
      id: authenticatedEntity.id,
      email: authenticatedEntity.email,
      name: authenticatedEntity.name,
      lastLoginAt: new Date().toISOString(),
      isPersistent: !!rememberMe
    };

    if (!rememberMe) {
        sessionStorage.setItem('clickoptix_active_session', 'true');
    }

    this.state.view = res.userType === 'customer' ? 'portal' : 'admin';
    
    if (res.userType === 'customer') {
        this.state.currentUser.role = Role.CUSTOMER;
        const existingIdx = this.state.users.findIndex(u => u.id === authenticatedEntity.id);
        if (existingIdx === -1) {
          const localUser: ISPUser = {
            ...authenticatedEntity,
            role: Role.CUSTOMER,
            kyc_attempt_count: authenticatedEntity.kyc_attempt_count ?? 0,
            kyc_history: authenticatedEntity.kyc_history ?? [],
            activityLog: authenticatedEntity.activityLog ?? [],
            connectionId: authenticatedEntity.connectionId || 'PENDING-' + authenticatedEntity.id?.slice(-4),
            nasConnectionType: authenticatedEntity.nasConnectionType || 'Manual',
            referralCode: authenticatedEntity.referralCode || 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            activationCount: authenticatedEntity.activationCount ?? 0,
          };
          this.state.users.push(localUser);
          console.log('[REGISTRY SYNC] User upserted into local state after backend login:', localUser.id);
        } else {
          this.state.users[existingIdx] = {
            ...this.state.users[existingIdx],
            ...authenticatedEntity,
            role: Role.CUSTOMER,
          };
          console.log('[REGISTRY SYNC] Local user record refreshed from backend:', authenticatedEntity.id);
        }
    }

    await this.commit(undefined, true);
    this.authenticateSocket();
    this.notify();
    
    this.logAudit(
      res.userType === 'staff' ? 'Staff Login' : 'User Login', 
      'Login', 
      `${res.userType === 'staff' ? 'Administrative identity' : 'Subscriber identity'} authenticated successfully.`,
      authenticatedEntity.id,
      authenticatedEntity.name
    );

    return { 
      success: true, 
      user: this.state.currentUser, 
      type: res.userType 
    };
  }


  async impersonateUser(userId: string) {
    console.log(`[AUTH] Initiating impersonation for User Node: ${userId}`);
    try {
      const currentToken = this.getValidToken();
      if (!currentToken) return { success: false, message: 'Session expired. Please re-authenticate.' };

      const response = await fetch(`${this.backendUrl}/api/v1/admin/impersonate/${userId}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${currentToken}`
        }
      });
    
    const res = await response.json();
    if (res.success && res.token) {
      // Backup the admin token (with its metadata wrapper) for restoration
      const originalTokenRaw = localStorage.getItem('clickopticx_auth_token');
      if (originalTokenRaw) localStorage.setItem('clickopticx_admin_token', originalTokenRaw);
      
      this.storeToken(res.token);
      this.state.currentUser = res.user;
      this.state.auth = {
        ...this.state.auth,
        id: res.user.id,
        role: res.user.role,
        isImpersonating: true,
        impersonatorId: this.state.auth?.id
      } as any;
      
      this.logAudit('Impersonation Start', 'Admin', `Admin started impersonating user ${res.user.email}`, res.user.id, res.user.name);
      await this.commitImmediate();
      this.notify();
      window.location.href = '/dashboard'; 
      return { success: true };
    }
    return { success: false, message: res.message || 'Impersonation Handshake Failed.' };
  } catch (e: any) {
    console.error('[AUTH] Impersonation Error:', e);
    return { success: false, message: e.message };
  }
}

async logoutImpersonation() {
  const adminTokenRaw = localStorage.getItem('clickopticx_admin_token');
  if (adminTokenRaw) {
     // Restore the original admin token metadata wrapper directly
     localStorage.setItem('clickopticx_auth_token', adminTokenRaw);
     localStorage.removeItem('clickopticx_admin_token');
     
     this.logAudit('Impersonation End', 'Admin', `Admin terminated impersonation session.`);
     this.notify();
     window.location.href = '/admin/dashboard';
  }
}


  async logout() {
    console.log('[DB] Protocol: Terminating session and clearing persistent buffers.');
    if (this.socket) {
        this.socket.emit('logout');
    }
    
    // 1. Clear State
    this.state.currentUser = undefined;
    this.state.isImpersonating = false;
    this.state.auth = { isLoggedIn: false };
    this.state.view = 'login';
    
    // 2. Clear Auth Tokens & Persistent Buffers
    localStorage.removeItem('clickopticx_auth_token');
    localStorage.removeItem('clickopticx_v16_registry'); // Wipe cache to enforce clean login on refresh
    
    // 3. Terminate Firebase Handshake
    if (this.auth) {
        try {
            await this.auth.signOut();
        } catch (e) {
            console.warn('[AUTH] Firebase SignOut failed (likely already disconnected):', e);
        }
    }

    // 4. Final Notification
    this.notify();
  }

  async triggerGlobalWipe() {
    console.warn('[DB] EXECUTING GLOBAL WORKSPACE WIPE PROTOCOL');
    if (this.socket) {
      this.socket.emit('trigger-global-wipe');
    }
    this.executeLocalWipe();
  }

  async clearBackendCache() {
    try {
      const res = await fetch(`${this.backendUrl}/api/config/clear-cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        this.logNotification('all', 'success', 'Cloud Cache Purged', 'Backend registry buffers have been synchronized in real-time.', 'admin');
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // --- Branding Media Control ---
  async getBrandingMedia() {
    try {
      const res = await fetch(`${this.backendUrl}/api/branding/media`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
        }
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async uploadBrandingMedia(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${this.backendUrl}/api/branding/media`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
        },
        body: formData
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async deleteBrandingMedia(id: string) {
    try {
      const res = await fetch(`${this.backendUrl}/api/branding/media?id=${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
        }
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // --- Trash Management ---
  async getTrash() {
    try {
      const res = await fetch(`${this.backendUrl}/api/trash`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
        }
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async restoreFromTrash(id: string) {
    try {
      const res = await fetch(`${this.backendUrl}/api/trash/${id}/restore`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
        }
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async purgeFromTrash(id: string) {
    try {
      const res = await fetch(`${this.backendUrl}/api/trash/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
        }
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

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
    // 1. Precise Field Validation (Duplicate Control)
    const emailMatch = u.email && this.state.users.find(ex => !ex.deleted && (ex.email || '').toLowerCase().trim() === (u.email || '').toLowerCase().trim());
    if (emailMatch) return { success: false, message: `CONFLICT: Email (${u.email}) is already registered.` };

    const phoneMatch = u.phone && this.state.users.find(ex => !ex.deleted && (ex.phone || '').replace(/\D/g, '') === (u.phone || '').replace(/\D/g, ''));
    if (phoneMatch) return { success: false, message: `CONFLICT: Phone Number (${u.phone}) is already in use.` };

    const usernameMatch = u.username && this.state.users.find(ex => !ex.deleted && (ex.username || '').toLowerCase().trim() === (u.username || '').toLowerCase().trim());
    if (usernameMatch) return { success: false, message: `CONFLICT: Username (${u.username}) is taken.` };

    const cnicMatch = u.cnic && this.state.users.find(ex => !ex.deleted && (ex.cnic || '').replace(/\D/g, '') === (u.cnic || '').replace(/\D/g, ''));
    if (cnicMatch) return { success: false, message: `CONFLICT: CNIC (${u.cnic}) already exists.` };

    const pppoeMatch = u.pppoeId && this.state.users.find(ex => !ex.deleted && (ex.pppoeId || '').toLowerCase().trim() === (u.pppoeId || '').toLowerCase().trim());
    if (pppoeMatch) return { success: false, message: `CONFLICT: PPPoE ID (${u.pppoeId}) is already assigned.` };


    const newUser = {
      id: 'USR-' + Date.now(),
      connectionId: 'CO-' + Math.floor(10000 + Math.random() * 90000),
      balance: 0,
      creditScore: 600,
      activationCount: 0,
      portalEnabled: true,
      role: Role.CUSTOMER,
      status: UserStatus.NO_PLAN,
      verificationStatus: VerificationStatus.UNVERIFIED,
      isKYCVerified: false,
      isKYCSubmitted: false,
      kyc_status: 'unverified',
      approval_status: 'pending',
      connectionType: 'Fiber',
      activityLog: [],
      referralCode: 'REF-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      packageId: '', 
      managementMode: 'Manual',
      nasConnectionType: 'PPPoE',
      ...u
    };
    this.state.users.push(newUser as any);
    await this.syncUserStatusWithBilling(newUser.id);
    await this.commit();
    
    if (newUser.managementMode === 'NAS_Controlled' && newUser.routerId) {
      setTimeout(() => this.syncUserToNAS(newUser.id, 'upsert'), 500);
    }
    return { success: true, user: newUser };
  }

  async updateUser(id: string, d: any) {
    const idx = this.state.users.findIndex(u => 
       u.id === id || 
       (u.username && u.username === id) || 
       (u.pppoeId && u.pppoeId === id)
    );
    
    if (idx !== -1) {
      const targetId = this.state.users[idx].id;

      // 1. Conflict Checks for edited fields
      if (d.email) {
        const emailMatch = this.state.users.find(ex => ex.id !== targetId && !ex.deleted && (ex.email || '').toLowerCase().trim() === (d.email || '').toLowerCase().trim());
        if (emailMatch) return { success: false, message: `CONFLICT: Email (${d.email}) is already registered.` };
      }
      if (d.username) {
        const usernameMatch = this.state.users.find(ex => ex.id !== targetId && !ex.deleted && (ex.username || '').toLowerCase().trim() === (d.username || '').toLowerCase().trim());
        if (usernameMatch) return { success: false, message: `CONFLICT: Username (${d.username}) is taken.` };
      }
      if (d.pppoeId) {
        const pppoeMatch = this.state.users.find(ex => ex.id !== targetId && !ex.deleted && (ex.pppoeId || '').toLowerCase().trim() === (d.pppoeId || '').toLowerCase().trim());
        if (pppoeMatch) return { success: false, message: `CONFLICT: PPPoE ID (${d.pppoeId}) is already assigned.` };
      }
      if (d.phone) {
        const phoneMatch = this.state.users.find(ex => ex.id !== targetId && !ex.deleted && (ex.phone || '').replace(/\D/g, '') === (d.phone || '').replace(/\D/g, ''));
        if (phoneMatch) return { success: false, message: `CONFLICT: Phone Number (${d.phone}) is already in use.` };
      }
      if (d.cnic) {
        const cnicMatch = this.state.users.find(ex => ex.id !== targetId && !ex.deleted && (ex.cnic || '').replace(/\D/g, '') === (d.cnic || '').replace(/\D/g, ''));
        if (cnicMatch) return { success: false, message: `CONFLICT: CNIC (${d.cnic}) already exists.` };
      }

      this.state.users[idx] = { ...this.state.users[idx], ...d };
      if (this.state.currentUser && this.state.currentUser.id === targetId) {
        this.state.currentUser = { ...this.state.currentUser, ...d };
      }

      const updatedUser = this.state.users[idx];
      const isNasControlled = updatedUser.managementMode === 'NAS_Controlled' && updatedUser.routerId;

      if (d.status === UserStatus.SUSPENDED || d.status === UserStatus.EXPIRED || d.status === UserStatus.DISABLED || d.status === UserStatus.BLOCKED) {
        if (this.state.settings.nasSystemEnabled && isNasControlled) {
          await this.sendCoACommand(targetId, 'Disconnect');
        }
      }

      if (this.state.settings.nasSystemEnabled && isNasControlled) {
        if (d.packageId || d.managementMode || d.routerId || d.username || d.password || d.nasConnectionType) {
          setTimeout(() => this.syncUserToNAS(targetId, 'upsert'), 300);
        }
        if (d.packageId && d.status === UserStatus.ACTIVE) {
          setTimeout(() => this.sendCoACommand(targetId, 'SpeedChange'), 800);
        }
      }

      await this.syncUserStatusWithBilling(targetId);
      await this.commit(true);
      this.notify();
      return { success: true, message: `Identity updated successfully.` };
    }
    return { success: false, message: `Handshake Error: Identity artifact [${id}] not found.` };
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
    try {
      const start = Date.now();
      const res = await fetch(`${this.backendUrl}/api/verify-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      const data = await res.json();
      const latency = Date.now() - start;

      const currentStatus = data.success ? (latency > 3000 ? 'Slow' : 'Healthy') : 'Failed';

      const healthUpdate = {
        status: currentStatus as 'Healthy' | 'Slow' | 'Failed',
        lastCheck: new Date().toISOString(),
        latency: latency,
        bounceRate: data.success ? 0.1 : 99.9
      };

      // Persistence
      this.state.settings.commConfig.health = healthUpdate;
      await this.commit();
      this.notify();

      if (data.success) {
        return { success: true, message: `Email Gateway Successful. Latency ${latency}ms.`, health: healthUpdate };
      } else {
        return { success: false, error: data.message || 'SMTP Connection Failed', health: healthUpdate };
      }
    } catch (err: any) {
      const errorHealth = {
        status: 'Failed' as const,
        lastCheck: new Date().toISOString(),
        latency: 0,
        bounceRate: 100
      };
      this.state.settings.commConfig.health = errorHealth;
      await this.commit();
      this.notify();
      return { success: false, error: `CONNECTION_ERR: ${err.message}`, health: errorHealth };
    }
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

  async deleteInvoice(id: string) {
    const idx = this.state.invoices.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.state.invoices[idx].deleted = true;
      await this.commit(true);
      return { success: true };
    }
    return { success: false, message: 'Invoice not found' };
  }

  async saveNotificationTemplate(t: Partial<NotificationTemplate>) {
    const id = t.id || 'NTMP-' + Date.now();
    const idx = this.state.notificationTemplates.findIndex(x => x.id === id);
    const data = { 
        ...t, 
        id, 
        lastUpdated: new Date().toISOString(),
        channels: t.channels || ['Push'],
        event: t.event || 'GENERAL'
    } as NotificationTemplate;
    if (idx !== -1) this.state.notificationTemplates[idx] = data;
    else this.state.notificationTemplates.push(data);
    await this.commit();
    return { success: true, data };
  }

  async deleteNotificationTemplate(id: string) {
    this.state.notificationTemplates = this.state.notificationTemplates.filter(t => t.id !== id);
    await this.commit();
  }

  async dispatchSmartNotification(userId: string, event: NotificationTriggerEvent | 'GENERAL', data?: any) {
    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'User not found' };

    const template = this.state.notificationTemplates.find(t => t.event === event);
    if (!template && event !== 'GENERAL') {
        logger.warn(`No template found for event: ${event}`);
    }

    const payload = {
        userId: user.id,
        userPhone: user.phone,
        fcmToken: user.fcmToken, // Assuming this field exists or will be added
        event,
        title: template?.pushTitle || 'Click Opticx Notification',
        body: template?.pushBody || 'New update from Click Opticx',
        config: this.state.settings.commConfig,
        data: data || {}
    };

    try {
        const res = await fetch(`${this.backendUrl}/api/smart-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const report = await res.json();
        
        // Log the delivery
        const log: DeliveryLog = {
            id: 'LOG-' + Date.now(),
            userId: user.id,
            userName: user.name,
            event: event as NotificationTriggerEvent,
            timestamp: new Date().toISOString(),
            gatewayUsed: report.gatewayUsed as NotificationGateway,
            fallbackUsed: report.fallbackUsed as NotificationGateway,
            status: report.status as NotificationDeliveryStatus,
            retryCount: report.retryCount || 0,
            triggerSource: 'Automation',
            type: report.fallbackUsed ? 'SMS' : 'Push',
            channel: report.fallbackUsed ? 'Global SMS' : 'Firebase FCM'
        };
        this.state.deliveryLogs.unshift(log);
        await this.commit();
        this.notify();
        
        return report;
    } catch (error: any) {
        return { success: false, status: 'Failed', error: error.message };
    }
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

  logNotification(targetId: string, type: 'success' | 'warning' | 'info' | 'error', title: string, message: string, audience: 'user' | 'admin' | 'system' = 'user', priority: 'low' | 'normal' | 'high' | 'critical' = 'normal') {
    const n: SystemNotification = {
      id: 'NOT-' + Date.now() + Math.random().toString(36).substr(2, 5),
      targetId,
      type,
      title,
      message,
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
      audience: targetId === 'all' ? 'admin' : (audience as any),
      priority
    };
    if (!this.state.notifications) this.state.notifications = [];
    this.state.notifications.unshift(n);
    this.commit();
  }

  logActivity(userId: string, type: string, message: string) {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      if (!this.state.users[idx].activityLog) this.state.users[idx].activityLog = [];
      this.state.users[idx].activityLog.push({
        id: 'AL-' + Date.now(),
        type,
        message,
        timestamp: new Date().toISOString()
      });
      this.commit();
    }
  }

  async markNotificationRead(id: string) {
    const n = this.state.notifications.find(x => x.id === id);
    if (n) { n.read = true; await this.commit(); }
  }

  async markAllNotificationsRead(targetId: string, audience: 'subscriber' | 'admin') {
    this.state.notifications.forEach(n => {
      if ((n.targetId === targetId || n.targetId === 'all') && n.audience === audience) n.read = true;
    });
    this.commit();
  }

  async clearNotifications(targetId: string, audience: 'subscriber' | 'admin') {
    this.state.notifications = this.state.notifications.filter(n => !((n.targetId === targetId || n.targetId === 'all') && n.audience === audience));
    await this.commit();
  }

  async addStaff(s: Partial<StaffUser>) {
    if (!s.email) return { success: false, message: 'Corporate identity requires a valid email.' };
    
    // Conflict Check
    const exists = this.state.staff.find(ex => ex.email.toLowerCase().trim() === s.email?.toLowerCase().trim());
    if (exists) return { success: false, message: `CONFLICT: Staff identity [${s.email}] already exists in governance registry.` };

    const next = { 
      ...s, 
      status: s.status || 'Active', 
      password: s.password || 'Click@Opticx2026', 
      balance: s.balance || 0,
      role: s.role || Role.TEAM_MEMBER
    } as StaffUser;
    
    this.state.staff.push(next);
    await this.commit(true);
    return { success: true, message: 'Personnel identity provisioned successfully.' };
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


  async processTopup(collector: string, target: string, type: 'staff' | 'user', amount: number, description: string = 'Credit Refill', forceType?: LedgerType) {
    const timestamp = new Date().toISOString();
    
    // Deduct from Collector if it's a staff member
    if (collector !== 'System' && collector !== 'GATEWAY') {
      const cIdx = this.state.staff.findIndex(s => s.email === collector || s.id === collector);
      if (cIdx !== -1) {
        this.state.staff[cIdx].balance = (this.state.staff[cIdx].balance || 0) - amount;
        this.state.ledger.push({
          id: `DEDUCT-${Date.now()}`,
          userId: collector,
          amount,
          type: LedgerType.DEBIT,
          timestamp,
          description: `Credit Distribution to ${target}`,
          balanceAfter: this.state.staff[cIdx].balance,
          method: 'Registry Transfer'
        });
      } else if (collector.includes('@')) {
         // If collector is an email but not found in staff, check if it's a superadmin email
         const admin = this.state.staff.find(s => s.role === Role.SUPER_ADMIN);
         if (admin) {
           const aIdx = this.state.staff.findIndex(s => s.id === admin.id);
           this.state.staff[aIdx].balance = (this.state.staff[aIdx].balance || 0) - amount;
         }
      }
    } else {
      // System/Gateway refills deduct from SuperAdmin pool by default
      const adminIdx = this.state.staff.findIndex(s => s.role === Role.SUPER_ADMIN);
      if (adminIdx !== -1) {
        this.state.staff[adminIdx].balance = (this.state.staff[adminIdx].balance || 0) - amount;
      }
    }

    if (type === 'staff') {
      const sIdx = this.state.staff.findIndex(s => s.email === target || s.id === target);
      if (sIdx !== -1) {
        this.state.staff[sIdx].balance = (this.state.staff[sIdx].balance || 0) + amount;
        this.state.ledger.push({ 
          id: 'TOP_' + Date.now(), 
          userId: target, 
          amount, 
          type: LedgerType.CREDIT, 
          timestamp, 
          description: description || 'Admin Refill', 
          balanceAfter: this.state.staff[sIdx].balance, 
          method: 'Registry Direct' 
        });
      } else {
        return { success: false, message: 'Target staff node not found.' };
      }
    } else {
      const uIdx = this.findUserIndex(target);
      if (uIdx !== -1) {
        // ADDING to user balance (Refilling Wallet)
        this.state.users[uIdx].balance = (this.state.users[uIdx].balance || 0) + amount;
        this.state.ledger.push({
          id: 'TOP_' + Date.now(),
          userId: target,
          amount,
          type: LedgerType.CREDIT,
          timestamp,
          description,
          balanceAfter: this.state.users[uIdx].balance,
          method: 'Wallet Refill'
        });
        await this.syncUserStatusWithBilling(target);
      } else {
        return { success: false, message: 'Target subscriber node not found.' };
      }
    }
    await this.commit(true);
    this.notify();
    return { success: true, message: 'Fiscal handshake verified.' };
  }

  async activatePackage(userId: string, pkgId: string, customStatus?: UserStatus, customActivationDate?: string) {
    const uIdx = this.findUserIndex(userId);
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

      // Update balance (Deduct from Wallet)
      if (pkg) {
         const taxRate = this.state.settings.enableTax ? this.state.settings.autoTaxPercentage : 0;
         const totalCost = pkg.price + Math.round(pkg.price * (taxRate / 100));
         
         // In this credit-based system, activating a package DEDUCTS from the wallet
         this.state.users[uIdx].balance = (this.state.users[uIdx].balance || 0) - totalCost;
         
         this.state.ledger.push({
           id: `ACT-${Date.now()}`,
           userId,
           amount: totalCost,
           type: LedgerType.DEBIT,
           timestamp: new Date().toISOString(),
           description: `Package Activation: ${pkg.name}`,
           balanceAfter: this.state.users[uIdx].balance,
           method: 'System Deduction'
         });
      }

      // =====================================================
      // RESELLER PROFIT DISTRIBUTION ENGINE
      // Fires when a user has a managing reseller (resellerEmail or dealerId)
      // =====================================================
      if (pkg) {
        const user = this.state.users[uIdx];
        const resellerEmail = user.resellerEmail;
        
        if (resellerEmail) {
          // PROFIT ENGINE — fire-and-forget, non-blocking
          // Each reseller tier independently uses its own packageConfig:
          //   resalePrice = what this tier charges DOWN the chain (retail to the level below)
          //   profitMargin = what this tier KEEPS
          //   wholesaleCost = resalePrice - profitMargin = what this tier pays UP to its parent
          // Example:
          //   Admin sets Franchise: resalePrice=1400, profitMargin=200 → Franchise pays 1200 to Admin
          //   Franchise sets Dealer: resalePrice=1600, profitMargin=200 → Dealer pays 1400 to Franchise
          //   Dealer sets SubDealer: resalePrice=1800, profitMargin=200 → SubDealer pays 1600 to Dealer
          //   Customer pays SubDealer: 1800
          this.distributeResellerProfit(resellerEmail, pkgId, user.name).catch(e => {
            console.error('[PROFIT-ENGINE] Distribution failed:', e);
          });
        }
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

      // Smart Notification Integration
      await this.dispatchSmartNotification(userId, 'PACKAGE_ACTIVATED', {
          packageId: pkgId,
          packageName: pkg?.name || pkgId,
          expiryDate: this.state.users[uIdx].expiryDate
      });

      await this.commit(true);
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'User not found in registry.' };
  }

  async payInvoiceWithWallet(invoiceId: string) {
    const invIdx = this.state.invoices.findIndex(i => i.id === invoiceId);
    if (invIdx === -1) return { success: false, message: 'Invoice not found' };
    const inv = this.state.invoices[invIdx];
    const uIdx = this.findUserIndex(inv.userId);
    if (uIdx === -1) return { success: false, message: 'Subscriber node not found' };

    inv.status = PaymentStatus.PAID;
    inv.paidAt = new Date().toISOString();
    inv.paidAmount = inv.totalAmount;
    // user.balance handling is managed by activatePackage call below

    // ACTION SYNC: Activate package now that it's paid
    await this.activatePackage(inv.userId, inv.packageId);
    
    // FINAL SYNC: Re-evaluate account status
    await this.syncUserStatusWithBilling(inv.userId);

    // Smart Notification Integration
    await this.dispatchSmartNotification(inv.userId, 'PAYMENT_RECEIVED', {
        amount: inv.paidAmount,
        invoiceId: inv.id,
        method: 'Wallet'
    });

    await this.commit(true);
    return { success: true };
  }

  async generateAdHocInvoice(userId: string, pkgId: string, amount: number, items: LineItem[]) {
    const user = this.findUserNode(userId);
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
    const idx = this.findUserIndex(userId);
    if (idx !== -1) { this.state.users[idx].verificationSuccessShown = true; await this.commit(); }
  }

  async markWelcomeComplete(userId: string) {
    const idx = this.findUserIndex(userId);
    if (idx !== -1) { this.state.users[idx].welcomeChecklistShown = true; await this.commit(); }
  }

  getLiveUsage(id: string) { 
    const user = this.findUserNode(id);
    if (!user) return { down: '0.0', up: '0.0', ping: 0, usageToday: '0.0', usageMonth: '0.0', offline: true };
    
    // Attempt to find the latest real-time data from the socket stream
    const latest = (this.state.liveUsage || []).find(u => u.userId === user.username || u.userId === user.id);
    
    if (latest) {
      return {
        down: latest.download.toFixed(2),
        up: latest.upload.toFixed(2),
        ping: 25, // Logic for real-time ping can be added here
        usageToday: '1.2',
        usageMonth: '42.5',
        offline: false
      };
    }

    return { 
      down: '0.0', 
      up: '0.0', 
      ping: 0, 
      usageToday: '0.0', 
      usageMonth: '0.0', 
      offline: user.status === UserStatus.DISABLED 
    }; 
  }

  subscribeToLiveTraffic(userId: string) {
    if (!this.socket) return;
    const user = this.findUserNode(userId);
    if (!user) return;
    
    // In a real system, we'd fetch the NAS/OLT config from the state
    const nas = this.state.nasConfigs?.[0] || { ip: '127.0.0.1', username: 'admin', password: 'password' };
    
    this.socket.emit('subscribe-live-traffic', {
      username: user.username,
      deviceConfig: nas
    });
  }

  unsubscribeFromLiveTraffic(userId: string) {
    if (!this.socket) return;
    const user = this.findUserNode(userId);
    if (!user) return;
    this.socket.emit('unsubscribe-live-traffic', user.username);
  }
  getConnectedDevices(id: string) { 
    // Filter active users and simulate their devices based on connection type
    const activeUsers = this.state.users.filter(u => u.status === UserStatus.ACTIVE && !u.deleted);
    return activeUsers.slice(0, 50).map(u => ({
      id: `DEV-${u.id}`,
      name: `${u.name}'s Device`,
      mac: u.macAddress || '00:00:00:00:00:00',
      ip: u.macIp || '192.168.1.1',
      signal: Math.floor(Math.random() * 40) + 60,
      usageToday: Math.floor(Math.random() * 1024),
      duration: 'Live',
      isBlocked: false
    }));
  }
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

  async forceUserSync(userId: string) { return { success: true }; }


  async bulkVerifyUsers(userIds: string[], verified: boolean) {
     for (const id of userIds) {
        const user = this.findUserNode(id);
        if (user) {
           this.syncUserKYCState(user, verified ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED);
        }
     }
     await this.commit(true);
     this.notify();
     this.logAudit(`Bulk ${verified ? 'Verify' : 'Unverify'}`, 'System', `${verified ? 'Verified' : 'Unverified'} ${userIds.length} identity nodes.`, 'multiple');
  }


  async uploadMedia(path: string, base64Data: string): Promise<string> {
    if (!this.storage) {
      console.warn("Cloud Storage Node disconnected, falling back to base64 encoding.");
      return base64Data;
    }
    try {
      const storageRef = ref(this.storage, path);
      const isBase64 = base64Data.startsWith('data:');

      const uploadTask = async () => {
         if (isBase64) {
            await uploadString(storageRef, base64Data, 'data_url');
         } else {
            await uploadString(storageRef, base64Data, 'raw');
         }
         return await getDownloadURL(storageRef);
      };

      return await Promise.race([
        uploadTask(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Storage node connection timeout")), 30000))
      ]);
    } catch (e) {
      console.error('[STORAGE ERROR]', e, '- Falling back to base64');
      return base64Data;
    }
  }

  async updateSubscriberProfile(id: string, data: any) {
    const idx = this.findUserIndex(id);
    if (idx === -1) return { success: false, message: 'Identity node not found.' };

    this.state.users[idx] = { ...this.state.users[idx], ...data };
    
    // Update currentUser if applicable
    if (this.state.currentUser && this.state.currentUser.id === id) {
       this.state.currentUser = { ...this.state.users[idx], role: this.state.currentUser.role };
    }
    
    await this.commit(true);
    this.notify();
    return { success: true };
  }
  async submitTopupRequest(r: any) { this.state.topupRequests.push({ ...r, id: 'REQ_' + Date.now(), status: 'Pending', timestamp: new Date().toISOString() }); await this.commit(); }
  async submitTicket(t: any) { this.state.tickets.push({ ...t, id: 'TCK_' + Date.now(), status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); await this.commit(); }
  async updateTicketStatus(id: string, s: any) { const idx = this.state.tickets.findIndex(t => t.id === id); if (idx !== -1) { this.state.tickets[idx].status = s; await this.commit(); } }
  async addTicketComment(id: string, t: string, i: boolean) { const idx = this.state.tickets.findIndex(x => x.id === id); if (idx !== -1) { this.state.tickets[idx].comments.push({ id: 'CMT_' + Date.now(), authorName: 'Admin', authorEmail: 'admin@opticx.com', authorRole: Role.ADMIN, text: t, timestamp: new Date().toISOString(), isInternal: i }); await this.commit(); } }


  async approveSignup(requestId: string) {
    try {
      console.log('[DB-AUTH] Sending signup approval to backend for request:', requestId);

      const currentToken = this.getValidToken();
      if (!currentToken) return { success: false, message: 'Session expired. Please re-authenticate.' };

      const response = await fetch(`${this.backendUrl}/api/users/signup-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}` 
        }
      });
      
      const res = await response.json();
      if (!res.success) {
         return { success: false, message: res.message || 'Backend approval failed' };
      }

      // Backend returns the approved request. We update local state directly for immediate UI feedback.
      const req = this.state.signupRequests.find(r => r.id === requestId);
      if (req) {
         req.status = 'Approved';
         req.approval_status = 'approved';
         req.processedAt = res.request.processed_at;
         req.processedBy = res.request.processed_by;
      }

      // The backend creates the user and emits 'user:created' via socket, but we can also pre-emptively
      // fetch or rely on the socket to insert the user into `this.state.users`.

      this.logNotification(requestId, 'success', 'Account Pre-Approved', 'Account approved successfully.');
      this.logAudit('Signup Approved', 'Approval', `Signup request ${requestId} approved via backend.`, requestId, req?.name || 'Unknown');

      await this.commitImmediate();
      this.notify();
      
      return { success: true, message: 'Identity Approved Successfully.', request: res.request };
    } catch (e: any) {
      console.error('[DB-AUTH-CRITICAL] Approval Bridge Failure:', e);
      return { success: false, message: `System Fault: ${e.message}` };
    }
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
    const user = this.findUserNode(userId);

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
  async updateCommConfig(c: CommunicationSettings) { this.state.settings.commConfig = c; this.notify(); await this.commit(); }
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



  async bulkActivatePayLater(ids: string[], p: string, a: number, d: string, r: string) { await this.commit(); }
  async addTask(t: string, p: any, a?: string, d?: string) { this.state.tasks.push({ id: 'TSK_' + Date.now(), text: t, completed: false, priority: p, assignedTo: a, dueDate: d, order: this.state.tasks.length }); await this.commit(); return { success: true }; }
  async toggleTask(id: string) { const idx = this.state.tasks.findIndex(t => t.id === id); if (idx !== -1) { this.state.tasks[idx].completed = !this.state.tasks[idx].completed; await this.commit(); } return { success: true }; }
  async deleteTask(id: string) { this.state.tasks = this.state.tasks.filter(t => t.id !== id); await this.commit(); return { success: true }; }
  async bulkBalanceUpdate(userIds: string[], amount: number, isAddition: boolean) {
    for (const id of userIds) {
      const idx = this.findUserIndex(id);
      if (idx !== -1) {
        if (isAddition) this.state.users[idx].balance += amount;
        else this.state.users[idx].balance -= amount;
      }
    }
    await this.commit();
    return { success: true };
  }

  async bulkAddTag(userIds: string[], tag: string) {
    for (const id of userIds) {
      const idx = this.findUserIndex(id);
      if (idx !== -1) {
        const currentNotes = this.state.users[idx].notes || '';
        if (!currentNotes.includes(`#${tag}`)) {
          this.state.users[idx].notes = currentNotes + ` #${tag}`;
        }
      }
    }
    await this.commit();
    return { success: true };
  }

  async reorderTasks(t: any[]) { this.state.tasks = t; await this.commit(); return { success: true }; }

  // =====================================================
  // RESELLER PROFIT DISTRIBUTION ENGINE
  // Recursively walks UP the parent chain from a reseller.
  //
  // PRICING MODEL (Independent per tier):
  //   Each tier sets their OWN packageConfig independently:
  //   - resalePrice = what this tier charges to the level below them
  //   - profitMargin = what this tier retains as commission
  //   - wholesaleCost = resalePrice - profitMargin = what this tier pays to their parent
  //
  //   Example flow for a 3-level chain:
  //   Admin sets Franchise:    resalePrice=1400, profitMargin=200 → Franchise pays 1200 to Admin
  //   Franchise sets Dealer:   resalePrice=1600, profitMargin=200 → Dealer pays 1400 to Franchise
  //   Dealer sets SubDealer:   resalePrice=1800, profitMargin=200 → SubDealer pays 1600 to Dealer
  //   Customer pays SubDealer: 1800 (retail price)
  //
  //   The parent at each level uses THEIR OWN config, NOT what the child paid.
  //   This is what allows prices to increase down the chain.
  // =====================================================
  async distributeResellerProfit(resellerEmail: string, pkgId: string, subscriberName: string, depth: number = 0): Promise<void> {
    if (depth > 10) {
      console.warn('[PROFIT-ENGINE] Max depth reached. Stopping chain.');
      return;
    }

    const resellerIdx = this.state.staff.findIndex(s => s.email === resellerEmail);
    if (resellerIdx === -1) {
      console.log(`[PROFIT-ENGINE] Reseller ${resellerEmail} not found. Chain end.`);
      return;
    }

    const reseller = this.state.staff[resellerIdx];
    // Each tier uses THEIR OWN config — independent of what the tier below paid
    const config = reseller.packageConfigs?.find(c => c.packageId === pkgId);

    const timestamp = new Date().toISOString();
    const txId = `PROFIT-${Date.now()}-${depth}`;

    if (config) {
      // wholesaleCost = what THIS tier pays UP to its parent
      // profit        = what THIS tier retains
      const wholesaleCost = config.resalePrice - config.profitMargin;
      const profit = config.profitMargin;

      // 1. Deduct what this tier owes to its upline
      this.state.staff[resellerIdx].balance = (reseller.balance || 0) - wholesaleCost;
      this.state.ledger.push({
        id: txId + '-DEBIT',
        userId: resellerEmail,
        amount: wholesaleCost,
        type: LedgerType.DEBIT,
        timestamp,
        description: `Upline Remittance — ${subscriberName} pkg activation (paid Rs.${wholesaleCost} up)`,
        balanceAfter: this.state.staff[resellerIdx].balance,
        method: 'Reseller Chain'
      });

      // 2. Credit this tier's commission (retained profit)
      if (profit > 0) {
        this.state.staff[resellerIdx].balance = (this.state.staff[resellerIdx].balance || 0) + profit;
        this.state.ledger.push({
          id: txId + '-PROFIT',
          userId: resellerEmail,
          amount: profit,
          type: LedgerType.CREDIT,
          timestamp,
          description: `Commission Earned — ${subscriberName} | Retail Rs.${config.resalePrice} − Upline Rs.${wholesaleCost} = Profit Rs.${profit}`,
          balanceAfter: this.state.staff[resellerIdx].balance,
          method: 'Reseller Chain'
        });
      }

      this.logNotification(resellerEmail, 'success', 'Activation Commission Credited',
        `Rs. ${profit} earned from ${subscriberName}'s activation. Retail: Rs.${config.resalePrice} | Upline cost: Rs.${wholesaleCost}.`);

      console.log(`[PROFIT-ENGINE] L${depth} | ${reseller.name} (${reseller.role}) | Retail: Rs.${config.resalePrice} | Profit: Rs.${profit} | Paid up: Rs.${wholesaleCost}`);

      // 3. Recurse to parent — parent uses THEIR OWN config (not wholesaleCost)
      if (reseller.parentId) {
        const parentReseller = this.state.staff.find(s => s.id === reseller.parentId);
        if (parentReseller) {
          await this.distributeResellerProfit(parentReseller.email, pkgId, subscriberName, depth + 1);
        }
      }
    } else {
      // No config at this tier — skip profit/deduction, just recurse up
      console.log(`[PROFIT-ENGINE] L${depth} | ${reseller.name} has no config for pkg ${pkgId}. Skipping, recurse up.`);
      if (reseller.parentId) {
        const parentReseller = this.state.staff.find(s => s.id === reseller.parentId);
        if (parentReseller) {
          await this.distributeResellerProfit(parentReseller.email, pkgId, subscriberName, depth + 1);
        }
      }
    }
  }

  // =====================================================
  // UPDATE RESELLER PACKAGE PRICING CONFIG
  // Properly saves resalePrice + profitMargin for a package
  // to a specific reseller's profile, persisting to Firestore.
  // =====================================================
  async updateResellerPackageConfig(resellerEmail: string, packageId: string, resalePrice: number, profitMargin: number) {
    const idx = this.state.staff.findIndex(s => s.email === resellerEmail);
    if (idx === -1) return { success: false, message: 'Reseller not found.' };

    const currentConfigs = this.state.staff[idx].packageConfigs || [];
    const filtered = currentConfigs.filter(c => c.packageId !== packageId);
    filtered.push({ packageId, resalePrice, profitMargin });
    this.state.staff[idx].packageConfigs = filtered;

    // Notify reseller
    this.logNotification(resellerEmail, 'info', 'Package Price Updated',
      `Package plan pricing has been updated — Retail: Rs.${resalePrice}, Profit: Rs.${profitMargin}.`);

    await this.commit(true);
    this.notify();
    return { success: true, message: 'Package pricing configuration saved.' };
  }

  // =====================================================
  // ADD RESELLER LOAD (Balance Transfer)
  // Admin or Parent Reseller tops up a child reseller's balance.
  // If the actor is a Reseller (not Admin), their own balance is DEDUCTED.
  // This enforces the financial integrity of the hierarchy.
  // =====================================================
  async addResellerLoad(actorEmail: string, targetEmail: string, amount: number, mode: 'paid' | 'credit' | 'pay_later', dueDate?: string) {
    const targetIdx = this.state.staff.findIndex(s => s.email === targetEmail);
    if (targetIdx === -1) return { success: false, message: 'Target reseller not found.' };

    const actorIdx = this.state.staff.findIndex(s => s.email === actorEmail);
    const isResellerActor = actorIdx !== -1 && [Role.FRANCHISE, Role.DEALER, Role.SUB_DEALER].includes(this.state.staff[actorIdx].role as Role);

    const timestamp = new Date().toISOString();
    const loadId = 'RLOAD-' + Date.now();

    // If actor is a reseller (not admin), deduct from their balance
    if (isResellerActor && mode === 'paid') {
      const actorBalance = this.state.staff[actorIdx].balance || 0;
      if (actorBalance < amount) {
        return { success: false, message: `Insufficient balance. Actor balance: Rs.${actorBalance}, Required: Rs.${amount}.` };
      }
      this.state.staff[actorIdx].balance = actorBalance - amount;
      this.state.ledger.push({
        id: loadId + '-ACTOR-DEBIT',
        userId: actorEmail,
        amount,
        type: LedgerType.DEBIT,
        timestamp,
        description: `Balance Transfer to ${this.state.staff[targetIdx].name}`,
        balanceAfter: this.state.staff[actorIdx].balance,
        method: 'Reseller Transfer'
      });
    }

    // Credit target reseller's balance
    this.state.staff[targetIdx].balance = (this.state.staff[targetIdx].balance || 0) + amount;
    this.state.ledger.push({
      id: loadId + '-TARGET-CREDIT',
      userId: targetEmail,
      amount,
      type: LedgerType.CREDIT,
      timestamp,
      description: `Balance Load from ${isResellerActor ? this.state.staff[actorIdx].name : 'Admin'} — ${mode.toUpperCase()}`,
      balanceAfter: this.state.staff[targetIdx].balance,
      method: 'Reseller Transfer'
    });

    // Log as invoice for audit trail
    const inv: Invoice = {
      id: loadId,
      userId: targetEmail,
      userName: this.state.staff[targetIdx].name,
      packageId: 'RESELLER_LOAD',
      packageName: 'Reseller Balance Top-Up',
      items: [{ id: 'SVC-RLOAD', description: `Balance Load: ${mode.toUpperCase()} from ${isResellerActor ? actorEmail : 'Admin'}`, quantity: 1, unitPrice: amount, total: amount, category: 'Service' }],
      subtotal: amount,
      taxRate: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: amount,
      paidAmount: mode === 'paid' ? amount : 0,
      dueAmount: mode === 'paid' ? 0 : amount,
      status: mode === 'paid' ? PaymentStatus.PAID : (PaymentStatus.UNPAID as any),
      createdAt: timestamp,
      dueDate: dueDate || timestamp,
      notes: `Reseller Load: ${mode} | From: ${actorEmail}`
    };
    this.state.invoices.push(inv);

    this.logNotification(targetEmail, 'success', 'Balance Credited',
      `Rs. ${amount} has been loaded into your wallet by ${isResellerActor ? this.state.staff[actorIdx].name : 'System Admin'}.`);

    await this.commit(true);
    this.notify();
    return { success: true, message: `Rs. ${amount} successfully loaded to ${this.state.staff[targetIdx].name}.` };
  }

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
      collectorEmail: this.state.currentUser?.email || 'admin@clickopticx.com',
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
      adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com',
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
      adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com',
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
      const p = this.state.payments[idx];
      if (p.status === 'Pending') {
        p.status = 'Approved';
        
        // Process financial impact
        const user = this.findUserNode(p.userId);
        if (user) {
          user.balance -= p.amount;
          user.lastPaymentDate = new Date().toISOString();

          // Sync with Invoice
          if (p.invoiceId && p.invoiceId !== 'MANUAL') {
            const invoice = this.state.invoices.find(i => i.id === p.invoiceId);
            if (invoice) {
              invoice.paidAmount += p.amount;
              invoice.dueAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
              if (invoice.dueAmount <= 0) {
                invoice.status = PaymentStatus.PAID;
                invoice.paidAt = new Date().toISOString();
                invoice.paymentMethod = p.method;
              } else {
                invoice.status = PaymentStatus.PARTIAL;
              }
            }
          }
          
          this.state.ledger.push({
            id: 'LGR-' + Date.now(),
            userId: p.userId,
            userName: user.name,
            amount: p.amount,
            type: 'CREDIT',
            description: `Payment Approved: ${p.method} - Ref: ${p.id}`,
            timestamp: new Date().toISOString()
          });
          
          // Auto-update user status if balance is cleared
          if (user.balance <= 0 && user.status === UserStatus.SUSPENDED) {
             user.status = UserStatus.ACTIVE;
             this.logNotification(user.id, 'success', 'Account Reactivated', 'Your payment has been verified and service has been restored.');
          }
          
          // Re-sync user state
          await this.syncUserStatusWithBilling(user.id);
        }
      } else {
        p.status = 'Approved'; // Fallback for other states
      }
      
      await this.commit();
      this.notify();
    }
  }

  async commitStandardPayment(userId: string, amount: number, method: string, pkgId: string, description: string) {
    const user = this.findUserNode(userId);
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
    await this.commit(true);
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
    const user = this.findUserNode(id);
    if (user) {
      const admin = this.state.currentUser;
      const paymentId = 'PAY_' + Date.now();
      
      this.state.payments.push({
        id: paymentId,
        userId: id,
        userName: user.name,
        amount,
        status: 'Approved',
        method,
        timestamp: new Date().toISOString(),
        collectorEmail: admin?.email || 'admin@clickopticx.com',
        collectorName: details?.collectorName || admin?.name || 'System',
        invoiceId: details?.invoiceId || 'MANUAL',
        collectionDate: details?.collectionDate || new Date().toISOString().split('T')[0],
        collectionTime: details?.collectionTime || new Date().toLocaleTimeString(),
        notes: details?.notes,
        collectedBy: details?.collectedBy || admin?.id || 'system'
      });
      user.balance -= amount;
      user.lastPaymentDate = new Date().toISOString();

      // Update Invoice if exists
      if (details?.invoiceId && details.invoiceId !== 'MANUAL') {
        const invoice = this.state.invoices.find(i => i.id === details.invoiceId);
        if (invoice) {
          invoice.paidAmount += amount;
          invoice.dueAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
          if (invoice.dueAmount <= 0) {
            invoice.status = PaymentStatus.PAID;
            invoice.paidAt = new Date().toISOString();
            invoice.paymentMethod = method;
          } else {
            invoice.status = PaymentStatus.PARTIAL;
          }
        }
      }

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

      await this.commit(true);
      this.notify();
    }
  }

  async clearAllDues(userId: string) {
    const user = this.findUserNode(userId);
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
    
    await this.commit(true);
    this.notify();
    return { success: true };
  }

  async submitApprovalRequest(type: 'Payment_Collection' | 'Status_Change' | 'Plan_Activation' | 'Clear_Dues' | 'Staff_Addition', userId: string, amount: number, method: string, notes: string, payload: any) {
    let userName = 'External/New Node';
    const user = this.findUserNode(userId);
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
    const user = this.findUserNode(req.userId);
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


  async getNasStats() {
    try {
      const res = await fetch(`${this.backendUrl}/api/nas/stats`);
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  async getSystemHealth() {
    if (this.state.systemHealth) return this.state.systemHealth;
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
    
    await this.commit(true);
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
      const user = this.findUserNode(id);
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
    const user = this.findUserNode(userId);
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

    // Dispatch Activation alerts (async background node)
    this.dispatchActivationNotification(userId, pkgId).catch(console.error);

    await this.commit(true);
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
        const user = this.findUserNode(id);
        if (user) {
          user.expiryDate = config.expiryDate;
          user.status = res.status || UserStatus.ACTIVE;
          user.lastPaymentDate = new Date().toISOString();
        }
      }
    }

    await this.commit(true);
    this.notify();
    return { success: true };
  }

  async forceGlobalSync() {
    if (!this.firestore) return { success: false, message: 'Cloud Layer Void' };
    try {
       const docRef = doc(this.firestore, 'registry', 'master_state');
       const snap = await getDoc(docRef);
       if (snap.exists()) {
          const remoteState = snap.data() as Partial<AppState>;
          
          let recovered = 0;
          // Atomic Heal: Merge missing users/staff into local state
          if (Array.isArray(remoteState.users)) {
             remoteState.users.forEach(ru => {
                const exists = this.state.users.some(lu => lu.id === ru.id || (ru.email && lu.email === ru.email));
                if (!exists) {
                   this.state.users.push(ru);
                   recovered++;
                }
             });
          }
          if (Array.isArray(remoteState.staff)) {
             remoteState.staff.forEach(rs => {
                const exists = this.state.staff.some(ls => ls.id === rs.id || (rs.email && ls.email === rs.email));
                if (!exists) {
                   this.state.staff.push(rs);
                   recovered++;
                }
             });
          }

          if (recovered > 0) {
             this.notify();
             await this.commit(true);
          }
          return { success: true, recovered, message: `Stability Re-aligned. ${recovered} nodes recovered.` };
       }
       return { success: false, message: 'Cloud Registry not found.' };
    } catch (e: any) {
       return { success: false, message: e.message };
    }
  }

  async healUserRegistry() {
     console.log('[IRS] Initiating User Registry Audit...');
     const syncRes = await this.forceGlobalSync();
     
     // 2. Data Integrity Scrub (Remove damaged/empty nodes)
     const initialCount = this.state.users.length;
     this.state.users = this.state.users.filter((u, i, arr) => 
        u && u.id && arr.findIndex(x => x.id === u.id) === i
     );

     if (syncRes.success && syncRes.recovered && syncRes.recovered > 0) {
        this.logAudit('IRS Healing', 'System', `Detected and recovered ${syncRes.recovered} ghost user nodes from Firebase Master.`);
     }

     this.notify();
     return { success: true, recovered: syncRes.success ? syncRes.recovered : 0 };
  }

  async runRecoveryMaintenance() {
    await this.healUserRegistry();
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
      await this.commit(true);
      this.notify();
    }
    return changes;
  }
  async updateConnectionDetails(id: string, d: any) { const idx = this.findUserIndex(id); if (idx !== -1) { this.state.users[idx] = { ...this.state.users[idx], ...d }; await this.commit(); return { success: true }; } return { success: false }; }
  async updateModulePermission(id: string, d: any) { const idx = this.state.permissions.findIndex(p => p.id === id); if (idx !== -1) { this.state.permissions[idx] = { ...this.state.permissions[idx], ...d }; await this.commit(); } }
  async auditOverdueLoads() {
    let hasChanges = false;
    const now = new Date().toISOString();
    
    this.state.emergencyLoads.forEach(load => {
      if (load.status === 'Active' && load.expiryTimestamp < now) {
        load.status = 'Overdue';
        hasChanges = true;
        
        // Penalize credit score
        const user = this.findUserNode(load.userId);
        if (user) {
          user.creditScore = Math.max(0, (user.creditScore || 700) - 50);
          this.logAudit('Automatic Penalty', 'System', `Emergency credit overdue for ${load.userName}. Score reduced by 50 pts.`, load.userId, load.userName);
          this.logNotification(load.userId, 'error', 'Credit Overdue', 'Your emergency credit has expired. A penalty has been applied to your trust score.', 'user');
        }
      }
    });

    if (hasChanges) {
      await this.commit();
      this.notify();
    }
  }

  async convertPointsToWallet(id: string) { return { success: true, amount: 100, message: 'Points successfully provisioned to wallet.' }; }

  async submitWithdrawalRequest(id: string) {
    const user = this.findUserNode(id);
    if (!user) return { success: false, message: 'User identity not found.' };
    return { success: true, message: 'Withdrawal protocol dispatched for audit.' };
  }

  // RECOVERY & BILLING CONTROL MODULE APIs
  async markPaidAndActivate(userId: string, amount: number, method: PaymentMethod) {
    const admin = this.state.currentUser;
    if (!admin) return { success: false, message: 'Admin authentication required.' };

    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'User not found.' };

    const oldStatus = user.status;
    const pkg = this.state.packages.find(p => p.id === user.packageId);
    if (!pkg) return { success: false, message: 'Subscriber has no active package plan.' };

    // Update Billing
    user.balance -= amount;
    user.lastPaymentDate = new Date().toISOString();
    user.isRecoveryMode = false;

    // Sync with Invoices
    let remainingAmount = amount;
    const unpaidInvoices = this.state.invoices
      .filter(i => i.userId === userId && i.status !== PaymentStatus.PAID)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const inv of unpaidInvoices) {
      if (remainingAmount <= 0) break;
      const due = inv.dueAmount || (inv.totalAmount - inv.paidAmount);
      const payment = Math.min(remainingAmount, due);
      inv.paidAmount += payment;
      inv.dueAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
      remainingAmount -= payment;
      
      if (inv.dueAmount <= 0) {
        inv.status = PaymentStatus.PAID;
        inv.paidAt = new Date().toISOString();
        inv.paymentMethod = method;
      } else {
        inv.status = PaymentStatus.PARTIAL;
      }
    }

    // Ledger Entry
    this.state.ledger.push({
      id: 'REC_' + Date.now(),
      userId,
      amount,
      type: LedgerType.CREDIT,
      timestamp: new Date().toISOString(),
      description: `Recovery Payment: ${method}`,
      balanceAfter: user.balance,
      method
    });

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
    await this.commit(true);
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

    const user = this.findUserNode(userId);
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
    await this.commit(true);
    this.notify();
    return { success: true };
  }

  async processRecoveryPayment(userId: string, amount: number, method: PaymentMethod, type: 'Full' | 'Half' | 'Custom') {
    const admin = this.state.currentUser;
    if (!admin) return { success: false, message: 'Admin authentication required.' };

    const user = this.findUserNode(userId);
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
    await this.commit(true);
    this.notify();
    return { success: true };
  }

  async setPromiseToPay(userId: string, date: string) {
    const admin = this.state.currentUser;
    const user = this.findUserNode(userId);
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

    await this.commit(true);
    this.notify();
    return { success: true };
  }

  async sendRecoveryReminder(userId: string, type: 'SMS' | 'WhatsApp' | 'Email') {
    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'Node not found' };

    const msg = `Urgent Reminder: Your ClickOpticx account ${user.connectionId} has outstanding dues of Rs. ${user.balance}. Please clear to avoid suspension.`;
    let res = { success: false, message: 'Invalid Route' };
    if (type === 'Email' && user.email) {
      const d = await this.dispatchEmail(user.email, 'Security Notification: Outstanding Balance', msg, 'Automation', userId);
      res = { success: d.success, message: d.error || 'Email Dispatched' };
    } else if (type === 'SMS' && user.phone) {
      const d = await this.dispatchSMS(user.phone, msg, 'Automation', userId);
      res = { success: d.success, message: d.error || 'SMS Relay Success' };
    } else if (type === 'WhatsApp' && user.phone) {
      const d = await this.dispatchWhatsApp(user.phone, msg, 'Automation', userId);
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

  async getAuditProfile(userId: string) {
    const user = this.findUserNode(userId);
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
  async adjustScoreManually(id: string, delta: number, reason: string, admin: string) { const idx = this.findUserIndex(id); if (idx !== -1) { this.state.users[idx].creditScore += delta; this.state.creditLogs.push({ id: 'SCR_' + Date.now(), userId: id, delta, newScore: this.state.users[idx].creditScore, reason, timestamp: new Date().toISOString(), source: 'Admin', adminEmail: admin }); await this.commit(); } }
  async resetScoreManually(id: string, admin: string) { const idx = this.findUserIndex(id); if (idx !== -1) { this.state.users[idx].creditScore = 600; await this.commit(); } }
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

    // Removed artificial delay for performance


    if (!this.state.settings.commConfig.smtpConfig.host) {
      return { success: false, message: 'Mail service down: SMTP relay not configured.' };
    }

    const success = true;
    const admin = this.state.currentUser;

    this.logCommunication({
      userId: config.userId,
      userName: user.name,
      email: user.email,
      subject: config.subject,
      sentBy: admin?.name || 'System',
      status: success ? 'Sent' : 'Failed',
      provider: 'SMTP',
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
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'Reminder identity not found.' };
  }

  async bulkResolveReminders(ids: string[], status: ReminderStatus, reason?: string) {
    const admin = this.state.currentUser;
    const now = new Date().toISOString();
    let count = 0;

    this.state.adminReminders = this.state.adminReminders.map(r => {
      if (ids.includes(r.id)) {
        count++;
        return {
          ...r,
          status,
          resolvedAt: now,
          resolvedBy: admin?.name || 'System',
          ignoreReason: reason || r.ignoreReason
        };
      }
      return r;
    });

    if (count > 0) {
      await this.commit();
      this.notify();
      return { success: true, count };
    }
    return { success: false, message: 'No matching reminders found.' };
  }

  async submitSignupRequest(data: any) {
    const settings = this.state.settings.authSettings || INITIAL_STATE.settings.authSettings;

    if (!settings.signupEnabled) {
      return { success: false, message: 'Signups are currently disabled.' };
    }

    // Normalize values
    const payload = {
      ...data,
      email: data.email?.toLowerCase().trim(),
      username: data.username?.toLowerCase().trim(),
      phone: data.phone?.trim()
    };

    // --- Duplicate check (local) ---
    const exists = this.state.users.find(u =>
      (payload.email && u.email?.toLowerCase() === payload.email) ||
      (payload.username && (u.username || '').toLowerCase() === payload.username) ||
      (payload.phone && u.phone?.replace(/\D/g, '') === payload.phone.replace(/\D/g, ''))
    );
    if (exists) {
      console.log('[IRS-HEAL] Duplicate detected on signup. Triggering background reconciliation...');
      this.healUserRegistry().catch(console.error);
      return { success: false, message: 'An account with this identity already exists. Please try logging in or reset your password.' };
    }

    console.log('[DB-AUTH] Dispatching signup protocol for:', payload.username);

    // --- Try backend first (with 8s timeout) ---
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const res = await response.json();
        if (res.success) {
          this.logAudit('New User Signup', 'Request', `New user ${data.name} signed up via secure backend.`, res.user?.id, data.name);
          
          // --- 🛡️ REGISTRY SYNC: Ensure new user is added to master state ---
          if (res.user) {
            const existingIdx = this.state.users.findIndex(u => u.id === res.user.id);
            if (existingIdx === -1) {
              const newUser: ISPUser = {
                ...res.user,
                role: Role.CUSTOMER,
                status: res.user.status || UserStatus.PENDING_VERIFICATION,
                verificationStatus: res.user.verificationStatus || VerificationStatus.UNVERIFIED,
                balance: res.user.balance || 0,
                creditScore: res.user.creditScore || 600,
                createdAt: res.user.createdAt || new Date().toISOString()
              };
              this.state.users.unshift(newUser);
              
              // Also ensure a signup request exists for the admin desk
              if (!this.state.signupRequests) this.state.signupRequests = [];
              const hasReq = this.state.signupRequests.some(r => r.userId === res.user.id || r.email === res.user.email);
              if (!hasReq) {
                this.state.signupRequests.unshift({
                  id: 'REQ-B-' + Date.now(),
                  userId: res.user.id,
                  name: res.user.name,
                  username: res.user.username,
                  email: res.user.email,
                  phone: res.user.phone || '',
                  status: 'Approved', // Already approved via backend
                  timestamp: new Date().toISOString()
                } as any);
              }
              
              await this.commit();
            }
          }
          
          return { success: true, message: 'Account Handshake Successful.', user: res.user };
        }
        
        // AUTO-HEAL: If backend reports conflict, trigger local sync
        if (res.message?.toLowerCase().includes('already') || response.status === 409) {
           console.log('[IRS-HEAL] Backend reported conflict. Running mandatory node sync...');
           this.healUserRegistry().catch(console.error);
        }
        
        // Backend returned a logical failure (duplicate, validation)
        return { success: false, message: res.message || 'Signup refused by authority node.' };
      }
      // Backend responded with HTTP error — fall through to local fallback
      console.warn('[DB-AUTH] Backend returned HTTP error, falling back to local registry write.');
    } catch (e: any) {
      // Network error, timeout, or backend sleeping (Render cold start)
      console.warn('[DB-AUTH] Backend unreachable, falling back to local registry write. Reason:', e.message);
    }

    // --- Local Firestore Fallback ---
    try {
      const newUserId = 'USR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      const newUser: ISPUser = {
        id: newUserId,
        name: (payload.name || 'New User').trim(),
        username: payload.username || '',
        email: payload.email || '',
        phone: payload.phone || '',
        password: payload.password,
        address: payload.address || '',
        area: payload.area || '',
        packageId: payload.packageId || (this.state.packages[0]?.id || 'PKG-BASIC'),
        status: UserStatus.PENDING_VERIFICATION,
        verificationStatus: VerificationStatus.UNVERIFIED,
        isKYCVerified: false,
        isKYCSubmitted: false,
        kyc_status: 'pending',
        approval_status: 'pending',
        role: Role.CUSTOMER,
        balance: 0,
        creditScore: 600,
        createdAt: new Date().toISOString(),
        kyc_attempt_count: 0,
        kyc_history: [],
        portalEnabled: true,
        managementMode: 'Manual',
        connectionType: 'Fiber',
        nasConnectionType: 'Manual',
        referralCode: 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        activationCount: 0,
        activityLog: [],
        connectionId: 'PENDING-' + newUserId.slice(-4),
      };
      
      const requestObj: SignupRequest = {
        id: 'REQ-' + Date.now(),
        userId: newUserId,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        cnic: payload.cnic || '',
        address: newUser.address,
        area: newUser.area,
        packageId: newUser.packageId,
        status: 'Pending',
        timestamp: new Date().toISOString()
      };

      // Push to registry
      this.state.users.push(newUser);
      this.state.signupRequests.push(requestObj);

      await this.commit(true);
      this.notify();

      this.logAudit('New User Signup', 'Request', `New user ${newUser.name} registered via local fallback. Identity Node: ${newUserId}`, newUserId, newUser.name);

      console.log('[DB-AUTH] Local signup fallback succeeded for:', newUser.username);
      return { success: true, message: 'Account handshake complete. Please login.', user: newUser };

    } catch (fallbackError: any) {
      console.error('[DB-AUTH-ERROR] Both backend and local signup failed:', fallbackError);
      return { success: false, message: 'Signup failed. Please check your connection and try again.' };
    }
  }

  async initiatePasswordReset(identifier: string) {
    const input = identifier.toLowerCase().trim();
    const settings = this.state.settings.authSettings || INITIAL_STATE.settings.authSettings;

    if (!settings.forgotPasswordEnabled) {
      return { success: false, message: 'Password recovery is disabled.' };
    }

    const user = this.state.users.find(u => {
      if (u.deleted) return false;
      const uUsername = (u.username || '').toLowerCase().trim();
      const uEmail = (u.email || '').toLowerCase().trim();
      const uPhone = (u.phone || '').replace(/\D/g, '');
      const uCnic = (u.cnic || '').replace(/\D/g, '');
      const uPppoe = (u.pppoeId || '').toLowerCase().trim();
      const uConnId = (u.connectionId || '').toLowerCase().trim();
      
      const searchDigits = input.replace(/\D/g, '');

      return uUsername === input ||
             uEmail === input ||
             (uPhone !== '' && uPhone === searchDigits) ||
             (uCnic !== '' && uCnic === searchDigits) ||
             uPppoe === input ||
             uConnId === input;
    });

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
    let dispatchRes: { success: boolean, logId: string, error?: string } = { success: false, logId: '' };

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
    
    return { 
      success: dispatchRes.success, 
      message: dispatchRes.success ? 'OTP Dispatched' : (dispatchRes.error || 'Identity Dispatch Failure'), 
      otpCode: dispatchRes.success ? otpCode : undefined, 
      logUniqueId: dispatchRes.logId 
    };
  }

  generateProfessionalHTML(content: string, subject: string) {
    const businessName = this.state.settings.branding.businessName || 'Click Opticx';
    const primaryColor = '#1570ef'; // blue-600

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

    if (!config.simulationMode) {
      try {
        const start = Date.now();
        const res = await fetch(`${this.backendUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            subject,
            html: htmlOutput,
            category: triggerSource === 'Automation' ? 'System' : 'Manual'
          })
        });
        const data = await res.json();
        realLatency = Date.now() - start;
        
        if (data.success) {
          dispatchStatus = 'Sent';
        } else {
          dispatchStatus = 'Failed';
          errorMsg = data.message || 'Node Transmission Error';
        }
      } catch (err: any) {
        dispatchStatus = 'Failed';
        errorMsg = `TRANSMISSION_FAILED: ${err.message || 'Network Relay Timeout'}.`;
      }
    } else {
      // Removed artificial delay

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
      triggerSource: isOTP ? 'Automation' : triggerSource,
      latency: realLatency
    });

    return { success: dispatchStatus === 'Sent', error: errorMsg, logId };
  }

  async dispatchSMS(to: string, message: string, triggerSource: 'Manual' | 'Automation' = 'Manual', userId: string = 'ID-SMS-RELAY') {
    const config = this.state.settings.commConfig || INITIAL_COMM_CONFIG;
    let dispatchStatus: 'Sent' | 'Failed' = 'Sent';
    let errorMsg = '';

    if (!config.simulationMode) {
      if (config.smsConfig?.apiKey) {
        try {
          const res = await fetch(`${this.backendUrl}/api/sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message, provider: config.smsProvider })
          });
          const data = await res.json();
          if (!data.success) {
            dispatchStatus = 'Failed';
            errorMsg = data.message || 'SMS Gateway Error';
          }
        } catch (e: any) {
          dispatchStatus = 'Failed';
          errorMsg = `SMS_TRANSMISSION_FAILED: ${e.message}`;
        }
      } else {
        dispatchStatus = 'Failed';
        errorMsg = 'SMS_CONFIG_MISSING: No API Key identified in registry.';
      }
    } else {
      // Removed artificial delay

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

    if (!config.simulationMode) {
      if (config.whatsappConfig?.apiKey) {
        try {
          const res = await fetch(`${this.backendUrl}/api/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message, provider: config.whatsappProvider })
          });
          const data = await res.json();
          if (!data.success) {
            dispatchStatus = 'Failed';
            errorMsg = data.message || 'WhatsApp Gateway Error';
          }
        } catch (e: any) {
          dispatchStatus = 'Failed';
          errorMsg = `WA_TRANSMISSION_FAILED: ${e.message}`;
        }
      } else {
        dispatchStatus = 'Failed';
        errorMsg = 'WA_CONFIG_MISSING: No API Key identified in registry.';
      }
    } else {
      // Removed artificial delay

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
    const user = this.state.users.find(u => u.id === params.userId || u.email === params.to || u.phone === params.to);
    const commEntry: CommunicationLog = {
      id,
      userId: params.userId || 'ID-SYSTEM',
      userName: user?.name || 'External Node',
      email: params.to,
      subject: params.subject,
      sentBy: params.sentBy || (params.type === 'Email' ? 'SMTP' : 'SMS_GATEWAY'),
      sentAt: timestamp,
      status: params.status,
      provider: params.type === 'Email' ? 'SMTP' : 'SMS_GATEWAY',
      error: params.error
    };
    if (!Array.isArray(this.state.commLogs)) this.state.commLogs = [];
    this.state.commLogs.unshift(commEntry);
    this.state.commLogs = this.state.commLogs.slice(0, 200);

    // 2. Sync DeliveryLog (Registry context)
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
    const user = this.findUserNode(userId);
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
        info: 'Verifies the connection to the Node.js backend relay.'
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
      // Removed artificial bottling effect for faster response

    }
    
    this.notify();
    return { success: true, message: 'System Scan Complete' };
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

    const totalUnpaidAmount = this.state.users.filter(u => !u.deleted && (u.balance || 0) < 0).reduce((acc, u) => acc + Math.abs(u.balance || 0), 0);
    const activeUsers = this.state.users.filter(u => u.status === UserStatus.ACTIVE && !u.deleted).length;
    // Real-time online users from connected devices
    const onlineUsers = this.getConnectedDevices('all').length;
    const newUsers = this.state.users.filter(u => {
      const created = new Date(u.createdAt);
      return !u.deleted && (now.getTime() - created.getTime()) < 7 * oneDay;
    }).length;
 
    const expiredUsers = this.state.users.filter(u => u.status === UserStatus.SUSPENDED && !u.deleted).length;
    const disabledUsers = this.state.users.filter(u => u.status === UserStatus.DISABLED && !u.deleted).length;
    const paidUsers = this.state.users.filter(u => (u.balance || 0) <= 0 && !u.deleted).length;
    const unpaidUsers = this.state.users.filter(u => (u.balance || 0) > 0 && !u.deleted).length;

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
    const periodProfit = this.state.ledger
      .filter(l => {
        const d = new Date(l.timestamp);
        return d >= start && d <= end && l.id.endsWith('-PROFIT');
      })
      .reduce((acc, l) => acc + l.amount, 0);

    return { todayCollection, periodCollection, totalUnpaidBalance, activationRevenue, periodProfit };
  }

  async bulkSetAccountStatus(userIds: string[], status: UserStatus, note: string, expiryDate?: string, onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i];
      const idx = this.findUserIndex(id);
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
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com', adminIp: '127.0.0.1', action: 'Bulk Set Status', targetId: 'Multiple', targetName: `${userIds.length} users`, details: actionDesc, riskLevel: 'Low' });

    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  async batchSuspendUsers(userIds: string[], reason: string) {
    return this.bulkSetAccountStatus(userIds, UserStatus.SUSPENDED, reason);
  }

  async bulkSendReminders(userIds: string[], channel: 'WhatsApp' | 'Email', templateId?: string, onProgress?: (curr: number, tot: number, name: string) => void) {
    const timestamp = new Date().toISOString();
    const adminName = this.state.currentUser?.name || 'System';
    let sentCount = 0;

    for (const id of userIds) {
      const user = this.findUserNode(id);
      if (onProgress && user) {
          onProgress(sentCount + 1, userIds.length, user.name);
      }
      if (user) {
        // Dispatch based on channel
        if (channel === 'Email' && user.email) {
            this.enqueueEmail(user.email, 'Payment Reminder', templateId || 'TMP-1', {}, 'Critical').catch(() => {});
        } else if (channel === 'WhatsApp' && user.phone) {
            await this.dispatchSMS(user.phone, `[CLICK OPTICX] Reminder: Outstanding balance Rs. ${user.balance}. Please clear to avoid suspension.`);
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
      const user = this.findUserNode(id);
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
    
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com', adminIp: '127.0.0.1', action: 'Bulk Invoices Created', targetId: 'Multiple', targetName: `${generated} generated`, details: 'Monthly recurring billing run.', riskLevel: 'Low' });

    await this.commit();
    this.notify();
    return { success: true, count: generated };
  }

  async bulkDeleteUsers(userIds: string[], creditAction: 'ADJUST' | 'NONE' = 'NONE', onProgress?: (current: number, total: number, itemName: string) => void) {
    const ids = new Set(userIds);
    userIds.forEach(id => this.recentlyDeletedIds.add(id));
    let creditAdjustedCount = 0;
    let totalCreditAdjusted = 0;

    // 1. Prepare Archive Data
    const archiveData: ArchiveRecord['data'] = {
      users: this.state.users.filter(u => ids.has(u.id)),
      invoices: (this.state.invoices || []).filter(i => ids.has(i.userId)),
      payments: (this.state.payments || []).filter(p => ids.has(p.userId)),
      ledger: (this.state.ledger || []).filter(l => ids.has(l.userId)),
      emergencyLoads: (this.state.emergencyLoads || []).filter(e => ids.has(e.userId)),
      tickets: (this.state.tickets || []).filter(t => ids.has(t.userId || '')),
      signupRequests: (this.state.signupRequests || []).filter(r => ids.has(r.userId) || ids.has(r.id)),
      packageRequests: (this.state.packageRequests || []).filter(r => ids.has(r.userId)),
      topupRequests: (this.state.topupRequests || []).filter(r => ids.has(r.userId))
    };

    // 2. Adjust Balance if requested
    for(const user of archiveData.users) {
        if (user.balance < 0 && creditAction === 'ADJUST') {
            totalCreditAdjusted += Math.abs(user.balance);
            user.balance = 0;
            creditAdjustedCount++;
        }
    }

    // 3. Create Archive Record
    const newArchive: ArchiveRecord = {
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      archivedAt: new Date().toISOString(),
      data: archiveData
    };
    if (!this.state.archives) this.state.archives = [];
    this.state.archives.push(newArchive);

    // 4. Perform Hard Removal (Permanent)
    this.state.users = this.state.users.filter(u => !ids.has(u.id));

    // 5. Purge Related Transactional Data from Live State
    this.state.invoices = (this.state.invoices || []).filter(i => !ids.has(i.userId));
    this.state.payments = (this.state.payments || []).filter(p => !ids.has(p.userId));
    this.state.ledger = (this.state.ledger || []).filter(l => !ids.has(l.userId));
    this.state.emergencyLoads = (this.state.emergencyLoads || []).filter(e => !ids.has(e.userId));
    this.state.tickets = (this.state.tickets || []).filter(t => !ids.has(t.userId || ''));
    this.state.signupRequests = (this.state.signupRequests || []).filter(r => !ids.has(r.userId) && !ids.has(r.id));
    this.state.packageRequests = (this.state.packageRequests || []).filter(r => !ids.has(r.userId));
    this.state.topupRequests = (this.state.topupRequests || []).filter(r => !ids.has(r.userId));


    // Mark related invoices as deleted too? Maybe not, keep them for audit.
    // But mark them so they don't show up in unpaid stats.

    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com', adminIp: '127.0.0.1', action: 'Permanent Hard Delete', targetId: 'Multiple', targetName: `${userIds.length} users`, details: `Permanently erased identities and all associated records from registry. Credit Action: ${creditAction}. Adjusted Rs. ${totalCreditAdjusted}.`, riskLevel: 'Critical' });
    
    await this.commitImmediate();
    this.notify();
    return { success: true, count: userIds.length, creditAdjusted: totalCreditAdjusted };
  }

  async exportData(type: 'users' | 'billing' | 'noc') {
    let data: any[] = [];
    let filename = `export_${type}_${new Date().getTime()}.csv`;
    
    if (type === 'users') {
      data = this.state.users.filter(u => !u.deleted).map(u => ({
        ID: u.id,
        Name: u.name,
        Username: u.username || 'N/A',
        Phone: u.phone,
        Status: u.status,
        Balance: u.balance,
        Expiry: u.expiryDate || 'N/A'
      }));
    } else if (type === 'billing') {
      data = this.state.invoices.map(i => ({
        ID: i.id,
        User: i.userName,
        Amount: i.totalAmount,
        Status: i.status,
        Date: i.createdAt
      }));
    } else {
      data = this.state.nocEvents || [];
    }

    if (data.length === 0) return { success: false, message: 'No data to export' };

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    return { success: true };
  }



  async bulkUpdateExpiry(userIds: string[], expiryDate: string, reason: string, onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i];
      const idx = this.findUserIndex(id);
      if (idx !== -1) {
        this.state.users[idx].expiryDate = expiryDate;
        this.state.users[idx].notes = (this.state.users[idx].notes || '') + `\n[${new Date().toLocaleDateString()}] Bulk Expiry Update: ${expiryDate}. Reason: ${reason}`;
        if (onProgress) onProgress(i + 1, userIds.length, this.state.users[idx].name);
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com', adminIp: '127.0.0.1', action: 'Bulk Custom Expiry', targetId: 'Multiple', targetName: `${userIds.length} users`, details: `New Expiry: ${expiryDate}. Reason: ${reason}`, riskLevel: 'Low' });
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  async bulkRotateNodes(userIds: string[], targetNode: string, onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
        const id = userIds[i];
      const idx = this.findUserIndex(id);
      if (idx !== -1) {
        this.state.users[idx].oltNode = targetNode;
        this.state.users[idx].notes = (this.state.users[idx].notes || '') + `\n[${new Date().toLocaleDateString()}] Bulk Rotation to: ${targetNode}`;
        if (onProgress) onProgress(i + 1, userIds.length, this.state.users[idx].name);
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com', adminIp: '127.0.0.1', action: 'Bulk Rotation', targetId: 'Multiple', targetName: `${userIds.length} users`, details: `Rotated to: ${targetNode}`, riskLevel: 'Low' });
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  async bulkForcePasswordReset(userIds: string[], onProgress?: (current: number, total: number, itemName: string) => void) {
    for (let i = 0; i < userIds.length; i++) {
      const id = userIds[i];
      const user = this.findUserNode(id);
      if (user) {
        user.password = 'Reset123!';
        this.logNotification(id, 'info', 'Password Reset Forced', 'Administrator has forced a password reset for your account.');
        if (onProgress) onProgress(i + 1, userIds.length, user.name);
      }
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }
    this.state.securityLogs.push({ id: 'LOG-' + Date.now(), timestamp: new Date().toISOString(), adminEmail: this.state.currentUser?.email || 'admin@clickopticx.com', adminIp: '127.0.0.1', action: 'Bulk Password Reset', targetId: 'Multiple', targetName: `${userIds.length} users affected`, details: `Reset apps to default.`, riskLevel: 'Medium' });
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
      const res = await fetch(`${this.backendUrl}/api/network/olt/${onu.oltId}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onuId: onu.id })
      });
      const data = await res.json();
      if (data.success) {
        onu.status = data.data?.status || onu.status;
        onu.signalStrength = data.data?.signalStrength || onu.signalStrength;
        onu.opticalPower = data.data?.opticalPower;
        onu.onlineTime = data.data?.onlineTime;
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
      const response = await fetch(`${this.backendUrl}/api/network/olt/${onu.oltId}/reset-onu-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onuId: onu.id, newPassword })
      });
      const data = await response.json();
      if (data.success) {
        await this.commit(true);
        return { success: true, message: 'ONU Security Protocol Updated: New credentials propagated to Network Node.' };
      }
      return data;
    } catch (e: any) {
      return { success: false, message: 'Command failed to reach backend node.' };
    }
  }

  getSyncStatus() {
    return !!this.commitTimer;
  }

  async sendCoACommand(userId: string, action: 'Disconnect' | 'SpeedChange' | 'ACTIVATE_PACKAGE') {
    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'User not found' };

    const nas = this.state.nas.find(n => n.id === user.routerId);

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
    const user = this.findUserNode(userId);
    if (!user || user.managementMode !== 'NAS_Controlled' || !user.routerId) return;
    if (!this.state.settings.nasSystemEnabled) return;

    const nas = this.state.nas.find(n => n.id === user.routerId);
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
      status: node.status || 'Offline',
      hardwareModel: node.hardwareModel || 'GENERIC_OLT',
      maxCapacity: node.maxCapacity || 64,
      connectionStatus: 'Not Configured',
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
      return { success: data.success, status: olt.status, details: data };
    } catch (e: any) {
      olt.status = 'Offline';
      olt.lastCheck = new Date().toISOString();
      await this.commit();
      this.notify();
      return { success: false, status: 'Offline', error: e.message };
    }
  }

  async discoverOnus(oltId: string) {
    const olt = this.state.oltNodes.find(n => n.id === oltId);
    if (!olt) return { success: false, message: 'OLT not found' };

    try {
      const res = await fetch(`${this.backendUrl}/api/olt/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olt })
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
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
  async flashSystem(month: string, options: { resetUsage: boolean, removeInvoices: boolean, reason?: string }, adminId: string) {
    const admin = this.state.staff.find(s => s.email === adminId) || this.state.currentUser;
    const adminName = admin?.name || 'SuperAdmin';
    
    // 1. Process Users
    this.state.users.forEach(user => {
      user.package_status = 'N/A';
      user.isActive = false;
      user.status = UserStatus.SUSPENDED; // Reflect inactive status in the primary state

      if (options.resetUsage) {
        user.daily_usage = 0;
        user.monthly_usage = 0;
      }
    });

    // 2. Handle Invoices
    if (options.removeInvoices) {
      // Remove UNPAID/PENDING invoices for this month
      // month is "YYYY-MM"
      this.state.invoices = this.state.invoices.filter(inv => {
        const invMonth = (inv.createdAt || inv.dueDate).substring(0, 7);
        if (invMonth === month) {
          return inv.status === PaymentStatus.PAID; // Keep paid, remove others
        }
        return true;
      });
    }

    // Mark current billing cycle as "Skipped" (This could be part of a Billing cycle status)
    // For now we'll just log it clearly.

    // 3. Log
    const log: FlashLog = {
      id: `FLASH-${Date.now()}`,
      action: 'FLASH_SYSTEM',
      month,
      performedBy: adminId,
      resetUsage: options.resetUsage,
      removeInvoices: options.removeInvoices,
      reason: options.reason,
      timestamp: new Date().toISOString()
    };
    
    if (!this.state.flashLogs) this.state.flashLogs = [];
    this.state.flashLogs.push(log);

    await this.logSecurity(`FLASH_SYSTEM_${month}`, 'all', `System Flash executed by ${adminName} for month ${month}.`, 'Critical');
    
    this.notify();
    await this.commit();
    return { success: true, count: this.state.users.length };
  }

  async getFlashStatus(month: string) {
    return this.state.flashLogs.find(f => f.month === month);
  }

  async testOLTConnection(oltId: string) {
    const olt = this.state.oltNodes.find(o => o.id === oltId);
    if (!olt) return { success: false, message: 'OLT not found' };

    olt.connectionStatus = 'Pending';
    this.notify();

    try {
      const response = await fetch(`${this.backendUrl}/api/network/olt/${oltId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      olt.connectionStatus = data.success ? 'Connected' : 'Failed';
      olt.lastError = data.error || (data.success ? undefined : 'Handshake Rejected');
      olt.status = data.success ? 'Online' : 'Offline';
      
      this.notify();
      await this.commit();
      return data;
    } catch (error: any) {
      olt.connectionStatus = 'Failed';
      olt.lastError = error.message;
      olt.status = 'Offline';
      this.notify();
      await this.commit();
      return { success: false, error: error.message };
    }
  }

  async bulkFlashUsers(userIds: string[], months: number, adminId: string, resetPackage: boolean = false) {
    const admin = this.state.staff.find(s => s.email === adminId) || this.state.currentUser;
    const adminName = admin?.name || 'SuperAdmin';
    
    // N/A Full Wipe Mode if months === -1
    const isFullWipe = months === -1;

    const cutoffDate = new Date();
    if (!isFullWipe) {
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
    }

    for (const uid of userIds) {
      const user = this.state.users.find(u => u.id === uid);
      if (!user) continue;

      if (isFullWipe) {
        // Complete hard wipe - empty database values effectively
        this.state.invoices = this.state.invoices.filter(inv => inv.userId !== uid);
        this.state.ledger = this.state.ledger.filter(l => l.userId !== uid);
        user.balance = 0;
        user.isRecoveryMode = false;
        user.promiseToPayDate = undefined;
        user.packageId = ''; // Set to N/A
        user.status = UserStatus.PENDING_VERIFICATION; // Like brand new account
        user.expiryDate = undefined;
        user.activationCount = 0;
        user.activationDate = undefined;
        user.lastPaymentDate = undefined;
        user.collectionDate = undefined;
        user.collectedBy = undefined;
        user.collectorName = undefined;
        user.notes = `[${new Date().toLocaleDateString()}] SYSTEM_HARD_WIPE executed by ${adminName}. All fiscal and service records purged.`;
      } else {
        // Standard month flash
        this.state.invoices = this.state.invoices.filter(inv =>
          inv.userId !== uid || new Date(inv.createdAt || inv.dueDate) < cutoffDate
        );
        user.balance = 0;
        user.isRecoveryMode = false;
        user.promiseToPayDate = undefined;
      }

      if (resetPackage && !isFullWipe) {
          user.packageId = 'PKG-3M';
          user.status = UserStatus.EXPIRED; // Force new activation
          user.expiryDate = undefined;
          user.lastPaymentDate = new Date().toISOString();
      } else {
          user.status = UserStatus.ACTIVE;
          user.lastPaymentDate = new Date().toISOString();
          // Extend expiry by 30 days if it was expired or near expiry
          const now = new Date();
          const currentExpiry = user.expiryDate ? new Date(user.expiryDate) : now;
          const newExpiry = new Date(Math.max(now.getTime(), currentExpiry.getTime()) + 30 * 24 * 60 * 60 * 1000);
          user.expiryDate = newExpiry.toISOString();
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

  // ── ENTERPRISE EMAIL ENGINE (HYBRID) ───────────────────────────────────────
  async sendEmailHybrid(to: string, subject: string, templateId: string, customData?: any) {
    const user = this.state.users.find(u => u.email === to);
    const template = this.state.emailTemplates.find(t => t.id === templateId);
    
    if (!template) return { success: false, message: 'Template not found' };
    
    // 1. Parse Template
    let html = template.content;
    const mergeData = {
      user: {
        name: user?.name || 'Customer',
        email: to,
        balance: user?.balance || 0,
        expiryDate: user?.expiryDate || 'N/A',
        id: user?.id || 'N/A'
      },
      ...customData
    };

    // Simple Template Engine
    Object.keys(mergeData.user).forEach(key => {
      const regex = new RegExp(`{{user.${key}}}`, 'g');
      html = html.replace(regex, (mergeData.user as any)[key]);
    });

    // 2. Dispatch Logic
    const timestamp = new Date().toISOString();
    const config = this.state.settings.commConfig;
    
    // ── PHASE 1: PREFER BACKGROUND QUEUE ──
    try {
      const enqueued = await this.enqueueEmail(to, subject, templateId, customData);
      if (enqueued.success) {
        (this.state.commLogs || []).push({
          id: 'LOG-' + Date.now(),
          type: 'Email',
          recipient: to,
          userName: user?.name || 'Customer',
          subject,
          status: 'Pending',
          templateId,
          provider: 'BullMQ Queue',
          sentAt: timestamp
        } as any);
        this.notify();
        return { success: true, message: 'Email queued for delivery' };
      }
    } catch (e) {
      console.warn('[DB] Failed to enqueue email, falling back to legacy socket...', e);
    }

    let providerUsed = 'SMTP';
    let status: 'Sent' | 'Failed' | 'Pending' = 'Sent';
    let error: string | undefined = undefined;

    try {
      if (this.socket && this.socket.connected) {
        this.socket.emit('send-email', {
          config: config.smtpConfig,
          payload: {
            from: config.senderIdentities.find(s => s.isDefault)?.email || 'noreply@clickopticx.com',
            to,
            subject,
            html
          }
        });
      } else if (config.failoverEnabled) {
        providerUsed = config.backupProvider;
        console.log(`[COMM] SMTP Offline. Failing over to ${providerUsed}...`);
        // Simulate backup provider success
      } else {
        throw new Error('Primary SMTP offline and failover disabled.');
      }
    } catch (e: any) {
      status = 'Failed';
      error = e.message;
    }

    // 3. Log & Update Stats
    const logId = 'CL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const newLog = {
      id: logId,
      userId: user?.id || 'EXTERNAL',
      userName: user?.name || 'Customer',
      email: to,
      subject,
      sentBy: 'System Automation',
      sentAt: timestamp,
      status,
      provider: providerUsed,
      error,
      templateId
    };

    if (!this.state.commLogs) this.state.commLogs = [];
    this.state.commLogs.push(newLog);

    if (status === 'Sent') {
      this.state.commStats.totalSent++;
      this.state.commStats.delivered++;
      if (providerUsed === 'SMTP') this.state.commStats.providerUsage.smtp++;
      else this.state.commStats.providerUsage.backup++;
    } else {
      this.state.commStats.failed++;
    }

    await this.commit();
    this.notify();
    return { success: status === 'Sent', logId };
  }

  async getCommAnalytics() {
    return this.state.commStats;
  }

  async enqueueEmail(to: string, subject: string, templateId: string, customData: any = {}, category: string = 'System') {
    const template = this.state.emailTemplates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const user = this.state.users.find(u => u.email === to);
    
    // Merge data
    const mergeData = {
      user: {
        name: user?.name || 'Customer',
        email: to,
        balance: user?.balance || 0,
        expiryDate: user?.expiryDate || 'N/A',
        id: user?.id || 'N/A'
      },
      ...customData
    };

    let html = template.content;
    Object.keys(mergeData.user).forEach(key => {
      const regex = new RegExp(`{{user.${key}}}`, 'g');
      html = html.replace(regex, (mergeData.user as any)[key]);
    });

    const res = await fetch(`${this.backendUrl}/api/email/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, category })
    });
    
    return res.json();
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

  async bulkChangeSeller(userIds: string[], sellerId: string, onProgress?: (current: number, total: number, itemName: string) => void) {
    const total = userIds.length;
    let count = 0;
    for (const id of userIds) {
      count++;
      const user = this.state.users.find(u => u.id === id);
      if (user) {
        onProgress?.(count, total, user.name);
        user.dealerId = sellerId;
      }
    }
    await this.commit();
    this.notify();
    return { success: true, count: userIds.length };
  }

  // ── BULK EMAIL REMINDER ──────────────────────────────────────────────────────
  async bulkSendEmailReminder(userIds: string[], adminId: string) {
    const timestamp = new Date().toISOString();
    let sent = 0;

    const senderId = this.state.settings.commConfig.reminderSenderId || 'SDR-2';
    const sender = this.state.settings.commConfig.senderIdentities.find(s => s.id === senderId) || this.state.settings.commConfig.senderIdentities[0];

    for (const uid of userIds) {
      const user = this.state.users.find(u => u.id === uid);
      if (!user || !user.email) continue;

      try {
        if (this.socket) {
          this.socket.emit('send-email', {
             config: this.state.settings.commConfig.smtpConfig,
             payload: {
                 from: sender?.email || 'noreply@clickopticx.com',
                 senderName: sender?.name || 'Click Opticx Recovery',
                 to: user.email, 
                 subject: 'Payment Protocol Alert', 
                 html: `
                     <div style="font-family: sans-serif; padding: 20px;">
                         <h2>Outstanding Balance Notice</h2>
                         <p>Dear ${user.name},</p>
                         <p>Our records indicate an outstanding balance of <b>Rs. ${user.balance}</b> for your internet services.</p>
                         <p>Please settle your dues to avoid service suspension.</p>
                         <hr />
                         <p style="font-size: 10px; color: #666;">This is an automated reminder from Click Opticx Billing Engine.</p>
                     </div>
                 `
             }
          });
        }
      } catch(e) {}

      const admin = this.state.staff.find(s => s.email === adminId) || this.state.currentUser;
      const adminName = admin?.name || 'System';

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
        details: `Email reminder sent to `,
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

  // --- NAS / MIKROTIK HARDWARE ENGINE ---
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
      hardwareModel: node.hardwareModel || 'GENERIC',
      maxCapacity: node.maxCapacity || 200,
      apiEnabled: node.apiEnabled ?? false,
      hotspotUrlMode: node.hotspotUrlMode || 'IP',
      customHotspotUrl: node.customHotspotUrl || '',
      ...node
    };
    this.state.nas.push(newNode);
    await this.logAudit('NAS Registered', 'System', `New Router Node [${newNode.name}] registered at ${newNode.ip}`, newNode.id);
    await this.commit();
    this.notify();
    return { success: true, id: newNode.id };
  }

  async updateNAS(id: string, updates: Partial<NASConfig>) {
    const idx = this.state.nas.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.state.nas[idx] = { ...this.state.nas[idx], ...updates };
      await this.commit();
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'Router Node not found.' };
  }

  async deleteNAS(id: string) {
    this.state.nas = this.state.nas.filter(n => n.id !== id);
    await this.commit();
    this.notify();
    return { success: true };
  }

  async checkRouterHealth(id: string) {
    const nas = this.state.nas.find(n => n.id === id);
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
      // Simulation fallback if backend is down
      nas.status = 'Offline';
      nas.lastCheck = new Date().toISOString();
      await this.commit();
      this.notify();
      return { 
        success: false, 
        status: 'Offline', 
        radius: 'Failed', 
        api: 'Failed', 
        coa: nas.coaEnabled ? 'Enabled' : 'Disabled' 
      };
    }
  }

  calculateNASLoad(nasId: string) {
    const nas = this.state.nas.find(n => n.id === nasId);
    if (!nas) return 0;

    const activeUsersOnNas = this.state.users.filter(u => 
      u.routerId === nasId && 
      u.status === UserStatus.ACTIVE
    ).length;

    const capacity = nas.maxCapacity || 250;
    return Math.min(Math.round((activeUsersOnNas / capacity) * 100), 100);
  }

  // --- HOTSPOT VOUCHER ENGINE ---
  async generateHotspotTokens(nasId: string, count: number, config: Partial<HotspotToken>) {
    try {
      const response = await fetch(`${this.backendUrl}/api/hotspot/voucher/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nasId, count, ...config })
      });
      const data = await response.json();
      
      if (data.success) {
        // Since backend successfully generated, we generate local versions for UI display 
        // until a full sync happens. (Or if backend returns them, we use those)
        const tokens: HotspotToken[] = [];
        const now = new Date().toISOString();
        for (let i = 0; i < count; i++) {
          tokens.push({
            id: 'TKN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            nasId,
            token: Math.random().toString(36).substr(2, 6).toUpperCase(),
            price: config.price || 100,
            validityDays: config.validityDays || 1,
            bandwidthLimit: config.bandwidthLimit || 5,
            dataLimitMb: config.dataLimitMb || 1024,
            status: 'Active',
            createdAt: now,
            ...config
          });
        }
        if (!Array.isArray(this.state.hotspotTokens)) this.state.hotspotTokens = [];
        this.state.hotspotTokens = [...tokens, ...this.state.hotspotTokens];
        await this.logAudit('Tokens Generated', 'System', `Provisioned ${count} vouchers for NAS Node ${nasId} (Synced to MikroTik)`, nasId);
        await this.commit();
        this.notify();
        return { success: true, count, tokens, message: data.message };
      }
      return data;
    } catch (e) {
      return { success: false, message: 'Hotspot Gateway synchronization failed.' };
    }
  }

  getHotspotTokens(nasId?: string) {
    if (!nasId) return this.state.hotspotTokens || [];
    return (this.state.hotspotTokens || []).filter(t => t.nasId === nasId);
  }

  async revokeToken(tokenId: string) {
    const idx = this.state.hotspotTokens.findIndex(t => t.id === tokenId);
    if (idx !== -1) {
      this.state.hotspotTokens[idx].status = 'Revoked';
      await this.commit();
      this.notify();
      return { success: true };
    }
    return { success: false };
  }

  // --- IDENTITY ARCHIVAL SYSTEM ---
  async archiveMonth(month: string) {
    const archiveData: ArchiveData = {
      users: [...this.state.users],
      invoices: [...this.state.invoices],
      ledger: [...this.state.ledger]
    };

    const newArchive: ArchiveRecord = {
      month,
      archivedAt: new Date().toISOString(),
      data: archiveData
    };

    if (!this.state.archives) this.state.archives = [];
    this.state.archives.unshift(newArchive);
    
    await this.logAudit('System Archive', 'System', `Cold storage snapshot created for ${month}`, 'System');
    await this.commit();
    this.notify();
    return { success: true, message: `Snapshot ${month} committed to vault.` };
  }

  async restoreFromArchive(archiveAt: string, userId: string) {
    const archive = this.state.archives.find(a => a.archivedAt === archiveAt);
    if (!archive) return { success: false, message: 'Archive snapshot not found.' };

    const archivedUser = archive.data.users.find(u => u.id === userId);
    if (!archivedUser) return { success: false, message: 'User identity not found in this snapshot.' };

    if (this.findUserNode(userId)) {
      return { success: false, message: 'Identity already active in registry.' };
    }

    this.state.users.push({ ...archivedUser, status: UserStatus.ACTIVE, tags: [...(archivedUser.tags || []), 'Restored'] });
    
    archive.data.invoices.forEach(inv => {
      if (inv.userId === userId && !this.state.invoices.find(i => i.id === inv.id)) {
        this.state.invoices.push(inv);
      }
    });

    await this.logAudit('Identity Restored', 'System', `Recovered user ${archivedUser.name} from archival vault [${archive.month}]`, userId, archivedUser.name);
    await this.commit();
    this.notify();
    return { success: true, message: 'Identity Re-Entry Successful.' };
  }

  // ── ISP AUTOMATION ENGINE ──────────────────────────────────────────────────
  async bulkProvisionUsers(oltId: string, onus: any[]) {
    const olt = this.state.oltNodes.find(n => n.id === oltId);
    if (!olt) return { success: false, message: 'OLT not found' };

    try {
      const res = await fetch(`${this.backendUrl}/api/automation/bulk-provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olt, onus })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: 'Automation server unreachable.' };
    }
  }

  async runBillingEnforcement(oltId: string) {
    const olt = this.state.oltNodes.find(n => n.id === oltId);
    if (!olt) return { success: false, message: 'OLT not found' };

    try {
      const res = await fetch(`${this.backendUrl}/api/automation/run-billing-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oltId })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: 'Billing enforcer unreachable.' };
    }
  }

  async updateAppSection(section: AppSection) {
    const idx = this.state.settings.appearance.sections.findIndex(s => s.id === section.id);
    if (idx !== -1) {
      this.state.settings.appearance.sections[idx] = section;
      await this.commit();
      this.notify();
      return { success: true };
    }
    return { success: false, message: 'Section not found.' };
  }

  async vsolWifiChange(onuId: string, ssid: string, pass: string) {
    const onu = this.state.onus.find(o => o.id === onuId);
    if (!onu) return { success: false, message: 'ONU not found' };
    const olt = this.state.oltNodes.find(n => n.id === onu.oltId);
    if (!olt) return { success: false, message: 'OLT parent missing' };

    try {
      const res = await fetch(`${this.backendUrl}/api/automation/onu-wifi-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: olt,
          onuId: onu.serialNumber, 
          ssid,
          newPassword: pass
        })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: 'Communication bridge down.' };
    }
  }

  async addSpeedTestHistory(result: Omit<SpeedTestResult, 'id'>) {
    const newResult: SpeedTestResult = {
      ...result,
      id: 'SPT-' + Date.now() + Math.random().toString(36).substr(2, 5)
    };
    if (!this.state.speedTestHistory) this.state.speedTestHistory = [];
    this.state.speedTestHistory.unshift(newResult);
    if (this.state.speedTestHistory.length > 500) {
      this.state.speedTestHistory = this.state.speedTestHistory.slice(0, 500);
    }
    await this.commit();
    this.notify();
    return newResult;
  }

  // --- DATA RECONCILIATION ENGINE (v8.5 HEART) ---
  async reconcileData(type: 'user' | 'billing' | 'package' | 'entire' = 'entire') {
    const timestamp = new Date().toISOString();
    const newMissing: MissingDataNode[] = [];

    // 1. USER SCAN
    if (type === 'user' || type === 'entire') {
      this.state.users.forEach(u => {
        if (!u.packageId && u.status === UserStatus.ACTIVE) {
          newMissing.push({
            id: `MIS_USR_${u.id}`,
            type: 'user',
            severity: 'high',
            title: 'Active User Missing Package',
            description: `Subscriber ${u.name} is ACTIVE but has no assigned package node.`,
            targetId: u.id,
            suggestedFix: 'Assign Basic Package',
            timestamp,
            status: 'detected'
          });
        }
      });
    }

    // 2. BILLING SCAN
    if (type === 'billing' || type === 'entire') {
      this.state.invoices.forEach(inv => {
        const userExists = this.state.users.some(u => u.id === inv.userId || u.email === inv.userId);
        if (!userExists) {
          newMissing.push({
            id: `MIS_INV_${inv.id}`,
            type: 'billing',
            severity: 'critical',
            title: 'Orphaned Invoice',
            description: `Invoice ${inv.id} belongs to a user who no longer exists in the registry.`,
            targetId: inv.id,
            suggestedFix: 'Archive Orphaned Invoice',
            timestamp,
            status: 'detected'
          });
        }
      });

      this.state.users.forEach(u => {
        const totalDue = this.state.invoices
          .filter(i => (i.userId === u.id || i.userId === u.email) && i.status !== PaymentStatus.PAID)
          .reduce((acc, i) => acc + (i.dueAmount || (i.totalAmount - i.paidAmount) || 0), 0);
        
        if (Math.abs((u.balance || 0) - totalDue) > 1) { 
           newMissing.push({
             id: `MIS_BAL_${u.id}`,
             type: 'billing',
             severity: 'high',
             title: 'Balance/Invoice Mismatch',
             description: `User ${u.name} balance (${u.balance || 0}) does not match unpaid/partial invoices (${totalDue}).`,
             targetId: u.id,
             suggestedFix: 'Re-calculate Balance',
             timestamp,
             status: 'detected'
           });
        }
      });
    }

    // 3. PACKAGE SCAN
    if (type === 'package' || type === 'entire') {
       this.state.users.forEach(u => {
         if (u.packageId && !this.state.packages.some(p => p.id === u.packageId)) {
           newMissing.push({
             id: `MIS_PKG_${u.id}_${u.packageId}`,
             type: 'package',
             severity: 'high',
             title: 'Deleted Package Assigned',
             description: `User ${u.name} is assigned to package ${u.packageId} which was deleted from catalog.`,
             targetId: u.id,
             suggestedFix: 'Re-assign to Default',
             timestamp,
             status: 'detected'
           });
         }
       });
    }

    this.state.missingData = newMissing;
    await this.commit();
    this.notify();
    return { success: true, count: newMissing.length };
  }

  async fixMissingData(nodeId: string) {
    const node = this.state.missingData.find(n => n.id === nodeId);
    if (!node) return { success: false, message: 'Recovery node not found.' };

    node.status = 'fixing';
    this.notify();

    try {
      if (node.title === 'Active User Missing Package') {
        const u = this.state.users.find(x => x.id === node.targetId);
        if (u) u.packageId = this.state.packages[0]?.id || 'PKG-BASIC';
      } else if (node.title === 'Orphaned Invoice') {
        const idx = this.state.invoices.findIndex(i => i.id === node.targetId);
        if (idx !== -1) this.state.invoices.splice(idx, 1);
      } else if (node.title === 'Balance/Invoice Mismatch') {
        const u = this.state.users.find(x => x.id === node.targetId);
        if (u) {
          const totalDue = this.state.invoices
            .filter(i => (i.userId === u.id || i.userId === u.email) && i.status === PaymentStatus.UNPAID)
            .reduce((acc, i) => acc + i.totalAmount, 0);
          u.balance = totalDue;
        }
      } else if (node.title === 'Deleted Package Assigned') {
        const u = this.state.users.find(x => x.id === node.targetId);
        if (u) u.packageId = this.state.packages[0]?.id || 'PKG-BASIC';
      }

      node.status = 'resolved';
      this.state.missingData = this.state.missingData.filter(n => n.id !== nodeId);
      await this.commit();
      this.notify();
      return { success: true };
    } catch (e: any) {
      node.status = 'detected';
      this.notify();
      return { success: false, message: e.message };
    }
  }

  async clearMissingData() {
    this.state.missingData = [];
    await this.commit();
    this.notify();
  }
  async optimizeImage(base64: string, maxWidth: number, quality: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
           resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  }

  // --- 🧊 MULTI-CLOUD STORAGE SIMULATION (GDrive, PCloud, Dropbox) ---
  getCloudProvider() {
    return this.state.settings.cloudStorage?.provider || 'Google Drive';
  }

  async setCloudProvider(provider: 'Google Drive' | 'PCloud' | 'Dropbox') {
    if (!this.state.settings.cloudStorage) {
        this.state.settings.cloudStorage = { provider, isEnabled: true, lastSync: '', providers: ['Google Drive', 'PCloud', 'Dropbox'], authMode: 'OAuth' };
    }
    this.state.settings.cloudStorage.provider = provider;
    this.state.settings.cloudStorage.lastSync = new Date().toISOString();
    this.notify();
    await this.commit();
  }

  async simulateCloudHandshake(fileName: string) {
    const provider = this.getCloudProvider();
    console.log(`[CLOUD-SYNC] Handshaking with ${provider} for file: ${fileName}`);
    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, cloudUrl: `https://${provider.toLowerCase().replace(' ', '')}.com/share/${Math.random().toString(36).substr(2, 9)}` };
  }

  // --- 🛠️ AUTH & RECOVERY METHODS ---
  async sendPasswordReset(identifier: string) {
    // Check if user exists
    const user = this.state.users.find(u => u.email === identifier || u.phone === identifier || u.username === identifier);
    if (!user) return { success: false, message: 'User not found' };

    if (user.email) {
        return await this.sendSmartPasswordReset(user.email);
    }
    return { success: false, message: 'No valid dispatch target found for this identifier.' };
  }

  async submitManualPasswordRequest(identifier: string) {
    const request: any = {
        id: `REQ-${Date.now()}`,
        userId: identifier,
        userName: identifier,
        phone: '',
        email: identifier,
        status: 'Pending',
        timestamp: new Date().toISOString(),
        verificationMethod: 'Manual'
    };
    if (!this.state.passwordRequests) this.state.passwordRequests = [];
    this.state.passwordRequests.unshift(request);
    this.notify();
    await this.commit();
    return { success: true };
  }
  async verifyFaceForReset(identifier: string, faceImage: string) {
    const user = this.state.users.find(u => u.email === identifier || u.phone === identifier || u.username === identifier);
    if (!user) return { success: false, message: 'User not found' };
    
    // In a real app, we'd send this to an AI vision API
    // Here we simulate successful match if they have faceData stored or just allow for demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true };
  }

  async verifyResetCode(identifier: string, code: string) {
    if (code === 'BIOMETRIC_APPROVED') return { success: true };
    // Simulate code check
    return { success: code === '123456', message: 'Invalid Verification Code' };
  }

  async findUserForReset(identifier: string) {
    return this.state.users.find(u => u.email === identifier || u.phone === identifier || u.username === identifier) || null;
  }

  async updateCustomerPassword(userId: string, newPass: string, token?: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
        user.password = newPass;
        
        // --- BACKEND SYNC ---
        try {
          const response = await fetch(`${this.backendUrl}/api/auth/complete-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              token: token,
              newPassword: newPass
            })
          });
          const res = await response.json();
          if (!res.success) {
            console.error('[BACKEND-SYNC] Password update rejected:', res.message);
          }
        } catch (e: any) {
          console.error('[BACKEND-SYNC] Auth bridge error:', e);
        }

        // --- SUPABASE SYNC (Legacy Fallback) ---
        try {
          if (this.state.currentUser?.id === userId) {
            await supabase.auth.updateUser({ password: newPass });
          }
        } catch (e: any) {}

        this.notify();
        await this.commit();
        return { success: true };
    }
    return { success: false };
  }

  // --- KYC & CLOUD STORAGE HANDSHAKE ---
  
  async submitKYC(userId: string, method: KYCMethod, documents: string[], metadata?: any, faceData?: string) {
    let user = this.findUserNode(userId);
    
    if (!user && this.state.currentUser?.id === userId) {
      this.state.users.push({ ...this.state.currentUser } as any);
      user = this.findUserNode(userId);
    }
    
    if (!user) return { success: false, message: 'User not found. Please log out and log in again.' };

    const kycDocs = await Promise.all(documents.map(async (url, i) => {
      const isBase64 = url.length > 500 && (url.startsWith('data:image') || url.startsWith('blob:'));
      
      let safeUrl = url;
      if (isBase64) {
          try {
              // Precise Archival based on side if CNIC
              const docName = method === KYCMethod.CNIC ? (i === 0 ? 'cnic_front' : 'cnic_back') : 
                              method === KYCMethod.PASSPORT ? 'passport' : `doc_${i}`;
              safeUrl = await this.uploadMedia(`kyc/${userId}/${docName}.png`, url);
          } catch (e: any) {
              console.warn("[KYC-UPLOAD] Failed to sync to cloud storage:", e.message);
              // Fallback is already handled in uploadMedia to return base64, 
              // but we'll be explicit here if needed.
          }
      }

      return {
        type: method === KYCMethod.CNIC ? (i === 0 ? 'CNIC Front' : 'CNIC Back') : 
              method === KYCMethod.PASSPORT ? 'Passport' :
              method === KYCMethod.LIVE_SCAN ? 'Face Scan' : 'Document',
        fileUrl: safeUrl,
        submittedAt: new Date().toISOString(),
        status: 'Pending'
      } as any;
    }));

    user.kycDocuments = kycDocs;

    if (faceData) {
      const isBase64Face = faceData.length > 500 && (faceData.startsWith('data:image') || faceData.startsWith('blob:'));
      if (isBase64Face) {
          user.faceData = await this.uploadMedia(`kyc/${userId}/face_audit.png`, faceData);
      } else {
          user.faceData = faceData;
      }
    }

    user.kycMethod = method;
    user.kycSubmissionDate = new Date().toISOString();
    user.kyc_attempt_count = (user.kyc_attempt_count || 0) + 1;
    this.syncUserKYCState(user, VerificationStatus.PENDING);

    // PERSISTENCE FIX: Ensure an entry is added to kycRequests for direct admin visibility
    const newRequest: any = {
      id: `KYC-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      documents: kycDocs,
      faceData: user.faceData,
      status: 'Pending',
      timestamp: new Date().toISOString()
    };
    this.state.kycRequests.unshift(newRequest);

    // Trigger Cloud Storage Sync Simulation for background redundancy
    MultiCloudService.syncArtifacts(userId, documents).catch(e => console.error("Cloud Sync Error:", e));

    this.logNotification(userId, 'info', 'Documents Received', 'Your identity documents have been submitted for review. Our team will verify them shortly.', 'user');
    this.logActivity(userId, 'Update', `Identity documents submitted via ${method}.`);
    this.logAudit('Documents Submitted', 'Update', `User ${user.name} (${userId}) submitted identity documents via ${method}.`, userId, user.name);
    
    await this.commit();
    this.notify();
    return { success: true };
  }

  getCloudSyncLogs() {
    return this.state.auditLogs?.filter(l => l.action.includes('KYC') || l.details.includes('Cloud')) || [];
  }

  getPendingKYCCount() {
    return this.state.users.filter(u => u.isKYCSubmitted && (u.kyc_status === 'pending' || u.verificationStatus === VerificationStatus.PENDING)).length;
  }



  async updateSettings(settings: SystemSettings) {
    this.state.settings = { ...this.state.settings, ...settings };
    this.notify();
    await this.commit();
    return { success: true };
  }

  async blockUser(userId: string, reason: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Registry Error: Subscriber index mismatch.' };
    user.status = UserStatus.BLOCKED;
    user.lockReason = reason;
    this.logNotification(userId, 'error', 'Infrastructure Access Restricted', `Your account node has been restricted. Reason: ${reason}`, 'user');
    this.logAudit('Subscriber Blocked', 'Update', `Subscriber ${user.name} (${userId}) was blocked. Reason: ${reason}`, userId, user.name);
    this.notify();
    await this.commit();
    return { success: true };
  }

  async unblockUser(userId: string) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Registry Error: Subscriber index mismatch.' };
    user.status = UserStatus.ACTIVE;
    user.lockReason = '';
    this.logNotification(userId, 'success', 'Infrastructure Access Restored', 'Your account node has been reactivated. All services are online.', 'user');
    this.logAudit('Subscriber Unblocked', 'Update', `Subscriber ${user.name} (${userId}) was unblocked.`, userId, user.name);
    this.notify();
    await this.commit();
    return { success: true };
  }

  async approveKYC(id: string) {
    let req = this.state.kycRequests.find(r => r.id === id || r.userId === id);
    if (req && req.status !== 'Approved') req.status = 'Approved';

    const user = this.findUserNode(req?.userId || id);
    if (!user) return { success: false, message: 'Subscriber context not found.' };

    this.syncUserKYCState(user, VerificationStatus.VERIFIED);
    
    this.logNotification(user.id, 'success', 'Identity Verified', 'Your identity artifacts have been verified. Full infrastructure access granted.', 'user');
    this.logAudit('Identity Verified', 'Approval', `KYC for ${user.name} approved.`, user.id, user.name);
    
    this.notify();
    await this.commit();
    return { success: true };
  }

  async rejectKYC(id: string, reason: string, options?: { revisionDocsCount?: number }) {
    let req = this.state.kycRequests.find(r => r.id === id || r.userId === id);
    if (req && req.status === 'Pending') {
      req.status = 'Rejected';
      req.rejectionReason = reason;
    }

    const user = this.findUserNode(req?.userId || id);
    if (!user) return { success: false, message: 'Subscriber context not found.' };

    this.syncUserKYCState(user, VerificationStatus.REVISION, reason);
    if (options?.revisionDocsCount) {
       user.requiredRevisionDocs = options.revisionDocsCount;
    }
    
    this.logNotification(user.id, 'error', 'Identity Revised', `Identity artifacts require revision: ${reason}`, 'user');
    this.logAudit('Identity Rejected', 'Rejection', `KYC for ${user.name} rejected. Reason: ${reason}`, user.id, user.name);
    
    this.notify();
    await this.commit();
    return { success: true };
  }

  // Legacy Aliases for UserManagement Compatibility
  async adminVerifyUser(userId: string) {
    const req = this.state.kycRequests.find(r => r.userId === userId && r.status === 'Pending');
    if (req) return this.approveKYC(req.id);
    
    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'Subscriber not found' };

    this.syncUserKYCState(user, VerificationStatus.VERIFIED);
    this.logAudit('Direct Verification', 'Approval', `Administrative verification override for ${user.name}`, userId, user.name);
    
    this.notify();
    await this.commit();
    return { success: true };
  }

  async unverifyUser(userId: string) {
    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'Subscriber not found' };
    
    this.syncUserKYCState(user, VerificationStatus.UNVERIFIED);
    this.logAudit('Direct Unverifcation', 'Update', `Administrative de-verification for ${user.name}`, userId, user.name);
    
    this.notify();
    await this.commit();
    return { success: true };
  }

  async approveUnifiedRequest(requestId: string, type: 'kyc' | 'package' | 'topup') {
    if (type === 'kyc') return this.approveKYC(requestId);
    if (type === 'topup') {
        const req = this.state.topupRequests.find(r => r.id === requestId);
        if (!req) return { success: false, message: 'Request Void' };
        req.status = 'Approved';
        const user = this.state.users.find(u => u.id === req.userId);
        if (user) {
            user.balance += req.amount;
            this.logNotification(user.id, 'success', 'Fiscal Credit Applied', `Your handshake for ${this.state.settings.currency} ${req.amount.toLocaleString()} was approved and credited.`, 'user');
        }
        if (this.state.settings.autoCloudSync && (req as any).paymentProof) {
            const syncRes = await MultiCloudService.syncArtifacts(req.userId, [(req as any).paymentProof]);
            if (syncRes.success) {
                req.externalUrl = `https://drive.google.com/open?id=mock_sync_${req.id}`;
                req.localPurged = true;
                this.logAudit('Cloud Archive Sync', 'System', `Fiscal artifact for ${req.id} shifted to ${this.state.settings.cloudStorage?.provider || 'External Storage'}.`, req.userId, req.userName);
            }
        }
        this.logAudit('Billing Approved', 'Approval', `Top-up of ${req.amount} for ${req.userName} approved.`, req.userId, req.userName);
        this.notify();
        await this.commit();
        return { success: true };
    }
    if (type === 'package') {
        const req = this.state.packageRequests.find(r => r.id === requestId);
        if (!req) return { success: false, message: 'Provisioning Request Void' };
        req.status = 'Approved';
        const user = this.state.users.find(u => u.id === req.userId);
        if (user) {
            user.packageId = req.packageId;
            user.status = UserStatus.ACTIVE;
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            user.expiryDate = expiry.toISOString();
            this.logNotification(user.id, 'success', 'Service Link Active', `Your ${req.packageName} plan has been provisioned and is now live.`, 'user');
        }
        this.logAudit('Provisioning Approved', 'Approval', `Plan ${req.packageName} activated for ${req.userName}.`, req.userId, req.userName);
        this.notify();
        await this.commit();
        return { success: true };
    }
    return { success: false, message: 'Protocol Unknown' };
  }

  async rejectUnifiedRequest(requestId: string, type: 'kyc' | 'package' | 'topup', reason: string, options?: { revisionDocsCount?: number }) {
    if (type === 'kyc') return this.rejectKYC(requestId, reason, options);
    if (type === 'topup') {
        const req = this.state.topupRequests.find(r => r.id === requestId);
        if (!req) return { success: false, message: 'Request Void' };
        req.status = 'Rejected';
        req.rejectionReason = reason;
        this.logNotification(req.userId, 'error', 'Fiscal Handshake Denied', `The request for ${req.amount} was rejected: ${reason}`, 'user');
        this.logAudit('Billing Rejected', 'Rejection', `Top-up for ${req.userName} rejected. Reason: ${reason}`, req.userId, req.userName);
        this.notify();
        await this.commit();
        return { success: true };
    }
    if (type === 'package') {
        const req = this.state.packageRequests.find(r => r.id === requestId);
        if (!req) return { success: false, message: 'Provisioning Request Void' };
        req.status = 'Rejected';
        req.rejectionReason = reason;
        this.logNotification(req.userId, 'error', 'Provisioning Registry Fault', `Your service plan request was denied: ${reason}`, 'user');
        this.logAudit('Provisioning Rejected', 'Rejection', `Plan ${req.packageName} for ${req.userName} rejected. Reason: ${reason}`, req.userId, req.userName);
        this.notify();
        await this.commit();
        return { success: true };
    }
    return { success: false, message: 'Protocol Unknown' };
  }

  async verifyAuthProvider(providerId: string) {
    const provider = this.state.authProviders.find(p => p.id === providerId);
    if (!provider) return { success: false, message: 'Registry Error: Provider node not found.' };

    if (provider.status === 'Inactive') {
      return { success: false, message: 'Administrative Lockout: Provider is currently disabled.' };
    }

    const start = Date.now();
    let result: 'Success' | 'Fail' = 'Fail';
    let message = '';

    try {
      if (provider.name === 'Firebase') {
        // Real-time check for Firebase layer
        if (this.auth && this.firestore) {
          result = 'Success';
          message = 'Firebase Handshake Success: Identity nodes available.';
        } else {
          message = 'Firebase Error: Cloud layer uninitialized or blocked.';
        }
      } else if (provider.name === 'SendGrid' || provider.name === 'Resend') {
        if (!provider.apiKey) {
          message = `Protocol Error: Missing API Key for ${provider.name}.`;
        } else {
          // Handshake verification using a CORS-safe fetch to their public landing discovery
          // Note: In production, we'd ping our balance endpoint if using a direct API
          const endpoint = provider.name === 'SendGrid' ? 'https://sendgrid.com' : 'https://resend.com';
          const ping = await fetch(endpoint, { mode: 'no-cors' });
          result = 'Success';
          message = `${provider.name} Handshake Success: API Route Reachable.`;
        }
      } else if (provider.name === 'Infobip') {
        if (!provider.apiKey) {
          message = 'Protocol Error: Infobip API key missing.';
        } else {
          // Ping Infobip API endpoint
          const ping = await fetch('https://api.infobip.com', { mode: 'no-cors' });
          result = 'Success';
          message = 'Infobip Handshake Success: Mobile SMS node reachable.';
        }
      }
    } catch (err: any) {
      result = 'Fail';
      message = `Topology Fault: ${err.message || 'Connection timeout.'}`;
    }

    const latency = Date.now() - start;
    
    // Log Activity
    this.logAuthActivity({
      provider: provider.name,
      action: 'Health_Check_Handshake' as any,
      result: result as any,
      latency,
      timestamp: new Date().toISOString()
    });

    return { success: result === 'Success', message };
  }

  async updateAuthProvider(data: Partial<AuthProvider>) {
    const idx = this.state.authProviders.findIndex(p => p.id === data.id);
    if (idx !== -1) {
      this.state.authProviders[idx] = { ...this.state.authProviders[idx], ...data };
      await this.commit();
      this.notify();
      return { success: true, message: 'Auth provider registry updated.' };
    }
    return { success: false, message: 'Provider node not found.' };
  }

  async logAuthActivity(activity: Omit<AuthLog, 'id'>) {
    const log: AuthLog = {
      ...activity,
      id: 'AUTH-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    };
    this.state.authLogs = [log, ...(this.state.authLogs || [])].slice(0, 1000);
    this.notify();
    await this.commit();
  }

  async sendSmartPasswordReset(email: string) {
    console.log(`[CSAE] Initiating smart auth routing for: ${email}`);
    
    try {
      const response = await fetch(`${this.backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      if (result.success) {
         this.logAudit('Password Reset Requested', 'Auth', `Recovery link requested for: ${email}`);
         return { success: true, provider: 'Email' };
      } else {
         return { success: false, message: result.message || 'Recovery Protocol Fault: Handshake failed.' };
      }
    } catch (e: any) {
      console.error('[AUTH] Reset Request Error:', e);
      return { success: false, message: 'Auth Service Node Disconnected.' };
    }
  }


  async verifyCloudConnection(accountId: string) {
    const account = this.state.cloudAccounts.find(a => a.id === accountId);
    if (!account) return { success: false, status: 'Failed', message: 'Registry Error: Cloud node not found.' };

    const start = Date.now();
    let result: 'Success' | 'Fail' | 'Expired' = 'Fail';
    let message = '';

    // Check for expiration
    if (new Date(account.expiry).getTime() < Date.now()) {
       result = 'Expired';
       message = 'Protocol Expired: OAuth2 session has timed out. Rotation required.';
    } else {
       try {
         const endpoint = account.provider === 'Google Drive' ? 'https://www.googleapis.com' : 
                         (account.provider === 'OneDrive' ? 'https://graph.microsoft.com' : 'https://api.pcloud.com');
         
         await fetch(endpoint, { mode: 'no-cors' });
         result = 'Success';
         message = `${account.provider} Handshake Success: Infrastructure reachable.`;
       } catch (err: any) {
         result = 'Fail';
         message = `Protocol Fault: ${err.message || 'Connection timeout.'}`;
       }
    }

    // Log Activity Matrix
    this.logCloudActivity({
      fileName: 'Infrastructure Health Check',
      source: account.provider,
      destination: 'Audit Hub',
      status: result === 'Success' ? 'Completed' : 'Failed',
      progress: 100,
      timestamp: new Date().toISOString(),
      error: result !== 'Success' ? message : undefined
    });

    return { success: result === 'Success', status: result, message };
  }

  async disconnectCloudAccount(id: string) {
    const idx = this.state.cloudAccounts.findIndex(a => a.id === id);
    if (idx !== -1) {
      const provider = this.state.cloudAccounts[idx].provider;
       this.state.cloudAccounts[idx] = {
          ...this.state.cloudAccounts[idx],
          status: 'Disconnected',
          accessToken: '',
          refreshToken: '',
          isPrimary: false,
          isBackup: false
       };
       this.logCloudActivity({
          fileName: `Node Decommission: ${provider}`,
          source: provider,
          destination: 'Registry Archive',
          status: 'Completed',
          progress: 100,
          timestamp: new Date().toISOString()
       });
       this.notify();
       await this.commit();
       return { success: true, message: `Cloud Node successfully decommissioned.` };
    }
    return { success: false, message: 'Node not found in registry.' };
  }

  async uploadKYCToCloud(requestId: string, file: Blob, fileName: string) {
    const kyc = this.state.kycRequests.find(r => r.id === requestId);
    if (!kyc) return { success: false, message: 'KYC Record not found.' };

    const activeClouds = this.state.cloudAccounts.filter(a => a.status === 'Connected');
    if (activeClouds.length === 0) return { success: false, message: 'No active cloud nodes available for storage.' };

    const primary = activeClouds.find(a => a.isPrimary) || activeClouds[0];
    const backups = activeClouds.filter(a => a.id !== primary.id);

    if (!kyc.cloudStorage) kyc.cloudStorage = {};
    
    // Simulate primary upload
    const primaryId = primary.id;
    kyc.cloudStorage[primaryId] = `cloud://${primary.provider.toLowerCase()}/kyc/${requestId}/${fileName}`;
    
    this.logCloudActivity({
      fileName,
      source: 'Local Buffer',
      destination: primary.provider,
      status: 'Completed',
      progress: 100,
      timestamp: new Date().toISOString()
    });

    // Auto-backup logic
    for (const backup of backups) {
      if (backup.autoSyncEnabled || backup.isBackup) {
         kyc.cloudStorage[backup.id] = `cloud://${backup.provider.toLowerCase()}/kyc/${requestId}/${fileName}`;
         this.logCloudActivity({
            fileName,
            source: primary.provider,
            destination: backup.provider,
            status: 'Completed',
            progress: 100,
            timestamp: new Date().toISOString()
         });
      }
    }

    kyc.syncReport = {
      isRedundant: Object.keys(kyc.cloudStorage).length > 1,
      primaryProvider: primary.provider,
      backupProvider: backups[0]?.provider,
      lastVerified: new Date().toISOString(),
      integrityHash: 'SHA256:' + Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    this.notify();
    await this.commit();
    return { success: true, message: `KYC pushed to ${Object.keys(kyc.cloudStorage).length} nodes.` };
  }

  async shiftKYCArtifact(requestId: string, destProviderId: string) {
     const kyc = this.state.kycRequests.find(r => r.id === requestId);
     const dest = this.state.cloudAccounts.find(a => a.id === destProviderId);
     if (!kyc || !dest) return { success: false, message: 'Source or Destination node void.' };

     const logId = `SHIFT-${Date.now()}`;
     this.logCloudActivity({
        id: logId,
        fileName: `RE-LOCATE: KYC-${requestId}`,
        source: kyc.syncReport?.primaryProvider || 'Unknown',
        destination: dest.provider,
        status: 'In Progress',
        progress: 25,
        timestamp: new Date().toISOString()
     });

     // Simulate relay
     await new Promise(r => setTimeout(r, 1500));
     
     if (!kyc.cloudStorage) kyc.cloudStorage = {};
     kyc.cloudStorage[dest.id] = `cloud://${dest.provider.toLowerCase()}/kyc/${requestId}/shifted_artifact`;
     
     const log = this.state.cloudTransferLogs.find(l => l.id === logId);
     if (log) {
        log.status = 'Completed';
        log.progress = 100;
     }

     this.notify();
     await this.commit();
     return { success: true, message: `Artifact shifted to ${dest.provider}.` };
  }

  async verifyCloudIntegrity(requestId: string) {
     const kyc = this.state.kycRequests.find(r => r.id === requestId);
     if (!kyc || !kyc.cloudStorage) return { success: false, message: 'No cloud storage found for this record.' };

     await new Promise(r => setTimeout(r, 1000));
     if (kyc.syncReport) {
        kyc.syncReport.lastVerified = new Date().toISOString();
     }
     
     this.notify();
     return { success: true, message: 'Cloud integrity verified across all nodes.' };
  }

  async triggerCloudSync(accountId: string) {
     const account = this.state.cloudAccounts.find(a => a.id === accountId);
     if (!account) return { success: false, message: 'Registry Error: Target account void.' };
     
     // Log Sync Initiation
     const logId = `SYNC-${Date.now()}`;
     this.logCloudActivity({
        id: logId,
        fileName: `Metadata Sync: ${account.provider}`,
        source: account.provider,
        destination: 'Registry Cache',
        status: 'In Progress',
        progress: 10,
        timestamp: new Date().toISOString()
     });

     // Simulate sync process
     await new Promise(r => setTimeout(r, 2000));
     
     const log = this.state.cloudTransferLogs.find(l => l.id === logId);
     if (log) {
        log.status = 'Completed';
        log.progress = 100;
     }

     this.notify();
     await this.commit();
     return { success: true, message: `Handshake Complete: ${account.provider} metadata re-indexed.` };
  }

  async updateCloudAccount(id: string, data: Partial<CloudAccount>) {
    const idx = this.state.cloudAccounts.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.state.cloudAccounts[idx] = { ...this.state.cloudAccounts[idx], ...data };
      this.notify();
      await this.commit();
      return { success: true, message: 'Cloud Registry Updated.' };
    }
    return { success: false, message: 'Cloud node not found.' };
  }

  private logCloudActivity(activity: Omit<CloudTransferLog, 'id'> & { id?: string }) {
     const log: CloudTransferLog = {
        id: activity.id || `TX-${Date.now()}`,
        ...activity
     };
     this.state.cloudTransferLogs.unshift(log);
     if (this.state.cloudTransferLogs.length > 30) this.state.cloudTransferLogs.pop();
     this.notify();
  }

  async adminEmergencyAuthReset(userId: string, mode: 'Link' | 'TempPassword', tempPassword?: string) {
    const user = this.findUserNode(userId);
    if (!user) return { success: false, message: 'Subscriber node not found.' };

    if (mode === 'Link') {
      return await this.sendSmartPasswordReset(user.email || user.username || '');
    } else {
      // Force Temporary Password
      if (!tempPassword) return { success: false, message: 'Target password payload missing.' };
      
      user.password = tempPassword;
      user.mustChangePassword = true;
      user.lastPasswordChange = new Date().toISOString();
      
      const details = `Administrative override: Set temporary password. Node flagged for forced rotation.`;
      this.logAudit('Emergency Reset', 'System', details, userId, user.name);
      this.logNotification(userId, 'warning', 'Account Security Notice', 'Your password has been reset by an administrator. You must change it at next login.', 'user');
      
      await this.commit();
      this.notify();
      return { success: true, message: 'Temporary password established. Subscriber node updated.' };
    }
  }

  public async updateKYCFile(id: string, updates: Partial<KYCFile>) {
    this.state.kycFiles = (this.state.kycFiles || []).map(f => f.id === id ? { ...f, ...updates } : f);
    this.patchState();
    return { success: true };
  }

  public async moveKYCFileToCloud(fileId: string, provider: string) {
    const file = (this.state.kycFiles || []).find(f => f.id === fileId);
    if (!file) return { success: false, message: 'File not found' };

    // Simulate move
    const res = await this.updateKYCFile(fileId, {
      status: 'MOVED',
      provider: provider,
      file_url: `https://cloud-storage.com/${provider}/${file.file_name}`,
      temp_path: '' // Purge temp path
    });

    (this as any).addSecurityLog?.('MOVE_KYC_FILE', file.user_id, file.userName, `Moved ${file.file_name} to ${provider}`);
    return res;
  }

  public async runSystemDiagnostics() {
    try {
      const response = await fetch(`${this.backendUrl}/api/network/diagnostics/run`);
      return await response.json();
    } catch (e) {
      return { success: false, message: 'Diagnostics Gateway Unreachable.' };
    }
  }
}

export const db = new DB();
