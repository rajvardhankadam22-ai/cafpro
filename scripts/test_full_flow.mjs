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

console.log('--- Verifying Realtime State Across Firestore Collections ---');

const vendorsSnap = await getDocs(collection(db, 'vendors'));
console.log(`\n🏢 Active Registered Vendors (${vendorsSnap.docs.length}):`);
vendorsSnap.docs.forEach(d => console.log(`  - [ID: ${d.id}] Name: ${d.data().name} | City: ${d.data().city || 'N/A'}`));

const appsSnap = await getDocs(collection(db, 'supplier_applications'));
console.log(`\n📬 Submitted Supplier Proposals (${appsSnap.docs.length}):`);
appsSnap.docs.forEach(d => console.log(`  - [ID: ${d.id}] Company: ${d.data().companyName} | Status: ${d.data().status} | Quoted: ${d.data().quotedItems?.length || 0} items`));

const posSnap = await getDocs(collection(db, 'purchase_orders'));
console.log(`\n📦 Purchase Orders in Firestore (${posSnap.docs.length}):`);
posSnap.docs.forEach(d => console.log(`  - [PO: ${d.data().poNumber}] Supplier: ${d.data().supplierName} | Status: ${d.data().status} | Total: ₹${d.data().totalAmount}`));
