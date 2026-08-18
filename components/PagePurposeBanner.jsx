'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

/**
 * PagePurposeBanner
 * Renders a prominent, elegant, and interactive banner at the top of pages
 * highlighting what the page is for and the key actions users can perform.
 */
export default function PagePurposeBanner({
  purpose,
  actions = [],
  primaryAction = null,
  accentColor = 'caramel', // 'caramel' | 'emerald' | 'amber' | 'blue' | 'purple'
  badgeText = 'Page Purpose & Actions',
}) {
  const [isOpen, setIsOpen] = useState(true);

  const getAccentStyles = () => {
    switch (accentColor) {
      case 'emerald':
        return {
          gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-espresso-900/40',
          border: 'border-emerald-300/80 dark:border-emerald-800/60',
          iconBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
          badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          numberBg: 'bg-emerald-600',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700',
        };
      case 'amber':
        return {
          gradient: 'from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-espresso-900/40',
          border: 'border-amber-300/80 dark:border-amber-800/60',
          iconBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
          badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          numberBg: 'bg-amber-600',
          btnBg: 'bg-amber-600 hover:bg-amber-700',
        };
      case 'blue':
        return {
          gradient: 'from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-950/40 dark:via-espresso-900/40',
          border: 'border-blue-300/80 dark:border-blue-800/60',
          iconBg: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          numberBg: 'bg-blue-600',
          btnBg: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'purple':
        return {
          gradient: 'from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-950/40 dark:via-espresso-900/40',
          border: 'border-purple-300/80 dark:border-purple-800/60',
          iconBg: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
          badge: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          numberBg: 'bg-purple-600',
          btnBg: 'bg-purple-600 hover:bg-purple-700',
        };
      case 'caramel':
      default:
        return {
          gradient: 'from-caramel-500/10 via-amber-500/5 to-transparent dark:from-caramel-950/40 dark:via-espresso-900/40',
          border: 'border-caramel-300/80 dark:border-caramel-800/60',
          iconBg: 'bg-caramel-500/20 text-caramel-700 dark:text-caramel-400',
          badge: 'bg-caramel-100 dark:bg-caramel-950/80 text-caramel-800 dark:text-caramel-300 border-caramel-200 dark:border-caramel-800/60',
          numberBg: 'bg-caramel-600',
          btnBg: 'bg-caramel-600 hover:bg-caramel-700',
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div
      className={`rounded-3xl bg-gradient-to-r ${styles.gradient} border ${styles.border} p-4 sm:p-5 shadow-sm transition-all`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider border shadow-sm ${styles.badge}`}
              >
                🎯 {badgeText}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-espresso-950 dark:text-cafe-100 mt-1 leading-snug">
              {purpose}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white ${styles.btnBg} shadow-sm transition-all active:scale-95`}
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-espresso-600 dark:text-cafe-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={isOpen ? 'Collapse Page Guide' : 'Expand Page Guide'}
            aria-label="Toggle page purpose details"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Action Highlights */}
      <AnimatePresence>
        {isOpen && actions && actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3.5 mt-3 border-t border-black/5 dark:border-white/10">
              <p className="text-[11px] uppercase font-bold tracking-wider text-espresso-500 dark:text-cafe-400 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-caramel-500" />
                <span>What you can do on this page:</span>
              </p>

              <div
                className={`grid grid-cols-1 ${
                  actions.length === 2
                    ? 'sm:grid-cols-2'
                    : actions.length >= 4
                    ? 'sm:grid-cols-2 lg:grid-cols-4'
                    : 'sm:grid-cols-3'
                } gap-2.5`}
              >
                {actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/80 dark:bg-[#181310]/90 border border-cafe-200/80 dark:border-espresso-800 shadow-sm space-y-1 hover:border-caramel-400 dark:hover:border-caramel-700 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-lg ${styles.numberBg} text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                      >
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50 truncate">
                        {act.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-espresso-600 dark:text-espresso-300 leading-relaxed pl-7">
                      {act.desc}
                    </p>
                  </div>
                ))}
              </div>

              {primaryAction && (
                <div className="pt-3 flex md:hidden">
                  <button
                    onClick={primaryAction.onClick}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-white ${styles.btnBg} shadow-sm flex items-center justify-center gap-1.5`}
                  >
                    <span>{primaryAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
