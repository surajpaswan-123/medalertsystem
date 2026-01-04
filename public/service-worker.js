/* ==============================
   MedAlert Service Worker v3.0
   Background Reminders with IndexedDB
   Works even when app is closed!
================================ */

const DB_NAME = "MedAlertDB";
const DB_VERSION = 1;
const STORE_NAME = "reminders";

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
      }
    };
  });
}

async function getAllReminders() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveReminder(reminder) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(reminder);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteReminder(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function markAsTriggered(id) {
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
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ========== Reminder Check Logic ==========

async function checkReminders() {
  console.log("[SW] Checking reminders...");

  try {
    const reminders = await getAllReminders();
    const now = new Date();

    for (const reminder of reminders) {
      if (reminder.triggered) continue;

      const reminderTime = new Date(reminder.datetime);
      const diff = reminderTime - now;

      // Trigger if within 1 minute window
      if (diff <= 60000 && diff >= -60000) {
        console.log("[SW] Triggering reminder:", reminder.medicineName);

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
      }
    }
  } catch (error) {
    console.error("[SW] Error checking reminders:", error);
  }
}

// ========== Service Worker Events ==========

self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(self.clients.claim());
});

// Receive reminders from React
self.addEventListener("message", async (event) => {
  if (event.data?.type === "SAVE_REMINDER") {
    console.log("[SW] Saving reminder:", event.data.payload);
    try {
      await saveReminder(event.data.payload);
      event.ports[0]?.postMessage({ success: true });
    } catch (error) {
      console.error("[SW] Error saving reminder:", error);
      event.ports[0]?.postMessage({ success: false, error: error.message });
    }
  }

  if (event.data?.type === "DELETE_REMINDER") {
    console.log("[SW] Deleting reminder:", event.data.payload);
    try {
      await deleteReminder(event.data.payload);
      event.ports[0]?.postMessage({ success: true });
    } catch (error) {
      console.error("[SW] Error deleting reminder:", error);
      event.ports[0]?.postMessage({ success: false, error: error.message });
    }
  }

  if (event.data?.type === "CHECK_NOW") {
    console.log("[SW] Manual check triggered");
    await checkReminders();
  }
});

// Periodic Background Sync (checks every 15 minutes when app is closed)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-reminders") {
    console.log("[SW] Periodic sync triggered");
    event.waitUntil(checkReminders());
  }
});

// Notification click handler
self.addEventListener("notificationclick", async (event) => {
  event.notification.close();

  if (event.action === "taken") {
    console.log("[SW] Reminder marked as taken");
    // Already marked as triggered
  } else if (event.action === "snooze") {
    console.log("[SW] Snoozing reminder");
    // Create new reminder 5 minutes from now
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
    }
  } else {
    // Open app
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});

// Check reminders every 1 minute (when SW is active)
setInterval(() => {
  checkReminders();
}, 60000);

// Initial check on SW start
checkReminders();

console.log("[SW] MedAlert Service Worker v3.0 loaded!");
