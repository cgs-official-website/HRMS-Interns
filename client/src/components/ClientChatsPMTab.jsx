import React, { useState, useEffect } from "react";
import { MessageSquare, ExternalLink, RefreshCw } from "lucide-react";
import { subscribeToExternalLinks } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function ClientChatsPMTab({ currentUser }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.companyId || !currentUser?.uid) return;
    const unsub = subscribeToExternalLinks(currentUser.companyId, (data) => {
      // Filter links assigned to this PM and currently active
      const pmLinks = data.filter(l => l.pmId === currentUser.uid && l.status === "active");
      setLinks(pmLinks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const handleOpenChat = (channelId) => {
    // Navigate to TeamHub with the specific channel selected
    navigate(`/team-hub?channel=${channelId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <RefreshCw className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-card rounded-[20px] shadow-sm p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
          <MessageSquare size={20} className="text-brand-primary" />
          Client Chats
        </h2>
        <p className="text-sm text-text-mut mt-1">Chat securely with external clients assigned to your projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map(link => (
          <div key={link.id} className="bg-bg-base border border-border-card rounded-2xl p-5 hover:border-brand-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-text-main">{link.projectName}</h3>
                <p className="text-xs font-semibold text-text-sec mt-1">Client: {link.clientName}</p>
              </div>
              <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
                <MessageSquare size={18} />
              </div>
            </div>

            <div className="text-xs text-text-mut mb-5">
              <span className="block mb-1">Email: {link.clientEmail}</span>
              <span className="block">Created: {new Date(link.createdAt).toLocaleDateString()}</span>
            </div>

            <button
              onClick={() => handleOpenChat(link.channelId)}
              className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-hover transition-colors"
            >
              <ExternalLink size={16} />
              Open Chat in Team Hub
            </button>
          </div>
        ))}

        {links.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-border-card rounded-2xl bg-bg-base">
            <MessageSquare size={40} className="mx-auto text-text-mut opacity-30 mb-3" />
            <p className="text-text-main font-bold">No active client chats.</p>
            <p className="text-text-mut text-sm mt-1">When an admin assigns an external link to you, it will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
