import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, ArrowRight, Sprout, Check } from 'lucide-react';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-y-auto font-sans"
    >
      {/* ─── FULL-SCREEN AGRICULTURAL BACKGROUND ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
          alt="Lush agricultural landscape"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#123B24]/90 via-[#185C2B]/80 to-[#123B24]/95 backdrop-blur-[3px]" />
      </div>

      {/* Ambient background glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#80B918]/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#6BCB45]/15 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ─── CENTERED REGISTRATION GLASS CARD ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[450px] bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 md:p-9 shadow-[0_25px_60px_-15px_rgba(18,59,36,0.3)] border border-white/80 my-auto"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center shadow-lg mb-3.5 border border-white/20 ring-4 ring-[#185C2B]/10">
            <Sprout className="w-7 h-7 text-[#80B918]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight leading-tight">
            Start Growing Smarter
          </h1>
          <p className="text-xs sm:text-sm text-[#5B7065] font-medium mt-1">
            Create your AgriNex account.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="w-full mb-7 px-2">
          <div className="flex items-center justify-between relative">
            {/* Connecting background bar */}
            <div className="absolute top-[15px] left-8 right-8 h-[2px] bg-[#EEF3E8] -z-0" />
            {/* Progress fill bar */}
            <div
              className="absolute top-[15px] left-8 h-[2px] bg-[#185C2B] transition-all duration-300 -z-0"
              style={{
                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
              }}
            />

            {steps.map((s) => {
              const isCompleted = step > s.num;
              const isActive = step === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                      isActive
                        ? 'bg-[#185C2B] border-[#185C2B] text-white shadow-md ring-4 ring-[#185C2B]/15 scale-105'
                        : isCompleted
                        ? 'bg-[#185C2B] border-[#185C2B] text-white'
                        : 'bg-white border-[#E0E7D8] text-[#86978C]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 whitespace-nowrap transition-colors ${
                      isActive
                        ? 'text-[#123B24] font-bold'
                        : isCompleted
                        ? 'text-[#185C2B] font-semibold'
                        : 'text-[#86978C]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dev OTP Notification Box */}
        {step === 2 && devOtp && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center font-semibold flex items-center justify-center gap-2">
            <span>Dev Verification Code:</span>
            <strong className="text-sm font-black tracking-widest bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
              {devOtp}
            </strong>
          </div>
        )}

        {/* Error Notification */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium leading-relaxed">{displayError}</p>
          </motion.div>
        )}

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStep1Submit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-fullname"
                  className="block text-xs font-bold text-[#123B24] uppercase tracking-wider text-left"
                >
                  Full Name
                </label>
                <div className="relative w-full">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7065] pointer-events-none" />
                  <input
                    id="signup-fullname"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="agri-input pl-11 pr-4"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-bold text-[#123B24] uppercase tracking-wider text-left"
                >
                  Email Address
                </label>
                <div className="relative w-full">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7065] pointer-events-none" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="farmer@agrinex.ai"
                    className="agri-input pl-11 pr-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-phone"
                  className="block text-xs font-bold text-[#123B24] uppercase tracking-wider text-left"
                >
                  Mobile Number
                </label>
                <div className="relative w-full">
                  <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7065] pointer-events-none" />
                  <input
                    id="signup-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="agri-input pl-11 pr-4"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                id="signup-step1-submit"
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] mt-6 rounded-xl bg-gradient-to-r from-[#123B24] to-[#185C2B] hover:from-[#185C2B] hover:to-[#2D6A4F] text-white font-bold text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#185C2B]/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 px-6 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStep2Submit}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-center">
                <label
                  htmlFor="signup-otp"
                  className="block text-xs font-bold text-[#123B24] uppercase tracking-wider"
                >
                  Enter Verification Code
                </label>
                <p className="text-xs text-[#5B7065] font-medium mb-3">
                  Sent to <span className="font-bold text-[#123B24]">{email}</span>
                </p>
                <div className="relative w-full">
                  <input
                    id="signup-otp"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="agri-input text-center text-xl font-bold tracking-[0.4em] uppercase"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                id="signup-step2-submit"
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] mt-6 rounded-xl bg-gradient-to-r from-[#123B24] to-[#185C2B] hover:from-[#185C2B] hover:to-[#2D6A4F] text-white font-bold text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#185C2B]/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 px-6 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-[#5B7065] hover:text-[#185C2B] transition-colors py-1 cursor-pointer"
              >
                ← Change email or details
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form
              key="step3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStep3Submit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-bold text-[#123B24] uppercase tracking-wider text-left"
                >
                  Create Password
                </label>
                <div className="relative w-full">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7065] pointer-events-none" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    className="agri-input pl-11 pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B7065] hover:text-[#123B24] p-1 rounded-md transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-bold text-[#123B24] uppercase tracking-wider text-left"
                >
                  Confirm Password
                </label>
                <div className="relative w-full">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B7065] pointer-events-none" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Retype password"
                    className="agri-input pl-11 pr-11"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B7065] hover:text-[#123B24] p-1 rounded-md transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="signup-step3-submit"
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] mt-6 rounded-xl bg-gradient-to-r from-[#123B24] to-[#185C2B] hover:from-[#185C2B] hover:to-[#2D6A4F] text-white font-bold text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#185C2B]/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 px-6 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating AgriNex Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#EEF3E8] text-center">
          <p className="text-xs text-[#5B7065] font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#185C2B] hover:text-[#123B24] hover:underline transition-colors ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
