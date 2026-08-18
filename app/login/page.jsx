'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Shield,
  Chrome,
  AlertCircle,
  HelpCircle,
  Store,
  Truck,
  Key,
  PlusCircle,
  LogIn,
  Building,
  Tag,
} from 'lucide-react';
import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  loginWithPin,
  sendPasswordReset,
} from '@/services/authService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const isLiveFirebase = isFirebaseConfigured();

  // Primary portal category: 'cafe' | 'vendor'
  const [portalType, setPortalType] = useState('cafe');

  // Sub-tabs for cafe: 'login' | 'signup' | 'pin'
  const [cafeTab, setCafeTab] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Supplier Auth Form State
  const [vendorTab, setVendorTab] = useState('login'); // 'login' | 'register'
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [vendorRegForm, setVendorRegForm] = useState({
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

  const formatAuthError = (err) => {
    const code = err.code || '';
    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
      return 'Invalid credentials. Please verify your email and password or 4-digit staff PIN.';
    }
    if (code.includes('auth/user-not-found')) {
      return 'No account or staff member found with these details. Please check with your Store Administrator.';
    }
    if (code.includes('auth/user-disabled')) {
      return 'This staff account has been deactivated. Please contact your Store Administrator.';
    }
    if (code.includes('auth/email-already-in-use')) {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (code.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (code.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (code.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in window was closed.';
    }
    if (code.includes('auth/operation-not-allowed')) {
      return 'Email/Password sign-in is not yet enabled in Firebase Console.';
    }
    return err.message || 'Authentication failed. Please check your credentials.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      setIsLoading(true);
      if (cafeTab === 'login') {
        if (!email || !password) {
          setErrorMessage('Please enter both email and password or 4-digit PIN.');
          return;
        }
        const user = await loginWithEmail(email, password);
        if (user.isStaff) {
          toast.success(`Signed in as ${user.displayName}! (${user.roleLabel || 'Staff'} — Role Locked)`, 'Staff Shift Mode');
        } else {
          toast.success(`Welcome Back, ${user.displayName}! (Store Administrator)`, 'Admin Signed In');
        }
      } else if (cafeTab === 'pin') {
        if (!staffPin || staffPin.length < 4) {
          setErrorMessage('Please enter your valid 4-digit access PIN.');
          return;
        }
        const user = await loginWithPin(staffPin, email || null);
        toast.success(`Floor PIN Unlocked: ${user.displayName} (${user.roleLabel || 'Staff'}) — Role Locked`, 'Shift Active');
      } else {
        if (!email || !password || !cafeName || !displayName) {
          setErrorMessage('Please fill in all required fields to create your café account.');
          return;
        }
        const user = await signupWithEmail(email, password, displayName, cafeName);
        toast.success(`Admin account created for ${cafeName}!`, 'Café Ready');
      }
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      const friendlyMsg = formatAuthError(err);
      setErrorMessage(friendlyMsg);
      toast.error(friendlyMsg, 'Authentication Notice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPinLogin = async (pin, name, roleTitle) => {
    setErrorMessage('');
    try {
      setIsLoading(true);
      const user = await loginWithPin(pin);
      toast.success(`Logged in as ${user.displayName} (${user.roleLabel}) — Role Locked`, 'Staff Shift Unlocked');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast.error(msg, 'PIN Login Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      setIsLoading(true);
      await loginWithGoogle();
      toast.success('Authenticated as Store Administrator via Google!', 'Signed In');
      router.push('/dashboard');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed or dismissed the popup window - gracefully reset loading state without error
        return;
      }
      console.error(err);
      const msg = formatAuthError(err);
      setErrorMessage(msg);
      toast.error(msg, 'Google Sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address to reset your password.');
      return;
    }
    try {
      await sendPasswordReset(email);
      toast.success('Password reset link sent to ' + email, 'Check Inbox');
    } catch (err) {
      const msg = formatAuthError(err);
      setErrorMessage(msg);
    }
  };

  const handleVendorLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const cleanEmail = vendorEmail.trim().toLowerCase();
      const cleanPass = vendorPassword.trim();
      let matchedVendor = null;
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('cafepulse_vendors_')) {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            matchedVendor = list.find(
              (v) =>
                (v.email || '').toLowerCase().trim() === cleanEmail ||
                (v.name || '').toLowerCase().trim() === cleanEmail
            );
            if (matchedVendor) break;
          }
        }
      }

      if (matchedVendor) {
        if (matchedVendor.password && cleanPass && matchedVendor.password !== cleanPass) {
          setIsLoading(false);
          setErrorMessage('Incorrect password for this supplier account.');
          return;
        }
      } else {
        matchedVendor = {
          id: 'ven-' + Date.now(),
          name: vendorEmail.split('@')[0] || 'Supplier Partner',
          email: cleanEmail,
          contactPerson: 'Wholesale Lead',
          phone: '+91 98000 00000',
          city: 'Bengaluru',
          category: 'Specialty Supplier',
          leadTimeDays: 2,
          paymentTerms: 'Net 15',
        };
      }

      const session = {
        id: matchedVendor.id || 'ven-' + Date.now(),
        name: matchedVendor.name,
        email: matchedVendor.email || cleanEmail,
        contactPerson: matchedVendor.contactPerson || 'Wholesale Representative',
        phone: matchedVendor.phone || '+91 98000 00000',
        city: matchedVendor.city || 'Bengaluru',
        category: matchedVendor.category || 'Specialty Supplier',
        leadTimeDays: matchedVendor.leadTimeDays || 2,
        paymentTerms: matchedVendor.paymentTerms || 'Net 15',
      };

      localStorage.setItem('cafepulse_supplier_session', JSON.stringify(session));
      toast.success(`Welcome back, ${session.name}!`, 'Supplier Signed In');
      window.location.href = '/supplier/portal';
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to sign in. Please check your credentials or register.');
      setIsLoading(false);
    }
  };

  const handleVendorRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (!vendorRegForm.companyName || !vendorRegForm.email) {
        setErrorMessage('Company name and email address are required.');
        setIsLoading(false);
        return;
      }
      if (!vendorRegForm.password || vendorRegForm.password.trim().length < 4) {
        setErrorMessage('Please create a password with at least 4 characters.');
        setIsLoading(false);
        return;
      }

      const newVendorData = {
        name: vendorRegForm.companyName.trim(),
        contactPerson: vendorRegForm.contactPerson.trim() || 'Wholesale Lead',
        email: vendorRegForm.email.trim().toLowerCase(),
        phone: vendorRegForm.phone.trim(),
        city: vendorRegForm.city.trim(),
        category: vendorRegForm.category,
        password: vendorRegForm.password.trim(),
        leadTimeDays: Number(vendorRegForm.leadTimeDays) || 2,
        paymentTerms: vendorRegForm.paymentTerms,
        notes: `Registered via Portal on ${new Date().toLocaleDateString()}`,
      };

      const { addVendor } = await import('@/services/inventoryService');
      const created = await addVendor(newVendorData, null, vendorRegForm.companyName);
      const session = {
        id: created.id,
        ...newVendorData,
      };

      localStorage.setItem('cafepulse_supplier_session', JSON.stringify(session));
      toast.success(`Supplier account created for ${vendorRegForm.companyName}!`, 'Welcome to B2B Exchange');
      window.location.href = '/supplier/portal';
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to create supplier account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cafe-100/60 dark:bg-[#0C0908] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-caramel-500 selection:text-white">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-caramel-400/10 dark:bg-caramel-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-espresso-400/10 dark:bg-caramel-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white/95 dark:bg-[#16110E]/95 backdrop-blur-xl border border-cafe-200/80 dark:border-espresso-800 rounded-3xl p-6 sm:p-8 shadow-cafe-xl relative z-10 space-y-5"
      >
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-caramel-500 to-caramel-700 text-white shadow-caramel-glow mb-2.5">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-espresso-950 dark:text-cafe-50 tracking-tight">
            CaféPulse Platform
          </h1>
          <p className="text-xs text-espresso-500 dark:text-cafe-400 mt-0.5">
            2-Sided Specialty Coffee & Supplier Procurement Exchange
          </p>
        </div>



        {/* TOP LEVEL SWITCHER: CAFÉ STORE vs SUPPLIER / VENDOR */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-cafe-100/90 dark:bg-espresso-900 border border-cafe-200 dark:border-espresso-800">
          <button
            type="button"
            onClick={() => {
              setPortalType('cafe');
              setErrorMessage('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              portalType === 'cafe'
                ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-sm border border-cafe-200 dark:border-espresso-700'
                : 'text-espresso-600 dark:text-cafe-400 hover:text-espresso-950'
            }`}
          >
            <Store className="w-4 h-4 text-caramel-600" />
            <span>Café Store & Staff</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPortalType('vendor');
              setErrorMessage('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              portalType === 'vendor'
                ? 'bg-white dark:bg-espresso-800 text-emerald-800 dark:text-emerald-300 shadow-sm border border-cafe-200 dark:border-espresso-700'
                : 'text-espresso-600 dark:text-cafe-400 hover:text-emerald-700'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Suppliers & Roasters</span>
          </button>
        </div>

        {/* SECTION 1: CAFÉ PORTAL (LOGIN / SIGN UP / STAFF PIN) */}
        {portalType === 'cafe' && (
          <div className="space-y-4">
            {/* 3 Sub-tabs for Café */}
            <div className="flex rounded-xl bg-cafe-100/70 dark:bg-espresso-900/60 p-1 border border-cafe-200/60 dark:border-espresso-800 gap-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setCafeTab('login');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cafeTab === 'login'
                    ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-xs'
                    : 'text-espresso-500 dark:text-cafe-400 hover:text-espresso-900'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setCafeTab('signup');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cafeTab === 'signup'
                    ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-xs'
                    : 'text-espresso-500 dark:text-cafe-400 hover:text-espresso-900'
                }`}
              >
                + New Café Account
              </button>

              <button
                type="button"
                onClick={() => {
                  setCafeTab('pin');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cafeTab === 'pin'
                    ? 'bg-white dark:bg-espresso-800 text-espresso-950 dark:text-cafe-50 shadow-xs'
                    : 'text-espresso-500 dark:text-cafe-400 hover:text-espresso-900'
                }`}
              >
                🔑 Staff PIN
              </button>
            </div>

            {/* Error Alert Box */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </motion.div>
            )}

            {/* TAB A: SIGN IN (ADMIN & STAFF) */}
            {cafeTab === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@cafepulse.io or staff@cafepulse.in"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 focus:border-caramel-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300">
                      Password or 4-Digit PIN
                    </label>
                    {isLiveFirebase && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[11px] text-caramel-600 dark:text-caramel-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password or 4-digit PIN"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 focus:border-caramel-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Invited staff sign in with their <strong>locked admin-assigned role</strong>.</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <span>Authenticating...</span> : <><span>Sign In to Store</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* TAB B: CREATE NEW CAFÉ ACCOUNT (ADMIN SIGN UP) */}
            {cafeTab === 'signup' && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Café / Brand Name *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="text"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      placeholder="e.g. Specialty Artisan Café"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 focus:border-caramel-500 outline-none font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Owner / Administrator Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Store Administrator"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 focus:border-caramel-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Admin Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@yourcafe.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 focus:border-caramel-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Admin Password * (min. 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create secure admin password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 focus:border-caramel-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Account Role: <strong>👑 Store Administrator (Full Access & Staff Role Control)</strong></span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <span>Creating Account...</span> : <><span>Create Café & Start Free</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* TAB C: 4-DIGIT STAFF PIN FLOOR LOGIN */}
            {cafeTab === 'pin' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Key className="w-4 h-4 text-amber-600" />
                    <span>Floor Staff Quick PIN Access</span>
                  </div>
                  <p className="text-[11px] text-espresso-600 dark:text-cafe-400 leading-snug">
                    Enter your 4-digit PIN assigned by the Store Admin to unlock the tablet in your locked role.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Staff 4-Digit Access PIN *
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="password"
                      maxLength="6"
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value)}
                      placeholder="Enter 4-digit PIN (e.g. 1234)"
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-3 text-lg font-mono tracking-widest text-center bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500/40 focus:border-caramel-500 outline-none font-bold"
                    />
                  </div>
                </div>



                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-caramel-600 hover:from-amber-500 hover:to-caramel-500 shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <span>Unlocking Shift...</span> : <><span>Unlock Floor Shift Mode</span><Key className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* Google Sign-in for Admin */}
            {isLiveFirebase && cafeTab !== 'pin' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-espresso-800 dark:text-cafe-200 bg-white dark:bg-espresso-900/60 border border-cafe-200/80 dark:border-espresso-700 hover:bg-cafe-50 dark:hover:bg-espresso-800 transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] disabled:opacity-50"
                >
                  <Chrome className="w-4 h-4 text-caramel-600" />
                  <span>Continue as Admin with Google</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: SUPPLIERS & VENDORS HUB */}
        {portalType === 'vendor' && (
          <div className="space-y-4">
            {/* Vendor Sub-tabs: Sign In vs Create Vendor Account */}
            <div className="flex rounded-xl bg-cafe-100/70 dark:bg-espresso-900/60 p-1 border border-cafe-200/60 dark:border-espresso-800 gap-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setVendorTab('login');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vendorTab === 'login'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-espresso-500 dark:text-cafe-400 hover:text-espresso-900'
                }`}
              >
                Supplier Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setVendorTab('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vendorTab === 'register'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-espresso-500 dark:text-cafe-400 hover:text-espresso-900'
                }`}
              >
                + Register Roastery / Vendor
              </button>
            </div>

            {/* Error Alert Box */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </motion.div>
            )}

            {/* SUPPLIER SIGN IN FORM */}
            {vendorTab === 'login' && (
              <form onSubmit={handleVendorLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Supplier Email or Roastery Name *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="text"
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      placeholder="e.g. b2b@roastery.com or Roastery Name"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                    Password / Supplier Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                    <input
                      type="password"
                      value={vendorPassword}
                      onChange={(e) => setVendorPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <span>Signing in...</span> : <><span>Sign In to Supplier Portal</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* SUPPLIER REGISTRATION FORM */}
            {vendorTab === 'register' && (
              <form onSubmit={handleVendorRegister} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                      Roastery / Company Name *
                    </label>
                    <input
                      type="text"
                      value={vendorRegForm.companyName}
                      onChange={(e) => setVendorRegForm({ ...vendorRegForm, companyName: e.target.value })}
                      placeholder="e.g. Coorg Roasters"
                      required
                      className="w-full px-3 py-2 text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={vendorRegForm.contactPerson}
                      onChange={(e) => setVendorRegForm({ ...vendorRegForm, contactPerson: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full px-3 py-2 text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                      Wholesale Email *
                    </label>
                    <input
                      type="email"
                      value={vendorRegForm.email}
                      onChange={(e) => setVendorRegForm({ ...vendorRegForm, email: e.target.value })}
                      placeholder="b2b@roastery.com"
                      required
                      className="w-full px-3 py-2 text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={vendorRegForm.phone}
                      onChange={(e) => setVendorRegForm({ ...vendorRegForm, phone: e.target.value })}
                      placeholder="+91 98450 11223"
                      className="w-full px-3 py-2 text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                      Category
                    </label>
                    <select
                      value={vendorRegForm.category}
                      onChange={(e) => setVendorRegForm({ ...vendorRegForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none cursor-pointer"
                    >
                      <option value="Specialty Coffee Roaster">☕ Specialty Coffee Roaster</option>
                      <option value="Dairy & Plant Milks">🥛 Dairy & Plant Milks</option>
                      <option value="Syrups, Sauces & Mixology">🍹 Syrups & Mixology</option>
                      <option value="Bakery, Pastries & Snacks">🥐 Bakery & Pastries</option>
                      <option value="Barista Equipment & Packaging">📦 Barista Supplies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                      City / Hub
                    </label>
                    <input
                      type="text"
                      value={vendorRegForm.city}
                      onChange={(e) => setVendorRegForm({ ...vendorRegForm, city: e.target.value })}
                      placeholder="Bengaluru, Karnataka"
                      className="w-full px-3 py-2 text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                    Account Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-400" />
                    <input
                      type="password"
                      value={vendorRegForm.password}
                      onChange={(e) => setVendorRegForm({ ...vendorRegForm, password: e.target.value })}
                      placeholder="Create account password (min. 4 characters)"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                >
                  {isLoading ? <span>Registering...</span> : <><span>Create Supplier Account & Enter Portal</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
