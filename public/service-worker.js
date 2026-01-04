/* ===============================
   MedAlert Service Worker
   Maximum Reliability Implementation
================================ */

const DB_NAME = "MedAlertDB";
const DB_VERSION = 1;
const STORE_NAME = "reminders";

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("dateTime", ["date", "time"], { unique: false });
        objectStore.createIndex("triggered", "triggered", { unique: false });
        console.log("✅ IndexedDB object store created");
      }
    };
  });
}

// Save reminders to IndexedDB
async function saveReminders(reminders) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);

    // Clear existing reminders
    await objectStore.clear();

    // Add new reminders
    for (const reminder of reminders) {
      await objectStore.add(reminder);
    }

    console.log("✅ Reminders saved to IndexedDB:", reminders.length);
    return true;
  } catch (error) {
    console.error("❌ Error saving reminders:", error);
    return false;
  }
}

// Get all reminders from IndexedDB
async function getReminders() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("❌ Error getting reminders:", error);
    return [];
  }
}

// Update reminder as triggered
async function markReminderTriggered(id) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.get(id);

    request.onsuccess = () => {
      const reminder = request.result;
      if (reminder) {
        reminder.triggered = true;
        objectStore.put(reminder);
        console.log("✅ Reminder marked as triggered:", id);
      }
    };
  } catch (error) {
    console.error("❌ Error marking reminder:", error);
  }
}

// Check and trigger reminders
async function checkReminders() {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  console.log(`⏰ [${new Date().toLocaleTimeString()}] Checking reminders at ${currentTime}`);

  const reminders = await getReminders();
  console.log(`📋 Found ${reminders.length} total reminders in database`);

  let triggeredCount = 0;

  for (const reminder of reminders) {
    if (!reminder.triggered && reminder.date === currentDate && reminder.time === currentTime) {
      console.log(`🔔 TRIGGERING: ${reminder.medicine} at ${currentTime}`);
      
      // Mark as triggered immediately
      await markReminderTriggered(reminder.id);
      triggeredCount++;

      // Show notification
      try {
        await self.registration.showNotification("⏰ MedAlert Reminder", {
          body: `Time to take ${reminder.medicine}`,
          icon: "/logo192.png",
          badge: "/logo192.png",
          vibrate: [500, 200, 500, 200, 500],
          requireInteraction: true,
          tag: `reminder_${reminder.id}_${currentTime}`,
          silent: false,
          renotify: true,
          actions: [
            { action: "taken", title: "✅ Taken" },
            { action: "snooze", title: "⏰ Snooze 5min" }
          ],
          data: {
            reminderId: reminder.id,
            medicine: reminder.medicine,
            time: currentTime,
            date: currentDate
          }
        });

        console.log("✅ Notification shown successfully");

        // Try to play sound if app is open
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
          clients.forEach(client => {
            client.postMessage({
              type: "PLAY_ALARM",
              medicine: reminder.medicine
            });
          });
          console.log("📱 Sent alarm message to open app");
        }
      } catch (error) {
        console.error("❌ Error showing notification:", error);
      }
    }
  }

  if (triggeredCount > 0) {
    console.log(`✅ Triggered ${triggeredCount} reminder(s)`);
  }
}

// Service Worker Install
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installing...");
  self.skipWaiting();
});

// Service Worker Activate
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated!");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Check reminders immediately on activation
      checkReminders()
    ])
  );
});

// Listen for messages from app
self.addEventListener("message", async (event) => {
  if (event.data?.type === "ADD_REMINDERS") {
    console.log("📝 Received ADD_REMINDERS message");
    const reminders = event.data.payload;
    await saveReminders(reminders);
    
    // Check immediately after adding
    await checkReminders();
    
    // Send confirmation back
    event.ports[0]?.postMessage({ success: true });
  } else if (event.data?.type === "CHECK_NOW") {
    console.log("🔍 Manual check requested");
    await checkReminders();
  }
});

// Periodic check using multiple strategies
let checkInterval = null;

// Strategy 1: setInterval (works when SW is active)
function startPeriodicCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Check every 30 seconds
  checkInterval = setInterval(() => {
    checkReminders();
  }, 30000);
  
  console.log("✅ Periodic check started (30s interval)");
}

// Strategy 2: Wake up on any fetch event
self.addEventListener("fetch", (event) => {
  // Check reminders on any network activity
  event.waitUntil(checkReminders());
});

// Strategy 3: Wake up on push event (even without actual push)
self.addEventListener("push", (event) => {
  console.log("📬 Push event received");
  event.waitUntil(checkReminders());
});

// Strategy 4: Periodic Background Sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-reminders") {
    console.log("🔄 Periodic sync triggered");
    event.waitUntil(checkReminders());
  }
});

// Strategy 5: Wake up when notification is shown/clicked
self.addEventListener("notificationclick", async (event) => {
  const notificationData = event.notification.data;
  event.notification.close();

  if (event.action === "taken") {
    console.log("✅ User marked medicine as taken:", notificationData.medicine);
  } else if (event.action === "snooze") {
    console.log("⏰ User snoozed the reminder:", notificationData.medicine);
    
    // Create a new reminder 5 minutes from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const newDate = now.toISOString().split("T")[0];
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    
    const snoozedReminder = {
      medicine: notificationData.medicine,
      date: newDate,
      time: `${hh}:${mm}`,
      triggered: false
    };
    
    // Add to database
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    await objectStore.add(snoozedReminder);
    
    console.log(`⏰ Snoozed reminder added for ${hh}:${mm}`);
  }

  // Open or focus app
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
  
  // Check for more reminders
  await checkReminders();
});

self.addEventListener("notificationclose", (event) => {
  console.log("❌ User dismissed notification:", event.notification.data?.medicine);
});

// Start periodic checking
startPeriodicCheck();

// Initial check
checkReminders();

console.log("🚀 MedAlert Service Worker ready with multi-strategy reminder system");
