import React, { useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { MaterialUnit, RawMaterial } from '../types';
import {
  MATERIAL_UNITS,
  UNIT_LABELS,
  roundAmount,
  unitConversionFactor,
} from '../data/rawMaterials';
import { X } from 'lucide-react';

interface EditMaterialModalProps {
  material: RawMaterial;
  onClose: () => void;
}

const fieldClass =
  'w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500';

export const EditMaterialModal: React.FC<EditMaterialModalProps> = ({ material, onClose }) => {
  const { updateRawMaterial, menuItems } = useBilling();
  const [name, setName] = useState(material.name);
  const [unit, setUnit] = useState<MaterialUnit>(material.unit);
  const [stock, setStock] = useState(String(material.stock));
  const [lowLevel, setLowLevel] = useState(String(material.lowStockLevel));
  const [isSaving, setIsSaving] = useState(false);

  const recipeCount = menuItems.filter((item) =>
    item.recipe?.some((line) => line.materialId === material.id)
  ).length;

  // Switching kg <-> g or L <-> ml converts the amounts shown in the form
  const handleUnitChange = (next: MaterialUnit) => {
    const factor = unitConversionFactor(unit, next);
    if (factor !== null && factor !== 1) {
      const convert = (value: string) => {
        const n = parseFloat(value);
        return Number.isFinite(n) ? String(roundAmount(n * factor)) : value;
      };
      setStock(convert(stock));
      setLowLevel(convert(lowLevel));
    }
    setUnit(next);
  };

  const unitChanged = unit !== material.unit;
  const converts = unitChanged && unitConversionFactor(material.unit, unit) !== null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockValue = parseFloat(stock);
    const lowValue = parseFloat(lowLevel);
    if (!name.trim() || !Number.isFinite(stockValue) || !Number.isFinite(lowValue)) return;

    setIsSaving(true);
    try {
      // Unit goes first so the server converts recipes, then the typed amounts are applied
      if (unitChanged) await updateRawMaterial(material.id, { unit });
      await updateRawMaterial(material.id, {
        name: name.trim(),
        stock: stockValue,
        lowStockLevel: lowValue,
      });
      onClose();
    } catch (err) {
      alert(`Could not save: ${err instanceof Error ? err.message : err}`);
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
        className="relative w-full max-w-md my-auto bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-sm font-bold text-white">Edit Raw Material</h2>
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
            <span className="text-xs font-semibold text-neutral-300">Name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-300">Counted in</span>
            <div className="grid grid-cols-3 gap-1.5">
              {MATERIAL_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitChange(u)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    unit === u
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {UNIT_LABELS[u]}
                </button>
              ))}
            </div>
            {unitChanged && recipeCount > 0 && (
              <p
                className={`text-[11px] leading-relaxed ${converts ? 'text-emerald-400' : 'text-amber-300'}`}
              >
                {converts
                  ? `Stock and the ${recipeCount} recipe(s) using it will be converted from ${material.unit} to ${unit} automatically.`
                  : `${material.unit} can't be converted to ${unit}. Check the amount in the ${recipeCount} recipe(s) that use it after saving.`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-neutral-300">In stock ({unit})</span>
              <input
                type="number"
                step="any"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={`${fieldClass} font-mono`}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-neutral-300">Warn below ({unit})</span>
              <input
                type="number"
                step="any"
                required
                value={lowLevel}
                onChange={(e) => setLowLevel(e.target.value)}
                className={`${fieldClass} font-mono`}
              />
            </label>
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
            disabled={isSaving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
