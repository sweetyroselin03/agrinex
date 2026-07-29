import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Pin, VolumeX, Check, CheckCheck } from 'lucide-react';
import type { Conversation } from '../../store/useChatStore';

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  currentUserId?: number;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isActive,
  onSelect,
  currentUserId,
}) => {
  const other = conversation.other_participant;
  const displayName = other?.full_name || other?.username || 'Farmer User';
  const avatar = other?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=16A34A&color=fff`;

  const lastMessage = conversation.last_message;
  let formattedTime = '';
  if (lastMessage?.created_at) {
    const d = new Date(lastMessage.created_at);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      formattedTime = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  const isLastMsgFromMe = lastMessage?.sender_id === currentUserId;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-selected={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex items-center gap-3.5 p-3.5 rounded-[18px] transition-all duration-200 cursor-pointer border ${
        isActive
          ? 'bg-[#F0FDF4] border-[#16A34A] shadow-md shadow-emerald-600/10'
          : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Active Selection Green Accent Strip */}
      {isActive && (
        <span className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-[#16A34A] rounded-r-full" />
      )}

      {/* Avatar Container with Online Indicator */}
      <div className="relative flex-shrink-0">
        <img
          src={avatar}
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
        />
        {other?.is_online && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top Row: Name & Timestamp */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className={`font-bold text-sm truncate ${isActive ? 'text-emerald-950' : 'text-slate-900'}`}>
              {displayName}
            </h3>
            {other?.is_verified && (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            )}
            {conversation.is_pinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 ml-1" />}
            {conversation.is_muted && <VolumeX className="w-3 h-3 text-slate-400 flex-shrink-0 ml-1" />}
          </div>
          {formattedTime && (
            <span className={`text-[11px] font-medium flex-shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
              {formattedTime}
            </span>
          )}
        </div>

        {/* Bottom Row: Message snippet & Unread count */}
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate flex items-center gap-1 font-sans ${
            isActive ? 'text-emerald-800/90 font-medium' : 'text-slate-500'
          }`}>
            {isLastMsgFromMe && (
              <span className="text-slate-400">
                {lastMessage?.status === 'seen' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-600 inline" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                )}
              </span>
            )}
            <span>
              {lastMessage?.content
                ? lastMessage.content
                : lastMessage?.attachments?.length
                ? '📷 Photo'
                : 'No messages yet'}
            </span>
          </p>

          {conversation.unread_count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#16A34A] text-white font-bold text-[11px] shadow-sm flex-shrink-0 animate-pulse">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationCard;
