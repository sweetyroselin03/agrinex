import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Scan, Bot, Users, TrendingUp, ArrowRight } from 'lucide-react';

const slides = [
  {
    title: 'Scan Crops Instantly',
    desc: 'Point your camera at any crop leaf and get AI-powered disease detection in seconds.',
    icon: Scan,
    iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    title: 'AI Farming Assistant',
    desc: 'Get expert advice on fertilizers, irrigation, pest control, and organic farming in your language.',
    icon: Bot,
    iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    title: 'Community Support',
    desc: 'Connect with farmers worldwide. Share experiences, ask questions, and learn together.',
    icon: Users,
    iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    title: 'Market Intelligence',
    desc: 'Track crop prices, weather forecasts, and get smart insights to maximize your yield and profit.',
    icon: TrendingUp,
    iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('agrinex_onboarding_completed', 'true');
    navigate('/welcome', { replace: true });
  };

  const nextStep = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const IconComponent = slides[step].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 w-full h-full flex flex-col transition-colors duration-500 p-6 md:p-12 justify-between ${
        isDark ? 'bg-[#06131D] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Top Bar */}
      <div className="flex justify-between items-center max-w-3xl w-full mx-auto pt-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-extrabold tracking-tight">AgriNex AI</span>
        </div>
        <button
          onClick={completeOnboarding}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
            isDark
              ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-slate-300'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
        >
          Skip
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg w-full mx-auto py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -15 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center w-full"
          >
            <div
              className={`w-36 h-36 rounded-full flex items-center justify-center mb-8 relative border ${
                isDark ? 'bg-white/5' : 'bg-slate-200/50'
              }`}
            >
              <div
                className={`w-28 h-28 rounded-full flex items-center justify-center border shadow-lg ${slides[step].iconColor}`}
              >
                <IconComponent className="w-12 h-12" strokeWidth={1.8} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold mb-4 leading-tight tracking-tight">
              {slides[step].title}
            </h2>
            <p
              className={`text-base font-medium px-4 leading-relaxed max-w-md ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {slides[step].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="pb-10 flex flex-col items-center gap-6 max-w-md w-full mx-auto">
        {/* Progress dots */}
        <div className="flex gap-2.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-350/40'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={nextStep}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-brandDark font-extrabold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-300"
        >
          {step === slides.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase select-none">
          Screen {step + 1} of {slides.length}
        </p>
      </div>
    </motion.div>
  );
}
