import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      // Error message is already saved in AuthStore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-brandLight selection:text-brandDark">
      
      {/* ─── LEFT PANEL: CINEMATIC BRADING ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brandDark text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,217,139,0.18),transparent_55%)]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        
        {/* Header Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-3xl">🌱</span>
          <h2 className="text-xl font-extrabold tracking-tight">AgriNex <span className="text-primary">AI</span></h2>
        </div>

        {/* Feature Pitch */}
        <div className="space-y-6 relative z-10 max-w-lg">
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Enterprise Grade
          </span>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
            Optimize Your Crop Yield in Real-Time
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Diagnose foliage diseases with our neural network scanner, monitor soil moisture alerts, and chat with AI agronomists to protect your crop health.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex justify-between items-center text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} AgriNex Inc.</span>
          <span>v2.4.0</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: LOGIN CARD ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile logo header */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="text-3xl">🌱</span>
            <h1 className="text-xl font-extrabold tracking-tight text-brandDark">AgriNex <span className="text-primary">AI</span></h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-brandDark tracking-tight">Welcome Back</h2>
            <p className="text-sm text-textSec font-medium">
              Access your digital farm operations platform.
            </p>
          </div>

          {/* Error notifications */}
          {(localError || error) && (
            <div className="p-4 rounded-xl bg-rose/5 border border-rose/10 flex items-start gap-3 text-rose text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Login Failed:</span>
                <p className="mt-0.5">{localError || error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleLoginSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="name@farm.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-brandDark placeholder-slate-400 outline-none text-sm transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-brandDark placeholder-slate-400 outline-none text-sm transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4.5 w-4.5 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-textSec cursor-pointer select-none">
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                'Secure Sign In'
              )}
            </button>
          </form>

          {/* Redirect to Register */}
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-textSec font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-primary hover:underline">
                Create Free Account
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
