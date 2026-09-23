// ============================================================
// SERVICE WORKER — Web Push Notification Handler
// File: client/public/sw.js
// This file must be at the ROOT of the domain (public/) for
// Service Worker scope to cover the entire app.
// ============================================================

self.addEventListener("install", (event) => {
  // Activate immediately without waiting for old SW to be discarded
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ── Push Event ────────────────────────────────────────────────
// Fired by the browser when the backend sends a push notification.
// The employee does NOT need to have the HRMS tab open.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "HRMS Notification",
      body: event.data.text() || "You have a new notification.",
      url: "/task-management",
      taskId: ""
    };
  }

  const title = data.title || "Task Time Ended";
  const options = {
    body: data.body || "Your assigned task time has ended. Report has not been submitted.",
    icon: "/favicon.png",
    badge: "/favicon.png",
    // tag: prevents duplicate notifications for the same task (same tag = replaces old one)
    tag: data.taskId ? `task-${data.taskId}` : "hrms-notification",
    // requireInteraction: notification stays visible until the user dismisses it
    // (best available mechanism for ~30-second visibility on Windows/Android Chrome)
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/task-management",
      taskId: data.taskId || ""
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click Event ──────────────────────────────────
// When the employee clicks the notification, open the task page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/task-management";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window with the app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push Subscription Change ──────────────────────────────────
// Fired when the browser renews the push subscription automatically.
self.addEventListener("pushsubscriptionchange", (event) => {
  // The app will re-subscribe on next load via usePushNotification hook
  console.log("[SW] Push subscription changed");
});
