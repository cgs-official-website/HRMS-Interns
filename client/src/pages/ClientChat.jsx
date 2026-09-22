import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getExternalLinkByToken, subscribeToMessages, sendChatMessage, uploadFileToFirebase } from "../firebase";
import { Send, User, Building, AlertCircle, Calendar, Lock, Paperclip, X, FileText, Image as ImageIcon, Download, ExternalLink } from "lucide-react";
import { useToast } from "../context/ToastContext";

export default function ClientChat() {
  const { linkToken } = useParams();
  const [linkData, setLinkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchLink = async () => {
      try {
        setLoading(true);
        const data = await getExternalLinkByToken(linkToken);
        if (!data) {
          setError("This link is invalid or has expired.");
        } else if (data.status === "revoked") {
          setError("This link has been revoked by the administrator.");
        } else {
          setLinkData(data);
        }
      } catch (err) {
        setError("Failed to load chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (linkToken) fetchLink();
  }, [linkToken]);

  useEffect(() => {
    if (linkData && linkData.channelId) {
      const unsub = subscribeToMessages(linkData.channelId, linkData.companyId, (fetchedMessages) => {
        setMessages(fetchedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
      });
      return () => unsub();
    }
  }, [linkData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast("File size must be under 25MB", "error");
      return;
    }

    setSelectedFile(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !linkData) return;

    const text = newMessage;
    const currentFile = selectedFile;
    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      let filePayload = null;
      if (currentFile) {
        setUploadingFile(true);
        const dataUrl = await uploadFileToFirebase(currentFile);
        filePayload = {
          name: currentFile.name,
          size: (currentFile.size / (1024 * 1024)).toFixed(2) + " MB",
          mimeType: currentFile.type,
          url: dataUrl,
          dataUrl: dataUrl
        };
      }

      await sendChatMessage(
        linkData.channelId,
        text,
        linkData.clientEmail,
        linkData.clientName || "Client",
        "",
        null,
        filePayload ? [filePayload] : [],
        linkData.companyId
      );
    } catch (err) {
      showToast("Failed to send message", "error");
      setNewMessage(text);
      setSelectedFile(currentFile);
    } finally {
      setUploadingFile(false);
    }
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const renderFileCard = (file, isMe) => {
    if (!file) return null;
    const isImage = file.mimeType?.startsWith("image/") || file.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "");
    const fileUrl = file.url || file.dataUrl || file.fileUrl;

    return (
      <div className="mt-2 flex flex-col gap-1.5">
        {isImage && fileUrl && (
          <div className="rounded-xl overflow-hidden max-w-sm border border-border-card/40 bg-black/10 shadow-sm">
            <img src={fileUrl} alt={file.name || "Attachment"} className="w-full max-h-60 object-cover hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => window.open(fileUrl, '_blank')} />
          </div>
        )}
        <div className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${isMe ? "bg-white/10 border-white/20 text-white" : "bg-bg-base/80 border-border-card text-text-main"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMe ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary"}`}>
              {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate max-w-[180px]">{file.name || "Attachment"}</p>
              <p className="text-[10px] opacity-75">{file.size || "File"}</p>
            </div>
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              download={file.name || "download"}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 rounded-lg transition-colors ${isMe ? "hover:bg-white/20 text-white" : "hover:bg-brand-primary/10 text-brand-primary"}`}
              title="Download File"
            >
              <Download size={14} />
            </a>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base p-6">
        <div className="max-w-md w-full bg-bg-card rounded-[24px] border border-border-card p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-text-main mb-4">Access Denied</h2>
          <p className="text-text-mut mb-8">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-bg-base font-outfit overflow-hidden">
      {/* Header */}
      <header className="bg-bg-card/80 backdrop-blur-xl border-b border-border-card px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm z-20 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-violet-500 to-emerald-500"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-primary/20 to-violet-500/20 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner border border-brand-primary/20">
            <Building size={24} className="drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-xl font-black text-text-main tracking-tight drop-shadow-sm">Project: {linkData.projectName}</h1>
            <p className="text-xs font-bold text-text-mut flex items-center gap-2 mt-0.5">
              <User size={12} className="text-brand-primary" />
              Project Manager: {linkData.pmName}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 bg-bg-base/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-border-card shadow-inner">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-bold text-text-main">Securely connected as {linkData.clientName}</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-bg-base to-bg-base pointer-events-none -z-10"></div>
        
        <div className="max-w-4xl mx-auto flex flex-col space-y-6 z-10">
          <div className="text-center my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-card/50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 backdrop-blur-md rounded-full border border-brand-primary/20 shadow-sm">
                Client Collaboration Channel • {new Date(linkData.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {messages.map((msg, idx) => {
            const isMe = msg.senderId === linkData.clientEmail || msg.user_id === linkData.clientEmail;
            const showDate = idx === 0 || !isSameDay(messages[idx - 1].timestamp || messages[idx - 1].created_at, msg.timestamp || msg.created_at);
            const rawMsgText = msg.text || msg.content;
            const fileAttachment = msg.fileData || (msg.file_url ? { url: msg.file_url, name: msg.file_name || "Attachment", type: msg.file_type } : null) || (Array.isArray(msg.attachments) ? msg.attachments[0] : null);

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-6">
                    <span className="px-4 py-1.5 bg-bg-card/80 backdrop-blur-sm border border-border-card text-text-sec text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-2 shadow-sm">
                      <Calendar size={12} className="text-text-mut" />
                      {new Date(msg.timestamp || msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-3`}>
                    {!isMe && (
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-bg-card to-bg-base flex items-center justify-center text-text-main flex-shrink-0 font-black text-sm border border-border-card shadow-sm mb-1 relative">
                        {linkData.pmName.charAt(0).toUpperCase()}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-bg-base rounded-full"></div>
                      </div>
                    )}
                    
                    <div className="flex flex-col max-w-full">
                      <div className={`mb-1.5 flex items-center ${isMe ? "justify-end" : "justify-start"} gap-2 px-1`}>
                        <span className="text-[11px] font-bold text-text-sec">
                          {isMe ? "You" : (msg.senderName || linkData.pmName)}
                        </span>
                        <span className="text-[9px] font-medium text-text-mut">{formatMessageTime(msg.timestamp || msg.created_at)}</span>
                      </div>
                      
                      <div className={`p-4 rounded-[24px] shadow-sm relative group ${
                        isMe 
                          ? "bg-gradient-to-br from-brand-primary to-brand-hover text-white rounded-br-sm shadow-brand-primary/25 border border-white/10" 
                          : "bg-bg-card/90 backdrop-blur-sm border border-border-card text-text-main rounded-bl-sm shadow-md"
                      }`}>
                        {rawMsgText && (
                          <p className={`text-[15px] ${isMe ? "font-medium" : "font-medium leading-relaxed"}`} style={{ wordBreak: 'break-word' }}>
                            {rawMsgText}
                          </p>
                        )}
                        {fileAttachment && renderFileCard(fileAttachment, isMe)}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area with File Sharing */}
      <footer className="bg-bg-base/80 backdrop-blur-xl border-t border-border-card p-4 sm:p-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative">
        <div className="max-w-4xl mx-auto">
          {/* Selected File Chip */}
          {selectedFile && (
            <div className="mb-2.5 p-2 px-3 bg-brand-primary/10 border border-brand-primary/30 rounded-[14px] flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                <Paperclip size={14} className="text-brand-primary flex-shrink-0" />
                <span className="font-bold text-text-main truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-text-mut">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1 text-text-mut hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form 
            onSubmit={handleSendMessage} 
            className="flex items-end gap-2 bg-bg-card border border-border-card p-2 sm:p-2.5 rounded-[28px] focus-within:border-brand-primary/60 focus-within:shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.15)] focus-within:ring-4 ring-brand-primary/10 transition-all duration-300"
          >
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.csv"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer flex-shrink-0"
              title="Attach document, image or file (up to 25MB)"
            >
              <Paperclip size={18} />
            </button>

            <div className="flex-1 bg-transparent rounded-[24px]">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message or attach a file to share with PM..."
                className="w-full bg-transparent text-[15px] text-text-main px-2 py-3 outline-none resize-none max-h-[120px] min-h-[48px] custom-scrollbar placeholder:text-text-mut font-medium leading-relaxed"
                rows="1"
                style={{ height: 'auto' }}
              />
            </div>
            
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || uploadingFile}
              className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-hover text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:from-bg-card disabled:to-bg-card disabled:text-text-mut disabled:border disabled:border-border-card disabled:cursor-not-allowed hover:shadow-lg hover:shadow-brand-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 group"
            >
              <Send size={18} className="mr-0.5 mt-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-text-mut font-bold flex items-center justify-center gap-1.5 uppercase tracking-widest opacity-80">
              <Lock size={10} className="text-brand-primary" /> End-to-end secure project chat & file collaboration
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
