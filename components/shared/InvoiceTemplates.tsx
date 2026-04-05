
import React from 'react';
import { ISPUser, Invoice, SystemSettings, Package } from '../../types';
import { CheckCircle, ShieldCheck, Zap, Wallet, MapPin, Phone, Mail, Globe, Hash, Calendar, DollarSign, Award, CreditCard, Activity, User, Wifi } from 'lucide-react';

export type InvoiceTheme = 'ModernSaaS' | 'Minimal' | 'PremiumGradient' | 'Corporate';

interface InvoiceTemplateProps {
  user: ISPUser;
  invoice: Invoice;
  settings: SystemSettings;
  pkg?: Package;
  theme: InvoiceTheme;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ user, invoice, settings, pkg }) => {
  const brandColor = "#2563EB"; // SaaS Blue

  const renderStatusBadge = () => (
    <div className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 ${
      invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
    }`}>
      {invoice.status === 'Paid' ? <CheckCircle size={14} /> : <Zap size={14} />}
      {invoice.status}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-2xl border border-slate-100 rounded-[2.5rem] overflow-hidden text-slate-900">
      
      {/* Header Section */}
      <div className="p-10 md:p-14 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-8 box-border">
         <div className="space-y-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
               {settings.branding.logoSquare ? (
                 <img src={settings.branding.logoSquare} className="w-10 h-10 object-contain brightness-0 invert" alt="Logo" />
               ) : (
                 <Globe size={32} className="text-white" />
               )}
            </div>
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">Click Opticx</h1>
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-2 italic">Premium ISP Services</p>
            </div>
         </div>
         <div className="text-left md:text-right w-full md:w-auto">
            <h2 className="text-4xl font-black text-slate-200 tracking-tighter uppercase italic leading-none mb-4">Invoice</h2>
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Ref</p>
               <p className="text-sm font-black text-slate-900 italic tracking-widest">{invoice.id}</p>
            </div>
            <div className="space-y-1 mt-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Date</p>
               <p className="text-sm font-black text-slate-900 italic tracking-widest">{new Date(invoice.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="mt-6 w-48 ml-auto">
              {renderStatusBadge()}
            </div>
         </div>
      </div>

      {/* Identity Section */}
      <div className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-slate-100 bg-white">
         <div className="space-y-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
               <User size={14} className="text-blue-600" /> Billed To
            </p>
            <div className="space-y-2 border-l-4 border-blue-600 pl-5">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{user.name}</h3>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">ID: {user.id}</p>
            </div>
            <div className="space-y-2.5 pt-2 pl-6 text-xs font-bold text-slate-500">
               <p className="flex items-center gap-3"><MapPin size={14} className="text-slate-400" /> {user.address || 'Address Restricted'}</p>
               <p className="flex items-center gap-3"><Phone size={14} className="text-slate-400" /> {user.phone}</p>
               <p className="flex items-center gap-3"><Mail size={14} className="text-slate-400" /> {user.email || 'N/A'}</p>
            </div>
         </div>

         <div className="space-y-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
               <Activity size={14} className="text-emerald-500" /> Active Subscription
            </p>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-5">
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                  <Wifi size={24} className="text-blue-600" />
               </div>
               <div>
                  <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{pkg?.name || invoice.packageName}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Fiber Link Connection</p>
               </div>
            </div>
            {user.isKYCVerified && (
               <div className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Identity Verified Node</span>
               </div>
            )}
         </div>
      </div>

      {/* Invoice Items Table */}
      <div className="p-10 md:p-14">
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
           <table className="w-full text-left bg-white">
              <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Description</th>
                    <th className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billing Cycle</th>
                    <th className="py-5 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 <tr>
                    <td className="py-6 px-6">
                       <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{invoice.packageName} Subscription</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">High-Speed Internet Access</p>
                    </td>
                    <td className="py-6 px-6 text-center">
                       <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">Monthly</span>
                    </td>
                    <td className="py-6 px-6 text-right font-black text-slate-900 text-lg">
                       <span className="text-sm text-slate-400 mr-1">{settings.currency}</span>{invoice.amount.toLocaleString()}
                    </td>
                 </tr>
                 {invoice.discountAmount > 0 && (
                    <tr className="bg-emerald-50/30">
                       <td className="py-6 px-6">
                          <p className="text-sm font-black text-emerald-600 uppercase italic tracking-tight">Trust/Loyalty Credit</p>
                          <p className="text-[10px] text-emerald-600/70 font-bold uppercase mt-1">Automatic reduction applied</p>
                       </td>
                       <td className="py-6 px-6 text-center">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Applied</span>
                       </td>
                       <td className="py-6 px-6 text-right font-black text-emerald-600 text-lg">
                          -<span className="text-sm text-emerald-500/70 mr-1">{settings.currency}</span>{invoice.discountAmount.toLocaleString()}
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col md:flex-row justify-end mt-8">
           <div className="w-full md:w-80 space-y-4 bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                 <span>Subtotal</span>
                 <span className="font-black text-slate-900 text-sm">{settings.currency} {(invoice.amount + (invoice.discountAmount || 0)).toLocaleString()}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   <span>Discounts</span>
                   <span className="font-black text-emerald-600 text-sm">- {settings.currency} {(invoice.discountAmount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                 <div className="space-y-1">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Total Due</p>
                 </div>
                 <p className="text-3xl font-black text-slate-900 italic tracking-tighter">
                   <span className="text-lg text-slate-400 mr-1">{settings.currency}</span>
                   {(invoice.amount).toLocaleString()}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="bg-slate-900 p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
         <div className="space-y-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Powered by ClickTake Technologies</h4>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Next-Gen ISP Infrastructure & BSS System</p>
         </div>
         <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
               <ShieldCheck size={12} className="text-blue-500" /> SSL Secured
            </div>
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
               <CheckCircle size={12} className="text-emerald-500" /> System Verified
            </div>
         </div>
      </div>
    </div>
  );
};
