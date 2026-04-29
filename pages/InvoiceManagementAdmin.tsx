import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo, useEffect } from 'react';
import { AppState, PaymentStatus, Role, Invoice, ISPUser, ConnectionStatus } from '../types';
import { db } from '../db';
// Added missing X import from lucide-react
import {
  FileText, Search, Filter, Download, Mail,
  Trash2, CheckCircle, Clock, AlertTriangle,
  ChevronRight, ArrowRight, Printer, FileSpreadsheet,
  Calendar, DollarSign, Activity, ShieldCheck,
  ExternalLink, MoreVertical, Ban, RefreshCw, Layers,
  Settings, Hash, Box, Package, Calculator, ShieldAlert,
  Archive, TrendingUp, Sparkles, UserCircle, Plus, Users,
  Square, CheckSquare, Send, X, Building2, PieChart
} from 'lucide-react';
import SubscriberInvoiceViewer from '../components/subscriber/SubscriberInvoiceViewer';
import ModuleGuide from '../components/shared/ModuleGuide';

interface Props {
  state: AppState;
  onNavigate: (page: string, params?: any) => void;
}

const InvoiceManagementAdmin: React.FC<Props> = ({ state, onNavigate }) => {
  const [activeView, setActiveView] = useState<'invoices' | 'clients'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [connectionFilter, setConnectionFilter] = useState<string>('All');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Relational data mapping
  const userMap = useMemo(() => {
    const map = new Map<string, ISPUser>();
    state.users.forEach(u => map.set(u.id, u));
    return map;
  }, [state.users]);

  const invoices = useMemo(() => {
    return (state.invoices || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.invoices]);

  const stats = useMemo(() => {
    const totalBilled = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = invoices.filter(i => i.status === PaymentStatus.PAID).reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPending = invoices.filter(i => i.status !== PaymentStatus.PAID).reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalOverdue = invoices.filter(i => i.status === PaymentStatus.OVERDUE).reduce((acc, inv) => acc + inv.totalAmount, 0);

    return { totalBilled, totalPaid, totalPending, totalOverdue, count: invoices.length };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const user = userMap.get(inv.userId);
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch =
        inv.id.toLowerCase().includes(term) ||
        inv.userName.toLowerCase().includes(term) ||
        inv.userId.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      const matchesConnection = connectionFilter === 'All' || (user && user.status === connectionFilter);

      return matchesSearch && matchesStatus && matchesConnection;
    });
  }, [invoices, searchTerm, statusFilter, connectionFilter, userMap]);

  const filteredClients = useMemo(() => {
    return state.users.filter(u => {
      if (u.deleted) return false;
      const term = searchTerm.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(term) ||
        u.connectionId.toLowerCase().includes(term) ||
        u.phone.includes(term)
      );
    });
  }, [state.users, searchTerm]);

  // Bulk Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvoices.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkMarkPaid = async () => {
    if (!confirm(`CONFIRM PAYMENTS: Mark ${selectedIds.size} invoices as PAID?`)) return;
    setIsProcessing('bulk');
    for (const id of selectedIds) {
      await db.payInvoiceWithWallet(id);
    }
    setIsProcessing(null);
    setSelectedIds(new Set());
    db.logNotification('all', 'success', 'Bulk Payment', 'Bulk payment clearing complete.');
  };

  const handleBulkReminder = async () => {
    setIsProcessing('bulk');
    // In a real scenario, this would trigger an email/SMS loop
    await new Promise(r => setTimeout(r, 1000));
    setIsProcessing(null);
    setSelectedIds(new Set());
    // Fixed: Added 'all' as the first argument (targetId) to db.logNotification
    db.logNotification('all', 'info', 'Bulk Reminder', '- Payment Dueed payment alerts to selected Subscribers.');
  };

  const getStatusStyle = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case PaymentStatus.OVERDUE: return 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse';
      case PaymentStatus.PARTIAL: return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-amber-50 text-amber-600 border-amber-200';
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return <DollarSign size={12} />;
      case PaymentStatus.OVERDUE: return <AlertTriangle size={12} />;
      case PaymentStatus.PARTIAL: return <PieChart size={12} />;
      default: return <Clock size={12} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <ModuleGuide
        moduleName="Billing & Payments"
        description="Manage user bills, payments, and financial records"
        items={[
          { title: "Billing Record", description: "Track all bills and payments. Pay multiple invoices at once with bulk actions." },
          { title: "User List", description: "Quickly create new bills for any user by finding them in the list." },
          { title: "Unpaid Dues", description: "See who hasn't paid yet and send them a quick reminder." }
        ]}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <Archive className="text-blue-600" size={32} />
            Billing & Payments
          </h2>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest">System Billing Management</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveView('invoices')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'invoices' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <FileText size={16} /> Billing Record
          </button>
          <button
            onClick={() => setActiveView('clients')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'clients' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Users size={16} /> User List
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Billed', value: stats.totalBilled, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Paid', value: stats.totalPaid, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Unpaid', value: stats.totalPending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Unpaid Dues', value: stats.totalOverdue, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className={`${kpi.bg} p-3 rounded-xl`}>
                <kpi.icon className={kpi.color} size={20} />
              </div>
            </div>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest relative z-10">{kpi.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 italic relative z-10">
              {state.settings.currency} {(kpi.value || 0).toLocaleString()}
            </h3>
            <TrendingUp className="absolute -right-4 -bottom-4 opacity-[0.03] scale-150 text-slate-900" size={100} />
          </div>
        ))}
      </div>

      {/* Brand Header Section for Invoices View */}
      {activeView === 'invoices' && (
        <div className="bg-slate-900 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden border border-slate-800">
          <div className="relative z-10 flex items-center gap-8">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-3 shadow-2xl border border-white/10 overflow-hidden shrink-0">
              {state.settings.branding.logoLight ? (
                <img src={state.settings.branding.logoLight} className="h-full object-contain" alt="Brand Logo" />
              ) : state.settings.branding.logoSquare ? (
                <img src={state.settings.branding.logoSquare} className="h-full object-contain" alt="Brand Logo" />
              ) : (
                <Building2 size={40} className="text-blue-600" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{state.settings.branding.businessName}</h1>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic opacity-80">Billing & Payments</p>
              <div className="flex items-center gap-3 pt-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Billing System Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Tax ID: {state.settings.taxId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 hidden lg:flex items-center gap-8 text-right">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Billing Status</p>
              <p className="text-sm font-black text-white uppercase italic">Synchronized</p>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Bills</p>
              <p className="text-xl font-black text-blue-400 italic leading-none">{invoices.length}</p>
            </div>
          </div>
          <Activity className="absolute -right-16 -bottom-16 opacity-5 scale-150 pointer-events-none" size={300} />
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && activeView === 'invoices' && (
        <div className="bg-slate-900 text-white p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 shadow-xl sticky top-20 z-[110]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-lg font-black italic tracking-tighter leading-none">{selectedIds.size} Invoices Selected</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Mass Protocol Active</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkReminder}
              disabled={isProcessing === 'bulk'}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Send size={16} /> Remind
            </button>
            <button
              onClick={handleBulkMarkPaid}
              disabled={isProcessing === 'bulk'}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-green-500/20"
            >
              <CheckCircle size={16} /> Settle
            </button>
            <button
              // Fixed: Added state.currentUser?.email as targetId to db.logNotification call
              onClick={() => { setSelectedIds(new Set()); db.logNotification(state.currentUser?.email || 'admin', 'info', 'Clear History', 'Selection cleared.'); }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <X size={16} /> Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
            placeholder={activeView === 'invoices' ? "Search Invoices by ID or User..." : "Search Users by Name, ID or Phone..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {activeView === 'invoices' && (
          <div className="flex gap-2 w-full lg:w-auto">
            <select
              className="px-6 py-4 bg-slate-100 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Payments</option>
              {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="px-6 py-4 bg-slate-100 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={connectionFilter}
              onChange={e => setConnectionFilter(e.target.value)}
            >
              <option value="All">All Connections</option>
              {Object.values(ConnectionStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full">
        <div className="overflow-x-auto w-full min-w-full custom-scrollbar">
          {activeView === 'invoices' ? (
            <table className="w-full text-left min-w-[1100px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 w-10">
                    <button onClick={toggleSelectAll} className="p-1 text-slate-300 hover:text-blue-600 transition-colors">
                      {selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Name</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-32 text-center flex flex-col items-center">
                      <ShieldCheck className="text-slate-100 mb-6" size={80} />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Registry Synchronized. No invoices found matching query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const user = userMap.get(inv.userId);
                    return (
                      <tr key={inv.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(inv.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-8 py-6">
                          <button onClick={() => toggleSelect(inv.id)} className="p-1 text-slate-200 hover:text-blue-600">
                            {selectedIds.has(inv.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border shadow-inner">
                              <FileText size={16} />
                            </div>
                            <span className="font-black text-slate-900 uppercase tracking-tight text-xs cursor-pointer" onClick={() => setViewingInvoice(inv)}>{inv.id}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none mb-1 group-hover:text-blue-600 transition-colors">{inv.userName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{inv.userId}</span>
                              {user && <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${user.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>{user.status}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-sm font-black text-slate-900 italic tracking-tighter">
                            {state.settings.currency} {(inv.totalAmount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(inv.status)}`}>
                            {getStatusIcon(inv.status)}
                            {inv.status}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl shadow-sm transition-all"
                              title="View Invoice"
                              onClick={() => setViewingInvoice(inv)}
                            >
                              <ExternalLink size={16} />
                            </button>
                            {inv.status !== PaymentStatus.PAID && (
                              <button
                                className="p-2.5 bg-green-50 border border-green-200 text-green-600 hover:bg-green-600 hover:text-white rounded-xl shadow-sm transition-all"
                                title="Mark as Paid"
                                onClick={async () => { if (confirm('Mark this invoice as Paid?')) { setIsProcessing(inv.id); await db.payInvoiceWithWallet(inv.id); setIsProcessing(null); } }}
                              >
                                {isProcessing === inv.id ? <Mini5GMicroLoader size={16} /> : <CheckCircle size={16} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Name</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Plan</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount Due</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center flex flex-col items-center">
                      <Users size={80} className="text-slate-100 mb-6" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No clients found in registry.</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-inner border border-slate-100">
                            <UserCircle size={28} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none mb-1">{u.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl inline-flex items-center gap-2">
                          <Hash size={12} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">{u.connectionId}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-800 uppercase italic">
                            {state.packages.find(p => p.id === u.packageId)?.name || 'NO PLAN'}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 font-bold uppercase tracking-widest">
                            {u.connectionType} Path
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`text-sm font-black italic tracking-tighter ${u.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {state.settings.currency} {(u.balance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => {
                            onNavigate('invoice-engine', { userId: u.id });
                          }}
                          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 ml-auto"
                        >
                          <Plus size={16} /> Create Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {viewingInvoice && (
        <SubscriberInvoiceViewer
          invoice={viewingInvoice}
          state={state}
          onClose={() => setViewingInvoice(null)}
          onPaid={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
};

export default InvoiceManagementAdmin;

