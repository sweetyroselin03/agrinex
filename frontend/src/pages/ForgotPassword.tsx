import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP & New Password, 3: Success
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
    } catch (err: any) {
      // Error is stored in AuthStore
    }
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
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      setStep(3);
    } catch (err: any) {
      // Error is stored in AuthStore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-brandLight selection:text-brandDark">
      
      {/* ─── LEFT PANEL: CINEMATIC BRANDING ─── */}
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
            Secure Recovery
          </span>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
            Protect and Recover Your Farm Data
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Verify identity with secure verification keys. Your passwords are encrypted with industrial hashing standards to keep operations and crop intelligence records safe.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex justify-between items-center text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} AgriNex Inc.</span>
          <span>v2.4.0</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: RECOVERY CARD ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile logo header */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="text-3xl">🌱</span>
            <h1 className="text-xl font-extrabold tracking-tight text-brandDark">AgriNex <span className="text-primary">AI</span></h1>
          </div>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-brandDark tracking-tight">Reset Password</h2>
                <p className="text-sm text-textSec font-medium">
                  Enter your registered email address to receive a secure recovery code.
                </p>
              </div>

              {/* Error notifications */}
              {(localError || error) && (
                <div className="p-4 rounded-xl bg-rose/5 border border-rose/10 flex items-start gap-3 text-rose text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Recovery Failed:</span>
                    <p className="mt-0.5">{localError || error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-6">
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

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-slate-100">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-brandDark tracking-tight">Enter Verification Code</h2>
                <p className="text-sm text-textSec font-medium">
                  We've sent a verification code to <span className="font-bold text-brandDark">{email}</span>.
                </p>
              </div>

              {/* Success Alert */}
              {successMessage && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 text-brandDark text-sm flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Code Sent:</span>
                    <p className="mt-0.5">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Error notifications */}
              {(localError || error) && (
                <div className="p-4 rounded-xl bg-rose/5 border border-rose/10 flex items-start gap-3 text-rose text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Verification Failed:</span>
                    <p className="mt-0.5">{localError || error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* OTP Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-brandDark placeholder-slate-400 outline-none text-center text-lg tracking-widest font-bold transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-brandDark placeholder-slate-400 outline-none text-sm transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-brandDark placeholder-slate-400 outline-none text-sm transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setStep(1); clearError(); setLocalError(null); }}
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Try Different Email
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-brandDark tracking-tight">Password Reset</h2>
                <p className="text-sm text-textSec font-medium">
                  Your credentials have been securely updated. You can now login with your new password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-4 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
              >
                Log In Now
              </button>
            </motion.div>
          )}

        </div>
      </div>

    </div>
  );
}
