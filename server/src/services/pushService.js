// ============================================================
// PUSH NOTIFICATION SERVICE — Web Push via VAPID
// ============================================================
import webpush from "web-push";
import dotenv from "dotenv";
dotenv.config();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_MAILTO = process.env.VAPID_MAILTO || "mailto:info@teamcarrezza.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn("⚠️  VAPID keys not configured. Web Push notifications disabled.");
}

/**
 * Send a Web Push notification to a single subscription.
 * @param {object} subscription - { endpoint, keys: { p256dh, auth } }
 * @param {object} payload - { title, body, url, taskId }
 * @returns {Promise<boolean>}
 */
export const sendWebPush = async (subscription, payload) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("Web Push skipped: VAPID keys not set.");
    return false;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 60, // 60 seconds TTL — after which undelivered notifications expire
        urgency: "high"
      }
    );
    return true;
  } catch (err) {
    // 410 Gone = subscription expired/invalid — caller should delete it
    if (err.statusCode === 410 || err.statusCode === 404) {
      const expiredError = new Error("SUBSCRIPTION_EXPIRED");
      expiredError.endpoint = subscription.endpoint;
      throw expiredError;
    }
    console.error("sendWebPush error:", err.message || err);
    return false;
  }
};

export const getVapidPublicKey = () => VAPID_PUBLIC_KEY || null;
