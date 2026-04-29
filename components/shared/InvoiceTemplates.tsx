
import React from 'react';
import { ISPUser, Invoice, SystemSettings, Package } from '../../types';
import { CheckCircle, ShieldCheck, Zap, Wallet, MapPin, Phone, Mail, Globe, Hash, Calendar, DollarSign, Award, CreditCard, Activity, User, Wifi, Smartphone } from 'lucide-react';

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
    <div className="font-sans bg-slate-100 p-8 min-h-screen flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
        
        {/* HEADER - SaaS Gradient */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-700 to-blue-600 p-8 md:p-12 text-white relative h-48 md:h-56 flex flex-col justify-end">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none mb-1">Click Opticx</h1>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-60 italic">Powered by ClickTake Technologies</p>
            </div>
            {settings.branding.logoSquare && (
              <img src={settings.branding.logoSquare} className="h-16 md:h-20 object-contain brightness-0 invert opacity-90 drop-shadow-lg" alt="Logo" />
            )}
          </div>
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8 md:p-12 space-y-10">
          
          {/* Invoice Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Invoice</h2>
                  <div className="space-y-1 text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">
                     <p className="flex justify-between"><span>ID:</span> <span className="font-black text-slate-900 italic">#{invoice.id}</span></p>
                     <p className="flex justify-between"><span>Date:</span> <span className="font-black text-slate-900 italic">{new Date(invoice.createdAt).toLocaleDateString()}</span></p>
                     <p className="flex justify-between"><span>Status:</span> <span className={`font-black italic ${invoice.status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>{invoice.status}</span></p>
                  </div>
               </div>
            </div>
            <div className="md:text-right space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full flex flex-col justify-center">
                <div className="space-y-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <p>Activation: <span className="text-slate-700 italic">Fiber Connection</span></p>
                   <p>Billing Cycle: <span className="text-slate-700 italic">Monthly Protocol</span></p>
                </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Identity & Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                  <User size={14} className="text-blue-600" /> Customer Details
               </h3>
               <div className="space-y-1">
                  <p className="text-xl font-black text-slate-900 uppercase italic">{user.name}</p>
                  <p className="text-xs font-bold text-slate-500 lowercase tracking-tight">{user.email}</p>
                  <p className="text-xs font-bold text-slate-500">{user.phone}</p>
                  <p className="text-xs font-bold text-slate-500 italic mt-2 opacity-60 leading-relaxed">{user.address || 'Standard Service Location'}</p>
               </div>
            </div>
            <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                  <Wifi size={14} className="text-blue-600" /> Service Details
               </h3>
               <div className="space-y-1">
                  <p className="text-xl font-black text-slate-900 uppercase italic">Package: {pkg?.name || invoice.packageName}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Speed: {pkg?.speed || 'High Speed'}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start: {user.activationDate ? new Date(user.activationDate).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expiry: {user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'N/A'}</p>
               </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Score</p>
                   <h2 className="text-2xl font-black text-blue-600 italic leading-none">850 / 999</h2>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                   <Award size={20} />
                </div>
             </div>
             <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</p>
                   <h3 className="text-xl font-black text-emerald-600 italic leading-none">✔ Verified</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                   <ShieldCheck size={20} />
                </div>
             </div>
          </div>

          {/* BILLING TABLE */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden mt-4 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Line Item Description</th>
                  <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="p-5 text-sm font-black text-slate-900 uppercase italic tracking-tight">Base Package Subscription Cost</td>
                  <td className="p-5 text-right font-black text-slate-900 text-lg italic tracking-tighter">
                    <span className="text-xs text-slate-400 mr-1">{settings.currency}</span>
                    {(invoice.totalAmount + (invoice.discountAmount || 0)).toLocaleString()}
                  </td>
                </tr>
                {invoice.discountAmount > 0 && (
                  <tr className="bg-emerald-50/20">
                    <td className="p-5">
                       <p className="text-sm font-black text-emerald-600 uppercase italic tracking-tight">System Discount / Loyalty Bonus</p>
                       <p className="text-[10px] font-bold text-emerald-500/60 uppercase">Applied Automatically</p>
                    </td>
                    <td className="p-5 text-right font-black text-emerald-600 text-lg italic tracking-tighter">
                      -<span className="text-xs text-emerald-500/60 mr-1">{settings.currency}</span>
                      {(invoice.discountAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-900 text-white shadow-xl relative overflow-hidden">
                  <td className="p-6">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Final Settlement</p>
                    <span className="text-xl font-black uppercase italic tracking-tighter">Total Payable Total</span>
                  </td>
                  <td className="p-6 text-right">
                    <p className="text-4xl font-black italic tracking-tighter">
                      <span className="text-sm text-blue-400 mr-2">{settings.currency}</span>
                      {(invoice.totalAmount || 0).toLocaleString()}
                    </p>
                  </td>
                  <div className="absolute top-0 right-0 w-24 h-full bg-blue-600/10 skew-x-12 translate-x-12"></div>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="pt-8 text-center space-y-4">
            <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-sm mx-auto">
              Thank you for choosesing <span className="text-blue-600 font-black italic uppercase">Click Opticx</span>. We appreciate your partnership in building a connected future.
            </p>
            <div className="flex items-center justify-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
               <span className="flex items-center gap-1"><Mail size={12} className="text-blue-600"/> support@clickopticx.com</span>
               <span className="flex items-center gap-1"><Smartphone size={12} className="text-blue-600"/> Support Desk Active</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
