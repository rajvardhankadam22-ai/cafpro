import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';

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

const SAMPLE_POS = [
  {
    id: 'po-2026-001',
    poNumber: 'PO-2026-001',
    supplierName: 'Mercara Roasters',
    userId: 'demo-cafe-mgr-01',
    status: 'PENDING_DELIVERY',
    items: [
      {
        itemId: 'item-1',
        itemName: 'Coorg Dark Roast Espresso (1kg)',
        sku: 'COF-CRG-001',
        orderedQty: 20,
        receivedQty: 0,
        unit: 'kg',
        unitPrice: 1450,
      },
      {
        itemId: 'item-8',
        itemName: 'Cold Brew Blend (1kg)',
        sku: 'COF-CBB-008',
        orderedQty: 10,
        receivedQty: 0,
        unit: 'kg',
        unitPrice: 1350,
      },
    ],
    totalEstimatedCost: 42500,
    notes: 'Urgent delivery for weekend rush. Deliver to back loading bay before 8:30 AM.',
    expectedDelivery: '2026-08-20',
  },
  {
    id: 'po-2026-002',
    poNumber: 'PO-2026-002',
    supplierName: 'Amul Dairy Distribution',
    userId: 'demo-cafe-mgr-01',
    status: 'PENDING_DELIVERY',
    items: [
      {
        itemId: 'item-2',
        itemName: 'Amul Taaza Whole Milk (1L)',
        sku: 'MLK-AML-002',
        orderedQty: 60,
        receivedQty: 0,
        unit: 'liters',
        unitPrice: 72,
      },
      {
        itemId: 'item-3',
        itemName: 'Oatly Barista Oat Milk (1L)',
        sku: 'MLK-OAT-003',
        orderedQty: 24,
        receivedQty: 0,
        unit: 'liters',
        unitPrice: 280,
      },
    ],
    totalEstimatedCost: 11040,
    notes: 'Weekly fresh dairy & plant milk replenishment.',
    expectedDelivery: '2026-08-19',
  },
  {
    id: 'po-2026-003',
    poNumber: 'PO-2026-003',
    supplierName: 'Monin Flavours India',
    userId: 'demo-cafe-mgr-01',
    status: 'DELIVERED',
    items: [
      {
        itemId: 'item-4',
        itemName: 'Madagascar Vanilla Syrup (750ml)',
        sku: 'SYR-VAN-004',
        orderedQty: 12,
        receivedQty: 12,
        unit: 'bottles',
        unitPrice: 850,
      },
      {
        itemId: 'item-5',
        itemName: 'Salted Caramel Syrup (750ml)',
        sku: 'SYR-CAR-005',
        orderedQty: 8,
        receivedQty: 8,
        unit: 'bottles',
        unitPrice: 850,
      },
    ],
    totalCost: 17000,
    totalEstimatedCost: 17000,
    notes: 'Seasonal syrup replenishment. Received in good condition.',
    receivedBy: 'Aarav (Manager)',
  },
];

async function syncPurchaseOrders() {
  console.log('Writing Purchase Orders to Cloud Firestore...');
  for (const po of SAMPLE_POS) {
    await setDoc(doc(db, 'purchase_orders', po.id), {
      ...po,
      createdAt: serverTimestamp(),
      ...(po.receivedBy ? { receivedAt: serverTimestamp() } : {}),
    });
    console.log(`✓ Saved ${po.poNumber} (${po.supplierName}) to 'purchase_orders'`);
  }

  // Also query to verify
  const snap = await getDocs(collection(db, 'purchase_orders'));
  console.log(`\n🎉 Total documents in Firestore 'purchase_orders' collection: ${snap.size}`);
  process.exit(0);
}

syncPurchaseOrders().catch((err) => {
  console.error('Error syncing POs:', err);
  process.exit(1);
});
