// ✅ KEEP ALIVE MECHANISM - Keeps Service Worker active
// This file runs independently and pings Service Worker every 10 seconds

console.log("[KeepAlive] 🚀 Starting Service Worker keep-alive mechanism");

// Ping Service Worker every 10 seconds
setInterval(() => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'KEEP_ALIVE'
    });
    console.log("[KeepAlive] 💓 Ping sent to Service Worker");
  }
}, 10000); // 10 seconds

// Also listen for visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CHECK_NOW'
    });
    console.log("[KeepAlive] 👁️ Page visible - triggering check");
  }
});

// Listen for messages from Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'REMINDER_TRIGGERED') {
      console.log("[KeepAlive] 🔔 Reminder triggered:", event.data.reminder);
      // This will be handled by AutoSchedule.js
    }
  });
}

console.log("[KeepAlive] ✅ Keep-alive mechanism active");
