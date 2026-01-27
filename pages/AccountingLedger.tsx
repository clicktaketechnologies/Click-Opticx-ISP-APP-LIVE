
import React, { useState, useMemo } from 'react';
import { AppState, LedgerType, PaymentMethod, Role } from '../types';
import { Calendar, FileText, Filter, Download, ArrowDownLeft, ArrowUpRight, X, UserCircle } from 'lucide-react';

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
                        'System/External';
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <UserCircle className="text-emerald-600" size={32} />
              {isDealer ? 'My Transaction Ledger' : 'Global Fiscal Audit'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isDealer ? 'Track your wallet activations and bandwidth credit loads.' : 'Complete list of all payments and charges across the organization.'}
            </p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black hover:bg-emerald-700 transition-all shadow-xl active:scale-95 uppercase tracking-widest"
          >
            <Download size={18} />
            Download Records
          </button>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-end gap-6 overflow-x-auto no-scrollbar">
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Channel</label>
            <select 
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            >
              <option value="All">All Protocols</option>
              <option value="Cash">Cash Ledger</option>
              <option value="Online">Digital Gateway</option>
              <option value="Dealer Load">Wallet Load</option>
              <option value="Bank">Bank Wire</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
            </div>
          </div>
          {(methodFilter !== 'All' || startDate || endDate) && (
            <button onClick={clearFilters} className="px-6 py-3 text-red-600 font-black text-[10px] hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest">Clear Audit Filter</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Target Entity</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Fiscal Details</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Debit (Out)</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Credit (In)</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Running Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-300 italic font-medium">No records found for the selected criteria.</td>
                </tr>
              ) : (
                filteredLedger.map((entry) => {
                  const targetUser = state.users.find(u => u.id === entry.userId);
                  const targetStaff = state.staff.find(s => s.email === entry.userId);
                  const entityName = targetUser?.name || targetStaff?.name || 'System Auto';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(entry.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="px-8 py-5">
                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{entityName}</div>
                        <div className="text-[9px] text-slate-400 font-mono">REF: {entry.id.split('_')[1] || entry.id}</div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-[11px] font-bold text-slate-600 uppercase leading-none">{entry.description}</p>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{entry.method || 'Protocol: Internal'}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-black">
                        {entry.type === LedgerType.DEBIT ? <span className="text-red-600">{state.settings.currency} {entry.amount.toLocaleString()}</span> : '-'}
                      </td>
                      <td className="px-8 py-5 text-right font-black">
                        {entry.type === LedgerType.CREDIT ? <span className="text-emerald-600">{state.settings.currency} {entry.amount.toLocaleString()}</span> : '-'}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-900 bg-slate-50/50">
                        {state.settings.currency} {entry.balanceAfter.toLocaleString()}
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
