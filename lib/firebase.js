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

// Centralized Firebase configuration loaded strictly from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
    firebaseConfig.apiKey !== 'your_api_key_here' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'your_project_id'
  );
};

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured()) {
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
}

export { app, db, auth, firebaseConfig };
export default firebaseConfig;
