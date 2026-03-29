import { Mini5GMicroLoader } from '../../components/Mini5GMicroLoader';

import React, { useState, useMemo } from 'react';
import { AppState, SenderIdentity } from '../../types';
import { db } from '../../db';
import { 
  UserCheck, Plus, Search, Filter, Mail, Globe, 
  Trash2, ShieldCheck, CheckCircle, RefreshCw, X,
  Save, AlertTriangle, ChevronRight, Activity, Clock, ShieldAlert,
  Smartphone, Hash, Zap, Info
} from 'lucide-react';

const SenderIdentities: React.FC<{ state: AppState }> = ({ state }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const identities = state.settings.commConfig.senderIdentities;

  const [formData, setFormData] = useState<Partial<SenderIdentity>>({
    name: '',
    email: ''
  });

  const filtered = useMemo(() => {
    return identities.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [identities, searchTerm]);

  const handleAdd = async () => {
    if (!formData.name || !formData.email) return;
    setIsProcessing('new');
    await db.addSenderIdentity(formData);
    setIsProcessing(null);
    setIsModalOpen(false);
    setFormData({ name: '', email: '' });
    db.logNotification('all', 'info', 'Sender Added', 'New sender added. Please check your email for the verification code.');
  };

  const handleVerify = async (id: string) => {
    const code = prompt("Enter the 6-digit verification code sent to this email:");
    if (!code) return;
    setIsProcessing(id);
    await db.verifySenderIdentity(id);
    setIsProcessing(null);
    db.logNotification('all', 'success', 'Sender Verified', 'Sender email verified successfully.');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this sender?")) {
      await db.deleteSenderIdentity(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <UserCheck className="text-blue-600" size={32} />
            Verified Senders
          </h2>
          <p className="text-slate-500 font-medium">Manage the email addresses used to send messages to your users.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> + Add Sender
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-slate-900"
              placeholder="Search senders..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filtered.map(ident => (
            <div key={ident.id} className={`bg-white rounded-[3rem] p-10 border-2 transition-all hover:shadow-xl group relative overflow-hidden flex flex-col h-full ${ident.isVerified ? 'border-green-100' : 'border-amber-100 shadow-amber-50 shadow-lg'}`}>
               <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-inner group-hover:scale-105 transition-transform ${ident.isVerified ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                     <Mail size={32}/>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${ident.isVerified ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                        {ident.isVerified ? 'Verified' : 'Verification Pending'}
                     </div>
                     {ident.isDefault && <span className="text-[8px] font-black text-blue-600 uppercase italic">⭐ System Default</span>}
                  </div>
               </div>

               <div className="relative z-10 space-y-4 mb-10 flex-1">
                  <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none truncate group-hover:text-blue-600 transition-colors">{ident.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{ident.email}</p>
                  <div className="flex items-center gap-2 pt-2 text-slate-300 text-[8px] font-black uppercase">
                     <Clock size={12}/> Added: {new Date(ident.createdAt).toLocaleDateString()}
                  </div>
               </div>

               <div className="mt-auto space-y-4 relative z-10 pt-6 border-t border-slate-50">
                  <div className="flex gap-2">
                     {!ident.isVerified ? (
                        <button 
                          onClick={() => handleVerify(ident.id)}
                          disabled={isProcessing === ident.id}
                          className="flex-1 py-4 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                           {isProcessing === ident.id ? <Mini5GMicroLoader size={14} /> : <ShieldCheck size={14}/>}
                           Verify Now
                        </button>
                     ) : (
                        <button className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">Set Default</button>
                     )}
                     <button 
                       onClick={() => handleDelete(ident.id)}
                       className="p-4 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                     >
                        <Trash2 size={20}/>
                     </button>
                  </div>
               </div>
               <Activity className="absolute -right-8 -bottom-8 opacity-[0.03] scale-150 text-blue-900" size={140} />
            </div>
         ))}
         
         {filtered.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50 flex flex-col items-center">
               <UserCheck className="text-slate-100 mb-8" size={80} />
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 italic">No Senders Added</h3>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Add your first sender email to start sending messages.</p>
            </div>
         )}
      </div>

      <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl">
         <div className="relative z-10 max-w-xl space-y-4">
            <div className="flex items-center gap-4 text-green-400">
               <ShieldCheck size={28} />
               <h3 className="text-2xl font-black uppercase tracking-tight italic leading-none">About Verification</h3>
            </div>
            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase opacity-80 italic">
               We verify sender emails to ensure your messages are delivered securely and aren't marked as spam.
            </p>
         </div>
         <Activity className="absolute -right-20 -bottom-20 opacity-5 scale-[2.5]" size={300} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] w-full max-lg shadow-2xl overflow-hidden border-[8px] border-slate-50 animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <UserCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Add Sender</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Authentication Status</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all rounded-xl">
                    <X size={24}/>
                 </button>
              </div>

              <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Sender Name (e.g. Support Team)</label>
                       <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-blue-600 transition-all uppercase" placeholder="e.g. BILLING TEAM" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Email Address</label>
                       <input type="email" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm outline-none focus:border-blue-600 transition-all" placeholder="billing@domain.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                 </div>

                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4 shadow-inner">
                    <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                    <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed tracking-tighter">
                       After adding, we'll send a verification code to this email. You must verify it before use.
                    </p>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t flex gap-4 shrink-0">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 hover:text-rose-600 rounded-2xl transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                 <button 
                  onClick={handleAdd}
                  disabled={isProcessing === 'new' || !formData.email || !formData.name}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isProcessing === 'new' ? <Mini5GMicroLoader size={18} /> : <Save size={18}/>}
                    Add Sender
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SenderIdentities;

