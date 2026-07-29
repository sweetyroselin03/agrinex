import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || 'https://agrinex-backend-c1ig.onrender.com').replace(/\/$/, '');
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 8000;

// Routes that should NOT be retried on failure (idempotency-sensitive)
const NO_RETRY_ROUTES = [
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/register',
  '/auth/set-password',
  '/posts',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number): number => {
  const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return Math.min(base + jitter, MAX_RETRY_DELAY_MS);
};

const getLocalToken = (): string | null => {
  try {
    const raw = localStorage.getItem('agrinex-web-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token || null;
    }
  } catch (e) {}
  return null;
};

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s timeout for Render spin-ups
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getLocalToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-logout on 401 & Exponential Backoff
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retryCount?: number;
      _isRetry?: boolean;
    };

    if (!config) return Promise.reject(error);

    // Auto-logout on 401 Unauthorized
    if (error.response?.status === 401 && !config._isRetry) {
      console.warn('[API] Session expired (401) — logging out...');
      try {
        localStorage.removeItem('agrinex-web-auth');
        // Force reload to redirect to login and clear state
        window.location.href = '/login';
      } catch (e) {}
      return Promise.reject(error);
    }

    // Skip retry on post/sensitive actions
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();
    const isNoRetry = NO_RETRY_ROUTES.some((route) => url.includes(route)) && method === 'post';
    
    if (isNoRetry) {
      return Promise.reject(error);
    }

    // Exponential Backoff Retry for timeout / network / 5xx errors
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED';
    const is5xx = error.response && error.response.status >= 500;

    if ((isNetworkError || isTimeout || is5xx) && !config._isRetry) {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        const delay = getBackoffDelay(config._retryCount - 1);

        console.log(
          `[API] Retrying ${config._retryCount}/${MAX_RETRIES} for ${config.url} in ${Math.round(delay)}ms...`
        );

        await sleep(delay);
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
