import { Bot } from 'lucide-react';

export default function ChatTypingIndicator() {
  return (
    <div className="flex gap-3 items-end mb-4 animate-fade-in">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white border border-white/10">
        <Bot className="w-4.5 h-4.5" />
      </div>
      {/* Typing bubble */}
      <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-blue-400/80 animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '0.8s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-blue-400/80 animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '0.8s' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-blue-400/80 animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '0.8s' }}
          />
        </div>
      </div>
    </div>
  );
}
