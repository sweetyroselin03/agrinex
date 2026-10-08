import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Plus, MessageSquare, Bot, Image as ImageIcon, Paperclip, Loader2 } from 'lucide-react';
import api, { getLocalToken } from '../api/client';
import { API_BASE_URL } from '../config/api';

// Markdown text renderer for AgriGPT responses
const formatMessageText = (text: string) => {
  if (!text) return null;
  let formatted = text
    .replace(/^### (.*?)$/gm, '<h5 class="font-extrabold text-[#185C2B] mt-3 mb-1 text-xs uppercase tracking-wider">$1</h5>')
    .replace(/^## (.*?)$/gm, '<h4 class="font-black text-[#123B24] mt-4 mb-2 text-sm border-b border-[#EEF3E8] pb-1">$1</h4>')
    .replace(/^# (.*?)$/gm, '<h3 class="font-black text-[#123B24] mt-4 mb-2 text-base">$1</h3>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-[#123B24]">$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-[#546E7A]">$1</em>');
  formatted = formatted.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ml-4 list-decimal text-xs my-1 text-[#1A2E1A]">$1</li>');
  formatted = formatted.replace(/^\s*[-*•]\s+(.*?)$/gm, '<li class="ml-4 list-disc text-xs my-1 text-[#1A2E1A]">$1</li>');
  formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-[#EEF3E8] text-[#185C2B] px-1.5 py-0.5 rounded text-xs font-mono font-bold">$1</code>');
  formatted = formatted.split('\n').map((line) => {
    if (line.includes('<h') || line.includes('<li') || line.includes('<code')) return line;
    return line ? line + '<br/>' : '';
  }).join('');
  return <div dangerouslySetInnerHTML={{ __html: formatted }} className="space-y-1 text-xs text-[#1A2E1A] leading-relaxed" />;
};

// SSE streaming helper — unchanged backend connection
async function fetchChatStream(
  messageText: string,
  conversationId: string,
  onToken: (token: string) => void,
  onDone: (data: any) => void,
  onError: (errorMsg: string) => void
) {
  const token = getLocalToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: messageText, conversation_id: conversationId, stream: true }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      onError(errData?.detail || errData?.message || 'AgriGPT is temporarily unavailable. Please retry.');
      return;
    }
    if (!response.body) {
      onError('No response received.');
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
          if (parsed.token) onToken(parsed.token);
          if (parsed.done) onDone(parsed);
        } catch (_) {}
      }
    }
  } catch (err: any) {
    onError(err.message || 'AgriGPT is temporarily unavailable. Please retry.');
  }
}

const quickPrompts = [
  { text: '🌾 Best fertilizer for rice?', prompt: 'What is the best fertilizer application schedule for paddy rice?' },
  { text: '🍅 Tomato disease treatment', prompt: 'How do I identify and treat early and late blight on tomato crops?' },
  { text: '💧 Irrigation schedule', prompt: 'What is an optimal drip irrigation schedule during dry summer weeks?' },
  { text: '🌱 Organic pest control', prompt: 'How can I prepare organic bio-pesticides using neem and cow urine?' },
];

export default function Chatbot() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>(() => `conv_${Date.now()}`);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveStreamText, setLiveStreamText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (raw.length > 0 && !conversations.some((c) => c.id === convId)) {
        setConversations((prev) => [
          {
            id: convId,
            title: raw[0]?.message?.slice(0, 26) || 'Crop Advisory',
            date: new Date().toLocaleDateString(),
          },
          ...prev,
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
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
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
        setMessages((prev) => [
          ...prev,
          {
            id: doneData.id || `ai_${Date.now()}`,
            message: accumulatedAiText,
            is_ai: true,
            created_at: new Date().toISOString(),
          },
        ]);
        setLiveStreamText('');
      },
      (errorMsg) => {
        setIsGenerating(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_err_${Date.now()}`,
            message: errorMsg || 'AgriGPT is temporarily unavailable. Please retry.',
            is_ai: true,
            created_at: new Date().toISOString(),
          },
        ]);
        setLiveStreamText('');
      }
    );
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 min-h-0 font-sans">
      {/* ─── LEFT 250px: CONVERSATION HISTORY SIDEBAR ─── */}
      <div className="hidden md:flex flex-col w-[250px] farm-card p-4 shrink-0 min-h-0">
        <button
          onClick={startNewChat}
          className="btn-primary w-full py-3 text-xs font-bold rounded-2xl mb-4 flex items-center justify-center gap-2 shadow-farm-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Chat</span>
        </button>

        <p className="text-[10px] font-black uppercase tracking-wider text-[#546E7A] px-2 mb-2">
          Past Consultations
        </p>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#546E7A] space-y-2">
              <Bot className="w-7 h-7 text-[#A7D96A] mx-auto" />
              <p>No past conversations. Ask your first agronomy query!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#EEF3E8] border-l-4 border-[#185C2B] text-[#123B24] font-bold shadow-farm-sm'
                      : 'hover:bg-[#F5F7EF] text-[#1A2E1A]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#185C2B] shrink-0" />
                    <span className="text-xs truncate">{conv.title}</span>
                  </div>
                  <span className="text-[10px] text-[#546E7A] pl-5 block mt-0.5">{conv.date}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── CENTER FLEX: CHAT MESSAGES ─── */}
      <div className="flex-1 flex flex-col farm-card overflow-hidden min-h-0 min-w-0">
        {/* Header (NO provider attribution shown) */}
        <div className="px-6 py-4 border-b border-[#EEF3E8] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            {/* AgriGPT Avatar */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-2xl shadow-farm-sm border border-white/20">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#123B24]">AgriGPT</h2>
                <span className="text-xs text-[#546E7A] font-semibold hidden sm:inline">
                  • Your AI Agricultural Advisor
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#185C2B] animate-ping" />
                <span className="text-[11px] font-bold text-[#185C2B]">ACTIVE</span>
              </div>
            </div>
          </div>

          <button
            onClick={startNewChat}
            title="Start New Chat"
            className="p-2 rounded-xl text-[#546E7A] hover:text-[#123B24] hover:bg-[#EEF3E8] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-[#F5F7EF]/50">
          {/* Empty state */}
          {messages.length === 0 && !isGenerating && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#EEF3E8] flex items-center justify-center text-4xl shadow-farm-sm animate-float-1">
                🌾
              </div>
              <div>
                <h3 className="text-lg font-black text-[#123B24]">Consult AgriGPT</h3>
                <p className="text-xs text-[#546E7A] leading-relaxed mt-1">
                  Ask questions about crop diseases, pest mitigation, fertilizer schedules, or soil conditioning.
                </p>
              </div>

              {/* Mobile Quick Prompts Chips */}
              <div className="lg:hidden flex flex-wrap justify-center gap-2 mt-2">
                {quickPrompts.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q.prompt)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#123B24] border border-[#EEF3E8] shadow-sm hover:bg-[#EEF3E8] transition-all"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, i) => {
            const isAi = msg.is_ai;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-sm mr-2.5 shrink-0 mt-auto shadow-sm">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[82%] sm:max-w-[72%] px-4 py-3.5 text-xs ${
                    isAi
                      ? 'bg-white border border-[#EEF3E8] border-l-4 border-l-[#185C2B] text-[#1A2E1A] shadow-farm-sm rounded-[20px_20px_20px_4px]'
                      : 'text-white rounded-[20px_20px_4px_20px] shadow-farm-md'
                  }`}
                  style={
                    !isAi
                      ? { background: 'linear-gradient(135deg, #123B24 0%, #185C2B 100%)' }
                      : {}
                  }
                >
                  {isAi ? formatMessageText(msg.message) : msg.message}
                </div>
                {!isAi && (
                  <div className="w-8 h-8 rounded-xl bg-[#EEF3E8] flex items-center justify-center text-sm ml-2.5 shrink-0 mt-auto">
                    👤
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Streaming token display */}
          {isGenerating && liveStreamText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-sm mr-2.5 shrink-0 mt-auto">
                🤖
              </div>
              <div className="max-w-[82%] sm:max-w-[72%] px-4 py-3.5 bg-white border border-[#EEF3E8] border-l-4 border-l-[#185C2B] text-[#1A2E1A] shadow-farm-sm rounded-[20px_20px_20px_4px] text-xs">
                {formatMessageText(liveStreamText)}
                <span className="inline-block w-1.5 h-3.5 bg-[#185C2B] ml-1 animate-pulse rounded-sm" />
              </div>
            </motion.div>
          )}

          {/* Typing indicator (3 bouncing dots) */}
          {isGenerating && !liveStreamText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#123B24] to-[#185C2B] flex items-center justify-center text-sm mr-2.5 shrink-0">
                🤖
              </div>
              <div className="px-4 py-3 bg-white border border-[#EEF3E8] rounded-[20px_20px_20px_4px] flex items-center gap-3 shadow-farm-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#185C2B] animate-typing-1" />
                  <span className="w-2 h-2 rounded-full bg-[#185C2B] animate-typing-2" />
                  <span className="w-2 h-2 rounded-full bg-[#185C2B] animate-typing-3" />
                </div>
                <span className="text-xs font-semibold text-[#185C2B]">AgriGPT is reasoning...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Rounded Pill Input Bar */}
        <div className="p-4 border-t border-[#EEF3E8] bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-[#F5F7EF] rounded-full px-3 py-1.5 border border-[#EEF3E8] focus-within:border-[#185C2B] focus-within:ring-2 focus-within:ring-[#185C2B]/15 transition-all"
          >
            <button
              type="button"
              onClick={() => alert('Photo attachment: You can also use the AI Crop Diagnostic page for full leaf pathology analysis!')}
              title="Attach photo"
              className="p-2 rounded-full text-[#546E7A] hover:text-[#123B24] hover:bg-white transition-all shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask AgriGPT anything about your crops, soil, pests..."
              disabled={isGenerating}
              className="flex-1 bg-transparent px-2 py-2 text-xs text-[#1A2E1A] placeholder-[#546E7A] outline-none"
            />

            <motion.button
              type="submit"
              disabled={isGenerating || !inputMessage.trim()}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-full bg-gradient-to-r from-[#123B24] to-[#185C2B] text-white disabled:opacity-40 shrink-0 shadow-farm-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </div>

      {/* ─── RIGHT 200px: QUICK PROMPTS ─── */}
      <div className="hidden lg:flex flex-col w-[200px] farm-card p-4 shrink-0 min-h-0">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#123B24] flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#F9A825]" />
          <span>Quick Prompts</span>
        </h4>

        <div className="space-y-2.5 overflow-y-auto no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q.prompt)}
              disabled={isGenerating}
              className="w-full text-left p-3 rounded-2xl bg-[#F5F7EF] hover:bg-[#EEF3E8] text-xs font-semibold text-[#1A2E1A] border border-[#EEF3E8] transition-all disabled:opacity-50 group cursor-pointer"
            >
              <p className="text-xs font-bold group-hover:text-[#185C2B] transition-colors">{q.text}</p>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-[#EEF3E8]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#185C2B] animate-ping" />
            <span className="text-[10px] font-bold text-[#185C2B]">Llama 3 Streaming Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
