import React, { useState, useEffect } from "react";
import { 
  Building, 
  Clock, 
  CalendarDays, 
  FileText, 
  Share2, 
  Save, 
  AlertTriangle,
  MapPin
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { 
  getEnvironmentSettings, 
  saveEnvironmentSettings 
} from "../services/environmentalSetupService";
import LocationMapPicker from "../components/LocationMapPicker";

export default function EnvironmentalSetup() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("organization");

  const [formData, setFormData] = useState({
    organization: {
      name: "",
      description: "",
      website: "",
      email: "",
      phone: "",
      address: "",
      logoUrl: ""
    },
    workSettings: {
      breakDurationMinutes: 60,
      breaksPerDay: 1,
      workingHoursPerDay: 8,
      shiftStartTime: "09:00",
      shiftEndTime: "18:00",
      enforceShiftTiming: false
    },
    leaveSettings: {
      annualLeaves: 12,
      sickLeaves: 6,
      casualLeaves: 6,
      paidLeaves: 12,
      unpaidLeaveAllowed: true
    },
    policies: {
      termsAndConditions: "",
      privacyPolicy: "",
      employeePolicy: "",
      leavePolicy: "",
      attendancePolicy: ""
    },
    socialLinks: {
      linkedin: "",
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      other: ""
    },
    geolocationSettings: {
      enabled: false,
      type: "circle",
      polygonCoords: [],
      latitude: "",
      longitude: "",
      radiusMeters: 50
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser?.companyId) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getEnvironmentSettings(currentUser.companyId);
        if (data) {
          // Merge fetched data with default structure to prevent undefined errors
          setFormData(prev => ({
            organization: { ...prev.organization, ...(data.organization || {}) },
            workSettings: { ...prev.workSettings, ...(data.workSettings || {}) },
            leaveSettings: { ...prev.leaveSettings, ...(data.leaveSettings || {}) },
            policies: { ...prev.policies, ...(data.policies || {}) },
            socialLinks: { ...prev.socialLinks, ...(data.socialLinks || {}) },
            geolocationSettings: { ...prev.geolocationSettings, ...(data.geolocationSettings || {}) }
          }));
        }
      } catch (err) {
        console.error("Error fetching environment settings:", err);
        showToast("Failed to load environment settings.", "error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [currentUser, showToast]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!currentUser?.companyId || !currentUser?.uid) {
      return showToast("Authentication error. Cannot save settings.", "error");
    }

    setSaving(true);
    try {
      await saveEnvironmentSettings(currentUser.companyId, formData, currentUser.uid);
      showToast("Environment settings saved successfully.", "success");
    } catch (err) {
      console.error("Error saving environment settings:", err);
      showToast(err.message || "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "organization", label: "Organization Details", icon: Building },
    { id: "work", label: "Work / Break", icon: Clock },
    { id: "leaves", label: "Leave Settings", icon: CalendarDays },
    { id: "policies", label: "Terms & Policies", icon: FileText },
    { id: "social", label: "Social Links", icon: Share2 },
    { id: "location", label: "Location Setup", icon: MapPin }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser?.companyId) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-[24px] flex items-start gap-4">
        <AlertTriangle className="mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-lg">Configuration Error</h3>
          <p className="text-sm">Unable to resolve your company ID. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main">Environmental Setup</h1>
          <p className="text-sm text-text-sec mt-1">Configure global organization settings and policies.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-[12px] hover:bg-brand-primary-hover transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-bg-card border border-border-card rounded-[24px] p-2 flex flex-row lg:flex-col overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? "bg-brand-primary/10 text-brand-primary" 
                      : "text-text-sec hover:bg-bg-base hover:text-text-main"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 min-w-0 bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
          
          {/* ORGANIZATION DETAILS */}
          {activeTab === "organization" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-text-main border-b border-border-card pb-4">Organization Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={formData.organization.name}
                    onChange={(e) => handleInputChange("organization", "name", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={formData.organization.email}
                    onChange={(e) => handleInputChange("organization", "email", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.organization.phone}
                    onChange={(e) => handleInputChange("organization", "phone", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Website URL</label>
                  <input
                    type="url"
                    value={formData.organization.website}
                    onChange={(e) => handleInputChange("organization", "website", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={formData.organization.logoUrl}
                    onChange={(e) => handleInputChange("organization", "logoUrl", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Organization Address</label>
                  <textarea
                    value={formData.organization.address}
                    onChange={(e) => handleInputChange("organization", "address", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[80px]"
                    placeholder="Full physical address"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={formData.organization.description}
                    onChange={(e) => handleInputChange("organization", "description", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[100px]"
                    placeholder="Brief description of the organization"
                  />
                </div>
              </div>
            </div>
          )}

          {/* WORK / BREAK SETTINGS */}
          {activeTab === "work" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-text-main border-b border-border-card pb-4">Work & Break Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Working Hours Per Day</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formData.workSettings.workingHoursPerDay}
                    onChange={(e) => handleInputChange("workSettings", "workingHoursPerDay", parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Breaks Allowed Per Day</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.workSettings.breaksPerDay}
                    onChange={(e) => handleInputChange("workSettings", "breaksPerDay", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Break Duration (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.workSettings.breakDurationMinutes}
                    onChange={(e) => handleInputChange("workSettings", "breakDurationMinutes", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border-card">
                <h3 className="text-md font-bold text-text-main mb-4">Shift Timings</h3>
                <div className="flex items-center gap-3 bg-bg-base p-4 rounded-[12px] border border-border-card mb-6">
                  <input
                    type="checkbox"
                    id="enforceShiftTiming"
                    checked={formData.workSettings.enforceShiftTiming}
                    onChange={(e) => handleInputChange("workSettings", "enforceShiftTiming", e.target.checked)}
                    className="w-4 h-4 text-brand-primary cursor-pointer"
                  />
                  <label htmlFor="enforceShiftTiming" className="text-sm font-bold text-text-main cursor-pointer">
                    Enforce Shift Timing (Employees can only check-in during the specified time window)
                  </label>
                </div>

                {formData.workSettings.enforceShiftTiming && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Shift Start Time</label>
                      <input
                        type="time"
                        value={formData.workSettings.shiftStartTime || "09:00"}
                        onChange={(e) => handleInputChange("workSettings", "shiftStartTime", e.target.value)}
                        className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Shift End Time</label>
                      <input
                        type="time"
                        value={formData.workSettings.shiftEndTime || "18:00"}
                        onChange={(e) => handleInputChange("workSettings", "shiftEndTime", e.target.value)}
                        className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEAVE SETTINGS */}
          {activeTab === "leaves" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-text-main border-b border-border-card pb-4">Leave Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Total Annual Leaves</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveSettings.annualLeaves}
                    onChange={(e) => handleInputChange("leaveSettings", "annualLeaves", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Paid Leaves</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveSettings.paidLeaves}
                    onChange={(e) => handleInputChange("leaveSettings", "paidLeaves", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Sick Leaves</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveSettings.sickLeaves}
                    onChange={(e) => handleInputChange("leaveSettings", "sickLeaves", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Casual Leaves</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveSettings.casualLeaves}
                    onChange={(e) => handleInputChange("leaveSettings", "casualLeaves", parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-3 bg-bg-base p-4 rounded-[12px] border border-border-card">
                  <input
                    type="checkbox"
                    id="unpaidAllowed"
                    checked={formData.leaveSettings.unpaidLeaveAllowed}
                    onChange={(e) => handleInputChange("leaveSettings", "unpaidLeaveAllowed", e.target.checked)}
                    className="w-4 h-4 text-brand-primary cursor-pointer"
                  />
                  <label htmlFor="unpaidAllowed" className="text-sm font-bold text-text-main cursor-pointer">
                    Allow Unpaid Leaves
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* POLICIES */}
          {activeTab === "policies" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-text-main border-b border-border-card pb-4">Terms & Policies</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Employee Policy</label>
                  <textarea
                    value={formData.policies.employeePolicy}
                    onChange={(e) => handleInputChange("policies", "employeePolicy", e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[120px]"
                    placeholder="General employee guidelines and code of conduct..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Leave Policy</label>
                  <textarea
                    value={formData.policies.leavePolicy}
                    onChange={(e) => handleInputChange("policies", "leavePolicy", e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[120px]"
                    placeholder="Rules regarding leave applications, approvals, and carry-forwards..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Attendance Policy</label>
                  <textarea
                    value={formData.policies.attendancePolicy}
                    onChange={(e) => handleInputChange("policies", "attendancePolicy", e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[120px]"
                    placeholder="Working hours, late marks, and regularization rules..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Terms and Conditions</label>
                  <textarea
                    value={formData.policies.termsAndConditions}
                    onChange={(e) => handleInputChange("policies", "termsAndConditions", e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[120px]"
                    placeholder="General terms of service..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Privacy Policy</label>
                  <textarea
                    value={formData.policies.privacyPolicy}
                    onChange={(e) => handleInputChange("policies", "privacyPolicy", e.target.value)}
                    className="w-full px-4 py-3 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary min-h-[120px]"
                    placeholder="Data collection and privacy practices..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* LOCATION SETUP */}
          {activeTab === "location" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-text-main border-b border-border-card pb-4">Geolocation Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 bg-bg-base p-4 rounded-[12px] border border-border-card">
                  <input
                    type="checkbox"
                    id="geoEnabled"
                    checked={formData.geolocationSettings.enabled}
                    onChange={(e) => handleInputChange("geolocationSettings", "enabled", e.target.checked)}
                    className="w-4 h-4 text-brand-primary cursor-pointer"
                  />
                  <label htmlFor="geoEnabled" className="text-sm font-bold text-text-main cursor-pointer">
                    Enable Location-based Check-in Restriction
                  </label>
                </div>

                {formData.geolocationSettings.enabled && (
                  <>
                  <div className="flex gap-4 mb-6">
                    <label className="flex items-center gap-2 text-sm font-bold text-text-main cursor-pointer">
                      <input 
                        type="radio" 
                        name="geofenceType" 
                        value="circle" 
                        checked={formData.geolocationSettings.type !== "polygon"} 
                        onChange={() => handleInputChange("geolocationSettings", "type", "circle")}
                        className="w-4 h-4 text-brand-primary"
                      />
                      Circle (Radius)
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-text-main cursor-pointer">
                      <input 
                        type="radio" 
                        name="geofenceType" 
                        value="polygon" 
                        checked={formData.geolocationSettings.type === "polygon"} 
                        onChange={() => handleInputChange("geolocationSettings", "type", "polygon")}
                        className="w-4 h-4 text-brand-primary"
                      />
                      Polygon (Custom Shape)
                    </label>
                  </div>

                  {formData.geolocationSettings.type !== "polygon" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.geolocationSettings.latitude}
                        onChange={(e) => handleInputChange("geolocationSettings", "latitude", parseFloat(e.target.value))}
                        className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="e.g. 13.0827"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.geolocationSettings.longitude}
                        onChange={(e) => handleInputChange("geolocationSettings", "longitude", parseFloat(e.target.value))}
                        className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="e.g. 80.2707"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Allowed Radius (Meters)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.geolocationSettings.radiusMeters}
                        onChange={(e) => handleInputChange("geolocationSettings", "radiusMeters", parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="e.g. 50"
                      />
                    </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">
                      Interactive Map (Click to set location)
                    </label>
                    <LocationMapPicker 
                      type={formData.geolocationSettings.type || "circle"}
                      latitude={formData.geolocationSettings.latitude}
                      longitude={formData.geolocationSettings.longitude}
                      radius={formData.geolocationSettings.radiusMeters}
                      polygonCoords={formData.geolocationSettings.polygonCoords || []}
                      onChangeLocation={(lat, lng) => {
                        handleInputChange("geolocationSettings", "latitude", lat);
                        handleInputChange("geolocationSettings", "longitude", lng);
                      }}
                      onChangeRadius={(radius) => {
                        handleInputChange("geolocationSettings", "radiusMeters", radius);
                      }}
                      onChangePolygon={(coords) => {
                        handleInputChange("geolocationSettings", "polygonCoords", coords);
                      }}
                    />
                  </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* SOCIAL LINKS */}
          {activeTab === "social" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-text-main border-b border-border-card pb-4">Social Media Links</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.socialLinks.linkedin}
                    onChange={(e) => handleInputChange("socialLinks", "linkedin", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">X / Twitter</label>
                  <input
                    type="url"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleInputChange("socialLinks", "twitter", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Facebook</label>
                  <input
                    type="url"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => handleInputChange("socialLinks", "facebook", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Instagram</label>
                  <input
                    type="url"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => handleInputChange("socialLinks", "instagram", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">YouTube</label>
                  <input
                    type="url"
                    value={formData.socialLinks.youtube}
                    onChange={(e) => handleInputChange("socialLinks", "youtube", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-sec uppercase tracking-wider mb-2">Other</label>
                  <input
                    type="url"
                    value={formData.socialLinks.other}
                    onChange={(e) => handleInputChange("socialLinks", "other", e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-base border border-border-card rounded-[12px] text-sm text-text-main focus:outline-none focus:border-brand-primary"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
