import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeToCompanyDomains, 
  addCompanyDomain, 
  deleteCompanyDomain, 
  verifyCompanyDomain 
} from '../firebase';
import { Globe, Plus, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function DomainManager({ companyId }) {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeToCompanyDomains(companyId, (list) => {
      setDomains(list || []);
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain) return;
    
    // basic validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(newDomain)) {
      showToast('Please enter a valid domain (e.g., example.com)', 'warning');
      return;
    }

    setLoading(true);
    try {
      await addCompanyDomain(companyId, newDomain.toLowerCase().trim());
      showToast('Domain added. Please add the DNS record to verify.', 'success');
      setNewDomain('');
    } catch (error) {
      console.error('Error adding domain:', error);
      showToast(error.message || 'Failed to add domain.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDomain = async (id) => {
    if (!window.confirm('Are you sure you want to remove this domain? Users with this email domain will no longer be auto-assigned to your organization.')) return;
    try {
      await deleteCompanyDomain(id);
      showToast('Domain removed.', 'success');
    } catch (error) {
      console.error('Error deleting domain:', error);
      showToast(error.message || 'Failed to remove domain.', 'error');
    }
  };

  const handleVerifyDomain = async (id, domainName) => {
    const targetDomain = domainName || id;
    setVerifyingId(id);
    try {
      await verifyCompanyDomain(targetDomain);
      showToast('Domain verified successfully!', 'success');
    } catch (error) {
      console.error('Verification request failed:', error);
      showToast(error.message || 'Verification failed. Please ensure your DNS records are correct.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="text-brand-primary" size={24} />
        <h2 className="text-lg font-bold text-text-main">Custom Domains</h2>
      </div>

      <div className="mb-6 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg text-sm text-text-main">
        <p className="font-semibold text-brand-primary flex items-center gap-1.5 mb-1">
          <AlertCircle size={16} /> Secure Workspace Access
        </p>
        <p className="text-text-sec">
          Verify your organization's email domains to automatically route new users to this workspace. Users signing up with a verified domain will automatically join your company, and users without authorized domains will be blocked from joining via your custom link.
        </p>
      </div>

      <form onSubmit={handleAddDomain} className="flex gap-3 mb-8">
        <input 
          type="text"
          placeholder="e.g., yourcompany.com"
          value={newDomain}
          onChange={e => setNewDomain(e.target.value)}
          className="flex-1 bg-bg-base border border-border-card rounded-lg px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none"
        />
        <button 
          type="submit" 
          disabled={loading || !newDomain}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-hover transition-colors disabled:opacity-50"
        >
          <Plus size={16} /> Add Domain
        </button>
      </form>

      <div className="space-y-4">
        {domains.length === 0 ? (
          <div className="text-center py-8 text-text-mut text-sm">
            No domains added yet.
          </div>
        ) : (
          domains.map(domain => (
            <div key={domain.id} className="border border-border-card rounded-lg p-4 bg-bg-base/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-main">{domain.domain}</span>
                  {domain.status === 'VERIFIED' ? (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle size={12} /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Clock size={12} /> Pending Verification
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {domain.status === 'PENDING' && (
                    <button 
                      onClick={() => handleVerifyDomain(domain.id, domain.domain)}
                      disabled={verifyingId === domain.id}
                      className="text-xs font-bold bg-bg-card hover:bg-brand-primary hover:text-white border border-border-card text-text-main px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                    >
                      {verifyingId === domain.id ? 'Verifying...' : 'Verify Now'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteDomain(domain.id)}
                    className="p-1.5 text-text-mut hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {domain.status === 'PENDING' && (
                <div className="bg-bg-card border border-border-card rounded p-3 mt-2">
                  <p className="text-xs text-text-sec mb-2">
                    To verify ownership, please add the following TXT record to your DNS settings at your domain registrar:
                  </p>
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
                    <div className="text-text-mut font-semibold">Type:</div>
                    <div className="text-text-main font-mono">TXT</div>
                    
                    <div className="text-text-mut font-semibold">Host/Name:</div>
                    <div className="text-text-main font-mono">@</div>
                    
                    <div className="text-text-mut font-semibold">Value:</div>
                    <div className="text-text-main font-mono bg-bg-base p-1.5 rounded select-all break-all border border-border-card">
                      {domain.verificationToken}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
