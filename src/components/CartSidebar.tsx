import React, { useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { formatCurrency } from '../utils/format';
import {
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  Receipt,
  RotateCcw,
  Zap,
  CreditCard,
  Percent,
  User,
  Phone,
  MessageSquare,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
} from 'lucide-react';
import { OrderType } from '../types';

export const CartSidebar: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    updateCartItemNote,
    clearCart,
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
    holdCurrentOrder,
    setIsPaymentModalOpen,
    settleOrder,
    isSettling,
    settings,
  } = useBilling();

  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const orderTypes: { id: OrderType; label: string; icon: React.ReactNode }[] = [
    { id: 'dine-in', label: 'Dine-In', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
    { id: 'takeaway', label: 'Takeaway', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: 'delivery', label: 'Delivery', icon: <Bike className="w-3.5 h-3.5" /> },
  ];

  const tables = [
    'Table 1',
    'Table 2',
    'Table 3',
    'Table 4',
    'Table 5',
    'Table 6',
    'Table 7',
    'Table 8',
    'Table 9',
    'Table 10',
    'Table 11',
    'Table 12',
    'Outdoor 1',
    'Outdoor 2',
    'VIP Lounge',
  ];

  const handleQuickCash = () => {
    if (cart.length === 0) return;
    settleOrder('cash', grandTotal, 0);
  };

  return (
    <aside className="w-full lg:w-[410px] xl:w-[440px] flex flex-col bg-neutral-900 border-l border-neutral-800 shrink-0 h-[calc(100vh-61px)] sticky top-[61px] select-none">
      {/* 1. Header & Order Type Configuration */}
      <div className="p-3.5 border-b border-neutral-800 space-y-2.5 bg-neutral-900/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800 flex-1 mr-2">
            {orderTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setOrderType(type.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  orderType === type.id
                    ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustomerFields(!showCustomerFields)}
            className={`p-2 rounded-xl border transition-colors ${
              customerName || customerPhone
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Customer details"
          >
            <User className="w-4 h-4" />
          </button>
        </div>

        {/* Table Selector (if Dine-in) */}
        {orderType === 'dine-in' && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-400">Assigned Table:</span>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
            >
              {tables.map((t) => (
                <option key={t} value={t} className="bg-neutral-900 text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Collapsible Customer Inputs */}
        {showCustomerFields && (
          <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-500 flex-1 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-neutral-500" />
              <input
                type="tel"
                placeholder="Phone (for SMS receipt)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-500 flex-1 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Cart Items List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <div className="w-12 h-12 rounded-2xl bg-neutral-850 flex items-center justify-center mb-3 text-neutral-600 border border-neutral-800">
              <Receipt className="w-6 h-6 stroke-1" />
            </div>
            <p className="text-sm font-semibold text-neutral-400">Current Bill is Empty</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-[220px]">
              Tap any tea, juice, shake or snack to start billing.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.cartItemId}
              className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-2 hover:border-neutral-750 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-neutral-100 line-clamp-1">
                    {item.name}
                  </h4>
                  {item.includes && (
                    <span className="text-[11px] text-neutral-400 block truncate">
                      ↳ {item.includes.join(' + ')}
                    </span>
                  )}
                  {item.selectedChoice && (
                    <span className="text-[11px] text-amber-400 font-medium block truncate">
                      ↳ {item.selectedChoice.name}
                    </span>
                  )}
                  {item.note && (
                    <span className="text-[10px] text-neutral-400 italic block truncate">
                      "{item.note}"
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold font-mono text-white tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol)}
                  </span>
                  <div className="text-[10px] text-neutral-500 font-mono tabular-nums">
                    @{formatCurrency(item.unitPrice, settings.currencySymbol)}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Inline Note Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-850">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 flex items-center justify-center border border-neutral-750 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-white tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-300 flex items-center justify-center border border-neutral-750 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setEditingNoteId(editingNoteId === item.cartItemId ? null : item.cartItemId)
                    }
                    className={`p-1 rounded-md text-[11px] transition-colors ${
                      item.note ? 'text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="Add Item Note"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="p-1 rounded-md text-neutral-500 hover:text-rose-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Inline Note Input if active */}
              {editingNoteId === item.cartItemId && (
                <div className="pt-1.5 flex gap-1">
                  <input
                    type="text"
                    defaultValue={item.note || ''}
                    placeholder="e.g. Less ice, extra hot..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateCartItemNote(item.cartItemId, (e.target as HTMLInputElement).value);
                        setEditingNoteId(null);
                      }
                    }}
                    onBlur={(e) => {
                      updateCartItemNote(item.cartItemId, e.target.value);
                      setEditingNoteId(null);
                    }}
                    autoFocus
                    className="flex-1 bg-neutral-900 border border-neutral-750 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 3. Calculations & Discount Section */}
      <div className="px-3.5 pt-3 flex items-center justify-between gap-3 text-xs">
        <label htmlFor="bill-date" className="text-neutral-400">Bill date</label>
        <input id="bill-date" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-white" />
      </div>
      <div className="p-3.5 border-t border-neutral-800 bg-neutral-950/80 space-y-2 text-xs">
        {/* Quick Discount Selector */}
        <div className="flex items-center justify-between text-neutral-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Percent className="w-3 h-3 text-neutral-500" />
            <span>Discount:</span>
          </span>
          <div className="flex items-center gap-1">
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  setDiscountType('percentage');
                  setDiscountValue(pct);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  discountType === 'percentage' && discountValue === pct
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {pct === 0 ? '0%' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown rows */}
        <div className="space-y-1 pt-1 font-mono text-[11px]">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal</span>
            <span className="tabular-nums text-white">
              {formatCurrency(subtotal, settings.currencySymbol)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>
                Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'})
              </span>
              <span className="tabular-nums">
                -{formatCurrency(discountAmount, settings.currencySymbol)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-neutral-400">
            <span className="flex items-center gap-1">
              <span>Tax / GST ({taxPercent}%)</span>
              <button
                onClick={() => setTaxPercent(taxPercent === 0 ? 5 : 0)}
                className="text-[10px] text-neutral-500 underline hover:text-neutral-300"
              >
                {taxPercent > 0 ? 'Toggle Off' : 'Toggle 5%'}
              </button>
            </span>
            <span className="tabular-nums text-white">
              {formatCurrency(taxAmount, settings.currencySymbol)}
            </span>
          </div>
        </div>

        {/* Grand Total Bar */}
        <div className="pt-2 border-t border-neutral-800 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Total Payable
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {formatCurrency(grandTotal, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={holdCurrentOrder}
            disabled={cart.length === 0}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-750 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-300 rounded-xl text-xs font-medium border border-neutral-750 transition-colors"
            title="Hold order for next customer"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span>Hold Bill</span>
          </button>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-rose-950/60 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-400 rounded-xl text-xs font-medium border border-neutral-750 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Quick Cash Button */}
          <button
            onClick={handleQuickCash}
            disabled={cart.length === 0 || isSettling}
            className="col-span-1 flex items-center justify-center gap-1.5 py-3 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
            title="Exact cash settlement"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Exact Cash</span>
          </button>

          {/* Settle & Pay Button (Opens Full Tender/UPI/Card Screen) */}
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={cart.length === 0 || isSettling}
            className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-bold rounded-xl text-sm shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Receipt className="w-4 h-4 stroke-[2.5]" />
            <span>Settle & Print Bill</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
