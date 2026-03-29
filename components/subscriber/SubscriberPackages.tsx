
import React, { useState } from 'react';
import { ISPUser, AppState, Package } from '../../types';
import { db } from '../../db';
import PackageCard from '../shared/PackageCard';
import SubscriberActivationFlow from './SubscriberActivationFlow';

interface Props {
  user: ISPUser;
  state: AppState;
}

const SubscriberPackages: React.FC<Props> = ({ user, state }) => {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPkg(pkg);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-2">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Packages Available</h3>
        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Reliable internet for everyday use</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {state.packages.filter(p => !p.deleted).map(pkg => (
          <PackageCard 
            key={pkg.id}
            pkg={pkg}
            mode="user"
            isActive={user.packageId === pkg.id}
            currency={state.settings.currency}
            onAction={handlePackageSelect}
          />
        ))}
      </div>

      {selectedPkg && (
        <SubscriberActivationFlow 
          user={user} 
          state={state} 
          packageId={selectedPkg.id}
          onClose={() => setSelectedPkg(null)} 
          onSuccess={() => {
            setSelectedPkg(null);
            // Re-sync happens via parent state change
          }} 
        />
      )}
    </div>
  );
};

export default SubscriberPackages;

