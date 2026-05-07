import React, { useState, useMemo } from 'react';
import { 
  Calculator, Coins, Gem, Landmark, Wallet, 
  TrendingUp, Info, AlertCircle, ChevronRight, CheckCircle2 
} from 'lucide-react';

const SubscriberZakat: React.FC = () => {
  const [cash, setCash] = useState<number>(0);
  const [gold, setGold] = useState<number>(0);
  const [silver, setSilver] = useState<number>(0);
  const [investments, setInvestments] = useState<number>(0);
  const [debts, setDebts] = useState<number>(0);

  // Simplified Nisab Values (Should ideally fetch from API)
  const GOLD_PRICE_GRAM = 18000; // PKR approx
  const SILVER_PRICE_GRAM = 2500; // PKR approx
  const NISAB_GOLD = 87.48 * GOLD_PRICE_GRAM;
  const NISAB_SILVER = 612.36 * SILVER_PRICE_GRAM;

  const totalWealth = useMemo(() => {
    return cash + (gold * GOLD_PRICE_GRAM) + (silver * SILVER_PRICE_GRAM) + investments - debts;
  }, [cash, gold, silver, investments, debts]);

  const isEligible = totalWealth >= NISAB_SILVER;
  const zakatPayable = isEligible ? totalWealth * 0.025 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      {/* Header section */}
      <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2 italic">Financial Obligation</p>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase">Zakat Calculator</h2>
            </div>
            <div className="w-14 h-14 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Calculator size={28} />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 text-center space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Payable Zakat</p>
            <h1 className="text-5xl font-black text-white italic tracking-tighter tabular-nums">
              {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(zakatPayable)}
            </h1>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mt-4 ${isEligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              {isEligible ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {isEligible ? 'Nisab Threshold Met' : 'Below Nisab Threshold'}
            </div>
          </div>
        </div>
        <Landmark className="absolute -right-16 -bottom-16 text-white opacity-[0.03] pointer-events-none" size={320} />
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Wallet size={20} />
             </div>
             <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Liquid Assets</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cash in Hand / Bank (PKR)</label>
              <input 
                type="number" 
                value={cash || ''} 
                onChange={(e) => setCash(Number(e.target.value))}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gold (Grams)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={gold || ''} 
                    onChange={(e) => setGold(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none pl-12"
                    placeholder="0"
                  />
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Silver (Grams)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={silver || ''} 
                    onChange={(e) => setSilver(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none pl-12"
                    placeholder="0"
                  />
                  <Gem className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
             </div>
             <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Liabilities & Others</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Investments (PKR)</label>
              <input 
                type="number" 
                value={investments || ''} 
                onChange={(e) => setInvestments(Number(e.target.value))}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1">Debts to Pay (PKR)</label>
              <input 
                type="number" 
                value={debts || ''} 
                onChange={(e) => setDebts(Number(e.target.value))}
                className="w-full bg-rose-50/30 border-2 border-rose-50/50 rounded-2xl p-4 font-black text-rose-900 focus:border-rose-600 focus:bg-white transition-all outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-900 rounded-[2rem] p-6 flex items-start gap-4 text-white shadow-xl">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <Info size={20} className="text-blue-400" />
        </div>
        <div className="space-y-2">
          <h5 className="text-[11px] font-black uppercase italic tracking-widest">About Zakat Calculation</h5>
          <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
            Zakat is 2.5% of your total net wealth if it exceeds the Nisab threshold. The value of gold/silver used for Nisab is based on current market estimates. Please consult a scholar for complex business valuation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriberZakat;
