
import React, { useState } from 'react';
import { ISPUser, Package } from '../../types';
import { Zap, Package as PackageIcon, Wifi, ChevronRight, ShieldCheck, Sparkles, User as UserIcon, Activity } from 'lucide-react';
import SpeedTestModal from './SpeedTestModal';

interface Props {
  user: ISPUser;
  currentPkg: Package | undefined;
}

const SubscriberQuickStatus: React.FC<Props> = ({ user, currentPkg }) => {
  const [showSpeedTest, setShowSpeedTest] = useState(false);
  const firstName = user.name.split(' ')[0];
  const isNewUser = (user.activationCount || 0) === 0;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6">


      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-xl transition-all duration-500">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left flex-1">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:rotate-3 transition-transform duration-500 border-4 border-slate-50 overflow-hidden shrink-0">
            {user.profileImage ? (
              <img src={user.profileImage} className="w-full h-full object-cover" alt="User Profile" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600">
                <UserIcon size={32} className="text-white" />
              </div>
            )}
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">
                Your Plan & Connection
              </span>
              <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none italic flex items-center gap-2">
                Hello, {firstName}! 👋
                {user.isKYCVerified && (
                  <ShieldCheck size={20} className="text-blue-600 fill-blue-50" />
                )}
              </h4>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${currentPkg ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                <PackageIcon size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Plan: {currentPkg?.name || 'No Active Plan'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${currentPkg ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                <Wifi size={14} className={currentPkg ? 'animate-pulse' : ''} />
                <span className="text-[9px] font-black uppercase tracking-widest">Connection: {currentPkg ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSpeedTest(true)}
          className="w-full md:w-auto px-8 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
        >
          <Activity size={16} fill="none" />
          Check Speed
          <ChevronRight size={14} className="opacity-50" />
        </button>
      </div>

      {showSpeedTest && <SpeedTestModal onClose={() => setShowSpeedTest(false)} />}
    </div>
  );
};

export default SubscriberQuickStatus;

