'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Coffee } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global application error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0706] text-cafe-50 flex items-center justify-center p-6 selection:bg-caramel-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-950/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-caramel-950/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full p-8 sm:p-10 rounded-3xl bg-[#140F0C]/90 border border-red-900/40 backdrop-blur-xl shadow-2xl text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/50 text-red-400 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-800/60">
            System Notice
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-cafe-50 tracking-tight">
            Unexpected Brew Hiccup
          </h1>
          <p className="text-xs sm:text-sm text-espresso-300 leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while processing this request. Your data remains safe in Cloud Firestore.
          </p>
        </div>

        {/* Error Details (Sanitized) */}
        {error && (
          <div className="p-3.5 rounded-xl bg-black/40 border border-red-950 text-left">
            <p className="text-[11px] font-mono text-red-300/80 line-clamp-2 break-all">
              {typeof error === 'string'
                ? error
                : error?.message
                ? error.message
                : typeof error === 'object' && error?.type
                ? `Event Triggered: ${error.type}`
                : 'An unexpected runtime exception was handled.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-caramel-600 to-caramel-700 hover:from-caramel-500 hover:to-caramel-600 shadow-caramel-glow transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-cafe-200 bg-espresso-900/80 hover:bg-espresso-800 border border-espresso-700/60 hover:text-white transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Store Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
