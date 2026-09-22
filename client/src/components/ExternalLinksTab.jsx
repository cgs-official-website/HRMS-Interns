import React, { useState, useEffect } from "react";
import { Link2, Plus, Copy, Check, Trash2, Mail, ExternalLink, RefreshCw } from "lucide-react";
import { subscribeToExternalLinks, generateExternalLink, revokeExternalLink } from "../firebase";

export default function ExternalLinksTab({ currentUser, users, showToast }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  const [formData, setFormData] = useState({
    projectName: "",
    pmId: "",
    clientEmail: "",
    clientName: ""
  });

  useEffect(() => {
    if (!currentUser?.companyId) return;
    const unsub = subscribeToExternalLinks(currentUser.companyId, (data) => {
      setLinks(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.projectName || !formData.pmId || !formData.clientEmail) {
      return showToast("Please fill all required fields", "warning");
    }

    const pm = users.find(u => u.uid === formData.pmId);
    if (!pm) return showToast("Selected PM not found", "error");

    try {
      setGenerating(true);
      await generateExternalLink(
        currentUser.uid,
        currentUser.companyId,
        "proj-" + Math.random().toString(36).substr(2, 9), // dummy project id for now
        formData.projectName,
        pm.uid,
        pm.name,
        formData.clientEmail,
        formData.clientName
      );
      showToast("External link generated successfully!", "success");
      setShowAddModal(false);
      setFormData({ projectName: "", pmId: "", clientEmail: "", clientName: "" });
    } catch (err) {
      showToast(err.message || "Failed to generate link", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (token) => {
    const url = `${window.location.origin}/client-chat/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    showToast("Link copied to clipboard", "success");
  };

  const handleRevoke = async (linkId) => {
    if (!window.confirm("Are you sure you want to revoke this link? The client will no longer be able to access the chat.")) return;
    try {
      await revokeExternalLink(linkId, currentUser.companyId);
      showToast("Link revoked", "info");
    } catch (err) {
      showToast("Failed to revoke link", "error");
    }
  };

  const handleSendEmail = (link) => {
    const url = `${window.location.origin}/client-chat/${link.linkToken}`;
    const subject = encodeURIComponent(`Invitation to join project chat: ${link.projectName}`);
    const body = encodeURIComponent(`Hello ${link.clientName || ''},\n\nYou have been invited to join the project chat for ${link.projectName} by your Project Manager, ${link.pmName}.\n\nPlease click the secure link below to join the chat:\n${url}\n\nBest regards,\nZuna HRMS`);
    window.location.href = `mailto:${link.clientEmail}?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <RefreshCw className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  const activeLinks = links.filter(l => l.status === "active");
  const revokedLinks = links.filter(l => l.status === "revoked");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-text-main flex items-center gap-2">
            <Link2 size={24} className="text-brand-primary" />
            External Links
          </h2>
          <p className="text-sm text-text-mut mt-1">Manage secure chat access links for external clients.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-hover shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
        >
          <Plus size={18} />
          Generate New Link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeLinks.map(link => (
          <div key={link.id} className="bg-bg-card border border-border-card rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-[100px] pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-text-main leading-tight">{link.projectName}</h3>
                <p className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Session
                </p>
              </div>
              <button 
                onClick={() => handleRevoke(link.id)}
                title="Revoke Link"
                className="text-text-mut hover:text-brand-danger transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-mut font-medium">Client</span>
                <span className="text-text-main font-bold truncate max-w-[120px]" title={link.clientEmail}>{link.clientName || link.clientEmail}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-mut font-medium">PM</span>
                <span className="text-text-main font-bold truncate max-w-[120px]">{link.pmName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-mut font-medium">Generated</span>
                <span className="text-text-main font-bold">{new Date(link.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(link.linkToken)}
                className="flex-1 bg-bg-base hover:bg-bg-body border border-border-card text-text-main px-3 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1.5 transition-colors"
              >
                {copiedToken === link.linkToken ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiedToken === link.linkToken ? "Copied" : "Copy Link"}
              </button>
              <button
                onClick={() => handleSendEmail(link)}
                className="flex-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-3 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1.5 transition-colors"
              >
                <Mail size={14} />
                Send Email
              </button>
            </div>
          </div>
        ))}
        {activeLinks.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed border-border-card rounded-2xl">
            <Link2 size={40} className="mx-auto text-text-mut opacity-30 mb-3" />
            <p className="text-text-mut font-medium">No active external links found.</p>
          </div>
        )}
      </div>

      {revokedLinks.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-text-sec mb-4">Revoked Links</h3>
          <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-base/50 text-xs text-text-mut uppercase tracking-wider border-b border-border-card">
                    <th className="p-4 font-bold">Project</th>
                    <th className="p-4 font-bold">Client</th>
                    <th className="p-4 font-bold">PM</th>
                    <th className="p-4 font-bold">Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card text-sm">
                  {revokedLinks.map(link => (
                    <tr key={link.id} className="hover:bg-bg-base/30 transition-colors opacity-70">
                      <td className="p-4 font-semibold text-text-main">{link.projectName}</td>
                      <td className="p-4 text-text-sec">{link.clientEmail}</td>
                      <td className="p-4 text-text-sec">{link.pmName}</td>
                      <td className="p-4 text-text-sec">{new Date(link.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-4 animate-fade-in">
          <div className="w-full max-w-md bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl relative animate-scale-up">
            <h3 className="text-xl font-bold text-text-main mb-6">Generate External Link</h3>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-mut uppercase mb-1">Project Name *</label>
                <input 
                  type="text" required
                  value={formData.projectName}
                  onChange={e => setFormData({...formData, projectName: e.target.value})}
                  className="w-full bg-bg-base border border-border-card rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary/50 text-text-main"
                  placeholder="e.g. Website Redesign"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-mut uppercase mb-1">Project Manager *</label>
                <select 
                  required
                  value={formData.pmId}
                  onChange={e => setFormData({...formData, pmId: e.target.value})}
                  className="w-full bg-bg-base border border-border-card rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary/50 text-text-main"
                >
                  <option value="">Select a Project Manager</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.name || u.email} {u.role ? `(${u.role})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-text-mut uppercase mb-1">Client Name</label>
                  <input 
                    type="text"
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    className="w-full bg-bg-base border border-border-card rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary/50 text-text-main"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-text-mut uppercase mb-1">Client Email *</label>
                  <input 
                    type="email" required
                    value={formData.clientEmail}
                    onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                    className="w-full bg-bg-base border border-border-card rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary/50 text-text-main"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border border-border-card rounded-xl font-bold text-text-sec hover:bg-bg-base transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={generating} className="flex-1 px-4 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-hover shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {generating ? <RefreshCw size={18} className="animate-spin" /> : "Generate Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
