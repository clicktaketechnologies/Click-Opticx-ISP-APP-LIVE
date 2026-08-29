
import React, { useState, useMemo } from 'react';
import { 
  Wifi, Ticket, Plus, Search, Trash2, Printer, 
  Clock, Zap, Database, CheckCircle, X, Download,
  Filter, Tag, ShieldCheck, Globe, Settings, Share2
} from 'lucide-react';
import { AppState, HotspotToken } from '../types';
import { db } from '../db';
import Modal from '../components/shared/Modal';

const HotspotManager: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNas, setSelectedNas] = useState<string>('all');
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [isPrintModal, setIsPrintModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<HotspotToken | null>(null);

  const [formData, setFormData] = useState({
    nasId: (state.nas || [])[0]?.id || '',
    count: 10,
    price: 100,
    validityDays: 1,
    bandwidthLimit: 5,
    dataLimitMb: 1024
  });

  const filteredTokens = useMemo(() => {
    return (state.hotspotTokens || []).filter(t => {
      const matchesSearch = t.token.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNas = selectedNas === 'all' || t.nasId === selectedNas;
      return matchesSearch && matchesNas;
    });
  }, [state.hotspotTokens, searchTerm, selectedNas]);

  const handleGenerate = async () => {
    await db.generateHotspotTokens(formData.nasId, formData.count, {
      price: formData.price,
      validityDays: formData.validityDays,
      bandwidthLimit: formData.bandwidthLimit,
      dataLimitMb: formData.dataLimitMb
    });
    setIsCreateModal(false);
  };

  const handlePrint = (token: HotspotToken) => {
    setSelectedToken(token);
    setIsPrintModal(true);
  };

  const TokenVoucher = ({ token }: { token: HotspotToken }) => {
    const nas = (state.nas || []).find(n => n.id === token.nasId);
    const portalUrl = nas?.hotspotUrlMode === 'DOMAIN' ? nas.customHotspotUrl : `http://${nas?.ip}/login`;

    return (
      <div className="bg-white border-2 border-dashed border-slate-200 p-8 rounded-[2rem] shadow-sm max-w-sm mx-auto relative overflow-hidden group hover:border-blue-400 transition-all">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
        
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
             <Wifi size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 leading-none">Access Token</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{nas?.name || 'Voucher Pool'}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
           <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase">Token Code</span>
              <span className="text-xl font-black text-blue-600 tracking-widest">{token.token}</span>
           </div>
           <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase">Validity</span>
              <span className="text-[11px] font-black text-slate-700">{token.validityDays} Day(s)</span>
           </div>
           <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase">Data Limit</span>
              <span className="text-[11px] font-black text-slate-700">{(token.dataLimitMb / 1024).toFixed(1)} GB</span>
           </div>
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase">Price</span>
              <span className="text-sm font-black text-green-600">{state.settings.currency} {token.price}</span>
           </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
           <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Login URL</p>
           <p className="text-[10px] font-bold text-blue-500 break-all">{portalUrl}</p>
        </div>

        <p className="text-[8px] text-slate-300 font-medium text-center mt-6 uppercase tracking-widest">
           Produced by Click Opticx Secure Gateway
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 text-white">
            <Ticket size={40} className="rotate-12" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Voucher Desk</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
               <ShieldCheck size={14} className="text-blue-500" /> Secure Token Provisioning Active
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
               type="text" 
               placeholder="Search Tokens..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-12 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] w-64 font-bold text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setIsCreateModal(true)}
            className="px-8 py-5 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <Plus size={20} /> Generate Bundle
          </button>
        </div>

        <Globe className="absolute -right-16 -top-16 size-64 text-blue-500/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* FILTERS & STATS */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Filter size={14} /> Active Filters
              </h3>
              
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase px-1">Source Node</label>
                    <select 
                       value={selectedNas} 
                       onChange={e => setSelectedNas(e.target.value)}
                       className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/10"
                    >
                       <option value="all">All Gateways</option>
                       {(state.nas || []).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Available Tokens</span>
                    <span className="text-sm font-black text-blue-600">{filteredTokens.filter(t => t.status === 'Active').length}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Revenue Potential</span>
                    <span className="text-sm font-black text-green-600">{state.settings.currency} {filteredTokens.reduce((acc, t) => acc + (t.status === 'Active' ? t.price : 0), 0).toLocaleString()}</span>
                 </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-100 space-y-4 relative overflow-hidden group">
              <Zap className="absolute -right-4 -bottom-4 size-32 text-white/20 group-hover:rotate-12 transition-transform duration-700" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Instant Issuance</h4>
              <p className="text-[11px] leading-relaxed font-bold uppercase">Generate batch tokens for cafes, events, or public nodes instantly.</p>
           </div>
        </div>

        {/* TOKEN GRID */}
        <div className="xl:col-span-3">
           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                       <tr>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Token ID</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Provisioned At</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Hardware Scope</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Validity</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredTokens.length === 0 ? (
                          <tr>
                             <td colSpan={6} className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest opacity-50">No Tokens Found in Registry</td>
                          </tr>
                       ) : (
                          filteredTokens.map(token => {
                            const nas = (state.nas || []).find(n => n.id === token.nasId);
                            return (
                             <tr key={token.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                   <div className="text-sm font-black text-blue-600 tracking-widest">{token.token}</div>
                                   <div className="text-[8px] text-slate-400 font-bold uppercase">{token.id}</div>
                                </td>
                                <td className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">{new Date(token.createdAt).toLocaleDateString()}</td>
                                <td className="px-8 py-5">
                                   <div className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{nas?.name || 'Global'}</div>
                                   <div className="text-[8px] text-slate-400 font-bold uppercase">{nas?.ip}</div>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase">
                                      <Clock size={12} className="text-slate-400" />
                                      {token.validityDays} Days • {(token.dataLimitMb / 1024).toFixed(1)}GB
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                      token.status === 'Active' ? 'bg-green-100 text-green-600' :
                                      token.status === 'Used' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                                   }`}>
                                      {token.status}
                                   </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                   <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => handlePrint(token)}
                                        className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                                      >
                                         <Printer size={16} />
                                      </button>
                                      <button 
                                        onClick={() => db.revokeToken(token.id)}
                                        className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                            );
                          })
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* GENERATE MODAL */}
      <Modal
         isOpen={isCreateModal}
         onClose={() => setIsCreateModal(false)}
         title="Provision Bundle"
         type="form"
         icon={<Ticket size={28} className="text-blue-600" />}
         confirmLabel="Initialize Sequence"
         onConfirm={handleGenerate}
         maxWidth="max-w-xl"
      >
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">Source Node</label>
               <select 
                  value={formData.nasId} 
                  onChange={e => setFormData({...formData, nasId: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
               >
                  {(state.nas || []).map(n => <option key={n.id} value={n.id}>{n.name} ({n.ip})</option>)}
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">Batch Count</label>
               <input type="number" value={formData.count} onChange={e => setFormData({...formData, count: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">Voucher Price</label>
               <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">Validity (Days)</label>
               <input type="number" value={formData.validityDays} onChange={e => setFormData({...formData, validityDays: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">Speed Limit (Mbps)</label>
               <input type="number" value={formData.bandwidthLimit} onChange={e => setFormData({...formData, bandwidthLimit: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase px-1">Data Limit (MB)</label>
               <input type="number" value={formData.dataLimitMb} onChange={e => setFormData({...formData, dataLimitMb: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
            </div>
         </div>
      </Modal>

      {/* PRINT MODAL */}
      <Modal
         isOpen={isPrintModal}
         onClose={() => setIsPrintModal(false)}
         title="Print Voucher"
         type="info"
         icon={<Printer size={28} className="text-blue-600" />}
         confirmLabel="Send to System Printer"
         onConfirm={() => window.print()}
         maxWidth="max-w-md"
      >
         <div className="py-6">
            {selectedToken && <TokenVoucher token={selectedToken} />}
         </div>
         <p className="text-[10px] text-slate-400 text-center mt-4 uppercase font-bold italic">
            Ensuring high-contrast output for thermal printing optimization.
         </p>
      </Modal>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #modal-content, #modal-content * { visibility: visible; }
          #modal-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default HotspotManager;
