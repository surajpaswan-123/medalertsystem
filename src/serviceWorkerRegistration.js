// Enhanced PWA Service Worker Registration for MedAlert

export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          console.log("✅ Service Worker registered successfully:", reg);
          
          // Check for updates every 60 seconds
          setInterval(() => {
            reg.update();
          }, 60000);

          // Listen for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            console.log("🔄 New Service Worker found, installing...");

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("✅ New Service Worker installed, refresh to activate");
              }
            });
          });
        })
        .catch((err) => {
          console.error("❌ Service Worker registration failed:", err);
        });
    });
  } else {
    console.warn("⚠️ Service Workers not supported in this browser");
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log("✅ Service Worker unregistered");
      })
      .catch((error) => {
        console.error("❌ Error unregistering Service Worker:", error);
      });
  }
}
