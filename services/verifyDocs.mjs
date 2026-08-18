import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function verifyDocs() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const doc1 = await getDoc(doc(db, 'inventory_items', 'item-8'));
  const doc2 = await getDoc(doc(db, 'inventory_items', 'd0bd9Ov07OQ6Ih7XodXhLzEkYQl2_item-8'));

  console.log("item-8 in Firestore => Qty:", doc1.exists() ? doc1.data().quantity : "not found");
  console.log("d0bd9Ov07OQ6Ih7XodXhLzEkYQl2_item-8 => Qty:", doc2.exists() ? doc2.data().quantity : "not found");
}

verifyDocs();
