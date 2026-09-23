// ============================================================
// PUSH SUBSCRIPTION CONTROLLER
// ============================================================
import { query } from "../config/db.js";
import { getVapidPublicKey } from "../services/pushService.js";

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key for the frontend to subscribe.
 */
export const getVapidKey = (req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({ error: "Push notifications are not configured on this server." });
  }
  res.json({ publicKey: key });
};

/**
 * POST /api/push/subscribe
 * Save employee's push subscription. Identified from JWT (req.user).
 */
export const subscribePush = async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Invalid push subscription object." });
    }

    const id = "ps_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

    await query(
      `INSERT INTO push_subscriptions (id, user_id, company_id, endpoint, p256dh, auth, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, endpoint)
       DO UPDATE SET p256dh = $5, auth = $6, updated_at = CURRENT_TIMESTAMP`,
      [id, userId, companyId, endpoint, keys.p256dh, keys.auth]
    );

    res.status(201).json({ success: true, message: "Push subscription saved." });
  } catch (err) {
    console.error("subscribePush error:", err);
    res.status(500).json({ error: "Failed to save push subscription." });
  }
};

/**
 * DELETE /api/push/unsubscribe
 * Remove employee's push subscription.
 */
export const unsubscribePush = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { endpoint } = req.body;

    if (endpoint) {
      await query(
        "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
        [userId, endpoint]
      );
    } else {
      // Remove all subscriptions for this user
      await query("DELETE FROM push_subscriptions WHERE user_id = $1", [userId]);
    }

    res.json({ success: true, message: "Push subscription removed." });
  } catch (err) {
    console.error("unsubscribePush error:", err);
    res.status(500).json({ error: "Failed to remove push subscription." });
  }
};

/**
 * GET /api/push/status
 * Check if the current user has an active push subscription.
 */
export const getPushStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await query(
      "SELECT id FROM push_subscriptions WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    res.json({ isSubscribed: result.rows.length > 0 });
  } catch (err) {
    console.error("getPushStatus error:", err);
    res.status(500).json({ error: "Failed to check push status." });
  }
};
