/* ===============================
   MedAlert Service Worker
   Reliable Background Reminder
================================ */

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated!");
  event.waitUntil(self.clients.claim());
});

// Store reminders
let reminders = [];

self.addEventListener("message", (event) => {
  if (event.data?.type === "ADD_REMINDERS") {
    reminders = event.data.payload;
    console.log("📝 Reminders received in Service Worker:", reminders);
  }
});

// 🔁 Check every 15 seconds for better reliability
setInterval(() => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  console.log(`⏰ Checking reminders at ${currentTime}`);

  reminders.forEach((r) => {
    if (!r.triggered && r.date === currentDate && r.time === currentTime) {
      r.triggered = true;

      console.log(`🔔 Triggering reminder for ${r.medicine} at ${currentTime}`);

      // Show notification
      self.registration.showNotification("⏰ MedAlert Reminder", {
        body: `Time to take ${r.medicine}`,
        icon: "/logo192.png",
        badge: "/logo192.png",
        vibrate: [300, 150, 300],
        requireInteraction: true, // Notification won't auto-dismiss
        tag: r.medicine, // Prevent duplicate notifications
        actions: [
          { action: "taken", title: "✅ Taken" },
          { action: "snooze", title: "⏰ Snooze 5min" }
        ]
      });

      // Send message to app to play sound
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: "PLAY_ALARM",
            medicine: r.medicine
          });
        });
      });
    }
  });
}, 15000); // Check every 15 seconds

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "taken") {
    console.log("✅ User marked medicine as taken");
  } else if (event.action === "snooze") {
    console.log("⏰ User snoozed the reminder");
  }

  // Open app when notification clicked
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
