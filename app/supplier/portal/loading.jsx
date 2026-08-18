import React from 'react';

export default function SupplierPortalLoading() {
  return (
    <div className="min-h-screen bg-[#0A0706] text-cafe-50 p-4 sm:p-8 animate-pulse space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="p-6 rounded-3xl bg-[#140F0D] border border-emerald-900/40 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-emerald-950/80 rounded-xl" />
            <div className="h-4 w-80 bg-espresso-800 rounded-lg" />
          </div>
          <div className="h-10 w-36 bg-emerald-900/50 rounded-2xl" />
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-[#140F0D] border border-espresso-800 space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-950/60" />
              <div className="h-4 w-24 bg-espresso-800 rounded" />
              <div className="h-7 w-32 bg-emerald-900/40 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Demands Table Skeleton */}
        <div className="p-6 rounded-3xl bg-[#140F0D] border border-espresso-800 space-y-3">
          <div className="h-5 w-48 bg-espresso-800 rounded-lg" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 w-full bg-espresso-900/60 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
