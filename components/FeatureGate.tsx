import React from 'react';
import { useAppConfig } from '../hooks/useAppConfig';
import { ShieldAlert } from 'lucide-react';

interface FeatureGateProps {
    feature: 'portal' | 'app';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback }) => {
    const { portal_access, app_access } = useAppConfig();
    
    const isEnabled = feature === 'portal' ? portal_access : app_access;

    if (!isEnabled) {
        return (
            fallback || (
                <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-xl border border-red-100 animate-pulse">
                    <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-red-900 mb-2">Service Suspended</h2>
                    <p className="text-red-700 text-center max-w-md">
                        This section has been temporarily disabled by the system administrator. 
                        Please contact support if you believe this is an error.
                    </p>
                </div>
            )
        );
    }

    return <>{children}</>;
};
