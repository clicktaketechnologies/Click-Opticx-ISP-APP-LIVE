
import React, { useState } from 'react';
import { 
  Archive, RotateCcw, Search, Calendar, User, 
  FileText, ShieldAlert, ChevronRight, Filter, 
  Download, Trash2, Database, Activity, Info
} from 'lucide-react';
import { AppState, ArchiveRecord } from '../types';
import { db } from '../db';
import Modal from '../components/shared/Modal';

const PastRecords: React.FC<{ state: AppState }> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<ArchiveRecord | null>(null);
  const [restoringUser, setRestoringUser] = useState<{archiveAt: string, userId: string} | null>(null);

  const filteredArchives = (state.archives || []).filter(archive => {
    const matchesSearch = archive.data.users.some(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesSearch;
  });

  const handleRestore = async () => {
    if (!restoringUser) return;
    const res = await db.restoreFromArchive(restoringUser.archiveAt, restoringUser.userId);
    if (res.success) {
      setRestoringUser(null);
      setSelectedArchive(null);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden bg-slate-950 rounded-[3rem] p-12 text-white shadow-2xl border border-slate-900">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 rounded-full border border-rose-500/20">
              <Archive size={14} className="text-rose-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">Identity Archival Storage</span>
            </div>
            <h2 className="text-5xl font-black tracking-tight italic flex items-center gap-4 leading-none">
              Past Records
              <span className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"></span>
            </h2>
            <p className="text-slate-400 font-bold max-w-2xl text-sm leading-relaxed uppercase tracking-tight opacity-70">
              Immutable snapshots of purged node identities. Records here are encrypted and isolated from the active matrix for regulatory compliance.
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={20} />
            <input 
               type="text" 
               placeholder="Search Cryptic Archives..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-14 pr-8 py-5 bg-slate-900 border border-slate-800 rounded-[2rem] w-full md:w-80 font-black text-xs uppercase tracking-widest focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-white placeholder:text-slate-700"
            />
          </div>
        </div>
        
        {/* Decorative elements */}
        <Database className="absolute -right-20 -bottom-20 text-rose-500/5 scale-[6.5]" />
        <Activity className="absolute right-40 top-10 text-white/5 size-48 rotate-12" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-8">
          {filteredArchives.length === 0 ? (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-24 text-center space-y-4 shadow-sm">
               <Archive size={64} className="mx-auto text-slate-100" />
               <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">The Data Vault is Empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArchives.map((archive, idx) => (
                <div key={idx} className="group bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Calendar size={80} className="text-slate-900" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                      <Archive size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">{archive.month}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{new Date(archive.archivedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      { label: 'Identities', count: archive.data.users.length, color: 'text-rose-500' },
                      { label: 'Invoices', count: archive.data.invoices.length, color: 'text-slate-400' },
                      { label: 'Ledger Entries', count: archive.data.ledger.length, color: 'text-slate-400' }
                    ].map((stat, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{stat.label}</span>
                        <span className={`text-xs font-black ${stat.color}`}>{stat.count}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSelectedArchive(archive)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    Explore Snapshot <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                 <ShieldAlert size={18} className="text-rose-500" /> Purge Protocols
              </h3>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase">
                Regulatory standards require data retention for 90 days post-deletion. Auto-cleanup is scheduled for the first of each month.
              </p>
              <div className="pt-6 border-t border-slate-50">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Vault Size</span>
                    <span className="text-sm font-black text-slate-900">{(JSON.stringify(state.archives).length / 1024).toFixed(2)} KB</span>
                 </div>
                 <button className="w-full py-4 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                    Initiate Cold Export
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* ARCHIVE VIEW MODAL */}
      <Modal
        isOpen={!!selectedArchive}
        onClose={() => setSelectedArchive(null)}
        title={`${selectedArchive?.month} Contents`}
        type="info"
        icon={<Archive size={28} className="text-rose-500" />}
        confirmLabel="Close Vault"
        onConfirm={() => setSelectedArchive(null)}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {selectedArchive?.data.users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-400 transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-all shadow-sm">
                       <User size={24} />
                    </div>
                    <div>
                       <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{u.name}</h5>
                       <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{u.id} • {u.packageId}</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setRestoringUser({ archiveAt: selectedArchive.archivedAt, userId: u.id })}
                  className="px-6 py-3 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
                 >
                    <RotateCcw size={14} /> Restore
                 </button>
              </div>
            ))}
            {selectedArchive?.data.users.length === 0 && (
              <p className="text-center py-10 text-slate-300 italic font-black uppercase tracking-widest text-[10px]">Registry already synced to active terminal.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* RESTORE CONFIRM MODAL */}
      <Modal
        isOpen={!!restoringUser}
        onClose={() => setRestoringUser(null)}
        title="Restore Identity?"
        type="info"
        maxWidth="max-w-md"
        confirmLabel="Execute Re-Entry"
        onConfirm={handleRestore}
        message="This will re-inject the subscriber and all associated financial history back into the live system terminal."
      />
    </div>
  );
};

export default PastRecords;
