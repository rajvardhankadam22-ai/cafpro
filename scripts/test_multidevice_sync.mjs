import { db } from './firebaseClient.mjs';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

async function testMultiDeviceRealtimeSync() {
  console.log('🧪 Starting Multi-Device Realtime Sync Verification Test...');

  const testUserId = 'test_user_' + Date.now();
  const testItemId = 'item-test-' + Date.now();

  let device2ReceivedUpdates = [];

  // 1. Device 2 starts real-time listener
  const q = query(
    collection(db, 'inventory_items'),
    where('userId', '==', testUserId)
  );

  const unsubscribeDevice2 = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    device2ReceivedUpdates.push(items);
    console.log(`📡 [Device 2 Listener] Received update: ${items.length} items.`);
  });

  // Wait 1 second for listener attachment
  await new Promise((r) => setTimeout(r, 1000));

  // 2. Device 1 creates a new item
  console.log('📱 [Device 1] Creating item:', testItemId);
  await setDoc(doc(db, 'inventory_items', testItemId), {
    id: testItemId,
    userId: testUserId,
    name: 'Single Origin Ethiopia Yirgacheffe',
    quantity: 15,
    unit: 'kg',
    unitPrice: 1200,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Wait 1.5 seconds for Device 2 to receive
  await new Promise((r) => setTimeout(r, 1500));

  // 3. Device 1 adjusts quantity on floor (e.g., used 3 kg -> 12 kg)
  console.log('📱 [Device 1] Adjusting item quantity to 12 kg...');
  await setDoc(
    doc(db, 'inventory_items', testItemId),
    {
      quantity: 12,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Wait 1.5 seconds for Device 2 to receive
  await new Promise((r) => setTimeout(r, 1500));

  // 4. Verify what Device 2 saw
  const latestBatch = device2ReceivedUpdates[device2ReceivedUpdates.length - 1];
  const receivedItem = latestBatch?.find((i) => i.id === testItemId);

  console.log('\n🔍 Verification Results:');
  console.log('Total Snapshot Updates Received by Device 2:', device2ReceivedUpdates.length);
  console.log('Device 2 Final Item State:', receivedItem);

  if (!receivedItem) {
    throw new Error('❌ Test Failed: Device 2 did not receive the created item.');
  }

  if (receivedItem.quantity !== 12) {
    throw new Error(`❌ Test Failed: Expected quantity 12 on Device 2, but got ${receivedItem.quantity}`);
  }

  if (receivedItem.name !== 'Single Origin Ethiopia Yirgacheffe') {
    throw new Error(`❌ Test Failed: Item name mismatch.`);
  }

  console.log('✅ PASS: Realtime multi-device synchronization verified!');

  // Cleanup test record
  await deleteDoc(doc(db, 'inventory_items', testItemId));
  unsubscribeDevice2();
  console.log('🧹 Cleaned up test item document.');
  process.exit(0);
}

testMultiDeviceRealtimeSync().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
