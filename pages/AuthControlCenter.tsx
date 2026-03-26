import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { AppState, AuthSettings, Role } from '../types';
import { ShieldCheck, Save, CheckCircle, ToggleLeft, ToggleRight, LayoutGrid, AlertCircle, Settings2, Key, Users, CopyPlus, MessageSquare, Play, FileText, Terminal, Activity, Download } from 'lucide-react';

const DEFAULT_AUTH_SETTINGS: AuthSettings = {
  loginEnabled: true,
  signupEnabled: true,
  forgotPasswordEnabled: true,
  otpEnabled: true,
  dealerSignupEnabled: false,
  enableUniversalLogin: true,
  allowedIdentifiers: { email: true, phone: true, cnic: true, username: true, pppoe: true },
  signupMode: 'Auto',
  requireEmailVerification: false,
  requirePhoneOTP: false,
  requireCNIC: false,
  defaultRole: Role.CUSTOMER,
  duplicateControl: { enabled: true, blockDuplicate: true, allowWithWarning: false },
  securitySettings: { maxLoginAttempts: 5, blockDurationMin: 10, enableCaptcha: false, enable2FA: false },
  forgotPasswordSettings: { resetViaEmail: true, resetViaOTP: true, resetViaUsername: false },
  postSignup: { welcomePopup: true, customMessage: 'Welcome to Click Optix!', redirectUrl: '/dashboard' }
};

interface Props {
  state: AppState;
}

const AuthControlCenter: React.FC<Props> = ({ state }) => {
  const [settings, setSettings] = useState<AuthSettings>(state.settings.authSettings || DEFAULT_AUTH_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'universal' | 'signup' | 'duplicate' | 'security' | 'forgot' | 'postSignup' | 'comm' | 'tester'>('global');
  const [isTesting, setIsTesting] = useState(false);
  const [testLog, setTestLog] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setSettings(state.settings.authSettings || DEFAULT_AUTH_SETTINGS);
  }, [state.settings.authSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    await db.updateSettings({ ...state.settings, authSettings: settings });
    setIsSaving(false);
    alert('Authentication Settings Saved Successfully!');
  };

  const runTester = async () => {
    setIsTesting(true);
    setTestLog([]);
    await db.runSystemTester((log) => {
      setTestLog(prev => [log, ...prev]);
    });
    setIsTesting(false);
  };

  const handleVerifySMTP = async () => {
    setIsVerifying(true);
    const res = await db.verifySMTP(state.settings.commConfig.smtpConfig);
    if (res.success) {
      alert('✅ SMTP Handshake Successful! Relay node operational.');
    } else {
      alert(`❌ Connection Failed: ${res.message}. Check credentials or firewall.`);
    }
    setIsVerifying(false);
  };

  const exportTestLogs = () => {
    const content = testLog.map(l => `[${l.timestamp}] ${l.module} > ${l.action} : ${l.status} - ${l.details}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `System_Diagnostic_${new Date().toISOString().split('T')[0]}.log`;
    a.click();
  };

  const updateSetting = (key: keyof AuthSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const updateNestedSetting = (key: keyof AuthSettings, nestedKey: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] as any),
        [nestedKey]: value
      }
    }));
  };

  const ToggleItem = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm border rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => onChange(!value)}>
      <span className="text-[11px] font-black uppercase text-slate-700 tracking-widest">{label}</span>
      {value ? <ToggleRight className="text-emerald-500" size={28} /> : <ToggleLeft className="text-slate-300" size={28} />}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3"><ShieldCheck className="text-indigo-600" size={28}/> Auth Control Center (ACC)</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Universal Login & Security Infrastructure Engine</p>
         </div>
         <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
            {isSaving ? <LayoutGrid className="animate-spin" size={16} /> : <Save size={16} />} Save Settings
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Sidebar Tabs */}
         <div className="md:col-span-1 space-y-2">
            {[
              { id: 'global', icon: Settings2, label: 'Global Toggles' },
              { id: 'universal', icon: LayoutGrid, label: 'Universal Login' },
              { id: 'signup', icon: Users, label: 'Signup Config' },
              { id: 'duplicate', icon: CopyPlus, label: 'Duplicate Engine' },
              { id: 'security', icon: ShieldCheck, label: 'Security & Limits' },
              { id: 'forgot', icon: Key, label: 'Password Recovery' },
              { id: 'postSignup', icon: MessageSquare, label: 'Post-Signup' },
              { id: 'comm', icon: MessageSquare, label: 'Comm Gateway' },
              { id: 'tester', icon: Activity, label: 'System Tester' }
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
               >
                  <tab.icon size={16} /> {tab.label}
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="md:col-span-3 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px]">
             {activeTab === 'global' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Global Activation Toggles</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ToggleItem label="Master Login Switch" value={settings.loginEnabled} onChange={v => updateSetting('loginEnabled', v)} />
                      <ToggleItem label="Master Signup Switch" value={settings.signupEnabled} onChange={v => updateSetting('signupEnabled', v)} />
                      <ToggleItem label="Forgot Password Routing" value={settings.forgotPasswordEnabled} onChange={v => updateSetting('forgotPasswordEnabled', v)} />
                      <ToggleItem label="Global OTP Engine" value={settings.otpEnabled} onChange={v => updateSetting('otpEnabled', v)} />
                      <ToggleItem label="Dealer Portal Signup" value={settings.dealerSignupEnabled} onChange={v => updateSetting('dealerSignupEnabled', v)} />
                   </div>
                </div>
             )}

             {activeTab === 'universal' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Universal Login Rules</h2>
                   <ToggleItem label="Enable Universal Detection (Regex)" value={settings.enableUniversalLogin} onChange={v => updateSetting('enableUniversalLogin', v)} />
                   
                   <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Allowed Login Identifiers</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {['email', 'phone', 'cnic', 'username', 'pppoe'].map(id => (
                            <label key={id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300">
                               <input type="checkbox" className="accent-indigo-600 w-4 h-4" checked={(settings.allowedIdentifiers as any)[id]} onChange={e => updateNestedSetting('allowedIdentifiers', id, e.target.checked)} />
                               <span className="text-[10px] font-black uppercase text-slate-600">{id}</span>
                            </label>
                         ))}
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'signup' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Signup Workflow Configuration</h2>
                   
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-500">Approval Workflow Mode</label>
                      <select 
                         className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 transition-colors"
                         value={settings.signupMode}
                         onChange={e => updateSetting('signupMode', e.target.value)}
                      >
                         <option value="Auto">Auto-Activate Instantly</option>
                         <option value="Manual">Manual Approval (Admin Panel)</option>
                         <option value="Dealer">Dealer Assigned (Pending Mapping)</option>
                      </select>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest px-2 font-bold">{
                         settings.signupMode === 'Auto' ? 'Subscribers bypass review and become ACTIVE immediately.' :
                         settings.signupMode === 'Manual' ? 'Subscribers sit in the Master Approval Queue for Admin review.' :
                         'Subscribers sit in the Dealer bucket pending final port allocation.'
                      }</p>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <ToggleItem label="Require Email Verification" value={settings.requireEmailVerification} onChange={v => updateSetting('requireEmailVerification', v)} />
                      <ToggleItem label="Require Phone SMS OTP" value={settings.requirePhoneOTP} onChange={v => updateSetting('requirePhoneOTP', v)} />
                      <ToggleItem label="Enforce CNIC Field" value={settings.requireCNIC} onChange={v => updateSetting('requireCNIC', v)} />
                   </div>
                </div>
             )}

             {activeTab === 'duplicate' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Duplicate Detection Engine</h2>
                   <ToggleItem label="Activate Duplicate Engine" value={settings.duplicateControl.enabled} onChange={v => updateNestedSetting('duplicateControl', 'enabled', v)} />
                   
                   {settings.duplicateControl.enabled && (
                      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-4">
                         <div className="flex gap-3 text-rose-600 mb-2">
                            <AlertCircle size={20} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">System scans Email, Phone, CNIC & Username against active DB.</p>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ToggleItem label="Auto-Block Duplicates" value={settings.duplicateControl.blockDuplicate} onChange={v => { updateNestedSetting('duplicateControl', 'blockDuplicate', v); if(v) updateNestedSetting('duplicateControl', 'allowWithWarning', false); }} />
                            <ToggleItem label="Allow but flag as Warning" value={settings.duplicateControl.allowWithWarning} onChange={v => { updateNestedSetting('duplicateControl', 'allowWithWarning', v); if(v) updateNestedSetting('duplicateControl', 'blockDuplicate', false); }} />
                         </div>
                      </div>
                   )}
                </div>
             )}

             {activeTab === 'security' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Security & Limits</h2>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Failed Logins</label>
                         <input type="number" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none" value={settings.securitySettings.maxLoginAttempts} onChange={e => updateNestedSetting('securitySettings', 'maxLoginAttempts', parseInt(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lockout Duration (Mins)</label>
                         <input type="number" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none" value={settings.securitySettings.blockDurationMin} onChange={e => updateNestedSetting('securitySettings', 'blockDurationMin', parseInt(e.target.value))} />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <ToggleItem label="Enforce CAPTCHA" value={settings.securitySettings.enableCaptcha} onChange={v => updateNestedSetting('securitySettings', 'enableCaptcha', v)} />
                      <ToggleItem label="Requires 2FA (Admin Only)" value={settings.securitySettings.enable2FA} onChange={v => updateNestedSetting('securitySettings', 'enable2FA', v)} />
                   </div>
                </div>
             )}

             {activeTab === 'forgot' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Recovery Trajectories</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ToggleItem label="Reset Link via Email" value={settings.forgotPasswordSettings.resetViaEmail} onChange={v => updateNestedSetting('forgotPasswordSettings', 'resetViaEmail', v)} />
                      <ToggleItem label="Direct OTP Verification" value={settings.forgotPasswordSettings.resetViaOTP} onChange={v => updateNestedSetting('forgotPasswordSettings', 'resetViaOTP', v)} />
                      <ToggleItem label="Allow Username Lookup" value={settings.forgotPasswordSettings.resetViaUsername} onChange={v => updateNestedSetting('forgotPasswordSettings', 'resetViaUsername', v)} />
                   </div>
                </div>
             )}

             {activeTab === 'postSignup' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Post-Signup UX Rules</h2>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <ToggleItem label="Show Welcome Popup" value={settings.postSignup.welcomePopup} onChange={v => updateNestedSetting('postSignup', 'welcomePopup', v)} />
                   </div>
                   
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Routing Target (URL)</label>
                       <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none" value={settings.postSignup.redirectUrl} onChange={e => updateNestedSetting('postSignup', 'redirectUrl', e.target.value)} />
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Welcome Message Payload</label>
                       <textarea className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold outline-none min-h-[100px]" value={settings.postSignup.customMessage} onChange={e => updateNestedSetting('postSignup', 'customMessage', e.target.value)} />
                   </div>
                </div>
             )}
 
             {activeTab === 'comm' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <h2 className="text-lg font-black uppercase italic tracking-widest mb-4 border-b pb-4 text-slate-800">Communication Gateway</h2>
                   
                   <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-6 cursor-pointer" onClick={() => db.updateSettings({...state.settings, commConfig: {...state.settings.commConfig, simulationMode: !state.settings.commConfig.simulationMode}})}>
                      <div className="flex items-center gap-3">
                         <Terminal size={20} className="text-amber-600" />
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">- Payment Due Simulation Mode</p>
                            <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest opacity-70">When active, no real Email/SMS will be sent. Logs only.</p>
                         </div>
                      </div>
                      {state.settings.commConfig.simulationMode ? <ToggleRight className="text-amber-500" size={28} /> : <ToggleLeft className="text-slate-300" size={28} />}
                   </div>
                   
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                            <Settings2 size={16} className="text-indigo-500" /> SMTP Configuration
                         </h3>
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={handleVerifySMTP}
                                disabled={isVerifying}
                                className={`px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-md tracking-tighter hover:bg-slate-50 transition-all ${isVerifying ? 'opacity-50' : ''}`}
                             >
                                {isVerifying ? 'Verifying...' : 'Verify Connection'}
                             </button>
                             <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-md tracking-tighter border border-emerald-200">ACTIVE</span>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Relay Host</label>
                            <input 
                               type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" 
                               value={state.settings.commConfig.smtpConfig.host} 
                               onChange={e => db.updateSettings({...state.settings, commConfig: {...state.settings.commConfig, smtpConfig: {...state.settings.commConfig.smtpConfig, host: e.target.value}}})}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Relay Port</label>
                            <input 
                               type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" 
                               value={state.settings.commConfig.smtpConfig.port}
                               onChange={e => db.updateSettings({...state.settings, commConfig: {...state.settings.commConfig, smtpConfig: {...state.settings.commConfig.smtpConfig, port: parseInt(e.target.value)}}})}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">SMTP Username</label>
                            <input 
                               type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" 
                               value={state.settings.commConfig.smtpConfig.username}
                               onChange={e => db.updateSettings({...state.settings, commConfig: {...state.settings.commConfig, smtpConfig: {...state.settings.commConfig.smtpConfig, username: e.target.value}}})}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Access Key / Pass</label>
                            <input 
                               type="password" placeholder="••••••••" 
                               className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" 
                               onChange={e => db.updateSettings({...state.settings, commConfig: {...state.settings.commConfig, smtpConfig: {...state.settings.commConfig.smtpConfig, password: e.target.value}}})}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-indigo-700">Diagnostic Toolbench</h3>
                      <p className="text-[9px] text-indigo-500 uppercase font-black tracking-widest mb-2 opacity-70">Run live handshakes to verify outbound trajectories.</p>
                      <div className="flex flex-wrap gap-4">
                         <button 
                            onClick={async () => {
                               const res = await db.testCommunication('Email', state.currentUser?.email || 'admin@clickoptix.com');
                               if(res.success) alert('✅ Diagnostic Email - Payment Dueed! Check communication logs.');
                            }}
                            className="px-6 py-4 bg-white text-indigo-600 border border-indigo-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                         >
                            Send Test Email
                         </button>
                         <button 
                            onClick={async () => {
                               const res = await db.testCommunication('SMS', '03456789012');
                               if(res.success) alert('✅ Diagnostic SMS Routed! Check gateway logs.');
                            }}
                            className="px-6 py-4 bg-white text-indigo-600 border border-indigo-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                         >
                            Send Test SMS
                         </button>
                      </div>
                   </div>

                   {/* Comm Logs Table */}
                   <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Recent Communication Logs</h3>
                      <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                         <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100">
                               <tr>
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Timestamp</th>
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Type</th>
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Recipient</th>
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Gateway</th>
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Status</th>
                                  <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Latency</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold text-[10px]">
                               {(state.commLogs || []).slice(-15).reverse().map((log: any) => (
                                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(log.sentAt || log.timestamp).toLocaleTimeString()}</td>
                                     <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full ${log.type === 'Email' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                           {log.type || 'Email'}
                                        </span>
                                     </td>
                                     <td className="px-4 py-3 text-slate-700">{log.email || log.target}</td>
                                     <td className="px-4 py-3 text-slate-400 italic">{log.sentBy || log.provider}</td>
                                     <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                           <CheckCircle size={10} /> {log.status}
                                        </div>
                                     </td>
                                     <td className="px-4 py-3 text-slate-500 font-mono">{log.latency || '---'}ms</td>
                                  </tr>
                               ))}
                               {(state.commLogs || []).length === 0 && (
                                  <tr>
                                     <td colSpan={6} className="px-4 py-8 text-center text-slate-400 uppercase italic tracking-widest">No communication handshakes detected in registry.</td>
                                  </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'tester' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="flex items-center justify-between border-b pb-4 mb-4">
                      <h2 className="text-lg font-black uppercase italic tracking-widest text-slate-800">System Integrity Bot "Tester"</h2>
                      <div className="flex gap-2">
                         <button 
                            onClick={runTester} 
                            disabled={isTesting}
                            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${isTesting ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95'}`}
                         >
                            {isTesting ? <Activity className="animate-spin" size={16} /> : <Play size={16} />} 
                            {isTesting ? 'Bot Injected & Scanning...' : 'Start Integrity Scan'}
                         </button>
                         {testLog.length > 0 && (
                            <button onClick={exportTestLogs} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm overflow-hidden flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                               <Download size={16} /> Export Log
                            </button>
                         )}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      {isTesting && (
                         <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                            <div className="h-2 flex-1 bg-indigo-200 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-600 animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                            <span className="text-[9px] font-black uppercase text-indigo-700 animate-pulse italic">Scanning System Nodes...</span>
                         </div>
                      )}

                      {testLog.length === 0 && !isTesting && (
                         <div className="py-20 flex flex-col items-center justify-center text-slate-300 space-y-4">
                            <Terminal size={48} className="opacity-20" />
                            <p className="font-black text-[10px] uppercase tracking-widest">Bot Standby. Ready for System Handshake.</p>
                         </div>
                      )}

                      <div className="space-y-3">
                         {testLog.map((log) => (
                            <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all animate-in slide-in-from-top-2 duration-300">
                               <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-lg ${
                                     log.status === 'Working' ? 'bg-emerald-100 text-emerald-600' : 
                                     log.status === 'Warning' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                  }`}>
                                     {log.status === 'Working' ? <CheckCircle size={16} /> : log.status === 'Warning' ? <AlertCircle size={16} /> : <Activity size={16} />}
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-800">{log.module}</span>
                                        <span className="text-[10px] text-slate-300 opacity-50 font-bold tracking-widest">/</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{log.action}</span>
                                     </div>
                                     <p className="text-[9px] text-slate-400 font-bold mt-0.5">{log.details}</p>
                                  </div>
                               </div>
                               <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                  log.status === 'Working' ? 'bg-emerald-50 text-emerald-700' : 
                                  log.status === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                               }`}>{log.status}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default AuthControlCenter;


