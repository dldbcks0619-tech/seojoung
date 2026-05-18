const firebaseConfig = {
  apiKey: "AIzaSyD_pnUsyKu8-a4EyjmUshhWayX2PLb0g5U",
  authDomain: "seojoung.firebaseapp.com",
  databaseURL: "https://seojoung-default-rtdb.firebaseio.com",
  projectId: "seojoung",
  storageBucket: "seojoung.firebasestorage.app",
  messagingSenderId: "166988130755",
  appId: "1:166988130755:web:002ee78a11979a17b37576",
  measurementId: "G-FPCFRPED59"
};

// Initialize Firebase
let db = null;
let storage = null;
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        if (firebase.storage) {
            storage = firebase.storage();
        }
        console.log("Firebase Connected Successfully");
    } else {
        console.warn("Firebase config not set. Using LocalStorage fallback.");
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

window.db = db;
window.storage = storage;
