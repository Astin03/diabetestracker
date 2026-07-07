export function getApiUrl() {
  const runtime = window.__APP_CONFIG__?.apiUrl;
  if (runtime) return String(runtime).replace(/\/$/, '');

  const built = import.meta.env.VITE_API_URL;
  if (built) return String(built).replace(/\/$/, '');

  return '/api';
}
