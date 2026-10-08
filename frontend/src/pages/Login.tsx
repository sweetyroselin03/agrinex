import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      // Remember me preference saved securely
      localStorage.setItem('agrinex_remember_me', rememberMe ? 'true' : 'false');
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (_) {}
  };

  const displayError = localError || error;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans"
    >
      {/* ─── FULL-SCREEN FARM BACKGROUND ─── */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
          alt="Lush green field"
          className="w-full h-full object-cover"
        />
        {/* Dark green atmospheric gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#123B24]/90 via-[#185C2B]/85 to-[#123B24]/95 backdrop-blur-[2px]" />
      </div>

      {/* Floating ambient blur */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#6BCB45]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#A7D96A]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── CENTERED GLASS CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-2xl border border-white/60"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-3xl shadow-farm-md mb-4 border border-white/20">
            🌱
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-[#546E7A] font-medium mt-1">
            Continue your journey toward smarter farming.
          </p>
        </div>

        {/* Error notification */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <span className="font-bold">Authentication error:</span>
              <p className="mt-0.5 text-red-600">{displayError}</p>
            </div>
          </motion.div>
        )}

        {/* Login Form with Staggered Elements */}
        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleLoginSubmit}
          className="space-y-5"
        >
          {/* Email Field */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#546E7A]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                placeholder="farmer@agrinex.ai"
                required
                className="agri-input pl-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </motion.div>

          {/* Password Field */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#185C2B] hover:text-[#123B24] hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#546E7A]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="agri-input pl-11 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#546E7A] hover:text-[#123B24] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          {/* Remember Me Checkbox */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded-md border-[#EEF3E8] text-[#185C2B] focus:ring-[#185C2B] cursor-pointer"
            />
            <label htmlFor="remember-me" className="text-xs font-semibold text-[#546E7A] cursor-pointer select-none">
              Remember me
            </label>
          </motion.div>

          {/* Sign In Primary Button */}
          <motion.div variants={itemVariants}>
            <motion.button
              id="login-submit"
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-farm-md"
              disabled={isLoading}
            >
              {isLoading ? (
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
            </motion.button>
          </motion.div>
        </motion.form>

        {/* Card Footer: Create Account Link */}
        <div className="mt-8 pt-6 border-t border-[#EEF3E8] text-center">
          <p className="text-xs text-[#546E7A] font-medium">
            New to AgriNex?{' '}
            <Link
              to="/register"
              className="font-black text-[#185C2B] hover:text-[#123B24] hover:underline transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[#546E7A]/80 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#185C2B]" />
          <span>Encrypted JWT Authentication</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
