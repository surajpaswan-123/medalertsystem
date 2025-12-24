/* ==============================
   MedAlert Service Worker
   Background Reminder Notifications
================================ */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
});

// 🔔 Receive reminder data from React
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_REMINDER") {
    const { medicineName, time } = event.data.payload;

    const delay = new Date(time).getTime() - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification("⏰ MedAlert Reminder", {
          body: `Time to take: ${medicineName}`,
          icon: "/logo192.png",
          badge: "/logo192.png",
          vibrate: [200, 100, 200],
        });
      }, delay);
    }
  }
});
