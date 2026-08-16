import { useState, useRef, useEffect, useCallback } from 'react';
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
  ImageIcon,
  Camera,
  Mic,
  Copy,
  RotateCcw,
  Bot,
  User,
  X,
  Menu
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config/api';

// Rich Markdown parser supporting code blocks, tables, headers, lists, bold/italics
function RenderMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const parseInline = (text: string) => {
    // Bold: **text**
    let parts: (string | React.ReactNode)[] = [text];
    
    // Process bold
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return part;
      const subParts = part.split(/(\*\*.*?\*\*)/g);
      return subParts.map((sub, i) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return <strong key={i} className="font-extrabold text-brandDark">{sub.slice(2, -2)}</strong>;
        }
        return sub;
      });
    });

    // Process inline code
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return part;
      const subParts = part.split(/(`.*?`)/g);
      return subParts.map((sub, i) => {
        if (sub.startsWith('`') && sub.endsWith('`')) {
          return <code key={i} className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200">{sub.slice(1, -1)}</code>;
        }
        return sub;
      });
    });

    return parts;
  };

  const flushTable = (key: string) => {
    if (tableHeader.length > 0) {
      elements.push(
        <div key={key} className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                {tableHeader.map((h, idx) => (
                  <th key={idx} className="p-2.5 font-extrabold text-brandDark uppercase tracking-wider text-[10px]">
                    {parseInline(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-slate-700 font-medium">
                      {parseInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeader = [];
    tableRows = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code_${idx}`} className="my-3 rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-sm border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex justify-between">
              <span>{codeLang || 'Code'}</span>
              <span>AgriNex Engine</span>
            </div>
            <pre className="whitespace-pre">{codeBuffer.join('\n')}</pre>
          </div>
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        if (inTable) flushTable(`table_${idx}`);
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Markdown Table lines
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|');
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else if (trimmed.includes('---')) {
        // Separator row — ignore
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(`table_${idx}`);
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={idx} className="font-extrabold text-brandDark mt-3 mb-1.5 text-sm tracking-tight">{parseInline(trimmed.slice(4))}</h4>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={idx} className="font-extrabold text-brandDark mt-4 mb-2 text-base tracking-tight">{parseInline(trimmed.slice(3))}</h3>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h2 key={idx} className="font-black text-brandDark mt-5 mb-2 text-lg tracking-tight">{parseInline(trimmed.slice(2))}</h2>);
    }
    // Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={idx} className="ml-4 list-disc text-xs text-slate-700 my-1 font-medium leading-relaxed">
          {parseInline(trimmed.slice(2))}
        </li>
      );
    }
    // Blank line
    else if (trimmed === '') {
      elements.push(<div key={idx} className="h-2" />);
    }
    // Paragraph
    else {
      elements.push(
        <p key={idx} className="text-xs text-slate-700 leading-relaxed font-medium">
          {parseInline(line)}
        </p>
      );
    }
  });

  if (inTable) flushTable(`table_end`);

  return <div className="space-y-1">{elements}</div>;
}

export default function Chatbot() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rename states
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleVal, setEditTitleVal] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User-scoped storage key
  const getChatStorageKey = useCallback((userId?: number) => {
    return userId ? `@agrinex_web_chat_${userId}` : '@agrinex_web_chat_guest';
  }, []);

  // Initialize: load conversations scoped to user
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setSelectedConvId(null);
    }
  }, [user?.id]);

  // Fetch messages when conversation selection changes
  useEffect(() => {
    if (selectedConvId) {
      fetchChatHistory(selectedConvId);
    } else if (user?.id) {
      setMessages([
        { 
          id: 'welcome', 
          message: `Hello **${user?.full_name || 'Farmer Partner'}**! 🌾\n\nI am **AgriGPT**, your 24/7 agricultural AI advisor. Ask me about crop diseases, organic treatments, soil wellness, or fertilizer schedules. Attach a leaf image for disease diagnosis!`, 
          is_ai: true,
          created_at: new Date()
        }
      ]);
    }
  }, [selectedConvId, user?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchConversations = async () => {
    if (!user?.id) return;
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
    setSelectedImage(null);
    setSidebarOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = (customPrompt || input).trim();
    if ((!messageText && !selectedImage) || sending) return;

    setInput('');
    const imagePayload = selectedImage;
    setSelectedImage(null);
    setSending(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const activeConvId = selectedConvId || `conv_${Date.now()}`;

    // Append user message locally
    const userMsg = {
      id: Date.now(),
      message: messageText || 'Uploaded image for crop leaf analysis.',
      image_url: imagePayload,
      is_ai: false,
      created_at: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const raw = localStorage.getItem('agrinex-web-auth');
      let token = '';
      if (raw) {
        const parsed = JSON.parse(raw);
        token = parsed?.state?.token || '';
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message: messageText || 'Please analyze this crop leaf image.',
          image_url: imagePayload,
          conversation_id: activeConvId,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiMessageContent = "";
      
      const aiMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          message: "",
          is_ai: true,
          created_at: new Date()
        }
      ]);

      let buffer = "";
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(cleanLine.substring(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.text) {
                  aiMessageContent += data.text;
                  setMessages((prev) => 
                    prev.map((msg) => 
                      msg.id === aiMsgId ? { ...msg, message: aiMessageContent } : msg
                    )
                  );
                }
                if (data.done) {
                  if (data.id) {
                    setMessages((prev) => 
                      prev.map((msg) => 
                        msg.id === aiMsgId ? { ...msg, id: data.id } : msg
                      )
                    );
                  }
                  if (!selectedConvId) {
                    setSelectedConvId(activeConvId);
                    fetchConversations();
                  }
                }
              } catch (parseErr) {
                console.warn("Failed to parse SSE line", parseErr);
              }
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          message: 'Sorry, I encountered a connection error. Please verify server connection and try again.',
          is_ai: true,
          created_at: new Date()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = (msgIndex: number) => {
    const prevUserMsg = [...messages].slice(0, msgIndex).reverse().find((m) => !m.is_ai);
    if (prevUserMsg) {
      handleSendMessage(prevUserMsg.message);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;

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
    <div className="h-[calc(100vh-6.5rem)] bg-white rounded-3xl border border-slate-200 flex overflow-hidden shadow-sm relative">
      
      {/* ─── LEFT SIDEBAR: CONVERSATION LOGS (28% Width) ─── */}
      <aside className={`w-full md:w-[28%] max-w-xs border-r border-slate-200 flex flex-col bg-slate-50/60 shrink-0 absolute md:relative inset-y-0 left-0 z-30 transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0 bg-white' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-brandDark text-sm">Consultation Logs</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewChat}
              className="px-3 py-1.5 rounded-xl bg-primary text-brandDark hover:bg-primary/90 font-extrabold transition-all shadow-xs flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 text-slate-400 hover:text-brandDark">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingConversations ? (
            <div className="py-12 text-center text-textSec text-xs flex justify-center items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading history...</span>
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
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setSidebarOpen(false);
                  }}
                  className={`group w-full p-3 rounded-xl flex items-start justify-between gap-3 text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-brandLight border border-primary/20 text-brandDark font-bold'
                      : 'hover:bg-slate-100/70 border border-transparent text-textSec'
                  }`}
                >
                  <div className="flex gap-2.5 min-w-0 flex-1 items-center">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
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
                          <button onClick={() => handleSaveRename(conv.id)} className="p-1 text-primary hover:bg-slate-100 rounded">
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

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-brandDark/30 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── RIGHT PANEL: MESSAGES & FLOATING INPUT (72% Width) ─── */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        
        {/* Chat Window Header */}
        <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-brandDark">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-brandLight text-primary flex items-center justify-center border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-brandDark">AgriGPT Advisory Assistant</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none mt-0.5">Online & Calibrated</p>
            </div>
          </div>
          
          <button 
            onClick={handleCreateNewChat}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-brandDark text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Independent Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/20">
          {messages.map((m, idx) => {
            const isAI = m.is_ai;
            return (
              <div 
                key={m.id || idx} 
                className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border shadow-xs text-xs font-bold ${
                    isAI ? 'bg-brandLight border-primary/20 text-primary' : 'bg-brandDark border-brandDark text-white'
                  }`}>
                    {isAI ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-white" />}
                  </div>

                  {/* Bubble Container */}
                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl shadow-xs text-xs leading-relaxed relative group ${
                      isAI 
                        ? 'bg-white border border-slate-200 text-brandDark rounded-tl-xs border-l-4 border-l-primary'
                        : 'bg-brandDark text-white rounded-tr-xs font-medium'
                    }`}>
                      {m.image_url && (
                        <img 
                          src={m.image_url} 
                          alt="Crop scan attach" 
                          className="max-h-48 rounded-xl object-cover mb-3 border border-slate-200" 
                        />
                      )}
                      
                      {isAI ? <RenderMarkdown content={m.message} /> : m.message}
                    </div>

                    {/* Action Bar (Copy & Regenerate for AI responses) */}
                    {isAI && (
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pl-1">
                        <button
                          onClick={() => copyToClipboard(m.message, m.id)}
                          className="flex items-center gap-1 hover:text-brandDark transition-colors"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => handleRegenerate(idx)}
                          className="flex items-center gap-1 hover:text-brandDark transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {sending && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[75%]">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-primary/20 bg-brandLight">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-xs border-l-4 border-l-primary flex items-center gap-1.5 shadow-xs">
                  <span className="text-xs font-bold text-textSec">AgriGPT is reasoning...</span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span 
                        key={i} 
                        className="w-1.5 h-1.5 bg-primary rounded-full" 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── FIXED FLOATING INPUT COMPOSER AT BOTTOM ─── */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          
          {/* Selected Image Thumbnail Preview */}
          {selectedImage && (
            <div className="mb-3 p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between max-w-xs">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="preview" className="w-10 h-10 rounded-xl object-cover" />
                <span className="text-xs font-bold text-brandDark truncate">Selected Crop Image</span>
              </div>
              <button onClick={() => setSelectedImage(null)} className="p-1 text-slate-400 hover:text-rose">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 rounded-2xl p-2.5 shadow-sm transition-all flex flex-col gap-2">
            
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask AgriGPT anything about your crops... (Shift+Enter for newline, Enter to send)"
              className="w-full text-xs text-brandDark placeholder-slate-400 outline-none resize-none max-h-32 px-2 leading-relaxed bg-transparent"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending}
            />

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1">
              
              {/* Attachment & Voice Buttons */}
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors"
                  title="Attach Crop Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="px-4 py-2 rounded-xl bg-primary text-brandDark font-extrabold text-xs hover:bg-primary/90 disabled:opacity-40 transition-all shadow-xs flex items-center gap-1.5"
                disabled={(!input.trim() && !selectedImage) || sending}
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>

          <div className="text-[10px] text-textSec text-center mt-2 font-medium">
            AgriGPT provides instant agricultural guidance calibrated with AgriNex backend engines.
          </div>

        </div>

      </div>

    </div>
  );
}
