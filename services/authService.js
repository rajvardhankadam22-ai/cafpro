import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { INITIAL_STAFF_MEMBERS } from './seedData';

const LOCAL_AUTH_KEY = 'cafepulse_user_session';

class AuthEventBus {
  constructor() {
    this.listeners = new Set();
  }
  on(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  emit(user) {
    this.listeners.forEach((cb) => cb(user));
  }
}

const authBus = new AuthEventBus();

export function registerCafeInDirectory(userData) {
  if (typeof window === 'undefined' || !userData || !userData.uid) return;
  try {
    const list = JSON.parse(localStorage.getItem('cafepulse_registered_cafes') || '[]');
    const cleanEntry = {
      id: userData.uid,
      uid: userData.uid,
      name: userData.cafeName || 'Specialty Artisan Café',
      branchName: userData.branchName || 'Main Branch',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: `${userData.branchName || 'Main Branch'}, Bengaluru, Karnataka`,
      email: userData.email || '',
      displayName: userData.displayName || '',
      managerName: userData.displayName || 'Store Operations Lead',
      managerPhone: '+91 80 4000 8000',
      badge: 'Live Connected Store',
      registeredAt: new Date().toISOString(),
    };
    const updated = [cleanEntry, ...list.filter((c) => c.id !== cleanEntry.id && c.name.toLowerCase() !== cleanEntry.name.toLowerCase())];
    localStorage.setItem('cafepulse_registered_cafes', JSON.stringify(updated));

    if (isFirebaseConfigured() && db && userData.uid) {
      setDoc(doc(db, 'registered_cafes', userData.uid), cleanEntry, { merge: true }).catch(() => {});
    }
  } catch (e) {}
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function subscribeToAuth(callback) {
  // 1. Immediately deliver stored session if present for zero-lag UI transition
  const cachedUser = getCurrentUser();
  if (cachedUser) {
    registerCafeInDirectory(cachedUser);
    callback(cachedUser);
  }

  if (isFirebaseConfigured() && auth) {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          let userCafeName = 'Artisan Specialty Café';
          let userBranchName = 'Main Flagship Branch';
          let userRole = 'admin';
          let userRoleLabel = 'Store Administrator';
          let isStaffUser = false;

          if (db) {
            try {
              // Check if user is in users collection
              const uDoc = await getDoc(doc(db, 'users', user.uid));
              if (uDoc.exists()) {
                const uData = uDoc.data();
                if (uData.cafeName) userCafeName = uData.cafeName;
                if (uData.branchName) userBranchName = uData.branchName;
                if (uData.role) userRole = uData.role;
                if (uData.roleLabel) userRoleLabel = uData.roleLabel;
                if (uData.isStaff !== undefined) isStaffUser = Boolean(uData.isStaff);
              } else {
                // Check if user is an invited staff member in staff_members collection
                const staffQuery = query(
                  collection(db, 'staff_members'),
                  where('email', '==', user.email.toLowerCase().trim())
                );
                const staffSnap = await getDocs(staffQuery);
                if (!staffSnap.empty) {
                  const sData = staffSnap.docs[0].data();
                  userRole = sData.role || 'barista';
                  userRoleLabel = sData.roleLabel || 'Shift Barista';
                  isStaffUser = true;
                  if (sData.branch) userBranchName = sData.branch;
                }
              }
            } catch (e) {}
          }

          const enrichedUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            cafeName: userCafeName,
            branchName: userBranchName,
            role: userRole,
            roleLabel: userRoleLabel,
            isStaff: isStaffUser,
            isRoleLocked: isStaffUser,
            photoURL: user.photoURL || null,
          };
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(enrichedUser));
          callback(enrichedUser);

          // Save user record to Firestore users collection
          if (db) {
            try {
              setDoc(
                doc(db, 'users', user.uid),
                {
                  uid: user.uid,
                  email: user.email,
                  displayName: enrichedUser.displayName,
                  cafeName: userCafeName,
                  branchName: userBranchName,
                  role: userRole,
                  roleLabel: userRoleLabel,
                  isStaff: isStaffUser,
                  lastLogin: serverTimestamp(),
                },
                { merge: true }
              ).catch(() => {});
            } catch (e) {}
          }
        } else {
          // If Firebase confirms no active session, deliver fallback or null
          const localSession = getCurrentUser();
          callback(localSession);
        }
      });
      return unsubscribe;
    } catch (e) {
      console.warn('Firebase Auth listener standby:', e.message);
    }
  }

  const initial = getCurrentUser();
  setTimeout(() => callback(initial), 0);
  return authBus.on(callback);
}

/**
 * 1. Sign In with Email & Password or Staff PIN
 */
export async function loginWithEmail(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // A. Check if this login belongs to an invited Staff Member in Firestore / LocalStorage
  let foundStaff = null;

  // Check Firestore staff collection if configured
  if (isFirebaseConfigured() && db) {
    try {
      const staffQuery = query(
        collection(db, 'staff_members'),
        where('email', '==', cleanEmail)
      );
      const staffSnap = await getDocs(staffQuery);
      if (!staffSnap.empty) {
        foundStaff = { id: staffSnap.docs[0].id, ...staffSnap.docs[0].data() };
      }
    } catch (e) {
      console.warn('Firestore staff lookup notice:', e.message);
    }
  }

  // Check local staff data
  if (!foundStaff && typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cafepulse_staff_')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const match = list.find((s) => (s.email || '').toLowerCase().trim() === cleanEmail);
          if (match) {
            foundStaff = match;
            break;
          }
        }
      }
    } catch (e) {}
  }

  // 3. Fallback to Initial Staff Directory
  if (!foundStaff) {
    foundStaff = INITIAL_STAFF_MEMBERS.find((s) => s.email.toLowerCase().trim() === cleanEmail);
  }

  // If a matching staff member was found:
  if (foundStaff) {
    // Check status
    if (foundStaff.status === 'SUSPENDED' || foundStaff.status === 'INACTIVE') {
      const err = new Error('Your staff account has been deactivated. Please contact your Store Admin to reactivate.');
      err.code = 'auth/user-disabled';
      throw err;
    }

    // Verify Password or PIN
    const matchesPassword = Boolean(foundStaff.password && foundStaff.password === cleanPass);
    const matchesPin = Boolean(foundStaff.pin && String(foundStaff.pin).trim() === cleanPass);

    if (!matchesPassword && !matchesPin) {
      const err = new Error('Invalid credentials. Please enter your registered staff password or 4-digit PIN.');
      err.code = 'auth/wrong-password';
      throw err;
    }

    // Create user session (Admin has isStaff=false, isRoleLocked=false)
    const isAdminUser = foundStaff.role === 'admin';
    const storeUid = foundStaff.userId || 'guest';
    const staffUser = {
      uid: storeUid,
      staffId: foundStaff.id,
      storeUid: storeUid,
      email: foundStaff.email,
      displayName: foundStaff.name,
      role: foundStaff.role || (isAdminUser ? 'admin' : 'barista'),
      roleLabel: foundStaff.roleLabel || (isAdminUser ? 'Store Admin & General Manager' : 'Shift Barista (Floor POS)'),
      isStaff: !isAdminUser,
      isRoleLocked: !isAdminUser,
      branchName: foundStaff.branch || 'Café Branch',
      shift: foundStaff.shift || 'Floor Shift',
      cafeName: foundStaff.cafeName || 'Specialty Artisan Café',
      photoURL: foundStaff.photoURL || null,
      pin: foundStaff.pin,
    };

    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(staffUser));
    authBus.emit(staffUser);
    return staffUser;
  }

  // B. Firebase Auth Admin Login
  if (isFirebaseConfigured() && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      let userCafeName = 'Artisan Specialty Café';
      let userBranchName = 'Main Flagship Branch';

      if (db) {
        try {
          const uDoc = await getDoc(doc(db, 'users', user.uid));
          if (uDoc.exists()) {
            const uData = uDoc.data();
            if (uData.cafeName) userCafeName = uData.cafeName;
            if (uData.branchName) userBranchName = uData.branchName;
          }
        } catch (e) {}
      }

      const enrichedUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        cafeName: userCafeName,
        branchName: userBranchName,
        role: 'admin',
        roleLabel: 'Store Administrator',
        isStaff: false,
        isRoleLocked: false,
        photoURL: user.photoURL || null,
      };
      registerCafeInDirectory(enrichedUser);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(enrichedUser));
      authBus.emit(enrichedUser);
      return enrichedUser;
    } catch (error) {
      console.error('Firebase login error:', error);
      throw error;
    }
  }

  // C. Local Fallback Admin Login
  const user = {
    uid: 'user-' + Date.now(),
    email: email.trim(),
    displayName: email.split('@')[0],
    role: 'admin',
    roleLabel: 'Store Administrator',
    isStaff: false,
    isRoleLocked: false,
    cafeName: 'Artisan Specialty Café',
    branchName: 'Main Flagship Branch',
    photoURL: null,
  };
  registerCafeInDirectory(user);
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  authBus.emit(user);
  return user;
}

/**
 * Quick 4-Digit Staff PIN Login
 */
export async function loginWithPin(pin, email = null) {
  const cleanPin = String(pin).trim();
  if (!cleanPin || cleanPin.length < 4) {
    const err = new Error('Please enter a valid 4-digit staff PIN.');
    err.code = 'auth/invalid-pin';
    throw err;
  }

  let foundStaff = null;

  // 1. Check Firestore staff_members
  if (isFirebaseConfigured() && db) {
    try {
      const q = email
        ? query(
            collection(db, 'staff_members'),
            where('email', '==', email.toLowerCase().trim()),
            where('pin', '==', cleanPin)
          )
        : query(collection(db, 'staff_members'), where('pin', '==', cleanPin));
      const snap = await getDocs(q);
      if (!snap.empty) {
        foundStaff = { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    } catch (e) {}
  }

  // 2. Check Local Storage
  if (!foundStaff && typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cafepulse_staff_')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const match = list.find((s) => {
            const pinMatches = String(s.pin || '').trim() === cleanPin;
            const emailMatches = email
              ? (s.email || '').toLowerCase().trim() === email.toLowerCase().trim()
              : true;
            return pinMatches && emailMatches;
          });
          if (match) {
            foundStaff = match;
            break;
          }
        }
      }
    } catch (e) {}
  }

  // 3. Fallback to Initial Staff Directory
  if (!foundStaff) {
    foundStaff = INITIAL_STAFF_MEMBERS.find((s) => String(s.pin).trim() === cleanPin);
  }

  if (!foundStaff) {
    const err = new Error('No staff member found matching this 4-digit PIN.');
    err.code = 'auth/user-not-found';
    throw err;
  }

  if (foundStaff.status === 'SUSPENDED' || foundStaff.status === 'INACTIVE') {
    const err = new Error('This staff account is deactivated. Please contact your Store Admin.');
    err.code = 'auth/user-disabled';
    throw err;
  }

  const isAdminUser = foundStaff.role === 'admin';
  const storeUid = foundStaff.userId || 'guest';
  const staffUser = {
    uid: storeUid,
    staffId: foundStaff.id,
    storeUid: storeUid,
    email: foundStaff.email,
    displayName: foundStaff.name,
    role: foundStaff.role || (isAdminUser ? 'admin' : 'barista'),
    roleLabel: foundStaff.roleLabel || (isAdminUser ? 'Store Admin & General Manager' : 'Shift Barista (Floor POS)'),
    isStaff: !isAdminUser,
    isRoleLocked: !isAdminUser,
    branchName: foundStaff.branch || 'Café Branch',
    shift: foundStaff.shift || 'Floor Shift',
    cafeName: foundStaff.cafeName || 'Specialty Artisan Café',
    photoURL: foundStaff.photoURL || null,
    pin: foundStaff.pin,
  };

  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(staffUser));
  authBus.emit(staffUser);
  return staffUser;
}

/**
 * 2. Sign Up with Email & Password (Admin Account)
 */
export async function signupWithEmail(email, password, displayName = '', cafeName = '') {
  const cleanCafeName = cafeName.trim() || 'Specialty Artisan Café';
  const finalName = displayName.trim() || email.split('@')[0];

  if (isFirebaseConfigured() && auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: finalName,
      });

      const enrichedUser = {
        uid: user.uid,
        email: user.email,
        displayName: finalName,
        cafeName: cleanCafeName,
        role: 'admin',
        roleLabel: 'Store Admin & General Manager',
        isStaff: false,
        isRoleLocked: false,
        photoURL: null,
      };

      if (db) {
        setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: finalName,
          cafeName: cleanCafeName,
          role: 'admin',
          roleLabel: 'Store Admin & General Manager',
          isStaff: false,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }

      // Initialize clean user workspace
      const cleanUid = enrichedUser.uid;
      localStorage.setItem(`cafepulse_items_${cleanUid}`, '[]');
      localStorage.setItem(`cafepulse_cats_${cleanUid}`, '[]');
      localStorage.setItem(`cafepulse_pos_${cleanUid}`, '[]');
      localStorage.setItem(`cafepulse_vendors_${cleanUid}`, '[]');
      localStorage.setItem(`cafepulse_staff_${cleanUid}`, '[]');
      localStorage.setItem(`cafepulse_logs_${cleanUid}`, '[]');
      localStorage.setItem(`cafepulse_supplier_apps_${cleanUid}`, '[]');

      registerCafeInDirectory(enrichedUser);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(enrichedUser));
      authBus.emit(enrichedUser);
      return enrichedUser;
    } catch (error) {
      console.error('Firebase signup error:', error);
      throw error;
    }
  }

  const cleanUid = 'user-' + Date.now();
  const user = {
    uid: cleanUid,
    email: email.trim(),
    displayName: finalName,
    cafeName: cleanCafeName,
    role: 'admin',
    roleLabel: 'Store Admin & General Manager',
    isStaff: false,
    isRoleLocked: false,
    photoURL: null,
  };
  localStorage.setItem(`cafepulse_items_${cleanUid}`, '[]');
  localStorage.setItem(`cafepulse_cats_${cleanUid}`, '[]');
  localStorage.setItem(`cafepulse_pos_${cleanUid}`, '[]');
  localStorage.setItem(`cafepulse_vendors_${cleanUid}`, '[]');
  localStorage.setItem(`cafepulse_staff_${cleanUid}`, '[]');
  localStorage.setItem(`cafepulse_logs_${cleanUid}`, '[]');
  localStorage.setItem(`cafepulse_supplier_apps_${cleanUid}`, '[]');

  registerCafeInDirectory(user);
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  authBus.emit(user);
  return user;
}

/**
 * 3. Sign In with Google Provider
 */
export async function loginWithGoogle() {
  if (isFirebaseConfigured() && auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const enrichedUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'admin',
        roleLabel: 'Store Admin & General Manager',
        isStaff: false,
        isRoleLocked: false,
        photoURL: user.photoURL || null,
      };

      if (db) {
        setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email,
            displayName: enrichedUser.displayName,
            photoURL: enrichedUser.photoURL,
            role: 'admin',
            roleLabel: 'Store Admin & General Manager',
            isStaff: false,
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }

      registerCafeInDirectory(enrichedUser);
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(enrichedUser));
      authBus.emit(enrichedUser);
      return enrichedUser;
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Google Sign-in error:', error);
      }
      throw error;
    }
  }

  throw new Error('Google Sign-In requires active Firebase Authentication.');
}

/**
 * 4. Password Reset Email
 */
export async function sendPasswordReset(email) {
  if (isFirebaseConfigured() && auth) {
    return sendPasswordResetEmail(auth, email.trim());
  }
  return Promise.resolve();
}

/**
 * 5. Sign Out
 */
export async function logoutUser() {
  if (isFirebaseConfigured() && auth) {
    try {
      await signOut(auth);
    } catch (e) {}
  }
  localStorage.removeItem(LOCAL_AUTH_KEY);
  authBus.emit(null);
}

/**
 * 7. Permanently Delete Café Account & Wipe All Associated Data
 */
export async function deleteCafeAccount(userId) {
  const uid = userId || getCurrentUser()?.uid;
  if (!uid) return;

  // 1. Delete all Firestore records associated with this userId
  if (isFirebaseConfigured() && db && uid) {
    try {
      await deleteDoc(doc(db, 'users', uid));

      const collectionsToPurge = [
        'inventory_items',
        'categories',
        'purchase_orders',
        'supplier_applications',
        'vendors',
        'staff_members',
        'activity_logs',
      ];

      for (const collName of collectionsToPurge) {
        try {
          const q = query(collection(db, collName), where('userId', '==', uid));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, collName, d.id)));
          await Promise.all(deletePromises);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Notice purging Firestore user account:', e.message);
    }
  }

  // 2. Delete Firebase Auth user if logged in
  if (isFirebaseConfigured() && auth && auth.currentUser) {
    try {
      if (auth.currentUser.uid === uid) {
        await auth.currentUser.delete();
      }
    } catch (e) {
      console.warn('Firebase Auth user delete:', e.message);
    }
  }

  // 3. Clear all localStorage keys for this user
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove = [
        `cafepulse_items_${uid}`,
        `cafepulse_cats_${uid}`,
        `cafepulse_logs_${uid}`,
        `cafepulse_pos_${uid}`,
        `cafepulse_vendors_${uid}`,
        `cafepulse_supplier_apps_${uid}`,
        `cafepulse_staff_${uid}`,
        LOCAL_AUTH_KEY,
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }

  // 4. Emit null user to update all listeners
  authBus.emit(null);
}

/**
 * 8. Permanently Delete Café Account with Admin Password Verification
 */
export async function deleteCafeAccountWithPassword(password, userId) {
  if (!password || !password.trim()) {
    throw new Error('Admin password is required to delete the store account.');
  }

  const currentUser = getCurrentUser();
  const uid = userId || currentUser?.uid;
  if (!uid) throw new Error('No active user session found.');

  // Verify Admin Role
  if (currentUser?.isStaff || currentUser?.role !== 'admin') {
    throw new Error('Only the Store Admin can authorize account deletion.');
  }

  // 1. Re-authenticate with Firebase Auth if user is signed in with email
  if (isFirebaseConfigured() && auth && auth.currentUser && auth.currentUser.email) {
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password.trim());
      await reauthenticateWithCredential(auth.currentUser, credential);
    } catch (authErr) {
      if (
        authErr.code === 'auth/wrong-password' ||
        authErr.code === 'auth/invalid-credential' ||
        authErr.code === 'auth/invalid-login-credentials'
      ) {
        throw new Error('Incorrect Admin password. Account deletion denied.');
      }
      if (password.trim().length < 6) {
        throw new Error('Invalid Admin password provided.');
      }
    }
  } else {
    // Offline / local validation
    if (password.trim().length < 4) {
      throw new Error('Invalid Admin password provided (min 4 characters required).');
    }
  }

  // 2. Perform complete data purge & account deletion
  await deleteCafeAccount(uid);
  return true;
}
