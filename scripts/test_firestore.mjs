import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

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

console.log('Testing Firestore connection to project:', firebaseConfig.projectId);

try {
  const testDocRef = doc(db, 'system_health', 'test_ping');
  await setDoc(testDocRef, { status: 'ONLINE', pingAt: new Date().toISOString() });
  console.log('✅ Write to Firestore SUCCESSFUL!');

  const snapshot = await getDocs(collection(db, 'system_health'));
  console.log('✅ Read from Firestore SUCCESSFUL! Found docs count:', snapshot.docs.length);
} catch (err) {
  console.error('❌ Firestore Error Code:', err.code);
  console.error('❌ Firestore Error Message:', err.message);
}
