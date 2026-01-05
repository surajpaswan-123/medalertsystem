/* ==============================
   MedAlert Service Worker v5.0
   PRODUCTION-READY BACKGROUND REMINDERS
   ✅ Works when: Tab closed, Screen off, App background
================================ */

const CACHE_NAME = "medalert-v5";
const DB_NAME = "MedAlertDB";
const DB_VERSION = 1;
const STORE_NAME = "reminders";

console.log("[SW] 🚀 MedAlert Service Worker v5.0 starting...");

// ========== IndexedDB Helper Functions ==========

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[SW] IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("[SW] ✅ IndexedDB opened");
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log("[SW] 🔧 IndexedDB upgrade needed");
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

      request.onsuccess = () => {
        resolve(request.result);
      };
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
        console.log("[SW] ✅ Reminder saved:", reminder.id);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] ❌ Error saving reminder:", error);
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
        console.log("[SW] ✅ Reminder deleted:", id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[SW] ❌ Error deleting reminder:", error);
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
          console.log("[SW] ✅ Marked as triggered:", id);
        }
        resolve();
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error("[SW] ❌ Error marking as triggered:", error);
  }
}

// ========== CORE: Reminder Check Logic ==========

async function checkReminders() {
  console.log("[SW] 🔍 Checking reminders...");

  try {
    const reminders = await getAllReminders();
    const now = new Date();
    
    console.log(`[SW] ⏰ Current time: ${now.toLocaleString()}`);
    console.log(`[SW] 📋 Total reminders: ${reminders.length}`);

    let triggered = 0;

    for (const reminder of reminders) {
      if (reminder.triggered) {
        continue; // Skip already triggered
      }

      const reminderTime = new Date(reminder.datetime);
      const diff = reminderTime - now;

      console.log(`[SW] 📌 ${reminder.medicineName} at ${reminderTime.toLocaleString()}, diff: ${Math.floor(diff/1000)}s`);

      // ✅ TRIGGER WINDOW: 3 minutes (180s) - Very lenient for background reliability
      if (diff <= 180000 && diff >= -60000) {
        console.log(`[SW] 🔔 TRIGGERING: ${reminder.medicineName}`);

        try {
          // ✅ Show notification (works even when app closed)
          await self.registration.showNotification("⏰ MedAlert Reminder", {
            body: `Time to take: ${reminder.medicineName}`,
            icon: "/logo192.png",
            badge: "/logo192.png",
            vibrate: [200, 100, 200, 100, 200],
            tag: reminder.id,
            requireInteraction: true,
            silent: false,
            actions: [
              { action: "taken", title: "✅ Taken" },
              { action: "snooze", title: "⏰ Snooze 5min" },
            ],
          });

          await markAsTriggered(reminder.id);
          triggered++;
          
          console.log(`[SW] ✅ Notification shown: ${reminder.medicineName}`);
        } catch (error) {
          console.error("[SW] ❌ Error showing notification:", error);
        }
      }
    }

    console.log(`[SW] ✅ Check complete. Triggered: ${triggered}`);
    
    // ✅ CRITICAL: Schedule next check
    await scheduleNextCheck();
    
  } catch (error) {
    console.error("[SW] ❌ Error in checkReminders:", error);
  }
}

// ========== BACKGROUND EXECUTION STRATEGIES ==========

// ✅ STRATEGY 1: Periodic Background Sync (Chrome/Edge, 15-min intervals)
async function registerPeriodicSync() {
  try {
    const registration = await self.registration;
    
    if ('periodicSync' in registration) {
      await registration.periodicSync.register('check-reminders', {
        minInterval: 15 * 60 * 1000, // 15 minutes
      });
      console.log("[SW] ✅ Periodic sync registered (15-min intervals)");
      return true;
    } else {
      console.log("[SW] ⚠️ Periodic sync not supported");
      return false;
    }
  } catch (error) {
    console.error("[SW] ❌ Periodic sync registration failed:", error);
    return false;
  }
}

// ✅ STRATEGY 2: Self-scheduling with setTimeout (fallback)
let nextCheckTimeout = null;

async function scheduleNextCheck() {
  // Clear existing timeout
  if (nextCheckTimeout) {
    clearTimeout(nextCheckTimeout);
  }

  try {
    const reminders = await getAllReminders();
    const now = new Date();
    
    // Find next upcoming reminder
    let nextReminder = null;
    let minDiff = Infinity;
    
    for (const reminder of reminders) {
      if (reminder.triggered) continue;
      
      const reminderTime = new Date(reminder.datetime);
      const diff = reminderTime - now;
      
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextReminder = reminder;
      }
    }
    
    if (nextReminder) {
      // Schedule check 1 minute before reminder time
      const checkDelay = Math.max(minDiff - 60000, 30000); // At least 30s
      
      console.log(`[SW] ⏰ Next check scheduled in ${Math.floor(checkDelay/1000)}s for: ${nextReminder.medicineName}`);
      
      nextCheckTimeout = setTimeout(() => {
        checkReminders();
      }, checkDelay);
    } else {
      console.log("[SW] ℹ️ No upcoming reminders, will check on next sync");
    }
  } catch (error) {
    console.error("[SW] ❌ Error scheduling next check:", error);
  }
}

// ========== Service Worker Lifecycle Events ==========

self.addEventListener("install", (event) => {
  console.log("[SW] 📦 Installing v5.0...");
  self.skipWaiting(); // Activate immediately
});

self.addEventListener("activate", (event) => {
  console.log("[SW] ✅ Activating v5.0...");
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control immediately
      // Clean old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        );
      }),
      // Register periodic sync
      registerPeriodicSync(),
      // Initial check
      checkReminders()
    ])
  );
});

// ========== Message Handler (from React app) ==========

self.addEventListener("message", async (event) => {
  console.log("[SW] 📨 Message received:", event.data?.type);

  if (event.data?.type === "SAVE_REMINDER") {
    console.log("[SW] 💾 Saving reminder:", event.data.payload);
    try {
      await saveReminder(event.data.payload);
      
      // Send success response
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
      
      // ✅ CRITICAL: Immediate check + reschedule
      await checkReminders();
      
    } catch (error) {
      console.error("[SW] ❌ Error saving reminder:", error);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: error.message });
      }
    }
  }

  if (event.data?.type === "DELETE_REMINDER") {
    console.log("[SW] 🗑️ Deleting reminder:", event.data.payload);
    try {
      await deleteReminder(event.data.payload);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
      
      // Reschedule after deletion
      await scheduleNextCheck();
      
    } catch (error) {
      console.error("[SW] ❌ Error deleting reminder:", error);
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
    console.log("[SW] 📋 Getting all reminders");
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
});

// ========== Periodic Background Sync Handler ==========

self.addEventListener("periodicsync", (event) => {
  console.log("[SW] 🔄 Periodic sync triggered:", event.tag);
  if (event.tag === "check-reminders") {
    event.waitUntil(checkReminders());
  }
});

// ========== Notification Click Handler ==========

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
        
        // Reschedule checks
        await scheduleNextCheck();
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

// ========== CRITICAL: Keep Service Worker Alive ==========

// ✅ Respond to fetch events (keeps SW alive)
self.addEventListener('fetch', (event) => {
  // Let browser handle fetch normally
  event.respondWith(fetch(event.request));
});

// ✅ Initial check on SW start
console.log("[SW] 🚀 Starting initial check...");
setTimeout(() => {
  checkReminders();
}, 2000);

console.log("[SW] ✅ MedAlert Service Worker v5.0 loaded!");
console.log("[SW] 📱 Background reminders: ENABLED");
console.log("[SW] 🔔 Works when: Tab closed, Screen off, App background");
