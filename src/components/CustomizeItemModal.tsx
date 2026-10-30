import React, { useState, useEffect } from 'react';
import { MenuItem, CustomOptionChoice } from '../types';
import { useBilling } from '../context/BillingContext';
import { formatCurrency } from '../utils/format';
import { X, Plus, Check } from 'lucide-react';

interface CustomizeItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const CustomizeItemModal: React.FC<CustomizeItemModalProps> = ({ item, onClose }) => {
  const { addToCart, settings } = useBilling();
  const [selectedChoice, setSelectedChoice] = useState<CustomOptionChoice | undefined>(undefined);
  const [cookingNote, setCookingNote] = useState<string>('');

  useEffect(() => {
    if (item && item.customizationGroup && item.customizationGroup.choices.length > 0) {
      setSelectedChoice(item.customizationGroup.choices[0]);
    } else {
      setSelectedChoice(undefined);
    }
    setCookingNote('');
  }, [item]);

  if (!item) return null;

  const extraCost = selectedChoice ? selectedChoice.extraPrice : 0;
  const currentTotal = item.price + extraCost;

  const handleConfirm = () => {
    addToCart(item, selectedChoice, cookingNote.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div>
            <span className="text-xs uppercase font-medium text-amber-500 tracking-wider">
              Customize Item
            </span>
            <h2 className="text-base font-bold text-white line-clamp-1">{item.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Item Info Preview */}
          <div className="flex items-start gap-3 p-3 bg-neutral-850 rounded-xl border border-neutral-800">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400 line-clamp-2">{item.description}</p>
              <p className="text-sm font-bold text-white font-mono mt-1">
                Base: {formatCurrency(item.price, settings.currencySymbol)}
              </p>
            </div>
          </div>

          {/* Customization Options */}
          {item.customizationGroup && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">
                {item.customizationGroup.title}
              </label>
              <div className="space-y-1.5">
                {item.customizationGroup.choices.map((choice) => {
                  const isSelected = selectedChoice?.name === choice.name;
                  return (
                    <button
                      key={choice.name}
                      onClick={() => setSelectedChoice(choice)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white font-medium'
                          : 'border-neutral-800 bg-neutral-850 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500 text-neutral-950'
                              : 'border-neutral-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{choice.name}</span>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-neutral-400">
                        {choice.extraPrice > 0
                          ? `+${formatCurrency(choice.extraPrice, settings.currencySymbol)}`
                          : 'Included'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen / Preparation Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Special Instructions / Kitchen Note
            </label>
            <input
              type="text"
              value={cookingNote}
              onChange={(e) => setCookingNote(e.target.value)}
              placeholder="e.g. Extra spicy, No onions, Less ice, Hot bun"
              className="w-full bg-neutral-850 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/80 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-neutral-400">Item Total</div>
            <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
              {formatCurrency(currentTotal, settings.currencySymbol)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add to Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
