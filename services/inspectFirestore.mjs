import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function inspectFirestore() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log("=== INSPECTING FIRESTORE INVENTORY_ITEMS ===");
  const snap = await getDocs(collection(db, 'inventory_items'));
  console.log(`Found ${snap.size} documents:`);
  
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`Doc ID: "${doc.id}" | Name: "${data.name}" | Qty: ${data.quantity} | SKU: ${data.sku} | userId: "${data.userId}"`);
  });
}

inspectFirestore();
