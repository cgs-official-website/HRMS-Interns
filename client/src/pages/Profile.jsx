import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { updateUserRecord, uploadFileToFirebase, getCompanies, deleteCompany, updateCompanyDetails } from "../firebase";
import { User, Mail, Shield, ShieldAlert, Award, Clock, Save, Building, Copy, Check, Eye, Crop, Camera, Trash2, Sliders, Lock } from "lucide-react";
import ImageEditorModal from "../components/ImageEditorModal";

export default function Profile() {
  const { currentUser, updateCurrentUserState, changeUserPassword } = useAuth();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [name, setName] = useState(currentUser?.name || "");
  const [dept, setDept] = useState(currentUser?.department || "");
  const [programType, setProgramType] = useState(currentUser?.programType || "Internship");
  const [shiftStart, setShiftStart] = useState(currentUser?.shiftStart || "10:00");
  const [shiftEnd, setShiftEnd] = useState(currentUser?.shiftEnd || "19:00");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [dob, setDob] = useState(currentUser?.dob || "");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Image Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState(null);
  const [editorInitialMode, setEditorInitialMode] = useState("crop");

  const fileInputRef = useRef(null);
  const isAdmin = currentUser?.role === "admin";
  const [adminCompany, setAdminCompany] = useState(null);
  
  // Organization Branding State
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gracefully handle corrupted companyId object
  const actualCompanyId = typeof currentUser?.companyId === 'object' ? currentUser.companyId?.id : currentUser?.companyId;

  React.useEffect(() => {
    if (isAdmin && actualCompanyId) {
      getCompanies().then(comps => {
        const found = comps.find(c => c.id === actualCompanyId);
        if (found) {
          setAdminCompany(found);
          setOrgName(found.name || "");
          setOrgLogo(found.logoBase64 || "");
          setOrgAddress(found.address || "");
          setCloudinaryCloudName(found.cloudinaryCloudName || "");
          setCloudinaryUploadPreset(found.cloudinaryUploadPreset || "");
        }
      }).catch(console.error);
    }
  }, [isAdmin, currentUser, actualCompanyId]);

  const handleDeleteWorkspace = async () => {
    if (!currentUser?.companyId) return;
    setDeleteLoading(true);
    try {
      await deleteCompany(currentUser.companyId);
      showToast("Workspace deleted successfully. Logging out...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      showToast("Failed to delete workspace: " + err.message, "error");
      setDeleteLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (adminCompany) {
      const link = `${window.location.origin}/${adminCompany.slug}/login`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      showToast("Employee login link copied!", "success");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOrgLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return showToast("Logo size must be less than 5MB.", "warning");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 120;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setOrgLogo(compressedDataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOrgBranding = async (e) => {
    e.preventDefault();
    if (!adminCompany) return;
    try {
      setOrgLoading(true);
      await updateCompanyDetails(adminCompany.id, { 
        name: orgName, 
        logoBase64: orgLogo,
        address: orgAddress,
        cloudinaryCloudName,
        cloudinaryUploadPreset
      });
      showToast("Organization settings updated!", "success");
      // Force reload to update sidebar immediately without context wiring
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast("Failed to update organization: " + err.message, "error");
    } finally {
      setOrgLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !dept) {
      return showToast("Please fill in all required fields.", "warning");
    }

    setLoading(true);
    try {
      const finalShiftStart = isAdmin ? shiftStart : (currentUser.shiftStart || "10:00");
      const finalShiftEnd = isAdmin ? shiftEnd : (currentUser.shiftEnd || "19:00");
      const finalProgram = isAdmin ? programType : (currentUser.programType || "Internship");

      await updateUserRecord(
        currentUser.uid,
        name,
        dept,
        finalProgram,
        finalShiftStart,
        finalShiftEnd,
        currentUser.annualLeaves || 25,
        currentUser.sickLeaves || 10,
        currentUser.casualLeaves || 6,
        avatar,
        dob,
        currentUser.joiningDate,
        currentUser.projects || (currentUser.project ? [currentUser.project] : []),
        currentUser.tasks,
        currentUser.jobType,
        currentUser.designation
      );

      updateCurrentUserState({
        name,
        department: dept,
        programType: finalProgram,
        shiftStart: finalShiftStart,
        shiftEnd: finalShiftEnd,
        avatar,
        dob
      });

      showToast("Profile updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return showToast("Passwords do not match.", "warning");
    }
    if (newPassword.length < 6) {
      return showToast("Password must be at least 6 characters.", "warning");
    }

    setPasswordLoading(true);
    try {
      await changeUserPassword(newPassword);
      showToast("Password updated successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return showToast("Image size must be less than 10MB.", "warning");
      }
      const reader = new FileReader();
      reader.onload = () => {
        setEditorImageSrc(reader.result);
        setEditorInitialMode("crop");
        setIsEditorOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleOpenViewImage = () => {
    if (!avatar) return;
    setEditorImageSrc(avatar);
    setEditorInitialMode("view");
    setIsEditorOpen(true);
  };

  const handleOpenCropImage = () => {
    if (!avatar) {
      fileInputRef.current?.click();
      return;
    }
    setEditorImageSrc(avatar);
    setEditorInitialMode("crop");
    setIsEditorOpen(true);
  };

  const handleSaveEditedAvatar = async (file, dataUrl) => {
    try {
      setLoading(true);
      showToast("Uploading cropped profile picture to cloud...", "info");
      
      let finalAvatarUrl = dataUrl;
      try {
        const fileData = await uploadFileToFirebase(file, currentUser?.companyId || "", "profiles");
        if (fileData?.url) {
          finalAvatarUrl = fileData.url;
        }
      } catch (uploadErr) {
        console.warn("Cloud upload fallback to base64:", uploadErr);
      }

      setAvatar(finalAvatarUrl);
      showToast("Profile picture updated! Click 'Save Settings' to save changes.", "success");
    } catch (err) {
      showToast("Failed to process image: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    showToast("Profile picture removed. Click 'Save Settings' to apply.", "info");
  };

  return (
    <div className="space-y-6 w-full max-w-[800px] mx-auto text-left animate-fade-in">
      {/* Header and Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-text-mut font-semibold mb-2">
          <span>Portal</span>
          <span>&gt;</span>
          <span className="text-brand-primary">My Profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Account Settings</h1>
        <p className="text-sm text-text-sec mt-1">Manage your profile details and view your account configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Account Badge */}
        <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col items-center justify-center text-center">
          {/* Profile Picture Frame with Hover Actions */}
          <div className="relative group mb-3">
            <div 
              onClick={avatar ? handleOpenViewImage : () => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/30 flex items-center justify-center font-black text-3xl uppercase shadow-md overflow-hidden cursor-pointer relative transition-transform group-hover:scale-105"
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity">
                {avatar ? <Eye size={18} /> : <Camera size={18} />}
                <span className="mt-1">{avatar ? "VIEW" : "UPLOAD"}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar for Avatar */}
          <div className="flex items-center gap-1.5 mb-4 bg-bg-base/60 border border-border-card p-1 rounded-full text-xs">
            <button
              type="button"
              onClick={handleOpenViewImage}
              disabled={!avatar}
              className="p-1.5 rounded-full hover:bg-bg-card text-text-sec hover:text-brand-primary disabled:opacity-40 transition-colors cursor-pointer"
              title="View Profile Picture"
            >
              <Eye size={14} />
            </button>

            <button
              type="button"
              onClick={handleOpenCropImage}
              className="p-1.5 rounded-full hover:bg-bg-card text-text-sec hover:text-brand-primary transition-colors cursor-pointer"
              title="Crop & Edit Image"
            >
              <Crop size={14} />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full hover:bg-bg-card text-text-sec hover:text-brand-primary transition-colors cursor-pointer"
              title="Upload New Image"
            >
              <Camera size={14} />
            </button>

            {avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="p-1.5 rounded-full hover:bg-red-500/10 text-text-sec hover:text-red-500 transition-colors cursor-pointer"
                title="Remove Picture"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <h3 className="font-extrabold text-base text-text-main tracking-tight">{name}</h3>
          <p className="text-xs text-text-mut font-semibold mt-1 truncate max-w-full">{currentUser?.email}</p>

          <div className="mt-6 w-full pt-6 border-t border-border-card space-y-3">
            {currentUser?.role === "superadmin" ? (
              <span className="w-full flex items-center justify-center gap-1.5 py-2 bg-purple-500/10 text-purple-500 border border-purple-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                <ShieldAlert size={14} /> Super Admin
              </span>
            ) : isAdmin ? (
              <span className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-bold rounded-full uppercase tracking-wider">
                <Shield size={14} /> Company Admin
              </span>
            ) : (
              <span className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                <Award size={14} /> {programType} Member
              </span>
            )}

            <div className="p-3 bg-bg-base/30 rounded-[12px] border border-border-card text-left space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold text-text-mut">
                <span>Account ID:</span>
                <span className="text-text-main font-mono text-[10px]">{currentUser?.uid?.substring(0, 10)}...</span>
              </div>
              <div className="flex justify-between font-semibold text-text-mut">
                <span>Role:</span>
                <span className="text-text-main capitalize">{currentUser?.role}</span>
              </div>
            </div>

            {isAdmin && adminCompany && (
              <div className="mt-4 p-4 bg-brand-primary/5 rounded-[12px] border border-brand-primary/10 text-left space-y-3">
                <h4 className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">Organization Link</h4>
                <p className="text-[10px] text-text-sec leading-relaxed">
                  Share this unique link with your employees so they can register under your organization.
                </p>
                <div className="flex items-center justify-between bg-bg-card border border-border-card rounded-[8px] p-2">
                  <span className="text-[10px] font-mono text-text-main truncate pr-2">
                    {window.location.origin}/{adminCompany.slug}/login
                  </span>
                  <button 
                    onClick={handleCopyLink}
                    className="flex-shrink-0 p-1.5 bg-brand-primary hover:bg-brand-hover text-white rounded-[6px] transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border-card">
            <div className="w-9 h-9 rounded-[10px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <User size={18} />
            </div>
            <h3 className="font-extrabold text-base text-text-main">Personal Information</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec flex items-center gap-1.5" htmlFor="profile-name">
                  <User size={13} className="text-text-mut" />
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Thompson"
                  required
                />
              </div>

              {/* Email (Read Only) */}
              <div className="flex flex-col gap-1.5 opacity-70">
                <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                  <Mail size={13} className="text-text-mut" />
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-xs text-text-mut font-semibold outline-none cursor-not-allowed"
                  value={currentUser?.email || ""}
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Domain / Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec flex items-center gap-1.5" htmlFor="profile-dept">
                  <Building size={13} className="text-text-mut" />
                  Department / Domain
                </label>
                {isAdmin ? (
                  <input
                    id="profile-dept"
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    placeholder="e.g. Engineering"
                    required
                  />
                ) : (
                  <input
                    id="profile-dept"
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-xs text-text-mut font-semibold outline-none cursor-not-allowed opacity-70"
                    value={dept}
                    readOnly
                    disabled
                  />
                )}
              </div>

              {/* Program Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                  <Award size={13} className="text-text-mut" />
                  Program Type
                </label>
                {isAdmin ? (
                  <select
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={programType}
                    onChange={(e) => setProgramType(e.target.value)}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Training">Training</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-xs text-text-mut font-semibold outline-none cursor-not-allowed opacity-70"
                    value={programType}
                    readOnly
                    disabled
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date of Birth */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec flex items-center gap-1.5" htmlFor="profile-dob">
                  <User size={13} className="text-text-mut" />
                  Date of Birth
                </label>
                <input
                  id="profile-dob"
                  type="date"
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Employee ID (Read Only) */}
              <div className="flex flex-col gap-1.5 opacity-80">
                <label className="text-xs font-bold text-text-sec flex items-center gap-1.5">
                  <Award size={13} className="text-text-mut" />
                  Employee ID
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/20 text-xs text-brand-primary font-mono font-bold outline-none cursor-not-allowed"
                  value={currentUser?.employeeId || currentUser?.employee_id || "Not Assigned"}
                  readOnly
                  disabled
                />
              </div>
            </div>

            {/* Shift Times */}
            {currentUser?.role !== "superadmin" && (
            <div className="p-4 bg-brand-primary/5 rounded-[16px] border border-brand-primary/10 space-y-4">
              <h4 className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
                <Clock size={14} />
                Shift Details & Working Schedule
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-mut uppercase">Shift Start</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      required
                    />
                  ) : (
                    <span className="text-xs text-text-main font-semibold p-2 bg-bg-card rounded-[8px] border border-border-card block">
                      {currentUser?.shiftStart || "10:00"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-mut uppercase">Shift End</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-border-card rounded-[8px] bg-bg-card text-text-main text-xs outline-none focus:border-brand-primary transition-all"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      required
                    />
                  ) : (
                    <span className="text-xs text-text-main font-semibold p-2 bg-bg-card rounded-[8px] border border-border-card block">
                      {currentUser?.shiftEnd || "19:00"}
                    </span>
                  )}
                </div>
              </div>

              {!isAdmin && (
                <p className="text-[10px] text-text-mut leading-normal font-semibold">
                  * Note: Shift schedule is declared by administrators and cannot be self-modified.
                </p>
              )}
            </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-border-card">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-md shadow-brand-primary/10 hover:shadow-brand-primary/20 transition-all cursor-pointer"
              >
                <Save size={14} />
                {loading ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>

          {/* Change Password Section */}
          <div className="mt-8 pt-8 border-t border-border-card">
            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border-card">
              <div className="w-9 h-9 rounded-[10px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Lock size={18} />
              </div>
              <h3 className="font-extrabold text-base text-text-main">Security Settings</h3>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec flex items-center gap-1.5" htmlFor="new-password">
                    <Lock size={13} className="text-text-mut" />
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec flex items-center gap-1.5" htmlFor="confirm-password">
                    <Lock size={13} className="text-text-mut" />
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-border-card">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="py-2.5 px-6 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-md shadow-brand-primary/10 hover:shadow-brand-primary/20 transition-all cursor-pointer"
                >
                  <Save size={14} />
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Organization Branding (Admin Only) */}
          {isAdmin && adminCompany && (
            <div className="mt-8 pt-8 border-t border-border-card">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border-card">
                <div className="w-9 h-9 rounded-[10px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Building size={18} />
                </div>
                <h3 className="font-extrabold text-base text-text-main">Organization Branding</h3>
              </div>
              <form onSubmit={handleSaveOrgBranding} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Logo Upload */}
                  <div className="flex flex-col items-center sm:items-start gap-2">
                    <label className="text-xs font-bold text-text-sec">Company Logo</label>
                    <div className="w-20 h-20 bg-bg-base border border-border-card rounded-[12px] overflow-hidden flex items-center justify-center relative group">
                      {orgLogo ? (
                        <img src={orgLogo} alt="Org Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Building size={24} className="text-text-mut" />
                      )}
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                        <span className="text-[10px] font-bold text-white text-center px-1">Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleOrgLogoUpload} />
                      </label>
                    </div>
                  </div>
                  {/* Org Name */}
                  <div className="flex-grow flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec" htmlFor="org-name">
                      Organization Name
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      required
                    />
                  </div>
                  
                  {/* Org Address */}
                  <div className="flex-grow flex flex-col gap-1.5 w-full mt-4">
                    <label className="text-xs font-bold text-text-sec" htmlFor="org-address">
                      Company Address (For Payslip)
                    </label>
                    <textarea
                      id="org-address"
                      className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all min-h-[80px]"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="e.g. 22/33, Kovai Main Road..."
                    />
                  </div>
                </div>

                {/* Cloudinary credentials */}
                {adminCompany.modules?.includes("cloudinary") && (
                  <div className="grid grid-cols-2 gap-4 mt-4 border-t border-border-card pt-4 w-full">
                    <div className="flex flex-col gap-1.5 col-span-2 text-left">
                      <h4 className="text-xs font-bold text-text-sec uppercase tracking-wider">Cloudinary Credentials</h4>
                      <p className="text-[10px] text-text-mut font-semibold">Configure custom Cloudinary storage keys for organization uploads.</p>
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1 text-left">
                      <label className="text-xs font-bold text-text-sec" htmlFor="cloudinary-cloud-name">
                        Cloud Name
                      </label>
                      <input
                        id="cloudinary-cloud-name"
                        type="text"
                        className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                        value={cloudinaryCloudName}
                        onChange={(e) => setCloudinaryCloudName(e.target.value)}
                        placeholder="e.g. dcfsh85uq"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1 text-left">
                      <label className="text-xs font-bold text-text-sec" htmlFor="cloudinary-upload-preset">
                        Upload Preset
                      </label>
                      <input
                        id="cloudinary-upload-preset"
                        type="text"
                        className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all"
                        value={cloudinaryUploadPreset}
                        onChange={(e) => setCloudinaryUploadPreset(e.target.value)}
                        placeholder="e.g. hrms_preset"
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={orgLoading}
                    className="py-2.5 px-6 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] flex items-center gap-2 shadow-md shadow-brand-primary/10 transition-all cursor-pointer"
                  >
                    <Save size={14} />
                    {orgLoading ? "Saving..." : "Save Branding"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Danger Zone (Admin Only) */}
          {isAdmin && (
            <div className="mt-8 pt-8 border-t border-red-500/20">
              <h3 className="font-extrabold text-base text-red-500 flex items-center gap-2 mb-4">
                <ShieldAlert size={18} /> Danger Zone
              </h3>
              <div className="bg-red-500/5 border border-red-500/20 rounded-[16px] p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-text-main">Delete Workspace</h4>
                    <p className="text-xs text-text-sec mt-1 max-w-[400px]">
                      Permanently delete this organization, all employee accounts, attendance logs, and configurations. This action cannot be undone.
                    </p>
                  </div>
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-[8px] transition-colors whitespace-nowrap"
                    >
                      Delete Workspace
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 bg-bg-base hover:bg-border-card text-text-sec text-xs font-bold rounded-[8px] transition-colors"
                        disabled={deleteLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteWorkspace}
                        disabled={deleteLoading}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-[8px] transition-colors flex items-center gap-2"
                      >
                        {deleteLoading ? "Deleting..." : "Confirm Deletion"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Editor & Lightbox Viewer Modal */}
      <ImageEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageSrc={editorImageSrc}
        initialMode={editorInitialMode}
        onSave={handleSaveEditedAvatar}
      />
    </div>
  );
}


