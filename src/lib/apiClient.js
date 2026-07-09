import axios from 'axios';

// ─── Instance Axios centralisée ───────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  withCredentials: false,
});

// ─── Intercepteur de requête : injection du token Bearer ──────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Intercepteur de réponse : gestion globale des erreurs auth ───────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide → nettoyer et rediriger vers login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
