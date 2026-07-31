import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, XCircle, Sparkles, Check } from 'lucide-react';

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

  // Field touched states
  const [touchedFullName, setTouchedFullName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { 
    checkAccount, 
    sendOTP, 
    verifyOTP, 
    register, 
    setPassword: setStorePassword, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();

  // ── Validation Heuristics ───────────────────────────────────────────────────
  const fullNameValid = useMemo(() => fullName.trim().length >= 3, [fullName]);
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  
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

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFullName(true);
    setTouchedEmail(true);
    setLocalError(null);
    clearError();

    if (!fullNameValid || !emailValid) return;

    try {
      const checkRes = await checkAccount(email.trim());
      if (checkRes.exists) {
        setLocalError(checkRes.message || 'Account already exists. Please login.');
        return;
      }

      const otpRes = await sendOTP(email.trim());
      if (otpRes.dev_otp) {
        setDevOtp(otpRes.dev_otp);
      }
      setStep(2);
    } catch (err) {}
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!otp.trim() || otp.trim().length < 6) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      await verifyOTP(email.trim(), otp.trim());
      setStep(3);
    } catch (err) {}
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedPassword(true);
    setTouchedConfirm(true);
    setLocalError(null);
    clearError();

    if (!isPasswordValid || !passwordsMatch) return;

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined
      });

      await setStorePassword(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {}
  };

  const stepsList = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Verification' },
    { num: 3, label: 'Security' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-brandLight selection:text-brandDark">
      
      {/* LEFT COLUMN: BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-brandDark text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,217,139,0.18),transparent_55%)]" />
        
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-3xl">🌱</span>
          <h2 className="text-xl font-extrabold tracking-tight">AgriNex <span className="text-primary">AI</span></h2>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Join the Network
          </span>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
            Smart Farming Made Exceptionally Simple
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Create an account to join over 10,000 farmers sharing diagnostic scan logs, chat archives, and localized crop forums.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} AgriNex Inc.
        </div>
      </div>

      {/* RIGHT COLUMN: MULTI-STEP CARD */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Step indicators */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            {stepsList.map((s, idx) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-primary text-brandDark shadow-[0_0_15px_rgba(0,217,139,0.3)]'
                    : step > s.num
                    ? 'bg-brandDark text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-xs font-bold tracking-wide hidden sm:block ${
                  step === s.num ? 'text-brandDark' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
                {idx < stepsList.length - 1 && (
                  <div className="w-8 h-0.5 bg-slate-100 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-brandDark tracking-tight">
              {step === 1 && 'Create Your Account'}
              {step === 2 && 'Verify Your Email'}
              {step === 3 && 'Choose a Secure Password'}
            </h2>
            <p className="text-sm text-textSec font-medium">
              {step === 1 && 'Enter details to verify and register your farm.'}
              {step === 2 && `We sent a 6-digit OTP code to ${email}.`}
              {step === 3 && 'Choose a password matching all security requirements.'}
            </p>
          </div>

          {/* Dev OTP Helper */}
          {step === 2 && devOtp && (
            <div className="p-4 rounded-xl bg-brandLight border border-primary/20 text-brandDark text-xs flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 animate-pulse" />
              <div>
                <span className="font-bold">Dev Sandbox Notice:</span>
                <p className="mt-0.5">Use OTP code <strong className="text-md underline font-black">{devOtp}</strong> to verify this test account.</p>
              </div>
            </div>
          )}

          {/* Global Errors display */}
          {(localError || error) && (
            <div className="p-4 rounded-xl bg-rose/10 border border-rose/20 flex items-start gap-3 text-rose text-xs font-bold">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span>
                <p className="mt-0.5 font-medium">{localError || error}</p>
              </div>
            </div>
          )}

          {/* Multi-step Forms Wrapper */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleStep1Submit}
                className="space-y-5"
              >
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      className={`w-full pl-11 pr-10 py-3 rounded-xl border ${
                        touchedFullName && !fullNameValid 
                          ? 'border-rose text-rose bg-rose/5' 
                          : touchedFullName && fullNameValid 
                          ? 'border-emerald-500 bg-emerald-50/30' 
                          : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      } text-brandDark placeholder-slate-400 outline-none text-sm transition-all`}
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setTouchedFullName(true); }}
                      onBlur={() => setTouchedFullName(true)}
                    />
                    {touchedFullName && fullNameValid && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3 top-3.5" />
                    )}
                  </div>
                  {touchedFullName && !fullNameValid && (
                    <p className="text-xs text-rose font-semibold mt-1">Full Name is required (at least 3 characters).</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      className={`w-full pl-11 pr-10 py-3 rounded-xl border ${
                        touchedEmail && !emailValid 
                          ? 'border-rose text-rose bg-rose/5' 
                          : touchedEmail && emailValid 
                          ? 'border-emerald-500 bg-emerald-50/30' 
                          : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      } text-brandDark placeholder-slate-400 outline-none text-sm transition-all`}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setTouchedEmail(true); }}
                      onBlur={() => setTouchedEmail(true)}
                    />
                    {touchedEmail && emailValid && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3 top-3.5" />
                    )}
                  </div>
                  {touchedEmail && !emailValid && (
                    <p className="text-xs text-rose font-semibold mt-1">A valid email address is required.</p>
                  )}
                </div>

                {/* Mobile Phone (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">
                    Mobile Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      placeholder="+919876543210 (optional)"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-brandDark placeholder-slate-400 outline-none text-sm transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  disabled={isLoading || !fullNameValid || !emailValid}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification OTP'}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleStep2Submit}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Verification OTP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full py-4 px-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-brandDark outline-none text-center text-xl font-bold tracking-[0.25em] transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-primary text-brandDark font-extrabold text-sm hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  disabled={isLoading || otp.trim().length < 6}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs font-bold text-slate-400 hover:text-brandDark"
                >
                  Change Email or details
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form
                key="step-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleStep3Submit}
                className="space-y-5"
              >
                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      className={`w-full pl-11 pr-11 py-3 rounded-xl border ${
                        touchedPassword && !isPasswordValid
                          ? 'border-rose text-rose bg-rose/5'
                          : touchedPassword && isPasswordValid
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      } text-brandDark placeholder-slate-400 outline-none text-sm transition-all`}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setTouchedPassword(true); }}
                      onBlur={() => setTouchedPassword(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {touchedPassword && !password && (
                    <p className="text-xs text-rose font-semibold mt-1">Password is required.</p>
                  )}
                </div>

                {/* Password Strength Requirements Checklist */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <p className="font-bold text-brandDark text-[11px] uppercase tracking-wider mb-2">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-1.5 font-medium">
                    <div className={`flex items-center gap-1.5 ${pwdCriteria.minLen ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdCriteria.minLen ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdCriteria.hasUpper ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdCriteria.hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdCriteria.hasLower ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdCriteria.hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdCriteria.hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                      {pwdCriteria.hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span>Number</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdCriteria.hasSpecial ? 'text-emerald-600 font-bold' : 'text-slate-400'} col-span-2`}>
                      {pwdCriteria.hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span>Special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brandDark uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Retype password"
                      className={`w-full pl-11 pr-10 py-3 rounded-xl border ${
                        touchedConfirm && !passwordsMatch
                          ? 'border-rose text-rose bg-rose/5'
                          : touchedConfirm && passwordsMatch
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      } text-brandDark placeholder-slate-400 outline-none text-sm transition-all`}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setTouchedConfirm(true); }}
                      onBlur={() => setTouchedConfirm(true)}
                    />
                    {touchedConfirm && passwordsMatch && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3 top-3.5" />
                    )}
                  </div>
                  {touchedConfirm && !passwordsMatch && (
                    <p className="text-xs text-rose font-semibold mt-1">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-brandDark text-white font-extrabold text-sm hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Redirect to Sign In */}
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-textSec font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
