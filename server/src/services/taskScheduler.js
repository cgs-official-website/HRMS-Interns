// ============================================================
// REPORT REMINDER SCHEDULER — IST (Asia/Kolkata)
//
// Checks every minute and runs only at the start of a 10-minute slot.
// Working hours: 09:00 – 18:00 IST
//
// For each logged-in employee who has an active push subscription:
//   1. Check if a reminder was already sent for this interval → skip if yes
//   2. Otherwise → send ONE Web Push "Work Report Reminder" notification
//   4. Insert a row into hourly_report_reminders to prevent duplicates
//
// Notification title : "HRMS Work Report Reminder"
// Notification body  : "Please update your work report."
// ============================================================
import cron from "node-cron";
import { query } from "../config/db.js";
import { sendWebPush } from "./pushService.js";

// ─── Constants ───────────────────────────────────────────────
const WORK_START_HOUR = 9;   // 09:00 IST
const WORK_END_HOUR   = 18;  // 18:00 IST — final reminder slot
const REMINDER_INTERVAL_MINUTES = 10;

// ─── IST Helpers ─────────────────────────────────────────────

/**
 * Returns the current IST date and the current 10-minute wall-clock interval.
 * Breaks and attendance state are intentionally not part of this calculation.
 */
const getISTInfo = () => {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate   = new Date(istString);

  const year  = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day   = String(istDate.getDate()).padStart(2, "0");
  const hour  = istDate.getHours();     // 0-23
  const minute = istDate.getMinutes();

  const pad = (n) => String(n).padStart(2, "0");

  const dateStr      = `${year}-${month}-${day}`;
  const slotStartMinute = Math.floor(minute / REMINDER_INTERVAL_MINUTES) * REMINDER_INTERVAL_MINUTES;
  const slotEndTotalMinutes = hour * 60 + slotStartMinute + REMINDER_INTERVAL_MINUTES;
  const intervalEndHour = Math.floor(slotEndTotalMinutes / 60);
  const intervalEndMinute = slotEndTotalMinutes % 60;
  const intervalStart = `${pad(hour)}:${pad(slotStartMinute)}`;
  const intervalEnd   = `${pad(intervalEndHour)}:${pad(intervalEndMinute)}`;

  return { dateStr, hour, minute, intervalStart, intervalEnd };
};

// ─── Core Logic ──────────────────────────────────────────────

const checkAndSendReminders = async () => {
  const { dateStr, hour, minute, intervalStart, intervalEnd } = getISTInfo();

  // The office clock is the only trigger. Breaks and attendance state are ignored.
  if (minute % REMINDER_INTERVAL_MINUTES !== 0 || hour < WORK_START_HOUR || hour > WORK_END_HOUR) {
    if (minute % REMINDER_INTERVAL_MINUTES === 0) {
      console.log(`[ReportReminder] Outside working hours (${hour}:${String(minute).padStart(2, "0")} IST) — skipping.`);
    }
    return;
  }

  console.log(`[ReportReminder] Checking interval ${intervalStart}–${intervalEnd} IST on ${dateStr}`);

  try {
    // Only TeachTeam employees receive report reminders. Breaks and attendance
    // state are intentionally excluded from this selection.
    const subsResult = await query(`
      SELECT
        ps.user_id,
        ps.company_id,
        ps.endpoint,
        ps.p256dh,
        ps.auth
      FROM push_subscriptions ps
      INNER JOIN users u ON u.id = ps.user_id
      INNER JOIN companies c ON c.id = u.company_id
      WHERE u.status = 'active'
        AND LOWER(TRIM(u.role)) = 'employee'
        AND LOWER(TRIM(c.name)) IN ('teachteam', 'techteam')
        AND EXISTS (
          SELECT 1
          FROM auth_sessions s
          WHERE s.user_id = ps.user_id
            AND s.expires_at > CURRENT_TIMESTAMP
            AND s.last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '2 minutes'
        )
    `);

    if (subsResult.rows.length === 0) {
      console.log("[ReportReminder] No active push subscriptions found.");
      return;
    }

    // Group subscriptions by user_id (one user can have multiple devices)
    const userMap = {};
    for (const row of subsResult.rows) {
      if (!userMap[row.user_id]) {
        userMap[row.user_id] = {
          userId:    row.user_id,
          companyId: row.company_id,
          subs:      []
        };
      }
      userMap[row.user_id].subs.push({
        endpoint: row.endpoint,
        p256dh:   row.p256dh,
        auth:     row.auth
      });
    }

    console.log(`[ReportReminder] Processing ${Object.keys(userMap).length} subscribed employee(s)...`);

    for (const user of Object.values(userMap)) {
      await processEmployee(user, dateStr, intervalStart, intervalEnd);
    }
  } catch (err) {
    console.error("[ReportReminder] checkAndSendReminders error:", err.message);
  }
};

/**
 * Process a single logged-in employee without consulting Task Management data.
 */
const processEmployee = async (user, dateStr, intervalStart, intervalEnd) => {
  try {
    // 1 ── Check if we already processed this interval for this employee
    const existingCheck = await query(
      `SELECT id, notification_sent, report_found
       FROM hourly_report_reminders
       WHERE user_id = $1 AND reminder_date = $2 AND interval_start = $3`,
      [user.userId, dateStr, intervalStart]
    );

    if (existingCheck.rows.length > 0) {
      // Already handled (either reminder sent or report was found) — skip
      return;
    }

    // Claim the employee/slot before sending. The unique key makes this atomic
    // across restarts or multiple scheduler instances.
    const claimed = await insertReminderRecord(user.userId, user.companyId, dateStr, intervalStart, intervalEnd, false, false);
    if (!claimed) return;

    // 2 ── Send the work-report reminder without reading Task Management data
    const payload = {
      title: "HRMS Work Report Reminder",
      body:  "Please update your work report.",
      url:   "/dashboard"
    };

    const expiredEndpoints = [];
    let sentCount = 0;

    for (const sub of user.subs) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      try {
        const sent = await sendWebPush(subscription, payload);
        if (sent) sentCount++;
      } catch (pushErr) {
        if (pushErr.message === "SUBSCRIPTION_EXPIRED") {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error(`[ReportReminder] Push error for user ${user.userId}:`, pushErr.message);
        }
      }
    }

    // Clean up expired subscriptions
    for (const ep of expiredEndpoints) {
      await query(
        "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
        [user.userId, ep]
      ).catch(() => {});
    }

    // 4 ── Record that we sent the reminder (prevents re-sending if server restarts)
    await markReminderSent(user.userId, dateStr, intervalStart, sentCount > 0);

    console.log(
      sentCount > 0
        ? `[ReportReminder] 🔔 Reminder sent to user ${user.userId} for ${intervalStart}–${intervalEnd}`
        : `[ReportReminder] ⚠️  No active subscription delivered for user ${user.userId} — recorded as sent.`
    );
  } catch (err) {
    console.error(`[ReportReminder] processEmployee error for user ${user.userId}:`, err.message);
  }
};

/**
 * Insert a row into hourly_report_reminders.
 * ON CONFLICT DO NOTHING — safe to call multiple times.
 */
const insertReminderRecord = async (
  userId, companyId, date, intervalStart, intervalEnd,
  notificationSent, reportFound
) => {
  const id = "hrr_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const result = await query(
    `INSERT INTO hourly_report_reminders
       (id, user_id, company_id, reminder_date, interval_start, interval_end,
        notification_sent, notification_sent_at, report_found)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, reminder_date, interval_start) DO NOTHING`,
    [
      id, userId, companyId, date, intervalStart, intervalEnd,
      notificationSent,
      notificationSent ? new Date().toISOString() : null,
      reportFound
    ]
  );
  return result.rowCount > 0;
};

const markReminderSent = async (userId, date, intervalStart, notificationSent) => {
  await query(
    `UPDATE hourly_report_reminders
     SET notification_sent = $4,
         notification_sent_at = CASE WHEN $4 THEN $5 ELSE NULL END
     WHERE user_id = $1 AND reminder_date = $2 AND interval_start = $3`,
    [userId, date, intervalStart, notificationSent, notificationSent ? new Date().toISOString() : null]
  );
};

// ─── Scheduler Export ─────────────────────────────────────────

/**
 * Start the report reminder scheduler.
 * Runs every 10 minutes (IST), from 09:00 through 18:00.
 */
export const startTaskScheduler = () => {
  console.log("⏰ Report Reminder Scheduler started (fires every 10 minutes, IST)");
  console.log(`   Working hours: ${WORK_START_HOUR}:00 – ${WORK_END_HOUR}:00 IST`);

  // Check every minute; the handler gates execution to each 10-minute slot in IST.
  cron.schedule("* * * * *", async () => {
    await checkAndSendReminders();
  }, {
    timezone: "Asia/Kolkata"
  });

  // A startup check is also gated to a 10-minute boundary, so restarts cannot
  // shift the office-clock schedule or create a duplicate slot.
  checkAndSendReminders().catch(() => {});
};
