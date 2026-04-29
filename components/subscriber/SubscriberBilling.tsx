
import React, { useMemo } from 'react';
import { ISPUser, AppState, LedgerType, Invoice } from '../../types';
import { ArrowRight, Receipt, History, FileText, ChevronRight, Download } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onViewInvoice: (inv: Invoice) => void;
}

const SubscriberBilling: React.FC<Props> = ({ user, state, onViewInvoice }) => {
  const ledger = state.ledger
    .filter(l => l.userId === user.id)
    .sort((a,b) => b.timestamp.localeCompare(a.timestamp));

  const invoices = useMemo(() => 
    state.invoices.filter(i => i.userId === user.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)),
  [state.invoices, user.id]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      {/* Official Invoices Section */}
      <div className="space-y-4">
        <div className="px-2 flex justify-between items-end">
           <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Fiscal Registry</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Official commercial documents</p>
           </div>
           <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">{invoices.length} Documents</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
           {invoices.length === 0 ? (
             <div className="p-16 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <FileText size={40} className="text-slate-100 mx-auto mb-4" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No commercial invoices generated for this node.</p>
             </div>
           ) : (
             invoices.map(inv => (
               <button 
                key={inv.id}
                onClick={() => onViewInvoice(inv)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-blue-500 hover:shadow-xl transition-all group active:scale-95 text-left"
               >
                  <div className="flex items-center gap-5">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${inv.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'}`}>
                        <FileText size={24} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Ref: {inv.id}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{inv.packageName} • {new Date(inv.createdAt).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase ${inv.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{inv.status}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase">Items: {inv.items?.length || 0}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <p className="text-lg font-black italic text-slate-900 tracking-tighter">Rs. {inv.totalAmount.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Grand Total</p>
                     </div>
                     <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
               </button>
             ))
           )}
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="px-2">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Handshake Audit</h3>
           <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Full transaction ledger trail</p>
        </div>

        <div className="space-y-3">
          {ledger.map(l => (
            <div key={l.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${l.type === LedgerType.DEBIT ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                     <ArrowRight className={l.type === LedgerType.DEBIT ? 'rotate-45' : '-rotate-[135deg]'} size={20} />
                  </div>
                  <div>
                     <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[180px] md:max-w-full">{l.description}</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(l.timestamp).toLocaleDateString()} • {l.method || 'Internal'}</p>
                  </div>
               </div>
               <p className={`text-lg font-black italic tracking-tighter ${l.type === LedgerType.DEBIT ? 'text-red-600' : 'text-green-600'}`}>
                  {l.type === LedgerType.DEBIT ? '-' : '+'} {l.amount}
               </p>
            </div>
          ))}

          {ledger.length === 0 && (
            <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
               <History size={48} className="text-slate-100 mx-auto mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transaction records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriberBilling;

