import React, { useState } from 'react';
import { db } from '../db';
import { TechnicalKeys, PushConfig, Role } from '../types';
import { 
  Database, Shield, Cpu, Bell, Save, Key, Globe, Mail, 
  Settings, Server, Zap, Lock, Eye, EyeOff, CheckCircle2, AlertCircle 
} from 'lucide-react';

const SystemConfig: React.FC = () => {
  const [dbState, setDbState] = useState(db.getState());
  const [branding, setBranding] = useState(dbState.settings.branding);
  const [techKeys, setTechKeys] = useState<TechnicalKeys>(dbState.settings.technicalKeys);
  const [pushConfig, setPushConfig] = useState<PushConfig>(dbState.settings.pushConfig);
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updatedSettings = {
        ...dbState.settings,
        branding: branding,
        technicalKeys: techKeys,
        pushConfig: pushConfig
      };
      await db.updateSettings(updatedSettings);
      setStatus({ type: 'success', msg: 'System configurations synchronized successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to update remote node configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChange, type = 'text', icon: Icon, placeholder = '' }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <Icon size={12} className="text-slate-400" />
        {label}
      </label>
      <div className="relative group">
        <input
          type={type === 'password' && showSecrets ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
        {type === 'password' && (
          <button 
            onClick={() => setShowSecrets(!showSecrets)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-400 transition-colors"
          >
            {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-premium">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-4">
            <Settings className="text-blue-600" size={40} />
            System Control Plane
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <Lock className="text-rose-500" size={12} />
            Root Configuration & API Infrastructure
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-8 py-4 ${saving ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all active:scale-95`}
        >
          {saving ? <Database className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? 'Synchronizing...' : 'Authorize & Save'}
        </button>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-black uppercase tracking-widest">{status.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Firebase & Cloud */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cloud Infrastructure</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Firebase & Google Cloud Platform</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Application Display Title" 
                icon={Settings} 
                value={branding.appTitle} 
                onChange={(val: string) => setBranding({...branding, appTitle: val})} 
                placeholder="e.g. Click Opticx ISP"
              />
              <InputField 
                label="Build / Subtitle Tag" 
                icon={Zap} 
                value={branding.appSubtitle} 
                onChange={(val: string) => setBranding({...branding, appSubtitle: val})} 
                placeholder="e.g. v1.2.6-LIVE"
              />
              <InputField label="API Key" value={techKeys.firebaseApiKey} onChange={(v:any) => setTechKeys({...techKeys, firebaseApiKey: v})} icon={Key} type="password" />
              <InputField label="Project ID" value={techKeys.firebaseProjectId} onChange={(v:any) => setTechKeys({...techKeys, firebaseProjectId: v})} icon={Database} />
              <InputField label="Auth Domain" value={techKeys.firebaseAuthDomain} onChange={(v:any) => setTechKeys({...techKeys, firebaseAuthDomain: v})} icon={Lock} />
              <InputField label="Messaging Sender ID" value={techKeys.firebaseMessagingSenderId} onChange={(v:any) => setTechKeys({...techKeys, firebaseMessagingSenderId: v})} icon={Bell} />
              <InputField label="App ID" value={techKeys.firebaseAppId} onChange={(v:any) => setTechKeys({...techKeys, firebaseAppId: v})} icon={Shield} />
              <div className="md:col-span-2">
                <InputField label="FCM VAPID Key (Public)" value={techKeys.firebaseVapidKey} onChange={(v:any) => setTechKeys({...techKeys, firebaseVapidKey: v})} icon={Shield} placeholder="Paste your Web Push Public VAPID key here" />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Communication Gateway</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SMTP, Push & External API Secrets</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="SMTP Host" value={techKeys.smtpHost} onChange={(v:any) => setTechKeys({...techKeys, smtpHost: v})} icon={Server} />
              <InputField label="SMTP Port" value={techKeys.smtpPort} onChange={(v:any) => setTechKeys({...techKeys, smtpPort: parseInt(v) || 0})} icon={Zap} type="number" />
              <InputField label="SMTP Username" value={techKeys.smtpUser} onChange={(v:any) => setTechKeys({...techKeys, smtpUser: v})} icon={Lock} />
              <InputField label="SMTP Password" value={techKeys.smtpPass} onChange={(v:any) => setTechKeys({...techKeys, smtpPass: v})} icon={Key} type="password" />
              
              {/* New Service Keys */}
              <InputField label="Resend API Key" value={techKeys.resendApiKey || ''} onChange={(v:any) => setTechKeys({...techKeys, resendApiKey: v})} icon={Key} type="password" />
              <InputField label="Brevo API Key" value={techKeys.brevoApiKey || ''} onChange={(v:any) => setTechKeys({...techKeys, brevoApiKey: v})} icon={Key} type="password" />
              <InputField label="Mailgun API Key" value={techKeys.mailgunApiKey || ''} onChange={(v:any) => setTechKeys({...techKeys, mailgunApiKey: v})} icon={Key} type="password" />
              <InputField label="Gmail App Password" value={techKeys.gmailAppPassword || ''} onChange={(v:any) => setTechKeys({...techKeys, gmailAppPassword: v})} icon={Key} type="password" />
              <InputField label="Cloudinary URL" value={techKeys.cloudinaryUrl || ''} onChange={(v:any) => setTechKeys({...techKeys, cloudinaryUrl: v})} icon={Globe} type="password" />
              <InputField label="Supabase Service Role" value={techKeys.supabaseServiceRoleKey || ''} onChange={(v:any) => setTechKeys({...techKeys, supabaseServiceRoleKey: v})} icon={Database} type="password" />
              <InputField label="Upstash Redis URL" value={techKeys.upstashRedisUrl || ''} onChange={(v:any) => setTechKeys({...techKeys, upstashRedisUrl: v})} icon={Server} />
              <InputField label="Upstash Redis Token" value={techKeys.upstashRedisToken || ''} onChange={(v:any) => setTechKeys({...techKeys, upstashRedisToken: v})} icon={Key} type="password" />

              <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                <InputField label="Gemini AI API Key" value={techKeys.geminiApiKey} onChange={(v:any) => setTechKeys({...techKeys, geminiApiKey: v})} icon={Cpu} type="password" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Flags */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Push Protocol</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Automation Controls</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Master Push Switch', value: pushConfig.enabled, key: 'enabled' },
                { label: 'Low Signal (-dBm) Alerts', value: pushConfig.lowSignalAlerts, key: 'lowSignalAlerts' },
                { label: 'Invoice Generation Alerts', value: pushConfig.invoiceAlerts, key: 'invoiceAlerts' },
                { label: 'Marketing Auto-Push', value: pushConfig.marketingAlerts, key: 'marketingAlerts' },
                { label: 'Auto-Expire Reminders', value: pushConfig.autoExpireAlerts, key: 'autoExpireAlerts' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPushConfig({ ...pushConfig, [item.key]: !item.value })}
                  className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all group"
                >
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
                  <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${item.value ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ${item.value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 bg-blue-500/10 rounded-[2rem] border border-blue-500/20">
              <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest leading-loose text-center">
                System will utilize the Service Worker background process to deliver these events even when the dashboard is closed.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-600">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Node Security</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credential Encryption</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                All keys shown here are synchronized with the primary Firestore registry. Ensure you keep the VAPID key updated for FCM browser support.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;

