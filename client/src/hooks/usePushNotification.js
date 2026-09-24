// ============================================================
// usePushNotification — React Hook
// Handles: permission request, SW registration, push subscribe,
// save subscription to server, status tracking.
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../firebase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

/**
 * Convert base64url VAPID public key to Uint8Array for PushManager.subscribe()
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function usePushNotification() {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support on mount
  useEffect(() => {
    const supported =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);
  }, []);

  // Sync permission state whenever it changes in the browser
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  // Check existing subscription status from server
  useEffect(() => {
    if (!currentUser || !isSupported) return;
    const token = localStorage.getItem("att_auth_token");
    if (!token) return;

    apiFetch("/push/status")
      .then((data) => setIsSubscribed(data.isSubscribed || false))
      .catch(() => {});
  }, [currentUser, isSupported]);

  /**
   * STEP 1: Request notification permission from browser.
   * This is the very first thing — does NOT require VAPID key.
   * STEP 2: Register SW + subscribe to push (requires VAPID).
   * STEP 3: Save subscription to server.
   */
  const enableNotifications = useCallback(async () => {
    setError(null);

    if (!isSupported) {
      setError("Your browser does not support Web Push notifications.");
      return false;
    }

    if (!currentUser) {
      setError("You must be logged in to enable notifications.");
      return false;
    }

    setIsLoading(true);

    try {
      // ── STEP 1: Ask browser for permission (always first) ──
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError(
          perm === "denied"
            ? "Notifications are blocked. Please enable them from browser Settings → Site Settings → Notifications."
            : "Notification permission was not granted."
        );
        setIsLoading(false);
        return false;
      }

      // ── STEP 2: Check VAPID key (needed for actual push subscription) ──
      if (!VAPID_PUBLIC_KEY) {
        // Browser reminders still work without server-side Web Push.
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      // ── STEP 3: Register Service Worker ──
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });
      await navigator.serviceWorker.ready;

      // ── STEP 4: Subscribe to Push ──
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // ── STEP 5: Save subscription to server ──
      const subJSON = subscription.toJSON();
      try {
        await apiFetch("/push/subscribe", {
          method: "POST",
          body: JSON.stringify({
            endpoint: subJSON.endpoint,
            keys: {
              p256dh: subJSON.keys?.p256dh || "",
              auth: subJSON.keys?.auth || ""
            }
          })
        });
      } catch (saveError) {
        // A stale backend must not prevent browser-only reminders.
        console.warn("Push subscription could not be saved on the server:", saveError);
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("enableNotifications error:", err);
      setError(err.message || "Failed to enable notifications.");
      setIsLoading(false);
      return false;
    }
  }, [currentUser, isSupported]);

  /**
   * Unsubscribe from push notifications and remove from server.
   */
  const disableNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          await apiFetch("/push/unsubscribe", {
            method: "DELETE",
            body: JSON.stringify({ endpoint })
          }).catch(() => {});
        }
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("disableNotifications error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    enableNotifications,
    disableNotifications
  };
}
