import express, { Request, Response, NextFunction } from 'express';
import type { Bill, ComboLine, Expense, MaterialUnit, MenuItem, OrderStatus, RawMaterial, RecipeLine } from '../src/types/index.js';
import { MENU_CATEGORIES } from '../src/data/categories.js';
import { MATERIAL_UNITS, effectiveRecipe, roundAmount, unitConversionFactor } from '../src/data/rawMaterials.js';
import { bills, expenses, menuItems, nextCounter, rawMaterials, settings, SETTINGS_ID } from './db.js';
import { LEGACY_SAMPLE_MENU_IDS, LEGACY_SAMPLE_RAW_MATERIAL_IDS } from './legacySampleMenu.js';

const NO_ID = { projection: { _id: 0 } } as const;
const ORDER_STATUSES: OrderStatus[] = ['preparing', 'ready', 'completed', 'cancelled'];
const SETTINGS_FIELDS = [
  'cafeName',
  'tagline',
  'address',
  'phone',
  'gstin',
  'upiId',
  'taxPercent',
  'currencySymbol',
  'enableSound',
  'receiptFooterMessage',
] as const;

class BadRequest extends Error {}

// Wraps async handlers so rejected promises reach the error handler
const route =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Validates the editable fields of a menu item. */
function parseMenuItem(body: any, partial: boolean): Partial<MenuItem> {
  const out: Partial<MenuItem> = {};
  if (body.name !== undefined || !partial) {
    if (typeof body.name !== 'string' || !body.name.trim()) throw new BadRequest('name is required');
    out.name = body.name.trim();
  }
  if (body.category !== undefined || !partial) {
    if (!MENU_CATEGORIES.some((c) => c.id === body.category)) {
      throw new BadRequest('category is invalid');
    }
    out.category = body.category;
  }
  if (body.price !== undefined || !partial) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) throw new BadRequest('price must be a positive number');
    out.price = price;
  }
  if (body.description !== undefined) out.description = String(body.description);
  else if (!partial) out.description = '';
  if (body.image !== undefined) {
    if (body.image && typeof body.image !== 'string') throw new BadRequest('image must be a URL or image data');
    if (typeof body.image === 'string' && body.image.length > 7 * 1024 * 1024) {
      throw new BadRequest('image is too large; choose a smaller photo');
    }
    out.image = body.image ? body.image : undefined;
  }
  for (const flag of ['isVeg', 'isSpicy', 'isPopular', 'isAvailable'] as const) {
    if (body[flag] !== undefined) out[flag] = Boolean(body[flag]);
  }
  if (!partial && out.isAvailable === undefined) out.isAvailable = true;
  if (body.customizationGroup !== undefined) out.customizationGroup = body.customizationGroup || undefined;
  if (body.recipe !== undefined) out.recipe = parseRecipe(body.recipe);
  if (body.comboItems !== undefined) out.comboItems = parseComboItems(body.comboItems);
  return out;
}

function parseComboItems(lines: unknown): ComboLine[] {
  if (!Array.isArray(lines) || lines.length === 0) throw new BadRequest('a combo needs at least one item');
  return lines.map((line) => {
    const quantity = Number(line?.quantity);
    if (typeof line?.menuItemId !== 'string' || !Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequest('each combo line needs an item and a whole quantity of 1 or more');
    }
    return { menuItemId: line.menuItemId, quantity };
  });
}

function parseRecipe(recipe: unknown): RecipeLine[] {
  if (!Array.isArray(recipe)) throw new BadRequest('recipe must be a list');
  return recipe.map((line) => {
    const quantity = Number(line?.quantity);
    if (typeof line?.materialId !== 'string' || !(quantity > 0)) {
      throw new BadRequest('each recipe line needs a material and a quantity above 0');
    }
    return { materialId: line.materialId, quantity };
  });
}

/** Validates the editable fields of a raw material. */
function parseMaterial(body: any, partial: boolean): Partial<RawMaterial> {
  const out: Partial<RawMaterial> = {};
  if (body.name !== undefined || !partial) {
    if (typeof body.name !== 'string' || !body.name.trim()) throw new BadRequest('name is required');
    out.name = body.name.trim();
  }
  if (body.unit !== undefined || !partial) {
    if (!MATERIAL_UNITS.includes(body.unit)) throw new BadRequest('unit is invalid');
    out.unit = body.unit as MaterialUnit;
  }
  for (const field of ['stock', 'lowStockLevel'] as const) {
    if (body[field] === undefined) {
      if (!partial) out[field] = 0;
      continue;
    }
    const value = Number(body[field]);
    if (!Number.isFinite(value)) throw new BadRequest(`${field} must be a number`);
    out[field] = value;
  }
  return out;
}

/** Subtracts the raw materials used by a bill's items (combos included) from stock. */
async function deductMaterials(items: Bill['items']) {
  const menu = await menuItems()
    .find({}, { projection: { _id: 0, id: 1, recipe: 1, comboItems: 1 } })
    .toArray();
  const used = new Map<string, number>();
  for (const cartItem of items) {
    const item = menu.find((m) => m.id === cartItem.menuItemId);
    if (!item) continue;
    for (const line of effectiveRecipe(item, menu)) {
      used.set(line.materialId, (used.get(line.materialId) ?? 0) + line.quantity * cartItem.quantity);
    }
  }
  if (used.size === 0) return;
  await rawMaterials().bulkWrite(
    [...used].map(([id, amount]) => ({
      updateOne: { filter: { id }, update: { $inc: { stock: -amount } } },
    }))
  );
}

export function createApiRouter() {
  const api = express.Router();
  api.use(express.json({ limit: '8mb' }));

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // ---- Menu ----
  api.get(
    '/menu',
    route(async (_req, res) => {
      res.json(
        await menuItems()
          .find({ id: { $nin: LEGACY_SAMPLE_MENU_IDS } }, NO_ID)
          .toArray()
      );
    })
  );

  api.post(
    '/menu',
    route(async (req, res) => {
      const fields = parseMenuItem(req.body, false) as MenuItem;
      const item: MenuItem = { ...fields, id: `${slugify(fields.name)}-${Date.now().toString(36)}` };
      await menuItems().insertOne({ ...item });
      res.status(201).json(item);
    })
  );

  api.put(
    '/menu/:id',
    route(async (req, res) => {
      const updated = await menuItems().findOneAndUpdate(
        { id: req.params.id },
        { $set: parseMenuItem(req.body, true) },
        { returnDocument: 'after', ...NO_ID }
      );
      if (!updated) return res.status(404).json({ error: 'Menu item not found' });
      res.json(updated);
    })
  );

  api.delete(
    '/menu/:id',
    route(async (req, res) => {
      const { deletedCount } = await menuItems().deleteOne({ id: req.params.id });
      if (!deletedCount) return res.status(404).json({ error: 'Menu item not found' });
      // Remove it from any combo that included it
      await menuItems().updateMany(
        { 'comboItems.menuItemId': req.params.id },
        { $pull: { comboItems: { menuItemId: req.params.id } } } as never
      );
      res.status(204).end();
    })
  );

  // ---- Raw materials ----
  api.get(
    '/materials',
    route(async (_req, res) => {
      res.json(
        await rawMaterials()
          .find({ id: { $nin: LEGACY_SAMPLE_RAW_MATERIAL_IDS } }, NO_ID)
          .sort({ name: 1 })
          .toArray()
      );
    })
  );

  api.post(
    '/materials',
    route(async (req, res) => {
      const fields = parseMaterial(req.body, false) as RawMaterial;
      const material: RawMaterial = { ...fields, id: `${slugify(fields.name)}-${Date.now().toString(36)}` };
      await rawMaterials().insertOne({ ...material });
      res.status(201).json(material);
    })
  );

  api.put(
    '/materials/:id',
    route(async (req, res) => {
      const id = req.params.id;
      const current = await rawMaterials().findOne({ id });
      if (!current) return res.status(404).json({ error: 'Raw material not found' });
      const changes = parseMaterial(req.body, true);

      // Changing kg <-> g or L <-> ml converts the amounts, including every
      // recipe that uses this material. Other unit changes keep the numbers.
      const factor =
        changes.unit && changes.unit !== current.unit
          ? unitConversionFactor(current.unit, changes.unit)
          : null;
      if (factor !== null && factor !== 1) {
        if (req.body.stock === undefined) changes.stock = roundAmount(current.stock * factor);
        if (req.body.lowStockLevel === undefined) {
          changes.lowStockLevel = roundAmount(current.lowStockLevel * factor);
        }
        const usingItems = await menuItems().find({ 'recipe.materialId': id }).toArray();
        await Promise.all(
          usingItems.map((item) =>
            menuItems().updateOne(
              { id: item.id },
              {
                $set: {
                  recipe: item.recipe!.map((line) =>
                    line.materialId === id
                      ? { ...line, quantity: roundAmount(line.quantity * factor) }
                      : line
                  ),
                },
              }
            )
          )
        );
      }

      const updated = await rawMaterials().findOneAndUpdate(
        { id },
        { $set: changes },
        { returnDocument: 'after', ...NO_ID }
      );
      res.json(updated);
    })
  );

  // Adds (or with a negative amount, removes) stock, e.g. when a delivery arrives
  api.post(
    '/materials/:id/adjust',
    route(async (req, res) => {
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount === 0) throw new BadRequest('amount must be a number');
      const updated = await rawMaterials().findOneAndUpdate(
        { id: req.params.id },
        { $inc: { stock: amount } },
        { returnDocument: 'after', ...NO_ID }
      );
      if (!updated) return res.status(404).json({ error: 'Raw material not found' });
      res.json(updated);
    })
  );

  api.delete(
    '/materials/:id',
    route(async (req, res) => {
      const { deletedCount } = await rawMaterials().deleteOne({ id: req.params.id });
      if (!deletedCount) return res.status(404).json({ error: 'Raw material not found' });
      // Remove it from every recipe that used it
      await menuItems().updateMany(
        { 'recipe.materialId': req.params.id },
        { $pull: { recipe: { materialId: req.params.id } } }
      );
      res.status(204).end();
    })
  );

  // ---- Settings ----
  api.get(
    '/settings',
    route(async (_req, res) => {
      const { _id, ...doc } = (await settings().findOne({ _id: SETTINGS_ID })) ?? { _id: '' };
      res.json(doc);
    })
  );

  api.put(
    '/settings',
    route(async (req, res) => {
      const update: Record<string, unknown> = {};
      for (const key of SETTINGS_FIELDS) {
        if (req.body[key] !== undefined) update[key] = req.body[key];
      }
      if (update.taxPercent !== undefined) {
        const tax = Number(update.taxPercent);
        if (!Number.isFinite(tax) || tax < 0 || tax > 100) throw new BadRequest('taxPercent is invalid');
        update.taxPercent = tax;
      }
      const doc = await settings().findOneAndUpdate(
        { _id: SETTINGS_ID },
        { $set: update },
        { upsert: true, returnDocument: 'after', projection: { _id: 0 } }
      );
      res.json(doc);
    })
  );

  // ---- Bills ----
  api.get(
    '/bills',
    route(async (req, res) => {
      const limit = Math.min(Number(req.query.limit) || 500, 2000);
      res.json(await bills().find({}, NO_ID).sort({ createdAt: -1 }).limit(limit).toArray());
    })
  );

  api.post(
    '/bills',
    route(async (req, res) => {
      const body = req.body as Partial<Bill>;
      if (!Array.isArray(body.items) || body.items.length === 0) {
        throw new BadRequest('A bill needs at least one item');
      }
      // Bill numbers run forever; token numbers restart every day
      const now = new Date();
      const createdAt = typeof body.createdAt === 'string' && !Number.isNaN(Date.parse(body.createdAt)) ? new Date(body.createdAt) : now;
      const day = createdAt.toISOString().slice(0, 10);
      const [orderNumber, tokenNumber] = await Promise.all([
        nextCounter('orderNumber', 1000),
        nextCounter(`token-${day}`, 0),
      ]);
      const bill: Bill = {
        ...(body as Bill),
        id: `bill-${orderNumber}`,
        orderNumber,
        tokenNumber,
        createdAt: createdAt.toISOString(),
        status: 'preparing',
      };
      await bills().insertOne({ ...bill });
      await deductMaterials(bill.items);
      res.status(201).json(bill);
    })
  );

  api.put('/bills/:id', route(async (req, res) => {
    const current = await bills().findOne({ id: req.params.id });
    if (!current) return res.status(404).json({ error: 'Bill not found' });
    const allowed = ['createdAt', 'orderType', 'tableNumber', 'customerName', 'customerPhone', 'items', 'subtotal', 'taxPercent', 'taxAmount', 'discountType', 'discountValue', 'discountAmount', 'total', 'paymentMethod', 'cashReceived', 'changeDue', 'notes'];
    const changes: Record<string, unknown> = {};
    for (const key of allowed) if (req.body[key] !== undefined) changes[key] = req.body[key];
    if (changes.createdAt !== undefined) {
      if (typeof changes.createdAt !== 'string' || Number.isNaN(Date.parse(changes.createdAt))) throw new BadRequest('date is invalid');
      changes.createdAt = new Date(changes.createdAt).toISOString();
    }
    if (changes.items !== undefined && (!Array.isArray(changes.items) || changes.items.length === 0)) throw new BadRequest('A bill needs at least one item');
    if (changes.total !== undefined && (!Number.isFinite(Number(changes.total)) || Number(changes.total) < 0)) throw new BadRequest('total is invalid');
    const updated = await bills().findOneAndUpdate({ id: req.params.id }, { $set: changes }, { returnDocument: 'after', ...NO_ID });
    res.json(updated);
  }));

  api.delete('/bills/:id', route(async (req, res) => {
    const result = await bills().deleteOne({ id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Bill not found' });
    res.status(204).end();
  }));

  api.get('/expenses', route(async (_req, res) => {
    res.json(await expenses().find({}, NO_ID).sort({ date: -1, createdAt: -1 }).limit(2000).toArray());
  }));
  api.post('/expenses', route(async (req, res) => {
    const { description, category, amount, date } = req.body;
    const numericAmount = Number(amount);
    if (typeof description !== 'string' || !description.trim()) throw new BadRequest('description is required');
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) throw new BadRequest('amount must be above 0');
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00`))) throw new BadRequest('date is invalid');
    const expense: Expense = { id: `expense-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date, description: description.trim(), category: typeof category === 'string' && category.trim() ? category.trim() : 'General', amount: numericAmount, createdAt: new Date().toISOString() };
    await expenses().insertOne(expense);
    res.status(201).json(expense);
  }));
  api.delete('/expenses/:id', route(async (req, res) => {
    const result = await expenses().deleteOne({ id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Expense not found' });
    res.status(204).end();
  }));

  api.patch(
    '/bills/:id',
    route(async (req, res) => {
      const { status } = req.body;
      if (!ORDER_STATUSES.includes(status)) throw new BadRequest('status is invalid');
      const updated = await bills().findOneAndUpdate(
        { id: req.params.id },
        { $set: { status } },
        { returnDocument: 'after', ...NO_ID }
      );
      if (!updated) return res.status(404).json({ error: 'Bill not found' });
      res.json(updated);
    })
  );

  api.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  api.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });

  return api;
}
