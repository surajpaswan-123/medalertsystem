import React, { useState, useEffect } from "react";
import "./Patient.css";

const STORAGE_KEY = "medalert_allSchedules";

function AutoSchedule() {
  // Request notification permission on load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  // PWA install button logic
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    console.log("User clicked:", choiceResult.outcome);

    setDeferredPrompt(null);
    setShowInstallButton(false);

    // Register periodic background sync after install
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if ("periodicSync" in registration) {
        await registration.periodicSync.register("check-reminders", {
          minInterval: 15 * 60 * 1000, // 15 minutes
        });
        console.log("✅ Periodic sync registered!");
        alert("✅ App installed! Background reminders enabled.");
      } else {
        console.log("⚠️ Periodic sync not supported");
        alert("✅ App installed! (Note: Background sync not supported on this browser)");
      }
    } catch (error) {
      console.log("⚠️ Periodic sync error:", error);
    }
  };

  function normalizeTime(t) {
    if (!t) return "";
    if (t.length === 5) return t;
    if (t.length === 8) return t.slice(0, 5);
    const date = new Date("1970-01-01 " + t);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // STATES
  const [popupReminder, setPopupReminder] = useState(null);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [systemTones] = useState([
    { id: "tone1", label: "Soft Beep", src: "/tone1.mp3" },
    { id: "tone2", label: "Digital Chime", src: "/tone1.mp3" },
    { id: "tone3", label: "Alert Tone", src: "/tone1.mp3" },
  ]);

  const [selectedToneId, setSelectedToneId] = useState("tone1");
  const [customTone, setCustomTone] = useState(null);
  const currentTone = customTone || systemTones.find((t) => t.id === selectedToneId);

  const [scanImage, setScanImage] = useState(null);

  const [form, setForm] = useState({
    medicineName: "",
    numberOfDays: 1,
    startDate: "",
    timesPerDay: 1,
    times: [""],
    imageUrl: null,
  });

  const [allSchedules, setAllSchedules] = useState([]);

  // LOAD STORED DATA
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAllSchedules(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSchedules));
  }, [allSchedules]);

  // AUDIO CONTROLS
  const playTone = () => {
    const audio = document.getElementById("tone-player");
    if (!audio) return;
    audio.muted = false;
    audio.currentTime = 0;

    audio
      .play()
      .then(() => setIsTestPlaying(true))
      .catch(() => {
        alert("Please tap OK to allow sound");
        audio.play();
      });
  };

  // ⏳ SNOOZE – delay reminder by 5 minutes
  const handleSnooze = async () => {
    if (!popupReminder) return;

    // Current time + 5 minutes
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);

    const newDate = now.toISOString().split("T")[0];
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const snoozedReminder = {
      date: newDate,
      time: `${hh}:${mm}`,
      triggered: false,
    };

    // Add new reminder in correct medicine
    const updated = allSchedules.map((med) => {
      if (med.medicineName === popupReminder.medicineName) {
        return {
          ...med,
          reminders: [...med.reminders, snoozedReminder],
        };
      }
      return med;
    });

    setAllSchedules(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also save to Service Worker IndexedDB
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const reminderDateTime = new Date(`${newDate}T${hh}:${mm}`);

      navigator.serviceWorker.controller.postMessage({
        type: "SAVE_REMINDER",
        payload: {
          id: `snooze_${Date.now()}`,
          medicineName: popupReminder.medicineName,
          datetime: reminderDateTime.toISOString(),
          triggered: false,
        },
      });

      console.log("✅ Snoozed reminder saved to Service Worker");
    }

    // Smooth close animation
    setIsClosing(true);
    stopTone();

    setTimeout(() => {
      setPopupReminder(null);
      setIsClosing(false);
    }, 200);
  };

  const stopTone = () => {
    const audio = document.getElementById("tone-player");
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsTestPlaying(false);
  };

  const toggleTestTone = () => {
    if (isTestPlaying) stopTone();
    else playTone();
  };

  // IMAGE HANDLERS
  const handleScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScanImage(url);
    setForm((prev) => ({
      ...prev,
      imageUrl: url,
      medicineName: prev.medicineName || "Scanned Medicine",
    }));
  };

  const handleUploadImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleCustomToneUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomTone({ id: "custom", label: "My Tone", src: url });
  };

  // FORM HANDLING
  const handleTimesPerDay = (e) => {
    const val = parseInt(e.target.value);
    setForm({ ...form, timesPerDay: val, times: Array(val).fill("") });
  };

  const handleTimeInput = (i, val) => {
    const arr = [...form.times];
    arr[i] = val;
    setForm({ ...form, times: arr });
  };

  // Helper function to send message to Service Worker
  const sendToServiceWorker = (message) => {
    return new Promise((resolve, reject) => {
      if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
        reject(new Error("Service Worker not available"));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error || "Unknown error"));
        }
      };

      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
  };

  // ADD SCHEDULE
  const generateSchedule = async () => {
    if (!form.medicineName || !form.startDate) {
      alert("Please fill medicine name and start date");
      return;
    }
    
    if (form.times.includes("")) {
      alert("Please fill all time slots");
      return;
    }

    // Check notification permission
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("⚠️ Please allow notifications to receive reminders!");
        return;
      }
    }

    const reminders = [];
    const start = new Date(form.startDate);

    for (let d = 0; d < form.numberOfDays; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);

      const dateStr = date.toISOString().split("T")[0];

      form.times.forEach((t) => {
        reminders.push({ date: dateStr, time: t, triggered: false });
      });
    }

    const item = {
      id: Date.now(),
      medicineName: form.medicineName,
      imageUrl: form.imageUrl,
      reminders,
    };

    const updated = [...allSchedules, item];
    setAllSchedules(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 🔔 Send ALL reminders to Service Worker IndexedDB
    let savedCount = 0;
    let failedCount = 0;

    for (let d = 0; d < form.numberOfDays; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split("T")[0];

      for (const t of form.times) {
        const reminderDateTime = new Date(`${dateStr}T${t}`);
        const reminderId = `${item.id}_${dateStr}_${t.replace(":", "")}`;

        try {
          await sendToServiceWorker({
            type: "SAVE_REMINDER",
            payload: {
              id: reminderId,
              medicineName: form.medicineName,
              datetime: reminderDateTime.toISOString(),
              triggered: false,
            },
          });
          
          savedCount++;
          console.log(`✅ Saved reminder ${savedCount}:`, reminderId);
          
        } catch (error) {
          failedCount++;
          console.error(`❌ Failed to save reminder:`, error);
        }
      }
    }

    // Trigger immediate check
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CHECK_NOW",
      });
    }

    // Show success message
    if (savedCount > 0) {
      alert(`✅ ${savedCount} reminder(s) saved!\n\nReminders will work even when app is closed.\n\nCheck browser console for Service Worker logs.`);
    } else {
      alert(`⚠️ Failed to save reminders to Service Worker.\n\nPlease check:\n1. Service Worker is registered\n2. Browser console for errors`);
    }

    // Reset form
    setForm({
      medicineName: "",
      numberOfDays: 1,
      startDate: "",
      timesPerDay: form.timesPerDay,
      times: Array(form.timesPerDay).fill(""),
      imageUrl: null,
    });

    setScanImage(null);
  };

  // DELETE MEDICINE
  const deleteMedicine = async (id) => {
    const medicine = allSchedules.find((m) => m.id === id);

    // Delete from localStorage
    const updated = allSchedules.filter((m) => m.id !== id);
    setAllSchedules(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Delete from Service Worker IndexedDB
    if (medicine && navigator.serviceWorker.controller) {
      for (const r of medicine.reminders) {
        const reminderId = `${id}_${r.date}_${r.time.replace(":", "")}`;
        
        try {
          await sendToServiceWorker({
            type: "DELETE_REMINDER",
            payload: reminderId,
          });
          console.log("✅ Deleted reminder from SW:", reminderId);
        } catch (error) {
          console.error("❌ Failed to delete reminder:", error);
        }
      }
    }
  };

  // REMINDER CHECK (for in-app popup when app is open)
  useEffect(() => {
    const it = setInterval(() => {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];

      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hh}:${mm}`;

      allSchedules.forEach((m) =>
        m.reminders.forEach((r) => {
          const reminderTime = normalizeTime(r.time);

          if (r.date === currentDate && reminderTime === currentTime && !r.triggered) {
            r.triggered = true;
            setPopupReminder({
              medicineName: m.medicineName,
              imageUrl: m.imageUrl,
            });
            playTone();
          }
        })
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(it);
  }, [allSchedules]);

  // UI
  return (
    <>
      {showInstallButton && (
        <button
          onClick={handleInstallApp}
          style={{
            padding: "12px 20px",
            backgroundColor: "#4e73df",
            color: "white",
            border: "none",
            borderRadius: "8px",
            marginBottom: "15px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          📲 Install MedAlert App
        </button>
      )}

      {popupReminder && (
        <div className="popup-reminder">
          <div className={"popup-box" + (isClosing ? " closing" : "")}>
            <h3>⏰ Reminder!</h3>

            {popupReminder.imageUrl && (
              <img className="popup-img" src={popupReminder.imageUrl} alt="med" />
            )}

            <p>{popupReminder.medicineName}</p>

            <button
              className="primary-btn"
              onClick={() => {
                setIsClosing(true);
                stopTone();

                setTimeout(() => {
                  setPopupReminder(null);
                  setIsClosing(false);
                }, 200);
              }}
            >
              STOP
            </button>

            <button className="primary-btn snooze-btn" onClick={handleSnooze}>
              ⏳ Snooze 5 min
            </button>
          </div>
        </div>
      )}

      <div className="auto-schedule-box">
        <h2>📷 Medicine Scanner & Reminder</h2>

        {/* TOP SECTION */}
        <div className="top-bar">
          {/* Scan box */}
          <div className="scan-left-rectangle">
            <h3>📷 Scan / Click / Upload</h3>

            <p className="label-small">Click Using Camera</p>
            <input type="file" accept="image/*" capture="environment" onChange={handleScan} />

            <p className="label-small">Upload From Gallery</p>
            <input type="file" accept="image/*" onChange={handleUploadImage} />

            {scanImage && (
              <div className="image-preview scan-preview">
                <img src={scanImage} alt="scan" />
              </div>
            )}
          </div>

          {/* Tone box */}
          <div className="tone-right-box">
            <h4>🔔 Reminder Tone</h4>

            <label className="label-small">Select System Tone</label>
            <select value={selectedToneId} onChange={(e) => setSelectedToneId(e.target.value)}>
              {systemTones.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <label className="label-small">Upload Custom Tone</label>
            <input type="file" accept="audio/*" onChange={handleCustomToneUpload} />

            <button className="primary-btn small-btn" onClick={toggleTestTone}>
              {isTestPlaying ? "⛔ Stop Tone" : "▶ Test Tone"}
            </button>
          </div>
        </div>

        {/* MEDICINE FORM */}
        <div className="form-group">
          <label>Medicine Name</label>
          <input
            name="medicineName"
            value={form.medicineName}
            onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Number of Days</label>
          <input
            type="number"
            name="numberOfDays"
            value={form.numberOfDays}
            onChange={(e) => setForm({ ...form, numberOfDays: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>

        {form.imageUrl && (
          <div className="image-preview small-preview">
            <img src={form.imageUrl} alt="med" />
          </div>
        )}

        <div className="form-group">
          <label>Times per Day</label>
          <select value={form.timesPerDay} onChange={handleTimesPerDay}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} times
              </option>
            ))}
          </select>
        </div>

        <h3>⏰ Select Times</h3>
        {form.times.map((t, i) => (
          <div className="form-group" key={i}>
            <label>Time {i + 1}</label>
            <input type="time" value={t} onChange={(e) => handleTimeInput(i, e.target.value)} />
          </div>
        ))}

        <button className="primary-btn" onClick={generateSchedule}>
          ➕ Add Schedule
        </button>

        {/* MEDICINE LIST */}
        {allSchedules.length > 0 && (
          <div className="medicines-list">
            <h3>🗂️ All Medicines</h3>
            {allSchedules.map((m) => (
              <div key={m.id} className="medicine-item">
                <h4>{m.medicineName}</h4>

                {m.imageUrl && (
                  <div className="medicine-thumb">
                    <img src={m.imageUrl} alt={m.medicineName} />
                  </div>
                )}

                <button className="delete-btn" onClick={() => deleteMedicine(m.id)}>
                  ❌ Remove
                </button>

                <div className="reminder-table">
                  {m.reminders.map((r, idx) => (
                    <div key={idx} className="reminder-row">
                      <span>{r.date}</span>
                      <span>{r.time}</span>
                      <span>{r.triggered ? "✅" : "⏰"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <audio id="tone-player" src={currentTone?.src} preload="auto" />
      </div>
    </>
  );
}

export default AutoSchedule;
