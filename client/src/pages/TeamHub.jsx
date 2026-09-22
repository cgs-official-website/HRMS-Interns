import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from 'emoji-picker-react';
import {
  Hash, MessageSquare, Plus, Send, Paperclip, X, Search,
  Users, ChevronRight, LogIn, LogOut, Trash2, ExternalLink,
  AlertCircle, Check, Lock, RefreshCw, ArrowLeft, UserPlus, Download, Copy, Forward, Smile,
  Pin, PinOff, Clock, Calendar
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useModal } from "../context/ModalContext";
import {
  subscribeToChannels,
  joinChannel,
  leaveChannel,
  createChannel,
  deleteChannel,
  sendChatMessage,
  subscribeToMessages,
  getOrCreateDmThread,
  subscribeToDmThreads,
  deleteChatMessage,
  deleteChatMessageForMe,
  pinChatMessage,
  unpinChatMessage,
  pinChatThread,
  unpinChatThread,
  getAllRegisteredUsers,
  subscribeToAllMessages,
  uploadFileToFirebase,
  markThreadAsRead
} from "../firebase";
import { formatFileSize, getFileIcon } from "../utils/fileUtils";
import FileCard from "../components/FileCard";

// ─── Helpers ─────────────────────────────────────────────────
const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(p => p[0]).join("").substring(0, 2).toUpperCase() || "U";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateGroup = (iso) => {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

const formatPinExpiry = (pinExpiresAt) => {
  if (!pinExpiresAt) return "Pinned";
  const diffMs = new Date(pinExpiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `Expires in ${diffHours}h`;
  const diffDays = Math.ceil(diffHours / 24);
  return `Expires in ${diffDays}d`;
};

// ─── Avatar Component ─────────────────────────────────────────
function Avatar({ src, name, size = "w-8 h-8", textSize = "text-xs" }) {
  return (
    <div className={`${size} rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold ${textSize} uppercase overflow-hidden flex-shrink-0 border border-brand-primary/30`}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : getInitials(name)}
    </div>
  );
}

// ─── Pin Duration Modal (1 Day, 7 Days, 30 Days) ──────────────
function PinDurationModal({ target, onPin, onUnpin, onClose }) {
  const [selectedDuration, setSelectedDuration] = useState(7); // default 7 days
  const isCurrentlyPinned = target?.isPinned || !!target?.isThreadPinned;

  const durationOptions = [
    {
      days: 1,
      label: "24 Hours (1 Day)",
      desc: "Great for quick announcements & daily focus",
      icon: Clock,
      badge: "Quick"
    },
    {
      days: 7,
      label: "7 Days (1 Week)",
      desc: "Ideal for weekly targets, sprint items & reminders",
      icon: Calendar,
      badge: "Popular"
    },
    {
      days: 30,
      label: "30 Days (1 Month)",
      desc: "For important guidelines, policies & monthly goals",
      icon: Pin,
      badge: "Extended"
    }
  ];

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-4 animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-bg-card border border-border-card rounded-[22px] p-5 shadow-2xl flex flex-col"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Pin size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-text-main">
                {isCurrentlyPinned ? "Manage Pinned Item" : "Pin Duration"}
              </h3>
              <p className="text-[11px] text-text-mut">How long should this stay pinned?</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-mut hover:text-text-main p-1 rounded-md hover:bg-bg-base cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Target Preview */}
        {target?.text && (
          <div className="mb-3 p-2.5 bg-bg-base/70 border border-border-card rounded-[12px] text-xs text-text-sec line-clamp-2 italic">
            &ldquo;{target.text}&rdquo;
          </div>
        )}
        {target?.name && !target?.text && (
          <div className="mb-3 p-2.5 bg-bg-base/70 border border-border-card rounded-[12px] text-xs text-text-sec font-semibold">
            {target.type === "channel" ? `#${target.displayName || target.name}` : target.name}
          </div>
        )}

        {/* Options */}
        <div className="space-y-2 mb-4">
          {durationOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedDuration === opt.days;
            return (
              <button
                key={opt.days}
                type="button"
                onClick={() => setSelectedDuration(opt.days)}
                className={`w-full p-3 rounded-[14px] border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "border-brand-primary/60 bg-brand-primary/10 shadow-sm"
                    : "border-border-card bg-bg-base/40 hover:bg-bg-base hover:border-border-card/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? "bg-brand-primary text-white" : "bg-bg-card text-text-mut border border-border-card"}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isSelected ? "text-brand-primary" : "text-text-main"}`}>
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-extrabold bg-brand-primary/15 text-brand-primary">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-mut mt-0.5">{opt.desc}</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-brand-primary bg-brand-primary text-white" : "border-text-mut/40"}`}>
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {isCurrentlyPinned && (
            <button
              type="button"
              onClick={() => { onUnpin(target); onClose(); }}
              className="py-2.5 px-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-[12px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <PinOff size={13} /> Unpin
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-border-card rounded-[12px] text-xs font-semibold text-text-sec hover:bg-bg-base cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onPin(target, selectedDuration); onClose(); }}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-[12px] text-xs font-bold hover:opacity-95 shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Pin size={13} /> Pin for {selectedDuration} {selectedDuration === 1 ? "Day" : "Days"}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── Single Message Bubble ────────────────────────────────────
function MessageBubble({ msg, currentUserId, isAdmin, onDelete, onForward, onPin }) {
  const isOwn = msg.senderId === currentUserId;
  const [showActions, setShowActions] = useState(false);
  const pressTimer = React.useRef(null);
  const { showToast } = useToast();

  const isPinnedActive = msg.isPinned && (!msg.pinExpiresAt || new Date(msg.pinExpiresAt) > new Date());

  if (msg.isDeleted) {
    return (
      <div className={`flex gap-3 px-4 py-1.5 rounded-[10px] ${isOwn ? "flex-row-reverse" : ""}`}>
        <Avatar src={msg.senderAvatar} name={msg.senderName} />
        <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold text-text-sec">{isOwn ? "You" : msg.senderName}</span>
            <span className="text-[10px] text-text-mut">{formatTime(msg.timestamp)}</span>
          </div>
          <div className="flex flex-col gap-1 px-3 py-2 rounded-[14px] border border-dashed border-border-card bg-bg-base text-[11px] text-text-mut">
            <div className="flex items-center gap-1.5 italic">
              <AlertCircle size={11} className="flex-shrink-0 text-red-500" />
              <span>This message was deleted {msg.deletedBy ? `by ${msg.deletedBy}` : ""}</span>
            </div>
            {isAdmin && msg.text && (
              <span className="text-[11px] line-through text-text-mut opacity-75">
                {msg.text}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handlePressStart = () => {
    if (isAdmin || isOwn) {
      pressTimer.current = setTimeout(() => {
        onDelete(msg.id);
      }, 500);
    }
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

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
          <strong key={i} className={`px-1 py-0.5 rounded-[4px] mx-0.5 font-bold ${isOwn ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
            {part}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      id={`msg-${msg.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 px-4 py-1.5 hover:bg-bg-base/40 group relative rounded-[10px] transition-all ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); handlePressEnd(); }}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchMove={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
    >
      <Avatar src={msg.senderAvatar} name={msg.senderName} />
      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Pinned Tag Indicator */}
        {isPinnedActive && (
          <div className={`flex items-center gap-1 text-[10px] font-bold text-brand-primary mb-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
            <Pin size={10} className="fill-brand-primary" />
            <span>Pinned · {msg.pinDurationDays ? `${msg.pinDurationDays}d` : "Active"} ({formatPinExpiry(msg.pinExpiresAt)})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-bold text-text-sec">{isOwn ? "You" : msg.senderName}</span>
          <span className="text-[10px] text-text-mut">{formatTime(msg.timestamp)}</span>
        </div>
        {msg.text && (
          <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm max-w-full overflow-hidden ${
            isOwn
              ? "bg-gradient-to-br from-brand-primary to-brand-hover text-white rounded-[18px] rounded-br-[4px]"
              : "bg-bg-card border border-border-card text-text-main rounded-[18px] rounded-bl-[4px]"
          } ${isPinnedActive ? "ring-2 ring-brand-primary/40" : ""}`}>
            <span className="block break-words">{renderMessageText(msg.text)}</span>
          </div>
        )}
        {msg.fileData && <FileCard file={msg.fileData} />}
      </div>

      {/* Message actions */}
      {showActions && (
        <div className={`absolute top-1 ${isOwn ? "left-2" : "right-2"} flex items-center gap-1 bg-bg-card border border-border-card rounded-[8px] shadow-md p-1 z-10 animate-fade-in`}>
          <button
            onClick={() => onPin && onPin(msg)}
            className={`p-1 ${isPinnedActive ? "text-brand-primary bg-brand-primary/10" : "text-text-mut hover:text-brand-primary hover:bg-brand-primary/10"} rounded transition-colors cursor-pointer`}
            title={isPinnedActive ? "Manage pinned message" : "Pin message (1, 7, or 30 days)"}
          >
            <Pin size={12} className={isPinnedActive ? "fill-brand-primary" : ""} />
          </button>
          <button
            onClick={() => onForward && onForward(msg)}
            className="p-1 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors cursor-pointer"
            title="Forward message to team"
          >
            <Forward size={12} />
          </button>
          <button
            onClick={() => {
              if (msg.text) {
                navigator.clipboard.writeText(msg.text);
                showToast("Message copied", "success");
              }
            }}
            className="p-1 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors cursor-pointer"
            title="Copy message"
          >
            <Copy size={12} />
          </button>
          {(isAdmin || isOwn) && (
            <button
              onClick={() => onDelete(msg.id)}
              className="p-1 text-text-mut hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
              title="Delete message"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Message Input Bar ────────────────────────────────────────
function MessageInput({ onSend, placeholder, disabled }) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) {
      showToast("File must be under 40MB", "error");
      return;
    }
    setPendingFile(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    if ((!text.trim() && !pendingFile) || disabled) return;
    setUploading(true);
    try {
      let fileData = null;
      if (pendingFile) {
        fileData = await uploadFileToFirebase(pendingFile, currentUser?.companyId || "", "files");
      }
      await onSend(text.trim(), fileData);
      setText("");
      if (textRef.current) {
        textRef.current.style.height = "auto";
      }
      setPendingFile(null);
    } catch (err) {
      showToast(err.message || "Failed to send", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-border-card bg-bg-card/50 backdrop-blur-sm flex-shrink-0">
      {pendingFile && (
        <div className={`mb-2 flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-[8px] text-xs font-semibold text-brand-primary ${uploading ? "animate-pulse" : ""}`}>
          {uploading ? (
            <RefreshCw size={14} className="animate-spin text-brand-primary" />
          ) : (
            <span className="text-base">{getFileIcon(pendingFile.type, pendingFile.name)}</span>
          )}
          <span className="truncate max-w-[200px]">{pendingFile.name}</span>
          <span className="text-text-mut ml-1">({formatFileSize(pendingFile.size)})</span>
          {uploading ? (
            <span className="ml-auto text-[10px] text-brand-primary font-bold animate-pulse">
              Uploading...
            </span>
          ) : (
            <button onClick={() => setPendingFile(null)} className="ml-auto text-text-mut hover:text-red-500 cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>
      )}
      <div className="relative flex items-end gap-2 bg-bg-card rounded-[24px] border border-border-card px-3 py-1.5 focus-within:border-brand-primary/60 focus-within:ring-4 focus-within:ring-brand-primary/10 shadow-sm transition-all duration-300">
        <div ref={emojiPickerRef} className="relative">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={uploading}
            className="flex-shrink-0 p-2 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer"
            title="Add emoji"
          >
            <Smile size={18} />
          </button>
          
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-border-card"
              >
                <EmojiPicker 
                  onEmojiClick={(emojiData) => {
                    setText((prev) => prev + emojiData.emoji);
                  }}
                  theme="auto"
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  width={320}
                  height={400}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 p-2 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer"
          title="Attach file (max 40MB)"
        >
          <Paperclip size={18} />
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (textRef.current) {
              textRef.current.style.height = "auto";
              textRef.current.style.height = `${Math.min(textRef.current.scrollHeight, 160)}px`;
            }
          }}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
              if (items[i].kind === "file") {
                const file = items[i].getAsFile();
                if (file) {
                  if (file.size > 40 * 1024 * 1024) {
                    showToast("File must be under 40MB", "error");
                    e.preventDefault();
                    return;
                  }
                  setPendingFile(file);
                  e.preventDefault();
                  return;
                }
              }
            }
          }}
          placeholder={placeholder}
          rows={1}
          disabled={disabled || uploading}
          className="flex-1 bg-transparent text-[15px] text-text-main placeholder-text-mut outline-none resize-none leading-[24px] max-h-40 overflow-y-auto py-1.5"
          style={{ scrollbarWidth: "none", height: "auto" }}
        />
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !pendingFile) || disabled || uploading}
          className={`flex-shrink-0 w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-200 ${
            (text.trim() || pendingFile) && !disabled && !uploading
              ? "bg-brand-primary text-white hover:bg-brand-hover shadow-lg hover:shadow-brand-primary/25 hover:-translate-y-[1px] cursor-pointer"
              : "bg-bg-base text-text-mut cursor-not-allowed"
          }`}
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Create Channel Modal ─────────────────────────────────────
function CreateChannelModal({ onClose, onCreated }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const ch = await createChannel(name.trim(), desc.trim(), currentUser.uid, currentUser.name, currentUser.companyId);
      showToast(`#${ch.displayName || ch.name} created!`, "success");
      onCreated(ch);
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to create channel", "error");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4 animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-bg-card border border-border-card rounded-[20px] p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-extrabold text-base text-text-main flex items-center gap-2">
            <Hash size={18} className="text-brand-primary" /> Create Channel
          </h3>
          <button onClick={onClose} className="text-text-mut hover:text-text-main cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-sec uppercase tracking-wider block mb-1">Channel Name *</label>
            <div className="flex items-center gap-2 border border-border-card rounded-[10px] px-3 py-2 bg-bg-base focus-within:border-brand-primary/50">
              <span className="text-text-mut text-sm font-bold">#</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/\s+/g, "-").toLowerCase())}
                placeholder="e.g. design-feedback"
                className="flex-1 bg-transparent text-sm text-text-main outline-none"
                required
                maxLength={50}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-text-sec uppercase tracking-wider block mb-1">Description (optional)</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full border border-border-card rounded-[10px] px-3 py-2 bg-bg-base text-sm text-text-main outline-none focus:border-brand-primary/50"
              maxLength={200}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border-card rounded-[10px] text-sm font-semibold text-text-sec hover:bg-bg-base cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-brand-primary text-white rounded-[10px] text-sm font-bold hover:bg-brand-hover transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── New DM Modal ─────────────────────────────────────────────
function NewDmModal({ allUsers, currentUserId, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const cleanSearch = search.trim().toLowerCase();
  const filtered = allUsers.filter(
    u => u.uid !== currentUserId &&
    (!cleanSearch ||
      u.name?.toLowerCase().includes(cleanSearch) ||
      u.email?.toLowerCase().includes(cleanSearch) ||
      (u.department || "").toLowerCase().includes(cleanSearch) ||
      (u.designation || u.jobType || "").toLowerCase().includes(cleanSearch)
    )
  );

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4 animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-bg-card border border-border-card rounded-[20px] p-5 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-base text-text-main flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-primary" /> New Direct Message
          </h3>
          <button onClick={onClose} className="text-text-mut hover:text-text-main cursor-pointer"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 border border-border-card rounded-[10px] px-3 py-2 mb-3 bg-bg-base focus-within:border-brand-primary/50">
          <Search size={14} className="text-text-mut flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teammates by name, email, role..."
            className="flex-1 bg-transparent text-sm text-text-main outline-none"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-text-mut hover:text-text-main p-0.5 cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-text-mut font-semibold">No teammates found</p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-1 text-[11px] text-brand-primary hover:underline font-bold"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : filtered.map(u => (
            <button
              key={u.uid}
              onClick={() => { onSelect(u); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-bg-base transition-colors cursor-pointer text-left"
            >
              <Avatar src={u.avatar} name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-text-main truncate">{u.name}</div>
                <div className="text-[10px] text-text-mut truncate">
                  {u.department || u.designation || "Team member"} {u.email ? `· ${u.email}` : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── Forward Message Modal ─────────────────────────────────────
function ForwardMessageModal({ message, allUsers = [], channels = [], currentUserId, currentUser, onClose, onForwardSuccess }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'users' | 'channels'
  const [selectedTargets, setSelectedTargets] = useState([]); // [{ type: 'user'|'channel', id, name, data }]
  const [forwarding, setForwarding] = useState(false);
  const { showToast } = useToast();

  const cleanSearch = search.trim().toLowerCase();

  // Channels that current user can forward to
  const forwardableChannels = useMemo(() => {
    return channels.filter(ch => {
      const isMember = ch.id === "general" || ch.memberIds?.includes(currentUserId) || currentUser?.role === "admin";
      if (!isMember) return false;
      if (!cleanSearch) return true;
      const nameMatch = (ch.displayName || ch.name)?.toLowerCase().includes(cleanSearch);
      const descMatch = (ch.description || "").toLowerCase().includes(cleanSearch);
      return nameMatch || descMatch;
    });
  }, [channels, currentUserId, currentUser?.role, cleanSearch]);

  // Teammates that current user can forward to
  const forwardableUsers = useMemo(() => {
    return allUsers.filter(u => {
      if (u.uid === currentUserId) return false;
      if (!cleanSearch) return true;
      const nameMatch = u.name?.toLowerCase().includes(cleanSearch);
      const emailMatch = u.email?.toLowerCase().includes(cleanSearch);
      const deptMatch = (u.department || "").toLowerCase().includes(cleanSearch);
      const desigMatch = (u.designation || u.jobType || "").toLowerCase().includes(cleanSearch);
      return nameMatch || emailMatch || deptMatch || desigMatch;
    });
  }, [allUsers, currentUserId, cleanSearch]);

  const toggleTarget = (target) => {
    setSelectedTargets(prev => {
      const exists = prev.some(t => t.id === target.id && t.type === target.type);
      if (exists) {
        return prev.filter(t => !(t.id === target.id && t.type === target.type));
      } else {
        return [...prev, target];
      }
    });
  };

  const isSelected = (id, type) => selectedTargets.some(t => t.id === id && t.type === type);

  const forwardToSingleTarget = async (target) => {
    if (forwarding) return;
    setForwarding(true);
    try {
      if (target.type === "channel") {
        await sendChatMessage(
          target.id,
          "channel",
          currentUser.uid,
          currentUser.name,
          currentUser.avatar || "",
          message.text || "",
          message.fileData || null,
          currentUser.companyId
        );
      } else {
        const thread = await getOrCreateDmThread(
          currentUser.uid,
          target.id,
          currentUser.name,
          target.name,
          currentUser.companyId
        );
        await sendChatMessage(
          thread.id,
          "dm",
          currentUser.uid,
          currentUser.name,
          currentUser.avatar || "",
          message.text || "",
          message.fileData || null,
          currentUser.companyId
        );
      }
      showToast(`Forwarded to ${target.name}!`, "success");
      if (onForwardSuccess) onForwardSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to forward message", "error");
    } finally {
      setForwarding(false);
    }
  };

  const forwardToSelected = async () => {
    if (selectedTargets.length === 0 || forwarding) return;
    setForwarding(true);
    try {
      for (const target of selectedTargets) {
        if (target.type === "channel") {
          await sendChatMessage(
            target.id,
            "channel",
            currentUser.uid,
            currentUser.name,
            currentUser.avatar || "",
            message.text || "",
            message.fileData || null,
            currentUser.companyId
          );
        } else {
          const thread = await getOrCreateDmThread(
            currentUser.uid,
            target.id,
            currentUser.name,
            target.name,
            currentUser.companyId
          );
          await sendChatMessage(
            thread.id,
            "dm",
            currentUser.uid,
            currentUser.name,
            currentUser.avatar || "",
            message.text || "",
            message.fileData || null,
            currentUser.companyId
          );
        }
      }
      showToast(
        `Forwarded to ${selectedTargets.length} ${selectedTargets.length === 1 ? "recipient" : "recipients"}!`,
        "success"
      );
      if (onForwardSuccess) onForwardSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to forward message", "error");
    } finally {
      setForwarding(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4 animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-bg-card border border-border-card rounded-[22px] p-6 shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-extrabold text-base text-text-main flex items-center gap-2">
            <Forward size={18} className="text-brand-primary" /> Forward Message
          </h3>
          <button onClick={onClose} className="text-text-mut hover:text-text-main cursor-pointer p-1 rounded-md hover:bg-bg-base transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Message Preview */}
        <div className="mb-4 p-3 bg-bg-base/70 border border-border-card rounded-[14px] text-xs">
          <div className="flex items-center gap-1.5 text-text-mut font-semibold mb-1">
            <span>From</span>
            <span className="font-bold text-text-sec">{message.senderName || "User"}</span>
            <span>·</span>
            <span className="text-[10px]">{formatTime(message.timestamp)}</span>
          </div>
          {message.text && (
            <p className="text-text-main font-medium line-clamp-2 leading-relaxed italic">
              &ldquo;{message.text}&rdquo;
            </p>
          )}
          {message.fileData && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-md text-[11px] font-bold text-brand-primary">
              <span>{getFileIcon(message.fileData.mimeType, message.fileData.name)}</span>
              <span className="truncate max-w-[200px]">{message.fileData.name}</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border border-border-card rounded-[12px] px-3 py-2 mb-3 bg-bg-base focus-within:border-brand-primary/50 transition-colors">
          <Search size={14} className="text-text-mut flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team members or channels..."
            className="flex-1 bg-transparent text-sm text-text-main outline-none placeholder:text-text-mut"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-text-mut hover:text-text-main p-0.5 cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mb-3 p-1 bg-bg-base rounded-[10px] border border-border-card text-xs">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-1 py-1 px-2 rounded-[7px] font-bold transition-all cursor-pointer ${
              activeFilter === "all" ? "bg-bg-card text-brand-primary shadow-sm" : "text-text-mut hover:text-text-main"
            }`}
          >
            All ({forwardableUsers.length + forwardableChannels.length})
          </button>
          <button
            onClick={() => setActiveFilter("users")}
            className={`flex-1 py-1 px-2 rounded-[7px] font-bold transition-all cursor-pointer ${
              activeFilter === "users" ? "bg-bg-card text-brand-primary shadow-sm" : "text-text-mut hover:text-text-main"
            }`}
          >
            Teammates ({forwardableUsers.length})
          </button>
          <button
            onClick={() => setActiveFilter("channels")}
            className={`flex-1 py-1 px-2 rounded-[7px] font-bold transition-all cursor-pointer ${
              activeFilter === "channels" ? "bg-bg-card text-brand-primary shadow-sm" : "text-text-mut hover:text-text-main"
            }`}
          >
            Channels ({forwardableChannels.length})
          </button>
        </div>

        {/* List of Recipients */}
        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-64 pr-1 min-h-[160px]">
          {/* Channels Section */}
          {(activeFilter === "all" || activeFilter === "channels") && forwardableChannels.length > 0 && (
            <div className="mb-2">
              {activeFilter === "all" && (
                <div className="text-[10px] font-bold text-text-mut uppercase tracking-wider px-2 py-1">Channels</div>
              )}
              {forwardableChannels.map(ch => {
                const checked = isSelected(ch.id, "channel");
                const targetObj = { type: "channel", id: ch.id, name: ch.displayName || ch.name, data: ch };
                return (
                  <div
                    key={`ch-${ch.id}`}
                    onClick={() => toggleTarget(targetObj)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[12px] border transition-all cursor-pointer ${
                      checked
                        ? "bg-brand-primary/10 border-brand-primary/40"
                        : "border-transparent hover:bg-bg-base"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        checked ? "bg-brand-primary text-white" : "bg-brand-primary/15 text-brand-primary"
                      }`}>
                        <Hash size={13} />
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-bold text-text-main truncate">#{ch.displayName || ch.name}</div>
                        <div className="text-[10px] text-text-mut truncate">{ch.description || `${ch.memberIds?.length || 0} members`}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          forwardToSingleTarget(targetObj);
                        }}
                        disabled={forwarding}
                        className="text-[10px] font-bold px-2.5 py-1 bg-brand-primary/15 hover:bg-brand-primary text-brand-primary hover:text-white rounded-full transition-all cursor-pointer flex items-center gap-1"
                        title="Instant Forward"
                      >
                        <Forward size={10} />
                        <span>Send</span>
                      </button>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        checked ? "bg-brand-primary border-brand-primary text-white" : "border-border-card bg-bg-base"
                      }`}>
                        {checked && <Check size={10} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Teammates Section */}
          {(activeFilter === "all" || activeFilter === "users") && forwardableUsers.length > 0 && (
            <div>
              {activeFilter === "all" && (
                <div className="text-[10px] font-bold text-text-mut uppercase tracking-wider px-2 py-1">Teammates</div>
              )}
              {forwardableUsers.map(u => {
                const checked = isSelected(u.uid, "user");
                const targetObj = { type: "user", id: u.uid, name: u.name, data: u };
                return (
                  <div
                    key={`user-${u.uid}`}
                    onClick={() => toggleTarget(targetObj)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[12px] border transition-all cursor-pointer ${
                      checked
                        ? "bg-brand-primary/10 border-brand-primary/40"
                        : "border-transparent hover:bg-bg-base"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="w-7 h-7" textSize="text-[10px]" />
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-bold text-text-main truncate">{u.name}</div>
                        <div className="text-[10px] text-text-mut truncate">
                          {u.department || u.designation || "Member"} {u.email ? `· ${u.email}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          forwardToSingleTarget(targetObj);
                        }}
                        disabled={forwarding}
                        className="text-[10px] font-bold px-2.5 py-1 bg-brand-primary/15 hover:bg-brand-primary text-brand-primary hover:text-white rounded-full transition-all cursor-pointer flex items-center gap-1"
                        title="Instant Forward"
                      >
                        <Forward size={10} />
                        <span>Send</span>
                      </button>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        checked ? "bg-brand-primary border-brand-primary text-white" : "border-border-card bg-bg-base"
                      }`}>
                        {checked && <Check size={10} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty search state */}
          {forwardableChannels.length === 0 && forwardableUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-text-mut font-semibold">No recipients found</p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-1.5 text-xs text-brand-primary hover:underline font-bold"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-border-card">
          <div className="text-xs text-text-sec font-semibold">
            {selectedTargets.length > 0 ? (
              <span className="text-brand-primary font-bold">
                {selectedTargets.length} selected
              </span>
            ) : (
              <span className="text-text-mut">Select one or more recipients</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={forwarding}
              className="py-2 px-3.5 border border-border-card rounded-[10px] text-xs font-semibold text-text-sec hover:bg-bg-base cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={forwardToSelected}
              disabled={selectedTargets.length === 0 || forwarding}
              className="py-2 px-4 bg-brand-primary text-white rounded-[10px] text-xs font-bold hover:bg-brand-hover transition-all cursor-pointer disabled:opacity-40 shadow-sm flex items-center gap-1.5"
            >
              {forwarding ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Forwarding...</span>
                </>
              ) : (
                <>
                  <Forward size={12} />
                  <span>Forward {selectedTargets.length > 0 ? `(${selectedTargets.length})` : ""}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── Messages Thread Panel ────────────────────────────────────
function ThreadPanel({ thread, currentUser, isAdmin, allUsers = [], channels = [], refreshKey, showChatSearch, setShowChatSearch }) {
  const [messages, setMessages] = useState([]);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [messageToForward, setMessageToForward] = useState(null);
  const [messageToPin, setMessageToPin] = useState(null);
  const [inChatSearch, setInChatSearch] = useState("");
  const bottomRef = useRef(null);
  const searchInputRef = useRef(null);
  const { showToast } = useToast();
  const prevThreadIdRef = useRef(null);

  // Focus in-chat search input when opened
  useEffect(() => {
    if (showChatSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showChatSearch]);

  // Clear in-chat search when switching thread
  useEffect(() => {
    setInChatSearch("");
    if (setShowChatSearch) setShowChatSearch(false);
  }, [thread?.id]);

  // Determine if user has access to view/message this channel
  const isMember = thread.type !== "channel" || thread.id === "general" || thread.memberIds?.includes(currentUser.uid) || isAdmin;

  // Subscribe to real-time messages for the active thread
  useEffect(() => {
    if (!thread?.id || !isMember) return;
    
    // Only clear messages when switching threads, not when refreshing
    if (prevThreadIdRef.current !== thread.id) {
      setMessages([]);
      prevThreadIdRef.current = thread.id;
    }
    
    const unsub = subscribeToMessages(thread.id, (msgs) => {
      setMessages(msgs);
      // Update read receipt dynamically
      if (thread.id && currentUser?.uid) {
        markThreadAsRead(currentUser.uid, thread.id);
      }
    });
    return unsub;
  }, [thread?.id, refreshKey, isMember, currentUser.uid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!inChatSearch) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, inChatSearch]);

  // Active pinned messages (sorted by pinnedAt desc)
  const activePinnedMessages = useMemo(() => {
    return messages
      .filter(m => !m.isDeleted && m.isPinned && (!m.pinExpiresAt || new Date(m.pinExpiresAt) > new Date()))
      .sort((a, b) => new Date(b.pinnedAt || b.timestamp) - new Date(a.pinnedAt || a.timestamp));
  }, [messages]);

  const handleSend = async (text, fileData) => {
    // Build optimistic message so it appears instantly
    const optimisticMsg = {
      id: "opt-" + Date.now(),
      threadId: thread.id,
      threadType: thread.type,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "",
      text: text || "",
      fileData: fileData || null,
      isDeleted: false,
      timestamp: new Date().toISOString(),
      companyId: currentUser.companyId || ""
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const savedMsg = await sendChatMessage(
        thread.id,
        thread.type,
        currentUser.uid,
        currentUser.name,
        currentUser.avatar || "",
        text,
        fileData,
        currentUser.companyId
      );
      if (savedMsg?.id) {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? savedMsg : m));
      }
    } catch (err) {
      showToast(err.message || "Failed to send message", "error");
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const handleDeleteClick = (msgId) => {
    setMessageToDelete(msgId);
  };

  const confirmDelete = async (type) => {
    if (!messageToDelete) return;
    try {
      if (type === "me") {
        await deleteChatMessageForMe(messageToDelete, currentUser.uid);
        setMessages(prev => prev.filter(m => m.id !== messageToDelete));
        showToast("Message deleted for you", "success");
      } else {
        await deleteChatMessage(messageToDelete);
        setMessages(prev => prev.map(m => m.id === messageToDelete ? { ...m, isDeleted: true } : m));
        showToast("Message deleted for everyone", "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to delete message", "error");
    } finally {
      setMessageToDelete(null);
    }
  };

  const handlePinConfirm = async (msg, durationDays) => {
    try {
      await pinChatMessage(msg.id, durationDays, currentUser.name, thread.id);
      showToast(`Message pinned for ${durationDays} ${durationDays === 1 ? "day" : "days"}!`, "success");
      const pinExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned: true, pinDurationDays: durationDays, pinExpiresAt, pinnedAt: new Date().toISOString(), pinnedBy: currentUser.name } : m));
    } catch (err) {
      showToast(err.message || "Failed to pin message", "error");
    } finally {
      setMessageToPin(null);
    }
  };

  const handleUnpinConfirm = async (msg) => {
    try {
      await unpinChatMessage(msg.id, thread.id);
      showToast("Message unpinned", "info");
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned: false, pinDurationDays: null, pinExpiresAt: null, pinnedAt: null, pinnedBy: null } : m));
    } catch (err) {
      showToast(err.message || "Failed to unpin message", "error");
    } finally {
      setMessageToPin(null);
    }
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-brand-primary");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-brand-primary");
      }, 2500);
    }
  };

  if (!isMember) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-base/30 h-full">
        <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4 text-brand-primary">
          <Lock size={28} />
        </div>
        <h3 className="font-extrabold text-base text-text-main mb-1">
          #{thread.displayName || thread.name}
        </h3>
        <p className="text-xs text-text-mut max-w-xs mb-4">
          You are not a member of this channel. Join to see messages and participate in the discussion.
        </p>
      </div>
    );
  }

  // Filter messages if search is active or deleted for me
  const userFilteredMessages = messages.filter(m => !m.deletedFor || !m.deletedFor.includes(currentUser.uid));
  const cleanSearch = inChatSearch.trim().toLowerCase();
  const visibleMessages = cleanSearch
    ? userFilteredMessages.filter(m =>
        !m.isDeleted && (
          m.text?.toLowerCase().includes(cleanSearch) ||
          m.senderName?.toLowerCase().includes(cleanSearch) ||
          m.fileData?.name?.toLowerCase().includes(cleanSearch)
        )
      )
    : userFilteredMessages;

  // Group messages by date
  const groupedMessages = visibleMessages.reduce((acc, msg) => {
    const date = formatDateGroup(msg.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-card">
      {/* In-chat search bar */}
      {showChatSearch && (
        <div className="px-4 py-2.5 bg-bg-base border-b border-border-card flex items-center gap-2 flex-shrink-0 animate-fade-in">
          <Search size={14} className="text-text-mut flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={inChatSearch}
            onChange={(e) => setInChatSearch(e.target.value)}
            placeholder="Search messages in this thread..."
            className="flex-1 bg-transparent text-xs text-text-main outline-none placeholder:text-text-mut"
          />
          {inChatSearch && (
            <span className="text-[10px] text-text-mut font-semibold flex-shrink-0">
              {visibleMessages.length} match{visibleMessages.length === 1 ? "" : "es"}
            </span>
          )}
          {inChatSearch && (
            <button
              onClick={() => setInChatSearch("")}
              className="p-1 text-text-mut hover:text-text-main cursor-pointer rounded"
            >
              <X size={12} />
            </button>
          )}
          <button
            onClick={() => {
              setInChatSearch("");
              setShowChatSearch(false);
            }}
            className="text-[11px] font-bold text-text-mut hover:text-brand-primary cursor-pointer px-1.5 py-0.5 rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Pinned Messages Header Banner */}
      {activePinnedMessages.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-brand-primary/15 via-brand-primary/5 to-transparent border-b border-brand-primary/25 flex items-center justify-between text-xs backdrop-blur-sm animate-fade-in shadow-sm z-10">
          <div
            onClick={() => scrollToMessage(activePinnedMessages[0].id)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Pin size={12} className="fill-brand-primary animate-pulse" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider">
                  Pinned Message {activePinnedMessages.length > 1 ? `(1 of ${activePinnedMessages.length})` : ""}
                </span>
                <span className="text-[10px] text-text-mut">
                  · {formatPinExpiry(activePinnedMessages[0].pinExpiresAt)}
                </span>
              </div>
              <p className="text-xs text-text-main font-medium truncate group-hover:text-brand-primary transition-colors">
                {activePinnedMessages[0].text || (activePinnedMessages[0].fileData ? `📎 ${activePinnedMessages[0].fileData.name}` : "Pinned update")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => setMessageToPin(activePinnedMessages[0])}
              className="p-1.5 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer"
              title="Change pin duration or unpin"
            >
              <Clock size={13} />
            </button>
            <button
              onClick={() => handleUnpinConfirm(activePinnedMessages[0])}
              className="p-1.5 text-text-mut hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
              title="Unpin message"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="flex-1 h-px bg-border-card" />
              <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider px-2">{date}</span>
              <div className="flex-1 h-px bg-border-card" />
            </div>
            {msgs.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                currentUserId={currentUser.uid}
                isAdmin={isAdmin}
                onDelete={handleDeleteClick}
                onForward={(m) => setMessageToForward(m)}
                onPin={(m) => setMessageToPin(m)}
              />
            ))}
          </div>
        ))}
        {/* No messages match search */}
        {cleanSearch && visibleMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-3 text-brand-primary">
              <Search size={20} />
            </div>
            <p className="font-bold text-text-main text-sm">No matching messages</p>
            <p className="text-xs text-text-mut mt-1">No messages match &ldquo;{inChatSearch}&rdquo; in this conversation.</p>
            <button
              onClick={() => setInChatSearch("")}
              className="mt-3 text-xs font-bold text-brand-primary hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {!cleanSearch && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
              {thread.type === "channel" ? <Hash size={24} className="text-brand-primary" /> : <MessageSquare size={24} className="text-brand-primary" />}
            </div>
            <p className="font-bold text-text-main text-sm">Start the conversation!</p>
            <p className="text-xs text-text-mut mt-1">
              {thread.type === "channel" ? `This is the beginning of #${thread.displayName || thread.name}` : `Send a message to ${thread.otherUserName}`}
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border-card p-3 bg-bg-card">
        <MessageInput
          onSend={handleSend}
          placeholder={thread.type === "channel" ? `Message #${thread.displayName || thread.name}` : `Message ${thread.otherUserName}`}
          disabled={false}
        />
      </div>

      {/* Pin Duration Modal (1 Day, 7 Days, 30 Days) */}
      {messageToPin && (
        <PinDurationModal
          target={messageToPin}
          onPin={handlePinConfirm}
          onUnpin={handleUnpinConfirm}
          onClose={() => setMessageToPin(null)}
        />
      )}

      {/* Delete Message Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-card border border-border-card rounded-[16px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border-card bg-bg-base/50">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Trash2 size={16} className="text-red-500" />
                Delete Message?
              </h3>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button
                onClick={() => confirmDelete("me")}
                className="w-full py-2.5 px-4 text-sm font-semibold bg-bg-base hover:bg-red-500/10 text-red-500 border border-border-card rounded-[10px] transition-colors cursor-pointer"
              >
                Delete for me
              </button>
              <button
                onClick={() => confirmDelete("everyone")}
                className="w-full py-2.5 px-4 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-[10px] shadow-sm transition-colors cursor-pointer"
              >
                Delete for everyone
              </button>
              <button
                onClick={() => setMessageToDelete(null)}
                className="w-full py-2.5 px-4 text-sm font-semibold text-text-main hover:bg-bg-base rounded-[10px] transition-colors mt-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {messageToForward && (
        <ForwardMessageModal
          message={messageToForward}
          allUsers={allUsers}
          channels={channels}
          currentUserId={currentUser.uid}
          currentUser={currentUser}
          onClose={() => setMessageToForward(null)}
        />
      )}
    </div>
  );
}

// ─── Main TeamHub Page ────────────────────────────────────────
export default function TeamHub() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const isAdmin = currentUser?.role === "admin";

  const [channels, setChannels]           = useState([]);
  const [dmThreads, setDmThreads]         = useState([]);
  const [allUsers, setAllUsers]           = useState([]);
  const [activeThread, setActiveThread]   = useState(null);
  const [showCreateCh, setShowCreateCh]   = useState(false);
  const [showNewDm, setShowNewDm]         = useState(false);
  const [threadToPin, setThreadToPin]     = useState(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [joiningId, setJoiningId]         = useState(null);
  const [sidebarTab, setSidebarTab]       = useState("channels"); // 'channels' | 'dms'
  const [refreshKey, setRefreshKey]       = useState(0);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showViewMembers, setShowViewMembers] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [allMessages, setAllMessages]     = useState([]);
  const [readReceiptsVersion, setReadReceiptsVersion] = useState(0);

  useEffect(() => {
    const handleReceiptUpdate = () => setReadReceiptsVersion(v => v + 1);
    window.addEventListener("local-auth-updated", handleReceiptUpdate);
    return () => window.removeEventListener("local-auth-updated", handleReceiptUpdate);
  }, []);

  useEffect(() => {
    if (activeThread?.id && currentUser?.uid) {
      markThreadAsRead(currentUser.uid, activeThread.id);
    }
  }, [activeThread?.id, currentUser?.uid]);

  // Helper to check if a thread is pinned for the current user
  const isThreadPinned = useCallback((threadId) => {
    const p = currentUser?.pinnedThreads?.[threadId];
    return !!(p && (!p.expiresAt || new Date(p.expiresAt) > new Date()));
  }, [currentUser?.pinnedThreads]);

  const handlePinThreadConfirm = async (target, durationDays) => {
    try {
      await pinChatThread(currentUser.uid, target.id, target.type || sidebarTab, durationDays);
      showToast(`${target.type === "channel" ? "Channel" : "Conversation"} pinned for ${durationDays} ${durationDays === 1 ? "day" : "days"}!`, "success");
    } catch (err) {
      showToast(err.message || "Failed to pin", "error");
    } finally {
      setThreadToPin(null);
    }
  };

  const handleUnpinThreadConfirm = async (target) => {
    try {
      await unpinChatThread(currentUser.uid, target.id);
      showToast("Unpinned from top", "info");
    } catch (err) {
      showToast(err.message || "Failed to unpin", "error");
    } finally {
      setThreadToPin(null);
    }
  };

  // Subscribe to channels
  useEffect(() => {
    const unsub = subscribeToChannels(currentUser.companyId, setChannels);
    return unsub;
  }, []);

  // Subscribe to DM threads
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToDmThreads(currentUser.uid, currentUser.companyId, setDmThreads);
    return unsub;
  }, [currentUser?.uid]);

  // Load all users for DM picker
  useEffect(() => {
    getAllRegisteredUsers(currentUser.companyId).then(setAllUsers).catch(() => {});
  }, []);

  // Subscribe to all messages for unread counts
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToAllMessages(currentUser.companyId, setAllMessages);
    return unsub;
  }, [currentUser?.uid]);

  // Compute unread count helper
  const getUnreadCount = useCallback((threadId) => {
    if (!threadId || activeThread?.id === threadId) return 0;
    let receipts = currentUser?.teamHubReadReceipts || {};
    try {
      const dedicated = JSON.parse(localStorage.getItem(`teamhub_read_receipts_${currentUser?.uid}`) || "{}");
      receipts = { ...receipts, ...dedicated };
    } catch (e) {}

    const lastRead = receipts[threadId] || "1970-01-01T00:00:00.000Z";
    
    return allMessages.filter(
      m => (m.threadId === threadId || m.channelId === threadId) && 
           m.senderId !== currentUser?.uid && 
           new Date(m.timestamp) > new Date(lastRead)
    ).length;
  }, [allMessages, currentUser?.uid, currentUser?.teamHubReadReceipts, activeThread?.id, readReceiptsVersion]);

  const unreadChannelsCount = useMemo(() => {
    return channels.reduce((acc, ch) => {
      // Only count channels the user is in
      if (ch.id === "general" || ch.memberIds?.includes(currentUser?.uid)) {
        return acc + getUnreadCount(ch.id);
      }
      return acc;
    }, 0);
  }, [channels, getUnreadCount, currentUser?.uid]);

  const unreadDmsCount = useMemo(() => {
    return dmThreads.reduce((acc, thread) => {
      return acc + getUnreadCount(thread.id);
    }, 0);
  }, [dmThreads, getUnreadCount]);

  const handleJoinChannel = async (ch) => {
    setJoiningId(ch.id);
    try {
      await joinChannel(ch.id, currentUser.uid);
      showToast(`Joined #${ch.displayName || ch.name}!`, "success");
      setActiveThread({ ...ch, type: "channel" });
    } catch (err) {
      showToast(err.message || "Failed to join", "error");
    } finally {
      setJoiningId(null);
    }
  };

  const handleAddMember = async (user) => {
    if (!activeThread || activeThread.type !== "channel") return;
    try {
      await joinChannel(activeThread.id, user.uid);
      showToast(`${user.name} added to #${activeThread.displayName || activeThread.name}!`, "success");
      // Update local state immediately
      setActiveThread(prev => ({
        ...prev,
        memberIds: [...(prev.memberIds || []), user.uid]
      }));
    } catch (err) {
      showToast(err.message || "Failed to add member", "error");
    }
  };

  const handleLeaveChannel = async (ch) => {
    if (ch.id === "general") { showToast("Cannot leave the #general channel", "error"); return; }
    try {
      await leaveChannel(ch.id, currentUser.uid);
      if (activeThread?.id === ch.id) setActiveThread(null);
      showToast(`Left #${ch.displayName || ch.name}`, "info");
    } catch (err) {
      showToast(err.message || "Failed to leave", "error");
    }
  };

  const handleDeleteChannel = async (ch) => {
    if (!isAdmin) return;
    showConfirm("Delete Channel", `Delete #${ch.displayName || ch.name}? This cannot be undone.`, async () => {
      try {
        await deleteChannel(ch.id);
        if (activeThread?.id === ch.id) setActiveThread(null);
        showToast(`Channel deleted`, "success");
      } catch (err) {
        showToast(err.message || "Failed to delete", "error");
      }
    }, { confirmText: "Delete", cancelText: "Cancel" });
  };

  const handleOpenDm = async (targetUser) => {
    try {
      const thread = await getOrCreateDmThread(
        currentUser.uid, targetUser.uid,
        currentUser.name, targetUser.name,
        currentUser.companyId
      );
      const otherId = thread.participantIds.find(id => id !== currentUser.uid);
      const otherName = thread.participantNames?.[otherId] || targetUser.name;
      setActiveThread({ ...thread, type: "dm", otherUserId: otherId, otherUserName: otherName });
      setSidebarTab("dms");
      setSearchQuery(""); // reset search after selecting
    } catch (err) {
      showToast(err.message || "Failed to open DM", "error");
    }
  };

  const query = searchQuery.trim().toLowerCase();

  // Filtered Channels by name, display name, description
  const filteredChannels = useMemo(() => {
    if (!query) return channels;
    return channels.filter(ch =>
      (ch.displayName || ch.name)?.toLowerCase().includes(query) ||
      (ch.description || "").toLowerCase().includes(query)
    );
  }, [channels, query]);

  const myChannels = useMemo(() => {
    const list = filteredChannels.filter(ch => ch.id === "general" || ch.memberIds?.includes(currentUser?.uid));
    return [...list].sort((a, b) => {
      const aPinned = isThreadPinned(a.id);
      const bPinned = isThreadPinned(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [filteredChannels, currentUser?.uid, isThreadPinned]);

  const otherChannels = useMemo(() => {
    return filteredChannels.filter(ch => ch.id !== "general" && !ch.memberIds?.includes(currentUser?.uid));
  }, [filteredChannels, currentUser?.uid]);

  // Filtered DM Threads by participant name, email, department, designation, or message content (sorted by pinned first, then recency)
  const filteredDmThreads = useMemo(() => {
    const sorted = [...dmThreads].sort((a, b) => {
      const aPinned = isThreadPinned(a.id);
      const bPinned = isThreadPinned(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const aMsgs = allMessages.filter(m => m.threadId === a.id);
      const bMsgs = allMessages.filter(m => m.threadId === b.id);
      const aTime = aMsgs.length > 0 ? new Date(aMsgs[aMsgs.length - 1].timestamp).getTime() : 0;
      const bTime = bMsgs.length > 0 ? new Date(bMsgs[bMsgs.length - 1].timestamp).getTime() : 0;
      return bTime - aTime;
    });

    if (!query) return sorted;

    return sorted.filter(thread => {
      const otherId = (thread.participantIds || []).find(id => id !== currentUser?.uid);
      const otherUser = allUsers.find(u => u.uid === otherId);
      const otherName = otherUser?.name || thread.participantNames?.[otherId] || "";
      
      const matchName = otherName.toLowerCase().includes(query);
      const matchDept = (otherUser?.department || "").toLowerCase().includes(query);
      const matchEmail = (otherUser?.email || "").toLowerCase().includes(query);
      const matchDesig = (otherUser?.designation || otherUser?.jobType || "").toLowerCase().includes(query);
      
      // Also match messages inside this thread
      const matchMessage = allMessages.some(
        m => m.threadId === thread.id && m.text?.toLowerCase().includes(query)
      );

      return matchName || matchDept || matchEmail || matchDesig || matchMessage;
    });
  }, [dmThreads, allMessages, query, currentUser?.uid, allUsers, isThreadPinned]);

  // Matching teammates from directory not yet in DM threads list
  const matchingTeammates = useMemo(() => {
    if (!query || sidebarTab !== "dms") return [];
    
    const existingDmUserIds = new Set(
      dmThreads.flatMap(t => t.participantIds).filter(id => id !== currentUser?.uid)
    );

    return allUsers.filter(u => 
      u.uid !== currentUser?.uid &&
      !existingDmUserIds.has(u.uid) &&
      (
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        (u.department || "").toLowerCase().includes(query) ||
        (u.designation || u.jobType || "").toLowerCase().includes(query)
      )
    );
  }, [allUsers, currentUser?.uid, dmThreads, query, sidebarTab]);

  const handleRemoveMemberFromChannel = async (userToRemove) => {
    try {
      await leaveChannel(activeThread.id, userToRemove.uid);
      showToast(`${userToRemove.name} removed from channel`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to remove user", "error");
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)] bg-bg-base overflow-hidden rounded-[20px] border border-border-card shadow-sm">
      {/* ── Left Sidebar ── */}
      <aside className={`w-full md:w-[260px] ${activeThread ? "hidden md:flex" : "flex"} flex-shrink-0 bg-bg-card md:border-r border-border-card flex-col`}>
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-border-card">
          <h2 className="font-extrabold text-sm text-text-main flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-primary" /> Team Hub
          </h2>
          <p className="text-[10px] text-text-mut mt-0.5">Channels & Direct Messages</p>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border-card">
          <div className="flex items-center gap-2 bg-bg-base rounded-[10px] border border-border-card px-2.5 py-1.5 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/10 transition-all">
            <Search size={13} className="text-text-mut flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={sidebarTab === "channels" ? "Search channels or topics..." : "Search messages or teammates..."}
              className="flex-1 bg-transparent text-xs text-text-main placeholder:text-text-mut outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-0.5 text-text-mut hover:text-text-main cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-card">
          {[
            ["channels", Hash, "Channels", unreadChannelsCount], 
            ["dms", MessageSquare, "Messages", unreadDmsCount]
          ].map(([key, Icon, label, count]) => (
            <button
              key={key}
              onClick={() => setSidebarTab(key)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer relative ${
                sidebarTab === key
                  ? "text-brand-primary border-b-2 border-brand-primary"
                  : "text-text-mut hover:text-text-main"
              }`}
            >
              <div className="flex items-center gap-1.5 relative">
                <Icon size={12} /> {label}
                {count > 0 && (
                  <span className="absolute -top-1 -right-2.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {sidebarTab === "channels" ? (
            <>
              {/* Create channel button for all employees */}
              {!query && (
                <div className="px-3 mb-1">
                  <button
                    onClick={() => setShowCreateCh(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-bold text-brand-primary hover:bg-brand-primary/8 transition-colors cursor-pointer border border-dashed border-brand-primary/30"
                  >
                    <Plus size={13} /> Create Channel
                  </button>
                </div>
              )}

              {/* Joined channels */}
              {myChannels.length > 0 && (
                <div className="px-3 mb-1">
                  <p className="text-[9px] font-extrabold text-text-mut uppercase tracking-widest mb-1 px-1">
                    {query ? `Your Channels (${myChannels.length})` : "Your Channels"}
                  </p>
                  {myChannels.map(ch => (
                    <ChannelItem
                      key={ch.id}
                      ch={ch}
                      isActive={activeThread?.id === ch.id}
                      isMember={true}
                      isAdmin={isAdmin}
                      joiningId={joiningId}
                      isPinned={isThreadPinned(ch.id)}
                      onPin={() => setThreadToPin({ id: ch.id, name: ch.displayName || ch.name, type: "channel", isThreadPinned: isThreadPinned(ch.id) })}
                      onClick={() => setActiveThread({ ...ch, type: "channel" })}
                      onLeave={() => handleLeaveChannel(ch)}
                      onDelete={() => handleDeleteChannel(ch)}
                      unreadCount={getUnreadCount(ch.id)}
                    />
                  ))}
                </div>
              )}

              {/* Available channels to join */}
              {isAdmin && otherChannels.length > 0 && (
                <div className="px-3 mt-2">
                  <p className="text-[9px] font-extrabold text-text-mut uppercase tracking-widest mb-1 px-1">
                    {query ? `Other Channels (${otherChannels.length})` : "Other Channels"}
                  </p>
                  {otherChannels.map(ch => (
                    <ChannelItem
                      key={ch.id}
                      ch={ch}
                      isActive={false}
                      isMember={false}
                      isAdmin={isAdmin}
                      joiningId={joiningId}
                      isPinned={false}
                      onPin={null}
                      onClick={() => handleJoinChannel(ch)}
                      onLeave={null}
                      onDelete={() => handleDeleteChannel(ch)}
                    />
                  ))}
                </div>
              )}

              {query && filteredChannels.length === 0 && (
                <div className="text-center py-8 px-4">
                  <Search size={22} className="mx-auto text-text-mut mb-2 opacity-60" />
                  <p className="text-xs text-text-main font-semibold">No channels match &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-[11px] text-brand-primary hover:underline font-bold cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {!query && channels.length === 0 && (
                <div className="text-center py-8 px-4">
                  <Hash size={24} className="mx-auto text-text-mut mb-2" />
                  <p className="text-xs text-text-mut font-semibold">No channels yet.</p>
                  <p className="text-[10px] text-text-mut mt-1">Create the first channel above!</p>
                </div>
              )}
            </>
          ) : (
            // DMs Tab
            <>
              {!query && (
                <div className="px-3 mb-1">
                  <button
                    onClick={() => setShowNewDm(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-bold text-brand-primary hover:bg-brand-primary/8 transition-colors cursor-pointer border border-dashed border-brand-primary/30"
                  >
                    <Plus size={13} /> New Direct Message
                  </button>
                </div>
              )}

              {/* Filtered Direct Messages List */}
              {filteredDmThreads.length > 0 && (
                <div className="space-y-0.5">
                  {query && (
                    <p className="text-[9px] font-extrabold text-text-mut uppercase tracking-widest mb-1 px-4">
                      Conversations ({filteredDmThreads.length})
                    </p>
                  )}
                  {filteredDmThreads.map(thread => {
                    const otherId = (thread.participantIds || []).find(id => id !== currentUser?.uid);
                    const otherUser = allUsers.find(u => u.uid === otherId);
                    const otherName = otherUser?.name || thread.participantNames?.[otherId] || "Team Member";
                    const isPinned = isThreadPinned(thread.id);
                    return (
                      <div
                        key={thread.id}
                        className={`w-full flex items-center justify-between px-3 py-2 transition-colors group rounded-[10px] mx-1 ${
                          activeThread?.id === thread.id
                            ? "bg-brand-primary/12 text-brand-primary"
                            : "hover:bg-bg-base text-text-sec hover:text-text-main"
                        }`}
                      >
                        <button
                          onClick={() => setActiveThread({ ...thread, type: "dm", otherUserId: otherId, otherUserName: otherName })}
                          className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                        >
                          <Avatar src={otherUser?.avatar} name={otherName} size="w-7 h-7" textSize="text-[10px]" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">{otherName}</span>
                              {isPinned && <Pin size={10} className="text-brand-primary fill-brand-primary flex-shrink-0" />}
                            </div>
                            <div className="text-[10px] text-text-mut truncate">
                              {otherUser?.department || otherUser?.designation || "Team member"}
                            </div>
                          </div>
                          {activeThread?.id !== thread.id && getUnreadCount(thread.id) > 0 && (
                            <span className="flex-shrink-0 bg-brand-primary text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold ml-1">
                              {getUnreadCount(thread.id)}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreadToPin({ id: thread.id, name: otherName, type: "dm", isThreadPinned: isPinned });
                          }}
                          className={`p-1 rounded opacity-0 group-hover:opacity-100 ${
                            isPinned ? "opacity-100 text-brand-primary bg-brand-primary/10" : "text-text-mut hover:text-brand-primary hover:bg-brand-primary/10"
                          } transition-all cursor-pointer`}
                          title={isPinned ? "Manage pinned conversation" : "Pin conversation (1, 7, 30 days)"}
                        >
                          <Pin size={11} className={isPinned ? "fill-brand-primary" : ""} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Matching Teammates from directory (not yet in DM list) */}
              {matchingTeammates.length > 0 && (
                <div className="px-3 mt-3 pt-3 border-t border-border-card/50">
                  <p className="text-[9px] font-extrabold text-brand-primary uppercase tracking-widest mb-1.5 px-1 flex items-center gap-1">
                    <UserPlus size={11} /> Teammates ({matchingTeammates.length})
                  </p>
                  <div className="space-y-1">
                    {matchingTeammates.map(user => (
                      <button
                        key={user.uid}
                        onClick={() => handleOpenDm(user)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] hover:bg-bg-base transition-colors cursor-pointer text-left border border-transparent hover:border-border-card"
                      >
                        <Avatar src={user.avatar} name={user.name} size="w-7 h-7" textSize="text-[10px]" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-text-main truncate">{user.name}</div>
                          <div className="text-[9px] text-text-mut truncate">{user.department || user.designation || user.email}</div>
                        </div>
                        <span className="text-[10px] font-bold text-brand-primary px-2 py-0.5 rounded-full bg-brand-primary/10 hover:bg-brand-primary hover:text-white transition-colors">
                          Chat
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {query && filteredDmThreads.length === 0 && matchingTeammates.length === 0 && (
                <div className="text-center py-8 px-4">
                  <Search size={22} className="mx-auto text-text-mut mb-2 opacity-60" />
                  <p className="text-xs text-text-main font-semibold">No conversations or teammates match &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-[11px] text-brand-primary hover:underline font-bold cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {!query && dmThreads.length === 0 && (
                <div className="text-center py-8 px-4">
                  <MessageSquare size={24} className="mx-auto text-text-mut mb-2" />
                  <p className="text-xs text-text-mut font-semibold">No messages yet.</p>
                  <p className="text-[10px] text-text-mut mt-1">Start a conversation with a teammate!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar footer: All users quick DM */}
        <div className="p-3 border-t border-border-card">
          <button
            onClick={() => { setSidebarTab("dms"); setShowNewDm(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] bg-bg-base hover:bg-brand-primary/8 text-xs font-semibold text-text-sec hover:text-brand-primary border border-border-card hover:border-brand-primary/30 transition-all cursor-pointer"
          >
            <Users size={13} /> Browse Team ({allUsers.filter(u => u.uid !== currentUser?.uid).length})
          </button>
        </div>
      </aside>

      {/* ── Right Thread Pane ── */}
      <div className={`flex-1 ${activeThread ? "flex" : "hidden md:flex"} flex-col min-w-0 h-full`}>
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="px-6 py-3.5 border-b border-border-card bg-bg-card flex-shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button on mobile */}
                <button
                  onClick={() => setActiveThread(null)}
                  className="md:hidden p-1.5 rounded-full hover:bg-bg-base text-text-mut hover:text-brand-primary transition-colors cursor-pointer mr-1 flex items-center justify-center border border-border-card"
                  title="Back to lists"
                >
                  <ArrowLeft size={16} />
                </button>
                {activeThread.type === "channel" ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center flex-shrink-0">
                      <Hash size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-text-main truncate">{activeThread.displayName || activeThread.name}</h3>
                      {activeThread.description && (
                        <p className="text-[10px] text-text-mut truncate">{activeThread.description}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar
                      src={allUsers.find(u => u.uid === activeThread.otherUserId)?.avatar}
                      name={activeThread.otherUserName}
                      size="w-8 h-8"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-text-main">{activeThread.otherUserName}</h3>
                      <p className="text-[10px] text-text-mut">
                        {allUsers.find(u => u.uid === activeThread.otherUserId)?.department || "Direct Message"}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* In-chat search button */}
                <button
                  onClick={() => setShowChatSearch(prev => !prev)}
                  className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    showChatSearch
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "hover:bg-bg-base text-text-mut hover:text-brand-primary border-transparent hover:border-border-card"
                  }`}
                  title="Search messages in this conversation"
                >
                  <Search size={14} />
                </button>
                {activeThread.type === "channel" && (
                  <button
                    onClick={() => setShowViewMembers(true)}
                    className="text-[10px] font-bold text-text-mut hover:text-brand-primary bg-bg-base hover:bg-brand-primary/10 px-2 py-1 rounded-full border border-border-card hover:border-brand-primary/30 transition-all cursor-pointer"
                  >
                    {activeThread.memberIds?.length || 0} members
                  </button>
                )}
                {activeThread.type === "channel" && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="p-1.5 rounded-full hover:bg-bg-base text-brand-primary border border-brand-primary/20 hover:border-brand-primary transition-all cursor-pointer flex items-center justify-center"
                    title="Add Member"
                  >
                    <UserPlus size={14} />
                  </button>
                )}
                {/* Refresh button */}
                <button
                  onClick={() => {
                    setRefreshKey(prev => prev + 1);
                    showToast("Syncing messages...", "info");
                  }}
                  className="p-1.5 rounded-full hover:bg-bg-base text-text-mut hover:text-brand-primary border border-transparent hover:border-border-card transition-all cursor-pointer flex items-center justify-center"
                  title="Refresh chat thread"
                >
                  <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Thread Messages */}
            <div className="flex-1 min-h-0">
              <ThreadPanel
                thread={activeThread}
                currentUser={currentUser}
                isAdmin={isAdmin}
                allUsers={allUsers}
                channels={channels}
                refreshKey={refreshKey}
                showChatSearch={showChatSearch}
                setShowChatSearch={setShowChatSearch}
              />
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-6 shadow-lg">
              <MessageSquare size={36} className="text-brand-primary" />
            </div>
            <h2 className="font-extrabold text-xl text-text-main mb-2">Team Hub</h2>
            <p className="text-sm text-text-mut max-w-sm">
              {isAdmin
                ? "Select a channel or direct message to start chatting. Create channels to organize team discussions."
                : "Select a channel to join the conversation, or send a direct message to a teammate."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSidebarTab("channels")}
                className="px-4 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-[12px] hover:bg-brand-hover transition-colors cursor-pointer flex items-center gap-2"
              >
                <Hash size={14} /> Browse Channels
              </button>
              <button
                onClick={() => { setSidebarTab("dms"); setShowNewDm(true); }}
                className="px-4 py-2.5 border border-border-card text-text-sec text-sm font-semibold rounded-[12px] hover:bg-bg-card transition-colors cursor-pointer flex items-center gap-2"
              >
                <MessageSquare size={14} /> New Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateCh && (
          <CreateChannelModal
            onClose={() => setShowCreateCh(false)}
            onCreated={(ch) => setActiveThread({ ...ch, type: "channel" })}
          />
        )}
        {showNewDm && (
          <NewDmModal
            allUsers={allUsers}
            currentUserId={currentUser.uid}
            onClose={() => setShowNewDm(false)}
            onSelect={handleOpenDm}
          />
        )}
        {showAddMember && activeThread?.type === "channel" && (
          <AddMemberModal
            channel={activeThread}
            allUsers={allUsers}
            onClose={() => setShowAddMember(false)}
            onAdd={handleAddMember}
          />
        )}
        {showViewMembers && activeThread?.type === "channel" && (
          <ViewMembersModal
            channel={activeThread}
            allUsers={allUsers}
            onClose={() => setShowViewMembers(false)}
            isAdmin={isAdmin || activeThread.createdBy === currentUser.uid}
            currentUserId={currentUser.uid}
            onRemoveMember={handleRemoveMemberFromChannel}
          />
        )}
        {threadToPin && (
          <PinDurationModal
            target={threadToPin}
            onPin={handlePinThreadConfirm}
            onUnpin={handleUnpinThreadConfirm}
            onClose={() => setThreadToPin(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Channel List Item ────────────────────────────────────────
function ChannelItem({ ch, isActive, isMember, isAdmin, joiningId, onClick, onLeave, onDelete, isPinned, onPin, unreadCount }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`flex items-center gap-1 rounded-[10px] mb-0.5 transition-colors group ${
        isActive ? "bg-brand-primary/12 text-brand-primary" : "hover:bg-bg-base text-text-sec hover:text-text-main"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button onClick={onClick} className="flex-1 flex items-center gap-2 px-3 py-2 text-left cursor-pointer min-w-0">
        <Hash size={13} className={`flex-shrink-0 ${isActive ? "text-brand-primary" : "text-text-mut"}`} />
        <span className="text-xs font-semibold truncate flex-1">{ch.displayName || ch.name}</span>
        {isPinned && (
          <Pin size={11} className="text-brand-primary fill-brand-primary flex-shrink-0 ml-1" />
        )}
        {unreadCount > 0 && !isActive && (
          <span className="flex-shrink-0 bg-brand-primary text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold ml-1">
            {unreadCount}
          </span>
        )}
        {!isMember && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
            {joiningId === ch.id ? "..." : "JOIN"}
          </span>
        )}
      </button>
      {hovered && isMember && (
        <div className="flex items-center gap-0.5 pr-1">
          {onPin && (
            <button
              onClick={(e) => { e.stopPropagation(); onPin(); }}
              className={`p-1 ${isPinned ? "text-brand-primary bg-brand-primary/10" : "text-text-mut hover:text-brand-primary hover:bg-brand-primary/10"} transition-colors cursor-pointer rounded`}
              title={isPinned ? "Manage pinned channel" : "Pin channel (1, 7, 30 days)"}
            >
              <Pin size={11} className={isPinned ? "fill-brand-primary" : ""} />
            </button>
          )}
          {isAdmin && ch.id !== "general" && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-text-mut hover:text-red-500 transition-colors cursor-pointer rounded"
            >
              <Trash2 size={11} />
            </button>
          )}
          {ch.id !== "general" && onLeave && (
            <button
              onClick={(e) => { e.stopPropagation(); onLeave(); }}
              className="p-1 text-text-mut hover:text-text-main transition-colors cursor-pointer rounded"
              title="Leave channel"
            >
              <LogOut size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Member Modal ──────────────────────────────────────────
function AddMemberModal({ channel, allUsers, onClose, onAdd }) {
  const [search, setSearch] = useState("");
  const cleanSearch = search.trim().toLowerCase();
  
  // Filter out users who are already members of this channel
  const candidates = allUsers.filter(
    u => !channel.memberIds?.includes(u.uid) &&
    (!cleanSearch ||
      u.name?.toLowerCase().includes(cleanSearch) ||
      u.email?.toLowerCase().includes(cleanSearch) ||
      (u.department || "").toLowerCase().includes(cleanSearch) ||
      (u.designation || u.jobType || "").toLowerCase().includes(cleanSearch)
    )
  );

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4 animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-bg-card border border-border-card rounded-[20px] p-5 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-base text-text-main flex items-center gap-2">
            <Users size={16} className="text-brand-primary" /> Add Member
          </h3>
          <button onClick={onClose} className="text-text-mut hover:text-text-main cursor-pointer"><X size={18} /></button>
        </div>
        <p className="text-[10px] text-text-mut mb-3">Add teammate to #{channel.displayName || channel.name}</p>
        
        <div className="flex items-center gap-2 border border-border-card rounded-[10px] px-3 py-2 mb-3 bg-bg-base focus-within:border-brand-primary/50">
          <Search size={14} className="text-text-mut flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teammates by name, email, department..."
            className="flex-1 bg-transparent text-sm text-text-main outline-none"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-text-mut hover:text-text-main p-0.5 cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {candidates.length === 0 ? (
            <p className="text-xs text-text-mut text-center py-4">No eligible teammates found</p>
          ) : candidates.map(u => (
            <div
              key={u.uid}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[10px] hover:bg-bg-base transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={u.avatar} name={u.name} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-text-main truncate">{u.name}</div>
                  <div className="text-[9px] text-text-mut truncate">{u.department || u.designation || "Member"} · {u.email}</div>
                </div>
              </div>
              <button
                onClick={() => onAdd(u)}
                className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition-all cursor-pointer"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ─── View Members Modal ──────────────────────────────────────────
function ViewMembersModal({ channel, allUsers, onClose, isAdmin, currentUserId, onRemoveMember }) {
  const [search, setSearch] = useState("");
  const cleanSearch = search.trim().toLowerCase();
  
  const members = allUsers.filter(
    u => channel.memberIds?.includes(u.uid) &&
    (!cleanSearch ||
      u.name?.toLowerCase().includes(cleanSearch) ||
      u.email?.toLowerCase().includes(cleanSearch) ||
      (u.department || "").toLowerCase().includes(cleanSearch) ||
      (u.designation || u.jobType || "").toLowerCase().includes(cleanSearch)
    )
  );

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4 animate-fade-in">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-bg-card border border-border-card rounded-[20px] p-5 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-base text-text-main flex items-center gap-2">
            <Users size={16} className="text-brand-primary" /> Channel Members
          </h3>
          <button onClick={onClose} className="text-text-mut hover:text-text-main cursor-pointer"><X size={18} /></button>
        </div>
        <p className="text-[10px] text-text-mut mb-3">#{channel.displayName || channel.name} ({channel.memberIds?.length || 0} members)</p>
        
        <div className="flex items-center gap-2 border border-border-card rounded-[10px] px-3 py-2 mb-3 bg-bg-base focus-within:border-brand-primary/50">
          <Search size={14} className="text-text-mut flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="flex-1 bg-transparent text-sm text-text-main outline-none"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-text-mut hover:text-text-main p-0.5 cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {members.length === 0 ? (
            <p className="text-xs text-text-mut text-center py-4">No members found</p>
          ) : members.map(u => (
            <div
              key={u.uid}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-bg-base transition-colors"
            >
              <Avatar src={u.avatar} name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-text-main truncate">{u.name}</div>
                <div className="text-[9px] text-text-mut truncate">{u.department || u.designation || "Member"} · {u.email}</div>
              </div>
              {isAdmin && u.uid !== currentUserId && channel.id !== "general" && (
                <button
                  onClick={() => onRemoveMember(u)}
                  className="flex-shrink-0 text-text-mut hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                  title="Remove from channel"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
