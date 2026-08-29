import { 
  LayoutDashboard, Activity, Cpu, Sparkles, Mic, History, 
  Mail, BellRing, FileText, Send, Smartphone, Zap, ListChecks, 
  Settings, Users, Search, Network, Gauge, HardDrive, Map, 
  Ticket, UserCircle, ShieldCheck, Package, LifeBuoy, Key, 
  Building2, Calculator, ClipboardList, CreditCard, Receipt, 
  Wallet, Archive, ListTodo, ShieldAlert, Shield, Info, DatabaseZap,
  Globe, FileInput, Fingerprint, Compass, Clock, Box, Monitor, Server, Banknote
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  badge?: string;
  items?: NavItem[];
}

export interface NavSection {
  title: string;
  icon: any;
  items: NavItem[];
}

export const NAVIGATION_CONFIG: NavSection[] = [
  {
    title: 'Business Overview',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: '📊 System Dashboard', icon: LayoutDashboard },
      { id: 'monitor', label: '🖥️ System Status', icon: Activity },
    ]
  },
  {
    title: 'AI & Automation',
    icon: Cpu,
    items: [
      { id: 'ai-control', label: '🤖 AI Brain', icon: Cpu },
      { id: 'ai-central', label: '⚙️ AI Smart Rules', icon: Sparkles },
      { id: 'ai-calling', label: '📞 Auto Dialer', icon: Mic },
      { id: 'ai-call-logs', label: '📜 Call Records', icon: History },
      { id: 'comm-rules', label: '🔄 Smart Triggers', icon: Zap },
    ]
  },
  {
    title: 'Communication',
    icon: Mail,
    items: [
      { id: 'comm-center', label: '📧 Comms Center', icon: Mail },
      { id: 'notification-control', label: '🔔 Alerts Center', icon: BellRing },
      { id: 'comm-templates', label: '📝 Message Templates', icon: FileText },
      { id: 'comm-campaigns', label: '📢 Mass Broadcasts', icon: Send },
      { id: 'comm-logs', label: '📊 Message History', icon: ListChecks },
      { id: 'comm-settings', label: '🔌 Channel Config', icon: Settings },
    ]
  },
  {
    title: 'Network Manager',
    icon: Network,
    items: [
      { id: 'network', label: '📡 Network Plane V2', icon: Monitor },
      { id: 'speed-diagnostics', label: '🚀 Speed Center', icon: Gauge, items: [
        { id: 'speed-test', label: 'Speed Test', icon: Gauge },
        { id: 'system-readiness', label: 'Health Check', icon: Activity }
      ]},
      { id: 'olt-fiber', label: '🔌 Fiber Plant', icon: HardDrive, items: [
        { id: 'admin-devices', label: 'OLT Hardware', icon: HardDrive },
        { id: 'olt-management', label: 'Network Map', icon: Cpu }
      ]},
      { id: 'router-gateway', label: '🌐 Router Hub', icon: Server, items: [
        { id: 'nas-management', label: 'Router Config', icon: Server },
        { id: 'system-config', label: 'System Gateway', icon: Settings }
      ]},
      { id: 'connection-setup', label: '🔗 Link Builder', icon: Network },
      { id: 'admin-device-mapping', label: '📟 Device Mapping', icon: Map },
      { id: 'hotspot-tokens', label: '🌍 Hotspot Hub', icon: Ticket },
      { id: 'noc-dashboard', label: '🎛️ Network NOC', icon: Zap },
    ]
  },
  {
    title: 'User & Access',
    icon: Users,
    items: [
      { id: 'users', label: '👥 Subscriber Matrix', icon: Users },
      { id: 'customer-360', label: '🔍 Identity Search', icon: Search },
      { id: 'subscriber-accounts', label: '📇 Client Dossiers', icon: UserCircle },
      { id: 'admin-password-requests', label: '🔑 Access Recovery', icon: Key },
      { id: 'admin-user-devices', label: '📱 App Device List', icon: Smartphone },
    ]
  },
  {
    title: 'User Billing',
    icon: Calculator,
    items: [
      { id: 'invoice-manager', label: '💳 Bill Manager', icon: Calculator, items: [
        { id: 'invoice-engine', label: 'Generate Bill', icon: Calculator },
        { id: 'invoice-management', label: 'Invoice Archive', icon: ClipboardList }
      ]},
      { id: 'wallet', label: '💰 Credits & Wallets', icon: Wallet },
      { id: 'emergency-load', label: '⚡ Instant Recharge', icon: Zap },
      { id: 'admin-reminders', label: '🚨 Payment Alerts', icon: BellRing },
    ]
  },
  {
    title: 'Engineer & Support',
    icon: Ticket,
    items: [
      { id: 'tasks', label: '📋 Work Orders', icon: ListTodo },
      { id: 'tickets', label: '🎫 Support Tickets', icon: LifeBuoy },
      { id: 'engineer-jobs', label: '🛠️ Field Operations', icon: Map },
    ]
  },
  {
    title: 'Finance & Payments',
    icon: CreditCard,
    items: [
      { id: 'gateway-settings', label: '🔌 Payment Gateways', icon: ListChecks },
      { id: 'finance', label: '📊 Fiscal Hub (Admin)', icon: Activity },
      { id: 'recovery', label: '📥 Collections Hub', icon: Receipt },
      { id: 'reseller-management', label: '🤝 Partners & Dealers', icon: Building2 },
    ]
  },
  {
    title: 'Plans & Assets',
    icon: Package,
    items: [
      { id: 'packages', label: '🌐 Internet Packages', icon: Package },
      { id: 'import', label: '📥 User Import', icon: FileInput },
      { id: 'archive-records', label: '🗃️ Pass/Record Archive', icon: Archive },
    ]
  },
  {
    title: 'Staff & RBAC',
    icon: ShieldAlert,
    items: [
      { id: 'staff', label: '👤 Staff Management', icon: ShieldAlert },
      { id: 'permissions', label: '🔐 Role-Based Access', icon: ShieldCheck },
    ]
  },
  {
    title: 'Compliance & KYC',
    icon: Fingerprint,
    items: [
      { id: 'kyc-hub', label: '🆔 Identity Verification', icon: Fingerprint },
      { id: 'approval-desk', label: '✅ Onboarding Approvals', icon: ShieldCheck },
    ]
  },
  {
    title: 'System Config',
    icon: Settings,
    items: [
      { id: 'general-branding', label: '🎨 Site Identity', icon: Building2, items: [
        { id: 'user-app', label: 'Mobile App Settings', icon: Smartphone },
        { id: 'business-settings', label: 'Corporate Profile', icon: Building2 },
        { id: 'about-us', label: 'Public Info', icon: Info }
      ]},
      { id: 'system-tools', label: '🛠️ Maintenance Kit', icon: DatabaseZap, items: [
        { id: 'system-flash', label: 'System Wipe', icon: Zap },
        { id: 'provider-config', label: 'Service Providers', icon: Settings }
      ]},
      { id: 'auth-control', label: '🔒 Security Protocols', icon: Shield },
      { id: 'system-deployment', label: '🚀 Core Updates', icon: ShieldCheck },
      { id: 'migration-dashboard', label: '📈 Data Migration', icon: Activity },
      { id: 'cloud-storage', label: '☁️ Backup & Sync', icon: HardDrive },
    ]
  }
];
