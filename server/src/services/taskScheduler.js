// ============================================================
// HOURLY REPORT REMINDER SCHEDULER — IST (Asia/Kolkata)
//
// Fires at the TOP OF EVERY HOUR (0 * * * *)
// Working hours: 09:00 – 18:00 IST
//
// For each employee who has an active push subscription:
//   1. Check if a reminder was already sent for this interval → skip if yes
//   2. Check if a task_report was submitted during the previous hour → skip if yes
//   3. Otherwise → send ONE Web Push "Report Reminder" notification
//   4. Insert a row into hourly_report_reminders to prevent duplicates
//
// Notification title : "Report Reminder"
// Notification body  : "1 hour report submission is due. Please submit your work report."
// ============================================================
import cron from "node-cron";
import { query } from "../config/db.js";
import { sendWebPush } from "./pushService.js";

// ─── Constants ───────────────────────────────────────────────
const WORK_START_HOUR = 9;   // 09:00 IST
const WORK_END_HOUR   = 18;  // 18:00 IST — last reminder sent at 18:00 (for 17:00–18:00 interval)

// ─── IST Helpers ─────────────────────────────────────────────

/**
 * Returns the current IST date and hour.
 * { dateStr: "YYYY-MM-DD", hour: 14, minuteStr: "14:00", prevHourStr: "13:00" }
 */
const getISTInfo = () => {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate   = new Date(istString);

  const year  = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day   = String(istDate.getDate()).padStart(2, "0");
  const hour  = istDate.getHours();     // 0-23
  const min   = istDate.getMinutes();

  const pad = (n) => String(n).padStart(2, "0");

  const dateStr      = `${year}-${month}-${day}`;
  const intervalEnd  = `${pad(hour)}:${pad(min)}`; // current time (top of hour = HH:00)
  const intervalStart= `${pad(hour - 1)}:00`;       // one hour ago

  return { dateStr, hour, min, intervalStart, intervalEnd };
};

/**
 * Convert "HH:MM" IST time string to a UTC ISO timestamp for today.
 * Used to query task_reports.submitted_at (stored as TIMESTAMPTZ in DB).
 */
const istTimeToUTCiso = (dateStr, timeStr) => {
  // dateStr = "2026-09-23", timeStr = "09:00"
  // IST = UTC+5:30, so subtract 5h30m
  const [h, m] = timeStr.split(":").map(Number);
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);

  const utcMs =
    Date.UTC(yyyy, mm - 1, dd, h, m, 0, 0) - (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMs).toISOString();
};

// ─── Core Logic ──────────────────────────────────────────────

const checkAndSendReminders = async () => {
  const { dateStr, hour, min, intervalStart, intervalEnd } = getISTInfo();

  // Only run inside working hours: hour must be > WORK_START_HOUR and <= WORK_END_HOUR
  // e.g. cron fires at 10:00 → hour=10, remind for 09:00–10:00 ✅
  //      cron fires at 09:00 → hour=9,  nothing to remind yet (shift just started) ✅
  //      cron fires at 18:00 → hour=18, remind for 17:00–18:00 ✅
  if (hour < WORK_START_HOUR + 1 || hour > WORK_END_HOUR) {
    console.log(`[HourlyReminder] Outside working hours (${hour}:00 IST) — skipping.`);
    return;
  }

  console.log(`[HourlyReminder] Checking interval ${intervalStart}–${intervalEnd} IST on ${dateStr}`);

  try {
    // Get all employees who have active push subscriptions
    // Join with users to get company_id (for tenant isolation)
    const subsResult = await query(`
      SELECT
        ps.user_id,
        ps.company_id,
        ps.endpoint,
        ps.p256dh,
        ps.auth
      FROM push_subscriptions ps
      INNER JOIN users u ON u.id = ps.user_id
      WHERE u.status = 'active'
    `);

    if (subsResult.rows.length === 0) {
      console.log("[HourlyReminder] No active push subscriptions found.");
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

    console.log(`[HourlyReminder] Processing ${Object.keys(userMap).length} subscribed employee(s)...`);

    for (const user of Object.values(userMap)) {
      await processEmployee(user, dateStr, intervalStart, intervalEnd);
    }
  } catch (err) {
    console.error("[HourlyReminder] checkAndSendReminders error:", err.message);
  }
};

/**
 * Process a single employee:
 *   1. Check if reminder already recorded for this interval → skip
 *   2. Check if report was submitted in this interval → skip push, record as report_found
 *   3. Otherwise → send push + record
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

    // 2 ── Check if employee submitted a task_report during the interval
    const intervalStartUTC = istTimeToUTCiso(dateStr, intervalStart);
    const intervalEndUTC   = istTimeToUTCiso(dateStr, intervalEnd);

    const reportCheck = await query(
      `SELECT id FROM task_reports
       WHERE user_id = $1
         AND submitted_at >= $2
         AND submitted_at < $3
       LIMIT 1`,
      [user.userId, intervalStartUTC, intervalEndUTC]
    );

    const reportFound = reportCheck.rows.length > 0;

    if (reportFound) {
      // Report submitted — record it, but don't send notification
      await insertReminderRecord(user.userId, user.companyId, dateStr, intervalStart, intervalEnd, false, true);
      console.log(`[HourlyReminder] ✅ Report found for user ${user.userId} (${intervalStart}–${intervalEnd}) — no push needed.`);
      return;
    }

    // 3 ── No report found → send Web Push notification
    const payload = {
      title: "Report Reminder",
      body:  "1 hour report submission is due. Please submit your work report.",
      url:   "/task-management"
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
          console.error(`[HourlyReminder] Push error for user ${user.userId}:`, pushErr.message);
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
    await insertReminderRecord(user.userId, user.companyId, dateStr, intervalStart, intervalEnd, sentCount > 0, false);

    console.log(
      sentCount > 0
        ? `[HourlyReminder] 🔔 Reminder sent to user ${user.userId} for ${intervalStart}–${intervalEnd}`
        : `[HourlyReminder] ⚠️  No active subscription delivered for user ${user.userId} — recorded as sent.`
    );
  } catch (err) {
    console.error(`[HourlyReminder] processEmployee error for user ${user.userId}:`, err.message);
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
  await query(
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
};

// ─── Scheduler Export ─────────────────────────────────────────

/**
 * Start the hourly report reminder scheduler.
 * Fires at the top of every hour (IST) between 09:00 and 18:00.
 */
export const startTaskScheduler = () => {
  console.log("⏰ Hourly Report Reminder Scheduler started (fires at top of each hour, IST)");
  console.log(`   Working hours: ${WORK_START_HOUR}:00 – ${WORK_END_HOUR}:00 IST`);

  // Fire at the top of every hour
  cron.schedule("0 * * * *", async () => {
    await checkAndSendReminders();
  }, {
    timezone: "Asia/Kolkata"
  });

  // On startup: if server restarts mid-hour during working hours,
  // run a check immediately so no interval is missed.
  // This is safe because hourly_report_reminders prevents duplicates.
  checkAndSendReminders().catch(() => {});
};
