import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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

export default function Messages() {
  const { user } = useAuthStore();
  const location = useLocation();

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

  // 3-second maximum loading safety timeout
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    fetchConversations();
    if (user?.id) {
      connectWebSocket(user.id);
    }
    const timer = setTimeout(() => setLoadTimedOut(true), 3000);
    return () => clearTimeout(timer);
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

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [activeMessages.length, activeConversationId]);

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
        setUserSearchResults(Array.isArray(res.data) ? res.data : []);
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
    if (searchQuery.trim()) {
      const name = c.other_participant?.full_name || c.other_participant?.username || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const activeTypingList = activeConversationId ? typingUsers[activeConversationId] || [] : [];

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full farm-card overflow-hidden font-sans relative">
      {/* ─── LEFT CONVERSATION LIST PANEL ─── */}
      <div
        className={`${
          activeConversationId ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-[350px] lg:w-[380px] border-r border-[#EEF3E8] bg-white flex-shrink-0 z-10`}
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-[#EEF3E8] space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-black text-[#123B24] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#185C2B]" />
              <span>Direct Messages</span>
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF3E8] text-[#185C2B]">
              🌾 Farm Direct
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#546E7A]" />
            <input
              type="text"
              placeholder="Search farmers or chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="agri-input pl-10 py-2.5 text-xs bg-[#F5F7EF]"
            />
          </div>

          {/* Tabs: All Chats | Unread | Archived */}
          {!searchQuery && (
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#F5F7EF] border border-[#EEF3E8] text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-[#123B24] shadow-farm-sm'
                    : 'text-[#546E7A] hover:text-[#123B24]'
                }`}
              >
                All Chats
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'unread'
                    ? 'bg-white text-[#123B24] shadow-farm-sm'
                    : 'text-[#546E7A] hover:text-[#123B24]'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                  activeTab === 'archived'
                    ? 'bg-white text-[#123B24] shadow-farm-sm'
                    : 'text-[#546E7A] hover:text-[#123B24]'
                }`}
              >
                Archived
              </button>
            </div>
          )}
        </div>

        {/* Conversation List / Search / Empty State (Max 3s Loading) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {searchQuery && userSearchResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#546E7A] uppercase tracking-wider px-2">
                Farmers Found
              </p>
              {isSearchingUsers ? (
                <div className="flex items-center justify-center p-8 text-[#546E7A]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#185C2B]" />
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
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#EEF3E8] hover:border-[#185C2B] hover:shadow-farm-sm cursor-pointer transition-all"
                  >
                    <img
                      src={
                        u.profile_picture ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.full_name || u.username)}`
                      }
                      alt={u.full_name}
                      className="w-10 h-10 rounded-full object-cover border border-[#EEF3E8]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-[#123B24] text-xs truncate">{u.full_name}</h4>
                        {u.is_verified && <CheckCircle className="w-3.5 h-3.5 text-[#185C2B]" />}
                      </div>
                      <p className="text-[11px] text-[#546E7A] truncate">@{u.username || 'farmer'}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-[#185C2B]" />
                  </motion.div>
                ))
              )}
            </div>
          ) : isLoadingConversations && !loadTimedOut ? (
            /* Skeleton shimmer loading */
            <div className="space-y-3 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-2xl skeleton-shimmer" />
              ))}
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
            /* Empty state after 3s max */
            <div className="flex flex-col items-center justify-center p-10 text-[#546E7A] text-center gap-3">
              <span className="text-4xl block">🌾</span>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[#123B24]">No conversations yet 🌾</h4>
                <p className="text-xs font-medium text-[#546E7A] max-w-xs">
                  {activeTab === 'unread'
                    ? 'No unread messages.'
                    : activeTab === 'archived'
                    ? 'No archived conversations.'
                    : 'Search for farmers above to start chatting!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT CHAT WINDOW PANEL ─── */}
      <div
        className={`${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col bg-[#F5F7EF]/40 relative h-full overflow-hidden`}
      >
        {activeConversationId && activeConversation ? (
          <>
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

            {/* Messages Scroll Area */}
            <div
              ref={messageContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 no-scrollbar relative"
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-[#546E7A]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#185C2B]" />
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
                <div className="flex flex-col items-center justify-center h-full text-center text-[#546E7A] p-6 gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#EEF3E8] flex items-center justify-center text-[#185C2B]">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="font-black text-[#123B24] text-base">
                    Say Hello to {otherUser?.full_name || 'Farmer'}!
                  </h3>
                  <p className="text-xs text-[#546E7A] max-w-sm">
                    Start a conversation to share farming techniques, crop updates, or market inquiries.
                  </p>
                </div>
              )}

              {/* Bouncing typing indicator */}
              {!isBlocked && activeTypingList.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EEF3E8] text-xs text-[#185C2B] font-semibold w-fit shadow-farm-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#185C2B] animate-typing-1" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#185C2B] animate-typing-2" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#185C2B] animate-typing-3" />
                  </div>
                  <span>{activeTypingList.join(', ')} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Floating scroll to bottom */}
            {showScrollBottomBtn && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-20 right-6 p-3 rounded-full bg-[#185C2B] text-white shadow-farm-lg hover:bg-[#1F7A36] transition-all z-20"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}

            {/* Message Input */}
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
          /* Empty Chat state */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#546E7A] gap-4 bg-white">
            <div className="p-5 rounded-3xl bg-[#EEF3E8] text-[#185C2B] shadow-farm-sm">
              <MessageSquare className="w-12 h-12" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="text-xl font-black text-[#123B24]">Start a Conversation</h2>
              <p className="text-xs text-[#546E7A] leading-relaxed">
                Connect directly with fellow growers, agricultural researchers, and buyers across India.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F7EF] border border-[#EEF3E8] text-[11px] text-[#546E7A] font-semibold mt-2">
              <Lock className="w-3.5 h-3.5 text-[#185C2B]" />
              <span>Encrypted Direct Messaging</span>
            </div>
          </div>
        )}
      </div>

      {/* Block & Lightbox Modals */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white border border-[#EEF3E8] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#123B24]">Block User?</h3>
                <p className="text-xs text-[#546E7A] mt-1">This user won't be able to message you.</p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  disabled={isBlockActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#F5F7EF] text-xs font-bold text-[#546E7A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  disabled={isBlockActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md flex items-center justify-center"
                >
                  {isBlockActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Block'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnblockModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white border border-[#EEF3E8] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-50 text-[#185C2B] flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#123B24]">Unblock User?</h3>
                <p className="text-xs text-[#546E7A] mt-1">This user will be able to message you again.</p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => setShowUnblockModal(false)}
                  disabled={isBlockActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#F5F7EF] text-xs font-bold text-[#546E7A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnblock}
                  disabled={isBlockActionLoading}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold shadow-md flex items-center justify-center"
                >
                  {isBlockActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unblock'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageLightbox
        isOpen={isLightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
}
