import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, Check } from 'lucide-react';

export default function SetPassword() {
  const { user, setPassword, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [password, setLocalPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const targetEmail = user?.email || '';

  // Password validation criteria
  const pwdCriteria = useMemo(() => ({
    minLen: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }), [password]);

  const isPasswordValid = useMemo(() => (
    pwdCriteria.minLen &&
    pwdCriteria.hasUpper &&
    pwdCriteria.hasLower &&
    pwdCriteria.hasNumber &&
    pwdCriteria.hasSpecial
  ), [pwdCriteria]);

  const passwordsMatch = useMemo(() => (
    password.length > 0 && confirmPassword === password
  ), [password, confirmPassword]);

  const canSubmit = isPasswordValid && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedPassword(true);
    setTouchedConfirm(true);
    setLocalError(null);
    clearError();

    if (!targetEmail) {
      setLocalError('No email associated with session. Please sign in again.');
      return;
    }

    if (!isPasswordValid) {
      setLocalError('Password does not meet all security requirements.');
      return;
    }

    if (!passwordsMatch) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await setPassword(targetEmail, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err: any) {
      setLocalError(err?.response?.data?.detail || err?.message || 'Failed to save password. Please try again.');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-brandLight selection:text-brandDark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
      >
        {/* Header Branding */}
        <div className="bg-brandDark text-white p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,217,139,0.2),transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Secure Your Account</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xs">
              Create a new password to protect your AgriNex account.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Success Banner */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Your account is secured successfully. Redirecting to Dashboard...</span>
            </motion.div>
          )}

          {/* Error Banner */}
          {displayError && !isSuccess && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-medium">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="new-password"
                  name="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setLocalPassword(e.target.value);
                    setTouchedPassword(true);
                  }}
                  placeholder="••••••••••••••••"
                  className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium ${
                    touchedPassword && !isPasswordValid ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  disabled={isLoading || isSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setTouchedConfirm(true);
                  }}
                  placeholder="••••••••••••••••"
                  className={`w-full pl-11 pr-11 py-3.5 bg-slate-50 border rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm font-medium ${
                    touchedConfirm && !passwordsMatch ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                  }`}
                  disabled={isLoading || isSuccess}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password Requirements:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                <div className={`flex items-center gap-2 ${pwdCriteria.minLen ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${pwdCriteria.minLen ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>At least 8 characters</span>
                </div>

                <div className={`flex items-center gap-2 ${pwdCriteria.hasUpper ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${pwdCriteria.hasUpper ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>One uppercase letter</span>
                </div>

                <div className={`flex items-center gap-2 ${pwdCriteria.hasLower ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${pwdCriteria.hasLower ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>One lowercase letter</span>
                </div>

                <div className={`flex items-center gap-2 ${pwdCriteria.hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${pwdCriteria.hasNumber ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>One number</span>
                </div>

                <div className={`flex items-center gap-2 ${pwdCriteria.hasSpecial ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${pwdCriteria.hasSpecial ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>One special character</span>
                </div>

                <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${passwordsMatch ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            {/* Create Password Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit || isSuccess}
              className="w-full py-4 bg-primary hover:bg-emerald-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Securing Account...</span>
                </>
              ) : (
                <span>Create Password</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
