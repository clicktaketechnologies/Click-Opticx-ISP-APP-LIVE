import { useState, useEffect } from 'react';
import { db } from '../db';

export function useAppConfig() {
    const [config, setConfig] = useState({
        portal_access: true,
        app_access: true,
        isImpersonating: false,
        impersonatorId: null as string | null
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${db.backendUrl}/api/config/app`, {
                    headers: { 
                        'Authorization': `Bearer ${localStorage.getItem('clickopticx_auth_token')}`
                    }
                });
                const res = await response.json();
                if (res.success) {
                    setConfig(prev => ({ 
                        ...prev, 
                        portal_access: res.portal_access, 
                        app_access: res.app_access 
                    }));
                }
            } catch (e) {}
        };

        fetchConfig();

        // Listen for socket updates
        if (db.getSocket()) {
            db.getSocket().on('config_updated', (newConfig: any) => {
                setConfig(prev => ({ ...prev, ...newConfig }));
            });
        }

        return () => {
            if (db.getSocket()) db.getSocket().off('config_updated');
        };
    }, []);

    useEffect(() => {
        const auth = db.getState().auth as any;
        setConfig(prev => ({ 
            ...prev, 
            isImpersonating: !!auth?.isImpersonating,
            impersonatorId: auth?.impersonatorId || null
        }));
    }, [db.getState().auth]);

    return config;
}
