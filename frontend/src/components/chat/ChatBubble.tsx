import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Reply, Trash2, Edit3, Smile } from 'lucide-react';
import type { Message } from '../../store/useChatStore';
import ImageMessage from './ImageMessage';

interface ChatBubbleProps {
  message: Message;
  currentUserId: number;
  onOpenImage: (imageUrl: string) => void;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: number, deleteType: 'for_me' | 'everyone') => void;
  onToggleReaction?: (messageId: number, emoji: string) => void;
}

const COMMON_EMOJIS = ['❤️', '👍', '🌾', '🔥', '😂', '👏'];

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  currentUserId,
  onOpenImage,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
}) => {
  const isMe = message.sender_id === currentUserId;
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative flex flex-col my-2 max-w-[85%] sm:max-w-[70%] transition-all ${
        isMe ? 'ml-auto items-end' : 'mr-auto items-start'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Quick Floating Actions Bar on Hover */}
      <AnimatePresence>
        {showActions && !message.is_deleted_everyone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            className={`absolute -top-4 z-20 flex items-center gap-1 p-1 rounded-full bg-white border border-slate-200 shadow-lg backdrop-blur-md transition-all ${
              isMe ? 'right-2' : 'left-2'
            }`}
          >
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-amber-500 transition-colors"
              title="React with Emoji"
              aria-label="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors"
                title="Reply"
                aria-label="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}
            {isMe && onEdit && !message.attachments?.length && (
              <button
                onClick={() => onEdit(message)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-colors"
                title="Edit"
                aria-label="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(message.id, isMe ? 'everyone' : 'for_me')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Emoji Quick Picker Popover */}
            {showEmojiPicker && (
              <div className="absolute top-8 left-0 z-30 flex items-center gap-1 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xl backdrop-blur-xl">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (onToggleReaction) onToggleReaction(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 hover:scale-125 transition-transform text-base rounded-lg hover:bg-slate-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Message Bubble Container */}
      <div
        className={`relative p-3.5 sm:p-4 shadow-sm transition-all ${
          isMe
            ? 'bg-[#DCFCE7] text-slate-900 rounded-[20px] rounded-br-sm border border-emerald-200/80'
            : 'bg-[#F1F5F9] text-slate-900 rounded-[20px] rounded-bl-sm border border-slate-200/80'
        }`}
      >
        {/* Reply Context Preview */}
        {message.reply_to_content && (
          <div
            className={`mb-2 p-2 rounded-xl border-l-4 text-xs font-sans ${
              isMe
                ? 'bg-emerald-100/70 border-emerald-600 text-emerald-950'
                : 'bg-white/80 border-slate-400 text-slate-700'
            }`}
          >
            <p className="font-bold text-[11px] opacity-90">{message.reply_to_sender || 'User'}</p>
            <p className="truncate line-clamp-1">{message.reply_to_content}</p>
          </div>
        )}

        {/* Message Deleted Notice */}
        {message.is_deleted_everyone ? (
          <p className="italic text-xs text-slate-500 flex items-center gap-1.5">
            <span>🚫</span> This message was deleted.
          </p>
        ) : (
          <>
            {/* Attachment Images & Audio */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 flex flex-col gap-2">
                {message.attachments.map((att) => (
                  att.file_type === 'audio' ? (
                    <audio
                      key={att.id || att.url}
                      src={att.url}
                      controls
                      className="max-w-[280px] rounded-xl focus:outline-none"
                    />
                  ) : (
                    <ImageMessage
                      key={att.id || att.url}
                      url={att.url}
                      onClick={() => onOpenImage(att.url)}
                    />
                  )
                ))}
              </div>
            )}

            {/* Text Content */}
            {message.content && (
              <p className="text-sm sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap font-sans text-slate-900">
                {message.content}
              </p>
            )}
          </>
        )}

        {/* Time and Status Footer */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] sm:text-[11px] ${
            isMe ? 'text-emerald-800/80 font-medium' : 'text-slate-500'
          }`}
        >
          {message.is_edited && <span className="italic opacity-80">edited</span>}
          <span>{formattedTime}</span>
          {isMe && (
            <span>
              {message.status === 'seen' ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-600" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-700/70" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Reactions Bar Below Bubble */}
      {message.reactions && message.reactions.length > 0 && (
        <div
          className={`flex flex-wrap gap-1 mt-1 z-10 ${
            isMe ? 'justify-end pr-1' : 'justify-start pl-1'
          }`}
        >
          {message.reactions.map((reaction) => (
            <span
              key={reaction.id || reaction.emoji}
              onClick={() => onToggleReaction && onToggleReaction(message.id, reaction.emoji)}
              className="px-2 py-0.5 rounded-full text-xs bg-white border border-slate-200 text-slate-800 shadow-sm cursor-pointer hover:bg-slate-100 transition-colors"
            >
              {reaction.emoji}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ChatBubble;
