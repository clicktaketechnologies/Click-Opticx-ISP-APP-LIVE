export const getBackendUrl = (): string => {
  const url = import.meta.env.VITE_BACKEND_URL;
  if (!url) {
    console.error('[ENV] VITE_BACKEND_URL is not defined! Falling back to localhost.');
    return 'http://localhost:5000';
  }
  // Strip trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
};
