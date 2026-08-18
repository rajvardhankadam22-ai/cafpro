import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

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

console.log('--- Cleaning Old Demo POs from Firestore ---');
const posSnap = await getDocs(collection(db, 'purchase_orders'));
for (const d of posSnap.docs) {
  const sName = d.data().supplierName || '';
  if (
    sName.includes('Gourmet') ||
    sName.includes('Artisan') ||
    sName.includes('Western Ghats') ||
    sName.includes('Amul') ||
    sName.includes('Monin') ||
    sName.includes('Urban Cold') ||
    sName.includes('Country Dairy')
  ) {
    console.log('Deleting old PO:', d.id, 'Supplier:', sName);
    await deleteDoc(doc(db, 'purchase_orders', d.id));
  }
}

console.log('✅ Cleaned old demo POs from Firestore!');
