import { 
  LayoutDashboard, Activity, Cpu, Sparkles, Mic, History, 
  Mail, BellRing, FileText, Send, Smartphone, Zap, ListChecks, 
  Settings, Users, Search, Network, Gauge, HardDrive, Map, 
  Ticket, UserCircle, ShieldCheck, Package, LifeBuoy, Key, 
  Building2, Calculator, ClipboardList, CreditCard, Receipt, 
  Wallet, Archive, ListTodo, ShieldAlert, Shield, Info, DatabaseZap,
  Globe, FileInput, Fingerprint, Compass, Clock, Box, Monitor, Server
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
    title: 'Overview',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: '📊 System Dashboard', icon: LayoutDashboard },
      { id: 'monitor', label: '🖥️ Service Health', icon: Activity },
    ]
  },
  {
    title: 'AI Automation',
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
    title: 'Communications',
    icon: Mail,
    items: [
      { id: 'notification-control', label: '🔔 Alerts Center', icon: BellRing },
      { id: 'comm-templates', label: '📝 Message Templates', icon: FileText },
      { id: 'comm-campaigns', label: '📢 Mass Broadcasts', icon: Send },
      { id: 'admin-user-devices', label: '📱 App Device List', icon: Smartphone },
      { id: 'comm-logs', label: '📊 Message History', icon: ListChecks },
      { id: 'comm-settings', label: '🔌 Channel Config', icon: Settings },
      { id: 'comm-segments', label: '👥 User Groups', icon: Users },
    ]
  },
  {
    title: 'Network Ops',
    icon: Network,
    items: [
      { id: 'admin-live-monitoring', label: '📡 Live Monitor', icon: Monitor },
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
    title: 'Subscribers',
    icon: Users,
    items: [
      { id: 'users', label: '👥 All Customers', icon: Users },
      { id: 'customer-360', label: '🔍 Identity Search', icon: Search },
      { id: 'subscriber-accounts', label: '📇 Client Dossiers', icon: UserCircle },
      { id: 'approval-desk', label: '✅ Pending Onboarding', icon: ShieldCheck },
      { id: 'admin-password-requests', label: '🔑 Access Recovery', icon: Key },
      { id: 'reseller-management', label: '🤝 Partners & Dealers', icon: Building2 },
      { id: 'requests-tasks', label: '📦 Service Requests', icon: Box, items: [
        { id: 'packages-req', label: 'Plan Switches', icon: Package },
        { id: 'support-queue', label: 'Support Desk', icon: LifeBuoy }
      ]},
    ]
  },
  {
    title: 'Finance & Billing',
    icon: Calculator,
    items: [
      { id: 'invoice-manager', label: '💳 Bill Manager', icon: Calculator, items: [
        { id: 'invoice-engine', label: 'Generate Bill', icon: Calculator },
        { id: 'invoice-management', label: 'Invoice Archive', icon: ClipboardList }
      ]},
      { id: 'gateway-settings', label: '🏦 Payment Channels', icon: CreditCard },
      { id: 'fiscal-monitor', label: '📊 Money Ledger', icon: Activity },
      { id: 'recovery', label: '📥 Collections Hub', icon: Receipt },
      { id: 'wallet', label: '💰 Credits & Wallets', icon: Wallet },
      { id: 'emergency-load', label: '⚡ Instant Recharge', icon: Zap },
      { id: 'admin-reminders', label: '🚨 Payment Alerts', icon: BellRing },
    ]
  },
  {
    title: 'Services',
    icon: Globe,
    items: [
      { id: 'packages', label: '🌐 Internet Plans', icon: Package },
      { id: 'import', label: '📥 Bulk Upload', icon: FileInput },
      { id: 'archive-records', label: '🗃️ Historical Data', icon: Archive },
    ]
  },
  {
    title: 'Operations',
    icon: Ticket,
    items: [
      { id: 'tickets', label: '🎫 Support Tickets', icon: LifeBuoy },
      { id: 'tasks', label: '📋 Work Orders', icon: ListTodo },
    ]
  },
  {
    title: 'Staff & Security',
    icon: ShieldAlert,
    items: [
      { id: 'staff', label: '👤 Employee List', icon: ShieldAlert },
      { id: 'permissions', label: '🔐 Access Controls', icon: ShieldCheck },
      { id: 'kyc-hub', label: '🆔 Identity KYC', icon: Fingerprint },
      { id: 'cloud-storage', label: '☁️ Backup & Sync', icon: HardDrive },
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
    ]
  }
];
