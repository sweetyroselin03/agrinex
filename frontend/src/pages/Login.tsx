import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, ArrowRight, Sprout, Sparkles, Microscope, Cpu, Users } from 'lucide-react';

const LOGIN_TIMEOUT_MS = 15000; // 15s timeout protection

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { login, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localLoading) return;

    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLocalLoading(true);

    timeoutRef.current = setTimeout(() => {
      setLocalLoading(false);
      setLocalError('Sign-in is taking longer than expected. Please check connection.');
    }, LOGIN_TIMEOUT_MS);

    try {
      localStorage.setItem('agrinex_remember_me', rememberMe ? 'true' : 'false');
      await login({ email: email.trim(), password });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const status = err?.response?.status;
      if (!err?.response) {
        setLocalError('Unable to connect to AgriNex services. Please verify your connection.');
      } else if (status === 401 || status === 403 || status === 422) {
        setLocalError('Invalid email or password. Please check your credentials.');
      } else if (status && status >= 500) {
        setLocalError('AgriNex service is temporarily unavailable. Please try again shortly.');
      } else {
        setLocalError(err?.message || 'Sign-in failed. Please check your inputs.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen w-full bg-[#F5F7EF] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      <div className="w-full max-w-5xl farm-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-2xl min-h-[640px]">
        {/* ─── LEFT BRAND PANEL (LG: 5 COLS) ─── */}
        <div className="lg:col-span-5 relative p-8 sm:p-10 text-white flex flex-col justify-between overflow-hidden bg-[#123B24]">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80"
              alt="Botanical field"
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#123B24]/90 via-[#185C2B]/85 to-[#123B24]/95" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Sprout className="w-6 h-6 text-[#6BCB45]" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">AgriNex AI</h2>
                <p className="text-[10px] font-semibold text-[#A7D96A] tracking-wider uppercase">
                  Agricultural Intelligence
                </p>
              </div>
            </div>

            <div className="pt-8 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#A7D96A] border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-[#6BCB45]" />
                <span>Next-Gen Smart Farming</span>
              </span>
              <h1 className="text-3xl font-black text-white leading-tight">
                Intelligence for Every Acre.
              </h1>
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                Empowering farmers with PyTorch vision diagnostics, Llama 3 agronomist advisory, and real-time community insights.
              </p>
            </div>

            {/* Highlights */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-xs text-white/90 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Microscope className="w-4 h-4 text-[#6BCB45]" />
                </div>
                <span>99%+ Foliage Disease Pattern Accuracy</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/90 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-[#A7D96A]" />
                </div>
                <span>AgriGPT 24/7 Soil & Crop Advisory</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/90 font-semibold">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[#6BCB45]" />
                </div>
                <span>Verified Farmer Community Network</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/15">
            <p className="text-[11px] text-white/70">
              © {new Date().getFullYear()} AgriNex Platform. All Rights Reserved.
            </p>
          </div>
        </div>

        {/* ─── RIGHT AUTH FORM PANEL (LG: 7 COLS) ─── */}
        <div className="lg:col-span-7 p-8 sm:p-12 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs text-[#5B7065] font-medium mt-1">
                Enter your credentials to access your farm intelligence hub.
              </p>
            </div>

            {/* Error Notification */}
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Authentication failed:</span>
                  <p className="mt-0.5 text-red-600 font-medium">{displayError}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7065]" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="farmer@agrinex.ai"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={localLoading}
                    autoComplete="email"
                    className="agri-input pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#185C2B] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7065]" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={localLoading}
                    autoComplete="current-password"
                    className="agri-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B7065] hover:text-[#123B24]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#5B7065] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#E0E7D8] text-[#185C2B] focus:ring-[#185C2B]"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={localLoading}
                className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold shadow-md cursor-pointer"
              >
                {localLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-[#EEF3E8] text-center space-y-3">
              <p className="text-xs text-[#5B7065] font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-[#185C2B] hover:underline">
                  Create Account
                </Link>
              </p>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#5B7065] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#185C2B]" />
                <span>Protected by 256-bit Encrypted Token Authentication</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
