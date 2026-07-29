import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Splash() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0); // 0: Seed, 1: Sprout, 2: Leaf, 3: Healthy Plant

  useEffect(() => {
    // Stage progression over 3 seconds
    const timer1 = setTimeout(() => setStage(1), 700);
    const timer2 = setTimeout(() => setStage(2), 1400);
    const timer3 = setTimeout(() => setStage(3), 2100);

    const runFlow = async () => {
      try {
        await checkAuth();
      } catch (_) {}

      setTimeout(() => {
        const onboardingCompleted = localStorage.getItem('agrinex_onboarding_completed') === 'true';
        if (onboardingCompleted) {
          const isAuthed = useAuthStore.getState().isAuthenticated;
          if (isAuthed) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/welcome', { replace: true });
          }
        } else {
          navigate('/onboarding', { replace: true });
        }
      }, 3000); // 3 seconds total
    };

    runFlow();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [navigate, checkAuth]);

  const stages = [
    { label: 'Germinating Seed', icon: '🌰', color: 'from-amber-600 to-emerald-600' },
    { label: 'Sprouting Stem', icon: '🌱', color: 'from-emerald-500 to-teal-500' },
    { label: 'Unfurling Leaves', icon: '🌿', color: 'from-emerald-400 to-cyan-500' },
    { label: 'Healthy Plant', icon: '🪴', color: 'from-emerald-300 to-green-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none"
    >
      {/* Background Radial Glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="absolute w-[450px] h-[450px] bg-emerald-500 rounded-full blur-[140px] pointer-events-none"
      />

      {/* Floating Light Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200,
              opacity: 0.2,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [0, -100],
              opacity: [0.2, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-emerald-400 blur-xs"
          />
        ))}
      </div>

      <div className="text-center z-10 flex flex-col items-center px-4 max-w-md w-full space-y-6">
        
        {/* Animated Plant Stages Icon Container */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          className="w-32 h-32 rounded-3xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative backdrop-blur-xl overflow-hidden"
        >
          {/* Outer Glowing Pulsing Ring */}
          <div className="absolute inset-0 rounded-3xl border border-emerald-400/40 animate-ping opacity-30 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.span
              key={stage}
              initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
              animate={{ scale: 1.1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.4, opacity: 0, rotate: 20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-6xl drop-shadow-[0_4px_20px_rgba(16,185,129,0.5)]"
            >
              {stages[stage].icon}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Brand Name & Dynamic Growth Subtitle */}
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-black tracking-tight"
          >
            AgriNex{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              AI
            </span>
          </motion.h1>

          <AnimatePresence mode="wait">
            <motion.p
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-xs sm:text-sm font-bold tracking-wider text-emerald-400 uppercase"
            >
              {stages[stage].label}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* 4-Stage Progress Line */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
            initial={{ width: '15%' }}
            animate={{ width: `${((stage + 1) / 4) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Footer Version */}
      <div className="absolute bottom-8 text-center opacity-40">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase">AgriNex AI Enterprise Platform v1.0</p>
      </div>
    </motion.div>
  );
}
