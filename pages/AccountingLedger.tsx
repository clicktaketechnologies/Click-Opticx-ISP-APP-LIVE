
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
    <div className="flex h-full flex-col gap-4 overflow-hidden relative pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1 shrink-0">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase italic leading-none flex items-center gap-3">
            <UserCircle className="text-success" size={28} />
            {isDealer ? 'TX Ledger' : 'Global Accounting'}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {isDealer ? 'Wallet activations & load history' : 'Universal organization transaction registry'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn btn-success !rounded-2xl"
        >
          <Download size={18} />
          Export Records
        </button>
      </div>

      <div className="card !p-4 shrink-0 flex flex-col md:flex-row md:items-end gap-4 overflow-x-auto no-scrollbar">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Channel</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash Payment</option>
            <option value="Online">Online Payment</option>
            <option value="Dealer Load">Balance Topup</option>
            <option value="Bank">Bank Transfer</option>
          </select>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
          </div>
          <div className="flex-1 flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none" />
          </div>
        </div>
        {(methodFilter !== 'All' || startDate || endDate) && (
          <button onClick={clearFilters} className="btn btn-sm btn-secondary !text-rose-600 !px-4">Reset</button>
        )}
      </div>

      <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-white rounded-[2rem] border border-white/5 shadow-sm">
        <div className="table-container flex-1">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Account Name</th>
                <th>Transaction Details</th>
                <th className="text-right">Debit (Out)</th>
                <th className="text-right">Credit (In)</th>
                <th className="text-right">Running</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase italic">No audit matching detected</td>
                </tr>
              ) : (
                filteredLedger.map((entry) => {
                  const targetUser = state.users.find(u => u.id === entry.userId);
                  const archivedUser = !targetUser ? state.archives?.flatMap(a => a.data.users).find(u => u.id === entry.userId) : null;
                  const targetStaff = state.staff.find(s => s.email === entry.userId);
                  const entityName = targetUser?.name || targetStaff?.name || archivedUser?.name || 'System Auto';
                  const isDeleted = !!archivedUser;

                  return (
                    <tr key={entry.id}>
                      <td className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td>
                        <div className="flex items-center gap-2">
                           <div className="text-xs font-bold text-slate-900 uppercase truncate max-w-[180px]">{entityName}</div>
                           {isDeleted && <span className="badge badge-error !text-[7px]">DELETED</span>}
                        </div>
                        <div className="text-[8px] text-slate-400 font-mono">ID: {entry.id.substr(-6)}</div>
                      </td>
                      <td>
                        <p className="text-[11px] font-bold text-slate-700 uppercase leading-none mb-1">{entry.description}</p>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{entry.method || 'System'}</span>
                      </td>
                      <td className="text-right font-black text-[11px]">
                        {entry.type === LedgerType.DEBIT ? <span className="text-rose-600">-{state.settings.currency}{entry.amount.toLocaleString()}</span> : '-'}
                      </td>
                      <td className="text-right font-black text-[11px]">
                        {entry.type === LedgerType.CREDIT ? <span className="text-emerald-600">+{state.settings.currency}{entry.amount.toLocaleString()}</span> : '-'}
                      </td>
                      <td className="text-right font-black text-[11px] text-slate-900 bg-slate-50/50">
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

