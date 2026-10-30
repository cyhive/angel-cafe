import type { Bill, CafeSettings, Expense, MenuItem, OrderStatus, RawMaterial } from './types';

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export type NewBill = Omit<Bill, 'id' | 'orderNumber' | 'tokenNumber' | 'status'>;
export type NewExpense = Omit<Expense, 'id' | 'createdAt'>;
export type NewMenuItem = Omit<MenuItem, 'id'>;
export type NewRawMaterial = Omit<RawMaterial, 'id'>;

export const api = {
  getMenu: () => request<MenuItem[]>('GET', '/menu'),
  createMenuItem: (item: NewMenuItem) => request<MenuItem>('POST', '/menu', item),
  updateMenuItem: (id: string, changes: Partial<MenuItem>) =>
    request<MenuItem>('PUT', `/menu/${encodeURIComponent(id)}`, changes),
  deleteMenuItem: (id: string) => request<void>('DELETE', `/menu/${encodeURIComponent(id)}`),
  getMaterials: () => request<RawMaterial[]>('GET', '/materials'),
  createMaterial: (material: NewRawMaterial) => request<RawMaterial>('POST', '/materials', material),
  updateMaterial: (id: string, changes: Partial<RawMaterial>) =>
    request<RawMaterial>('PUT', `/materials/${encodeURIComponent(id)}`, changes),
  adjustMaterialStock: (id: string, amount: number) =>
    request<RawMaterial>('POST', `/materials/${encodeURIComponent(id)}/adjust`, { amount }),
  deleteMaterial: (id: string) => request<void>('DELETE', `/materials/${encodeURIComponent(id)}`),

  getSettings: () => request<CafeSettings>('GET', '/settings'),
  updateSettings: (changes: Partial<CafeSettings>) => request<CafeSettings>('PUT', '/settings', changes),

  getBills: () => request<Bill[]>('GET', '/bills'),
  createBill: (bill: NewBill) => request<Bill>('POST', '/bills', bill),
  updateBill: (id: string, changes: Partial<Bill>) => request<Bill>('PUT', `/bills/${encodeURIComponent(id)}`, changes),
  deleteBill: (id: string) => request<void>('DELETE', `/bills/${encodeURIComponent(id)}`),
  updateBillStatus: (id: string, status: OrderStatus) =>
    request<Bill>('PATCH', `/bills/${encodeURIComponent(id)}`, { status }),
  getExpenses: () => request<Expense[]>('GET', '/expenses'),
  createExpense: (expense: NewExpense) => request<Expense>('POST', '/expenses', expense),
  deleteExpense: (id: string) => request<void>('DELETE', `/expenses/${encodeURIComponent(id)}`),
};
