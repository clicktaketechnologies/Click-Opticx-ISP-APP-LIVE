
import React, { useState, useMemo } from 'react';
import { Invoice, AppState, PaymentStatus, LedgerType } from '../../types';
import { 
  X, Printer, Download, CreditCard, ShieldCheck, 
  Info, Landmark, Globe, Activity, FileText, CheckCircle, Wallet, Loader2,
  History, ArrowRightLeft, User, ShieldAlert
} from 'lucide-react';
import { db } from '../../db';

interface Props {
  invoice: Invoice;
  state: AppState;
  onClose: () => void;
  onPaid: () => void;
}

const SubscriberInvoiceViewer: React.FC<Props> = ({ invoice, state, onClose, onPaid }) => {
  const [activeView, setActiveView] = useState<'invoice' | 'history'>('invoice');
  const [isProcessing, setIsProcessing] = useState(false);
  const branding = state.settings.branding;
  const b = state.settings.invoiceBranding;

  // Relationally map related payments/ledger entries
  const relatedHistory = useMemo(() => {
    return state.ledger
      .filter(l => l.description.includes(invoice.id))
      .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.ledger, invoice.id]);

  const displayLogo = branding.logoLight || branding.logoDark || branding.logoSquare;

  const handlePrint = () => {
    window.print();
  };

  const handleWalletPay = async () => {
    if (confirm('AUTHORIZE SETTLEMENT: Use your available Wallet Balance to clear this invoice?')) {
      setIsProcessing(true);
      try {
        const res = await db.payInvoiceWithWallet(invoice.id);
        if (res.success) {
          // Fixed: Added invoice.userId as targetId to db.logNotification call
          db.logNotification(invoice.userId, 'success', 'Fiscal Settlement', `Invoice ${invoice.id} cleared via Wallet Balance.`);
          onPaid();
        } else {
          alert(res.message);
        }
      } catch (err) {
        alert("Settlement Error: Handshake with ledger node failed.");
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
          // Fixed: Added invoice.userId as targetId to db.logNotification call
          db.logNotification(invoice.userId, 'success', 'Digital Handshake', `Payment for ${invoice.id} verified via Online Gateway.`);
          onPaid();
        }
      } catch (err) {
        alert("Gateway Error: Remote node rejected the transaction.");
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:m-0 print:rounded-none h-[90vh]">
        
        {/* Actions Header (Hidden in Print) */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden shrink-0">
           <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setActiveView('invoice')}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'invoice' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                Document
              </button>
              <button 
                onClick={() => setActiveView('history')}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <History size={14}/> Audit Trail
              </button>
           </div>
           <div className="flex gap-2">
              <button onClick={handlePrint} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest">
                <Printer size={16}/> Print / PDF
              </button>
              <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={20}/></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {activeView === 'invoice' ? (
            <div className="p-8 md:p-12 space-y-12 bg-white">
               {/* Document Header */}
               <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                  <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800 shadow-xl">
                           {displayLogo ? (
                             <img src={displayLogo} alt="Business Logo" className="w-full h-full object-contain p-2" />
                           ) : (
                             <FileText className="text-indigo-400" size={32} />
                           )}
                        </div>
                        <div>
                           <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900">{branding.businessName}</h1>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">{state.settings.profile.tagline}</p>
                        </div>
                     </div>
                     <div className="space-y-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        <p className="flex items-center gap-2"><Globe size={10} className="text-blue-500"/> {state.settings.digitalPresence.website || 'Official Website'}</p>
                        <p className="flex items-center gap-2"><Landmark size={10} className="text-blue-500"/> {state.settings.profile.headOffice}</p>
                        <p className="flex items-center gap-2"><Info size={10} className="text-blue-500"/> Tax Reg: {state.settings.taxId || 'N/A'}</p>
                     </div>
                  </div>
                  <div className="text-right space-y-2">
                     <h2 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">{b.headerText}</h2>
                     <p className="text-lg font-black text-indigo-600 italic">#{invoice.id}</p>
                     <div className="pt-4 space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Issued: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                     </div>
                  </div>
               </div>

               <hr className="border-slate-100" />

               {/* Client vs Summary */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Billing Information</h4>
                     <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900 uppercase italic leading-none">{invoice.userName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {invoice.userId}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                          {state.users.find(u => u.id === invoice.userId)?.address || 'Service Location On File'}
                        </p>
                     </div>
                  </div>
                  <div className={`rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl transition-all duration-500 ${invoice.status === PaymentStatus.PAID ? 'bg-emerald-600' : 'bg-slate-900'}`}>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Total Amount Payable</p>
                        <h3 className="text-5xl font-black italic tracking-tighter text-white">Rs. {invoice.totalAmount.toLocaleString()}</h3>
                        <div className="mt-6 flex items-center gap-3">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${invoice.status === PaymentStatus.PAID ? 'bg-white/20 text-white border-white/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/20 animate-pulse'}`}>
                              {invoice.status}
                           </span>
                           {invoice.paidAt && <p className="text-[9px] font-bold text-white/60 uppercase">Settled: {new Date(invoice.paidAt).toLocaleDateString()}</p>}
                        </div>
                     </div>
                     <Activity className="absolute -right-8 -bottom-8 opacity-5" size={140} />
                  </div>
               </div>

               {/* Line Items Table */}
               <div className="space-y-4">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 border-y border-slate-100">
                           <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Line Total</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {invoice.items.map(item => (
                             <tr key={item.id}>
                                <td className="px-6 py-5">
                                   <p className="font-black text-slate-800 uppercase text-xs">{item.description}</p>
                                   <span className="text-[9px] text-slate-400 font-bold uppercase">{item.category}</span>
                                </td>
                                <td className="px-6 py-5 text-center font-bold text-xs text-slate-600">{item.quantity}</td>
                                <td className="px-6 py-5 text-right font-bold text-xs text-slate-600">Rs. {item.unitPrice.toLocaleString()}</td>
                                <td className="px-6 py-5 text-right font-black text-slate-900 text-sm italic">Rs. {item.total.toLocaleString()}</td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {/* Calculations Footer */}
                  <div className="flex justify-end pt-6">
                     <div className="w-full md:w-80 space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                           <span>Subtotal</span>
                           <span>Rs. {invoice.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                           <span>Tax ({invoice.taxRate}%)</span>
                           <span>Rs. {invoice.taxAmount.toLocaleString()}</span>
                        </div>
                        {invoice.discountAmount > 0 && (
                          <div className="flex justify-between items-center text-xs font-bold text-rose-500 uppercase tracking-widest">
                             <span>Discount Protocol</span>
                             <span>- Rs. {invoice.discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="h-px bg-slate-100"></div>
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-black text-slate-900 uppercase italic">Grand Total</span>
                           <span className="text-2xl font-black text-slate-900 italic tracking-tighter">Rs. {invoice.totalAmount.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Legal and Terms */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Terms & Conditions</h4>
                     <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase whitespace-pre-wrap">{b.terms || 'Payment due on receipt. Service suspension occurs 48 hours after due date.'}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end justify-center text-center md:text-right space-y-4">
                     {b.authorizedSignature ? (
                        <div className="w-40 h-16 border-b-2 border-slate-900 p-2">
                           <img src={b.authorizedSignature} className="w-full h-full object-contain grayscale" alt="Signature" />
                        </div>
                     ) : (
                        <div className="w-40 h-16 border-b-2 border-slate-200"></div>
                     )}
                     <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorized Handshake</p>
                     <p className="text-[8px] text-slate-400 uppercase font-bold">{b.footerDisclaimer}</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="p-12 space-y-8 animate-in fade-in duration-500">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border">
                     <History size={24}/>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase text-slate-900">Fiscal Audit Trail</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Transactions associated with {invoice.id}</p>
                  </div>
               </div>

               <div className="space-y-3">
                  {relatedHistory.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4 bg-slate-50 rounded-[2.5rem] border border-dashed">
                       <ArrowRightLeft size={48} className="text-slate-200" />
                       <p className="text-[10px] font-black text-slate-400 uppercase">No ledger events found for this reference.</p>
                    </div>
                  ) : (
                    relatedHistory.map(l => (
                      <div key={l.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:shadow-xl transition-all">
                         <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${l.type === LedgerType.DEBIT ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                               <Activity size={24} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{l.description}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(l.timestamp).toLocaleString()} • {l.method || 'System Internal'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className={`text-lg font-black italic tracking-tighter ${l.type === LedgerType.DEBIT ? 'text-red-600' : 'text-emerald-600'}`}>
                               {l.type === LedgerType.DEBIT ? '-' : '+'} Rs. {l.amount.toLocaleString()}
                            </p>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Audit Balanced</p>
                         </div>
                      </div>
                    ))
                  )}
               </div>

               <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
                  <ShieldAlert size={24} className="text-blue-600 shrink-0 mt-1" />
                  <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase tracking-tighter">
                     This audit log represents all real-time ledger transformations triggered by this invoice identity. Discrepancies should be verified against regional gateway nodes.
                  </p>
               </div>
            </div>
          )}
        </div>

        {/* Payment Logic (Hidden in Print) */}
        {invoice.status !== PaymentStatus.PAID && activeView === 'invoice' && (
           <div className="p-10 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row gap-6 items-center justify-between print:hidden shrink-0">
              <div className="space-y-1 text-center md:text-left">
                 <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter">Settlement Handshake</p>
                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Authorize this transaction via regional nodes</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                 <button 
                  onClick={handleWalletPay}
                  disabled={isProcessing}
                  className="flex-1 md:flex-none py-4 px-8 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Wallet size={16}/>}
                    Settle via Wallet
                 </button>
                 <button 
                  onClick={handleOnlinePay}
                  disabled={isProcessing}
                  className="flex-1 md:flex-none py-4 px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Globe size={16}/>}
                    Pay with Online Payment
                 </button>
              </div>
           </div>
        )}

        {invoice.status === PaymentStatus.PAID && activeView === 'invoice' && (
          <div className="p-10 bg-emerald-50 border-t border-emerald-100 flex items-center justify-center gap-4 print:hidden animate-in fade-in duration-500 shrink-0">
             <CheckCircle className="text-emerald-600" size={24} />
             <p className="text-[11px] font-black text-emerald-900 uppercase tracking-widest">Receipt Verified & Settle Registry Dispatched</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriberInvoiceViewer;
