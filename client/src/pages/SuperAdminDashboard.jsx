import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getCompanies, createCompany, registerUser, autoMigrateFirebase, getCompanyStats, approveCompany, updateCompanyStatus, recoverLostData, deleteCompany, updateCompanyDetails, getLandingPageConfig, updateLandingPageConfig } from "../firebase";
import { useToast } from "../context/ToastContext";
import { useModal } from "../context/ModalContext";
import { Building2, Plus, Users, ShieldAlert, Link as LinkIcon, X, CheckSquare, Calendar as CalendarIcon, Download, FileText, Trash2, Layout } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", slug: "", adminEmail: "", adminPassword: "", adminName: "" });
  const [submitting, setSubmitting] = useState(false);

  const [showLandingModal, setShowLandingModal] = useState(false);
  const [landingTab, setLandingTab] = useState("hero"); // hero, features, pricing, trust
  const [landingConfig, setLandingConfig] = useState({
    // Hero
    heroBadgeText: "", heroTitlePart1: "", heroTitlePart2: "", heroSubtitle: "",
    // Features
    featuresTitle: "", featuresSubtitle: "",
    feature1Title: "", feature1Desc: "",
    feature2Title: "", feature2Desc: "",
    feature3Title: "", feature3Desc: "",
    feature4Title: "", feature4Desc: "",
    // Pricing
    pricingTitle: "", pricingSubtitle: "", pricingPlanName: "", pricingPlanDesc: "", pricingAmount: "", pricingPeriod: "",
    // Trust/Testimonials
    testimonialsTitle: "",
    testimonial1Title: "", testimonial1Desc: "",
    testimonial2Title: "", testimonial2Desc: "",
    testimonial3Title: "", testimonial3Desc: ""
  });
  const [savingLanding, setSavingLanding] = useState(false);

  // Stats Modal State
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyStats, setCompanyStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedModules, setSelectedModules] = useState([]);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const totalOrgs = companies.length;
  const pendingCount = companies.filter(c => c.status === "pending").length;
  const activeCount = companies.filter(c => c.status === "active").length;

  useEffect(() => {
    fetchCompanies();
    fetchLandingConfig();
  }, []);

  const fetchLandingConfig = async () => {
    const config = await getLandingPageConfig();
    if (config) {
      setLandingConfig(config);
    }
  };

  const handleSaveLandingConfig = async (e) => {
    e.preventDefault();
    setSavingLanding(true);
    try {
      await updateLandingPageConfig(landingConfig);
      showToast("Landing page updated successfully!", "success");
      setShowLandingModal(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to update landing page", "error");
    } finally {
      setSavingLanding(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      await autoMigrateFirebase();
      const data = await getCompanies();
      const sorted = (data || []).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      const withCodes = sorted.map((c, idx) => ({
        ...c,
        companyCode: `ZUNAHR${String(idx + 1).padStart(4, '0')}`
      }));
      setCompanies(withCodes);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch companies", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = async (company) => {
    setSelectedCompany(company);
    setSelectedModules(company.modules || ["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]);
    setCloudinaryCloudName(company.cloudinaryCloudName || "");
    setCloudinaryUploadPreset(company.cloudinaryUploadPreset || "");
    setLoadingStats(true);
    try {
      const stats = await getCompanyStats(company.id);
      setCompanyStats(stats);
    } catch (e) {
      console.error(e);
      setCompanyStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleStatusChange = async (companyId, newStatus) => {
    try {
      await updateCompanyStatus(companyId, newStatus);
      showToast(`Status updated to ${newStatus}`, "success");
      fetchCompanies();
      setSelectedCompany(prev => ({...prev, status: newStatus}));
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteCompany = (companyId) => {
    showConfirm(
      "Delete Organization", 
      "Are you sure you want to permanently delete this organization? This action cannot be undone.", 
      async () => {
        try {
          await deleteCompany(companyId);
          showToast("Organization deleted successfully", "success");
          setSelectedCompany(null);
          fetchCompanies();
        } catch (error) {
          showToast("Failed to delete organization", "error");
        }
      },
      { confirmText: "Delete", cancelText: "Cancel" }
    );
  };

  const handleGenerateInvoice = () => {
    try {
      if (!selectedCompany) return;
      
      const doc = new jsPDF();
      const primaryColor = [0, 97, 224];
      const secondaryColor = [240, 244, 250];
      const textColor = [51, 65, 85];
      const textMutColor = [100, 116, 139];
      
      // ---------------- HEADER ----------------
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 50, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text("INVOICE", 14, 32);
      
      // Company details (Top Right)
      doc.setFontSize(16);
      doc.text("Zuna HRMS", 196, 24, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("123 Tech Park, Innovation Way", 196, 32, { align: "right" });
      doc.text("billing@zunaglobal.com", 196, 38, { align: "right" });

      // ---------------- INFO SECTION ----------------
      // Bill To
      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("BILLED TO", 14, 65);
      
      doc.setFontSize(11);
      doc.text(selectedCompany.name || "Organization", 14, 73);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...textMutColor);
      doc.text(`Company ID: ${selectedCompany.companyCode || selectedCompany.id}`, 14, 80);
      doc.text(`Created: ${new Date(selectedCompany.createdAt || Date.now()).toLocaleDateString()}`, 14, 86);

      // Invoice Meta
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...textColor);
      doc.text("Invoice No:", 135, 73);
      doc.text("Invoice Date:", 135, 80);
      doc.text("Amount Due:", 135, 87);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...textMutColor);
      doc.text(`INV-${Math.floor(Math.random() * 100000)}`, 196, 73, { align: "right" });
      doc.text(new Date().toLocaleDateString(), 196, 80, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text("INR 24,999.00", 196, 87, { align: "right" });

      // ---------------- TABLE ----------------
      doc.autoTable({
        startY: 100,
        head: [['Description', 'Qty', 'Unit Price', 'Amount']],
        body: [
          ['Zuna Enterprise Subscription (Monthly)', '1', '24,999.00', '24,999.00'],
          ['Priority Support Access', '1', 'Included', 'Included'],
          ['Automated Backups', '1', 'Included', 'Included'],
        ],
        theme: 'grid',
        headStyles: { 
          fillColor: primaryColor, 
          textColor: 255, 
          fontStyle: 'bold',
          cellPadding: 6
        },
        bodyStyles: { 
          textColor: 80, 
          fontSize: 10,
          cellPadding: 6
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 37 }
        },
        alternateRowStyles: { fillColor: secondaryColor },
        margin: { left: 14, right: 14 },
      });

      // ---------------- TOTALS ----------------
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 150;
      
      // Add a neat summary box
      doc.setFillColor(248, 250, 252);
      // x=116, w=80 => spans from 116 to 196
      doc.rect(116, finalY - 6, 80, 34, 'F');
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      
      // Labels
      doc.text("Subtotal:", 122, finalY + 2);
      doc.text("Tax (18%):", 122, finalY + 10);
      doc.setFont("helvetica", "bold");
      doc.text("Total Due:", 122, finalY + 20);
      
      // Values (Aligned Right to 190)
      doc.setFont("helvetica", "normal");
      doc.text("21,185.59", 190, finalY + 2, { align: "right" });
      doc.text("3,813.41", 190, finalY + 10, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.setFontSize(12);
      doc.text("INR 24,999.00", 190, finalY + 20, { align: "right" });

      // ---------------- FOOTER ----------------
      const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 20, 196, pageHeight - 20);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...textMutColor);
      doc.text("Thank you for choosing Zuna HRMS! We appreciate your business.", 105, pageHeight - 12, { align: 'center' });

      doc.save(`Invoice_${selectedCompany.slug || 'company'}_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("Premium Invoice generated successfully.", "success");
    } catch (err) {
      console.error("PDF Error:", err);
      showToast("Failed to generate PDF: " + err.message, "error");
    }
  };

  const handleApproveCompany = async (companyId) => {
    try {
      await updateCompanyDetails(companyId, {
        status: "active",
        modules: selectedModules,
        cloudinaryCloudName,
        cloudinaryUploadPreset
      });
      showToast("Organization approved and modules configured successfully!", "success");
      fetchCompanies();
      setSelectedCompany(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to approve organization", "error");
    }
  };

  const handleSaveConfiguration = async (companyId) => {
    try {
      setSavingConfig(true);
      await updateCompanyDetails(companyId, {
        modules: selectedModules,
        cloudinaryCloudName,
        cloudinaryUploadPreset
      });
      showToast("Module settings saved successfully!", "success");
      fetchCompanies();
      setSelectedCompany(prev => ({ 
        ...prev, 
        modules: selectedModules, 
        cloudinaryCloudName, 
        cloudinaryUploadPreset 
      }));
    } catch (e) {
      console.error(e);
      showToast("Failed to update configurations", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create company first to get ID
      const company = await createCompany({
        name: newCompany.name,
        slug: newCompany.slug,
        status: "pending"
      });
      const companyId = company.id;
      
      // 2. Register Admin for this company
      const adminUser = await registerUser(
        newCompany.adminName, 
        "Administration", 
        "Full-time", 
        newCompany.adminEmail, 
        newCompany.adminPassword,
        "09:00", "18:00", 25, 10, 6, "", "", [], [], "Full-time", "Company Admin", false, "ADMIN-01",
        "", "admin", companyId
      );
      
      showToast("Company & Admin provisioned successfully!", "success");
      setShowModal(false);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to provision company", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-3">
            <ShieldAlert className="text-brand-primary shrink-0" size={32} />
            Super Admin Portal
          </h1>
          <p className="text-text-mut font-medium mt-1 text-sm sm:text-base">Manage Vendors and Sub-Organizations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={async () => {
              const res = await recoverLostData();
              if (res.success) showToast(res.msg, "success");
              else showToast(res.msg, "error");
            }}
            className="w-full sm:w-auto py-2.5 px-5 bg-amber-500/10 text-amber-500 font-bold rounded-[12px] hover:bg-amber-500 hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            <ShieldAlert size={18} className="shrink-0" />
            <span className="whitespace-nowrap">Recover Data</span>
          </button>
          <button 
            onClick={() => setShowLandingModal(true)}
            className="w-full sm:w-auto py-2.5 px-5 bg-purple-500/10 text-purple-500 font-bold rounded-[12px] hover:bg-purple-500 hover:text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            <Layout size={18} className="shrink-0" />
            <span className="whitespace-nowrap">Manage Landing Page</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto py-2.5 px-5 bg-brand-primary text-white font-bold rounded-[12px] hover:bg-brand-hover transition-all cursor-pointer shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} strokeWidth={3} className="shrink-0" />
            <span className="whitespace-nowrap">Provision New Organization</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-card border border-border-card rounded-[20px] p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">TOTAL ORGANIZATIONS</span>
            <span className="text-3xl font-extrabold text-text-main block mt-1.5">{totalOrgs}</span>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center relative z-10">
            <Building2 size={24} />
          </div>
        </div>
        <div className="bg-bg-card border border-border-card rounded-[20px] p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">PENDING APPROVAL</span>
            <span className="text-3xl font-extrabold text-text-main block mt-1.5">{pendingCount}</span>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-amber-500/10 text-amber-500 flex items-center justify-center relative z-10">
            <ShieldAlert size={24} />
          </div>
        </div>
        <div className="bg-bg-card border border-border-card rounded-[20px] p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">ACTIVE PLATFORMS</span>
            <span className="text-3xl font-extrabold text-text-main block mt-1.5">{activeCount}</span>
          </div>
          <div className="w-12 h-12 rounded-[14px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center relative z-10">
            <CheckSquare size={24} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-text-mut">Loading companies...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company, i) => (
            <div 
              key={i} 
              onClick={() => handleCompanyClick(company)}
              className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl relative overflow-hidden group cursor-pointer hover:border-brand-primary transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-purple-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-primary/5 rounded-[14px] flex items-center justify-center text-brand-primary shrink-0 overflow-hidden shadow-inner border border-brand-primary/10">
                    {company.logoBase64 ? (
                      <img src={company.logoBase64} alt="Logo" className="w-full h-full object-contain bg-white p-1" onError={(e) => e.target.style.display='none'} />
                    ) : (
                      <span className="text-xl font-black">{company.name ? company.name.charAt(0).toUpperCase() : <Building2 size={24} />}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-text-main leading-tight line-clamp-1" title={company.name}>{company.name}</h2>
                    <p className="text-xs text-text-mut mt-1 font-medium">{company.serviceType || "Enterprise Workspace"}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border ${company.status === "pending" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"}`}>
                  {company.status}
                </span>
              </div>

              <div className="space-y-3 bg-bg-base/50 p-4 rounded-[16px] border border-border-card">
                <div className="flex items-center gap-2 text-sm text-text-sec min-w-0">
                  <ShieldAlert size={16} className="text-brand-primary shrink-0" />
                  <span className="font-bold shrink-0">ID:</span> 
                  <span className="truncate">{company.companyCode || company.id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-sec min-w-0">
                  <LinkIcon size={16} className="text-brand-primary shrink-0" />
                  <span className="font-bold shrink-0">Slug:</span> 
                  <span className="truncate">/{company.slug}/login</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-sec min-w-0">
                  <Users size={16} className="text-brand-primary shrink-0" />
                  <span className="font-bold shrink-0">Created:</span> 
                  <span className="truncate">{new Date(company.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-[24px] p-8 w-full max-w-xl shadow-2xl relative animate-scale-up overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-2xl font-black text-text-main mb-6">Provision New Company</h2>
            <form onSubmit={handleCreateCompany} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-text-sec uppercase tracking-wider border-b border-border-card pb-2">Company Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-mut mb-2">Company Name</label>
                    <input 
                      type="text" required
                      className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-mut mb-2">URL Slug (e.g. acme-corp)</label>
                    <input 
                      type="text" required
                      className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none"
                      value={newCompany.slug}
                      onChange={(e) => setNewCompany({...newCompany, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm text-text-sec uppercase tracking-wider border-b border-border-card pb-2">Admin Credentials</h3>
                <div>
                  <label className="block text-xs font-bold text-text-mut mb-2">Admin Full Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none"
                    value={newCompany.adminName}
                    onChange={(e) => setNewCompany({...newCompany, adminName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-mut mb-2">Admin Email</label>
                    <input 
                      type="email" required
                      className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none"
                      value={newCompany.adminEmail}
                      onChange={(e) => setNewCompany({...newCompany, adminEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-mut mb-2">Initial Password</label>
                    <input 
                      type="password" required
                      className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none"
                      value={newCompany.adminPassword}
                      onChange={(e) => setNewCompany({...newCompany, adminPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-text-sec bg-bg-base hover:bg-border-card rounded-full transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-full transition-colors disabled:opacity-50">
                  {submitting ? "Provisioning..." : "Provision Company"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedCompany && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in" onClick={() => setSelectedCompany(null)}>
          <div className="bg-bg-card border border-border-card rounded-[24px] p-8 w-full max-w-2xl shadow-2xl relative animate-scale-up overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedCompany(null)}
              className="absolute top-6 right-6 text-text-mut hover:text-text-main transition-colors bg-bg-base hover:bg-border-card p-2 rounded-full"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-8 border-b border-border-card pb-6">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-[16px] flex items-center justify-center text-brand-primary shrink-0 overflow-hidden shadow-inner border border-brand-primary/10">
                {selectedCompany.logoBase64 ? (
                  <img src={selectedCompany.logoBase64} alt="Logo" className="w-full h-full object-contain bg-white p-1" onError={(e) => e.target.style.display='none'} />
                ) : (
                  <span className="text-2xl font-black">{selectedCompany.name ? selectedCompany.name.charAt(0).toUpperCase() : <Building2 size={32} />}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-main">{selectedCompany.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${selectedCompany.status === "pending" ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10"}`}>
                    {selectedCompany.status}
                  </span>
                  <span className="text-sm font-semibold text-text-sec">/{selectedCompany.slug}</span>
                </div>
              </div>
            </div>

            {loadingStats ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
              </div>
            ) : companyStats ? (
              <div className="bg-gradient-to-br from-brand-primary/10 to-transparent border border-brand-primary/20 rounded-[20px] p-8 text-center shadow-lg relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute -top-10 -right-10 text-brand-primary/5">
                  <Users size={160} />
                </div>
                <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-4 relative z-10">
                  <Users size={32} />
                </div>
                <h3 className="text-5xl font-black text-text-main relative z-10">{companyStats.totalUsers}</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-brand-primary mt-2 relative z-10">Total Active Users</p>
              </div>
            ) : (
              <div className="text-center text-text-mut py-8 font-semibold">Stats unavailable.</div>
            )}
            
            <div className="mt-8 bg-bg-base rounded-[16px] p-6 border border-border-card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-text-main uppercase tracking-wider">System Details</h4>
                <button 
                  onClick={handleGenerateInvoice}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 hover:shadow-lg transition-colors rounded-full text-xs font-bold"
                >
                  <FileText size={14} />
                  Download Invoice
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-mut font-semibold">Company ID</span>
                  <span className="font-mono text-xs bg-bg-card px-2 py-1 rounded text-text-sec">{selectedCompany.id}</span>
                </div>
                <div className="flex justify-between items-center text-sm gap-4 min-w-0">
                  <span className="text-text-mut font-semibold whitespace-nowrap shrink-0">Login URL</span>
                  <span className="font-medium text-brand-primary hover:underline cursor-pointer truncate">/{selectedCompany.slug}/login</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-mut font-semibold">Created Date</span>
                  <span className="text-text-main font-semibold text-xs">{new Date(selectedCompany.createdAt).toLocaleString()}</span>
                </div>
                
                {selectedCompany.serviceType && (
                  <div className="flex justify-between items-center text-sm border-t border-border-card pt-3 mt-3">
                    <span className="text-text-mut font-semibold">Service Type</span>
                    <span className="text-text-main font-semibold text-xs">{selectedCompany.serviceType}</span>
                  </div>
                )}
                {selectedCompany.orgSize && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-text-mut font-semibold">Organization Size</span>
                    <span className="text-text-main font-semibold text-xs">{selectedCompany.orgSize}</span>
                  </div>
                )}
                {selectedCompany.ceoName && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-text-mut font-semibold">CEO / Director</span>
                    <span className="text-text-main font-semibold text-xs">{selectedCompany.ceoName}</span>
                  </div>
                )}
                {selectedCompany.gstNumber && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-text-mut font-semibold">GST Number</span>
                    <span className="font-mono text-xs bg-bg-card px-2 py-1 rounded text-text-sec">{selectedCompany.gstNumber}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm border-t border-border-card pt-3 mt-3">
                  <span className="text-text-mut font-semibold">Purchased Plan</span>
                  <span className="text-brand-primary font-bold text-xs uppercase bg-brand-primary/10 px-2.5 py-1 rounded-full">{selectedCompany.plan || "Demo Plan"}</span>
                </div>

                {/* Module Checklist */}
                <div className="border-t border-border-card pt-4 mt-4 space-y-4">
                  <h5 className="text-xs font-extrabold text-text-main uppercase tracking-wider">Permitted Modules</h5>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {[
                      { id: "attendance", label: "Attendance System" },
                      { id: "team-hub", label: "Team Hub Chat" },
                      { id: "projects", label: "Project Management" },
                      { id: "tasks", label: "Task Management" },
                      { id: "assets", label: "Asset Management" },
                      { id: "payroll", label: "Payroll Manager" },
                      { id: "cloudinary", label: "Cloudinary Storage" }
                    ].map(mod => (
                      <label key={mod.id} className="flex items-center gap-2 text-xs font-semibold text-text-sec cursor-pointer hover:text-text-main">
                        <input 
                          type="checkbox"
                          checked={selectedModules.includes(mod.id)}
                          className="rounded text-brand-primary border-border-card focus:ring-brand-primary/20 accent-brand-primary"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModules([...selectedModules, mod.id]);
                            } else {
                              setSelectedModules(selectedModules.filter(m => m !== mod.id));
                            }
                          }}
                        />
                        {mod.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cloudinary Config */}
                {selectedModules.includes("cloudinary") && (
                  <div className="border-t border-border-card pt-4 mt-4 space-y-3">
                    <h5 className="text-xs font-extrabold text-brand-primary uppercase tracking-wider">Cloudinary Credentials</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] font-bold text-text-mut uppercase">Cloud Name *</label>
                        <input
                          type="text"
                          required
                          value={cloudinaryCloudName}
                          onChange={(e) => setCloudinaryCloudName(e.target.value)}
                          placeholder="e.g. dcfsh85uq"
                          className="w-full px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all font-bold"
                        />
                      </div>
                      <div className="flex flex-col gap-1 text-left">
                        <label className="text-[10px] font-bold text-text-mut uppercase">Upload Preset *</label>
                        <input
                          type="text"
                          required
                          value={cloudinaryUploadPreset}
                          onChange={(e) => setCloudinaryUploadPreset(e.target.value)}
                          placeholder="e.g. hrms_preset"
                          className="w-full px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm border-t border-border-card pt-3 mt-3">
                  <span className="text-text-mut font-semibold">Vendor Status</span>
                  <div className="flex items-center gap-2">
                    <select
                      className="bg-bg-card border border-border-card rounded-[8px] px-3 py-1.5 text-xs font-bold text-text-main outline-none focus:border-brand-primary transition-all cursor-pointer"
                      value={selectedCompany.status || "active"}
                      onChange={(e) => handleStatusChange(selectedCompany.id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending Approval</option>
                      <option value="deactive">Deactive</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-red-500/10">
                  <button 
                    onClick={() => handleDeleteCompany(selectedCompany.id)}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-bold rounded-[12px] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Trash2 size={16} />
                    Delete Organization
                  </button>
                </div>

                {selectedCompany.status === "active" && (
                  <div className="mt-4 pt-4 border-t border-border-card">
                    <button 
                      onClick={() => handleSaveConfiguration(selectedCompany.id)}
                      disabled={savingConfig}
                      className="w-full py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] transition-colors shadow-lg shadow-brand-primary/20 cursor-pointer"
                    >
                      {savingConfig ? "Saving Configuration..." : "Save Module Configurations"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {selectedCompany.status === "pending" && (
              <div className="mt-6 pt-6 border-t border-border-card">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[16px] p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-amber-500 text-sm">Action Required</h4>
                    <p className="text-xs text-amber-500/80 mt-1">This organization is waiting for your approval to unlock their portal.</p>
                  </div>
                  <button 
                    onClick={() => handleApproveCompany(selectedCompany.id)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full transition-colors text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}
      {showLandingModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-[24px] p-8 w-full max-w-3xl shadow-2xl relative animate-scale-up flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-black text-text-main mb-6 flex items-center gap-2 shrink-0">
              <Layout size={24} className="text-brand-primary" />
              Manage Landing Page
            </h2>
            
            <div className="flex gap-2 border-b border-border-card mb-6 shrink-0 overflow-x-auto custom-scrollbar pb-2">
              {[
                { id: "hero", label: "Hero Section" },
                { id: "features", label: "Features" },
                { id: "pricing", label: "Pricing" },
                { id: "trust", label: "Trust/Security" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setLandingTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold rounded-full transition-colors whitespace-nowrap ${landingTab === tab.id ? 'bg-brand-primary text-white' : 'text-text-sec hover:bg-bg-base'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
              <form id="landingConfigForm" onSubmit={handleSaveLandingConfig} className="space-y-6">
                
                {landingTab === "hero" && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-text-mut mb-2">Hero Badge Text</label>
                      <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.heroBadgeText || ""} onChange={(e) => setLandingConfig({...landingConfig, heroBadgeText: e.target.value})} placeholder="e.g. The Future of Work is Here" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-mut mb-2">Hero Title Part 1</label>
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.heroTitlePart1 || ""} onChange={(e) => setLandingConfig({...landingConfig, heroTitlePart1: e.target.value})} placeholder="e.g. Unify Your" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-mut mb-2">Hero Title Part 2 (Gradient)</label>
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.heroTitlePart2 || ""} onChange={(e) => setLandingConfig({...landingConfig, heroTitlePart2: e.target.value})} placeholder="e.g. Multi-Vendor Teams" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-mut mb-2">Hero Subtitle</label>
                      <textarea className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-3 text-sm text-text-main focus:border-brand-primary outline-none min-h-[100px]" value={landingConfig.heroSubtitle || ""} onChange={(e) => setLandingConfig({...landingConfig, heroSubtitle: e.target.value})} placeholder="e.g. An enterprise-grade HRMS..." />
                    </div>
                  </div>
                )}

                {landingTab === "features" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-card space-y-4">
                      <h4 className="font-bold text-sm text-brand-primary">Section Header</h4>
                      <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.featuresTitle || ""} onChange={(e) => setLandingConfig({...landingConfig, featuresTitle: e.target.value})} placeholder="Everything to manage your workforce" />
                      <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.featuresSubtitle || ""} onChange={(e) => setLandingConfig({...landingConfig, featuresSubtitle: e.target.value})} placeholder="From precise GPS attendance to..." />
                    </div>
                    
                    {[1,2,3,4].map(num => (
                      <div key={num} className="bg-bg-base/50 p-4 rounded-xl border border-border-card space-y-3">
                        <h4 className="font-bold text-sm text-brand-primary">Feature {num}</h4>
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig[`feature${num}Title`] || ""} onChange={(e) => setLandingConfig({...landingConfig, [`feature${num}Title`]: e.target.value})} placeholder={`Feature ${num} Title`} />
                        <textarea className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none h-20" value={landingConfig[`feature${num}Desc`] || ""} onChange={(e) => setLandingConfig({...landingConfig, [`feature${num}Desc`]: e.target.value})} placeholder={`Feature ${num} Description`} />
                      </div>
                    ))}
                  </div>
                )}

                {landingTab === "pricing" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-card space-y-4">
                      <h4 className="font-bold text-sm text-brand-primary">Section Header</h4>
                      <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.pricingTitle || ""} onChange={(e) => setLandingConfig({...landingConfig, pricingTitle: e.target.value})} placeholder="Simple, Transparent Pricing" />
                      <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.pricingSubtitle || ""} onChange={(e) => setLandingConfig({...landingConfig, pricingSubtitle: e.target.value})} placeholder="One powerful enterprise plan..." />
                    </div>
                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-card space-y-4">
                      <h4 className="font-bold text-sm text-brand-primary">Plan Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.pricingPlanName || ""} onChange={(e) => setLandingConfig({...landingConfig, pricingPlanName: e.target.value})} placeholder="Plan Name (e.g. Enterprise)" />
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.pricingPlanDesc || ""} onChange={(e) => setLandingConfig({...landingConfig, pricingPlanDesc: e.target.value})} placeholder="For growing organizations" />
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.pricingAmount || ""} onChange={(e) => setLandingConfig({...landingConfig, pricingAmount: e.target.value})} placeholder="Amount (e.g. INR 0)" />
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.pricingPeriod || ""} onChange={(e) => setLandingConfig({...landingConfig, pricingPeriod: e.target.value})} placeholder="Period (e.g. / 30-day trial)" />
                      </div>
                    </div>
                  </div>
                )}

                {landingTab === "trust" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-bg-base/50 p-4 rounded-xl border border-border-card space-y-4">
                      <h4 className="font-bold text-sm text-brand-primary">Section Header</h4>
                      <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig.testimonialsTitle || ""} onChange={(e) => setLandingConfig({...landingConfig, testimonialsTitle: e.target.value})} placeholder="Enterprise-Grade Security..." />
                    </div>
                    {[1,2,3].map(num => (
                      <div key={num} className="bg-bg-base/50 p-4 rounded-xl border border-border-card space-y-3">
                        <h4 className="font-bold text-sm text-brand-primary">Trust Point {num}</h4>
                        <input type="text" className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none" value={landingConfig[`testimonial${num}Title`] || ""} onChange={(e) => setLandingConfig({...landingConfig, [`testimonial${num}Title`]: e.target.value})} placeholder={`Title ${num}`} />
                        <textarea className="w-full bg-bg-base border border-border-card rounded-[12px] px-4 py-2 text-sm text-text-main focus:border-brand-primary outline-none h-20" value={landingConfig[`testimonial${num}Desc`] || ""} onChange={(e) => setLandingConfig({...landingConfig, [`testimonial${num}Desc`]: e.target.value})} placeholder={`Description ${num}`} />
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

            <div className="flex gap-4 pt-6 mt-4 border-t border-border-card shrink-0">
              <button type="button" onClick={() => setShowLandingModal(false)} className="flex-1 py-3 font-bold text-text-sec bg-bg-base hover:bg-border-card rounded-full transition-colors">
                Cancel
              </button>
              <button type="submit" form="landingConfigForm" disabled={savingLanding} className="flex-1 py-3 font-bold text-white bg-brand-primary hover:bg-brand-hover rounded-full transition-colors disabled:opacity-50">
                {savingLanding ? "Saving..." : "Save All Changes"}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
