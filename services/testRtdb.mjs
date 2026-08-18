import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK",
  databaseURL: "https://caf247-73960-default-rtdb.firebaseio.com",
};

async function testRtdb() {
  console.log("Testing Firebase Realtime Database...");
  try {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const testRef = ref(db, 'ping');
    await set(testRef, { status: "online", timestamp: Date.now() });
    console.log("RTDB WRITE SUCCESSFUL!");
    const snap = await get(testRef);
    console.log("RTDB READ:", snap.val());
  } catch (err) {
    console.error("RTDB error:", err.message);
  }
}

testRtdb();
