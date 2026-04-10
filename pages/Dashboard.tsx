
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, UserStatus, PaymentStatus, Role, LedgerType, StaffUser } from '../types';
import {
  Users, DollarSign, AlertCircle, TrendingUp,
  ArrowUpRight, Clock, RefreshCcw, Download, PieChart, ShieldCheck,
  Database, Filter, Calendar, Zap, UserCircle, Globe, Building2,
  Wallet, ArrowDownLeft, Receipt, History, Activity, Briefcase,
  // Fix: Added missing Bot import
  ArrowRight, Search, ChevronRight, Calculator, Archive, Sparkles, Smile, Bot,
  UserPlus, Banknote, Send, HandCoins, DatabaseZap, SearchCode
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart as RePieChart, Pie,
  LineChart, Line
} from 'recharts';
import { db } from '../db';
import ModuleGuide from '../components/shared/ModuleGuide';
import Modal from '../components/shared/Modal';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

type DateFilterType = '3d' | '7d' | '30d' | 'all' | 'custom';

const Dashboard: React.FC<{ 
  state: AppState; 
  onNavigate?: (page: string, params?: { userId?: string, action?: string }) => void;
  searchTerm?: string;
  onClearSearch?: () => void;
}> = ({ state, onNavigate, searchTerm, onClearSearch }) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [collectorFilter, setCollectorFilter] = useState<string>('All');
  const [entityFilter, setEntityFilter] = useState<'all' | 'users' | 'dealers'>('all');

  const currentUser = state.currentUser;
  const isDealer = currentUser?.role === Role.DEALER;

  const branding = state?.settings?.branding;
  const logo = branding?.logoLight || branding?.logoSquare;

  const [isReconcileModal, setIsReconcileModal] = useState(false);
  const [reconcileType, setReconcileType] = useState<'user' | 'billing' | 'package' | 'entire'>('entire');
  const [isScanning, setIsScanning] = useState(false);
  const [isFixingAll, setIsFixingAll] = useState(false);

  useEffect(() => {
    db.auditOverdueLoads();
  }, []);

  const globalStats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    if (dateFilter === 'custom') {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const filterDays = dateFilter === '3d' ? 3 : dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 9999;
      const d = new Date();
      startDate = new Date(d.setDate(d.getDate() - filterDays));
    }

    const dealerEmails = new Set(state.staff.filter(s => s.role === Role.DEALER).map(s => s.email));

    const periodInvoices = state.invoices.filter(i => {
      const d = new Date(i.createdAt);
      const dateMatch = d >= startDate && d <= endDate;
      const isDlr = dealerEmails.has(String(i.userId));
      const entityMatch = entityFilter === 'all' ||
        (entityFilter === 'users' && !isDlr) ||
        (entityFilter === 'dealers' && isDlr);
      return dateMatch && entityMatch;
    });

    const periodPayments = state.payments.filter(p => {
      const d = new Date(p.timestamp);
      const dateMatch = d >= startDate && d <= endDate;
      const isDlr = dealerEmails.has(p.userId);
      const collectorMatch = collectorFilter === 'All' || p.collectorEmail === collectorFilter;
      const entityMatch = entityFilter === 'all' ||
        (entityFilter === 'users' && !isDlr) ||
        (entityFilter === 'dealers' && isDlr);
      return dateMatch && collectorMatch && entityMatch && p.status === 'Approved';
    });

    const dashboardMetrics = db.getDashboardMetrics();

    return {
      totalUnpaidAmount: dashboardMetrics.totalUnpaidAmount,
      totalUsers: entityFilter === 'dealers' ? 0 : dashboardMetrics.totalUsers,
      activeSubs: entityFilter === 'dealers' ? 0 : dashboardMetrics.activeUsers,
      unpaidUsers: entityFilter === 'dealers' ? 0 : dashboardMetrics.unpaidUsers,
      expiredUsers: entityFilter === 'dealers' ? 0 : dashboardMetrics.expiredUsers,
      disabledUsers: entityFilter === 'dealers' ? 0 : dashboardMetrics.disabledUsers,
      onlineUsers: entityFilter === 'dealers' ? 0 : dashboardMetrics.onlineUsers,
      newUsers: entityFilter === 'dealers' ? 0 : dashboardMetrics.newUsers,
      expiring1d: dashboardMetrics.expiring1d,
      expiring3d: dashboardMetrics.expiring3d,
      expiring1w: dashboardMetrics.expiring1w,
      activeDealers: entityFilter === 'users' ? 0 : state.staff.filter(s => s.role === Role.DEALER && s.status === 'Active').length,
      periodRevenue: periodInvoices.reduce((acc, i) => acc + i.totalAmount, 0),
      periodRecovery: periodPayments.reduce((acc, p) => acc + p.amount, 0),
      ...db.getFiscalSummary(startDate, endDate)
    };
  }, [state.users, state.staff, state.invoices, state.payments, state.recoveryLogs, dateFilter, customStartDate, customEndDate, collectorFilter, entityFilter]);

  const aiStats = useMemo(() => {
    const totalCalls = state.aiCallLogs.length;
    const satisfied = state.aiCallLogs.filter(l => l.sentimentEnd === 'Satisfied').length;
    const satisfactionRate = totalCalls > 0 ? Math.round((satisfied / totalCalls) * 100) : 0;
    return { totalCalls, satisfactionRate };
  }, [state.aiCallLogs]);

  const chartData = useMemo(() => {
    let startDate: Date;
    let endDate: Date = new Date();
    let diffDays: number;

    if (dateFilter === 'custom') {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 60) diffDays = 60;
    } else {
      diffDays = dateFilter === 'all' ? 30 : (dateFilter === '3d' ? 3 : (dateFilter === '7d' ? 7 : 30));
      const tempDate = new Date();
      startDate = new Date(tempDate.setDate(tempDate.getDate() - (diffDays - 1)));
    }

    const data = [];
    const dealerEmails = new Set(state.staff.filter(s => s.role === Role.DEALER).map(s => s.email));

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dayStr = d.toISOString().split('T')[0];

      const dayInv = state.invoices.filter(inv => {
        const dateMatch = inv.createdAt.startsWith(dayStr);
        const isDlr = dealerEmails.has(inv.userId);
        const entityMatch = entityFilter === 'all' || (entityFilter === 'users' && !isDlr) || (entityFilter === 'dealers' && isDlr);
        return dateMatch && entityMatch;
      }).reduce((acc, inv) => acc + inv.totalAmount, 0);

      const dayRec = state.payments.filter(p => {
        const dateMatch = p.timestamp.startsWith(dayStr);
        const isDlr = dealerEmails.has(p.userId);
        const collectorMatch = collectorFilter === 'All' || p.collectorEmail === collectorFilter;
        const entityMatch = entityFilter === 'all' || (entityFilter === 'users' && !isDlr) || (entityFilter === 'dealers' && isDlr);
        return dateMatch && collectorMatch && entityMatch && p.status === 'Approved';
      }).reduce((acc, p) => acc + p.amount, 0);

      data.push({
        name: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        revenue: dayInv,
        recovery: dayRec
      });
    }
    return data;
  }, [state.invoices, state.staff, state.payments, dateFilter, customStartDate, customEndDate, collectorFilter, entityFilter]);

  if (isDealer) {
    const dealerUser = currentUser as StaffUser;
    const personalInvoices = state.invoices.filter(i => i.userId === dealerUser.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-center gap-5">
            {logo ? (
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100 overflow-hidden shrink-0">
                <img src={logo} className="w-full h-full object-contain" alt="Brand" />
              </div>
            ) : (
              <Briefcase className="text-purple-600 shrink-0" size={36} />
            )}
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight italic leading-none">
                Partner Overview
              </h2>
              <p className="text-slate-500 font-medium mt-1">Monitoring your account and wallet status.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Account Code</p>
              <p className="text-lg font-black text-purple-600 uppercase italic">{dealerUser.dealerCode || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl col-span-1">
            <div className="relative z-10 space-y-6">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                <Wallet size={16} className="text-green-400" />
                Available Balance
              </p>
              <h3 className="text-5xl font-black text-green-400 tracking-tighter">
                {state.settings.currency} {(dealerUser.balance || 0).toLocaleString()}
              </h3>
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Distributed</p>
                  <p className="text-sm font-bold text-slate-300">{state.settings.currency} {personalInvoices.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
              </div>
            </div>
            <Activity className="absolute -right-10 -bottom-10 opacity-5" size={260} />
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm col-span-2 flex flex-col justify-between">
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History size={16} className="text-blue-500" />
                Recent Transactions
              </h4>
              <div className="space-y-3">
                {personalInvoices.slice(0, 4).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.status === PaymentStatus.PAID ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{inv.packageName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">Rs. {inv.totalAmount.toLocaleString()}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${inv.status === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
              View Full Transaction History <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Operational summary and system performance</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white p-1 rounded-xl border border-border-main shadow-sm shrink-0">
            {[{ id: '3d', label: '3D' }, { id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: 'all', label: 'All' }].map(f => (
              <button 
                key={f.id} 
                onClick={() => setDateFilter(f.id as any)} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${dateFilter === f.id ? 'bg-bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm flex-1 md:flex-none">
            <Download size={16} /> Export
          </button>
          <button onClick={() => onNavigate && onNavigate('users', { action: 'add-user' })} className="btn btn-primary btn-sm flex-1 md:flex-none">
            <UserPlus size={16} /> New User
          </button>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS */}
      <div className="grid-cols-responsive">
        {[
          { label: 'Total Users', value: globalStats.totalUsers.toLocaleString(), trend: '+2.5%', icon: Users, color: 'text-indigo-500' },
          { label: 'Active Subscribers', value: globalStats.activeSubs.toLocaleString(), trend: '+1.2%', icon: Activity, color: 'text-emerald-500' },
          { label: 'Pending KYC', value: state.kycRequests.filter(r => r.status === 'Pending').length, trend: '-5%', icon: ShieldCheck, color: 'text-amber-500' },
          { label: 'Revenue (Period)', value: `${state.settings.currency} ${globalStats.periodRevenue.toLocaleString()}`, trend: '+12%', icon: DollarSign, color: 'text-blue-500' },
        ].map((kpi, idx) => (
          <div key={idx} className="card metric-card">
            <div className="flex justify-between items-start">
              <span className="label">{kpi.label}</span>
              <div className={`p-2 rounded-lg bg-bg-surface-soft ${kpi.color}`}>
                <kpi.icon size={18} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="value">{kpi.value}</h3>
              <span className={`text-[10px] font-bold pb-1 ${kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {kpi.trend.startsWith('+') ? '↑' : '↓'} {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MAIN GRID SECTION (CORE DASHBOARD) */}
      <div className="dashboard-main-grid">
        {/* LEFT: Analytics / Chart Section */}
        <div className="card h-full min-h-[440px] flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="section-title">Income Overview</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Received</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} fontWeight={600} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-main)', boxShadow: 'var(--shadow-lg)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="recovery" name="Received" stroke="#10B981" fillOpacity={1} fill="url(#colorRec)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: Quick stats / activity / Quick Actions */}
        <div className="space-y-6">
          <div className="card overflow-visible">
            <h3 className="section-title mb-6">Quick Actions</h3>
            <div className="action-list">
              {[
                { label: 'Receive Funds', icon: Banknote, color: 'text-emerald-500', action: () => onNavigate?.('users', { action: 'receive-funds' }) },
                { label: 'Create Invoice', icon: Receipt, color: 'text-indigo-500', action: () => onNavigate?.('invoice-engine') },
                { label: 'Send Message', icon: Send, color: 'text-purple-500', action: () => onNavigate?.('comm-campaigns') },
                { label: 'Sync Registry', icon: DatabaseZap, color: 'text-amber-500', action: () => setIsReconcileModal(true) },
              ].map((act, i) => (
                <div key={i} onClick={act.action} className="action-item group">
                  <div className={`action-icon group-hover:bg-indigo-500 group-hover:text-white transition-colors`}>
                    <act.icon size={20} className={act.color + " group-hover:text-white"} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-text-main group-hover:text-bg-primary transition-colors">{act.label}</p>
                    <p className="text-[10px] text-text-muted">Instant system utility</p>
                  </div>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-bg-primary" />
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-bg-app border-dashed border-2 flex flex-col items-center justify-center p-8 text-center gap-4">
             <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck size={28} />
             </div>
             <div>
                <p className="text-xs font-bold text-text-main">System Health Healthy</p>
                <p className="text-[10px] text-text-muted mt-1">All registry nodes are synchronized and performing optimally.</p>
             </div>
             <button onClick={() => setIsReconcileModal(true)} className="text-[10px] font-bold text-bg-primary uppercase tracking-widest hover:underline">Run Diagnostic</button>
          </div>
        </div>
      </div>

      {/* 4. DATA SECTION: RECENT USERS / KYC */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="section-title">Recent System Activity</h3>
            <button onClick={() => onNavigate?.('kyc-hub')} className="text-[10px] font-bold text-bg-primary uppercase tracking-widest hover:underline">View All Records</button>
        </div>
        
        <div className="table-container shadow-sm border border-border-main">
          <table>
            <thead>
              <tr>
                <th>Subscriber</th>
                <th>Status</th>
                <th>KYC Level</th>
                <th>Joined</th>
                <th>Due Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.users.slice(0, 5).map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bg-surface-soft flex items-center justify-center text-text-muted font-bold text-[10px]">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{user.name}</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-tighter">{user.connectionId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.status === UserStatus.ACTIVE ? 'badge-success' : 'badge-warning'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.verificationStatus === VerificationStatus.VERIFIED ? 'badge-success' : user.verificationStatus === VerificationStatus.PENDING ? 'badge-warning' : 'badge-info'}`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td>
                    <span className="text-[11px] font-medium text-text-muted">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </td>
                  <td>
                    <span className="text-sm font-bold text-text-main">
                      {state.settings.currency} {(state.invoices.find(i => i.userId === user.email && i.status === PaymentStatus.UNPAID)?.dueAmount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <button 
                       onClick={() => onNavigate?.('customer-360', { userId: user.id })}
                       className="p-1.5 hover:bg-bg-surface-soft rounded-lg text-text-muted hover:text-bg-primary transition-colors"
                    >
                      <UserCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!searchTerm}
        onClose={() => { if (onClearSearch) onClearSearch(); }}
        title="Global System Records"
        icon={<Search size={24} className="text-bg-primary" />}
        maxWidth="max-w-4xl"
        scrollable
        footer={
           <div className="flex items-center justify-between w-full">
               <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Global Lookup • {state.users.length} Records</p>
               <button onClick={onClearSearch} className="btn btn-primary btn-sm">Close</button>
           </div>
        }
      >
        <div className="space-y-8 p-1">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] border-b pb-2">Matched Subscribers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.users.filter(u => 
                  u.name.toLowerCase().includes(searchTerm?.toLowerCase() || '') || 
                  u.connectionId?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
                ).map(u => (
                  <div key={u.id} onClick={() => { onClearSearch?.(); onNavigate?.('customer-360', { userId: u.id }); }} className="card !p-4 flex justify-between items-center cursor-pointer hover:border-bg-primary transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><UserCircle size={18}/></div>
                        <div><p className="text-xs font-bold">{u.name}</p><p className="text-[10px] text-text-muted">{u.connectionId}</p></div>
                    </div>
                    <ChevronRight size={14} className="text-text-muted" />
                  </div>
                ))}
              </div>
            </section>
        </div>
      </Modal>

      <Modal
        isOpen={isReconcileModal}
        onClose={() => setIsReconcileModal(false)}
        title="Registry Diagnostics"
        icon={<DatabaseZap size={24} className="text-amber-500" />}
        maxWidth="max-w-4xl"
        scrollable
      >
        <div className="space-y-6 py-2">
           <div className="flex justify-between items-center p-6 bg-bg-app rounded-2xl border border-border-main">
              <div><h4 className="text-sm font-bold">Diagnostic Mode</h4><p className="text-[10px] text-text-muted">Select block to analyze</p></div>
              <div className="flex bg-white p-1 rounded-xl border">
                 {['user', 'billing', 'entire'].map(t => (
                   <button key={t} onClick={() => setReconcileType(t as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase ${reconcileType === t ? 'bg-bg-primary text-white' : 'text-text-muted'}`}>{t}</button>
                 ))}
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <button disabled={isScanning} onClick={() => {setIsScanning(true); db.reconcileData(reconcileType).then(() => setIsScanning(false));}} className="btn btn-secondary h-24 flex-col gap-2">
                 {isScanning ? <RefreshCcw className="animate-spin" /> : <SearchCode size={24} />}
                 <span>Deep Scan</span>
              </button>
              <button disabled={isFixingAll || state.missingData.length === 0} onClick={() => {setIsFixingAll(true); Promise.all(state.missingData.map(n => db.fixMissingData(n.id))).then(() => setIsFixingAll(false));}} className="btn btn-primary h-24 flex-col gap-2 !bg-emerald-600">
                 <ShieldCheck size={24} />
                 <span>Auto-Heal {state.missingData.length} Nodes</span>
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
