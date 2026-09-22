import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import Logo from "../components/Logo";
import { confirmPasswordReset } from "../firebase";
import { useToast } from "../context/ToastContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      const msg = "Invalid or missing password reset token. Please request a new link.";
      setErrorMessage(msg);
      showToast(msg, "error");
      return;
    }

    if (!password) {
      const msg = "Please enter your new password.";
      setErrorMessage(msg);
      showToast(msg, "warning");
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setErrorMessage(msg);
      showToast(msg, "warning");
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      setErrorMessage(msg);
      showToast(msg, "warning");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      localStorage.removeItem("att_auth_token");
      localStorage.removeItem("att_current_user");
      window.dispatchEvent(new Event("local-auth-updated"));
      setIsSuccess(true);
      showToast("Password reset successfully! You can now log in.", "success");
    } catch (err) {
      const msg = err.message || "Failed to reset password. The link may have expired.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-bg-base overflow-hidden">
      {/* Left Visual Panel */}
      <div className="hidden lg:flex flex-[1.1] flex-col justify-between bg-gradient-to-br from-[#0c1322] to-[#040810] p-12 text-white relative overflow-hidden border-r border-border-card flex-shrink-0 sticky top-0 h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-primary filter blur-[120px] opacity-10 pointer-events-none" />

        <div className="z-10 self-start flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold tracking-wider text-slate-300">
          <KeyRound size={12} className="text-brand-primary" />
          <span>ACCOUNT SECURITY</span>
        </div>

        <div className="z-10 max-w-lg mx-auto flex flex-col items-center justify-center text-center my-auto gap-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <KeyRound size={32} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 leading-tight tracking-tight text-white">
              Reset Your Password
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              Create a strong and secure new password to protect your Carrezza HRMS workspace account.
            </p>
          </div>
        </div>

        <div className="z-10 text-center text-xs text-slate-400 border-t border-white/10 pt-4">
          © {new Date().getFullYear()} Carrezza HRMS. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 lg:flex-[0.9] flex flex-col p-5 sm:p-8 lg:p-12 bg-bg-card w-full h-screen overflow-y-auto">
        <div className="flex justify-between items-center w-full max-w-[460px] mx-auto pt-4">
          <Logo size={36} showText={true} />
        </div>

        <div className="max-w-[460px] w-full mx-auto my-auto py-8">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Password Reset Complete!</h2>
              <p className="text-sm text-text-sec mb-6">
                Your password has been changed successfully. You can now use your new credentials to log in.
              </p>
              <button
                type="button"
                onClick={() => navigate(email ? `/login?email=${encodeURIComponent(email)}` : "/login")}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-[12px] shadow-lg shadow-brand-primary/20 transition-all cursor-pointer"
              >
                Go to Sign In
              </button>
            </div>
          ) : !token ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={36} />
              </div>
              <h2 className="text-2xl font-bold text-text-main mb-2">Invalid or Missing Link</h2>
              <p className="text-sm text-text-sec mb-6">
                The password reset link appears to be missing or incomplete. Please request a new password reset link from the login page.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-[12px] shadow-lg shadow-brand-primary/20 transition-all no-underline"
              >
                <ArrowLeft size={16} /> Return to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-1.5">
                  Set New Password
                </h2>
                <p className="text-xs text-text-sec">
                  {email ? (
                    <>Resetting password for <span className="font-semibold text-text-main">{email}</span></>
                  ) : (
                    "Please enter and confirm your new password below."
                  )}
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                    />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mut hover:text-text-main p-1 cursor-pointer bg-transparent border-0"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-sec" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mut pointer-events-none"
                    />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-sm text-text-main placeholder-text-mut focus:bg-bg-card focus:border-brand-primary outline-none transition-all"
                      placeholder="Repeat your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mut hover:text-text-main p-1 cursor-pointer bg-transparent border-0"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-[12px] shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <div className="text-center mt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-text-sec hover:text-brand-primary transition-colors no-underline font-medium"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
