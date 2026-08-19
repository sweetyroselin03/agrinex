import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api, { setMemoryToken } from '../api/client';
import { API_BASE_URL } from '../config/api';

export interface User {
  id: number;
  email: string;
  full_name?: string;
  username?: string;
  village?: string;
  district?: string;
  state?: string;
  farm_size?: string;
  experience?: string;
  crop_specialization?: string;
  profile_picture?: string;
  cover_photo?: string;
  bio?: string;
  website?: string;
  is_verified: boolean;
  is_password_set?: boolean;
  password_setup_required?: boolean;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  checkAccount: (identifier: string) => Promise<{ exists: boolean; message?: string }>;
  sendOTP: (email: string) => Promise<{ message: string; dev_otp?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ message: string }>;
  register: (userData: { full_name: string; email: string }) => Promise<any>;
  setPassword: (email: string, password: string) => Promise<void>;
  login: (credentials: { email: string; password: any }) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; dev_otp?: string }>;
  resetPassword: (data: any) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Custom error formatter
const formatError = (error: any, defaultMsg: string): string => {
  if (!error) return defaultMsg;

  // Network / CORS / Timeout errors — do NOT expose these as auth errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request Timeout: The server took too long to respond. Please try again.';
    }
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      return 'Network Error: You appear to be offline. Please check your internet connection.';
    }
    return 'Server Connection Error: Unable to reach backend server. Please try again.';
  }

  const status = error.response.status;

  if (status === 401) {
    return 'Invalid credentials. Please check your email or password.';
  }
  if (status === 403) {
    return 'Access Denied. You do not have permission to access this resource.';
  }
  if (status === 404) {
    return 'Not Found. The requested resource was not found.';
  }
  if (status === 422) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
      const messages = detail.map((e: any) => {
        const fieldLoc = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : '';
        if (e.msg === 'Field required' || !e.msg) {
          if (fieldLoc === 'email') return 'Email address is required';
          if (fieldLoc === 'full_name') return 'Full Name is required';
          if (fieldLoc === 'password') return 'Password is required';
          return fieldLoc ? `${fieldLoc.replace('_', ' ')} is required` : 'Field required';
        }
        return `${fieldLoc ? fieldLoc.replace('_', ' ') + ': ' : ''}${e.msg}`;
      });
      return `Validation Error: ${messages.join(', ')}`;
    }
    return typeof detail === 'string' ? detail : 'Validation Error: Invalid input format.';
  }
  if (status === 500 || status === 503) {
    return `Server Error (${status}). The backend is temporarily unavailable. Please try again.`;
  }

  const detail = error.response?.data?.detail;
  if (detail) {
    if (typeof detail === 'string') return detail === 'Field required' ? 'Please fill in all required fields.' : detail;
    if (Array.isArray(detail)) {
      return detail.map((e: any) => e.msg || e.detail || JSON.stringify(e)).join(', ');
    }
  }
  if (error.response?.data?.message) return error.response.data.message;
  const rawMsg = error.message || defaultMsg;
  return rawMsg === 'Field required' ? 'Please fill in all required fields.' : rawMsg;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      error: null,

      checkAccount: async (identifier) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/check-account', { identifier });
          return response.data;
        } catch (error: any) {
          const msg = formatError(error, 'Check account failed');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      sendOTP: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/send-otp', { email });
          return response.data;
        } catch (error: any) {
          const msg = formatError(error, 'Failed to send OTP');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/verify-otp', { email, otp });
          return response.data;
        } catch (error: any) {
          const msg = formatError(error, 'Invalid OTP code');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          return response.data;
        } catch (error: any) {
          const msg = formatError(error, 'Registration failed');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setPassword: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/set-password', { email, password });
          const { access_token, user } = response.data;
          // Immediately inject into memory token so all subsequent requests have it
          setMemoryToken(access_token);
          try { localStorage.setItem('agrinex_token', access_token); } catch (_) {}
          set({ token: access_token, user, isAuthenticated: true });
        } catch (error: any) {
          const msg = formatError(error, 'Failed to set password');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (credentials) => {
        const state = get();
        if (state.isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          const { access_token, user } = response.data;
          // Set memory token BEFORE updating Zustand state to prevent
          // the window between "Zustand updated" and "localStorage persisted"
          setMemoryToken(access_token);
          try { localStorage.setItem('agrinex_token', access_token); } catch (_) {}
          set({ token: access_token, user, isAuthenticated: true });
        } catch (error: any) {
          const msg = formatError(error, 'Login failed');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/forgot-password', { email });
          return response.data;
        } catch (error: any) {
          const msg = formatError(error, 'Recovery request failed');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/reset-password', data);
        } catch (error: any) {
          const msg = formatError(error, 'Failed to reset password');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          let response;
          try {
            response = await api.put('/api/user/profile', userData);
          } catch (e: any) {
            if (e.response?.status === 404) {
              try {
                response = await api.put('/user/profile', userData);
              } catch (e2: any) {
                if (e2.response?.status === 404) {
                  response = await api.put('/users/me', userData);
                } else throw e2;
              }
            } else throw e;
          }
          set({ user: response.data });
          return response.data;
        } catch (error: any) {
          const msg = formatError(error, 'Failed to update profile');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * checkAuth — validates the current stored session.
       *
       * CRITICAL POLICY:
       * - If /auth/me succeeds → session is valid, update user data.
       * - If /auth/me returns 401 → JWT is genuinely invalid, clear session.
       * - If /auth/me fails for ANY OTHER reason (500, 502, 503, timeout, network)
       *   → DO NOT clear session. The backend might be starting up. Keep the user
       *   authenticated with their existing stored profile data.
       */
      checkAuth: async () => {
        const storeToken = get().token;
        const activeToken =
          storeToken ||
          (typeof localStorage !== 'undefined' ? localStorage.getItem('agrinex_token') : null);

        if (!activeToken || activeToken === 'null' || activeToken === 'undefined') {
          set({ isAuthenticated: false, user: null, isHydrated: true });
          return;
        }

        // Sync memory token so all in-flight requests have it
        setMemoryToken(activeToken);

        try {
          const response = await api.get('/auth/me');
          set({ token: activeToken, user: response.data, isAuthenticated: true, isHydrated: true });
        } catch (error: any) {
          const httpStatus = error?.response?.status;
          if (httpStatus === 401) {
            // Genuine invalid token — clear session
            console.warn('[AuthStore] checkAuth: 401 Unauthorized — clearing session.');
            setMemoryToken(null);
            try { localStorage.removeItem('agrinex_token'); } catch (_) {}
            set({ token: null, user: null, isAuthenticated: false, isHydrated: true });
          } else {
            // Transient error (500, 502, 503, 504, network down, Render cold start)
            // PRESERVE the authenticated state — the backend will come back online.
            console.warn(`[AuthStore] checkAuth: Non-auth error (${httpStatus || 'network'}) — keeping session alive.`);
            const existingUser = get().user;
            set({
              isAuthenticated: true,
              user: existingUser,
              token: activeToken,
              isHydrated: true,
            });
          }
        }
      },

      logout: () => {
        setMemoryToken(null);
        try { localStorage.removeItem('agrinex_token'); } catch (_) {}
        set({ token: null, user: null, isAuthenticated: false, error: null, isHydrated: true });
        try {
          Object.keys(localStorage).forEach((key) => {
            if (
              key.includes('agrinex') ||
              key.includes('chat') ||
              key.includes('post') ||
              key.includes('user')
            ) {
              localStorage.removeItem(key);
            }
          });
        } catch (_) {}
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'agrinex-web-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Immediately sync memory token from persisted state after hydration
        if (state?.token) {
          setMemoryToken(state.token);
        }
        // Mark store as hydrated once rehydration completes
        state?.isHydrated !== undefined && (state.isHydrated = true);
      },
    }
  )
);

// Expose store globally for the API client to access token without circular imports
if (typeof window !== 'undefined') {
  (window as any).__AGRINEX_STORE__ = useAuthStore;
}
