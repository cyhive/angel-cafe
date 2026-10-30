import React, { useMemo, useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { MaterialUnit, RawMaterial } from '../types';
import { MATERIAL_UNITS, UNIT_LABELS, formatQuantity } from '../data/rawMaterials';
import { EditMaterialModal } from './EditMaterialModal';
import { AlertTriangle, Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

const inputClass =
  'bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono';

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

type StockAction = { id: string; mode: 'add' | 'set'; value: string };

export const RawMaterialsPanel: React.FC = () => {
  const {
    rawMaterials,
    menuItems,
    addRawMaterial,
    updateRawMaterial,
    adjustRawMaterialStock,
    deleteRawMaterial,
  } = useBilling();

  const [searchQuery, setSearchQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [stockAction, setStockAction] = useState<StockAction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<RawMaterial | null>(null);

  // New material form
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState<MaterialUnit>('kg');
  const [newStock, setNewStock] = useState('');
  const [newLowLevel, setNewLowLevel] = useState('');

  const usedIn = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of menuItems) {
      for (const line of item.recipe ?? []) {
        map.set(line.materialId, [...(map.get(line.materialId) ?? []), item.name]);
      }
    }
    return map;
  }, [menuItems]);

  const isLow = (m: RawMaterial) => m.stock <= m.lowStockLevel;
  const lowCount = rawMaterials.filter(isLow).length;

  const visible = rawMaterials.filter(
    (m) =>
      (!lowOnly || isLow(m)) && m.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const runFor = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
    } catch (err) {
      alert(`Could not save: ${errorText(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleStockSave = (material: RawMaterial) => {
    if (!stockAction) return;
    const value = parseFloat(stockAction.value);
    if (!Number.isFinite(value)) return;
    runFor(material.id, async () => {
      if (stockAction.mode === 'add') {
        if (value !== 0) await adjustRawMaterialStock(material.id, value);
      } else {
        await updateRawMaterial(material.id, { stock: value });
      }
      setStockAction(null);
    });
  };

  const handleLowLevelChange = (material: RawMaterial, raw: string) => {
    const value = parseFloat(raw);
    if (!Number.isFinite(value) || value === material.lowStockLevel) return;
    runFor(material.id, () => updateRawMaterial(material.id, { lowStockLevel: value }));
  };

  const handleDelete = (material: RawMaterial) => {
    const count = usedIn.get(material.id)?.length ?? 0;
    const message = count
      ? `Delete "${material.name}"? It will also be removed from ${count} recipe(s).`
      : `Delete "${material.name}"?`;
    if (confirm(message)) runFor(material.id, () => deleteRawMaterial(material.id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await runFor('new', async () => {
      await addRawMaterial({
        name: newName.trim(),
        unit: newUnit,
        stock: parseFloat(newStock) || 0,
        lowStockLevel: parseFloat(newLowLevel) || 0,
      });
      setIsAdding(false);
      setNewName('');
      setNewStock('');
      setNewLowLevel('');
    });
  };

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      {lowCount > 0 && (
        <div className="flex items-start sm:items-center gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="flex-1">
            {lowCount} raw material{lowCount === 1 ? ' is' : 's are'} at or below the low stock level.
          </span>
          <button
            onClick={() => setLowOnly(!lowOnly)}
            className="shrink-0 font-semibold text-amber-400 hover:text-amber-300"
          >
            {lowOnly ? 'Show all' : 'Show low stock'}
          </button>
        </div>
      )}

      {/* Actions & search */}
      <div className="flex flex-col md:flex-row md:items-center gap-2.5">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-xs shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isAdding ? 'Close Form' : 'Add Raw Material'}</span>
        </button>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw materials..."
            aria-label="Search raw materials"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="p-4 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-3 items-end"
        >
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-semibold text-neutral-300">Name</span>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mango"
              className={`w-full ${inputClass} font-sans py-2`}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-neutral-300">Unit</span>
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value as MaterialUnit)}
              className={`w-full ${inputClass} py-2 cursor-pointer`}
            >
              {MATERIAL_UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-neutral-300">Current stock</span>
            <input
              type="number"
              step="any"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="0"
              className={`w-full ${inputClass} py-2`}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-neutral-300">Warn below</span>
            <input
              type="number"
              step="any"
              value={newLowLevel}
              onChange={(e) => setNewLowLevel(e.target.value)}
              placeholder="0"
              className={`w-full ${inputClass} py-2`}
            />
          </label>
          <div className="col-span-2 sm:col-span-5 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busyId === 'new'}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs"
            >
              {busyId === 'new' ? 'Saving…' : 'Save Raw Material'}
            </button>
          </div>
        </form>
      )}

      <p className="text-xs text-neutral-500">
        Stock goes down automatically when a bill is settled, using each item's recipe. Use{' '}
        <span className="text-neutral-300">+ Add</span> when a delivery arrives and{' '}
        <span className="text-neutral-300">Set</span> to correct the count.
      </p>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 sm:px-4">Raw Material</th>
                <th className="hidden sm:table-cell py-3 px-4">In Stock</th>
                <th className="hidden sm:table-cell py-3 px-4">Warn Below</th>
                <th className="hidden lg:table-cell py-3 px-4">Used In</th>
                <th className="py-3 px-3 sm:px-4 text-right">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    No raw materials found.
                  </td>
                </tr>
              )}
              {visible.map((material) => {
                const low = isLow(material);
                const items = usedIn.get(material.id) ?? [];
                const stockEdit = stockAction?.id === material.id ? stockAction : null;
                const stockBadge = (
                  <>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        material.stock <= 0
                          ? 'text-rose-400'
                          : low
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}
                    >
                      {formatQuantity(material.stock, material.unit)}
                    </span>
                    {low && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          material.stock <= 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {material.stock <= 0 ? 'Out' : 'Low'}
                      </span>
                    )}
                  </>
                );
                return (
                  <tr key={material.id} className="text-neutral-300 hover:bg-neutral-850/50">
                    <td className="py-3 px-3 sm:px-4 min-w-[120px]">
                      <button
                        onClick={() => setEditing(material)}
                        className="font-semibold text-white hover:text-amber-400 text-left"
                      >
                        {material.name}
                      </button>
                      <div className="sm:hidden mt-1 text-[11px] whitespace-nowrap">{stockBadge}</div>
                      <div className="lg:hidden text-[10px] text-neutral-500">
                        Used in {items.length} item{items.length === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 whitespace-nowrap">{stockBadge}</td>
                    <td className="hidden sm:table-cell py-3 px-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="any"
                        defaultValue={material.lowStockLevel}
                        key={material.lowStockLevel}
                        onBlur={(e) => handleLowLevelChange(material, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        aria-label={`Warn below level for ${material.name}`}
                        className={`w-20 ${inputClass}`}
                      />
                      <span className="ml-1.5 text-neutral-500">{material.unit}</span>
                    </td>
                    <td
                      className="hidden lg:table-cell py-3 px-4 text-neutral-400 max-w-xs truncate"
                      title={items.join(', ')}
                    >
                      {items.length ? items.join(', ') : <span className="text-neutral-600">—</span>}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      {stockEdit ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleStockSave(material);
                          }}
                          className="inline-flex items-center gap-1"
                        >
                          <span className="text-neutral-500">{stockEdit.mode === 'add' ? '+' : '='}</span>
                          <input
                            type="number"
                            step="any"
                            autoFocus
                            value={stockEdit.value}
                            onChange={(e) => setStockAction({ ...stockEdit, value: e.target.value })}
                            aria-label={stockEdit.mode === 'add' ? 'Amount to add' : 'New stock'}
                            className={`w-20 ${inputClass} border-amber-500`}
                          />
                          <span className="hidden sm:inline text-neutral-500 w-8 text-left">
                            {material.unit}
                          </span>
                          <button
                            type="submit"
                            disabled={busyId === material.id}
                            className="p-1.5 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
                            aria-label="Save stock"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStockAction(null)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-white"
                            aria-label="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setStockAction({ id: material.id, mode: 'add', value: '' })}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            + Add
                          </button>
                          <button
                            onClick={() =>
                              setStockAction({
                                id: material.id,
                                mode: 'set',
                                value: String(Number(material.stock.toFixed(3))),
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold"
                          >
                            Set
                          </button>
                          <button
                            onClick={() => setEditing(material)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                            aria-label={`Edit ${material.name}`}
                            title="Edit name, unit and stock"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(material)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                            aria-label={`Delete ${material.name}`}
                            title="Delete raw material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <EditMaterialModal material={editing} onClose={() => setEditing(null)} />}
    </div>
  );
};
