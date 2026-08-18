'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // When pathname/search changes, briefly trigger smooth top loading bar
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept click on internal links to give instant feedback
  useEffect(() => {
    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        target.target !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        setIsNavigating(true);
      }
    };

    document.addEventListener('click', handleLinkClick, { passive: true });
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1 bg-transparent overflow-hidden">
      <div className="h-full bg-gradient-to-r from-amber-500 via-caramel-500 to-amber-400 shadow-[0_0_12px_rgba(217,119,54,0.8)] animate-pulse w-full transform origin-left transition-transform duration-300 ease-out" />
    </div>
  );
}
