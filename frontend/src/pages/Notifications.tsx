import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  Heart,
  MessageSquare,
  AlertTriangle,
  Info,
  Clock,
  MailOpen,
  UserPlus,
  CloudRain,
  Sparkles,
  Leaf,
  Microscope
} from 'lucide-react';
import api from '../api/client';
import { useSocialStore } from '../store/useSocialStore';

const getNotifConfig = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'FOLLOW':
      return { icon: <UserPlus className="w-3.5 h-3.5" />, bg: 'bg-[#EEF3E8]', color: 'text-[#185C2B]', category: 'Community' };
    case 'LIKE':
      return { icon: <Heart className="w-3.5 h-3.5" />, bg: 'bg-red-50', color: 'text-red-500', category: 'Community' };
    case 'COMMENT':
      return { icon: <MessageSquare className="w-3.5 h-3.5" />, bg: 'bg-blue-50', color: 'text-blue-600', category: 'Community' };
    case 'DISEASE':
    case 'ALERT':
    case 'OUTBREAK':
      return { icon: <AlertTriangle className="w-3.5 h-3.5" />, bg: 'bg-amber-50', color: 'text-amber-700', category: 'Disease' };
    case 'WEATHER':
      return { icon: <CloudRain className="w-3.5 h-3.5" />, bg: 'bg-sky-50', color: 'text-sky-600', category: 'Weather' };
    case 'AI_TIP':
    case 'TIP':
      return { icon: <Sparkles className="w-3.5 h-3.5" />, bg: 'bg-emerald-50', color: 'text-emerald-700', category: 'AI Tip' };
    default:
      return { icon: <Bell className="w-3.5 h-3.5" />, bg: 'bg-[#EEF3E8]', color: 'text-[#123B24]', category: 'Community' };
  }
};

const filterCategories = [
  { id: 'all', label: 'All Notifications' },
  { id: 'disease', label: 'Disease' },
  { id: 'weather', label: 'Weather' },
  { id: 'community', label: 'Community' },
  { id: 'ai_tip', label: 'AI Tip' },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { fetchUnreadCount } = useSocialStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'disease' | 'weather' | 'community' | 'ai_tip'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
      fetchUnreadCount();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      fetchUnreadCount();
    } catch {
      alert('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOneRead = async (notifId: number) => {
    try {
      await api.post(`/notifications/${notifId}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      fetchUnreadCount();
    } catch {}
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notification history?')) return;
    setActionLoading(true);
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      fetchUnreadCount();
    } catch {
      alert('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read) handleMarkOneRead(n.id);
    if (n.type === 'FOLLOW') {
      if (n.actor_id) navigate(`/profile/${n.actor_id}`);
    } else if (n.type === 'LIKE' || n.type === 'COMMENT') {
      navigate('/community');
    } else if (n.type === 'DISEASE' || n.type === 'ALERT') {
      navigate('/scan');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    const config = getNotifConfig(n.type);
    if (filter === 'disease') return config.category === 'Disease';
    if (filter === 'weather') return config.category === 'Weather';
    if (filter === 'community') return config.category === 'Community';
    if (filter === 'ai_tip') return config.category === 'AI Tip';
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 font-sans">
      {/* ─── HEADER ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="farm-card p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF3E8] flex items-center justify-center text-[#185C2B] shadow-farm-sm">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#123B24] flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                    {unreadCount} New
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#546E7A] font-medium mt-0.5">
                Disease alerts, weather updates, community mentions, and agronomy tips
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={actionLoading || unreadCount === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EEF3E8] text-[#185C2B] text-xs font-bold hover:bg-[#EEF3E8] transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark Read</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Categories: Disease | Weather | Community | AI Tip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {filterCategories.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-[#123B24] text-white shadow-farm-sm'
                  : 'text-[#546E7A] hover:bg-[#F5F7EF] border border-[#EEF3E8]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── NOTIFICATIONS LIST WITH SLIDE-IN ANIMATION ─── */}
      <div className="farm-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-[#546E7A]">
            <Loader2 className="w-7 h-7 animate-spin text-[#185C2B]" />
            <p className="text-xs font-medium">Loading notification stream...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center space-y-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#EEF3E8] flex items-center justify-center text-2xl">
              🌾
            </div>
            <div>
              <h3 className="font-black text-[#123B24] text-base">All Caught Up!</h3>
              <p className="text-[#546E7A] text-xs mt-1">No alerts found in this category.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF3E8]">
            {filteredNotifications.map((n, i) => {
              const config = getNotifConfig(n.type);
              const dateStr = new Date(n.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <motion.div
                  key={n.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  onClick={() => handleNotifClick(n)}
                  className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all ${
                    n.is_read
                      ? 'bg-white hover:bg-[#F5F7EF]/60'
                      : 'bg-[#F5F7EF] hover:bg-[#EEF3E8] border-l-4 border-l-[#185C2B]'
                  }`}
                >
                  {/* Icon Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        n.actor_avatar ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${n.actor_name || n.id}`
                      }
                      alt="actor"
                      className="w-11 h-11 rounded-full border-2 border-[#EEF3E8] object-cover bg-white"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${config.bg} ${config.color}`}
                    >
                      {config.icon}
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#EEF3E8] text-[#185C2B] text-[10px] font-bold">
                        {config.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#1A2E1A] font-medium leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-[#546E7A] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#546E7A]" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  {/* Unread indicator */}
                  {!n.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#185C2B] shrink-0 mt-2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
