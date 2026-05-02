import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'How to avoid metro construction on Wardha Road?',
  'Best route from Sitabuldi to Airport?',
  'Current traffic at LIC Chowk?',
  'Route from Dharampeth to MIHAN?',
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Nagpur SmartRoute AI assistant. Ask me about routes, traffic, or construction zones in Nagpur and I\'ll help you navigate safely.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${supabaseUrl}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ message, history }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error === 'Gemini API key not configured'
            ? 'The AI service is not yet configured. Please add a Gemini API key to enable chat.'
            : 'Sorry, I encountered an error. Please try again.',
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try again in a moment.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-800 rotate-0'
            : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/25'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-140px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-in-up">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">SmartRoute AI</h3>
              <p className="text-[11px] text-blue-200">Powered by Gemini</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px] text-blue-200">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {msg.role === 'assistant' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-white text-slate-700 border border-slate-200 rounded-tl-md shadow-sm'
                    : 'bg-blue-600 text-white rounded-tr-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-3.5 py-3 bg-white rounded-2xl rounded-tl-md border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-xs text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex-shrink-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">Quick questions</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about routes, traffic..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
