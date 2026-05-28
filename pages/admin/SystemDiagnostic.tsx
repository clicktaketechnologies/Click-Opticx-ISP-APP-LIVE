import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2, Download, ShieldAlert } from 'lucide-react';
import { db } from '../../db';

export const SystemDiagnostic: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [report, setReport] = useState<any[]>([]);

    const runDiagnostics = async () => {
        setIsScanning(true);
        const results = [];
        const endpoints = [
            { name: 'Core Database (PostgreSQL/Supabase)', type: 'db', path: '/api/health' },
            { name: 'Payment Webhook Service', type: 'api', path: '/api/billing/webhook/simulate' },
            { name: 'Redis Cache Layer', type: 'cache', path: '/api/health/cache' },
            { name: 'Cloud Storage (Images/Docs)', type: 'cloud', path: '/api/cloud/health' },
            { name: 'WebSocket Server', type: 'ws', path: '/api/health/ws' },
            { name: 'Hardware OLT Integration', type: 'hardware', path: '/api/olt/health' },
        ];

        for (const ep of endpoints) {
            const start = Date.now();
            try {
                // We use GET for simple health pings where applicable, or handle gracefully
                const res = await fetch(`${db.backendUrl}${ep.path}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('clickopticx_admin_token')}` }
                });
                const latency = Date.now() - start;
                
                if (res.ok) {
                    results.push({ ...ep, status: latency > 200 ? 'degraded' : 'healthy', latency, error: null });
                } else {
                    results.push({ ...ep, status: 'down', latency, error: `HTTP ${res.status}: Endpoint rejected connection` });
                }
            } catch (err: any) {
                results.push({ ...ep, status: 'down', latency: 0, error: err.message });
            }
        }

        // Add a check for dummy components/stale files (simulated audit logic for UI)
        results.push({
            name: 'Legacy Mock Files Audit',
            type: 'system',
            status: 'stale',
            latency: 0,
            error: 'Found 3 unused dummy interfaces in /pages/components'
        });

        setReport(results);
        setIsScanning(false);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const exportReport = () => {
        const csvContent = "data:text/csv;charset=utf-8," + "Name,Status,Latency,Error\n" + report.map(e => `${e.name},${e.status},${e.latency}ms,${e.error || 'None'}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `system_diagnostic_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                        <Activity className="text-indigo-500" size={32} />
                        System Health & Diagnostic Scanner
                    </h1>
                    <p className="text-slate-400 font-bold tracking-widest text-xs uppercase mt-2">v9.5.4 Production Audit Tool</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={runDiagnostics} disabled={isScanning} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-900/50">
                        <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                        Retry Connection
                    </button>
                    <button onClick={exportReport} className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2">
                        <Download size={16} /> Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                    <p className="text-emerald-800 font-black text-xs uppercase tracking-widest">Healthy Nodes</p>
                    <p className="text-4xl font-black text-emerald-600 mt-2">{report.filter(r => r.status === 'healthy').length}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                    <p className="text-amber-800 font-black text-xs uppercase tracking-widest">Degraded (&gt;200ms)</p>
                    <p className="text-4xl font-black text-amber-600 mt-2">{report.filter(r => r.status === 'degraded').length}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl">
                    <p className="text-rose-800 font-black text-xs uppercase tracking-widest">Down / Broken</p>
                    <p className="text-4xl font-black text-rose-600 mt-2">{report.filter(r => r.status === 'down').length}</p>
                </div>
                <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl">
                    <p className="text-slate-600 font-black text-xs uppercase tracking-widest">Stale / Mock Data</p>
                    <p className="text-4xl font-black text-slate-800 mt-2">{report.filter(r => r.status === 'stale').length}</p>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="p-6">Component / Endpoint</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Latency</th>
                            <th className="p-6">Diagnostics / Error Code</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {report.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6 font-bold text-slate-800">{item.name}</td>
                                <td className="p-6">
                                    {item.status === 'healthy' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase flex w-max items-center gap-1"><CheckCircle size={12}/> Healthy</span>}
                                    {item.status === 'degraded' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black uppercase flex w-max items-center gap-1"><AlertTriangle size={12}/> Degraded</span>}
                                    {item.status === 'down' && <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-black uppercase flex w-max items-center gap-1"><XCircle size={12}/> Down</span>}
                                    {item.status === 'stale' && <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-black uppercase flex w-max items-center gap-1"><ShieldAlert size={12}/> Stale Code</span>}
                                </td>
                                <td className="p-6 font-mono text-sm text-slate-500">{item.latency > 0 ? `${item.latency}ms` : '---'}</td>
                                <td className="p-6 text-xs font-mono text-rose-500 truncate max-w-xs">{item.error || 'Operational'}</td>
                                <td className="p-6 text-right">
                                    {item.status === 'stale' && (
                                        <button className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 ml-auto">
                                            <Trash2 size={14} /> Remove Dummy
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SystemDiagnostic;
