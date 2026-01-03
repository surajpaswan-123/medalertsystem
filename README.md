# 💊 MedAlert System - Medicine Reminder PWA

**Never miss your medicine again!** MedAlert is a Progressive Web App (PWA) that sends reliable alarm notifications for your medicine schedule, even when your phone is locked or the app is closed.

## 🚀 Features

- ✅ **Reliable Alarms** - Works even when app is closed or phone is locked
- 📱 **PWA Support** - Install as native app on any device
- 🔔 **Background Notifications** - Service Worker powered reminders
- ⏰ **Snooze Function** - Delay reminders by 5 minutes
- 📷 **Medicine Scanner** - Upload or scan medicine images
- 🎵 **Custom Tones** - Choose system tones or upload your own
- 📅 **Multi-day Scheduling** - Set reminders for multiple days
- 💾 **Offline Support** - Works without internet connection

## ⚠️ Important: App Close Behavior

### ✅ What Works When App is Closed:
- **Browser Notification** - 100% reliable
- **System Notification Sound** - Your phone's default notification sound
- **Vibration** - Strong vibration pattern
- **Snooze Button** - Works from notification

### ❌ What Doesn't Work When App is Closed:
- **Custom Alarm Sound** - Browser security prevents background audio
- **In-App Popup** - Only works when app is open

**📖 For detailed explanation, see [APP_CLOSE_BEHAVIOR.md](./APP_CLOSE_BEHAVIOR.md)**

**💡 Recommendation:** Keep browser open in background (minimized) for best experience. For critical reminders, keep app open.

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/surajpaswan-123/medalertsystem.git

# Navigate to project directory
cd medalertsystem

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🧪 Testing Alarm Functionality

### Quick Test (2-3 minutes):

1. **Open the app** in your browser
2. **Open Browser Console** (F12) to see logs
3. **Check Service Worker**:
   - Go to **Application** tab → **Service Workers**
   - You should see `service-worker.js` as **activated and running**
4. **Create a test reminder**:
   - Fill in medicine name (e.g., "Test Medicine")
   - Set start date to **today**
   - Set time to **2-3 minutes from now**
   - Click "Add Schedule"
5. **Watch Console Logs**:
   ```
   ✅ Service Worker registered
   📝 Reminders received in Service Worker
   ⏰ Checking reminders at HH:MM
   🔔 Triggering reminder for Test Medicine
   ```
6. **Wait for alarm** - You'll get:
   - Browser notification
   - Popup with medicine details (if app is open)
   - Alarm sound playing (if app is open)
   - System notification sound (if app is closed)

### Testing Background Alarms:

1. Set a reminder 5 minutes from now
2. **Minimize the browser** (don't close completely)
3. Wait for the scheduled time
4. You should receive:
   - **Browser notification** with medicine name
   - **System notification sound**
   - **Vibration** (on mobile)
5. Click notification to open the app

### Common Issues & Solutions:

#### ❌ Alarm not ringing?

**Check these:**

1. **Notification Permission**:
   - Browser should ask for notification permission
   - Check browser settings → Site Settings → Notifications
   - Make sure notifications are **allowed**

2. **Service Worker Status**:
   - Open Console (F12)
   - Check for `✅ Service Worker registered` message
   - Go to Application → Service Workers
   - Status should be **activated and running**

3. **Browser Cache**:
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard reload (Ctrl+Shift+R)
   - Unregister old service worker and refresh

4. **Time Format**:
   - Make sure you're using 24-hour format
   - Time should be at least 2-3 minutes in future

5. **Console Logs**:
   - Keep console open to see what's happening
   - Look for error messages in red

6. **Browser Must Be Open**:
   - Browser should be running (can be minimized)
   - If browser is completely closed, notifications won't work

#### 🔧 Force Service Worker Update:

```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  location.reload();
});
```

## 📱 PWA Installation

### On Desktop (Chrome/Edge):
1. Click the **Install** button in address bar
2. Or click the install popup when it appears

### On Mobile (Android):
1. Open in Chrome
2. Tap menu (⋮) → **Add to Home Screen**
3. App will work like a native app

### On iOS (Safari):
1. Tap Share button
2. Scroll and tap **Add to Home Screen**

## 🔔 How It Works

### Dual Alarm System:

1. **In-App Alarm** (when app is open):
   - Checks every 30 seconds
   - Shows popup with medicine image
   - Plays custom alarm sound
   - Snooze functionality

2. **Service Worker Alarm** (background):
   - Checks every 15 seconds
   - Sends browser notifications
   - Plays system notification sound
   - Works when app is minimized

### What You Get in Different Scenarios:

| Scenario | Notification | Custom Sound | System Sound | Vibration | Popup |
|----------|-------------|--------------|--------------|-----------|-------|
| App Open | ✅ | ✅ | ✅ | ✅ | ✅ |
| App Minimized | ✅ | ❌ | ✅ | ✅ | ❌ |
| App Closed (Browser Open) | ✅ | ❌ | ✅ | ✅ | ❌ |
| Browser Closed | ❌ | ❌ | ❌ | ❌ | ❌ |

### Architecture:

```
User Creates Schedule
        ↓
Saved to LocalStorage
        ↓
Sent to Service Worker
        ↓
Service Worker checks every 15s
        ↓
Triggers notification at scheduled time
        ↓
System sound plays (always)
Custom sound plays (only if app open)
```

## 🐛 Debugging

### Enable Verbose Logging:

All important events are logged to console:
- ✅ Service Worker registration
- 📝 Reminders received
- ⏰ Time checks
- 🔔 Alarm triggers
- 📱 App open/close status

### Check Service Worker:

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Active Service Workers:', regs);
});
```

### View Stored Reminders:

```javascript
// In browser console
console.log(JSON.parse(localStorage.getItem('medalert_allSchedules')));
```

## 📋 Requirements

- Modern browser with Service Worker support (Chrome, Firefox, Edge, Safari)
- Notification permissions enabled
- JavaScript enabled
- Browser must be running (can be minimized)

## 💡 Best Practices

### For Reliable Alarms:
1. ✅ **Install as PWA** for better background support
2. ✅ **Keep browser open** (minimized is fine)
3. ✅ **Allow notifications** when prompted
4. ✅ **Enable system notification sound** in phone settings
5. ✅ **Disable Do Not Disturb** mode during medicine time
6. ✅ **For critical reminders**, keep app open

### For Custom Alarm Sound:
- Keep the app tab open (can minimize browser)
- Don't close the tab completely
- Or install as PWA and keep it running

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Developer

Created by [Suraj Paswan](https://github.com/surajpaswan-123)

## 🆘 Support

If alarms still don't work after following all steps:
1. Check browser console for errors
2. Try in incognito/private mode
3. Test in different browser (Chrome recommended)
4. Make sure system notifications are enabled
5. Verify browser is running in background
6. Read [APP_CLOSE_BEHAVIOR.md](./APP_CLOSE_BEHAVIOR.md) for detailed explanation

## 📚 Additional Documentation

- [ALARM_FIX_SUMMARY.md](./ALARM_FIX_SUMMARY.md) - Technical details of alarm fixes
- [APP_CLOSE_BEHAVIOR.md](./APP_CLOSE_BEHAVIOR.md) - Detailed explanation of app behavior when closed

---

**Made with ❤️ for better health management**
