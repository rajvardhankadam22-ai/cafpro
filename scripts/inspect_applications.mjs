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

const appsSnap = await getDocs(collection(db, 'supplier_applications'));
console.log('Total Applications:', appsSnap.docs.length);
appsSnap.docs.forEach(doc => {
  console.log('\n--- Application Doc ID:', doc.id, '---');
  console.log(JSON.stringify(doc.data(), null, 2));
});
