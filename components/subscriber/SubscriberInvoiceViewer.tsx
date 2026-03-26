import { Mini5GMicroLoader } from '../Mini5GMicroLoader';
import React, { useState, useMemo, useRef } from 'react';
import { Invoice, AppState, PaymentStatus, LedgerType, UserStatus } from '../../types';
import {
   X, Printer, Download, CreditCard, ShieldCheck,
   Info, Landmark, Globe, Activity, FileText, CheckCircle, Wallet, Loader2,
   History, ArrowRightLeft, User, ShieldAlert, BadgeCheck, Calendar, TrendingUp,
   Wifi, Zap, ShoppingBag, Receipt, AlertTriangle, Phone, MapPin,
   Package, Hash, Clock, Wifi, Building2
} from 'lucide-react';
import { db } from '../../db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
   invoice: Invoice;
   state: AppState;
   onClose: () => void;
   onPaid: () => void;
}

const SubscriberInvoiceViewer: React.FC<Props> = ({ invoice, state, onClose, onPaid }) => {
   const [activeView, setActiveView] = useState<'invoice' | 'history'>('invoice');
   const [isProcessing, setIsProcessing] = useState(false);
   const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
   const invoiceRef = useRef<HTMLDivElement>(null);

   const branding = state.settings.branding;
   const b = state.settings.invoiceBranding;
   const curr = state.settings.currency || 'Rs.';

   // Auto-fetch user details from state
   const user = state.users.find(u => u.id === invoice.userId);

   // Auto-fetch package details linked to the user
   const userPackage = useMemo(() => {
      if (!user?.packageId) return null;
      return state.packages.find(p => p.id === user.packageId) || null;
   }, [user, state.packages]);

   // Related payment history for this invoice
   const relatedHistory = useMemo(() => {
      return state.ledger
         .filter(l => l.description.includes(invoice.id))
         .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
   }, [state.ledger, invoice.id]);

   // Last 6 months billing history
   const billingHistory = useMemo(() => {
      return state.invoices
         .filter(inv => inv.userId === invoice.userId)
         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
         .slice(0, 6);
   }, [state.invoices, invoice.userId]);

   // All payments made by this user
   const userPayments = useMemo(() => {
      return state.payments
         .filter(p => p.userId === invoice.userId && p.status === 'Approved')
         .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
         .slice(0, 5);
   }, [state.payments, invoice.userId]);

   const displayLogo = branding.logoLight || branding.logoDark || branding.logoSquare;

   const handleDownloadPDF = async () => {
      if (!invoiceRef.current) return;
      setIsGeneratingPDF(true);
      try {
         const element = invoiceRef.current;
         const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
         });
         const imgData = canvas.toDataURL('image/png');
         const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
         });
         const imgWidth = 210;
         const imgHeight = (canvas.height * imgWidth) / canvas.width;
         pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
         pdf.save(`Invoice_${invoice.id}.pdf`);
         db.logNotification(invoice.userId, 'info', 'Invoice Downloaded', `PDF for Invoice ${invoice.id} generated successfully.`);
      } catch (err) {
         console.error('PDF Generation Error:', err);
         alert("PDF generation failed. Please try again.");
      } finally {
         setIsGeneratingPDF(false);
      }
   };

   const handleWalletPay = async () => {
      if (confirm('Confirm Payment: Use your Wallet Balance to pay this invoice?')) {
         setIsProcessing(true);
         try {
            const res = await db.payInvoiceWithWallet(invoice.id);
            if (res.success) {
               db.logNotification(invoice.userId, 'success', 'Payment Successful', `Invoice ${invoice.id} cleared via Wallet.`);
               onPaid();
            } else {
               alert(res.message);
            }
         } catch (err) {
            alert("Payment failed. Please try again.");
         } finally {
            setIsProcessing(false);
         }
      }
   };

   const handleOnlinePay = async () => {
      setIsProcessing(true);
      setTimeout(async () => {
         try {
            const res = await db.payInvoiceWithWallet(invoice.id);
            if (res.success) {
               db.logNotification(invoice.userId, 'success', 'Online Payment Confirmed', `Payment for ${invoice.id} verified via Online Gateway.`);
               onPaid();
            }
         } catch (err) {
            alert("Online gateway failed. Please try again.");
         } finally {
            setIsProcessing(false);
         }
      }, 1500);
   };

   const statusColor = invoice.status === PaymentStatus.PAID
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : invoice.status === PaymentStatus.OVERDUE
         ? 'bg-rose-50 border-rose-200 text-rose-700'
         : 'bg-amber-50 border-amber-200 text-amber-700';

   return (
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
         <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:m-0 print:rounded-none max-h-[95vh]">

            {/* Actions Toolbar (Hidden in Print) */}
            <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center print:hidden shrink-0 gap-3">
               <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                  <button
                     onClick={() => setActiveView('invoice')}
                     className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'invoice' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                  >
                     <FileText size={14} /> Invoice
                  </button>
                  <button
                     onClick={() => setActiveView('history')}
                     className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                  >
                     <History size={14} /> Payment History
                  </button>
               </div>
               <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
                     {invoice.status}
                  </span>
                  <button
                     onClick={handleDownloadPDF}
                     disabled={isGeneratingPDF}
                     className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
                  >
                     {isGeneratingPDF ? <Mini5GMicroLoader size={14} /> : <Download size={14} />}
                     {isGeneratingPDF ? 'Generating...' : 'PDF'}
                  </button>
                  <button
                     onClick={() => window.print()}
                     className="px-4 py-2.5 bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest"
                  >
                     <Printer size={14} /> Print
                  </button>
                  <button onClick={onClose} className="p-2.5 bg-white/10 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-rose-500/10 rounded-xl transition-all">
                     <X size={18} />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100">
               {activeView === 'invoice' ? (
                  <div className="max-w-4xl mx-auto my-8 print:my-0">
                     <div ref={invoiceRef} className="bg-white shadow-2xl border border-slate-200 print:shadow-none print:border-none min-h-[1100px] flex flex-col overflow-hidden">

                        {/* Invoice Color Band */}
                        <div className="h-2 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500"></div>

                        {/* Header */}
                        <div className="p-10 md:p-12">
                           <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                              <div className="flex items-start gap-5">
                                 <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-800 shadow-2xl shrink-0">
                                    {displayLogo ? (
                                       <img src={displayLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                       <Wifi className="text-indigo-400" size={40} />
                                    )}
                                 </div>
                                 <div className="space-y-1">
                                    <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900">{branding.businessName}</h1>
                                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em]">{state.settings.profile.tagline}</p>
                                    <div className="flex flex-col gap-1 pt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                                       <span className="flex items-center gap-2"><Globe size={11} className="text-indigo-500" /> {state.settings.digitalPresence.website || 'N/A'}</span>
                                       <span className="flex items-center gap-2"><MapPin size={11} className="text-indigo-500" /> {state.settings.profile.headOffice}</span>
                                       <span className="flex items-center gap-2"><Info size={11} className="text-indigo-500" /> NTN: {state.settings.profile.registrationNumber || 'N/A'}</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="md:text-right space-y-3 shrink-0">
                                 <div className="bg-slate-950 text-white px-6 py-3 rounded-2xl inline-block">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">INVOICE</p>
                                    <p className="text-xl font-black italic tracking-tighter text-indigo-400">#{invoice.id}</p>
                                 </div>
                                 <div className="space-y-1 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex md:justify-end items-center gap-2">
                                       <Calendar size={11} className="text-slate-400" />
                                       <span className="text-slate-400">Issued:</span>
                                       <span className="text-slate-900">{new Date(invoice.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex md:justify-end items-center gap-2">
                                       <Clock size={11} className="text-rose-400" />
                                       <span className="text-slate-400">Due:</span>
                                       <span className="text-rose-600">{new Date(invoice.dueDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                 </div>
                                 {invoice.status === PaymentStatus.PAID && (
                                    <div className="flex md:justify-end items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                       <CheckCircle size={13} className="text-emerald-600" />
                                       <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">PAID on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Divider */}
                           <div className="h-px bg-gradient-to-r from-indigo-100 via-slate-100 to-transparent mb-10"></div>

                           {/* Subscriber + Package Info */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                              {/* Customer Details */}
                              <div className="bg-slate-50 rounded-[2rem] p-7 border border-slate-100 space-y-4">
                                 <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                    <User size={13} /> Customer Details
                                 </h3>
                                 <div>
                                    <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{invoice.userName}</p>
                                    <div className="space-y-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                       <div className="flex items-center gap-2">
                                          <Hash size={11} className="text-slate-400" />
                                          <span>Customer ID: <span className="text-slate-800 font-black">{invoice.userId.slice(0, 8).toUpperCase()}</span></span>
                                       </div>
                                       {user?.connectionId && (
                                          <div className="flex items-center gap-2">
                                             <Wifi size={11} className="text-slate-400" />
                                             <span>Connection ID: <span className="text-slate-800 font-black">{user.connectionId}</span></span>
                                          </div>
                                       )}
                                       {user?.phone && (
                                          <div className="flex items-center gap-2">
                                             <Phone size={11} className="text-slate-400" />
                                             <span>Phone: <span className="text-slate-800 font-black">{user.phone}</span></span>
                                          </div>
                                       )}
                                       {(user as any)?.cnic && (
                                          <div className="flex items-center gap-2">
                                             <User size={11} className="text-slate-400" />
                                             <span>CNIC: <span className="text-slate-800 font-black">{(user as any).cnic}</span></span>
                                          </div>
                                       )}
                                       {(user as any)?.address && (
                                          <div className="flex items-start gap-2">
                                             <MapPin size={11} className="text-slate-400 mt-0.5 shrink-0" />
                                             <span className="leading-relaxed">{(user as any).address}</span>
                                          </div>
                                       )}
                                       <div className="flex items-center gap-2">
                                          <Activity size={11} className={`${user?.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                          <span>Status: <span className={`font-black ${user?.status === 'Active' ? 'text-emerald-700' : 'text-rose-700'}`}>{user?.status || 'N/A'}</span></span>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Package + Connection Details */}
                              <div className="space-y-4">
                                 {/* Package Details */}
                                 {userPackage && (
                                    <div className="bg-indigo-950 rounded-[2rem] p-7 text-white space-y-3">
                                       <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                          <Package size={13} /> Active Package
                                       </h3>
                                       <p className="text-xl font-black uppercase italic tracking-tighter leading-none">{userPackage.name}</p>
                                       <div className="grid grid-cols-2 gap-2 pt-1">
                                          {userPackage.speed && (
                                             <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                                                <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest">Speed</p>
                                                <p className="text-sm font-black text-white">{userPackage.speed}</p>
                                             </div>
                                          )}
                                          <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                                             <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest">Monthly Rate</p>
                                             <p className="text-sm font-black text-white">{curr} {userPackage.price?.toLocaleString()}</p>
                                          </div>
                                          {(userPackage as any).billingCycle && (
                                             <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                                                <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest">Billing</p>
                                                <p className="text-sm font-black text-white capitalize">{(userPackage as any).billingCycle}</p>
                                             </div>
                                          )}
                                          <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                                             <p className="text-[8px] text-indigo-300 font-black uppercase tracking-widest">Type</p>
                                             <p className="text-sm font-black text-white">{user?.connectionType || 'Fiber'}</p>
                                          </div>
                                       </div>
                                       <div className="pt-1 border-t border-white/10 text-[9px] text-indigo-300 font-bold uppercase tracking-widest space-y-1">
                                          {(user as any)?.activatedAt && <p>Activated: {new Date((user as any).activatedAt).toLocaleDateString()}</p>}
                                          {(user as any)?.expiryDate && <p className={new Date((user as any).expiryDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) ? 'text-rose-400' : ''}>Expires: {new Date((user as any).expiryDate).toLocaleDateString()}</p>}
                                       </div>
                                    </div>
                                 )}

                                 {/* Balance Summary */}
                                 <div className={`rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg ${invoice.status === PaymentStatus.PAID ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Invoice Total</p>
                                    <p className="text-4xl font-black italic tracking-tighter">{curr} {invoice.totalAmount.toLocaleString()}</p>
                                    {invoice.dueAmount > 0 && (
                                       <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">Balance Due: {curr} {invoice.dueAmount.toLocaleString()}</p>
                                    )}
                                    <TrendingUp className="absolute -right-4 -bottom-4 opacity-10" size={80} />
                                 </div>
                              </div>
                           </div>

                           {/* Items Table */}
                           <div className="mb-10">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic flex items-center gap-2 mb-4">
                                 <Zap size={13} /> Service Charges
                              </h4>
                              <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                 <table className="w-full text-left">
                                    <thead className="bg-slate-950">
                                       <tr>
                                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                                          <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                       {invoice.items.map(item => (
                                          <tr key={item.id} className="hover:bg-slate-50 transition-all">
                                             <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                   <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                                      <ShoppingBag size={16} />
                                                   </div>
                                                   <div>
                                                      <p className="font-black text-slate-900 uppercase text-sm italic tracking-tighter leading-none mb-1">{item.description}</p>
                                                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{item.category}</span>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="px-8 py-6 text-center font-black text-xs text-slate-400 uppercase italic">×{item.quantity}</td>
                                             <td className="px-8 py-6 text-right font-black text-xs text-slate-500">{curr} {item.unitPrice.toLocaleString()}</td>
                                             <td className="px-8 py-6 text-right font-black text-slate-950 text-lg italic tracking-tighter">{curr} {item.total.toLocaleString()}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>

                           {/* Financial Summary + Recent Payments */}
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                              {/* Recent Payments */}
                              <div className="space-y-3">
                                 <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic flex items-center gap-2">
                                    <Calendar size={13} /> Payment History (Last 6 Months)
                                 </h4>
                                 <div className="bg-slate-50 rounded-[2rem] p-5 border border-slate-100 space-y-3">
                                    {billingHistory.length > 0 ? billingHistory.map(inv => (
                                       <div key={inv.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                          <div>
                                             <p className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter">{new Date(inv.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                             <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Ref: #{inv.id}</p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-xs font-black text-slate-900 italic tracking-tighter">{curr} {inv.totalAmount.toLocaleString()}</p>
                                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${inv.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {inv.status}
                                             </span>
                                          </div>
                                       </div>
                                    )) : (
                                       <p className="text-[10px] text-slate-400 uppercase italic text-center py-6">No billing history available.</p>
                                    )}

                                    {/* Unpaid Balance */}
                                    {user && user.balance > 0 && (
                                       <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl flex justify-between items-center">
                                          <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                                             <AlertTriangle size={12} /> Total Unpaid Balance
                                          </span>
                                          <span className="text-sm font-black text-rose-700">{curr} {user.balance.toLocaleString()}</span>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* Calculation Summary */}
                              <div className="space-y-4">
                                 <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic flex items-center gap-2">
                                    <Receipt size={13} /> Billing Summary
                                 </h4>
                                 <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                       <span>Subtotal</span>
                                       <span className="text-slate-800">{curr} {invoice.subtotal.toLocaleString()}</span>
                                    </div>
                                    {state.settings.enableTax && (
                                       <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                          <span>{state.settings.taxLabel || 'Tax'} ({invoice.taxRate}%)</span>
                                          <span className="text-slate-800">{curr} {invoice.taxAmount.toLocaleString()}</span>
                                       </div>
                                    )}
                                    {invoice.discountAmount > 0 && (
                                       <div className="flex justify-between items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                          <span>Discount</span>
                                          <span>- {curr} {invoice.discountAmount.toLocaleString()}</span>
                                       </div>
                                    )}
                                    <div className="h-px bg-slate-100"></div>
                                    <div className="flex justify-between items-center pt-1">
                                       <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest italic">Grand Total</p>
                                       <span className="text-3xl font-black text-slate-950 italic tracking-tighter">{curr} {invoice.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 space-y-2">
                                       <div className="flex justify-between items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                          <span>Amount Paid</span>
                                          <span>{curr} {invoice.paidAmount.toLocaleString()}</span>
                                       </div>
                                       <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl">
                                          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Remaining Due</span>
                                          <span className={`text-xl font-black italic tracking-tighter ${invoice.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                             {curr} {invoice.dueAmount.toLocaleString()}
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Footer */}
                           <div className="pt-8 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-end gap-10">
                              <div className="space-y-3 max-w-sm">
                                 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                    <ShieldCheck size={14} className="text-indigo-600" /> Terms & Conditions
                                 </h4>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-tight whitespace-pre-wrap italic">
                                    {b.terms || 'All payments are final. Service termination occurs if settlement exceeds the 48-hour window. Equipment remains the property of the ISP.'}
                                 </p>
                                 <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] text-center">
                                       System-generated document. No physical stamp required.
                                    </p>
                                 </div>
                              </div>
                              <div className="text-center md:text-right space-y-4">
                                 {b.authorizedSignature ? (
                                    <div className="inline-block w-44 h-20 border-b-4 border-slate-950 p-2 bg-slate-50 rounded-2xl">
                                       <img src={b.authorizedSignature} className="w-full h-full object-contain filter contrast-150" alt="Authorized Signature" />
                                    </div>
                                 ) : (
                                    <div className="inline-block w-44 h-20 border-b-4 border-slate-900 bg-slate-50 rounded-2xl shadow-inner"></div>
                                 )}
                                 <div>
                                    <p className="text-sm font-black text-slate-950 uppercase italic tracking-tighter">Authorized Signatory</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{b.footerDisclaimer || branding.businessName}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Bottom band */}
                        <div className="mt-auto h-2 bg-gradient-to-r from-emerald-500 via-fuchsia-500 to-indigo-600"></div>
                     </div>
                  </div>
               ) : (
                  <div className="p-10 space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-950 text-white rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                           <History size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Payment Audit Trail</h3>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Transactions for Invoice #{invoice.id}</p>
                        </div>
                     </div>

                     {/* Payments Made */}
                     {userPayments.length > 0 && (
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Recent Successful Payments</p>
                           {userPayments.map(p => (
                              <div key={p.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between hover:shadow-lg transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                       <CheckCircle size={22} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{p.description || 'Payment Received'}</p>
                                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(p.timestamp).toLocaleString()} • {p.method}</p>
                                    </div>
                                 </div>
                                 <p className="text-xl font-black text-emerald-600 italic">+ {curr} {p.amount.toLocaleString()}</p>
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Ledger Entries */}
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Ledger Entries for this Invoice</p>
                        {relatedHistory.length === 0 ? (
                           <div className="p-20 text-center flex flex-col items-center gap-4 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                              <ArrowRightLeft size={48} className="text-slate-100" />
                              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No ledger entries found.</p>
                           </div>
                        ) : (
                           relatedHistory.map(l => (
                              <div key={l.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:shadow-lg hover:border-indigo-100 transition-all">
                                 <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${l.type === LedgerType.DEBIT ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                       <Activity size={22} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{l.description}</p>
                                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(l.timestamp).toLocaleString()} • {l.method || 'System'}</p>
                                    </div>
                                 </div>
                                 <p className={`text-xl font-black italic tracking-tighter ${l.type === LedgerType.DEBIT ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {l.type === LedgerType.DEBIT ? '-' : '+'} {curr} {l.amount.toLocaleString()}
                                 </p>
                              </div>
                           ))
                        )}
                     </div>

                     <div className="p-8 bg-indigo-950 border border-slate-800 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden">
                        <ShieldAlert size={32} className="text-indigo-400 shrink-0 relative z-10" />
                        <p className="text-[11px] text-indigo-100 font-bold leading-relaxed uppercase tracking-tight relative z-10">
                           This view shows all financial events linked to this invoice. All entries are permanently recorded in the system ledger.
                        </p>
                     </div>
                  </div>
               )}
            </div>

            {/* Payment Actions Footer (Hidden in Print) */}
            {invoice.status !== PaymentStatus.PAID && activeView === 'invoice' && (
               <div className="p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between print:hidden shrink-0 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)]">
                  <div>
                     <p className="text-base font-black text-slate-950 uppercase italic tracking-tighter flex items-center gap-2">
                        <Wallet size={18} className="text-indigo-600" /> Payment Required
                     </p>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        Amount Due: <span className="text-rose-600">{curr} {invoice.dueAmount.toLocaleString()}</span>
                     </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                     <button
                        onClick={handleWalletPay}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none py-4 px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isProcessing ? <Mini5GMicroLoader size={18} /> : <CreditCard size={18} />}
                        Pay via Wallet
                     </button>
                     <button
                        onClick={handleOnlinePay}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none py-4 px-8 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                        {isProcessing ? <Mini5GMicroLoader size={18} /> : <Globe size={18} />}
                        Online Gateway
                     </button>
                  </div>
               </div>
            )}

            {invoice.status === PaymentStatus.PAID && activeView === 'invoice' && (
               <div className="p-8 bg-emerald-500 text-white border-t border-emerald-400 flex items-center justify-center gap-4 print:hidden animate-in slide-in-from-bottom duration-500 shrink-0">
                  <BadgeCheck size={28} />
                  <p className="text-sm font-black uppercase tracking-[0.3em] italic">Invoice Fully Paid & Cleared</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default SubscriberInvoiceViewer;
