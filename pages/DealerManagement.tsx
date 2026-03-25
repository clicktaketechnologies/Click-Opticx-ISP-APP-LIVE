import React, { useState, useMemo } from 'react';
import { AppState, Role, StaffUser, PaymentStatus, LedgerType } from '../types';
import { db } from '../db';
// Added missing Activity icon import
import { 
  Building2, Plus, Search, Filter, Wallet, 
  ArrowUpRight, History, X, CheckCircle, 
  DollarSign, Briefcase, Zap, ShieldCheck, CreditCard, Banknote, Clock, ShieldAlert,
  TrendingUp, Calendar, ArrowDownLeft, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const DealerManagement: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<StaffUser | null>(null);
  
  // Filtering state
  const [timeFilter, setTimeFilter] = useState<'this_month' | 'last_month' | 'all'>('this_month');

  // New Dealer Form
  const [newDealer, setNewDealer] = useState({
    name: '',
    email: '',
    password: '',
    dealerCode: ''
  });

  // Load Form
  const [loadData, setLoadData] = useState({
    amount: 0,
    mode: 'paid' as 'paid' | 'credit' | 'pay_later',
    dueDate: ''
  });

  const dealers = useMemo(() => {
    return state.staff.filter(s => s.role === Role.DEALER && 
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (s.dealerCode && s.dealerCode.toLowerCase().includes(searchTerm.toLowerCase()))));
  }, [state.staff, searchTerm]);

  const dealerEmails = useMemo(() => new Set(state.staff.filter(s => s.role === Role.DEALER).map(s => s.email)), [state.staff]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filteredInvoices = state.invoices.filter(inv => {
      if (!dealerEmails.has(inv.userId)) return false;
      const d = new Date(inv.createdAt);
      if (timeFilter === 'this_month') return d >= startOfMonth;
      if (timeFilter === 'last_month') return d >= startOfLastMonth && d <= endOfLastMonth;
      return true;
    });

    const filteredPayments = state.payments.filter(pay => {
      if (!dealerEmails.has(pay.userId)) return false;
      const d = new Date(pay.timestamp);
      if (timeFilter === 'this_month') return d >= startOfMonth;
      if (timeFilter === 'last_month') return d >= startOfLastMonth && d <= endOfLastMonth;
      return true;
    });

    const distributed = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0) + 
                       filteredPayments.filter(p => p.status === 'Approved' && p.invoiceId.startsWith('load_')).reduce((acc, p) => acc + p.amount, 0);
    
    const paid = filteredPayments.filter(p => p.status === 'Approved').reduce((acc, p) => acc + p.amount, 0);
    
    const pending = filteredInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.paidAmount), 0);

    return { distributed, paid, pending };
  }, [state.invoices, state.payments, dealerEmails, timeFilter]);

  const chartData = useMemo(() => {
    const days = 30;
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayDist = state.invoices
        .filter(inv => dealerEmails.has(inv.userId) && inv.createdAt.startsWith(dateStr))
        .reduce((acc, inv) => acc + inv.totalAmount, 0) + 
        state.payments
        .filter(p => dealerEmails.has(p.userId) && p.timestamp.startsWith(dateStr) && p.invoiceId.startsWith('load_'))
        .reduce((acc, p) => acc + p.amount, 0);

      const dayPaid = state.payments
        .filter(p => dealerEmails.has(p.userId) && p.timestamp.startsWith(dateStr) && p.status === 'Approved')
        .reduce((acc, p) => acc + p.amount, 0);

      data.push({
        name: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        distributed: dayDist,
        paid: dayPaid
      });
    }
    return data;
  }, [state.invoices, state.payments, dealerEmails]);

  const handleAddDealer = async () => {
    if (!newDealer.email || !newDealer.name) return;
    await db.addStaff({
      email: newDealer.email,
      name: newDealer.name,
      password: newDealer.password || 'superpass',
      role: Role.DEALER,
      status: 'Active',
      dealerCode: newDealer.dealerCode,
      balance: 0
    });
    setNewDealer({ name: '', email: '', password: '', dealerCode: '' });
    setIsModalOpen(false);
    db.logNotification('all', 'success', 'Partner Added', `Dealer ${newDealer.name} authorized.`);
  };

  const handleApplyLoad = async () => {
    if (!selectedDealer || loadData.amount <= 0) return;
    await db.addDealerLoad(selectedDealer.email, loadData.amount, loadData.mode, loadData.dueDate);
    setIsLoadModalOpen(false);
    setLoadData({ amount: 0, mode: 'paid', dueDate: '' });
    setSelectedDealer(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Building2 className="text-purple-600" size={32} />
            Distribution Network
          </h2>
          <p className="text-slate-500 font-medium">Manage authorized dealers, provision bandwidth credit, and track distributor balances.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto shrink-0">
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'all', label: 'Lifetime' }
            ].map(f => (
              <button 
                key={f.id} 
                onClick={() => setTimeFilter(f.id as any)} 
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${timeFilter === f.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-xs hover:bg-purple-700 transition-all active:scale-95 shadow-xl shadow-purple-100 uppercase tracking-widest"
          >
            <Plus size={18} />
            Onboard Dealer
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                  <Zap size={24} />
               </div>
               <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">Distributed</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Total Bandwidth Credit</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tight relative z-10">Rs. {stats.distributed.toLocaleString()}</h3>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
               <Zap size={120} />
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                  <ArrowDownLeft size={24} />
               </div>
               <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">Settled</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Paid Balance Received</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-2 tracking-tight relative z-10">Rs. {stats.paid.toLocaleString()}</h3>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform text-emerald-500">
               <CheckCircle size={120} />
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center border border-orange-100">
                  <Clock size={24} />
               </div>
               <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase">In Market</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Pending Recovery</p>
            <h3 className="text-3xl font-black text-orange-600 mt-2 tracking-tight relative z-10">Rs. {stats.pending.toLocaleString()}</h3>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform text-orange-500">
               <History size={120} />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Recovery Trend (Last 30 Days)
              </h3>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-[9px] font-black uppercase text-slate-400">Distribution</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black uppercase text-slate-400">Recovery</span></div>
              </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={9} fontWeight="black" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="distributed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDist)" strokeWidth={3} />
                  <Area type="monotone" dataKey="paid" stroke="#10b981" fillOpacity={1} fill="url(#colorPaid)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search dealers by code, name, or email..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-medium shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dealers.map(dealer => (
              <div key={dealer.email} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 hover:shadow-md transition-all group overflow-hidden relative">
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100">
                      <Briefcase size={28} />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Wallet</p>
                      <p className="text-2xl font-black text-emerald-600">Rs. {(dealer.balance || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <h4 className="text-lg font-black text-slate-900 uppercase truncate">{dealer.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Code: {dealer.dealerCode || 'UNKWN'}</p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedDealer(dealer); setIsLoadModalOpen(true); }}
                        className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                      >
                        <Zap size={14} /> Add Load
                      </button>
                      <button className="px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                        <History size={16} />
                      </button>
                    </div>
                </div>
                
                <Building2 className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none" size={160} />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar activity/leaderboard could go here if needed, but keeping it focused for now */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">System Activity</h3>
                 <div className="space-y-4">
                    {state.notifications.filter(n => n.message.toLowerCase().includes('dealer')).slice(0, 5).map(notif => (
                       <div key={notif.id} className="flex gap-3 items-start border-l-2 border-slate-700 pl-4 py-1">
                          <div>
                             <p className="text-[10px] font-black uppercase text-emerald-400">{notif.title}</p>
                             <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{notif.message}</p>
                          </div>
                       </div>
                    ))}
                    {state.notifications.filter(n => n.message.toLowerCase().includes('dealer')).length === 0 && (
                      <p className="text-[10px] text-slate-600 italic">No recent dealer logs.</p>
                    )}
                 </div>
              </div>
              <Activity className="absolute -right-10 -bottom-10 opacity-5" size={240} />
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Partner Guidelines</h3>
              <ul className="space-y-4">
                 {[
                   { label: 'Full Paid', text: 'Load is activated upon cash verification.', color: 'text-emerald-500' },
                   { label: 'On Credit', text: 'Temporary load with immediate debt entry.', color: 'text-orange-500' },
                   { label: 'Pay Later', text: 'Formal commitment with defined promise date.', color: 'text-purple-500' }
                 ].map(item => (
                   <li key={item.label} className="flex gap-3 items-start">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${item.color} shrink-0`}></div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-slate-800">{item.label}</p>
                         <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{item.text}</p>
                      </div>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>

      {/* Onboard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-10 py-8 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Partner Onboarding</h3>
                <p className="text-slate-500 text-xs font-bold uppercase mt-1">Dealer Identity Setup</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="e.g. Al-Falah Networks" value={newDealer.name} onChange={e => setNewDealer({...newDealer, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email / Login ID</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="dealer@example.com" value={newDealer.email} onChange={e => setNewDealer({...newDealer, email: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Password</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" type="text" placeholder="Set secure password" value={newDealer.password} onChange={e => setNewDealer({...newDealer, password: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Distributor Code</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="e.g. DLR-786" value={newDealer.dealerCode} onChange={e => setNewDealer({...newDealer, dealerCode: e.target.value})} />
                 </div>
              </div>
              <button onClick={handleAddDealer} className="w-full py-5 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 shadow-xl transition-all uppercase tracking-widest text-xs">
                Authorize Distributor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {isLoadModalOpen && selectedDealer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-8 py-6 bg-purple-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Provision Load</h3>
                <p className="text-purple-100 text-[10px] font-bold uppercase mt-1 tracking-widest">{selectedDealer.name}</p>
              </div>
              <button onClick={() => setIsLoadModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Wallet Top-up Amount (Rs.)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-50" size={20} />
                   <input type="number" className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-3xl outline-none focus:ring-4 focus:ring-purple-500/10 transition-all" value={loadData.amount} onChange={e => setLoadData({...loadData, amount: Number(e.target.value)})} />
                </div>
              </div>
              
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 text-center">Settlement Status</label>
                 <div className="grid grid-cols-3 gap-3">
                    <button 
                       onClick={() => setLoadData({...loadData, mode: 'paid'})} 
                       className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${loadData.mode === 'paid' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400 grayscale'}`}
                    >
                       <Banknote size={20} />
                       <span className="text-[8px] font-black uppercase tracking-tight">Full Paid</span>
                    </button>
                    <button 
                       onClick={() => setLoadData({...loadData, mode: 'credit'})} 
                       className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${loadData.mode === 'credit' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400 grayscale'}`}
                    >
                       <CreditCard size={20} />
                       <span className="text-[8px] font-black uppercase tracking-tight">On Credit</span>
                    </button>
                    <button 
                       onClick={() => setLoadData({...loadData, mode: 'pay_later'})} 
                       className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${loadData.mode === 'pay_later' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400 grayscale'}`}
                    >
                       <Clock size={20} />
                       <span className="text-[8px] font-black uppercase tracking-tight">Pay Later</span>
                    </button>
                 </div>
              </div>

              {loadData.mode === 'pay_later' && (
                <div className="animate-in slide-in-from-top-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Promise Date</label>
                   <input 
                     type="date" 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" 
                     value={loadData.dueDate} 
                     onChange={e => setLoadData({...loadData, dueDate: e.target.value})} 
                   />
                </div>
              )}

              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-4 shadow-inner">
                 {loadData.mode === 'paid' && <ShieldCheck className="text-emerald-500 mt-1 shrink-0" size={24} />}
                 {loadData.mode === 'credit' && <ShieldAlert className="text-orange-500 mt-1 shrink-0" size={24} />}
                 {loadData.mode === 'pay_later' && <Clock className="text-purple-500 mt-1 shrink-0" size={24} />}
                 <div>
                    <p className="text-[10px] text-slate-800 font-black uppercase tracking-tight mb-1">
                      {loadData.mode === 'paid' ? 'Revenue Collection' : 'Debt Entry Triggered'}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                      {loadData.mode === 'paid' && 'Amount is recorded as cash-in-hand immediately.'}
                      {loadData.mode === 'credit' && 'Dealer gets load now; system expects immediate payment logging.'}
                      {loadData.mode === 'pay_later' && `Debt scheduled for recovery by ${loadData.dueDate || 'specified date'}.`}
                    </p>
                 </div>
              </div>

              <button 
                onClick={handleApplyLoad}
                disabled={loadData.amount <= 0 || (loadData.mode === 'pay_later' && !loadData.dueDate)}
                className="w-full py-5 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                Confirm Load Provisioning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerManagement;
