import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function testAuth() {
  console.log("Testing Firebase Auth for project:", firebaseConfig.projectId);
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    console.log("Firebase Auth instance initialized successfully:", auth.name);
  } catch (err) {
    console.error("Auth error:", err.message);
  }
}

testAuth();
