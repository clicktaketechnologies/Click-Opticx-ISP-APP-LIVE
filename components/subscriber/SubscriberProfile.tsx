
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
import PasswordInput from '../shared/PasswordInput';

interface Props {
  user: ISPUser;
  onLogout: () => void;
}

const SubscriberProfile: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'connection' | 'registry' | 'audit'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // Security State
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
  const [isRotating, setIsRotating] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const state = db.getState();
  
  // Identity locked after admin verification
  const isIdentityLocked = user.status !== UserStatus.PENDING_VERIFICATION;

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { username, connectionId, ...editableData } = formData;
    const res = await db.updateSubscriberProfile(user.id, editableData);
    setIsSaving(false);
    if (res.success) {
      setIsEditing(false);
      triggerToast("Profile Registry Updated");
    } else {
      alert(res.message);
    }
  };

  const handlePasswordRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.next !== passForm.confirm) {
      alert("Validation Error: New passwords do not match.");
      return;
    }
    if (passForm.current !== user.password) {
      alert("Authorization Denied: Current secret is incorrect.");
      return;
    }

    setIsRotating(true);
    const res = await db.updateCustomerPassword(user.id, passForm.next);
    setIsRotating(false);
    
    if (res.success) {
      setPassForm({ current: '', next: '', confirm: '' });
      triggerToast("Access Secret Rotated");
      db.logNotification(user.id, 'success', 'Security Protocol', 'Subscriber-initiated password rotation confirmed.');
    }
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
        setFormData(prev => ({ ...prev, profileImage: base64 }));
        triggerToast("Avatar Synced");
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
      triggerToast(nextVal ? "Biometrics Active" : "Biometrics Restricted");
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

  const vUI = useMemo(() => {
    const status = user.verificationStatus || VerificationStatus.UNVERIFIED;
    switch(status) {
      case VerificationStatus.VERIFIED: 
        return { 
          label: 'Verified Profile', icon: ShieldCheck,
          bg: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600', 
          border: 'border-b-4 border-emerald-800'
        };
      case VerificationStatus.PENDING: 
        return { 
          label: 'Pending Review', icon: Clock,
          bg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600', 
          border: 'border-b-4 border-amber-800'
        };
      default: 
        return { 
          label: 'Unverified', icon: Info,
          bg: 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700', 
          border: 'border-b-4 border-slate-900'
        };
    }
  }, [user.verificationStatus]);

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top duration-500">
           <div className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3">
              <CheckCircle size={16} /> {successToast}
           </div>
        </div>
      )}

      {/* Profile Header Hero */}
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
               <div className="w-32 h-32 bg-slate-800 rounded-[2.5rem] flex items-center justify-center border-4 border-slate-900 shadow-2xl overflow-hidden relative transition-transform duration-500 hover:scale-105">
                  {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <User size={64} className="text-slate-600" />}
                  {(isUploading || isSaving) && (
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
                  <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 ${vUI.bg} ${vUI.border} shadow-lg transition-all`}>
                     <vUI.icon size={12} strokeWidth={3} /> {vUI.label}
                  </div>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{user.connectionId}</p>
               
               <div className="pt-4 space-y-2 w-full max-w-[240px] mx-auto md:mx-0">
                  <div className="flex justify-between items-end">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Profile Completion</span>
                     <span className="text-[10px] font-black text-indigo-400">{completion}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
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
           { id: 'connection', label: 'Link Layer', icon: Signal },
           { id: 'audit', label: 'Registry Logs', icon: History }
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
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
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><User size={18} className="text-indigo-600"/> Identity Dossier</h3>
                     {!isEditing ? (
                       <button onClick={() => setIsEditing(true)} className="p-3 bg-slate-50 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"><Edit3 size={18}/></button>
                     ) : (
                       <div className="flex gap-2">
                          <button onClick={() => setIsEditing(false)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><X size={18}/></button>
                          <button onClick={handleSaveProfile} disabled={isSaving} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg active:scale-90 transition-all">
                             {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                          </button>
                       </div>
                     )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {[
                       { label: 'Display Name', key: 'name', icon: User, readOnly: false },
                       { label: 'Email Relay', key: 'email', icon: Mail, readOnly: false },
                       { label: 'Phone Registry', key: 'phone', icon: Smartphone, readOnly: false },
                       { label: 'CNIC Token', key: 'cnic', icon: CreditCard, readOnly: true },
                       { label: 'Physical Node Address', key: 'address', icon: MapPin, colSpan: true, readOnly: false }
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
                                autoComplete="off"
                              />
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${formData.biometricAllowed ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-300'}`}>
                           <Fingerprint size={24} />
                        </div>
                        <div>
                           <h4 className="text-xs font-black uppercase text-slate-900 leading-none mb-1">Secure Biometric Node</h4>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Login using fingerprint hardware</p>
                        </div>
                     </div>
                     <button 
                       onClick={toggleBiometric}
                       className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.biometricAllowed ? 'bg-indigo-600 shadow-lg' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.biometricAllowed ? 'left-7' : 'left-1'}`}></div>
                     </button>
                  </div>
               </div>

               <button onClick={onLogout} className="w-full py-5 bg-slate-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl">
                  Exit Session
               </button>
            </div>
         )}

         {activeTab === 'security' && (
            <form onSubmit={handlePasswordRotate} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-10">
               <div className="space-y-2">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Lock size={18} className="text-rose-600"/> Change Access Secret</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Credential Rotation Handshake</p>
               </div>

               <div className="space-y-6">
                  <PasswordInput 
                    label="Current Secret" 
                    value={passForm.current} 
                    onChange={v => setPassForm({...passForm, current: v})} 
                    autoComplete="off"
                  />
                  <hr className="border-slate-50" />
                  <PasswordInput 
                    label="New Node Secret" 
                    value={passForm.next} 
                    onChange={v => setPassForm({...passForm, next: v})} 
                    showStrength
                    autoComplete="new-password"
                  />
                  <PasswordInput 
                    label="Confirm Verification" 
                    value={passForm.confirm} 
                    onChange={v => setPassForm({...passForm, confirm: v})} 
                    autoComplete="new-password"
                  />
                  
                  <button 
                    type="submit"
                    disabled={isRotating || !passForm.confirm}
                    className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isRotating ? <RefreshCw className="animate-spin" size={18}/> : <ShieldCheck size={18}/>}
                    Authorize Rotation
                  </button>
               </div>
            </form>
         )}

         {activeTab === 'connection' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Signal size={18} className="text-blue-600"/> Link Parameters</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active infrastructure mapping</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-900 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                     {user.connectionType} LINK
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Node Path', value: user.connectionType },
                    { label: 'Registry ID', value: user.connectionId },
                    { label: 'Renewal', value: user.autoRenewal ? 'Auto' : 'Manual' },
                    { label: 'MAC Node', value: user.pppoeId || 'PENDING' }
                  ].map(stat => (
                    <div key={stat.label} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-100 transition-all">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                       <p className="text-xs font-black text-slate-800 uppercase italic">{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>
         )}

         {activeTab === 'audit' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
               <div className="p-8 border-b bg-slate-950 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <History size={20} className="text-indigo-400" />
                     <h3 className="text-sm font-black uppercase tracking-widest italic">Security Pulse Log</h3>
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
                          <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleDateString()}</span>
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase pl-4 border-l-2 border-slate-100">{log.details}</p>
                    </div>
                  ))}
                  {securityLogs.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center">
                       <ShieldAlert size={48} className="text-slate-100 mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Log Empty</p>
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
