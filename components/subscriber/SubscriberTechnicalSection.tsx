
import React, { useMemo } from 'react';
import {
  BarChart3, User, Headphones, ShieldAlert,
  Zap, Package, Wallet, Bell, FileText
} from 'lucide-react';
import { ISPUser, AppState } from '../../types';
import TechnicalCard from './TechnicalCard';

interface Props {
  user: ISPUser;
  state: AppState;
  onAction: (tab: string) => void;
}

const SubscriberTechnicalSection: React.FC<Props> = ({ user, state, onAction }) => {
  const unreadCount = useMemo(() =>
    state.notifications.filter(n => !n.read).length,
    [state.notifications]);

  const activeEL = useMemo(() =>
    state.emergencyLoads.find(l => l.userId === user.id && l.status === 'Active'),
    [state.emergencyLoads, user.id]);

  const currentPkg = useMemo(() =>
    state.packages.find(p => p.id === user.packageId),
    [state.packages, user.packageId]);

  const unpaidInvoicesCount = useMemo(() =>
    state.invoices.filter(i => i.userId === user.id && i.status !== 'Paid').length,
    [state.invoices, user.id]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-4 flex justify-between items-end">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Technical</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">System & account management tools</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-4">
        {/* 1. Credit Score */}
        <TechnicalCard
          title="Credit"
          icon={BarChart3}
          onClick={() => onAction('credit-score')}
          badge={user.creditScore}
          badgeColor="bg-slate-900"
          sublabel="Score"
        />

        {/* 2. Profile */}
        <TechnicalCard
          title="Profile"
          icon={User}
          onClick={() => onAction('profile')}
          sublabel="Settings"
        />

        {/* 3. Support */}
        <TechnicalCard
          title="Support"
          icon={Headphones}
          onClick={() => onAction('support')}
          sublabel="Help Center"
        />

        {/* 4. Emergency Load */}
        <TechnicalCard
          title="Rescue"
          icon={ShieldAlert}
          onClick={() => onAction('wallet')}
          badge={activeEL ? "Active" : undefined}
          badgeColor="bg-rose-600"
          sublabel="Emergency"
        />

        {/* 5. Quick Pay */}
        <TechnicalCard
          title="Quick Pay"
          icon={Zap}
          onClick={() => onAction('online_pay')}
          sublabel="Pay Now"
        />

        {/* 6. Package Plan */}
        <TechnicalCard
          title="Plan"
          icon={Package}
          onClick={() => onAction('packages')}
          sublabel={currentPkg?.speed || "Internet"}
        />

        {/* 7. Wallet */}
        <TechnicalCard
          title="Wallet"
          icon={Wallet}
          onClick={() => onAction('wallet')}
          badge={user.balance > 0 ? `Rs.${user.balance}` : "Current"}
          badgeColor="bg-green-600"
          sublabel="Balance"
        />

        {/* 8. Notifications */}
        <TechnicalCard
          title="Alerts"
          icon={Bell}
          onClick={() => onAction('notifs')}
          badge={unreadCount > 0 ? unreadCount : undefined}
          badgeColor="bg-blue-600"
          sublabel="Latest"
        />

        {/* 9. Invoices (Updated) */}
        <TechnicalCard
          title="Invoices"
          icon={FileText}
          onClick={() => onAction('billing')}
          badge={unpaidInvoicesCount > 0 ? unpaidInvoicesCount : undefined}
          badgeColor="bg-rose-500"
          sublabel="Billing"
        />
      </div>
    </div>
  );
};

export default SubscriberTechnicalSection;

