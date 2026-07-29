import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  UserMinus
} from 'lucide-react';
import api from '../api/client';
import { useSocialStore } from '../store/useSocialStore';

export default function Notifications() {
  const navigate = useNavigate();
  const { fetchUnreadCount } = useSocialStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'follows' | 'alerts'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const data = res.data || [];
      setNotifications(data);
      const unread = data.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
      fetchUnreadCount();
    } catch (e) {
      console.warn('Failed to load notifications feed');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      fetchUnreadCount();
    } catch (e) {
      alert('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOneRead = async (notifId: number) => {
    try {
      await api.post(`/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      fetchUnreadCount();
    } catch (e) {}
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notification history?')) return;
    setActionLoading(true);
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      fetchUnreadCount();
    } catch (e) {
      alert('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read) {
      handleMarkOneRead(n.id);
    }
    if (n.type === 'FOLLOW' || n.type === 'UNFOLLOW') {
      if (n.actor_id) {
        navigate(`/profile/${n.actor_id}`);
      }
    } else if (n.type === 'LIKE' || n.type === 'COMMENT') {
      navigate('/community');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus className="w-3.5 h-3.5 text-primary" />;
      case 'UNFOLLOW':
        return <UserMinus className="w-3.5 h-3.5 text-rose" />;
      case 'LIKE':
        return <Heart className="w-3.5 h-3.5 text-rose fill-rose/10" />;
      case 'COMMENT':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
      case 'OUTBREAK':
      case 'ALERT':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'follows') return n.type === 'FOLLOW' || n.type === 'UNFOLLOW';
    if (filter === 'alerts') return n.type === 'ALERT' || n.type === 'OUTBREAK';
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans selection:bg-brandLight selection:text-brandDark">
      
      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-brandDark tracking-tight flex items-center gap-2">
            Notification Center
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose text-white text-[10px] font-black leading-none animate-pulse">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-textSec text-xs">Monitor followers, likes, comments, and regional agricultural alerts.</p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading || unreadCount === 0}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-textSec flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Mark Read
            </button>
            <button
              onClick={handleClearAll}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl border border-rose/20 text-rose hover:bg-rose/5 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'follows', label: 'Followers' },
          { id: 'alerts', label: 'Pest & Alerts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab.id
                ? 'bg-brandDark text-white shadow-sm'
                : 'text-textSec hover:text-brandDark hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications list feed */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-textSec text-xs flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-24 text-center text-textSec text-xs space-y-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <MailOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-brandDark text-sm">All Caught Up!</h3>
              <p className="text-textSec text-[11px] mt-1">No notification activity matches your active filter.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n) => {
              const dateStr = new Date(n.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-all cursor-pointer ${
                    n.is_read ? 'bg-white opacity-70 hover:opacity-100' : 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary'
                  }`}
                >
                  {/* Actor Avatar / Icon badge */}
                  <div className="relative shrink-0">
                    <img
                      src={n.actor_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${n.actor_name || n.id}`}
                      alt="actor avatar"
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover bg-white"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      {getNotifIcon(n.type)}
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="flex-1 space-y-1 min-w-0 text-xs">
                    <p className="text-brandDark font-medium leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-textSec font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {dateStr}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2 shadow-xs" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
