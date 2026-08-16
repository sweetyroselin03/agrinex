import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import client from '../api/client';

interface User {
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
  is_verified: boolean;
  is_password_set?: boolean;
  password_setup_required?: boolean;
  followers_count?: number;
  following_count?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  confirmationResult: any;
  
  // Actions
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<any>;
  setPassword: (email: string, password: string) => Promise<void>;
  sendOTP: (email: string) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: any) => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
  followUser: (userId: number) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  reset: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  checkAccount: (identifier: string) => Promise<{ exists: boolean; message?: string; dev_otp?: string }>;
  googleLogin: (idToken: string, profile: any) => Promise<void>;
}

// Global in-memory variable to store raw Firebase ConfirmationResult object reference
let globalConfirmationResult: any = null;

// Helper to format/upgrade error messages based on business requirements
const formatError = (error: any, defaultMsg: string): string => {
  if (!error) return defaultMsg;
  const msg = error.message || '';
  const detail = error.response?.data?.detail;
  let responseMsg = '';

  if (detail) {
    if (typeof detail === 'string') {
      responseMsg = detail === 'Field required' ? 'Please fill in all required fields.' : detail;
    } else if (Array.isArray(detail)) {
      responseMsg = detail.map((e: any) => {
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
      }).join(', ');
    }
  }
  
  const isNetwork = 
    msg.includes('timeout') || 
    msg.toLowerCase().includes('network') || 
    responseMsg.toLowerCase().includes('network') || 
    responseMsg.toLowerCase().includes('timeout') || 
    error.code === 'auth/network-request-failed';

  const isExpired = 
    msg.toLowerCase().includes('expired') || 
    responseMsg.toLowerCase().includes('expired') || 
    msg.toLowerCase().includes('session') || 
    responseMsg.toLowerCase().includes('session') || 
    error.code === 'auth/session-expired';

  if (isNetwork) {
    return 'Unable to connect. Retrying...';
  }
  if (isExpired) {
    return 'Verification expired. Please request a new OTP.';
  }
  
  const finalMsg = responseMsg || msg || defaultMsg;
  return finalMsg === 'Field required' ? 'Please fill in all required fields.' : finalMsg;
};
/**
 * Unwrap the backend's standardize_json_middleware envelope.
 * Backend wraps all JSON responses as: { success, message, data, errors }
 * The actual payload (e.g. { access_token, user }) lives inside `.data`.
 */
const unwrapResponse = (responseData: any): any => {
  if (
    responseData &&
    typeof responseData === 'object' &&
    'success' in responseData &&
    'data' in responseData &&
    'errors' in responseData
  ) {
    return responseData.data; // unwrap the envelope
  }
  return responseData; // already unwrapped (e.g. during tests)
};

// Single-flight promise reference to prevent duplicate parallel /auth/me checks
let checkAuthInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      confirmationResult: null,

      checkAccount: async (identifier) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const response = await safeApiCall(() => client.post('/auth/check-account', { identifier }), 60000);
          return response.data;
        } catch (error: any) {
          set({ error: formatError(error, 'Check account failed') });
          return { exists: false };
        } finally {
          set({ isLoading: false });
        }
      },

      googleLogin: async (idToken, profile) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const response = await safeApiCall(() => client.post('/auth/google', { id_token: idToken, profile }), 60000);
          const payload = unwrapResponse(response.data);
          const { access_token, user } = payload;
          if (!access_token) throw new Error('No access token received from server');
          set({ 
            token: access_token, 
            user, 
            isAuthenticated: true, 
          });
        } catch (error: any) {
          set({ 
            error: formatError(error, 'Google login failed'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const response = await safeApiCall(() => client.post('/auth/login', credentials), 60000);
          const payload = unwrapResponse(response.data);
          const { access_token, user } = payload;
          if (!access_token) throw new Error('No access token received from server');
          console.log('[AuthStore] Login successful, token received, user:', user?.email || user?.full_name);
          set({ 
            token: access_token, 
            user, 
            isAuthenticated: true, 
          });
        } catch (error: any) {
          set({ 
            error: formatError(error, 'Login failed'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const response = await safeApiCall(() => client.post('/auth/register', userData), 60000);
          return response.data;
        } catch (error: any) {
          set({ 
            error: formatError(error, 'Registration failed'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setPassword: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const response = await safeApiCall(() => client.post('/auth/set-password', { email, password }), 60000);
          const payload = unwrapResponse(response.data);
          const { access_token, user } = payload;
          if (!access_token) throw new Error('No access token received from server');
          set({ 
            token: access_token, 
            user: {
              ...user,
              is_password_set: true,
              password_setup_required: false,
            }, 
            isAuthenticated: true, 
          });
        } catch (error: any) {
          set({ 
            error: formatError(error, 'Failed to set password'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      sendOTP: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const response = await safeApiCall(() => client.post('/auth/send-otp', { email }), 60000);
          return response.data;
        } catch (error: any) {
          console.log('[AuthStore] sendOTP failed:', error?.message);
          const errorMsg = formatError(error, 'Unable to send OTP. Please try again.');
          set({ error: errorMsg });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const response = await safeApiCall(() => client.post('/auth/verify-otp', { email, otp }), 60000);
          const payload = unwrapResponse(response.data);
          const { access_token, user } = payload || {};
          if (access_token) {
            set({ 
              token: access_token, 
              user, 
              isAuthenticated: true, 
            });
          }
          return payload;
        } catch (error: any) {
          console.log('[AuthStore] verifyOTP failed:', error?.message);
          set({ 
            error: formatError(error, 'Invalid OTP code'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          const { auth } = require('../utils/firebase');
          const { sendPasswordResetEmail } = require('firebase/auth');
          
          await safeApiCall(() => sendPasswordResetEmail(auth, email), 30000);
        } catch (error: any) {
          console.log('[AuthStore] Firebase password reset failed:', error?.message);
          set({ 
            error: formatError(error, 'Recovery email sent successfully.'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { safeApiCall } = require('../utils/network');
          await safeApiCall(() => client.post('/auth/reset-password', data), 60000);
        } catch (error: any) {
          set({ 
            error: formatError(error, 'Failed to reset password'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await client.put('/user/profile', userData);
          set({ user: response.data });
        } catch (error: any) {
          set({ 
            error: formatError(error, 'Failed to update profile'), 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      followUser: async (userId) => {
        try {
          await client.post(`/users/${userId}/follow`);
          await get().checkAuth();
        } catch (error) {
          console.error('Follow user failed:', error);
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true });
        try {
          await client.delete('/user');
          get().logout();
        } catch (error: any) {
          set({ 
            error: formatError(error, 'Failed to delete account'), 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        // Clear all related store caches
        try {
          const { usePostStore } = require('./usePostStore');
          usePostStore.getState().clearCache?.();
        } catch (e) {}
        try {
          const { useChatStore } = require('./useChatStore');
          useChatStore.getState().clearCache?.();
        } catch (e) {}
        try {
          const { useNotificationStore } = require('./useNotificationStore');
          useNotificationStore.getState().clearLocalCache?.();
        } catch (e) {}

        set({ user: null, token: null, isAuthenticated: false, error: null, confirmationResult: null });
        globalConfirmationResult = null;

        // Clear all AsyncStorage keys
        AsyncStorage.getAllKeys().then((keys) => {
          const chatKeys = keys.filter(k => k.includes('chat') || k.includes('agrinex'));
          AsyncStorage.multiRemove(chatKeys).catch(() => {});
        }).catch(() => {
          AsyncStorage.multiRemove([
            'agrinex-auth-storage',
            'agrinex-post-storage',
            'agrinex-chat-storage-v4',
            'agrinex_premium_chat_v5',
            'chat_history',
            'notifications',
            'feed_cache',
            'scan_history',
          ]).catch(() => {});
        });
      },

      reset: () => {
        set({ isLoading: false, error: null, isAuthenticated: false, user: null, token: null, confirmationResult: null });
        globalConfirmationResult = null;
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        if (checkAuthInFlight) {
          return checkAuthInFlight;
        }

        const { token } = get();
        if (!token || token === 'undefined' || token === 'null') {
          set({ isAuthenticated: false, isLoading: false, token: null, user: null });
          return;
        }

        checkAuthInFlight = (async () => {
          try {
            const response = await client.get('/auth/me', { timeout: 5000 });
            const userData = unwrapResponse(response.data);
            if (userData && userData.id) {
              set({ user: userData, isAuthenticated: true, isLoading: false });
            } else {
              set({ isAuthenticated: true, isLoading: false });
            }
          } catch (error: any) {
            console.log('[AuthStore] checkAuth failed or timed out:', error?.message || error);
            const { user: existingUser } = get();
            if (existingUser && existingUser.id) {
              set({ isAuthenticated: true, isLoading: false });
            } else {
              set({ isLoading: false });
            }
          } finally {
            checkAuthInFlight = null;
          }
        })();

        return checkAuthInFlight;
      }
    }),
    {
      name: 'agrinex-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Partialize to prevent serializing ConfirmationResult complex JS object
      partialize: (state) => {
        const { confirmationResult, ...rest } = state;
        return rest;
      }
    }
  )
);
