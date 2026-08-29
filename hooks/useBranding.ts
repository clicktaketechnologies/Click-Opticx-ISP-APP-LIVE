import { useState, useEffect } from 'react';
import { db } from '../db';
import { BrandingConfig } from '../types';

export const useBranding = (): BrandingConfig => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const s = db.getState();
    return s?.settings?.branding || { businessName: 'Click Opticx', logoUrl: '', primaryColor: '#6366F1' } as any; // Fallback
  });

  useEffect(() => {
    const unsubscribe = db.onStateChange((newState) => {
      if (newState?.settings?.branding) {
        setBranding(newState.settings.branding);
      }
    });
    return () => unsubscribe();
  }, []);

  return branding;
};
