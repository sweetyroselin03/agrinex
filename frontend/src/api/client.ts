import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';

const BASE_URL = API_BASE_URL;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 8000;

// Routes that should NOT be retried on failure (idempotency-sensitive)
const NO_RETRY_ROUTES = [
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/register',
  '/auth/set-password',
  '/auth/login',
  '/posts',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number): number => {
  const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return Math.min(base + jitter, MAX_RETRY_DELAY_MS);
};

let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
  if (token && typeof token === 'string' && token.trim() !== '' && token !== 'null' && token !== 'undefined' && !token.includes('\0')) {
    memoryToken = token.trim();
  } else {
    memoryToken = null;
  }
};

export const getLocalToken = (): string | null => {
  // 1. In-memory cache
  if (memoryToken) {
    return memoryToken;
  }

  // 2. Direct localStorage 'agrinex_token' key
  try {
    const directToken = localStorage.getItem('agrinex_token');
    if (directToken && typeof directToken === 'string') {
      const trimmed = directToken.trim();
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined' && !trimmed.includes('\0')) {
        memoryToken = trimmed;
        return trimmed;
      }
    }
  } catch (e) {}

  // 3. Zustand store in-memory state
  try {
    const storeToken = (window as any)?.__AGRINEX_STORE__?.getState()?.token;
    if (storeToken && typeof storeToken === 'string') {
      const trimmed = storeToken.trim();
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined' && !trimmed.includes('\0')) {
        memoryToken = trimmed;
        return trimmed;
      }
    }
  } catch (e) {}

  // 4. Persisted Zustand localStorage fallback
  try {
    const raw = localStorage.getItem('agrinex-web-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token && typeof token === 'string') {
        const trimmed = token.trim();
        if (trimmed && trimmed !== 'null' && trimmed !== 'undefined' && !trimmed.includes('\0')) {
          memoryToken = trimmed;
          return trimmed;
        }
      }
    }
  } catch (e) {}

  return null;
};

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token & Safe Logging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getLocalToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      if (typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      }
    }
    const hasAuthHeader = !!(
      config.headers.Authorization || 
      (typeof (config.headers as any).get === 'function' && (config.headers as any).get('Authorization'))
    );
    console.log(`[API INTERCEPTOR] Request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      tokenFound: !!token,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? `${token.substring(0, 12)}...` : null,
      authHeaderAttached: hasAuthHeader
    });
    return config;
  },
  (error) => {
    console.error(`[API INTERCEPTOR] Request Error:`, error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto-logout on 401 & Exponential Backoff & Envelope Unwrapping
api.interceptors.response.use(
  (response) => {
    console.log(`[API DEBUG] Response Success: ${response.config.method?.toUpperCase()} ${response.config.url} - Status ${response.status} ${response.statusText}`);
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      const envelope = response.data;
      const innerData = envelope.data;
      if (innerData !== undefined && innerData !== null) {
        if (Array.isArray(innerData)) {
          Object.defineProperty(innerData, 'success', { value: envelope.success, writable: true, enumerable: false });
          Object.defineProperty(innerData, 'message', { value: envelope.message, writable: true, enumerable: false });
          Object.defineProperty(innerData, 'errors', { value: envelope.errors, writable: true, enumerable: false });
          Object.defineProperty(innerData, 'data', { value: innerData, writable: true, enumerable: false });
          response.data = innerData;
        } else if (typeof innerData === 'object') {
          response.data = {
            ...innerData,
            success: envelope.success,
            message: envelope.message,
            errors: envelope.errors,
            data: innerData
          };
        } else {
          response.data = innerData;
        }
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retryCount?: number;
      _isRetry?: boolean;
    };

    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const errorType = !error.response ? 'Network/CORS/Offline/CORS-Blocked Error' : error.code === 'ECONNABORTED' ? 'Timeout Error' : 'HTTP Error';
    console.error(`[API DEBUG] Response Error: ${config?.method?.toUpperCase()} ${config?.url} - ${errorType} - Status: ${status || 'N/A'} ${statusText || ''}`, {
      message: error.message,
      code: error.code
    });

    if (!config) return Promise.reject(error);

    // Auto-logout on 401 Unauthorized (exclude public auth endpoints)
    const isAuthRoute = config.url && (
      config.url.includes('/auth/login') || 
      config.url.includes('/auth/register') || 
      config.url.includes('/auth/send-otp') || 
      config.url.includes('/auth/verify-otp') ||
      config.url.includes('/auth/check-account') ||
      config.url.includes('/auth/set-password')
    );
    if (error.response?.status === 401 && !config._isRetry && !isAuthRoute) {
      console.warn('[API] Session expired (401) — logging out...');
      try {
        setMemoryToken(null);
        localStorage.removeItem('agrinex_token');
        localStorage.removeItem('agrinex-web-auth');
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
