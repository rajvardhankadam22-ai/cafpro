import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const envPath = resolve(rootDir, '.env.local');

// 1. Load environment variables from .env.local
if (typeof process.loadEnvFile === 'function' && existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch (e) {}
} else if (existsSync(envPath)) {
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        const k = key.trim();
        const v = vals.join('=').trim().replace(/^["']|["']$/g, '');
        if (k && !process.env[k]) {
          process.env[k] = v;
        }
      }
    });
  } catch (e) {}
}

// 2. Centralized Firebase configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('⚠️ Warning: Firebase environment variables are missing. Please check .env.local.');
}

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = firebaseConfig.databaseURL ? getDatabase(app) : null;

export default firebaseConfig;
