import React from 'react';
import { ItemCategory } from '../types';
import { MENU_CATEGORIES } from '../data/categories';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: ItemCategory;
  onSelectCategory: (category: ItemCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: Record<ItemCategory, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollButtons = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Track overflow on scroll and resize
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      observer.disconnect();
    };
  }, [updateScrollButtons]);

  // Let a mouse wheel scroll the tabs sideways
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Center the selected tab in the strip (without scrolling the page)
  React.useEffect(() => {
    const el = scrollRef.current;
    const chip = el?.querySelector<HTMLElement>(`[data-category="${selectedCategory}"]`);
    if (!el || !chip) return;
    el.scrollTo({
      left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }, [selectedCategory]);

  const scrollTabs = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  const hasOverflow = canScrollLeft || canScrollRight;

  // Fade the edges of the strip only on the sides that have more tabs
  const fadeMask = `linear-gradient(to right, ${canScrollLeft ? 'transparent, #000 24px' : '#000'}, ${
    canScrollRight ? '#000 calc(100% - 24px), transparent' : '#000'
  })`;

  const arrowClass =
    'shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-default ' +
    'bg-neutral-900 border-neutral-800 text-neutral-200 enabled:hover:bg-amber-500 enabled:hover:text-neutral-950 enabled:hover:border-amber-400';

  const categories: { id: ItemCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Items', icon: '🍽️' },
    ...MENU_CATEGORIES.filter((cat) => (counts[cat.id] || 0) > 0 || cat.id === selectedCategory),
  ];

  return (
    <div className="space-y-3 pb-3">
      {/* Search & Quick Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tea, lime, shakes, burgers..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400 shrink-0 self-end sm:self-auto">
          <span>{counts[selectedCategory]} items</span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-400/90 font-mono">1-Click Fast Bill</span>
        </div>
      </div>

      {/* Category Segmented Scrollable Tabs */}
      <div className="flex items-center gap-1.5">
        {hasOverflow && (
          <button
            onClick={() => scrollTabs(-1)}
            disabled={!canScrollLeft}
            className={arrowClass}
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="relative flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none"
          style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
        >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = counts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              data-category={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap border shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 font-semibold shadow-sm shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700'
              }`}
            >
              <span className="text-base leading-none">{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-md ${
                  isActive
                    ? 'bg-neutral-950/20 text-neutral-900 font-bold'
                    : 'text-neutral-500 bg-neutral-800'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        </div>
        {hasOverflow && (
          <button
            onClick={() => scrollTabs(1)}
            disabled={!canScrollRight}
            className={arrowClass}
            aria-label="Scroll categories right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
