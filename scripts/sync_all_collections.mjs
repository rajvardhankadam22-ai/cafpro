import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseClient.mjs';
import {
  INITIAL_INVENTORY_ITEMS,
  INITIAL_CATEGORIES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_VENDORS,
  INITIAL_STAFF_MEMBERS,
} from '../services/seedData.js';

async function syncAllCollections() {
  const demoUid = 'demo-cafe-mgr-01';

  console.log('=== SEEDING & SYNCHRONIZING ALL COLLECTIONS TO CLOUD FIRESTORE ===');

  // 1. Users collection
  await setDoc(doc(db, 'users', demoUid), {
    uid: demoUid,
    email: 'manager@cafepulse.io',
    displayName: 'Arjun Verma',
    cafeName: 'CaféPulse Flagship - Indiranagar',
    branchName: 'Indiranagar Branch, Bengaluru',
    branchCode: 'BLR-01',
    city: 'Bengaluru, Karnataka',
    role: 'Head Barista & Café Manager',
    monthlyVolumeEstimate: '₹3,50,000 / mo',
    monthlyOrdersCount: 28,
    badge: 'Flagship Roastery Lab',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  console.log('✓ Synced users collection');

  // 2. Categories
  for (const cat of INITIAL_CATEGORIES) {
    const docId = `${demoUid}_${cat.id}`;
    await setDoc(doc(db, 'categories', docId), {
      ...cat,
      id: docId,
      userId: demoUid,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✓ Synced ${INITIAL_CATEGORIES.length} categories`);

  // 3. Inventory Items
  for (const item of INITIAL_INVENTORY_ITEMS) {
    const docId = `${demoUid}_${item.id}`;
    await setDoc(doc(db, 'inventory_items', docId), {
      ...item,
      id: docId,
      userId: demoUid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✓ Synced ${INITIAL_INVENTORY_ITEMS.length} inventory items`);

  // 4. Vendors
  for (const v of INITIAL_VENDORS) {
    const docId = `${demoUid}_${v.id}`;
    await setDoc(doc(db, 'vendors', docId), {
      ...v,
      id: docId,
      userId: demoUid,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✓ Synced ${INITIAL_VENDORS.length} vendors`);

  // 5. Staff Members
  for (const st of INITIAL_STAFF_MEMBERS) {
    const docId = `${demoUid}_${st.id}`;
    await setDoc(doc(db, 'staff_members', docId), {
      ...st,
      id: docId,
      userId: demoUid,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✓ Synced ${INITIAL_STAFF_MEMBERS.length} staff members`);

  // 6. Purchase Orders
  for (const po of INITIAL_PURCHASE_ORDERS) {
    const docId = `${demoUid}_${po.id}`;
    await setDoc(doc(db, 'purchase_orders', docId), {
      ...po,
      id: docId,
      userId: demoUid,
      destinationCafe: 'CaféPulse Flagship - Indiranagar',
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✓ Synced ${INITIAL_PURCHASE_ORDERS.length} purchase orders`);

  console.log('=== ALL CLOUD FIRESTORE COLLECTIONS 100% SYNCHRONIZED ===');
}

syncAllCollections();
