import type { MenuCategoryId } from '../data/categories.js';

export type ItemCategory = 'all' | MenuCategoryId;

export interface CustomOptionChoice {
  name: string;
  extraPrice: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  description: string;
  image?: string;
  isVeg?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  isAvailable: boolean;
  customizationGroup?: {
    title: string;
    choices: CustomOptionChoice[];
  };
  // Raw materials used for one serving
  recipe?: RecipeLine[];
  // Set for combo offers: the menu items included in one combo
  comboItems?: ComboLine[];
}

export interface ComboLine {
  menuItemId: string;
  quantity: number;
}

export type MaterialUnit = 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'scoop';

export interface RawMaterial {
  id: string;
  name: string;
  unit: MaterialUnit;
  stock: number;
  // Warn when stock falls to or below this level
  lowStockLevel: number;
}

export interface RecipeLine {
  materialId: string;
  // Amount per serving, in the material's unit
  quantity: number;
}

export interface CartItem {
  cartItemId: string; // unique instance in cart
  menuItemId: string;
  name: string;
  basePrice: number;
  selectedChoice?: CustomOptionChoice;
  unitPrice: number;
  quantity: number;
  note?: string;
  category: ItemCategory;
  // For combos: what's inside, e.g. ["Zinger Burger", "2 x Soda Lime"]
  includes?: string[];
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'split';
export type OrderStatus = 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Bill {
  id: string;
  orderNumber: number;
  tokenNumber: number;
  createdAt: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeDue?: number;
  status: OrderStatus;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  createdAt: string;
}

export interface CafeSettings {
  cafeName: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  upiId: string;
  taxPercent: number;
  currencySymbol: string;
  enableSound: boolean;
  receiptFooterMessage: string;
}

export type ActiveTab = 'pos' | 'kds' | 'history' | 'analytics' | 'menu';
