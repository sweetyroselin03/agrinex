import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Leaf,
  MessageSquare,
  Users,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  Send
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
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/messages', label: 'Direct Messages', icon: Send },
    { path: '/scan', label: 'AI Crop Diagnostic', icon: Leaf },
    { path: '/chat', label: 'AgriGPT Chatbot', icon: MessageSquare },
    { path: '/community', label: 'Community Feed', icon: Users },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bgMain flex flex-col md:flex-row text-textMain">

      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-borderDark shrink-0 sticky top-0 h-screen z-20">
        {/* Logo Section */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-borderDark">
          <div className="w-10 h-10 rounded-xl bg-brandLight flex items-center justify-center border border-primary/20 shadow-sm relative overflow-hidden group">
            <span className="text-xl group-hover:scale-110 transition-transform">🌱</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-brandDark">AgriNex <span className="text-primary">AI</span></h1>
            <p className="text-[10px] text-textSec font-semibold uppercase tracking-widest leading-none">Enterprise OS</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-brandLight text-brandDark shadow-[0_2px_10px_rgba(0,217,139,0.08)] border-l-4 border-primary'
                    : 'text-textSec hover:text-brandDark hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-textSec group-hover:text-brandDark'}`} />
                  <span>{item.label}</span>
                </div>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose text-white text-[10px] font-black leading-none animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile / Logout */}
        <div className="p-4 border-t border-borderDark bg-slate-50/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <img
              src={user?.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'default'}`}
              alt="avatar"
              className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-textSec uppercase tracking-wider leading-none">Logged in as</p>
              <h4 className="text-sm font-bold text-brandDark truncate mt-0.5">{user?.full_name || 'Farmer'}</h4>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose/20 text-rose hover:bg-rose/5 text-sm font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MOBILE HEADER & MOBILE NAV ─── */}
      <header className="md:hidden h-16 flex items-center justify-between px-6 bg-white border-b border-borderDark sticky top-0 z-30 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="text-md font-bold tracking-tight text-brandDark">AgriNex <span className="text-primary">AI</span></span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-brandDark hover:bg-slate-100 rounded-lg transition-all"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Slide-over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-brandDark/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-6 border-b border-borderDark mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌱</span>
                <span className="font-bold text-brandDark">AgriNex Menu</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-textSec hover:text-brandDark rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
                        ? 'bg-brandLight text-brandDark border-l-4 border-primary'
                        : 'text-textSec hover:text-brandDark hover:bg-slate-50'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-textSec'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-borderDark pt-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={user?.profile_picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'default'}`}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white"
                />
                <div>
                  <h4 className="text-sm font-bold text-brandDark">{user?.full_name || 'Farmer'}</h4>
                  <p className="text-xs text-textSec truncate max-w-[150px]">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose/20 text-rose hover:bg-rose/5 text-sm font-bold transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── MAIN CONTENT WINDOW ─── */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 py-8 px-4 md:px-10 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-borderDark flex justify-around items-center py-2 px-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition-all duration-200 ${isActive ? 'text-primary' : 'text-textSec'
                }`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] font-bold mt-1 tracking-wide">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
