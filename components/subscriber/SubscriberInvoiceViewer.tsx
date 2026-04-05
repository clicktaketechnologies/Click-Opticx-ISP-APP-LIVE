import { Mini5GMicroLoader } from '../Mini5GMicroLoader';
import React, { useState, useMemo, useRef } from 'react';
import { Invoice, AppState, PaymentStatus, LedgerType, UserStatus } from '../../types';
import {
   X, Printer, Download, CreditCard, ShieldCheck,
   Info, Landmark, Globe, Activity, FileText, CheckCircle, Wallet, Loader2,
   History, ArrowRightLeft, User, ShieldAlert, BadgeCheck, Calendar, TrendingUp,
   Wifi, Zap, ShoppingBag, Receipt, AlertTriangle, Phone, MapPin,
   Package, Hash, Clock, Building2
} from 'lucide-react';
import { db } from '../../db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Modal from '../shared/Modal';

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
      ? 'bg-green-50 border-green-200 text-green-700'
      : invoice.status === PaymentStatus.OVERDUE
         ? 'bg-rose-50 border-rose-200 text-rose-700'
         : 'bg-amber-50 border-amber-200 text-amber-700';

   return (
      <Modal
         isOpen={true}
         onClose={onClose}
         title="Fiscal Artifact"
         type="info"
         icon={<Receipt size={24} className="text-white" />}
         maxWidth="max-w-5xl"
         footer={
            invoice.status !== PaymentStatus.PAID && activeView === 'invoice' ? (
               <div className="flex flex-col md:flex-row gap-6 items-center justify-between w-full">
                  <div>
                     <p className="text-base font-black text-slate-950 uppercase italic tracking-tighter flex items-center gap-2">
                        <Wallet size={18} className="text-blue-600" /> Payment Required
                     </p>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        Amount Due: <span className="text-rose-600">{curr} {invoice.dueAmount.toLocaleString()}</span>
                     </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                     <button
                        onClick={handleWalletPay}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none py-4 px-8 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
            ) : invoice.status === PaymentStatus.PAID && activeView === 'invoice' ? (
               <div className="w-full flex items-center justify-center gap-4 text-green-600 font-black uppercase tracking-[0.3em] italic">
                  <BadgeCheck size={28} />
                  <span>Invoice Fully Paid & Cleared</span>
               </div>
            ) : (
               <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <ShieldCheck size={14} className="text-blue-500" /> End-to-End Cryptographic Audit
               </div>
            )
         }
      >
         <div className="space-y-6">
            {/* Nav Header */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit">
               <button
                  onClick={() => setActiveView('invoice')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'invoice' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <FileText size={14} /> Invoice View
               </button>
               <button
                  onClick={() => setActiveView('history')}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'history' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  <History size={14} /> Audit Trail
               </button>
            </div>

            <div className="flex-1">
               {activeView === 'invoice' ? (
                  <div className="space-y-6">
                     <div className="flex justify-end gap-2 print:hidden">
                        <button
                           onClick={handleDownloadPDF}
                           disabled={isGeneratingPDF}
                           className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
                        >
                           {isGeneratingPDF ? <Mini5GMicroLoader size={14} /> : <Download size={14} />}
                           Download PDF
                        </button>
                        <button
                           onClick={() => window.print()}
                           className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest"
                        >
                           <Printer size={14} /> Print
                        </button>
                     </div>

                     <div ref={invoiceRef} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-10 space-y-10">
                        {/* Header Section */}
                        <div className="flex justify-between items-start">
                           <div className="flex gap-4">
                              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center p-2">
                                 {displayLogo ? <img src={displayLogo} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/favicon.png'; }} /> : <img src="/favicon.png" className="w-[80%] h-[80%] object-contain" alt="Logo" />}
                              </div>
                              <div>
                                 <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">{branding.businessName}</h2>
                                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{state.settings.profile.tagline}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest mb-4 inline-block ${statusColor}`}>
                                 {invoice.status}
                              </div>
                              <p className="text-lg font-black italic text-slate-900">INC-#{invoice.id}</p>
                           </div>
                        </div>

                        {/* Subscriber Info */}
                        <div className="grid grid-cols-2 gap-8">
                           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Billing To</h4>
                              <div>
                                 <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{invoice.userName}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref Node: {invoice.userId.slice(0, 8)}</p>
                              </div>
                           </div>
                           <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl">
                              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Service Node</h4>
                              <div>
                                 <p className="text-lg font-black text-white uppercase italic tracking-tighter">{userPackage?.name || 'Legacy Plan'}</p>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Protocol: {user?.connectionId}</p>
                              </div>
                           </div>
                        </div>

                        {/* Items Table - Minimal Version for Modal */}
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Line Items</h4>
                           <div className="space-y-2">
                              {invoice.items.map(item => (
                                 <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><ShoppingBag size={14} /></div>
                                       <div>
                                          <p className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{item.description}</p>
                                          <p className="text-[8px] text-slate-400 font-bold uppercase">{item.category}</p>
                                       </div>
                                    </div>
                                    <p className="text-sm font-black italic text-slate-900">{curr} {item.total.toLocaleString()}</p>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Calculation Total */}
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Registry Total</p>
                              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Including all applicable taxes and node fees</p>
                           </div>
                           <div className="text-right">
                              <p className="text-4xl font-black italic tracking-tighter text-slate-950">{curr} {invoice.totalAmount.toLocaleString()}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                     {relatedHistory.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                           <ArrowRightLeft size={48} className="text-slate-200" />
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">No registry events found.</p>
                        </div>
                     ) : (
                        relatedHistory.map(l => (
                           <div key={l.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:shadow-lg hover:border-blue-100 transition-all">
                              <div className="flex items-center gap-5">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${l.type === LedgerType.DEBIT ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                    <Activity size={22} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">{l.description}</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(l.timestamp).toLocaleString()} • {l.method || 'System'}</p>
                                 </div>
                              </div>
                              <p className={`text-xl font-black italic tracking-tighter ${l.type === LedgerType.DEBIT ? 'text-red-600' : 'text-green-600'}`}>
                                 {l.type === LedgerType.DEBIT ? '-' : '+'} {curr} {l.amount.toLocaleString()}
                              </p>
                           </div>
                        ))
                     )}
                  </div>
               )}
            </div>
         </div>
      </Modal>
   );
};

export default SubscriberInvoiceViewer;

