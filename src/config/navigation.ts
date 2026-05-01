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
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: '📊 Overview', icon: LayoutDashboard },
      { id: 'monitor', label: '🖥️ System Health', icon: Activity },
    ]
  },
  {
    title: 'AI & Voice Automation',
    icon: Cpu,
    items: [
      { id: 'ai-control', label: '🤖 AI Overview', icon: Cpu },
      { id: 'ai-central', label: '⚙️ AI Rules & Controls', icon: Sparkles },
      { id: 'ai-calling', label: '📞 Voice Campaigns', icon: Mic },
      { id: 'ai-call-logs', label: '📜 Call Transcripts', icon: History },
      { id: 'comm-rules', label: '🔄 Automation Rules', icon: Zap },
    ]
  },
  {
    title: 'Communications Hub',
    icon: Mail,
    items: [
      { id: 'notification-control', label: '🔔 Notification Center', icon: BellRing },
      { id: 'comm-templates', label: '📝 Email & SMS Templates', icon: FileText },
      { id: 'comm-campaigns', label: '📢 Broadcast Campaigns', icon: Send },
      { id: 'admin-user-devices', label: '📱 Push Device Registry', icon: Smartphone },
      { id: 'comm-logs', label: '📊 Provider Logs', icon: ListChecks },
      { id: 'comm-settings', label: '🔌 Channel Setup', icon: Settings },
      { id: 'comm-segments', label: '👥 Audience Segments', icon: Users },
    ]
  },
  {
    title: 'Network Operations',
    icon: Network,
    items: [
      { id: 'admin-live-monitoring', label: '📡 Live Monitor', icon: Monitor },
      { id: 'speed-diagnostics', label: '🚀 Speed & Diagnostics', icon: Gauge, items: [
        { id: 'speed-test', label: 'Speed Test', icon: Gauge },
        { id: 'system-readiness', label: 'Diagnostics', icon: Activity }
      ]},
      { id: 'olt-fiber', label: '🔌 OLT & Fiber Management', icon: HardDrive, items: [
        { id: 'admin-devices', label: 'OLT Devices', icon: HardDrive },
        { id: 'olt-management', label: 'Infrastructure', icon: Cpu }
      ]},
      { id: 'router-gateway', label: '🌐 Router & Gateway Config', icon: Server, items: [
        { id: 'nas-management', label: 'Router Settings', icon: Server },
        { id: 'system-config', label: 'System Gateway', icon: Settings }
      ]},
      { id: 'connection-setup', label: '🔗 Connection Setup', icon: Network },
      { id: 'admin-device-mapping', label: '📟 Device Mapping', icon: Map },
      { id: 'hotspot-tokens', label: '🌍 Hotspot Management', icon: Ticket },
      { id: 'noc-dashboard', label: '🎛️ Network Control', icon: Zap },
    ]
  },
  {
    title: 'Subscriber Management',
    icon: Users,
    items: [
      { id: 'users', label: '👥 All Subscribers', icon: Users },
      { id: 'customer-360', label: '🔍 Quick Search', icon: Search },
      { id: 'subscriber-accounts', label: '📇 Accounts & Profiles', icon: UserCircle },
      { id: 'approval-desk', label: '✅ Approval Desk', icon: ShieldCheck },
      { id: 'admin-password-requests', label: '🔑 Reset Requests', icon: Key },
      { id: 'reseller-management', label: '🤝 Reseller & Partners', icon: Building2 },
      { id: 'requests-tasks', label: '📦 Requests & Tasks', icon: Box, items: [
        { id: 'packages-req', label: 'Resource Packages', icon: Package },
        { id: 'support-queue', label: 'Support Queue', icon: LifeBuoy }
      ]},
    ]
  },
  {
    title: 'Billing & Finance',
    icon: Calculator,
    items: [
      { id: 'invoice-manager', label: '💳 Invoice Manager', icon: Calculator, items: [
        { id: 'invoice-engine', label: 'Billing System', icon: Calculator },
        { id: 'invoice-management', label: 'Invoices', icon: ClipboardList }
      ]},
      { id: 'gateway-settings', label: '🏦 Payment Gateways', icon: CreditCard },
      { id: 'fiscal-monitor', label: '📊 Transaction Ledger', icon: Activity },
      { id: 'recovery', label: '📥 Recovery & Collections', icon: Receipt },
      { id: 'wallet', label: '💰 Wallet & Credits', icon: Wallet },
      { id: 'emergency-load', label: '⚡ Emergency Load', icon: Zap },
      { id: 'admin-reminders', label: '🚨 Finance Alerts', icon: BellRing },
    ]
  },
  {
    title: 'Internet Services',
    icon: Globe,
    items: [
      { id: 'packages', label: '🌐 Service Packages', icon: Package },
      { id: 'import', label: '📥 Bulk Import', icon: FileInput },
      { id: 'archive-records', label: '🗃️ Archive & History', icon: Archive },
    ]
  },
  {
    title: 'Support & Operations',
    icon: Ticket,
    items: [
      { id: 'tickets', label: '🎫 Ticket Desk', icon: LifeBuoy },
      { id: 'tasks', label: '📋 Task Board', icon: ListTodo },
    ]
  },
  {
    title: 'Staff & Compliance',
    icon: ShieldAlert,
    items: [
      { id: 'staff', label: '👤 Staff Directory', icon: ShieldAlert },
      { id: 'permissions', label: '🔐 Roles & Access', icon: ShieldCheck },
      { id: 'kyc-hub', label: '🆔 KYC Verification', icon: Fingerprint },
      { id: 'cloud-storage', label: '☁️ Cloud Sync & Backup', icon: HardDrive },
    ]
  },
  {
    title: 'System & Security',
    icon: Settings,
    items: [
      { id: 'general-branding', label: '🎨 General & Branding', icon: Building2, items: [
        { id: 'user-app', label: 'App Settings', icon: Smartphone },
        { id: 'business-settings', label: 'Brand Settings', icon: Building2 },
        { id: 'about-us', label: 'About Us', icon: Info }
      ]},
      { id: 'system-tools', label: '🛠️ System Tools', icon: DatabaseZap, items: [
        { id: 'system-flash', label: 'System Flash', icon: Zap },
        { id: 'provider-config', label: 'Provider Config', icon: Settings }
      ]},
      { id: 'auth-control', label: '🔒 Authentication & Security', icon: Shield },
      { id: 'system-deployment', label: '🚀 Deployment & Updates', icon: ShieldCheck },
      { id: 'migration-dashboard', label: '📈 Migration Health', icon: Activity },
    ]
  }
];
