
export enum UserStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  EXPIRED = 'Expired',
  GRACE_PERIOD = 'Grace Period Active',
  PAYMENT_DUE = 'Active - Payment Due',
  DISABLED = 'Disabled',
  BLOCKED = 'Blocked',
  PENDING_VERIFICATION = 'Verification Pending'
}

export enum VerificationStatus {
  UNVERIFIED = 'Unverified',
  PENDING = 'Pending Approval',
  VERIFIED = 'Verified Node',
  REVISION = 'Revision Required'
}

export enum ConnectionStatus {
  PENDING = 'Pending',
  INSTALLED = 'Installed',
  ACTIVE = 'Active'
}

export enum Role {
  SUPER_ADMIN = 'SuperAdmin',
  BUSINESS_ADMIN = 'BusinessAdmin',
  FINANCE_ADMIN = 'FinanceAdmin',
  SUPPORT_ADMIN = 'SupportAdmin',
  NETWORK_ADMIN = 'NetworkAdmin',
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  ACCOUNTANT = 'Accountant',
  RECOVERY_MANAGER = 'RecoveryManager',
  FIELD_AGENT = 'FieldAgent',
  TEAM_MEMBER = 'TeamMember',
  VIEWER = 'Viewer',
  DEALER = 'Dealer',
  SUPPORT_EXECUTIVE = 'SupportExecutive',
  CASHIER = 'CASHIER',
  CUSTOMER = 'Customer'
}

export enum PaymentStatus {
  PAID = 'Paid',
  PARTIAL = 'Partially Paid',
  UNPAID = 'Unpaid',
  OVERDUE = 'Overdue',
  PENDING_APPROVAL = 'Pending Approval'
}

export enum LedgerType {
  DEBIT = 'Debit',
  CREDIT = 'Credit'
}

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
  ON_HOLD = 'On Hold'
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export type PaymentMethodUsage = 'packages' | 'wallet' | 'emergency' | 'invoices';
export type PaymentMethod = 'Cash' | 'Online' | 'Bank' | 'Home Collection' | 'Dealer Load' | 'Stripe' | 'PayPal' | 'PayFast' | 'EasyPaisa' | 'JazzCash' | 'Emergency Load' | 'Top-Up Balance';

export type NotificationAudience = 'subscriber' | 'admin' | 'staff' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface SystemNotification {
  id: string;
  targetId: string;
  audience: NotificationAudience;
  priority: NotificationPriority;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  createdAt: number;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
}

export interface SecurityLog {
  id: string;
  action: string;
  targetId: string;
  targetName: string;
  adminEmail: string;
  adminIp?: string;
  adminBrowser?: string;
  adminDevice?: string;
  details: string;
  timestamp: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface TicketComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorRole: Role | 'Customer';
  text: string;
  timestamp: string;
  isInternal: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  description: string;
  category: 'Billing' | 'Technical' | 'Sales' | 'Upgrade' | 'Other';
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  comments: TicketComment[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface NOCEvent {
  id: string;
  title: string;
  description: string;
  area: string;
  severity: 'Info' | 'Warning' | 'Critical';
  status: 'Active' | 'Resolved';
  startTime: string;
  endTime?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'Service' | 'Equipment' | 'Installation' | 'Adjustment' | 'Tax';
}

export interface Invoice {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  ip: string;
  mac: string;
  signal: number;
  usageToday: number;
  duration: string;
  isBlocked: boolean;
}

export interface EmergencyLoadExtension {
  id: string;
  emergencyLoadId: string;
  extendedByAdminId: string;
  oldDueDate: string;
  newDueDate: string;
  reason: string;
  createdAt: string;
}

export interface EmergencyLoad {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'Pending_Activation' | 'Active' | 'Overdue' | 'Paid' | 'Cancelled' | 'Cleared' | 'Settled';
  timestamp: string;
  expiryTimestamp: string;
  lockedUntil: string;
  packageId?: string;
  repaid: boolean;
  sourceType: 'Auto' | 'Admin_Override';
  activationSource: 'emergency_load';
  settledAt?: string;
  extensions?: EmergencyLoadExtension[];
}

export interface ISPUser {
  id: string;
  connectionId: string;
  name: string;
  username?: string;
  password?: string;
  phone: string;
  address: string;
  area: string;
  status: UserStatus;
  verificationStatus?: VerificationStatus;
  kycDocuments?: KYCDocument[];
  kycNotes?: string;
  connectionStatus?: ConnectionStatus;
  packageId?: string;
  balance: number;
  creditScore: number;
  referralPoints: number;
  referralCode: string;
  referredBy?: string;
  activationCount: number;
  expiryDate?: string;
  deleted?: boolean;
  portalEnabled: boolean;
  role?: Role.CUSTOMER;
  verifiedStatus?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
  };
  profileImage?: string;
  email?: string;
  cnic?: string;
  secondaryPhone?: string;
  subarea?: string;
  latitude?: string;
  longitude?: string;
  boxNumber?: string;
  boxAddress?: string;
  uplinkPort?: string;
  fiberCode?: string;
  fiberColor?: string;
  onuBoard?: string;
  onuPort?: string;
  macIp?: string;
  backupConnection?: string;
  dealerId?: string;
  electricityType?: string;
  cableType?: string;
  connectionType: 'Wireless' | 'Fiber';
  activityLog: any[];
  autoRenewal?: boolean;
  invoiceWithTax?: boolean;
  pppoeId?: string;
  nasId?: string;
  vlanId?: string;
  oltNode?: string;
  uniqueAccessId?: string;
  biometricAllowed?: boolean;
  smsNotifications?: boolean;
  appNotifications?: boolean;
  firstLoginChecklist?: string[];
  welcomeChecklistShown?: boolean;
  verificationSuccessShown?: boolean;
  wirelessInfo?: any;
  fiberInfo?: any;
  lastPasswordChange?: string;
  mustChangePassword?: boolean;
  accountLocked?: boolean;
  lockReason?: string;
  sessions?: UserSession[];
  securityFlags?: string[];
  internalNotes?: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'MikroTik' | 'VSOL_OLT';
  ip: string;
  username: string;
  status: 'Connected' | 'Offline' | 'Error';
  lastSeen: string;
}

export interface KYCDocument {
  type: 'CNIC' | 'Passport' | 'Driving License';
  fileUrl: string;
  submittedAt: string;
}

export interface NetworkMapping {
  userId: string;
  connectionType: 'Fiber' | 'Wireless';
  deviceId: string;
  pppoeUsername?: string;
  ipAddress?: string;
  onuSerial?: string;
  ssidName?: string;
  configured: boolean;
}

export interface InternalTask {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo?: string;
  order: number;
}

export interface AboutUsConfig {
  vision: string;
  mission: string;
  companyStory: string;
  features: { id: string; title: string; description: string; icon?: string }[];
  values: string[];
  version: string;
  lastUpdated: string;
}

export interface AppPage {
  id: string;
  label: string;
  icon: string;
  category: 'Core' | 'Utility' | 'Islamic' | 'Fiscal' | 'Network' | 'Support' | 'Communication' | 'Legal';
  enabled: boolean;
  showInDirectory: boolean;
  isDefault: boolean;
  swatch?: string;
}

export interface HomeCard {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

export interface AppSection {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  layout: 'Grid' | 'List' | 'Scroll';
  gridCols: 1 | 2 | 3 | 4;
  itemIds: string[];
  isSpecialNode?: boolean;
}

export interface AIActionLog {
  id: string;
  action: string;
  reason: string;
  confidence: number;
  targetId: string;
  timestamp: string;
  approvedBy?: string;
}

export interface AIEvent {
  id: string;
  page: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  isError: boolean;
}

export interface AISuggestion {
  id: string;
  category: 'UX' | 'BUG' | 'SYSTEM' | 'FISCAL';
  title: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
}

export interface AIThresholds {
  block: number;
  suggest: number;
  confirm: number;
}

export interface AIModuleConfig {
  enabled: boolean;
  autoExecute: boolean;
}

export interface AIKeysConfig {
  gemini: string;
  openai: string;
  deepseek: string;
  anthropic: string;
}

export interface AIConfig {
  killSwitchActive: boolean;
  showWidgetToUsers: boolean;
  thresholds: AIThresholds;
  modules: {
    payments: AIModuleConfig;
    emergency: AIModuleConfig;
    network: AIModuleConfig;
    risk: AIModuleConfig;
  };
  trainingSources: {
    invoices: boolean;
    ledger: boolean;
    emergency: boolean;
    payments: boolean;
    telemetry: boolean;
    adminActions: boolean;
  };
  aiKeys: AIKeysConfig;
}

export interface AICallRule {
  id: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface AICallLog {
  id: string;
  userId: string;
  userName: string;
  duration: number;
  timestamp: string;
  topics: string[];
  confidence: number;
  transcription?: string;
  escalationNeeded: boolean;
  takeoverActive?: boolean;
  takeoverAgentId?: string;
  subarea?: string;
  sentimentStart: 'Frustrated' | 'Neutral' | 'Satisfied';
  sentimentEnd: 'Frustrated' | 'Neutral' | 'Satisfied';
  resolutionType: 'Self-Fix' | 'Ticket_Created' | 'Escalated_To_Human' | 'Unresolved' | 'Info_Only';
}

export type AICallPersona = 'Calm' | 'Friendly' | 'Professional' | 'Strict';

export interface AICallConfig {
  enabled: boolean;
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  persona: AICallPersona;
  language: 'Urdu' | 'English';
  speakingSpeed: number;
  maxCallDuration: number;
  officeHours: {
    start: string;
    end: string;
    enabled: boolean;
  };
  knowledgeBase: {
    outageScripts: string;
    billingPolicy: string;
    emergencyTerms: string;
  };
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'online' | 'wallet' | 'offline';
  enabled: boolean;
  priority: number;
  sandbox: boolean;
  config: any;
  instructions?: string;
  allowedFor: PaymentMethodUsage[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  content: string;
  category: 'Billing' | 'Technical' | 'Marketing' | 'System';
  lastUpdated: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  filters: any;
  subscriberCount: number;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  templateId: string;
  segmentId: string;
  type: 'One-Time' | 'Scheduled' | 'Automated';
  status: 'Draft' | 'Scheduled' | 'Sending' | 'Completed' | 'Failed';
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    failed: number;
  };
}

export interface CommunicationAutomationRule {
  id: string;
  name: string;
  trigger: 'Package_Expiry' | 'Payment_Failed' | 'Emergency_Load_Active' | 'Outage_Detected' | 'Signup_Approved';
  condition: string;
  actions: {
    type: 'Email' | 'Push';
    templateId?: string;
    message?: string;
  }[];
  enabled: boolean;
}

export interface DeliveryLog {
  id: string;
  userId: string;
  userName: string;
  type: 'Email' | 'Push';
  channel: string;
  status: 'Delivered' | 'Failed' | 'Opened' | 'Clicked';
  timestamp: string;
  campaignId?: string;
  triggerSource: 'Manual' | 'Automation';
}

export type EmailGatewayMode = 'CUSTOM_SMTP' | 'PROVIDER_API' | 'HYBRID';

export interface SenderIdentity {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface CommunicationSettings {
  emailMode: EmailGatewayMode;
  emailProvider: 'SMTP' | 'SendGrid' | 'AWS_SES' | 'Gmail' | 'Mailgun' | 'Brevo';
  providerConfig: any;
  smtpConfig: {
    host: string;
    port: number;
    encryption: 'TLS' | 'SSL' | 'None';
    username: string;
    password?: string;
  };
  senderIdentities: SenderIdentity[];
  pushEnabled: boolean;
  quietHours: {
    start: string;
    end: string;
    enabled: boolean;
  };
  rateLimits: {
    emailsPerHour: number;
    emailsPerDay: number;
    burstLimit: number;
    pushPerDayPerUser: number;
  };
  warmup: {
    enabled: boolean;
    currentDay: number;
    limit: number;
  };
  health: {
    status: 'Healthy' | 'Slow' | 'Failed';
    lastCheck: string;
    latency: number;
    bounceRate: number;
  };
}

export interface InfrastructureConfig {
  domainNode: string;
  targetIP: string;
  dnsStatus: 'PROPAGATED' | 'PENDING' | 'ERROR';
  nameservers: string[];
}

export interface LegalConfig {
  termsAndConditions: string;
  serviceAgreement: string;
  privacyPolicy: string;
  refundPolicy: string;
}

export interface AppState {
  users: ISPUser[];
  staff: StaffUser[];
  packages: Package[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  ledger: any[];
  creditLogs: CreditScoreLog[];
  referrals: ReferralRecord[];
  withdrawalRequests: WithdrawalRequest[];
  packageRequests: PackageRequest[];
  topupRequests: TopupRequest[];
  emergencyLoads: EmergencyLoad[];
  tasks: InternalTask[];
  settings: SystemSettings;
  currentUser?: any;
  originalAdminUser?: any;
  connectionStatus: 'online' | 'offline' | 'reconnecting';
  permissions: any[];
  notifications: SystemNotification[];
  roles: string[];
  archives: ArchiveRecord[];
  tickets: SupportTicket[];
  nocEvents: NOCEvent[];
  signupRequests: any[];
  securityLogs: SecurityLog[];
  aiLogs: AIActionLog[];
  aiEvents: AIEvent[];
  aiSuggestions: AISuggestion[];
  isImpersonating?: boolean;
  passwordRequests: PasswordResetRequest[];
  networkNodes: NetworkNode[];
  devices: Device[];
  networkMappings: NetworkMapping[];
  aiCallLogs: AICallLog[];
  aiCallRules: AICallRule[];
  
  // Communication Hub
  emailCampaigns: EmailCampaign[];
  emailTemplates: EmailTemplate[];
  audienceSegments: AudienceSegment[];
  commAutomationRules: CommunicationAutomationRule[];
  deliveryLogs: DeliveryLog[];
}

export interface StaffUser {
  email: string;
  name: string;
  role: Role;
  status: 'Active' | 'Suspended';
  password?: string;
  balance?: number;
  dealerCode?: string;
  lastActive?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  method: PaymentMethod;
  timestamp: string;
  collectorEmail: string;
  collectorName: string;
  invoiceId: string;
  isCleared?: boolean;
}

export interface Package { 
  id: string; 
  name: string; 
  subtitle?: string; 
  speed: string; 
  uploadSpeed: string;
  dataLimit: string;
  price: number; 
  discountPrice?: number; 
  discountExpiry?: string; 
  taxRate: number; 
  duration: number; 
  deleted?: boolean; 
  features?: string; 
  descriptionBullets?: string[]; 
  isRecommended?: boolean; 
  trustTags?: string[]; 
  discount?: number; 
  color?: string;
  networkFeatures?: any;
  techStats?: any;
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  referredUserPhone: string;
  status: 'Pending' | 'Approved' | 'Active' | 'Activated';
  stages: any[];
  totalPointsEarned: number;
  pointsAwarded: number;
  timestamp: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  points: number;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
  auditNote?: string;
}

export interface ArchiveRecord {
  month: string;
  archivedAt: string;
  data: {
    invoices: any[];
    payments: PaymentRecord[];
    ledger: any[];
  };
}

export interface TechnicalConfig {
  wireless: {
    cat6PricePerMeter: number;
    clipPrice: number;
    ravalBoldPricePerPair: number;
    polls: { height: string; price: number }[];
    receivers: { model: string; price: number }[];
    onus: { model: string; price: number }[];
  };
  fiber: {
    wirePricePerMeter: number;
    baseInstallation: number;
    onus: { model: string; price: number }[];
    routers: { model: string; price: number }[];
  };
}

export interface TopupRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentMethod: string;
  requestType: string;
  timestamp: string;
  paymentCommitmentDate?: string;
  paymentCommitmentTime?: string;
}

export interface BusinessProfile {
  legalName: string;
  tradingName: string;
  tagline: string;
  establishedYear: string;
  registrationNumber: string;
  taxNumber: string;
  headOffice: string;
  country: string;
  timezone: string;
}

export interface DigitalPresence {
  website: string;
  portal: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
}

export interface InvoiceBranding {
  logoPreference: 'primary' | 'secondary' | 'square';
  headerText: string;
  footerDisclaimer: string;
  authorizedSignature: string;
  prefix: string;
  nextNumber: number;
  terms: string;
  privacy: string;
  refundPolicyUrl: string;
}

export interface NotificationBranding {
  appSenderName: string;
  emailSenderName: string;
  smsSenderId: string;
}

export interface BrandingConfig { 
  businessName: string; 
  shortName: string; 
  logoLight: string; 
  logoDark: string; 
  logoSquare: string;
  favicon: string; 
  primaryColor: string; 
  secondaryColor: string; 
  accentColor: string;
  textColorLight: string;
  textColorDark: string;
  primaryFont: string;
  secondaryFont: string;
}

export interface SupportConfig { 
  email: string; 
  phone: string; 
  whatsapp: string; 
  emergencyPhone: string;
  address: string; 
  workingHoursWeekdays: string;
  workingHoursWeekends: string;
  emergencySupport: boolean; 
  afterHoursMessage: string;
  phoneEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  greeting: string;
  autoReplyFooter: string;
}

export interface AppearanceConfig { 
  showWallet: boolean; 
  showEmergencyLoad: boolean; 
  showAIChat: boolean; 
  showAICalling: boolean; 
  showNews: boolean; 
  showQuickActions: boolean; 
  maintenanceMode: boolean; 
  appPages: AppPage[];
  homeCards: HomeCard[];
  sections: AppSection[];
}

export interface ReferralConfig {
  enabled: boolean;
  signupPoints: number;
  pkg1Points: number;
  pkg2Points: number;
  pkg3Points: number;
  minPkgPrice: number;
  conversionRatio: number;
}

export interface SystemSettings {
  branding: BrandingConfig;
  profile: BusinessProfile;
  support: SupportConfig;
  digitalPresence: DigitalPresence;
  invoiceBranding: InvoiceBranding;
  notificationBranding: NotificationBranding;
  appearance: AppearanceConfig;
  referral: ReferralConfig;
  aboutUs: AboutUsConfig;
  notificationTemplates: any[];
  footerText: string;
  copyrightLine: string;
  socialLinks: any[];
  appVersion: string;
  autoTaxPercentage: number;
  globalEmergencyLimit: number;
  paymentGateways: PaymentGateway[];
  techConfig: TechnicalConfig;
  currency: string;
  taxId: string;
  whiteLabelMode: boolean;
  allowWifiReset: boolean;
  aiConfig: AIConfig;
  aiCallConfig: AICallConfig;
  commConfig: CommunicationSettings;
  infrastructure: InfrastructureConfig;
  legal: LegalConfig;
}

export interface CreditScoreLog {
  id: string;
  userId: string;
  delta: number;
  newScore: number;
  reason: string;
  timestamp: string;
  source: string;
  adminEmail?: string;
}

export interface PackageRequest {
  id: string;
  userId: string;
  userName: string;
  packageName: string;
  packageId: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentMethod: string;
  timestamp: string;
}

export interface NetworkNode {
  id: number | string;
  name: string;
  vendor: string;
  ip: string;
  port?: number;
  protocol?: 'SSH' | 'SNMP' | 'API' | 'Telnet';
  username?: string;
  password?: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  lastHeartbeat: string;
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  userName: string;
  connectionType: 'Fiber' | 'Wireless';
  ssid: string;
  newPassword: string;
  status: 'Pending' | 'Applied' | 'Failed' | 'Rejected';
  timestamp: string;
}
