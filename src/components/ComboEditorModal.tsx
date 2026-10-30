import React, { useMemo, useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { MenuItem } from '../types';
import { getCategory } from '../data/categories';
import { formatCurrency } from '../utils/format';
import { Minus, Plus, Search, Trash2, X } from 'lucide-react';

interface ComboEditorModalProps {
  // Combo to edit, or null to create a new one
  combo: MenuItem | null;
  onClose: () => void;
}

type DraftLine = { menuItemId: string; quantity: number };

const fieldClass =
  'w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500';

export const ComboEditorModal: React.FC<ComboEditorModalProps> = ({ combo, onClose }) => {
  const { menuItems, addMenuItem, updateMenuItem, settings } = useBilling();
  const [name, setName] = useState(combo?.name ?? '');
  const [price, setPrice] = useState(combo ? String(combo.price) : '');
  const [lines, setLines] = useState<DraftLine[]>(combo?.comboItems ?? []);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Combos are built from regular items only
  const regularItems = useMemo(
    () => menuItems.filter((item) => !item.comboItems?.length),
    [menuItems]
  );
  const findItem = (id: string) => menuItems.find((m) => m.id === id);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return regularItems.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 8);
  }, [regularItems, search]);

  const regularTotal = lines.reduce(
    (sum, line) => sum + (findItem(line.menuItemId)?.price ?? 0) * line.quantity,
    0
  );
  const priceValue = parseFloat(price);
  const saving = Number.isFinite(priceValue) ? regularTotal - priceValue : 0;

  const addItem = (item: MenuItem) => {
    setLines((prev) =>
      prev.some((l) => l.menuItemId === item.id)
        ? prev.map((l) => (l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...prev, { menuItemId: item.id, quantity: 1 }]
    );
    setSearch('');
  };

  const changeQuantity = (id: string, delta: number) =>
    setLines((prev) =>
      prev
        .map((l) => (l.menuItemId === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || lines.length === 0 || !(priceValue > 0)) return;
    const firstItem = findItem(lines[0].menuItemId);
    const fields = {
      name: name.trim(),
      price: priceValue,
      comboItems: lines,
      description: lines
        .map((l) => `${l.quantity > 1 ? `${l.quantity} x ` : ''}${findItem(l.menuItemId)?.name ?? ''}`)
        .join(' + '),
    };

    setIsSaving(true);
    try {
      if (combo) {
        updateMenuItem({ ...combo, ...fields });
      } else {
        await addMenuItem({
          ...fields,
          category: 'combos',
          image: firstItem?.image,
          isVeg: lines.every((l) => findItem(l.menuItemId)?.isVeg),
          isPopular: true,
          isAvailable: true,
        });
      }
      onClose();
    } catch (err) {
      alert(`Could not save the combo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg my-auto bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-sm font-bold text-white">{combo ? 'Edit Combo Offer' : 'New Combo Offer'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-neutral-300">Combo name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zinger Burger + Lime Combo"
              className={fieldClass}
            />
          </label>

          {/* Items in the combo */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-300">Items in this combo</span>
            {lines.length === 0 && (
              <p className="text-xs text-neutral-500">Search below to add items.</p>
            )}
            {lines.map((line) => {
              const item = findItem(line.menuItemId);
              return (
                <div
                  key={line.menuItemId}
                  className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {item?.name ?? 'Removed item'}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {formatCurrency(item?.price ?? 0, settings.currencySymbol)} each
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.menuItemId, -1)}
                      className="p-1.5 text-neutral-400 hover:text-white"
                      aria-label="Fewer"
                    >
                      {line.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="w-5 text-center text-xs font-bold font-mono text-white">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.menuItemId, 1)}
                      className="p-1.5 text-neutral-400 hover:text-white"
                      aria-label="More"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item to add, e.g. zinger, lime, tea..."
                aria-label="Search item to add"
                className={`${fieldClass} pl-9`}
              />
              {matches.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl">
                  {matches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-neutral-800"
                    >
                      <span className="min-w-0">
                        <span className="block text-white font-medium truncate">{item.name}</span>
                        <span className="block text-[10px] text-neutral-500">
                          {getCategory(item.category)?.label}
                        </span>
                      </span>
                      <span className="font-mono text-neutral-300 shrink-0">
                        {formatCurrency(item.price, settings.currencySymbol)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-neutral-300">
                Combo price ({settings.currencySymbol})
              </span>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={regularTotal ? String(regularTotal) : 'e.g. 120'}
                className={`${fieldClass} font-mono`}
              />
            </label>
            <div className="text-xs space-y-0.5 pb-1">
              <div className="text-neutral-400">
                Regular price:{' '}
                <span className="font-mono text-neutral-200">
                  {formatCurrency(regularTotal, settings.currencySymbol)}
                </span>
              </div>
              {saving > 0 && (
                <div className="font-semibold text-emerald-400">
                  Customer saves {formatCurrency(saving, settings.currencySymbol)}
                </div>
              )}
              {saving < 0 && (
                <div className="font-semibold text-amber-400">
                  Costs {formatCurrency(-saving, settings.currencySymbol)} more than buying separately
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || lines.length === 0}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs"
          >
            {isSaving ? 'Saving…' : combo ? 'Save Combo' : 'Create Combo'}
          </button>
        </div>
      </form>
    </div>
  );
};
