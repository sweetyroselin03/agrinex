import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api/client';

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
  if (error.message === 'Network Error') {
    return 'Unable to reach backend server. Please check internet connection or server status.';
  }
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
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', credentials);
          const { access_token, user } = response.data;
          set({
            token: access_token,
            user,
            isAuthenticated: true,
          });
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


      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          // Token expired or invalid
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      logout: () => {
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
