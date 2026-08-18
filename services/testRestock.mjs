import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function testRestock() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const docId = "d0bd9Ov07OQ6Ih7XodXhLzEkYQl2_item-8";
  console.log("Restocking item in Firestore:", docId);
  
  await updateDoc(doc(db, 'inventory_items', docId), {
    quantity: 24,
    updatedAt: new Date().toISOString()
  });

  const snap = await getDoc(doc(db, 'inventory_items', docId));
  console.log("Updated Doc in Firestore:", snap.id, "=> Qty:", snap.data().quantity);
}

testRestock();
