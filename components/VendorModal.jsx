'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  FileText,
  Plus,
} from 'lucide-react';

const PAYMENT_TERMS_OPTIONS = [
  'Net 15',
  'Net 30',
  'Net 45',
  'COD (Cash on Delivery)',
  'Weekly Settlement',
  'Daily Cash / UPI',
  'Advance 100%',
];

export default function VendorModal({
  isOpen,
  onClose,
  onSubmit,
  vendorToEdit = null,
}) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    leadTimeDays: '2',
    paymentTerms: 'Net 15',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vendorToEdit) {
      setFormData({
        name: vendorToEdit.name || '',
        contactPerson: vendorToEdit.contactPerson || '',
        email: vendorToEdit.email || '',
        phone: vendorToEdit.phone || '',
        city: vendorToEdit.city || '',
        leadTimeDays: vendorToEdit.leadTimeDays !== undefined ? String(vendorToEdit.leadTimeDays) : '2',
        paymentTerms: vendorToEdit.paymentTerms || 'Net 15',
        notes: vendorToEdit.notes || '',
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        city: '',
        leadTimeDays: '2',
        paymentTerms: 'Net 15',
        notes: '',
      });
    }
    setErrors({});
  }, [vendorToEdit, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Supplier / Vendor name is required';
    if (!formData.leadTimeDays || isNaN(Number(formData.leadTimeDays)) || Number(formData.leadTimeDays) < 0) {
      errs.leadTimeDays = 'Valid lead time days required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        leadTimeDays: Number(formData.leadTimeDays) || 2,
        paymentTerms: formData.paymentTerms,
        notes: formData.notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso-950/70 backdrop-blur-sm"
      />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#181310] rounded-3xl border border-cafe-200 dark:border-espresso-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150"
      >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-cafe-100 dark:border-espresso-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/50 shadow-sm">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-espresso-950 dark:text-cafe-50">
                    {vendorToEdit ? 'Edit Supplier Profile' : 'Register New Vendor'}
                  </h3>
                  <p className="text-xs text-espresso-500 dark:text-cafe-400">
                    Enterprise supplier contact, lead times & payment terms
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-espresso-400 hover:text-espresso-700 dark:hover:text-cafe-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Vendor Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1">
                  Vendor / Supplier Business Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mercara Roasters, Nilgiri Dairy Co."
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl text-espresso-950 dark:text-cafe-50 outline-none focus:ring-2 focus:ring-caramel-500"
                />
                {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Contact Person & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Contact Person / Rep
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-400" />
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g. Karan Somanna"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    City / Supply Origin
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-400" />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Coorg, Karnataka"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98450 12345"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Orders Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="orders@mercararoasters.in"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Lead Time & Payment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Fulfillment Lead Time (Days)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso-400" />
                    <input
                      type="number"
                      min="0"
                      value={formData.leadTimeDays}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                      placeholder="2"
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                    Agreed Payment Terms
                  </label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none text-espresso-950 dark:text-cafe-50"
                  >
                    {PAYMENT_TERMS_OPTIONS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-espresso-700 dark:text-cafe-300 mb-1">
                  Catalogue & Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Authorized distributor for specialty roasts and alternative milks."
                  className="w-full px-3.5 py-2 text-xs font-medium bg-cafe-50 dark:bg-espresso-900/60 border border-cafe-200 dark:border-espresso-700 rounded-xl outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cafe-100 dark:border-espresso-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso-700 dark:text-cafe-300 hover:bg-cafe-100 dark:hover:bg-espresso-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : vendorToEdit ? 'Save Profile' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
