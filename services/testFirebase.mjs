import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function testConnection() {
  console.log("Testing Firebase connection to project:", firebaseConfig.projectId);
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Checking Firestore access...");
    const snapshot = await getDocs(collection(db, 'categories'));
    console.log("SUCCESS! Firestore is connected.");
    console.log("Documents in 'categories' collection:", snapshot.size);
    snapshot.forEach(doc => {
      console.log(" - Category:", doc.id, "=>", doc.data().name || doc.data());
    });
  } catch (error) {
    console.error("Firestore test encountered an issue:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
  }
}

testConnection();
