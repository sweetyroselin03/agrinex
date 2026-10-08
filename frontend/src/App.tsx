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
import { AlertTriangle, RefreshCw, LayoutDashboard, LogOut, Sprout } from 'lucide-react';

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

// ─── AGRINEX LOADING SCREEN ──────────────────────────────────────────────────
function AgriNexLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7EF] font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 text-center p-8 farm-card max-w-sm w-full mx-4 shadow-xl"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#123B24] flex items-center justify-center text-white text-2xl shadow-md">
          <Sprout className="w-7 h-7 text-[#80B918]" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-black text-[#123B24] tracking-tight">
            AgriNex <span className="text-[#185C2B]">AI</span>
          </h1>
          <p className="text-xs text-[#5B7065] font-semibold">Agricultural Intelligence</p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#185C2B]"
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

        <p className="text-xs text-[#5B7065] font-medium">Loading session...</p>
      </motion.div>
    </div>
  );
}

// ─── REACT ERROR BOUNDARY (LIGHT SURFACE CARD) ───────────────────────────────
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F7EF] font-sans">
          <div className="farm-card p-8 max-w-md w-full text-center space-y-5 shadow-xl bg-white border border-[#E0E7D8]">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#123B24]">Something went wrong</h2>
              <p className="text-xs text-[#5B7065] font-medium leading-relaxed">
                AgriNex encountered an unexpected component error. Your data and account remain safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="btn-secondary py-2.5 px-4 text-xs font-bold rounded-xl"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('agrinex-web-auth');
                    localStorage.removeItem('agrinex_token');
                  } catch (_) {}
                  window.location.href = '/login';
                }}
                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── PROTECTED ROUTE GUARD ───────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isAuthInitialized, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthInitialized) {
      checkAuth();
    }
  }, [isAuthInitialized, checkAuth]);

  if (!isAuthInitialized) {
    return <AgriNexLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─── MAIN APP ROUTER ─────────────────────────────────────────────────────────
export default function App() {
  const { checkAuth, isAuthInitialized } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          {!isAuthInitialized ? (
            <AgriNexLoadingScreen />
          ) : (
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/signup" element={<Navigate to="/register" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/splash" element={<Splash />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Authenticated Layout Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/scan" element={<Scanner />} />
                <Route path="/chat" element={<Chatbot />} />
                <Route path="/community" element={<Community />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
