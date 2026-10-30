import React, { useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { MenuItem, RecipeLine } from '../types';
import { Plus, Trash2, X } from 'lucide-react';

interface RecipeEditorModalProps {
  item: MenuItem;
  onClose: () => void;
}

type DraftLine = { materialId: string; quantity: string };

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({ item, onClose }) => {
  const { rawMaterials, updateMenuItem } = useBilling();
  const [lines, setLines] = useState<DraftLine[]>(
    (item.recipe ?? []).map((line) => ({ materialId: line.materialId, quantity: String(line.quantity) }))
  );

  const usedIds = new Set(lines.map((l) => l.materialId));
  const unitOf = (id: string) => rawMaterials.find((m) => m.id === id)?.unit ?? '';

  const updateLine = (index: number, changes: Partial<DraftLine>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...changes } : line)));

  const addLine = () => {
    const next = rawMaterials.find((m) => !usedIds.has(m.id));
    if (next) setLines((prev) => [...prev, { materialId: next.id, quantity: '' }]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe: RecipeLine[] = lines
      .map((l) => ({ materialId: l.materialId, quantity: parseFloat(l.quantity) }))
      .filter((l) => l.quantity > 0);
    updateMenuItem({ ...item, recipe });
    onClose();
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
        <div className="flex items-start justify-between gap-3 p-4 border-b border-neutral-800">
          <div>
            <h2 className="text-sm font-bold text-white">Recipe: {item.name}</h2>
            <p className="text-xs text-neutral-400">
              Raw materials used for one serving. Stock is reduced by these amounts on every sale.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {lines.length === 0 && (
            <p className="py-6 text-center text-xs text-neutral-500">
              No raw materials yet. Stock won't change when this item is sold.
            </p>
          )}
          {lines.map((line, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={line.materialId}
                onChange={(e) => updateLine(index, { materialId: e.target.value })}
                aria-label="Raw material"
                className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {rawMaterials
                  .filter((m) => m.id === line.materialId || !usedIds.has(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: e.target.value })}
                placeholder="Qty"
                aria-label="Quantity per serving"
                className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="w-10 text-xs text-neutral-500">{unitOf(line.materialId)}</span>
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/50"
                aria-label="Remove raw material"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            disabled={usedIds.size >= rawMaterials.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-400 hover:bg-neutral-800 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add raw material</span>
          </button>
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
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs"
          >
            Save Recipe
          </button>
        </div>
      </form>
    </div>
  );
};
