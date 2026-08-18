import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { INITIAL_INVENTORY_ITEMS } from './seedData.js';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function syncAllFirestoreDocs() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log("=== SYNCHRONIZING ALL FIRESTORE INVENTORY DOCUMENTS ===");
  const activeUserId = "d0bd9Ov07OQ6Ih7XodXhLzEkYQl2";

  for (const item of INITIAL_INVENTORY_ITEMS) {
    const rawId = item.id;
    const userPrefixedId = `${activeUserId}_${item.id}`;

    const docPayload = {
      ...item,
      updatedAt: serverTimestamp(),
    };

    // Update raw doc ID
    await setDoc(doc(db, 'inventory_items', rawId), {
      ...docPayload,
      userId: activeUserId,
    }, { merge: true });

    // Update user-prefixed doc ID
    await setDoc(doc(db, 'inventory_items', userPrefixedId), {
      ...docPayload,
      userId: activeUserId,
    }, { merge: true });

    console.log(`✓ Synchronized item: [${item.sku}] "${item.name}" -> Qty: ${item.quantity} ${item.unit}`);
  }

  console.log("=== ALL FIRESTORE INVENTORY DOCUMENTS SYNCHRONIZED! ===");
}

syncAllFirestoreDocs();
