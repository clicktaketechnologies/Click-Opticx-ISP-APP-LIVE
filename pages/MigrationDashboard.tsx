import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertCircle, RotateCw, Database, Cloud, Activity, List, ChevronDown, ChevronUp, Zap, AlertTriangle, ArrowLeftRight, Download, RotateCcw, Rocket } from 'lucide-react';
import { AppState } from '../types';
import { getDualWriteStatus, switchMigrationMode, MigrationMode } from '../lib/db-adapter';

interface Props { state: AppState; }
const API = '/api/migration';

const MigrationDashboard: React.FC<Props> = ({ state }) => {
  const [stats, setStats] = useState<any>(null);
  const [preflight, setPreflight] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'health' | 'cutover'>('health');
  const [opRunning, setOpRunning] = useState('');
  const [adapterStatus, setAdapterStatus] = useState<any>(null);
  const [confirmText, setConfirmText] = useState('');

  const fetchAll = async () => {
    try {
      const [statsRes, preflightRes, backupsRes] = await Promise.all([
        fetch(`${API}/stats`).then(r => r.json()).catch(() => null),
        fetch(`${API}/preflight`).then(r => r.json()).catch(() => null),
        fetch(`${API}/backups`).then(r => r.json()).catch(() => null),
      ]);
      if (statsRes?.success) setStats(statsRes);
      if (preflightRes?.success) setPreflight(preflightRes);
      if (backupsRes?.success) setBackups(backupsRes.backups || []);
      setAdapterStatus(getDualWriteStatus());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 30000); return () => clearInterval(i); }, []);

  const runOp = async (endpoint: string, method = 'POST', body?: any) => {
    setOpRunning(endpoint);
    try {
      await fetch(`${API}/${endpoint}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      setTimeout(fetchAll, 3000);
    } catch (e) { alert(`Operation failed: ${(e as Error).message}`); }
    finally { setTimeout(() => setOpRunning(''), 2000); }
  };

  const handleCutover = async () => {
    if (confirmText !== 'CUTOVER') return alert('Type CUTOVER to confirm');
    await runOp('cutover', 'POST', { confirm: 'CUTOVER_CONFIRMED' });
    setConfirmText('');
  };

  const handleRollback = async () => {
    if (!window.confirm('⚠️ ROLLBACK to Firebase primary? This is immediate.')) return;
    await runOp('rollback');
  };

  const handleModeSwitch = async (mode: MigrationMode) => {
    const res = await switchMigrationMode(mode);
    if (!res.success) alert(`Mode switch failed: ${res.error}`);
    fetchAll();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RotateCw className="text-blue-500 animate-spin" size={32} />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Migration Control Plane...</p>
    </div>
  );

  const currentMode = adapterStatus?.migrationMode || stats?.migrationConfig?.migration_mode || 'firebase_only';
  const syncHealth = stats?.latestStats?.[0] ? Math.round((stats.latestStats[0].synced_count / Math.max(stats.latestStats[0].total_count, 1)) * 100) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"><Shield className="text-white" size={20} /></div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Migration Control Plane</h1>
          </div>
          <p className="text-slate-500 font-medium ml-[52px]">Phase 3: Cutover & Optimization Engine</p>
        </div>
        <div className="flex gap-3">
          <ModeChip mode={currentMode} />
          {['health', 'cutover'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {tab === 'health' ? 'Health Monitor' : 'Cutover Control'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'health' ? (
        <>
          {/* Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Sync Health" value={`${syncHealth}%`} sub="Firebase vs Supabase" color={syncHealth >= 99 ? 'emerald' : 'amber'} icon={CheckCircle2} />
            <StatCard title="Mismatches" value={stats?.latestStats?.[0]?.mismatch_count || 0} sub="Requiring attention" color={stats?.latestStats?.[0]?.mismatch_count > 0 ? 'rose' : 'emerald'} icon={AlertCircle} />
            <StatCard title="Retry Queue" value={adapterStatus?.retryQueueDepth || 0} sub="Pending writes" color={adapterStatus?.retryQueueDepth > 0 ? 'amber' : 'emerald'} icon={Activity} />
            <StatCard title="Total Syncs" value={adapterStatus?.syncStats?.totalWrites || 0} sub={`${adapterStatus?.syncStats?.failedWrites || 0} failed`} color="blue" icon={Database} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <OpButton label="Validate Now" icon={RotateCw} running={opRunning === 'validate'} onClick={() => runOp('validate')} />
            <OpButton label="Export Backup" icon={Download} running={opRunning === 'backup'} onClick={() => runOp('backup')} />
            <OpButton label="Force Sync" icon={ArrowLeftRight} running={opRunning === 'force-sync'} onClick={() => runOp('force-sync')} variant="warning" />
          </div>

          {/* Validation History + Provider Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><List size={16} className="text-blue-500" />Validation History</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {(stats?.latestStats || []).map((s: any) => (<ValItem key={s.id} item={s} />))}
                {(!stats?.latestStats || stats.latestStats.length === 0) && <p className="text-slate-400 text-sm">No validation data yet</p>}
              </div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2"><Cloud size={16} className="text-blue-400" />Provider Reliability</h3>
              <div className="space-y-5">
                {Object.entries(stats?.providerHealth || {}).map(([name, data]: any) => (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold capitalize">{name}</span>
                      <span className="text-xs font-black text-blue-400">{Math.round((data.success / Math.max(data.total, 1)) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${(data.success / Math.max(data.total, 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {Object.keys(stats?.providerHealth || {}).length === 0 && <p className="text-slate-500 text-sm">No provider data yet</p>}
              </div>
            </div>
          </div>

          {/* Table Counts */}
          {stats?.tableCounts && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><Database size={16} className="text-indigo-500" />Supabase Table Records</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.tableCounts).map(([t, c]: any) => (
                  <div key={t} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.replace(/_/g, ' ')}</div>
                    <div className="text-xl font-black text-slate-800">{typeof c === 'number' ? c.toLocaleString() : c}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backups */}
          {backups.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><Download size={16} className="text-emerald-500" />Available Backups</h3>
              <div className="space-y-2">
                {backups.map(b => (
                  <div key={b.name} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-700">{b.name}</span>
                    <div className="flex gap-4 text-[10px] text-slate-400 font-bold">
                      <span>{b.size}</span><span>{new Date(b.created).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* CUTOVER TAB */}
          {/* Pre-flight Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2"><Shield size={16} className="text-indigo-500" />Pre-Cutover Checklist</h3>
              {preflight && <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${preflight.overallReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{preflight.overallReady ? 'Ready' : 'Not Ready'}</span>}
            </div>
            <div className="space-y-3">
              {(preflight?.checks || []).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.status === 'pass' ? 'bg-emerald-100 text-emerald-600' : c.status === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                    {c.status === 'pass' ? <CheckCircle2 size={16} /> : c.status === 'warn' ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{c.detail}</div>
                  </div>
                  <span className={`text-[9px] font-black uppercase ${c.status === 'pass' ? 'text-emerald-500' : c.status === 'warn' ? 'text-amber-500' : 'text-rose-500'}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Migration Mode Switcher */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><ArrowLeftRight size={16} className="text-blue-500" />Migration Mode Control</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { mode: 'firebase_only' as MigrationMode, label: 'Firebase Only', desc: 'Original mode. No Supabase interaction.', color: 'slate' },
                { mode: 'dual_write' as MigrationMode, label: 'Dual Write', desc: 'Writes to both. Firebase is primary. Safe rollback.', color: 'blue' },
                { mode: 'supabase_primary' as MigrationMode, label: 'Supabase Primary', desc: 'Supabase is primary. Firebase writes disabled.', color: 'indigo' },
              ]).map(m => (
                <button key={m.mode} onClick={() => handleModeSwitch(m.mode)} disabled={currentMode === m.mode}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${currentMode === m.mode ? `border-${m.color}-500 bg-${m.color}-50 ring-2 ring-${m.color}-200` : 'border-slate-200 hover:border-slate-300 bg-white'} disabled:cursor-default`}>
                  <div className="flex items-center gap-2 mb-2">
                    {currentMode === m.mode && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    <span className="text-xs font-black uppercase tracking-tight text-slate-800">{m.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cutover + Rollback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Rocket size={24} /><h3 className="text-lg font-black tracking-tight">Execute Final Cutover</h3>
              </div>
              <p className="text-indigo-200 text-sm mb-6 leading-relaxed">This switches the primary database to Supabase and disables Firebase writes. Ensure all pre-flight checks pass before proceeding.</p>
              <div className="flex gap-3 items-center">
                <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder='Type "CUTOVER" to confirm'
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/30" />
                <button onClick={handleCutover} disabled={confirmText !== 'CUTOVER' || opRunning === 'cutover'}
                  className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-30 hover:bg-indigo-50 transition-all shadow-lg">
                  {opRunning === 'cutover' ? 'Executing...' : 'Execute'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-600 to-red-700 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <RotateCcw size={24} /><h3 className="text-lg font-black tracking-tight">Emergency Rollback</h3>
              </div>
              <p className="text-rose-200 text-sm mb-6 leading-relaxed">Instantly reverts to Firebase as primary with dual-write re-enabled. Use this if you detect data issues after cutover.</p>
              <button onClick={handleRollback} disabled={currentMode === 'firebase_only' || opRunning === 'rollback'}
                className="px-6 py-3 bg-white text-rose-700 rounded-xl font-black uppercase tracking-widest text-[10px] disabled:opacity-30 hover:bg-rose-50 transition-all shadow-lg">
                {opRunning === 'rollback' ? 'Rolling Back...' : 'Rollback to Firebase'}
              </button>
            </div>
          </div>

          {/* Roadmap */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm mt-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-slate-50 -skew-x-12 translate-x-12" />
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8 relative">Migration Roadmap</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {[
                { s: '1', t: 'Dual Write', d: 'Mirrors writes to Supabase.', done: true },
                { s: '2', t: 'Deep Validation', d: 'Nightly parity checks.', done: true },
                { s: '3', t: 'Cutover', d: 'Switch primary to Supabase.', done: currentMode === 'supabase_primary' },
                { s: '4', t: 'Cleanup', d: 'Remove Firebase writes. Optimize.', done: false },
              ].map(r => (
                <div key={r.s} className={`p-5 rounded-2xl border transition-all ${r.done ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${r.done ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500'}`}>{r.done ? '✓' : r.s}</span>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{r.t}</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{r.d}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Sub-Components ───────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, color, icon: Icon }: any) => {
  const c: any = { blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-center justify-between hover:border-blue-300 transition-all">
      <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4><div className="flex items-baseline gap-2"><span className="text-xl font-black text-slate-800">{value}</span><span className="text-[10px] font-bold text-slate-400">{sub}</span></div></div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${c[color] || c.blue}`}><Icon size={18} /></div>
    </div>
  );
};

const ModeChip = ({ mode }: { mode: string }) => {
  const m: any = { firebase_only: { bg: 'bg-slate-100', t: 'text-slate-600', l: 'Firebase' }, dual_write: { bg: 'bg-blue-100', t: 'text-blue-700', l: 'Dual Write' }, supabase_primary: { bg: 'bg-indigo-100', t: 'text-indigo-700', l: 'Supabase Primary' } };
  const s = m[mode] || m.firebase_only;
  return <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.bg} ${s.t}`}>{s.l}</span>;
};

const OpButton = ({ label, icon: Icon, running, onClick, variant }: any) => (
  <button onClick={onClick} disabled={running}
    className={`px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm ${variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-900 hover:bg-black text-white'}`}>
    {running ? <Activity className="animate-spin" size={14} /> : <Icon size={14} />}{label}
  </button>
);

const ValItem = ({ item }: { item: any }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden ${open ? 'ring-2 ring-indigo-500/20' : ''}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => setOpen(!open)}>
        <div>
          <div className="flex items-center gap-2 mb-1"><span className="text-xs font-black text-slate-800 uppercase">{item.collection}</span><span className="text-[10px] font-bold text-slate-400 font-mono">{item.batch_id}</span></div>
          <p className="text-[11px] text-slate-500 font-medium">Verified {item.synced_count} of {item.total_count}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className={`text-xs font-black ${item.mismatch_count > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{item.mismatch_count > 0 ? `${item.mismatch_count} Mismatches` : '✓ Perfect'}</div>
            <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(item.last_validated).toLocaleTimeString()}</span>
          </div>
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="pt-3 border-t border-slate-200">
            {item.mismatch_count > 0 ? (
              <div><h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Mismatching IDs</h5>
                <div className="flex flex-wrap gap-1.5">{(item.mismatch_ids || []).map((id: string) => (<span key={id} className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-mono border border-rose-100">{id}</span>))}</div>
              </div>
            ) : (<div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={12} /><span className="text-[10px] font-bold uppercase tracking-widest">All items accounted for.</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationDashboard;
