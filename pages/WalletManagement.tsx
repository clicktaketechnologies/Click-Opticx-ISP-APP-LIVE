import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, Role, StaffUser, ISPUser, LedgerType, TopupRequest } from '../types';
import { db } from '../db';
import {
   Wallet, Banknote, Landmark, ArrowUpRight, ArrowDownLeft,
   Search, UserCircle, HandCoins, History, Clock, ShieldCheck, X,
   Plus, DollarSign, Activity, Globe, Smartphone, ArrowRight,
   CheckCircle, XCircle, RefreshCw, Zap, Sparkles
} from 'lucide-react';

const WalletManagement: React.FC<{ state: AppState }> = ({ state }) => {
   const [activeTab, setActiveTab] = useState<'liquidity' | 'personnel' | 'subscribers' | 'requests'>('liquidity');
   const [searchTerm, setSearchTerm] = useState('');
   const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
   const [selectedTarget, setSelectedTarget] = useState<{ id: string, name: string, type: 'staff' | 'user' } | null>(null);
   const [amount, setAmount] = useState<number>(0);
   const [isProcessing, setIsProcessing] = useState<string | null>(null);
   const [isRefilling, setIsRefilling] = useState(false);

   const currentUser = state.currentUser as StaffUser;
   const isSuperAdmin = currentUser?.role === Role.SUPER_ADMIN;

   const filteredStaff = useMemo(() => {
      return state.staff.filter(s =>
         s.email !== currentUser.email &&
         (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
   }, [state.staff, currentUser, searchTerm]);

   const filteredUsers = useMemo(() => {
      return state.users.filter(u =>
         !u.deleted &&
         (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.connectionId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
   }, [state.users, searchTerm]);

   const pendingTopups = useMemo(() => {
      return (state.topupRequests || [])
         .filter(r => r.status === 'Pending')
         .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
   }, [state.topupRequests]);

   const handleProcessTopup = async () => {
      if (!selectedTarget || amount <= 0) return;
      const res = await db.processTopup(currentUser.email, selectedTarget.id, selectedTarget.type, amount);
      if (res.success) {
         setIsTopupModalOpen(false);
         setAmount(0);
         setSelectedTarget(null);
         db.logNotification(selectedTarget.id, 'success', 'Credit Added', `Rs.${amount} added to ${selectedTarget.name}'s account.`);
      } else {
         alert(res.message);
      }
   };

   const handleAutoRefill = async () => {
      setIsRefilling(true);
      // System Credit
      const refillAmount = 10000000;
      const res = await db.processTopup('SYSTEM', currentUser.email, 'staff', refillAmount);

      setTimeout(() => {
         setIsRefilling(false);
         if (res.success) {
            db.logNotification(currentUser.email, 'success', 'Balance Refilled', `System credited Rs. 10M to your account.`);
         }
      }, 1000);
   };

   const handleApproveRequest = async (reqId: string) => {
      setIsProcessing(reqId);
      await db.approveTopupRequest(reqId);
      setIsProcessing(null);
   };

   const handleRejectRequest = async (reqId: string) => {
      setIsProcessing(reqId);
      await db.rejectTopupRequest(reqId);
      setIsProcessing(null);
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                  <Wallet className="text-emerald-600" size={32} />
                  Wallet Management
               </h2>
               <p className="text-slate-500 font-medium">Manage operational wallet balance and add credits across the network.</p>
            </div>
            <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto">
               {[
                  { id: 'liquidity', label: 'My Balance', icon: Globe },
                  { id: 'personnel', label: 'Staff Credits', icon: UserCircle },
                  { id: 'subscribers', label: 'Subscriber Credits', icon: HandCoins },
                  { id: 'requests', label: 'Topup Requests', icon: Activity, count: pendingTopups.length },
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  >
                     <tab.icon size={16} />
                     {tab.label}
                     {tab.count !== undefined && tab.count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white">{tab.count}</span>
                     )}
                  </button>
               ))}
            </div>
         </div>

         {activeTab === 'liquidity' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-slate-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[400px]">
                  <div className="relative z-10 space-y-4">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <p className="text-[13px] font-black text-blue-400 uppercase tracking-[0.4em] italic">My Wallet Balance</p>
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[9px] font-black uppercase text-slate-500">Balance Updated</span>
                           </div>
                        </div>
                        <ShieldCheck className="text-emerald-400" size={40} />
                     </div>
                     <h3 className="text-8xl font-black tracking-tighter italic">
                        {state.settings.currency} {(currentUser.balance || 0).toLocaleString()}
                     </h3>
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row gap-4">
                     <button
                        onClick={handleAutoRefill}
                        disabled={isRefilling}
                        className="flex-1 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isRefilling ? <Mini5GMicroLoader size={20} /> : <Zap size={20} fill="currentColor" />}
                        {isRefilling ? 'Updating Balance...' : 'Auto-Refill (10M)'}
                     </button>
                     <div className="flex-[0.5] p-6 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md flex items-center justify-center gap-3">
                        <Sparkles className="text-amber-400" size={20} />
                        <p className="text-[9px] font-black uppercase text-slate-400 leading-tight">System credit available for instant balance refill.</p>
                     </div>
                  </div>
                  <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={400} />
               </div>

               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                        <History size={14} className="text-blue-600" /> Transaction History
                     </h4>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {state.ledger.filter(l => l.userId === currentUser.email).slice(0, 5).map(log => (
                           <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                              <div>
                                 <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[120px]">{log.description}</p>
                                 <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleDateString()}</p>
                              </div>
                              <p className={`text-sm font-black italic ${log.type === LedgerType.CREDIT ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {log.type === LedgerType.CREDIT ? '+' : '-'}{log.amount.toLocaleString()}
                              </p>
                           </div>
                        ))}
                        {state.ledger.filter(l => l.userId === currentUser.email).length === 0 && (
                           <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase italic">No transactions found.</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'requests' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 gap-4">
                  {pendingTopups.map(req => (
                     <div key={req.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100"><HandCoins size={28} /></div>
                           <div>
                              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{req.userName}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.paymentMethod} • {req.requestType}</p>
                              {req.paymentCommitmentDate && (
                                 <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase text-amber-600">
                                    <Clock size={12} /> Promise: {req.paymentCommitmentDate} @ {req.paymentCommitmentTime}
                                 </div>
                              )}
                           </div>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-2xl font-black text-slate-900 tracking-tighter">{state.settings.currency}{req.amount.toLocaleString()}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Subscriber Initiated</p>
                        </div>
                        <div className="flex gap-3">
                           <button
                              onClick={() => handleRejectRequest(req.id)}
                              disabled={isProcessing === req.id}
                              className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all"
                           >
                              Reject
                           </button>
                           <button
                              onClick={() => handleApproveRequest(req.id)}
                              disabled={isProcessing === req.id}
                              className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                           >
                              {isProcessing === req.id ? <Mini5GMicroLoader size={14} /> : <CheckCircle size={14} />}
                              Approve Topup
                           </button>
                        </div>
                     </div>
                  ))}
                  {pendingTopups.length === 0 && (
                     <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No pending topup requests found.</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {(activeTab === 'personnel' || activeTab === 'subscribers') && (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="relative">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <input
                        className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
                        placeholder={`Search ${activeTab === 'personnel' ? 'staff members' : 'subscribers'} to add credits...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTab === 'personnel' ? (
                     filteredStaff.map(s => (
                        <div key={s.email} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                           <div className="relative z-10 flex flex-col h-full justify-between">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:rotate-6 transition-transform">
                                    <UserCircle size={32} />
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallet</p>
                                    <p className="text-xl font-black text-slate-900">{state.settings.currency} {(s.balance || 0).toLocaleString()}</p>
                                 </div>
                              </div>
                              <div>
                                 <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1">{s.name}</h4>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{s.role}</p>
                                 <button
                                    onClick={() => { setSelectedTarget({ id: s.email, name: s.name, type: 'staff' }); setIsTopupModalOpen(true); }}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100"
                                 >
                                    Load Staff Wallet
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))
                  ) : (
                     filteredUsers.map(u => (
                        <div key={u.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                           <div className="relative z-10 flex flex-col h-full justify-between">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 group-hover:rotate-6 transition-transform">
                                    <HandCoins size={32} />
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                    <p className={`text-xl font-black ${u.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{state.settings.currency} {u.balance.toLocaleString()}</p>
                                 </div>
                              </div>
                              <div>
                                 <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-1">{u.name}</h4>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{u.connectionId}</p>
                                 <button
                                    onClick={() => { setSelectedTarget({ id: u.id, name: u.name, type: 'user' }); setIsTopupModalOpen(true); }}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100"
                                 >
                                    Apply User Credit
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         )}

         {/* TOPUP MODAL */}
         {isTopupModalOpen && selectedTarget && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
               <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-white/20 flex flex-col">
                  <div className="px-10 py-8 bg-emerald-600 text-white flex justify-between items-center">
                     <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Add Credits</h3>
                        <p className="text-emerald-100 text-[10px] font-bold uppercase mt-1 tracking-widest">Target: {selectedTarget.name}</p>
                     </div>
                     <button onClick={() => setIsTopupModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-emerald-100 hover:text-white"><X size={28} /></button>
                  </div>
                  <div className="p-10 space-y-10">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Credits to Add (Rs.)</label>
                        <div className="relative">
                           <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-50 font-black text-2xl" />
                           <input
                              type="number"
                              className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-5xl outline-none focus:border-emerald-500 transition-all text-slate-900 shadow-inner"
                              value={amount}
                              onChange={e => setAmount(Number(e.target.value))}
                              autoFocus
                           />
                        </div>
                     </div>
                     <button
                        onClick={handleProcessTopup}
                        disabled={amount <= 0 || (!isSuperAdmin && (currentUser.balance || 0) < amount)}
                        className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2rem] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 uppercase tracking-[0.3em] text-xs active:scale-95 disabled:grayscale disabled:opacity-50"
                     >
                        Confirm Transfer
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default WalletManagement;
