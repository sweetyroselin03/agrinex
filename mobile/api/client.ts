import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://agrinex.onrender.com';

// ─── Retry Configuration ─────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 8000;

// Routes that should NOT be retried (idempotency-sensitive)
const NO_RETRY_ROUTES = [
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/register',
  '/auth/set-password',
  '/posts',
  '/ai/detect-disease',
];

// Public auth routes — 401 here is expected and MUST NOT trigger logout
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getBackoffDelay = (attempt: number): number => {
  const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return Math.min(base + jitter, MAX_RETRY_DELAY_MS);
};

// ─── Axios Instance ───────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Inject JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const { useAuthStore } = require('../store/useAuthStore');
      const state = useAuthStore.getState();
      const token = state.token;
      if (
        token &&
        typeof token === 'string' &&
        token !== 'undefined' &&
        token !== 'null' &&
        token.length > 10
      ) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // AuthStore might not be initialized yet during cold boot — safe to ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Smart 401 Handling + Exponential Backoff ───────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retryCount?: number;
      _isRetry?: boolean;
    };

    if (!config) return Promise.reject(error);

    const status = error.response?.status;
    const url = config.url || '';

    // ─── 401 Handling — STRICT POLICY ────────────────────────────────────────
    // A 401 response ONLY invalidates the session when:
    //   1. The route is NOT a public auth route
    //   2. AND the token is genuinely missing (not just a race condition)
    //   3. AND a retry with the existing token also returns 401
    //
    // NEVER logout for: 500, 502, 503, 504, timeout, network disconnection,
    // Gemini 429, weather API failure, notifications failure, or scan history failure.
    if (status === 401 && !config._isRetry) {
      const isPublicRoute = PUBLIC_AUTH_ROUTES.some(route => url.includes(route));

      if (!isPublicRoute) {
        try {
          const { useAuthStore } = require('../store/useAuthStore');
          const state = useAuthStore.getState();
          const currentToken = state.token;

          if (currentToken && currentToken !== 'null' && currentToken !== 'undefined') {
            // Token exists — could be a race condition. Retry once with current token.
            console.warn(`[API Mobile] 401 on ${url} — token exists, retrying once.`);
            config._isRetry = true;
            config.headers.Authorization = `Bearer ${currentToken}`;
            try {
              return await api(config);
            } catch (retryError: any) {
              if (retryError?.response?.status === 401) {
                // Token is genuinely expired or invalid — only NOW logout
                console.warn(`[API Mobile] 401 confirmed after retry on ${url} — session expired.`);
                state.logout();
              }
              return Promise.reject(retryError);
            }
          } else {
            // No token at all — user was never authenticated for this session
            console.warn(`[API Mobile] 401 on ${url} — no token found.`);
            if (state.isAuthenticated) {
              state.logout();
            }
          }
        } catch (_) {}
      }

      return Promise.reject(error);
    }

    // ─── Skip retry for idempotency-sensitive routes ──────────────────────────
    const method = (config.method || 'get').toLowerCase();
    const isNoRetry = NO_RETRY_ROUTES.some(route => url.includes(route)) && method === 'post';
    if (isNoRetry) return Promise.reject(error);

    // ─── Exponential Backoff Retry for 5xx / network / timeout ───────────────
    // IMPORTANT: 5xx errors (backend cold start, Render restart) MUST be retried.
    // They MUST NOT trigger logout — the backend will come back online.
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED';
    const is5xx = !!error.response && error.response.status >= 500;

    if ((isNetworkError || isTimeout || is5xx) && !config._isRetry) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        const delay = getBackoffDelay(config._retryCount - 1);
        console.log(
          `[API Mobile] Retry ${config._retryCount}/${MAX_RETRIES} for ${url} ` +
          `(${isTimeout ? 'timeout' : is5xx ? `${status}` : 'network'}) in ${Math.round(delay)}ms`
        );
        await sleep(delay);
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
