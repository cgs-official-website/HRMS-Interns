import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, AlertCircle, Bot } from 'lucide-react';

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ChatMessage({ message, compact = false }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  const renderMessageText = (text) => {
    if (!text) return null;
    const parts = text.split(/(https?:\/\/[^\s]+|@[\w.-]+)/g);
    return parts.map((part, i) => {
      if (part.match(/^https?:\/\/[^\s]+$/)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 opacity-90 hover:opacity-100 break-all transition-opacity">
            {part}
          </a>
        );
      }
      if (part.match(/^@[\w.-]+$/)) {
        return (
          <strong key={i} className={`px-1 py-0.5 rounded-[4px] mx-0.5 font-bold ${isUser ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
            {part}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const processedContent = (!isUser && !isError) 
    ? message.content.replace(/(@[\w.-]+)/g, '**$1**') 
    : message.content;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white border border-white/10">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}

      {/* Bubble */}
      <div className="max-w-[85%] group">
        <div
          className={`
            relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md transition-colors duration-200
            ${isUser
              ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white rounded-br-sm border border-blue-500/20 shadow-blue-500/5'
              : isError
              ? 'bg-red-950/40 border border-red-500/30 text-red-300 rounded-bl-sm'
              : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] text-gray-200 backdrop-blur-sm rounded-bl-sm shadow-black/10'
            }
          `}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{renderMessageText(message.content)}</div>
          ) : isError ? (
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p>{message.content}</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none
              [&>*]:text-sm [&>p]:my-1 [&>ul]:my-1 [&>ul]:pl-0 [&>ul]:list-none [&>li]:my-1
              [&>strong]:text-blue-300 [&>strong]:font-semibold
              [&>h1]:text-blue-200 [&>h2]:text-blue-200 [&>h3]:text-blue-200
              [&>a]:text-blue-400 hover:[&>a]:underline [&>code]:text-blue-300 [&>code]:bg-black/30 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-mono [&>code]:text-xs [&>p]:text-gray-200">
              <ReactMarkdown
                components={{
                  li: ({ node, ...props }) => (
                    <li className="flex items-start gap-1.5" {...props}>
                      <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{props.children}</span>
                    </li>
                  )
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <p className={`text-[10px] text-gray-600 mt-1 ${isUser ? 'text-right pr-1' : 'text-left pl-1'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-black shadow border border-white/10">
          Y
        </div>
      )}
    </div>
  );
}
