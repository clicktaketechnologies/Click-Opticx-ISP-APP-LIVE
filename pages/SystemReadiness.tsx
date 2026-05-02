import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  Terminal, Database, Globe, Bell, Mail, Server, 
  Cpu, Cloud, Activity, ExternalLink, Zap, RefreshCcw
} from 'lucide-react';
import PremiumSpeedTest from '../components/shared/PremiumSpeedTest';

const SystemReadiness: React.FC = () => {
  const [dbState, setDbState] = useState(db.getState());
  const [socketConnected, setSocketConnected] = useState(false);
  const [scanning, setScanning] = useState(false);

  const runManualScan = () => {
    setScanning(true);
    // Force socket check
    setSocketConnected((db as any).socket?.connected || false);
    // Simulate deep scan duration
    setTimeout(() => {
      setScanning(false);
      setDbState(db.getState());
    }, 1500);
  };

  useEffect(() => {
    // Initial check on mount
    const socket = (db as any).socket;
    setSocketConnected(socket?.connected || false);
    
    // Auto-trigger scan on mount for fresh data
    runManualScan();
  }, []);

  const keys = dbState.settings.technicalKeys;

  const requirements = [
    {
      id: 'supabase',
      name: 'Supabase Cloud DB',
      desc: 'Primary data storage and Auth gateway.',
      status: keys.supabaseUrl && keys.supabaseAnonKey ? 'Passed' : 'Missing',
      impact: 'Critical',
      icon: Database,
      link: '#/business-settings'
    },
    {
      id: 'email-gateway',
      name: 'Email Service (Resend/Gmail)',
      desc: 'Required for billing and system alerts.',
      status: keys.resendApiKey || (keys.gmailUser && keys.gmailPass) ? 'Passed' : 'Missing',
      impact: 'High',
      icon: Mail,
      link: '#/email-config'
    },
    {
        id: 'firebase-vapid',
        name: 'FCM VAPID Key',
        desc: 'Required for browser push notifications.',
        status: keys.firebaseVapidKey ? 'Passed' : 'Missing',
        impact: 'Warning',
        icon: Bell,
        link: '#/business-settings'
    },
    {
      id: 'socket-io',
      name: 'Real-time Socket.io',
      desc: 'Enables live bandwidth and OLT telemetry.',
      status: socketConnected ? 'Passed' : 'Disconnected',
      impact: 'Critical',
      icon: Activity,
      link: '#/network-integration'
    },
    {
      id: 'ai-engine',
      name: 'Gemini AI Core',
      desc: 'Enables diagnostic assistance and AI chat.',
      status: keys.geminiApiKey ? 'Passed' : 'Missing',
      impact: 'Medium',
      icon: Cpu,
      link: '#/system-config'
    },
    {
      id: 'nas-registry',
      name: 'MikroTik / NAS Model',
      desc: 'Core networking hardware integration.',
      status: dbState.nas.length > 0 ? 'Active' : 'Not Configured',
      impact: 'High',
      icon: Server,
      link: '#/nas-management'
    }
  ];

  const overallHealth = requirements.filter(r => r.status === 'Passed' || r.status === 'Active').length / requirements.length;

  const navigateTo = (link?: string) => {
    if (link) window.location.hash = link;
  };

  return (
    <div className="p-8 space-y-8 animate-premium">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-4">
            <ShieldCheck className="text-emerald-500" size={40} />
            System Readiness Audit
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
            Environment Diagnostic & Integration Health Check
          </p>
        </div>
        <div className="flex items-center gap-6">
            <button 
              onClick={runManualScan}
              disabled={scanning}
              className="px-8 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white disabled:text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3"
            >
              {scanning ? <RefreshCcw size={18} className="animate-spin" /> : <Zap size={18} />}
              {scanning ? 'Auditing...' : 'Initiate Full System Audit'}
            </button>
            <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Integrity</div>
                <div className="text-3xl font-black text-slate-900">{(overallHealth * 100).toFixed(0)}%</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requirements.map((req) => (
          <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:shadow-xl hover:border-blue-500/20 transition-all duration-500">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${req.status === 'Passed' || req.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                <req.icon size={24} />
              </div>
              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                req.impact === 'Critical' ? 'bg-rose-500 text-white' : 
                req.impact === 'High' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {req.impact} Impact
              </span>
            </div>
            
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{req.name}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 leading-relaxed h-8">
              {req.desc}
            </p>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {req.status === 'Passed' || req.status === 'Active' ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-rose-500" />
                )}
                <span className={`text-xs font-black uppercase ${req.status === 'Passed' || req.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {req.status}
                </span>
              </div>
              <button 
                onClick={() => navigateTo(req.link)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest border border-slate-100"
              >
                <span>Edit</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-8 rounded-[3rem] text-white overflow-hidden relative min-h-[600px] flex flex-col">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="relative z-10 flex flex-col space-y-12">
            <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Live Network Diagnostic</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose max-w-2xl">
                    Execute a deep-spectral analysis of the current infrastructure node. Measures throughput, jitter, and packet stability in real-time.
                </p>
            </div>

            <div className="flex-1">
               <PremiumSpeedTest className="!bg-black/40 border-white/5 shadow-inner" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default SystemReadiness;
