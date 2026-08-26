import { db } from './firebaseClient.mjs';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const COLLECTIONS = [
  'users',
  'registered_cafes',
  'inventory_items',
  'categories',
  'purchase_orders',
  'vendors',
  'staff_members',
  'activity_logs',
  'supplier_applications',
  'system_health',
];

async function wipeDatabase() {
  console.log('🧹 Starting full Cloud Firestore database wipe...\n');

  for (const collName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, collName));
      console.log(`📁 Collection '${collName}': Found ${snap.docs.length} documents.`);
      
      const deletePromises = snap.docs.map((d) => {
        console.log(`   - Deleting doc: ${d.id}`);
        return deleteDoc(doc(db, collName, d.id));
      });

      await Promise.all(deletePromises);
      console.log(`   ✅ Wiped ${snap.docs.length} documents in '${collName}'.\n`);
    } catch (err) {
      console.error(`   ❌ Error wiping '${collName}':`, err.message);
    }
  }

  console.log('🎉 Cloud Firestore database has been completely wiped and reset to a clean state!');
  process.exit(0);
}

wipeDatabase().catch((err) => {
  console.error('Fatal error during database wipe:', err);
  process.exit(1);
});
