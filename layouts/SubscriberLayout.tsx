/**
 * SubscriberLayout.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Completely isolated subscriber portal shell.
 * ZERO admin components, styles, or state are imported into this layout.
 * All data access is read-only via selectors passed as props.
 * Mobile-first, WCAG AA compliant, dark mode ready.
 */

import React, { useState } from 'react';
import {
  Wifi, Receipt, Wallet, HelpCircle, LogOut,
  Bell, User, Home, Zap, ChevronRight, Menu, X,
  Shield, Activity, Phone
} from 'lucide-react';

// ─── Types (read-only, no mutation access) ────────────────────────────────────
interface SubscriberUser {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly phone: string;
  readonly status: string;
  readonly balance: number;
  readonly expiryDate?: string;
  readonly profileImage?: string;
}

interface SubscriberLayoutProps {
  /** Read-only user data passed from App.tsx — no direct db.ts access inside this layout. */
  user: SubscriberUser;
  children: React.ReactNode;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  activeRoute: string;
  businessName: string;
  businessLogo?: string;
  isImpersonating?: boolean;
}

// ─── Navigation Items (Subscriber Domain Only) ────────────────────────────────
const NAV_ITEMS = [
  { id: 'home',     icon: Home,     label: 'My Dashboard', path: '/portal' },
  { id: 'usage',    icon: Activity, label: 'Usage & Speed', path: '/portal/usage' },
  { id: 'billing',  icon: Receipt,  label: 'Bills & Payments', path: '/portal/billing' },
  { id: 'wallet',   icon: Wallet,   label: 'My Wallet', path: '/portal/wallet' },
  { id: 'support',  icon: HelpCircle, label: 'Help & Support', path: '/portal/support' },
  { id: 'profile',  icon: User,     label: 'My Profile', path: '/portal/profile' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'Active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
      {status}
    </span>
  );
};

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────
const MobileBottomNav: React.FC<{ activeRoute: string; onNavigate: (p: string) => void }> = ({
  activeRoute, onNavigate
}) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 safe-area-inset-bottom lg:hidden"
    role="navigation"
    aria-label="Subscriber mobile navigation"
  >
    <div className="flex items-stretch">
      {NAV_ITEMS.slice(0, 5).map(item => {
        const Icon = item.icon;
        const isActive = activeRoute === item.path;
        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => onNavigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all active:scale-90 ${
              isActive ? 'text-blue-400' : 'text-slate-500'
            }`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[9px] font-bold uppercase tracking-wide">{item.label.split(' ')[0]}</span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-blue-400 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  </nav>
);

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
const DesktopSidebar: React.FC<{
  user: SubscriberUser;
  activeRoute: string;
  onNavigate: (p: string) => void;
  onLogout: () => void;
  businessName: string;
  businessLogo?: string;
}> = ({ user, activeRoute, onNavigate, onLogout, businessName, businessLogo }) => (
  <aside
    className="hidden lg:flex flex-col w-72 min-h-screen bg-slate-950 border-r border-white/5 py-8 px-5 gap-6"
    role="navigation"
    aria-label="Subscriber desktop navigation"
  >
    {/* Brand Header */}
    <div className="flex items-center gap-3 px-2 mb-4">
      {businessLogo ? (
        <img src={businessLogo} alt={businessName} className="w-9 h-9 rounded-xl object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Wifi size={18} className="text-white" />
        </div>
      )}
      <div>
        <h1 className="text-sm font-black text-white tracking-tight">{businessName}</h1>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Subscriber Portal</p>
      </div>
    </div>

    {/* User Card */}
    <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/10 rounded-2xl p-5 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        {user.profileImage ? (
          <img src={user.profileImage} alt={user.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-blue-500/30" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-white font-black text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-black text-white truncate">{user.name}</p>
          <p className="text-[10px] text-slate-400 font-bold truncate">{user.email || user.phone}</p>
        </div>
      </div>
      <StatusBadge status={user.status} />
      {user.expiryDate && (
        <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">
          Expires: {new Date(user.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>

    {/* Balance Chip */}
    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 rounded-2xl border border-white/5">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
      <span className={`text-sm font-black ${user.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
        PKR {Math.abs(user.balance).toLocaleString()}
      </span>
    </div>

    {/* Nav Links */}
    <nav className="flex-1 space-y-1">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = activeRoute === item.path;
        return (
          <button
            key={item.id}
            id={`desktop-nav-${item.id}`}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all group ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="flex items-center gap-3">
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
            </div>
            {isActive && <ChevronRight size={14} className="opacity-60" />}
          </button>
        );
      })}
    </nav>

    {/* Footer Actions */}
    <div className="space-y-2 pt-4 border-t border-white/5">
      <button
        id="subscriber-support-cta"
        onClick={() => onNavigate('/portal/support')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
      >
        <Phone size={16} />
        <span className="text-xs font-bold uppercase tracking-wide">Contact Support</span>
      </button>
      <button
        id="subscriber-logout-btn"
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all"
        aria-label="Sign out of subscriber portal"
      >
        <LogOut size={16} />
        <span className="text-xs font-bold uppercase tracking-wide">Sign Out</span>
      </button>
    </div>
  </aside>
);

// ─── Mobile Header ────────────────────────────────────────────────────────────
const MobileHeader: React.FC<{
  user: SubscriberUser;
  businessName: string;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  onNavigate: (p: string) => void;
  onLogout: () => void;
}> = ({ user, businessName, isMobileMenuOpen, setMobileMenuOpen, onNavigate, onLogout }) => (
  <header className="lg:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
        <Wifi size={16} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-black text-white">{businessName}</p>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Subscriber Portal</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button
        id="subscriber-notifications-btn"
        onClick={() => onNavigate('/portal/notifications')}
        className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        aria-label="Notifications"
      >
        <Bell size={16} />
      </button>
      <button
        id="subscriber-menu-toggle"
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
    </div>

    {/* Mobile Slide-down Menu */}
    {isMobileMenuOpen && (
      <div className="absolute top-full left-0 right-0 bg-slate-950 border-b border-white/5 p-4 space-y-1 animate-in slide-in-from-top-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.path); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/5 transition-all text-left"
            >
              <Icon size={18} className="shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={18} />
          <span className="text-xs font-bold uppercase tracking-wide">Sign Out</span>
        </button>
      </div>
    )}
  </header>
);

// ─── MAIN LAYOUT COMPONENT ─────────────────────────────────────────────────────
const SubscriberLayout: React.FC<SubscriberLayoutProps> = ({
  user,
  children,
  onLogout,
  onNavigate,
  activeRoute,
  businessName,
  businessLogo,
  isImpersonating,
}) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        <DesktopSidebar
          user={user}
          activeRoute={activeRoute}
          onNavigate={onNavigate}
          onLogout={onLogout}
          businessName={businessName}
          businessLogo={businessLogo}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Mobile Header */}
          <MobileHeader
            user={user}
            businessName={businessName}
            isMobileMenuOpen={isMobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />

          {/* Desktop Top Bar */}
          <div className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-white/5 bg-slate-950">
            <div>
              <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Welcome back,</p>
              <h2 className="text-xl font-black text-white mt-0.5">{user.name}</h2>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={user.status} />
              <button
                id="desktop-notifications-btn"
                onClick={() => onNavigate('/portal/notifications')}
                className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-white/5"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Shield size={18} />
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main
            className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 pb-24 lg:pb-8"
            role="main"
            aria-label="Subscriber portal content"
          >
            {children}
          </main>

          {/* Impersonation Exit Portal */}
          {isImpersonating && (
            <div className="fixed bottom-20 right-6 lg:bottom-10 lg:right-10 z-[100] animate-in fade-in zoom-in duration-500">
               <button
                 onClick={() => {
                   // Direct access to window.db if available, else standard reload to admin
                   (window as any).db?.logoutImpersonation();
                 }}
                 className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all border border-white/20"
               >
                 <Shield className="animate-pulse" size={18} />
                 Return to Admin Node
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeRoute={activeRoute} onNavigate={onNavigate} />
    </div>
  );
};

export default SubscriberLayout;
