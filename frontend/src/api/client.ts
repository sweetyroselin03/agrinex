import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';

const BASE_URL = API_BASE_URL;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 12000;

// Routes that should NOT be retried when a real HTTP response was already received
const NO_RETRY_ROUTES = [
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/register',
  '/auth/set-password',
  '/posts',
];

// Public auth routes — 401 here is expected (invalid password etc) and should NOT trigger session clearing
const PUBLIC_AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/check-account',
  '/auth/set-password',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number): number => {
  const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return Math.min(base + jitter, MAX_RETRY_DELAY_MS);
};

let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
  if (
    token &&
    typeof token === 'string' &&
    token.trim() !== '' &&
    token !== 'null' &&
    token !== 'undefined'
  ) {
    memoryToken = token.trim();
  } else {
    memoryToken = null;
  }
};

export const getLocalToken = (): string | null => {
  if (memoryToken) return memoryToken;

  try {
    const directToken = localStorage.getItem('agrinex_token');
    if (directToken && typeof directToken === 'string') {
      const trimmed = directToken.trim();
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined') {
        memoryToken = trimmed;
        return trimmed;
      }
    }
  } catch (_) {}

  try {
    const raw = localStorage.getItem('agrinex-web-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token && typeof token === 'string') {
        const trimmed = token.trim();
        if (trimmed && trimmed !== 'null' && trimmed !== 'undefined') {
          memoryToken = trimmed;
          return trimmed;
        }
      }
    }
  } catch (_) {}

  return null;
};

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s for Render free tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getLocalToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Smart 401 Handling & Exponential Backoff
api.interceptors.response.use(
  (response) => {
    // Transparent envelope unwrapping for { success, message, data, errors }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
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
            data: innerData,
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

    if (!config) return Promise.reject(error);

    const status = error.response?.status;
    const url = config.url || '';

    // Only clear session on 401 for protected routes
    if (status === 401 && !config._isRetry) {
      const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => url.includes(route));
      if (!isPublicAuthRoute) {
        console.warn(`[API] 401 on protected route ${url} — clearing session`);
        try {
          setMemoryToken(null);
          localStorage.removeItem('agrinex_token');
          localStorage.removeItem('agrinex-web-auth');
        } catch (_) {}
      }
      return Promise.reject(error);
    }

    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.code === 'ETIMEDOUT';
    const is5xx = !!error.response && error.response.status >= 500;
    const isColdStartFailure = isNetworkError || isTimeout;

    const method = (config.method || 'get').toLowerCase();
    const isNoRetry =
      NO_RETRY_ROUTES.some((route) => url.includes(route)) &&
      method === 'post' &&
      !isColdStartFailure;

    if (isNoRetry) return Promise.reject(error);

    if ((isColdStartFailure || is5xx) && !config._isRetry) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        const delay = getBackoffDelay(config._retryCount - 1);
        console.log(`[API] Retry ${config._retryCount}/${MAX_RETRIES} for ${url} in ${Math.round(delay)}ms`);
        await sleep(delay);
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
