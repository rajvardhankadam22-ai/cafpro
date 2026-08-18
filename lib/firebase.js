import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  memoryLocalCache,
  getFirestore,
  setLogLevel,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

try {
  setLogLevel('silent');
} catch (e) {}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "caf247-73960.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "caf247-73960",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "caf247-73960.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "486109709317",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-RRMTQ1L5QK",
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your_api_key_here' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'your_project_id'
  );
};

let app = null;
let db = null;
let auth = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  try {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } catch (e) {
    try {
      db = getFirestore(app);
    } catch (err) {}
  }
  try {
    auth = getAuth(app);
  } catch (e) {}
} catch (error) {
  console.warn('Firebase core initialization notice:', error.message);
}

export { app, db, auth, firebaseConfig };
export default firebaseConfig;
