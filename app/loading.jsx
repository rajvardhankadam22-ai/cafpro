import React from 'react';
import { Coffee, Sparkles } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#0C0908] text-cafe-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm mx-auto">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-caramel-700 text-white flex items-center justify-center shadow-[0_0_30px_rgba(217,119,54,0.4)] animate-pulse">
            <Coffee className="w-8 h-8 animate-bounce" />
          </div>
          <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-spin" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-cafe-50 tracking-tight">
            CaféPulse
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-xs text-caramel-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-caramel-500 animate-ping" />
            <span>Loading Platform...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
