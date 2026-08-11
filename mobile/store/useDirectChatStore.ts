import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { useAuthStore } from './useAuthStore';

export interface Participant {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  profile_picture?: string;
  is_verified?: boolean;
  is_online?: boolean;
}

export interface Attachment {
  id: number;
  url: string;
  file_type?: string;
}

export interface Reaction {
  id: number;
  emoji: string;
  user_id: number;
}

export interface DirectMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  sender_picture?: string;
  content?: string;
  status?: string;
  created_at: string;
  is_edited?: boolean;
  is_deleted_everyone?: boolean;
  reply_to_id?: number;
  reply_to_content?: string;
  reply_to_sender?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
}

export interface DirectConversation {
  id: number;
  other_participant?: Participant;
  unread_count: number;
  is_pinned?: boolean;
  is_muted?: boolean;
  is_archived?: boolean;
  last_message?: DirectMessage | null;
  created_at: string;
  updated_at: string;
}

export interface BlockStatus {
  is_blocked: boolean;
  blocked_by_me: boolean;
  blocked_by_them: boolean;
}

interface DirectChatState {
  conversations: DirectConversation[];
  activeConversationId: number | null;
  messages: Record<number, DirectMessage[]>;
  typingUsers: Record<number, string[]>;
  blockStatusMap: Record<number, BlockStatus>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  offlineQueue: {
    conversationId: number;
    content?: string;
    attachments: string[];
    replyToId?: number;
    clientMsgId: string;
  }[];
  
  // WebSockets
  socket: WebSocket | null;

  // Actions
  fetchConversations: () => Promise<void>;
  startConversation: (targetUserId: number) => Promise<number | null>;
  selectConversation: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content?: string, attachments?: string[], replyToId?: number, clientMsgId?: string) => Promise<void>;
  editMessage: (messageId: number, newContent: string) => Promise<void>;
  deleteMessage: (messageId: number, deleteType: 'for_me' | 'everyone') => Promise<void>;
  toggleReaction: (messageId: number, emoji: string) => Promise<void>;
  pinConversation: (conversationId: number) => Promise<void>;
  muteConversation: (conversationId: number) => Promise<void>;
  archiveConversation: (conversationId: number) => Promise<void>;
  fetchBlockStatus: (targetUserId: number) => Promise<BlockStatus>;
  blockUser: (targetUserId: number) => Promise<void>;
  unblockUser: (targetUserId: number) => Promise<void>;
  uploadMedia: (fileUri: string) => Promise<string>;
  connectWebSocket: (userId: number) => void;
  disconnectWebSocket: () => void;
  sendTypingSignal: (conversationId: number, isTyping: boolean, username: string) => void;
}

let heartbeatInterval: any = null;
let reconnectTimer: any = null;
let isExplicitDisconnect = false;
let reconnectAttemptsCount = 0;

export const useDirectChatStore = create<DirectChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: {},
      typingUsers: {},
      blockStatusMap: {},
      isLoadingConversations: false,
      isLoadingMessages: false,
      offlineQueue: [],
      socket: null,

      fetchConversations: async () => {
        set({ isLoadingConversations: true });
        const endpoints = ['/conversations', '/messages/conversations', '/messages', '/api/conversations', '/api/messages'];
        for (const ep of endpoints) {
          try {
            const res = await client.get(ep);
            const rawList: DirectConversation[] = Array.isArray(res.data) ? res.data : [];
            rawList.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            set({ conversations: rawList, isLoadingConversations: false });
            return;
          } catch (err: any) {
            console.log(`[DirectChatStore] fetchConversations failed on ${ep}:`, err?.response?.status || err?.message);
          }
        }
        set({ isLoadingConversations: false });
      },

      startConversation: async (targetUserId: number) => {
        const attempts = [
          () => client.post('/conversations/start', { target_user_id: targetUserId }),
          () => client.post(`/conversations?target_user_id=${targetUserId}`),
          () => client.post('/messages/conversations', { target_user_id: targetUserId }),
          () => client.post('/messages/start', { target_user_id: targetUserId }),
          () => client.post('/api/conversations/start', { target_user_id: targetUserId }),
        ];

        for (const attempt of attempts) {
          try {
            const res = await attempt();
            const conv = res.data;
            if (conv) {
              set((state) => {
                const existingIdx = state.conversations.findIndex((c) => c.id === conv.id);
                let updatedConvs: DirectConversation[];
                if (existingIdx >= 0) {
                  updatedConvs = state.conversations.map((c) => (c.id === conv.id ? { ...c, ...conv } : c));
                } else {
                  updatedConvs = [conv, ...state.conversations];
                }
                updatedConvs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                return {
                  conversations: updatedConvs,
                  activeConversationId: conv.id,
                };
              });
              await get().selectConversation(conv.id);
              return conv.id;
            }
          } catch (err: any) {
            console.log('[DirectChatStore] startConversation attempt failed:', err?.response?.status || err?.message);
          }
        }
        return null;
      },

      selectConversation: async (conversationId: number) => {
        set({ activeConversationId: conversationId });
        if (!conversationId) return;

        set({ isLoadingMessages: true });
        const endpoints = [
          `/conversations/${conversationId}/messages`,
          `/messages/${conversationId}`,
          `/api/conversations/${conversationId}/messages`,
          `/api/messages/${conversationId}`
        ];

        for (const ep of endpoints) {
          try {
            const res = await client.get(ep);
            const msgList = res.data || [];
            set((state) => ({
              messages: { ...state.messages, [conversationId]: msgList },
              isLoadingMessages: false,
              conversations: state.conversations.map((c) =>
                c.id === conversationId ? { ...c, unread_count: 0 } : c
              ),
            }));
            return;
          } catch (err: any) {
            console.log(`[DirectChatStore] selectConversation failed on ${ep}:`, err?.response?.status || err?.message);
          }
        }
        set({ isLoadingMessages: false });
      },

      sendMessage: async (conversationId: number, content?: string, attachments: string[] = [], replyToId?: number, clientMsgId?: string) => {
        const tempClientMsgId = clientMsgId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentUserId = useAuthStore?.getState()?.user?.id || 0;
        
        // Construct optimistic message
        const tempId = -Date.now();
        const tempMsg: DirectMessage = {
          id: tempId,
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content?.trim() || undefined,
          status: 'sent',
          created_at: new Date().toISOString(),
          reply_to_id: replyToId,
          attachments: attachments.map((url, idx) => ({
            id: -Date.now() - idx,
            url,
            file_type: url.includes('data:audio/') || url.includes('.wav') ? 'audio' : 'image',
          })),
          reactions: [],
        };

        // Optimistically add to state if not already present
        set((state) => {
          const existing = state.messages[conversationId] || [];
          const alreadyExists = existing.some(m => m.id === tempId || (tempClientMsgId && m.id < 0 && m.content === content));
          if (alreadyExists) return {};
          
          const updatedConvs = state.conversations.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                last_message: tempMsg,
                updated_at: tempMsg.created_at || new Date().toISOString(),
              };
            }
            return c;
          });
          updatedConvs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

          return {
            messages: {
              ...state.messages,
              [conversationId]: [...existing, tempMsg],
            },
            conversations: updatedConvs,
          };
        });

        const payload = {
          content: content?.trim() || null,
          attachments: attachments || [],
          reply_to_id: replyToId,
          client_msg_id: tempClientMsgId,
        };

        const attempts = [
          () => client.post(`/conversations/${conversationId}/messages`, payload),
          () => client.post('/messages/send', { conversation_id: conversationId, ...payload }),
          () => client.post(`/api/conversations/${conversationId}/messages`, payload),
          () => client.post('/api/messages/send', { conversation_id: conversationId, ...payload }),
        ];

        let success = false;
        let newMsg: DirectMessage | null = null;
        for (const attempt of attempts) {
          try {
            const res = await attempt();
            newMsg = res.data;
            if (newMsg) {
              success = true;
              break;
            }
          } catch (err: any) {
            console.log('[DirectChatStore] sendMessage attempt failed:', err?.response?.status || err?.message);
          }
        }

        if (success && newMsg) {
          set((state) => {
            const list = state.messages[conversationId] || [];
            const updatedList = list.map((m) =>
              m.id === tempId ? newMsg! : m
            );
            
            const updatedConvs = state.conversations.map((c) => {
              if (c.id === conversationId) {
                return {
                  ...c,
                  last_message: newMsg,
                  updated_at: newMsg!.created_at || new Date().toISOString(),
                };
              }
              return c;
            });
            updatedConvs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

            return {
              messages: { ...state.messages, [conversationId]: updatedList },
              conversations: updatedConvs,
            };
          });
        } else {
          // If all attempts failed (likely network/offline), queue it
          const queueItem = { conversationId, content, attachments, replyToId, clientMsgId: tempClientMsgId };
          set((state) => {
            const existsInQueue = state.offlineQueue.some(item => item.clientMsgId === tempClientMsgId);
            if (existsInQueue) return {};
            return { offlineQueue: [...state.offlineQueue, queueItem] };
          });
        }
      },

      editMessage: async (messageId: number, newContent: string) => {
        try {
          let res;
          try {
            res = await client.put(`/messages/${messageId}`, { content: newContent });
          } catch {
            res = await client.patch(`/messages/edit?msg_id=${messageId}`, { content: newContent });
          }
          const updatedMsg = res.data;

          set((state) => {
            const activeId = state.activeConversationId;
            if (!activeId) return state;
            const msgs = state.messages[activeId] || [];
            return {
              messages: {
                ...state.messages,
                [activeId]: msgs.map((m) => (m.id === messageId ? updatedMsg : m)),
              },
            };
          });
        } catch (err) {
          console.log('[DirectChatStore] editMessage failed:', err);
        }
      },

      deleteMessage: async (messageId: number, deleteType: 'for_me' | 'everyone') => {
        try {
          try {
            await client.delete(`/messages/${messageId}?delete_type=${deleteType}`);
          } catch {
            await client.delete(`/messages/delete?msg_id=${messageId}&delete_type=${deleteType}`);
          }

          set((state) => {
            const activeId = state.activeConversationId;
            if (!activeId) return state;
            const msgs = state.messages[activeId] || [];
            if (deleteType === 'everyone') {
              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.map((m) =>
                    m.id === messageId ? { ...m, is_deleted_everyone: true, content: '' } : m
                  ),
                },
              };
            } else {
              return {
                messages: {
                  ...state.messages,
                  [activeId]: msgs.filter((m) => m.id !== messageId),
                },
              };
            }
          });
        } catch (err) {
          console.log('[DirectChatStore] deleteMessage failed:', err);
        }
      },

      toggleReaction: async (messageId: number, emoji: string) => {
        try {
          let res;
          try {
            res = await client.post(`/messages/${messageId}/reactions`, { emoji });
          } catch {
            res = await client.post(`/messages/reaction?msg_id=${messageId}`, { emoji });
          }
          const updatedReactions = res.data?.reactions || res.data;

          set((state) => {
            const activeId = state.activeConversationId;
            if (!activeId) return state;
            const msgs = state.messages[activeId] || [];
            return {
              messages: {
                ...state.messages,
                [activeId]: msgs.map((m) =>
                  m.id === messageId ? { ...m, reactions: updatedReactions } : m
                ),
              },
            };
          });
        } catch (err) {
          console.log('[DirectChatStore] toggleReaction failed:', err);
        }
      },

      pinConversation: async (conversationId: number) => {
        try {
          let res;
          try {
            res = await client.post(`/conversations/${conversationId}/pin`);
          } catch {
            res = await client.post(`/api/conversations/${conversationId}/pin`);
          }
          const isPinned = res.data.is_pinned;
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, is_pinned: isPinned } : c
            ),
          }));
        } catch (err) {
          console.log('[DirectChatStore] pinConversation failed:', err);
        }
      },

      muteConversation: async (conversationId: number) => {
        try {
          let res;
          try {
            res = await client.post(`/conversations/${conversationId}/mute`);
          } catch {
            res = await client.post(`/api/conversations/${conversationId}/mute`);
          }
          const isMuted = res.data.is_muted;
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, is_muted: isMuted } : c
            ),
          }));
        } catch (err) {
          console.log('[DirectChatStore] muteConversation failed:', err);
        }
      },

      archiveConversation: async (conversationId: number) => {
        try {
          let res;
          try {
            res = await client.post(`/conversations/${conversationId}/archive`);
          } catch {
            res = await client.post(`/api/conversations/${conversationId}/archive`);
          }
          const isArchived = res.data.is_archived;
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, is_archived: isArchived } : c
            ),
          }));
        } catch (err) {
          console.log('[DirectChatStore] archiveConversation failed:', err);
        }
      },

      fetchBlockStatus: async (targetUserId: number) => {
        const endpoints = [`/users/${targetUserId}/block-status`, `/api/users/${targetUserId}/block-status`];
        for (const ep of endpoints) {
          try {
            const res = await client.get(ep);
            const status: BlockStatus = res.data;
            set((state) => ({
              blockStatusMap: { ...state.blockStatusMap, [targetUserId]: status },
            }));
            return status;
          } catch (err: any) {
            if (err?.response?.status !== 404) break;
          }
        }
        return { is_blocked: false, blocked_by_me: false, blocked_by_them: false };
      },

      blockUser: async (targetUserId: number) => {
        const endpoints = [`/users/${targetUserId}/block`, `/api/users/${targetUserId}/block`];
        for (const ep of endpoints) {
          try {
            await client.post(ep);
            await get().fetchBlockStatus(targetUserId);
            return;
          } catch (err: any) {
            if (err?.response?.status !== 404) {
              console.log('[DirectChatStore] blockUser failed:', err);
              throw err;
            }
          }
        }
      },

      unblockUser: async (targetUserId: number) => {
        const attempts = [
          () => client.delete(`/users/${targetUserId}/block`),
          () => client.post(`/users/${targetUserId}/unblock`),
          () => client.delete(`/api/users/${targetUserId}/block`),
          () => client.post(`/api/users/${targetUserId}/unblock`),
        ];
        for (const attempt of attempts) {
          try {
            await attempt();
            await get().fetchBlockStatus(targetUserId);
            return;
          } catch (err: any) {
            if (err?.response?.status !== 404) {
              console.log('[DirectChatStore] unblockUser failed:', err);
              throw err;
            }
          }
        }
      },

      uploadMedia: async (fileUri: string) => {
        const formData = new FormData();
        const filename = fileUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // @ts-ignore
        formData.append('file', { uri: fileUri, name: filename, type });

        const endpoints = ['/upload', '/api/media/upload', '/api/upload', '/media/upload'];
        for (const ep of endpoints) {
          try {
            const res = await client.post(ep, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.url;
          } catch (err: any) {
            if (err?.response?.status !== 404) {
              throw err;
            }
          }
        }
        throw new Error('Upload endpoint unavailable');
      },

      connectWebSocket: (userId: number) => {
        const existingSocket = get().socket;
        if (existingSocket && existingSocket.readyState === WebSocket.OPEN) return;

        isExplicitDisconnect = false;
        try {
          const baseUrl = client.defaults.baseURL || '';
          const wsHost = baseUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
          const wsUrl = `${wsHost}/ws/chat/${userId}`;

          console.log('[DirectChatStore] Connecting to WebSocket:', wsUrl);
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            console.log('[DirectChatStore] WebSocket Connected');
            reconnectAttemptsCount = 0;
            if (reconnectTimer) {
              clearTimeout(reconnectTimer);
              reconnectTimer = null;
            }

            // Start heartbeat ping-pong
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
              }
            }, 30000);

            // Process offline queue messages sequentially
            const queue = get().offlineQueue;
            if (queue.length > 0) {
              set({ offlineQueue: [] });
              queue.forEach((item) => {
                get().sendMessage(item.conversationId, item.content, item.attachments, item.replyToId, item.clientMsgId)
                  .catch(() => {});
              });
            }
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'new_message' && data.message) {
                const msg: DirectMessage = data.message;
                set((state) => {
                  const cid = msg.conversation_id;
                  const existingMsgs = state.messages[cid] || [];
                  
                  // Deduplicate by ID or clientMsgId
                  const alreadyHas = existingMsgs.some((m) => m.id === msg.id);
                  if (alreadyHas) return {};

                  return {
                    messages: {
                      ...state.messages,
                      [cid]: [...existingMsgs, msg],
                    },
                  };
                });
                get().fetchConversations();
              } else if (data.type === 'typing') {
                const { conversation_id, is_typing, username } = data;
                set((state) => {
                  const currentTypers = state.typingUsers[conversation_id] || [];
                  const updated = is_typing
                    ? Array.from(new Set([...currentTypers, username]))
                    : currentTypers.filter((u) => u !== username);

                  return {
                    typingUsers: { ...state.typingUsers, [conversation_id]: updated },
                  };
                });
              }
            } catch (e) {
              console.log('[DirectChatStore] WS parse error:', e);
            }
          };

          ws.onerror = (e) => {
            console.log('[DirectChatStore] WS error:', e);
          };

          ws.onclose = () => {
            console.log('[DirectChatStore] WS closed');
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              heartbeatInterval = null;
            }

            // Exponential backoff reconnection
            if (!isExplicitDisconnect) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsCount), 16000);
              reconnectAttemptsCount++;
              reconnectTimer = setTimeout(() => {
                get().connectWebSocket(userId);
              }, delay);
            }
          };

          set({ socket: ws });
        } catch (e) {
          console.log('[DirectChatStore] WS init failed:', e);
        }
      },

      disconnectWebSocket: () => {
        isExplicitDisconnect = true;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        const ws = get().socket;
        if (ws) {
          ws.close();
        }
        set({ socket: null });
      },

      sendTypingSignal: (conversationId: number, isTyping: boolean, username: string) => {
        const ws = get().socket;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'typing',
              conversation_id: conversationId,
              is_typing: isTyping,
              username,
            })
          );
        }
      },
    }),
    {
      name: 'agrinex-direct-chat-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ conversations: state.conversations, offlineQueue: state.offlineQueue }),
    }
  )
);
