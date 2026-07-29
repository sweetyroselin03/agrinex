import { useState } from 'react';
import { UserPlus, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocialStore } from '../store/useSocialStore';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowButtonProps {
  userId: number;
  userName?: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FollowButton({
  userId,
  userName = 'this farmer',
  initialIsFollowing = false,
  initialFollowersCount = 0,
  onFollowChange,
  size = 'md',
  className = '',
}: FollowButtonProps) {
  const queryClient = useQueryClient();
  const { toggleFollowUser } = useSocialStore();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    if (isFollowing) {
      // Ask confirmation to unfollow
      setShowConfirm(true);
    } else {
      // Perform follow directly
      handleToggle();
    }
  };

  const handleToggle = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      const res = await toggleFollowUser(userId, isFollowing);
      setIsFollowing(res.isFollowing);
      setFollowersCount(res.followersCount);
      if (onFollowChange) {
        onFollowChange(res.isFollowing, res.followersCount);
      }
      // Invalidate queries so community feed, profile, suggested farmers update immediately
      queryClient.invalidateQueries({ queryKey: ['user_profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['suggested_users'] });
      queryClient.invalidateQueries({ queryKey: ['search_users'] });
      queryClient.invalidateQueries({ queryKey: ['user_followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['user_following'] });
    } catch (err: any) {
      console.error('Failed to toggle follow state', err);
      if (err?.response?.status === 403) {
        alert(err?.response?.data?.detail || 'Cannot follow this user due to block settings.');
      }
    } finally {
      setIsLoading(false);
    }

  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-xs rounded-xl gap-2 font-bold',
    lg: 'px-6 py-2.5 text-sm rounded-xl gap-2 font-extrabold',
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center justify-center transition-all duration-200 select-none shadow-sm ${sizeClasses[size]} ${
          isFollowing
            ? 'bg-slate-100 text-slate-700 hover:bg-rose/10 hover:text-rose hover:border-rose/20 border border-slate-200'
            : 'bg-primary text-brandDark hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 border border-primary'
        } ${isLoading ? 'opacity-80 cursor-wait' : ''} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 text-brandDark shrink-0" />
            <span>Follow</span>
          </>
        )}
      </button>

      {/* Confirmation Modal for Unfollow */}
      <AnimatePresence>
        {showConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-brandDark/50 backdrop-blur-xs p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose/10 text-rose flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brandDark">Unfollow Farmer?</h3>
                <p className="text-xs text-textSec mt-1">
                  Are you sure you want to stop following <span className="font-bold text-brandDark">{userName}</span>? You won't see their updates in your personal feed.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggle}
                  className="flex-1 py-2.5 rounded-xl bg-rose text-white text-xs font-bold hover:bg-rose/90 shadow-md shadow-rose/20 transition-all"
                >
                  Unfollow
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
