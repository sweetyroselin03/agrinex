import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MoreVertical,
  Pin,
  VolumeX,
  Archive,
  UserX,
  UserCheck,
  CheckCircle,
} from 'lucide-react';
import type { ConversationParticipant } from '../../store/useChatStore';

interface ChatHeaderProps {
  participant?: ConversationParticipant;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isBlockedByMe?: boolean;
  onBack?: () => void;
  onPin?: () => void;
  onMute?: () => void;
  onArchive?: () => void;
  onBlockClick?: () => void;
  onUnblockClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  participant,
  isPinned,
  isMuted,
  isArchived,
  isBlockedByMe = false,
  onBack,
  onPin,
  onMute,
  onArchive,
  onBlockClick,
  onUnblockClick,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = participant?.full_name || participant?.username || 'Farmer User';
  const avatar = participant?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=16A34A&color=fff`;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between z-30 shadow-sm font-sans">
      {/* Left: Back Button + Avatar & Info */}
      <div className="flex items-center gap-3.5 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Back to conversations"
            title="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* User Avatar with Online Dot */}
        <div className="relative flex-shrink-0">
          <img
            src={avatar}
            alt={displayName}
            className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/20 shadow-sm"
          />
          {participant?.is_online && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
          )}
        </div>

        {/* User Details */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-slate-900 text-base truncate max-w-[200px] sm:max-w-xs">
              {displayName}
            </h2>
            {participant?.is_verified && (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {participant?.is_online ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Now
              </span>
            ) : (
              <span className="text-slate-400 font-medium">Offline</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Modern Options Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
          aria-label="Conversation Options Menu"
          title="Conversation Options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {/* Floating White Card Menu */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-12 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-40 text-xs font-sans"
              onClick={() => setShowDropdown(false)}
            >
              {onPin && (
                <button
                  onClick={onPin}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors"
                >
                  <Pin className="w-4 h-4 text-amber-500" />
                  <span>{isPinned ? 'Unpin Conversation' : 'Pin Conversation'}</span>
                </button>
              )}

              {onMute && (
                <button
                  onClick={onMute}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors"
                >
                  <VolumeX className="w-4 h-4 text-cyan-600" />
                  <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                </button>
              )}

              {onArchive && (
                <button
                  onClick={onArchive}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors"
                >
                  <Archive className="w-4 h-4 text-purple-600" />
                  <span>{isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                </button>
              )}

              <div className="my-1 border-t border-slate-100" />

              {isBlockedByMe ? (
                onUnblockClick && (
                  <button
                    onClick={onUnblockClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-emerald-600 hover:bg-emerald-50 font-semibold transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Unblock User</span>
                  </button>
                )
              ) : (
                onBlockClick && (
                  <button
                    onClick={onBlockClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                  >
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>Block User</span>
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default ChatHeader;
