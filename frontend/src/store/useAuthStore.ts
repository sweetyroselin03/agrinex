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
  console.error('[Auth Error]', error);

  // Network / CORS / Timeout errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request Timeout: The server took too long to respond. Please try again.';
    }
    // Check online status to distinguish local network issues from server CORS/offline issues
    if (typeof window !== 'undefined' && !window.navigator.onLine) {
      return 'Network Error: You appear to be offline. Please check your internet connection.';
    }
    return 'Server Connection Error: Unable to reach backend server. Please verify backend server status or CORS settings.';
  }

  const status = error.response.status;

  if (status === 401) {
    return 'Invalid credentials (401 Unauthorized). Please check your email or password.';
  }

  if (status === 403) {
    return 'Access Denied (403 Forbidden). You do not have permission to access this resource.';
  }

  if (status === 404) {
    return 'Not Found (404). The requested API endpoint was not found on the server.';
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
          if (fieldLoc === 'confirm_password' || fieldLoc === 'confirmPassword') return 'Confirm Password is required';
          if (fieldLoc === 'otp' || fieldLoc === 'code') return 'OTP code is required';
          return fieldLoc ? `${fieldLoc.replace('_', ' ')} is required` : 'Field required';
        }
        return `${fieldLoc ? fieldLoc.replace('_', ' ') + ': ' : ''}${e.msg}`;
      });
      return `Validation Error (422): ${messages.join(', ')}`;
    }
    return typeof detail === 'string' ? `Validation Error (422): ${detail}` : 'Validation Error (422): Invalid input format.';
  }

  if (status === 409) {
    const detail = error.response?.data?.detail;
    return typeof detail === 'string' ? detail : 'Conflict (409): Account already exists.';
  }

  if (status === 500 || status === 503) {
    return `Server Error (${status}). The backend server is currently experiencing issues. Please try again shortly.`;
  }

  const detail = error.response?.data?.detail;
  if (detail) {
    if (typeof detail === 'string') {
      if (detail === 'Field required') return 'Please fill in all required fields.';
      return detail;
    }
    if (Array.isArray(detail)) {
      const messages = detail.map((e: any) => {
        const fieldLoc = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : '';
        if (e.msg === 'Field required' || !e.msg) {
          if (fieldLoc === 'email') return 'Email address is required.';
          if (fieldLoc === 'full_name') return 'Full Name is required.';
          if (fieldLoc === 'password') return 'Password is required.';
          if (fieldLoc === 'confirm_password' || fieldLoc === 'confirmPassword') return 'Confirm Password is required.';
          if (fieldLoc === 'otp' || fieldLoc === 'code') return 'OTP code is required.';
          return fieldLoc ? `${fieldLoc.replace('_', ' ')} is required.` : 'Field required.';
        }
        return e.msg || e.detail || JSON.stringify(e);
      });
      return messages.join(', ');
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
      error: null,

      checkAccount: async (identifier) => {
        set({ isLoading: true, error: null });
        const finalEndpoint = `${API_BASE_URL}/auth/check-account`;
        console.log("API_BASE_URL:", API_BASE_URL);
        console.log("Check account endpoint:", finalEndpoint);
        try {
          const response = await api.post('/auth/check-account', { identifier });
          return response.data;
        } catch (error: any) {
          console.error('[REGISTRATION DIAGNOSTICS] Check account error:', {
            requestURL: error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : finalEndpoint,
            status: error.response?.status || 'N/A',
            responseBody: error.response?.data,
            errorCode: error.code,
            message: error.message,
          });
          const msg = formatError(error, 'Check account failed');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      sendOTP: async (email) => {
        set({ isLoading: true, error: null });
        const finalEndpoint = `${API_BASE_URL}/auth/send-otp`;
        console.log("API_BASE_URL:", API_BASE_URL);
        console.log("OTP endpoint:", finalEndpoint);
        try {
          const response = await api.post('/auth/send-otp', { email });
          return response.data;
        } catch (error: any) {
          console.error('[REGISTRATION DIAGNOSTICS] Send OTP error:', {
            requestURL: error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : finalEndpoint,
            status: error.response?.status || 'N/A',
            responseBody: error.response?.data,
            errorCode: error.code,
            message: error.message,
          });
          const msg = formatError(error, 'Failed to send OTP');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, otp) => {
        set({ isLoading: true, error: null });
        const finalEndpoint = `${API_BASE_URL}/auth/verify-otp`;
        console.log("API_BASE_URL:", API_BASE_URL);
        console.log("Verify OTP endpoint:", finalEndpoint);
        try {
          const response = await api.post('/auth/verify-otp', { email, otp });
          return response.data;
        } catch (error: any) {
          console.error('[REGISTRATION DIAGNOSTICS] Verify OTP error:', {
            requestURL: error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : finalEndpoint,
            status: error.response?.status || 'N/A',
            responseBody: error.response?.data,
            errorCode: error.code,
            message: error.message,
          });
          const msg = formatError(error, 'Invalid OTP code');
          set({ error: msg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        const finalEndpoint = `${API_BASE_URL}/auth/register`;
        console.log("API_BASE_URL:", API_BASE_URL);
        console.log("Register endpoint:", finalEndpoint);
        try {
          const response = await api.post('/auth/register', userData);
          return response.data;
        } catch (error: any) {
          console.error('[REGISTRATION DIAGNOSTICS] Register error:', {
            requestURL: error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : finalEndpoint,
            status: error.response?.status || 'N/A',
            responseBody: error.response?.data,
            errorCode: error.code,
            message: error.message,
          });
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
          setMemoryToken(access_token);
          try { localStorage.setItem('agrinex_token', access_token); } catch (e) {}
          set({
            token: access_token,
            user,
            isAuthenticated: true,
          });
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
        const finalEndpoint = `${API_BASE_URL}/auth/login`;
        console.log("API_BASE_URL:", API_BASE_URL);
        console.log("Login endpoint:", finalEndpoint);
        try {
          const response = await api.post('/auth/login', credentials);
          const { access_token, user } = response.data;
          setMemoryToken(access_token);
          try { localStorage.setItem('agrinex_token', access_token); } catch (e) {}
          set({
            token: access_token,
            user,
            isAuthenticated: true,
          });
        } catch (error: any) {
          console.error('[LOGIN DIAGNOSTICS] Login error:', {
            requestURL: error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : finalEndpoint,
            status: error.response?.status || 'N/A',
            responseBody: error.response?.data,
            errorCode: error.code,
            message: error.message,
          });
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


      checkAuth: async () => {
        const storeToken = get().token;
        const activeToken = storeToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('agrinex_token') : null);
        if (!activeToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        setMemoryToken(activeToken);
        try {
          const response = await api.get('/auth/me');
          set({ token: activeToken, user: response.data, isAuthenticated: true });
        } catch (error) {
          // Token expired or invalid
          setMemoryToken(null);
          try { localStorage.removeItem('agrinex_token'); } catch (e) {}
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      logout: () => {
        setMemoryToken(null);
        try { localStorage.removeItem('agrinex_token'); } catch (e) {}
        set({ token: null, user: null, isAuthenticated: false, error: null });
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.includes('agrinex') || key.includes('chat') || key.includes('post') || key.includes('user')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {}
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'agrinex-web-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__AGRINEX_STORE__ = useAuthStore;
}
