import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSocialStore } from '../store/useSocialStore';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useSocialStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchUnreadCount();
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', emoji: '🌾' },
    { path: '/messages', label: 'Direct Messages', emoji: '💬' },
    { path: '/scan', label: 'AI Crop Diagnostic', emoji: '🔬' },
    { path: '/chat', label: 'AgriGPT Chatbot', emoji: '🤖' },
    { path: '/community', label: 'Community Feed', emoji: '🌱' },
    { path: '/profile', label: 'My Profile', emoji: '👤' },
    { path: '/notifications', label: 'Notifications', emoji: '🔔' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F1F8E9] flex flex-col md:flex-row text-[#1A2E1A]">

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside 
        className="hidden md:flex flex-col w-72 shrink-0 sticky top-0 h-screen z-20 text-white shadow-[4px_0_24px_rgba(27,94,32,0.18)]"
        style={{
          background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)'
        }}
      >
        {/* Logo Section with Rotating Leaf */}
        <div className="h-24 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
            <span className="text-2xl inline-block animate-spin-slow">🌿</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              AgriNex <span className="text-[#F9A825] font-extrabold text-sm px-1.5 py-0.5 rounded bg-black/20">PRO</span>
            </h1>
            <p className="text-[11px] text-green-100/80 font-medium tracking-wide">Agricultural AI Ecosystem</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white border-l-4 border-[#F9A825] shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md'
                    : 'text-green-100 hover:text-white hover:bg-white/10 hover:translate-x-1'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-lg transition-transform group-hover:scale-125">{item.emoji}</span>
                  <span className="tracking-wide">{item.label}</span>
                </div>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F9A825] text-[#1A2E1A] text-[11px] font-black leading-none animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile / Online Indicator / Logout */}
        <div className="p-4 border-t border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-2xl bg-white/10 border border-white/10">
            <div className="relative">
              <img
                src={user?.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'farmer'}`}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-white/60 object-cover bg-white"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#66BB6A] border-2 border-[#1B5E20] rounded-full ring-1 ring-white/50"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#66BB6A] animate-ping"></span>
                <p className="text-[10px] font-bold text-green-200 uppercase tracking-widest leading-none">Online</p>
              </div>
              <h4 className="text-sm font-bold text-white truncate mt-1">{user?.full_name || user?.username || 'Farmer'}</h4>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-100 hover:text-white border border-red-400/30 text-xs font-bold transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MOBILE HEADER & MOBILE NAV ─── */}
      <header className="md:hidden h-16 flex items-center justify-between px-6 bg-[#1B5E20] text-white sticky top-0 z-30 shadow-md">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl animate-spin-slow">🌿</span>
          <span className="text-lg font-black tracking-tight text-white">AgriNex <span className="text-[#F9A825]">AI</span></span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white hover:bg-white/10 rounded-xl transition-all"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Slide-over Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-72 flex flex-col p-6 shadow-2xl text-white"
              style={{
                background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-6 border-b border-white/15 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌿</span>
                  <span className="font-bold text-lg text-white">AgriNex</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white/80 hover:text-white rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-white/25 text-white border-l-4 border-[#F9A825]'
                          : 'text-green-100 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-6 border-t border-white/15 mt-auto">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600/30 text-white font-bold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT VIEWPORT WITH ROUTE FADE ANIMATION ─── */}
      <main className="flex-1 min-w-0 overflow-y-auto relative">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
