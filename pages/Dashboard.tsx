
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, UserStatus, PaymentStatus, Role, LedgerType, StaffUser } from '../types';
import {
  Users, DollarSign, AlertCircle, TrendingUp,
  ArrowUpRight, Clock, RefreshCcw, Download, PieChart, ShieldCheck,
  Database, Filter, Calendar, Zap, UserCircle, Globe, Building2,
  Wallet, ArrowDownLeft, Receipt, History, Activity, Briefcase,
  // Fix: Added missing Bot import
  ArrowRight, Search, ChevronRight, Calculator, Archive, Sparkles, Smile, Bot,
  UserPlus, Banknote, Send, HandCoins
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart as RePieChart, Pie,
  LineChart, Line
} from 'recharts';
import { db } from '../db';
import ModuleGuide from '../components/shared/ModuleGuide';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

type DateFilterType = '3d' | '7d' | '30d' | 'all' | 'custom';

const Dashboard: React.FC<{ 
  state: AppState; 
  onNavigate?: (page: string, params?: { userId?: string, action?: string }) => void;
  searchTerm?: string;
}> = ({ state, onNavigate, searchTerm }) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [collectorFilter, setCollectorFilter] = useState<string>('All');
  const [entityFilter, setEntityFilter] = useState<'all' | 'users' | 'dealers'>('all');

  const currentUser = state.currentUser;
  const isDealer = currentUser?.role === Role.DEALER;

  const branding = state.settings.branding;
  const logo = branding.logoLight || branding.logoSquare;

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
                <Wallet size={16} className="text-emerald-400" />
                Available Balance
              </p>
              <h3 className="text-5xl font-black text-emerald-400 tracking-tighter">
                {state.settings.currency} {(dealerUser.balance || 0).toLocaleString()}
              </h3>
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Distributed</p>
                  <p className="text-sm font-bold text-slate-300">{state.settings.currency} {personalInvoices.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-emerald-400" size={24} />
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{inv.packageName}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(inv.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">Rs. {inv.totalAmount.toLocaleString()}</p>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${inv.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span>
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <ModuleGuide
        moduleName="Operations Dashboard"
        description="High-level metrics and fast access to critical functions"
        items={[
          { title: "Fast Operations", description: "Use the quick action buttons to instantly add subscribers, generate invoices, or collect funds from anywhere." },
          { title: "Metric Cards", description: "Real-time snapshot of active vs suspended users, outstanding dues, and overall system health." },
          { title: "Revenue Flow", description: "Interactive chart showing Collections vs Receivables. Filter by date or specific franchise nodes." }
        ]}
      />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex items-center gap-5">
          {logo ? (
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100 overflow-hidden shrink-0">
              <img src={logo} className="w-full h-full object-contain" alt="Brand" />
            </div>
          ) : (
            <Archive className="text-indigo-600 shrink-0" size={36} />
          )}
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4 uppercase italic leading-none">
              Operations Dashboard
            </h2>
            <p className="text-slate-500 font-medium">Real-time performance metrics for Entire Organization.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto shrink-0">
            {[{ id: 'all', label: 'Overview' }, { id: 'users', label: 'Subscribers' }, { id: 'dealers', label: 'Dealers' }].map(f => (
              <button key={f.id} onClick={() => setEntityFilter(f.id as any)} className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${entityFilter === f.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{f.label}</button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-2 w-full lg:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto shrink-0">
              {[{ id: '3d', label: '3 Days' }, { id: '7d', label: '1 Week' }, { id: '30d', label: '1 Month' }, { id: 'all', label: 'All Time' }].map(f => (
                <button key={f.id} onClick={() => setDateFilter(f.id as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${dateFilter === f.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{f.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8 bg-indigo-900/5 p-3 rounded-3xl border border-indigo-500/10 backdrop-blur-sm shadow-inner">
        <div className="flex items-center gap-2 px-3 border-r border-indigo-500/10 mr-1">
          <Zap size={16} className="text-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800">Fast Operations</span>
        </div>
        <button onClick={() => onNavigate && onNavigate('users', { action: 'add-user' })} className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-slate-100 hover:border-indigo-200">
          <UserPlus size={16} /> Add Subscriber
        </button>
        <button onClick={() => onNavigate && onNavigate('users', { action: 'receive-funds' })} className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-slate-100 hover:border-emerald-200">
          <Banknote size={16} /> Receive Funds
        </button>
        <button onClick={() => onNavigate && onNavigate('invoice-engine')} className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-slate-100 hover:border-blue-200">
          <Receipt size={16} /> New Invoice
        </button>
        <button onClick={() => onNavigate && onNavigate('comm-campaigns')} className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border border-slate-100 hover:border-purple-200">
          <Send size={16} /> Campaign
        </button>
      </div>

      {/* Advanced Data Metrics Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-slate-100 pb-8 mb-8">
        {[
          { label: 'Total Base', value: globalStats.totalUsers.toLocaleString(), icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Active Lines', value: globalStats.activeSubs.toLocaleString(), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Radius Online', value: globalStats.onlineUsers.toLocaleString(), icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'New Subs', value: globalStats.newUsers.toLocaleString(), icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Suspended', value: globalStats.expiredUsers.toLocaleString(), icon: Archive, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Disabled', value: globalStats.disabledUsers.toLocaleString(), icon: ShieldCheck, color: 'text-slate-400', bg: 'bg-slate-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative flex flex-col items-center text-center">
            <div className={`p-4 rounded-[1.8rem] mb-3 transition-transform group-hover:scale-110 ${kpi.bg}`}><kpi.icon className={kpi.color} size={24} /></div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight relative z-10 leading-none mb-1">{kpi.value}</h3>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] relative z-10 leading-tight">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Expiry & Payment Insight Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-8 rounded-[3rem] text-white shadow-xl shadow-rose-200 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4">Critical Expiry (24h)</p>
            <h4 className="text-5xl font-black italic tracking-tighter mb-2">{globalStats.expiring1d}</h4>
            <p className="text-[11px] font-bold">Subscribers losing access tomorrow</p>
          </div>
          <AlertCircle size={120} className="absolute -right-6 -bottom-6 opacity-20 group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Calendar size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Upcoming Expiry</p>
              <p className="text-xs font-bold text-slate-700">Next 3-7 Days</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{globalStats.expiring3d}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">In 3 Days</p>
            </div>
            <div className="w-px h-8 bg-slate-100 self-center"></div>
            <div className="flex-1">
              <p className="text-2xl font-black text-slate-800 tracking-tighter">{globalStats.expiring1w}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">In 1 Week</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:rotate-12 transition-transform"><DollarSign size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Fiscal Health</p>
              <p className="text-xs font-bold text-slate-700">Payment Status</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-2xl font-black text-emerald-600 tracking-tighter">{globalStats.paidUsers}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Paid Subs</p>
            </div>
            <div className="w-px h-8 bg-slate-100 self-center"></div>
            <div className="flex-1">
              <p className="text-2xl font-black text-rose-500 tracking-tighter">{globalStats.unpaidUsers}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unpaid Subs</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Total Outstanding</p>
            <h4 className="text-4xl font-black italic tracking-tighter mb-2">{state.settings.currency} {globalStats.totalUnpaidAmount.toLocaleString()}</h4>
            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400">
              <ArrowUpRight size={14} /> 12% vs last month
            </div>
          </div>
          <TrendingUp size={100} className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700 text-indigo-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-[400px] md:h-[450px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/5 transition-colors duration-700"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase italic leading-none"><TrendingUp size={24} className="text-indigo-600" /> Revenue Flow</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{dateFilter === 'all' ? 'Historical' : 'Recent'} Income vs Recovery Analysis</p>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-500">Billed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-500">Recovered</span>
              </div>
            </div>
          </div>
          <div className="flex-1 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} tickFormatter={(val) => `Rs.${val / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="recovery" stroke="#10b981" fillOpacity={1} fill="url(#colorRec)" strokeWidth={4} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-950 p-8 rounded-[3rem] text-white flex flex-col shadow-[0_20px_40px_-15px_rgba(30,41,59,0.5)] relative overflow-hidden h-[215px] group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase italic tracking-tighter"><ShieldCheck size={24} className="text-emerald-400" /> Collection Health</h3>
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Activity size={18} className="text-emerald-400" /></div>
              </div>
              <div>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-tighter leading-none">
                    {globalStats.periodRevenue > 0 ? Math.round((globalStats.periodRecovery / globalStats.periodRevenue) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1.5 leading-none">Yield</span>
                </div>
                <div className="w-full bg-slate-800/50 h-3 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${globalStats.periodRevenue > 0 ? (globalStats.periodRecovery / globalStats.periodRevenue) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
            <ShieldCheck className="absolute -right-12 -bottom-12 opacity-5 scale-[3]" size={100} />
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex-1 h-[215px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-2">
                <Bot size={18} className="text-indigo-600" /> AI Support Hub
              </h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-[8px] font-black uppercase tracking-widest">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all">
                <span className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Queries</span>
                <span className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{aiStats.totalCalls}</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center group hover:bg-white hover:shadow-md hover:border-emerald-100 transition-all">
                <span className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Resolved</span>
                <span className="text-3xl font-black text-emerald-600 tracking-tighter leading-none">{Math.round(aiStats.totalCalls * 0.85)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH RESULTS OVERLAY */}
      {searchTerm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 flex items-start justify-center pt-32 px-6">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col max-h-[70vh]">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Global Registry Pulse</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Search Query: "{searchTerm}"</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Search size={24} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
              {/* Subscribers Section */}
              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                  Matched Subscribers
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {state.users.filter(u => 
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    u.connectionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.phone?.includes(searchTerm)
                  ).length > 0 ? (
                    state.users.filter(u => 
                      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      u.connectionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.phone?.includes(searchTerm)
                    ).map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => onNavigate?.('profile', { userId: u.id })}
                        className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <UserCircle size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{u.name}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{u.connectionId || 'NEW_NODE'}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-6 text-center opacity-30 italic text-[10px] uppercase font-black tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">No subscriber nodes matched.</div>
                  )}
                </div>
              </section>

              {/* Transactions Section */}
              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] flex items-center gap-2 italic">
                  Financial Records
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {state.invoices.filter(i => 
                    i.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    i.userName.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length > 0 ? (
                    state.invoices.filter(i => 
                      i.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      i.userName.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(inv => (
                      <div key={inv.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-emerald-300 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Banknote size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{inv.userName}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{inv.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-900">Rs. {inv.totalAmount}</p>
                          <p className={`text-[7px] font-black uppercase ${inv.status === PaymentStatus.PAID ? 'text-emerald-500' : 'text-rose-500'}`}>{inv.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-6 text-center opacity-30 italic text-[10px] uppercase font-black tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">No fiscal nodes matched.</div>
                  )}
                </div>
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Global Repository Lookup • {state.users.length + state.invoices.length} Total Handshakes Analyzed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
