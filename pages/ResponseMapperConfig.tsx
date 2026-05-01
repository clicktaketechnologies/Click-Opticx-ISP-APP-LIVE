import React, { useState, useEffect } from 'react';
import { 
  Zap, Code, Database, ChevronRight, Save, 
  Trash2, Plus, Terminal, RotateCw, Layers, 
  Globe, Smartphone, CreditCard, ShieldCheck,
  Eye, Play, CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import { AppState, PaymentGateway, Role } from '../types';
import { Modal } from '../components/shared/Modal';
import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';

const ResponseMapperConfig: React.FC<{ state: AppState }> = ({ state }) => {
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMapping, setSelectedMapping] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testPayload, setTestPayload] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/provider-mgmt/mappings`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) setMappings(data.mappings);
    } catch (e) {
        console.error('Failed to fetch mappings');
    } finally {
        setLoading(false);
    }
  };

  const handleSaveMapping = async (mapping: any) => {
    setIsProcessing(true);
    try {
        const method = mapping.id ? 'PUT' : 'POST';
        const url = mapping.id 
            ? `${import.meta.env.VITE_BACKEND_URL}/api/provider-mgmt/mappings/${mapping.id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/provider-mgmt/mappings`;
        
        const response = await fetch(url, {
            method,
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mapping)
        });
        const data = await response.json();
        if (data.success) {
            fetchMappings();
            setIsModalOpen(false);
        }
    } catch (e) {
        alert('Save failed');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRunTest = () => {
    if (!testPayload || !selectedMapping) return;
    try {
        const raw = JSON.parse(testPayload);
        const config = selectedMapping.mappings;
        
        // Simulate Mapper Logic (Minimal)
        const getNested = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
        const result: any = { fields: {}, status: 'unknown', message: '' };
        
        if (config.fields) {
            Object.entries(config.fields).forEach(([pf, itf]: any) => {
                result.fields[itf] = getNested(raw, pf);
            });
        }
        if (config.status) {
            const ps = getNested(raw, 'status');
            result.status = config.status[ps] || 'unknown';
        }
        
        setTestResult(result);
    } catch (e) {
        setTestResult({ error: 'Invalid JSON Payload' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <Layers className="text-blue-600" size={32} />
            Response Normalizer
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Protocol Transformation Engine • Zero-Code Mapping</p>
        </div>
        <button 
            onClick={() => { setSelectedMapping({ provider_id: '', response_type: 'payment', mappings: { fields: {}, status: {}, errors: {} } }); setIsModalOpen(true); }}
            className="px-6 py-3 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl"
        >
            <Plus size={16}/> New Normalizer Node
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
            <Mini5GMicroLoader size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Mapping Registry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mappings.map(m => (
                <div key={m.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                            <Code size={24} />
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {m.response_type}
                        </span>
                    </div>
                    <div className="mb-6 flex-1">
                        <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-1">{m.provider_id}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                           <Database size={10}/> {Object.keys(m.mappings.fields || {}).length} Field Mappings
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setSelectedMapping(m); setIsModalOpen(true); }}
                            className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Terminal size={14}/> IDE
                        </button>
                        <button className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen && !!selectedMapping}
        onClose={() => setIsModalOpen(false)}
        title={selectedMapping?.id ? `Refine Normalizer: ${selectedMapping.provider_id}` : 'Provision New Normalizer'}
        type="form"
        maxWidth="max-w-5xl"
        scrollable
        footer={
            <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]">Abort</button>
                <button 
                    onClick={() => handleSaveMapping(selectedMapping)}
                    className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs shadow-xl active:scale-95 flex items-center gap-2"
                >
                    {isProcessing ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />} Commit Changes
                </button>
            </div>
        }
      >
        {selectedMapping && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provider ID</label>
                            <input 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500"
                                value={selectedMapping.provider_id}
                                onChange={e => setSelectedMapping({ ...selectedMapping, provider_id: e.target.value.toLowerCase() })}
                                placeholder="e.g. stripe"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Response Type</label>
                            <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500"
                                value={selectedMapping.response_type}
                                onChange={e => setSelectedMapping({ ...selectedMapping, response_type: e.target.value })}
                            >
                                <option value="payment">Payment Success</option>
                                <option value="webhook">General Webhook</option>
                                <option value="auth">Auth Callback</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                            Mapping Configuration (JSON)
                            <span className="text-blue-500 font-bold lowercase tracking-normal">Config-Driven Architecture</span>
                        </label>
                        <textarea 
                            className="w-full p-6 bg-slate-900 text-blue-400 font-mono text-xs rounded-[2.5rem] min-h-[400px] resize-none border-4 border-slate-800 focus:border-blue-500/50 transition-all outline-none"
                            value={JSON.stringify(selectedMapping.mappings, null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setSelectedMapping({ ...selectedMapping, mappings: parsed });
                                } catch (err) {}
                            }}
                        />
                    </div>
                </div>

                <div className="bg-slate-50 rounded-[3rem] p-10 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase italic">Normalizer Simulator</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify logic against raw payloads</p>
                        </div>
                        <button 
                            onClick={handleRunTest}
                            className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                        >
                            <Play size={20} className="fill-white" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col">
                        <div className="space-y-1 flex-1 flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Raw Provider Payload (JSON)</label>
                            <textarea 
                                className="w-full flex-1 p-5 bg-white border border-slate-200 rounded-3xl font-mono text-[11px] outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                                placeholder="Paste JSON response here..."
                                value={testPayload}
                                onChange={e => setTestPayload(e.target.value)}
                            />
                        </div>

                        <div className="h-1 bg-slate-200 rounded-full opacity-30"></div>

                        <div className="space-y-1 flex-1 flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Normalized Result</label>
                            <div className="w-full flex-1 p-5 bg-slate-900 rounded-3xl font-mono text-[11px] text-emerald-400 overflow-auto border-2 border-emerald-500/20">
                                {testResult ? (
                                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                                ) : (
                                    <p className="text-slate-600 italic">Run simulator to view protocol transformation...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default ResponseMapperConfig;
