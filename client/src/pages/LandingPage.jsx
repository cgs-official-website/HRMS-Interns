import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, ArrowRight, Shield, Users, Clock, CheckCircle, BarChart, Briefcase, Menu, X, Star, Zap, ChevronRight, Check } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import logoImg from "../assets/zuna-logo.png";
import Logo from "../components/Logo";
import { getLandingPageConfig } from "../firebase";

// Imported Assets
import dashboardMockup from "../assets/landing_dashboard.png";
import avatarImg from "../assets/testimonial_avatar.png";

export default function LandingPage() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [landingConfig, setLandingConfig] = useState(null);
  
  const { scrollY } = useScroll();
  const yHeroText = useTransform(scrollY, [0, 500], [0, 100]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.title = "Zuna | HRMS";
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    getLandingPageConfig().then((config) => {
      if (config) setLandingConfig(config);
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const isDark = theme === "dark";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-main font-sans overflow-x-hidden selection:bg-brand-primary/30 transition-colors duration-500 relative">
      
      {/* Deep Mesh Background */}
      <div className="fixed inset-0 z-0 bg-bg-base pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
        <div className={`absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px] transition-all duration-1000 ${isDark ? 'bg-brand-primary/20' : 'bg-brand-primary/40'}`}></div>
        <div className={`absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[150px] transition-all duration-1000 ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/40'}`}></div>
        <div className={`absolute top-[40%] right-[10%] w-[30vw] h-[30vw] rounded-full blur-[120px] transition-all duration-1000 ${isDark ? 'bg-purple-600/20' : 'bg-purple-400/40'}`}></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg-card/70 backdrop-blur-2xl border-b border-border-card shadow-lg shadow-black/5' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cursor-pointer">
              <Logo size={32} showText={true} />
            </motion.div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-bold text-text-sec hover:text-text-main transition-colors">Features</a>
              <a href="#testimonials" className="text-sm font-bold text-text-sec hover:text-text-main transition-colors">Testimonials</a>
              <a href="#pricing" className="text-sm font-bold text-text-sec hover:text-text-main transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-card border border-border-card text-text-sec hover:text-brand-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </motion.button>

              <div className="hidden sm:flex items-center gap-4">
                <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-text-main border border-border-card rounded-full bg-bg-card hover:bg-bg-base transition-colors shadow-sm">
                  Log in
                </Link>
                <Link to="/purchase" className="group relative px-6 py-2.5 font-bold text-white rounded-full overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.4)] block hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-indigo-500"></div>
                  <div className="relative flex items-center gap-2">
                    Get Started
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              <button 
                className="sm:hidden text-text-main"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden bg-bg-card/95 backdrop-blur-3xl border-t border-border-card px-4 py-6 flex flex-col gap-4 overflow-hidden"
            >
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-bold text-text-sec">Features</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-bold text-text-sec">Pricing</a>
              <hr className="border-border-card my-2" />
              <Link to="/login" className="w-full text-center py-3 text-sm font-bold text-text-main border border-border-card rounded-[12px] bg-bg-base" onClick={() => setIsMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/purchase" className="w-full text-center py-3 text-sm font-bold text-white bg-brand-primary rounded-[12px]" onClick={() => setIsMobileMenuOpen(false)}>
                Register Workspace
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div 
              style={{ y: yHeroText, opacity: opacityHero }}
              className="text-left"
            >
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Zap size={14} className="text-brand-primary drop-shadow-[0_0_5px_rgba(139,92,246,0.5)]" />
                </motion.div>
                {landingConfig?.heroBadgeText || "The Future of Work is Here"}
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-text-main mb-6 leading-[1.1]"
              >
                {landingConfig?.heroTitlePart1 || "Unify Your"} <br/>
                <motion.span 
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% auto" }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-[#a855f7] to-[#6366f1] inline-block pb-2 drop-shadow-sm"
                >
                  {landingConfig?.heroTitlePart2 || "Multi-Vendor Teams"}
                </motion.span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-text-sec max-w-lg mb-10 font-medium leading-relaxed"
              >
                {landingConfig?.heroSubtitle || "An enterprise-grade HRMS that seamlessly tracks attendance, manages projects, and aligns your entire distributed workforce across multiple organizations."}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/purchase" className="group px-8 py-4 bg-text-main text-bg-base font-bold text-base rounded-full hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10">
                  Register Workspace
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="group px-8 py-4 bg-bg-card/50 backdrop-blur-md border border-border-card text-text-main font-bold text-base rounded-full hover:bg-bg-base transition-all flex items-center justify-center gap-2 hover:border-brand-primary/50">
                  Employee Login
                </Link>
              </motion.div>
              
            </motion.div>

            {/* Right Dashboard Mockup (Floating & 3D) */}
            <motion.div 
              initial={{ opacity: 0, x: 50, rotateY: 25, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, rotateY: -5, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring", stiffness: 40 }}
              className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] perspective-1000"
            >
              {/* Decorative glows behind image */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-tr from-brand-primary/40 via-purple-500/30 to-indigo-500/40 rounded-3xl blur-[80px] -z-10"
              ></motion.div>
              
              <motion.div 
                animate={{ y: [0, -25, 0], rotateX: [0, 2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full relative z-10"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 bg-bg-card/40 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <img src={dashboardMockup} alt="Zuna Dashboard Interface" className="w-[110%] h-[110%] object-cover opacity-90 mix-blend-lighten" />
                  
                  {/* Floating Glass Cards Overlay */}
                  <motion.div 
                    animate={{ y: [0, 15, 0], x: [0, -5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -left-6 bottom-20 bg-bg-card/90 backdrop-blur-2xl border border-border-card p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-4"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CheckCircle size={24} />
                      </motion.div>
                    </div>
                    <div>
                      <p className="text-xs text-text-mut font-bold uppercase tracking-wider">Attendance</p>
                      <p className="text-xl font-black text-text-main">98.5%</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute -right-6 top-20 bg-bg-card/90 backdrop-blur-2xl border border-border-card p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col gap-2"
                    style={{ transform: "translateZ(40px)" }}
                  >
                    <p className="text-xs text-text-mut font-bold uppercase tracking-wider">Active Projects</p>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/50 shadow-inner"></div>
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 shadow-inner"></div>
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 shadow-inner"></div>
                      <div className="w-8 h-8 rounded-full bg-bg-base border border-border-card flex items-center justify-center text-[10px] font-black">+12</div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* Social Proof Text */}
      <section className="py-10 border-y border-border-card bg-bg-base/50 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-text-mut uppercase tracking-widest">
            Empowering Modern Enterprises with Secure Workforce Management
          </p>
        </div>
      </section>

      {/* Premium Bento Grid Features */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-text-main mb-6 tracking-tight">{landingConfig?.featuresTitle || "Everything to manage your"} <span className="text-brand-primary">workforce</span></h2>
            <p className="text-text-sec text-lg font-medium">{landingConfig?.featuresSubtitle || "From precise GPS attendance to complex project tracking, Zuna handles it all with an elegant, intuitive interface."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Large Card 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-bg-card/60 backdrop-blur-3xl border border-border-card rounded-[2rem] p-10 relative overflow-hidden group hover:border-brand-primary/40 transition-colors shadow-2xl shadow-black/5"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl group-hover:bg-brand-primary/20 transition-colors"></div>
              <div className="w-14 h-14 bg-bg-base border border-border-card rounded-2xl flex items-center justify-center text-brand-primary mb-6 relative z-10 shadow-sm">
                <Clock size={28} />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-3 relative z-10">{landingConfig?.feature1Title || "Live GPS Attendance"}</h3>
              <p className="text-text-sec leading-relaxed font-medium max-w-md relative z-10">
                {landingConfig?.feature1Desc || "Precision tracking with geofencing. Know exactly when and where your remote or on-site team members clock in, complete with automated break timers."}
              </p>
            </motion.div>

            {/* Small Card 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-bg-card/60 backdrop-blur-3xl border border-border-card rounded-[2rem] p-10 relative overflow-hidden group hover:border-purple-500/40 transition-colors shadow-2xl shadow-black/5"
            >
              <div className="w-14 h-14 bg-bg-base border border-border-card rounded-2xl flex items-center justify-center text-purple-500 mb-6 relative z-10 shadow-sm">
                <Shield size={28} />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-3 relative z-10">{landingConfig?.feature2Title || "Leave Management"}</h3>
              <p className="text-text-sec leading-relaxed font-medium relative z-10">
                {landingConfig?.feature2Desc || "Automated workflows for sick, casual, and paid leaves with instant manager approvals."}
              </p>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-bg-card/60 backdrop-blur-3xl border border-border-card rounded-[2rem] p-10 relative overflow-hidden group hover:border-indigo-500/40 transition-colors shadow-2xl shadow-black/5"
            >
              <div className="w-14 h-14 bg-bg-base border border-border-card rounded-2xl flex items-center justify-center text-indigo-500 mb-6 relative z-10 shadow-sm">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-3 relative z-10">{landingConfig?.feature3Title || "Multi-Vendor"}</h3>
              <p className="text-text-sec leading-relaxed font-medium relative z-10">
                {landingConfig?.feature3Desc || "Manage multiple organizations and sub-contractors from a single super-admin pane of glass."}
              </p>
            </motion.div>

            {/* Large Card 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-bg-card/60 backdrop-blur-3xl border border-border-card rounded-[2rem] p-10 relative overflow-hidden group hover:border-emerald-500/40 transition-colors shadow-2xl shadow-black/5"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
              <div className="w-14 h-14 bg-bg-base border border-border-card rounded-2xl flex items-center justify-center text-emerald-500 mb-6 relative z-10 shadow-sm">
                <Briefcase size={28} />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-3 relative z-10">{landingConfig?.feature4Title || "Project & Task Mastery"}</h3>
              <p className="text-text-sec leading-relaxed font-medium max-w-md relative z-10">
                {landingConfig?.feature4Desc || "Assign tasks, track progress in real-time, and manage multi-vendor projects effortlessly with tailored access controls and agile kanban boards."}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-text-main mb-4 tracking-tight">{landingConfig?.pricingTitle || "Simple, Transparent Pricing"}</h2>
            <p className="text-text-sec text-lg font-medium">{landingConfig?.pricingSubtitle || "One powerful enterprise plan designed to scale with your organization."}</p>
          </div>

          <div className="max-w-lg mx-auto bg-bg-card/60 backdrop-blur-3xl border-2 border-brand-primary/40 rounded-[3rem] p-10 sm:p-12 shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-primary via-purple-500 to-indigo-500"></div>
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-text-main">{landingConfig?.pricingPlanName || "Enterprise"}</h3>
                <p className="text-text-sec text-sm font-semibold mt-1">{landingConfig?.pricingPlanDesc || "For growing organizations"}</p>
              </div>
              <div className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider rounded-full border border-brand-primary/20">
                Popular
              </div>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-black text-text-main">{landingConfig?.pricingAmount || "INR 0"}</span>
              <span className="text-text-mut font-bold"> {landingConfig?.pricingPeriod || "/ 30-day trial"}</span>
            </div>

            <ul className="space-y-4 mb-10">
              {["Unlimited Employees", "Advanced GPS Attendance", "Leave Management Workflow", "Project & Task Management", "24/7 Priority Support", "Custom Excel/PDF Reports"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-text-main font-semibold text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check size={12} strokeWidth={4} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Link to="/purchase" className="w-full block text-center py-4 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-primary/20">
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Zuna */}
      <section id="testimonials" className="py-24 relative z-10 border-y border-border-card bg-bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-center mb-16 text-text-main">{landingConfig?.testimonialsTitle || "Enterprise-Grade Security & Reliability"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-bg-card border border-border-card p-8 rounded-3xl relative">
              <div className="flex gap-1 text-brand-primary mb-6">
                <Shield size={24} />
              </div>
              <h4 className="font-bold text-text-main text-lg mb-2">{landingConfig?.testimonial1Title || "Secure by Design"}</h4>
              <p className="text-text-sec font-medium leading-relaxed mb-4 relative z-10">
                {landingConfig?.testimonial1Desc || "End-to-end encryption for all organizational data. Role-based access control guarantees that super-admins, admins, and employees only see exactly what they need."}
              </p>
            </div>
            
            <div className="bg-bg-card border border-border-card p-8 rounded-3xl relative">
              <div className="flex gap-1 text-emerald-500 mb-6">
                <CheckCircle size={24} />
              </div>
              <h4 className="font-bold text-text-main text-lg mb-2">{landingConfig?.testimonial2Title || "Multi-Tenant Architecture"}</h4>
              <p className="text-text-sec font-medium leading-relaxed mb-4 relative z-10">
                {landingConfig?.testimonial2Desc || "Manage multiple workspaces securely. Complete data isolation between different vendor organizations with a unified interface for Super Admins."}
              </p>
            </div>

            <div className="bg-bg-card border border-border-card p-8 rounded-3xl relative">
              <div className="flex gap-1 text-purple-500 mb-6">
                <Clock size={24} />
              </div>
              <h4 className="font-bold text-text-main text-lg mb-2">{landingConfig?.testimonial3Title || "Real-Time Sync"}</h4>
              <p className="text-text-sec font-medium leading-relaxed mb-4 relative z-10">
                {landingConfig?.testimonial3Desc || "Instantly track GPS attendance, timesheets, and live chat across distributed global teams with zero delay and perfect accuracy."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 relative z-10 overflow-hidden text-center">
        <h2 className="text-5xl sm:text-7xl font-black mb-8 text-text-main tracking-tight">Ready to <span className="text-brand-primary">Elevate?</span></h2>
        <Link to="/purchase" className="inline-flex items-center justify-center px-10 py-5 bg-text-main text-bg-base font-black text-lg rounded-full hover:scale-105 transition-all shadow-2xl">
          Get Started Today <ChevronRight className="ml-2" />
        </Link>
      </section>

      {/* Footer Links */}
      <footer className="relative z-10 border-t border-border-card bg-bg-base pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="col-span-2">
              <Logo size={32} showText={true} />
              <p className="text-text-sec mt-6 font-medium max-w-sm">
                A premium, reliable, and flexible multi-vendor platform designed to modernize the future of work.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-xs">Product</h4>
              <ul className="space-y-3 text-sm font-semibold text-text-sec">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-text-main mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-3 text-sm font-semibold text-text-sec">
                <li><a href="#" className="hover:text-brand-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border-card text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-text-mut">
            <p>&copy; {new Date().getFullYear()} Carrezza Global Solutions. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-text-main transition-colors">Terms</a>
              <a href="#" className="hover:text-text-main transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

