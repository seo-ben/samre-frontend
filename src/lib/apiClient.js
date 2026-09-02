import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('revolutech.pro')) {
    return 'https://samreapi.revolutech.pro/api';
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== '/api') {
    return envUrl;
  }
  return '/api';
};

// ─── Instance Axios centralisée ───────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: getBaseUrl(),
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

const formatUrls = (data, baseUrl) => {
  if (data === null || data === undefined) return data;
  if (data instanceof Blob || (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer)) {
    return data;
  }
  if (typeof data === 'string') {
    let url = data;
    if (url.startsWith('/storage/')) {
      url = `${baseUrl}${url}`;
    }
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
      url = url.replace(/^http:\/\//i, 'https://');
    }
    if (typeof window !== 'undefined' && url.includes('localhost:8000') && !window.location.hostname.includes('localhost')) {
      url = url.replace(/http:\/\/localhost:8000/g, baseUrl);
    }
    return url;
  }
  if (Array.isArray(data)) {
    return data.map(item => formatUrls(item, baseUrl));
  }
  if (typeof data === 'object') {
    const newData = {};
    for (const key in data) {
      newData[key] = formatUrls(data[key], baseUrl);
    }
    return newData;
  }
  return data;
};

// ─── Intercepteur de réponse : gestion globale des erreurs auth ───────────────
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:8000';
      response.data = formatUrls(response.data, baseUrl);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');

      // Ne jamais rediriger vers le login si le visiteur consulte une page publique légale
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const isPublicPage = ['/p/', '/page/', '/pages/', '/legal/', '/cgu', '/privacy', '/confidentialite', '/mentions-legales', '/a-propos', '/about', '/terms', '/conditions'].some(
        prefix => path === prefix || path.startsWith(prefix)
      );

      if (!isPublicPage && path !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
