import { db } from './firebaseClient.mjs';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

function getDocTimestamp(docData) {
  if (!docData) return 0;
  const ts = docData.updatedAt || docData.createdAt || docData.timestamp;
  if (!ts) return 0;
  if (typeof ts === 'object' && typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + (ts.nanoseconds ? ts.nanoseconds / 1000000 : 0);
  }
  if (typeof ts === 'string') {
    const parsed = new Date(ts).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof ts === 'number') return ts;
  return 0;
}

async function cleanupCollection(colName, prefixPatterns) {
  console.log(`\n--- Cleaning collection: ${colName} ---`);
  const snap = await getDocs(collection(db, colName));
  console.log(`Total documents in ${colName}: ${snap.size}`);

  const allDocs = snap.docs.map((d) => ({
    docId: d.id,
    data: d.data(),
    ref: d.ref,
  }));

  // Group by canonical ID
  const grouped = new Map();

  for (const item of allDocs) {
    const rawId = item.docId;
    let canonicalId = item.data.id || rawId;
    for (const pattern of prefixPatterns) {
      if (canonicalId.includes(pattern)) {
        canonicalId = canonicalId.substring(canonicalId.indexOf(pattern));
      } else if (rawId.includes(pattern)) {
        canonicalId = rawId.substring(rawId.indexOf(pattern));
      }
    }

    if (!grouped.has(canonicalId)) {
      grouped.set(canonicalId, []);
    }
    grouped.get(canonicalId).push(item);
  }

  let migratedCount = 0;
  let deletedDuplicatesCount = 0;

  for (const [canonicalId, docList] of grouped.entries()) {
    // Sort docList by newest timestamp first
    docList.sort((a, b) => getDocTimestamp(b.data) - getDocTimestamp(a.data));
    const newest = docList[0];

    // Ensure canonical doc exists with newest data and clean id
    const canonicalDocRef = doc(db, colName, canonicalId);
    const cleanPayload = {
      ...newest.data,
      id: canonicalId,
    };
    await setDoc(canonicalDocRef, cleanPayload, { merge: true });
    migratedCount++;

    // Delete any non-canonical duplicate documents
    for (const d of docList) {
      if (d.docId !== canonicalId) {
        console.log(`Deleting duplicate legacy document: ${d.docId} in favor of ${canonicalId}`);
        await deleteDoc(d.ref);
        deletedDuplicatesCount++;
      }
    }
  }

  console.log(`Result for ${colName}: canonicalized ${migratedCount} items, deleted ${deletedDuplicatesCount} duplicate docs.`);
}

async function run() {
  try {
    await cleanupCollection('inventory_items', ['item-']);
    await cleanupCollection('categories', ['cat-']);
    await cleanupCollection('vendors', ['ven_', 'ven-']);
    await cleanupCollection('staff_members', ['staff-']);
    await cleanupCollection('purchase_orders', ['po-']);
    console.log('\n✅ Firestore cleanup and migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

run();
