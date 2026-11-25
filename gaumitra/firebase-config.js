// Firebase Configuration for Gaumitra
// Paste your Firebase web app configuration below from Firebase Console:
// (Firebase Console -> Project Settings -> General -> Your apps -> Web app -> Config)
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if user saved a custom config via the Admin UI Settings
(function() {
  try {
    const saved = localStorage.getItem("gm_firebase_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId && parsed.projectId !== "YOUR_PROJECT_ID") {
        window.FIREBASE_CONFIG = parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read saved Firebase config:", e);
  }
})();

