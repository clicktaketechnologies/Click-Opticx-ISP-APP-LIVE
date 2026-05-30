import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, MoreVertical, 
  User, Mail, Phone, MapPin, Calendar,
  Shield, Zap, Wallet, Network,
  ArrowRight, Edit3, Trash2, ShieldAlert,
  UserCheck, XCircle, Clock, Database,
  ArrowUpRight, BarChart3, MessageSquare,
  Repeat, CreditCard, ChevronRight, Eye
} from 'lucide-react';
import { AppState, ISPUser as UserType, Role, Package } from '../../types';
import { UserStatus } from '../../types';
import { V2Badge, V2Button, V2Card } from '../../components/v2/UIAtoms';
import { V2SmartTable, V2SlideOver, V2TableRow, V2TableCell } from '../../components/v2/TableAndSlide';
import { usePermissions } from '../../src/hooks/usePermissions';

// Lazy-import db to break circular dependency: db.ts → UserManagementV2 → db.ts
// Using a getter pattern so db is resolved at call time, never at module evaluation time.
let _db: any = null;
const getDb = () => {
  if (!_db) {
    // Dynamic require to avoid circular import at module evaluation
    _db = require('../db').db;
  }
  return _db;
};

const UserManagementV2: React.FC<{ state: AppState }> = ({ state }) => {
  const { canView, canEdit } = usePermissions(state);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus.ACTIVE | UserStatus.EXPIRED | UserStatus.SUSPENDED | UserStatus.PENDING_VERIFICATION>('all');

  // 1. Data Filtration (Parity with Legacy)
  const filteredUsers = useMemo(() => {
    return state.users.filter(u => {
      const matchesSearch = 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.id || '').includes(searchQuery);
      
      const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [state.users, searchQuery, filterStatus]);

    const stats = {
      total: state.users.length,
      active: state.users.filter(u => u.status === UserStatus.ACTIVE).length,
      pending: state.users.filter(u => u.status === UserStatus.PENDING_VERIFICATION).length,
      expired: state.users.filter(u => u.status === UserStatus.EXPIRED).length,
      suspended: state.users.filter(u => u.status === UserStatus.SUSPENDED).length
    };

  return (
    <div className="space-y-10">
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MiniStat label="Total Matrix" value={stats.total} color="blue" />
        <MiniStat label="Healthy Nodes" value={stats.active} color="emerald" />
        <MiniStat label="In-Pipeline" value={stats.pending} color="indigo" />
        <MiniStat label="Offline/Expired" value={stats.expired} color="amber" />
        <MiniStat label="Blacklisted" value={stats.suspended} color="rose" />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 flex-1 w-full max-w-2xl">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search by name, ID or email..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
            <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl shrink-0 overflow-x-auto no-scrollbar">
               {([
                 'all', 
                 UserStatus.Active, 
                 UserStatus.PENDING_VERIFICATION, 
                 UserStatus.EXPIRED, 
                 UserStatus.SUSPENDED
               ] as const).map(s => (
                 <button 
                   key={s}
                   onClick={() => setFilterStatus(s)}
                   className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                     filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   {s === UserStatus.PENDING_VERIFICATION ? 'Pending Verification' : s}
                 </button>
               ))}
            </div>
        </div>
        {canEdit('users') && <V2Button label="Onboard User" icon={Plus} />}
      </div>

      {/* Main Table */}
      <V2SmartTable headers={['Subscriber ID', 'Network Status', 'Plan / Tier', 'Wallet Balance', 'Action']}>
        {filteredUsers.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-10 py-20 text-center">
              <p className="text-sm font-black text-slate-300 uppercase italic tracking-[0.4em]">No nodes found in matrix</p>
            </td>
          </tr>
        ) : filteredUsers.map(user => (
          <V2TableRow key={user.id} onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}>
            <V2TableCell>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <User className="text-slate-400" size={24} />
                 </div>
                 <div>
                    <p className="text-sm font-black text-slate-900 uppercase italic leading-none mb-1">{user.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.id.slice(0, 12)}...</p>
                 </div>
              </div>
            </V2TableCell>
            <V2TableCell>
                <V2Badge 
                  label={user.status} 
                  color={user.status === UserStatus.Active ? 'emerald' : user.status === UserStatus.EXPIRED ? 'amber' : 'rose'} 
                  variant="ghost" 
                  icon={user.status === UserStatus.Active ? UserCheck : Clock}
                />
            </V2TableCell>
            <V2TableCell>
               <div className="flex flex-col">
                  <p className="text-[11px] font-black text-slate-800 uppercase italic">{state.packages.find(p => p.id === user.packageId)?.name || 'Default Tier'}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Auto-Renewal: ON</p>
               </div>
            </V2TableCell>
            <V2TableCell>
               <p className="text-sm font-black text-slate-900 italic">PKR {(user.balance || 0).toLocaleString()}</p>
            </V2TableCell>
            <V2TableCell>
               <div className="flex gap-2">
                  <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><BarChart3 size={16}/></button>
                  <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><ChevronRight size={16}/></button>
               </div>
            </V2TableCell>
          </V2TableRow>
        ))}
      </V2SmartTable>

      {/* Detail Slide-Over */}
      <V2SlideOver
        isOpen={isDetailOpen && !!selectedUser}
        onClose={() => setIsDetailOpen(false)}
        title={selectedUser?.name || ''}
        subtitle={`Subscriber Matrix Node: ${selectedUser?.id}`}
        footer={
            canEdit('users') ? (
                <div className="flex gap-4">
                    <V2Button label="Renew Account" variant="primary" className="flex-1" icon={Zap} />
                    <V2Button label="Suspend Node" variant="danger" className="flex-1" icon={XCircle} />
                </div>
            ) : undefined
        }
      >
        {selectedUser && (
            <div className="space-y-10">
                {/* Profile Snapshot */}
                <div className="flex items-center gap-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-950 flex items-center justify-center text-white shadow-2xl">
                        <User size={48} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">{selectedUser.name}</h4>
                         <div className="flex items-center gap-3">
                             <V2Badge label={selectedUser.role} color="indigo" />
                             <V2Badge label={selectedUser.status} color={selectedUser.status === UserStatus.ACTIVE ? 'emerald' : 'rose'} />
                         </div>
                    </div>
                </div>

                {/* Tabs / Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                    <InfoCard icon={Mail} label="Neural Relay" value={selectedUser.email} />
                    <InfoCard icon={Phone} label="Voice Link" value={selectedUser.phone} />
                    <InfoCard icon={Wallet} label="Fiscal Balance" value={`PKR ${(selectedUser.balance || 0).toLocaleString()}`} />
                    <InfoCard icon={MapPin} label="Geographic Node" value={selectedUser.address || 'N/A'} />
                </div>

                {/* Network & Subscription Section */}
                <V2Card title="Subscription Detail" className="bg-slate-50/50">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Active Plan</p>
                                <p className="text-sm font-black text-slate-900 uppercase italic">{state.packages.find(p => p.id === selectedUser.packageId)?.name}</p>
                            </div>
                            <V2Button label="Upgrade" variant="ghost" className="px-4 py-2" />
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Expiry Horizon</p>
                                <p className="text-sm font-black text-slate-900 uppercase italic">{selectedUser.expiryDate}</p>
                            </div>
                            <Clock size={16} className="text-amber-500" />
                        </div>
                    </div>
                </V2Card>

                {/* Quick Actions Matrix */}
                <div className="grid grid-cols-3 gap-4">
                    <ActionSquare icon={MessageSquare} label="Message" color="blue" />
                    <ActionSquare icon={ShieldAlert} label="Alert" color="rose" />
                    <ActionSquare icon={Repeat} label="Reset Pwd" color="slate" />
                        <ActionSquare 
                          icon={Eye} 
                          label="Login As" 
                          color="indigo" 
                          onClick={() => {
                            getDb().impersonateUser(selectedUser.id);
                            setIsDetailOpen(false);
                          }} 
                        />
                </div>
            </div>
        )}
      </V2SlideOver>
    </div>
  );
};

const MiniStat = ({ label, value, color }: any) => {
    const colors: any = {
        blue: 'bg-blue-600',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
    };
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <div className="flex items-center gap-3">
                <div className={`w-1.5 h-6 rounded-full ${colors[color]}`} />
                <h4 className="text-xl font-black text-slate-900 italic">{value}</h4>
            </div>
        </div>
    );
};

const InfoCard = ({ icon: Icon, label, value }: any) => (
    <div className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-blue-500/20 transition-all">
        <div className="flex items-center gap-3 mb-3">
            <Icon size={14} className="text-blue-500" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
    </div>
);

const ActionSquare = ({ icon: Icon, label, color, onClick }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white',
        rose: 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white',
        slate: 'bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white',
        indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white',
    };
    return (
        <button 
          onClick={onClick}
          className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-3xl transition-all group ${colors[color]}`}
        >
            <Icon size={24} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
};

export default UserManagementV2;
