
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
  isExpiringSoon?: boolean;
  onAction: (pkg: Package) => void;
  onEdit?: (pkg: Package) => void;
  onToggleStatus?: (pkgId: string) => void;
  currency: string;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  pkg, mode, isActive, isExpiringSoon, 
  onAction, onEdit, onToggleStatus, currency 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const state = db.getState();
  const userId = state.currentUser?.id;
  
  // 1. Check if THIS specific package is currently being requested
  const isThisPackageRequested = useMemo(() => {
    if (mode === 'admin' || !userId) return false;
    const req = db.getPendingUniversalRequest(userId);
    return req && 'packageId' in req && (req as PackageRequest).packageId === pkg.id;
  }, [state.packageRequests, pkg.id, mode, userId]);

  // 2. Check if ANY package request is pending (to block other actions)
  const hasAnyPendingPackageRequest = useMemo(() => {
    if (mode === 'admin' || !userId) return false;
    const req = db.getPendingUniversalRequest(userId);
    return req && 'packageId' in req;
  }, [state.packageRequests, mode, userId]);

  useEffect(() => {
    if (!pkg.discountExpiry) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(pkg.discountExpiry!).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [pkg.discountExpiry]);

  const finalPrice = pkg.discountPrice || pkg.price;
  const hasDiscount = !!pkg.discountPrice && pkg.discountPrice < pkg.price;
  const discountPercent = hasDiscount ? Math.round(((pkg.price - pkg.discountPrice!) / pkg.price) * 100) : 0;

  const getStatusBadge = () => {
    if (pkg.deleted) return { label: 'Disabled', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (isThisPackageRequested) return { label: 'Verifying...', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    if (isActive) return { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' };
    return { label: 'Available', color: 'bg-blue-100 text-blue-700 border-blue-200' };
  };

  const badge = getStatusBadge();

  return (
    <div className={`group relative bg-white rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden flex flex-col ${
      isActive 
        ? 'border-green-500 shadow-2xl shadow-green-100 scale-[1.02] z-10' 
        : isThisPackageRequested
        ? 'border-orange-400 shadow-xl shadow-orange-50'
        : 'border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-xl'
    }`}>
      
      {/* Recommended Ribbon */}
      {pkg.isRecommended && !isActive && !isThisPackageRequested && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-8 py-2 rotate-45 translate-x-8 translate-y-3 shadow-lg flex items-center gap-1.5 border-b-2 border-blue-400">
            <Star size={10} fill="currentColor" /> Recommended
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="p-8 pb-4 flex justify-between items-start shrink-0 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{pkg.name}</h3>
              {hasDiscount && (
                <div className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-sm border border-rose-500">
                  -{discountPercent}% OFF
                </div>
              )}
           </div>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
             {pkg.subtitle || 'Reliable internet for everyday use'}
           </p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm ${badge.color}`}>
          {badge.label}
        </div>
      </div>

      {/* Speed Metrics */}
      <div className="p-8 py-4 grid grid-cols-2 gap-6 border-b border-slate-50">
         <div className="flex flex-col items-center p-4 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
               <ArrowDown size={14} strokeWidth={3} />
               <span className="text-[9px] font-black uppercase tracking-widest">Down</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{pkg.speed.split(' ')[0]}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase">Mbps</span>
            </div>
         </div>
         <div className="flex flex-col items-center p-4 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
               <ArrowUp size={14} strokeWidth={3} />
               <span className="text-[9px] font-black uppercase tracking-widest">Up</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-slate-900 tracking-tighter italic">{pkg.uploadSpeed?.split(' ')[0] || '0'}</span>
               <span className="text-[10px] font-black text-slate-400 uppercase">Mbps</span>
            </div>
         </div>
      </div>

      {/* Pricing & Actions */}
      <div className="p-8 pt-6 mt-auto flex flex-col gap-6">
         <div className="flex items-end justify-between border-t border-slate-100 pt-6">
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Price</p>
               <div className="flex flex-col">
                  {hasDiscount && !isActive && (
                    <span className="text-sm font-black text-slate-300 line-through tracking-tighter decoration-rose-400/50">
                      {currency} {(pkg.price || 0).toLocaleString()}
                    </span>
                  )}
                  <div className="flex items-baseline gap-1">
                     <span className={`text-4xl font-black tracking-tighter ${isActive ? 'text-green-600' : 'text-slate-900'}`}>{currency} {finalPrice.toLocaleString()}</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase">/ cycle</span>
                  </div>
               </div>
            </div>
         </div>

         {/* STRICT STATUS-DRIVEN ACTION BUTTONS */}
         <div className="flex flex-col gap-2">
            {mode === 'user' ? (
              <>
                {isActive ? (
                  /* 🟢 STATE 3: PACKAGE ACTIVATED (SUCCESS) */
                  <div className="w-full py-5 bg-green-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-green-200 flex items-center justify-center gap-3 border-b-4 border-green-700 animate-in fade-in duration-500">
                    <CheckCircle size={18} strokeWidth={3} />
                    CURRENT PACKAGE
                  </div>
                ) : isThisPackageRequested ? (
                  /* 🟠 STATE 2: REQUEST SENT / UNDER VERIFICATION */
                  <div className="w-full py-5 bg-orange-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-orange-100 flex items-center justify-center gap-3 border-b-4 border-orange-600 animate-pulse cursor-not-allowed">
                    <Clock size={18} strokeWidth={3} className="animate-spin-slow" />
                    ACTIVATION PENDING
                  </div>
                ) : (
                  /* 🔵 STATE 1: DEFAULT STATE – NOT REQUESTED */
                  <button 
                    onClick={() => onAction(pkg)}
                    disabled={pkg.deleted || hasAnyPendingPackageRequest}
                    className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                      hasAnyPendingPackageRequest 
                      ? 'bg-slate-100 text-slate-300 border-2 border-slate-200 cursor-not-allowed shadow-none grayscale opacity-50' 
                      : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
                    }`}
                  >
                    {hasAnyPendingPackageRequest ? (
                      <><Lock size={18} /> ACTIVATION LOCKED</>
                    ) : (
                      <><Zap size={18} /> ACTIVATE PACKAGE</>
                    )}
                  </button>
                )}
                
                {hasAnyPendingPackageRequest && !isThisPackageRequested && !isActive && (
                   <p className="text-[7px] font-black text-rose-500 uppercase text-center mt-2 tracking-[0.3em]">
                     You already have a pending package activation.
                   </p>
                )}
              </>
            ) : (
              <div className="flex gap-2 w-full">
                 <button onClick={() => onEdit && onEdit(pkg)} className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 border border-blue-100 flex items-center justify-center gap-2">
                    <Edit2 size={14} /> Edit
                 </button>
                 <button onClick={() => onToggleStatus && onToggleStatus(pkg.id)} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border ${pkg.deleted ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white'}`}>
                    {pkg.deleted ? <CheckCircle size={14} /> : <Ban size={14} />}
                    {pkg.deleted ? 'Restore' : 'Retire'}
                 </button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default PackageCard;

