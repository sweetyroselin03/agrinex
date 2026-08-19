import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

import MainLayout from './layouts/MainLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Community from './pages/Community';
import Scanner from './pages/Scanner';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import SetPassword from './pages/SetPassword';
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: (failureCount, error: any) => {
        // Never retry on 401/403 — these are auth errors
        const status = error?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

/**
 * ProtectedRoute — guards authenticated pages.
 *
 * CRITICAL: Do NOT call checkAuth() on every route change.
 * checkAuth() is called ONCE at app startup in AppRoutes.
 * Repeated calls on navigation cause race conditions: if the backend
 * is momentarily slow, the check can return an error and clear the session,
 * logging the user out mid-session.
 *
 * The isHydrated flag ensures we wait for Zustand to restore from
 * localStorage before making any routing decision.
 */
function ProtectedRoute({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const location = useLocation();

  // While Zustand is restoring from localStorage, show nothing (avoids flicker to /login)
  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Mandatory Password Setup Guard
  if (user && (user.password_setup_required === true || user.is_password_set === false)) {
    return <Navigate to="/set-password" replace state={{ from: location }} />;
  }

  return children;
}

// Password Setup Route Guard (allows authenticated users requiring password setup)
function PasswordSetupRoute({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.is_password_set === true && user.password_setup_required === false) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Redirect Route Wrapper for Auth pages (login/register) — prevents authenticated users from seeing them
function AuthRoute({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();

  if (!isHydrated) return null;

  if (isAuthenticated) {
    if (user && (user.password_setup_required === true || user.is_password_set === false)) {
      return <Navigate to="/set-password" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Check for onboarding status
function OnboardingRoute({ children }: { children: React.JSX.Element }) {
  const onboardingCompleted = localStorage.getItem('agrinex_onboarding_completed') === 'true';
  if (onboardingCompleted) {
    return <Navigate to="/welcome" replace />;
  }
  return children;
}

function AppRoutes() {
  const location = useLocation();
  const { checkAuth } = useAuthStore();

  // Run checkAuth ONCE on app startup.
  // This syncs the stored token to memory and validates the session against /auth/me.
  // It is intentionally NOT called on every route change to prevent race conditions
  // where a slow backend response causes a spurious session invalidation.
  useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Splash and Onboarding */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
        <Route path="/welcome" element={<AuthRoute><Landing /></AuthRoute>} />

        {/* Auth routes */}
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
        <Route path="/set-password" element={<PasswordSetupRoute><SetPassword /></PasswordSetupRoute>} />

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scan" element={<Scanner />} />
          <Route path="chat" element={<Chatbot />} />
          <Route path="community" element={<Community />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="bg-bgMain min-h-screen font-sans w-full relative">
          <AppRoutes />
        </div>
      </Router>
    </QueryClientProvider>
  );
}
