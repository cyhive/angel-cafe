import type { MaterialUnit, MenuItem, RawMaterial, RecipeLine } from '../types/index.js';

export const MATERIAL_UNITS: MaterialUnit[] = ['kg', 'g', 'L', 'ml', 'pcs', 'scoop'];

export const UNIT_LABELS: Record<MaterialUnit, string> = {
  kg: 'kg (kilogram)',
  g: 'g (gram)',
  L: 'L (litre)',
  ml: 'ml (millilitre)',
  pcs: 'pcs (pieces)',
  scoop: 'scoop',
};

// How many of the second unit make one of the first, for units that convert
const CONVERSIONS: Partial<Record<MaterialUnit, Partial<Record<MaterialUnit, number>>>> = {
  kg: { g: 1000 },
  g: { kg: 0.001 },
  L: { ml: 1000 },
  ml: { L: 0.001 },
};

/**
 * Factor to multiply amounts by when switching units (kg -> g is 1000), or
 * null when the units can't be converted (e.g. kg -> pcs).
 */
export function unitConversionFactor(from: MaterialUnit, to: MaterialUnit): number | null {
  if (from === to) return 1;
  return CONVERSIONS[from]?.[to] ?? null;
}

/** Rounds away float noise such as 0.35 * 1000 = 350.00000000000006. */
export const roundAmount = (value: number) => Math.round(value * 1e6) / 1e6;

/**
 * Raw materials used by one serving of an item. For a combo this is the
 * recipes of everything inside it added together.
 */
export function effectiveRecipe(
  item: Pick<MenuItem, 'recipe' | 'comboItems'>,
  menuItems: Pick<MenuItem, 'id' | 'recipe'>[]
): RecipeLine[] {
  if (!item.comboItems?.length) return item.recipe ?? [];
  const totals = new Map<string, number>();
  for (const line of item.comboItems) {
    const part = menuItems.find((m) => m.id === line.menuItemId);
    for (const r of part?.recipe ?? []) {
      totals.set(r.materialId, (totals.get(r.materialId) ?? 0) + r.quantity * line.quantity);
    }
  }
  return [...totals].map(([materialId, quantity]) => ({ materialId, quantity: roundAmount(quantity) }));
}

/** "Zinger Burger", "2 x Soda Lime" ... for a combo's contents. */
export function describeCombo(
  item: Pick<MenuItem, 'comboItems'>,
  menuItems: Pick<MenuItem, 'id' | 'name'>[]
): string[] {
  return (item.comboItems ?? []).map((line) => {
    const name = menuItems.find((m) => m.id === line.menuItemId)?.name ?? 'Removed item';
    return line.quantity > 1 ? `${line.quantity} x ${name}` : name;
  });
}

/** Sum of the regular prices of a combo's items. */
export function comboRegularPrice(
  item: Pick<MenuItem, 'comboItems'>,
  menuItems: Pick<MenuItem, 'id' | 'price'>[]
): number {
  return (item.comboItems ?? []).reduce(
    (sum, line) => sum + (menuItems.find((m) => m.id === line.menuItemId)?.price ?? 0) * line.quantity,
    0
  );
}

/**
 * How many servings of an item the current stock can make, or null when the
 * item has no recipe (its stock isn't tracked).
 */
export function servingsAvailable(
  recipe: RecipeLine[] | undefined,
  materials: RawMaterial[]
): number | null {
  if (!recipe || recipe.length === 0) return null;
  let servings = Infinity;
  for (const line of recipe) {
    const material = materials.find((m) => m.id === line.materialId);
    if (!material) continue;
    // Small epsilon so 0.7 kg / 0.35 kg counts as 2 despite float rounding
    servings = Math.min(servings, Math.floor(material.stock / line.quantity + 1e-9));
  }
  return servings === Infinity ? null : Math.max(0, servings);
}

/** Formats an amount with its unit, e.g. "0.35 kg", "200 ml", "1 pcs". */
export const formatQuantity = (quantity: number, unit: MaterialUnit) =>
  `${Number(quantity.toFixed(3))} ${unit}`;
