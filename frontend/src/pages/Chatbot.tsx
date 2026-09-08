import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Plus, 
  MessageSquare, 
  Loader2, 
  Bot,
  Zap,
  Leaf
} from 'lucide-react';
import api, { getLocalToken } from '../api/client';
import { API_BASE_URL } from '../config/api';

// Structured Markdown parser for Llama AI agronomist responses
const formatMessageText = (text: string) => {
  if (!text) return null;
  
  let formatted = text
    .replace(/^### (.*?)$/gm, '<h5 class="font-extrabold text-[#1B5E20] mt-3 mb-1 text-xs uppercase tracking-wider">$1</h5>')
    .replace(/^## (.*?)$/gm, '<h4 class="font-black text-[#1A2E1A] mt-4 mb-2 text-sm border-b border-[#E0E7DE] pb-1">$1</h4>')
    .replace(/^# (.*?)$/gm, '<h3 class="font-black text-[#1A2E1A] mt-5 mb-3 text-base">$1</h3>');
  
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-[#1B5E20]">$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-[#546E7A]">$1</em>');
  formatted = formatted.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ml-4 list-decimal text-xs my-1 text-[#1A2E1A]">$1</li>');
  formatted = formatted.replace(/^\s*[-*•]\s+(.*?)$/gm, '<li class="ml-4 list-disc text-xs my-1 text-[#1A2E1A]">$1</li>');
  formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-[#E8F5E9] text-[#1B5E20] px-1.5 py-0.5 rounded text-xs font-mono font-bold">$1</code>');
  
  formatted = formatted.split('\n').map(line => {
    if (line.includes('<h') || line.includes('<li') || line.includes('<code')) {
      return line;
    }
    return line ? line + '<br/>' : '';
  }).join('');

  return <div dangerouslySetInnerHTML={{ __html: formatted }} className="space-y-1 text-xs text-[#1A2E1A] leading-relaxed" />;
};

// SSE streaming reader helper
async function fetchChatStream(
  messageText: string,
  conversationId: string,
  onToken: (token: string) => void,
  onDone: (data: any) => void,
  onError: (errorMsg: string) => void
) {
  const token = getLocalToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: messageText,
        conversation_id: conversationId,
        stream: true
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const msg = errData?.detail || errData?.message || 'AgriGPT is experiencing high demand. Please try again in a moment.';
      onError(msg);
      return;
    }

    if (!response.body) {
      onError('No response received from Llama service.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        const dataStr = line.replace('data: ', '').trim();
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.token) {
            onToken(parsed.token);
          }
          if (parsed.done) {
            onDone(parsed);
          }
        } catch (_) {}
      }
    }
  } catch (err: any) {
    onError(err.message || 'Network communication error with AgriGPT.');
  }
}

export default function Chatbot() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>(() => `conv_${Date.now()}`);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveStreamText, setLiveStreamText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { text: "Best fertilizer dosage for paddy rice?", icon: "🌾" },
    { text: "Tomato early blight organic treatment", icon: "🍅" },
    { text: "Smart drip irrigation scheduling", icon: "💧" },
    { text: "Neem oil organic pest control recipe", icon: "🌱" },
    { text: "Wheat Rabi season field prep tips", icon: "🌤️" },
    { text: "Cotton bollworm bio-management", icon: "🛡️" },
  ];

  useEffect(() => {
    fetchHistory(activeConvId);
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveStreamText, isGenerating]);

  const fetchHistory = async (convId: string) => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/chat/history', { params: { conversation_id: convId } });
      const raw = Array.isArray(res.data) ? res.data : [];
      setMessages(raw);

      // Track conversations in left list
      if (raw.length > 0 && !conversations.some(c => c.id === convId)) {
        setConversations(prev => [
          {
            id: convId,
            title: raw[0]?.message?.slice(0, 30) || 'Crop Advisory',
            date: new Date().toLocaleDateString()
          },
          ...prev
        ]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewChat = () => {
    const newId = `conv_${Date.now()}`;
    setActiveConvId(newId);
    setMessages([]);
    setLiveStreamText('');
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isGenerating) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      message: textToSend,
      is_ai: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsGenerating(true);
    setLiveStreamText('');

    let accumulatedAiText = '';

    await fetchChatStream(
      textToSend,
      activeConvId,
      (token) => {
        accumulatedAiText += token;
        setLiveStreamText(accumulatedAiText);
      },
      (doneData) => {
        setIsGenerating(false);
        const finalAiMsg = {
          id: doneData.id || `ai_${Date.now()}`,
          message: accumulatedAiText,
          is_ai: true,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, finalAiMsg]);
        setLiveStreamText('');
      },
      (errorMsg) => {
        setIsGenerating(false);
        const fallbackMsg = {
          id: `ai_err_${Date.now()}`,
          message: errorMsg || 'AgriGPT is experiencing high demand. Please try again in a moment.',
          is_ai: true,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, fallbackMsg]);
        setLiveStreamText('');
      }
    );
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-5">

      {/* ─── LEFT COLUMN (250px): CONVERSATION HISTORY ─── */}
      <div className="hidden md:flex flex-col w-64 bg-white rounded-[22px] border border-[#E0E7DE] p-4 shadow-sm shrink-0">
        <button
          onClick={startNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all mb-4 hover:shadow-lg hover:scale-102"
          style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ New Agronomy Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          <p className="text-[10px] font-black uppercase text-[#546E7A] tracking-wider px-2 mb-2">Past Consultations</p>
          
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#546E7A]">
              No past chats. Start asking crop questions!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#E8F5E9] border-l-4 border-[#2E7D32] text-[#1B5E20] font-bold shadow-sm'
                      : 'hover:bg-[#F1F8E9] text-[#1A2E1A]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span className="text-xs truncate">{conv.title}</span>
                  </div>
                  <span className="text-[10px] text-[#546E7A] pl-5 block mt-0.5">{conv.date}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── MIDDLE COLUMN (FLEX): CHAT MESSAGES & INPUT ─── */}
      <div className="flex-1 flex flex-col bg-white rounded-[24px] border border-[#E0E7DE] shadow-sm overflow-hidden">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-[#E0E7DE] flex items-center justify-between bg-gradient-to-r from-white to-[#F1F8E9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1B5E20] to-[#66BB6A] flex items-center justify-center text-2xl shadow-inner text-white">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#1A2E1A]">AgriGPT Advisory Engine</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] text-[10px] font-extrabold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#F9A825]" /> Powered by Llama AI
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-ping"></span>
                <span className="text-[11px] font-bold text-[#2E7D32]">ACTIVE • Multi-lingual Agronomist</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F1F8E9]/30">
          
          {messages.length === 0 && !isGenerating && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#E8F5E9] flex items-center justify-center text-3xl shadow-sm animate-bounce">
                🌾
              </div>
              <h3 className="text-lg font-black text-[#1A2E1A]">Welcome to AgriGPT Advisory</h3>
              <p className="text-xs text-[#546E7A] leading-relaxed">
                Powered by Llama 3.3 70B AI. Ask questions regarding crop diseases, chemical & organic treatments, weather risks, and yield enhancement.
              </p>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg, i) => {
            const isAi = msg.is_ai;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 text-xs ${
                    isAi
                      ? 'bg-white border-l-4 border-[#66BB6A] text-[#1A2E1A] shadow-[0_4px_15px_rgba(27,94,32,0.06)] rounded-[20px_20px_20px_4px]'
                      : 'text-white rounded-[20px_20px_4px_20px] shadow-md'
                  }`}
                  style={!isAi ? { background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' } : {}}
                >
                  {isAi ? formatMessageText(msg.message) : msg.message}
                </div>
              </motion.div>
            );
          })}

          {/* Live Streaming Response */}
          {isGenerating && liveStreamText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] sm:max-w-[75%] p-4 bg-white border-l-4 border-[#66BB6A] text-[#1A2E1A] shadow-md rounded-[20px_20px_20px_4px] text-xs">
                {formatMessageText(liveStreamText)}
              </div>
            </motion.div>
          )}

          {/* Typing Indicator */}
          {isGenerating && !liveStreamText && (
            <div className="flex items-center gap-2 p-3 bg-white border border-[#E0E7DE] rounded-2xl w-fit text-xs text-[#2E7D32] font-bold shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>AgriGPT is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#E0E7DE] bg-white">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask AgriGPT about pests, fungicides, fertilizers, soil health..."
              disabled={isGenerating}
              className="flex-1 rounded-full bg-[#F1F8E9] border border-[#E0E7DE] px-5 py-3.5 text-xs text-[#1A2E1A] placeholder-[#546E7A] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-all"
            />
            <button
              type="submit"
              disabled={isGenerating || !inputMessage.trim()}
              className="px-6 py-3.5 rounded-full text-white font-bold text-xs shadow-md transition-all disabled:opacity-40 flex items-center gap-2 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* ─── RIGHT COLUMN (200px): QUICK SUGGESTIONS ─── */}
      <div className="hidden lg:flex flex-col w-56 bg-white rounded-[22px] border border-[#E0E7DE] p-4 shadow-sm shrink-0 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#1A2E1A] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F9A825]" />
          <span>Quick Inquiries</span>
        </h4>

        <div className="space-y-2 overflow-y-auto">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.text)}
              disabled={isGenerating}
              className="w-full text-left p-3 rounded-xl bg-[#F1F8E9] hover:bg-[#E8F5E9] hover:scale-102 text-xs font-semibold text-[#1A2E1A] border border-[#E0E7DE] transition-all"
            >
              <div className="flex items-start gap-2">
                <span className="text-base">{p.icon}</span>
                <span className="text-[11px] leading-tight text-[#1A2E1A]">{p.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
