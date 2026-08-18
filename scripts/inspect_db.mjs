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

console.log('--- Inspecting Firestore Collections ---');

const vendorsSnap = await getDocs(collection(db, 'vendors'));
console.log('Vendors in Firestore count:', vendorsSnap.docs.length);
vendorsSnap.docs.forEach(d => {
  console.log('Vendor:', d.id, d.data().name, 'userId:', d.data().userId);
});

const appsSnap = await getDocs(collection(db, 'supplier_applications'));
console.log('\nSupplier Applications in Firestore count:', appsSnap.docs.length);
appsSnap.docs.forEach(d => {
  console.log('Application:', d.id, d.data().companyName, 'userId:', d.data().userId, 'status:', d.data().status);
});
