import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';
import { INITIAL_CATEGORIES, INITIAL_INVENTORY_ITEMS } from './seedData.js';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK",
  databaseURL: "https://caf247-73960-default-rtdb.firebaseio.com"
};

async function pushToLiveFirebase() {
  console.log("Connecting to Firebase project:", firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);
  
  // 1. Try Firestore Push
  console.log("Pushing to Cloud Firestore...");
  try {
    const db = getFirestore(app);
    for (const cat of INITIAL_CATEGORIES) {
      await setDoc(doc(db, 'categories', cat.id), {
        ...cat,
        createdAt: serverTimestamp()
      });
      console.log(" - Wrote Firestore Category:", cat.name);
    }
    for (const item of INITIAL_INVENTORY_ITEMS) {
      await setDoc(doc(db, 'inventory_items', item.id), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(" - Wrote Firestore Item:", item.name);
    }
    console.log(">>> Cloud Firestore Push COMPLETE! <<<");
  } catch (err) {
    console.warn("Firestore push notice:", err.message);
  }

  // 2. Try Realtime Database Push
  console.log("Pushing to Firebase Realtime Database...");
  try {
    const rtdb = getDatabase(app);
    const catObj = {};
    INITIAL_CATEGORIES.forEach(c => catObj[c.id] = c);
    await set(ref(rtdb, 'categories'), catObj);
    console.log(" - Wrote RTDB Categories");

    const itemObj = {};
    INITIAL_INVENTORY_ITEMS.forEach(i => itemObj[i.id] = i);
    await set(ref(rtdb, 'inventory_items'), itemObj);
    console.log(" - Wrote RTDB Inventory Items");

    console.log(">>> Firebase Realtime Database Push COMPLETE! <<<");
  } catch (err) {
    console.warn("RTDB push notice:", err.message);
  }
}

pushToLiveFirebase();
