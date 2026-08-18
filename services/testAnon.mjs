import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function testAnon() {
  console.log("Testing Anonymous Auth for:", firebaseConfig.projectId);
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const cred = await signInAnonymously(auth);
    console.log("Anonymous Auth SUCCESS! UID:", cred.user.uid);
  } catch (err) {
    console.log("Anon auth notice:", err.code, "-", err.message);
  }
}

testAnon();
