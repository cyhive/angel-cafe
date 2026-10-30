import { MongoClient, Db, Collection } from 'mongodb';
import type { Bill, CafeSettings, Expense, MenuItem, RawMaterial } from '../src/types/index.js';

type SettingsDoc = CafeSettings & { _id: string };
type CounterDoc = { _id: string; value: number };

let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to the .env file (see .env.example).');
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, ignoreUndefined: true });
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'nu_cafe');

  await Promise.all([
    menuItems().createIndex({ id: 1 }, { unique: true }),
    bills().createIndex({ id: 1 }, { unique: true }),
    bills().createIndex({ createdAt: -1 }),
    expenses().createIndex({ date: -1 }),
    rawMaterials().createIndex({ id: 1 }, { unique: true }),
  ]);
  return db;
}

const getDb = () => {
  if (!db) throw new Error('Database not connected');
  return db;
};

export const menuItems = (): Collection<MenuItem> => getDb().collection<MenuItem>('menuItems');
export const bills = (): Collection<Bill> => getDb().collection<Bill>('bills');
export const expenses = (): Collection<Expense> => getDb().collection<Expense>('expenses');
export const rawMaterials = (): Collection<RawMaterial> =>
  getDb().collection<RawMaterial>('rawMaterials');
export const settings = (): Collection<SettingsDoc> => getDb().collection<SettingsDoc>('settings');
const counters = (): Collection<CounterDoc> => getDb().collection<CounterDoc>('counters');

export const SETTINGS_ID = 'store';

/** Atomically increments a named counter and returns the new value. */
export async function nextCounter(name: string, start: number): Promise<number> {
  await counters().updateOne({ _id: name }, { $setOnInsert: { value: start } }, { upsert: true });
  const doc = await counters().findOneAndUpdate(
    { _id: name },
    { $inc: { value: 1 } },
    { returnDocument: 'after' }
  );
  return doc!.value;
}
