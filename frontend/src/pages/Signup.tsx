import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';

const steps = [
  { num: 1, label: 'Details' },
  { num: 2, label: 'Verify OTP' },
  { num: 3, label: 'Password' },
];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { checkAccount, sendOTP, verifyOTP, register, setPassword: setStorePassword, isLoading, error, clearError } = useAuthStore();

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setLocalError('All fields are required.');
      return;
    }
    try {
      const checkRes = await checkAccount(email.trim());
      if (checkRes.exists) {
        setLocalError(checkRes.message || 'An account with this email already exists. Please sign in.');
        return;
      }
      const otpRes = await sendOTP(email.trim());
      if (otpRes.dev_otp) setDevOtp(otpRes.dev_otp);
      setStep(2);
    } catch (_) {}
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!otp.trim()) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }
    try {
      await verifyOTP(email.trim(), otp.trim());
      setStep(3);
    } catch (_) {}
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!password || !confirmPassword) {
      setLocalError('Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    try {
      await register({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim() });
      await setStorePassword(email.trim(), password);
      navigate('/dashboard');
    } catch (_) {}
  };

  const displayError = localError || error;

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
          alt="Lush agricultural landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#123B24]/90 via-[#185C2B]/85 to-[#123B24]/95 backdrop-blur-[2px]" />
      </div>

      {/* Floating ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#6BCB45]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A7D96A]/15 rounded-full blur-[100px] pointer-events-none" />

      {/* ─── CENTERED GLASS CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-2xl border border-white/60"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-2xl shadow-farm-md mb-3 border border-white/20">
            🌱
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
            Start Growing Smarter
          </h1>
          <p className="text-xs sm:text-sm text-[#546E7A] font-medium mt-1">
            Create your AgriNex account.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s.num
                    ? 'bg-[#185C2B] text-white shadow-farm-sm'
                    : step > s.num
                    ? 'bg-[#EEF3E8] text-[#185C2B]'
                    : 'bg-[#EEF3E8] text-[#546E7A]'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-[11px] font-bold ${step === s.num ? 'text-[#123B24]' : 'text-[#546E7A]'}`}>
                {s.label}
              </span>
              {idx < steps.length - 1 && <span className="text-[#546E7A]/40 text-xs">›</span>}
            </div>
          ))}
        </div>

        {/* Dev OTP Box */}
        {step === 2 && devOtp && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center font-bold">
            <span>Dev OTP Code: <strong className="text-base tracking-widest">{devOtp}</strong></span>
          </div>
        )}

        {/* Error notification */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <p className="flex-1">{displayError}</p>
          </motion.div>
        )}

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleStep1Submit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                  <input
                    id="signup-fullname"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="agri-input pl-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="farmer@agrinex.ai"
                    className="agri-input pl-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                  <input
                    id="signup-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="agri-input pl-11"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <motion.button
                id="signup-step1-submit"
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-farm-md mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleStep2Submit}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                  Enter 6-Digit OTP Sent to {email}
                </label>
                <input
                  id="signup-otp"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="• • • • • •"
                  className="agri-input text-center text-2xl font-black tracking-[0.3em] py-3.5"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <motion.button
                id="signup-step2-submit"
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-farm-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-[#546E7A] hover:text-[#185C2B] transition-colors"
              >
                ← Change email or details
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="step3"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleStep3Submit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    className="agri-input pl-11 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#546E7A] hover:text-[#123B24]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Retype password"
                    className="agri-input pl-11"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <motion.button
                id="signup-step3-submit"
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-farm-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating AgriNex Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#EEF3E8] text-center">
          <p className="text-xs text-[#546E7A] font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-black text-[#185C2B] hover:text-[#123B24] hover:underline transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
