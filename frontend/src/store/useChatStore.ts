import { create } from 'zustand';
import client from '../api/client';
import { useAuthStore } from './useAuthStore';

export interface MessageAttachment {
  id: number;
  url: string;
  file_type: string;
  created_at: string;
}

export interface MessageReaction {
  id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  sender_avatar?: string;
  content?: string;
  client_msg_id?: string;
  reply_to_id?: number;
  reply_to_content?: string;
  reply_to_sender?: string;
  is_edited: boolean;
  is_deleted_everyone: boolean;
  created_at: string;
  updated_at: string;
  status: 'sent' | 'delivered' | 'seen';
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
}

export interface ConversationParticipant {
  id: number;
  user_id: number;
  full_name?: string;
  username?: string;
  profile_picture?: string;
  is_verified: boolean;
  is_online: boolean;
  last_seen?: string;
  is_pinned: boolean;
  is_muted: boolean;
  is_archived: boolean;
}

export interface Conversation {
  id: number;
  type: string;
  title?: string;
  created_at: string;
  updated_at: string;
  other_participant?: ConversationParticipant;
  last_message?: Message;
  unread_count: number;
  is_pinned: boolean;
  is_muted: boolean;
  is_archived: boolean;
}

export interface BlockStatus {
  id?: number;
  is_blocked: boolean;
  blocked_by_me: boolean;
  blocked_by_them: boolean;
  user_id: number;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, Message[]>;
  typingUsers: Record<number, string[]>;
  blockStatusMap: Record<number, BlockStatus>;
  isWebSocketConnected: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  offlineQueue: {
    conversationId: number;
    content?: string;
    attachments: string[];
    replyToId?: number;
    clientMsgId: string;
  }[];

  fetchConversations: () => Promise<Conversation[]>;
  startConversation: (targetUserId: number) => Promise<Conversation>;
  selectConversation: (conversationId: number) => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<Message[]>;
  sendMessage: (conversationId: number, content?: string, attachments?: string[], replyToId?: number, clientMsgId?: string) => Promise<Message>;
  editMessage: (messageId: number, content: string) => Promise<Message>;
  deleteMessage: (messageId: number, deleteType: 'for_me' | 'everyone') => Promise<void>;
  toggleReaction: (messageId: number, emoji: string) => Promise<Message>;
  markConversationRead: (conversationId: number) => Promise<void>;
  pinConversation: (conversationId: number) => Promise<void>;
  muteConversation: (conversationId: number) => Promise<void>;
  archiveConversation: (conversationId: number) => Promise<void>;
  fetchBlockStatus: (userId: number) => Promise<BlockStatus>;
  blockUser: (userId: number) => Promise<void>;
  unblockUser: (userId: number) => Promise<void>;
  uploadMedia: (file: File) => Promise<string>;

  connectWebSocket: (userId: number) => void;
  disconnectWebSocket: () => void;
  sendTypingSignal: (conversationId: number, isTyping: boolean, senderName: string) => void;
}

let socket: WebSocket | null = null;
let typingTimeoutMap: Record<number, ReturnType<typeof setTimeout>> = {};
let heartbeatInterval: any = null;
let reconnectTimer: any = null;
let isExplicitDisconnect = false;
let reconnectAttemptsCount = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  isWebSocketConnected: false,
  isLoadingConversations: false,
  isLoadingMessages: false,
  offlineQueue: [],

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      let res;
      try {
        res = await client.get('/messages');
      } catch (e) {
        res = await client.get('/api/conversations');
      }
      const data: Conversation[] = res.data;
      set({ conversations: data, isLoadingConversations: false });
      return data;
    } catch (err) {
      set({ isLoadingConversations: false });
      return [];
    }
  },

  startConversation: async (targetUserId: number) => {
    try {
      let res;
      try {
        res = await client.post('/messages/start', { target_user_id: targetUserId });
      } catch (e) {
        res = await client.post('/api/conversations/start', { target_user_id: targetUserId });
      }
      const conv: Conversation = res.data;
      
      const currentConvs = get().conversations;
      const exists = currentConvs.find((c) => c.id === conv.id);
      if (!exists) {
        set({ conversations: [conv, ...currentConvs] });
      }
      
      set({ activeConversationId: conv.id });
      get().fetchMessages(conv.id);
      return conv;
    } catch (err) {
      throw err;
    }
  },

  selectConversation: async (conversationId: number) => {
    set({ activeConversationId: conversationId });
    await get().fetchMessages(conversationId);
    get().markConversationRead(conversationId);
  },

  fetchMessages: async (conversationId: number) => {
    set({ isLoadingMessages: true });
    try {
      let res;
      try {
        res = await client.get(`/messages/${conversationId}`);
      } catch (e) {
        res = await client.get(`/api/conversations/${conversationId}/messages`);
      }
      const msgs: Message[] = res.data;
      set((state) => ({
        messages: { ...state.messages, [conversationId]: msgs },
        isLoadingMessages: false,
      }));
      return msgs;
    } catch (err) {
      set({ isLoadingMessages: false });
      return [];
    }
  },

  sendMessage: async (conversationId: number, content?: string, attachments: string[] = [], replyToId?: number, clientMsgId?: string) => {
    const tempClientMsgId = clientMsgId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentUserId = useAuthStore?.getState()?.user?.id || 0;
    
    // Construct optimistic message
    const tempId = -Date.now();
    const tempMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content?.trim() || undefined,
      client_msg_id: tempClientMsgId,
      is_edited: false,
      is_deleted_everyone: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sent',
      attachments: attachments.map((url, idx) => ({
        id: -Date.now() - idx,
        url,
        file_type: url.includes('data:audio/') ? 'audio' : 'image',
        created_at: new Date().toISOString(),
      })),
      reactions: [],
    };

    // Optimistically add to state if not already present
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const alreadyExists = existing.some(m => m.client_msg_id === tempClientMsgId);
      if (alreadyExists) return {};
      return {
        messages: { ...state.messages, [conversationId]: [...existing, tempMsg] },
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, last_message: tempMsg, updated_at: tempMsg.created_at } : c
        ),
      };
    });

    const payload = {
      conversation_id: conversationId,
      content: content?.trim() || null,
      attachments,
      reply_to_id: replyToId || null,
      client_msg_id: tempClientMsgId,
    };

    try {
      let res;
      try {
        res = await client.post('/messages/send', payload);
      } catch (e) {
        res = await client.post('/api/messages/send', payload);
      }
      const newMsg: Message = res.data;

      // Replace optimistic message in state
      set((state) => {
        const list = state.messages[conversationId] || [];
        const updatedList = list.map((m) =>
          m.client_msg_id === tempClientMsgId ? newMsg : m
        );
        return {
          messages: { ...state.messages, [conversationId]: updatedList },
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, last_message: newMsg, updated_at: newMsg.created_at } : c
          ),
        };
      });

      return newMsg;
    } catch (err: any) {
      // If it is a network failure/offline, queue it
      const isNetworkError = !err.response;
      if (isNetworkError) {
        const queueItem = { conversationId, content, attachments, replyToId, clientMsgId: tempClientMsgId };
        set((state) => {
          const existsInQueue = state.offlineQueue.some(item => item.clientMsgId === tempClientMsgId);
          if (existsInQueue) return {};
          return { offlineQueue: [...state.offlineQueue, queueItem] };
        });
      }
      throw err;
    }
  },

  editMessage: async (messageId: number, content: string) => {
    try {
      let res;
      try {
        res = await client.patch(`/messages/edit?msg_id=${messageId}`, { content });
      } catch (e) {
        res = await client.patch(`/api/messages/${messageId}`, { content });
      }
      const updatedMsg: Message = res.data;

      const activeId = get().activeConversationId;
      if (activeId) {
        set((state) => {
          const list = state.messages[activeId] || [];
          return {
            messages: {
              ...state.messages,
              [activeId]: list.map((m) => (m.id === messageId ? updatedMsg : m)),
            },
          };
        });
      }

      return updatedMsg;
    } catch (err) {
      throw err;
    }
  },

  deleteMessage: async (messageId: number, deleteType: 'for_me' | 'everyone') => {
    try {
      try {
        await client.delete(`/messages/delete?msg_id=${messageId}&delete_type=${deleteType}`);
      } catch (e) {
        await client.delete(`/api/messages/${messageId}?delete_type=${deleteType}`);
      }

      const activeId = get().activeConversationId;
      if (activeId) {
        set((state) => {
          const list = state.messages[activeId] || [];
          let updatedList: Message[];
          if (deleteType === 'for_me') {
            updatedList = list.filter((m) => m.id !== messageId);
          } else {
            updatedList = list.map((m) =>
              m.id === messageId ? { ...m, content: 'This message was deleted', is_deleted_everyone: true } : m
            );
          }
          return {
            messages: { ...state.messages, [activeId]: updatedList },
          };
        });
      }
    } catch (err) {
      throw err;
    }
  },

  toggleReaction: async (messageId: number, emoji: string) => {
    try {
      let res;
      try {
        res = await client.post(`/messages/reaction?msg_id=${messageId}`, { emoji });
      } catch (e) {
        res = await client.post(`/api/messages/${messageId}/react`, { emoji });
      }
      const updatedMsg: Message = res.data;

      const activeId = get().activeConversationId;
      if (activeId) {
        set((state) => {
          const list = state.messages[activeId] || [];
          return {
            messages: {
              ...state.messages,
              [activeId]: list.map((m) => (m.id === messageId ? updatedMsg : m)),
            },
          };
        });
      }

      return updatedMsg;
    } catch (err) {
      throw err;
    }
  },

  markConversationRead: async (conversationId: number) => {
    try {
      try {
        await client.post(`/messages/read?conv_id=${conversationId}`);
      } catch (e) {
        await client.post(`/api/messages/${conversationId}/read`);
      }
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
      }));
    } catch (err) {}
  },

  pinConversation: async (conversationId: number) => {
    try {
      const res = await client.post(`/api/conversations/${conversationId}/pin`);
      const isPinned = res.data.is_pinned;
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, is_pinned: isPinned } : c)),
      }));
    } catch (err) {}
  },

  muteConversation: async (conversationId: number) => {
    try {
      const res = await client.post(`/api/conversations/${conversationId}/mute`);
      const isMuted = res.data.is_muted;
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, is_muted: isMuted } : c)),
      }));
    } catch (err) {}
  },

  archiveConversation: async (conversationId: number) => {
    try {
      const res = await client.post(`/api/conversations/${conversationId}/archive`);
      const isArchived = res.data.is_archived;
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, is_archived: isArchived } : c)),
      }));
    } catch (err) {}
  },

  blockStatusMap: {},

  fetchBlockStatus: async (userId: number) => {
    try {
      let res;
      try {
        res = await client.get(`/api/users/${userId}/block-status`);
      } catch (e) {
        res = await client.get(`/users/${userId}/block-status`);
      }
      const data: BlockStatus = res.data;
      set((state) => ({
        blockStatusMap: { ...state.blockStatusMap, [userId]: data }
      }));
      return data;
    } catch (err) {
      const fallback: BlockStatus = { is_blocked: false, blocked_by_me: false, blocked_by_them: false, user_id: userId };
      return fallback;
    }
  },

  blockUser: async (userId: number) => {
    try {
      try {
        await client.post(`/api/users/${userId}/block`);
      } catch (err: any) {
        if (err?.response?.status !== 409) {
          await client.post(`/users/${userId}/block`);
        }
      }
      set((state) => ({
        blockStatusMap: {
          ...state.blockStatusMap,
          [userId]: { is_blocked: true, blocked_by_me: true, blocked_by_them: false, user_id: userId },
        },
      }));
      get().fetchConversations();
    } catch (err) {
      throw err;
    }
  },

  unblockUser: async (userId: number) => {
    try {
      try {
        await client.delete(`/api/users/${userId}/block`);
      } catch (err: any) {
        await client.delete(`/users/${userId}/block`);
      }
      set((state) => ({
        blockStatusMap: {
          ...state.blockStatusMap,
          [userId]: { is_blocked: false, blocked_by_me: false, blocked_by_them: false, user_id: userId },
        },
      }));
      get().fetchConversations();
    } catch (err) {
      throw err;
    }
  },


  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },

  connectWebSocket: (userId: number) => {
    if (socket && socket.readyState === WebSocket.OPEN) return;

    isExplicitDisconnect = false;
    const apiBase = import.meta.env.VITE_API_URL || 'https://agrinex.onrender.com';
    const cleanHost = apiBase.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const protocol = apiBase.startsWith('https') ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${cleanHost}/ws/chat/${userId}`;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        set({ isWebSocketConnected: true });
        reconnectAttemptsCount = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        // Start heartbeat ping-pong
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        // Process offline queue messages sequentially
        const queue = get().offlineQueue;
        if (queue.length > 0) {
          set({ offlineQueue: [] });
          queue.forEach((item) => {
            get().sendMessage(item.conversationId, item.content, item.attachments, item.replyToId, item.clientMsgId)
              .catch(() => {}); // handle retries gracefully
          });
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_message' && data.message) {
            const newMsg: Message = data.message;
            set((state) => {
              const cid = newMsg.conversation_id;
              const existingMsgs = state.messages[cid] || [];
              
              // Check if we already have the message by server ID or client_msg_id
              const clientMsgIdMatchIdx = existingMsgs.findIndex(
                (m) => (newMsg.client_msg_id && m.client_msg_id === newMsg.client_msg_id) || m.id === newMsg.id
              );

              let updatedMsgs: Message[];
              if (clientMsgIdMatchIdx !== -1) {
                updatedMsgs = [...existingMsgs];
                updatedMsgs[clientMsgIdMatchIdx] = newMsg;
              } else {
                updatedMsgs = [...existingMsgs, newMsg];
              }

              return {
                messages: {
                  ...state.messages,
                  [cid]: updatedMsgs,
                },
                conversations: state.conversations.map((c) =>
                  c.id === cid
                    ? {
                        ...c,
                        last_message: newMsg,
                        updated_at: newMsg.created_at,
                        unread_count: state.activeConversationId === cid ? 0 : c.unread_count + 1,
                      }
                    : c
                ),
              };
            });
          }

          else if (data.type === 'typing') {
            const { conversation_id, sender_name, is_typing } = data;
            set((state) => {
              const currentTypers = state.typingUsers[conversation_id] || [];
              let updated: string[];
              if (is_typing) {
                updated = Array.from(new Set([...currentTypers, sender_name]));
              } else {
                updated = currentTypers.filter((name) => name !== sender_name);
              }
              return {
                typingUsers: { ...state.typingUsers, [conversation_id]: updated },
              };
            });
          }

          else if (data.type === 'read_receipt') {
            const { conversation_id, message_ids } = data;
            set((state) => {
              const list = state.messages[conversation_id] || [];
              return {
                messages: {
                  ...state.messages,
                  [conversation_id]: list.map((m) =>
                    message_ids.includes(m.id) ? { ...m, status: 'seen' } : m
                  ),
                },
              };
            });
          }

          else if (data.type === 'message_reaction' || data.type === 'message_edited') {
            const updatedMsg: Message = data.message;
            const cid = updatedMsg.conversation_id;
            set((state) => {
              const list = state.messages[cid] || [];
              return {
                messages: {
                  ...state.messages,
                  [cid]: list.map((m) => (m.id === updatedMsg.id || (updatedMsg.client_msg_id && m.client_msg_id === updatedMsg.client_msg_id) ? updatedMsg : m)),
                },
              };
            });
          }

          else if (data.type === 'message_deleted') {
            const { message_id, delete_type, user_id } = data;
            const activeId = get().activeConversationId;
            if (activeId) {
              set((state) => {
                const list = state.messages[activeId] || [];
                let updatedList: Message[];
                if (delete_type === 'everyone') {
                  updatedList = list.map((m) =>
                    m.id === message_id ? { ...m, content: 'This message was deleted', is_deleted_everyone: true } : m
                  );
                } else {
                  updatedList = list.filter((m) => m.id !== message_id);
                }
                return {
                  messages: { ...state.messages, [activeId]: updatedList },
                };
              });
            }
          }
        } catch (e) {}
      };

      socket.onclose = () => {
        set({ isWebSocketConnected: false });
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
    } catch (err) {
      set({ isWebSocketConnected: false });
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
    if (socket) {
      socket.close();
      socket = null;
    }
    set({ isWebSocketConnected: false });
  },

  sendTypingSignal: (conversationId: number, isTyping: boolean, senderName: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: 'typing',
          conversation_id: conversationId,
          is_typing: isTyping,
          sender_name: senderName,
        })
      );
    }
  },
}));
