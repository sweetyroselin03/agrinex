import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Plus, 
  MessageSquare, 
  Loader2, 
  Edit3, 
  Check,
  ChevronRight
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

// Simple markdown formatter to display rich AI advice without extra dependencies
const formatMessageText = (text: string) => {
  if (!text) return '';
  
  // Replace headers: ### text
  let formatted = text.replace(/^### (.*?)$/gm, '<h5 class="font-extrabold text-brandDark mt-3 mb-1 text-sm">$1</h5>');
  formatted = formatted.replace(/^## (.*?)$/gm, '<h4 class="font-extrabold text-brandDark mt-4 mb-2 text-md">$1</h4>');
  formatted = formatted.replace(/^# (.*?)$/gm, '<h3 class="font-black text-brandDark mt-5 mb-3 text-lg">$1</h3>');
  
  // Bold: **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-brandDark">$1</strong>');
  
  // Bullet points: - text or * text
  formatted = formatted.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-4 list-disc text-xs my-0.5">$1</li>');
  
  // Code blocks: `code`
  formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-rose px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  
  // Convert newlines to breaks (ignoring list tags)
  formatted = formatted.split('\n').map(line => {
    if (line.includes('<h') || line.includes('<li') || line.includes('<code')) {
      return line;
    }
    return line + '<br/>';
  }).join('');

  return <div dangerouslySetInnerHTML={{ __html: formatted }} className="space-y-1 text-xs text-slate-700 leading-relaxed" />;
};

export default function Chatbot() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Rename variables
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleVal, setEditTitleVal] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize: load conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation selection changes
  useEffect(() => {
    if (selectedConvId) {
      fetchChatHistory(selectedConvId);
    } else {
      setMessages([
        { 
          id: 'welcome', 
          message: `Hello ${user?.full_name || 'Farmer Partner'}! I am AgriGPT, your personal agronomist advisor. Ask me anything about crop diseases, fertilizing, or weather controls.`, 
          is_ai: true,
          created_at: new Date()
        }
      ]);
    }
  }, [selectedConvId]);

  // Auto scroll to chat bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (e) {
      console.warn('Failed to load conversations list');
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchChatHistory = async (convId: string) => {
    try {
      const res = await api.get('/chat/history', { params: { conversation_id: convId } });
      setMessages(res.data);
    } catch (e) {
      console.warn('Failed to load history');
    }
  };

  const handleCreateNewChat = () => {
    setSelectedConvId(null);
    setInput('');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const messageText = input.trim();
    setInput('');
    setSending(true);

    // Generate temporary conversation ID if none selected
    const activeConvId = selectedConvId || `conv_${Date.now()}`;

    // Append user message locally
    const userMsg = {
      id: Date.now(),
      message: messageText,
      is_ai: false,
      created_at: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await api.post('/chat', {
        message: messageText,
        conversation_id: activeConvId
      });

      // Update active selection and fetch list updates
      if (!selectedConvId) {
        setSelectedConvId(activeConvId);
        fetchConversations();
      }

      // Append response message
      const aiMsg = {
        id: res.data.id || Date.now() + 1,
        message: res.data.message || res.data.response,
        is_ai: true,
        created_at: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      // Show local warning error bubble
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        message: 'Sorry, I encountered a connection error. Please verify your connection to Render cloud service and try again.',
        is_ai: true,
        created_at: new Date()
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat conversation?')) return;

    try {
      await api.delete(`/chat/conversation/${convId}`);
      if (selectedConvId === convId) {
        setSelectedConvId(null);
      }
      fetchConversations();
    } catch (err) {
      alert('Delete request failed.');
    }
  };

  const handleStartRename = (conv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(conv.id);
    setEditTitleVal(conv.title);
  };

  const handleSaveRename = async (convId: string) => {
    if (!editTitleVal.trim()) return;
    try {
      await api.put(`/chat/conversation/${convId}/title`, { message: editTitleVal });
      setEditingTitleId(null);
      fetchConversations();
    } catch (err) {
      alert('Failed to rename conversation');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-3xl border border-borderDark flex overflow-hidden shadow-sm">
      
      {/* ─── SIDEBAR: HISTORICAL CONVERSATIONS (30% Width) ─── */}
      <aside className="w-80 border-r border-borderDark flex flex-col bg-slate-50/50 shrink-0 hidden md:flex">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-borderDark flex items-center justify-between bg-white">
          <h3 className="font-extrabold text-brandDark text-sm">Consultation Logs</h3>
          <button
            onClick={handleCreateNewChat}
            className="p-2 rounded-xl bg-primary text-brandDark hover:bg-emerald-400 font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingConversations ? (
            <div className="py-12 text-center text-textSec text-xs flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Loading history...
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-textSec text-xs">
              No recent conversations.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConvId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`group w-full p-3 rounded-xl flex items-start justify-between gap-3 text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-brandLight border border-primary/20 text-brandDark font-bold'
                      : 'hover:bg-slate-100/70 border border-transparent text-textSec'
                  }`}
                >
                  <div className="flex gap-2.5 min-w-0 flex-1 items-center">
                    <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      {editingTitleId === conv.id ? (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            className="bg-white border border-slate-200 text-brandDark rounded px-1.5 py-0.5 text-xs font-semibold w-full outline-none"
                            value={editTitleVal}
                            onChange={(e) => setEditTitleVal(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(conv.id); }}
                          />
                          <button onClick={() => handleSaveRename(conv.id)} className="p-1 text-primary hover:bg-slate-150 rounded">
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-xs text-brandDark truncate leading-tight font-extrabold">{conv.title}</h4>
                          <p className="text-[10px] text-textSec truncate mt-0.5 font-medium">{conv.preview}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions (Rename / Delete) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(conv, e)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-brandDark rounded"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-rose rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ─── MAIN CHAT AREA (70% Width) ─── */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Chat window Header */}
        <div className="h-16 border-b border-borderDark px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brandLight text-primary flex items-center justify-center border border-primary/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brandDark">AgriGPT Advisory Engine</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mt-0.5">Active</p>
            </div>
          </div>
          
          <button 
            onClick={handleCreateNewChat}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-brandDark text-xs font-bold flex items-center gap-1"
          >
            New Chat
          </button>
        </div>

        {/* Chat message bubbles scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20">
          {messages.map((m) => {
            const isAI = m.is_ai;
            return (
              <div 
                key={m.id} 
                className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold bg-white ${
                    isAI ? 'border-primary/20 text-primary' : 'border-slate-200 text-slate-500'
                  }`}>
                    {isAI ? '🤖' : '👩‍🌾'}
                  </div>

                  {/* Bubble body */}
                  <div className={`p-4 rounded-2xl shadow-sm text-xs leading-relaxed ${
                    isAI 
                      ? 'bg-white border border-borderDark text-brandDark rounded-tl-sm border-l-4 border-l-primary'
                      : 'bg-brandDark text-white rounded-tr-sm font-semibold'
                  }`}>
                    {isAI ? formatMessageText(m.message) : m.message}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {sending && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-primary/20 text-xs bg-white">
                  🤖
                </div>
                <div className="p-4 rounded-2xl bg-white border border-borderDark rounded-tl-sm border-l-4 border-l-primary flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span 
                      key={i} 
                      className="w-2 h-2 bg-slate-350 rounded-full" 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input box footer */}
        <div className="p-4 border-t border-borderDark bg-white shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <textarea
              rows={1}
              placeholder="Type your agricultural question here... (e.g. 'How do I treat blight in tomato?')"
              className="flex-1 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-xs text-brandDark placeholder-slate-400 outline-none resize-none max-h-24 transition-all leading-normal"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending}
            />
            <button
              type="submit"
              className="p-3.5 rounded-xl bg-primary text-brandDark hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-md flex items-center justify-center"
              disabled={!input.trim() || sending}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
          <div className="text-[10px] text-textSec text-center mt-2.5 font-medium uppercase tracking-wider">
            Powered by Groq AI and Render Cloud Services
          </div>
        </div>

      </div>

    </div>
  );
}
