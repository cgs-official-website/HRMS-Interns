import React, { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
const zunaLogo = "data:image/png;base64,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";

import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import {
  checkIn,
  checkOut,
  startBreak,
  resumeWork,
  subscribeToUserLogs,
  requestLeave,
  subscribeToPaidLeaves,
  subscribeToLeaveRequests,
  getAllRegisteredUsers,
  stopTaskTimer,
  subscribeToUserTasks,
  getLocalDateString,
  subscribeToAssets,
  subscribeToCompanyPayroll,
  listenToCompany,
  db,
  getDbType
} from "../firebase";
import { getDoc, doc } from "firebase/firestore";
import { resolveLocationName, getDistanceFromLatLonInMeters, isPointInPolygon } from "../utils/locationHelper";
import {
  Play,
  Square,
  Coffee,
  Compass,
  Clock,
  RotateCcw,
  MapPin,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Map,
  ChevronRight,
  LogOut,
  CalendarDays,
  Umbrella,
  X,
  Briefcase,
  Calendar as CalendarIcon,
  Target,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Cake,
  Newspaper,
  Check,
  Activity,
  HardDrive,
  IndianRupee,
  Banknote,
  FileText,
  Download
} from "lucide-react";
import CustomDateRangePicker from "../components/CustomDateRangePicker";


const numberToWords = (num) => {
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  if (!num && num !== 0) return '';
  num = Math.round(Number(num));
  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str || 'zero';
};

export default function UserDashboard() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  // Dynamic Environment Settings
  const [envConfig, setEnvConfig] = useState({ breaksPerDay: 3, breakDurationMinutes: 30 });
  const [geoConfig, setGeoConfig] = useState({ enabled: false });

  useEffect(() => {
    const fetchEnv = async () => {
      if (currentUser?.companyId) {
        try {
          if (getDbType() === "firebase") {
            const docRef = doc(db, "companies", currentUser.companyId, "environmentSettings", "general");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.workSettings) {
                setEnvConfig({
                  breaksPerDay: data.workSettings.breaksPerDay || 3,
                  breakDurationMinutes: data.workSettings.breakDurationMinutes || 30,
                  shiftStartTime: data.workSettings.shiftStartTime || "09:00",
                  shiftEndTime: data.workSettings.shiftEndTime || "18:00",
                  enforceShiftTiming: data.workSettings.enforceShiftTiming || false
                });
              }
              if (data.geolocationSettings) {
                setGeoConfig(data.geolocationSettings);
              }
            }
          } else {
            const localEnv = localStorage.getItem(`env_settings_general_${currentUser.companyId}`);
            if (localEnv) {
              const parsed = JSON.parse(localEnv);
              if (parsed.workSettings) {
                setEnvConfig({
                  breaksPerDay: parsed.workSettings.breaksPerDay || 3,
                  breakDurationMinutes: parsed.workSettings.breakDurationMinutes || 30,
                  shiftStartTime: parsed.workSettings.shiftStartTime || "09:00",
                  shiftEndTime: parsed.workSettings.shiftEndTime || "18:00",
                  enforceShiftTiming: parsed.workSettings.enforceShiftTiming || false
                });
              }
              if (parsed.geolocationSettings) {
                setGeoConfig(parsed.geolocationSettings);
              }
            }
          }
        } catch(e) { console.warn("Failed to load env config", e); }
      }
    };
    fetchEnv();
  }, [currentUser]);

  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getLocalDateString(tomorrow);
  };
  const tomorrowStr = getTomorrowDateString();
  const todayStr = getLocalDateString();

  const [dismissedLeaves, setDismissedLeaves] = useState(() => {
    const saved = localStorage.getItem("dismissed_paid_leaves");
    return saved ? JSON.parse(saved) : [];
  });

  const handleDismissPaidLeave = (e, id) => {
    e.stopPropagation();
    const updated = [...dismissedLeaves, id];
    setDismissedLeaves(updated);
    localStorage.setItem("dismissed_paid_leaves", JSON.stringify(updated));
    showToast("Notification dismissed.", "info");
  };

  const [userLogs, setUserLogs] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [userTasks, setUserTasks] = useState(currentUser?.tasks || []);
  const [myPayslips, setMyPayslips] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyPayrollSettings, setCompanyPayrollSettings] = useState({ pf: true, esi: true, pt: true, insurance: false, insuranceAmount: 0 });
  const [companyLogo, setCompanyLogo] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  useEffect(() => {
    if (currentUser?.companyId) {
      const unsub = listenToCompany(currentUser.companyId, (data) => {
        if(data) {
          setCompanyName(data.name || "ZUNA HRMS");
          setCompanyLogo(data.logoBase64 || "");
          setCompanyAddress(data.address || "");
          if (data.payrollSettings) {
            setCompanyPayrollSettings(data.payrollSettings);
          }
        }
      });
      return () => unsub();
    }
  }, [currentUser?.companyId]);
  const [todayLog, setTodayLog] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

  // Leave Form & Notice Board states
  const [paidLeaves, setPaidLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [leaveDuration, setLeaveDuration] = useState("1 Day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [myLeaveRequests, setMyLeaveRequests] = useState([]);
  const [selectedPaidLeaveDetail, setSelectedPaidLeaveDetail] = useState(null);

  const [loading, setLoading] = useState(true);
  const [leavesPage, setLeavesPage] = useState(1);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamOnLeaveCount, setTeamOnLeaveCount] = useState(0);
  const [birthdays, setBirthdays] = useState([]);


  const toastShownRef = useRef(false);

  const isCheckedIn = !!(todayLog && (
    todayLog.status === "checked-in" || 
    todayLog.status === "in-progress" || 
    todayLog.status === "present" || 
    (todayLog.check_in && !todayLog.check_out)
  ));
  const isCheckedOut = !!(todayLog && (
    todayLog.status === "checked-out" || 
    todayLog.status === "completed" || 
    !!todayLog.check_out
  ));
  const isOnBreak = !!(todayLog && todayLog.status === "on-break");

  const getElapsedWorkingMs = () => {
    if (!todayLog) return 0;
    
    // If today is checked out and totalWorkingMinutes is calculated
    if (isCheckedOut && todayLog.totalWorkingMinutes !== undefined) {
      return (todayLog.totalWorkingMinutes || 0) * 60 * 1000;
    }

    const accumulatedMs = (todayLog.accumulatedWorkingMinutes || 0) * 60 * 1000;

    const activeCheckIn = todayLog.lastCheckInTime || todayLog.checkInTime || todayLog.check_in;
    if (!activeCheckIn) return accumulatedMs;

    const checkInDate = new Date(activeCheckIn);
    const checkOutDate = (todayLog.checkOutTime || todayLog.check_out) ? new Date(todayLog.checkOutTime || todayLog.check_out) : currentTime;
    
    const sessionElapsedMs = checkOutDate.getTime() - checkInDate.getTime();
    
    let breakMs = 0;
    const activeBreaks = (todayLog.sessions && todayLog.sessions.length > 0)
      ? (todayLog.currentSessionBreaks || [])
      : (todayLog.breaks || []);

    if (activeBreaks && activeBreaks.length > 0) {
      activeBreaks.forEach(b => {
        if (b.startTime) {
          const start = new Date(b.startTime);
          const resume = b.resumeTime ? new Date(b.resumeTime) : ((todayLog.checkOutTime || todayLog.check_out) ? new Date(todayLog.checkOutTime || todayLog.check_out) : currentTime);
          breakMs += (resume.getTime() - start.getTime());
        }
      });
    }
    
    const currentSessionWorkingMs = Math.max(0, sessionElapsedMs - breakMs);
    const totalWorkingMs = accumulatedMs + currentSessionWorkingMs;

    // If total working time exceeds 9 hours, cap at 8 hours
    if (totalWorkingMs > 9 * 60 * 60 * 1000) {
      return 8 * 60 * 60 * 1000;
    }
    
    return totalWorkingMs;
  };

  const formatDuration = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const isWithinShiftHours = () => {
    if (!envConfig?.enforceShiftTiming) return true;
    if (!currentUser.shiftStart || !currentUser.shiftEnd) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const getMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = getMinutes(currentUser.shiftStart);
    const endMinutes = getMinutes(currentUser.shiftEnd);

    if (endMinutes < startMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const isForgotToCheckIn = (() => {
    if (loading) return false;
    if (currentUser.role === "admin") return false;
    if (todayLog || isCheckedIn || isCheckedOut) return false;
    
    // Check if today is a weekday
    const day = currentTime.getDay();
    const isWeekday = day >= 1 && day <= 5;
    if (!isWeekday) return false;
    
    // Parse shiftStart (e.g. "10:00")
    if (!currentUser.shiftStart) return false;
    const [startH, startM] = currentUser.shiftStart.split(":").map(Number);
    const shiftStartToday = new Date(currentTime);
    shiftStartToday.setHours(startH, startM, 0, 0);
    
    return currentTime > shiftStartToday && isWithinShiftHours();
  })();

  useEffect(() => {
    if (isForgotToCheckIn && !toastShownRef.current) {
      showToast("Shift Started! You forgot to check-in today. Please check-in immediately.", "warning", 6000);
      toastShownRef.current = true;
    } else if (!isForgotToCheckIn) {
      toastShownRef.current = false;
    }
  }, [isForgotToCheckIn]);

  const formatShiftTime = (timeStr) => {
    if (!timeStr) return "10:00 AM";
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = String(minutes).padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Ticking time effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return () => clearInterval(timer);
  }, []);

  // Reset pagination on tab change
  useEffect(() => {
    setLeavesPage(1);
  }, [activeTab]);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [breakTotalSeconds, setBreakTotalSeconds] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef(null);

  // Fetch GPS on mount and subscribe to logs
  useEffect(() => {
    refreshLocation();

    const unsubscribe = subscribeToUserLogs(currentUser.uid, (logs) => {
      setUserLogs(logs);
      const todayStr = getLocalDateString();
      const today = logs.find(log => {
        if (!log) return false;
        const logDateStr = typeof log.date === "string" ? log.date.split("T")[0] : "";
        if (logDateStr === todayStr) return true;
        if (log.id && log.id === `${currentUser.uid}_${todayStr}`) return true;
        if (log.check_in && new Date(log.check_in).toDateString() === new Date().toDateString()) return true;
        return false;
      });
      setTodayLog(today || null);
      setLoading(false);
    });

    const unsubscribePaid = subscribeToPaidLeaves(currentUser.companyId, (list) => {
      setPaidLeaves(list);
    });

    const unsubscribeLeaves = subscribeToLeaveRequests(currentUser.companyId, (list) => {
      const items = Array.isArray(list) ? list : [];
      setMyLeaveRequests(items.filter(r => (r.userId || r.user_id) === currentUser.uid));
      
      const todayStr = getLocalDateString();
      const deptOnLeave = items.filter(r => 
        r.status === "approved" && 
        (r.userDept || r.department) === currentUser.department && 
        (r.userId || r.user_id) !== currentUser.uid &&
        r.startDate <= todayStr && 
        r.endDate >= todayStr
      );
      setTeamOnLeaveCount(deptOnLeave.length);
    });

    getAllRegisteredUsers(currentUser.companyId).then(usersList => {
      const deptUsers = usersList.filter(u => u.department === currentUser.department && u.uid !== currentUser.uid && u.role !== "admin");
      setTeamMembers(deptUsers);
      
      const todayDate = new Date();
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);

      const todayMonth = todayDate.getMonth() + 1;
      const todayDay = todayDate.getDate();
      const tmrwMonth = tomorrowDate.getMonth() + 1;
      const tmrwDay = tomorrowDate.getDate();

      const upcomingBirthdays = usersList.filter(u => {
        if (!u.dob) return false;
        const parts = u.dob.split('-');
        if (parts.length !== 3) return false;
        const month = parseInt(parts[1], 10);
        return (month === todayMonth && day === todayDay) || (month === tmrwMonth && day === tmrwDay);
      }).map(u => {
        const parts = u.dob.split('-');
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        return { ...u, isBirthdayToday: month === todayMonth && day === todayDay };
      });
      setBirthdays(upcomingBirthdays);
    }).catch(err => console.warn("Failed to fetch team members:", err));

    const unsubscribeAssets = subscribeToAssets(currentUser.companyId, (list) => {
      setMyAssets(list.filter(a => a.assignedUserId === currentUser.uid || a.assigned_to === currentUser.uid || a.assignedUser === currentUser.uid));
    });

    const unsubscribeTasks = subscribeToUserTasks(currentUser.uid, (tasks) => {
      setUserTasks(tasks || []);
    });

    const unsubscribePayroll = subscribeToCompanyPayroll(currentUser.companyId, null, null, (list) => {
      setMyPayslips(list.filter(p => p.employeeId === currentUser.uid));
    });

    return () => {
      unsubscribe();
      unsubscribePaid();
      unsubscribeLeaves();
      unsubscribeAssets();
      unsubscribeTasks();
      unsubscribePayroll();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentUser.uid, currentUser.department, currentUser.companyId]);

  // Handle countdown timer when user is on break
  useEffect(() => {
    if (todayLog && todayLog.status === "on-break" && todayLog.currentBreakTimerEnd) {
      const endTime = new Date(todayLog.currentBreakTimerEnd).getTime();

      const activeBreak = todayLog.breaks?.find(b => !b.resumeTime);
      if (activeBreak) {
        const start = new Date(activeBreak.startTime).getTime();
        setBreakTotalSeconds((endTime - start) / 1000);
      }

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(diff);

        if (diff <= 0) {
          setTimerExpired(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        } else {
          setTimerExpired(false);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(0);
      setTimerExpired(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [todayLog]);

  const refreshLocation = () => {
    setFetchingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      setFetchingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy)
        });
        setFetchingGps(false);
      },
      (error) => {
        let msg = "Failed to fetch GPS coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "GPS access denied. Please enable location services in your browser.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setGpsError(msg);
        setFetchingGps(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const getFreshLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      const handleSuccess = async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let locationName = "";
        try {
          locationName = await Promise.race([
            resolveLocationName(lat, lon),
            new Promise((_, reject) => setTimeout(() => reject(new Error("reverse geocode timeout")), 2000))
          ]);
        } catch (e) {
          locationName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
        const loc = {
          latitude: lat,
          longitude: lon,
          accuracy: Math.round(position.coords.accuracy),
          locationName: locationName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        };
        setGpsLocation(loc);
        resolve(loc);
      };

      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (error) => {
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
            navigator.geolocation.getCurrentPosition(
              handleSuccess,
              (err2) => {
                reject(new Error("Could not fetch GPS coordinates. Please ensure location is enabled."));
              },
              { enableHighAccuracy: false, timeout: 6000, maximumAge: 0 }
            );
          } else {
            let msg = "Could not fetch active GPS coordinates. Please ensure location is enabled.";
            if (error.code === error.PERMISSION_DENIED) {
              msg = "Location permission denied. Please allow GPS access to check-in/out.";
            }
            reject(new Error(msg));
          }
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      if (envConfig?.enforceShiftTiming && envConfig?.shiftStartTime && envConfig?.shiftEndTime) {
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = envConfig.shiftStartTime.split(':').map(Number);
        const startTotalMinutes = startH * 60 + startM;

        const [endH, endM] = envConfig.shiftEndTime.split(':').map(Number);
        const endTotalMinutes = endH * 60 + endM;

        // Note: this simple logic assumes shift does not cross midnight. 
        // If it crosses midnight (start > end), the logic needs adjustment.
        if (startTotalMinutes <= endTotalMinutes) {
          if (currentTotalMinutes < startTotalMinutes || currentTotalMinutes > endTotalMinutes) {
            throw new Error(`Check-in denied: You can only check in during your scheduled shift (${envConfig.shiftStartTime} - ${envConfig.shiftEndTime}).`);
          }
        } else {
          // Night shift handling (e.g. 22:00 to 06:00)
          if (currentTotalMinutes < startTotalMinutes && currentTotalMinutes > endTotalMinutes) {
            throw new Error(`Check-in denied: You can only check in during your scheduled shift (${envConfig.shiftStartTime} - ${envConfig.shiftEndTime}).`);
          }
        }
      }

      showToast("Fetching location...", "info", 1500);
      let location = null;
      try {
        location = await getFreshLocation();
      } catch (locErr) {
        console.warn("GPS fetch error:", locErr);
        if (geoConfig?.enabled && !currentUser?.allowManualCheckIn) {
          throw locErr;
        }
        location = {
          latitude: null,
          longitude: null,
          accuracy: null,
          locationName: "Office / Remote (Location unavailable)"
        };
      }

      if (geoConfig?.enabled && !currentUser?.allowManualCheckIn && location.latitude && location.longitude) {
        if (geoConfig.type === "polygon" && Array.isArray(geoConfig.polygonCoords) && geoConfig.polygonCoords.length > 2) {
          const inside = isPointInPolygon(location, geoConfig.polygonCoords);
          if (!inside) {
            throw new Error(`Check-in denied: You are outside the permitted polygon area.`);
          }
        } else {
          const { latitude: targetLat, longitude: targetLon, radiusMeters } = geoConfig;
          if (targetLat && targetLon && radiusMeters) {
            const distance = getDistanceFromLatLonInMeters(location.latitude, location.longitude, targetLat, targetLon);
            if (distance > radiusMeters) {
              throw new Error(`Check-in denied: You are outside the permitted area. Distance: ${Math.round(distance)}m (Allowed: ${radiusMeters}m).`);
            }
          }
        }
      }

      const res = await checkIn(currentUser, location);
      if (res) {
        setTodayLog(res);
      }
      showToast("Checked in successfully! Have a great workday.", "success");
    } catch (err) {
      showToast(err.message || "Failed to check in.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = () => {
    setShowCheckoutConfirm(true);
  };

  const confirmCheckOut = async () => {
    setShowCheckoutConfirm(false);
    setActionLoading(true);
    try {
      showToast("Fetching location...", "info", 1500);
      let location = null;
      try {
        location = await getFreshLocation();
      } catch (locErr) {
        location = { latitude: null, longitude: null, locationName: "Office / Remote" };
      }
      const res = await checkOut(currentUser.uid, location);
      if (res) {
        setTodayLog(res);
      }
      showToast("Checked out successfully! See you tomorrow.", "success");
    } catch (err) {
      showToast(err.message || "Failed to check out.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async (breakType) => {
    setActionLoading(true);
    try {
      showToast("Fetching location for break start...", "info", 1500);
      const location = await getFreshLocation();
      await startBreak(currentUser.uid, breakType, location);
      showToast(`Started ${breakType} break. Timer is running.`, "success");
    } catch (err) {
      showToast(err.message || "Failed to start break.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeWork = async () => {
    setActionLoading(true);
    try {
      showToast("Fetching location to resume work...", "info", 1500);
      const location = await getFreshLocation();
      await resumeWork(currentUser.uid, location);
      showToast("Work resumed successfully! Good luck.", "success");
    } catch (err) {
      showToast(err.message || "Failed to resume work.", "error");
    } finally {
      setActionLoading(false);
    }
  };
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    const finalEndDate = endDate || startDate;

    if (!leaveType || !startDate || !finalEndDate || !leaveReason) {
      return showToast("Please fill in all leave request fields.", "warning");
    }

    const todayString = getLocalDateString();
    const tomorrowString = getTomorrowDateString();

    const startD = new Date(startDate);
    startD.setHours(0, 0, 0, 0);
    const endD = new Date(finalEndDate);
    endD.setHours(0, 0, 0, 0);

    const todayDateObj = new Date(todayString);
    todayDateObj.setHours(0, 0, 0, 0);

    const tomorrowDateObj = new Date(tomorrowString);
    tomorrowDateObj.setHours(0, 0, 0, 0);

    // Validate standard leaves vs emergency leaves start date limits
    if (!isEmergency) {
      if (startDate === todayString || startD < tomorrowDateObj) {
        return showToast("Standard leave requests must start from tomorrow. Choose Emergency Leave to apply for today.", "warning");
      }
    } else {
      // Validate emergency leaves applied for today must be before shift start
      if (startDate === todayString) {
        if (currentUser.shiftStart) {
          const now = new Date();
          const [shiftH, shiftM] = currentUser.shiftStart.split(":").map(Number);
          const shiftStartToday = new Date();
          shiftStartToday.setHours(shiftH, shiftM, 0, 0);

          if (now >= shiftStartToday) {
            const formattedShiftTime = formatShiftTime(currentUser.shiftStart);
            return showToast(`Emergency leave for today must be applied before your shift starts at ${formattedShiftTime}.`, "warning");
          }
        }
      } else if (startD < todayDateObj) {
        return showToast("Emergency leave cannot start in the past.", "warning");
      }
    }

    if (endD < startD) {
      return showToast("End Date cannot be before Start Date.", "warning");
    }

    const diffTime = Math.abs(endD - startD);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const durationStr = `${diffDays} Day${diffDays > 1 ? "s" : ""}`;

    setActionLoading(true);
    try {
      const createdLeave = await requestLeave(
        currentUser.uid,
        currentUser.name,
        currentUser.department || "Engineering",
        leaveType,
        durationStr,
        startDate,
        finalEndDate,
        leaveReason,
        null,
        isEmergency,
        currentUser.companyId
      );
      if (createdLeave) {
        setMyLeaveRequests(prev => [createdLeave, ...prev.filter(r => r.id !== createdLeave.id)]);
      }
      showToast("Leave request submitted successfully.", "success");
      setLeaveType("Annual Leave");
      setStartDate("");
      setEndDate("");
      setLeaveReason("");
      setIsEmergency(false);
    } catch (err) {
      showToast(err.message || "Failed to submit leave request.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getTodayFormatted = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  const timerPercentage = breakTotalSeconds > 0 ? (timeLeft / breakTotalSeconds) * 100 : 0;

  const getShiftDurationMinutes = () => {
    if (!currentUser.shiftStart || !currentUser.shiftEnd) return 540; // 9 hours
    const [startH, startM] = currentUser.shiftStart.split(":").map(Number);
    const [endH, endM] = currentUser.shiftEnd.split(":").map(Number);
    let startMin = startH * 60 + startM;
    let endMin = endH * 60 + endM;
    if (endMin < startMin) endMin += 1440;
    return endMin - startMin;
  };

  const getShiftProgress = () => {
    if (!todayLog || (!todayLog.checkInTime && !todayLog.lastCheckInTime)) return 0;
    const targetMin = getShiftDurationMinutes();
    if (todayLog.status === "checked-out" && todayLog.totalWorkingMinutes !== undefined) {
      return Math.min(100, Math.round((todayLog.totalWorkingMinutes / targetMin) * 100));
    }

    const elapsedMs = getElapsedWorkingMs();
    const elapsedMinutes = elapsedMs / 60000;
    return Math.min(100, Math.round((elapsedMinutes / targetMin) * 100));
  };

  const getActiveHoursText = () => {
    const formatTime = (minutes) => {
      const h = Math.floor(minutes / 60);
      const m = Math.floor(minutes % 60);
      const s = Math.floor((minutes * 60) % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!todayLog || (!todayLog.checkInTime && !todayLog.lastCheckInTime)) return "00:00:00";
    if (todayLog.status === "checked-out" && todayLog.totalWorkingMinutes !== undefined) {
      return formatTime(todayLog.totalWorkingMinutes);
    }
    const elapsedMs = getElapsedWorkingMs();
    return formatDuration(elapsedMs);
  };

  const getWeeklyHours = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date();
    monday.setDate(now.getDate() - distanceToMonday);

    const todayStr = getLocalDateString();

    return days.map((dayName, index) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + index);
      const targetDateStr = getLocalDateString(targetDate);

      const log = userLogs.find(l => l.date === targetDateStr);
      let hrs = 0;
      if (log) {
        if (targetDateStr === todayStr && log.status !== "checked-out") {
          hrs = getElapsedWorkingMs() / (1000 * 60 * 60);
        } else {
          hrs = (log.totalWorkingMinutes || 0) / 60;
        }
      }
      return {
        label: dayName,
        hours: parseFloat(hrs.toFixed(1)),
        active: targetDateStr === todayStr
      };
    });
  };

  const getRecentActivitiesList = () => {
    const list = [];

    if (todayLog) {
      if (todayLog.checkOutTime) {
        list.push({
          type: "out",
          title: "Checked Out",
          time: new Date(todayLog.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateText: "Today",
          desc: `Total: ${((todayLog.totalWorkingMinutes || 0) / 60).toFixed(2)} hrs`
        });
      }

      const reversedBreaks = [...(todayLog.breaks || [])].reverse();
      reversedBreaks.forEach((brk) => {
        if (brk.resumeTime) {
          list.push({
            type: "work",
            title: "Work Resumed",
            time: new Date(brk.resumeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dateText: "Today",
            desc: "Office Worksite"
          });
        }
        list.push({
          type: "break",
          title: brk.type === "short" ? "Break 1 Started" : (brk.type === "bio" ? "Bio Break Started" : "Break 2 Started"),
          time: new Date(brk.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateText: "Today",
          desc: brk.duration ? `${brk.duration} mins` : "In progress"
        });
      });

      if (todayLog.checkInTime) {
        list.push({
          type: "in",
          title: "Checked In",
          time: new Date(todayLog.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateText: "Today",
          desc: "Office Worksite"
        });
      }
    }

    const historyLogs = userLogs.filter(l => l.date !== new Date().toISOString().split("T")[0]).slice(0, 3);
    historyLogs.forEach(hLog => {
      const dateText = new Date(hLog.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (hLog.checkOutTime) {
        list.push({
          type: "out",
          title: "Checked Out",
          time: new Date(hLog.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateText: dateText,
          desc: `Total: ${((hLog.totalWorkingMinutes || 0) / 60).toFixed(2)} hrs`
        });
      }
      if (hLog.checkInTime) {
        list.push({
          type: "in",
          title: "Checked In",
          time: new Date(hLog.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateText: dateText,
          desc: "Office Worksite"
        });
      }
    });

    if (list.length === 0) {
      list.push(
        { type: "in", title: "Checked In", time: "09:12 AM", dateText: "Today", desc: "Remote Work" },
        { type: "out", title: "Checked Out", time: "05:45 PM", dateText: "Yesterday", desc: "Total: 8h 33m" },
        { type: "break", title: "Break Started", time: "01:00 PM", dateText: "Yesterday", desc: "Lunch Break" },
        { type: "in", title: "Checked In", time: "08:58 AM", dateText: "Yesterday", desc: "Office Worksite" }
      );
    }

    return list;
  };

  const shiftProgressPercent = getShiftProgress();
  const shortBreakBalance = todayLog?.shortBreakBalance !== undefined ? todayLog.shortBreakBalance : 1800;
  const longBreakBalance = todayLog?.longBreakBalance !== undefined ? Math.min(todayLog.longBreakBalance, 1800) : 1800;
  const bioBreakBalance = todayLog?.bioBreakBalance !== undefined ? todayLog.bioBreakBalance : 900;
  const shortBreakPercent = (shortBreakBalance / 1800) * 100;
  const longBreakPercent = (longBreakBalance / 1800) * 100;
  const bioBreakPercent = (bioBreakBalance / 900) * 100;

  const weeklyHoursData = getWeeklyHours();
  const recentActivities = getRecentActivitiesList();

  if (loading) {
    
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
      <div className="space-y-5 sm:space-y-8 w-full max-w-[1400px] mx-auto text-left animate-fade-in">
        {/* Welcome Panel Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full max-w-[250px]">
            <div className="h-7 w-48 rounded skeleton" />
            <div className="h-4 w-36 rounded skeleton" />
          </div>
          <div className="h-16 w-full sm:w-64 rounded-[14px] skeleton" />
        </div>

        {/* Paid Leaves Section Skeleton */}
        <div className="bg-bg-card border border-border-card rounded-[24px] p-6 space-y-4">
          <div className="h-5 w-40 rounded skeleton" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="h-28 rounded-[20px] skeleton" />
            <div className="h-28 rounded-[20px] skeleton" />
            <div className="h-28 rounded-[20px] skeleton" />
          </div>
        </div>

        {/* Dashboard Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Shift Panel Skeleton */}
            <div className="h-[280px] rounded-[24px] skeleton" />
            {/* Weekly Attendance Skeleton */}
            <div className="h-[240px] rounded-[24px] skeleton" />
          </div>
          <div className="space-y-8">
            {/* Geolocation Skeleton */}
            <div className="h-[140px] rounded-[24px] skeleton" />
            {/* Recent Activity Skeleton */}
            <div className="h-[320px] rounded-[24px] skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "payslips") {
    
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
      <div className="space-y-6 w-full max-w-[1400px] mx-auto text-left animate-fade-in">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs text-text-mut font-semibold mb-2">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-brand-primary">My Payslips</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">My Payslips</h1>
          <p className="text-sm text-text-sec mt-1">View and download your monthly salary slips.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPayslips.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-text-mut bg-bg-card rounded-[24px] border border-border-card border-dashed">
              No payslips found for your account yet.
            </div>
          ) : (
            myPayslips.map((payslip, idx) => {
              const calculatePayroll = (gross) => {
                const basic = gross * 0.5;
                const hra = basic * 0.4;
                const special = gross - basic - hra;
                const pf = basic * 0.12;
                const esi = gross <= 21000 ? gross * 0.0075 : 0;
                
                const getPTDeduction = (g) => {
                  if (g <= 21000) return 0;
                  if (g <= 30000) return Math.round((180 / 6) * 100) / 100;
                  if (g <= 45000) return Math.round((425 / 6) * 100) / 100;
                  if (g <= 60000) return Math.round((930 / 6) * 100) / 100;
                  if (g <= 75000) return Math.round((1025 / 6) * 100) / 100;
                  return Math.round((1250 / 6) * 100) / 100;
                };
                const pt = getPTDeduction(gross);

                const tds = gross > 50000 ? (gross - pf - pt) * 0.05 : 0;
                const net = gross - (pf + esi + pt + tds);
                return { basic, hra, special, pf, esi, pt, tds, net };
              };

              const calc = calculatePayroll(payslip.grossSalary || 0);

              
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
                <div key={idx} className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col group hover:shadow-md transition-shadow relative overflow-hidden text-left">
                  <div className="flex justify-between items-start mb-6 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="text-brand-primary" size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-text-main">{payslip.month || "Current"} {payslip.year || new Date().getFullYear()}</h3>
                        <p className="text-[10px] text-text-sec font-bold mt-0.5 uppercase tracking-wider">Salary Slip</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-grow z-10">
                    <div>
                      <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block mb-1">Net Payable</span>
                      <span className="text-2xl font-extrabold text-emerald-500 flex items-center gap-1"><IndianRupee size={20} /> {(payslip.net !== undefined ? payslip.net : calc.net).toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-border-card pt-4 mt-4">
                      <div>
                        <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block mb-1">Gross Salary</span>
                        <span className="text-sm font-bold text-text-main">₹{(payslip.grossSalary || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block mb-1">Deductions</span>
                        <span className="text-sm font-bold text-brand-danger">₹{((payslip.pf !== undefined ? payslip.pf : calc.pf) + (payslip.esi !== undefined ? payslip.esi : calc.esi) + (payslip.pt !== undefined ? payslip.pt : calc.pt) + (payslip.tds !== undefined ? payslip.tds : calc.tds) + (payslip.lopAmount || 0)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border-card z-10">
                    <button 
                      onClick={() => {
                        setSelectedPayslip({ ...calc, ...payslip });
                        setShowPayslipModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-bg-base hover:bg-brand-primary/10 text-brand-primary font-bold text-xs rounded-[12px] transition-colors"
                    >
                      <Download size={16} /> View Details & Download
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Payslip Modal */}
        {showPayslipModal && selectedPayslip && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-bg-card w-full max-w-2xl rounded-[24px] border border-border-card shadow-2xl overflow-hidden animate-slide-up flex flex-col relative my-auto">
              <div className="px-6 py-5 border-b border-border-card flex items-center justify-between sticky top-0 bg-bg-card z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="text-emerald-500" size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-text-main">Payslip Preview</h3>
                    <p className="text-[10px] text-text-sec mt-0.5">{currentUser.name} - {selectedPayslip.month} {selectedPayslip.year}</p>
                  </div>
                </div>
                <button onClick={() => setShowPayslipModal(false)} className="text-text-mut hover:text-text-main transition-colors p-1 rounded-lg hover:bg-bg-base"><X size={18} /></button>
              </div>
              <div className="p-8 text-left bg-white font-sans" id="payslip-content">
                {/* Header */}
                <div className="flex items-center mb-6">
                  <div className="w-1/3">
                    {companyLogo && <img src={companyLogo} crossOrigin="anonymous" alt={companyName} className="h-14 object-contain" />}
                  </div>
                  <div className="w-1/3 flex flex-col items-center justify-center text-center">
                    <h1 className="text-lg font-extrabold text-[#000080] whitespace-nowrap">{companyName || "ZUNA HRMS"}</h1>
                  </div>
                  <div className="w-1/3"></div>
                </div>
                <div className="text-center mb-4 -mt-4">
                  {companyAddress && <p className="text-[11px] font-bold text-black mt-1 whitespace-pre-wrap">{companyAddress}</p>}
                </div>
                
                <div className="text-center mb-2 mt-4">
                  <h2 className="text-xl font-extrabold text-black tracking-wider uppercase">PAYSLIP</h2>
                </div>
                
                <div className="border-t-[3px] border-black w-full my-2"></div>

                <div className="text-center mb-2 mt-2">
                  <p className="text-sm font-extrabold text-black">Payslip for the month of {selectedPayslip.month}, {selectedPayslip.year}</p>
                </div>

                <div className="border-t-[3px] border-black w-full mb-4"></div>
                
                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] font-normal text-black mb-4">
                  {/* Left Column */}
                  <div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Emp Name</span><span>: {currentUser.name || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Emp Code</span><span>: {currentUser.employeeId || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Department</span><span>: {currentUser.department || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Designation</span><span>: {currentUser.designation || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Grade</span><span>: {currentUser.grade || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>PF No.</span><span>: {currentUser.pfNo || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>PF UAN</span><span>: {currentUser.uan || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Bank Account No.</span><span>: {currentUser.bankAcNo || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>IFSC</span><span>: {currentUser.ifscCode || 'NaN'}</span></div>
                  </div>
                  {/* Right Column */}
                  <div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Office Address</span><span className="line-clamp-2" title={companyAddress}>: {companyAddress || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Joining Date</span><span>: {currentUser.joiningDate || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Paid Days</span><span>: {Number(selectedPayslip.paidDays !== undefined ? selectedPayslip.paidDays : (currentUser.paidDays || companyPayrollSettings?.workingDays || 30)).toFixed(2)}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Working Days</span><span>: {Number(selectedPayslip.workingDays !== undefined ? selectedPayslip.workingDays : (currentUser.workingDays || companyPayrollSettings?.workingDays || 30)).toFixed(2)}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Cost Center</span><span>: {currentUser.costCenter || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>PAN</span><span>: {currentUser.pan || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Gender</span><span>: {currentUser.gender || 'NaN'}</span></div>
                    <div className="grid grid-cols-[120px_1fr]"><span>Loss of Pay Days</span><span>: {Math.max(0, (selectedPayslip.lopsDays || 0)).toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="border-t-[3px] border-black w-full my-2"></div>

                {/* Financial Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1">
                  <div className="col-span-4">Earnings</div>
                  <div className="col-span-2 text-right">Earned Amt.</div>
                  <div className="col-span-2 text-right">Arrears</div>
                  <div className="col-span-3 pl-4">Deductions</div>
                  <div className="col-span-1 text-right">Amount</div>
                </div>
                
                <div className="border-t-[3px] border-black w-full mb-3"></div>

                <div className="grid grid-cols-12 gap-y-1 gap-x-2 text-[10px] text-black pb-4 font-normal">
                  {/* Row 1 */}
                  <div className="col-span-4">Basic</div>
                  <div className="col-span-2 text-right">{(selectedPayslip.basic || 0).toFixed(2)}</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4">Provident Fund</div>
                  <div className="col-span-1 text-right">{(selectedPayslip.pf || 0).toFixed(2)}</div>

                  {/* Row 2 */}
                  <div className="col-span-4">House Rent Allowance</div>
                  <div className="col-span-2 text-right">{(selectedPayslip.hra || 0).toFixed(2)}</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4">Loss of Pay</div>
                  <div className="col-span-1 text-right">{(selectedPayslip.lopAmount || 0).toFixed(2)}</div>

                  {/* Row 3 */}
                  <div className="col-span-4">Conveyance</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4">Professional Tax</div>
                  <div className="col-span-1 text-right">{(selectedPayslip.pt || 0).toFixed(2)}</div>

                  {/* Row 4 */}
                  <div className="col-span-4">Special Allowance</div>
                  <div className="col-span-2 text-right">{(selectedPayslip.special || 0).toFixed(2)}</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4">{(selectedPayslip.esi || 0) > 0 ? 'ESI' : ''}</div>
                  <div className="col-span-1 text-right">{(selectedPayslip.esi || 0) > 0 ? selectedPayslip.esi.toFixed(2) : ''}</div>

                  {/* Row 5 */}
                  <div className="col-span-4">Basic (Prorated)</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4">{(selectedPayslip.tds || 0) > 0 ? 'TDS' : ''}</div>
                  <div className="col-span-1 text-right">{(selectedPayslip.tds || 0) > 0 ? selectedPayslip.tds.toFixed(2) : ''}</div>

                  {/* Row 6 */}
                  <div className="col-span-4">HRA (Prorated)</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4"></div>
                  <div className="col-span-1 text-right"></div>

                  {/* Row 7 */}
                  <div className="col-span-4">Other Allowance</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4"></div>
                  <div className="col-span-1 text-right"></div>
                </div>
                
                <div className="border-t-[3px] border-black w-full my-1"></div>
                
                <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1">
                  <div className="col-span-4">Gross Earning</div>
                  <div className="col-span-2 text-right">{(selectedPayslip.grossSalary || 0).toFixed(2)}</div>
                  <div className="col-span-2 text-right">0.00</div>
                  <div className="col-span-3 pl-4">Gross Deduction</div>
                  <div className="col-span-1 text-right">{(selectedPayslip.pf + selectedPayslip.pt + selectedPayslip.esi + selectedPayslip.tds + (selectedPayslip.lopAmount || 0)).toFixed(2)}</div>
                </div>

                <div className="border-t-[3px] border-black w-full my-1"></div>

                <div className="grid grid-cols-12 gap-2 text-[10px] font-extrabold text-black py-1 mb-4">
                  <div className="col-span-4">Net Amount</div>
                  <div className="col-span-2 text-right">{(selectedPayslip.net || 0).toFixed(2)}</div>
                </div>
                
                <div className="text-[10px] text-black mb-4 font-normal">
                  Net Amount in words: ( {numberToWords(selectedPayslip.net || 0).toUpperCase()} ONLY )
                </div>
                
                <div className="text-[10px] font-extrabold text-black mb-12">
                  Disclaimer: This is a system generated payslip, does not require any signature.
                </div>
                
                {/* Footer Logo */}
                <div className="mt-12 flex justify-center items-center gap-2 pb-2">
                  <span className="text-[11px] font-extrabold text-black">Powered by</span>
                  <img src={zunaLogo} alt="Zuna Logo" className="h-6 object-contain" />
                  <span className="text-[11px] font-extrabold text-black ml-1">Simplify payroll and compliance.</span>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border-card flex justify-end gap-3 bg-bg-base/30 mt-auto flex-shrink-0">
                <button onClick={() => setShowPayslipModal(false)} className="px-5 py-2.5 rounded-[12px] text-xs font-bold text-text-sec hover:bg-bg-base transition-colors border border-transparent hover:border-border-card">Close</button>
                <button 
                  onClick={() => {
                                        const element = document.getElementById('payslip-content');
                    const opt = {
                      margin:       0,
                      filename:     `Payslip_${selectedPayslip.month}_${selectedPayslip.year}.pdf`,
                      image:        { type: 'jpeg', quality: 0.98 },
                      html2canvas:  { scale: 2, useCORS: true },
                      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save(); 
                  }} 
                  className="px-6 py-2.5 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[12px] text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  if (activeTab === "assets") {
    
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
      <div className="space-y-6 w-full max-w-[1400px] mx-auto text-left animate-fade-in">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs text-text-mut font-semibold mb-2">
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-brand-primary">My Assets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">My Assets</h1>
          <p className="text-sm text-text-sec mt-1">View organizational hardware and equipment assigned to you.</p>
        </div>

        {myAssets.length === 0 ? (
          <div className="bg-bg-card border border-border-card rounded-[24px] p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4">
              <HardDrive size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-main">No assigned assets</h3>
            <p className="text-xs text-text-mut mt-1">There are currently no devices or equipment assigned to your profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAssets.map((asset) => {
              let statusColor = "bg-green-500/10 text-green-500 border border-green-500/20";
              if (asset.status === "Assigned") {
                statusColor = "bg-brand-primary/10 text-brand-primary border border-brand-primary/20";
              } else if (asset.status === "Under Repair") {
                statusColor = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
              }

              
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
                <div key={asset.id} className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${statusColor}`}>
                        {asset.status}
                      </span>
                      <h3 className="text-base font-extrabold text-text-main mt-2.5">{asset.name}</h3>
                      <p className="text-xs text-text-mut font-semibold mt-0.5">
                        {Array.isArray(asset.category) ? asset.category.join(", ") : (asset.category || "Hardware")}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-[12px] bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                      <HardDrive size={20} />
                    </div>
                  </div>

                  <div className="border-t border-border-card pt-4 mt-auto space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-mut font-semibold">Serial Number</span>
                      <span className="text-text-sec font-mono font-bold">{asset.serialNumber}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-mut font-semibold">Date Assigned</span>
                      <span className="text-text-sec font-bold">
                        {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    {asset.assigningAuthorityName && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-mut font-semibold">Assigning Authority</span>
                        <span className="text-text-sec font-bold">{asset.assigningAuthorityName}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "leaves") {
    const leavesStartIndex = (leavesPage - 1) * 10;
    const paginatedLeaveRequests = myLeaveRequests.slice(leavesStartIndex, leavesStartIndex + 10);
    const leavesTotalPages = Math.ceil(myLeaveRequests.length / 10) || 1;

    
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
      <div className="space-y-6 w-full max-w-[1400px] mx-auto text-left">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs text-text-mut font-semibold mb-2">
            <span>Leave Requests</span>
            <span>&gt;</span>
            <span className="text-brand-primary">New Request</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Request Leave</h1>
          <p className="text-sm text-text-sec mt-1">Submit your time-off request for manager approval.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form & History (col-span-2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leave Details Form Card */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border-card">
                <div className="w-9 h-9 rounded-[10px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <CalendarDays size={18} />
                </div>
                <h3 className="font-extrabold text-base text-text-main">Leave Details</h3>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leave Type Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec" htmlFor="leave-type-select">Leave Type</label>
                    <select
                      id="leave-type-select"
                      className="w-full px-3.5 py-2.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main font-semibold outline-none focus:bg-bg-card focus:border-brand-primary transition-all appearance-none"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      required
                    >
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Maternity Leave">Maternity Leave</option>
                      <option value="Paternity Leave">Paternity Leave</option>
                    </select>
                  </div>
                  <div className="flex items-center text-xs text-text-mut leading-relaxed mt-4">
                    Requests are subject to manager availability and team capacity.
                  </div>
                </div>

                {/* Emergency Leave Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-[16px] bg-brand-warning/5 border border-brand-warning/20 transition-all">
                  <input
                    id="emergency-leave-checkbox"
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => {
                      setIsEmergency(e.target.checked);
                      if (!e.target.checked && startDate === todayStr) {
                        setStartDate("");
                      }
                    }}
                    className="w-4 h-4 rounded text-brand-warning border-border-card focus:ring-brand-warning cursor-pointer"
                  />
                  <div className="text-left">
                    <label htmlFor="emergency-leave-checkbox" className="text-xs font-extrabold text-brand-warning cursor-pointer flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-brand-warning" />
                      Emergency Leave
                    </label>
                    <p className="text-[10px] text-text-sec font-semibold mt-0.5">
                      Check this option if you need to apply for leave starting today. This must be requested before your shift starts at {formatShiftTime(currentUser.shiftStart)}.
                    </p>
                  </div>
                </div>

                {/* Custom Date Range Picker */}
                <div className="mb-6">
                  <CustomDateRangePicker 
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    minDate={isEmergency ? todayStr : tomorrowStr}
                  />
                </div>

                {/* Reason for Leave Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec" htmlFor="leave-reason-textarea">Reason for Leave</label>
                  <textarea
                    id="leave-reason-textarea"
                    placeholder="Briefly describe the reason for your request..."
                    className="w-full h-24 p-3.5 border border-border-card rounded-[12px] bg-bg-base/30 text-xs text-text-main outline-none focus:bg-bg-card focus:border-brand-primary transition-all resize-none"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    required
                  />
                </div>

                {/* Supporting Documents (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec">Supporting Documents (Optional)</label>
                  <div className="border border-dashed border-border-card rounded-[16px] p-6 text-center bg-bg-base/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-bg-base/40 transition-all">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-text-main">Click to upload or drag and drop</span>
                    <span className="text-[10px] text-text-mut font-semibold">PDF, PNG, JPG or DOCX (max. 25MB)</span>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 border-t border-border-card pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLeaveType("Annual Leave");
                      setStartDate("");
                      setEndDate("");
                      setLeaveReason("");
                      navigate("/dashboard");
                    }}
                    className="py-2.5 px-6 border border-border-card rounded-[12px] bg-bg-card hover:bg-bg-base text-text-sec text-xs font-bold transition-all cursor-pointer"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-brand-primary text-white text-xs font-bold rounded-[12px] hover:bg-brand-hover transition-colors cursor-pointer"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>

            {/* My Request History Queue */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-text-main tracking-tight mb-4">My Request Queue</h3>

              {myLeaveRequests.length === 0 ? (
                <div className="text-center py-8 text-text-mut text-xs font-semibold">No leave requests submitted yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-card text-[10px] font-bold text-text-mut uppercase tracking-wider">
                        <th className="pb-3 pr-4">Leave Type</th>
                        <th className="pb-3 px-4">Dates</th>
                        <th className="pb-3 px-4">Duration</th>
                        <th className="pb-3 px-4">Status</th>
                        <th className="pb-3 pl-4 text-right">Manager Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-card text-xs text-text-main font-semibold">
                      {paginatedLeaveRequests.map((req) => {
                        let statusColor = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
                        if (req.status === "approved") {
                          statusColor = "bg-emerald-500/10 text-emerald-500";
                        } else if (req.status === "rejected") {
                          statusColor = "bg-red-500/10 text-red-500";
                        }

                        const startF = req.startDate ? new Date(req.startDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "";
                        const endF = req.endDate ? new Date(req.endDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "";

                        
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
                          <tr key={req.id} className="hover:bg-bg-base/30">
                            <td className="py-3.5 pr-4 text-text-main font-bold">
                              <div className="flex items-center gap-1.5">
                                <span>{req.type}</span>
                                {req.isEmergency && (
                                  <span className="bg-brand-warning/10 text-brand-warning text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase whitespace-nowrap">
                                    Emergency
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-text-sec">{startF && endF ? `${startF} - ${endF}` : "—"}</td>
                            <td className="py-3.5 px-4 text-text-sec">{req.duration}</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${statusColor}`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3.5 pl-4 text-right text-[11px] text-text-mut font-semibold truncate max-w-[150px]" title={req.managerComment || ""}>
                              {req.managerComment || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {myLeaveRequests.length > 10 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-card text-xs flex-wrap gap-4">
                  <span className="text-text-mut font-semibold">
                    Showing {leavesStartIndex + 1} to {Math.min(myLeaveRequests.length, leavesStartIndex + 10)} of {myLeaveRequests.length} entries
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setLeavesPage(prev => Math.max(1, prev - 1))}
                      disabled={leavesPage === 1}
                      className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                    >
                      Prev
                    </button>
                    {Array.from({ length: leavesTotalPages }, (_, i) => i + 1).map((p) => {
                      if (leavesTotalPages > 5 && p !== 1 && p !== leavesTotalPages && Math.abs(p - leavesPage) > 1) {
                        if (p === 2 || p === leavesTotalPages - 1) {
                          return <span key={p} className="px-1 text-text-mut font-bold">...</span>;
                        }
                        return null;
                      }
                      
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
                        <button
                          key={p}
                          onClick={() => setLeavesPage(p)}
                          className={`w-8 h-8 rounded-[8px] border transition-all cursor-pointer font-bold ${
                            leavesPage === p
                              ? "bg-brand-primary border-brand-primary text-white"
                              : "border-border-card bg-bg-card text-text-sec hover:bg-bg-base"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setLeavesPage(prev => Math.min(leavesTotalPages, prev + 1))}
                      disabled={leavesPage === leavesTotalPages}
                      className="px-3 py-1.5 border border-border-card rounded-[8px] bg-bg-card hover:bg-bg-base text-text-sec disabled:opacity-40 disabled:hover:bg-bg-card cursor-pointer font-bold transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Leave Balances, Policies, Team Capacity */}
          <div className="space-y-6">
            {/* Leave Balances Card */}
            <div className="bg-bg-card border border-border-card rounded-[24px] overflow-hidden shadow-sm">
              <div className="bg-brand-primary p-6 text-white text-left">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">AS OF TODAY</span>
                <h3 className="font-extrabold text-lg text-white mt-0.5">Leave Balances</h3>
              </div>

              <div className="p-6 space-y-4">
                {/* Annual Leave circular progress */}
                <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-bg-base/20 border border-border-card">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[12px] bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                      <Umbrella size={20} />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-text-mut uppercase block">Annual Leave</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-text-main">{currentUser.annualLeaves !== undefined ? currentUser.annualLeaves : 25}</span>
                        <span className="text-[10px] font-semibold text-text-sec">days</span>
                      </div>
                    </div>
                  </div>
                  {/* Circular progress SVG */}
                  <div className="w-10 h-10 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="20" cy="20" r="16" className="text-border-card" strokeWidth="3" fill="transparent" stroke="currentColor" />
                      <circle cx="20" cy="20" r="16" className="text-brand-primary" strokeWidth="3" fill="transparent" strokeDasharray="100" strokeDashoffset={100 - ((currentUser.annualLeaves !== undefined ? currentUser.annualLeaves : 25) / 25.0) * 100} strokeLinecap="round" stroke="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* Sick Leave circular progress */}
                <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-bg-base/20 border border-border-card">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[12px] bg-brand-danger/10 text-brand-danger flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-text-mut uppercase block">Sick Leave</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-text-main">{currentUser.sickLeaves !== undefined ? currentUser.sickLeaves : 10}</span>
                        <span className="text-[10px] font-semibold text-text-sec">days</span>
                      </div>
                    </div>
                  </div>
                  {/* Circular progress SVG */}
                  <div className="w-10 h-10 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="20" cy="20" r="16" className="text-border-card" strokeWidth="3" fill="transparent" stroke="currentColor" />
                      <circle cx="20" cy="20" r="16" className="text-brand-danger" strokeWidth="3" fill="transparent" strokeDasharray="100" strokeDashoffset={100 - ((currentUser.sickLeaves !== undefined ? currentUser.sickLeaves : 10) / 10.0) * 100} strokeLinecap="round" stroke="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* Casual Leave circular progress */}
                <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-bg-base/20 border border-border-card">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[12px] bg-brand-success/10 text-brand-success flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-text-mut uppercase block">Casual Leave</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-text-main">{currentUser.casualLeaves !== undefined ? currentUser.casualLeaves : 6}</span>
                        <span className="text-[10px] font-semibold text-text-sec">days</span>
                      </div>
                    </div>
                  </div>
                  {/* Circular progress SVG */}
                  <div className="w-10 h-10 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="20" cy="20" r="16" className="text-border-card" strokeWidth="3" fill="transparent" stroke="currentColor" />
                      <circle cx="20" cy="20" r="16" className="text-brand-success" strokeWidth="3" fill="transparent" strokeDasharray="100" strokeDashoffset={100 - ((currentUser.casualLeaves !== undefined ? currentUser.casualLeaves : 6) / 6.0) * 100} strokeLinecap="round" stroke="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="w-full text-center text-xs font-bold text-brand-primary hover:text-brand-hover hover:underline cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>View Full History</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>


            {/* Task Management Shortcut */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm text-left cursor-pointer hover:border-brand-primary/50 hover:shadow-md transition-all group" onClick={() => navigate("/task-management")}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-base text-text-main tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Target size={16} />
                  </div>
                  <span>Task Management</span>
                </h3>
                <ChevronRight size={16} className="text-text-mut group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-text-sec font-semibold leading-relaxed mt-1">
                View your pending tasks, update progress, and collaborate on projects.
              </p>
            </div>

            {/* Policy Reminders Card */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm text-left">
              <h3 className="font-extrabold text-base text-text-main tracking-tight mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Policy Reminders</span>
              </h3>
              <ul className="space-y-2 text-xs text-text-sec font-semibold list-disc list-inside leading-relaxed pl-1">
                <li>Requests for more than 5 days must be submitted at least 2 weeks in advance.</li>
                <li>Medical certificates are mandatory for sick leave exceeding 2 consecutive days.</li>
              </ul>
            </div>

            {/* Team Capacity Card */}
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm text-left">
              <h3 className="font-extrabold text-xs text-text-mut uppercase tracking-wider mb-4">TEAM CAPACITY</h3>
              <div className="flex items-center justify-between text-xs font-bold border-b border-border-card pb-3 mb-3">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{currentUser.department || "Development"}</span>
                </span>
                <span className="text-text-sec">
                  {Math.max(1, (teamMembers.length + 1) - teamOnLeaveCount)}/{teamMembers.length + 1} Present
                </span>
              </div>
              <p className="text-[11px] text-text-sec font-semibold leading-relaxed">
                {teamOnLeaveCount > 0 
                  ? `${teamOnLeaveCount} team member${teamOnLeaveCount > 1 ? "s are" : " is"} currently on leave today.`
                  : "All team members in your department are active and available today."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activePaidLeaves = paidLeaves
    .filter(pl => (pl.status || "active") === "active" && !dismissedLeaves.includes(pl.id))
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

  
  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-5 sm:space-y-8 w-full max-w-[1400px] mx-auto">
      {/* Forgot to check-in Warning Banner */}
      {isForgotToCheckIn && (
        <div className="bg-gradient-to-r from-red-500/10 via-red-500/15 to-red-500/10 border border-red-500/30 rounded-[20px] p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0 animate-bounce">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-text-main flex items-center gap-1.5">
                <span>Attendance Alert: Forgot to Check-In!</span>
              </h4>
              <p className="text-xs text-text-sec mt-1 font-semibold leading-relaxed">
                Your shift was scheduled to start at <strong className="text-text-main">{formatShiftTime(currentUser.shiftStart)}</strong>. Please check-in now to record your shift metrics.
              </p>
            </div>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={actionLoading || fetchingGps}
            className="py-2.5 px-6 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-[12px] shadow-md shadow-red-500/25 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            Check-In Now
          </button>
        </div>
      )}

      {/* Official Paid Leaves Section */}
      {activePaidLeaves.length > 0 && (
        <div className="bg-bg-card border border-border-card rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-sm text-left">
          {/* Header: stacks on mobile, side-by-side on sm+ */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
            <div>
              <h3 className="font-extrabold text-base text-text-main tracking-tight">Official Paid Leaves</h3>
              <p className="text-[10px] text-text-mut font-semibold mt-0.5">Company-wide paid holidays and scheduled closures</p>
            </div>
            <button
              onClick={() => navigate("/dashboard?tab=leaves")}
              className="self-start sm:self-auto py-2 px-4 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[10px] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
            >
              <CalendarDays size={14} />
              <span>Apply for Leave</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {activePaidLeaves.map((pl) => (
              <div 
                key={pl.id} 
                onClick={() => setSelectedPaidLeaveDetail(pl)}
                className="p-5 rounded-[20px] bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent border border-border-card hover:border-brand-primary/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col gap-3 group relative overflow-hidden text-left"
              >
                {/* Background glowing circle on hover */}
                <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-brand-primary/10 group-hover:scale-[2] transition-all duration-500 pointer-events-none" />

                <div className="flex justify-between items-start gap-3 relative z-10">
                  <span className="font-black text-xs text-text-main leading-tight group-hover:text-brand-primary transition-colors truncate max-w-[120px]" title={pl.title}>{pl.title}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="bg-brand-primary/10 text-brand-primary text-[8px] font-black px-2.5 py-1 rounded-full whitespace-nowrap">
                      {pl.startDate && pl.endDate ? (
                        pl.startDate === pl.endDate ? (
                          new Date(pl.startDate).toLocaleDateString([], { month: "short", day: "numeric" })
                        ) : (
                          `${new Date(pl.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} - ${new Date(pl.endDate).toLocaleDateString([], { month: "short", day: "numeric" })}`
                        )
                      ) : (
                        new Date(pl.date || pl.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDismissPaidLeave(e, pl.id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-6 h-6 rounded-full bg-slate-200/60 dark:bg-slate-700/60 hover:bg-red-500 hover:text-white transition-all text-text-sec cursor-pointer flex items-center justify-center flex-shrink-0 shadow-sm"
                      title="Dismiss notice"
                      aria-label="Dismiss paid leave notice"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-text-sec leading-relaxed font-semibold line-clamp-2">{pl.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upper Dashboard welcome panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>Welcome back, {currentUser.name.split(" ")[0]}</span>
            {(currentUser.employeeId || currentUser.employee_id) && (
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                {currentUser.employeeId || currentUser.employee_id}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-text-sec mt-1 flex items-center gap-1.5 sm:gap-2">
            <CalendarDays size={14} className="text-brand-primary flex-shrink-0" />
            <span className="truncate">{getTodayFormatted()} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>

        {/* Current Location header status */}
        <div className="w-full sm:w-auto bg-bg-card border-l-4 border-brand-primary border border-border-card rounded-[14px] p-3 sm:p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="text-left">
            <span className="text-[9px] font-bold text-text-mut uppercase tracking-wider block">CURRENT LOCATION</span>
            <span className="text-xs font-extrabold text-brand-primary flex items-center gap-1 mt-0.5">
              <MapPin size={12} />
              {gpsLocation ? `~${gpsLocation.accuracy}m accuracy` : "HQ Office"}
            </span>
          </div>

          {/* Top check in Shortcut */}
          {!isCheckedIn && !isCheckedOut && !isOnBreak ? (
            isWithinShiftHours() ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading || fetchingGps}
                className="py-2.5 px-4 bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs rounded-[10px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Play size={12} fill="#fff" />
                <span>check in</span>
              </button>
            ) : null
          ) : isCheckedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1.5 rounded-[8px] animate-pulse">
                {formatDuration(getElapsedWorkingMs())}
              </span>
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="py-2.5 px-4 bg-brand-danger hover:bg-brand-danger-hover text-white font-bold text-xs rounded-[10px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Square size={10} fill="#fff" />
                <span>check out</span>
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-text-mut px-3 py-2 bg-bg-base rounded-[10px] flex items-center gap-2">
              <span>{isOnBreak ? "On Break" : "Shift Ended"}</span>
              <span className="text-[10px] font-mono text-text-sec bg-bg-card border border-border-card px-2 py-0.5 rounded">
                {formatDuration(getElapsedWorkingMs())}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Attendance Presence Bar ── */}
      <div className="bg-bg-card border border-border-card rounded-[20px] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              !isCheckedIn && !isCheckedOut && !isOnBreak ? "bg-slate-400" :
              isCheckedIn ? "bg-brand-success animate-pulse" :
              isOnBreak ? "bg-brand-warning animate-pulse" :
              "bg-brand-primary"
            }`} />
            <span className="text-sm font-extrabold text-text-main">
              {!isCheckedIn && !isCheckedOut && !isOnBreak ? "Not Checked In" :
               isCheckedIn ? "Active Shift" :
               isOnBreak ? "On Break" : "Shift Completed"}
            </span>
            <span className="text-xs text-text-mut font-semibold">
              ({shiftProgressPercent}% of shift)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono font-bold text-text-sec">
            {todayLog?.checkInTime && (
              <span className="flex items-center gap-1">
                <Play size={10} className="text-brand-success" fill="currentColor" />
                In: {new Date(todayLog.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {todayLog?.checkOutTime && (
              <span className="flex items-center gap-1">
                <Square size={10} className="text-brand-danger" fill="currentColor" />
                Out: {new Date(todayLog.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar track */}
        <div className="w-full h-3 bg-bg-base rounded-full overflow-hidden border border-border-card">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-in-out relative overflow-hidden ${
              shiftProgressPercent >= 100 ? "bg-brand-success" :
              isOnBreak ? "bg-brand-warning" :
              isCheckedIn ? "bg-brand-primary" :
              "bg-slate-400"
            }`}
            style={{ width: `${Math.max(shiftProgressPercent > 0 ? 2 : 0, shiftProgressPercent)}%` }}
          >
            {/* Shimmer animation for active shift */}
            {isCheckedIn && (
              <span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ animation: "shimmer 2s infinite" }}
              />
            )}
          </div>
        </div>

        {/* Tick markers for 25%, 50%, 75% */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {["0%", "25%", "50%", "75%", "100%"].map((label) => (
            <span key={label} className="text-[9px] font-bold text-text-mut">{label}</span>
          ))}
        </div>
      </div>

      {/* Main content split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left pane: Actions, Charts, Leaves */}
        <div className="lg:col-span-2 space-y-8">

          {/* Card 1: Shift Control / Active Action Panel */}
          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 lg:p-8 shadow-sm flex flex-col justify-center items-center min-h-[280px]">
            {/* Action State: 1. NOT CHECKED IN AND SHIFT NOT ACTIVE */}
            {!isCheckedIn && !isCheckedOut && !isOnBreak && !isWithinShiftHours() && (
              <div className="text-center max-w-md p-4">
                <div className="w-16 h-16 rounded-full bg-brand-warning/10 text-brand-warning flex items-center justify-center mx-auto mb-5">
                  <Clock size={28} />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-1.5">Shift Inactive</h3>
                <p className="text-sm text-text-sec mb-5 leading-relaxed">
                  Your registered shift schedule is <strong className="text-text-main">{formatShiftTime(currentUser.shiftStart)} - {formatShiftTime(currentUser.shiftEnd)}</strong>.
                </p>
                <span className="inline-block px-4 py-2 bg-brand-warning/5 border border-dashed border-brand-warning/20 rounded-[10px] text-[11px] font-bold text-brand-warning uppercase tracking-wide">
                  Unlocks during shift hours
                </span>
              </div>
            )}

            {/* Action State: 2. NOT CHECKED IN AND SHIFT IS ACTIVE */}
            {!isCheckedIn && !isCheckedOut && !isOnBreak && isWithinShiftHours() && (
              <div className="text-center max-w-md p-4">
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-5 animate-pulse">
                  <Play size={24} fill="currentColor" className="ml-1" />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-1.5">Ready to check in?</h3>
                <p className="text-sm text-text-sec mb-6 leading-relaxed">
                  Your shift schedule is active. check in with GPS tracking enabled to start logging your attendance.
                </p>
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading || fetchingGps}
                  className="px-8 py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-extrabold text-sm rounded-[14px] flex items-center gap-2 mx-auto shadow-md shadow-brand-primary/15 transition-all cursor-pointer"
                >
                  <Play size={16} fill="#fff" />
                  <span>check in Now</span>
                </button>
              </div>
            )}

            {/* Action State: 3. WORKING / CHECKED-IN */}
            {isCheckedIn && (() => {
              const shortBalMin = Math.max(0, Math.round(shortBreakBalance / 60));
              const longBalMin = Math.max(0, Math.round(longBreakBalance / 60));
              const bioBalMin = Math.max(0, Math.round(bioBreakBalance / 60));

  const handleDownloadPayslip = () => {
    const element = document.getElementById('payslip-content');
    const opt = {
      margin:       0.5,
      filename:     `Payslip_${currentUser?.name}_${selectedPayslip?.month}_${selectedPayslip?.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
                <div className="w-full text-center p-2">
                  <div className="w-16 h-16 rounded-full bg-brand-success/10 text-brand-success flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-text-main mb-1">Shift In Progress</h3>
                  <p className="text-sm text-text-sec mb-4">
                    You checked in today at <strong className="text-text-main">{new Date(todayLog.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
                  </p>

                  {/* Digital Clock Shift Duration Ticker */}
                  <div className="relative w-full max-w-[320px] bg-bg-base/70 p-4 rounded-[20px] border border-dashed border-border-card flex flex-col items-center justify-center mx-auto mb-6 overflow-hidden">
                    <div className="text-3xl font-mono font-extrabold text-brand-primary tracking-wider drop-shadow-sm mb-1 animate-pulse">
                      {formatDuration(getElapsedWorkingMs())}
                    </div>
                    <span className="text-[9px] font-bold text-text-sec uppercase tracking-wide">
                      Active Shift Duration
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[600px] mx-auto mb-6">
                    {envConfig.breaksPerDay >= 1 && (
                      <button
                        onClick={() => handleStartBreak("short")}
                        disabled={actionLoading || shortBreakBalance <= 0}
                        className="py-3 px-4 bg-brand-warning hover:bg-brand-warning-hover text-white font-bold text-xs rounded-[12px] flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Coffee size={15} />
                        <span>Break 1 ({shortBalMin}m left)</span>
                      </button>
                    )}
                    {envConfig.breaksPerDay >= 2 && (
                      <button
                        onClick={() => handleStartBreak("long")}
                        disabled={actionLoading || longBreakBalance <= 0}
                        className="py-3 px-4 bg-brand-warning hover:bg-brand-warning-hover text-white font-bold text-xs rounded-[12px] flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Coffee size={15} />
                        <span>Break 2 ({longBalMin}m left)</span>
                      </button>
                    )}
                    {envConfig.breaksPerDay >= 3 && (
                      <button
                        onClick={() => handleStartBreak("bio")}
                        disabled={actionLoading || bioBreakBalance <= 0}
                        className="py-3 px-4 bg-brand-success hover:bg-brand-success-hover text-white font-bold text-xs rounded-[12px] flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Coffee size={15} />
                        <span>Break 3 ({bioBalMin}m left)</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="py-3 px-8 bg-brand-danger hover:bg-brand-danger-hover text-white font-bold text-xs rounded-[12px] flex items-center justify-center gap-1.5 mx-auto shadow-sm transition-colors cursor-pointer"
                  >
                    <Square size={11} fill="#fff" />
                    <span>check out & End Shift</span>
                  </button>
                </div>
              );
            })()}

            {/* Action State: 4. ON BREAK */}
            {isOnBreak && (
              <div className="w-full text-center p-2">
                <div className="w-16 h-16 rounded-full bg-brand-warning/10 text-brand-warning flex items-center justify-center mx-auto mb-5 animate-spin duration-[4000ms]">
                  <Coffee size={28} />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-1.5">Break in Progress</h3>

                <div className="relative w-full max-w-[400px] bg-bg-base/70 p-5 rounded-[20px] border border-dashed border-border-card flex flex-col items-center justify-center mx-auto my-5 overflow-hidden">
                  <div className="text-4xl font-mono font-extrabold text-brand-primary tracking-wider drop-shadow-sm mb-1.5">
                    {formatTime(timeLeft)}
                  </div>

                  {timeLeft > 0 ? (
                    <span className="text-[10px] font-bold text-text-sec uppercase tracking-wide">
                      Remaining Break Balance
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-brand-danger flex items-center gap-1 animate-pulse">
                      <AlertCircle size={12} /> Balance Expired! Resume shift.
                    </span>
                  )}

                  <div
                    className={`absolute bottom-0 left-0 h-[3px] transition-all duration-1000 ${timerExpired ? "bg-brand-danger" : "bg-brand-warning"}`}
                    style={{ width: `${timerPercentage}%` }}
                  />
                </div>

                <div className="mb-5 text-xs text-text-sec font-semibold">
                  Shift paused at: <strong className="text-text-main font-mono">{formatDuration(getElapsedWorkingMs())}</strong>
                </div>

                <button
                  onClick={handleResumeWork}
                  disabled={actionLoading}
                  className="py-3 px-10 bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs rounded-[14px] flex items-center justify-center gap-1.5 mx-auto shadow-md shadow-brand-primary/10 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Resume Shift</span>
                </button>
              </div>
            )}

            {/* Action State: 5. CHECKED OUT */}
            {isCheckedOut && (
              <div className="text-center p-4 w-full">
                <div className="w-16 h-16 rounded-full bg-brand-success/10 text-brand-success flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-1.5">Shift Completed / Checked Out</h3>
                <p className="text-sm text-text-sec mb-4">
                  You checked out today at <strong className="text-text-main">{new Date(todayLog?.checkOutTime || todayLog?.check_out || currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
                </p>

                {/* Frozen Digital Clock Shift Duration */}
                <div className="relative w-full max-w-[320px] bg-bg-base/70 p-4 rounded-[20px] border border-dashed border-border-card flex flex-col items-center justify-center mx-auto mb-4 overflow-hidden">
                  <div className="text-3xl font-mono font-extrabold text-brand-success tracking-wider drop-shadow-sm mb-1">
                    {formatDuration(getElapsedWorkingMs())}
                  </div>
                  <span className="text-[9px] font-bold text-text-sec uppercase tracking-wide">
                    Total Logged Shift Duration
                  </span>
                </div>

                <div className="inline-flex py-2 px-4 bg-brand-success/5 border border-brand-success/20 rounded-[12px] text-xs font-bold text-brand-success gap-1.5 uppercase tracking-wide mb-5">
                  <span>Logged:</span>
                  <strong>{((todayLog?.totalWorkingMinutes || 0) / 60).toFixed(2)} hrs</strong>
                </div>

                {/* Re-check-in CTA */}
                <div className="pt-2 border-t border-border-card/60 max-w-md mx-auto">
                  <p className="text-xs text-text-sec mb-3">Need to continue working today? You can check in again anytime.</p>
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading || fetchingGps}
                    className="px-8 py-3 bg-brand-primary hover:bg-brand-hover text-white font-extrabold text-xs rounded-[14px] flex items-center justify-center gap-2 mx-auto shadow-md shadow-brand-primary/15 transition-all cursor-pointer"
                  >
                    <Play size={14} fill="#fff" />
                    <span>Check In Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Weekly Attendance Chart */}
          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-base text-text-main tracking-tight">Weekly Attendance</h3>
                <p className="text-[10px] text-text-mut font-semibold">Shift hours completed during the current week</p>
              </div>
              <button
                onClick={() => navigate("/history")}
                className="text-xs font-bold text-brand-primary hover:text-brand-hover hover:underline cursor-pointer"
              >
                View Detailed Report
              </button>
            </div>

            {/* Bars chart */}
            <div className="h-[200px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyHoursData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`${value} hrs`, 'Worked']}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false}>
                    {weeklyHoursData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.active ? '#4f46e5' : (entry.hours > 0 ? '#818cf8' : '#e2e8f0')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* Leave Card Balances Row */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            Annual Leave
            <div className="bg-bg-card border border-border-card border-t-4 border-t-brand-primary rounded-[20px] p-5 shadow-sm text-left">
              <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">ANNUAL LEAVE</span>
              <span className="text-3xl font-extrabold text-text-main block mt-1.5 mb-0.5">14.5</span>
              <span className="text-[10px] font-semibold text-text-sec">Days Available</span>
            </div>

            Sick Leave
            <div className="bg-bg-card border border-border-card border-t-4 border-t-brand-warning rounded-[20px] p-5 shadow-sm text-left">
              <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">SICK LEAVE</span>
              <span className="text-3xl font-extrabold text-text-main block mt-1.5 mb-0.5">06</span>
              <span className="text-[10px] font-semibold text-text-sec">Days Remaining</span>
            </div>

            Casual Leave
            <div className="bg-bg-card border border-border-card border-t-4 border-t-brand-success rounded-[20px] p-5 shadow-sm text-left">
              <span className="text-[10px] font-bold text-text-mut uppercase tracking-wider block">CASUAL LEAVE</span>
              <span className="text-3xl font-extrabold text-text-main block mt-1.5 mb-0.5">03</span>
              <span className="text-[10px] font-semibold text-text-sec">Allocated</span>
            </div>
          </div> */}
        </div>

        {/* Right pane: GPS tracking details & Activity Log */}
        <div className="space-y-8">

          {/* Card: Active Tasks */}
          {userTasks && userTasks.some(t => t.timerStartedAt && !t.completed) && (
            <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-text-main tracking-tight mb-4 flex items-center gap-2">
                <Activity size={18} className="text-brand-primary" />
                Active Tasks
              </h3>
              <div className="space-y-3">
                {userTasks.filter(t => t.timerStartedAt && !t.completed).map(task => (
                  <div key={task.id} className="p-3 bg-bg-base/30 border border-border-card rounded-[16px]">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-text-main pr-2">{task.title}</h4>
                      <button
                        onClick={() => stopTaskTimer(currentUser.uid, task.id, task.assignedBy)}
                        className="flex-shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-[8px] transition-colors"
                        title="Stop Timer"
                      >
                        <Square size={14} fill="currentColor" />
                      </button>
                    </div>
                    <div className="text-xs font-bold text-brand-primary flex items-center gap-1 animate-pulse">
                      <Clock size={12} />
                      {(() => {
                         const startedTime = new Date(task.timerStartedAt).getTime();
                         const rawElapsed = Math.max(0, Math.floor((currentTime.getTime() - startedTime) / 1000));
                         const elapsed = Math.min(rawElapsed, 8 * 3600);
                         const h = Math.floor(elapsed / 3600);
                         const m = Math.floor((elapsed % 3600) / 60);
                         const s = elapsed % 60;
                         return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            {/* Birthdays & News Card */}
            <div className="bg-bg-card border border-border-card rounded-[24px] overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-brand-primary to-indigo-600 p-5 text-white text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">HAPPENING NOW</span>
                  <h3 className="font-extrabold text-base text-white mt-0.5 flex items-center gap-2">
                    {birthdays.length > 0 ? (
                      <>Upcoming Birthdays <Cake size={18} /></>
                    ) : (
                      <>Important Updates <Newspaper size={18} /></>
                    )}
                  </h3>
                </div>
                {birthdays.length > 0 ? (
                  <div className="bg-white/20 p-2 rounded-full animate-pulse flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                  </div>
                ) : (
                  <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3L22 4"/></svg>
                  </div>
                )}
              </div>
              <div className="p-5 text-left">
                {birthdays.length > 0 ? (
                  <div className="space-y-4">
                    {birthdays.map((b, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-[12px] border transition-all relative overflow-hidden ${b.isBirthdayToday ? 'bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-[1.02]' : 'bg-bg-base/30 border-border-card hover:border-brand-primary/30'}`}>
                        {b.isBirthdayToday && (
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "shimmer 2s infinite" }} />
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase shadow-sm flex-shrink-0 z-10 overflow-hidden ${b.isBirthdayToday ? 'bg-amber-500/20 text-amber-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                          {b.avatar ? (
                            <img src={b.avatar} alt={b.name} className="w-full h-full object-cover" />
                          ) : b.isBirthdayToday ? (
                            <Cake size={20} className="animate-bounce" />
                          ) : (
                            b.name ? b.name.charAt(0) : "U"
                          )}
                        </div>
                        <div className="z-10">
                          <h4 className="font-bold text-sm text-text-main">{b.name}</h4>
                          <p className={`text-xs font-semibold ${b.isBirthdayToday ? 'text-amber-500' : 'text-brand-primary'}`}>
                            {b.isBirthdayToday ? "🎉 Today!" : "Tomorrow!"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-mut text-center py-4 italic font-semibold">No new updates today.</p>
                )}
              </div>
            </div>

          {/* Card 1: GPS Coordinates Card */}
          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
            <h3 className="font-extrabold text-base text-text-main tracking-tight mb-4 flex items-center gap-2">
              <Compass size={18} className="text-brand-primary" />
              <span>GPS Geolocation</span>
            </h3>

            {fetchingGps ? (
              <div className="text-center py-6">
                <div className="border-2 border-border-card border-t-brand-primary rounded-full w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-xs text-text-sec">Syncing coordinates...</p>
              </div>
            ) : gpsError ? (
              <div className="bg-brand-danger/5 border border-brand-danger/25 p-3.5 rounded-[12px] text-xs text-brand-danger">
                <div className="font-bold flex items-center gap-1 mb-1">
                  <AlertCircle size={14} /> Location Alert
                </div>
                {gpsError}
              </div>
            ) : gpsLocation ? (
              <div className="space-y-3">
                <div className="p-3 bg-brand-success/5 border border-brand-success/20 rounded-[10px] text-center">
                  <span className="text-[9px] font-bold text-text-mut tracking-wider block uppercase">GEOLOCATION LOCKED</span>
                  <span className="text-xs font-bold text-brand-success mt-0.5 block">Office Area Confirmed</span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-sec border-t border-border-card pt-3">
                  <span>Accuracy: ~{gpsLocation.accuracy}m</span>
                  <button
                    onClick={refreshLocation}
                    className="py-1 px-2.5 border border-border-card rounded-[6px] hover:bg-bg-base text-[10px] font-bold cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-sec">Pending location access permission.</p>
            )}
          </div>

          {/* Card 2: Recent Activity Timeline */}
          <div className="bg-bg-card border border-border-card rounded-[24px] p-6 shadow-sm">
            <h3 className="font-extrabold text-base text-text-main tracking-tight mb-6">Recent Activity</h3>

            {/* Timeline nodes (Horizontal) */}
            <div className="relative flex gap-6 overflow-x-auto text-left py-2 mt-2 [&::-webkit-scrollbar]:hidden">
              {/* Horizontal Line Background */}
              <div className="absolute top-4 left-0 right-0 h-px bg-border-card" />
              
              {recentActivities.map((act, idx) => {
                let dotColor = "bg-brand-primary";
                if (act.type === "out") dotColor = "bg-brand-danger";
                if (act.type === "break") dotColor = "bg-brand-warning";
                if (act.type === "work") dotColor = "bg-brand-primary";
                return (
                  <div key={idx} className="relative min-w-[130px] pt-7 flex-shrink-0">
                    {/* Node Dot */}
                    <div className={`absolute left-0 top-[11px] w-3 h-3 rounded-full border-2 border-bg-card ${dotColor} z-10`} />

                    <div className="flex flex-col items-start">
                      <div className="mb-2">
                        <h4 className="text-xs font-extrabold text-text-main">{act.title}</h4>
                        <span className="text-[10px] text-text-mut font-semibold block mt-0.5">{act.desc}</span>
                      </div>
                      <div className="text-left border-t border-border-card/50 pt-1.5 w-full">
                        <span className="text-[10px] font-bold text-text-main block">{act.time}</span>
                        <span className="text-[8px] text-text-mut uppercase font-extrabold block">{act.dateText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Redirect */}
            <button
              onClick={() => navigate("/history")}
              className="w-full mt-6 py-2.5 border border-border-card text-text-sec hover:text-brand-primary font-bold text-xs rounded-[12px] bg-bg-card hover:bg-bg-base transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View All History</span>
              <ChevronRight size={14} />
            </button>
        </div>
      </div>
      </div>

      {/* Glassmorphic Checkout Confirmation Modal */}
      {showCheckoutConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[440px] bg-bg-card border border-border-card rounded-[24px] p-6 shadow-xl animate-scale-up relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-border-card pb-4">
              <h3 className="font-bold text-lg text-text-main">Confirm check out</h3>
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-text-sec leading-relaxed mb-6">
              Are you sure you want to check out? This will end your workday shift and submit your total completed active hours.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="py-2.5 px-4 border border-border-card rounded-[12px] bg-bg-card hover:bg-bg-base text-text-sec text-xs font-bold transition-all cursor-pointer"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckOut}
                className="py-2.5 px-5 bg-brand-danger text-white text-xs font-bold rounded-[12px] hover:bg-brand-danger-hover transition-colors cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "check out"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Paid Leave Detail Modal */}
      {selectedPaidLeaveDetail && createPortal(
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-[99999] p-6 animate-fade-in">
          <div className="w-full max-w-[500px] bg-bg-card border border-border-card rounded-[24px] p-6 lg:p-8 shadow-xl animate-scale-up text-left relative overflow-hidden">
            {/* Glowing top effect */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-primary" />

            <div className="flex justify-between items-center mb-6 border-b border-border-card pb-4">
              <h3 className="font-extrabold text-lg text-text-main flex items-center gap-2">
                <CalendarDays size={20} className="text-brand-primary animate-bounce" />
                <span>Paid Leave Details</span>
              </h3>
              <button
                onClick={() => setSelectedPaidLeaveDetail(null)}
                className="text-text-mut hover:text-text-main font-bold text-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-bold text-text-mut uppercase tracking-wider block">HOLIDAY TITLE</span>
                <span className="text-lg font-black text-text-main mt-0.5 block">{selectedPaidLeaveDetail.title}</span>
              </div>

              <div className="p-4 rounded-[16px] bg-brand-primary/5 border border-brand-primary/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[12px] bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider block">HOLIDAY DURATION</span>
                  <span className="text-sm font-bold text-text-main mt-0.5 block">
                    {selectedPaidLeaveDetail.startDate && selectedPaidLeaveDetail.endDate ? (
                      selectedPaidLeaveDetail.startDate === selectedPaidLeaveDetail.endDate ? (
                        new Date(selectedPaidLeaveDetail.startDate).toLocaleDateString([], { weekday: 'long', month: "long", day: "numeric", year: "numeric" })
                      ) : (
                        `${new Date(selectedPaidLeaveDetail.startDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} to ${new Date(selectedPaidLeaveDetail.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
                      )
                    ) : (
                      new Date(selectedPaidLeaveDetail.date || selectedPaidLeaveDetail.createdAt).toLocaleDateString([], { weekday: 'long', month: "long", day: "numeric", year: "numeric" })
                    )}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-bold text-text-mut uppercase tracking-wider block">DESCRIPTION & BENEFITS</span>
                <p className="text-xs text-text-sec leading-relaxed font-semibold mt-1.5 p-3.5 bg-bg-base/30 rounded-[12px] border border-border-card">
                  {selectedPaidLeaveDetail.description}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border-card flex justify-end">
              <button
                onClick={() => setSelectedPaidLeaveDetail(null)}
                className="py-2 px-6 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-[10px] transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

