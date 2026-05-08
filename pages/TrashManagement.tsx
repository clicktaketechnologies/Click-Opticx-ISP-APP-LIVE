import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { 
  Trash2, RotateCcw, AlertTriangle, Search, 
  Filter, Calendar, Database, ShieldAlert, X,
  CheckCircle2, Info
} from 'lucide-react';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

const TrashManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await db.getTrash(); // I need to add this to db.ts
      if (res.success) {
        setItems(res.items);
      } else {
        setStatus({ type: 'error', msg: res.message || 'Failed to sync with trash registry.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Kernel Error: Connection to trash node lost.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id: string) => {
    if (!confirm('Confirm restoration of this record to production?')) return;
    
    try {
      const res = await db.restoreFromTrash(id); // I need to add this to db.ts
      if (res.success) {
        setStatus({ type: 'success', msg: 'Record successfully re-integrated into production.' });
        fetchTrash();
      } else {
        setStatus({ type: 'error', msg: res.message || 'Restoration failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Transmission failed.' });
    }
  };

  const handlePurge = async (id: string) => {
    if (!confirm('🚨 PERMANENT PURGE: This action cannot be undone. Proceed?')) return;

    try {
      const res = await db.purgeFromTrash(id); // I need to add this to db.ts
      if (res.success) {
        setStatus({ type: 'success', msg: 'Record permanently purged from existence.' });
        fetchTrash();
      } else {
        setStatus({ type: 'error', msg: res.message || 'Purge failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Transmission failed.' });
    }
  };

  const filteredItems = items.filter(item => 
    item.original_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(item.payload).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-premium max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-4">
            <Trash2 className="text-rose-600" size={48} />
            Data Decommissioning
          </h1>
          <p className="text-slate-500 text-sm font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={14} />
            Secure Archive & Recycle Protocol
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search Archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
           </div>
        </div>
      </div>

      {/* Status Bar */}
      {status && (
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between gap-4 animate-in slide-in-from-top-4 ${
          status.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          <div className="flex items-center gap-4">
            {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            <span className="text-xs font-black uppercase tracking-widest">{status.msg}</span>
          </div>
          <button onClick={() => setStatus(null)}><X size={20} /></button>
        </div>
      )}

      {/* Trash Table */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100">
                <th className="px-10 py-6">Source Module</th>
                <th className="px-10 py-6">Record Identity</th>
                <th className="px-10 py-6">Decommissioned By</th>
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center"><Mini5GMicroLoader size={40} /></td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <Database size={48} className="mx-auto mb-6 text-slate-100 animate-pulse" />
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] italic">Archive Registry Empty</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {item.original_table}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 uppercase">ID: {item.original_id}</p>
                        <p className="text-[9px] font-bold text-slate-400 truncate max-w-xs">{JSON.stringify(item.payload)}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{item.deleted_by || 'SYSTEM'}</p>
                    </td>
                    <td className="px-10 py-6 text-xs font-bold text-slate-500 italic">
                      {new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => handleRestore(item.id)}
                          className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-90 transition-all"
                          title="Restore to Production"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button 
                          onClick={() => handlePurge(item.id)}
                          className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 shadow-lg shadow-rose-600/20 active:scale-90 transition-all"
                          title="Permanent Purge"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex items-start gap-5">
          <div className="p-4 bg-white/10 rounded-2xl text-blue-400"><Info size={24}/></div>
          <div>
            <h5 className="text-sm font-black uppercase italic mb-2">Auto-Purge Protocol</h5>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold">Records in the archive are subject to permanent deletion after 90 days. Manual purge bypasses this window.</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-start gap-5">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={24}/></div>
          <div>
            <h5 className="text-sm font-black uppercase italic mb-2 text-slate-900">Irreversible Actions</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">The permanent purge action physically erases data from the secondary storage cluster. Recovery is not possible.</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-start gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><RotateCcw size={24}/></div>
          <div>
            <h5 className="text-sm font-black uppercase italic mb-2 text-slate-900">Integrity Check</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">Restoring records performs a schema validation check to ensure zero-conflict re-insertion into production nodes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrashManagement;
