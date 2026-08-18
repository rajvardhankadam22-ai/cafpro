import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { INITIAL_CATEGORIES, INITIAL_INVENTORY_ITEMS } from './seedData.js';

const firebaseConfig = {
  apiKey: "AIzaSyAxw-OtFwqwAGETyZkdq10Cz1Stspfy_D4",
  authDomain: "caf247-73960.firebaseapp.com",
  projectId: "caf247-73960",
  storageBucket: "caf247-73960.firebasestorage.app",
  messagingSenderId: "486109709317",
  appId: "1:486109709317:web:fc2ec53a141764db43886c",
  measurementId: "G-RRMTQ1L5QK"
};

async function autoInitFirebase() {
  console.log("==========================================");
  console.log("INITIALIZING FIREBASE DATABASE & AUTH");
  console.log("Project:", firebaseConfig.projectId);
  console.log("==========================================");

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // 1. Create Default Authentication User
  console.log("\n1. Setting up Firebase Authentication User...");
  const demoEmail = "manager@cafepulse.io";
  const demoPass = "password123";

  try {
    const userCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
    await updateProfile(userCred.user, { displayName: "Mateo Rossi (Head Barista)" });
    console.log("✓ Successfully created user:", demoEmail, "(Password: password123)");
  } catch (authErr) {
    if (authErr.code === 'auth/email-already-in-use') {
      console.log("✓ User already exists:", demoEmail, "(Password: password123)");
    } else {
      console.log("ℹ Auth notice:", authErr.code, "-", authErr.message);
    }
  }

  // 2. Populate Categories Collection in Firestore
  console.log("\n2. Creating Categories in Firestore...");
  for (const cat of INITIAL_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), {
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      createdAt: serverTimestamp(),
    });
    console.log(`✓ Category created: [${cat.id}] ${cat.name}`);
  }

  // 3. Populate Inventory Items Collection in Firestore
  console.log("\n3. Creating Inventory Items in Firestore...");
  for (const item of INITIAL_INVENTORY_ITEMS) {
    await setDoc(doc(db, 'inventory_items', item.id), {
      name: item.name,
      categoryId: item.categoryId,
      sku: item.sku,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      reorderLevel: item.reorderLevel,
      supplier: item.supplier,
      notes: item.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✓ Item created: [${item.sku}] ${item.name} (${item.quantity} ${item.unit})`);
  }

  // 4. Create Activity Logs Collection
  console.log("\n4. Creating Initial Audit Activity Logs...");
  const initialLogs = [
    {
      id: 'log-1',
      type: 'RESTOCKED',
      itemId: 'item-1',
      itemName: 'Ethiopian Yirgacheffe (Washed)',
      detail: 'Initial inventory stock receipt of 14.5 kg',
      user: 'Mateo Rossi',
    },
    {
      id: 'log-2',
      type: 'CREATED',
      itemId: 'item-4',
      itemName: 'Barista Edition Oat Milk (Oatly 1L)',
      detail: 'Catalogued high-demand dairy alternative',
      user: 'Café Lead',
    },
    {
      id: 'log-3',
      type: 'CREATED',
      itemId: 'item-10',
      itemName: 'Uji Ceremonial Grade Matcha Powder',
      detail: 'Added premium ceremonial matcha from Kyoto',
      user: 'Café Lead',
    },
  ];

  for (const log of initialLogs) {
    await setDoc(doc(db, 'activity_logs', log.id), {
      ...log,
      timestamp: serverTimestamp(),
    });
  }
  console.log("✓ Activity logs initialized");

  console.log("\n==========================================");
  console.log("🎉 ALL FIREBASE DATA & AUTH CREATED SUCCESSFULLY!");
  console.log("==========================================");
}

autoInitFirebase().catch(console.error);
