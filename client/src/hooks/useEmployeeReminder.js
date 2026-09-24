import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const REPORT_REMINDER_INTERVAL = 10 * 60 * 1000;

const REMINDER_TITLE = "HRMS Report Reminder";
const REMINDER_MESSAGE = "10 minutes completed. Please submit your report/update.";

export const useEmployeeReminder = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const timerRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const employeeDataRef = useRef(currentUser);
  const [reminder, setReminder] = useState(null);

  useEffect(() => {
    employeeDataRef.current = currentUser;
  }, [currentUser]);

  const dismissReminder = () => setReminder(null);

  useEffect(() => {
    const role = (currentUser?.role || "").toLowerCase().trim();
    const isEmployee = role === "employee" && currentUser?.status !== "inactive";

    if (!isEmployee) {
      sessionStartedAtRef.current = null;
      return () => setReminder(null);
    }

    sessionStartedAtRef.current = Date.now();

    let cancelled = false;

    const clearReminderTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const showReminder = async () => {
      if (cancelled) return;

      const employee = employeeDataRef.current || {};
      const activeTask = (employee.tasks || []).find(task => !task.completed);
      const taskName = activeTask?.title || activeTask?.name || "Task update";
      const runningDuration = Date.now() - sessionStartedAtRef.current;
      setReminder({
        employeeName: employee.name || employee.email || "Employee",
        taskName,
        runningDuration,
        message: REMINDER_MESSAGE
      });

      let permission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
      if (permission === "default") {
        try {
          permission = await Notification.requestPermission();
        } catch {
          permission = "denied";
        }
      }

      if (cancelled) return;

      if (permission === "granted") {
        try {
          const notification = new Notification(REMINDER_TITLE, {
            body: REMINDER_MESSAGE,
            tag: `hrms-report-reminder-${employee.uid}`,
            requireInteraction: true
          });
          notification.onclick = () => {
            window.focus();
            window.location.assign("/task-management");
          };
        } catch {
          showToast(REMINDER_MESSAGE, "warning", 7000);
        }
      } else {
        showToast(REMINDER_MESSAGE, "warning", 7000);
      }
    };

    const scheduleNextReminder = () => {
      if (cancelled) return;
      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        await showReminder();
        scheduleNextReminder();
      }, REPORT_REMINDER_INTERVAL);
    };

    clearReminderTimer();
    scheduleNextReminder();

    return () => {
      cancelled = true;
      clearReminderTimer();
    };
  }, [currentUser?.uid, currentUser?.role, currentUser?.status, showToast]);

  return { reminder, dismissReminder };
};

export { REPORT_REMINDER_INTERVAL };
