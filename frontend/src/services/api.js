import axios from 'axios';
import { getApiUrl } from '../utils/appConfig';

const api = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('astin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const raw = localStorage.getItem('astin_viewing_patient');
  if (raw) {
    try {
      const patient = JSON.parse(raw);
      if (patient?.id) config.headers['X-Patient-Id'] = String(patient.id);
    } catch {
      /* ignore */
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('astin_token');
      localStorage.removeItem('astin_viewing_patient');
      localStorage.removeItem('astin_data_context_chosen');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
