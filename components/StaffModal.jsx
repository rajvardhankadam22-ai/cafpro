'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Store,
  Clock,
  Key,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { REGISTERED_CAFES } from '@/services/seedData';

const STAFF_ROLES = [
  { value: 'admin', label: '👑 Store Admin & General Manager', desc: 'Full control over inventory, suppliers, financials, PINs & staff accounts' },
  { value: 'manager', label: '👔 Assistant Manager & Inventory Lead', desc: 'Manage stock, purchase orders, goods receipt & operational shift logs' },
  { value: 'head_barista', label: '☕ Head Barista & Shift Lead', desc: 'Manage recipes, daily restock, waste logging & barista floor operations' },
  { value: 'barista', label: '🧑‍🍳 Shift Barista (Floor POS)', desc: 'Streamlined floor POS mode, quick restocks, usage logging (-1)' },
  { value: 'auditor', label: '📋 Inventory & COGS Auditor', desc: 'Read-only financial audit trails, stock reconciliation & valuation reports' },
];

const SHIFTS = [
  'Morning Shift (6:30 AM - 3:00 PM)',
  'Evening Shift (2:30 PM - 11:00 PM)',
  'Full Day (Operations Lead)',
  'Flexible / On-Call',
];

export default function StaffModal({
  isOpen,
  onClose,
  onSubmit,
  staffToEdit = null,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'barista',
    roleLabel: 'Shift Barista',
    branch: 'Main Flagship Branch',
    shift: 'Morning Shift (6:30 AM - 3:00 PM)',
    status: 'ACTIVE',
    pin: '1234',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendEmailInvite, setSendEmailInvite] = useState(true);

  useEffect(() => {
    if (staffToEdit) {
      setFormData({
        name: staffToEdit.name || '',
        email: staffToEdit.email || '',
        phone: staffToEdit.phone || '',
        role: staffToEdit.role || 'barista',
        roleLabel: staffToEdit.roleLabel || 'Shift Barista',
        branch: staffToEdit.branch || 'Main Flagship Branch',
        shift: staffToEdit.shift || 'Morning Shift (6:30 AM - 3:00 PM)',
        status: staffToEdit.status || 'ACTIVE',
        pin: staffToEdit.pin || '1234',
        password: staffToEdit.password || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'barista',
        roleLabel: 'Shift Barista',
        branch: 'Main Flagship Branch',
        shift: 'Morning Shift (6:30 AM - 3:00 PM)',
        status: 'ACTIVE',
        pin: String(Math.floor(1000 + Math.random() * 9000)),
        password: '',
      });
    }
    setErrors({});
  }, [staffToEdit, isOpen]);

  const handleRoleChange = (roleVal) => {
    const matched = STAFF_ROLES.find((r) => r.value === roleVal);
    setFormData((prev) => ({
      ...prev,
      role: roleVal,
      roleLabel: matched ? matched.label.replace(/^[\p{Emoji}\s]+/gu, '') : 'Staff Member',
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
    if (!formData.pin.trim() || formData.pin.length < 4) errs.pin = '4-digit access PIN is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, sendEmailInvite });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso-950/70 backdrop-blur-sm"
      />

      {/* Modal Window */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
      >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-espresso-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 border border-caramel-200 dark:border-caramel-800/50">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                  {staffToEdit ? 'Edit Team Member' : 'Invite New Staff Member'}
                </h3>
                <p className="text-xs text-espresso-500 dark:text-cafe-400">
                  Assign branch location, shift timing, role permissions, and access PIN.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200 hover:bg-cafe-100 dark:hover:bg-espresso-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vikram Rao"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:ring-2 focus:ring-caramel-500"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vikram.barista@cafepulse.in"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:ring-2 focus:ring-caramel-500"
                  />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Phone & Access PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 97110 88990"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                  Quick Access PIN / Code *
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <input
                    type="text"
                    maxLength="6"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                  />
                </div>
                {errors.pin && <p className="text-[10px] text-red-500 mt-1">{errors.pin}</p>}
              </div>
            </div>

            {/* Optional Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                Custom Login Password <span className="text-[10px] font-normal text-espresso-400">(Optional — if blank, staff logs in using their 4-digit PIN)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set custom password (or leave blank to use PIN)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:ring-2 focus:ring-caramel-500"
                />
              </div>
            </div>

            {/* Role Locking Notice Card */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-800/60 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-950 dark:text-amber-200">
                  Role is Strictly Locked by Admin
                </p>
                <p className="text-espresso-600 dark:text-cafe-400 text-[11px] mt-0.5 leading-relaxed">
                  The staff member can log in from the login page using their email and PIN/password. Once logged in, their role is permanently locked and cannot be changed by themselves—only you (the Store Admin) can modify or reassign roles.
                </p>
              </div>
            </div>

            {/* Role Permissions Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                Staff Role & Permissions *
              </label>
              <div className="space-y-2">
                {STAFF_ROLES.map((r) => (
                  <label
                    key={r.value}
                    onClick={() => handleRoleChange(r.value)}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      formData.role === r.value
                        ? 'bg-caramel-50/80 dark:bg-caramel-950/40 border-caramel-500 shadow-sm'
                        : 'bg-cafe-50/50 dark:bg-espresso-900/40 border-cafe-200 dark:border-espresso-800 hover:border-cafe-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="staffRole"
                      checked={formData.role === r.value}
                      onChange={() => handleRoleChange(r.value)}
                      className="mt-1 w-4 h-4 text-caramel-600 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50">
                        {r.label}
                      </p>
                      <p className="text-[10px] text-espresso-500 dark:text-cafe-400 mt-0.5">
                        {r.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Branch Assignment & Shift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                  Assigned Branch Location
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                  >
                    <option value="All Branches (Network)">All Branches (Network Lead)</option>
                    {REGISTERED_CAFES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                  Shift Schedule
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                Account Status
              </label>
              <div className="flex gap-2">
                {['ACTIVE', 'ON_LEAVE', 'SUSPENDED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: st })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.status === st
                        ? st === 'ACTIVE'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'ON_LEAVE'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-red-600 text-white border-red-600'
                        : 'bg-cafe-50 dark:bg-espresso-900/50 text-espresso-600 dark:text-cafe-400 border-cafe-200 dark:border-espresso-700'
                    }`}
                  >
                    {st === 'ACTIVE' ? '✓ Active' : st === 'ON_LEAVE' ? '🏖️ On Leave' : '⛔ Suspended'}
                  </button>
                ))}
              </div>
            </div>

            {/* Onboarding Email Dispatch */}
            {!staffToEdit && (
              <div className="p-3.5 rounded-2xl bg-caramel-50/80 dark:bg-espresso-900/60 border border-caramel-200/80 dark:border-caramel-900/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendEmailInvite}
                    onChange={(e) => setSendEmailInvite(e.target.checked)}
                    className="w-4 h-4 rounded text-caramel-600 focus:ring-caramel-500 rounded-md"
                  />
                  <span className="text-xs font-bold text-espresso-950 dark:text-cafe-50 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-caramel-600" />
                    <span>Send Onboarding & 4-Digit Floor PIN Email to Staff Member</span>
                  </span>
                </label>
                {sendEmailInvite && (
                  <p className="text-[11px] text-espresso-600 dark:text-cafe-400 pl-6 leading-relaxed">
                    Automatically dispatches an official onboarding email to <strong className="text-caramel-700 dark:text-caramel-300">{formData.email || 'the staff email'}</strong> containing their role title (<strong>{formData.roleLabel}</strong>), branch assignment, shift roster, and secure 4-digit floor unlock PIN (<strong>{formData.pin}</strong>).
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cafe-100 dark:border-espresso-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-espresso-600 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : staffToEdit ? 'Save Changes' : 'Invite Staff Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
