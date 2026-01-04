/* ==============================
   MedAlert Service Worker v4.0
   SIMPLIFIED & WORKING VERSION
================================ */

const CACHE_NAME = "medalert-v4";
const DB_NAME = "MedAlertDB";
const DB_VERSION = 1;
const STORE_NAME = "reminders";

console.log("[SW] MedAlert Service Worker v4.0 starting...");

// ========== IndexedDB Helper Functions ==========

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[SW] IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("[SW] IndexedDB opened successfully");
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log("[SW] IndexedDB upgrade needed");
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("datetime", "datetime", { unique: false });
        store.createIndex("triggered", "triggered", { unique: false });
        console.log("[SW] IndexedDB store created");
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

      request.onsuccess = () => {
        console.log("[SW] Got reminders:", request.result.length);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Error getting reminders:", error);
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
        console.log("[SW] Reminder saved:", reminder.id);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Error saving reminder:", error);
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
        console.log("[SW] Reminder deleted:", id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] Error deleting reminder:", error);
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
          console.log("[SW] Reminder marked as triggered:", id);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error("[SW] Error marking as triggered:", error);
  }
}

// ========== Reminder Check Logic ==========

async function checkReminders() {
  console.log("[SW] 🔍 Checking reminders...");

  try {
    const reminders = await getAllReminders();
    const now = new Date();
    
    console.log(`[SW] Current time: ${now.toLocaleString()}`);
    console.log(`[SW] Total reminders: ${reminders.length}`);

    let triggered = 0;

    for (const reminder of reminders) {
      if (reminder.triggered) {
        console.log(`[SW] ⏭️ Skipping (already triggered): ${reminder.medicineName}`);
        continue;
      }

      const reminderTime = new Date(reminder.datetime);
      const diff = reminderTime - now;

      console.log(`[SW] Reminder: ${reminder.medicineName} at ${reminderTime.toLocaleString()}, diff: ${Math.floor(diff/1000)}s`);

      // Trigger if within 2 minute window (more lenient)
      if (diff <= 120000 && diff >= -60000) {
        console.log(`[SW] 🔔 TRIGGERING: ${reminder.medicineName}`);

        try {
          await self.registration.showNotification("⏰ MedAlert Reminder", {
            body: `Time to take: ${reminder.medicineName}`,
            icon: "/logo192.png",
            badge: "/logo192.png",
            vibrate: [200, 100, 200, 100, 200],
            tag: reminder.id,
            requireInteraction: true,
            actions: [
              { action: "taken", title: "✅ Taken" },
              { action: "snooze", title: "⏰ Snooze 5min" },
            ],
          });

          await markAsTriggered(reminder.id);
          triggered++;
          
          console.log(`[SW] ✅ Notification shown for: ${reminder.medicineName}`);
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

// ========== Service Worker Events ==========

self.addEventListener("install", (event) => {
  console.log("[SW] 📦 Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] ✅ Activating...");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        );
      })
    ])
  );
});

// Receive reminders from React
self.addEventListener("message", async (event) => {
  console.log("[SW] 📨 Message received:", event.data?.type);

  if (event.data?.type === "SAVE_REMINDER") {
    console.log("[SW] Saving reminder:", event.data.payload);
    try {
      await saveReminder(event.data.payload);
      
      // Send success response
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
      
      // Immediate check after saving
      setTimeout(() => checkReminders(), 1000);
      
    } catch (error) {
      console.error("[SW] Error saving reminder:", error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
    }
  }

  if (event.data?.type === "DELETE_REMINDER") {
    console.log("[SW] Deleting reminder:", event.data.payload);
    try {
      await deleteReminder(event.data.payload);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    } catch (error) {
      console.error("[SW] Error deleting reminder:", error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
    }
  }

  if (event.data?.type === "CHECK_NOW") {
    console.log("[SW] 🔍 Manual check triggered");
    await checkReminders();
  }

  if (event.data?.type === "GET_ALL_REMINDERS") {
    console.log("[SW] Getting all reminders");
    try {
      const reminders = await getAllReminders();
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, reminders });
      }
    } catch (error) {
      console.error("[SW] Error getting reminders:", error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
    }
  }
});

// Periodic Background Sync (checks every 15 minutes when app is closed)
self.addEventListener("periodicsync", (event) => {
  console.log("[SW] 🔄 Periodic sync triggered:", event.tag);
  if (event.tag === "check-reminders") {
    event.waitUntil(checkReminders());
  }
});

// Notification click handler
self.addEventListener("notificationclick", async (event) => {
  console.log("[SW] 🖱️ Notification clicked:", event.action);
  event.notification.close();

  if (event.action === "taken") {
    console.log("[SW] ✅ Reminder marked as taken");
    // Already marked as triggered
    
  } else if (event.action === "snooze") {
    console.log("[SW] ⏰ Snoozing reminder");
    
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
      }
    } catch (error) {
      console.error("[SW] ❌ Error snoozing:", error);
    }
    
  } else {
    // Open app
    event.waitUntil(
      clients.matchAll({ type: "window" }).then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});

// Check reminders every 30 seconds (more frequent)
let checkInterval = setInterval(() => {
  checkReminders();
}, 30000);

// Initial check on SW start
console.log("[SW] 🚀 Starting initial check...");
setTimeout(() => {
  checkReminders();
}, 2000);

console.log("[SW] ✅ MedAlert Service Worker v4.0 loaded!");
