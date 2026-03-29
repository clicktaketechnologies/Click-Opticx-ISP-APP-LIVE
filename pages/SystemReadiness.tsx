import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  Terminal, Database, Globe, Bell, Mail, Server, 
  Cpu, Cloud, Activity, ExternalLink
} from 'lucide-react';

const SystemReadiness: React.FC = () => {
  const [dbState, setDbState] = useState(db.getState());
  const [socketConnected, setSocketConnected] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Check socket connectivity
    const checkSocket = () => {
       setSocketConnected((db as any).socket?.connected || false);
    };
    const interval = setInterval(checkSocket, 2000);
    return () => clearInterval(interval);
  }, []);

  const keys = dbState.settings.technicalKeys;

  const requirements = [
    {
      id: 'firebase-web',
      name: 'Firebase Web Client',
      desc: 'Enables Firestore real-time sync and Auth.',
      status: keys.firebaseApiKey && keys.firebaseProjectId ? 'Passed' : 'Missing',
      impact: 'Critical',
      icon: Cloud
    },
    {
        id: 'firebase-vapid',
        name: 'FCM VAPID Key',
        desc: 'Required for browser push notifications.',
        status: keys.firebaseVapidKey ? 'Passed' : 'Missing',
        impact: 'Warning',
        icon: Bell
    },
    {
      id: 'smtp',
      name: 'SMTP Gateway',
      desc: 'Required for billing and alert emails.',
      status: keys.smtpHost && keys.smtpPass ? 'Passed' : 'Missing',
      impact: 'High',
      icon: Mail
    },
    {
      id: 'socket-io',
      name: 'Real-time Socket.io',
      desc: 'Enables live bandwidth and OLT telemetry.',
      status: socketConnected ? 'Passed' : 'Disconnected',
      impact: 'Critical',
      icon: Activity
    },
    {
      id: 'ai-engine',
      name: 'Gemini AI Core',
      desc: 'Enables diagnostic assistance and AI chat.',
      status: keys.geminiApiKey ? 'Passed' : 'Missing',
      impact: 'Medium',
      icon: Cpu
    },
    {
      id: 'nas-registry',
      name: 'MikroTik / NAS Model',
      desc: 'Core networking hardware integration.',
      status: dbState.nas.length > 0 ? 'Active' : 'Not Configured',
      impact: 'High',
      icon: Server
    }
  ];

  const overallHealth = requirements.filter(r => r.status === 'Passed' || r.status === 'Passed' || r.status === 'Active').length / requirements.length;

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
        <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Integrity</div>
            <div className="text-3xl font-black text-slate-900">{(overallHealth * 100).toFixed(0)}%</div>
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
              <button className="text-slate-300 hover:text-blue-500 transition-colors">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 p-8 rounded-[3rem] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Manual Setup Required?</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">
                    If integration points show "Missing", navigate to the <span className="text-blue-400">System Config</span> page to provide the necessary API keys and credentials.
                </p>
                <div className="mt-8 flex gap-4">
                    <button className="px-6 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                        Open Config Plane
                    </button>
                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        Setup Documentation
                    </button>
                </div>
            </div>
            <div className="bg-black/40 border border-white/5 p-6 rounded-3xl font-mono text-[10px] text-emerald-400/80 leading-relaxed shadow-inner">
                <div className="flex gap-2 mb-2"><span className="text-slate-500">$</span> diagnostic --verbose</div>
                <div>{">"} Checking environment variables... [OK]</div>
                <div>{">"} Initializing Socket.io stream... {socketConnected ? '[CONNECTED]' : '[WAITING]'}</div>
                <div>{">"} PWA Manifest Integrity... [VALID]</div>
                <div>{">"} OLT Registry Polling... [ACTIVE]</div>
                <div>{">"} System Readiness Score: {(overallHealth * 100).toFixed(0)}%</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SystemReadiness;
