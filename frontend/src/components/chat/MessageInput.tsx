import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Loader2,
  CornerDownRight,
  Ban,
} from 'lucide-react';
import type { Message } from '../../store/useChatStore';

interface MessageInputProps {
  onSendMessage: (text: string, imageFile?: File | null) => Promise<void>;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onTyping?: () => void;
  isSending?: boolean;
  isBlocked?: boolean;
  blockBannerMessage?: string | null;
}

const POPULAR_EMOJIS = ['😊', '😂', '👍', '🌾', '🌱', '🚜', '❤️', '🔥', '👏', '🙏', '⚡', '💯'];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyToMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onTyping,
  isSending = false,
  isBlocked = false,
  blockBannerMessage,
}) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Sync text if editing
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
    }
  }, [editingMessage]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked || (!text.trim() && !selectedFile) || isSending) return;

    try {
      await onSendMessage(text.trim(), selectedFile);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      clearSelectedFile();
      setShowEmojiPicker(false);
    } catch (err) {
      // Handled by parent
    }
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  if (isBlocked) {
    return (
      <div className="px-5 py-4 bg-rose-50 border-t border-rose-200 flex items-center justify-center gap-2.5 text-rose-700 text-xs sm:text-sm font-semibold z-30 shadow-inner">
        <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
        <span>{blockBannerMessage || 'You cannot message this user.'}</span>
      </div>
    );
  }

  return (
    <div className="relative px-4 py-3 bg-white border-t border-slate-200 z-30 font-sans shadow-sm">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            ref={emojiPickerRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-16 left-4 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl z-40 max-w-xs grid grid-cols-6 gap-1.5"
          >
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="p-2 text-lg hover:bg-slate-100 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Banner */}
      {replyToMessage && (
        <div className="mb-2.5 p-2.5 rounded-xl bg-emerald-50 border-l-4 border-[#16A34A] flex items-center justify-between text-xs text-slate-800 shadow-sm">
          <div className="flex items-center gap-2 truncate">
            <CornerDownRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-emerald-900">
              Replying to {replyToMessage.sender_name || 'User'}:
            </span>
            <span className="truncate text-slate-600">{replyToMessage.content || '[Attachment]'}</span>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 rounded-full hover:bg-emerald-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Editing Banner */}
      {editingMessage && (
        <div className="mb-2.5 p-2.5 rounded-xl bg-cyan-50 border-l-4 border-cyan-600 flex items-center justify-between text-xs text-slate-800 shadow-sm">
          <span className="font-bold text-cyan-900">Editing Message</span>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-1 rounded-full hover:bg-cyan-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Image Preview Thumbnail before sending */}
      {imagePreview && (
        <div className="mb-2.5 relative inline-block group">
          <img
            src={imagePreview}
            alt="Selected attachment preview"
            className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-600 shadow-md"
          />
          <button
            type="button"
            onClick={clearSelectedFile}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-lg hover:bg-rose-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors shrink-0 mb-0.5"
          title="Attach Image"
          aria-label="Attach Image"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-amber-500 transition-colors shrink-0 mb-0.5"
          title="Add Emoji"
          aria-label="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={editingMessage ? 'Edit message...' : 'Write a message...'}
          className="flex-1 px-4 py-2.5 rounded-[20px] bg-[#F1F5F9] border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:bg-white focus:ring-1 focus:ring-[#16A34A] transition-all resize-none max-h-32 min-h-[42px] leading-relaxed font-sans"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isSending}
          className={`p-3 rounded-full font-bold transition-all shadow-sm flex items-center justify-center shrink-0 mb-0.5 ${
            (!text.trim() && !selectedFile) || isSending
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#16A34A] hover:bg-[#22C55E] text-white shadow-emerald-600/20 hover:scale-105 active:scale-95'
          }`}
          title="Send Message"
          aria-label="Send Message"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
