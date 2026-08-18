import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-white/60 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800/60 flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2 max-w-md">
          <div className="h-6 w-48 bg-cafe-200 dark:bg-espresso-800 rounded-xl" />
          <div className="h-4 w-72 bg-cafe-100 dark:bg-espresso-800/60 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-cafe-200 dark:bg-espresso-800 rounded-2xl" />
          <div className="h-10 w-32 bg-caramel-200/50 dark:bg-caramel-900/30 rounded-2xl" />
        </div>
      </div>

      {/* 4 Metric KPI Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white/70 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800/60 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-cafe-200 dark:bg-espresso-800" />
              <div className="w-14 h-5 rounded-full bg-cafe-100 dark:bg-espresso-800/60" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-20 bg-cafe-200 dark:bg-espresso-800 rounded" />
              <div className="h-7 w-28 bg-cafe-300 dark:bg-espresso-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Table / Grid Skeleton */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-espresso-900/40 border border-cafe-200/60 dark:border-espresso-800/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-cafe-200 dark:bg-espresso-800 rounded-lg" />
          <div className="h-8 w-48 bg-cafe-100 dark:bg-espresso-800/60 rounded-xl" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-12 w-full bg-cafe-100/80 dark:bg-espresso-800/40 rounded-2xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
