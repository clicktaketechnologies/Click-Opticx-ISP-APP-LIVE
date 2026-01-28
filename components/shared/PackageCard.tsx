
import React, { useState, useEffect, useMemo } from 'react';
import { Package, PackageRequest, PaymentStatus } from '../../types';
import { 
  ArrowDown, ArrowUp, Zap, Clock, Package as PackageIcon, 
  ChevronDown, ChevronUp, Edit2, Ban, 
  CheckCircle, Star, Timer, Lock, Loader2
} from 'lucide-react';
import { db } from '../../db';

interface PackageCardProps {
  pkg: Package;
  mode: 'user' | 'admin';
  isActive?: boolean;
  onAction: (pkg: Package) => void;
  onEdit?: (pkg: Package) => void;
  onToggleStatus?: (pkgId: string) => void;
  currency: string;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  pkg, mode, isActive, 
  onAction, onEdit, onToggleStatus, currency 
}) => {
  const state = db.getState();
  const userId = state.currentUser?.id;
  
  const isThisPackageRequested = useMemo(() => {
    if (mode === 'admin' || !userId) return false;
    const req = db.getPendingUniversalRequest(userId);
    return req && 'packageId' in req && (req as PackageRequest).packageId === pkg.id;
  }, [state.packageRequests, pkg.id, mode, userId]);

  const hasAnyPendingPackageRequest = useMemo(() => {
    if (mode === 'admin' || !userId) return false;
    const req = db.getPendingUniversalRequest(userId);
    return req && 'packageId' in req;
  }, [state.packageRequests, mode, userId]);

  const finalPrice = pkg.discountPrice || pkg.price;
  const hasDiscount = !!pkg.discountPrice && pkg.discountPrice < pkg.price;
  const discountPercent = hasDiscount ? Math.round(((pkg.price - pkg.discountPrice!) / pkg.price) * 100) : 0;

  const badge = pkg.deleted ? { label: 'Disabled', color: 'bg-rose-100 text-rose-700 border-rose-200' } :
                isThisPackageRequested ? { label: 'Verifying...', color: 'bg-orange-100 text-orange-700 border-orange-200' } :
                isActive ? { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' } :
                { label: 'Ready', color: 'bg-blue-100 text-blue-700 border-blue-200' };

  return (
    <div className={`group relative bg-white rounded-[2rem] border-2 transition-all duration-500 overflow-hidden flex flex-col ${
      isActive ? 'border-emerald-500 shadow-xl scale-[1.01]' : 
      isThisPackageRequested ? 'border-orange-400 shadow-lg' : 'border-slate-100 shadow-sm'
    }`}>
      
      {pkg.isRecommended && !isActive && !isThisPackageRequested && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-8 py-2 rotate-45 translate-x-8 translate-y-3 shadow-lg border-b-2 border-blue-400">
            Recommended
          </div>
        </div>
      )}

      <div className="p-6 pb-2 flex justify-between items-start shrink-0 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{pkg.name}</h3>
              {hasDiscount && <span className="bg-rose-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded">-{discountPercent}%</span>}
           </div>
           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{pkg.subtitle || 'Registry Protocol'}</p>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-widest ${badge.color}`}>
          {badge.label}
        </div>
      </div>

      <div className="p-6 py-4 grid grid-cols-2 gap-4 border-b border-slate-50">
         <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
               <ArrowDown size={12} strokeWidth={3} />
               <span className="text-[8px] font-black uppercase tracking-widest">Down</span>
            </div>
            <div className="flex items-baseline gap-0.5">
               <span className="text-2xl font-black text-slate-900 tracking-tighter italic">{pkg.speed.split(' ')[0]}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase">M</span>
            </div>
         </div>
         <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
               <ArrowUp size={12} strokeWidth={3} />
               <span className="text-[8px] font-black uppercase tracking-widest">Up</span>
            </div>
            <div className="flex items-baseline gap-0.5">
               <span className="text-2xl font-black text-slate-900 tracking-tighter italic">{pkg.uploadSpeed?.split(' ')[0] || '0'}</span>
               <span className="text-[8px] font-black text-slate-400 uppercase">M</span>
            </div>
         </div>
      </div>

      <div className="p-6 pt-4 mt-auto space-y-5">
         <div className="flex items-end justify-between">
            <div>
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">Authorized Value</p>
               <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black tracking-tighter ${isActive ? 'text-emerald-600' : 'text-slate-900'}`}>{currency} {finalPrice.toLocaleString()}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase">/ cycle</span>
               </div>
            </div>
         </div>

         {mode === 'user' ? (
           isActive ? (
             <div className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border-b-4 border-emerald-700 animate-in fade-in">
               <CheckCircle size={14} strokeWidth={3} /> ACTIVE TIER
             </div>
           ) : isThisPackageRequested ? (
             <div className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 border-b-4 border-orange-600 animate-pulse">
               <Clock size={14} strokeWidth={3} /> VERIFYING
             </div>
           ) : (
             <button onClick={() => onAction(pkg)} disabled={pkg.deleted || hasAnyPendingPackageRequest} className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${hasAnyPendingPackageRequest ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}>
                <Zap size={14} fill="currentColor" /> ACTIVATE
             </button>
           )
         ) : (
           <div className="flex gap-2 w-full">
              <button onClick={() => onEdit && onEdit(pkg)} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest">Edit</button>
              <button onClick={() => onToggleStatus && onToggleStatus(pkg.id)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest ${pkg.deleted ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{pkg.deleted ? 'Restore' : 'Retire'}</button>
           </div>
         )}
      </div>
    </div>
  );
};

export default PackageCard;
