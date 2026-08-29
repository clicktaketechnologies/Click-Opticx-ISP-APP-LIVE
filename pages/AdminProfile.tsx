import { Mini5GMicroLoader } from '../components/Mini5GMicroLoader';
import React, { useState, useRef } from 'react';
import { AppState, StaffUser } from '../types';
import { db } from '../db';
import { useToast } from '../components/shared/Toast';
import { 
  User, Mail, Lock, Eye, EyeOff, Save, Camera, 
  ShieldCheck, RotateCw, CheckCircle, AlertCircle,
  Key, Activity, UserCircle, ArrowLeft, LogOut, Info
} from 'lucide-react';

const AdminProfile: React.FC<{ state: AppState }> = ({ state }) => {
  const user = state.currentUser as StaffUser;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: user?.password || ''
  });
  const [showPass, setShowPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return <Mini5GMicroLoader size={40} />;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const onPhotoChange = async (base64String: string) => {
          if (!user?.email) return;
          try {
            const photoUrl = await db.uploadMedia(`profiles/admin-${user.email}-${Date.now()}`, base64String);
            await db.updateStaff(user.email, { profileImage: photoUrl } as any);
            db.logNotification(user.email, 'success', 'Profile Photo Updated', 'Your identity avatar has been synchronized.');
          } catch (err) {
            console.error(err);
          }
        };
        try {
          const base64String = reader.result as string;
          await onPhotoChange(base64String);
          if (state.currentUser) {
             (state.currentUser as any).profileImage = base64String;
          }
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
          console.error('[Upload Error]', error);
          alert('Failed to upload profile image.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setIsSaving(true);
    
    if (newPassword) {
      if (!oldPassword) {
        toastError('Password Change', 'Old password is required to change password.');
        setIsSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toastError('Password Change', 'New password and confirm password do not match.');
        setIsSaving(false);
        return;
      }

      try {
        const response = await fetch(`${db.backendUrl}/api/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          const errorMsg = result.error || 'NETWORK_ERROR';
          toastError('Password Change', `${result.message || errorMsg}`);
          setIsSaving(false);
          return;
        }

        toastSuccess('Password Change', 'Password updated successfully. Forcing re-login...');
        
        // Reset states
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          localStorage.removeItem('clickopticx_auth_token');
          localStorage.removeItem('clickopticx_admin_token');
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('clickopticx_v16_registry');
          sessionStorage.clear();
          if ('caches' in window) {
            caches.keys().then(names => names.forEach(name => caches.delete(name)));
          }
          db.commit({ auth: { isLoggedIn: false }, view: 'login', currentUser: undefined });
          window.location.reload();
        }, 1500);
        return;
      } catch (err: any) {
        toastError('Password Change', `NETWORK_ERROR: ${err.message}`);
        setIsSaving(false);
        return;
      }
    }

    // Update the staff record in the database
    await db.updateStaff(user.email, {
      name: formData.name,
      email: formData.email
    });

    // Update session state if email changed
    if (state.currentUser) {
       state.currentUser.name = formData.name;
       state.currentUser.email = formData.email;
    }

    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      setSuccess(true);
      db.logNotification(user.email, 'success', 'Profile Updated', 'Your personal account details have been synchronized.');
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
            <UserCircle className="text-blue-600" size={32} />
            My Account Profile
          </h2>
          <p className="text-slate-500 font-medium">Manage your personal identity, login email, and security credentials.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 animate-in slide-in-from-right">
            <CheckCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Changes Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
               <div className="relative group">
                  <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center border-4 border-white/5 shadow-2xl overflow-hidden backdrop-blur-md relative">
                     {(user as any).profileImage ? <img src={(user as any).profileImage} className="w-full h-full object-cover" /> : <User size={64} className="text-blue-400" />}
                     {isUploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                           <Mini5GMicroLoader size={24} />
                        </div>
                     )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-all border-4 border-slate-900"
                  >
                    <Camera size={18} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
               </div>
               
               <div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{user.name}</h3>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mt-2">{user.role}</p>
               </div>

               <div className="w-full pt-6 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500 tracking-widest">
                     <span>System Access</span>
                     <span className="text-green-400">Authorized</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-blue-500 h-full w-full"></div>
                  </div>
               </div>
            </div>
            <Activity className="absolute -right-10 -bottom-10 opacity-5 scale-150 pointer-events-none" size={200} />
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <RotateCw size={14} className="animate-spin-slow" /> Local Memory Node
             </h4>
             <div className="space-y-4">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                   Sync your local registry with the cloud master. Forces a manual state refresh.
                </p>
                <button
                   onClick={() => user?.email && db.clearProfileCache(user.email)}
                   className="w-full py-4 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95 shadow-sm"
                >
                   Clear Personal Cache
                </button>
             </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10">
             <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Account Information</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configure your personal login credentials</p>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                )}
             </div>

             <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Full Display Name</label>
                      <div className="relative">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input 
                           disabled={!isEditing}
                           className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none transition-all ${isEditing ? 'focus:border-blue-500 focus:bg-white' : 'opacity-60 cursor-not-allowed'}`}
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Account Email (Login ID)</label>
                      <div className="relative">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                         <input 
                           disabled={!isEditing}
                           className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none transition-all ${isEditing ? 'focus:border-blue-500 focus:bg-white' : 'opacity-60 cursor-not-allowed'}`}
                           value={formData.email}
                           onChange={e => setFormData({...formData, email: e.target.value})}
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-50">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={14} className="text-rose-500" /> Change Security Secret (Optional)
                   </h4>
                   {isEditing ? (
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Old Password</label>
                            <div className="relative">
                               <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                               <input 
                                 type="password"
                                 placeholder="Enter current password"
                                 className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                                 value={oldPassword}
                                 onChange={e => setOldPassword(e.target.value)}
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">New Password</label>
                            <div className="relative">
                               <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                               <input 
                                 type="password"
                                 placeholder="Enter new password"
                                 className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                                 value={newPassword}
                                 onChange={e => setNewPassword(e.target.value)}
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Confirm New Password</label>
                            <div className="relative">
                               <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                               <input 
                                 type="password"
                                 placeholder="Confirm new password"
                                 className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                                 value={confirmPassword}
                                 onChange={e => setConfirmPassword(e.target.value)}
                               />
                            </div>
                         </div>
                      </div>
                   ) : (
                      <div className="relative">
                         <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                         <input 
                           type="password"
                           disabled={true}
                           placeholder="••••••••"
                           className="w-full pl-14 pr-16 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-black text-xl outline-none opacity-60 cursor-not-allowed"
                           value=""
                           readOnly
                         />
                      </div>
                   )}
                </div>

                {isEditing && (
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Mini5GMicroLoader size={20} /> : <ShieldCheck size={20}/>}
                    Authorize Account Updates
                  </button>
                )}
             </form>

             {!isEditing && (
               <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-blue-600 shadow-sm border border-blue-50">
                     <Info size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-900 font-black uppercase tracking-widest mb-1">Account Management</p>
                    <p className="text-[9px] text-blue-700 font-bold uppercase leading-relaxed opacity-80">
                      Your profile information is used for internal communication and logging across the system ledger. Always keep your access secret updated to maintain system integrity.
                    </p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
