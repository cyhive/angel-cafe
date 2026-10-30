import React, { useMemo, useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { MenuItem } from '../types';
import { MENU_CATEGORIES, MenuCategoryId, getCategory } from '../data/categories';
import { formatCurrency } from '../utils/format';
import {
  describeCombo,
  effectiveRecipe,
  formatQuantity,
  servingsAvailable,
} from '../data/rawMaterials';
import { ComboEditorModal } from './ComboEditorModal';
import { RawMaterialsPanel } from './RawMaterialsPanel';
import { RecipeEditorModal } from './RecipeEditorModal';
import { MenuPhotoPicker } from './MenuPhotoPicker';
import {
  Utensils,
  Plus,
  Edit2,
  Check,
  X,
  Sliders,
  DollarSign,
  Store,
  Save,
  Trash2,
  Search,
  FlaskConical,
  Gift,
} from 'lucide-react';

/** Shows how many servings the current raw-material stock can make. */
const CanMakeLabel: React.FC<{ servings: number | null }> = ({ servings }) => {
  if (servings === null) return null;
  const color =
    servings === 0 ? 'text-rose-400' : servings <= 5 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className={`mt-0.5 text-[10px] font-semibold ${color}`}>
      {servings === 0 ? 'Out of stock' : `Can make ${servings}`}
    </div>
  );
};

export const MenuManagerModal: React.FC = () => {
  const {
    menuItems,
    toggleItemAvailability,
    updateMenuItem,
    addMenuItem,
    deleteMenuItem,
    settings,
    updateSettings,
    rawMaterials,
  } = useBilling();

  const [activeSubTab, setActiveSubTab] = useState<'items' | 'materials' | 'settings'>('items');
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);
  // undefined = closed, null = new combo, item = editing that combo
  const [comboItem, setComboItem] = useState<MenuItem | null | undefined>(undefined);

  const lowMaterialCount = rawMaterials.filter((m) => m.stock <= m.lowStockLevel).length;
  const describeRecipe = (item: MenuItem) =>
    (item.recipe ?? [])
      .map((line) => {
        const material = rawMaterials.find((m) => m.id === line.materialId);
        return material ? `${material.name} ${formatQuantity(line.quantity, material.unit)}` : null;
      })
      .filter(Boolean)
      .join(' · ');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // New Item State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MenuCategoryId>('tea');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(false);
  const [newItemSpicy, setNewItemSpicy] = useState(false);

  // Search & filters for the items table
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MenuCategoryId | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');

  // Settings State
  const [formSettings, setFormSettings] = useState(settings);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (stockFilter === 'in' && !item.isAvailable) return false;
      if (stockFilter === 'out' && item.isAvailable) return false;
      if (!query) return true;
      const categoryLabel = getCategory(item.category)?.label ?? '';
      return [item.name, item.description, categoryLabel, String(item.price)].some((text) =>
        text.toLowerCase().includes(query)
      );
    });
  }, [menuItems, searchQuery, categoryFilter, stockFilter]);

  const soldOutCount = menuItems.filter((item) => !item.isAvailable).length;
  const hasFilters = searchQuery.trim() !== '' || categoryFilter !== 'all' || stockFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStockFilter('all');
  };

  const handleStartPriceEdit = (item: MenuItem) => {
    setEditingPriceId(item.id);
    setTempPrice(String(item.price));
  };

  const handleSavePriceEdit = (item: MenuItem) => {
    const val = parseFloat(tempPrice);
    if (!isNaN(val) && val > 0) {
      updateMenuItem({ ...item, price: val });
    }
    setEditingPriceId(null);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newItemPrice);
    if (!newItemName.trim() || !(price > 0)) return;

    setIsSavingItem(true);
    try {
      await addMenuItem({
        name: newItemName.trim(),
        category: newItemCategory,
        price,
        description: newItemDesc.trim(),
        image: newItemImage || undefined,
        isVeg: newItemVeg,
        isSpicy: newItemSpicy,
        isAvailable: true,
      });
      setIsAddingNew(false);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDesc('');
      setNewItemImage('');
    } catch (err) {
      alert(`Could not add the item: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}" from the menu?`)) return;
    try {
      await deleteMenuItem(item.id);
    } catch (err) {
      alert(`Could not delete the item: ${err instanceof Error ? err.message : err}`);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    alert('Cafe Settings & Receipt details saved successfully!');
  };
  function handleSearch(term: string) {
    
  }
  return (
    <div className="w-full min-w-0 p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-lg font-bold text-white">Menu & Store Management</h1>
          <p className="text-xs text-neutral-400">
            Control item availability, update prices, add new items and configure receipt details
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 max-w-full">
          <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs overflow-x-auto scrollbar-none">
            {(
              [
                ['items', `Menu Items (${menuItems.length})`, `Items (${menuItems.length})`],
                ['materials', 'Raw Materials', 'Raw Materials'],
                ['settings', 'Store & Receipt Config', 'Store Config'],
              ] as const
            ).map(([tab, label, shortLabel]) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  activeSubTab === tab
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
                {tab === 'materials' && lowMaterialCount > 0 && (
                  <span
                    className="px-1.5 rounded-md bg-rose-500 text-white text-[10px] font-bold"
                    title={`${lowMaterialCount} low on stock`}
                  >
                    {lowMaterialCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSubTab === 'items' && (
        <div className="space-y-4">
          {/* Top Actions: Add New Item & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-xs shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isAddingNew ? 'Close Form' : 'Add New Item'}</span>
              </button>
              <button
                onClick={() => setComboItem(null)}
                className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
              >
                <Gift className="w-4 h-4" />
                <span>Create Combo</span>
              </button>
            </div>
          </div>

          {/* Add New Item Expandable Form */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateItem}
              className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 animate-in fade-in"
            >
              <h3 className="text-sm font-bold text-white">Create New Cafe Menu Item</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-300">Item Name</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Lemon Mint Cooler"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as MenuCategoryId)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {MENU_CATEGORIES.filter((cat) => cat.id !== 'combos').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 60"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                  <input
                    type="checkbox"
                    checked={newItemVeg}
                    onChange={(e) => setNewItemVeg(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-800 text-amber-500"
                  />
                  <span>Vegetarian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                  <input
                    type="checkbox"
                    checked={newItemSpicy}
                    onChange={(e) => setNewItemSpicy(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-800 text-amber-500"
                  />
                  <span>Spicy</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-300">Menu Item Photo</label>
                <MenuPhotoPicker image={newItemImage || undefined} onChange={setNewItemImage} />
                <p className="text-[11px] text-neutral-500">Optional. Photos are resized before saving to MongoDB.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl text-xs"
                >
                  {isSavingItem ? 'Saving…' : 'Save Item to Menu'}
                </button>
              </div>
            </form>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-2.5">
            <div className="relative flex-1 min-w-0">
              <label htmlFor="menu-search" className="sr-only">
                Search menu items
              </label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                id="menu-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, section or price..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-colors [&::-webkit-search-cancel-button]:hidden"
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

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as MenuCategoryId | 'all')}
                aria-label="Filter by section"
                className="flex-1 md:flex-none bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/60 cursor-pointer"
              >
                <option value="all">All sections</option>
                {MENU_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs shrink-0">
                {(
                  [
                    ['all', 'All'],
                    ['in', 'In Stock'],
                    ['out', `Sold Out (${soldOutCount})`],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setStockFilter(value)}
                    className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                      stockFilter === value
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 -mt-1">
            <span>
              Showing {filteredItems.length} of {menuItems.length} items
            </span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-amber-400 hover:text-amber-300 font-medium">
                Clear filters
              </button>
            )}
          </div>

          {/* Items Stock & Price Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="hidden sm:table-cell py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="hidden md:table-cell py-3 px-4 text-center">Stock Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-500">
                        No items match your search.
                      </td>
                    </tr>
                  )}
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-850/50 transition-colors text-neutral-300"
                    >
                      <td className="py-3 px-3 sm:px-4 min-w-[140px]">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="mt-1.5">
                          <MenuPhotoPicker
                            image={item.image}
                            compact
                            onChange={(image) => updateMenuItem({ ...item, image })}
                          />
                        </div>
                        {item.comboItems?.length ? (
                          <button
                            onClick={() => setComboItem(item)}
                            className="mt-0.5 flex items-start gap-1 text-left text-[10px] text-rose-300/80 hover:text-amber-400 max-w-sm transition-colors"
                            title="Edit combo"
                          >
                            <Gift className="w-3 h-3 shrink-0 mt-px" />
                            <span className="line-clamp-2">
                              {describeCombo(item, menuItems).join(' + ')}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setRecipeItem(item)}
                            className="mt-0.5 flex items-start gap-1 text-left text-[10px] text-neutral-500 hover:text-amber-400 max-w-sm transition-colors"
                            title="Edit raw materials used"
                          >
                            <FlaskConical className="w-3 h-3 shrink-0 mt-px" />
                            <span className="line-clamp-2">
                              {describeRecipe(item) || 'Add raw materials'}
                            </span>
                          </button>
                        )}
                        <CanMakeLabel
                          servings={servingsAvailable(effectiveRecipe(item, menuItems), rawMaterials)}
                        />
                      </td>
                      <td className="hidden sm:table-cell py-3 px-4 text-neutral-400 whitespace-nowrap">
                        {getCategory(item.category)?.label ?? item.category}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-mono font-bold text-white tabular-nums whitespace-nowrap">
                        {editingPriceId === item.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-500">{settings.currencySymbol}</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-16 bg-neutral-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePriceEdit(item)}
                              className="p-1 rounded bg-amber-500 text-neutral-950 hover:bg-amber-400"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 rounded text-neutral-500 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>{formatCurrency(item.price, settings.currencySymbol)}</span>
                            <button
                              onClick={() => handleStartPriceEdit(item)}
                              className="opacity-40 hover:opacity-100 text-neutral-400 hover:text-amber-400 p-0.5"
                              title="Edit Price"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            item.isAvailable
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock' : 'Sold Out'}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleItemAvailability(item.id)}
                          className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            item.isAvailable
                              ? 'bg-neutral-800 hover:bg-rose-950 hover:text-rose-300 text-neutral-300 border border-neutral-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <span className="sm:hidden">{item.isAvailable ? 'Sold Out' : 'Restock'}</span>
                          <span className="hidden sm:inline">
                            {item.isAvailable ? 'Mark Sold Out' : 'Restore In Stock'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="ml-1.5 p-1.5 align-middle rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                          title="Delete item"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'materials' && <RawMaterialsPanel />}

      {recipeItem && <RecipeEditorModal item={recipeItem} onClose={() => setRecipeItem(null)} />}
      {comboItem !== undefined && (
        <ComboEditorModal combo={comboItem} onClose={() => setComboItem(undefined)} />
      )}

      {/* STORE & RECEIPT SETTINGS TAB */}
      {activeSubTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-5 max-w-2xl"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            <span>Cafe Branding & Thermal Printer Setup</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Cafe Name</label>
              <input
                type="text"
                value={formSettings.cafeName}
                onChange={(e) => setFormSettings({ ...formSettings, cafeName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Store Phone</label>
              <input
                type="text"
                value={formSettings.phone}
                onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">Address / Location</label>
            <input
              type="text"
              value={formSettings.address}
              onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Tax / GST (%)</label>
              <input
                type="number"
                step="0.1"
                value={formSettings.taxPercent}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    taxPercent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Currency Symbol</label>
              <input
                type="text"
                value={formSettings.currencySymbol}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, currencySymbol: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">UPI ID for QR</label>
              <input
                type="text"
                value={formSettings.upiId}
                onChange={(e) => setFormSettings({ ...formSettings, upiId: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-300">
              Receipt Footer Thank You Message
            </label>
            <input
              type="text"
              value={formSettings.receiptFooterMessage}
              onChange={(e) =>
                setFormSettings({ ...formSettings, receiptFooterMessage: e.target.value })
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
