import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronDown,
  UserPlus,
  Lock,
  CheckCircle,
  UserX,
  UserCheck,
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import type { Message } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';

import ChatHeader from '../components/chat/ChatHeader';
import ChatBubble from '../components/chat/ChatBubble';
import MessageInput from '../components/chat/MessageInput';
import ConversationCard from '../components/chat/ConversationCard';
import ImageLightbox from '../components/chat/ImageLightbox';

export const Messages: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    conversations,
    activeConversationId,
    messages,
    typingUsers,
    blockStatusMap,
    isLoadingConversations,
    isLoadingMessages,
    fetchConversations,
    startConversation,
    selectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    pinConversation,
    muteConversation,
    archiveConversation,
    fetchBlockStatus,
    blockUser,
    unblockUser,
    uploadMedia,
    connectWebSocket,
    sendTypingSignal,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');

  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // Lightbox Modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Block confirmation modal states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [isBlockActionLoading, setIsBlockActionLoading] = useState(false);

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize conversations & socket
  useEffect(() => {
    fetchConversations();
    if (user?.id) {
      connectWebSocket(user.id);
    }
  }, [user?.id]);

  // Handle URL target user ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get('userId');
    if (targetUserId) {
      const targetId = parseInt(targetUserId, 10);
      if (!isNaN(targetId)) {
        startConversation(targetId);
      }
    }
  }, [location.search]);

  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const otherUser = activeConversation?.other_participant;

  // Fetch block status whenever active participant changes
  useEffect(() => {
    if (otherUser?.user_id) {
      fetchBlockStatus(otherUser.user_id);
    }
  }, [otherUser?.user_id]);

  const targetBlockStatus = otherUser ? blockStatusMap[otherUser.user_id] : null;
  const isBlockedByMe = targetBlockStatus?.blocked_by_me || false;
  const isBlockedByThem = targetBlockStatus?.blocked_by_them || false;
  const isBlocked = targetBlockStatus?.is_blocked || false;

  let blockBannerMessage: string | null = null;
  if (isBlockedByMe) {
    blockBannerMessage = 'You blocked this user.';
  } else if (isBlockedByThem) {
    blockBannerMessage = 'You have been blocked.';
  }

  // Scroll to bottom on new message or conversation select
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [activeMessages.length, activeConversationId]);

  // Collect all images in current active conversation for Lightbox navigation
  const allConversationImages = activeMessages
    .flatMap((m) => m.attachments || [])
    .map((att) => att.url);

  const handleOpenLightbox = (clickedUrl: string) => {
    const imagesToUse = allConversationImages.length > 0 ? allConversationImages : [clickedUrl];
    const foundIndex = imagesToUse.indexOf(clickedUrl);
    setLightboxImages(imagesToUse);
    setLightboxIndex(foundIndex !== -1 ? foundIndex : 0);
    setIsLightboxOpen(true);
  };

  // Scroll position listener for floating scroll-to-bottom button
  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 250) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
    }
  };

  // User search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await client.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        setUserSearchResults(res.data);
      } catch (err) {
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendMessage = async (text: string, imageFile?: File | null) => {
    if (!activeConversationId || isSending || isBlocked) return;

    try {
      setIsSending(true);
      let attachmentUrl: string | undefined;
      if (imageFile) {
        attachmentUrl = await uploadMedia(imageFile);
      }

      if (editingMessage) {
        await editMessage(editingMessage.id, text);
        setEditingMessage(null);
      } else {
        await sendMessage(
          activeConversationId,
          text || undefined,
          attachmentUrl ? [attachmentUrl] : undefined,
          replyToMessage?.id
        );
      }

      setReplyToMessage(null);
      sendTypingSignal(activeConversationId, false, user?.full_name || `Farmer ${user?.id}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Failed to send message';
      alert(detail);
      if (otherUser) {
        fetchBlockStatus(otherUser.user_id);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (activeConversationId && user && !isBlocked) {
      sendTypingSignal(activeConversationId, true, user.full_name || `Farmer ${user.id}`);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingSignal(activeConversationId, false, user.full_name || `Farmer ${user.id}`);
      }, 2500);
    }
  };

  const handleConfirmBlock = async () => {
    if (!otherUser) return;
    try {
      setIsBlockActionLoading(true);
      await blockUser(otherUser.user_id);
      setShowBlockModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to block user.');
    } finally {
      setIsBlockActionLoading(false);
    }
  };

  const handleConfirmUnblock = async () => {
    if (!otherUser) return;
    try {
      setIsBlockActionLoading(true);
      await unblockUser(otherUser.user_id);
      setShowUnblockModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to unblock user.');
    } finally {
      setIsBlockActionLoading(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'archived') return c.is_archived;
    if (c.is_archived) return false;
    if (activeTab === 'unread') return c.unread_count > 0;
    // Filter by conversation search query
    if (searchQuery.trim()) {
      const name = c.other_participant?.full_name || c.other_participant?.username || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const activeTypingList = activeConversationId ? typingUsers[activeConversationId] || [] : [];

  return (
    <div className="flex h-full w-full bg-[#F8FAFC] text-slate-900 font-sans select-none relative overflow-hidden">
      {/* ─── CONVERSATION PANEL ─── */}
      <div
        className={`${
          activeConversationId ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-[360px] lg:w-[400px] border-r border-slate-200 bg-white flex-shrink-0 z-10 shadow-sm`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
              <MessageSquare className="w-5 h-5 text-[#16A34A]" />
              <span>Direct Messages</span>
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 font-bold">
              AgriNex Direct
            </span>
          </div>

          {/* Rounded Search Bar with Smooth Focus Animation */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search farmers or conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#16A34A] focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans shadow-sm"
            />
          </div>

          {/* Filter Tabs */}
          {!searchQuery && (
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-[#16A34A] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Chats
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'unread'
                    ? 'bg-white text-[#16A34A] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'archived'
                    ? 'bg-white text-[#16A34A] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Archived
              </button>
            </div>
          )}
        </div>

        {/* Panel List Body: Conversations OR Search Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
          {searchQuery && userSearchResults.length > 0 ? (
            /* User Search Results */
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Farmers Search Results
              </p>
              {isSearchingUsers ? (
                <div className="flex items-center justify-center p-8 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                </div>
              ) : (
                userSearchResults.map((u) => (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    key={u.id}
                    onClick={() => {
                      startConversation(u.id);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-3 rounded-[18px] bg-white border border-slate-200 shadow-sm hover:border-[#16A34A] hover:shadow-md cursor-pointer transition-all"
                  >
                    <img
                      src={
                        u.profile_picture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || u.username)}&background=16A34A&color=fff`
                      }
                      alt={u.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{u.full_name}</h4>
                        {u.is_verified && <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />}
                      </div>
                      <p className="text-xs text-slate-500 truncate">@{u.username || 'farmer'}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-[#16A34A]" />
                  </motion.div>
                ))
              )}
            </div>
          ) : isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
              <span className="text-xs font-semibold">Loading conversations...</span>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((c) => (
              <ConversationCard
                key={c.id}
                conversation={c}
                isActive={c.id === activeConversationId}
                onSelect={() => selectConversation(c.id)}
                currentUserId={user?.id}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center gap-3">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-medium">
                {activeTab === 'unread'
                  ? 'No unread messages'
                  : activeTab === 'archived'
                  ? 'No archived conversations'
                  : 'No active conversations. Search a farmer above to start chatting!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── CHAT WINDOW PANEL ─── */}
      <div
        className={`${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col bg-[#F8FAFC] relative h-full overflow-hidden`}
      >
        {activeConversationId && activeConversation ? (
          <>
            {/* Clean White Chat Header */}
            <ChatHeader
              participant={otherUser}
              isPinned={activeConversation.is_pinned}
              isMuted={activeConversation.is_muted}
              isArchived={activeConversation.is_archived}
              isBlockedByMe={isBlockedByMe}
              onBack={() => selectConversation(0)}
              onPin={() => pinConversation(activeConversation.id)}
              onMute={() => muteConversation(activeConversation.id)}
              onArchive={() => archiveConversation(activeConversation.id)}
              onBlockClick={() => setShowBlockModal(true)}
              onUnblockClick={() => setShowUnblockModal(true)}
            />

            {/* Scrollable Messages Area with Light Farming Watermark */}
            <div
              ref={messageContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 relative bg-[#F8FAFC]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2016a34a' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
                </div>
              ) : activeMessages.length > 0 ? (
                activeMessages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    currentUserId={user?.id || 0}
                    onOpenImage={handleOpenLightbox}
                    onReply={(m) => setReplyToMessage(m)}
                    onEdit={(m) => setEditingMessage(m)}
                    onDelete={(id, type) => deleteMessage(id, type)}
                    onToggleReaction={(id, emoji) => toggleReaction(id, emoji)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6 gap-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16A34A] shadow-sm">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Say Hello to {otherUser?.full_name || 'Farmer'}!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Start a conversation to share farming techniques, crop updates, or market inquiries.
                  </p>
                </div>
              )}

              {/* Typing Indicator */}
              {!isBlocked && activeTypingList.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs text-[#16A34A] font-semibold w-fit shadow-sm animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
                  <span>{activeTypingList.join(', ')} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Floating Button */}
            {showScrollBottomBtn && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 right-6 p-3 rounded-full bg-[#16A34A] text-white shadow-xl hover:bg-[#22C55E] transition-all z-20 animate-bounce"
                title="Scroll to bottom"
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}

            {/* Clean Message Input Bar */}
            <MessageInput
              onSendMessage={handleSendMessage}
              replyToMessage={replyToMessage}
              onCancelReply={() => setReplyToMessage(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onTyping={handleTyping}
              isSending={isSending}
              isBlocked={isBlocked}
              blockBannerMessage={blockBannerMessage}
            />
          </>
        ) : (
          /* ─── EMPTY STATE: NO CONVERSATION SELECTED ─── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 gap-5 bg-white"
          >
            <div className="p-6 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A34A] shadow-md">
              <MessageSquare className="w-14 h-14" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Start a Conversation</h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                Search for farmers, agronomists or buyers to begin chatting.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-500 font-semibold shadow-sm mt-2">
              <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Enterprise Standard Direct Messaging</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── BLOCK CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {showBlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center gap-4 font-sans"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                <UserX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Block User?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This user won't be able to message or follow you.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  disabled={isBlockActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  disabled={isBlockActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isBlockActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Block'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UNBLOCK CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {showUnblockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center gap-4 font-sans"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16A34A] shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Unblock User?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This user will be able to message you again.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowUnblockModal(false)}
                  disabled={isBlockActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnblock}
                  disabled={isBlockActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#22C55E] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isBlockActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unblock'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FULL-SCREEN IMAGE LIGHTBOX MODAL ─── */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
};

export default Messages;
