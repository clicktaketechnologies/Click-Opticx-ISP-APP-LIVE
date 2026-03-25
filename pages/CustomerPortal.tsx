
import React, { useState, useMemo } from 'react';
import { AppState, ISPUser, LedgerType, UserStatus } from '../types';
import {
   Search, User, Contact, ShieldCheck, MapPin,
   History, Wallet, ArrowUpRight, ArrowDownLeft,
   CreditCard, Signal, Fingerprint, Smartphone, Globe,
   Activity, Calendar, Receipt, Info, UserCircle,
   Zap, Power, RefreshCcw, Bell, AlertTriangle, Cpu,
   Database, HardDrive, Wifi, Lock
} from 'lucide-react';
import { db } from '../db';
import { notificationManager } from '../utils/NotificationManager';

const CustomerPortal: React.FC<{ state: AppState }> = ({ state }) => {
   const [query, setQuery] = useState('');
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);

   const selectedUser = useMemo(() => {
      if (!selectedId) return null;
      return state.users.find(u => u.id === selectedId) || null;
   }, [state.users, selectedId]);

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
      return state.invoices.filter(i => i.userId === selectedUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
   }, [state.invoices, selectedUser]);

   const userLedger = useMemo(() => {
      if (!selectedUser) return [];
      return state.ledger.filter(l => l.userId === selectedUser.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
   }, [state.ledger, selectedUser]);

   const handleQuickReminder = async () => {
      if (!selectedUser) return;
      setIsProcessing(true);
      const res = await notificationManager.sendInvoice(selectedUser.email, 'RT-REMINDER-' + Date.now(), `${state.settings.currency} ${selectedUser.balance}`);
      setIsProcessing(false);
      if (res.success) alert("Billing notification dispatched to Subscriber.");
   };

   const handleCircuitToggle = async () => {
      if (!selectedUser) return;
      setIsProcessing(true);
      const newStatus = selectedUser.status === UserStatus.SUSPENDED ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
      await db.updateUser(selectedUser.id, { status: newStatus });
      setIsProcessing(false);
      alert(`Circuit for ${selectedUser.name} has been ${newStatus === UserStatus.SUSPENDED ? 'Suspended' : 'Activated'}.`);
   };

   const handleCredentialReset = async () => {
      if (!selectedUser) return;
      const newPass = Math.random().toString(36).slice(-8).toUpperCase();
      if (window.confirm(`Reset credentials for ${selectedUser.connectionId}?\nNew password will be generated securely.`)) {
         setIsProcessing(true);
         await db.updateUser(selectedUser.id, { password: newPass });
         alert(`Credentials reset successfully. New password is: ${newPass}`);
         setIsProcessing(false);
      }
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-700">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded tracking-widest">NOC Central</span>
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Global Registry</span>
               </div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 italic">
                  <Cpu className="text-slate-950" size={36} />
                  Customer Portal
               </h2>
            </div>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
               <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Database size={20} />
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Nodes</p>
                  <p className="text-xs font-black text-slate-900">{state.users.length} INFRA-RECORDS</p>
               </div>
            </div>
         </div>

         {/* Search Command Bar */}
         <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
            <div className="relative bg-white rounded-[2.5rem] p-2 shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
               <div className="flex items-center">
                  <div className="pl-6 pr-4">
                     <Search className="text-slate-400" size={24} />
                  </div>
                  <input
                     type="text"
                     placeholder="Search by Identity, MAC, Circuit ID, or Biometric (CNIC)..."
                     className="w-full py-6 bg-transparent outline-none font-black text-slate-900 text-xl placeholder:text-slate-300"
                     value={query}
                     onChange={e => {
                        setQuery(e.target.value);
                        if (selectedId) setSelectedId(null);
                     }}
                  />
                  <div className="pr-4 hidden md:block">
                     <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-tighter">Press Enter to Search</div>
                  </div>
               </div>
            </div>
         </div>

         {!selectedUser && searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-10 duration-500">
               {searchResults.map(u => (
                  <button
                     key={u.id}
                     onClick={() => {
                        setSelectedId(u.id);
                        setQuery(u.name);
                     }}
                     className="relative group h-full"
                  >
                     <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-slate-100 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>
                     <div className="relative p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-500 transition-all text-left flex flex-col justify-between gap-6 h-full shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98]">
                        <div className="flex items-start justify-between">
                           <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                              <User size={32} />
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{u.connectionId}</p>
                              <p className={`text-[8px] font-black mt-1 px-2 py-0.5 rounded-full uppercase inline-block ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{u.status}</p>
                           </div>
                        </div>
                        <div>
                           <p className="font-black text-slate-900 text-lg uppercase leading-none tracking-tight mb-1">{u.name}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5"><Smartphone size={10} /> {u.phone}</p>
                        </div>
                     </div>
                  </button>
               ))}
            </div>
         )}

         {selectedUser && (
            <div className="space-y-8 animate-in zoom-in duration-500">
               {/* Top Stats - Hero Layout */}
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Profile Card */}
                  <div className="lg:col-span-2 bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                     <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                           <div className="flex justify-between items-start mb-8">
                              <div className="w-20 h-20 bg-white/5 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center text-emerald-400 border border-white/10 shadow-2xl relative overflow-hidden">
                                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
                                 <Fingerprint size={40} className="relative z-10" />
                              </div>
                              <button
                                 onClick={() => setSelectedId(null)}
                                 className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                 Detach Node
                              </button>
                           </div>
                           <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-2 leading-none">{selectedUser.name}</h3>
                           <div className="flex items-center gap-3 mb-10">
                              <span className="text-indigo-400 text-xs font-black uppercase tracking-widest">{selectedUser.connectionId}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${selectedUser.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                 {selectedUser.status}
                              </span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Network Interface</p>
                              <p className="text-xs font-black flex items-center gap-2"><Globe size={12} className="text-indigo-400" /> {selectedUser.macIp || 'DYNAMIC-IP'}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Service Node</p>
                              <p className="text-xs font-black flex items-center gap-2"><MapPin size={12} className="text-indigo-400" /> {selectedUser.area}</p>
                           </div>
                           <div className="space-y-1 hidden md:block">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Contact Link</p>
                              <p className="text-xs font-black flex items-center gap-2"><Smartphone size={12} className="text-indigo-400" /> {selectedUser.phone}</p>
                           </div>
                        </div>
                     </div>
                     <Activity className="absolute -right-20 -bottom-20 opacity-[0.03] text-indigo-500" size={400} />
                  </div>

                  {/* Quick Operation Logic */}
                  <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-950/5 flex flex-col justify-between">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                           <Zap size={14} className="text-amber-500" /> Command Center
                        </h4>
                        <div className="space-y-3">
                           <button 
                              onClick={handleCircuitToggle}
                              disabled={isProcessing}
                              className={`w-full p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${selectedUser.status === UserStatus.SUSPENDED ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-950 text-white hover:bg-black'}`}
                           >
                              <Power size={16} /> {selectedUser.status === UserStatus.SUSPENDED ? 'Activate Circuit' : 'Suspend Circuit'}
                           </button>
                           <button 
                              onClick={handleCredentialReset}
                              disabled={isProcessing}
                              className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 active:scale-95 transition-all"
                           >
                              <RefreshCcw size={16} /> Reset Credentials
                           </button>
                           <button
                              onClick={handleQuickReminder}
                              disabled={isProcessing}
                              className="w-full p-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-100 active:scale-95 transition-all"
                           >
                              {isProcessing ? <RefreshCcw className="animate-spin" size={16} /> : <Bell size={16} />}
                              Dispatch Reminder
                           </button>
                        </div>
                     </div>
                     <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[8px] font-black text-slate-300 uppercase italic">Security Level: OPTIMAL</span>
                        <Lock size={12} className="text-slate-300" />
                     </div>
                  </div>

                  {/* Health Metrics */}
                  <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                     <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                           <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-6">Service Health</p>
                           <div className="space-y-2">
                              <div className="flex items-end justify-between">
                                 <span className="text-4xl font-black italic">99.8%</span>
                                 <span className="text-[10px] font-black text-emerald-400 uppercase">Uptime</span>
                              </div>
                              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full w-[99.8%] bg-emerald-400 shadow-[0_0_10px_#10b981]"></div>
                              </div>
                           </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10 mt-8">
                           <p className="text-[8px] font-black text-indigo-100 uppercase mb-2">Registry Payload</p>
                           <div className="flex items-center gap-2">
                              <HardDrive size={14} className="text-indigo-200" />
                              <span className="text-xs font-black">2.4 GB Telemetry</span>
                           </div>
                        </div>
                     </div>
                     <Wifi className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]" size={300} />
                  </div>
               </div>

               {/* Second Row: Fin/History */}
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-1 space-y-6">
                     <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-900/5 space-y-8">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <CreditCard size={14} className="text-indigo-500" /> Fiscal Registry
                           </h4>
                           <span className="text-[8px] font-black text-emerald-500 uppercase">Synced</span>
                        </div>

                        <div className="space-y-4">
                           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Net Liabilities</p>
                              <div className="flex items-end gap-2">
                                 <p className={`text-4xl font-black italic tracking-tighter ${selectedUser.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {state.settings.currency} {selectedUser.balance.toLocaleString()}
                                 </p>
                                 <div className="mb-2">
                                    {selectedUser.balance > 0 ? <AlertTriangle size={16} className="text-rose-500 animate-bounce" /> : <ShieldCheck size={16} className="text-emerald-500" />}
                                 </div>
                              </div>
                           </div>

                           <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Provisioned Package</p>
                              <div className="flex items-center justify-between">
                                 <p className="text-lg font-black text-indigo-950 uppercase italic tracking-tight">
                                    {state.packages.find(p => p.id === selectedUser.packageId)?.name || 'UNALLOCATED_NODE'}
                                 </p>
                                 <Zap size={20} className="text-indigo-600 animate-pulse" />
                              </div>
                           </div>
                        </div>

                        <div className="pt-6">
                           <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Security Logs</h5>
                           <div className="space-y-2">
                              {[1, 2].map(i => (
                                 <div key={i} className="flex items-center gap-3 text-[10px] text-slate-600 font-bold uppercase py-1 border-l-2 border-indigo-500 pl-4">
                                    <span>Portal Handshake Success</span>
                                    <span className="ml-auto text-slate-300 text-[8px]">{i}h ago</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* History Data Plane */}
                  <div className="xl:col-span-2 bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
                     <div className="px-12 py-10 border-b bg-slate-50/50 backdrop-blur-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-950/20">
                              <Activity size={24} />
                           </div>
                           <div>
                              <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">Infrastructure History</h3>
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Full Ledger & Invoice audit trail</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Export JSON</button>
                        </div>
                     </div>

                     <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-white">
                        <div className="space-y-16">
                           {/* Invoices */}
                           <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Receipt size={16} className="text-blue-500" /> Historical Billing Dispatches
                                 </h4>
                                 <span className="text-[8px] font-black text-slate-300 uppercase">{userInvoices.length} RECORDS FOUND</span>
                              </div>

                              <div className="overflow-hidden border border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                                 <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                       <tr>
                                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-tighter">Dispatch Date</th>
                                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-tighter">Line Description</th>
                                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-tighter text-center">Protocol</th>
                                          <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-tighter text-right">Value</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                       {userInvoices.map(inv => (
                                          <tr key={inv.id} className="hover:bg-white transition-all group">
                                             <td className="px-8 py-6 text-xs font-black text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                             <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                   <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                      <Receipt size={14} />
                                                   </div>
                                                   <div>
                                                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{inv.packageName}</p>
                                                      <p className="text-[9px] text-slate-400 font-bold uppercase">{inv.id}</p>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="px-8 py-6 text-center">
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                   {inv.status}
                                                </span>
                                             </td>
                                             <td className="px-8 py-6 text-right font-black text-slate-950 text-base italic tracking-tighter">
                                                {state.settings.currency}{inv.totalAmount.toLocaleString()}
                                             </td>
                                          </tr>
                                       ))}
                                       {userInvoices.length === 0 && (
                                          <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] italic opacity-30">Null History Registry</td></tr>
                                       )}
                                    </tbody>
                                 </table>
                              </div>
                           </div>

                           {/* Ledger */}
                           <div className="space-y-8">
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                 <Wallet size={16} className="text-emerald-500" /> Fiscal Audit Trail (Ledger)
                              </h4>
                              <div className="grid gap-4">
                                 {userLedger.map(entry => (
                                    <div key={entry.id} className="group p-8 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between hover:shadow-2xl hover:shadow-slate-200 transition-all border-l-4 hover:border-l-indigo-500 relative overflow-hidden">
                                       <div className="flex items-center gap-6 relative z-10">
                                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${entry.type === LedgerType.DEBIT ? 'bg-rose-50 text-rose-500 shadow-rose-500/10' : 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10'}`}>
                                             {entry.type === LedgerType.DEBIT ? <ArrowUpRight size={28} /> : <ArrowDownLeft size={28} />}
                                          </div>
                                          <div>
                                             <p className="text-sm font-black text-slate-950 uppercase italic tracking-tight">{entry.description}</p>
                                             <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(entry.timestamp).toLocaleString()}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                <span className="text-[9px] text-slate-300 font-mono">HASH: {entry.id.substring(0, 8)}</span>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="text-right relative z-10">
                                          <p className={`text-xl font-black italic tracking-tighter ${entry.type === LedgerType.DEBIT ? 'text-rose-600' : 'text-emerald-600'}`}>
                                             {entry.type === LedgerType.DEBIT ? '-' : '+'} {state.settings.currency}{entry.amount.toLocaleString()}
                                          </p>
                                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Balance Post: {state.settings.currency}{entry.balanceAfter.toLocaleString()}</p>
                                       </div>
                                    </div>
                                 ))}
                                 {userLedger.length === 0 && (
                                    <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                       <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.5em]">No fiscal activity recorded</p>
                                    </div>
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
