import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useState, useMemo, useEffect } from 'react';
import { AppState, ISPUser, Package, LineItem } from '../types';
import { db } from '../db';
import { 
  FileText, Search, User, Package as PackageIcon, 
  Send, Download, CheckCircle, X, ChevronRight, ArrowRight,
  ShieldCheck, Clock, Receipt, Mail, RefreshCw, Calculator,
  UserCircle, Hash, Users, Activity, Box, Settings, Copy, Plus, Trash2
} from 'lucide-react';

interface Props {
  state: AppState;
  preSelectedUserId?: string;
  onNavigate: (page: string) => void;
}

type InvoiceMode = 'subscription' | 'custom' | 'equipment';

const InvoiceGenerator: React.FC<Props> = ({ state, preSelectedUserId, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ISPUser | null>(null);
  const [invoiceMode, setInvoiceMode] = useState<InvoiceMode>('subscription');
  
  // Subscription Mode State
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  
  // Custom Mode State
  const [customDesc, setCustomDesc] = useState('Service Charge');
  
  // Equipment Mode State (Simplified dynamic list)
  const [items, setItems] = useState<{desc: string, price: number, cat: any}[]>([
    { desc: 'Optical Network Unit (ONU)', price: 4500, cat: 'Equipment' }
  ]);

  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]);
  const [customAmount, setCustomAmount] = useState<number>(0);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedInv, setGeneratedInv] = useState<any>(null);

  // Check for pre-selected user
  useEffect(() => {
    if (preSelectedUserId) {
      const user = state.users.find(u => u.id === preSelectedUserId);
      if (user) handleSelectUser(user);
    }
  }, [state.users, preSelectedUserId]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return state.users.filter(u => 
      !u.deleted && (
        !term || 
        u.name.toLowerCase().includes(term) ||
        u.connectionId.toLowerCase().includes(term) ||
        u.phone.includes(term)
      )
    );
  }, [state.users, searchTerm]);

  const handleSelectUser = (user: ISPUser) => {
    setSelectedUser(user);
    const userPkg = state.packages.find(p => p.id === user.packageId) || state.packages[0];
    if (userPkg) {
      setSelectedPkg(userPkg);
      const base = userPkg.price;
      setCustomAmount(base);
    }
    setStep(2);
  };

  const handleAddItem = () => {
    setItems([...items, { desc: '', price: 0, cat: 'Equipment' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const next = [...items];
    (next[index] as any)[field] = value;
    setItems(next);
  };

  const calculateModeTotal = () => {
    if (invoiceMode === 'subscription') return customAmount;
    if (invoiceMode === 'custom') return customAmount;
    return items.reduce((acc, i) => acc + i.price, 0);
  };

  const handleGenerate = async () => {
    if (!selectedUser) {
      alert("Verification Failed: Missing subscriber data.");
      return;
    }
    
    setIsProcessing(true);
    try {
      let finalItems: LineItem[] = [];
      let pkgId = selectedPkg?.id || 'CUSTOM';

      if (invoiceMode === 'subscription' && selectedPkg) {
        finalItems = [{ id: 'L1', description: `Subscription: ${selectedPkg.name}`, quantity: 1, unitPrice: customAmount, total: customAmount, category: 'Service' }];
      } else if (invoiceMode === 'custom') {
        finalItems = [{ id: 'L1', description: customDesc, quantity: 1, unitPrice: customAmount, total: customAmount, category: 'Adjustment' }];
      } else {
        finalItems = items.map((it, idx) => ({
          id: `EQ-${idx}`,
          description: it.desc,
          quantity: 1,
          unitPrice: it.price,
          total: it.price,
          category: it.cat as any
        }));
      }

      const inv = await db.generateAdHocInvoice(
        selectedUser.id, 
        pkgId, 
        calculateModeTotal(),
        finalItems
      );
      
      if (inv) {
        setGeneratedInv(inv);
        setStep(3);
        db.logNotification(selectedUser.id, 'success', 'Invoice Logged', `Generated ${inv.id} for ${selectedUser.name}`);
      } else {
        throw new Error("Persistence layer rejected the invoice object.");
      }
    } catch (err) {
      console.error("Billing Engine Error:", err);
      alert("CRITICAL: Failed to manufacture invoice. " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = () => {
    setGeneratedInv(null);
    setStep(2);
    db.logNotification(state.currentUser?.email || 'admin', 'info', 'Invoice Cloning', 'Settings preserved for duplicate generation.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Calculator className="text-emerald-600" size={32} />
            Billing Engine
          </h2>
          <p className="text-slate-500 font-medium">Auto-calculate service dues and provision commercial handshakes.</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-10 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}></div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4">
          <div className="space-y-4 text-center max-w-md mx-auto">
             <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
                <Users size={32} />
             </div>
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Locate Subscriber</h3>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Protocol: Direct Node Billing</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Filter by Name, Connection ID, or Mobile..." 
              className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-900"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
             {filteredUsers.map(user => (
               <button 
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full p-6 flex items-center justify-between bg-white border border-slate-100 rounded-[1.5rem] hover:border-emerald-500 hover:shadow-xl transition-all text-left group"
               >
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border shadow-inner">
                       <UserCircle size={24} />
                    </div>
                    <div>
                       <p className="font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Hash size={10}/> {user.connectionId}</span>
                          <span className="text-[10px] text-slate-300">|</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{user.area}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                       <p className="text-[9px] font-black text-slate-400 uppercase">Balance</p>
                       <p className={`text-xs font-black ${user.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Rs. {user.balance.toLocaleString()}</p>
                    </div>
                    <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                 </div>
               </button>
             ))}
             {searchTerm && filteredUsers.length === 0 && (
               <div className="p-10 text-center text-slate-400 italic font-medium">No node detected matching search term.</div>
             )}
          </div>
        </div>
      )}

      {step === 2 && selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4">
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                    {[
                      { id: 'subscription', label: 'Subscription', icon: RefreshCw },
                      { id: 'custom', label: 'Custom Service', icon: Settings },
                      { id: 'equipment', label: 'Equipment', icon: Box }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setInvoiceMode(mode.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${invoiceMode === mode.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <mode.icon size={14} />
                        {mode.label}
                      </button>
                    ))}
                 </div>

                 <div className="space-y-6">
                    {invoiceMode === 'subscription' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Target Service Tier</label>
                             <select 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/10"
                              value={selectedPkg?.id || ''}
                              onChange={e => {
                                const p = state.packages.find(pkg => pkg.id === e.target.value);
                                if (p) {
                                  setSelectedPkg(p);
                                  const base = p.price;
                                  setCustomAmount(base);
                                }
                              }}
                             >
                               {state.packages.map(p => <option key={p.id} value={p.id}>{p.name} (Base Rs. {p.price})</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Authorized Due Date</label>
                             <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                          </div>
                          <div className="col-span-2 space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Calculated Gross Total (Override)</label>
                             <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">{state.settings.currency}</span>
                                <input type="number" className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-4xl outline-none focus:border-emerald-500 transition-all text-slate-900" value={customAmount} onChange={e => setCustomAmount(Number(e.target.value))} />
                             </div>
                          </div>
                       </div>
                    )}

                    {invoiceMode === 'custom' && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Service Description</label>
                          <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none" value={customDesc} onChange={e => setCustomDesc(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Charge Amount</label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">{state.settings.currency}</span>
                            <input type="number" className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-4xl outline-none" value={customAmount} onChange={e => setCustomAmount(Number(e.target.value))} />
                          </div>
                        </div>
                      </div>
                    )}

                    {invoiceMode === 'equipment' && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-4">
                           {items.map((item, idx) => (
                             <div key={idx} className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                               <div className="flex-[3] space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase">Item Name</label>
                                 <input className="w-full p-3 bg-white border rounded-xl font-bold text-xs" value={item.desc} onChange={e => handleUpdateItem(idx, 'desc', e.target.value)} />
                               </div>
                               <div className="flex-[2] space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase">Price</label>
                                 <input type="number" className="w-full p-3 bg-white border rounded-xl font-black text-xs" value={item.price} onChange={e => handleUpdateItem(idx, 'price', Number(e.target.value))} />
                               </div>
                               <button onClick={() => handleRemoveItem(idx)} className="p-3 bg-white text-rose-500 rounded-xl hover:bg-rose-50 border border-rose-100"><Trash2 size={16}/></button>
                             </div>
                           ))}
                           <button onClick={handleAddItem} className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                             <Plus size={14}/> Add Another Component
                           </button>
                        </div>
                        <div className="p-6 bg-slate-950 rounded-2xl text-white flex justify-between items-center">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hardware Subtotal</span>
                           <span className="text-2xl font-black italic tracking-tighter">Rs. {items.reduce((a,b) => a + b.price, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                 </div>

                 <button 
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                 >
                    {isProcessing ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20} />}
                    {isProcessing ? 'Verifying Registry...' : 'Manufacture Official Invoice'}
                 </button>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><User size={14} /> Active Target Node</h4>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5">
                          <UserCircle size={28} />
                       </div>
                       <div>
                          <p className="font-black uppercase tracking-tight text-lg leading-tight">{selectedUser.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref: {selectedUser.connectionId}</p>
                       </div>
                    </div>
                    <div className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Balance</p>
                          <p className={`text-2xl font-black ${selectedUser.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {state.settings.currency} {selectedUser.balance.toLocaleString()}
                          </p>
                       </div>
                    </div>
                 </div>
                 <Activity className="absolute -right-8 -bottom-8 opacity-5 scale-150" size={140} />
              </div>
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setStep(1);
                }} 
                className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all"
              >
                Change Registry Target
              </button>
           </div>
        </div>
      )}

      {step === 3 && generatedInv && (
        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border-4 border-emerald-50 text-center space-y-10 animate-in zoom-in duration-500 max-w-2xl mx-auto">
           <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner animate-bounce">
              <CheckCircle size={56} />
           </div>
           
           <div className="space-y-2">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Fiscal Dispatch Successful</h3>
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[11px]">System Reference: {generatedInv.id}</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Amount</p>
                 <p className="text-3xl font-black text-slate-900">{state.settings.currency} {generatedInv.totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Node</p>
                 <p className="text-xl font-black text-slate-900 truncate uppercase">{generatedInv.userName}</p>
              </div>
           </div>

           <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={async () => {
                    const success = await db.sendInvoiceEmail(generatedInv.id);
                    if (success) alert('Success: Document dispatched via email relay.');
                  }}
                  className="flex-1 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Mail size={18} /> Email Receipt
                </button>
                <button 
                  onClick={() => onNavigate('invoice-management')}
                  className="flex-1 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95"
                >
                  <FileText size={18} /> Go to Registry
                </button>
              </div>
              
              <button 
                onClick={handleDuplicate}
                className="w-full py-5 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 font-black rounded-3xl shadow-sm hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
              >
                <Copy size={18} /> Duplicate This Transaction
              </button>
           </div>

           <button 
            onClick={() => { 
              setGeneratedInv(null);
              setSelectedUser(null);
              setStep(1);
            }}
            className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-emerald-600 transition-all block w-full mt-4"
           >
              Process Another Node
           </button>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
