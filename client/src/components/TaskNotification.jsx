import React, { useState, useEffect, useRef } from "react";
import { Clock, X, Check } from "lucide-react";
import { subscribeToUserTasks, subscribeToUserLogs, getTodayAttendanceLog } from "../firebase";

export default function TaskNotification({ currentUser, todayLog: propTodayLog }) {
  const [tasks, setTasks] = useState([]);
  const [todayLog, setTodayLog] = useState(propTodayLog || null);
  const [isVisible, setIsVisible] = useState(false);
  const [elapsedDuration, setElapsedDuration] = useState("00:00:00");
  const lastDismissedRef = useRef(0);

  // Sync prop todayLog
  useEffect(() => {
    if (propTodayLog) {
      setTodayLog(propTodayLog);
    }
  }, [propTodayLog]);

  // Subscribe to user attendance logs for real-time check-in updates
  useEffect(() => {
    if (!currentUser?.uid) return;

    // Fetch initial
    getTodayAttendanceLog(currentUser.uid).then(log => {
      if (log) setTodayLog(log);
    }).catch(() => {});

    const unsubscribeLogs = subscribeToUserLogs(currentUser.uid, (logs) => {
      if (Array.isArray(logs) && logs.length > 0) {
        const todayStr = new Date().toISOString().split("T")[0];
        const today = logs.find(l => (l.date === todayStr || l.date_str === todayStr)) || logs[0];
        if (today) setTodayLog(today);
      }
    });

    return () => {
      if (typeof unsubscribeLogs === "function") unsubscribeLogs();
    };
  }, [currentUser?.uid]);

  // Subscribe to real-time user tasks
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribeTasks = subscribeToUserTasks(currentUser.uid, (userTasks) => {
      const taskList = Array.isArray(userTasks) ? userTasks : [];
      setTasks(taskList);
    });

    return () => {
      if (typeof unsubscribeTasks === "function") unsubscribeTasks();
    };
  }, [currentUser?.uid]);

  // Determine active running task or shift
  const getActiveTaskInfo = () => {
    const isCheckedIn = !!(
      todayLog &&
      !todayLog.check_out &&
      !todayLog.checkOutTime &&
      (todayLog.check_in || todayLog.checkInTime || todayLog.status === "checked-in" || todayLog.status === "present" || todayLog.status === "on-break")
    );

    // 1. Task with active timer running
    const timerTask = tasks.find(t => t.timerStartedAt && !t.completed);
    if (timerTask) {
      return {
        hasActive: true,
        title: timerTask.title || timerTask.name || "Active Task",
        startTime: timerTask.timerStartedAt
      };
    }

    // 2. In-progress assigned task
    const pendingTask = tasks.find(t => !t.completed && (t.status === "in_progress" || t.status === "In Progress" || t.status === "pending"));
    if (pendingTask) {
      return {
        hasActive: true,
        title: pendingTask.title || pendingTask.name || "Assigned Task",
        startTime: pendingTask.timerStartedAt || todayLog?.checkInTime || todayLog?.check_in || pendingTask.assignedAt || new Date().toISOString()
      };
    }

    // 3. Any active checked-in shift
    if (isCheckedIn) {
      return {
        hasActive: true,
        title: tasks.length > 0 && !tasks[0].completed ? tasks[0].title : "Daily Shift Tasks",
        startTime: todayLog.checkInTime || todayLog.check_in || new Date().toISOString()
      };
    }

    return { hasActive: false, title: "", startTime: null };
  };

  // 10-Minute interval notification check
  useEffect(() => {
    if (!currentUser?.uid) return;

    const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes

    // Read cached dismiss time from session storage
    const storageKey = `task_notif_dismissed_${currentUser.uid}`;
    const savedDismiss = sessionStorage.getItem(storageKey);
    if (savedDismiss) {
      lastDismissedRef.current = Number(savedDismiss) || 0;
    }

    const checkInterval = () => {
      const activeInfo = getActiveTaskInfo();
      if (activeInfo.hasActive) {
        const now = Date.now();
        // If 10 minutes have passed since last dismissal (or if never dismissed in this session)
        if (now - lastDismissedRef.current >= TEN_MINUTES_MS) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    // Immediate check on mount or when state updates
    checkInterval();

    // Periodic check every 10 seconds
    const interval = setInterval(checkInterval, 10000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, tasks, todayLog]);

  // Live running duration counter
  useEffect(() => {
    if (!isVisible) return;

    const updateTimer = () => {
      const activeInfo = getActiveTaskInfo();
      if (activeInfo.startTime) {
        const start = new Date(activeInfo.startTime).getTime();
        const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
        const hours = Math.floor(diffSec / 3600);
        const minutes = Math.floor((diffSec % 3600) / 60);
        const seconds = diffSec % 60;
        setElapsedDuration(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      } else {
        setElapsedDuration("00:00:00");
      }
    };

    updateTimer();
    const ticker = setInterval(updateTimer, 1000);

    return () => clearInterval(ticker);
  }, [isVisible, tasks, todayLog]);

  const handleDismiss = () => {
    setIsVisible(false);
    const now = Date.now();
    lastDismissedRef.current = now;
    if (currentUser?.uid) {
      sessionStorage.setItem(`task_notif_dismissed_${currentUser.uid}`, now.toString());
    }
  };

  const activeInfo = getActiveTaskInfo();
  if (!isVisible || !activeInfo.hasActive || !currentUser) return null;

  const employeeName = currentUser.name || currentUser.displayName || "Employee";
  const taskName = activeInfo.title;

  return (
    <div
      className="fixed bottom-6 right-6 z-[99999] max-w-sm sm:max-w-md w-[calc(100vw-3rem)] sm:w-96 animate-slide-up shadow-2xl"
      role="alert"
    >
      <div className="bg-gradient-to-br from-red-600 via-red-600 to-rose-700 text-white rounded-[22px] p-5 border border-red-400/40 shadow-xl shadow-red-950/40 backdrop-blur-md relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-100 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/15">
              Task Reminder • 10m
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {/* Employee Name */}
        <div className="mb-1 text-xs text-red-100 font-medium">
          Employee: <span className="text-white font-bold">{employeeName}</span>
        </div>

        {/* Task Name */}
        <div className="mb-3">
          <span className="text-[11px] text-red-200 uppercase font-semibold tracking-wide block">Task Name</span>
          <h4 className="text-base font-extrabold text-white leading-snug line-clamp-2 drop-shadow-sm">
            {taskName}
          </h4>
        </div>

        {/* Running Task Duration Bar */}
        <div className="bg-black/30 border border-white/15 rounded-[14px] p-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-red-200 block tracking-wide">Running Duration</span>
              <span className="text-base font-mono font-extrabold text-white tracking-wider">
                {elapsedDuration}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-400/30 px-2 py-0.5 rounded-md uppercase">
            In Progress
          </span>
        </div>

        {/* OK Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 font-extrabold text-xs uppercase tracking-wider rounded-[12px] shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check size={16} className="text-red-600 stroke-[3]" />
          <span>OK</span>
        </button>
      </div>
    </div>
  );
}
