'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupplierRegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/supplier/portal');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0706] text-cafe-50 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-espresso-400 font-bold">
          Redirecting to Wholesale Supplier Portal & Demand Exchange...
        </p>
      </div>
    </div>
  );
}
