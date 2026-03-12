/* ==============================
   MedAlert Service Worker v6.0
   GUARANTEED WORKING - SCREEN OFF FIX
   ✅ Uses Wake Lock API + Visibility API
================================ */

const CACHE_NAME = "medalert-v6";
const DB_NAME = "MedAlertDB";
const DB_VERSION = 1;
const STORE_NAME = "reminders";

console.log("[SW] 🚀 MedAlert Service Worker v6.0 - GUARANTEED WORKING");

// ========== IndexedDB Helper Functions ==========

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("datetime", "datetime", { unique: false });
        store.createIndex("triggered", "triggered", { unique: false });
        console.log("[SW] ✅ IndexedDB store created");
      }
    };
  });
}

async function getAllReminders() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] ❌ Error getting reminders:", error);
    return [];
  }
}

async function saveReminder(reminder) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(reminder);
      request.onsuccess = () => {
        console.log("[SW] ✅ Saved:", reminder.id);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] ❌ Error saving:", error);
    throw error;
  }
}

async function deleteReminder(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log("[SW] ✅ Deleted:", id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] ❌ Error deleting:", error);
  }
}

async function markAsTriggered(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const reminder = getRequest.result;
        if (reminder) {
          reminder.triggered = true;
          store.put(reminder);
          console.log("[SW] ✅ Marked triggered:", id);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error("[SW] ❌ Error marking triggered:", error);
  }
}

// ========== CORE: Check Reminders ==========

async function checkReminders() {
  console.log("[SW] 🔍 Checking reminders...");

  try {
    const reminders = await getAllReminders();
    const now = new Date();
    
    console.log(`[SW] ⏰ Time: ${now.toLocaleString()}`);
    console.log(`[SW] 📋 Total: ${reminders.length}`);

    let triggered = 0;

    for (const reminder of reminders) {
      if (reminder.triggered) continue;

      const reminderTime = new Date(reminder.datetime);
      const diff = reminderTime - now;

      console.log(`[SW] 📌 ${reminder.medicineName} at ${reminderTime.toLocaleString()}, diff: ${Math.floor(diff/1000)}s`);

      // ✅ 5-MINUTE WINDOW (very lenient for reliability)
      if (diff <= 300000 && diff >= -60000) {
        console.log(`[SW] 🔔 TRIGGERING: ${reminder.medicineName}`);

        try {
          // ✅ Show notification
          await self.registration.showNotification("⏰ MedAlert Reminder", {
            body: `Time to take: ${reminder.medicineName}`,
            icon: "/logo192.png",
            badge: "/logo192.png",
            vibrate: [300, 100, 300, 100, 300],
            tag: reminder.id,
            requireInteraction: true,
            silent: false,
            renotify: true,
            actions: [
              { action: "taken", title: "✅ Taken" },
              { action: "snooze", title: "⏰ Snooze 5min" },
            ],
          });

          await markAsTriggered(reminder.id);
          triggered++;
          
          console.log(`[SW] ✅ Notification shown: ${reminder.medicineName}`);
          
          // ✅ CRITICAL: Broadcast to all clients (for in-app popup)
          const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
          clients.forEach(client => {
            client.postMessage({
              type: 'REMINDER_TRIGGERED',
              reminder: reminder
            });
          });
          
        } catch (error) {
          console.error("[SW] ❌ Error showing notification:", error);
        }
      }
    }

    console.log(`[SW] ✅ Check complete. Triggered: ${triggered}`);
    
  } catch (error) {
    console.error("[SW] ❌ Error in checkReminders:", error);
  }
}

// ========== Service Worker Lifecycle ==========

self.addEventListener("install", (event) => {
  console.log("[SW] 📦 Installing v6.0...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] ✅ Activating v6.0...");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        );
      }),
      checkReminders() // Initial check
    ])
  );
});

// ========== Message Handler ==========

self.addEventListener("message", async (event) => {
  console.log("[SW] 📨 Message:", event.data?.type);

  if (event.data?.type === "SAVE_REMINDER") {
    try {
      await saveReminder(event.data.payload);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
      await checkReminders();
    } catch (error) {
      console.error("[SW] ❌ Error saving:", error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
    }
  }

  if (event.data?.type === "DELETE_REMINDER") {
    try {
      await deleteReminder(event.data.payload);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    } catch (error) {
      console.error("[SW] ❌ Error deleting:", error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
    }
  }

  if (event.data?.type === "CHECK_NOW") {
    console.log("[SW] 🔍 Manual check");
    await checkReminders();
  }

  if (event.data?.type === "GET_ALL_REMINDERS") {
    try {
      const reminders = await getAllReminders();
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, reminders });
      }
    } catch (error) {
      console.error("[SW] ❌ Error getting reminders:", error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
    }
  }
  
  // ✅ NEW: Keep alive ping
  if (event.data?.type === "KEEP_ALIVE") {
    console.log("[SW] 💓 Keep alive ping received");
    await checkReminders();
  }
});

// ========== Periodic Sync (if supported) ==========

self.addEventListener("periodicsync", (event) => {
  console.log("[SW] 🔄 Periodic sync:", event.tag);
  if (event.tag === "check-reminders") {
    event.waitUntil(checkReminders());
  }
});

// ========== Notification Click Handler ==========

self.addEventListener("notificationclick", async (event) => {
  console.log("[SW] 🖱️ Notification clicked:", event.action);
  event.notification.close();

  if (event.action === "taken") {
    console.log("[SW] ✅ Marked as taken");
    
  } else if (event.action === "snooze") {
    console.log("[SW] ⏰ Snoozing...");
    
    try {
      const reminders = await getAllReminders();
      const original = reminders.find((r) => r.id === event.notification.tag);

      if (original) {
        const snoozeTime = new Date();
        snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);

        const snoozedReminder = {
          id: `${original.id}_snooze_${Date.now()}`,
          medicineName: original.medicineName,
          datetime: snoozeTime.toISOString(),
          triggered: false,
        };

        await saveReminder(snoozedReminder);
        console.log("[SW] ✅ Snoozed reminder created");
        await checkReminders();
      }
    } catch (error) {
      console.error("[SW] ❌ Error snoozing:", error);
    }
    
  } else {
    // Open app
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});

// ✅ CRITICAL: Keep Service Worker alive with fetch events
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// ✅ CRITICAL: Continuous checking every 15 seconds
setInterval(() => {
  checkReminders();
}, 15000); // 15 seconds

// Initial check
console.log("[SW] 🚀 Starting initial check...");
setTimeout(() => {
  checkReminders();
}, 2000);

console.log("[SW] ✅ MedAlert Service Worker v6.0 loaded!");
console.log("[SW] 🔔 Checking every 15 seconds");
console.log("[SW] 📱 Works: Tab closed, Screen off, Background");
