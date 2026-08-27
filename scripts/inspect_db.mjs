import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from './firebaseClient.mjs';
import {
  DEMO_ACCOUNT,
  INITIAL_CATEGORIES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_VENDORS,
  INITIAL_STAFF_MEMBERS,
  REGISTERED_CAFES,
} from '../services/seedData.js';

console.log('--- Seeding Demo Account into Cloud Firestore ---');

const storeUid = DEMO_ACCOUNT.uid;

// 1. User profile
await setDoc(doc(db, 'users', storeUid), {
  uid: storeUid,
  email: DEMO_ACCOUNT.email,
  displayName: DEMO_ACCOUNT.displayName,
  cafeName: DEMO_ACCOUNT.cafeName,
  branchName: DEMO_ACCOUNT.branchName,
  role: DEMO_ACCOUNT.role,
  roleLabel: DEMO_ACCOUNT.roleLabel,
  isStaff: false,
  createdAt: serverTimestamp(),
}, { merge: true });
console.log('✅ Demo user profile created in Firestore: users/' + storeUid);

// 2. Categories
for (const cat of INITIAL_CATEGORIES) {
  await setDoc(doc(db, 'categories', `${storeUid}_${cat.id}`), {
    ...cat,
    id: cat.id,
    originalId: cat.id,
    userId: storeUid,
    createdAt: serverTimestamp(),
  }, { merge: true });
}
console.log('✅ Categories seeded:', INITIAL_CATEGORIES.length);

// 3. Inventory Items
for (const item of INITIAL_INVENTORY_ITEMS) {
  await setDoc(doc(db, 'inventory_items', item.id), {
    ...item,
    userId: storeUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
console.log('✅ Inventory items seeded:', INITIAL_INVENTORY_ITEMS.length);

// 4. Vendors
for (const v of INITIAL_VENDORS) {
  await setDoc(doc(db, 'vendors', v.id), {
    ...v,
    userId: storeUid,
    createdAt: serverTimestamp(),
  }, { merge: true });
}
console.log('✅ Vendors seeded:', INITIAL_VENDORS.length);

// 5. Staff Members
for (const s of INITIAL_STAFF_MEMBERS) {
  await setDoc(doc(db, 'staff_members', s.id), {
    ...s,
    userId: storeUid,
    createdAt: serverTimestamp(),
  }, { merge: true });
}
console.log('✅ Staff members seeded:', INITIAL_STAFF_MEMBERS.length);

// 6. Purchase Orders
for (const po of INITIAL_PURCHASE_ORDERS) {
  await setDoc(doc(db, 'purchase_orders', po.id), {
    ...po,
    userId: storeUid,
    createdAt: serverTimestamp(),
  }, { merge: true });
}
console.log('✅ Purchase Orders seeded:', INITIAL_PURCHASE_ORDERS.length);

// 7. Registered Cafes
for (const cafe of REGISTERED_CAFES) {
  await setDoc(doc(db, 'registered_cafes', cafe.id), {
    ...cafe,
    createdAt: serverTimestamp(),
  }, { merge: true });
}
console.log('✅ Registered Cafes seeded in marketplace.');

console.log('\n🎉 DEMO ACCOUNT READY IN CLOUD FIRESTORE!');
console.log('👉 Email: demo@cafepulse.io');
console.log('👉 Password: demo (or demo1234)');
console.log('👉 PIN: 1234');
