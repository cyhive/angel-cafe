import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MenuItem,
  CartItem,
  Bill,
  OrderType,
  PaymentMethod,
  OrderStatus,
  CafeSettings,
  ActiveTab,
  CustomOptionChoice,
  RawMaterial,
  Expense,
} from '../types';
import { INITIAL_CAFE_SETTINGS } from '../data/initialMenu';
import { describeCombo } from '../data/rawMaterials';
import { api, NewMenuItem, NewRawMaterial } from '../api';
import { sound } from '../utils/audio';

interface HeldOrder {
  id: string;
  timestamp: string;
  items: CartItem[];
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  note?: string;
}

interface BillingContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Server data loading
  loadState: 'loading' | 'ready' | 'error';
  loadError: string | null;
  reloadData: () => void;

  // Settings
  settings: CafeSettings;
  updateSettings: (newSettings: Partial<CafeSettings>) => void;

  // Menu items
  menuItems: MenuItem[];
  updateMenuItem: (item: MenuItem) => void;
  toggleItemAvailability: (id: string) => void;
  addMenuItem: (item: NewMenuItem) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  // Raw materials (ingredient stock)
  rawMaterials: RawMaterial[];
  addRawMaterial: (material: NewRawMaterial) => Promise<void>;
  updateRawMaterial: (id: string, changes: Partial<RawMaterial>) => Promise<void>;
  adjustRawMaterialStock: (id: string, amount: number) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;

  // Active Cart State
  cart: CartItem[];
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  orderNote: string;
  setOrderNote: (note: string) => void;
  billDate: string;
  setBillDate: (date: string) => void;

  // Cart operations
  addToCart: (item: MenuItem, choice?: CustomOptionChoice, note?: string) => void;
  updateCartQuantity: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemNote: (cartItemId: string, note: string) => void;
  clearCart: () => void;

  // Calculation values
  subtotal: number;
  taxPercent: number;
  setTaxPercent: (tax: number) => void;
  taxAmount: number;
  discountType: 'percentage' | 'fixed';
  setDiscountType: (type: 'percentage' | 'fixed') => void;
  discountValue: number;
  setDiscountValue: (val: number) => void;
  discountAmount: number;
  grandTotal: number;

  // Held orders
  heldOrders: HeldOrder[];
  holdCurrentOrder: () => void;
  resumeHeldOrder: (heldId: string) => void;
  deleteHeldOrder: (heldId: string) => void;

  // Settlement & Orders History
  bills: Bill[];
  updateBill: (bill: Bill) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  settleOrder: (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeDue?: number
  ) => Promise<Bill | null>;
  isSettling: boolean;
  updateOrderStatus: (billId: string, status: OrderStatus) => void;

  // Modals & Popups
  activeBillForReceipt: Bill | null;
  setActiveBillForReceipt: (bill: Bill | null) => void;
  customizingItem: MenuItem | null;
  setCustomizingItem: (item: MenuItem | null) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isHoldModalOpen: boolean;
  setIsHoldModalOpen: (open: boolean) => void;

  // Helper stats
  todayStats: {
    revenue: number;
    orderCount: number;
    cashTotal: number;
    cardTotal: number;
    upiTotal: number;
    itemsSold: number;
  };
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_HELD = 'nucafe_held_orders';
const LOCAL_STORAGE_KEY_SOUND = 'nucafe_sound_enabled';

// How often changes from other devices (new bills, KDS status, menu edits) are picked up
const BILLS_REFRESH_MS = 10_000;
const MENU_REFRESH_MS = 30_000;

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));
const withDefaults = (stored: Partial<CafeSettings>): CafeSettings => ({
  ...INITIAL_CAFE_SETTINGS,
  ...stored,
  cafeName:
    stored.cafeName?.trim().toLowerCase() === 'nu cafe'
      ? 'Angel Cafe'
      : stored.cafeName || INITIAL_CAFE_SETTINGS.cafeName,
});

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Menu, store settings and bills live in MongoDB
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [storeSettings, setStoreSettings] = useState<CafeSettings>(INITIAL_CAFE_SETTINGS);

  // Sound is a per-device preference, so it stays in this browser
  const [enableSound, setEnableSound] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY_SOUND) !== 'false';
    } catch {
      return true;
    }
  });
  const settings: CafeSettings = { ...storeSettings, enableSound };

  const reloadData = useCallback(async () => {
    try {
      const [menu, stored, billList, materials, expenseList] = await Promise.all([
        api.getMenu(),
        api.getSettings(),
        api.getBills(),
        api.getMaterials(),
        api.getExpenses(),
      ]);
      setMenuItems(menu);
      setRawMaterials(materials);
      setStoreSettings(withDefaults(stored));
      setBills(billList);
      setExpenses(expenseList);
      setLoadState('ready');
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err));
      setLoadState((prev) => (prev === 'ready' ? prev : 'error'));
    }
  }, []);

  // Initial load, then keep in sync with other devices
  useEffect(() => {
    reloadData();
    const refreshBills = () =>
      api
        .getBills()
        .then(setBills)
        .catch((err) => console.warn('Bill refresh failed', err));
    const refreshMenu = () =>
      Promise.all([api.getMenu(), api.getSettings(), api.getMaterials(), api.getExpenses()])
        .then(([menu, stored, materials, expenseList]) => {
          setMenuItems(menu);
          setRawMaterials(materials);
          setExpenses(expenseList);
          setStoreSettings(withDefaults(stored));
        })
        .catch((err) => console.warn('Menu refresh failed', err));
    const billsTimer = setInterval(refreshBills, BILLS_REFRESH_MS);
    const menuTimer = setInterval(refreshMenu, MENU_REFRESH_MS);
    const onFocus = () => {
      refreshBills();
      refreshMenu();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(billsTimer);
      clearInterval(menuTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, [reloadData]);

  // Sound sync
  useEffect(() => {
    sound.setEnabled(enableSound);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SOUND, String(enableSound));
    } catch {
      // storage unavailable; the preference just won't persist
    }
  }, [enableSound]);

  // Held orders are parked on this device only
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_HELD);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_HELD, JSON.stringify(heldOrders));
    } catch (e) {
      console.warn('Failed to save held orders', e);
    }
  }, [heldOrders]);

  // Current Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState<string>('Table 1');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [billDate, setBillDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Discount & Tax calculations
  const [taxPercent, setTaxPercent] = useState<number>(storeSettings.taxPercent);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Follow the store tax rate once it loads or is changed
  useEffect(() => {
    setTaxPercent(storeSettings.taxPercent);
  }, [storeSettings.taxPercent]);

  // Popups and Modals
  const [activeBillForReceipt, setActiveBillForReceipt] = useState<Bill | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState(false);

  // Computed Cart Numbers
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
  } else {
    discountAmount = Math.min(subtotal, Math.max(0, discountValue));
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  // Cart operations
  const addToCart = (
    item: MenuItem,
    choice?: CustomOptionChoice,
    note?: string
  ) => {
    const extraPrice = choice ? choice.extraPrice : 0;
    const unitPrice = item.price + extraPrice;

    setCart((prev) => {
      // Find if an identical item + choice already exists
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.menuItemId === item.id &&
          ci.selectedChoice?.name === choice?.name &&
          (ci.note || '') === (note || '')
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }

      const newCartItem: CartItem = {
        cartItemId: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        menuItemId: item.id,
        name: item.name,
        basePrice: item.price,
        selectedChoice: choice,
        unitPrice,
        quantity: 1,
        note,
        category: item.category,
        includes: item.comboItems?.length ? describeCombo(item, menuItems) : undefined,
      };
      return [...prev, newCartItem];
    });

    sound.playBeep();
  };

  const updateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item
      )
    );
    sound.playClick();
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    sound.playClick();
  };

  const updateCartItemNote = (cartItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, note } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNote('');
  };

  // Hold current order
  const holdCurrentOrder = () => {
    if (cart.length === 0) return;
    const newHold: HeldOrder = {
      id: 'hold_' + Date.now(),
      timestamp: new Date().toISOString(),
      items: [...cart],
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      customerName: customerName || undefined,
      note: orderNote || undefined,
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    clearCart();
    sound.playClick();
  };

  const resumeHeldOrder = (heldId: string) => {
    const found = heldOrders.find((h) => h.id === heldId);
    if (!found) return;
    setCart(found.items);
    setOrderType(found.orderType);
    if (found.tableNumber) setTableNumber(found.tableNumber);
    if (found.customerName) setCustomerName(found.customerName);
    if (found.note) setOrderNote(found.note);

    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
    setIsHoldModalOpen(false);
    sound.playBeep();
  };

  const deleteHeldOrder = (heldId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== heldId));
    sound.playClick();
  };

  // Settle & complete order. The server assigns the bill and token numbers.
  const settleOrder = async (
    paymentMethod: PaymentMethod,
    cashReceived?: number,
    changeDue?: number
  ): Promise<Bill | null> => {
    if (cart.length === 0 || isSettling) return null;
    setIsSettling(true);
    try {
      const newBill = await api.createBill({
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: [...cart],
        subtotal,
        taxPercent,
        taxAmount,
        discountType,
        discountValue,
        discountAmount,
        total: grandTotal,
        paymentMethod,
        cashReceived,
        changeDue,
        notes: orderNote.trim() || undefined,
        createdAt: new Date(`${billDate}T12:00:00`).toISOString(),
      });

      setBills((prev) => [newBill, ...prev]);
      sound.playSuccessChime();
      // The server used up raw materials for this bill
      api.getMaterials().then(setRawMaterials).catch(() => {});

      // Prepare for next order
      clearCart();
      setIsPaymentModalOpen(false);
      setActiveBillForReceipt(newBill);
      return newBill;
    } catch (err) {
      alert(
        `Could not save the bill: ${errorMessage(err)}\n\nThe order is still in the cart. Please try again.`
      );
      return null;
    } finally {
      setIsSettling(false);
    }
  };

  const updateBill = async (bill: Bill) => {
    const saved = await api.updateBill(bill.id, bill);
    setBills((prev) => prev.map((b) => b.id === saved.id ? saved : b));
  };
  const deleteBill = async (id: string) => {
    await api.deleteBill(id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  };
  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const saved = await api.createExpense(expense);
    setExpenses((prev) => [saved, ...prev]);
  };
  const deleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Update kitchen order status
  const updateOrderStatus = (billId: string, status: OrderStatus) => {
    setBills((prev) => prev.map((b) => (b.id === billId ? { ...b, status } : b)));
    sound.playClick();
    api.updateBillStatus(billId, status).catch((err) => {
      alert(`Could not update the order: ${errorMessage(err)}`);
      api.getBills().then(setBills).catch(() => {});
    });
  };

  // Menu edits update the screen straight away, then save to the server
  const saveMenuChanges = (id: string, changes: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
    api.updateMenuItem(id, changes).catch((err) => {
      alert(`Could not save the menu change: ${errorMessage(err)}`);
      api.getMenu().then(setMenuItems).catch(() => {});
    });
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    const { id, ...changes } = updatedItem;
    saveMenuChanges(id, changes);
  };

  const toggleItemAvailability = (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;
    saveMenuChanges(id, { isAvailable: !item.isAvailable });
    sound.playClick();
  };

  const addMenuItem = async (item: NewMenuItem) => {
    const created = await api.createMenuItem(item);
    setMenuItems((prev) => [created, ...prev]);
  };

  const deleteMenuItem = async (id: string) => {
    await api.deleteMenuItem(id);
    // Reload: the server also removed the item from any combo that had it
    setMenuItems(await api.getMenu());
  };

  const replaceMaterial = (updated: RawMaterial) =>
    setRawMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

  const addRawMaterial = async (material: NewRawMaterial) => {
    const created = await api.createMaterial(material);
    setRawMaterials((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const updateRawMaterial = async (id: string, changes: Partial<RawMaterial>) => {
    replaceMaterial(await api.updateMaterial(id, changes));
    // A unit change may have converted recipe amounts on the server
    if (changes.unit) setMenuItems(await api.getMenu());
  };

  const adjustRawMaterialStock = async (id: string, amount: number) => {
    replaceMaterial(await api.adjustMaterialStock(id, amount));
  };

  const deleteRawMaterial = async (id: string) => {
    await api.deleteMaterial(id);
    setRawMaterials((prev) => prev.filter((m) => m.id !== id));
    // The server also removed it from recipes
    setMenuItems((prev) =>
      prev.map((item) =>
        item.recipe?.some((line) => line.materialId === id)
          ? { ...item, recipe: item.recipe.filter((line) => line.materialId !== id) }
          : item
      )
    );
  };

  const updateSettings = (newSettings: Partial<CafeSettings>) => {
    const { enableSound: soundPref, ...storeChanges } = newSettings;
    if (soundPref !== undefined) setEnableSound(soundPref);
    if (Object.keys(storeChanges).length === 0) return;

    setStoreSettings((prev) => ({ ...prev, ...storeChanges }));
    api
      .updateSettings(storeChanges)
      .then((saved) => setStoreSettings(withDefaults(saved)))
      .catch((err) => {
        alert(`Could not save settings: ${errorMessage(err)}`);
        api.getSettings().then((saved) => setStoreSettings(withDefaults(saved))).catch(() => {});
      });
  };

  // Compute Today's Stats
  const todayDateString = new Date().toDateString();
  const todayBills = bills.filter(
    (b) => new Date(b.createdAt).toDateString() === todayDateString && b.status !== 'cancelled'
  );

  const revenue = todayBills.reduce((acc, b) => acc + b.total, 0);
  const cashTotal = todayBills
    .filter((b) => b.paymentMethod === 'cash')
    .reduce((acc, b) => acc + b.total, 0);
  const cardTotal = todayBills
    .filter((b) => b.paymentMethod === 'card')
    .reduce((acc, b) => acc + b.total, 0);
  const upiTotal = todayBills
    .filter((b) => b.paymentMethod === 'upi')
    .reduce((acc, b) => acc + b.total, 0);
  const itemsSold = todayBills.reduce(
    (acc, b) => acc + b.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  return (
    <BillingContext.Provider
      value={{
        activeTab,
        setActiveTab,
        loadState,
        loadError,
        reloadData,
        settings,
        updateSettings,
        menuItems,
        updateMenuItem,
        toggleItemAvailability,
        addMenuItem,
        deleteMenuItem,
        rawMaterials,
        addRawMaterial,
        updateRawMaterial,
        adjustRawMaterialStock,
        deleteRawMaterial,
        cart,
        orderType,
        setOrderType,
        tableNumber,
        setTableNumber,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        orderNote,
        setOrderNote,
        billDate,
        setBillDate,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        updateCartItemNote,
        clearCart,
        subtotal,
        taxPercent,
        setTaxPercent,
        taxAmount,
        discountType,
        setDiscountType,
        discountValue,
        setDiscountValue,
        discountAmount,
        grandTotal,
        heldOrders,
        holdCurrentOrder,
        resumeHeldOrder,
        deleteHeldOrder,
        bills,
        updateBill,
        deleteBill,
        expenses,
        addExpense,
        deleteExpense,
        settleOrder,
        isSettling,
        updateOrderStatus,
        activeBillForReceipt,
        setActiveBillForReceipt,
        customizingItem,
        setCustomizingItem,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isHoldModalOpen,
        setIsHoldModalOpen,
        todayStats: {
          revenue,
          orderCount: todayBills.length,
          cashTotal,
          cardTotal,
          upiTotal,
          itemsSold,
        },
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
