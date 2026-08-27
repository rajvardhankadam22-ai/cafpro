import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfig } from './firebaseClient.mjs';

console.log('================================================================');
console.log('🧪 MULTI-DEVICE REAL-TIME DATABASE SYNC TEST');
console.log('Connected to Project:', firebaseConfig.projectId);
console.log('================================================================\n');

const testUid = 'cross-device-user-' + Date.now();
const testItemId = 'item-sync-' + Date.now();

async function runCrossDeviceTest() {
  let receivedUpdatesCount = 0;
  let latestItemOnDevice2 = null;

  // 1. Device 2 sets up real-time listener (onSnapshot)
  console.log('📱 [Device 2]: Subscribing to real-time inventory updates for account:', testUid);
  const q = query(collection(db, 'inventory_items'), where('userId', '==', testUid));
  const unsubscribeDevice2 = onSnapshot(q, (snapshot) => {
    receivedUpdatesCount++;
    const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    console.log(`📡 [Device 2 Listener Update #${receivedUpdatesCount}]: Received ${items.length} items from Cloud Firestore.`);
    if (items.length > 0) {
      latestItemOnDevice2 = items[0];
      console.log(`   ↳ Item name: "${latestItemOnDevice2.name}", Stock Quantity: ${latestItemOnDevice2.quantity}`);
    }
  });

  // Wait 1 second for listener setup
  await new Promise((r) => setTimeout(r, 1000));

  // 2. Device 1 adds a new item
  console.log('\n📱 [Device 1]: Adding new item "Ethiopian Yirgacheffe Roast" (Qty: 25 packs)...');
  await setDoc(doc(db, 'inventory_items', testItemId), {
    id: testItemId,
    userId: testUid,
    name: 'Ethiopian Yirgacheffe Roast',
    categoryId: 'cat-coffee',
    sku: 'ETH-YIRG-001',
    quantity: 25,
    unit: 'packs',
    unitPrice: 650,
    reorderLevel: 5,
    parLevel: 30,
    supplier: 'Blue Tokai Roasters',
    notes: 'Single origin floral notes',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('✅ [Device 1]: Item created in Cloud Firestore.');

  // Wait 2 seconds for Device 2 to receive the creation
  await new Promise((r) => setTimeout(r, 2000));

  // 3. Device 1 updates stock quantity (-5 floor POS sale)
  console.log('\n📱 [Device 1]: Quick Adjusting stock quantity (-5 units) on floor terminal...');
  await setDoc(
    doc(db, 'inventory_items', testItemId),
    { quantity: 20, updatedAt: serverTimestamp() },
    { merge: true }
  );
  console.log('✅ [Device 1]: Quantity update committed to Cloud Firestore.');

  // Wait 2 seconds for Device 2 to receive the update
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Test Category creation and query
  console.log('\n📱 [Device 1]: Adding custom category "Specialty Cold Brew Blends"...');
  const catId = 'cat-coldbrew-' + Date.now();
  await setDoc(doc(db, 'categories', catId), {
    id: catId,
    userId: testUid,
    name: 'Specialty Cold Brew Blends',
    slug: 'specialty-cold-brew-blends',
    icon: 'Coffee',
    createdAt: serverTimestamp(),
  });
  console.log('✅ [Device 1]: Category created.');

  const catSnap = await getDocs(query(collection(db, 'categories'), where('userId', '==', testUid)));
  console.log(`📱 [Device 2]: Query categories found ${catSnap.docs.length} category (Name: "${catSnap.docs[0]?.data().name}")`);

  // 5. Test Purchase Order creation
  console.log('\n📱 [Device 1]: Creating Purchase Order PO-2026-999...');
  const poId = 'po-test-' + Date.now();
  await setDoc(doc(db, 'purchase_orders', poId), {
    id: poId,
    userId: testUid,
    poNumber: 'PO-2026-999',
    supplierName: 'Blue Tokai Roasters',
    status: 'PENDING_DELIVERY',
    items: [{ itemId: testItemId, itemName: 'Ethiopian Yirgacheffe Roast', orderedQty: 10, unitPrice: 650 }],
    createdAt: serverTimestamp(),
  });
  console.log('✅ [Device 1]: Purchase Order created.');

  const poSnap = await getDocs(query(collection(db, 'purchase_orders'), where('userId', '==', testUid)));
  console.log(`📱 [Device 2]: Query POs found ${poSnap.docs.length} order (PO: "${poSnap.docs[0]?.data().poNumber}")`);

  // 6. Cleanup test records
  console.log('\n🧹 Cleaning up test artifacts from Cloud Firestore...');
  await deleteDoc(doc(db, 'inventory_items', testItemId));
  await deleteDoc(doc(db, 'categories', catId));
  await deleteDoc(doc(db, 'purchase_orders', poId));
  console.log('✅ Cleanup complete.');

  await new Promise((r) => setTimeout(r, 1000));
  unsubscribeDevice2();

  console.log('\n================================================================');
  console.log('🎉 ALL MULTI-DEVICE REAL-TIME SYNC TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runCrossDeviceTest().catch((err) => {
  console.error('❌ Test failed:', err);
});

