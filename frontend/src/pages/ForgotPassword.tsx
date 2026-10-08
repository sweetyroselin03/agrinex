import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { forgotPassword, resetPassword, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    try {
      const res = await forgotPassword(email.trim());
      setSuccessMessage(res.message || 'Verification code sent to your email.');
      setStep(2);
    } catch (_) {}
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    if (!otp.trim()) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword) {
      setLocalError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    try {
      await resetPassword({ email: email.trim(), otp: otp.trim(), new_password: newPassword });
      setStep(3);
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
        <AnimatePresence mode="wait">
          {/* STEP 1: Request OTP */}
          {step === 1 && (
            <motion.div
              key="fp_step1"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-2xl shadow-farm-md mb-3 border border-white/20">
                  🔑
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
                  Recover Your AgriNex Account
                </h1>
                <p className="text-xs sm:text-sm text-[#546E7A] font-medium mt-1">
                  Enter your email address to receive a secure recovery code.
                </p>
              </div>

              {displayError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <p>{displayError}</p>
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                    <input
                      id="fp-email"
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

                <motion.button
                  id="fp-send-otp-btn"
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-farm-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Verify OTP + New Password */}
          {step === 2 && (
            <motion.div
              key="fp_step2"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-2xl shadow-farm-md mb-3 border border-white/20">
                  📧
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#123B24] tracking-tight">
                  Set New Password
                </h1>
                {successMessage && (
                  <p className="text-xs text-[#185C2B] font-bold bg-[#EEF3E8] py-1.5 px-3 rounded-xl mt-2 inline-block">
                    {successMessage}
                  </p>
                )}
              </div>

              {displayError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <p>{displayError}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="fp-otp"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    className="agri-input text-center text-2xl font-black tracking-[0.3em] py-3"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#123B24] uppercase tracking-wider block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                    <input
                      id="fp-new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      className="agri-input pl-11 pr-12"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#546E7A]" />
                    <input
                      id="fp-confirm-password"
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
                  id="fp-reset-submit-btn"
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-farm-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <motion.div
              key="fp_step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-5"
            >
              <div className="w-20 h-20 rounded-full bg-[#EEF3E8] flex items-center justify-center text-4xl mx-auto shadow-farm-md">
                ✅
              </div>
              <h2 className="text-2xl font-black text-[#123B24]">
                Password Reset Successful!
              </h2>
              <p className="text-xs sm:text-sm text-[#546E7A] font-medium leading-relaxed">
                Your credentials have been securely updated. You can now sign in with your new password.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-farm-md flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Return to Sign In</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {step !== 3 && (
          <div className="mt-8 pt-6 border-t border-[#EEF3E8] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#546E7A] hover:text-[#185C2B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
