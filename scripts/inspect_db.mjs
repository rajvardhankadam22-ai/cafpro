import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from './firebaseClient.mjs';
import { INITIAL_CATEGORIES } from '../services/seedData.js';

console.log('--- Testing Writes to All Collections ---');

const testUid = 'N5xIZvNiHSewIeGCtx1s9M9NUeY2'; // The real user UID from inspect_db

// 1. Categories
console.log('1. Testing category write...');
try {
  for (const cat of INITIAL_CATEGORIES) {
    const docId = `${testUid}_${cat.id}`;
    await setDoc(doc(db, 'categories', docId), {
      ...cat,
      id: cat.id,
      originalId: cat.id,
      userId: testUid,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log('✅ Categories write SUCCESS!');
} catch (e) {
  console.error('❌ Categories write FAILED:', e);
}

// 2. Query categories
try {
  const q = query(collection(db, 'categories'), where('userId', '==', testUid));
  const snap = await getDocs(q);
  console.log('✅ Categories query returned:', snap.docs.length, 'docs');
} catch (e) {
  console.error('❌ Categories query FAILED:', e);
}



