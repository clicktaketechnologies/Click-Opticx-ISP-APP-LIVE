import React, { useState, useMemo } from 'react';
import { AppState, LedgerType, PaymentMethod, Role } from '../types';
import { Calendar, FileText, Filter, Download, ArrowDownLeft, ArrowUpRight, X, UserCircle, Landmark, TrendingUp, DollarSign, Wallet, Clock } from 'lucide-react';

const AccountingLedger: React.FC<{ state: AppState }> = ({ state }) => {
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const currentUser = state.currentUser;
  const isDealer = currentUser?.role === Role.DEALER;

  const filteredLedger = useMemo(() => {
    return state.ledger.filter(entry => {
      // Security Filter: Dealers only see their own transactions
      if (isDealer) {
        const isOwnRecord = entry.userId === currentUser.email || entry.userId === currentUser.name;
        if (!isOwnRecord) return false;
      }

      const matchesMethod = methodFilter === 'All' || entry.method === methodFilter;
      const entryDate = new Date(entry.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      const matchesDate = (!start || entryDate >= start) && (!end || entryDate <= end);
      return matchesMethod && matchesDate;
    });
  }, [state.ledger, methodFilter, startDate, endDate, isDealer, currentUser]);

  const stats = useMemo(() => {
    const totalIn = filteredLedger.filter(l => l.type === LedgerType.CREDIT).reduce((acc, l) => acc + l.amount, 0);
    const totalOut = filteredLedger.filter(l => l.type === LedgerType.DEBIT).reduce((acc, l) => acc + l.amount, 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filteredLedger]);

  const clearFilters = () => {
    setMethodFilter('All');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Entity', 'Ref #', 'Description', 'Method', 'Paid Out', 'Paid In', 'Running Balance'];
    const rows = filteredLedger.map(entry => {
      const entityName = state.users.find(u => u.id === entry.userId)?.name ||
        state.staff.find(s => s.email === entry.userId)?.name ||
        'System';
      return [
        new Date(entry.timestamp).toLocaleString(),
        entityName,
        entry.id,
        entry.description,
        entry.method || '-',
        entry.type === LedgerType.DEBIT ? entry.amount : 0,
        entry.type === LedgerType.CREDIT ? entry.amount : 0,
        entry.balanceAfter
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${isDealer ? 'My' : 'Global'}_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="min-h-screen overflow-y-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1 shrink-0">
        <div>
           <h2 className="text-[clamp(1.5rem,5vw,2.5rem)] font-black text-slate-900 tracking-tighter uppercase italic leading-none flex items-center gap-4">
             <Landmark className="text-indigo-600" size={32} />
             {isDealer ? 'Financial Ledger' : 'Global Accounting Engine'}
           </h2>
           <p className="text-[clamp(0.6rem,2vw,0.75rem)] text-slate-400 font-black uppercase tracking-[0.4em] mt-3 italic">
             {isDealer ? 'Your personalized wallet & activation history' : 'Central organization transaction registry & fiscal audit'}
           </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold transition-all shadow-sm"
        >
          <Download size={18} />
          Export Audit Log
        </button>
      </div>

      {/* 2. Fiscal Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
         {[
           { label: 'Total Inflow', val: `${state.settings.currency} ${stats.totalIn.toLocaleString()}`, icon: ArrowDownLeft, grad: 'var(--grad-success)', sub: 'Gross Collections' },
           { label: 'Total Outflow', val: `${state.settings.currency} ${stats.totalOut.toLocaleString()}`, icon: ArrowUpRight, grad: 'var(--grad-error)', sub: 'System Debits' },
           { label: 'Net Position', val: `${state.settings.currency} ${stats.net.toLocaleString()}`, icon: TrendingUp, grad: 'var(--grad-info)', sub: 'Period Balance' },
         ].map((kpi, idx) => (
            <div key={idx} className="card relative translation-all overflow-hidden border-none shadow-2xl p-8 group hover:scale-[1.02] active:scale-95" style={{ backgroundImage: kpi.grad }}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
               <div className="relative z-10 text-white flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-90">{kpi.label}</p>
                     <div className="p-2.5 rounded-xl bg-white/25 backdrop-blur-md">
                        <kpi.icon size={20} strokeWidth={2.5} />
                     </div>
                  </div>
                  <h3 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black italic tracking-tighter leading-none">{kpi.val}</h3>
                  <p className="text-[9px] font-black uppercase opacity-70 mt-1 tracking-widest">{kpi.sub}</p>
               </div>
            </div>
         ))}
      </div>

      {/* 3. Deep Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 shrink-0">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-6">
          <div className="flex-1 space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Payment Channel</label>
             <div className="relative group">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none text-slate-900"
                >
                  <option value="All">All Entry Points</option>
                  <option value="Cash">Physical Cash</option>
                  <option value="Online">Digital Gateway</option>
                  <option value="Dealer Load">Partner Topup</option>
                  <option value="Bank">Bank Settlement</option>
                </select>
             </div>
          </div>
          
          <div className="flex gap-4 flex-[2]">
            <div className="flex-1 space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Date Interval From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900" />
            </div>
            <div className="flex-1 space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Date Interval To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900" />
            </div>
          </div>

          {(methodFilter !== 'All' || startDate || endDate) && (
            <button onClick={clearFilters} className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all">Reset All</button>
          )}
        </div>
      </div>

      {/* 4. Audit Table */}
      <div className="flex-1 flex flex-col relative w-full space-y-4">
        <div className="flex items-center justify-between px-2">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Showing {filteredLedger.length} Transaction Records</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Real-time Sync Active</span>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto w-full min-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="!bg-slate-50 !border-b-2 !border-slate-100">
                <th className="p-6">Registry Timestamp</th>
                <th>Target Identity</th>
                <th>Transaction Scope</th>
                <th className="text-right">Debit / Credit</th>
                <th className="text-right pr-10">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-300">
                     <div className="flex flex-col items-center justify-center opacity-30">
                        <FileText size={64} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">No Audit Trails Detected</p>
                     </div>
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry) => {
                  const targetUser = state.users.find(u => u.id === entry.userId);
                  const archivedUser = !targetUser ? state.archives?.flatMap(a => a.data.users).find(u => u.id === entry.userId) : null;
                  const targetStaff = state.staff.find(s => s.email === entry.userId);
                  const entityName = targetUser?.name || targetStaff?.name || archivedUser?.name || 'System Auto';
                  const isDeleted = !!archivedUser;

                  return (
                    <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                         <div className="flex items-center gap-3">
                            <Clock size={14} className="text-slate-300" />
                            <span className="text-[11px] font-black text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                         </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <UserCircle size={20} />
                           </div>
                           <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic truncate max-w-[180px]">{entityName}</div>
                              {isDeleted && <span className="text-[7px] font-black bg-rose-50 text-rose-600 px-2 rounded-lg mt-0.5">PURGED RECORD</span>}
                           </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1 group-hover:translate-x-1 transition-transform">{entry.description}</p>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">{entry.method || 'System Internal'}</span>
                      </td>
                       <td className="text-right p-6">
                         {entry.type === LedgerType.DEBIT ? (
                           <div className="flex items-center justify-end gap-2">
                             <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                               <ArrowDownLeft size={14} className="text-rose-500" />
                             </div>
                             <div className="flex flex-col items-end">
                               <span className="text-sm font-black text-rose-600 tabular-nums">-{state.settings.currency}{entry.amount.toLocaleString()}</span>
                               <span className="text-[8px] font-bold text-rose-300 uppercase italic">Debit</span>
                             </div>
                           </div>
                         ) : (
                           <div className="flex items-center justify-end gap-2">
                             <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                               <ArrowUpRight size={14} className="text-emerald-500" />
                             </div>
                             <div className="flex flex-col items-end">
                               <span className="text-sm font-black text-emerald-600 tabular-nums">+{state.settings.currency}{entry.amount.toLocaleString()}</span>
                               <span className="text-[8px] font-bold text-emerald-300 uppercase italic">Credit</span>
                             </div>
                           </div>
                         )}
                       </td>
                      <td className="text-right font-black text-sm text-slate-900 bg-slate-50/50 pr-10 tabular-nums">
                        {state.settings.currency}{entry.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountingLedger;
