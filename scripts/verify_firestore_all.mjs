import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('=== VERIFYING CLOUD FIRESTORE COLLECTIONS ===');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Database Engine: Cloud Firestore (firebase/firestore)\n');

const collectionsToVerify = [
  'inventory_items',
  'categories',
  'purchase_orders',
  'vendors',
  'staff_members',
  'supplier_applications',
  'activity_logs',
];

for (const colName of collectionsToVerify) {
  try {
    const snap = await getDocs(collection(db, colName));
    console.log(`✅ [Firestore Collection: ${colName.padEnd(23)}] Total Documents: ${snap.docs.length}`);
  } catch (err) {
    console.error(`❌ [Firestore Collection: ${colName}] Error:`, err.message);
  }
}
