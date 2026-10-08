import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Microscope,
  Bot,
  Users,
  MessageSquare,
  UserCircle,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSocialStore } from '../store/useSocialStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, emoji: '🌾' },
  { path: '/messages', label: 'Direct Messages', icon: MessageSquare, emoji: '💬' },
  { path: '/scan', label: 'AI Crop Diagnostic', icon: Microscope, emoji: '🔬' },
  { path: '/chat', label: 'AgriGPT', icon: Bot, emoji: '🤖' },
  { path: '/community', label: 'Community', icon: Users, emoji: '🌱' },
  { path: '/profile', label: 'My Profile', icon: UserCircle, emoji: '👤' },
  { path: '/notifications', label: 'Notifications', icon: Bell, emoji: '🔔' },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useSocialStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchUnreadCount();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarSrc =
    user?.profile_picture ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.email || 'farmer')}`;

  return (
    <div className="min-h-screen bg-[#F5F7EF] flex flex-col md:flex-row text-[#1A2E1A] font-sans">
      {/* ═══════════════════════════════
          DESKTOP SIDEBAR
      ═══════════════════════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 270 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen z-20 overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #123B24 0%, #185C2B 100%)' }}
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#6BCB45]/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-16 left-0 w-36 h-36 bg-[#F9A825]/10 rounded-full blur-[50px] pointer-events-none" />

        {/* Logo & Collapse Header */}
        <div
          className={`h-20 flex items-center border-b border-white/10 relative z-10 ${
            collapsed ? 'justify-center px-3' : 'gap-3 px-5'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0 shadow-sm">
            <span className="text-xl">🌱</span>
          </div>

          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <h1 className="text-base font-black text-white leading-tight">
                AgriNex <span className="text-[#6BCB45]">AI</span>
              </h1>
              <p className="text-[10px] text-[#A7D96A] font-medium tracking-wide">
                Intelligence for Every Acre
              </p>
            </motion.div>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="ml-auto w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand Trigger when Collapsed */}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="absolute top-6 right-0 translate-x-1/2 w-6 h-6 bg-[#185C2B] border border-white/30 rounded-full flex items-center justify-center text-white z-30 shadow-md hover:bg-[#1F7A36] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto no-scrollbar relative z-10">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3.5 rounded-2xl text-xs font-bold transition-all duration-200 relative ${
                  collapsed ? 'justify-center p-3' : 'px-4 py-3'
                } ${
                  isActive
                    ? 'bg-white/20 text-white border-l-4 border-l-[#F9A825] shadow-glow-gold'
                    : 'text-white/80 hover:text-white hover:bg-white/10 hover:translate-x-1'
                }`}
              >
                <span className="text-base shrink-0">{item.emoji}</span>
                {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span
                    className={`text-[9px] font-black rounded-full bg-[#F9A825] text-[#123B24] leading-none ${
                      collapsed
                        ? 'absolute top-1 right-1 w-4 h-4 flex items-center justify-center'
                        : 'ml-auto px-1.5 py-0.5'
                    }`}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-white/10 relative z-10 space-y-2">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/10 border border-white/10">
              <div className="relative shrink-0">
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-9 h-9 rounded-full border-2 border-white/40 object-cover bg-white"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#6BCB45] border-2 border-[#123B24] rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6BCB45] animate-ping" />
                  <p className="text-[9px] font-bold text-[#A7D96A] uppercase tracking-widest leading-none">
                    Online
                  </p>
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-0.5">
                  {user?.full_name || user?.username || 'Farmer'}
                </h4>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-9 h-9 rounded-full border-2 border-white/40 object-cover bg-white"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#6BCB45] border-2 border-[#123B24] rounded-full" />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/20 text-xs font-bold transition-all cursor-pointer ${
              collapsed ? 'justify-center p-3' : 'px-4 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ═══════════════════════════════
          MOBILE TOP HEADER
      ═══════════════════════════════ */}
      <header
        className="md:hidden h-16 flex items-center justify-between px-5 sticky top-0 z-30 shadow-farm-md text-white"
        style={{ background: 'linear-gradient(90deg, #123B24 0%, #185C2B 100%)' }}
      >
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <span className="text-lg">🌱</span>
          </div>
          <span className="text-base font-black tracking-tight">
            AgriNex <span className="text-[#6BCB45]">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Link to="/notifications" className="relative p-2">
              <Bell className="w-5 h-5 text-white/90" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#F9A825] text-[#123B24] text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-72 flex flex-col overflow-hidden shadow-2xl text-white"
              style={{ background: 'linear-gradient(180deg, #123B24 0%, #185C2B 100%)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="w-9 h-9 rounded-full border-2 border-white/40 object-cover bg-white"
                  />
                  <div>
                    <p className="text-white text-xs font-bold">{user?.full_name || user?.username || 'Farmer'}</p>
                    <p className="text-[#A7D96A] text-[10px]">AgriNex Member</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-white/60 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-white/20 text-white border-l-4 border-l-[#F9A825]'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{item.emoji}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.path === '/notifications' && unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#F9A825] text-[#123B24] text-[10px] font-black">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/35 text-white font-bold text-xs border border-red-400/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════
          MOBILE BOTTOM BAR
      ═══════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-[#EEF3E8] shadow-farm-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-[#185C2B]' : 'text-[#546E7A]'
                }`}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all text-sm ${
                    isActive ? 'bg-[#EEF3E8]' : ''
                  }`}
                >
                  <span>{item.emoji}</span>
                </div>
                <span className={`text-[9px] font-bold ${isActive ? 'text-[#185C2B]' : 'text-[#546E7A]'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════
          MAIN CONTENT VIEWPORT
      ═══════════════════════════════ */}
      <main className="flex-1 min-w-0 overflow-y-auto relative pb-16 md:pb-0">
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
