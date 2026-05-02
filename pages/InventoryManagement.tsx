import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Search, Plus, Trash2, Download, 
  AlertTriangle, CheckCircle2, DollarSign, 
  Layers, Package, Filter, MoreVertical, 
  ArrowRight, Activity, HardDrive, Cpu, 
  Settings, Save, X, Printer
} from 'lucide-react';
import { AppState } from '../types';
import { db } from '../db';
import Modal from '../components/shared/Modal';

const InventoryManagement: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModal, setIsAddModal] = useState(false);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    item: '',
    quantity: 0,
    price: 0,
    category: 'Hardware'
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/stock');
      const data = await res.json();
      if (data.success) {
        setStock(data.stock);
      }
    } catch (e) {
      console.error('Failed to fetch stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHardware = async () => {
    try {
      const res = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModal(false);
        fetchStock();
        setForm({ item: '', quantity: 0, price: 0, category: 'Hardware' });
      }
    } catch (e) {
      alert('Failed to register hardware');
    }
  };

  const filteredStock = useMemo(() => {
    return stock.filter(item => 
      item.item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stock, searchTerm]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Item', 'Quantity', 'Price'];
    const rows = filteredStock.map(i => [i.id, i.item, i.quantity, i.price]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-premium">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Box size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Inventory Master</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                   <Activity size={12} className="text-blue-500" /> Real-Time Asset Tracking & Hardware Sync
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Search Assets..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full md:w-64 font-bold text-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
             />
          </div>
          <button 
            onClick={() => setIsAddModal(true)}
            className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
             <Plus size={24} />
          </button>
        </div>
        
        <Layers className="absolute -right-16 -top-16 size-64 text-blue-500/5 rotate-12" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Alerts & Summary */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <AlertTriangle size={14} className="text-amber-500" /> Critical Stock Alerts
              </h3>
              
              <div className="space-y-4">
                 {filteredStock.filter(i => i.quantity <= 5).map(item => (
                   <div key={item.id} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between group">
                      <div>
                         <p className="text-xs font-black text-slate-900 leading-none">{item.item}</p>
                         <p className="text-[9px] font-bold text-rose-500 uppercase mt-1">ONLY {item.quantity} REMAINING</p>
                      </div>
                      <button className="p-2 bg-white text-rose-500 rounded-lg shadow-sm hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                         <ArrowRight size={14} />
                      </button>
                   </div>
                 ))}
                 {filteredStock.filter(i => i.quantity <= 5).length === 0 && (
                   <div className="py-10 text-center opacity-30">
                      <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Inventory Balanced</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-white/10 rounded-xl text-blue-400">
                    <DollarSign size={20} />
                 </div>
                 <h4 className="text-xs font-black uppercase tracking-widest">Asset Valuation</h4>
              </div>
              <div>
                 <p className="text-3xl font-black italic tracking-tighter text-blue-400">
                    {state.settings.currency} {filteredStock.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()}
                 </p>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">TOTAL NET HARDWARE LIQUIDITY</p>
              </div>
           </div>
        </div>

        {/* Table Area */}
        <div className="xl:col-span-3">
           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Stock Ledger</h3>
                 <button 
                   onClick={handleExportCSV}
                   className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                 >
                    <Download size={14} /> Export CSV
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-950 text-white">
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Hardware Item</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Current Qty</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Unit Price</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Total Value</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {loading ? (
                         <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-400 uppercase font-black text-xs">Syncing Ledger...</td></tr>
                       ) : filteredStock.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl ${item.quantity <= 5 ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                     <Package size={20} />
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-slate-900 tracking-tight leading-none">{item.item}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">UID: HW-{item.id.toString().padStart(4, '0')}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className={`text-lg font-black italic ${item.quantity <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                                  {item.quantity}
                               </span>
                               <span className="text-[9px] font-black text-slate-400 uppercase ml-2">Units</span>
                            </td>
                            <td className="px-8 py-6 text-xs font-black text-slate-600">
                               {state.settings.currency} {item.price.toLocaleString()}
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900 italic">
                               {state.settings.currency} {(item.price * item.quantity).toLocaleString()}
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm">
                                     <Settings size={16} />
                                  </button>
                                  <button className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
                                     <Trash2 size={16} />
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModal}
        onClose={() => setIsAddModal(false)}
        title="Register New Hardware"
        type="form"
        maxWidth="max-w-xl"
        confirmLabel="Authorize Entry"
        onConfirm={handleAddHardware}
      >
        <div className="grid grid-cols-2 gap-6">
           <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase px-1">Hardware Label</label>
              <input 
                value={form.item}
                onChange={e => setForm({...form, item: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" 
                placeholder="e.g. MikroTik Cloud Core Router" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase px-1">Initial Qty</label>
              <input 
                type="number" 
                value={form.quantity}
                onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase px-1">Unit Cost</label>
              <input 
                type="number" 
                value={form.price}
                onChange={e => setForm({...form, price: parseFloat(e.target.value)})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10" 
              />
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryManagement;
