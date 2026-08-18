import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  query,
  where,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { INITIAL_CATEGORIES, INITIAL_INVENTORY_ITEMS, INITIAL_PURCHASE_ORDERS, INITIAL_VENDORS, REGISTERED_CAFES, INITIAL_STAFF_MEMBERS } from './seedData';

export { REGISTERED_CAFES, INITIAL_STAFF_MEMBERS };

const DEFAULT_USER_ID = 'guest';

function getLocalItemsKey(userId) {
  return `cafepulse_items_${userId || DEFAULT_USER_ID}`;
}

function getLocalCatsKey(userId) {
  return `cafepulse_cats_${userId || DEFAULT_USER_ID}`;
}

function getLocalLogsKey(userId) {
  return `cafepulse_logs_${userId || DEFAULT_USER_ID}`;
}

function getLocalPosKey(userId) {
  return `cafepulse_pos_${userId || DEFAULT_USER_ID}`;
}

function getLocalVendorsKey(userId) {
  return `cafepulse_vendors_${userId || DEFAULT_USER_ID}`;
}

function getLocalAppsKey(userId) {
  return `cafepulse_supplier_apps_${userId || DEFAULT_USER_ID}`;
}

function getLocalStaffKey(userId) {
  return `cafepulse_staff_${userId || DEFAULT_USER_ID}`;
}

class LocalEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).delete(callback);
      }
    };
  }

  subscribe(key, callback) {
    return this.on(key, callback);
  }

  emit(key, data) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach((cb) => cb(data));
    }
  }
}

const bus = new LocalEventBus();

function getLocalData(key, defaultData) {
  if (typeof window === 'undefined') return defaultData;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch (e) {
    return defaultData;
  }
}

function setLocalData(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

export function logActivity(userId = DEFAULT_USER_ID, type, itemId, itemName, detail, userName = 'Café Manager', extraMeta = {}) {
  const uid = userId || DEFAULT_USER_ID;
  const logEntry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: uid,
    type, // 'STOCK_RECEIVED' | 'RESTOCKED' | 'QUANTITY_ADJUSTED' | 'CREATED' | 'UPDATED' | 'DELETED'
    itemId,
    itemName,
    detail,
    timestamp: new Date().toISOString(),
    user: userName,
    ...extraMeta,
  };

  if (isFirebaseConfigured() && db) {
    try {
      addDoc(collection(db, 'activity_logs'), {
        ...logEntry,
        timestamp: serverTimestamp(),
      }).catch(() => {});
    } catch (e) {}
  }

  const logsKey = getLocalLogsKey(uid);
  const logs = getLocalData(logsKey, []);
  const updatedLogs = [logEntry, ...logs].slice(0, 100);
  setLocalData(logsKey, updatedLogs);
  bus.emit(`logs_${uid}`, updatedLogs);
}

/**
 * 1. Subscribe to User's Isolated Inventory Items
 */
export function subscribeToInventory(userId, callback) {
  const uid = userId || DEFAULT_USER_ID;

  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'inventory_items'),
        where('userId', '==', uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            const local = getLocalData(getLocalItemsKey(uid), INITIAL_INVENTORY_ITEMS);
            callback(local);
            return;
          }

          const rawItems = snapshot.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          }));

          // Deduplicate items to prevent any clone rows
          const seen = new Set();
          const uniqueItems = [];
          for (const itm of rawItems) {
            const cleanId = itm.id.replace(`${uid}_`, '');
            const key = itm.sku ? `${itm.sku}_${cleanId}` : cleanId;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueItems.push(itm);
            }
          }

          setLocalData(getLocalItemsKey(uid), uniqueItems);
          callback(uniqueItems);
        },
        () => {
          const local = getLocalData(getLocalItemsKey(uid), INITIAL_INVENTORY_ITEMS);
          callback(local);
        }
      );
      return unsubscribe;
    } catch (e) {}
  }

  const localKey = getLocalItemsKey(uid);
  const userItems = getLocalData(localKey, INITIAL_INVENTORY_ITEMS);
  setTimeout(() => callback(userItems), 0);
  const unsubBus = bus.on(`inventory_${uid}`, callback);

  let handleStorage = null;
  if (typeof window !== 'undefined') {
    handleStorage = (e) => {
      if (e.key === localKey && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubBus();
    if (handleStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * 2. Subscribe to Categories
 */
export function subscribeToCategories(userId, callback) {
  const uid = userId || DEFAULT_USER_ID;

  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'categories'),
        where('userId', '==', uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const categories = snapshot.docs.map((d) => ({
              ...d.data(),
              id: d.id,
            }));
            setLocalData(getLocalCatsKey(uid), categories);
            callback(categories);
          } else {
            const localCats = getLocalData(getLocalCatsKey(uid), INITIAL_CATEGORIES);
            callback(localCats);
          }
        },
        () => {
          const localCats = getLocalData(getLocalCatsKey(uid), INITIAL_CATEGORIES);
          callback(localCats);
        }
      );
      return unsubscribe;
    } catch (e) {}
  }

  const localCats = getLocalData(
    getLocalCatsKey(uid),
    INITIAL_CATEGORIES
  );
  setTimeout(() => callback(localCats), 0);
  return bus.on(`categories_${uid}`, callback);
}

/**
 * 3. Subscribe to Activity Logs (Realtime Dual-Channel)
 */
export function subscribeToActivityLogs(userId, callback) {
  const uid = userId || DEFAULT_USER_ID;

  // 1. Immediate local session delivery
  const initialLogs = getLocalData(getLocalLogsKey(uid), []);
  callback(initialLogs);

  // 2. Subscribe to zero-latency local event bus
  const unsubBus = bus.on(`logs_${uid}`, (updated) => {
    callback(updated);
  });

  // 3. Subscribe to live Firestore collection
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'activity_logs'),
        where('userId', '==', uid)
      );

      const unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const rawLogs = snapshot.docs.map((d) => {
              const data = d.data();
              let ts = data.timestamp;
              if (ts && typeof ts === 'object' && ts.seconds) {
                ts = new Date(ts.seconds * 1000).toISOString();
              } else if (!ts || typeof ts !== 'string') {
                ts = new Date().toISOString();
              }
              return {
                ...data,
                id: d.id,
                timestamp: ts,
              };
            });

            // Deduplicate logs
            const seenIds = new Set();
            const uniqueLogs = [];
            for (const l of rawLogs) {
              if (l && l.id && !seenIds.has(l.id)) {
                seenIds.add(l.id);
                uniqueLogs.push(l);
              }
            }
            uniqueLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLocalData(getLocalLogsKey(uid), uniqueLogs);
            callback(uniqueLogs);
          }
        },
        (err) => {
          console.warn('Activity logs snapshot notice:', err);
        }
      );

      return () => {
        unsubBus();
        unsubFirestore();
      };
    } catch (e) {}
  }

  return unsubBus;
}

/**
 * 4. Subscribe to Purchase Orders
 */
export function subscribeToPurchaseOrders(userId, callback) {
  const uid = userId || DEFAULT_USER_ID;

  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'purchase_orders'),
        where('userId', '==', uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const rawPos = snapshot.docs.map((d) => ({
              ...d.data(),
              id: d.id,
            }));
            const seenIds = new Set();
            const uniquePos = [];
            for (const p of rawPos) {
              if (p && p.id && !seenIds.has(p.id)) {
                seenIds.add(p.id);
                uniquePos.push(p);
              }
            }
            uniquePos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setLocalData(getLocalPosKey(uid), uniquePos);
            callback(uniquePos);
          } else {
            const localPos = getLocalData(getLocalPosKey(uid), INITIAL_PURCHASE_ORDERS);
            callback(localPos);
          }
        },
        () => {
          const localPos = getLocalData(getLocalPosKey(uid), INITIAL_PURCHASE_ORDERS);
          callback(localPos);
        }
      );
      return unsubscribe;
    } catch (e) {}
  }

  const localKey = getLocalPosKey(uid);
  const localPos = getLocalData(localKey, INITIAL_PURCHASE_ORDERS);
  setTimeout(() => callback(localPos), 0);
  const unsubBus = bus.on(`pos_${uid}`, callback);

  let handleStorage = null;
  if (typeof window !== 'undefined') {
    handleStorage = (e) => {
      if (e.key === localKey && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubBus();
    if (handleStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * 5. Add Inventory Item
 */
export async function addInventoryItem(itemData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const cleanData = {
    userId: uid,
    name: itemData.name.trim(),
    categoryId: itemData.categoryId || 'cat-coffee',
    sku: itemData.sku ? itemData.sku.trim().toUpperCase() : '',
    quantity: Math.max(0, Number(itemData.quantity) || 0),
    unit: itemData.unit || 'units',
    packageWeight: Number(itemData.packageWeight) || 1.0,
    packageWeightUnit: itemData.packageWeightUnit || 'kg',
    unitPrice: Math.max(0, Number(itemData.unitPrice) || 0),
    reorderLevel: Math.max(0, Number(itemData.reorderLevel) || 5),
    parLevel: Math.max(Number(itemData.reorderLevel) || 5, Number(itemData.parLevel) || 20),
    supplier: itemData.supplier ? itemData.supplier.trim() : 'Local Supplier',
    notes: itemData.notes ? itemData.notes.trim() : '',
    vendorMappings: Array.isArray(itemData.vendorMappings) ? itemData.vendorMappings : [],
  };

  const newId = 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'inventory_items', newId), {
        ...cleanData,
        id: newId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore add item error:', e);
    }
  }

  const itemsKey = getLocalItemsKey(uid);
  const items = getLocalData(itemsKey, []);
  const newItem = {
    id: newId,
    ...cleanData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newItem, ...items];
  setLocalData(itemsKey, updated);
  bus.emit(`inventory_${uid}`, updated);

  logActivity(uid, 'CREATED', newId, cleanData.name, `Added with initial stock of ${cleanData.quantity} ${cleanData.unit}`, 'Café Manager', { delta: `+${cleanData.quantity} ${cleanData.unit}` });
  return newItem;
}

/**
 * 6. Update Inventory Item
 */
export async function updateInventoryItem(id, updatedData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const cleanData = { ...updatedData, userId: uid };
  if (cleanData.quantity !== undefined) cleanData.quantity = Math.max(0, Number(cleanData.quantity));
  if (cleanData.unitPrice !== undefined) cleanData.unitPrice = Math.max(0, Number(cleanData.unitPrice));
  if (cleanData.reorderLevel !== undefined) cleanData.reorderLevel = Math.max(0, Number(cleanData.reorderLevel));
  if (cleanData.parLevel !== undefined) cleanData.parLevel = Math.max(0, Number(cleanData.parLevel));
  if (cleanData.sku) cleanData.sku = cleanData.sku.trim().toUpperCase();
  if (cleanData.vendorMappings && !Array.isArray(cleanData.vendorMappings)) cleanData.vendorMappings = [];

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, 'inventory_items', id);
      await setDoc(docRef, { ...cleanData, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.warn('Firestore update error:', e);
    }
  }

  const itemsKey = getLocalItemsKey(uid);
  const items = getLocalData(itemsKey, []);
  const updated = items.map((item) =>
    item.id === id
      ? { ...item, ...cleanData, updatedAt: new Date().toISOString() }
      : item
  );
  setLocalData(itemsKey, updated);
  bus.emit(`inventory_${uid}`, updated);

  logActivity(uid, 'UPDATED', id, cleanData.name || 'Item', `Updated item details and vendor mappings`, 'Café Manager');
}

/**
 * 7. Delete Inventory Item
 */
export async function deleteInventoryItem(id, p2 = '', p3 = '', userName = 'Café Manager') {
  let uid = DEFAULT_USER_ID;
  let itemName = 'Item';
  if (p2 && typeof p2 === 'string' && (p2.includes('@') || p2.length > 20 || !p3)) {
    uid = p2;
    itemName = p3 || 'Item';
  } else {
    itemName = p2 || 'Item';
    uid = p3 || DEFAULT_USER_ID;
  }

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'inventory_items', id));
    } catch (e) {
      console.warn('Firestore delete item error:', e);
    }
  }

  const itemsKey = getLocalItemsKey(uid);
  const items = getLocalData(itemsKey, []);
  const updated = items.filter((item) => item.id !== id);
  setLocalData(itemsKey, updated);
  bus.emit(`inventory_${uid}`, updated);

  logActivity(uid, 'DELETED', id, itemName, `Removed from catalogue`, userName);
}

/**
 * 8. Quick Adjust Quantity (Floor POS & Quick Stock Update)
 */
export async function quickAdjustQuantity(id, delta, p3 = '', p4 = '', userName = 'Barista Floor') {
  let uid = DEFAULT_USER_ID;
  let itemName = 'Item';
  if (p3 && typeof p3 === 'string' && (p3.includes('@') || p3.length > 20 || !p4)) {
    uid = p3;
    itemName = p4 || 'Item';
  } else {
    itemName = p3 || 'Item';
    uid = p4 || DEFAULT_USER_ID;
  }
  const numDelta = Number(delta);
  if (isNaN(numDelta) || numDelta === 0) return;

  const itemsKey = getLocalItemsKey(uid);
  const items = getLocalData(itemsKey, []);
  let updatedQty = 0;
  let targetItem = null;

  const updated = items.map((item) => {
    if (item.id === id || item.id === `${uid}_${id}` || `${uid}_${item.id}` === id) {
      targetItem = item;
      updatedQty = Math.max(0, (Number(item.quantity) || 0) + numDelta);
      return {
        ...item,
        quantity: updatedQty,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });

  setLocalData(itemsKey, updated);
  bus.emit(`inventory_${uid}`, updated);

  // Commit to Firestore
  if (isFirebaseConfigured() && db) {
    try {
      const payload = {
        quantity: updatedQty,
        userId: uid,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'inventory_items', id), payload, { merge: true });
    } catch (e) {
      console.warn('Firestore quantity adjustment notice:', e);
    }
  }

  const sign = numDelta > 0 ? `+${numDelta}` : `${numDelta}`;
  const actionType = numDelta > 0 ? 'RESTOCKED' : 'QUANTITY_ADJUSTED';
  const unitStr = targetItem?.unit || 'units';
  const finalItemName = itemName || targetItem?.name || 'Item';

  logActivity(
    uid,
    actionType,
    id,
    finalItemName,
    numDelta > 0
      ? `Restocked +${numDelta} ${unitStr} (New balance: ${updatedQty} ${unitStr})`
      : `Used -${Math.abs(numDelta)} ${unitStr} (New balance: ${updatedQty} ${unitStr})`,
    userName,
    { delta: `${sign} ${unitStr}`, newQuantity: updatedQty }
  );

  return updatedQty;
}

/**
 * Add or Update Price Agreement mapping for a store item
 */
export async function addVendorPriceMapping(itemId, vendorMappingData, userId = DEFAULT_USER_ID, userName = 'Manager') {
  const uid = userId || DEFAULT_USER_ID;
  const itemsKey = getLocalItemsKey(uid);
  const currentInventory = getLocalData(itemsKey, []);

  const updatedInventory = currentInventory.map((item) => {
    const matchId =
      item.id === itemId ||
      item.id === `${uid}_${itemId}` ||
      item.id.replace(`${uid}_`, '') === String(itemId).replace(`${uid}_`, '');
    if (matchId) {
      const existingMappings = Array.isArray(item.vendorMappings) ? item.vendorMappings : [];
      let updatedMappings = [...existingMappings];
      
      const newMapping = {
        mappingId: vendorMappingData.mappingId || `vm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        vendorName: vendorMappingData.vendorName.trim(),
        vendorItemName: vendorMappingData.vendorItemName ? vendorMappingData.vendorItemName.trim() : item.name,
        vendorSku: vendorMappingData.vendorSku ? vendorMappingData.vendorSku.trim().toUpperCase() : item.sku,
        unitPrice: Number(vendorMappingData.unitPrice) || 0,
        isPreferred: Boolean(vendorMappingData.isPreferred),
        leadTimeDays: Number(vendorMappingData.leadTimeDays) || 2,
        notes: vendorMappingData.notes ? vendorMappingData.notes.trim() : '',
      };

      if (newMapping.isPreferred) {
        updatedMappings = updatedMappings.map((m) => ({ ...m, isPreferred: false }));
      }
      updatedMappings = updatedMappings.filter((m) => m.vendorName.toLowerCase().trim() !== newMapping.vendorName.toLowerCase().trim());
      updatedMappings.push(newMapping);

      targetItem = {
        ...item,
        supplier: newMapping.isPreferred ? newMapping.vendorName : (item.supplier || newMapping.vendorName),
        unitPrice: newMapping.isPreferred && newMapping.unitPrice > 0 ? newMapping.unitPrice : item.unitPrice,
        vendorMappings: updatedMappings,
        updatedAt: new Date().toISOString(),
      };
      return targetItem;
    }
    return item;
  });

  setLocalData(itemsKey, updatedInventory);
  bus.emit(`inventory_${uid}`, updatedInventory);

  if (isFirebaseConfigured() && db && targetItem) {
    try {
      setDoc(doc(db, 'inventory_items', targetItem.id), {
        supplier: targetItem.supplier,
        unitPrice: targetItem.unitPrice,
        vendorMappings: targetItem.vendorMappings,
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => {});
    } catch (e) {}
  }

  logActivity(
    uid,
    'PRICE_BOOK_MAPPED',
    itemId,
    targetItem?.name || 'Item',
    `Mapped vendor price agreement: ${vendorMappingData.vendorName} @ ₹${vendorMappingData.unitPrice} ("${vendorMappingData.vendorItemName || targetItem?.name}")`,
    userName
  );

  return targetItem;
}

/**
 * Remove Vendor Price Agreement mapping from an item
 */
export async function removeVendorPriceMapping(itemId, mappingId, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const itemsKey = getLocalItemsKey(uid);
  const currentInventory = getLocalData(itemsKey, []);

  let targetItem = null;
  const updatedInventory = currentInventory.map((item) => {
    if (item.id === itemId || item.id === `${uid}_${itemId}`) {
      const existingMappings = Array.isArray(item.vendorMappings) ? item.vendorMappings : [];
      const updatedMappings = existingMappings.filter((m) => m.mappingId !== mappingId);
      targetItem = {
        ...item,
        vendorMappings: updatedMappings,
        updatedAt: new Date().toISOString(),
      };
      return targetItem;
    }
    return item;
  });

  setLocalData(itemsKey, updatedInventory);
  bus.emit(`inventory_${uid}`, updatedInventory);

  if (isFirebaseConfigured() && db && targetItem) {
    try {
      setDoc(doc(db, 'inventory_items', targetItem.id), {
        vendorMappings: targetItem.vendorMappings,
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => {});
    } catch (e) {}
  }

  return targetItem;
}

/**
 * 9. Create Purchase Order (PO)
 */
export async function createPurchaseOrder(poData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const poCount = getLocalData(getLocalPosKey(uid), []).length + 1;
  const poNumber = `PO-2026-${String(poCount).padStart(3, '0')}`;

  const cleanItems = (poData.items || []).map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    sku: item.sku || '',
    orderedQty: Number(item.orderedQty) || 0,
    receivedQty: 0,
    unit: item.unit || 'units',
    unitPrice: Number(item.unitPrice) || 0,
  }));

  const totalEstimatedCost = cleanItems.reduce(
    (acc, curr) => acc + curr.orderedQty * curr.unitPrice,
    0
  );

  const newPo = {
    id: 'po-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    poNumber,
    userId: uid,
    destinationCafe: poData.destinationCafe || 'Main Flagship Branch',
    supplierName: poData.supplierName || 'General Supplier',
    status: 'PENDING_DELIVERY', // 'DRAFT' | 'PENDING_DELIVERY' | 'DELIVERED' | 'PARTIAL' | 'CANCELLED'
    items: cleanItems,
    totalEstimatedCost,
    totalCost: totalEstimatedCost,
    notes: poData.notes || '',
    createdAt: new Date().toISOString(),
    expectedDelivery: poData.expectedDelivery || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'purchase_orders', newPo.id), {
        ...newPo,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore PO create error:', e);
    }
  }

  const posKey = getLocalPosKey(uid);
  const pos = getLocalData(posKey, []);
  const updatedPos = [newPo, ...pos];
  setLocalData(posKey, updatedPos);
  bus.emit(`pos_${uid}`, updatedPos);

  logActivity(
    uid,
    'CREATED',
    newPo.id,
    `Purchase Order ${poNumber}`,
    `Generated PO for ${newPo.supplierName} (${cleanItems.length} items, est. ₹${totalEstimatedCost.toFixed(2)})`,
    'Café Manager'
  );

  return newPo;
}

/**
 * 10. Practical Goods Receipt & Delivery Reconciliation
 * Reconciles actual delivered quantities and vendor prices, commits stock to inventory
 */
export async function receivePurchaseOrder(poId, deliveryData, userId = DEFAULT_USER_ID, userName = 'Aarav (Manager)') {
  const uid = userId || DEFAULT_USER_ID;
  const posKey = getLocalPosKey(uid);
  const pos = getLocalData(posKey, []);
  const targetPo = pos.find((p) => p.id === poId);
  if (!targetPo) throw new Error('Purchase Order not found');

  const itemsKey = getLocalItemsKey(uid);
  const currentInventory = getLocalData(itemsKey, []);

  let actualTotalCost = 0;
  let isPartial = false;

  const updatedPoItems = (deliveryData.items || targetPo.items).map((item) => {
    const receivedQty = Math.max(0, Number(item.receivedQty) || 0);
    const unitPrice = Math.max(0, Number(item.unitPrice) || Number(item.orderedQty) || 0);
    const orderedQty = Number(item.orderedQty) || 0;

    if (receivedQty < orderedQty) {
      isPartial = true;
    }

    actualTotalCost += receivedQty * unitPrice;

    return {
      ...item,
      receivedQty,
      unitPrice,
    };
  });

  const finalStatus = isPartial ? 'PARTIAL' : 'DELIVERED';

  // 1. Commit inventory increments and rolling weighted average COGS
  const updatedInventory = currentInventory.map((invItem) => {
    const match = updatedPoItems.find(
      (p) => p.itemId === invItem.id || p.itemId === invItem.rawId || p.sku === invItem.sku
    );
    if (match && match.receivedQty > 0) {
      const existingQty = Math.max(0, Number(invItem.quantity) || 0);
      const existingPrice = Math.max(0, Number(invItem.unitPrice) || 0);
      const receivedQty = Number(match.receivedQty) || 0;
      const invoicePrice = Number(match.unitPrice) || existingPrice;

      const newQty = existingQty + receivedQty;
      // PRD FR-GR-3 Formula: (ExistingQty * ExistingPrice + ReceivedQty * InvoicePrice) / (ExistingQty + ReceivedQty)
      const newBlendedPrice =
        newQty > 0
          ? Number(
              (
                (existingQty * existingPrice + receivedQty * invoicePrice) /
                newQty
              ).toFixed(2)
            )
          : invoicePrice;

      // Commit to Firestore (Single canonical document write)
      if (isFirebaseConfigured() && db) {
        try {
          setDoc(
            doc(db, 'inventory_items', invItem.id),
            {
              quantity: newQty,
              unitPrice: newBlendedPrice,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        } catch (e) {}
      }

      const isMultiVendorPriceDiff = Math.abs(invoicePrice - existingPrice) > 0.01;
      const logType = isMultiVendorPriceDiff ? 'STOCK_RECEIVED_MULTI_VENDOR' : 'STOCK_RECEIVED';
      const detailMsg = isMultiVendorPriceDiff
        ? `Multi-Vendor Intake (${targetPo.supplierName}): +${receivedQty} ${invItem.unit} @ ₹${invoicePrice}. Blended COGS updated: ₹${existingPrice} ➔ ₹${newBlendedPrice}`
        : `Goods Receipt for ${targetPo.poNumber}: +${receivedQty} ${invItem.unit} from ${targetPo.supplierName}`;

      logActivity(
        uid,
        logType,
        invItem.id,
        invItem.name,
        detailMsg,
        userName,
        {
          delta: `+${receivedQty} ${invItem.unit}`,
          newQuantity: newQty,
          unitPrice: newBlendedPrice,
          vendor: targetPo.supplierName,
          invoicePrice,
          previousPrice: existingPrice,
          vendorItemName: match.vendorItemName || match.itemName,
        }
      );

      return {
        ...invItem,
        quantity: newQty,
        unitPrice: newBlendedPrice,
        updatedAt: new Date().toISOString(),
      };
    }
    return invItem;
  });

  setLocalData(itemsKey, updatedInventory);
  bus.emit(`inventory_${uid}`, updatedInventory);

  // 2. Update Purchase Order Status & Financials
  const updatedPo = {
    ...targetPo,
    status: finalStatus,
    items: updatedPoItems,
    totalCost: actualTotalCost,
    receivedAt: new Date().toISOString(),
    receivedBy: userName,
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'purchase_orders', poId), {
        ...updatedPo,
        receivedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {}
  }

  const updatedPos = pos.map((p) => (p.id === poId ? updatedPo : p));
  setLocalData(posKey, updatedPos);
  bus.emit(`pos_${uid}`, updatedPos);

  return updatedPo;
}

/**
 * Vendor Marks PO as Dispatched / In-Transit
 */
export async function updatePurchaseOrderDispatch(
  poId,
  dispatchDetails = {},
  userId = DEFAULT_USER_ID,
  userName = 'Supplier Portal'
) {
  const uid = userId || DEFAULT_USER_ID;
  const posKey = getLocalPosKey(uid);
  const currentPos = getLocalData(posKey, []);
  const targetPo = currentPos.find((p) => p.id === poId || p.poNumber === poId);
  if (!targetPo) return;

  const updatedPo = {
    ...targetPo,
    status: 'PENDING_DELIVERY',
    dispatchStatus: 'DISPATCHED',
    dispatchedAt: new Date().toISOString(),
    trackingNumber: dispatchDetails.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
    carrierName: dispatchDetails.carrierName || 'Direct Delivery Fleet',
    dispatchNotes: dispatchDetails.notes || 'Order packed and dispatched from vendor warehouse.',
  };

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'purchase_orders', targetPo.id), {
        status: 'PENDING_DELIVERY',
        dispatchStatus: 'DISPATCHED',
        dispatchedAt: serverTimestamp(),
        trackingNumber: updatedPo.trackingNumber,
        carrierName: updatedPo.carrierName,
        dispatchNotes: updatedPo.dispatchNotes,
      });
    } catch (e) {}
  }

  const updatedList = currentPos.map((p) => (p.id === targetPo.id ? updatedPo : p));
  setLocalData(posKey, updatedList);
  bus.emit(`pos_${uid}`, updatedList);

  logActivity(
    uid,
    'PO_DISPATCHED_BY_VENDOR',
    targetPo.id,
    targetPo.poNumber,
    `Vendor ${targetPo.supplierName} marked PO ${targetPo.poNumber} as Dispatched (${updatedPo.trackingNumber})`,
    userName
  );

  return updatedPo;
}

/**
 * Categories CRUD
 */
export async function addCategory(categoryData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const clean = {
    userId: uid,
    name: categoryData.name.trim(),
    slug: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    icon: categoryData.icon || 'Coffee',
    description: categoryData.description ? categoryData.description.trim() : '',
  };

  const newId = 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'categories', newId), {
        ...clean,
        id: newId,
        createdAt: serverTimestamp(),
      });
    } catch (e) {}
  }

  const catsKey = getLocalCatsKey(uid);
  const cats = getLocalData(catsKey, []);
  const updated = [...cats, { id: newId, ...clean, createdAt: new Date().toISOString() }];
  setLocalData(catsKey, updated);
  bus.emit(`categories_${uid}`, updated);

  return newId;
}

export async function updateCategory(id, updatedData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'categories', id), { ...updatedData, userId: uid }, { merge: true });
    } catch (e) {}
  }

  const catsKey = getLocalCatsKey(uid);
  const cats = getLocalData(catsKey, []);
  const updated = cats.map((c) => (c.id === id ? { ...c, ...updatedData, userId: uid } : c));
  setLocalData(catsKey, updated);
  bus.emit(`categories_${uid}`, updated);
}

export async function deleteCategory(id, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {}
  }

  const catsKey = getLocalCatsKey(uid);
  const cats = getLocalData(catsKey, []);
  const updated = cats.filter((c) => c.id !== id);
  setLocalData(catsKey, updated);
  bus.emit(`categories_${uid}`, updated);
}

/**
 * Real-time Vendor Subscription
 */
const OLD_DEMO_VENDOR_KEYWORDS = [
  'western ghats',
  'urban cold',
  'country dairy',
  'gourmet syrups',
  'artisan bakehouse',
  'himalayan tea',
  'puratos',
  'ecocups',
  'kyoto imports',
  'urnex',
  'nilgiri single-estate',
  'sustainpack',
];

export function subscribeToVendors(userId = DEFAULT_USER_ID, callback) {
  const uid = userId || DEFAULT_USER_ID;
  const vendorsKey = getLocalVendorsKey(uid);

  let initialVendors = getLocalData(vendorsKey, INITIAL_VENDORS);
  callback(initialVendors);

  const unsubscribeBus = bus.on(`vendors_${uid}`, (updatedVendors) => {
    callback(updatedVendors);
  });

  let handleStorage = null;
  if (typeof window !== 'undefined') {
    handleStorage = (e) => {
      if (e.key === vendorsKey && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
  }

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'vendors'), where('userId', '==', uid));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreVendors = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setLocalData(vendorsKey, firestoreVendors);
            callback(firestoreVendors);
          } else {
            setLocalData(vendorsKey, INITIAL_VENDORS);
            callback(INITIAL_VENDORS);
          }
        },
        (err) => {
          console.warn('Firestore vendors offline notice:', err.message);
        }
      );
    } catch (e) {
      console.warn('Firestore vendors query skipped:', e.message);
    }
  }

  return () => {
    unsubscribeBus();
    unsubscribeFirestore();
    if (handleStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * Add New Vendor
 */
export async function addVendor(vendorData, userId = DEFAULT_USER_ID, userName = 'Manager') {
  const uid = userId || DEFAULT_USER_ID;
  const vendorsKey = getLocalVendorsKey(uid);
  const currentVendors = getLocalData(vendorsKey, []);

  const newVendor = {
    id: `ven_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: vendorData.name.trim(),
    contactPerson: vendorData.contactPerson ? vendorData.contactPerson.trim() : '',
    email: vendorData.email ? vendorData.email.trim() : '',
    phone: vendorData.phone ? vendorData.phone.trim() : '',
    city: vendorData.city ? vendorData.city.trim() : '',
    leadTimeDays: Number(vendorData.leadTimeDays) || 2,
    paymentTerms: vendorData.paymentTerms || 'Net 15',
    notes: vendorData.notes ? vendorData.notes.trim() : '',
    userId: uid,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, 'vendors'), {
        ...newVendor,
        createdAt: serverTimestamp(),
      });
      newVendor.id = docRef.id;
    } catch (e) {
      console.warn('Notice saving vendor:', e.message);
    }
  }

  const updatedVendors = [newVendor, ...currentVendors];
  setLocalData(vendorsKey, updatedVendors);
  bus.emit(`vendors_${uid}`, updatedVendors);

  logActivity(
    uid,
    'VENDOR_REGISTERED',
    newVendor.id,
    newVendor.name,
    `Registered new supplier: ${newVendor.name} (${newVendor.city || 'Direct'})`,
    userName
  );

  return newVendor;
}

/**
 * Update Existing Vendor
 */
export async function updateVendor(id, updatedData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const vendorsKey = getLocalVendorsKey(uid);
  const currentVendors = getLocalData(vendorsKey, []);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'vendors', id), {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Notice updating vendor:', e.message);
    }
  }

  const updatedVendors = currentVendors.map((v) =>
    v.id === id ? { ...v, ...updatedData, updatedAt: new Date().toISOString() } : v
  );
  setLocalData(vendorsKey, updatedVendors);
  bus.emit(`vendors_${uid}`, updatedVendors);
}

/**
 * Delete Vendor
 */
export async function deleteVendor(id, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const vendorsKey = getLocalVendorsKey(uid);
  const currentVendors = getLocalData(vendorsKey, []);

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'vendors', id));
    } catch (e) {
      console.warn('Notice deleting vendor:', e.message);
    }
  }

  const updatedVendors = currentVendors.filter((v) => v.id !== id);
  setLocalData(vendorsKey, updatedVendors);
  bus.emit(`vendors_${uid}`, updatedVendors);
}

export const INITIAL_SUPPLIER_APPLICATIONS = [];

/**
 * Real-time Supplier Applications Subscription
 */
export function subscribeToSupplierApplications(userId = DEFAULT_USER_ID, callback) {
  const uid = userId || DEFAULT_USER_ID;
  const appsKey = getLocalAppsKey(uid);

  let initialApps = getLocalData(appsKey, []);
  callback(initialApps);

  const unsubscribeBus = bus.on(`supplier_apps_${uid}`, (updatedApps) => {
    callback(updatedApps);
  });

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'supplier_applications'));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreApps = snapshot.docs.map((doc) => {
              const data = doc.data();
              let ts = data.createdAt;
              if (ts && typeof ts === 'object' && ts.seconds) {
                ts = new Date(ts.seconds * 1000).toISOString();
              } else if (!ts || typeof ts !== 'string') {
                ts = new Date().toISOString();
              }
              return {
                ...data,
                id: doc.id,
                createdAt: ts,
              };
            });

            firestoreApps.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setLocalData(appsKey, firestoreApps);
            callback(firestoreApps);
          } else {
            callback([]);
          }
        },
        (err) => {
          console.warn('Firestore supplier applications query fallback:', err.message);
        }
      );
    } catch (e) {
      console.warn('Firestore supplier applications query skipped:', e.message);
    }
  }

  return () => {
    unsubscribeBus();
    unsubscribeFirestore();
  };
}

/**
 * Submit New Public Supplier Application (Self-Registration & Catalog Bids)
 */
export async function submitSupplierApplication(applicationData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const appsKey = getLocalAppsKey(uid);
  const currentApps = getLocalData(appsKey, []);

  const newApp = {
    ...applicationData,
    id: 'app-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: uid,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, 'supplier_applications'), {
        ...newApp,
        createdAt: serverTimestamp(),
      });
      newApp.id = docRef.id;
    } catch (e) {
      console.warn('Notice saving supplier application:', e.message);
    }
  }

  // Update target cafe's local store
  const updatedApps = [newApp, ...currentApps.filter((a) => a.id !== newApp.id)];
  setLocalData(appsKey, updatedApps);
  bus.emit(`supplier_apps_${uid}`, updatedApps);

  // Also broadcast to demo account and all stored cafe app keys for seamless multi-tab testing
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const demoKey = getLocalAppsKey(DEFAULT_USER_ID);
      if (demoKey !== appsKey) {
        const demoApps = getLocalData(demoKey, []);
        const updatedDemo = [newApp, ...demoApps.filter((a) => a.id !== newApp.id)];
        setLocalData(demoKey, updatedDemo);
        bus.emit(`supplier_apps_${DEFAULT_USER_ID}`, updatedDemo);
      }

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cafepulse_supplier_apps_') && k !== appsKey && k !== demoKey) {
          const list = getLocalData(k, []);
          setLocalData(k, [newApp, ...list.filter((a) => a.id !== newApp.id)]);
        }
      }
    }
  } catch (e) {}

  // Auto-register vendor so they appear immediately in the Active Suppliers list
  try {
    await addVendor(
      {
        name: newApp.companyName.trim(),
        contactPerson: newApp.contactPerson || '',
        email: newApp.email || '',
        phone: newApp.phone || '',
        city: newApp.city || '',
        gstin: newApp.gstin || '',
        category: newApp.category || 'Specialty Supplier',
        leadTimeDays: Number(newApp.leadTimeDays) || 2,
        paymentTerms: newApp.paymentTerms || 'Net 15',
        minimumOrderValue: Number(newApp.minimumOrderValue) || 0,
        notes: `Self-registered on ${new Date().toLocaleDateString()}`,
      },
      uid,
      'Self-Registration'
    );
  } catch (e) {}

  logActivity(
    uid,
    'SUPPLIER_APPLICATION_RECEIVED',
    newApp.id,
    newApp.companyName,
    `New wholesale supplier application received from ${newApp.companyName} (${newApp.quotedItems?.length || 0} quoted items)`,
    'Public Portal'
  );

  return newApp;
}

/**
 * Approve Supplier Application (Registers Vendor & Maps All Quoted Items)
 */
export async function approveSupplierApplication(applicationIdOrObj, userId = DEFAULT_USER_ID, userName = 'Café Manager', appData = null) {
  const uid = userId || DEFAULT_USER_ID;
  const appsKey = getLocalAppsKey(uid);
  const currentApps = getLocalData(appsKey, []);

  let targetApp = null;
  let applicationId = typeof applicationIdOrObj === 'string' ? applicationIdOrObj : applicationIdOrObj?.id;

  if (typeof applicationIdOrObj === 'object' && applicationIdOrObj !== null) {
    targetApp = applicationIdOrObj;
    applicationId = applicationIdOrObj.id || applicationIdOrObj.firestoreDocId || applicationId;
  } else if (appData && typeof appData === 'object') {
    targetApp = appData;
  }

  if (!targetApp) {
    targetApp = currentApps.find(
      (a) =>
        a.id === applicationId ||
        a.rawId === applicationId ||
        a.firestoreDocId === applicationId ||
        (a.companyName && applicationId && a.companyName.toLowerCase() === applicationId.toLowerCase())
    );
  }

  // If not found in local state, fetch directly from Firestore
  if (!targetApp && isFirebaseConfigured() && db && applicationId) {
    try {
      const snap = await getDoc(doc(db, 'supplier_applications', applicationId));
      if (snap.exists()) {
        targetApp = { id: snap.id, firestoreDocId: snap.id, ...snap.data() };
      } else {
        const qSnap = await getDocs(query(collection(db, 'supplier_applications'), where('id', '==', applicationId)));
        if (!qSnap.empty) {
          const firstDoc = qSnap.docs[0];
          targetApp = { id: firstDoc.id, firestoreDocId: firstDoc.id, ...firstDoc.data() };
        }
      }
    } catch (e) {
      console.warn('Notice fetching application from Firestore:', e.message);
    }
  }

  if (!targetApp) {
    targetApp = {
      id: applicationId || `app-${Date.now()}`,
      companyName: 'Registered Supplier',
      status: 'APPROVED',
      quotedItems: [],
    };
  }

  // 1. Create & Register Vendor Profile
  const vendorPayload = {
    name: targetApp.companyName ? targetApp.companyName.trim() : 'Approved Supplier',
    contactPerson: targetApp.contactPerson || '',
    email: targetApp.email || '',
    phone: targetApp.phone || '',
    city: targetApp.city || 'Direct',
    gstin: targetApp.gstin || '',
    category: targetApp.category || 'General Supplier',
    leadTimeDays: Number(targetApp.leadTimeDays) || 2,
    paymentTerms: targetApp.paymentTerms || 'Net 15',
    minimumOrderValue: Number(targetApp.minimumOrderValue) || 0,
    notes: targetApp.notes || `Approved from Self-Registration on ${new Date().toLocaleDateString()}`,
  };

  try {
    await addVendor(vendorPayload, uid, userName);
  } catch (e) {
    console.warn('Notice adding vendor during approval:', e.message);
  }

  // 2. Map all quoted items into Store Master Inventory, and CREATE them if not existing
  if (Array.isArray(targetApp.quotedItems)) {
    const itemsKey = getLocalItemsKey(uid);
    let currentStoreItems = getLocalData(itemsKey, []);

    for (const quote of targetApp.quotedItems) {
      if (quote.wholesalePrice > 0) {
        const quoteName = quote.vendorTradeName || quote.masterItemName || 'Specialty Item';
        const quoteSku = quote.masterSku || quote.vendorSku || `SKU-${Date.now().toString().slice(-4)}`;
        const quotePrice = Number(quote.wholesalePrice) || 0;
        const quoteUnit = quote.unit || 'kg';

        // Check if item exists in store catalog
        const existingItem = currentStoreItems.find(
          (i) =>
            i.id === quote.masterItemId ||
            i.id === `${uid}_${quote.masterItemId}` ||
            (i.sku && quoteSku && i.sku.toUpperCase() === quoteSku.toUpperCase()) ||
            (i.name && quoteName && i.name.toLowerCase().trim() === quoteName.toLowerCase().trim())
        );

        if (existingItem) {
          try {
            await addVendorPriceMapping(
              existingItem.id,
              {
                vendorName: targetApp.companyName.trim(),
                vendorItemName: quoteName,
                vendorSku: quoteSku,
                unitPrice: quotePrice,
                isPreferred: false,
                leadTimeDays: Number(targetApp.leadTimeDays) || 2,
                notes: quote.notes || '',
              },
              uid,
              userName
            );
          } catch (e) {}
        } else {
          // Create the new item in Inventory!
          try {
            const newItemPayload = {
              name: quoteName,
              category: quote.category || targetApp.category || 'Specialty Coffee',
              sku: quoteSku,
              unit: quoteUnit,
              quantity: 0, // Freshly cataloged, ready to reorder
              unitPrice: quotePrice,
              reorderLevel: 5,
              parLevel: 20,
              supplier: targetApp.companyName.trim(),
              notes: `Cataloged from approved supplier quote (${targetApp.companyName})`,
              vendorMappings: [
                {
                  mappingId: `vm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  vendorName: targetApp.companyName.trim(),
                  vendorItemName: quoteName,
                  vendorSku: quoteSku,
                  unitPrice: quotePrice,
                  isPreferred: true,
                  leadTimeDays: Number(targetApp.leadTimeDays) || 2,
                  notes: quote.notes || '',
                },
              ],
            };
            const created = await addInventoryItem(newItemPayload, uid);
            if (created) {
              currentStoreItems = [created, ...currentStoreItems];
            }
          } catch (e) {
            console.warn('Notice auto-creating inventory item:', e.message);
          }
        }
      }
    }
  }

  // 3. Mark Application as APPROVED
  const updatedApp = {
    ...targetApp,
    status: 'APPROVED',
    approvedAt: new Date().toISOString(),
    approvedBy: userName,
  };

  const firestoreDocId = targetApp.firestoreDocId || targetApp.id || applicationId;
  if (isFirebaseConfigured() && db && firestoreDocId) {
    try {
      await setDoc(
        doc(db, 'supplier_applications', firestoreDocId),
        {
          status: 'APPROVED',
          approvedAt: serverTimestamp(),
          approvedBy: userName,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Notice updating Firestore application status:', e.message);
    }
  }

  const updatedApps = currentApps.map((a) =>
    a.id === applicationId || a.rawId === applicationId || a.id === targetApp.id ? updatedApp : a
  );
  if (!updatedApps.some((a) => a.id === targetApp.id || a.id === applicationId)) {
    updatedApps.unshift(updatedApp);
  }
  setLocalData(appsKey, updatedApps);
  bus.emit(`supplier_apps_${uid}`, updatedApps);

  logActivity(
    uid,
    'SUPPLIER_APPLICATION_APPROVED',
    targetApp.id,
    targetApp.companyName,
    `Approved supplier ${targetApp.companyName} & mapped ${targetApp.quotedItems?.length || 0} product price books`,
    userName
  );

  return updatedApp;
}

/**
 * Reject Supplier Application
 */
export async function rejectSupplierApplication(applicationId, userId = DEFAULT_USER_ID, userName = 'Café Manager') {
  const uid = userId || DEFAULT_USER_ID;
  const appsKey = getLocalAppsKey(uid);
  const currentApps = getLocalData(appsKey, []);

  const updatedApps = currentApps.map((a) =>
    a.id === applicationId || a.rawId === applicationId
      ? { ...a, status: 'REJECTED', rejectedAt: new Date().toISOString(), rejectedBy: userName }
      : a
  );

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'supplier_applications', applicationId), {
        status: 'REJECTED',
        rejectedAt: serverTimestamp(),
        rejectedBy: userName,
      }, { merge: true });
    } catch (e) {}
  }

  setLocalData(appsKey, updatedApps);
  bus.emit(`supplier_apps_${uid}`, updatedApps);
}

/**
 * Real-time Staff Members Subscription
 */
export function subscribeToStaffMembers(userId = DEFAULT_USER_ID, callback) {
  const uid = userId || DEFAULT_USER_ID;
  const staffKey = getLocalStaffKey(uid);

  let initialStaff = getLocalData(staffKey, INITIAL_STAFF_MEMBERS);
  callback(initialStaff);

  const unsubscribeBus = bus.on(`staff_${uid}`, (updatedStaff) => {
    callback(updatedStaff);
  });

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'staff_members'), where('userId', '==', uid));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreStaff = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setLocalData(staffKey, firestoreStaff);
            callback(firestoreStaff);
          } else {
            setLocalData(staffKey, INITIAL_STAFF_MEMBERS);
            callback(INITIAL_STAFF_MEMBERS);
          }
        },
        (err) => {
          console.warn('Firestore staff members offline fallback:', err.message);
        }
      );
    } catch (e) {
      console.warn('Firestore staff query skipped:', e.message);
    }
  }

  return () => {
    unsubscribeBus();
    unsubscribeFirestore();
  };
}

/**
 * Add New Staff Member
 */
export async function addStaffMember(staffData, userId = DEFAULT_USER_ID, userName = 'Café Admin') {
  const uid = userId || DEFAULT_USER_ID;
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);

  const newStaff = {
    id: 'staff-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: uid,
    name: staffData.name.trim(),
    email: staffData.email.trim(),
    phone: staffData.phone ? staffData.phone.trim() : '',
    role: staffData.role || 'barista',
    roleLabel: staffData.roleLabel || 'Shift Barista',
    branch: staffData.branch || 'Main Flagship Branch',
    shift: staffData.shift || 'Morning Shift (6:30 AM - 3:00 PM)',
    status: staffData.status || 'ACTIVE',
    pin: staffData.pin || '1234',
    joinedDate: staffData.joinedDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, 'staff_members'), {
        ...newStaff,
        createdAt: serverTimestamp(),
      });
      newStaff.id = docRef.id;
    } catch (e) {
      console.warn('Notice saving staff member:', e.message);
    }
  }

  const updatedStaff = [newStaff, ...currentStaff];
  setLocalData(staffKey, updatedStaff);
  bus.emit(`staff_${uid}`, updatedStaff);

  logActivity(
    uid,
    'STAFF_ACCOUNT_CREATED',
    newStaff.id,
    newStaff.name,
    `Added new team member: ${newStaff.name} as ${newStaff.roleLabel} (${newStaff.branch})`,
    userName
  );

  return newStaff;
}

/**
 * Update Staff Member
 */
export async function updateStaffMember(id, staffData, userId = DEFAULT_USER_ID, userName = 'Café Admin') {
  const uid = userId || DEFAULT_USER_ID;
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'staff_members', id), {
        ...staffData,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Notice updating staff member:', e.message);
    }
  }

  const updatedStaff = currentStaff.map((s) =>
    s.id === id ? { ...s, ...staffData, updatedAt: new Date().toISOString() } : s
  );
  setLocalData(staffKey, updatedStaff);
  bus.emit(`staff_${uid}`, updatedStaff);

  logActivity(
    uid,
    'STAFF_ACCOUNT_UPDATED',
    id,
    staffData.name || 'Staff Member',
    `Updated profile & permissions for ${staffData.name || 'staff member'}`,
    userName
  );
}

/**
 * Delete Staff Member
 */
export async function deleteStaffMember(id, userId = DEFAULT_USER_ID, userName = 'Café Admin') {
  const uid = userId || DEFAULT_USER_ID;
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);
  const target = currentStaff.find((s) => s.id === id);

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'staff_members', id));
      if (target?.email) {
        const q = query(
          collection(db, 'staff_members'),
          where('userId', '==', uid),
          where('email', '==', target.email.toLowerCase().trim())
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, 'staff_members', d.id));
        }
      }
    } catch (e) {
      console.warn('Notice deleting staff member:', e.message);
    }
  }

  const updatedStaff = currentStaff.filter((s) => s.id !== id);
  setLocalData(staffKey, updatedStaff);
  bus.emit(`staff_${uid}`, updatedStaff);

  logActivity(
    uid,
    'STAFF_ACCOUNT_DELETED',
    id,
    target?.name || 'Staff Member',
    `Removed staff account for ${target?.name || 'staff member'}`,
    userName
  );
}

/**
 * Toggle Staff Active / Inactive Status
 */
export async function toggleStaffStatus(id, newStatus, userId = DEFAULT_USER_ID, userName = 'Café Admin') {
  const uid = userId || DEFAULT_USER_ID;
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);
  const target = currentStaff.find((s) => s.id === id);

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'staff_members', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {}
  }

  const updatedStaff = currentStaff.map((s) => (s.id === id ? { ...s, status: newStatus } : s));
  setLocalData(staffKey, updatedStaff);
  bus.emit(`staff_${uid}`, updatedStaff);

  logActivity(
    uid,
    'STAFF_STATUS_CHANGED',
    id,
    target?.name || 'Staff Member',
    `Changed ${target?.name}'s account status to ${newStatus}`,
    userName
  );
}

/**
 * Seed Sample Data for User Account
 */
export async function seedSampleData(userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;

  if (isFirebaseConfigured() && db) {
    try {
      for (const cat of INITIAL_CATEGORIES) {
        const catDocId = `${uid}_${cat.id}`;
        await setDoc(doc(db, 'categories', catDocId), {
          ...cat,
          id: catDocId,
          userId: uid,
          createdAt: serverTimestamp(),
        });
      }
      for (const item of INITIAL_INVENTORY_ITEMS) {
        const itemDocId = `${uid}_${item.id}`;
        await setDoc(doc(db, 'inventory_items', itemDocId), {
          ...item,
          id: itemDocId,
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const po of INITIAL_PURCHASE_ORDERS) {
        const poDocId = `${uid}_${po.id}`;
        await setDoc(doc(db, 'purchase_orders', poDocId), {
          ...po,
          id: poDocId,
          userId: uid,
          createdAt: serverTimestamp(),
        });
      }
      for (const v of INITIAL_VENDORS) {
        const vDocId = `${uid}_${v.id}`;
        await setDoc(doc(db, 'vendors', vDocId), {
          ...v,
          id: vDocId,
          userId: uid,
          createdAt: serverTimestamp(),
        });
      }
      for (const st of INITIAL_STAFF_MEMBERS) {
        const stDocId = `${uid}_${st.id}`;
        await setDoc(doc(db, 'staff_members', stDocId), {
          ...st,
          id: stDocId,
          userId: uid,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Notice seeding account data:', e.message);
    }
  }

  const itemsWithUser = INITIAL_INVENTORY_ITEMS.map((item) => ({
    ...item,
    id: `${uid}_${item.id}`,
    userId: uid,
  }));
  const catsWithUser = INITIAL_CATEGORIES.map((cat) => ({
    ...cat,
    id: `${uid}_${cat.id}`,
    userId: uid,
  }));
  const posWithUser = INITIAL_PURCHASE_ORDERS.map((po) => ({
    ...po,
    id: `${uid}_${po.id}`,
    userId: uid,
  }));
  const staffWithUser = INITIAL_STAFF_MEMBERS.map((s) => ({
    ...s,
    id: `${uid}_${s.id}`,
    userId: uid,
  }));

  setLocalData(getLocalItemsKey(uid), itemsWithUser);
  setLocalData(getLocalCatsKey(uid), catsWithUser);
  setLocalData(getLocalPosKey(uid), posWithUser);
  setLocalData(getLocalVendorsKey(uid), vendorsWithUser);
  setLocalData(getLocalStaffKey(uid), staffWithUser);
  setLocalData(getLocalAppsKey(uid), []);

  bus.emit(`inventory_${uid}`, itemsWithUser);
  bus.emit(`categories_${uid}`, catsWithUser);
  bus.emit(`pos_${uid}`, posWithUser);
  bus.emit(`vendors_${uid}`, vendorsWithUser);
  bus.emit(`staff_${uid}`, staffWithUser);
  bus.emit(`supplier_apps_${uid}`, []);

  logActivity(uid, 'STOCK_RECEIVED', 'all', 'Single Vendor Demo Inventory', 'Loaded demo inventory connected to 1 roastery partner: Mercara Coffee Roasters', 'System Seed');
}

/**
 * Clear All Account Data to start 100% blank
 */
export async function clearAccountData(userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;

  setLocalData(getLocalItemsKey(uid), []);
  setLocalData(getLocalCatsKey(uid), INITIAL_CATEGORIES.map((c) => ({ ...c, userId: uid })));
  setLocalData(getLocalPosKey(uid), []);
  setLocalData(getLocalVendorsKey(uid), []);
  setLocalData(getLocalStaffKey(uid), []);
  setLocalData(getLocalAppsKey(uid), []);

  bus.emit(`inventory_${uid}`, []);
  bus.emit(`categories_${uid}`, INITIAL_CATEGORIES.map((c) => ({ ...c, userId: uid })));
  bus.emit(`pos_${uid}`, []);
  bus.emit(`vendors_${uid}`, []);
  bus.emit(`staff_${uid}`, []);
  bus.emit(`supplier_apps_${uid}`, []);

  logActivity(uid, 'WORKSPACE_RESET', 'all', 'Clean Slate Workspace', 'Cleared inventory and started with blank workspace', 'Café Admin');
}

/**
 * 12. Subscribe to Real-time Registered Cafés
 */
export function subscribeToRegisteredCafes(callback) {
  callback([]);

  if (isFirebaseConfigured() && db) {
    try {
      const unsubFirestore = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const loadedCafes = [];
          const seenUids = new Set();

          snapshot.docs.forEach((d) => {
            const data = d.data();
            const uUid = data.uid || d.id;
            if (uUid && !seenUids.has(uUid)) {
              seenUids.add(uUid);
              loadedCafes.push({
                id: uUid,
                uid: uUid,
                name: data.cafeName || (data.displayName ? `${data.displayName}'s Café` : 'Artisan Café'),
                branchName: data.branchName || 'Main Branch',
                city: data.city || 'Direct Sourcing',
                address: data.address || `${data.branchName || 'Store'} Location`,
                managerName: data.displayName || data.email?.split('@')[0] || 'Store Administrator',
                monthlyVolumeEstimate: data.monthlyVolume || 'Active Café',
                monthlyOrdersCount: 0,
                badge: 'Registered Café',
                activeDemands: [],
              });
            }
          });
          callback(loadedCafes);
        },
        (err) => {
          console.warn('Firestore cafes subscription notice:', err.message);
        }
      );
      return unsubFirestore;
    } catch (e) {}
  }

  return () => {};
}
