
import React, { useState } from 'react';
import { AppState, ISPUser, Package } from '../../types';
import { db } from '../../db';
import { Banknote, CheckCircle, Info, ChevronRight, Calculator, ShieldCheck } from 'lucide-react';

interface Props {
  user: ISPUser;
  state: AppState;
  onSuccess: () => void;
}

const SubscriberCashPayment: React.FC<Props> = ({ user, state, onSuccess }) => {
  const [selectedPkgId, setSelectedPkgId] = useState(user.packageId || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPkg = state.packages.find(p => p.id === selectedPkgId);
  const total = selectedPkg ? Math.round(selectedPkg.price * (1 + (state.settings.autoTaxPercentage / 100))) : 0;

  const handleSubmit = async () => {
    if (!selectedPkgId) return;
    setIsSubmitting(true);
    // Fix: Using paymentMethod to match TopupRequest interface
    await db.submitTopupRequest({
      userId: user.id,
      userName: user.name,
      amount: total,
      paymentMethod: 'Cash',
      requestType: 'Paid Payment',
      paymentCommitmentDate: new Date().toISOString().split('T')[0]
    });
    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
          <Banknote size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1">Retail Cash Protocol</h4>
          <p className="text-[10px] text-emerald-700 font-bold leading-relaxed uppercase">
            Pay at any authorized regional shop. After submission, show your transaction ID to the shopkeeper for node verification.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choose Service Tier</label>
          <select 
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500 transition-all"
            value={selectedPkgId}
            onChange={e => setSelectedPkgId(e.target.value)}
          >
            {state.packages.filter(p => !p.deleted).map(p => (
              <option key={p.id} value={p.id}>{p.name} — {state.settings.currency}{p.price}</option>
            ))}
          </select>
        </div>

        {selectedPkg && (
          <div className="p-6 bg-slate-900 rounded-3xl text-center shadow-xl border-t-4 border-emerald-500">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
            <p className="text-3xl font-black text-emerald-400 italic">Rs. {total.toLocaleString()}</p>
            <p className="text-[8px] text-slate-500 uppercase mt-2 font-black">Includes {state.settings.autoTaxPercentage}% Regulatory Tax</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Note (Optional)</label>
          <textarea 
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs h-24 outline-none focus:border-emerald-500"
            placeholder="e.g. Paid at Gulshan Branch..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!selectedPkgId || isSubmitting}
          className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? 'Synchronizing...' : <ShieldCheck size={18} />}
          Commit Cash Payment
        </button>
      </div>
    </div>
  );
};

export default SubscriberCashPayment;
