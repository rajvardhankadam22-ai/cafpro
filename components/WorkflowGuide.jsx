'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowGuide({
  title,
  subtitle,
  steps = [],
  primaryAction = null,
  storageKey = '',
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-3xl bg-gradient-to-r from-caramel-500/10 via-amber-500/5 to-transparent dark:from-caramel-950/40 dark:via-espresso-900/40 dark:to-transparent border border-caramel-300/80 dark:border-caramel-800/60 p-4 sm:p-5 shadow-sm transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-caramel-500/20 text-caramel-700 dark:text-caramel-400 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold text-espresso-950 dark:text-cafe-50 truncate flex items-center gap-2">
              <span>{title || 'How this page works'}</span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-caramel-100 dark:bg-caramel-950/80 text-caramel-800 dark:text-caramel-300 font-bold border border-caramel-200 dark:border-caramel-800/60">
                Quick Guide
              </span>
            </h4>
            <p className="text-[11px] sm:text-xs text-espresso-600 dark:text-cafe-300 truncate mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-caramel-600 hover:bg-caramel-700 shadow-sm transition-all"
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl text-espresso-500 dark:text-cafe-400 hover:bg-caramel-500/10 transition-colors"
            title={isOpen ? 'Collapse Guide' : 'Expand Guide'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Steps Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 mt-3 border-t border-caramel-200/60 dark:border-espresso-800/60">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/70 dark:bg-espresso-950/70 border border-cafe-200/70 dark:border-espresso-800/80 space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-caramel-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-bold text-espresso-950 dark:text-cafe-50">
                      {step.heading}
                    </p>
                  </div>
                  <p className="text-[11px] text-espresso-600 dark:text-espresso-300 leading-relaxed pl-7">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {primaryAction && (
              <div className="pt-3 flex md:hidden justify-end">
                <button
                  onClick={primaryAction.onClick}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white bg-caramel-600 hover:bg-caramel-700 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{primaryAction.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
