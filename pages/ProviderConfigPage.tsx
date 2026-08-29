import React, { useState, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { getConfig, setConfig, getConfigHistory, initConfigLoader } from '../lib/config-loader';
import {
  Settings, Mail, HardDrive, Wifi, Brain, Shield, CheckCircle, XCircle,
  AlertTriangle, RotateCw, Save, RotateCcw, ChevronDown, ChevronUp,
  Eye, EyeOff, Loader, Zap, Clock, Activity, Info
} from 'lucide-react';

interface Props { state: AppState; }

type ProviderStatus = 'healthy' | 'rate_limited' | 'circuit_open' | 'disabled' | 'testing' | 'unknown';

const StatusDot: React.FC<{ status: ProviderStatus }> = ({ status }) => {
  const map: Record<ProviderStatus, { color: string; label: string }> = {
    healthy:      { color: 'bg-emerald-500', label: '🟢 Healthy' },
    rate_limited: { color: 'bg-amber-400',   label: '🟡 Rate Limited' },
    circuit_open: { color: 'bg-rose-500',    label: '🔴 Circuit Open' },
    disabled:     { color: 'bg-slate-400',   label: '⚪ Disabled' },
    testing:      { color: 'bg-blue-400 animate-pulse', label: '🔵 Testing...' },
    unknown:      { color: 'bg-slate-300',   label: '❓ Unknown' },
  };
  const { color, label } = map[status];
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
};

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }> = ({ icon, title, subtitle, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center">{icon}</div>
          <div className="text-left">
            <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{title}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-3 border-t border-slate-50 pt-4">{children}</div>}
    </div>
  );
};

const ProviderRow: React.FC<{
  id: string; name: string; enabled: boolean; priority: number;
  status: ProviderStatus; onTest: () => void; onToggle: () => void;
  fields?: React.ReactNode; testLoading?: boolean;
}> = ({ id, name, enabled, priority, status, onTest, onToggle, fields, testLoading }) => (
  <div className={`border rounded-xl p-4 transition-all ${enabled ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white opacity-60'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded-md text-[9px] font-black flex items-center justify-center">#{priority}</span>
        <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{name}</span>
        <StatusDot status={enabled ? status : 'disabled'} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onTest} disabled={!enabled || testLoading}
          className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center gap-1">
          {testLoading ? <Loader size={10} className="animate-spin" /> : <Zap size={10} />}
          Test
        </button>
        <button onClick={onToggle}
          className={`w-11 h-6 rounded-full transition-all relative ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>
    </div>
    {fields && <div className="mt-3 border-t border-slate-100 pt-3">{fields}</div>}
  </div>
);

const ProviderConfigPage: React.FC<Props> = ({ state }) => {
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, ProviderStatus>>({});
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latencyMs?: number }>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    initConfigLoader().then(() => {
      const keys = ['email_providers', 'storage_providers', 'network_providers', 'ai_modules', 'system_modules', 'migration_control'];
      const loaded: Record<string, any> = {};
      keys.forEach(k => { loaded[k] = getConfig(k) || {}; });
      setConfigs(loaded);
    });
  }, []);

  const save = useCallback(async (key: string, value: any) => {
    setSaving(s => ({ ...s, [key]: true }));
    const res = await setConfig(key, value, state.currentUser?.email || 'admin');
    setSaving(s => ({ ...s, [key]: false }));
    if (res.success) showToast(`"${key}" saved successfully`, true);
    else showToast(`Save failed: ${res.error}`, false);
  }, [state.currentUser]);

  const updateProviderField = (configKey: string, providerId: string, field: string, value: any) => {
    setConfigs(prev => {
      const cfg = { ...prev[configKey] };
      cfg.providers = (cfg.providers || []).map((p: any) => p.id === providerId ? { ...p, [field]: value } : p);
      return { ...prev, [configKey]: cfg };
    });
  };

  const testProvider = async (providerType: string, providerId: string) => {
    const key = `${providerType}_${providerId}`;
    setTestLoading(t => ({ ...t, [key]: true }));
    setTestStatus(s => ({ ...s, [key]: 'testing' }));
    try {
      const res = await fetch(`${backendUrl}/api/config/test-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}` },
        body: JSON.stringify({ providerType, providerId }),
      });
      const data = await res.json();
      setTestResults(r => ({ ...r, [key]: data }));
      setTestStatus(s => ({ ...s, [key]: data.success ? 'healthy' : 'circuit_open' }));
    } catch {
      setTestStatus(s => ({ ...s, [key]: 'circuit_open' }));
      setTestResults(r => ({ ...r, [key]: { success: false, message: 'Network error' } }));
    }
    setTestLoading(t => ({ ...t, [key]: false }));
  };

  const emailCfg = configs['email_providers'] || {};
  const storageCfg = configs['storage_providers'] || {};
  const networkCfg = configs['network_providers'] || {};
  const aiCfg = configs['ai_modules'] || {};
  const sysCfg = configs['system_modules'] || {};
  const migCfg = configs['migration_control'] || {};

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Provider Configuration</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Runtime config — changes apply instantly without restart</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${migCfg.dual_write_enabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
          {migCfg.dual_write_enabled ? '🔄 Dual-Write Active' : '📡 Firebase Primary'}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-white text-[11px] font-black ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* ── EMAIL PROVIDERS ── */}
      <SectionCard icon={<Mail size={16} />} title="Email Providers" subtitle="Priority failover chain">
        {(emailCfg.providers || []).map((p: any) => {
          const key = `email_${p.id}`;
          const result = testResults[key];
          return (
            <div key={p.id}>
              <ProviderRow
                id={p.id} name={p.name} enabled={p.enabled} priority={p.priority}
                status={testStatus[key] || 'unknown'}
                testLoading={testLoading[key]}
                onToggle={() => { updateProviderField('email_providers', p.id, 'enabled', !p.enabled); }}
                onTest={() => testProvider('email', p.id)}
                fields={
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                    <div><span className="font-bold">Daily Limit:</span> {p.daily_limit?.toLocaleString()}</div>
                    <div><span className="font-bold">Monthly:</span> {p.monthly_limit?.toLocaleString()}</div>
                  </div>
                }
              />
              {result && (
                <div className={`mt-1 px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {result.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {result.message}
                  {result.latencyMs && <span className="ml-auto text-slate-400">{result.latencyMs}ms</span>}
                </div>
              )}
            </div>
          );
        })}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From Address</label>
            <input value={emailCfg.from_address || ''} onChange={e => setConfigs(p => ({ ...p, email_providers: { ...p.email_providers, from_address: e.target.value } }))}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quiet Hours</label>
            <div className="flex gap-2 mt-1">
              <input value={emailCfg.quiet_hours?.start || '22:00'} onChange={e => setConfigs(p => ({ ...p, email_providers: { ...p.email_providers, quiet_hours: { ...p.email_providers?.quiet_hours, start: e.target.value } } }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-blue-400" placeholder="22:00" />
              <input value={emailCfg.quiet_hours?.end || '08:00'} onChange={e => setConfigs(p => ({ ...p, email_providers: { ...p.email_providers, quiet_hours: { ...p.email_providers?.quiet_hours, end: e.target.value } } }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-blue-400" placeholder="08:00" />
            </div>
          </div>
        </div>
        <button onClick={() => save('email_providers', emailCfg)} disabled={saving['email_providers']}
          className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving['email_providers'] ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Save Email Config
        </button>
      </SectionCard>

      {/* ── STORAGE PROVIDERS ── */}
      <SectionCard icon={<HardDrive size={16} />} title="Storage Providers" subtitle="KYC & file storage chain">
        {(storageCfg.providers || []).map((p: any) => {
          const key = `storage_${p.id}`;
          const result = testResults[key];
          return (
            <div key={p.id}>
              <ProviderRow
                id={p.id} name={p.name} enabled={p.enabled} priority={p.priority}
                status={testStatus[key] || 'unknown'}
                testLoading={testLoading[key]}
                onToggle={() => updateProviderField('storage_providers', p.id, 'enabled', !p.enabled)}
                onTest={() => testProvider('storage', p.id)}
                fields={<div className="text-[10px] text-slate-500"><span className="font-bold">Max File:</span> {p.max_file_mb}MB</div>}
              />
              {result && (
                <div className={`mt-1 px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {result.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {result.message}
                  {result.latencyMs && <span className="ml-auto text-slate-400">{result.latencyMs}ms</span>}
                </div>
              )}
            </div>
          );
        })}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compression Quality (%)</label>
            <input type="number" min={50} max={100} value={storageCfg.compression_quality || 85}
              onChange={e => setConfigs(p => ({ ...p, storage_providers: { ...p.storage_providers, compression_quality: Number(e.target.value) } }))}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Checksum Verification</label>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => setConfigs(p => ({ ...p, storage_providers: { ...p.storage_providers, checksum_enabled: !p.storage_providers?.checksum_enabled } }))}
                className={`w-11 h-6 rounded-full transition-all relative ${storageCfg.checksum_enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${storageCfg.checksum_enabled ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-[10px] font-bold text-slate-500">SHA256 enabled</span>
            </div>
          </div>
        </div>
        <button onClick={() => save('storage_providers', storageCfg)} disabled={saving['storage_providers']}
          className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving['storage_providers'] ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Save Storage Config
        </button>
      </SectionCard>

      {/* ── NETWORK ── */}
      <SectionCard icon={<Wifi size={16} />} title="Network Providers" subtitle="MikroTik & OLT polling settings">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'MikroTik Polling (s)', key: 'mikrotik.polling_interval_seconds', val: networkCfg.mikrotik?.polling_interval_seconds || 30 },
            { label: 'MikroTik Max Retries', key: 'mikrotik.retry_max_attempts', val: networkCfg.mikrotik?.retry_max_attempts || 3 },
            { label: 'OLT Heartbeat (s)', key: 'olt.heartbeat_interval_seconds', val: networkCfg.olt?.heartbeat_interval_seconds || 60 },
            { label: 'Low Signal Alert (dBm)', key: 'olt.signal_alert_dbm_threshold', val: networkCfg.olt?.signal_alert_dbm_threshold || -30 },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
              <input type="number" defaultValue={f.val}
                onChange={e => {
                  const [section, field] = f.key.split('.');
                  setConfigs(p => ({ ...p, network_providers: { ...p.network_providers, [section]: { ...(p.network_providers?.[section] || {}), [field]: Number(e.target.value) } } }));
                }}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:border-blue-400" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-[11px] font-black text-slate-700">ONU Auto-Discovery Notify</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Alert admin when a new ONU is detected on any OLT port</p>
          </div>
          <button onClick={() => setConfigs(p => ({ ...p, network_providers: { ...p.network_providers, olt: { ...(p.network_providers?.olt || {}), onu_discovery_notify: !p.network_providers?.olt?.onu_discovery_notify } } }))}
            className={`w-11 h-6 rounded-full transition-all relative ${networkCfg.olt?.onu_discovery_notify ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${networkCfg.olt?.onu_discovery_notify ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        <button onClick={() => save('network_providers', networkCfg)} disabled={saving['network_providers']}
          className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving['network_providers'] ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Save Network Config
        </button>
      </SectionCard>

      {/* ── AI MODULES ── */}
      <SectionCard icon={<Brain size={16} />} title="AI Modules" subtitle="Gemini · VAPI · Network · Risk">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[12px] font-black text-rose-800 uppercase">Global AI Kill Switch</p>
            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">Disables ALL AI features instantly</p>
          </div>
          <button onClick={() => setConfigs(p => ({ ...p, ai_modules: { ...p.ai_modules, kill_switch: !p.ai_modules?.kill_switch } }))}
            className={`w-11 h-6 rounded-full transition-all relative ${aiCfg.kill_switch ? 'bg-rose-500' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${aiCfg.kill_switch ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        {[
          { id: 'chat',    label: 'AI Chat (Gemini)',     limitKey: 'token_limit_per_day',   unit: 'tokens/day' },
          { id: 'voice',   label: 'AI Voice (VAPI)',      limitKey: 'minutes_limit_per_day', unit: 'min/day' },
          { id: 'network', label: 'Network Prediction',   limitKey: null,                    unit: '' },
          { id: 'risk',    label: 'Risk Scoring Engine',  limitKey: null,                    unit: '' },
        ].map(m => {
          const mod = aiCfg[m.id] || {};
          return (
            <div key={m.id} className={`p-3 border rounded-xl flex items-center justify-between ${mod.enabled && !aiCfg.kill_switch ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white opacity-60'}`}>
              <div>
                <p className="text-[11px] font-black text-slate-800">{m.label}</p>
                {m.limitKey && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{mod[m.limitKey]?.toLocaleString()} {m.unit}</p>}
              </div>
              <button disabled={aiCfg.kill_switch}
                onClick={() => setConfigs(p => ({ ...p, ai_modules: { ...p.ai_modules, [m.id]: { ...p.ai_modules?.[m.id], enabled: !mod.enabled } } }))}
                className={`w-11 h-6 rounded-full transition-all relative disabled:opacity-40 ${mod.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${mod.enabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          );
        })}
        <button onClick={() => save('ai_modules', aiCfg)} disabled={saving['ai_modules']}
          className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving['ai_modules'] ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Save AI Config
        </button>
      </SectionCard>

      {/* ── MIGRATION CONTROL ── */}
      <SectionCard icon={<Activity size={16} />} title="Migration Control" subtitle="Phase 0 — Firebase ↔ Supabase dual-write">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-blue-900">Dual-Write Mode</p>
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Mirror all writes to Supabase alongside Firebase</p>
            </div>
            <button onClick={() => setConfigs(p => ({ ...p, migration_control: { ...p.migration_control, dual_write_enabled: !p.migration_control?.dual_write_enabled } }))}
              className={`w-11 h-6 rounded-full transition-all relative ${migCfg.dual_write_enabled ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${migCfg.dual_write_enabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
            <span>Current Phase:</span>
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">Phase {migCfg.phase ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
            <span>Primary Source:</span>
            <span className="font-black text-slate-900">{migCfg.primary_source === 'supabase' ? '🐘 Supabase' : '🔥 Firebase'}</span>
          </div>
        </div>
        <button onClick={() => save('migration_control', migCfg)} disabled={saving['migration_control']}
          className="w-full py-3 bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {saving['migration_control'] ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Save Migration Config
        </button>
      </SectionCard>
    </div>
  );
};

export default ProviderConfigPage;
