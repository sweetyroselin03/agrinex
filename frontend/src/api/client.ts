import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';

const BASE_URL = API_BASE_URL;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 12000;

// Routes that should NOT be retried when a real HTTP response was already received
// (idempotency-sensitive: duplicate OTP sends, duplicate registrations, duplicate posts)
// NOTE: login/register are only blocked if they received a response (2xx or 4xx).
// Cold-start timeouts (no response at all) are ALWAYS retried on all routes.
const NO_RETRY_ROUTES = [
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/register',
  '/auth/set-password',
  '/posts',
];

// Public auth routes — 401 here is expected and should NOT trigger session invalidation
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

// ─── In-memory token (single source of truth for the current request cycle) ────
let memoryToken: string | null = null;

export const setMemoryToken = (token: string | null) => {
  if (
    token &&
    typeof token === 'string' &&
    token.trim() !== '' &&
    token !== 'null' &&
    token !== 'undefined' &&
    !token.includes('\0')
  ) {
    memoryToken = token.trim();
  } else {
    memoryToken = null;
  }
};

export const getLocalToken = (): string | null => {
  // 1. In-memory cache — fastest, available immediately after login
  if (memoryToken) return memoryToken;

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
  } catch (_) {}

  // 3. Zustand store in-memory state (via global ref)
  try {
    const storeToken = (window as any)?.__AGRINEX_STORE__?.getState()?.token;
    if (storeToken && typeof storeToken === 'string') {
      const trimmed = storeToken.trim();
      if (trimmed && trimmed !== 'null' && trimmed !== 'undefined' && !trimmed.includes('\0')) {
        memoryToken = trimmed;
        return trimmed;
      }
    }
  } catch (_) {}

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
  } catch (_) {}

  return null;
};

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s — accommodates Render free-tier cold starts (~30-50s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Inject JWT Token ────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getLocalToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Smart 401 Handling & Exponential Backoff ───────────
api.interceptors.response.use(
  (response) => {
    // Transparent envelope unwrapping for { success, message, data, errors } pattern
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

    // ─── 401 Handling — STRICT SESSION INVALIDATION POLICY ─────────────────────
    // A 401 should only clear the session when:
    //   1. The request URL is NOT a public auth route (login, register, OTP, etc.)
    //   2. AND the token in memory is genuinely missing or invalid
    //   3. AND this is not a retry caused by a transient server error
    //
    // DO NOT logout for: 502, 503, 504, timeout, network error, or non-auth 401
    // caused by a race condition (e.g., localStorage not yet persisted after login).
    if (status === 401 && !config._isRetry) {
      const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => url.includes(route));

      if (!isPublicAuthRoute) {
        // Attempt to recover the token from persistent storage before giving up
        const recoveredToken = getLocalToken();
        if (recoveredToken) {
          // Token exists — this 401 is likely a race condition. Retry once with token.
          console.warn(`[API] 401 on ${url} — token recovered (${recoveredToken.substring(0, 12)}...), retrying once.`);
          config._isRetry = true;
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${recoveredToken}`;
          try {
            return await api(config);
          } catch (retryError: any) {
            if (retryError?.response?.status === 401) {
              // Token is genuinely invalid — clear session
              console.warn(`[API] 401 confirmed after retry on ${url} — clearing session.`);
              _performLogout();
            }
            return Promise.reject(retryError);
          }
        } else {
          // No token at all — session is genuinely invalid
          console.warn(`[API] 401 on ${url} — no token found, clearing session.`);
          _performLogout();
        }
      }
      return Promise.reject(error);
    }

    // ─── Skip retry ONLY when a real HTTP response was already received ─────────
    // Idempotency risk only applies when the server processed the request (got a response).
    // Timeouts and network errors mean the server never responded — safe to retry.
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.code === 'ETIMEDOUT';
    const is5xx = !!error.response && error.response.status >= 500;
    const isColdStartFailure = isNetworkError || isTimeout;

    const method = (config.method || 'get').toLowerCase();
    // Only block retries if: it's a POST route that got a real response (not a cold-start timeout)
    const isNoRetry =
      NO_RETRY_ROUTES.some((route) => url.includes(route)) &&
      method === 'post' &&
      !isColdStartFailure; // Always allow retry when the server never responded

    if (isNoRetry) return Promise.reject(error);

    // ─── Exponential Backoff Retry for 5xx / network / timeout errors ─────────
    if ((isColdStartFailure || is5xx) && !config._isRetry) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        const delay = getBackoffDelay(config._retryCount - 1);
        console.log(`[API] Retry ${config._retryCount}/${MAX_RETRIES} for ${url} in ${Math.round(delay)}ms (cold-start/network)`);
        await sleep(delay);
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Performs a clean session logout. Only called when authentication is
 * PROVEN invalid (401 confirmed after retry with existing token, or no token at all).
 * NEVER called for 5xx errors, timeouts, Gemini failures, or network disconnections.
 */
function _performLogout() {
  try {
    setMemoryToken(null);
    localStorage.removeItem('agrinex_token');
    // Update Zustand store state without triggering navigation — let the router handle redirect
    const store = (window as any)?.__AGRINEX_STORE__;
    if (store) {
      store.setState({ token: null, user: null, isAuthenticated: false });
    } else {
      // Fallback: clear persisted state so ProtectedRoute redirects to login
      localStorage.removeItem('agrinex-web-auth');
    }
  } catch (_) {}
}

export default api;
