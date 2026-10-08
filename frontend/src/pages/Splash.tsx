import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Splash() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        await checkAuth();
      } catch (_) {}
      setTimeout(() => {
        if (useAuthStore.getState().user) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }, 2000);
    };
    init();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(160deg, #123B24 0%, #185C2B 55%, #1F7A36 100%)' }}
    >
      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6BCB45]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#A7D96A]/8 rounded-full blur-[80px]" />
      </div>

      {/* Floating leaves */}
      <span className="absolute top-[20%] left-[15%] text-3xl animate-float-1 opacity-25 pointer-events-none">🌿</span>
      <span className="absolute top-[35%] right-[12%] text-2xl animate-float-2 opacity-20 pointer-events-none">🍃</span>
      <span className="absolute bottom-[25%] left-[20%] text-2xl animate-float-3 opacity-20 pointer-events-none">🌾</span>

      {/* Center brand presentation */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative"
        >
          <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-farm-xl">
            <span className="text-6xl">🌱</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-2"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            AgriNex <span className="text-[#6BCB45]">AI</span>
          </h1>
          <p className="text-[#A7D96A] text-xs font-bold tracking-widest uppercase">
            Intelligence for Every Acre
          </p>
        </motion.div>

        {/* Typing indicator dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#6BCB45] animate-typing-1" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#6BCB45] animate-typing-2" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#6BCB45] animate-typing-3" />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 text-white/40 text-xs font-medium"
      >
        &copy; {new Date().getFullYear()} AgriNex AI • Agricultural Intelligence
      </motion.p>
    </div>
  );
}
