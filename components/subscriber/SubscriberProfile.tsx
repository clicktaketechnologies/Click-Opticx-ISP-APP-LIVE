
import React, { useState, useMemo, useRef } from 'react';
import { ISPUser, AppState, TechnicalConfig, UserStatus, VerificationStatus, LedgerType } from '../../types';
import { db } from '../../db';
import { 
  User, Shield, Signal, HardDrive, ListChecks, History, 
  Camera, CheckCircle, Mail, Smartphone, MapPin, 
  CreditCard, Info, Save, X, Edit3, Lock, Eye, EyeOff,
  Activity, ArrowRight, Zap, Layers, Globe, Fingerprint, LockIcon,
  ShieldAlert, Cpu, Hash, Monitor, SmartphoneIcon, Clock, RefreshCw, Server, Wifi,
  ShieldCheck
} from 'lucide-react';

interface Props {
  user: ISPUser;
  onLogout: () => void;
}

const SubscriberProfile: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'connection' | 'registry' | 'audit'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const state = db.getState();
  const techConfig = state.settings.techConfig;

  // Identity locked after admin verification
  const isIdentityLocked = user.status !== UserStatus.PENDING_VERIFICATION;

  const handleSaveProfile = async () => {
    if (isIdentityLocked) return;
    const { username, connectionId, ...editableData } = formData;
    const res = await db.updateSubscriberProfile(user.id, editableData);
    if (res.success) setIsEditing(false);
    else alert(res.message);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const res = await db.updateSubscriberProfile(user.id, { profileImage: base64 });
      if (res.success) {
        // Local state update
        setFormData(prev => ({ ...prev, profileImage: base64 }));
      } else {
        alert(res.message);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleBiometric = async () => {
    const nextVal = !formData.biometricAllowed;
    const res = await db.updateSubscriberProfile(user.id, { biometricAllowed: nextVal });
    if (res.success) {
      setFormData(prev => ({ ...prev, biometricAllowed: nextVal }));
      db.logNotification(user.id, 'info', 'Security Update', `Biometric authorization has been ${nextVal ? 'activated' : 'restricted'}.`);
    }
  };

  const completion = useMemo(() => {
    let score = 0;
    if (user.profileImage) score += 20;
    if (user.email) score += 20;
    if (user.phone) score += 20;
    if (user.cnic) score += 20;
    if (user.address) score += 20;
    return score;
  }, [user]);

  const securityLogs = useMemo(() => {
    return (state.securityLogs || [])
      .filter(log => log.targetId === user.id)
      .sort((a,b) => b.timestamp.localeCompare(a.timestamp));
  }, [state.securityLogs, user.id]);

  const mapping = useMemo(() => db.getMappingForUser(user.id), [user.id]);

  const getVerificationUI = () => {
    const status = user.verificationStatus || VerificationStatus.UNVERIFIED;
    switch(status) {
      case VerificationStatus.VERIFIED: 
        return { 
          label: 'Verified Profile', 
          color: 'text-white', 
          bg: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600', 
          icon: ShieldCheck,
          shadow: 'shadow-[0_4px_10px_rgba(16,185,129,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)]',
          border: 'border-b-4 border-emerald-800'
        };
      case VerificationStatus.PENDING: 
        return { 
          label: 'Pending Review', 
          color: 'text-white', 
          bg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600', 
          icon: Clock,
          shadow: 'shadow-[0_4px_10px_rgba(245,158,11,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)]',
          border: 'border-b-4 border-amber-800'
        };
      case VerificationStatus.REVISION: 
        return { 
          label: 'Action Required', 
          color: 'text-white', 
          bg: 'bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600', 
          icon: ShieldAlert,
          shadow: 'shadow-[0_4px_10px_rgba(225,29,72,0.3),inset_0_1px_2px_rgba(255,255,255,0.4)]',
          border: 'border-b-4 border-rose-800'
        };
      default: 
        return { 
          label: 'Unverified Account', 
          color: 'text-slate-200', 
          bg: 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700', 
          icon: Info,
          shadow: 'shadow-[0_4px_10px_rgba(71,85,105,0.3),inset_0_1px_2px_rgba(255,255,255,0.2)]',
          border: 'border-b-4 border-slate-900'
        };
    }
  };

  const vUI = getVerificationUI();

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* Profile Header Hero */}
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
               <div className="w-32 h-32 bg-slate-800 rounded-[2.5rem] flex items-center justify-center border-4 border-slate-900 shadow-2xl overflow-hidden relative transition-transform duration-500 hover:scale-105">
                  {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <User size={64} className="text-slate-600" />}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                       <RefreshCw className="animate-spin text-white" size={24}/>
                    </div>
                  )}
               </div>
               <button 
                onClick={() => imageInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl border-4 border-slate-900 hover:scale-110 hover:bg-indigo-500 transition-all z-20"
               >
                  <Camera size={20} />
               </button>
               <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            
            <div className="text-center md:text-left flex-1 space-y-2">
               <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{user.name}</h2>
                  <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 ${vUI.bg} ${vUI.color} ${vUI.shadow} ${vUI.border} transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:border-b-0`}>
                     <vUI.icon size={12} strokeWidth={3} /> {vUI.label}
                  </div>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{user.connectionId}</p>
               
               <div className="pt-4 space-y-2 w-full max-w-[240px] mx-auto md:mx-0">
                  <div className="flex justify-between items-end">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Profile Completion</span>
                     <span className="text-[10px] font-black text-indigo-400">{completion}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${completion}%` }}></div>
                  </div>
               </div>
            </div>
         </div>
         <Activity className="absolute -right-8 -bottom-8 opacity-5" size={240} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-1">
         {[
           { id: 'personal', label: 'Account', icon: User },
           { id: 'security', label: 'Security', icon: Shield },
           { id: 'connection', label: 'Connection', icon: Signal },
           { id: 'registry', label: 'Network', icon: HardDrive },
           { id: 'audit', label: 'Audit Log', icon: History }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
           >
              <tab.icon size={14} />
              {tab.label}
           </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
         {activeTab === 'personal' && (
            <div className="space-y-6">
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><User size={18} className="text-indigo-600"/> Personal Details</h3>
                     {isIdentityLocked ? (
                       <div className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                          <LockIcon size={14} /> Account Locked
                       </div>
                     ) : !isEditing ? (
                       <button onClick={() => setIsEditing(true)} className="p-3 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"><Edit3 size={18}/></button>
                     ) : (
                       <div className="flex gap-2">
                          <button onClick={() => setIsEditing(false)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={18}/></button>
                          <button onClick={handleSaveProfile} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 active:scale-90 transition-all"><Save size={18}/></button>
                       </div>
                     )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {[
                       { label: 'Username', key: 'username', icon: Fingerprint, readOnly: true },
                       { label: 'Full Name', key: 'name', icon: User, readOnly: isIdentityLocked },
                       { label: 'Email Address', key: 'email', icon: Mail, readOnly: isIdentityLocked },
                       { label: 'Mobile Number', key: 'phone', icon: Smartphone, readOnly: isIdentityLocked },
                       { label: 'CNIC Number', key: 'cnic', icon: CreditCard, readOnly: true },
                       { label: 'Installation Address', key: 'address', icon: MapPin, colSpan: true, readOnly: isIdentityLocked }
                     ].map(field => (
                        <div key={field.key} className={`${field.colSpan ? 'md:col-span-2' : ''} space-y-2`}>
                           <div className="flex justify-between items-center ml-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                              {field.readOnly && <LockIcon size={10} className="text-slate-300" />}
                           </div>
                           <div className="relative">
                              <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                              <input 
                                disabled={!isEditing || field.readOnly}
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm transition-all ${isEditing && !field.readOnly ? 'focus:border-indigo-500 bg-white shadow-inner' : 'cursor-not-allowed opacity-70'}`}
                                value={(formData as any)[field.key] || ''}
                                onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                              />
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Biometric Toggle Section */}
                  <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${formData.biometricAllowed ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-300'}`}>
                           <Fingerprint size={24} />
                        </div>
                        <div>
                           <h4 className="text-xs font-black uppercase text-slate-900 leading-none mb-1">Biometric Access</h4>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Login using device fingerprints or face recognition</p>
                        </div>
                     </div>
                     <button 
                       onClick={toggleBiometric}
                       className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.biometricAllowed ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${formData.biometricAllowed ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>
               
               {isIdentityLocked && (
                 <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
                    <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                    <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed">
                       Note: Since your account has been verified, some details cannot be changed manually. Please contact our support team if you need to update your address or mobile number.
                    </p>
                 </div>
               )}

               <button onClick={onLogout} className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl">
                  Logout
               </button>
            </div>
         )}

         {activeTab === 'security' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-10">
               <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Lock size={18} className="text-rose-600"/> Change Password</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Update your password to keep your account secure</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                     <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg outline-none" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                     <div className="relative">
                        <Eye className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg outline-none" />
                     </div>
                  </div>
                  <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Update Password</button>
               </div>
            </div>
         )}

         {activeTab === 'connection' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Signal size={18} className="text-blue-600"/> Connection Type</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active subscription details</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-900 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                     {user.connectionType} Connection
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Technology', value: user.connectionType },
                    { label: 'Customer ID', value: user.connectionId },
                    { label: 'Auto-Renewal', value: user.autoRenewal ? 'On' : 'Off' },
                    { label: 'Tax Status', value: user.invoiceWithTax ? 'Registered' : 'Non-Taxable' },
                    { label: 'Network Path', value: user.pppoeId || 'SYSTEM_DEFAULT' }
                  ].map(stat => (
                    <div key={stat.label} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-indigo-100 transition-all">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                       <p className="text-xs font-black text-slate-800 uppercase italic">{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>
         )}

         {activeTab === 'registry' && (
            <div className="space-y-6">
               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                  <div className="flex justify-between items-center">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><HardDrive size={18} className="text-indigo-600"/> Network Hardware</h3>
                     <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-indigo-100">Live Status</div>
                  </div>

                  {mapping?.configured ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-4 bg-slate-50 border rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Assigned Station</p>
                          <p className="text-xs font-black text-slate-800 flex items-center gap-2 truncate">
                             <Server size={14} className="text-indigo-500" /> {state.devices.find(d => d.id === mapping.deviceId)?.name || 'Central Exchange'}
                          </p>
                       </div>
                       <div className="p-4 bg-slate-50 border rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">WiFi Name (SSID)</p>
                          <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                             <Wifi size={14} className="text-blue-500" /> {mapping.ssidName || 'My WiFi'}
                          </p>
                       </div>
                       <div className="p-4 bg-slate-50 border rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">IP Address</p>
                          <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                             <Globe size={14} className="text-emerald-500" /> {mapping.ipAddress || 'Dynamic'}
                          </p>
                       </div>
                       <div className="p-4 bg-slate-50 border rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Hardware Serial</p>
                          <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                             <Hash size={14} className="text-amber-500" /> {mapping.onuSerial || 'N/A'}
                          </p>
                       </div>
                    </div>
                  ) : (
                    <div className="p-20 text-center flex flex-col items-center">
                       <ShieldAlert size={48} className="text-slate-100 mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware details are currently being updated.</p>
                    </div>
                  )}
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Layers size={18} className="text-blue-600"/> Asset Inventory</h3>
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { label: 'Cable Length', val: user.wirelessInfo?.cat6Meters ? `${user.wirelessInfo.cat6Meters} Meters` : 'N/A' },
                        { label: 'Main Router', val: user.fiberInfo?.deviceName || 'N/A' },
                        { label: 'Receiving Unit', val: user.wirelessInfo?.receiverModel || 'N/A' },
                        { label: 'Optical Module', val: user.fiberInfo?.splitterType || 'N/A' }
                     ].map(r => (
                       <div key={r.label} className="p-4 bg-slate-50 rounded-2xl border flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase">{r.label}</span>
                          <span className="text-xs font-black text-slate-700 truncate uppercase">{r.val}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'audit' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
               <div className="p-8 border-b bg-slate-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <History size={20} className="text-indigo-400" />
                     <h3 className="text-sm font-black uppercase tracking-widest italic">Account Activity Log</h3>
                  </div>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase text-indigo-300 border border-white/5">
                     {securityLogs.length} Events
                  </span>
               </div>
               
               <div className="divide-y divide-slate-50 overflow-y-auto max-h-[500px] custom-scrollbar">
                  {securityLogs.map(log => (
                    <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors group">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                             <div className={`w-1.5 h-1.5 rounded-full ${log.riskLevel === 'Critical' ? 'bg-rose-500 shadow-[0_0_8px_rose]' : 'bg-indigo-400'}`}></div>
                             <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{log.action}</span>
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleDateString()} @ {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase pl-4 border-l-2 border-slate-100">{log.details}</p>
                    </div>
                  ))}
                  {securityLogs.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center">
                       <ShieldAlert size={48} className="text-slate-100 mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent activity detected.</p>
                    </div>
                  )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default SubscriberProfile;
