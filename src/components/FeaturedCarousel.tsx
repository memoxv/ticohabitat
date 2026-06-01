'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropertyCard, { type PropertyCardProps } from './PropertyCard';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface FeaturedCarouselProps {
  /** Initial batch of featured properties (SSR hydration) */
  initialItems: PropertyCardProps[];
  /** Total count of all featured properties available */
  totalCount: number;
  /** Type filter for the API: 'buy' | 'rent' | undefined (all) */
  typeFilter?: 'buy' | 'rent';
  /** Title for the section */
  title: string;
  /** Subtitle badge text */
  badge?: string;
  /** Number of cards visible at once */
  visibleCount?: number;
  /** Auto-rotation interval in ms (default 8000) */
  intervalMs?: number;
}

const CARDS_PER_PAGE = 3;

export default function FeaturedCarousel({
  initialItems,
  totalCount,
  typeFilter,
  title,
  badge = 'Destacados Premium',
  intervalMs = 8000,
}: FeaturedCarouselProps) {
  const [allItems, setAllItems] = useState<PropertyCardProps[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dynamic responsive card counting
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1); // Mobile
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2); // Tablet
      } else {
        setVisibleCount(3); // Desktop
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safe out-of-bounds page correction
  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.ceil(allItems.length / visibleCount) - 1;
      return Math.min(prev, Math.max(0, maxPage));
    });
  }, [visibleCount, allItems.length]);

  // Fetch all featured properties on mount (client-side) if there are more than initial batch
  useEffect(() => {
    if (totalCount > initialItems.length) {
      const fetchAll = async () => {
        try {
          const url = typeFilter
              ? `/api/featured?type=${typeFilter}`
              : '/api/featured';
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
              setAllItems(data.items);
            }
          }
        } catch (err) {
          console.error('Failed to load all featured properties:', err);
          // Keep using initialItems as fallback
        }
      };
      fetchAll();
    }
  }, [totalCount, initialItems.length, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / visibleCount));

  // Get current visible items
  const currentItems = allItems.slice(
    currentPage * visibleCount,
    currentPage * visibleCount + visibleCount
  );

  // Auto-advance with smooth transition
  const advancePage = useCallback((direction: 1 | -1 = 1) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage((prev) => {
        const next = prev + direction;
        if (next >= totalPages) return 0;
        if (next < 0) return totalPages - 1;
        return next;
      });
      // Small delay for fade-in effect
      setTimeout(() => setIsTransitioning(false), 80);
    }, 300);
  }, [totalPages]);

  // Auto-rotation timer
  useEffect(() => {
    if (totalPages <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      advancePage(1);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalPages, isPaused, advancePage, intervalMs]);

  // Don't render if no items
  if (allItems.length === 0) return null;

  const showNavigation = totalPages > 1;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with navigation */}
      <div className="flex items-baseline justify-between gap-4 border-b border-stone-200/30 dark:border-stone-850/50 pb-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-500/5 px-2.5 py-1 rounded-md mb-2">
            <Sparkles className="h-3.5 w-3.5 fill-amber-600 dark:fill-amber-450 text-amber-600 dark:text-amber-450 shrink-0" />
            <span>{badge}</span>
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>

        {/* Navigation Controls */}
        {showNavigation && (
          <div className="flex items-center gap-3 shrink-0">
            {/* Page indicator dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentPage(i);
                      setTimeout(() => setIsTransitioning(false), 80);
                    }, 300);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentPage
                      ? 'w-6 bg-amber-500'
                      : 'w-1.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400'
                  }`}
                  aria-label={`Página ${i + 1} de ${totalPages}`}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => advancePage(-1)}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => advancePage(1)}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Counter */}
            <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 tabular-nums tracking-wide hidden sm:block">
              {currentPage + 1}/{totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Cards Grid with crossfade animation */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ease-in-out ${
          isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
        style={{ transition: 'opacity 300ms ease, transform 300ms ease' }}
      >
        {currentItems.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Mobile swipe hint + page info */}
      {showNavigation && (
        <div className="flex items-center justify-center gap-3 mt-6 sm:hidden">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentPage(i);
                    setTimeout(() => setIsTransitioning(false), 80);
                  }, 300);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentPage
                    ? 'w-5 bg-amber-500'
                    : 'w-1.5 bg-stone-300 dark:bg-stone-700'
                }`}
                aria-label={`Página ${i + 1}`}
              />
            ))}
          </div>
          <span className="text-[9px] font-bold text-stone-400 tabular-nums">
            {currentPage + 1} de {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
