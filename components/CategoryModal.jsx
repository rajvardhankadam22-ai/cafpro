'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Tags,
  Coffee,
  Milk,
  Sparkles,
  Croissant,
  Leaf,
  Box,
  ShieldCheck,
  Save,
  Tag,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

const ICONS = [
  { id: 'Coffee', label: 'Coffee', icon: Coffee },
  { id: 'Milk', label: 'Dairy & Milks', icon: Milk },
  { id: 'Sparkles', label: 'Syrups & Flavors', icon: Sparkles },
  { id: 'Croissant', label: 'Bakery & Pastry', icon: Croissant },
  { id: 'Leaf', label: 'Tea & Matcha', icon: Leaf },
  { id: 'Box', label: 'Packaging & Cups', icon: Box },
  { id: 'ShieldCheck', label: 'Cleaning & Equipment', icon: ShieldCheck },
  { id: 'Tag', label: 'General / Other', icon: Tag },
];

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categoryToEdit = null,
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Coffee');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setIcon(categoryToEdit.icon || 'Coffee');
      setDescription(categoryToEdit.description || '');
    } else {
      setName('');
      setIcon('Coffee');
      setDescription('');
    }
  }, [categoryToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a category name', 'Validation');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ name: name.trim(), icon, description: description.trim() });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save category', 'Error');
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
            <div className="flex items-center justify-between pb-4 border-b border-cafe-100 dark:border-espresso-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-caramel-100 dark:bg-caramel-950/60 text-caramel-700 dark:text-caramel-300 flex items-center justify-center border border-caramel-200 dark:border-caramel-800/50">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-espresso-900 dark:text-cafe-50">
                    {categoryToEdit ? 'Edit Category' : 'Create Category'}
                  </h3>
                  <p className="text-xs text-espresso-500 dark:text-cafe-400">
                    Organize your café inventory catalogue
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

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Specialty Coffee Beans"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500 focus:border-caramel-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-2">
                  Category Icon
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 border transition-all text-center ${
                          isSelected
                            ? 'bg-caramel-50 dark:bg-caramel-950/50 border-caramel-500 text-caramel-800 dark:text-caramel-300 font-bold shadow-sm'
                            : 'bg-white dark:bg-espresso-900/40 border-cafe-200 dark:border-espresso-800 text-espresso-600 dark:text-cafe-400 hover:bg-cafe-50'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[10px] leading-tight truncate w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-espresso-700 dark:text-cafe-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview of items in this category..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-cafe-50/70 dark:bg-espresso-900/50 border border-cafe-200 dark:border-espresso-700 text-espresso-900 dark:text-cafe-50 focus:ring-2 focus:ring-caramel-500 focus:border-caramel-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cafe-100 dark:border-espresso-800">
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-caramel-600 hover:bg-caramel-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : categoryToEdit ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
  );
}
