import React, { useState } from 'react';
import { MenuItem } from '../types';
import { useBilling } from '../context/BillingContext';
import { formatCurrency } from '../utils/format';
import { getCategory } from '../data/categories';
import {
  comboRegularPrice,
  describeCombo,
  effectiveRecipe,
  servingsAvailable,
} from '../data/rawMaterials';
import { Plus, SlidersHorizontal, Flame, Sparkles, Utensils } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { addToCart, setCustomizingItem, settings, rawMaterials, menuItems } = useBilling();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    if (!item.isAvailable) return;
    if (item.customizationGroup) {
      setCustomizingItem(item);
    } else {
      addToCart(item);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    if (item.customizationGroup) {
      setCustomizingItem(item);
    } else {
      addToCart(item);
    }
  };

  const category = getCategory(item.category);
  // Servings left from raw-material stock (null when not tracked)
  const servings = servingsAvailable(effectiveRecipe(item, menuItems), rawMaterials);
  const isCombo = !!item.comboItems?.length;
  const comboSaving = isCombo ? comboRegularPrice(item, menuItems) - item.price : 0;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-neutral-900 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
        item.isAvailable
          ? 'border-neutral-800 hover:border-neutral-700 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-0.5 active:scale-[0.99]'
          : 'border-neutral-800/60 opacity-60 cursor-not-allowed bg-neutral-900/50'
      }`}
    >
      <div>
        {/* Image Container with Fallback */}
        <div className="relative w-full aspect-[4/3] bg-neutral-800/80 overflow-hidden">
          {item.image && !imageError ? (
            <img
              src={item.image}
              alt={item.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-500">
              <Utensils className="w-8 h-8 mb-1 opacity-40 text-amber-500" />
              <span className="text-[11px] font-medium tracking-wide uppercase">{item.category}</span>
            </div>
          )}

          {/* Indicators overlay */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {item.isVeg && (
              <span
                title="Vegetarian"
                className="w-4 h-4 rounded-sm border border-emerald-500 bg-neutral-900/90 flex items-center justify-center shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </span>
            )}
            {item.isSpicy && (
              <span
                title="Spicy"
                className="px-1.5 py-0.5 rounded-md bg-neutral-900/90 text-rose-400 text-[10px] font-semibold flex items-center gap-0.5 border border-rose-500/40 shadow-sm"
              >
                <Flame className="w-3 h-3 fill-rose-500" />
                <span>Spicy</span>
              </span>
            )}
            {item.isPopular && (
              <span className="px-1.5 py-0.5 rounded-md bg-neutral-900/90 text-amber-400 text-[10px] font-semibold flex items-center gap-0.5 border border-amber-500/40 shadow-sm">
                <Sparkles className="w-3 h-3 fill-amber-400" />
                <span>Popular</span>
              </span>
            )}
          </div>

          {/* Low stock warning (doesn't block the sale) */}
          {item.isAvailable && servings !== null && servings <= 5 && (
            <span
              className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm border ${
                servings === 0
                  ? 'bg-rose-950/90 text-rose-300 border-rose-700'
                  : 'bg-neutral-900/90 text-amber-300 border-amber-600/60'
              }`}
              title="Based on raw material stock"
            >
              {servings === 0 ? 'No stock' : `Only ${servings} left`}
            </span>
          )}

          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-2.5 sm:p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <span className={`font-medium truncate ${category?.color ?? 'text-neutral-400'}`}>
              {category?.label ?? item.category}
            </span>
            {item.customizationGroup && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-neutral-500 shrink-0">Customizable</span>
              </>
            )}
          </div>

          <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-amber-400 transition-colors line-clamp-1">
            {item.name}
          </h3>

          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {isCombo ? describeCombo(item, menuItems).join(' + ') : item.description}
          </p>
        </div>
      </div>

      {/* Bottom Footer: Price & Add Button */}
      <div className="px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5 mt-2 flex items-center justify-between gap-2 border-t border-neutral-800/60">
        <div className="min-w-0">
          <span className="text-sm sm:text-base font-bold text-white font-mono tabular-nums">
            {formatCurrency(item.price, settings.currencySymbol)}
          </span>
          {comboSaving > 0 && (
            <div className="text-[10px] font-semibold text-emerald-400 truncate">
              Save {formatCurrency(comboSaving, settings.currencySymbol)}
            </div>
          )}
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={!item.isAvailable}
          className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            item.isAvailable
              ? item.customizationGroup
                ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm shadow-amber-500/20 active:scale-95'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {item.customizationGroup ? (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden min-[400px]:inline">Options</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
