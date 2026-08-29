import React, { useState, useMemo } from 'react';
import { 
  UserPlus, UserCheck, XCircle, 
  RotateCw, Clock, User, Fingerprint, Camera, FileText, 
  Search, Filter, ChevronRight, Activity, Database, Lock,
  Maximize2, ZoomIn, Info, AlertCircle, X, UserCircle, CheckCircle, Mail, Phone, MapPin
} from 'lucide-react';
import { db } from '../../../db';
import { AppState, SignupRequest, UserStatus, Role } from '../../../types';
import { Mini5GMicroLoader } from '../../Mini5GMicroLoader';

interface Props {
  state: AppState;
}

export const SignupDesk: React.FC<Props> = ({ state }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const signupRequests = useMemo(() => {
    return (state.signupRequests || []).filter(r => {
      const matchesSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (r.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (r.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [state.signupRequests, searchTerm, statusFilter]);

  const selectedRequest = useMemo(() => {
    return signupRequests.find(r => r.id === selectedRequestId);
  }, [signupRequests, selectedRequestId]);

  const handleApprove = async (requestId: string) => {
    setIsProcessing(true);
    // Since we don't have a dedicated approveSignup yet, we use a custom patch
    const req = state.signupRequests.find(r => r.id === requestId);
    if (req) {
      req.status = 'Approved';
      // If there's a corresponding user, ensure they are enabled
      const user = state.users.find(u => u.id === req.userId);
      if (user) {
        user.portalEnabled = true;
        if (user.status === 'Suspended') user.status = 'Pending Verification' as any;
      }
      await db.commit();
    }
    setIsProcessing(false);
    setSelectedRequestId(null);
  };

  const handleReject = async (requestId: string) => {
    setIsProcessing(true);
    const req = state.signupRequests.find(r => r.id === requestId);
    if (req) {
      req.status = 'Rejected';
      await db.commit();
    }
    setIsProcessing(false);
    setSelectedRequestId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3 italic uppercase leading-none">
            <UserPlus className="text-blue-600" size={28} />
            Registration Desk
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic border-l-4 border-blue-500 pl-4">Onboarding Pipeline & Signup Auditing</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
          {['Pending', 'Approved', 'Rejected', 'All'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f as any)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex gap-4 items-center group">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 font-bold text-slate-900 shadow-inner transition-all placeholder:text-slate-400"
            placeholder="Search registrations by name, email or mobile..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Side */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col max-h-[750px]">
             <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Signup Requests ({signupRequests.length})</span>
             </div>
             
             <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
                {signupRequests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`w-full p-6 text-left flex items-center justify-between transition-all group ${
                      selectedRequestId === req.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        selectedRequestId === req.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white border border-slate-200 text-slate-300'
                      }`}>
                        <UserCircle size={24} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-slate-900 uppercase italic leading-none truncate max-w-[120px]">{req.name}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2 truncate max-w-[120px]">{req.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                       <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                         req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         req.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         'bg-blue-50 text-blue-600 border-blue-100'
                       }`}>
                         {req.status}
                       </span>
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                          {req.timestamp ? new Date(req.timestamp).toLocaleDateString() : 'N/A'}
                       </span>
                    </div>
                  </button>
                ))}
                {signupRequests.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-6">
                    <Database className="text-slate-100" size={64} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No recent signups</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="lg:col-span-2">
           {selectedRequest ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-right-8 duration-700 min-h-[750px] flex flex-col">
                 <div className="p-10 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-8">
                       <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] border-4 border-white/10 flex items-center justify-center shadow-2xl">
                          <Fingerprint size={40} className="text-white" />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3 leading-none italic">New Registration Identity</p>
                          <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{selectedRequest.name}</h3>
                          <div className="flex items-center gap-4 mt-5">
                             <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <Mail size={14} className="text-blue-500" /> 
                                {selectedRequest.email}
                             </div>
                             <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                             <span className="text-[11px] font-black uppercase tracking-widest text-blue-500/80">{selectedRequest.phone}</span>
                          </div>
                       </div>
                    </div>
                    <X className="absolute top-8 right-8 text-white/30 cursor-pointer hover:text-white transition-colors" onClick={() => setSelectedRequestId(null)} />
                 </div>

                 <div className="flex-1 p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12}/> Geolocation</p>
                          <p className="text-sm font-black text-slate-800 uppercase italic">{selectedRequest.area || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{selectedRequest.address || 'Address not provided'}</p>
                       </div>
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> User Context</p>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Username</span><span className="text-[10px] font-black text-slate-900 uppercase italic">{selectedRequest.username}</span></div>
                             <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">CNIC/Identity</span><span className="text-[10px] font-black text-slate-900 uppercase italic">{selectedRequest.cnic || 'N/A'}</span></div>
                          </div>
                       </div>
                    </div>

                    <div className="p-10 bg-blue-50/50 rounded-[3.5rem] border border-blue-100 border-dashed flex flex-col items-center text-center gap-6">
                       <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xl"><Info size={24}/></div>
                       <div className="space-y-2">
                          <h4 className="text-lg font-black text-slate-900 uppercase italic">Onboarding Verification</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-sm">This user registered via the external portal. Approving them will grant full access to the Subscriber Matrix and enable their authentication node.</p>
                       </div>
                    </div>

                    <div className="mt-auto flex gap-6">
                       <button 
                          onClick={() => handleReject(selectedRequest.id)}
                          className="flex-1 py-5 bg-white text-rose-600 border border-rose-100 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-50 transition-all shadow-sm"
                       >
                          <XCircle size={20} /> Terminate
                       </button>
                       <button 
                          onClick={() => handleApprove(selectedRequest.id)}
                          className="flex-[2] py-5 bg-slate-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl hover:bg-black active:scale-95 transition-all"
                       >
                          {isProcessing ? <Mini5GMicroLoader size={20} /> : <CheckCircle size={20} className="text-emerald-400" />}
                          Approve & Onboard
                       </button>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-32 space-y-8 animate-in zoom-in-95 duration-700">
                 <div className="w-48 h-48 bg-slate-50 rounded-[4rem] flex items-center justify-center text-slate-100 border-[8px] border-dashed border-slate-100 relative shadow-inner">
                    <UserPlus size={100} strokeWidth={1} />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-300 uppercase italic tracking-tighter leading-none">Registration Queue Idle</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">Incoming subscriber requests will appear here for administrative handshake and node activation.</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
