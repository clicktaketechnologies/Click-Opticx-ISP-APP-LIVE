import { useState, useEffect } from 'react';
import { db } from '../db';
import { BrandingConfig } from '../types';

export const useBranding = (): BrandingConfig => {
  const [branding, setBranding] = useState<BrandingConfig>(db.getState().settings.branding);

  useEffect(() => {
    const unsubscribe = db.onStateChange((newState) => {
      setBranding(newState.settings.branding);
    });
    return () => unsubscribe();
  }, []);

  return branding;
};
