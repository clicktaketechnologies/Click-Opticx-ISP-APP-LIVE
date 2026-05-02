import React, { useState, useMemo, useEffect } from 'react';
import { AppState, UserStatus, PaymentStatus, Role, LedgerType, StaffUser, VerificationStatus } from '../types';
import {
  Users, DollarSign, AlertCircle, TrendingUp,
  ArrowUpRight, Clock, RefreshCcw, Download, PieChart, ShieldCheck,
  Database, Filter, Calendar, Zap, UserCircle, Globe, Building2,
  Wallet, ArrowDownLeft, Receipt, History, Activity, Briefcase,
  ArrowRight, Search, ChevronRight, Calculator, Archive, Sparkles, Smile, Bot,
  UserPlus, Banknote, Send, HandCoins, DatabaseZap, SearchCode,
  Cpu, HardDrive, Headphones, ClipboardList, Settings, Landmark, Package, ShieldAlert, FileText, Bell, Circle, Ban
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { db } from '../db';
import Modal from '../components/shared/Modal';

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
  const isReseller = [Role.FRANCHISE, Role.DEALER, Role.SUB_DEALER].includes(currentUser?.role as Role);

  const branding = state?.settings?.branding;
  const logo = branding?.logoLight || branding?.logoSquare;

  const [isReconcileModal, setIsReconcileModal] = useState(false);
  const [reconcileType, setReconcileType] = useState<'user' | 'billing' | 'package' | 'entire'>('entire');
  const [isScanning, setIsScanning] = useState(false);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [isQuickRenewModal, setIsQuickRenewModal] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulated export API
      await new Promise(r => setTimeout(r, 800));
      // db.exportData() if available
    } finally {
      setIsExporting(false);
    }
  };

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

    const resellerEmails = new Set(state.staff.filter(s => [Role.FRANCHISE, Role.DEALER, Role.SUB_DEALER].includes(s.role as Role)).map(s => s.email));

    const periodInvoices = state.invoices.filter(i => {
      const d = new Date(i.createdAt);
      const dateMatch = d >= startDate && d <= endDate;
      const isDlr = resellerEmails.has(String(i.userId));
      const entityMatch = entityFilter === 'all' ||
        (entityFilter === 'users' && !isDlr) ||
        (entityFilter === 'dealers' && isDlr);
      return dateMatch && entityMatch;
    });

    const periodPayments = state.payments.filter(p => {
      const d = new Date(p.timestamp);
      const dateMatch = d >= startDate && d <= endDate;
      const isDlr = resellerEmails.has(p.userId);
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
      activeDealers: entityFilter === 'users' ? 0 : state.staff.filter(s => [Role.FRANCHISE, Role.DEALER, Role.SUB_DEALER].includes(s.role as Role) && s.status === 'Active').length,
      periodRevenue: periodInvoices.reduce((acc, i) => acc + i.totalAmount, 0),
      periodRecovery: periodPayments.reduce((acc, p) => acc + p.amount, 0),
      periodActivations: state.ledger.filter(l => {
        const d = new Date(l.timestamp);
        return d >= startDate && d <= endDate && l.type === LedgerType.DEBIT && l.description?.toLowerCase().includes('activation');
      }).length,
      periodVerifications: state.users.filter(u => {
        const d = new Date(u.createdAt || Date.now());
        return d >= startDate && d <= endDate && u.verificationStatus === VerificationStatus.VERIFIED;
      }).length,
      ...db.getFiscalSummary(startDate, endDate)
    };
  }, [state.users, state.staff, state.invoices, state.payments, state.recoveryLogs, dateFilter, customStartDate, customEndDate, collectorFilter, entityFilter]);

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
    const resellerEmails = new Set(state.staff.filter(s => [Role.FRANCHISE, Role.DEALER, Role.SUB_DEALER].includes(s.role as Role)).map(s => s.email));

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dayStr = d.toISOString().split('T')[0];

      const dayInv = state.invoices.filter(inv => {
        const dateMatch = inv.createdAt.startsWith(dayStr);
        const isDlr = resellerEmails.has(inv.userId);
        const entityMatch = entityFilter === 'all' || (entityFilter === 'users' && !isDlr) || (entityFilter === 'dealers' && isDlr);
        return dateMatch && entityMatch;
      }).reduce((acc, inv) => acc + inv.totalAmount, 0);

      const dayRec = state.payments.filter(p => {
        const dateMatch = p.timestamp.startsWith(dayStr);
        const isDlr = resellerEmails.has(p.userId);
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

  if (isReseller) {
    const resellerUser = currentUser as StaffUser;
    const personalInvoices = state.invoices.filter(i => i.userId === resellerUser.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
              <p className="text-lg font-black text-purple-600 uppercase italic">{resellerUser.dealerCode || 'N/A'}</p>
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
                {state.settings.currency} {(resellerUser.balance || 0).toLocaleString()}
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
                      <p className="text-lg font-black text-slate-900">Rs. {(inv.totalAmount || 0).toLocaleString()}</p>
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
        <div className="space-y-1 hidden md:block">
          <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-black text-slate-900 tracking-tighter uppercase italic leading-none">Dashboard</h2>
          <p className="text-[clamp(0.5rem,2vw,0.6rem)] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 italic border-l-2 border-emerald-500 pl-3">Operational summary and system performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <div className="flex bg-white p-1 rounded-xl border border-border-main shadow-sm shrink-0 overflow-x-auto no-scrollbar">
            {[{ id: '3d', label: '3D' }, { id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: 'all', label: 'All' }].map(f => (
              <button 
                key={f.id} 
                onClick={() => setDateFilter(f.id as any)} 
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${dateFilter === f.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 md:flex-none btn btn-secondary btn-sm flex items-center justify-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            {isExporting ? <RefreshCcw size={14} className="animate-spin" /> : <Download size={14} />} 
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button onClick={() => setIsQuickRenewModal(true)} className="flex-1 md:flex-none btn btn-secondary btn-sm bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center justify-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest">
            <RefreshCcw size={14} /> Renew
          </button>
          <button onClick={() => onNavigate && onNavigate('users', { action: 'add-user' })} className="flex-1 md:flex-none btn btn-primary btn-sm flex items-center justify-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest shadow-lg">
            <UserPlus size={14} /> New
          </button>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {[
          { label: 'Total Users', value: (globalStats.totalUsers || 0).toLocaleString(), trend: '+2.5%', icon: Users, grad: 'var(--grad-primary)', sub: 'Cumulative Growth', path: 'users' },
          { label: '7D Recovery', value: `${state.settings.currency} ${(globalStats.periodRecovery || 0).toLocaleString()}`, trend: '+18%', icon: HandCoins, grad: 'var(--grad-success)', sub: 'Collection Stream', path: 'recovery' },
          { label: 'Unpaid Amount', value: `${state.settings.currency} ${(globalStats.totalUnpaidAmount || 0).toLocaleString()}`, trend: '-2%', icon: AlertCircle, grad: 'var(--grad-rose)', sub: 'Outstanding Debt', path: 'users' },
          { label: 'Activations', value: (globalStats.periodActivations || 0).toLocaleString(), trend: '+12%', icon: Zap, grad: 'var(--grad-violet)', sub: 'New Provisions', path: 'packages' },
          { label: 'Verified Users', value: (globalStats.periodVerifications || 0).toLocaleString(), trend: '+45%', icon: ShieldCheck, grad: 'var(--grad-info)', sub: 'KYC Completed', path: 'approval-desk' },
        ].map((kpi, idx) => (
          <div key={idx} onClick={() => kpi.path && onNavigate?.(kpi.path)} className="card relative transition-all overflow-hidden border-none shadow-xl hover:scale-[1.02] active:scale-95 group cursor-pointer min-h-[160px] flex flex-col justify-center" style={{ background: kpi.grad }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col gap-5 text-white p-6">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 drop-shadow-sm">{kpi.label}</span>
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
                   <kpi.icon size={20} strokeWidth={2.5} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black italic tracking-tighter leading-none drop-shadow-md text-white">{kpi.value}</h3>
                <div className="flex items-center gap-2 mt-4">
                   <span className="text-[9px] font-black uppercase bg-white/30 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-sm text-white">{kpi.trend}</span>
                   <span className="text-[9px] font-black text-white/80 uppercase tracking-widest drop-shadow-sm">{kpi.sub}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MAIN ANALYTICS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT: Core Income Chart */}
        <div className="card xl:col-span-2 flex flex-col gap-8 min-h-[440px]">
          <div className="flex justify-between items-center px-2">
            <div>
              <h3 className="section-title">Income Performance</h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Revenue vs Collections Stream</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/20"></div>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Invoiced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Collected</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} fontWeight={800} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-main)', boxShadow: 'var(--shadow-xl)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" name="Total Invoiced" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                <Area type="monotone" dataKey="recovery" name="Collected" stroke="#10B981" fillOpacity={1} fill="url(#colorRec)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: Distribution Pie Chart */}
        <div className="card flex flex-col gap-8 min-h-[440px]">
           <div className="px-2">
              <h3 className="section-title">Subscriber Status</h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Live Account Distribution</p>
           </div>
           
           <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                 <p className="text-3xl font-black text-slate-900 leading-none">{state.users.length}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                    <Pie
                       data={[
                          { name: 'Active', value: state.users.filter(u => u.status === UserStatus.ACTIVE).length, color: '#10B981' },
                          { name: 'Grace', value: state.users.filter(u => u.status === UserStatus.GRACE_PERIOD).length, color: '#F59E0B' },
                          { name: 'Expired', value: state.users.filter(u => u.status === UserStatus.EXPIRED).length, color: '#EF4444' },
                          { name: 'Others', value: state.users.filter(u => ![UserStatus.ACTIVE, UserStatus.GRACE_PERIOD, UserStatus.EXPIRED].includes(u.status)).length, color: '#6366F1' },
                       ]}
                       innerRadius="70%"
                       outerRadius="90%"
                       paddingAngle={8}
                       dataKey="value"
                    >
                       <Cell fill="#10B981" />
                       <Cell fill="#F59E0B" />
                       <Cell fill="#EF4444" />
                       <Cell fill="#6366F1" />
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-xl)' }}
                    />
                 </RePieChart>
              </ResponsiveContainer>
           </div>
           
           <div className="grid grid-cols-2 gap-4 px-2">
              {[
                { label: 'Active', color: 'bg-emerald-500', val: state.users.filter(u => u.status === UserStatus.ACTIVE).length },
                { label: 'Grace', color: 'bg-amber-500', val: state.users.filter(u => u.status === UserStatus.GRACE_PERIOD).length },
                { label: 'Expired', color: 'bg-rose-500', val: state.users.filter(u => u.status === UserStatus.EXPIRED).length },
                { label: 'Others', color: 'bg-indigo-500', val: state.users.filter(u => ![UserStatus.ACTIVE, UserStatus.GRACE_PERIOD, UserStatus.EXPIRED].includes(u.status)).length }
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${d.color}`}></div>
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter">{d.label}: {d.val}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* 4. EXPANDED QUICK ACTIONS & POPULARITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* LEFT: Quick Links Grid (12 Links) */}
         <div className="lg:col-span-8 card !bg-slate-900 border-none shadow-2xl p-10">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">System Launchpad</h3>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3">Mission Critical Operations Engine</p>
               </div>
               <div className="flex gap-2 items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Engine Sync Active</span>
               </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
               {[
                 { id: 'users', label: 'Subscribers', icon: Users, bg: 'bg-indigo-500', desc: 'Registry' },
                 { id: 'approval-desk', label: 'KYC Desk', icon: ShieldCheck, bg: 'bg-emerald-500', desc: 'Validations' },
                 { id: 'accounting', label: 'Ledger', icon: Landmark, bg: 'bg-amber-500', desc: 'Financials' },
                 { id: 'nas-management', label: 'NAS Control', icon: HardDrive, bg: 'bg-blue-500', desc: 'Mikrotik' },
                 { id: 'olt-management', label: 'OLT Systems', icon: Cpu, bg: 'bg-cyan-500', desc: 'Fiber Infra' },
                 { id: 'noc-dashboard', label: 'NOC Pulse', icon: Activity, bg: 'bg-rose-500', desc: 'Health' },
                 { id: 'packages', label: 'ISP Plans', icon: Package, bg: 'bg-violet-500', desc: 'Catalog' },
                 { id: 'staff', label: 'Access Control', icon: UserCircle, bg: 'bg-fuchsia-500', desc: 'RBAC' },
                 { id: 'tickets', label: 'Support', icon: Headphones, bg: 'bg-sky-500', desc: 'Helpdesk' },
                 { id: 'tasks', label: 'Field Tasks', icon: ClipboardList, bg: 'bg-lime-500', desc: 'Operations' },
                 { id: 'recovery', label: 'Recovery', icon: RefreshCcw, bg: 'bg-orange-500', desc: 'Overdue' },
                 { id: 'invoice-management', label: 'Invoices', icon: FileText, bg: 'bg-teal-500', desc: 'Billing' },
                 { id: 'dealers', label: 'Dealers', icon: Briefcase, bg: 'bg-pink-500', desc: 'Partners' },
                 { id: 'admin-reminders', label: 'Reminders', icon: Bell, bg: 'bg-yellow-500', desc: 'Alerts' },
                 { id: 'ai-control', label: 'AI Central', icon: Bot, bg: 'bg-slate-500', desc: 'Intelligence' },
                 { id: 'business-settings', label: 'Settings', icon: Settings, bg: 'bg-orange-600', desc: 'Global' },
               ].map((link, i) => (
                 <button 
                  key={i} 
                  onClick={() => onNavigate?.(link.id)}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all group"
                 >
                    <div className={`p-3 rounded-2xl ${link.bg} shadow-lg group-hover:scale-110 transition-transform`}>
                       <link.icon className="text-white" size={22} />
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] font-black text-slate-100 uppercase tracking-tight">{link.label}</p>
                       <p className="text-[8px] text-slate-500 font-black uppercase opacity-60 group-hover:opacity-100 mt-0.5">{link.desc}</p>
                    </div>
                 </button>
               ))}
            </div>
         </div>

         {/* RIGHT: Package Popularity Bar Chart */}
         <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6 p-5">
            <div>
               <h3 className="section-title">Plan Popularity</h3>
               <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">High-Yield ISP Packages</p>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical"
                    data={state.packages.slice(0, 6).map(p => ({
                      name: p.name.split(' ')[0], 
                      count: state.users.filter(u => u.packageId === p.id).length
                    })).sort((a,b) => b.count - a.count)}
                    margin={{ left: 10, right: 30 }}
                  >
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontWeight={900} stroke="#94a3b8" width={60} />
                     <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-xl)' }}
                     />
                     <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                        {state.packages.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#6366F1', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#0EA5E9'][index % 6]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Top Performer</p>
                  <p className="text-sm font-black text-slate-900 mt-1 uppercase italic">
                     {state.packages.map(p => ({ name: p.name, count: state.users.filter(u => u.packageId === p.id).length })).sort((a,b) => b.count - a.count)[0]?.name || 'N/A'}
                  </p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <TrendingUp size={24} />
               </div>
            </div>
         </div>
      </div>

      {/* 5. DATA SECTION: RECENT ACTIVITY */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="section-title">Live Activity Feed</h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Real-time Subscriber Pipeline</p>
            </div>
            <button onClick={() => onNavigate?.('users')} className="btn btn-secondary text-indigo-600 bg-white">Verify Registry</button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto w-full min-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="!bg-slate-50 !border-b-2 !border-slate-100">
                <th className="p-6 text-left">Subscriber Identity</th>
                <th className="text-center">Engine Status</th>
                <th className="text-center">Validation</th>
                <th className="text-left">Registered</th>
                <th className="text-right">Exposure</th>
                <th className="text-center pr-6">Core 360</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {state.users.filter(u => !u.deleted).slice(0, 10).map(user => (
                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">{user.connectionId || 'CID_INTERNAL'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      user.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 
                      user.status === UserStatus.EXPIRED ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {user.status === UserStatus.ACTIVE ? <Circle size={8} fill="currentColor" className="animate-pulse" /> :
                       user.status === UserStatus.EXPIRED ? <Ban size={10} /> :
                       <Clock size={10} />}
                      {user.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest">
                       {user.verificationStatus === VerificationStatus.VERIFIED ? 
                         <><ShieldCheck size={16} className="text-emerald-500" /> <span className="text-emerald-500 italic">Secured</span></> : 
                         <><ShieldAlert size={16} className="text-amber-500" /> <span className="text-amber-500 italic">Audit Req</span></>
                       }
                    </div>
                  </td>
                  <td className="text-[11px] font-bold text-slate-400 italic">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="text-right">
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {state.settings.currency} {(state.invoices.find(i => i.userId === user.email && i.status === PaymentStatus.UNPAID)?.dueAmount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="text-center pr-6">
                    <button 
                       onClick={() => onNavigate?.('customer-360', { userId: user.id })}
                       className="p-3 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95"
                       title="View 360 Profile"
                    >
                      <UserCircle size={20} />
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
        onClose={() => onClearSearch?.()}
        title="Global Intelligent Lookup"
        icon={<Search size={24} className="text-indigo-600" />}
        maxWidth="max-w-4xl"
        scrollable
      >
        <div className="space-y-8 p-1">
            <section className="space-y-6">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] border-b border-indigo-50 pb-3">Optimized Matches</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.users.filter(u => 
                  u.name.toLowerCase().includes(searchTerm?.toLowerCase() || '') || 
                  u.connectionId?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
                ).map(u => (
                  <div key={u.id} onClick={() => { onClearSearch?.(); onNavigate?.('customer-360', { userId: u.id }); }} className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center cursor-pointer hover:border-indigo-500 hover:bg-white transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><UserCircle size={24}/></div>
                        <div><p className="text-sm font-black text-slate-900">{u.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{u.connectionId || 'CID_INTERNAL'}</p></div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </section>
        </div>
      </Modal>

      <Modal
        isOpen={isReconcileModal}
        onClose={() => setIsReconcileModal(false)}
        title="Deep Engine Diagnostic"
        icon={<DatabaseZap size={24} className="text-amber-500" />}
        maxWidth="max-w-4xl"
        scrollable
      >
        <div className="space-y-8 py-2">
           <div className="flex flex-col md:flex-row justify-between items-center p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 gap-6">
              <div><h4 className="text-lg font-black text-white italic uppercase tracking-tight">Diagnostic Sector</h4><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Select data block for deep analysis</p></div>
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                 {['user', 'billing', 'entire'].map(t => (
                   <button key={t} onClick={() => setReconcileType(t as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reconcileType === t ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}>{t}</button>
                 ))}
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button disabled={isScanning} onClick={() => {setIsScanning(true); db.reconcileData(reconcileType).then(() => setIsScanning(false));}} className="flex flex-col items-center justify-center gap-4 p-10 rounded-[3rem] bg-slate-50 border border-slate-100 hover:border-indigo-500 hover:bg-white transition-all group">
                 <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {isScanning ? <RefreshCcw className="animate-spin" size={32} /> : <SearchCode size={32} />}
                 </div>
                 <div className="text-center">
                    <p className="text-sm font-black text-slate-900 uppercase italic">Heuristic Scan</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">Cross-check all registry nodes</p>
                 </div>
              </button>
              <button disabled={isFixingAll || (state.missingData || []).length === 0} onClick={() => {setIsFixingAll(true); Promise.all((state.missingData || []).map(n => db.fixMissingData(n.id))).then(() => setIsFixingAll(false));}} className="flex flex-col items-center justify-center gap-4 p-10 rounded-[3rem] bg-emerald-50 border border-emerald-100 hover:border-emerald-500 hover:bg-white transition-all group">
                 <div className="w-16 h-16 rounded-[2rem] bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ShieldCheck size={32} />
                 </div>
                 <div className="text-center">
                    <p className="text-sm font-black text-emerald-900 uppercase italic">Auto-Heal Protocol</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase mt-1">Synchronize {(state.missingData || []).length} Missing Nodes</p>
                 </div>
              </button>
           </div>
        </div>
      </Modal>
 
       <Modal
         isOpen={isQuickRenewModal}
         onClose={() => setIsQuickRenewModal(false)}
         title="Quick Service Renewal"
         icon={<RefreshCcw size={24} className="text-indigo-600" />}
         message="Search for a subscriber to perform an instant renewal"
         maxWidth="max-w-xl"
       >
          <div className="space-y-6 mb-4">
             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search Name, ID, or Phone..." 
                  className="w-full pl-14 pr-6 py-3 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] font-black text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner"
                  value={quickSearch}
                  onChange={e => setQuickSearch(e.target.value)}
                  autoFocus
                />
             </div>
 
             <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {state.users.filter(u => 
                  quickSearch.length > 1 && (
                    u.name.toLowerCase().includes(quickSearch.toLowerCase()) || 
                    (u.connectionId || '').toLowerCase().includes(quickSearch.toLowerCase()) ||
                    (u.phone || '').includes(quickSearch)
                  )
                ).map(u => (
                  <button 
                    key={u.id}
                    onClick={() => {
                       setIsQuickRenewModal(false);
                       onNavigate?.('users', { userId: u.id, action: 'renew' });
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-600 hover:shadow-lg transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           {u.name.charAt(0)}
                        </div>
                        <div className="text-left">
                           <p className="text-sm font-black text-slate-900">{u.name}</p>
                           <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">{u.connectionId || 'CID_INTERNAL'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${u.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                           {u.status}
                        </span>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600" />
                     </div>
                  </button>
                ))}
                {quickSearch.length > 1 && state.users.filter(u => u.name.toLowerCase().includes(quickSearch.toLowerCase())).length === 0 && (
                   <p className="text-center py-8 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No Subscriber Nodes Found</p>
                )}
                {quickSearch.length <= 1 && (
                   <p className="text-center py-8 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Begin typing to lookup registry...</p>
                )}
             </div>
          </div>
       </Modal>
 
     </div>
  );
};

export default Dashboard;
