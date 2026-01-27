
import React, { useState, useMemo } from 'react';
import { AppState, ISPUser, LedgerType } from '../types';
import { 
  Search, User, Contact, ShieldCheck, MapPin, 
  History, Wallet, ArrowUpRight, ArrowDownLeft,
  CreditCard, Signal, Fingerprint, Smartphone, Globe,
  Activity, Calendar, Receipt, Info, UserCircle
} from 'lucide-react';

const CustomerPortal: React.FC<{ state: AppState }> = ({ state }) => {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ISPUser | null>(null);

  const searchResults = useMemo(() => {
    if (query.length < 2) return [];
    return state.users.filter(u => 
      !u.deleted && (
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.phone.includes(query) ||
        u.connectionId.toLowerCase().includes(query.toLowerCase()) ||
        (u.cnic && u.cnic.includes(query)) ||
        (u.username && u.username.toLowerCase().includes(query.toLowerCase())) ||
        (u.macIp && u.macIp.toLowerCase().includes(query.toLowerCase()))
      )
    );
  }, [state.users, query]);

  const userInvoices = useMemo(() => {
    if (!selectedUser) return [];
    return state.invoices.filter(i => i.userId === selectedUser.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.invoices, selectedUser]);

  const userLedger = useMemo(() => {
    if (!selectedUser) return [];
    return state.ledger.filter(l => l.userId === selectedUser.id).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.ledger, selectedUser]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Globe className="text-blue-600" size={32} />
            Customer 360 Hub
          </h2>
          <p className="text-slate-500 font-medium mt-1">Unified registry search across CNIC, Mobile, MAC, and Corporate ID.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input 
              type="text" 
              placeholder="Deep Search: Enter Name, CNIC, Phone, or MAC..." 
              className="w-full pl-14 pr-4 py-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900 text-lg"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
         </div>

         {searchResults.length > 0 && !selectedUser && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-4">
              {searchResults.map(u => (
                <button 
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all text-left flex items-center gap-4 group"
                >
                   <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600">
                      <UserCircle size={28} />
                   </div>
                   <div>
                      <p className="font-black text-slate-900 uppercase tracking-tight">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.phone}</p>
                   </div>
                </button>
              ))}
           </div>
         )}
      </div>

      {selectedUser && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in zoom-in duration-300">
           {/* Sidebar Info */}
           <div className="xl:col-span-1 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                       <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                          <Fingerprint size={32} />
                       </div>
                       <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest">Reset Search</button>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-1">{selectedUser.name}</h3>
                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-8">{selectedUser.connectionId}</p>
                    
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <Smartphone size={16} className="text-slate-500" />
                          <span className="text-xs font-bold">{selectedUser.phone}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <Contact size={16} className="text-slate-500" />
                          <span className="text-xs font-bold">{selectedUser.cnic || 'NO CNIC REGISTERED'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-slate-500" />
                          <span className="text-xs font-bold">{selectedUser.area}</span>
                       </div>
                    </div>
                 </div>
                 <Activity className="absolute -right-8 -bottom-8 opacity-5" size={200} />
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} /> Financial Health</h4>
                 <div className="space-y-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Balance</p>
                       <p className={`text-2xl font-black ${selectedUser.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                         {state.settings.currency} {selectedUser.balance.toLocaleString()}
                       </p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Service</p>
                       <p className="text-sm font-black text-slate-900 uppercase">
                          {state.packages.find(p => p.id === selectedUser.packageId)?.name || 'NOT ASSIGNED'}
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* History Tabs */}
           <div className="xl:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
                 <div className="p-8 border-b bg-slate-50 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <History size={20} className="text-blue-500" />
                       <h3 className="text-sm font-black uppercase tracking-widest">Full History Audit</h3>
                    </div>
                 </div>
                 
                 <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-10">
                       {/* Invoices */}
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Receipt size={14} /> Historical Invoices</h4>
                          <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
                             <table className="w-full text-left">
                                <thead className="bg-slate-100">
                                   <tr>
                                      <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Date</th>
                                      <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Item</th>
                                      <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400">Status</th>
                                      <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 text-right">Amount</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                   {userInvoices.map(inv => (
                                     <tr key={inv.id} className="hover:bg-white transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                           <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{inv.packageName}</p>
                                           <p className="text-[9px] text-slate-400 font-bold">{inv.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                           <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                              {inv.status}
                                           </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 text-xs">{state.settings.currency} {inv.totalAmount}</td>
                                     </tr>
                                   ))}
                                   {userInvoices.length === 0 && (
                                     <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No invoice history found</td></tr>
                                   )}
                                </tbody>
                             </table>
                          </div>
                       </div>

                       {/* Ledger */}
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wallet size={14} /> Ledger Audit Trail</h4>
                          <div className="space-y-2">
                             {userLedger.map(entry => (
                               <div key={entry.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.type === LedgerType.DEBIT ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                        {entry.type === LedgerType.DEBIT ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                     </div>
                                     <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">{entry.description}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(entry.timestamp).toLocaleString()}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className={`font-black ${entry.type === LedgerType.DEBIT ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {entry.type === LedgerType.DEBIT ? '-' : '+'} {state.settings.currency} {entry.amount}
                                     </p>
                                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Balance: {state.settings.currency} {entry.balanceAfter}</p>
                                  </div>
                               </div>
                             ))}
                             {userLedger.length === 0 && (
                               <div className="p-10 text-center text-slate-400 italic">No ledger activity recorded</div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
