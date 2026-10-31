import axios from 'axios';

/**
 * Normalizes the API base URL to ensure consistent communication across environments:
 * - Local development: defaults to '/api/v1' (forwarded by Vite proxy to http://localhost:5000)
 * - Production on Vercel: robustly normalizes any variant of the Render backend URL:
 *     - 'https://example.onrender.com' -> 'https://example.onrender.com/api/v1'
 *     - 'https://example.onrender.com/' -> 'https://example.onrender.com/api/v1'
 *     - 'https://example.onrender.com/api' -> 'https://example.onrender.com/api/v1'
 *     - 'https://example.onrender.com/api/v1' -> 'https://example.onrender.com/api/v1'
 *     - 'https://example.onrender.com/api/v1/' -> 'https://example.onrender.com/api/v1'
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  // If not configured, default to '/api/v1' for Vite local proxy
  if (!envUrl) {
    return '/api/v1';
  }

  // Remove wrapping quotes and trailing slashes
  const clean = envUrl.replace(/^["']|["']$/g, '').replace(/\/+$/, '');

  // If already ends with /api/v1, return as is
  if (clean.endsWith('/api/v1')) {
    return clean;
  }

  // If ends with /api, append /v1
  if (clean.endsWith('/api')) {
    return `${clean}/v1`;
  }

  // If user entered root origin without /api path (e.g. https://cleardoc-api.onrender.com)
  if (!clean.includes('/api')) {
    return `${clean}/api/v1`;
  }

  return clean;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45s timeout to handle Render free-tier spin-up delay gracefully
});

// Interceptor to inject JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cleardoc_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthenticated 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth
      if (localStorage.getItem('cleardoc_token')) {
        localStorage.removeItem('cleardoc_token');
        localStorage.removeItem('cleardoc_user');
        // Do not force redirect if already on login/register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

