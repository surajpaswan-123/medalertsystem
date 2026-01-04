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

      // Show notification with sound
      self.registration.showNotification("⏰ MedAlert Reminder", {
        body: `Time to take ${r.medicine}`,
        icon: "/logo192.png",
        badge: "/logo192.png",
        vibrate: [500, 200, 500, 200, 500], // Longer vibration pattern
        requireInteraction: true, // Notification won't auto-dismiss
        tag: r.medicine + "_" + currentTime, // Prevent duplicate notifications
        silent: false, // Play system notification sound
        renotify: true, // Alert even if notification with same tag exists
        actions: [
          { action: "taken", title: "✅ Taken" },
          { action: "snooze", title: "⏰ Snooze 5min" }
        ],
        data: {
          medicine: r.medicine,
          time: currentTime,
          date: currentDate
        }
      });

      // Send message to app to play sound (if app is open)
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients.forEach(client => {
            client.postMessage({
              type: "PLAY_ALARM",
              medicine: r.medicine
            });
          });
          console.log("📱 App is open, sent message to play alarm sound");
        } else {
          console.log("📱 App is closed, showing notification only");
        }
      });
    }
  });
}, 15000); // Check every 15 seconds

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  const notificationData = event.notification.data;
  
  event.notification.close();

  if (event.action === "taken") {
    console.log("✅ User marked medicine as taken:", notificationData.medicine);
    // You can add logic here to mark medicine as taken in storage
  } else if (event.action === "snooze") {
    console.log("⏰ User snoozed the reminder:", notificationData.medicine);
    
    // Create a new reminder 5 minutes from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const newDate = now.toISOString().split("T")[0];
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    
    reminders.push({
      medicine: notificationData.medicine,
      date: newDate,
      time: `${hh}:${mm}`,
      triggered: false
    });
    
    console.log(`⏰ Snoozed reminder added for ${hh}:${mm}`);
  }

  // Open app when notification clicked
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // If app is not open, open it
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

// Handle notification close (when user dismisses without clicking)
self.addEventListener("notificationclose", (event) => {
  console.log("❌ User dismissed notification:", event.notification.data.medicine);
});
