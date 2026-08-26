import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseClient.mjs';

console.log('--- Inspecting Firestore Collections ---');

const vendorsSnap = await getDocs(collection(db, 'vendors'));
console.log('Vendors in Firestore count:', vendorsSnap.docs.length);
vendorsSnap.docs.forEach(d => {
  console.log('Vendor:', d.id, d.data().name, 'userId:', d.data().userId);
});

const appsSnap = await getDocs(collection(db, 'supplier_applications'));
console.log('\nSupplier Applications in Firestore count:', appsSnap.docs.length);
appsSnap.docs.forEach(d => {
  console.log('Application:', d.id, d.data().companyName, 'userId:', d.data().userId, 'status:', d.data().status);
});
