import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, LifeBuoy, Send, AlertTriangle, CheckCircle2, MessageSquare, Clock, Plus, ChevronRight, ArrowLeft } from "lucide-react";
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const zunaConfig = {
  apiKey: "AIzaSyAzEP2LTXsGvCsFyxITkgoon_2AL4yGKyo",
  authDomain: "zuna-landing-page-22564.firebaseapp.com",
  projectId: "zuna-landing-page-22564",
  storageBucket: "zuna-landing-page-22564.firebasestorage.app",
  messagingSenderId: "806137313772",
  appId: "1:806137313772:web:57cf450537cb9c4fff68c9"
};

const zunaApp = getApps().find(a => a.name === 'ZunaSharedApp') || initializeApp(zunaConfig, 'ZunaSharedApp');
const zunaDb = getFirestore(zunaApp);

export default function RaiseTicketModal({ isOpen, onClose, clientName = "HR Administrator", clientEmail = "" }) {
  const [activeTab, setActiveTab] = useState('raise');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [myTickets, setMyTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let mainList = [];
    let supportList = [];

    const getLocal = () => {
      try {
        const saved = localStorage.getItem('zuna_tickets');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return [];
    };

    const mergeAndEmit = () => {
      const localList = getLocal();
      const ticketMap = new Map();
      [...localList, ...mainList, ...supportList].forEach(t => {
        if (t && t.id) {
          ticketMap.set(t.id, { ...ticketMap.get(t.id), ...t });
        }
      });
      const combined = Array.from(ticketMap.values()).filter(t => {
        const prod = (t.productName || t.productId || '').toLowerCase();
        return prod.includes('attendance') || prod.includes('hrms') || t.clientName === clientName;
      });
      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setMyTickets(combined);

      if (selectedTicket) {
        const updated = combined.find(x => x.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    };

    const unsub1 = onSnapshot(collection(zunaDb, 'tickets'), (snapshot) => {
      mainList = snapshot.docs.map(d => ({
        firestoreDocId: d.id,
        id: d.data().id || d.id,
        sourceCollection: 'tickets',
        ...d.data()
      }));
      mergeAndEmit();
    }, (err) => console.warn('Tickets snapshot warn:', err));

    const unsub2 = onSnapshot(collection(zunaDb, 'support_tickets'), (snapshot) => {
      supportList = snapshot.docs.map(d => ({
        firestoreDocId: d.id,
        id: d.data().id || d.id,
        sourceCollection: 'support_tickets',
        ...d.data()
      }));
      mergeAndEmit();
    }, (err) => console.warn('Support tickets snapshot warn:', err));

    return () => {
      unsub1();
      unsub2();
    };
  }, [isOpen, clientName, selectedTicket?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
      const ticketPayload = {
        id: ticketId,
        productId: 'attendance-hrms',
        productName: "Attendance (HRMS)",
        clientName,
        clientEmail,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: "open",
        createdAt: new Date().toISOString(),
        messages: [
          {
            sender: "Client",
            author: clientName,
            text: description.trim(),
            timestamp: new Date().toISOString()
          }
        ]
      };

      try {
        await addDoc(collection(zunaDb, "tickets"), {
          ...ticketPayload,
          createdAt: serverTimestamp()
        });
      } catch (err) {}

      try {
        await addDoc(collection(zunaDb, "support_tickets"), {
          ...ticketPayload,
          createdAt: serverTimestamp()
        });
      } catch (err2) {}

      try {
        const current = JSON.parse(localStorage.getItem('zuna_tickets') || '[]');
        localStorage.setItem('zuna_tickets', JSON.stringify([ticketPayload, ...current]));
      } catch (e) {}

      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const bc = new BroadcastChannel('zuna_tickets_channel');
          bc.postMessage(ticketPayload);
          bc.close();
        } catch (bcErr) {}
      }

      setSuccessMsg("✓ Ticket submitted! Zuna SuperAdmin will reply shortly.");
      setSubject("");
      setDescription("");
      setTimeout(() => {
        setSuccessMsg("");
        setActiveTab('history');
      }, 1500);
    } catch (err) {
      console.error("Failed to raise ticket:", err);
      setErrorMsg("Failed to submit support ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);

    const newReply = {
      sender: 'Client',
      author: clientName,
      text: replyText.trim(),
      timestamp: new Date().toISOString()
    };

    const targetDocId = selectedTicket.firestoreDocId || selectedTicket.id;
    const colName = selectedTicket.sourceCollection === 'support_tickets' ? 'support_tickets' : 'tickets';
    const updatedMessages = [...(selectedTicket.messages || []), newReply];

    try {
      await updateDoc(doc(zunaDb, colName, targetDocId), {
        messages: updatedMessages,
        updatedAt: serverTimestamp()
      });
      setReplyText('');
    } catch (err) {
      console.warn('Reply write error:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'resolved': return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-[11px] font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Resolved</span>;
      case 'in-progress': return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md text-[11px] font-bold flex items-center gap-1"><Clock size={12}/> In Progress</span>;
      default: return <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-md text-[11px] font-bold flex items-center gap-1"><MessageSquare size={12}/> Open</span>;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-bg-card text-text-main rounded-3xl shadow-2xl border border-border-card w-full max-w-lg my-auto overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border-card bg-bg-base/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
              <LifeBuoy size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-text-main">Zuna Central Support</h3>
              <p className="text-xs text-text-mut font-medium">Direct support desk for HR Administrators</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-text-mut hover:text-text-main rounded-xl hover:bg-bg-base transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border-card bg-bg-base/60 px-4 sm:px-5 gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab('raise'); setSelectedTicket(null); }}
            className={`py-3 px-3 sm:px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'raise' 
                ? 'border-brand-primary text-brand-primary bg-bg-card rounded-t-xl' 
                : 'border-transparent text-text-mut hover:text-text-sec'
            }`}
          >
            <Plus size={14} /> Raise New Ticket
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 sm:px-4 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' 
                ? 'border-brand-primary text-brand-primary bg-bg-card rounded-t-xl' 
                : 'border-transparent text-text-mut hover:text-text-sec'
            }`}
          >
            <MessageSquare size={14} /> My Tickets ({myTickets.length})
          </button>
        </div>

        {/* TAB 1: FORM */}
        {activeTab === 'raise' && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-extrabold text-text-sec uppercase tracking-wider mb-1">Issue Subject</label>
              <input 
                type="text" required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-bg-base border border-border-card rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-text-main font-medium placeholder:text-text-mut transition-all"
                placeholder="e.g. Payroll Tax Export Failure"
                value={subject} onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-text-sec uppercase tracking-wider mb-1">Priority</label>
                <select 
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-bg-base border border-border-card rounded-2xl font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-brand-primary/30" 
                  value={priority} onChange={e => setPriority(e.target.value)}
                >
                  <option value="low" className="bg-bg-card text-text-main">Low Priority</option>
                  <option value="medium" className="bg-bg-card text-text-main">Medium Priority</option>
                  <option value="high" className="bg-bg-card text-text-main">High Priority</option>
                  <option value="urgent" className="bg-bg-card text-text-main">⚡ Urgent Priority</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-text-sec uppercase tracking-wider mb-1">Product</label>
                <input 
                  type="text" disabled value="Attendance (HRMS)" 
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-bg-base/60 border border-border-card rounded-2xl text-text-mut font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-text-sec uppercase tracking-wider mb-1">Detailed Description</label>
              <textarea 
                required rows={3} 
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-bg-base border border-border-card rounded-2xl text-text-main font-medium placeholder:text-text-mut resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all" 
                placeholder="Describe the issue you are experiencing..." 
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button" onClick={onClose} 
                className="px-4 py-2 text-xs font-bold text-text-sec bg-bg-base hover:bg-border-card rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={loading} 
                className="px-5 py-2 text-xs font-bold text-white bg-brand-primary hover:opacity-90 active:scale-95 rounded-2xl shadow-lg shadow-brand-primary/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Send size={14} /> {loading ? 'Submitting...' : 'Submit to Zuna Admin'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: HISTORY LIST */}
        {activeTab === 'history' && !selectedTicket && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
            {myTickets.map(t => (
              <div 
                key={t.id} onClick={() => setSelectedTicket(t)} 
                className="p-3.5 sm:p-4 rounded-2xl border border-border-card hover:border-brand-primary/40 hover:shadow-md transition-all cursor-pointer bg-bg-base/40 flex items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-extrabold text-brand-primary">#{t.id}</span>
                    {getStatusBadge(t.status)}
                    <span className="text-[10px] text-text-mut font-medium ml-auto">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-text-main group-hover:text-brand-primary transition-colors truncate">{t.subject}</h4>
                  <p className="text-[11px] text-text-mut truncate mt-0.5">{t.description}</p>
                </div>
                <ChevronRight className="text-text-mut group-hover:text-brand-primary shrink-0 transition-colors" size={18}/>
              </div>
            ))}
            {myTickets.length === 0 && (
              <div className="text-center py-10 text-text-mut text-xs font-semibold">
                <LifeBuoy size={36} className="mx-auto mb-2 text-text-mut opacity-50" />
                <p>No support tickets found.</p>
                <p className="text-[10px] opacity-75 mt-1">Switch to "Raise New Ticket" tab to submit a request.</p>
              </div>
            )}
          </div>
        )}

        {/* THREAD DETAIL */}
        {activeTab === 'history' && selectedTicket && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 sm:px-5 py-2.5 border-b border-border-card bg-bg-base/80 flex items-center justify-between shrink-0">
              <button onClick={() => setSelectedTicket(null)} className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer">
                <ArrowLeft size={14}/> Back to My Tickets
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-text-mut">#{selectedTicket.id}</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
            </div>

            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 bg-bg-base/20">
              <div className="p-3 bg-bg-base rounded-2xl border border-border-card">
                <span className="text-[11px] font-bold text-text-mut block mb-1">Subject: {selectedTicket.subject}</span>
                <p className="text-xs text-text-main font-medium">{selectedTicket.description}</p>
              </div>

              {(selectedTicket.messages || []).map((msg, i) => {
                const isSuperAdmin = msg.sender === 'Agent' || msg.sender === 'SuperAdmin' || msg.role === 'superadmin';
                return (
                  <div key={i} className={`flex flex-col ${isSuperAdmin ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${
                      isSuperAdmin 
                        ? 'bg-brand-primary text-white rounded-tl-none shadow-md' 
                        : 'bg-bg-card border border-border-card text-text-main rounded-tr-none shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 font-bold">
                        <span>{isSuperAdmin ? '⚡ Zuna SuperAdmin Support' : msg.author || 'HR Admin'}</span>
                        <span>{msg.timestamp || 'Recently'}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendReply} className="p-3 border-t border-border-card bg-bg-card flex gap-2 shrink-0">
              <input 
                type="text" placeholder="Write reply to Zuna SuperAdmin..." 
                value={replyText} onChange={e => setReplyText(e.target.value)} 
                className="flex-1 px-3.5 py-2 text-xs bg-bg-base border border-border-card rounded-xl text-text-main font-medium focus:outline-none focus:border-brand-primary placeholder:text-text-mut" 
                required
              />
              <button 
                type="submit" disabled={sendingReply} 
                className="px-4 py-2 bg-brand-primary hover:opacity-90 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Send size={12}/> {sendingReply ? 'Sending...' : 'Reply'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
