
import React, { useState, useMemo } from 'react';
import { AppState, Role, PaymentMethod, PaymentStatus, PaymentRecord, StaffUser, UserStatus } from '../types';
import { db } from '../db';
import {
  CheckCircle, Clock, Plus, Wallet, ShieldCheck, X, Filter, Search, Info, AlertTriangle,
  Users, UserCheck, ShieldAlert, BadgeDollarSign, ArrowRightLeft, Landmark, HandCoins, Building2, History, ChevronRight, UserCircle, ExternalLink, Activity, CreditCard, Zap, TrendingUp, XCircle, Shield
} from 'lucide-react';
import Modal from '../components/shared/Modal';

const RecoveryDashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'collections' | 'approvals' | 'approvals_history' | 'team' | 'dealers'>('approvals');
  const [paymentModal, setPaymentModal] = useState<{userId: string, invId: string} | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  const currentUserRole = state.currentUser?.role || Role.VIEWER;
  const canApprove = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN, Role.MANAGER].includes(currentUserRole as Role);
  const canSettle = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_ADMIN].includes(currentUserRole as Role);

  const pendingPayments = state.payments.filter(p => p.status === 'Pending');

  const filteredUnpaidInvoices = useMemo(() => {
    return state.invoices.filter(i => {
      const isUnpaid = i.status !== PaymentStatus.PAID;
      const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
      const matchesSearch = i.userName.toLowerCase().includes(searchTerm.toLowerCase());
      return isUnpaid && matchesStatus && matchesSearch;
    });
  }, [state.invoices, statusFilter, searchTerm]);

  const settlementStats = useMemo(() => {
    const data: Record<string, { pending: number, total: number, count: number }> = {};
    state.payments.filter(p => p.status === 'Approved').forEach(p => {
      if (!data[p.collectorEmail]) data[p.collectorEmail] = { pending: 0, total: 0, count: 0 };
      data[p.collectorEmail].total += p.amount;
      data[p.collectorEmail].count++;
      if (!p.isCleared) data[p.collectorEmail].pending += p.amount;
    });
    return data;
  }, [state.payments]);

  const teamRecovery = useMemo(() => {
    return state.staff.filter(s => s.role !== Role.DEALER).map(member => ({
      ...member,
      stats: settlementStats[member.email] || { pending: 0, total: 0, count: 0 }
    }));
  }, [state.staff, settlementStats]);

  const handleManualPayment = async () => {
    if (!paymentModal || amount <= 0) return;
    await db.addManualPayment(paymentModal.userId, amount, method, { invoiceId: paymentModal.invId });
    setPaymentModal(null);
    setAmount(0);
  };

  const handleSettleStaff = async (email: string) => {
    if (!canSettle) return;
    if (confirm(`Confirm fiscal settlement for ${email}? All collected cash will be cleared from team balance.`)) {
      await db.clearStaffCollections(email);
      setSelectedStaff(null);
    }
  };

  const renderCollections = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock className="text-blue-500" size={14} />
          Incoming Validation Queue
        </h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          {pendingPayments.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <ShieldCheck size={56} className="text-slate-100 mb-6" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Registry is Synchronized</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingPayments.map(p => (
                <div key={p.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100 shadow-inner group-hover:scale-105 transition-transform">
                      <HandCoins size={28} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900 tracking-tighter">Rs. {(p.amount || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{p.userName} • {p.method}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Activity size={10} className="text-blue-500" />
                        <p className="text-[9px] text-slate-400 uppercase tracking-[0.1em] font-black italic">Recovery Source: {p.collectorName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canApprove ? (
                      <button
                        onClick={() => db.approvePayment(p.id)}
                        className="p-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-90"
                      >
                        <CheckCircle size={24} />
                      </button>
                    ) : (
                      <div className="p-4 text-slate-300">
                        <Clock size={24} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Wallet className="text-green-500" size={14} />
            Outstanding Receivables
          </h3>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">{filteredUnpaidInvoices.length} Dues</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Lookup subscriber..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase tracking-widest placeholder:lowercase placeholder:font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Tiers</option>
              {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="divide-y divide-slate-50 overflow-y-auto max-h-[500px] custom-scrollbar">
            {filteredUnpaidInvoices.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center">
                <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No pending invoices</p>
              </div>
            ) : (
              filteredUnpaidInvoices.map(inv => (
                <div key={inv.id} className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all shrink-0">
                      <UserCircle size={28} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none mb-1">{inv.userName}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{inv.packageName}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <p className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${inv.status === PaymentStatus.OVERDUE ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {inv.status === PaymentStatus.OVERDUE ? <AlertTriangle size={11} /> : <Clock size={11} />}
                          Rs. {(inv.totalAmount - inv.paidAmount).toLocaleString()} · {inv.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPaymentModal({ userId: inv.userId, invId: inv.id }); setAmount(inv.totalAmount - inv.paidAmount); }}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white text-[11px] font-black rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-95 uppercase tracking-widest whitespace-nowrap"
                    >
                      <HandCoins size={16} />
                      Collect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderApprovals = () => {
    const pendingRequests = (state.approvalRequests || []).filter(r => r.status === 'Pending');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="text-blue-500" size={14} />
            Maker-Checker Validation Desk
          </h3>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black">{pendingRequests.length} Pending Actions</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] p-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
              <CheckCircle size={40} />
            </div>
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Queue Synchronized</h4>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2">All staff actions have been verified and processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col overflow-hidden">
                <div className="p-8 flex justify-between items-start">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                      req.type === 'Plan_Activation' ? 'bg-blue-50 text-blue-600' :
                      req.type === 'Payment_Collection' ? 'bg-green-50 text-green-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {req.type === 'Plan_Activation' ? <Zap size={28} /> : 
                       req.type === 'Payment_Collection' ? <HandCoins size={28} /> : 
                       <ShieldAlert size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-lg">ID: {req.id.slice(0,8)}</span>
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg ${
                          req.type === 'Plan_Activation' ? 'bg-blue-600 text-white' :
                          req.type === 'Payment_Collection' ? 'bg-green-600 text-white' :
                          'bg-rose-600 text-white'
                        }`}>{req.type.replace('_', ' ')}</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{req.userName}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock size={12} className="text-slate-300" />
                        Requested {new Date(req.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Action Impact</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">Rs. {(req.amount || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="px-8 pb-8 flex-1">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-black uppercase tracking-widest">Originator</span>
                      <span className="text-slate-900 font-bold uppercase">{req.requestedBy}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-black uppercase tracking-widest">Scope Logic</span>
                      <span className="text-slate-900 font-bold uppercase">{req.payload.method || 'Internal Adjustment'}</span>
                    </div>
                    {req.payload.pkgId && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-black uppercase tracking-widest">Target Package</span>
                        <span className="text-blue-600 font-black uppercase">{state.packages.find(p => p.id === req.payload.pkgId)?.name || 'Unknown'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <button 
                    onClick={() => db.rejectRequest(req.id)}
                    className="flex-1 py-4 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button 
                    onClick={() => db.approveRequest(req.id)}
                    className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ShieldCheck size={16} />
                    Verify & Commit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Today\'s Cash', value: db.getFiscalSummary(new Date(new Date().setHours(0, 0, 0, 0)), new Date()).todayCollection, icon: HandCoins, color: 'bg-green-600' },
          { label: 'Period Pool', value: db.getFiscalSummary(new Date(Date.now() - 30 * 86400000), new Date()).periodCollection, icon: Wallet, color: 'bg-blue-600' },
          { label: 'Total O/S', value: db.getFiscalSummary(new Date(0), new Date()).totalUnpaidBalance, icon: ShieldAlert, color: 'bg-rose-600' },
          { label: 'Active Plans', value: state.users.filter(u => u.status === UserStatus.ACTIVE).length, icon: Zap, color: 'bg-blue-600' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{typeof s.value === 'number' ? `Rs. ${(s.value || 0).toLocaleString()}` : s.value}</p>
            </div>
            <div className={`w-10 h-10 ${s.color} text-white rounded-xl flex items-center justify-center shadow-lg`}><s.icon size={18} /></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic leading-none">
            <Activity className="text-blue-600" size={32} />
            Fiscal Control
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manage multi-tier recovery, team settlements, and approval logic.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto">
          {[
            { id: 'approvals', label: 'Admin Approvals', icon: ShieldCheck },
            { id: 'approvals_history', label: 'Approved Desk', icon: History },
            { id: 'collections', label: 'Recoveries', icon: HandCoins },
            { id: 'team', label: 'Team Audit', icon: Users },
            { id: 'dealers', label: 'Dealer Portal', icon: Building2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'approvals' && renderApprovals()}
      {activeTab === 'approvals_history' && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <History size={14} className="text-blue-600" />
                 Validated Operation Ledger
              </h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                 <input 
                  className="pl-9 pr-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase outline-none" 
                  placeholder="Search ledger..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                 />
              </div>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto w-full min-w-full">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b">
                    <tr>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Subscriber Identity</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Type</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Value Impact</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Resolution Protocol</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {(state.approvalRequests || [])
                      .filter(r => r.status !== 'Pending' && r.userName.toLowerCase().includes(searchTerm.toLowerCase()))
                      .sort((a,b) => b.timestamp.localeCompare(a.timestamp))
                      .map(req => (
                        <tr key={req.id} className="group hover:bg-slate-50 transition-colors">
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs shrink-0 group-hover:scale-110 transition-transform italic border border-white shadow-sm">{req.userName.charAt(0)}</div>
                                 <div>
                                    <p className="font-black text-slate-900 uppercase text-[11px] mb-1 leading-none">{req.userName}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(req.timestamp).toLocaleString()}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                 req.type === 'Plan_Activation' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                 req.type === 'Payment_Collection' ? 'bg-green-50 text-green-600 border border-green-100' :
                                 'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}>{req.type.replace('_', ' ')}</span>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <p className="text-xs font-black text-slate-900 tracking-tighter italic">Rs. {(req.amount || 0).toLocaleString()}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase">{req.requestedBy}</p>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                 req.status === 'Approved' ? 'bg-green-600 text-white shadow-lg' : 'bg-rose-600 text-white shadow-lg'
                              }`}>
                                 {req.status === 'Approved' ? <ShieldCheck size={12}/> : <XCircle size={12}/>}
                                 {req.status === 'Approved' ? 'VERIFIED' : 'REJECTED'}
                              </div>
                           </td>
                        </tr>
                    ))}
                    {(state.approvalRequests || []).filter(r => r.status !== 'Pending').length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-32 text-center">
                           <History size={48} className="text-slate-100 mx-auto mb-6" />
                           <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Registry History Void</p>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}
      {activeTab === 'collections' && renderCollections()}

      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamRecovery.map(member => (
            <div key={member.email} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 group hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <UserCircle size={32} />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Team Balance</p>
                  <p className={`text-3xl font-black ${member.stats.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Rs. {(member.stats.pending || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="relative z-10">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{member.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-8">{member.role}</p>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime</p>
                    <p className="text-xs font-black text-slate-700">Rs. {(member.stats.total || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipts</p>
                    <p className="text-xs font-black text-slate-700">{member.stats.count} Bills</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStaff(member)}
                  className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-blue-200"
                >
                  <ArrowRightLeft size={16} />
                  Review Attribution
                </button>
              </div>
              <Users className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150" size={200} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dealers' && (
        <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <Building2 size={48} className="text-slate-100 mx-auto mb-6" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Dealer network settlements handled via the Partner Portal.</p>
        </div>
      )}

      {/* STAFF AUDIT MODAL */}
      <Modal
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title={selectedStaff?.name || 'Staff Audit'}
        type="info"
        icon={<History size={24} className="text-blue-500" />}
        maxWidth="max-w-2xl"
        footer={
          canSettle && selectedStaff && settlementStats[selectedStaff.email]?.pending > 0 ? (
            <button
              onClick={() => handleSettleStaff(selectedStaff.email)}
              className="w-full py-6 bg-green-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-green-900/20 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              <ShieldCheck size={24} />
              Authorize Settlement
            </button>
          ) : null
        }
      >
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-inner group">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Unsettled Cash</p>
              <p className="text-3xl font-black text-rose-500 tracking-tighter">Rs. {selectedStaff ? ((settlementStats[selectedStaff.email]?.pending || 0).toLocaleString()) : 0}</p>
            </div>
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-inner group">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Attributed</p>
              <p className="text-3xl font-black text-green-500 tracking-tighter">Rs. {selectedStaff ? ((settlementStats[selectedStaff.email]?.total || 0).toLocaleString()) : 0}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
              <ArrowRightLeft size={16} className="text-blue-500" />
              Recent Team Collections
            </h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {selectedStaff && state.payments
                .filter(p => p.collectorEmail === selectedStaff.email && p.status === 'Approved')
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .slice(0, 20)
                .map(p => (
                  <div key={p.id} className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between hover:border-slate-700 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors">
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-100 uppercase tracking-tight text-sm">{p.userName}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{new Date(p.timestamp).toLocaleDateString()} • {p.method}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-black text-slate-100 text-lg tracking-tighter">Rs. {(p.amount || 0).toLocaleString()}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${p.isCleared ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {p.isCleared ? 'Registry Settled' : 'In Team Hand'}
                        </span>
                      </div>
                      <button
                        title="View User Details"
                        className="p-3 bg-slate-900 text-slate-500 hover:bg-blue-600 hover:text-white rounded-2xl transition-all border border-slate-800"
                        onClick={() => alert("Forwarding to Customer 360: " + p.userName)}
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              {selectedStaff && state.payments.filter(p => p.collectorEmail === selectedStaff.email && p.status === 'Approved').length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                   <Activity size={40} className="text-slate-800 mx-auto mb-4" />
                   <p className="text-slate-600 font-black uppercase tracking-widest text-[9px]">No collection history found for this member</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* LOG COLLECTION MODAL */}
      <Modal
        isOpen={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        title="Log Collection"
        type="success"
        icon={<HandCoins size={24} className="text-blue-500" />}
        maxWidth="max-w-lg"
        footer={
          <button 
            onClick={handleManualPayment}
            className="w-full py-6 bg-green-600 text-white font-black rounded-[2.5rem] hover:bg-green-700 transition-all shadow-2xl shadow-green-900/20 uppercase tracking-[0.3em] text-xs active:scale-95 flex items-center justify-center gap-3"
          >
            <ShieldCheck size={20} />
            Validate & Record
          </button>
        }
      >
        <div className="space-y-8">
           <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-1 italic">Receipt Amount (Rs.)</label>
              <div className="relative">
                 <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 font-black text-2xl">{state.settings.currency}</span>
                 <input
                   type="number"
                   className="w-full pl-20 pr-5 py-5 bg-slate-950 border border-slate-800 rounded-xl font-bold text-4xl outline-none focus:border-green-500 transition-all text-white shadow-inner"
                   value={amount}
                   onChange={(e) => setAmount(Number(e.target.value))}
                 />
              </div>
           </div>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block ml-1 italic">Payment Protocol</label>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { id: PaymentMethod.CASH, label: 'Cash Entry', icon: Landmark },
                   { id: 'Online', label: 'Digital Transfer', icon: CreditCard },
                   { id: 'Bank', label: 'Bank Direct', icon: Landmark },
                   { id: 'Home Collection', label: 'Field Pickup', icon: HandCoins }
                 ].map(m => (
                   <button
                     key={m.id}
                     onClick={() => setMethod(m.id as any)}
                     className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${method === m.id ? 'bg-green-500/10 border-green-500 text-green-400 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                   >
                     <m.icon size={18} />
                     {m.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default RecoveryDashboard;

