import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Mailbox, AlertTriangle, Check, ShieldAlert,
  LayoutGrid,
  Shield,
  Users,
  Calendar,
  LogOut,
  Search,
  Bell,
  HelpCircle,
  X,
  Clock,
  HardDrive,
  Sun,
  Moon,
  ChevronRight,
  Play,
  Square,
  ClipboardList,
  Mail,
  User,
  Trash2,
  MessageSquare,
  Monitor,
  Briefcase,
  CheckSquare,
  RefreshCw,
  Lock,
  Info,
  Building2,
  IndianRupee,
  Link2,
  Globe,
  LifeBuoy,
  Settings,
  ShieldCheck
} from "lucide-react";
import Logo from "./Logo";
import logoImg from "../assets/zuna-logo.png";
import RaiseTicketModal from "./RaiseTicketModal";
import {
  checkIn,
  checkOut,
  getTodayAttendanceLog,
  subscribeToLeaveRequests,
  subscribeToAttendanceRules,
  subscribeToAllMessages,
  subscribeToChannels,
  subscribeToDmThreads,
  subscribeToNotifications,
  markNotificationRead,
  createNotification,
  updateTaskWarningSent,
  getCompanies,
  listenToCompany,
  subscribeToRegularizationRequests
} from "../firebase";
import { resolveLocationName } from "../utils/locationHelper";

const DashboardSkeleton = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-fade-in" style={{ perspective: '800px' }}>
    <style>{`
      @keyframes gimbal-1 {
        0% { transform: rotateZ(0deg) rotateX(20deg) rotateY(0deg); }
        100% { transform: rotateZ(360deg) rotateX(20deg) rotateY(0deg); }
      }
      @keyframes gimbal-2 {
        0% { transform: rotateX(0deg) rotateY(0deg); }
        100% { transform: rotateX(360deg) rotateY(180deg); }
      }
      @keyframes gimbal-3 {
        0% { transform: rotateX(0deg) rotateY(0deg); }
        100% { transform: rotateX(-360deg) rotateY(-180deg); }
      }
      @keyframes logo-float {
        0%, 100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 10px rgba(168,85,247,0.4)); }
        50% { transform: translateY(-5px) scale(1.05); filter: drop-shadow(0 0 20px rgba(168,85,247,0.8)); }
      }
    `}</style>
    <div className="relative flex items-center justify-center w-40 h-40" style={{ transformStyle: 'preserve-3d' }}>

      {/* Outer Glow Ring - rotates flat like a radar */}
      <div
        className="absolute inset-0 rounded-full border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)_inset]"
        style={{ animation: 'gimbal-1 6s linear infinite' }}
      >
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7] -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Middle Flipping Ring */}
      <div
        className="absolute inset-4 rounded-full border-2 border-purple-400/50 border-t-purple-600 shadow-[0_0_15px_rgba(192,132,252,0.4)]"
        style={{ animation: 'gimbal-2 3s cubic-bezier(0.4, 0, 0.2, 1) infinite', transformStyle: 'preserve-3d' }}
      ></div>

      {/* Inner Flipping Ring */}
      <div
        className="absolute inset-8 rounded-full border-2 border-purple-300/40 border-b-purple-500 shadow-[0_0_15px_rgba(216,180,254,0.4)]"
        style={{ animation: 'gimbal-3 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite', transformStyle: 'preserve-3d' }}
      ></div>

      {/* Center Logo */}
      <img
        src={logoImg}
        alt="Loading..."
        className="w-14 h-auto relative z-10"
        style={{ animation: 'logo-float 2s ease-in-out infinite' }}
      />
    </div>

    <div className="mt-12 flex flex-col items-center gap-2">
      <h3 className="text-text-main font-extrabold text-sm tracking-widest uppercase text-purple-600 dark:text-purple-400 drop-shadow-sm">Loading Workspace</h3>
      <div className="flex gap-1.5 mt-1">
        <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce shadow-[0_0_8px_rgba(147,51,234,0.8)]" style={{ animationDelay: '0s' }}></span>
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce shadow-[0_0_8px_rgba(192,132,252,0.8)]" style={{ animationDelay: '0.4s' }}></span>
      </div>
    </div>
  </div>
);

export default function DashboardLayout({ children }) {
  const { currentUser, logout, dbMode } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showQuickCheckModal, setShowQuickCheckModal] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [localSearch, setLocalSearch] = useState(searchParams.get("q") || "");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const isAdminUser = currentUser?.role === "admin" || currentUser?.role === "superadmin" || currentUser?.isAdmin === true;

  useEffect(() => {
    setLocalSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      newParams.set("q", localSearch);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("q");
    setSearchParams(newParams);
    setIsSearchExpanded(false);
  };

  // Notice board, rules & notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState("");
  const [leaveRequestsList, setLeaveRequestsList] = useState([]);
  const [regularizationRequestsList, setRegularizationRequestsList] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [newUpdatesCount, setNewUpdatesCount] = useState(0);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [companyStatus, setCompanyStatus] = useState("loading");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyModules, setCompanyModules] = useState([]);
  const [channels, setChannels] = useState([]);
  const [dmThreads, setDmThreads] = useState([]);

  useEffect(() => {
    let unsubscribe = () => { };

    const updateFavicon = (url) => {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url || "/favicon.png";
    };

    const userIsSuperAdmin = currentUser?.role === "superadmin" || currentUser?.email?.toLowerCase().includes("superadmin@");
    const effectiveCompanyId = currentUser?.companyId || (currentUser?.email?.toLowerCase().endsWith("@teamcarrezza.com") ? "carrezza-global-solutions" : "");

    if (effectiveCompanyId) {
      unsubscribe = listenToCompany(effectiveCompanyId, (companyData) => {
        if (companyData) {
          document.title = companyData.name || "Carrezza Global Solutions";
          setCompanyName(companyData.name || "Carrezza Global Solutions");
          setCompanyLogo(companyData.logoBase64 || "");
          updateFavicon(companyData.logoBase64);
          setCompanyStatus(companyData.status || "active");
          setCompanyModules(companyData.modules && companyData.modules.length > 0 ? companyData.modules : ["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]);
        } else {
          document.title = "Carrezza Global Solutions";
          updateFavicon("/favicon.png");
          setCompanyName("Carrezza Global Solutions");
          setCompanyStatus("active");
          setCompanyModules(["attendance", "team-hub", "projects", "tasks", "assets", "payroll"]);
        }
      });
    } else if (currentUser) {
      document.title = "Zuna | HRMS";
      updateFavicon("/favicon.png");
      setCompanyStatus(userIsSuperAdmin ? "active" : "no_workspace");
    }

    return () => {
      document.title = "Zuna | HRMS";
      let link = document.querySelector("link[rel~='icon']");
      if (link) link.href = "/favicon.png";
      unsubscribe();
    };
  }, [currentUser]);

  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem(`dismissed_notifs_${currentUser?.uid}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const activeNotifications = leaveRequestsList.filter(req => !dismissedNotifs.includes(req.id));

  useEffect(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`dismissed_notifs_${currentUser.uid}`);
        setDismissedNotifs(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setDismissedNotifs([]);
      }
    } else {
      setDismissedNotifs([]);
    }
  }, [currentUser]);

  const handleDeleteNotification = (e, reqId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    const updated = [...dismissedNotifs, reqId];
    setDismissedNotifs(updated);
    localStorage.setItem(`dismissed_notifs_${currentUser.uid}`, JSON.stringify(updated));
    showToast("Notification deleted successfully.", "success");
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync today's log for quick check-in button state
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      getTodayAttendanceLog(currentUser.uid)
        .then(log => setTodayLog(log))
        .catch(() => { });
    }
  }, [currentUser, showQuickCheckModal]);

  // Subscribe to dynamic rules and leave updates
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeRules = subscribeToAttendanceRules((data) => {
      setRules(data);
    }, currentUser.companyId);

    const unsubscribeLeaves = subscribeToLeaveRequests(currentUser.companyId, (data) => {
      const items = Array.isArray(data) ? data : [];
      if (currentUser.role === "admin") {
        const pending = items.filter(r => r.status === "pending");
        setLeaveRequestsList(pending);
      } else {
        const myRequests = items.filter(r => (r.userId || r.user_id) === currentUser.uid);
        setLeaveRequestsList(myRequests);
      }
    });

    let unsubscribeRegs = () => { };
    if (currentUser.role === "admin") {
      unsubscribeRegs = subscribeToRegularizationRequests(currentUser.companyId, (data) => {
        const pending = (Array.isArray(data) ? data : []).filter(r => r.status === "pending");
        setRegularizationRequestsList(pending);
      });
    }

    return () => {
      unsubscribeRules();
      unsubscribeLeaves();
      unsubscribeRegs();
    };
  }, [currentUser]);

  // Subscribe to system notifications
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToNotifications(currentUser.uid, (data) => {
      setSystemNotifications(data);
    });
    return () => unsub();
  }, [currentUser]);

  // Compute unseen notifications count
  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") {
      setNewUpdatesCount(0);
      return;
    }
    const seenStr = localStorage.getItem(`seen_leaves_${currentUser.uid}`);
    const seen = seenStr ? JSON.parse(seenStr) : {};

    let unseenCount = 0;
    leaveRequestsList.forEach(req => {
      if (!dismissedNotifs.includes(req.id) && seen[req.id] !== req.status && req.status !== "pending") {
        unseenCount++;
      }
    });
    setNewUpdatesCount(unseenCount);
  }, [leaveRequestsList, dismissedNotifs, currentUser]);

  const [unreadMessagesData, setUnreadMessagesData] = useState({ count: 0, latestTime: 0 });
  const [clearedItems, setClearedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`cleared_items_${currentUser?.uid}`)) || {}; }
    catch { return {}; }
  });

  const activeProjects = currentUser?.projects || (currentUser?.project ? [currentUser.project] : []);
  const activeTasks = (currentUser?.tasks || []).filter(t => !t.completed);
  const [readReceiptsVersion, setReadReceiptsVersion] = useState(0);

  useEffect(() => {
    const handleReceiptUpdate = () => setReadReceiptsVersion(v => v + 1);
    window.addEventListener("local-auth-updated", handleReceiptUpdate);
    return () => window.removeEventListener("local-auth-updated", handleReceiptUpdate);
  }, []);

  // Clear badges when visiting the respective routes
  useEffect(() => {
    if (!currentUser?.uid) return;
    let newCleared = null;

    if (location.pathname === "/team-hub" && unreadMessagesData.latestTime > (clearedItems.teamHubTime || 0)) {
      newCleared = { teamHubTime: unreadMessagesData.latestTime };
    } else if (location.pathname === "/task-management") {
      const taskIds = activeTasks.map(t => t.id).sort().join(",");
      if (clearedItems.tasks !== taskIds) newCleared = { tasks: taskIds };
    } else if (location.pathname === "/project-management") {
      const projIds = activeProjects.sort().join(",");
      if (clearedItems.projects !== projIds) newCleared = { projects: projIds };
    }

    if (newCleared) {
      setClearedItems(prev => {
        const updated = { ...prev, ...newCleared };
        localStorage.setItem(`cleared_items_${currentUser.uid}`, JSON.stringify(updated));
        return updated;
      });
    }
  }, [location.pathname, currentUser?.uid, unreadMessagesData.latestTime, activeTasks, activeProjects, clearedItems]);

  // Subscribe to all chat messages for notification counts
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToAllMessages(currentUser.companyId, (allMsgs) => {
      setUnreadMessagesData({ allMsgs });
    });
    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToChannels(currentUser.companyId, setChannels);
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToDmThreads(currentUser.uid, currentUser.companyId, setDmThreads);
    return unsub;
  }, [currentUser?.uid]);

  // Check for missing hourly task reports
  useEffect(() => {
    if (!currentUser || !currentUser.tasks || currentUser.tasks.length === 0) return;

    // Check every minute
    const interval = setInterval(() => {
      const activeTasks = currentUser.tasks.filter(t => !t.completed);
      const now = Date.now();

      activeTasks.forEach(async (task) => {
        const lastActionTime = new Date(task.lastReportedAt || task.assignedAt).getTime();
        const hoursSinceAction = (now - lastActionTime) / (1000 * 60 * 60);

        // If more than 2 hours passed since last report/assignment
        if (hoursSinceAction > 2) {
          const lastWarningTime = task.lastWarningSentAt ? new Date(task.lastWarningSentAt).getTime() : 0;
          const hoursSinceWarning = (now - lastWarningTime) / (1000 * 60 * 60);

          // Only send warning if we haven't sent one in the last 2 hours
          if (hoursSinceWarning > 2) {
            try {
              await createNotification(
                currentUser.uid,
                "Missing Hourly Report",
                `Reminder: You have not submitted an hourly update for task "${task.title}" in over 2 hours!`,
                "warning",
                "/dashboard?tab=tasks"
              );
              await updateTaskWarningSent(currentUser.uid, task.id);
            } catch (err) {
              console.error("Failed to send task warning notification", err);
            }
          }
        }
      });
    }, 60000); // 1 minute interval

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && currentUser && currentUser.role !== "admin") {
      const seen = {};
      activeNotifications.forEach(req => {
        seen[req.id] = req.status;
      });
      localStorage.setItem(`seen_leaves_${currentUser.uid}`, JSON.stringify(seen));
      setNewUpdatesCount(0);
    }
  };

  const handleSystemNotifClick = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      setShowNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    // 1. Mark system notifications
    const unreadSystem = systemNotifications.filter(n => !n.read);
    for (const notif of unreadSystem) {
      await markNotificationRead(notif.id);
    }

    // 2. Dismiss active leave/system request notifications
    if (activeNotifications.length > 0) {
      const currentDismissed = localStorage.getItem(`dismissed_leaves_${currentUser.uid}`);
      const dismissedArr = currentDismissed ? JSON.parse(currentDismissed) : [];
      const updated = [...new Set([...dismissedArr, ...activeNotifications.map(req => req.id)])];
      localStorage.setItem(`dismissed_leaves_${currentUser.uid}`, JSON.stringify(updated));
      setDismissedNotifs(updated);
    }

    // 3. Clear leave request update count for regular users
    if (currentUser && currentUser.role !== "admin") {
      const seen = {};
      activeNotifications.forEach(req => {
        seen[req.id] = req.status;
      });
      localStorage.setItem(`seen_leaves_${currentUser.uid}`, JSON.stringify(seen));
      setNewUpdatesCount(0);
    }
  };

  const combinedNotifs = [
    ...systemNotifications.map(n => ({
      ...n,
      isSystemNotif: true,
      sortDate: new Date(n.timestamp).getTime()
    })),
    ...activeNotifications.map(r => ({
      ...r,
      isLeaveNotif: true,
      sortDate: new Date(r.updatedAt || r.createdAt).getTime()
    }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  const systemUnread = systemNotifications.filter(n => !n.read).length;
  const leaveUnread = currentUser?.role === "admin" ? activeNotifications.length : newUpdatesCount;
  const totalUnreadCount = systemUnread + leaveUnread;

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Logged out successfully.", "success");
      navigate("/");
    } catch (error) {
      showToast(error.message || "Failed to log out", "error");
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200); // skeletal loading duration
  };

  const getGpsLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          let locationName = "";
          try {
            locationName = await Promise.race([
              resolveLocationName(lat, lon),
              new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000))
            ]);
          } catch (e) {
            locationName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          }
          resolve({
            latitude: lat,
            longitude: lon,
            accuracy: Math.round(pos.coords.accuracy),
            locationName: locationName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
          });
        },
        (err) => {
          resolve({
            latitude: null,
            longitude: null,
            accuracy: null,
            locationName: "Office / Remote (Location unavailable)"
          });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
  };

  const handleQuickCheckIn = async () => {
    setLoadingAction(true);
    try {
      showToast("Fetching location...", "info", 1500);
      const loc = await getGpsLocation();
      await checkIn(currentUser, loc);
      showToast("Checked in successfully!", "success");
      setShowQuickCheckModal(false);
      // reload page or trigger state update
      window.location.reload();
    } catch (err) {
      showToast(err.message || "Quick check-in failed", "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleQuickCheckOut = async () => {
    setLoadingAction(true);
    try {
      showToast("Fetching location...", "info", 1500);
      const loc = await getGpsLocation();
      await checkOut(currentUser.uid, loc);
      showToast("Checked out successfully!", "success");
      setShowQuickCheckModal(false);
      window.location.reload();
    } catch (err) {
      showToast(err.message || "Quick check-out failed", "error");
    } finally {
      setLoadingAction(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";
  const isSuperAdmin = currentUser?.role === "superadmin";
  const activeTabParam = searchParams.get("tab") || "live";

  const activeTasksCount = currentUser?.tasks?.filter(t => !t.completed)?.length || 0;

  const realUnreadMessagesCount = React.useMemo(() => {
    if (!currentUser || !unreadMessagesData.allMsgs) return 0;

    const relevantThreadIds = new Set();
    channels.forEach(ch => {
      if (ch.id === "general" || ch.memberIds?.includes(currentUser.uid)) {
        relevantThreadIds.add(ch.id);
      }
    });
    dmThreads.forEach(dm => {
      relevantThreadIds.add(dm.id);
    });

    let receipts = currentUser.teamHubReadReceipts || {};
    try {
      const dedicated = JSON.parse(localStorage.getItem(`teamhub_read_receipts_${currentUser.uid}`) || "{}");
      receipts = { ...receipts, ...dedicated };
    } catch (e) { }

    const otherMsgs = unreadMessagesData.allMsgs.filter(m => m.senderId !== currentUser.uid && relevantThreadIds.has(m.threadId));

    return otherMsgs.filter(m => {
      const threadReadTime = receipts[m.threadId] || receipts[m.channelId] || "1970-01-01T00:00:00.000Z";
      return new Date(m.timestamp) > new Date(threadReadTime);
    }).length;
  }, [unreadMessagesData.allMsgs, channels, dmThreads, currentUser, readReceiptsVersion]);

  const showTeamHubBadge = location.pathname !== "/team-hub" && realUnreadMessagesCount > 0;

  const showTasksBadge = activeTasks.length > 0 && clearedItems.tasks !== activeTasks.map(t => t.id).sort().join(",");
  const showProjectsBadge = activeProjects.length > 0 && clearedItems.projects !== activeProjects.sort().join(",");

  // Sidebar navigation items
  const { can } = usePermissions();

  let menuItems = [];

  if (isSuperAdmin) {
    menuItems = [
      {
        label: "Super Admin Portal",
        icon: ShieldAlert,
        active: location.pathname === "/superadmin",
        onClick: () => { navigate("/superadmin"); setIsMobileOpen(false); }
      },
      {
        label: "My Profile",
        icon: User,
        active: location.pathname === "/profile",
        onClick: () => { navigate("/profile"); setIsMobileOpen(false); }
      }
    ];
  } else if (isAdminUser) {
    // ----------------------------------------------------
    // ADMIN ONLY NAVIGATION (Company-wide access + Team Hub only, no personal attendance/tasks)
    // ----------------------------------------------------
    if (isAdminUser || can("read", "Dashboard")) {
      menuItems.push({
        label: "Admin Analytics",
        icon: LayoutGrid,
        active: location.pathname === "/admin" && activeTabParam === "analytics",
        module: "attendance",
        onClick: () => { navigate("/admin?tab=analytics"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "LiveActivity")) {
      menuItems.push({
        label: "Admin Panel",
        icon: Shield,
        active: location.pathname === "/admin" && activeTabParam === "live",
        module: "attendance",
        onClick: () => { navigate("/admin?tab=live"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "EmployeeManagement")) {
      menuItems.push({
        label: "Staff Directory",
        icon: Users,
        active: location.pathname === "/admin" && activeTabParam === "users",
        onClick: () => { navigate("/admin?tab=users"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "LeaveApprovals")) {
      menuItems.push({
        label: "Leave Approvals",
        icon: Calendar,
        active: location.pathname === "/admin" && activeTabParam === "logs" && (searchParams.get("sub") || "leaves") === "leaves",
        badge: leaveRequestsList.length > 0 ? leaveRequestsList.length : null,
        module: "attendance",
        onClick: () => { navigate("/admin?tab=logs&sub=leaves"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "Regularization")) {
      menuItems.push({
        label: "Regularization Approvals",
        icon: Clock,
        active: location.pathname === "/admin" && activeTabParam === "logs" && searchParams.get("sub") === "regularization",
        badge: regularizationRequestsList.length > 0 ? regularizationRequestsList.length : null,
        module: "attendance",
        onClick: () => { navigate("/admin?tab=logs&sub=regularization"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "NoticeBoard")) {
      menuItems.push({
        label: "Notice Board",
        icon: ClipboardList,
        active: location.pathname === "/admin" && activeTabParam === "rules",
        module: "attendance",
        onClick: () => { navigate("/admin?tab=rules"); setIsMobileOpen(false); }
      });
    }

    // Team Hub (Company Communication)
    menuItems.push({
      label: "Team Hub",
      icon: MessageSquare,
      active: location.pathname === "/team-hub",
      badge: showTeamHubBadge ? realUnreadMessagesCount : null,
      module: "team-hub",
      onClick: () => { navigate("/team-hub"); setIsMobileOpen(false); }
    });

    if (isAdminUser || can("read", "TeamHub")) {
      menuItems.push({
        label: "Chat Monitor",
        icon: Monitor,
        active: location.pathname === "/admin" && activeTabParam === "chat",
        module: "team-hub",
        onClick: () => { navigate("/admin?tab=chat"); setIsMobileOpen(false); }
      });
    }

    // Project Management
    menuItems.push(
      {
        label: "Project Management",
        icon: Briefcase,
        active: location.pathname === "/project-management",
        badge: location.pathname === "/project-management" ? null : (showProjectsBadge ? activeProjects.length : null),
        module: "projects",
        onClick: () => { navigate("/project-management"); setIsMobileOpen(false); }
      },
      {
        label: "Project Calendar",
        icon: Calendar,
        active: location.pathname === "/project-calendar",
        module: "projects",
        onClick: () => { navigate("/project-calendar"); setIsMobileOpen(false); }
      }
    );

    if (isAdminUser || can("read", "Assets")) {
      menuItems.push({
        label: "Asset Management",
        icon: HardDrive,
        active: location.pathname === "/admin" && activeTabParam === "assets",
        module: "assets",
        onClick: () => { navigate("/admin?tab=assets"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "ExternalLinks")) {
      menuItems.push({
        label: "External Links",
        icon: Link2,
        active: location.pathname === "/admin" && activeTabParam === "external-links",
        module: "projects",
        onClick: () => { navigate("/admin?tab=external-links"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "Payroll")) {
      menuItems.push({
        label: "Payroll (India)",
        icon: IndianRupee,
        active: location.pathname === "/admin" && activeTabParam === "payroll",
        module: "payroll",
        onClick: () => { navigate("/admin?tab=payroll"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "CustomDomains")) {
      menuItems.push({
        label: "Custom Domains",
        icon: Globe,
        active: location.pathname === "/admin" && activeTabParam === "domains",
        module: "projects",
        onClick: () => { navigate("/admin?tab=domains"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "RolesPermissions")) {
      menuItems.push({
        label: "Roles & Permissions",
        icon: ShieldCheck,
        active: location.pathname === "/admin" && activeTabParam === "roles",
        onClick: () => { navigate("/admin?tab=roles"); setIsMobileOpen(false); }
      });
    }
    if (isAdminUser || can("read", "EnvironmentSetup")) {
      menuItems.push({
        label: "Environment Setup",
        icon: Settings,
        active: location.pathname === "/admin/environmental-setup",
        onClick: () => { navigate("/admin/environmental-setup"); setIsMobileOpen(false); }
      });
    }

    menuItems.push({
      label: "My Profile",
      icon: User,
      active: location.pathname === "/profile",
      onClick: () => { navigate("/profile"); setIsMobileOpen(false); }
    });
  } else {
    // ----------------------------------------------------
    // EMPLOYEE / USER NAVIGATION (Personal attendance, leaves, personal tasks, etc.)
    // ----------------------------------------------------
    menuItems.push(
      {
        label: "Dashboard",
        icon: LayoutGrid,
        active: location.pathname === "/dashboard" && !searchParams.get("tab"),
        module: "attendance",
        onClick: () => { navigate("/dashboard"); setIsMobileOpen(false); }
      },
      {
        label: "Leave Requests",
        icon: Calendar,
        active: location.pathname === "/dashboard" && searchParams.get("tab") === "leaves",
        module: "attendance",
        onClick: () => { navigate("/dashboard?tab=leaves"); setIsMobileOpen(false); }
      },
      {
        label: "Team Hub",
        icon: MessageSquare,
        active: location.pathname === "/team-hub",
        badge: showTeamHubBadge ? realUnreadMessagesCount : null,
        module: "team-hub",
        onClick: () => { navigate("/team-hub"); setIsMobileOpen(false); }
      },
      {
        label: "Project Management",
        icon: Briefcase,
        active: location.pathname === "/project-management",
        hidden: !(currentUser?.isProjectManager || currentUser?.role === "Project Manager" || currentUser?.role === "admin" || currentUser?.name === "Mohamed Asfaque A" || can('read', 'ProjectManagement')),
        badge: location.pathname === "/project-management" ? null : (showProjectsBadge ? activeProjects.length : null),
        module: "projects",
        onClick: () => { navigate("/project-management"); setIsMobileOpen(false); }
      },
      {
        label: "Project Calendar",
        icon: Calendar,
        active: location.pathname === "/project-calendar",
        hidden: !(currentUser?.isProjectManager || currentUser?.role === "Project Manager" || currentUser?.role === "admin" || currentUser?.name === "Mohamed Asfaque A" || can('read', 'ProjectManagement')),
        module: "projects",
        onClick: () => { navigate("/project-calendar"); setIsMobileOpen(false); }
      },
      {
        label: "Task Management",
        icon: CheckSquare,
        active: location.pathname === "/task-management",
        badge: location.pathname === "/task-management" ? null : (showTasksBadge ? activeTasks.length : null),
        module: "tasks",
        onClick: () => { navigate("/task-management"); setIsMobileOpen(false); }
      },
      {
        label: "My Assets",
        icon: HardDrive,
        active: location.pathname === "/dashboard" && searchParams.get("tab") === "assets",
        module: "assets",
        onClick: () => { navigate("/dashboard?tab=assets"); setIsMobileOpen(false); }
      },
      {
        label: "My Payslips",
        icon: IndianRupee,
        active: location.pathname === "/dashboard" && searchParams.get("tab") === "payslips",
        module: "payroll",
        onClick: () => { navigate("/dashboard?tab=payslips"); setIsMobileOpen(false); }
      },
      {
        label: "My History",
        icon: Calendar,
        active: location.pathname === "/history",
        module: "attendance",
        onClick: () => { navigate("/history"); setIsMobileOpen(false); }
      }
    );

    // Any delegated Admin items for users with custom permissions
    if (can("read", "Dashboard")) {
      menuItems.push({
        label: "Admin Analytics",
        icon: LayoutGrid,
        active: location.pathname === "/admin" && activeTabParam === "analytics",
        module: "attendance",
        onClick: () => { navigate("/admin?tab=analytics"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "LiveActivity")) {
      menuItems.push({
        label: "Admin Panel",
        icon: Shield,
        active: location.pathname === "/admin" && activeTabParam === "live",
        module: "attendance",
        onClick: () => { navigate("/admin?tab=live"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "EmployeeManagement")) {
      menuItems.push({
        label: "Staff Directory",
        icon: Users,
        active: location.pathname === "/admin" && activeTabParam === "users",
        onClick: () => { navigate("/admin?tab=users"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "LeaveApprovals")) {
      menuItems.push({
        label: "Leave Approvals",
        icon: Calendar,
        active: location.pathname === "/admin" && activeTabParam === "logs" && (searchParams.get("sub") || "leaves") === "leaves",
        badge: leaveRequestsList.length > 0 ? leaveRequestsList.length : null,
        module: "attendance",
        onClick: () => { navigate("/admin?tab=logs&sub=leaves"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "Regularization")) {
      menuItems.push({
        label: "Regularization Approvals",
        icon: Clock,
        active: location.pathname === "/admin" && activeTabParam === "logs" && searchParams.get("sub") === "regularization",
        badge: regularizationRequestsList.length > 0 ? regularizationRequestsList.length : null,
        module: "attendance",
        onClick: () => { navigate("/admin?tab=logs&sub=regularization"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "NoticeBoard")) {
      menuItems.push({
        label: "Notice Board",
        icon: ClipboardList,
        active: location.pathname === "/admin" && activeTabParam === "rules",
        module: "attendance",
        onClick: () => { navigate("/admin?tab=rules"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "TeamHub")) {
      menuItems.push({
        label: "Chat Monitor",
        icon: Monitor,
        active: location.pathname === "/admin" && activeTabParam === "chat",
        module: "team-hub",
        onClick: () => { navigate("/admin?tab=chat"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "Assets")) {
      menuItems.push({
        label: "Asset Management",
        icon: HardDrive,
        active: location.pathname === "/admin" && activeTabParam === "assets",
        module: "assets",
        onClick: () => { navigate("/admin?tab=assets"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "ExternalLinks")) {
      menuItems.push({
        label: "External Links",
        icon: Link2,
        active: location.pathname === "/admin" && activeTabParam === "external-links",
        module: "projects",
        onClick: () => { navigate("/admin?tab=external-links"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "Payroll")) {
      menuItems.push({
        label: "Payroll (India)",
        icon: IndianRupee,
        active: location.pathname === "/admin" && activeTabParam === "payroll",
        module: "payroll",
        onClick: () => { navigate("/admin?tab=payroll"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "CustomDomains")) {
      menuItems.push({
        label: "Custom Domains",
        icon: Globe,
        active: location.pathname === "/admin" && activeTabParam === "domains",
        onClick: () => { navigate("/admin?tab=domains"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "RolesPermissions")) {
      menuItems.push({
        label: "Roles & Permissions",
        icon: ShieldCheck,
        active: location.pathname === "/admin" && activeTabParam === "roles",
        onClick: () => { navigate("/admin?tab=roles"); setIsMobileOpen(false); }
      });
    }
    if (can("read", "EnvironmentSetup")) {
      menuItems.push({
        label: "Environment Setup",
        icon: Settings,
        active: location.pathname === "/admin/environmental-setup",
        onClick: () => { navigate("/admin/environmental-setup"); setIsMobileOpen(false); }
      });
    }

    menuItems.push({
      label: "My Profile",
      icon: User,
      active: location.pathname === "/profile",
      onClick: () => { navigate("/profile"); setIsMobileOpen(false); }
    });
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (isSuperAdmin) return true;
    if (!item.module) return true;
    if (!companyModules || companyModules.length === 0) return true;
    return companyModules.includes(item.module);
  });

  const isCurrentModuleEnabled = (() => {
    if (isSuperAdmin) return true;
    if (!companyModules || companyModules.length === 0) return true;
    const path = location.pathname;
    const tab = searchParams.get("tab");

    if (path === "/project-management" || path === "/project-calendar") {
      return companyModules.includes("projects");
    }
    if (path === "/task-management") {
      return companyModules.includes("tasks");
    }
    if (path === "/team-hub") {
      return companyModules.includes("team-hub");
    }
    if (path === "/history") {
      return companyModules.includes("attendance");
    }
    if (path === "/dashboard") {
      if (tab === "leaves" || !tab) {
        return companyModules.includes("attendance");
      }
      if (tab === "assets") {
        return companyModules.includes("assets");
      }
      if (tab === "payslips") {
        return companyModules.includes("payroll");
      }
    }
    if (path === "/admin") {
      if (tab === "live" || tab === "analytics" || tab === "rules" || tab === "logs") {
        return companyModules.includes("attendance");
      }
      if (tab === "chat") {
        return companyModules.includes("team-hub");
      }
      if (tab === "assets") {
        return companyModules.includes("assets");
      }
      if (tab === "payroll") {
        return companyModules.includes("payroll");
      }
      if (tab === "external-links") {
        return companyModules.includes("projects");
      }
    }
    return true;
  })();

  if (companyStatus === "no_workspace" && !isSuperAdmin) {
    return (
      <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in text-center">
        <div className="max-w-[460px] bg-bg-card border border-border-card rounded-[24px] p-10 shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-gray-500/10 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-500/20">
            <Building2 size={36} />
          </div>
          <h1 className="text-3xl font-extrabold text-text-main mb-3">No Workspace Found</h1>
          <p className="text-sm text-text-sec leading-relaxed mb-8">
            Your account is not linked to any organization workspace. If you just tried to register, the registration might have failed.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-bg-base hover:bg-border-card text-text-main font-bold text-sm rounded-[12px] border border-border-card transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (companyStatus === "loading") {
    return (
      <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center p-6 text-brand-primary">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p className="text-text-mut font-bold">Verifying workspace...</p>
      </div>
    );
  }

  if (companyStatus === "pending" && !isSuperAdmin) {
    return (
      <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in text-center">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-primary filter blur-[150px] opacity-10 pointer-events-none" />

        <div className="max-w-[460px] bg-bg-card border border-border-card rounded-[24px] p-10 shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-500/20">
            <Lock size={36} />
          </div>
          <h1 className="text-3xl font-extrabold text-text-main mb-3">Module Frozen</h1>
          <h2 className="text-sm font-bold text-amber-500 tracking-wider uppercase mb-6 bg-amber-500/10 inline-block px-3 py-1 rounded-full">Pending Super Admin Approval</h2>
          <p className="text-sm text-text-sec leading-relaxed mb-8">
            Your organization workspace has been registered successfully. However, your module is currently frozen pending review by the global system administrator.
          </p>
          <div className="p-4 bg-bg-base/50 rounded-[12px] border border-border-card text-left mb-6">
            <h3 className="text-[11px] font-bold text-text-mut uppercase tracking-wider mb-2">What happens next?</h3>
            <ul className="text-xs text-text-sec space-y-2 list-disc pl-4">
              <li>Our team is reviewing the details for <strong>{companyName || "your organization"}</strong>.</li>
              <li>Once approved, this portal will automatically unlock.</li>
              <li>You will gain access to all management and employee onboarding tools.</li>
            </ul>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-[12px] border border-blue-500/20 text-left mb-8">
            <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-500 mb-1">Need Urgent Access?</h4>
              <p className="text-xs text-blue-500/80">If you require immediate approval, please contact the global system administrator at <strong>admin@teamcarrezza.com</strong> with your organization name.</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-bg-base hover:bg-border-card text-text-main font-bold text-sm rounded-[12px] border border-border-card transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign Out For Now
          </button>
        </div>
      </div>
    );
  }

  if (companyStatus === "deactive" && !isSuperAdmin) {
    return (
      <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in text-center">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-primary filter blur-[150px] opacity-10 pointer-events-none" />

        <div className="max-w-[460px] bg-bg-card border border-border-card rounded-[24px] p-10 shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-500/20">
            <Lock size={36} />
          </div>
          <h1 className="text-3xl font-extrabold text-text-main mb-3">Subscription Expired</h1>
          <h2 className="text-sm font-bold text-rose-500 tracking-wider uppercase mb-6 bg-rose-500/10 inline-block px-3 py-1 rounded-full">Organization Deactivated</h2>
          <p className="text-sm text-text-sec leading-relaxed mb-8">
            Your organization's subscription has expired or the workspace has been deactivated. Please contact your organization administrator to recharge the subscription.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-bg-base hover:bg-border-card text-text-main font-bold text-sm rounded-[12px] border border-border-card transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const filteredModules = (() => {
    if (!localSearch.trim()) return [];
    const query = localSearch.toLowerCase();
    return filteredMenuItems.filter(item =>
      !item.hidden && item.label.toLowerCase().includes(query)
    );
  })();

  return (
    <div className="flex min-h-screen w-full bg-bg-base text-text-main overflow-x-hidden">
      {/* Sidebar Panel - Desktop */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-bg-card border-r border-border-card flex-shrink-0 z-30 fixed h-screen">
        {/* Logo and Brand */}
        <div className="py-5 px-6 border-b border-border-card flex items-center justify-between">
          <Link to="/" className="no-underline">
            <Logo size={32} showText={true} />
          </Link>
        </div>

        {/* Small business branding card */}
        {!isSuperAdmin && (
          <div className="mx-4 my-4 p-3 bg-brand-primary/5 rounded-[12px] border border-brand-primary/10 flex items-center gap-3">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Logo"
                className="w-10 h-10 rounded-[10px] object-contain bg-white p-1.5 shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-[10px] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-black text-lg shadow-sm">
                {companyName ? companyName.charAt(0).toUpperCase() : <Building2 size={18} />}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-text-main truncate" title={companyName}>{companyName || "Organization"}</p>
              <p className="text-[10px] font-bold text-text-mut uppercase tracking-wider truncate border border-brand-primary/20 bg-brand-primary/10 rounded-full px-2 py-0.5 mt-1 inline-block">Workspace</p>
            </div>
          </div>
        )}

        {/* Sidebar Nav links */}
        <nav className="flex-grow px-3 py-2 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item, idx) => {
            if (item.hidden) return null;
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-[12px] text-sm font-semibold transition-all duration-200 cursor-pointer ${item.active
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/15"
                  : "text-text-sec hover:text-brand-primary hover:bg-brand-primary/8"
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="whitespace-nowrap truncate">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse min-w-[20px]">
                    {item.badge}
                  </span>
                ) : (
                  item.active && <ChevronRight size={14} />
                )}
              </button>
            );
          })}
        </nav>



        {/* Footer info & Logout */}
        <div className="p-4 border-t border-border-card flex items-center justify-between bg-bg-base/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-sm uppercase">{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}</div>
              )}
            </div>
            <div className="flex flex-col text-left min-w-0 pr-2">
              <span className="font-bold text-sm text-text-main truncate leading-tight">{currentUser?.name || "Admin"}</span>
              <span className="text-[10px] text-text-mut font-extrabold uppercase tracking-wider">{currentUser?.role?.replace('_', ' ') || "ADMIN"}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-text-mut hover:text-red-500 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div className="flex flex-col flex-grow min-h-screen w-full lg:pl-[260px]">
        {/* Top Header navbar */}
        <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-[60px] sm:h-[70px] bg-bg-card/85 backdrop-blur-md border-b border-border-card px-3 sm:px-4 lg:px-8 flex items-center justify-between z-40 shadow-sm transition-all">
          {/* Mobile: hamburger + logo icon only (no text) */}
          <div className="flex items-center gap-2 lg:hidden flex-shrink-0 min-w-0 overflow-hidden">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              className="relative w-9 h-9 flex flex-col items-center justify-center gap-0 rounded-[8px] border border-border-card bg-bg-card text-text-main hover:bg-bg-base cursor-pointer overflow-hidden"
            >
              <span
                className="block w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{
                  transform: isMobileOpen ? 'translateY(4px) rotate(45deg)' : 'translateY(-3px)',
                }}
              />
              <span
                className="block h-[2px] bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{
                  width: isMobileOpen ? '0px' : '20px',
                  opacity: isMobileOpen ? 0 : 1,
                }}
              />
              <span
                className="block w-5 h-[2px] bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{
                  transform: isMobileOpen ? 'translateY(-4px) rotate(-45deg)' : 'translateY(3px)',
                }}
              />
            </button>
            {/* Show only the icon on mobile, hide text to prevent overflow */}
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="CGS"
                className="w-7 h-7 object-contain rounded-[6px] shadow-sm"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="font-extrabold text-sm text-text-main tracking-tight hidden xs:block">CGS</span>
            </div>
          </div>

          {/* Action icons - right side */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 ml-auto flex-shrink-0">
            {/* Global Search */}
            <div className={`flex items-center transition-all duration-300 ${isSearchExpanded ? 'w-full absolute left-0 px-4 bg-bg-card/95 backdrop-blur-md z-50 h-[60px] sm:h-[70px]' : 'w-auto relative'}`}>
              {!isSearchExpanded ? (
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="flex w-8 h-8 items-center justify-center border border-border-card rounded-[10px] bg-bg-card hover:bg-bg-base text-text-sec transition-colors cursor-pointer flex-shrink-0"
                  title="Search"
                >
                  <Search size={15} />
                </button>
              ) : (
                <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-[400px] gap-2 ml-auto lg:mr-4 relative animate-fade-in">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={15} className="text-text-mut" />
                    </div>
                    <input
                      type="text"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="Search modules..."
                      className="w-full bg-bg-base border border-border-card text-text-main text-sm rounded-[10px] pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                      autoFocus
                    />
                    {localSearch && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-text-mut hover:text-text-main cursor-pointer"
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}

                    {/* Autocomplete dropdown */}
                    {localSearch && filteredModules.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border-card rounded-[12px] shadow-xl overflow-hidden z-[100] animate-fade-in flex flex-col max-h-[300px] overflow-y-auto">
                        {filteredModules.map((item, idx) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setLocalSearch("");
                                setIsSearchExpanded(false);
                                setTimeout(() => item.onClick(), 0);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-base transition-colors text-left text-sm font-semibold text-text-sec hover:text-brand-primary border-b border-border-card last:border-0"
                            >
                              <Icon size={16} />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {localSearch && filteredModules.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border-card rounded-[12px] shadow-xl overflow-hidden z-[100] animate-fade-in p-4 text-center text-sm text-text-mut font-semibold">
                        No modules found.
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(false)}
                    className="text-xs font-bold text-text-mut hover:text-text-main transition-colors cursor-pointer whitespace-nowrap bg-bg-base hover:bg-border-card px-3 py-2 rounded-[8px]"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>

            {dbMode === "local" && (
              <span className="hidden xs:flex bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider items-center gap-1.5">
                <HardDrive size={10} /> Demo
              </span>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-8 h-8 flex items-center justify-center border border-border-card rounded-[10px] bg-bg-card hover:bg-bg-base text-text-sec transition-colors cursor-pointer flex-shrink-0"
              title="Refresh Page"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin text-brand-primary" : ""} />
            </button>

            {/* Raise Support Ticket to Zuna (Admins Only) */}
            {isAdminUser && (
              <>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="w-8 h-8 flex items-center justify-center border border-brand-primary/30 rounded-[10px] bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-colors cursor-pointer flex-shrink-0"
                  title="Raise Support Ticket to Zuna"
                >
                  <LifeBuoy size={15} />
                </button>

                <RaiseTicketModal
                  isOpen={showTicketModal}
                  onClose={() => setShowTicketModal(false)}
                  clientName={currentUser?.name || companyName || "HR Administrator"}
                  clientEmail={currentUser?.email || ""}
                />
              </>
            )}

            {/* Light/Dark mode switcher */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center border border-border-card rounded-[10px] bg-bg-card hover:bg-bg-base text-text-sec transition-colors cursor-pointer flex-shrink-0"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {/* Notifications */}
            <div className="relative flex-shrink-0" id="notif-anchor">
              <button
                className="w-8 h-8 flex items-center justify-center border border-border-card rounded-[10px] bg-bg-card hover:bg-bg-base text-text-sec relative cursor-pointer"
                onClick={handleOpenNotifications}
                title="Notifications"
              >
                <Bell size={15} />
                {totalUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full border-2 border-bg-card" />
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop - clicks outside to close */}
                  <div className="fixed inset-0 z-[199]" onClick={() => setShowNotifications(false)} />
                  {/* Dropdown panel - fixed so it's never clipped by parent overflow/z-index */}
                  <div className="fixed top-[65px] sm:top-[75px] right-3 sm:right-4 lg:right-8 w-[calc(100vw-1.5rem)] max-w-[340px] bg-bg-card border border-border-card rounded-[16px] shadow-2xl p-4 z-[200] text-left animate-scale-up">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-border-card">
                      <span className="font-extrabold text-xs text-text-main uppercase tracking-wider"><Bell size={14} className='inline-block mr-1' /> Notifications</span>
                      <div className="flex items-center gap-2">
                        {totalUnreadCount > 0 && (
                          <>
                            <span className="bg-brand-primary text-white px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                              {totalUnreadCount} New
                            </span>
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[10px] text-brand-primary hover:underline font-bold bg-brand-primary/10 px-2 py-0.5 rounded cursor-pointer"
                            >
                              Mark all as read
                            </button>
                          </>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="text-text-mut hover:text-text-main transition-colors cursor-pointer flex items-center justify-center p-0.5" title="Close notifications">
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {combinedNotifs.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="text-3xl mb-2"><Mailbox size={32} className='mx-auto text-brand-primary' /></div>
                        <p className="text-xs text-text-mut font-semibold">No notifications yet.</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 overscroll-contain">
                        {combinedNotifs.slice(0, 15).map((item) => {
                          if (item.isSystemNotif) {
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSystemNotifClick(item)}
                                className={`p-2.5 rounded-[12px] border text-xs flex flex-col gap-1 transition-all cursor-pointer ${!item.read
                                    ? "bg-brand-primary/10 border-brand-primary/20 shadow-sm"
                                    : "bg-bg-base/30 border-border-card"
                                  }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-extrabold text-text-main truncate max-w-[150px]">{item.title}</span>
                                  {!item.read && (
                                    <div className="flex items-center gap-2">
                                      <span className="bg-brand-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">NEW</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); markNotificationRead(item.id); }}
                                        className="p-1 text-text-mut hover:text-brand-primary hover:bg-brand-primary/10 rounded transition-colors cursor-pointer"
                                        title="Mark as read"
                                      >
                                        <Check size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] text-text-sec">{item.message}</p>
                                <span className="text-[8px] text-text-mut self-end mt-0.5 font-semibold">
                                  {new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          } else if (item.isLeaveNotif) {
                            const req = item;
                            const isApproved = req.status === "approved";
                            const isRejected = req.status === "rejected";

                            let badgeColor = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
                            let symbol = "⏳";
                            if (isApproved) {
                              badgeColor = "bg-emerald-500/10 text-emerald-500";
                              symbol = "✓";
                            } else if (isRejected) {
                              badgeColor = "bg-red-500/10 text-red-500";
                              symbol = "✗";
                            }

                            const seenStr = localStorage.getItem(`seen_leaves_${currentUser?.uid}`);
                            const seen = seenStr ? JSON.parse(seenStr) : {};
                            const isNewUpdate = currentUser?.role !== "admin" && seen[req.id] !== req.status && req.status !== "pending";

                            return (
                              <div
                                key={req.id}
                                onClick={() => {
                                  if (currentUser?.role === "admin") navigate("/admin");
                                  else navigate("/history");
                                  setShowNotifications(false);
                                }}
                                className={`p-2.5 rounded-[12px] border text-xs flex flex-col gap-1 transition-all cursor-pointer hover:bg-bg-base/40 ${isNewUpdate
                                    ? "bg-brand-primary/10 border-brand-primary/20 shadow-sm"
                                    : "bg-bg-base/30 border-border-card"
                                  }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-extrabold text-text-main truncate max-w-[150px]">{req.type}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {isNewUpdate && (
                                      <span className="bg-brand-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">NEW</span>
                                    )}
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeColor}`}>
                                      {symbol} {req.status}
                                    </span>
                                    <button
                                      onClick={(e) => handleDeleteNotification(e, req.id)}
                                      className="p-1 text-text-mut hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer ml-1 flex items-center justify-center"
                                      title="Delete Notification"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-text-sec">
                                  {currentUser?.role === "admin"
                                    ? `${req.userName} requested ${req.type} (${req.duration}).`
                                    : `Your ${req.type} request for ${req.duration} was ${req.status}.`}
                                </p>
                                {req.managerComment && (
                                  <p className="text-[10px] text-brand-primary italic mt-0.5 bg-brand-primary/5 p-1.5 rounded border border-brand-primary/10">
                                    Comment: "{req.managerComment}"
                                  </p>
                                )}
                                <span className="text-[8px] text-text-mut self-end mt-0.5 font-semibold">
                                  {new Date(req.updatedAt || req.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Help / Support Ticket (Admin) or Attendance Rules (Employee) */}
            <button
              className="hidden sm:flex w-8 h-8 items-center justify-center border border-border-card rounded-[10px] bg-bg-card hover:bg-bg-base text-text-sec cursor-pointer flex-shrink-0"
              onClick={() => {
                if (isAdminUser) {
                  setShowTicketModal(true);
                } else {
                  setShowRulesModal(true);
                }
              }}
              title={isAdminUser ? "Raise Support Ticket to Zuna" : "Attendance Rules"}
            >
              <HelpCircle size={15} />
            </button>

            {/* Divider - hidden on mobile */}
            <div className="h-5 w-px bg-border-card hidden sm:block" />

            {/* User profile avatar button */}
            <button
              onClick={() => navigate("/profile")}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-white border border-brand-primary/20 hover:border-brand-primary/60 hover:shadow-[0_0_0_2px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center shadow-sm cursor-pointer focus:outline-none overflow-hidden"
              title="View Profile"
            >
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-sm uppercase">{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}</div>
              )}
            </button>
          </div>
        </header>

        {/* Dashboard Content Container with padding to clear fixed header */}
        <main className="flex-grow p-3 sm:p-4 lg:p-8 pt-[72px] sm:pt-[86px] lg:pt-[102px] overflow-y-auto">
          {isRefreshing ? (
            <DashboardSkeleton />
          ) : (
            <div key={refreshKey} className="w-full h-full flex flex-col">
              {isCurrentModuleEnabled ? children : (
                <div className="flex-grow flex flex-col items-center justify-center p-6 text-center animate-fade-in my-auto">
                  <div className="max-w-[460px] bg-bg-card border border-border-card rounded-[24px] p-10 shadow-2xl relative overflow-hidden mx-auto">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-purple-500"></div>
                    <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-brand-primary/20 animate-pulse">
                      <Lock size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-text-main mb-2">Module Locked</h2>
                    <p className="text-sm text-text-sec leading-relaxed mb-6">
                      This module is not active under your organization's current plan subscription. Please contact your organization administrator or upgrade your plan to unlock this feature.
                    </p>
                    <button
                      onClick={() => navigate(isAdmin ? "/admin?tab=analytics" : "/dashboard")}
                      className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-md shadow-brand-primary/15"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Sidebar Navigation */}
      <div
        className={`fixed inset-0 z-50 flex lg:hidden transition-all duration-300 ${isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMobileOpen}
      >
        {/* Overlay backdrop */}
        <div
          className={`fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[2px] transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Drawer menu - slides in from left */}
        <aside
          className="relative flex flex-col w-[280px] max-w-[85vw] bg-bg-card h-full z-10 border-r border-border-card shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          {/* Header close trigger */}
          <div className="py-4 px-5 border-b border-border-card flex items-center justify-between">
            <Logo size={28} showText={true} />
            <button
              onClick={() => setIsMobileOpen(false)}
              className="w-8 h-8 flex items-center justify-center border border-border-card rounded-[8px] text-text-sec"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item, idx) => {
              if (item.hidden) return null;
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-[12px] text-sm font-semibold transition-colors cursor-pointer ${item.active
                    ? "bg-brand-primary text-white"
                    : "text-text-sec hover:text-brand-primary hover:bg-brand-primary/8"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse min-w-[20px]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>


          {/* Mobile Footer profile */}
          <div className="p-4 border-t border-border-card flex items-center justify-between bg-bg-base/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "AP"
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-xs text-text-main truncate max-w-[110px]">{currentUser?.name}</span>
                <span className="text-[9px] text-text-mut uppercase font-semibold">{currentUser?.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-red-500/10 text-text-sec hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>
      </div>

      {/* Quick Check-In Modal */}
      {showQuickCheckModal && currentUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[400px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up text-center relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                <Clock size={20} className="text-brand-primary" />
                <span>Quick Actions</span>
              </h3>
              <button
                onClick={() => setShowQuickCheckModal(false)}
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content info */}
            <p className="text-sm text-text-sec mb-6">
              Select an action to log your attendance from anywhere in the portal. Location services must be enabled.
            </p>

            {/* Status Indicator */}
            <div className="mb-6 p-4 rounded-[16px] bg-bg-base/50 border border-border-card text-left flex items-center justify-between">
              <span className="text-xs font-semibold text-text-sec">Current Status:</span>
              {!todayLog ? (
                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">Not Checked In</span>
              ) : todayLog.status === "checked-in" ? (
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">Working</span>
              ) : todayLog.status === "on-break" ? (
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">On Break</span>
              ) : (
                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">Checked Out</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {!todayLog && (
                <button
                  onClick={handleQuickCheckIn}
                  disabled={loadingAction}
                  className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-[12px] flex items-center justify-center gap-2 hover:bg-brand-hover shadow-md shadow-brand-primary/10 transition-all cursor-pointer"
                >
                  <Play size={16} fill="#fff" />
                  <span>{loadingAction ? "Processing..." : "Check In Now"}</span>
                </button>
              )}

              {todayLog && todayLog.status === "checked-in" && (
                <button
                  onClick={handleQuickCheckOut}
                  disabled={loadingAction}
                  className="w-full py-3 px-4 bg-brand-danger text-white font-bold rounded-[12px] flex items-center justify-center gap-2 hover:bg-brand-danger-hover shadow-md shadow-brand-danger/10 transition-all cursor-pointer"
                >
                  <Square size={14} fill="#fff" />
                  <span>{loadingAction ? "Processing..." : "Check Out & End Shift"}</span>
                </button>
              )}

              {todayLog && todayLog.status === "on-break" && (
                <p className="text-xs text-brand-warning font-bold">
                  <AlertTriangle size={16} className='inline-block mr-1 text-amber-500' /> Please resume work on the main Dashboard page to end your break.
                </p>
              )}

              {todayLog && todayLog.status === "checked-out" && (
                <div className="space-y-3">
                  <p className="text-xs text-brand-success font-bold text-center">
                    <Check size={16} className='inline-block mr-1 text-emerald-500' /> Shift checked out! You can check in again anytime.
                  </p>
                  <button
                    onClick={handleQuickCheckIn}
                    disabled={loadingAction}
                    className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-[12px] flex items-center justify-center gap-2 hover:bg-brand-hover shadow-md shadow-brand-primary/10 transition-all cursor-pointer"
                  >
                    <Play size={16} fill="#fff" />
                    <span>{loadingAction ? "Processing..." : "Check In Again"}</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowQuickCheckModal(false)}
                disabled={loadingAction}
                className="w-full py-2.5 px-4 border border-border-card text-text-sec font-semibold rounded-[12px] hover:bg-bg-base transition-all cursor-pointer mt-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Help / Attendance Rules Modal */}
      {showRulesModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[500px] bg-bg-card border border-border-card rounded-[24px] p-6 lg:p-8 shadow-xl animate-scale-up relative overflow-hidden text-left">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-card">
              <h3 className="font-extrabold text-lg text-text-main flex items-center gap-2">
                <HelpCircle size={20} className="text-brand-primary" />
                <span>Attendance Guidelines & Rules</span>
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rules Text Content */}
            <div className="mb-6 space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {rules ? (
                rules.split("\n").map((rule, idx) => (
                  <div key={idx} className="p-3.5 rounded-[12px] bg-bg-base/40 border border-border-card text-xs text-text-sec leading-relaxed font-semibold">
                    {rule}
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-mut py-6 text-center font-bold">No guidelines published yet.</p>
              )}
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[12px] transition-colors cursor-pointer"
            >
              Understand & Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

