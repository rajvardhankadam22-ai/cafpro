'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Building,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Tag,
  DollarSign,
  Send,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Store,
  Layers,
  Sparkles,
  ArrowRight,
  Lock,
  LogIn,
  LogOut,
  Key,
  UserPlus,
  PlusCircle,
  Plus,
  Check,
  X,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  subscribeToAllVendors,
  subscribeToAllRegisteredCafes,
  subscribeToPurchaseOrders,
  subscribeToInventory,
  updatePurchaseOrderDispatch,
  addVendor,
  submitSupplierApplication,
  addInventoryItem,
} from '@/services/inventoryService';
import { INITIAL_VENDORS } from '@/services/seedData';
import { useToast } from '@/components/Toast';

const LOCAL_SUPPLIER_KEY = 'cafepulse_supplier_session';

export default function SupplierPortalPage() {
  const toast = useToast();

  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [liveCafes, setLiveCafes] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [authenticatedSupplier, setAuthenticatedSupplier] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('demand'); // 'demand' | 'orders' | 'pricebook'

  // Auth gate mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration form state (Create Vendor Account)
  const [regForm, setRegForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: 'Bengaluru, Karnataka',
    category: 'Specialty Coffee Roaster',
    password: '',
    leadTimeDays: 2,
    paymentTerms: 'Net 15',
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  // Dispatch modal state
  const [dispatchPo, setDispatchPo] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierName, setCarrierName] = useState('Direct Express Courier / Van');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState('');

  // Apply for Café Requirement Quote Modal state
  const [quotingDemand, setQuotingDemand] = useState(null); // { cafe, demand }
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMoq, setQuoteMoq] = useState('5');
  const [quoteLeadTime, setQuoteLeadTime] = useState('2');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [submittedQuotes, setSubmittedQuotes] = useState({}); // { [demandKey]: true }

  // Add Product to Rate Card Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Coffee & Espresso Beans',
    sku: '',
    unitPrice: '',
    unit: 'kg',
    moq: '5',
    leadTimeDays: '2',
    notes: '',
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Check stored supplier session on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SUPPLIER_KEY);
      if (stored) {
        setAuthenticatedSupplier(JSON.parse(stored));
      }
    } catch (e) {}
    setAuthChecked(true);
  }, []);

  // Subscribe to live vendors, registered cafes, purchase orders, and inventory items
  useEffect(() => {
    const unsubVendors = subscribeToAllVendors((loadedVendors) => {
      setVendors(loadedVendors);
      if (authenticatedSupplier) {
        const matched = loadedVendors.find(
          (v) =>
            v.id === authenticatedSupplier.id ||
            (v.email && v.email.toLowerCase() === authenticatedSupplier.email?.toLowerCase()) ||
            (v.name && v.name.toLowerCase() === authenticatedSupplier.name?.toLowerCase())
        );
        if (matched) {
          setAuthenticatedSupplier((prev) => ({ ...prev, ...matched }));
        }
      }
    });

    const unsubCafes = subscribeToAllRegisteredCafes((loadedCafes) => {
      setLiveCafes(loadedCafes);
    });

    const unsubPos = subscribeToPurchaseOrders(null, (loadedPos) => {
      setPurchaseOrders(loadedPos);
    });

    const unsubItems = subscribeToInventory(null, (loadedItems) => {
      setInventoryItems(loadedItems);
    });

    return () => {
      unsubVendors();
      unsubCafes();
      unsubPos();
      unsubItems();
    };
  }, [authenticatedSupplier?.id]);

  // Handle Supplier Sign In with strict password authentication
  const handleSupplierLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmail) {
      setLoginError('Please enter your registered supplier email or company name.');
      setIsLoggingIn(false);
      return;
    }
    if (!cleanPass) {
      setLoginError('Please enter your account password.');
      setIsLoggingIn(false);
      return;
    }

    const match = vendors.find(
      (v) =>
        (v.email || '').toLowerCase().trim() === cleanEmail ||
        (v.name || '').toLowerCase().trim() === cleanEmail
    );

    if (!match) {
      setIsLoggingIn(false);
      setLoginError('No supplier account found with this email. Please click "+ Create Vendor Account" below to register.');
      return;
    }

    const expectedPass = match.password || 'vendor123';
    if (cleanPass !== expectedPass) {
      setIsLoggingIn(false);
      setLoginError('Incorrect password for this supplier account. Please try again.');
      return;
    }

    const session = {
      id: match.id || 'ven-' + Date.now(),
      name: match.name,
      email: match.email || cleanEmail,
      contactPerson: match.contactPerson || 'Wholesale Representative',
      phone: match.phone || '+91 98000 00000',
      city: match.city || 'Bengaluru',
      leadTimeDays: match.leadTimeDays || 2,
      paymentTerms: match.paymentTerms || 'Net 15',
      category: match.category || 'Specialty Supplier',
    };

    setAuthenticatedSupplier(session);
    localStorage.setItem(LOCAL_SUPPLIER_KEY, JSON.stringify(session));
    toast.success(`Welcome back, ${session.name}!`, 'Supplier Signed In');
    setIsLoggingIn(false);
  };

  // Handle Supplier Registration (Create Account)
  const handleSupplierRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regForm.companyName || !regForm.email) {
      setRegError('Company name and email address are required.');
      return;
    }
    if (!regForm.password || regForm.password.trim().length < 4) {
      setRegError('Please create a password with at least 4 characters.');
      return;
    }

    try {
      setIsRegistering(true);
      const newVendorData = {
        name: regForm.companyName.trim(),
        contactPerson: regForm.contactPerson.trim() || 'Wholesale Lead',
        email: regForm.email.trim().toLowerCase(),
        phone: regForm.phone.trim() || '+91 98000 00000',
        city: regForm.city.trim() || 'Bengaluru, Karnataka',
        category: regForm.category,
        password: regForm.password.trim(),
        leadTimeDays: Number(regForm.leadTimeDays) || 2,
        paymentTerms: regForm.paymentTerms,
        notes: `Registered via Supplier Portal on ${new Date().toLocaleDateString()}`,
      };

      const created = await addVendor(newVendorData, 'marketplace-vendors', regForm.companyName);
      const session = {
        id: created.id,
        ...newVendorData,
      };

      setAuthenticatedSupplier(session);
      localStorage.setItem(LOCAL_SUPPLIER_KEY, JSON.stringify(session));
      toast.success(`Supplier account registered for ${regForm.companyName}!`, 'Welcome to CaféPulse B2B');
    } catch (err) {
      console.error(err);
      setRegError('Failed to create account. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSupplierLogout = () => {
    setAuthenticatedSupplier(null);
    localStorage.removeItem(LOCAL_SUPPLIER_KEY);
    toast.info('Signed out of Supplier Portal.', 'Session Ended');
  };

  const currentVendor = authenticatedSupplier;

  // Filter POs for this specific supplier
  const vendorOrders = currentVendor
    ? purchaseOrders.filter((po) => {
        const poSup = (po.supplierName || '').toLowerCase().trim();
        const curName = (currentVendor.name || '').toLowerCase().trim();
        const curEmail = (currentVendor.email || '').toLowerCase().trim();
        const poEmail = (po.supplierEmail || '').toLowerCase().trim();
        return (
          (curName && (poSup.includes(curName) || curName.includes(poSup))) ||
          (curEmail && poEmail && poEmail === curEmail) ||
          po.vendorId === currentVendor.id ||
          po.supplierId === currentVendor.id
        );
      })
    : [];

  // Filter inventory items supplied by this vendor
  const vendorSuppliedItems = currentVendor
    ? inventoryItems.filter((item) => {
        const isDirect = (item.supplier || '').toLowerCase().trim() === (currentVendor.name || '').toLowerCase().trim();
        const hasMapping = (item.vendorMappings || []).some(
          (m) =>
            (m.vendorName || '').toLowerCase().trim() === (currentVendor.name || '').toLowerCase().trim() ||
            m.vendorId === currentVendor.id
        );
        return isDirect || hasMapping;
      })
    : [];

  const pendingShipments = vendorOrders.filter((po) => po.status === 'PENDING_DELIVERY');
  const completedShipments = vendorOrders.filter((po) => po.status === 'DELIVERED');
  const totalLiveDemands = liveCafes.reduce((acc, c) => acc + (c.activeDemands?.length || 0), 0);

  // Open Dispatch Modal
  const handleOpenDispatchModal = (po) => {
    setDispatchPo(po);
    setTrackingNumber(`TRK-${Date.now().toString().slice(-6)}`);
    setCarrierName('Direct Roastery Express Van');
    setDispatchNotes('Batch inspected and dispatched from roasting warehouse.');
    setDispatchSuccess('');
  };

  // Confirm Dispatch
  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchPo) return;
    setIsDispatching(true);

    try {
      await updatePurchaseOrderDispatch(
        dispatchPo.id,
        {
          trackingNumber: trackingNumber.trim(),
          carrierName: carrierName.trim(),
          notes: dispatchNotes.trim(),
        },
        dispatchPo.userId || null,
        currentVendor?.name || 'Supplier Portal'
      );
      setDispatchSuccess(`PO #${dispatchPo.poNumber} has been marked as Dispatched! Tracking: ${trackingNumber}`);
      toast.success(`PO #${dispatchPo.poNumber} dispatched! Courier tracking sent to café.`, 'Shipment In-Transit');
      setTimeout(() => {
        setDispatchPo(null);
        setDispatchSuccess('');
      }, 1800);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update dispatch status', 'Error');
    } finally {
      setIsDispatching(false);
    }
  };

  // Open Quote Modal for a Café Demand
  const handleOpenQuoteModal = (cafe, demand) => {
    setQuotingDemand({ cafe, demand });
    const budgetMatch = (demand.targetBudget || '').match(/\d[\d,]*/);
    const estimatedInitial = budgetMatch ? budgetMatch[0].replace(/,/g, '') : '1200';
    setQuotePrice(estimatedInitial);
    setQuoteMoq('5');
    setQuoteLeadTime(String(currentVendor?.leadTimeDays || 2));
    setQuoteNotes(`Freshly batch roasted by ${currentVendor?.name || 'Roastery Partner'}. Available for weekly scheduled deliveries.`);
  };

  // Submit Quote & Proposal to the Target Café
  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!quotingDemand || !quotePrice) return;

    setIsSubmittingQuote(true);
    try {
      const demandKey = `${quotingDemand.cafe.id}_${quotingDemand.demand.itemId}`;
      const appPayload = {
        companyName: currentVendor.name,
        contactPerson: currentVendor.contactPerson || 'Wholesale Manager',
        email: currentVendor.email,
        phone: currentVendor.phone || '+91 98000 00000',
        city: currentVendor.city || 'Bengaluru',
        category: currentVendor.category || 'Specialty Supplier',
        leadTimeDays: Number(quoteLeadTime) || 2,
        paymentTerms: currentVendor.paymentTerms || 'Net 15',
        notes: quoteNotes,
        targetCafeId: quotingDemand.cafe.id,
        targetCafeName: quotingDemand.cafe.name,
        quotedItems: [
          {
            masterItemId: quotingDemand.demand.itemId,
            masterItemName: quotingDemand.demand.itemName,
            wholesalePrice: Number(quotePrice),
            unit: quotingDemand.demand.unit,
            moq: Number(quoteMoq) || 1,
            leadTimeDays: Number(quoteLeadTime) || 2,
            notes: quoteNotes,
          },
        ],
      };

      await submitSupplierApplication(appPayload, quotingDemand.cafe.id);

      setSubmittedQuotes((prev) => ({ ...prev, [demandKey]: true }));
      toast.success(
        `Quotation of ₹${Number(quotePrice).toLocaleString('en-IN')}/${quotingDemand.demand.unit} sent to ${quotingDemand.cafe.name}!`,
        'Supply Bid Submitted'
      );
      setQuotingDemand(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit quotation. Please try again.', 'Error');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Handle Add Item to Rate Card
  const handleAddProductToCatalog = async (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.unitPrice) return;

    setIsSavingProduct(true);
    try {
      const itemData = {
        name: newProductForm.name.trim(),
        categoryId: 'cat-coffee',
        sku: newProductForm.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        quantity: 50,
        unit: newProductForm.unit || 'kg',
        unitPrice: Number(newProductForm.unitPrice),
        reorderLevel: 10,
        parLevel: 40,
        supplier: currentVendor?.name || 'Specialty Supplier',
        notes: newProductForm.notes || `Supplied by ${currentVendor?.name}`,
        vendorMappings: [
          {
            mappingId: `vm-${Date.now()}`,
            vendorName: currentVendor?.name || 'Specialty Supplier',
            vendorItemName: newProductForm.name.trim(),
            vendorSku: newProductForm.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
            unitPrice: Number(newProductForm.unitPrice),
            isPreferred: true,
            leadTimeDays: Number(newProductForm.leadTimeDays) || 2,
            notes: newProductForm.notes,
          },
        ],
      };

      await addInventoryItem(itemData, null);
      toast.success(`Added ${newProductForm.name} to wholesale catalogue!`, 'Product Registered');
      setIsAddProductOpen(false);
      setNewProductForm({
        name: '',
        category: 'Coffee & Espresso Beans',
        sku: '',
        unitPrice: '',
        unit: 'kg',
        moq: '5',
        leadTimeDays: '2',
        notes: '',
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product to catalogue', 'Error');
    } finally {
      setIsSavingProduct(false);
    }
  };


  // ─────────────────────────────────────────────────────────────
  // IF NOT AUTHENTICATED: RENDER UNIFIED SUPPLIER LOGIN & SIGN UP
  // ─────────────────────────────────────────────────────────────
  if (authChecked && !authenticatedSupplier) {
    return (
      <div className="min-h-screen bg-[#0A0706] text-cafe-50 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
        {/* Background Ambient Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-caramel-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-[#140F0D]/95 border border-emerald-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-5"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg mb-2">
              <Truck className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-cafe-50 tracking-tight">
                Wholesale Supplier Portal
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                B2B Exchange
              </span>
            </div>
            <p className="text-xs text-espresso-400 max-w-sm mx-auto">
              Sign in with your vendor credentials to view live café ingredient requirements, submit supply quotations, and manage shipment dispatches.
            </p>
          </div>

          {/* Mode Switcher: Sign In vs Create Vendor Account */}
          <div className="flex rounded-xl bg-black/60 p-1 border border-espresso-800 gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
                setRegError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-espresso-400 hover:text-cafe-100'
              }`}
            >
              Sign In (Existing Supplier)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setLoginError('');
                setRegError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-espresso-400 hover:text-cafe-100'
              }`}
            >
              + Create Vendor Account
            </button>
          </div>

          {/* Error Message */}
          {(loginError || regError) && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p>{loginError || regError}</p>
            </div>
          )}

          {/* TAB 1: SUPPLIER SIGN IN */}
          {authMode === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleSupplierLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1.5">
                    Supplier Email or Brand Name *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-500" />
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. wholesale@yourbrand.com or Brand Name"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 placeholder:text-espresso-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1.5">
                    Vendor Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-500" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your vendor account password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 placeholder:text-espresso-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoggingIn ? <span>Authenticating...</span> : <><span>Sign In to Supplier Portal</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CREATE VENDOR ACCOUNT */}
          {authMode === 'register' && (
            <form onSubmit={handleSupplierRegister} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Company / Roastery Name *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-500" />
                    <input
                      type="text"
                      value={regForm.companyName}
                      onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                      placeholder="e.g. Coorg Artisan Roasters"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={regForm.contactPerson}
                    onChange={(e) => setRegForm({ ...regForm, contactPerson: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full px-3 py-2 text-xs font-bold bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Wholesale Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-500" />
                    <input
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="b2b@yourbrand.com"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-500" />
                    <input
                      type="text"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+91 98450 11223"
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Product Category
                  </label>
                  <select
                    value={regForm.category}
                    onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 outline-none cursor-pointer"
                  >
                    <option value="Specialty Coffee Roaster">☕ Specialty Coffee Roaster</option>
                    <option value="Dairy & Plant Milks">🥛 Dairy & Plant Milks</option>
                    <option value="Syrups, Sauces & Mixology">🍹 Syrups, Sauces & Mixology</option>
                    <option value="Bakery, Pastries & Snacks">🥐 Bakery, Pastries & Snacks</option>
                    <option value="Barista Equipment & Packaging">📦 Barista Packaging & Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    City / Supply Hub
                  </label>
                  <input
                    type="text"
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full px-3 py-2 text-xs font-bold bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-300 mb-1">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-500" />
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Create account password (min. 4 characters)"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-black/60 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isRegistering ? <span>Creating Account...</span> : <><span>Create Supplier Account & Enter</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* Footer Back to Cafe Store Login */}
          <div className="pt-3 text-center border-t border-espresso-800/80">
            <Link
              href="/login"
              className="text-xs text-espresso-400 hover:text-cafe-50 font-bold hover:underline inline-flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-caramel-500" />
              <span>Looking for Café Store & Staff Login? Go to Store Login &rarr;</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // AUTHENTICATED SUPPLIER DASHBOARD & CAFÉ DEMANDS BIDDING
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0E0B09] text-cafe-50 selection:bg-emerald-500 selection:text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-espresso-800/80 bg-[#140F0D]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-emerald-glow transition-transform group-hover:scale-105">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-cafe-50 tracking-tight">CaféPulse</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SUPPLIER PORTAL
                </span>
              </div>
              <p className="text-[10px] text-espresso-400 font-medium">B2B Order Fulfillment & Wholesale Exchange</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSupplierLogout}
              className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl border border-red-900/60 bg-red-950/30 hover:bg-red-950/60 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit / Sign Out</span>
            </button>
            <Link
              href="/login"
              className="text-xs font-bold text-espresso-400 hover:text-cafe-50 px-3 py-1.5 rounded-xl border border-espresso-800 hidden sm:flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-caramel-500" />
              <span>Café Store Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Supplier Account Status Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1A1411] to-[#140F0D] border border-emerald-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center text-xl font-extrabold shadow-sm shrink-0">
              {currentVendor?.name ? currentVendor.name[0] : 'S'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-cafe-50">
                  {currentVendor?.name || 'Verified Supplier'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Authenticated Supplier</span>
                </span>
              </div>

              <p className="text-xs text-espresso-400 flex items-center gap-2 flex-wrap">
                {currentVendor?.city && <span>📍 {currentVendor.city}</span>}
                {currentVendor?.contactPerson && <span>👤 Rep: {currentVendor.contactPerson}</span>}
                {currentVendor?.phone && <span>📞 {currentVendor.phone}</span>}
                <span>⏱️ {currentVendor?.leadTimeDays || 2} Days Lead Time</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSupplierLogout}
              className="px-3.5 py-2 text-xs font-bold text-espresso-300 hover:text-cafe-50 bg-black/50 border border-espresso-700 rounded-xl hover:border-espresso-500 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Supplier</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#140F0D] border border-espresso-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-espresso-400">Open Demands</p>
              <p className="text-xl font-extrabold text-cafe-50">
                {totalLiveDemands}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#140F0D] border border-espresso-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-espresso-400">Pending POs</p>
              <p className="text-xl font-extrabold text-cafe-50">{pendingShipments.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#140F0D] border border-espresso-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-espresso-400">Fulfilled POs</p>
              <p className="text-xl font-extrabold text-cafe-50">{completedShipments.length}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#140F0D] border border-espresso-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-espresso-400">Connected Cafés</p>
              <p className="text-xl font-extrabold text-cafe-50">{liveCafes.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-espresso-800 gap-6">
          <button
            onClick={() => setActiveTab('demand')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'demand'
                ? 'text-emerald-400'
                : 'text-espresso-400 hover:text-cafe-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Café Requirements & Open Demands ({totalLiveDemands})</span>
            {activeTab === 'demand' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'text-emerald-400'
                : 'text-espresso-400 hover:text-cafe-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Incoming Purchase Orders ({vendorOrders.length})</span>
            {activeTab === 'orders' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pricebook')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'pricebook'
                ? 'text-emerald-400'
                : 'text-espresso-400 hover:text-cafe-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>My Rate Card & Products ({vendorSuppliedItems.length})</span>
            {activeTab === 'pricebook' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
              />
            )}
          </button>
        </div>

        {/* TAB 1: CAFÉ REQUIREMENTS & BIDDING MATRIX (PRIMARY WORKFLOW) */}
        {activeTab === 'demand' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Live Partner Café Supply Demands across Network</span>
              </p>
              <p className="text-espresso-400 text-[11px] leading-relaxed">
                Review open ingredient restock requirements posted by registered café stores. Click <strong>"Apply / Submit Quote"</strong> on any item to send your wholesale pricing directly to the café manager's review portal!
              </p>
            </div>

            {liveCafes.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#140F0D] border border-espresso-800/80 space-y-3">
                <Store className="w-10 h-10 text-espresso-600 mx-auto" />
                <p className="text-base font-bold text-cafe-100">No connected café stores in network yet</p>
                <p className="text-xs text-espresso-400 max-w-md mx-auto">
                  When new café accounts register on the platform, their store profile, stock levels, and replenishment requirements will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {liveCafes.map((cafe) => (
                  <div
                    key={cafe.id}
                    className="p-5 sm:p-6 rounded-3xl bg-[#140F0D] border border-espresso-800 shadow-md space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-espresso-800">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-caramel-950 text-caramel-400 border border-caramel-800 flex items-center justify-center font-bold">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-cafe-50">{cafe.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {cafe.badge || 'Connected Store'}
                            </span>
                          </div>
                          <p className="text-xs text-espresso-400">📍 {cafe.address || 'Bengaluru, Karnataka'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Monthly Stock Valuation: {cafe.monthlyVolumeEstimate}
                        </span>
                      </div>
                    </div>

                    {/* Requirements Grid */}
                    {!cafe.activeDemands || cafe.activeDemands.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-black/40 border border-espresso-800/80 space-y-2">
                        <Package className="w-8 h-8 text-espresso-600 mx-auto" />
                        <p className="text-sm font-bold text-cafe-200">No Open Item Demands</p>
                        <p className="text-xs text-espresso-400 max-w-sm mx-auto">
                          No ingredient requirements have been posted by this store yet. When the café manager adds items or logs low stock, they will appear here in real time.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {cafe.activeDemands.map((demand, idx) => {
                          const demandKey = `${cafe.id}_${demand.itemId}`;
                          const isQuoted = submittedQuotes[demandKey];

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl bg-black/50 border flex flex-col justify-between space-y-3 transition-all ${
                                demand.isUrgent
                                  ? 'border-amber-800/70 hover:border-amber-600'
                                  : 'border-espresso-800/90 hover:border-emerald-700/60'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-bold text-xs text-cafe-50 leading-snug">
                                    {demand.itemName}
                                  </h4>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-espresso-900 text-espresso-400">
                                    {demand.unit}
                                  </span>
                                </div>
                                <p className="text-xs text-caramel-300 font-bold">
                                  Target PAR: {demand.monthlyQty} {demand.unit}
                                </p>
                                <p className="text-[11px] text-espresso-400">
                                  Standard Rate: <span className="text-emerald-400 font-medium">{demand.targetBudget}</span>
                                </p>
                                {demand.isUrgent && (
                                  <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                    <span>⚠️ Urgent: Café is Low on Stock ({demand.currentStock} left)</span>
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 border-t border-espresso-800/80">
                                {isQuoted ? (
                                  <div className="w-full py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Quote Submitted ✓</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleOpenQuoteModal(cafe, demand)}
                                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Apply / Submit Quote</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INCOMING PURCHASE ORDERS & DISPATCH WORKFLOW */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {vendorOrders.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#140F0D] border border-espresso-800/80 space-y-3">
                <Package className="w-10 h-10 text-espresso-600 mx-auto" />
                <p className="text-base font-bold text-cafe-100">No active purchase orders found</p>
                <p className="text-xs text-espresso-400 max-w-md mx-auto">
                  When café managers generate replenishments or POs assigned to {currentVendor?.name}, they will automatically appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {vendorOrders.map((po) => {
                  const isPending = po.status === 'PENDING_DELIVERY';
                  const isDispatched = Boolean(po.trackingNumber);

                  return (
                    <motion.div
                      key={po.id}
                      layout
                      className="p-5 sm:p-6 rounded-3xl bg-[#140F0D] border border-espresso-800 shadow-md space-y-4"
                    >
                      {/* PO Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-espresso-800/60">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-extrabold text-cafe-50 font-mono">
                              {po.poNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                po.status === 'DELIVERED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : isDispatched
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {po.status === 'DELIVERED'
                                ? '✓ Received & Stocked by Café'
                                : isDispatched
                                ? '🚚 In Transit / Dispatched'
                                : '⏳ Awaiting Shipment Dispatch'}
                            </span>
                          </div>
                          <p className="text-xs text-espresso-400 mt-1">
                            Issued on: {new Date(po.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-espresso-400">Total Invoice Value</p>
                            <p className="text-base font-bold text-emerald-400">
                              {formatCurrency(po.totalCost || po.totalEstimatedCost || 0)}
                            </p>
                          </div>

                          {isPending && !isDispatched && (
                            <button
                              onClick={() => handleOpenDispatchModal(po)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch Order</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Line Items List */}
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-espresso-400">
                          Ordered Items & Quantities:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(po.items || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-black/40 border border-espresso-800/80 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-cafe-100 truncate">{item.itemName}</p>
                                <p className="text-[10px] text-espresso-400 font-mono">{item.sku}</p>
                              </div>
                              <div className="text-right shrink-0 pl-3">
                                <p className="font-bold text-caramel-300">
                                  {item.orderedQty} {item.unit}
                                </p>
                                <p className="text-[10px] text-espresso-400">
                                  @{formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dispatch / Courier Details Strip */}
                      {isDispatched && (
                        <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-800/40 flex items-center justify-between text-xs text-blue-300">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-400" />
                            <span>
                              Carrier: <strong>{po.carrierName || 'Express Courier'}</strong> | Tracking: <strong className="font-mono">{po.trackingNumber}</strong>
                            </span>
                          </div>
                          {po.dispatchedAt && (
                            <span className="text-[10px] text-blue-400">
                              Dispatched {new Date(po.dispatchedAt).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRICE BOOK & CATALOGUE */}
        {activeTab === 'pricebook' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-cafe-50">Wholesale Rate Card & Products</h3>
                <p className="text-xs text-espresso-400">
                  Products supplied by <strong>{currentVendor?.name}</strong> to partner cafés in the exchange.
                </p>
              </div>

              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Product to Catalogue</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vendorSuppliedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#140F0D] border border-espresso-800 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-cafe-50">{item.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black text-caramel-400 border border-espresso-700">
                        {item.sku}
                      </span>
                    </div>
                    <p className="text-xs text-espresso-400 mt-1">{item.category || 'Specialty Supply'}</p>
                  </div>

                  <div className="pt-2 border-t border-espresso-800/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] text-espresso-500">Contracted Rate</p>
                      <p className="font-bold text-emerald-400">{formatCurrency(item.unitPrice)} / {item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-espresso-500">PAR Level</p>
                      <p className="font-bold text-cafe-200">{item.parLevel} {item.unit}</p>
                    </div>
                  </div>
                </div>
              ))}

              {vendorSuppliedItems.length === 0 && (
                <div className="col-span-full p-8 text-center rounded-2xl bg-black/40 border border-espresso-800/80 space-y-2">
                  <Tag className="w-8 h-8 text-espresso-600 mx-auto" />
                  <p className="text-sm font-bold text-cafe-200">No Custom Catalogue Items Yet</p>
                  <p className="text-xs text-espresso-400 max-w-sm mx-auto">
                    Click &quot;+ Add Product to Catalogue&quot; above to add specialty coffee beans, dairy cartons, or syrups offered by your company.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: APPLY / SUBMIT QUOTATION TO CAFÉ
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {quotingDemand && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuotingDemand(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#181310] rounded-3xl border border-emerald-700/60 p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-espresso-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Send className="w-4 h-4" />
                  <span>Submit Wholesale Quotation</span>
                </div>
                <button
                  onClick={() => setQuotingDemand(null)}
                  className="text-espresso-400 hover:text-cafe-50"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-black/60 border border-espresso-800 text-xs space-y-1">
                <p className="text-[10px] uppercase font-bold text-espresso-400">Target Café & Item:</p>
                <p className="font-extrabold text-cafe-50 text-sm">{quotingDemand.demand.itemName}</p>
                <p className="text-espresso-300">
                  Café: <strong>{quotingDemand.cafe.name}</strong> (Requirement: {quotingDemand.demand.monthlyQty} {quotingDemand.demand.unit}/mo)
                </p>
                <p className="text-espresso-400 text-[11px]">
                  Café Budget: <span className="text-emerald-400 font-semibold">{quotingDemand.demand.targetBudget}</span>
                </p>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Quoted Price (₹/{quotingDemand.demand.unit}) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-500" />
                      <input
                        type="number"
                        step="0.01"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        placeholder="e.g. 1250"
                        required
                        className="w-full pl-8 pr-3 py-2 text-xs font-bold font-mono bg-black/50 border border-espresso-700 rounded-xl text-emerald-400 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Min Order Qty (MOQ)
                    </label>
                    <input
                      type="number"
                      value={quoteMoq}
                      onChange={(e) => setQuoteMoq(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 text-xs font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Delivery Lead Time (Days) *
                  </label>
                  <input
                    type="number"
                    value={quoteLeadTime}
                    onChange={(e) => setQuoteLeadTime(e.target.value)}
                    placeholder="2"
                    required
                    className="w-full px-3 py-2 text-xs font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Supply Notes / Roast & Quality Pitch
                  </label>
                  <textarea
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    rows="2"
                    placeholder="e.g. 100% specialty grade, roasted fresh weekly with free delivery on Tuesdays."
                    className="w-full px-3 py-2 text-xs bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuotingDemand(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-espresso-400 hover:text-cafe-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingQuote ? <span>Submitting...</span> : <><span>Send Quote to Café</span><Send className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISPATCH PURCHASE ORDER MODAL */}
      <AnimatePresence>
        {dispatchPo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDispatchPo(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#181310] rounded-3xl border border-emerald-700/60 p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-espresso-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Send className="w-4 h-4" />
                  <span>Dispatch PO #{dispatchPo.poNumber}</span>
                </div>
                <button
                  onClick={() => setDispatchPo(null)}
                  className="text-espresso-400 hover:text-cafe-50"
                >
                  ✕
                </button>
              </div>

              {dispatchSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/50 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-emerald-200">{dispatchSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmDispatch} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Carrier / Vehicle Name *
                    </label>
                    <input
                      type="text"
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      placeholder="e.g. Direct Roastery Van / BlueDart"
                      required
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Courier / Waybill Tracking Number *
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. TRK-889900"
                      required
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Dispatch Notes / Batch Numbers
                    </label>
                    <textarea
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      rows="2"
                      placeholder="e.g. Batch #MB-404 roasted today morning."
                      className="w-full px-3.5 py-2 text-xs bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDispatchPo(null)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-espresso-400 hover:text-cafe-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDispatching}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all disabled:opacity-50"
                    >
                      {isDispatching ? 'Confirming...' : 'Confirm Dispatch'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD PRODUCT TO RATE CARD MODAL */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#181310] rounded-3xl border border-emerald-700/60 p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-espresso-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Add Product to Rate Card</span>
                </div>
                <button
                  onClick={() => setIsAddProductOpen(false)}
                  className="text-espresso-400 hover:text-cafe-50"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProductToCatalog} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Product / Item Name *
                  </label>
                  <input
                    type="text"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    placeholder="e.g. Signature Cold Brew Estate Beans"
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Wholesale Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.unitPrice}
                      onChange={(e) => setNewProductForm({ ...newProductForm, unitPrice: e.target.value })}
                      placeholder="1350"
                      required
                      className="w-full px-3.5 py-2.5 text-xs font-bold font-mono bg-black/50 border border-espresso-700 rounded-xl text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Unit (kg, ltr, pack)
                    </label>
                    <input
                      type="text"
                      value={newProductForm.unit}
                      onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                      placeholder="kg"
                      required
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Vendor SKU
                    </label>
                    <input
                      type="text"
                      value={newProductForm.sku}
                      onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                      placeholder="MCR-CLD-900"
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      value={newProductForm.leadTimeDays}
                      onChange={(e) => setNewProductForm({ ...newProductForm, leadTimeDays: e.target.value })}
                      placeholder="2"
                      className="w-full px-3.5 py-2.5 text-xs font-bold bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-300 mb-1">
                    Notes / Roasting Specification
                  </label>
                  <textarea
                    value={newProductForm.notes}
                    onChange={(e) => setNewProductForm({ ...newProductForm, notes: e.target.value })}
                    rows="2"
                    placeholder="e.g. Medium roast profile, nitrogen sealed 1kg valve bags."
                    className="w-full px-3.5 py-2 text-xs bg-black/50 border border-espresso-700 rounded-xl text-cafe-50 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-espresso-400 hover:text-cafe-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all disabled:opacity-50"
                  >
                    {isSavingProduct ? 'Saving...' : 'Add to Rate Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
