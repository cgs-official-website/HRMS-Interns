import React, { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { User, Mail, Lock, Building, Briefcase, Clock, Sparkles, EyeOff, Eye, Hash } from "lucide-react";
import Logo from "../components/Logo";
import { getCompanyBySlug, checkDomainAuthorization } from "../firebase";

export default function Register() {
  const [name, setName] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("Full-Time");
  const [customProgram, setCustomProgram] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shiftType, setShiftType] = useState("Morning");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("18:00");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { companySlug } = useParams();

  React.useEffect(() => {
    const updateFavicon = (url) => {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url || "/favicon.png";
    };

    if (companySlug) {
      getCompanyBySlug(companySlug).then(company => {
        if (company && company.logoBase64) {
          updateFavicon(company.logoBase64);
        } else {
          updateFavicon("/favicon.png");
        }
      }).catch(() => {
        updateFavicon("/favicon.png");
      });
    } else {
      updateFavicon("/favicon.png");
    }
    
    return () => updateFavicon("/favicon.png");
  }, [companySlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDept = selectedDept === "Other" ? customDept.trim() : selectedDept;
    const finalProgram = selectedProgram === "Other" ? customProgram.trim() : selectedProgram;
    if (!name || !finalDept || !finalProgram || !email || !password || !shiftStart || !shiftEnd) {
      return showToast("Please fill in all fields", "warning");
    }

    if (password.length < 6) {
      return showToast("Password should be at least 6 characters long", "warning");
    }

    setLoading(true);
    try {
      const authCheck = await checkDomainAuthorization(email, companySlug);
      if (!authCheck.allowed) {
        setLoading(false);
        return showToast(authCheck.reason, "error");
      }

      await signup(name, finalDept, finalProgram, email, password, shiftStart, shiftEnd, employeeId, companySlug);
      showToast("Account registered successfully! Welcome to the portal.", "success");

      if (email.toLowerCase() === "admin@teamcarrezza.com" || email.toLowerCase().includes("superadmin")) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      showToast(error.message || "Failed to register account.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-bg-base overflow-hidden">
      {/* Left Visual Panel - Dark Theme - STICKY (fixed height, non-scrollable) */}
      <div className="hidden lg:flex flex-[1.1] flex-col justify-between bg-gradient-to-br from-[#0c1322] to-[#040810] p-12 text-white relative overflow-hidden border-r border-border-card flex-shrink-0 sticky top-0 h-screen">
        {/* Decorative Grid / Blurs */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-primary filter blur-[120px] opacity-10 pointer-events-none" />

        {/* Top tag */}
        <div className="z-10 self-start flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold tracking-wider text-slate-300">
          <Sparkles size={12} className="text-brand-primary" />
          <span>ENTERPRISE READY</span>
        </div>

        {/* Graphic & Slogans */}
        <div className="z-10 max-w-lg mx-auto flex flex-col items-center justify-center text-center my-auto gap-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight tracking-tight text-white">
              Join Carrezza Portal
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Get started by creating your account. Enter your department, program details, and working hours shift parameters to access your portal.
            </p>
          </div>

          {/* Graphical Mockup Card */}
          <div className="relative w-full max-w-[340px] bg-white/5 border border-white/10 rounded-[20px] p-6 shadow-2xl backdrop-blur-md">
            {/* Mock layout inside card */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-4 bg-white/10 rounded-full" />
              <div className="flex gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-brand-primary/40" />
                <div className="w-3.5 h-3.5 rounded-full bg-brand-primary/60" />
                <div className="w-3.5 h-3.5 rounded-full bg-brand-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div className="w-32 h-3 bg-white/10 rounded-full" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Building size={16} className="text-brand-primary" />
                </div>
                <div className="w-40 h-3 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="z-10 grid grid-cols-3 border-t border-white/10 pt-6 text-center text-xs text-slate-400">
          <div>
            <div className="text-white text-lg font-bold">99.9%</div>
            <div>Uptime</div>
          </div>
          <div className="border-x border-white/10">
            <div className="text-white text-lg font-bold">50k+</div>
            <div>Active Users</div>
          </div>
          <div>
            <div className="text-white text-lg font-bold">24/7</div>
            <div>Support</div>
          </div>
        </div>
      </div>

      {/* Right Register Form Panel */}
      <div className="flex-1 lg:flex-[0.9] flex flex-col p-5 sm:p-8 lg:p-12 bg-bg-card w-full h-screen overflow-y-auto">
        {/* Header Branding */}
        <div className="flex justify-between items-center w-full max-w-[460px] mx-auto pt-4 flex-shrink-0">
          <Logo size={36} showText={true} />
        </div>

        {/* Center Card */}
        <div className="max-w-[460px] w-full mx-auto my-auto py-8">
          {/* Tabs */}
          <div className="flex border-b border-border-card mb-6">
            <Link to={companySlug ? `/${companySlug}/login` : "/login"} className="py-2.5 px-4 font-semibold text-sm border-b-2 border-transparent text-text-sec hover:text-brand-primary transition-colors no-underline">
              Sign In
            </Link>
            <button className="py-2.5 px-4 font-bold text-sm border-b-2 border-brand-primary text-text-main cursor-pointer">
              Sign Up
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-text-main tracking-tight mb-1.5">Create account</h2>
            <p className="text-xs text-text-sec">Register as an Intern or Trainee to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-sec" htmlFor="name-input">Full Name</label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                />
                <input
                  id="name-input"
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Employee ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-sec" htmlFor="empid-input">Employee ID (Optional)</label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                />
                <input
                  id="empid-input"
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                  placeholder="e.g., EMP-001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-text-sec"
                htmlFor="dept-input"
              >
                Domain / Department
              </label>

              <div className="relative">
                <Building
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                />

                <select
                  id="dept-input"
                  className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main focus:bg-bg-card focus:border-brand-primary outline-none transition-all appearance-none"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Development">Development</option>
                  <option value="Designing">Designing</option>
                  <option value="Business Development">Business Development</option>
                  <option value="Management">Management</option>
                  <option value="Process Associate">Process Associate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {selectedDept === "Other" && (
                <div className="relative mt-2">
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                    placeholder="Enter your department name"
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              )}
            </div>

            {/* Program & Presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-sec" htmlFor="program-input">Program Type</label>
                <div className="relative">
                  <Briefcase
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                  />
                  <select
                    id="program-input"
                    className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main focus:bg-bg-card focus:border-brand-primary outline-none transition-all appearance-none"
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
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
                {selectedProgram === "Other" && (
                  <div className="relative mt-2">
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                      placeholder="Enter custom program type"
                      value={customProgram}
                      onChange={(e) => setCustomProgram(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                )}
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

            {/* Shift manual times */}
            <div className="grid grid-cols-2 gap-4 bg-brand-primary/5 p-3 rounded-[12px] border border-dashed border-brand-primary/20">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-brand-primary" htmlFor="shift-start-input">Shift Start</label>
                <input
                  id="shift-start-input"
                  type="time"
                  className="w-full px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-brand-primary" htmlFor="shift-end-input">Shift End</label>
                <input
                  id="shift-end-input"
                  type="time"
                  className="w-full px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-sec" htmlFor="email-input">Email Address</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                />
                <input
                  id="email-input"
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                  placeholder="john.doe@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-sec" htmlFor="password-input">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-11 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-[12px] hover:shadow-lg hover:shadow-brand-primary/10 transition-all mt-2 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>
        </div>

        {/* Footer Support */}
        <div className="text-center text-xs text-text-mut pb-4 flex-shrink-0">
          Professional support: <a href="mailto:info@teamcarrezza.com" className="font-bold text-brand-primary hover:underline">info@teamcarrezza.com</a>
        </div>
      </div>
    </div>
  );
}


