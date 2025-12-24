/* ===============================
   MedAlert Service Worker
   Reliable Background Reminder
================================ */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

// store reminders
let reminders = [];

self.addEventListener("message", (event) => {
  if (event.data?.type === "ADD_REMINDERS") {
    reminders = event.data.payload;
  }
});

// 🔁 check every 30 seconds
setInterval(() => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  reminders.forEach((r) => {
    if (!r.triggered && r.date === currentDate && r.time === currentTime) {
      r.triggered = true;

      self.registration.showNotification("⏰ MedAlert Reminder", {
        body: `Time to take ${r.medicine}`,
        icon: "/logo192.png",
        badge: "/logo192.png",
        vibrate: [300, 150, 300],
      });
    }
  });
}, 30000);
