export const getBackendUrl = (): string => {
  const url = import.meta.env.VITE_BACKEND_URL;
  if (!url) {
    console.warn('[ENV] VITE_BACKEND_URL is not defined! Falling back to the production API.');
    // Keep this in sync with db.ts — an inconsistent fallback made local builds hit
    // localhost while the deployed app hit Render (the cause of "works online but
    // not locally" login reports).
    return 'https://click-opticx-isp-app-live.onrender.com';
  }
  // Strip trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
};
