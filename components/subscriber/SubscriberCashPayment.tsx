
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
  const [method, setMethod] = useState<'Cash' | 'Bank Transfer'>('Cash');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPkg = state.packages.find(p => p.id === selectedPkgId);
  const taxMultiplier = state.settings.enableTax ? (1 + (state.settings.autoTaxPercentage / 100)) : 1;
  const total = selectedPkg ? Math.round(selectedPkg.price * taxMultiplier) : 0;

  const bankGateway = state.settings.paymentGateways.find(g => g.id === 'bank');
  const bankDetails = bankGateway?.config || {};

  const handleSubmit = async () => {
    if (!selectedPkgId) return;
    setIsSubmitting(true);
    // Fix: Using paymentMethod to match TopupRequest interface
    await db.submitTopupRequest({
      userId: user.id,
      userName: user.name,
      amount: total,
      paymentMethod: method,
      requestType: 'Paid Payment',
      paymentCommitmentDate: new Date().toISOString().split('T')[0],
      note: method === 'Bank Transfer' ? `IBAN: ${bankDetails.iban}. ${note}` : note
    });
    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex gap-3 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm mx-1">
        <button
          onClick={() => setMethod('Cash')}
          className={`flex-1 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${method === 'Cash' ? 'bg-slate-900 text-white shadow-lg' : 'bg-transparent text-slate-400'}`}
        >
          Retail Cash
        </button>
        <button
          onClick={() => setMethod('Bank Transfer')}
          className={`flex-1 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${method === 'Bank Transfer' ? 'bg-slate-900 text-white shadow-lg' : 'bg-transparent text-slate-400'}`}
        >
          Bank Wire
        </button>
      </div>

      <div className="bg-green-50 border border-green-100 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm shrink-0">
          <Banknote size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black text-green-900 uppercase tracking-widest mb-1">{method === 'Cash' ? 'Retail Cash Protocol' : 'Bank Wire Protocol'}</h4>
          <p className="text-[10px] text-green-700 font-bold leading-relaxed uppercase">
            {method === 'Cash'
              ? 'Pay at any authorized regional shop. Show your transaction ID for node verification.'
              : `Transfer exactly Rs. ${total.toLocaleString()} to ${bankDetails.bankName || 'Awaiting Bank'}. Account: ${bankDetails.accountTitle || 'N/A'}. IBAN: ${bankDetails.iban || 'N/A'}.`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choose Service Tier</label>
          <select
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-green-500 transition-all"
            value={selectedPkgId}
            onChange={e => setSelectedPkgId(e.target.value)}
          >
            {state.packages.filter(p => !p.deleted).map(p => (
              <option key={p.id} value={p.id}>{p.name} — {state.settings.currency}{p.price}</option>
            ))}
          </select>
        </div>

        {selectedPkg && (
          <div className="p-6 bg-slate-900 rounded-3xl text-center shadow-xl border-t-4 border-green-500">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
            <p className="text-3xl font-black text-green-400 italic">Rs. {total.toLocaleString()}</p>
            {state.settings.enableTax && (
              <p className="text-[8px] text-slate-500 uppercase mt-2 font-black">Includes {state.settings.autoTaxPercentage}% {state.settings.taxLabel || 'Tax'}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Note (Optional)</label>
          <textarea
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs h-24 outline-none focus:border-green-500"
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
          {isSubmitting ? 'Synchronizing Registry...' : <ShieldCheck size={18} />}
          Initialize Registry Commitment
        </button>
      </div>
    </div>
  );
};

export default SubscriberCashPayment;

