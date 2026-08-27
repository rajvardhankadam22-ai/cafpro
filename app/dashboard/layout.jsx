'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ItemModal from '@/components/ItemModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import QuickRestockModal from '@/components/QuickRestockModal';
import CategoryModal from '@/components/CategoryModal';
import VendorModal from '@/components/VendorModal';
import StaffModal from '@/components/StaffModal';
import GoodsReceiptModal from '@/components/GoodsReceiptModal';
import CreatePoModal from '@/components/CreatePoModal';
import { useToast } from '@/components/Toast';
import {
  subscribeToInventory,
  subscribeToCategories,
  subscribeToActivityLogs,
  subscribeToPurchaseOrders,
  subscribeToVendors,
  subscribeToSupplierApplications,
  subscribeToStaffMembers,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  quickAdjustQuantity,
  addCategory,
  updateCategory,
  deleteCategory,
  createPurchaseOrder,
  receivePurchaseOrder,
  addVendor,
  updateVendor,
  deleteVendor,
  addVendorPriceMapping,
  removeVendorPriceMapping,
  approveSupplierApplication,
  rejectSupplierApplication,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  toggleStaffStatus,
} from '@/services/inventoryService';
import { subscribeToAuth, logoutUser } from '@/services/authService';

const ROLE_ALLOWED_ROUTES = {
  admin: [
    '/dashboard',
    '/dashboard/inventory',
    '/dashboard/reorder',
    '/dashboard/orders',
    '/dashboard/vendors',
    '/dashboard/categories',
    '/dashboard/analytics',
    '/dashboard/history',
    '/dashboard/team',
  ],
  manager: [
    '/dashboard',
    '/dashboard/inventory',
    '/dashboard/reorder',
    '/dashboard/orders',
    '/dashboard/vendors',
    '/dashboard/categories',
    '/dashboard/analytics',
    '/dashboard/history',
    '/dashboard/team',
  ],
  head_barista: [
    '/dashboard',
    '/dashboard/inventory',
    '/dashboard/reorder',
    '/dashboard/orders',
    '/dashboard/categories',
    '/dashboard/vendors',
    '/dashboard/history',
    '/dashboard/team',
  ],
  barista: [
    '/dashboard',
    '/dashboard/inventory',
    '/dashboard/orders',
    '/dashboard/history',
  ],
  auditor: [
    '/dashboard',
    '/dashboard/inventory',
    '/dashboard/analytics',
    '/dashboard/history',
  ],
};

const DashboardContext = createContext(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return ctx;
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const toast = useToast();

  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('manager'); // 'manager' | 'barista' | 'auditor'
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [itemToRestock, setItemToRestock] = useState(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState(null);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);

  const [isGoodsReceiptOpen, setIsGoodsReceiptOpen] = useState(false);
  const [selectedPoForReceipt, setSelectedPoForReceipt] = useState(null);

  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [createPoSupplier, setCreatePoSupplier] = useState('');
  const [createPoItems, setCreatePoItems] = useState([]);
  const [supplierApplications, setSupplierApplications] = useState([]);
  const [authResolved, setAuthResolved] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Network Online/Offline Auto-Sync Monitor
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet reconnected! All offline changes synced with Cloud Firestore.', 'Online Sync Active');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Network connection lost. Offline Mode active — all changes will save locally and auto-sync when online.', 'Offline Mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Subscribe to Authentication
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user?.role) setRole(user.role);
      setAuthResolved(true);
    });
    return () => unsubAuth();
  }, []);

  // 2. Subscribe to User-Isolated Data
  useEffect(() => {
    if (!authResolved) return;
    const uid = currentUser?.storeUid || currentUser?.uid || 'guest';
    setIsLoading(true);

    const unsubInventory = subscribeToInventory(uid, (data) => {
      if (Array.isArray(data)) setItems(data);
      setIsLoading(false);
    });

    const unsubCategories = subscribeToCategories(uid, (cats) => {
      if (Array.isArray(cats)) setCategories(cats);
    });

    const unsubLogs = subscribeToActivityLogs(uid, (logs) => {
      if (Array.isArray(logs)) setActivityLogs(logs);
    });

    const unsubPos = subscribeToPurchaseOrders(uid, (pos) => {
      if (Array.isArray(pos)) setPurchaseOrders(pos);
    });

    const unsubVendors = subscribeToVendors(uid, (v) => {
      if (Array.isArray(v)) setVendors(v);
    });

    const unsubApps = subscribeToSupplierApplications(uid, (apps) => {
      if (Array.isArray(apps)) setSupplierApplications(apps);
    });

    const unsubStaff = subscribeToStaffMembers(uid, (st) => {
      if (Array.isArray(st)) setStaffMembers(st);
    });

    return () => {
      unsubInventory();
      unsubCategories();
      unsubLogs();
      unsubPos();
      unsubVendors();
      unsubApps();
      unsubStaff();
    };
  }, [authResolved, currentUser?.uid, currentUser?.storeUid]);

  // Computed metrics
  const lowStockItems = items.filter(
    (item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.reorderLevel || 5)
  );

  const outOfStockItems = items.filter((item) => Number(item.quantity) === 0);

  const totalValuation = items.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitPrice) || 0),
    0
  );

  const currentUid = currentUser?.storeUid || currentUser?.uid || 'guest';

  // Handlers
  const handleOpenAddItem = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (itemToEdit) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemToEdit.id ? { ...i, ...itemData, updatedAt: new Date().toISOString() } : i))
        );
        await updateInventoryItem(itemToEdit.id, itemData, currentUid);
        toast.success(`Updated ${itemData.name}`, 'Item Updated');
      } else {
        const newItem = await addInventoryItem(itemData, currentUid);
        if (newItem) setItems((prev) => [newItem, ...prev]);
        toast.success(`Added ${itemData.name} to catalogue`, 'Item Added');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save item', 'Error');
    }
  };

  const handleOpenDeleteItem = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const deletedId = itemToDelete.id;
      setItems((prev) => prev.filter((i) => i.id !== deletedId));
      await deleteInventoryItem(deletedId, currentUid, itemToDelete.name);
      toast.success(`Deleted ${itemToDelete.name}`, 'Item Removed');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete item', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdjustQuantity = async (itemId, delta, itemName) => {
    try {
      setItems((prev) =>
        prev.map((i) => {
          if (i.id === itemId) {
            const newQ = Math.max(0, (Number(i.quantity) || 0) + delta);
            return { ...i, quantity: newQ, updatedAt: new Date().toISOString() };
          }
          return i;
        })
      );
      const actorName = `${currentUser?.displayName || 'Floor Staff'} (${currentUser?.roleLabel || currentUser?.role || 'Staff'})`;
      await quickAdjustQuantity(itemId, delta, currentUid, itemName, actorName);
    } catch (e) {
      console.error(e);
      toast.error('Failed to adjust stock', 'Error');
    }
  };

  const handleOpenRestock = (item) => {
    setItemToRestock(item);
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = async (itemId, addedAmount, notes) => {
    const targetItem = items.find((i) => i.id === itemId);
    const itemName = targetItem ? targetItem.name : 'Item';
    await handleAdjustQuantity(itemId, addedAmount, itemName);
    toast.success(`Added +${addedAmount} to ${itemName}`, 'Restock Confirmed');
  };

  const handleOpenCreatePo = (supplier = '', initialItems = []) => {
    setCreatePoSupplier(supplier);
    setCreatePoItems(initialItems);
    setIsCreatePoOpen(true);
  };

  const handleSavePurchaseOrder = async (poData) => {
    try {
      const newPo = await createPurchaseOrder(poData, currentUid);
      setPurchaseOrders((prev) => {
        if (prev.some((p) => p.id === newPo.id)) return prev;
        return [newPo, ...prev];
      });
      toast.success(`Created ${newPo.poNumber} for ${newPo.supplierName}`, 'Purchase Order Issued');
    } catch (e) {
      console.error(e);
      toast.error('Failed to issue Purchase Order', 'Error');
    }
  };

  const handleOpenGoodsReceipt = (po) => {
    setSelectedPoForReceipt(po);
    setIsGoodsReceiptOpen(true);
  };

  const handleReconcileGoodsReceipt = async (poId, deliveryData, receiverName) => {
    try {
      const updatedPo = await receivePurchaseOrder(poId, deliveryData, currentUid, receiverName);
      setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updatedPo : p)));
      toast.success(`Goods receipt reconciled for ${updatedPo.poNumber}! Stock updated.`, 'Delivery Received');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reconcile delivery', 'Error');
    }
  };

  const handleOpenAddCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (catData) => {
    try {
      if (categoryToEdit) {
        setCategories((prev) =>
          prev.map((c) => (c.id === categoryToEdit.id ? { ...c, ...catData } : c))
        );
        await updateCategory(categoryToEdit.id, catData, currentUid);
        toast.success(`Updated category ${catData.name}`, 'Category Updated');
      } else {
        const newCatId = await addCategory(catData, currentUid);
        setCategories((prev) => [...prev, { id: newCatId, ...catData }]);
        toast.success(`Created category ${catData.name}`, 'Category Created');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save category', 'Error');
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    try {
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      const remainingCats = categories.filter((c) => c.id !== catId);
      const fallbackCatId = remainingCats.length > 0 ? remainingCats[0].id : '';
      setItems((prev) =>
        prev.map((i) => (i.categoryId === catId ? { ...i, categoryId: fallbackCatId } : i))
      );
      await deleteCategory(catId, currentUid);
      toast.success(`Removed category ${catName}`, 'Category Deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete category', 'Error');
    }
  };

  // Vendor handlers
  const handleOpenAddVendor = () => {
    setVendorToEdit(null);
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (v) => {
    setVendorToEdit(v);
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = async (vendorData) => {
    try {
      if (vendorToEdit) {
        setVendors((prev) =>
          prev.map((v) => (v.id === vendorToEdit.id ? { ...v, ...vendorData } : v))
        );
        await updateVendor(vendorToEdit.id, vendorData, currentUid);
        toast.success(`Updated vendor ${vendorData.name}`, 'Vendor Profile Saved');
      } else {
        const newVendor = await addVendor(vendorData, currentUid);
        if (newVendor) setVendors((prev) => [newVendor, ...prev]);
        toast.success(`Registered new vendor ${vendorData.name}`, 'Vendor Registered');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save vendor profile', 'Error');
    }
  };

  const handleDeleteVendor = async (vendorId, vendorName) => {
    try {
      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      await deleteVendor(vendorId, currentUid);
      toast.success(`Removed vendor ${vendorName}`, 'Vendor Deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete vendor', 'Error');
    }
  };

  const handleMapVendorPrice = async (itemId, mappingData) => {
    try {
      const updated = await addVendorPriceMapping(itemId, mappingData, currentUid, currentUser?.displayName || 'Café Manager');
      if (updated) {
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast.success(`Mapped price book for ${mappingData.vendorName} @ ₹${mappingData.unitPrice}`, 'Price Agreement Saved');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save vendor price agreement', 'Error');
    }
  };

  const handleUnmapVendorPrice = async (itemId, mappingId, vendorName) => {
    try {
      const updated = await removeVendorPriceMapping(itemId, mappingId, currentUid);
      if (updated) {
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast.success(`Removed price agreement for ${vendorName || 'vendor'}`, 'Agreement Removed');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove price agreement', 'Error');
    }
  };

  const handleApproveSupplierApplication = async (appId, companyName, appObj) => {
    try {
      const approved = await approveSupplierApplication(
        appId,
        currentUid,
        currentUser?.displayName || 'Café Manager',
        appObj
      );
      setSupplierApplications((prev) =>
        prev.map((a) =>
          a.id === appId || a.rawId === appId || (companyName && a.companyName === companyName)
            ? { ...a, status: 'APPROVED', approvedAt: new Date().toISOString() }
            : a
        )
      );
      toast.success(`Approved ${companyName || 'Supplier'} and mapped products to Price Book!`, 'Supplier Approved');
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve supplier application', 'Error');
    }
  };

  const handleRejectSupplierApplication = async (appId, companyName) => {
    try {
      await rejectSupplierApplication(appId, currentUid, currentUser?.displayName || 'Café Manager');
      setSupplierApplications((prev) =>
        prev.map((a) =>
          a.id === appId || a.rawId === appId || (companyName && a.companyName === companyName)
            ? { ...a, status: 'REJECTED' }
            : a
        )
      );
      toast.info(`Rejected application from ${companyName || 'Supplier'}`, 'Application Closed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject supplier application', 'Error');
    }
  };

  // Staff Management Handlers
  const handleOpenAddStaff = () => {
    setStaffToEdit(null);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff) => {
    setStaffToEdit(staff);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (staffData) => {
    try {
      if (staffToEdit) {
        await updateStaffMember(staffToEdit.id, staffData, currentUid, currentUser?.displayName || 'Café Admin');
        toast.success(`Updated staff details for ${staffData.name}!`, 'Staff Updated');
      } else {
        await addStaffMember(staffData, currentUid, currentUser?.displayName || 'Café Admin');
        
        // Dispatch onboarding email with 4-digit PIN
        if (staffData.sendEmailInvite && staffData.email) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const cafe = currentUser?.cafeName || 'Specialty Artisan Café';
          const branch = staffData.branch || 'Flagship Branch';
          const roleTitle = staffData.roleLabel || 'Shift Barista';
          const pin = staffData.pin || '1234';

          const subject = encodeURIComponent(`Welcome to ${cafe} - Your Floor Login PIN`);
          const body = encodeURIComponent(
            `Hello ${staffData.name},\n\n` +
            `You have been invited to join ${cafe} (${branch}) as ${roleTitle} on the CaféPulse Management Platform.\n\n` +
            `Here are your staff floor credentials:\n` +
            `• Assigned Role: ${roleTitle}\n` +
            `• Café Branch: ${branch}\n` +
            `• Shift Schedule: ${staffData.shift}\n` +
            `• 4-Digit Floor PIN: ${pin}\n` +
            `• Direct Portal Login: ${origin}/login\n\n` +
            `To log in at the counter or floor tablet, choose "4-Digit PIN Floor Unlock" and enter your PIN: ${pin}.\n\n` +
            `Welcome to the team!\n` +
            `- ${currentUser?.displayName || 'Store Admin'}\n` +
            `${cafe}`
          );

          try {
            window.open(`mailto:${staffData.email}?subject=${subject}&body=${body}`, '_blank');
            toast.success(`Invited ${staffData.name} as ${roleTitle}! Onboarding email opened for ${staffData.email}.`, 'Email Dispatched');
          } catch (e) {
            toast.success(`Invited ${staffData.name} as ${roleTitle} with PIN ${pin}!`, 'Team Member Added');
          }
        } else {
          toast.success(`Invited ${staffData.name} as ${staffData.roleLabel}!`, 'Team Member Added');
        }
      }
      setIsStaffModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save staff member', 'Error');
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    try {
      setStaffMembers((prev) => prev.filter((s) => s.id !== staffId));
      await deleteStaffMember(staffId, currentUid, currentUser?.displayName || 'Café Admin');
      toast.success(`Removed ${staffName} from staff directory`, 'Staff Removed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete staff member', 'Error');
    }
  };

  const handleToggleStaffStatus = async (staffId, newStatus, staffName) => {
    try {
      await toggleStaffStatus(staffId, newStatus, currentUid, currentUser?.displayName || 'Café Admin');
      toast.info(`Changed ${staffName}'s status to ${newStatus}`, 'Status Updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update staff status', 'Error');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    toast.info('You have signed out', 'Session Ended');
    window.location.href = '/login';
  };

  const contextValue = {
    items,
    categories,
    activityLogs,
    purchaseOrders,
    vendors,
    supplierApplications,
    staffMembers,
    currentUser,
    role,
    setRole,
    isLoading,
    searchQuery,
    setSearchQuery,
    lowStockItems,
    outOfStockItems,
    totalValuation,
    openAddItem: handleOpenAddItem,
    openEditItem: handleOpenEditItem,
    openDeleteItem: handleOpenDeleteItem,
    adjustQuantity: handleAdjustQuantity,
    openRestock: handleOpenRestock,
    confirmRestock: handleConfirmRestock,
    openCreatePo: handleOpenCreatePo,
    openGoodsReceipt: handleOpenGoodsReceipt,
    openAddCategory: handleOpenAddCategory,
    openEditCategory: handleOpenEditCategory,
    deleteCategory: handleDeleteCategory,
    openAddVendor: handleOpenAddVendor,
    openEditVendor: handleOpenEditVendor,
    deleteVendor: handleDeleteVendor,
    mapVendorPrice: handleMapVendorPrice,
    unmapVendorPrice: handleUnmapVendorPrice,
    approveSupplierApplication: handleApproveSupplierApplication,
    rejectSupplierApplication: handleRejectSupplierApplication,
    openAddStaff: handleOpenAddStaff,
    openEditStaff: handleOpenEditStaff,
    deleteStaffMember: handleDeleteStaff,
    toggleStaffStatus: handleToggleStaffStatus,
  };

  const pathname = usePathname();
  const userRole = currentUser?.role || role || 'admin';
  const allowedRoutes = ROLE_ALLOWED_ROUTES[userRole] || ROLE_ALLOWED_ROUTES.admin;
  const isCurrentRouteAllowed = !pathname || allowedRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-cafe-50 dark:bg-[#0F0C0A] flex flex-col lg:flex-row transition-colors">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          lowStockCount={lowStockItems.length}
          outOfStockCount={outOfStockItems.length}
          pendingPoCount={purchaseOrders.filter((po) => po.status === 'PENDING_DELIVERY').length}
          pendingAppCount={supplierApplications.filter((a) => a.status === 'PENDING').length}
          currentUser={currentUser}
          role={role}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
          <Header
            onOpenSidebar={() => setIsSidebarOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            lowStockItems={lowStockItems}
            outOfStockItems={outOfStockItems}
            recentLogs={activityLogs}
            currentUser={currentUser}
            role={role}
            items={items}
            purchaseOrders={purchaseOrders}
            vendors={vendors}
            staffMembers={staffMembers}
            totalValuation={totalValuation}
          />

          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8 animate-pageFadeIn">
            {isCurrentRouteAllowed ? (
              children
            ) : (
              <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#181310] border border-amber-300/80 dark:border-amber-800/60 shadow-cafe-md text-center max-w-xl mx-auto space-y-5 my-8">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800 shadow-sm">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300">
                    Role Access Control
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
                    Restricted Area for Your Role
                  </h2>
                  <p className="text-xs sm:text-sm text-espresso-600 dark:text-cafe-400 leading-relaxed max-w-md mx-auto">
                    You are currently signed in as <strong className="text-espresso-950 dark:text-cafe-100">{currentUser?.displayName || 'Staff Member'}</strong> with role <strong className="text-caramel-600 dark:text-caramel-400">"{currentUser?.roleLabel || userRole}"</strong>. This section is restricted to authorized roles.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-800 text-left space-y-2">
                  <p className="text-[11px] font-bold uppercase text-espresso-500 dark:text-cafe-400">
                    Permitted Pages for Your Role:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allowedRoutes.map((r) => {
                      const name =
                        r === '/dashboard'
                          ? 'Store Overview'
                          : r === '/dashboard/inventory'
                          ? 'All Items & Stock'
                          : r === '/dashboard/analytics'
                          ? 'Stock Valuation & Costs'
                          : r === '/dashboard/history'
                          ? 'History & Audit Logs'
                          : r === '/dashboard/reorder'
                          ? 'Low Stock & Reorder'
                          : r === '/dashboard/orders'
                          ? 'Orders & Deliveries'
                          : r === '/dashboard/vendors'
                          ? 'Suppliers & Quotes'
                          : r === '/dashboard/categories'
                          ? 'Categories'
                          : 'Staff & PINs';
                      return (
                        <Link
                          key={r}
                          href={r}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-espresso-800 text-caramel-700 dark:text-caramel-300 border border-cafe-200 dark:border-espresso-700 hover:border-caramel-500 shadow-xs transition-all"
                        >
                          {name} &rarr;
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard/inventory"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95"
                  >
                    <span>Go to Accessible Inventory Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Modals */}
        <ItemModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSubmit={handleSaveItem}
          categories={categories}
          registeredVendors={vendors}
          itemToEdit={itemToEdit}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={itemToDelete?.name || 'this item'}
          isDeleting={isDeleting}
        />

        <QuickRestockModal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          item={itemToRestock}
          onRestock={handleConfirmRestock}
          activityLogs={activityLogs}
        />

        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSubmit={handleSaveCategory}
          categoryToEdit={categoryToEdit}
        />

        <VendorModal
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
          onSubmit={handleSaveVendor}
          vendorToEdit={vendorToEdit}
        />

        <StaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          onSubmit={handleSaveStaff}
          staffToEdit={staffToEdit}
        />

        <GoodsReceiptModal
          isOpen={isGoodsReceiptOpen}
          onClose={() => setIsGoodsReceiptOpen(false)}
          purchaseOrder={selectedPoForReceipt}
          onReconcile={handleReconcileGoodsReceipt}
        />

        <CreatePoModal
          isOpen={isCreatePoOpen}
          onClose={() => setIsCreatePoOpen(false)}
          onSubmit={handleSavePurchaseOrder}
          onCreatePo={handleSavePurchaseOrder}
          inventoryItems={items}
          initialSupplier={createPoSupplier}
          initialItems={createPoItems}
        />
      </div>
    </DashboardContext.Provider>
  );
}
