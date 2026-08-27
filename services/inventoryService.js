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

function getLocalCategoriesKey(userId) {
  return getLocalCatsKey(userId);
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

export function getDocTimestamp(docData) {
  if (!docData) return 0;
  const ts = docData.updatedAt || docData.createdAt || docData.timestamp;
  if (!ts) return 0;
  if (typeof ts === 'object' && typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + (ts.nanoseconds ? ts.nanoseconds / 1000000 : 0);
  }
  if (typeof ts === 'string') {
    const parsed = new Date(ts).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof ts === 'number') return ts;
  return 0;
}

export function deduplicateByNewest(items) {
  if (!Array.isArray(items)) return [];
  const sorted = [...items].sort((a, b) => getDocTimestamp(b) - getDocTimestamp(a));
  const seen = new Set();
  const result = [];
  for (const item of sorted) {
    if (!item) continue;
    const rawId = String(item.id || item.docId || '').trim();
    if (!rawId) continue;
    const unPrefixedId = rawId.includes('_item-') || rawId.includes('_cat-') || rawId.includes('_po-') || rawId.includes('_ven-') || rawId.includes('_staff-')
      ? rawId.substring(rawId.indexOf('_') + 1)
      : rawId;

    if (!seen.has(rawId) && !seen.has(unPrefixedId)) {
      seen.add(rawId);
      seen.add(unPrefixedId);
      result.push({
        ...item,
        id: item.id || unPrefixedId,
      });
    }
  }
  return result;
}

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

export function resolveUid(userId) {
  if (userId && userId !== 'guest' && userId !== 'all') return userId;
  if (typeof window !== 'undefined') {
    try {
      const session = JSON.parse(localStorage.getItem('cafepulse_user_session') || '{}');
      if (session?.storeUid && session.storeUid !== 'guest') return session.storeUid;
      if (session?.uid && session.uid !== 'guest') return session.uid;
    } catch (e) {}
  }
  return DEFAULT_USER_ID;
}

export function logActivity(userId = DEFAULT_USER_ID, type, itemId, itemName, detail, userName = 'Café Manager', extraMeta = {}) {
  const uid = resolveUid(userId);
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
  // If userId is null or 'all', subscribe to ALL inventory items across all cafes
  if (!userId || userId === 'all') {
    const getAllLocalItems = () => {
      const allItems = [];
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('cafepulse_items_')) {
            const list = getLocalData(k, []);
            if (Array.isArray(list)) allItems.push(...list);
          }
        }
      }
      const deduped = deduplicateByNewest(allItems);
      return deduped.length > 0 ? deduped : INITIAL_INVENTORY_ITEMS;
    };

    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'inventory_items'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const rawItems = snapshot.docs.map((d) => ({
                ...d.data(),
                id: d.data().id || d.id,
                docId: d.id,
              }));
              const uniqueItems = deduplicateByNewest(rawItems);
              callback(uniqueItems);
            } else {
              callback(getAllLocalItems());
            }
          },
          (err) => {
            console.warn('Firestore all inventory snapshot notice:', err);
            callback(getAllLocalItems());
          }
        );
        return unsubscribe;
      } catch (e) {}
    }

    setTimeout(() => callback(getAllLocalItems()), 0);
    return bus.on('all_items_updated', () => callback(getAllLocalItems()));
  }

  const uid = resolveUid(userId);
  const localKey = getLocalItemsKey(uid);

  // Deliver cached local session immediately for zero-lag UI
  const rawLocal = getLocalData(localKey, []);
  callback(deduplicateByNewest(rawLocal));

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'inventory_items'),
        where('userId', '==', uid)
      );

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const rawItems = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                ...data,
                id: data.id || d.id,
                docId: d.id,
              };
            });

            const uniqueItems = deduplicateByNewest(rawItems);

            setLocalData(localKey, uniqueItems);
            callback(uniqueItems);
            bus.emit(`inventory_${uid}`, uniqueItems);
            bus.emit('all_items_updated', uniqueItems);
          } else {
            const local = getLocalData(localKey, uid === 'demo_cafepulse_admin' ? INITIAL_INVENTORY_ITEMS : []);
            if (local && local.length > 0) {
              local.forEach((itm) => {
                const itemId = itm.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
                setDoc(
                  doc(db, 'inventory_items', itemId),
                  { ...itm, id: itemId, userId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
                  { merge: true }
                ).catch(() => {});
              });
              setLocalData(localKey, local);
              callback(deduplicateByNewest(local));
            } else {
              setLocalData(localKey, []);
              callback([]);
            }
          }
        },
        (error) => {
          console.warn('Firestore inventory snapshot notice:', error);
          const local = getLocalData(localKey, uid === 'demo_cafepulse_admin' ? INITIAL_INVENTORY_ITEMS : []);
          callback(deduplicateByNewest(local));
        }
      );
    } catch (e) {
      console.warn('Firestore inventory query initialization notice:', e);
    }
  }

  const unsubBus = bus.on(`inventory_${uid}`, (updated) => {
    if (Array.isArray(updated)) {
      callback(deduplicateByNewest(updated));
    }
  });

  let handleStorage = null;
  if (typeof window !== 'undefined') {
    handleStorage = (e) => {
      if (e.key === localKey && e.newValue) {
        try {
          callback(deduplicateByNewest(JSON.parse(e.newValue)));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubBus();
    unsubscribeFirestore();
    if (handleStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * 2. Subscribe to Categories
 */
export function subscribeToCategories(userId, callback) {
  const uid = resolveUid(userId);
  const localCatsKey = getLocalCatsKey(uid);

  // Deliver cached categories immediately
  const localCats = getLocalData(localCatsKey, INITIAL_CATEGORIES);
  const initialValid = localCats && localCats.length > 0 ? localCats : INITIAL_CATEGORIES;
  callback(deduplicateByNewest(initialValid));

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'categories'),
        where('userId', '==', uid)
      );

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const rawCats = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                ...data,
                id: data.id || d.id,
                docId: d.id,
              };
            });
            const uniqueCats = deduplicateByNewest(rawCats);
            setLocalData(localCatsKey, uniqueCats);
            callback(uniqueCats);
            bus.emit(`categories_${uid}`, uniqueCats);
          } else {
            // Seed INITIAL_CATEGORIES if empty and sync to Firestore
            const local = getLocalData(localCatsKey, INITIAL_CATEGORIES);
            const valid = local && local.length > 0 ? local : INITIAL_CATEGORIES;
            setLocalData(localCatsKey, valid);
            callback(deduplicateByNewest(valid));

            valid.forEach((cat) => {
              const catId = cat.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
              setDoc(
                doc(db, 'categories', catId),
                {
                  ...cat,
                  id: catId,
                  originalId: catId,
                  userId: uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch(() => {});
            });
          }
        },
        (err) => {
          console.warn('Firestore categories snapshot notice:', err);
          const local = getLocalData(localCatsKey, INITIAL_CATEGORIES);
          callback(deduplicateByNewest(local && local.length > 0 ? local : INITIAL_CATEGORIES));
        }
      );
    } catch (e) {
      console.warn('Firestore categories subscribe notice:', e);
    }
  }

  const unsubBus = bus.on(`categories_${uid}`, (updated) => {
    callback(deduplicateByNewest(updated));
  });
  return () => {
    unsubBus();
    unsubscribeFirestore();
  };
}

/**
 * 3. Subscribe to Activity Logs (Realtime Dual-Channel)
 */
export function subscribeToActivityLogs(userId, callback) {
  const uid = resolveUid(userId);

  // 1. Immediate local session delivery
  const initialLogs = getLocalData(getLocalLogsKey(uid), []);
  callback(deduplicateByNewest(initialLogs));

  // 2. Subscribe to zero-latency local event bus
  const unsubBus = bus.on(`logs_${uid}`, (updated) => {
    callback(deduplicateByNewest(updated));
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

            const uniqueLogs = deduplicateByNewest(rawLogs);
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
  // If userId is null or 'all', subscribe to ALL purchase orders across all cafes
  if (!userId || userId === 'all') {
    const getAllLocalPos = () => {
      const allPos = [];
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('cafepulse_pos_')) {
            const list = getLocalData(k, []);
            if (Array.isArray(list)) allPos.push(...list);
          }
        }
      }
      const deduped = deduplicateByNewest(allPos);
      deduped.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return deduped.length > 0 ? deduped : INITIAL_PURCHASE_ORDERS;
    };

    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'purchase_orders'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const rawPos = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
              const uniquePos = deduplicateByNewest(rawPos);
              uniquePos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              callback(uniquePos);
            } else {
              callback(getAllLocalPos());
            }
          },
          () => callback(getAllLocalPos())
        );
        return unsubscribe;
      } catch (e) {}
    }

    setTimeout(() => callback(getAllLocalPos()), 0);
    const busUnsub = bus.on('all_pos_updated', () => callback(getAllLocalPos()));
    return busUnsub;
  }

  const uid = resolveUid(userId);
  const localKey = getLocalPosKey(uid);
  const localPos = getLocalData(localKey, INITIAL_PURCHASE_ORDERS);
  callback(deduplicateByNewest(localPos));

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, 'purchase_orders'),
        where('userId', '==', uid)
      );

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const rawPos = snapshot.docs.map((d) => ({
              ...d.data(),
              id: d.id,
            }));
            const uniquePos = deduplicateByNewest(rawPos);
            uniquePos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setLocalData(localKey, uniquePos);
            callback(uniquePos);
            bus.emit(`pos_${uid}`, uniquePos);
          } else {
            const local = getLocalData(localKey, []);
            if (local && local.length > 0) {
              local.forEach((po) => {
                setDoc(
                  doc(db, 'purchase_orders', po.id),
                  { ...po, userId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
                  { merge: true }
                ).catch(() => {});
              });
              callback(deduplicateByNewest(local));
            } else {
              callback(INITIAL_PURCHASE_ORDERS);
            }
          }
        },
        () => {
          const local = getLocalData(localKey, INITIAL_PURCHASE_ORDERS);
          callback(deduplicateByNewest(local));
        }
      );
    } catch (e) {}
  }

  const unsubBus = bus.on(`pos_${uid}`, (updated) => {
    callback(deduplicateByNewest(updated));
  });

  let handleStorage = null;
  if (typeof window !== 'undefined') {
    handleStorage = (e) => {
      if (e.key === localKey && e.newValue) {
        try {
          callback(deduplicateByNewest(JSON.parse(e.newValue)));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubBus();
    unsubscribeFirestore();
    if (handleStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

/**
 * 5. Add Inventory Item
 */
export async function addInventoryItem(itemData, userId = DEFAULT_USER_ID) {
  const uid = resolveUid(userId);
  const newId = itemData.id || ('item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5));
  const cleanData = {
    id: newId,
    userId: uid,
    name: (itemData.name || '').trim(),
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
    vendorMappings: Array.isArray(itemData.vendorMappings)
      ? itemData.vendorMappings.map((m) => ({
          mappingId: m.mappingId || `vm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          vendorName: m.vendorName || '',
          vendorItemName: m.vendorItemName || (itemData.name || '').trim(),
          vendorSku: m.vendorSku || '',
          unitPrice: Number(m.unitPrice) || 0,
          isPreferred: Boolean(m.isPreferred),
          leadTimeDays: Number(m.leadTimeDays) || 2,
          notes: m.notes || '',
        }))
      : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'inventory_items', newId), {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Firestore add item notice:', e);
    }
  }

  const itemsKey = getLocalItemsKey(uid);
  const items = getLocalData(itemsKey, []);
  const newItem = {
    ...cleanData,
  };
  const updated = deduplicateByNewest([newItem, ...items.filter((i) => i.id !== newId)]);
  setLocalData(itemsKey, updated);
  bus.emit(`inventory_${uid}`, updated);
  bus.emit('all_items_updated', updated);

  logActivity(uid, 'CREATED', newId, cleanData.name, `Added with initial stock of ${cleanData.quantity} ${cleanData.unit}`, 'Café Manager', { delta: `+${cleanData.quantity} ${cleanData.unit}` });
  return newItem;
}

/**
 * 6. Update Inventory Item
 */
export async function updateInventoryItem(id, updatedData, userId = DEFAULT_USER_ID) {
  const uid = resolveUid(userId);
  const cleanData = { ...updatedData, userId: uid, id, updatedAt: new Date().toISOString() };
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
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'inventory_items', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {
      console.error('Firestore update notice:', e);
    }
  }

  const itemsKey = getLocalItemsKey(uid);
  const items = getLocalData(itemsKey, []);
  const updated = items.map((item) =>
    item.id === id || item.id === `${uid}_${id}`
      ? { ...item, ...cleanData }
      : item
  );
  const deduped = deduplicateByNewest(updated);
  setLocalData(itemsKey, deduped);
  bus.emit(`inventory_${uid}`, deduped);
  bus.emit('all_items_updated', deduped);

  logActivity(uid, 'UPDATED', id, cleanData.name || 'Item', `Updated item details and vendor mappings`, 'Café Manager');
}

/**
 * 7. Delete Inventory Item
 */
export async function deleteInventoryItem(id, userId = DEFAULT_USER_ID, itemName = 'Item', userName = 'Café Manager') {
  const uid = resolveUid(userId);
  const cleanItemName = itemName || 'Item';

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'inventory_items', id));
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'inventory_items', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {
      console.error('Firestore delete item notice:', e);
    }
  }

  const itemsKey = getLocalItemsKey(uid);
  const items = getLocalData(itemsKey, []);
  const updated = items.filter((item) => item.id !== id && item.id !== `${uid}_${id}`);
  setLocalData(itemsKey, updated);
  bus.emit(`inventory_${uid}`, updated);
  bus.emit('all_items_updated', updated);

  logActivity(uid, 'DELETED', id, cleanItemName, `Removed from catalogue`, userName);
}

/**
 * 8. Quick Adjust Quantity (Floor POS & Quick Stock Update)
 */
export async function quickAdjustQuantity(id, delta, userId = DEFAULT_USER_ID, itemName = 'Item', userName = 'Barista Floor') {
  const uid = resolveUid(userId);
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

  const deduped = deduplicateByNewest(updated);
  setLocalData(itemsKey, deduped);
  bus.emit(`inventory_${uid}`, deduped);
  bus.emit('all_items_updated', deduped);

  // Commit to Firestore
  if (isFirebaseConfigured() && db) {
    try {
      const payload = {
        quantity: updatedQty,
        userId: uid,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'inventory_items', id), payload, { merge: true });
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'inventory_items', `${uid}_${id}`)).catch(() => {});
      }
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
  let targetItem = null;

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

  const deduped = deduplicateByNewest(updatedInventory);
  setLocalData(itemsKey, deduped);
  bus.emit(`inventory_${uid}`, deduped);
  bus.emit('all_items_updated', deduped);

  if (isFirebaseConfigured() && db && targetItem) {
    try {
      await setDoc(doc(db, 'inventory_items', targetItem.id), {
        supplier: targetItem.supplier,
        unitPrice: targetItem.unitPrice,
        vendorMappings: targetItem.vendorMappings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (!targetItem.id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'inventory_items', `${uid}_${targetItem.id}`)).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore vendor mapping notice:', e);
    }
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

  const deduped = deduplicateByNewest(updatedInventory);
  setLocalData(itemsKey, deduped);
  bus.emit(`inventory_${uid}`, deduped);
  bus.emit('all_items_updated', deduped);

  if (isFirebaseConfigured() && db && targetItem) {
    try {
      await setDoc(doc(db, 'inventory_items', targetItem.id), {
        vendorMappings: targetItem.vendorMappings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (!targetItem.id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'inventory_items', `${uid}_${targetItem.id}`)).catch(() => {});
      }
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
  let targetPo = pos.find((p) => p.id === poId);

  // If not found in local cache, fetch directly from Firestore
  if (!targetPo && isFirebaseConfigured() && db) {
    try {
      const poSnap = await getDoc(doc(db, 'purchase_orders', poId));
      if (poSnap.exists()) {
        targetPo = { id: poSnap.id, ...poSnap.data() };
      }
    } catch (e) {}
  }

  if (!targetPo) throw new Error('Purchase Order not found');

  const itemsKey = getLocalItemsKey(uid);
  let currentInventory = getLocalData(itemsKey, []);
  if ((!currentInventory || currentInventory.length === 0) && isFirebaseConfigured() && db) {
    try {
      const invSnap = await getDocs(query(collection(db, 'inventory_items'), where('userId', '==', uid)));
      if (!invSnap.empty) {
        currentInventory = invSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
      }
    } catch (e) {}
  }

  let actualTotalCost = 0;
  let isPartial = false;

  const updatedPoItems = (deliveryData.items || targetPo.items).map((item) => {
    const receivedQty = Math.max(0, Number(item.receivedQty) || 0);
    const unitPrice = item.unitPrice !== undefined && item.unitPrice !== null && !isNaN(Number(item.unitPrice))
      ? Math.max(0, Number(item.unitPrice))
      : 0;
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
          if (!invItem.id.startsWith(uid + '_')) {
            deleteDoc(doc(db, 'inventory_items', `${uid}_${invItem.id}`)).catch(() => {});
          }
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

  const dedupedInventory = deduplicateByNewest(updatedInventory);
  setLocalData(itemsKey, dedupedInventory);
  bus.emit(`inventory_${uid}`, dedupedInventory);
  bus.emit('all_items_updated', dedupedInventory);

  // 2. Update Purchase Order Status & Financials
  const updatedPo = {
    ...targetPo,
    status: finalStatus,
    items: updatedPoItems,
    totalCost: actualTotalCost,
    receivedAt: new Date().toISOString(),
    receivedBy: userName,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'purchase_orders', poId), {
        ...updatedPo,
        receivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {}
  }

  const updatedPos = deduplicateByNewest([updatedPo, ...pos.filter((p) => p.id !== poId)]);
  setLocalData(posKey, updatedPos);
  bus.emit(`pos_${uid}`, updatedPos);

  return updatedPo;
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
  const uid = resolveUid(userId);
  const vendorsKey = getLocalVendorsKey(uid);

  let initialVendors = getLocalData(vendorsKey, INITIAL_VENDORS);
  callback(deduplicateByNewest(initialVendors));

  const unsubscribeBus = bus.on(`vendors_${uid}`, (updatedVendors) => {
    callback(deduplicateByNewest(updatedVendors));
  });

  let handleStorage = null;
  if (typeof window !== 'undefined') {
    handleStorage = (e) => {
      if (e.key === vendorsKey && e.newValue) {
        try {
          callback(deduplicateByNewest(JSON.parse(e.newValue)));
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
            const firestoreVendors = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                ...data,
                id: data.id || doc.id,
                docId: doc.id,
              };
            });
            const uniqueVendors = deduplicateByNewest(firestoreVendors);
            setLocalData(vendorsKey, uniqueVendors);
            callback(uniqueVendors);
            bus.emit(`vendors_${uid}`, uniqueVendors);
            bus.emit('all_vendors_updated', uniqueVendors);
          } else {
            const local = getLocalData(vendorsKey, INITIAL_VENDORS);
            const valid = local && local.length > 0 ? local : INITIAL_VENDORS;
            setLocalData(vendorsKey, valid);
            callback(deduplicateByNewest(valid));

            valid.forEach((v) => {
              const vId = v.id || `ven-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
              setDoc(
                doc(db, 'vendors', vId),
                { ...v, id: vId, originalId: vId, userId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
                { merge: true }
              ).catch(() => {});
            });
          }
        },
        (err) => {
          console.warn('Firestore vendors offline notice:', err.message);
          const local = getLocalData(vendorsKey, INITIAL_VENDORS);
          callback(deduplicateByNewest(local));
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
  const uid = resolveUid(userId);
  const vendorsKey = getLocalVendorsKey(uid);
  const currentVendors = getLocalData(vendorsKey, []);

  const newId = vendorData.id || `ven_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newVendor = {
    id: newId,
    name: (vendorData.name || '').trim(),
    contactPerson: vendorData.contactPerson ? vendorData.contactPerson.trim() : '',
    email: vendorData.email ? vendorData.email.trim() : '',
    password: vendorData.password ? vendorData.password.trim() : 'vendor123',
    phone: vendorData.phone ? vendorData.phone.trim() : '',
    city: vendorData.city ? vendorData.city.trim() : '',
    category: vendorData.category || 'Specialty Supplier',
    leadTimeDays: Number(vendorData.leadTimeDays) || 2,
    paymentTerms: vendorData.paymentTerms || 'Net 15',
    notes: vendorData.notes ? vendorData.notes.trim() : '',
    userId: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'vendors', newId), {
        ...newVendor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Notice adding vendor:', e.message);
    }
  }

  const updatedVendors = deduplicateByNewest([newVendor, ...currentVendors.filter((v) => v.id !== newId)]);
  setLocalData(vendorsKey, updatedVendors);
  bus.emit(`vendors_${uid}`, updatedVendors);
  bus.emit('all_vendors_updated', updatedVendors);

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
 * Subscribe to all marketplace vendors across all stores
 */
export function subscribeToAllVendors(callback) {
  const getVendorsFromLocal = () => {
    let allLocal = [...INITIAL_VENDORS];
    if (typeof window !== 'undefined') {
      const seenEmails = new Set(allLocal.map((v) => (v.email || '').toLowerCase().trim()));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('cafepulse_vendors_') || k === 'cafepulse_all_vendors')) {
          const list = getLocalData(k, []);
          for (const v of list) {
            const emailKey = (v.email || v.name || '').toLowerCase().trim();
            if (emailKey && !seenEmails.has(emailKey)) {
              seenEmails.add(emailKey);
              allLocal.push(v);
            }
          }
        }
      }
    }
    return deduplicateByNewest(allLocal);
  };

  callback(getVendorsFromLocal());

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      unsubscribeFirestore = onSnapshot(
        collection(db, 'vendors'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const merged = [...list];
            const seen = new Set(list.map((v) => (v.email || v.name || '').toLowerCase().trim()));
            for (const v of INITIAL_VENDORS) {
              if (!seen.has((v.email || '').toLowerCase().trim())) {
                merged.push(v);
              }
            }
            callback(deduplicateByNewest(merged));
          }
        },
        (e) => {}
      );
    } catch (e) {}
  }

  const busUnsub = bus.on('all_vendors_updated', () => {
    callback(getVendorsFromLocal());
  });

  return () => {
    unsubscribeFirestore();
    busUnsub();
  };
}

export async function updatePurchaseOrderDispatch(
  poId,
  dispatchDetails = {},
  userId = null,
  userName = 'Supplier Portal'
) {
  let foundUid = userId;
  let targetPo = null;

  // Search across localStorage keys if userId is not certain
  if (typeof window !== 'undefined') {
    if (foundUid) {
      const list = getLocalData(getLocalPosKey(foundUid), []);
      targetPo = list.find((p) => p.id === poId || p.poNumber === poId);
    }
    if (!targetPo) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cafepulse_pos_')) {
          const list = getLocalData(k, []);
          const match = list.find((p) => p.id === poId || p.poNumber === poId);
          if (match) {
            targetPo = match;
            foundUid = k.replace('cafepulse_pos_', '');
            break;
          }
        }
      }
    }
  }

  const uid = foundUid || DEFAULT_USER_ID;
  const updatedPo = {
    ...(targetPo || { id: poId, poNumber: poId }),
    status: 'PENDING_DELIVERY',
    dispatchStatus: 'DISPATCHED',
    dispatchedAt: new Date().toISOString(),
    trackingNumber: dispatchDetails.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
    carrierName: dispatchDetails.carrierName || 'Direct Delivery Fleet',
    dispatchNotes: dispatchDetails.notes || 'Order packed and dispatched from vendor warehouse.',
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await updateDoc(doc(db, 'purchase_orders', poId), {
        status: 'PENDING_DELIVERY',
        dispatchStatus: 'DISPATCHED',
        dispatchedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        trackingNumber: updatedPo.trackingNumber,
        carrierName: updatedPo.carrierName,
        dispatchNotes: updatedPo.dispatchNotes,
      });
    } catch (e) {}
  }

  // Update in target cafe's local store
  if (typeof window !== 'undefined') {
    const posKey = getLocalPosKey(uid);
    const pos = getLocalData(posKey, []);
    const updatedList = pos.map((p) => (p.id === poId || p.poNumber === poId ? updatedPo : p));
    if (!pos.some((p) => p.id === poId || p.poNumber === poId)) {
      updatedList.unshift(updatedPo);
    }
    const dedupedList = deduplicateByNewest(updatedList);
    setLocalData(posKey, dedupedList);
    bus.emit(`pos_${uid}`, dedupedList);
    bus.emit('all_pos_updated', updatedPo);
  }

  logActivity(
    uid,
    'PO_DISPATCHED_BY_VENDOR',
    poId,
    targetPo?.poNumber || poId,
    `Vendor marked PO ${targetPo?.poNumber || poId} as Dispatched (${updatedPo.trackingNumber})`,
    userName
  );

  return updatedPo;
}

/**
 * Update Existing Vendor
 */
export async function updateVendor(id, updatedData, userId = DEFAULT_USER_ID) {
  const uid = userId || DEFAULT_USER_ID;
  const cleanData = { ...updatedData, id, userId: uid, updatedAt: new Date().toISOString() };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'vendors', id), {
        ...cleanData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'vendors', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {
      console.warn('Notice updating vendor:', e.message);
    }
  }

  const vendorsKey = getLocalVendorsKey(uid);
  const currentVendors = getLocalData(vendorsKey, []);
  const updatedVendors = currentVendors.map((v) =>
    v.id === id || v.id === `${uid}_${id}` ? { ...v, ...cleanData } : v
  );
  const deduped = deduplicateByNewest(updatedVendors);
  setLocalData(vendorsKey, deduped);
  bus.emit(`vendors_${uid}`, deduped);
  bus.emit('all_vendors_updated', deduped);
}

/**
 * Delete Vendor
 */
export async function deleteVendor(id, userId = DEFAULT_USER_ID) {
  const uid = resolveUid(userId);

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'vendors', id));
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'vendors', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {
      console.warn('Notice deleting vendor:', e.message);
    }
  }

  const vendorsKey = getLocalVendorsKey(uid);
  const currentVendors = getLocalData(vendorsKey, []);
  const updatedVendors = currentVendors.filter((v) => v.id !== id && v.id !== `${uid}_${id}`);
  setLocalData(vendorsKey, updatedVendors);
  bus.emit(`vendors_${uid}`, updatedVendors);
  bus.emit('all_vendors_updated', updatedVendors);
}

/**
 * Categories CRUD
 */
export async function addCategory(categoryData, userId = DEFAULT_USER_ID) {
  const uid = resolveUid(userId);
  const newId = categoryData.id || ('cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5));
  const clean = {
    id: newId,
    userId: uid,
    name: categoryData.name.trim(),
    slug: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    icon: categoryData.icon || 'Coffee',
    description: categoryData.description ? categoryData.description.trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'categories', newId), {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Notice adding category:', e.message);
    }
  }

  const catsKey = getLocalCategoriesKey(uid);
  const categories = getLocalData(catsKey, INITIAL_CATEGORIES);
  const updatedCats = deduplicateByNewest([clean, ...categories.filter((c) => c.id !== newId)]);
  setLocalData(catsKey, updatedCats);
  bus.emit(`categories_${uid}`, updatedCats);

  logActivity(uid, 'CATEGORY_CREATED', newId, clean.name, `Created category taxonomy "${clean.name}"`, 'Café Admin');
  return clean;
}

export async function updateCategory(id, updatedData, userId = DEFAULT_USER_ID) {
  const uid = resolveUid(userId);
  const clean = {
    ...updatedData,
    id,
    userId: uid,
    slug: updatedData.name ? updatedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'categories', id), {
        ...clean,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'categories', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {
      console.error('Notice updating category:', e.message);
    }
  }

  const catsKey = getLocalCategoriesKey(uid);
  const categories = getLocalData(catsKey, INITIAL_CATEGORIES);
  const updated = categories.map((cat) =>
    cat.id === id || cat.id === `${uid}_${id}`
      ? { ...cat, ...clean }
      : cat
  );
  const deduped = deduplicateByNewest(updated);
  setLocalData(catsKey, deduped);
  bus.emit(`categories_${uid}`, deduped);
}

export async function deleteCategory(id, userId = DEFAULT_USER_ID) {
  const uid = resolveUid(userId);

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'categories', id));
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'categories', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {
      console.warn('Notice deleting category:', e.message);
    }
  }

  const catsKey = getLocalCategoriesKey(uid);
  const categories = getLocalData(catsKey, INITIAL_CATEGORIES);
  const targetCat = categories.find((c) => c.id === id || c.id === `${uid}_${id}`);
  const updatedCats = categories.filter((c) => c.id !== id && c.id !== `${uid}_${id}`);
  setLocalData(catsKey, updatedCats);
  bus.emit(`categories_${uid}`, updatedCats);

  if (targetCat) {
    logActivity(uid, 'CATEGORY_DELETED', id, targetCat.name, `Deleted category taxonomy "${targetCat.name}"`, 'Café Admin');
  }
}

/**
 * Subscribe to all registered cafés in the network for Wholesale Suppliers
 */
export function subscribeToAllRegisteredCafes(callback) {
  const compileCafes = (firestoreUsers = null, firestoreItems = null, firestorePos = null) => {
    let cafesList = [];
    const seenIds = new Set();
    const seenNames = new Set();

    // 1. Gather from Firestore if available
    if (Array.isArray(firestoreUsers)) {
      firestoreUsers.forEach((u) => {
        if (!u || !u.uid) return;
        const storeName = u.cafeName || u.displayName || 'Specialty Café';
        const branch = u.branchName || 'Main Branch';
        const userItems = (firestoreItems || []).filter((i) => i.userId === u.uid);
        const userPos = (firestorePos || []).filter((p) => p.userId === u.uid);

        const demands = userItems.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          monthlyQty: Number(item.parLevel) || 20,
          unit: item.unit || 'packs',
          targetBudget: Number(item.unitPrice) > 0 ? `₹${Number(item.unitPrice).toLocaleString('en-IN')} / ${item.unit || 'pack'}` : 'Open Quote',
          isUrgent: Number(item.quantity) <= (Number(item.reorderLevel) || 5),
          currentStock: Number(item.quantity) || 0,
          reorderLevel: item.reorderLevel || 5,
          sku: item.sku || '',
        }));

        const totalVal = userItems.reduce(
          (acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
          0
        );

        seenIds.add(u.uid);
        seenNames.add(storeName.toLowerCase());
        cafesList.push({
          id: u.uid,
          name: storeName,
          branchName: branch,
          city: u.city || 'Bengaluru',
          state: u.state || 'Karnataka',
          address: u.address || `${branch}, Bengaluru, Karnataka`,
          badge: 'Live Connected Store',
          monthlyOrdersCount: userPos.length,
          managerName: u.displayName || 'Store Operations Lead',
          managerPhone: u.phone || '+91 80 4000 8000',
          activeDemands: demands,
          monthlyVolumeEstimate: totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN')} / mo` : '₹0 / mo',
        });
      });
    }

    // 2. Gather from LocalStorage registry & session
    if (typeof window !== 'undefined') {
      try {
        const regCafes = JSON.parse(localStorage.getItem('cafepulse_registered_cafes') || '[]');
        const u = JSON.parse(localStorage.getItem('cafepulse_user_session') || '{}');

        const allLocalSources = [...regCafes];
        if (u && u.uid && (u.cafeName || u.role === 'admin')) {
          allLocalSources.push({
            id: u.uid,
            name: u.cafeName || 'My Café',
            branchName: u.branchName || 'Main Branch',
            managerName: u.displayName || 'Store Operations Lead',
          });
        }

        // Also scan any localStorage items keys (e.g. cafepulse_items_user-123)
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('cafepulse_items_')) {
            const uidKey = k.replace('cafepulse_items_', '');
            allLocalSources.push({
              id: uidKey,
              name: `Registered Café (${uidKey.slice(0, 6).toUpperCase()})`,
              branchName: 'Store Hub',
              managerName: 'Store Operations Lead',
            });
          }
        }

        allLocalSources.forEach((entry) => {
          if (!entry || !entry.id) return;
          if (seenIds.has(entry.id)) return;
          const storeName = entry.name || 'Specialty Café';
          if (seenNames.has(storeName.toLowerCase())) return;

          const storeItems = getLocalData(`cafepulse_items_${entry.id}`, []);
          const storePos = getLocalData(`cafepulse_pos_${entry.id}`, []);

          const demands = storeItems.map((item) => ({
            itemId: item.id,
            itemName: item.name,
            monthlyQty: Number(item.parLevel) || 20,
            unit: item.unit || 'packs',
            targetBudget: Number(item.unitPrice) > 0 ? `₹${Number(item.unitPrice).toLocaleString('en-IN')} / ${item.unit || 'pack'}` : 'Open Quote',
            isUrgent: Number(item.quantity) <= (Number(item.reorderLevel) || 5),
            currentStock: Number(item.quantity) || 0,
            reorderLevel: item.reorderLevel || 5,
            sku: item.sku || '',
          }));

          const totalVal = storeItems.reduce(
            (acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
            0
          );

          seenIds.add(entry.id);
          seenNames.add(storeName.toLowerCase());
          cafesList.push({
            id: entry.id,
            name: storeName,
            branchName: entry.branchName || 'Main Branch',
            city: entry.city || 'Bengaluru',
            state: entry.state || 'Karnataka',
            address: entry.address || `${entry.branchName || 'Main Branch'}, Bengaluru, Karnataka`,
            badge: 'Live Connected Store',
            monthlyOrdersCount: storePos.length,
            managerName: entry.managerName || 'Store Operations Lead',
            managerPhone: entry.managerPhone || '+91 80 4000 8000',
            activeDemands: demands,
            monthlyVolumeEstimate: totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN')} / mo` : '₹0 / mo',
          });
        });
      } catch (e) {}
    }

    callback(cafesList);
  };

  compileCafes();

  let unsubUsers = () => {};
  let unsubItems = () => {};
  let unsubPos = () => {};

  if (isFirebaseConfigured() && db) {
    try {
      let cachedUsers = [];
      let cachedItems = [];
      let cachedPos = [];

      unsubUsers = onSnapshot(collection(db, 'registered_cafes'), (snap) => {
        cachedUsers = snap.docs.map((d) => ({ ...d.data(), uid: d.id }));
        compileCafes(cachedUsers, cachedItems, cachedPos);
      });

      unsubItems = onSnapshot(collection(db, 'inventory_items'), (snap) => {
        cachedItems = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        compileCafes(cachedUsers, cachedItems, cachedPos);
      });

      unsubPos = onSnapshot(collection(db, 'purchase_orders'), (snap) => {
        cachedPos = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        compileCafes(cachedUsers, cachedItems, cachedPos);
      });
    } catch (e) {}
  }

  const busUnsub = bus.on('cafes_updated', () => compileCafes());
  const busItems = bus.on('all_items_updated', () => compileCafes());
  const busPos = bus.on('all_pos_updated', () => compileCafes());

  return () => {
    unsubUsers();
    unsubItems();
    unsubPos();
    busUnsub();
    busItems();
    busPos();
  };
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
  const uid = resolveUid(userId);
  const staffKey = getLocalStaffKey(uid);

  let initialStaff = getLocalData(staffKey, INITIAL_STAFF_MEMBERS);
  callback(deduplicateByNewest(initialStaff));

  const unsubscribeBus = bus.on(`staff_${uid}`, (updatedStaff) => {
    callback(deduplicateByNewest(updatedStaff));
  });

  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'staff_members'), where('userId', '==', uid));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreStaff = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                ...data,
                id: data.id || doc.id,
                docId: doc.id,
              };
            });
            const uniqueStaff = deduplicateByNewest(firestoreStaff);
            setLocalData(staffKey, uniqueStaff);
            callback(uniqueStaff);
            bus.emit(`staff_${uid}`, uniqueStaff);
          } else {
            const local = getLocalData(staffKey, INITIAL_STAFF_MEMBERS);
            const valid = local && local.length > 0 ? local : INITIAL_STAFF_MEMBERS;
            setLocalData(staffKey, valid);
            callback(deduplicateByNewest(valid));

            valid.forEach((s) => {
              const sId = s.id || `staff-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
              setDoc(
                doc(db, 'staff_members', sId),
                { ...s, id: sId, originalId: sId, userId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
                { merge: true }
              ).catch(() => {});
            });
          }
        },
        (err) => {
          console.warn('Firestore staff members offline fallback:', err.message);
          const local = getLocalData(staffKey, INITIAL_STAFF_MEMBERS);
          callback(deduplicateByNewest(local));
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
  const uid = resolveUid(userId);
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);

  const newId = staffData.id || ('staff-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));
  const newStaff = {
    id: newId,
    userId: uid,
    name: staffData.name.trim(),
    email: staffData.email.trim().toLowerCase(),
    phone: staffData.phone ? staffData.phone.trim() : '',
    role: staffData.role || 'barista',
    roleLabel: staffData.roleLabel || 'Shift Barista',
    branch: staffData.branch || 'Main Flagship Branch',
    shift: staffData.shift || 'Morning Shift (6:30 AM - 3:00 PM)',
    status: staffData.status || 'ACTIVE',
    pin: staffData.pin || '1234',
    joinedDate: staffData.joinedDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'staff_members', newId), {
        ...newStaff,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Notice saving staff member:', e.message);
    }
  }

  const updatedStaff = deduplicateByNewest([newStaff, ...currentStaff.filter((s) => s.id !== newId)]);
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
  const uid = resolveUid(userId);
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);
  const cleanData = {
    ...staffData,
    id,
    userId: uid,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'staff_members', id), {
        ...cleanData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'staff_members', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {
      console.error('Notice updating staff member:', e.message);
    }
  }

  const updatedStaff = currentStaff.map((s) =>
    s.id === id || s.id === `${uid}_${id}` ? { ...s, ...cleanData } : s
  );
  const deduped = deduplicateByNewest(updatedStaff);
  setLocalData(staffKey, deduped);
  bus.emit(`staff_${uid}`, deduped);

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
  const uid = resolveUid(userId);
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);
  const target = currentStaff.find((s) => s.id === id || s.id === `${uid}_${id}`);

  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'staff_members', id));
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'staff_members', `${uid}_${id}`)).catch(() => {});
      }
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
      console.error('Notice deleting staff member:', e.message);
    }
  }

  const updatedStaff = currentStaff.filter((s) => s.id !== id && s.id !== `${uid}_${id}`);
  const deduped = deduplicateByNewest(updatedStaff);
  setLocalData(staffKey, deduped);
  bus.emit(`staff_${uid}`, deduped);

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
  const uid = resolveUid(userId);
  const staffKey = getLocalStaffKey(uid);
  const currentStaff = getLocalData(staffKey, []);
  const target = currentStaff.find((s) => s.id === id || s.id === `${uid}_${id}`);

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'staff_members', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (!id.startsWith(uid + '_')) {
        deleteDoc(doc(db, 'staff_members', `${uid}_${id}`)).catch(() => {});
      }
    } catch (e) {}
  }

  const updatedStaff = currentStaff.map((s) => (s.id === id || s.id === `${uid}_${id}` ? { ...s, status: newStatus } : s));
  const deduped = deduplicateByNewest(updatedStaff);
  setLocalData(staffKey, deduped);
  bus.emit(`staff_${uid}`, deduped);

  logActivity(
    uid,
    'STAFF_STATUS_CHANGED',
    id,
    target?.name || 'Staff Member',
    `Changed ${target?.name || 'Staff'}'s account status to ${newStatus}`,
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
        const catDocId = cat.id;
        await setDoc(doc(db, 'categories', catDocId), {
          ...cat,
          id: catDocId,
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const item of INITIAL_INVENTORY_ITEMS) {
        const itemDocId = item.id;
        await setDoc(doc(db, 'inventory_items', itemDocId), {
          ...item,
          id: itemDocId,
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const po of INITIAL_PURCHASE_ORDERS) {
        const poDocId = po.id;
        await setDoc(doc(db, 'purchase_orders', poDocId), {
          ...po,
          id: poDocId,
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const v of INITIAL_VENDORS) {
        const vDocId = v.id;
        await setDoc(doc(db, 'vendors', vDocId), {
          ...v,
          id: vDocId,
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const st of INITIAL_STAFF_MEMBERS) {
        const stDocId = st.id;
        await setDoc(doc(db, 'staff_members', stDocId), {
          ...st,
          id: stDocId,
          userId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Notice seeding account data:', e.message);
    }
  }

  const itemsWithUser = INITIAL_INVENTORY_ITEMS.map((item) => ({
    ...item,
    id: item.id,
    userId: uid,
  }));
  const catsWithUser = INITIAL_CATEGORIES.map((cat) => ({
    ...cat,
    id: cat.id,
    userId: uid,
  }));
  const posWithUser = INITIAL_PURCHASE_ORDERS.map((po) => ({
    ...po,
    id: po.id,
    userId: uid,
  }));
  const staffWithUser = INITIAL_STAFF_MEMBERS.map((s) => ({
    ...s,
    id: s.id,
    userId: uid,
  }));
  const vendorsWithUser = INITIAL_VENDORS.map((v) => ({
    ...v,
    id: v.id,
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
        collection(db, 'registered_cafes'),
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
                name: data.name || data.cafeName || (data.displayName ? `${data.displayName}'s Café` : 'Artisan Café'),
                branchName: data.branchName || 'Main Branch',
                city: data.city || 'Bengaluru',
                address: data.address || `${data.branchName || 'Store'} Location`,
                managerName: data.managerName || data.displayName || data.email?.split('@')[0] || 'Store Administrator',
                monthlyVolumeEstimate: data.monthlyVolumeEstimate || data.monthlyVolume || 'Active Café',
                monthlyOrdersCount: data.monthlyOrdersCount || 0,
                badge: data.badge || 'Registered Café',
                activeDemands: data.activeDemands || [],
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
