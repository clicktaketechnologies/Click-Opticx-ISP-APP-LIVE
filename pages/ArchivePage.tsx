import React, { useState, useMemo } from 'react';
import { AppState, ArchiveRecord, PaymentStatus, LedgerType } from '../types';
import { db } from '../db';
import { 
  Database, Download, History, Search, Filter, AlertTriangle, 
  ChevronRight, CheckCircle2, FileText, Wallet, Receipt,
  BarChart3, ShieldCheck, Calendar, Lock, ArrowRight, Info, AlertCircle
} from 'lucide-react';

const ArchivePage: React.FC<{ state: AppState }> = ({ state }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewingArchive, setViewingArchive] = useState<ArchiveRecord | null>(null);
  const [activeTab, setSelectedTab] = useState<'summary' | 'invoices' | 'payments' | 'ledger'>('summary');

  const handleArchive = async () => {
    if (!selectedMonth) {
      alert("Please choose a month to save.");
      return;
    }
    const res = await db.archiveMonth(selectedMonth);
    if (res.success) {
      alert(`Records for ${selectedMonth} have been safely stored.`);
    } else {
      alert(res.message || "Something went wrong while saving the records.");
    }
  };

  const handleFullExport = () => {
    if (!viewingArchive) return;
    const exportData = { metadata: { month: viewingArchive.month, exported: new Date().toISOString() }, data: viewingArchive.data };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `History_${viewingArchive.month}.json`;
    link.click();
  };

  const archiveSummary = useMemo(() => {
    if (!viewingArchive) return null;
    const data = viewingArchive.data;
    const totalBilled = data.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalRecovered = data.payments.reduce((acc, pay) => acc + (pay.status === 'Approved' ? pay.amount : 0), 0);
    const totalPending = data.payments.reduce((acc, pay) => acc + (pay.status === 'Pending' ? pay.amount : 0), 0);
    return { totalBilled, totalRecovered, totalPending };
  }, [viewingArchive]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Database className="text-green-600" size={32} />
            Past Records
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mt-1">
            Browse through older bills and history. These records are kept for safekeeping and cannot be changed.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 md:p-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm w-full xl:w-auto">
          <div className="flex flex-col px-2 flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center sm:text-left">Choose Month</label>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Calendar size={18} className="text-green-500" />
              <input 
                type="month" 
                className="bg-transparent border-none outline-none font-black text-slate-900 text-lg cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>
          <button 
            onClick={handleArchive}
            className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest text-[10px]"
          >
            <Lock size={18} className="text-green-400" />
            Store Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History className="text-blue-500" size={14} />
              Saved List
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{state.archives.length} Total</span>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[400px] lg:max-h-[600px] custom-scrollbar">
              {state.archives.length === 0 ? (
                <div className="p-16 text-center text-slate-300 italic text-sm">Nothing saved yet</div>
              ) : (
                state.archives.sort((a, b) => b.month.localeCompare(a.month)).map(arc => {
                  const isActive = viewingArchive?.month === arc.month;
                  return (
                    <button 
                      key={arc.month} 
                      onClick={() => { setViewingArchive(arc); setSelectedTab('summary'); }}
                      className={`w-full p-6 flex items-center justify-between transition-all duration-300 group border-l-4 ${
                        isActive 
                          ? 'bg-green-600 text-white border-green-400 shadow-lg shadow-green-200 z-10' 
                          : 'bg-white border-transparent hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div className="text-left">
                        <p className={`font-black text-lg transition-colors ${isActive ? 'text-white' : 'text-slate-900 group-hover:text-green-600'}`}>
                          {new Date(arc.month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isActive ? 'text-green-100' : 'text-slate-400'}`}>
                          Stored {new Date(arc.archivedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight size={18} className={`transition-transform duration-300 ${isActive ? 'text-white translate-x-1' : 'text-slate-300'}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl min-h-[500px] lg:min-h-[650px] flex flex-col overflow-hidden relative">
            {!viewingArchive ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 md:p-20 text-center">
                <Database size={48} className="text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800">Choose a month to view</h3>
                <p className="text-slate-400 max-w-xs mt-2 font-medium">Select one of the saved months on the left to see its history.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in zoom-in duration-300 overflow-hidden">
                <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black">{new Date(viewingArchive.month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h4>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">History View</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleFullExport}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest"
                  >
                    <Download size={14} /> Download File
                  </button>
                </div>

                <div className="px-6 md:px-8 bg-slate-50 border-b border-slate-100 flex gap-4 md:gap-8 overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { id: 'summary', label: 'Summary' },
                    { id: 'invoices', label: 'Bills' },
                    { id: 'payments', label: 'Collections' },
                    { id: 'ledger', label: 'Ledger' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id as any)}
                      className={`py-5 text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                        activeTab === tab.id ? 'border-green-600 text-green-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
                  <div className="relative z-10">
                    {activeTab === 'summary' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Billed</p>
                            <h5 className="text-xl font-black">Rs. {(archiveSummary?.totalBilled || 0).toLocaleString()}</h5>
                          </div>
                          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                            <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-1">Total Collected</p>
                            <h5 className="text-xl font-black text-green-700">Rs. {(archiveSummary?.totalRecovered || 0).toLocaleString()}</h5>
                          </div>
                          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                            <p className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest mb-1">Pending Approval</p>
                            <h5 className="text-xl font-black text-orange-700">Rs. {(archiveSummary?.totalPending || 0).toLocaleString()}</h5>
                          </div>
                        </div>
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col md:flex-row items-start gap-4">
                          <ShieldCheck size={32} className="text-blue-500 shrink-0" />
                          <p className="text-sm text-blue-700 font-medium leading-relaxed uppercase">
                            These records were stored on <strong>{new Date(viewingArchive.archivedAt).toLocaleDateString()}</strong> and are kept as a permanent file for your business.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'invoices' && (
                      <div className="overflow-x-auto">
                        <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden bg-white min-w-[400px]">
                          {viewingArchive.data.invoices.map(inv => (
                            <div key={inv.id} className="p-4 flex items-center justify-between">
                              <div><p className="font-bold text-sm">{inv.userName}</p><p className="text-[9px] text-slate-400 uppercase">{inv.packageName}</p></div>
                              <div className="text-right"><p className="font-bold text-sm">Rs. {inv.totalAmount}</p><span className="text-[8px] font-black uppercase text-green-600">{inv.status}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;

