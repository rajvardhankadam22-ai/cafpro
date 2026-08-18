import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('--- Cleaning Firestore Database ---');

// 1. Delete all old demo vendors
const vendorsSnap = await getDocs(collection(db, 'vendors'));
for (const d of vendorsSnap.docs) {
  console.log('Deleting old vendor from Firestore:', d.id, d.data().name);
  await deleteDoc(doc(db, 'vendors', d.id));
}

// 2. Add ONLY 1 Single Demo Vendor: Mercara Coffee Roasters
const singleDemoVendor = {
  id: 'demo-cafe-mgr-01_ven-mercara',
  name: 'Mercara Coffee Roasters',
  contactPerson: 'Aditya Menon',
  email: 'b2b@mercararoasters.com',
  phone: '+91 98450 11223',
  city: 'Coorg / Bengaluru, Karnataka',
  leadTimeDays: 2,
  paymentTerms: 'Net 15',
  category: 'Specialty Coffee Roastery',
  notes: 'Primary artisanal roastery supplying house espresso and cold brew blends.',
  userId: 'demo-cafe-mgr-01',
  createdAt: serverTimestamp(),
};
await setDoc(doc(db, 'vendors', singleDemoVendor.id), singleDemoVendor);
console.log('✅ Added Single Demo Vendor:', singleDemoVendor.name);

// 3. Check and convert any submitted supplier applications (e.g. 'rm') into Active Vendors
const appsSnap = await getDocs(collection(db, 'supplier_applications'));
console.log('\nChecking applications count:', appsSnap.docs.length);
for (const appDoc of appsSnap.docs) {
  const data = appDoc.data();
  console.log('Found application:', appDoc.id, data.companyName, 'status:', data.status);
  
  // Register this application as an active vendor!
  const newVendorId = `ven-${appDoc.id}`;
  const vendorDoc = {
    id: newVendorId,
    name: data.companyName || 'Registered Supplier',
    contactPerson: data.contactPerson || '',
    email: data.email || '',
    phone: data.phone || '',
    city: data.city || 'Direct',
    leadTimeDays: Number(data.leadTimeDays) || 2,
    paymentTerms: data.paymentTerms || 'Net 15',
    category: data.category || 'Specialty Supplier',
    notes: data.notes || 'Registered via Supplier Portal',
    userId: data.userId || 'demo-cafe-mgr-01',
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'vendors', newVendorId), vendorDoc);
  console.log('✅ Created Active Vendor for application:', vendorDoc.name);
}

console.log('\n--- Final Firestore Vendors State ---');
const finalVendorsSnap = await getDocs(collection(db, 'vendors'));
console.log('Total Active Vendors in Cloud Firestore:', finalVendorsSnap.docs.length);
finalVendorsSnap.docs.forEach(d => console.log(' ->', d.id, d.data().name));
