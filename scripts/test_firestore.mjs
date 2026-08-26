import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from './firebaseClient.mjs';

console.log('Testing Firestore connection to project:', firebaseConfig.projectId);

try {
  const testDocRef = doc(db, 'system_health', 'test_ping');
  await setDoc(testDocRef, { status: 'ONLINE', pingAt: new Date().toISOString() });
  console.log('✅ Write to Firestore SUCCESSFUL!');

  const snapshot = await getDocs(collection(db, 'system_health'));
  console.log('✅ Read from Firestore SUCCESSFUL! Found docs count:', snapshot.docs.length);
} catch (err) {
  console.error('❌ Firestore Error Code:', err.code);
  console.error('❌ Firestore Error Message:', err.message);
}
