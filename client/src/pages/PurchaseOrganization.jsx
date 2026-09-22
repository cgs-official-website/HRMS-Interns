import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { createCompany, registerUser, assignCompanyToUser, db } from "../firebase";
import { Sparkles, ShieldCheck, BarChart, Building, User, FileText, Lock, Mail, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Logo from "../components/Logo";

export default function PurchaseOrganization() {
  const [orgName, setOrgName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("Demo Plan");
  
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [adminProgram, setAdminProgram] = useState("Full-Time");
  const [shiftType, setShiftType] = useState("Morning");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("18:00");

  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth(); // Need to auto-login after creation

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName || !serviceType || !orgSize || !ceoName || !gstNumber || !adminName || !adminEmail || !adminPassword) {
      return showToast("Please fill in all fields to complete registration", "warning");
    }

    if (adminPassword.length < 6) {
      return showToast("Admin password should be at least 6 characters long", "warning");
    }

    setLoading(true);
    try {
      // 0. Pre-generate the Company ID client-side
      let pregeneratedCompanyId = "";
      try {
        const { collection, doc } = await import("firebase/firestore");
        if (db) {
          const compRef = doc(collection(db, "companies"));
          pregeneratedCompanyId = compRef.id;
        } else {
          pregeneratedCompanyId = "comp-" + Math.random().toString(36).substr(2, 9);
        }
      } catch (err) {
        pregeneratedCompanyId = "comp-" + Math.random().toString(36).substr(2, 9);
      }

      // 1. Create the Admin User, passing the pregenerated companyId directly!
      const userObj = await registerUser(
        adminName,
        "Administration",
        adminProgram,
        adminEmail,
        adminPassword,
        shiftStart,
        shiftEnd,
        25, 10, 6, "", "", [], [], adminProgram, "Company Admin", false, "ADMIN-01", "", "admin", pregeneratedCompanyId
      );

      // 2. Generate slug from org name
      const slug = orgName.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

      // 3. Create the Company with metadata and pending status
      const company = await createCompany({
        id: pregeneratedCompanyId,
        name: orgName,
        slug,
        adminId: userObj.uid,
        serviceType,
        orgSize,
        ceoName,
        gstNumber,
        plan: selectedPlan,
        modules: [],
        status: "pending"
      });

      // 4. Auto login as the new admin
      await login(adminEmail, adminPassword);
      
      showToast("Registration submitted. Your module is pending approval.", "success");
      navigate("/admin");
      
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to register organization.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-bg-base overflow-hidden">
      {/* Left Visual Panel - Dark Theme */}
      <div className="hidden lg:flex flex-[1.1] flex-col justify-between bg-gradient-to-br from-[#0c1322] to-[#040810] p-12 text-white relative overflow-hidden border-r border-border-card flex-shrink-0 sticky top-0 h-screen">
        {/* Decorative Grid / Blurs */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-primary filter blur-[120px] opacity-10 pointer-events-none" />

        {/* Top tag */}
        <div className="z-10 self-start flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold tracking-wider text-slate-300">
          <Sparkles size={12} className="text-brand-primary" />
          <span>ZUNA ENTERPRISE SETUP</span>
        </div>

        {/* Graphic & Slogans */}
        <div className="z-10 max-w-lg mx-auto flex flex-col items-center justify-center text-center my-auto gap-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight tracking-tight text-white">
              Elevate Your Operations
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Welcome to the self-service onboarding portal. Register your organization to unlock our enterprise-grade management, HR, and communication tools.
            </p>
          </div>

          <div className="space-y-4 w-full max-w-sm text-left">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Secure Architecture</h3>
                <p className="text-xs text-slate-400 mt-1">Multi-tenant data isolation and role-based access control.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <BarChart size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Automated Workflows</h3>
                <p className="text-xs text-slate-400 mt-1">Streamline project management and attendance tracking effortlessly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} Zuna Global</span>
          <span>Trusted by industry leaders</span>
        </div>
      </div>

      {/* Right Register Form Panel */}
      <div className="flex-1 lg:flex-[0.9] flex flex-col p-5 sm:p-8 lg:p-12 bg-bg-card w-full h-screen overflow-y-auto custom-scrollbar">
        {/* Header Branding */}
        <div className="flex justify-between items-center w-full max-w-[500px] mx-auto pt-2 flex-shrink-0">
          <Logo size={36} showText={true} />
        </div>

        {/* Center Card */}
        <div className="max-w-[500px] w-full mx-auto py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Register Organization</h2>
            <p className="text-sm text-text-sec">Set up your company workspace and create your administrator credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Section 1: Organization Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-mut border-b border-border-card pb-2">Business Information</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sec">Organization Name *</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                    placeholder="e.g. Acme Corporation"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec">Service Type *</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main focus:bg-bg-card focus:border-brand-primary outline-none transition-all appearance-none"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      disabled={loading}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="IT Services & BPO">IT Services & BPO</option>
                      <option value="SaaS / Software">SaaS / Software</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance & Accounting">Finance & Accounting</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec">Organization Size *</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main focus:bg-bg-card focus:border-brand-primary outline-none transition-all appearance-none"
                      value={orgSize}
                      onChange={(e) => setOrgSize(e.target.value)}
                      disabled={loading}
                      required
                    >
                      <option value="">Select Size</option>
                      <option value="1-50 Employees">1-50 Employees</option>
                      <option value="51-200 Employees">51-200 Employees</option>
                      <option value="201-500 Employees">201-500 Employees</option>
                      <option value="500+ Employees">500+ Employees</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec">CEO / Director Name *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                      placeholder="Full Name"
                      value={ceoName}
                      onChange={(e) => setCeoName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec">GST Registration Number *</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all uppercase"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Purchased Plan Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sec">Purchased Plan *</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main focus:bg-bg-card focus:border-brand-primary outline-none transition-all appearance-none font-bold"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    disabled={loading}
                    required
                  >
                    <option value="Demo Plan">Demo Plan (Free Trial)</option>
                    <option value="Basic Plan">Basic Plan</option>
                    <option value="Premium Plan">Premium Plan</option>
                    <option value="Enterprise Plan">Enterprise Plan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Administrator Credentials */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-mut border-b border-border-card pb-2">Administrator Account</h3>
              <p className="text-[11px] text-text-sec mb-2">These credentials will be used to access the Company Admin Portal.</p>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sec">Admin Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                    placeholder="System Administrator"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sec">Admin Email Address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                    placeholder="admin@yourcompany.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sec">Secure Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-10 pr-11 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                    placeholder="Minimum 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-mut hover:text-text-main cursor-pointer"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Program & Shift Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-mut border-b border-border-card pb-2">Admin Work Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec">Program Type</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main focus:bg-bg-card focus:border-brand-primary outline-none transition-all appearance-none"
                      value={adminProgram}
                      onChange={(e) => setAdminProgram(e.target.value)}
                      disabled={loading}
                      required
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec">Shift Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 py-2 px-2 border rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${shiftType === 'Morning' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-card text-text-main hover:bg-bg-base'}`}
                      onClick={() => {
                        setShiftType('Morning');
                        setShiftStart('09:00');
                        setShiftEnd('18:00');
                      }}
                    >
                      Morning Shift
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 px-2 border rounded-[8px] text-[11px] font-bold transition-all cursor-pointer ${shiftType === 'Night' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-bg-card border-border-card text-text-main hover:bg-bg-base'}`}
                      onClick={() => {
                        setShiftType('Night');
                        setShiftStart('21:00');
                        setShiftEnd('06:00');
                      }}
                    >
                      Night Shift
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-brand-primary/5 p-3 rounded-[12px] border border-dashed border-brand-primary/20">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-primary">Shift Start</label>
                  <input
                    type="time"
                    className="w-full px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-brand-primary">Shift End</label>
                  <input
                    type="time"
                    className="w-full px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm rounded-[12px] hover:shadow-lg hover:shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  "Setting up Workspace..."
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Complete Registration & Purchase
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-center text-text-mut mt-4">
                By registering, you agree to our Terms of Service and Privacy Policy. <br/>
                Already have an account? <Link to="/login" className="text-brand-primary hover:underline font-bold">Sign In</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

