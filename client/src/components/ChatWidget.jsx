import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, Bot } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatTypingIndicator from './ChatTypingIndicator';
import { QUICK_REPLIES } from '../data/knowledgeBase';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const { messages, isLoading, sendUserMessage, clearChat } = useChat();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(1); // Start with 1 for the welcome message
  const prevMessagesLength = useRef(messages.length);

  // Track unread messages when widget is closed
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    } else {
      if (messages.length > prevMessagesLength.current) {
        const diff = messages.length - prevMessagesLength.current;
        setUnreadCount(prev => prev + diff);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    setShowQuickReplies(false);
    await sendUserMessage(text);
  };

  const handleQuickReply = async (reply) => {
    setShowQuickReplies(false);
    await sendUserMessage(reply);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChat();
    setShowQuickReplies(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div 
        drag 
        dragMomentum={false} 
        className="fixed bottom-5 right-5 z-[9999]" 
        style={{ touchAction: "none" }}
      >
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.button
              key="open-btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsOpen(true)}
              className="relative rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 shadow-2xl shadow-blue-900/50 flex items-center justify-center cursor-pointer border border-white/10 transition-shadow duration-300"
              style={{ width: '56px', height: '56px' }}
              aria-label="Open Zuna AI Chat"
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping pointer-events-none" />
              {/* Robot icon */}
              <Bot className="w-6.5 h-6.5 text-white relative z-10" />
              {/* AI Badge */}
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-[9px] font-black shadow-md border border-emerald-400/20">
                AI
              </span>
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-2 -left-2 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-[0_4px_12px_rgba(244,63,94,0.4)] border border-white/20 z-20 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Window — premium & spacious */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 right-0 w-[calc(100vw-40px)] sm:w-[380px] h-[calc(100vh-100px)] sm:h-[540px] max-h-[580px] max-w-[420px] flex flex-col rounded-2xl overflow-hidden
                shadow-[0_20px_50px_rgba(59,130,246,0.25)] shadow-black/80
                bg-gradient-to-b from-[#0a0f1d] via-[#070b16] to-[#04060d]
                border border-white/10"
              style={{ transformOrigin: 'bottom right' }}
            >
              {/* ── Header ── */}
              <div className="relative px-4 py-3.5 bg-gradient-to-r from-blue-950/90 via-[#0a0f1d]/95 to-indigo-950/90 border-b border-white/10 backdrop-blur-xl flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Robot avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0 border border-white/10">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    {/* Name + status */}
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-bold text-sm tracking-tight text-white leading-none bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        Zuna AI
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 text-[11px] font-medium leading-none">Online • CGS Assistant</span>
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleClear}
                      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200"
                      title="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Messages Area ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && <ChatTypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Quick Replies ── */}
              <AnimatePresence>
                {showQuickReplies && messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-4 pb-3 flex flex-row gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory justify-start w-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleQuickReply(reply)}
                        className="text-[11px] px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/50 hover:text-white transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 shadow-sm snap-start flex-shrink-0"
                      >
                        {reply}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Input Area ── */}
              <div className="px-4 py-3 border-t border-white/10 bg-[#080d19]/80 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl border border-white/10 px-4 py-2.5 focus-within:border-blue-500/40 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all duration-200">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Carrezza Global..."
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none resize-none leading-relaxed max-h-24 overflow-y-auto"
                    style={{ scrollbarWidth: 'none' }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200
                      ${inputValue.trim() && !isLoading
                        ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:scale-105 active:scale-95'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                      }`}
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] tracking-wider text-gray-500 text-center mt-2 font-medium uppercase">
                  Zuna AI • Powered by Gemini
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

