import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, Component } from 'react';
import type { ReactNode } from 'react';

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
import { useAuthStore } from './store/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

// ─── PREMIUM AGRINEX LOADING SCREEN ──────────────────────────────────────────
function AgriNexLoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center font-sans"
      style={{ background: 'linear-gradient(135deg, #123B24 0%, #185C2B 60%, #1F7A36 100%)' }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#6BCB45]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F9A825]/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-6 text-center"
      >
        {/* Logo icon */}
        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl shadow-2xl backdrop-blur-sm">
          🌱
        </div>

        {/* Brand */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">
            AgriNex <span className="text-[#6BCB45]">AI</span>
          </h1>
          <p className="text-sm text-[#A7D96A] font-medium">Intelligence for Every Acre</p>
        </div>

        {/* Animated dots loader */}
        <div className="flex items-center gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-[#6BCB45]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <p className="text-xs text-white/50 font-medium tracking-wide">
          Preparing your farm intelligence...
        </p>
      </motion.div>
    </div>
  );
}

// ─── REACT ERROR BOUNDARY ────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[AgriNex ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 font-sans"
          style={{ background: 'linear-gradient(135deg, #123B24 0%, #185C2B 100%)' }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="text-4xl">⚠️</div>
            <div>
              <h2 className="text-xl font-black text-white">Something went wrong</h2>
              <p className="text-sm text-white/70 mt-2">
                AgriNex couldn't load this section. This is likely a temporary issue.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-3 rounded-2xl bg-[#6BCB45] text-[#123B24] text-sm font-black hover:bg-[#A7D96A] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="px-5 py-3 rounded-2xl bg-white/15 text-white text-sm font-bold hover:bg-white/25 transition-colors border border-white/20"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('agrinex-web-auth');
                    localStorage.removeItem('agrinex_token');
                  } catch (_) {}
                  window.location.href = '/login';
                }}
                className="px-5 py-3 rounded-2xl bg-red-500/20 text-red-200 text-sm font-bold hover:bg-red-500/35 transition-colors border border-red-400/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── PROTECTED ROUTE ────────────────────────────────────────────────────────
// CRITICAL FIX: Wait for isAuthInitialized before deciding to redirect.
// This prevents the race condition where Zustand persist hydration hasn't
// completed yet, causing isAuthenticated to read as false and bounce the user.
function ProtectedRoute({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, isAuthInitialized, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthInitialized) {
      checkAuth();
    }
  }, [isAuthInitialized]);

  // Show premium loading screen until auth state is confirmed
  if (!isAuthInitialized) {
    return <AgriNexLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// ─── AUTH ROUTE (redirect logged-in users away from login/register) ──────────
function AuthRoute({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, isAuthInitialized } = useAuthStore();

  // Don't redirect until we know auth state
  if (!isAuthInitialized) {
    return <AgriNexLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─── ONBOARDING ROUTE ────────────────────────────────────────────────────────
function OnboardingRoute({ children }: { children: React.JSX.Element }) {
  const onboardingCompleted = localStorage.getItem('agrinex_onboarding_completed') === 'true';
  if (onboardingCompleted) {
    return <Navigate to="/welcome" replace />;
  }
  return children;
}

// ─── APP ROUTES ──────────────────────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation();
  const { checkAuth, isAuthInitialized } = useAuthStore();

  // Initialize auth on mount — runs once to hydrate state from persisted token
  useEffect(() => {
    checkAuth();
  }, []);

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

        {/* Protected Dashboard Routes — wrapped in error boundary */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <MainLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="scan" element={<ErrorBoundary><Scanner /></ErrorBoundary>} />
          <Route path="chat" element={<ErrorBoundary><Chatbot /></ErrorBoundary>} />
          <Route path="community" element={<ErrorBoundary><Community /></ErrorBoundary>} />
          <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          <Route path="profile/:userId" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          <Route path="notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
          <Route path="messages" element={<ErrorBoundary><Messages /></ErrorBoundary>} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="bg-[#F5F7EF] min-h-screen font-sans w-full relative">
            <AppRoutes />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
