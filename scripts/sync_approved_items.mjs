import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

console.log('--- Syncing Quoted Items from Applications into Firestore Inventory ---');

const appsSnap = await getDocs(collection(db, 'supplier_applications'));
for (const appDoc of appsSnap.docs) {
  const appData = appDoc.data();
  const quoted = appData.quotedItems || [];
  console.log(`\nApplication from ${appData.companyName}: ${quoted.length} quoted items`);

  for (const q of quoted) {
    const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const itemData = {
      id: itemId,
      name: q.vendorTradeName || q.masterItemName || 'Specialty Product',
      category: 'Specialty Coffee',
      sku: q.masterSku || q.vendorSku || `SKU-${Date.now().toString().slice(-4)}`,
      unit: q.unit || 'kg',
      quantity: 0, // Ready to order
      unitPrice: Number(q.wholesalePrice) || 0,
      reorderLevel: 5,
      parLevel: 20,
      supplier: appData.companyName || 'Registered Supplier',
      notes: `Cataloged from ${appData.companyName} supplier quote`,
      vendorMappings: [
        {
          mappingId: `vm-${Date.now()}`,
          vendorName: appData.companyName,
          vendorItemName: q.vendorTradeName || q.masterItemName,
          vendorSku: q.vendorSku || q.masterSku,
          unitPrice: Number(q.wholesalePrice) || 0,
          isPreferred: true,
          leadTimeDays: Number(appData.leadTimeDays) || 2,
          notes: q.notes || '',
        }
      ],
      userId: appData.userId || 'demo-cafe-mgr-01',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'inventory_items', itemId), itemData);
    console.log(`✅ Created Inventory Item: ${itemData.name} (SKU: ${itemData.sku}) @ ₹${itemData.unitPrice}`);
  }
}

console.log('\n--- Total Inventory Items in Firestore ---');
const itemsSnap = await getDocs(collection(db, 'inventory_items'));
console.log('Count:', itemsSnap.docs.length);
itemsSnap.docs.forEach(d => console.log(' ->', d.id, d.data().name, `(Stock: ${d.data().quantity} ${d.data().unit}, Supplier: ${d.data().supplier})`));
