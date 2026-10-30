import React, { useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { formatCurrency } from '../utils/format';
import { PaymentMethod } from '../types';
import {
  X,
  Banknote,
  CreditCard,
  QrCode,
  Split,
  Printer,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const { grandTotal, settleOrder, isSettling, settings, orderType, tableNumber } = useBilling();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>(grandTotal.toFixed(2));
  const [cardLast4, setCardLast4] = useState<string>('4242');

  // Split mode state
  const [splitCash, setSplitCash] = useState<number>(Math.floor(grandTotal / 2));

  if (!isOpen) return null;

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);
  const isCashSufficient = tenderedNum >= grandTotal;

  // Preset cash buttons
  const cashPresets = [
    grandTotal,
    Math.ceil(grandTotal / 10) * 10,
    Math.ceil(grandTotal / 50) * 50,
    100,
    200,
    500,
    2000,
  ].filter((val, idx, self) => val >= grandTotal && self.indexOf(val) === idx);

  const handleCompleteOrder = () => {
    if (paymentMethod === 'cash') {
      settleOrder('cash', tenderedNum, changeDue);
    } else if (paymentMethod === 'card') {
      settleOrder('card');
    } else if (paymentMethod === 'upi') {
      settleOrder('upi');
    } else if (paymentMethod === 'split') {
      settleOrder('split', splitCash, 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div>
            <span className="text-xs uppercase font-semibold text-amber-500 tracking-wider">
              Finalize & Settle Bill
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
              <span className="capitalize">{orderType}</span>
              {orderType === 'dine-in' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-semibold">{tableNumber}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount to Pay Banner */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Total Amount Due
          </span>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tabular-nums">
            {formatCurrency(grandTotal, settings.currencySymbol)}
          </span>
        </div>

        {/* Payment Modes Segmented Selector */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            {[
              { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
              { id: 'card', label: 'Card / POS', icon: <CreditCard className="w-4 h-4" /> },
              { id: 'upi', label: 'UPI / QR', icon: <QrCode className="w-4 h-4" /> },
              { id: 'split', label: 'Split Pay', icon: <Split className="w-4 h-4" /> },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  paymentMethod === m.id
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* CASH MODE */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Cash Tendered by Customer
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-lg">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-3 font-mono text-xl text-white font-bold focus:outline-none focus:border-amber-500 tabular-nums"
                  />
                </div>
              </div>

              {/* Fast Tendered Presets */}
              <div className="flex flex-wrap gap-2">
                {cashPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCashTendered(preset.toFixed(2))}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
                      tenderedNum === preset
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-neutral-850 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {preset === grandTotal
                      ? 'Exact'
                      : formatCurrency(preset, settings.currencySymbol)}
                  </button>
                ))}
              </div>

              {/* Change Calculation Box */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isCashSufficient
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCashSufficient ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {isCashSufficient ? 'Change to Return' : 'Short / Underpaid by'}
                  </span>
                </div>
                <span className="text-xl font-bold font-mono tabular-nums">
                  {formatCurrency(
                    isCashSufficient ? changeDue : grandTotal - tenderedNum,
                    settings.currencySymbol
                  )}
                </span>
              </div>
            </div>
          )}

          {/* CARD MODE */}
          {paymentMethod === 'card' && (
            <div className="p-5 bg-neutral-950 rounded-xl border border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">Tap or Insert Card on POS Terminal</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Terminal is ready for {formatCurrency(grandTotal, settings.currencySymbol)}. Press
                Complete when payment is approved.
              </p>
              <div className="pt-2 flex justify-center items-center gap-2 text-xs text-neutral-500">
                <span>Card ending in:</span>
                <input
                  type="text"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-center font-mono text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* UPI / QR CODE MODE */}
          {paymentMethod === 'upi' && (
            <div className="p-5 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col items-center text-center space-y-3">
              {/* Dynamic QR Code Simulation */}
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <svg
                  className="w-36 h-36"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Styled SVG QR Code representation */}
                  <rect width="100" height="100" fill="white" />
                  {/* Corner 1 */}
                  <rect x="10" y="10" width="24" height="24" fill="black" />
                  <rect x="14" y="14" width="16" height="16" fill="white" />
                  <rect x="18" y="18" width="8" height="8" fill="black" />
                  {/* Corner 2 */}
                  <rect x="66" y="10" width="24" height="24" fill="black" />
                  <rect x="70" y="14" width="16" height="16" fill="white" />
                  <rect x="74" y="18" width="8" height="8" fill="black" />
                  {/* Corner 3 */}
                  <rect x="10" y="66" width="24" height="24" fill="black" />
                  <rect x="14" y="70" width="16" height="16" fill="white" />
                  <rect x="18" y="74" width="8" height="8" fill="black" />
                  {/* Pattern dots */}
                  <rect x="42" y="14" width="6" height="6" fill="black" />
                  <rect x="52" y="14" width="6" height="6" fill="black" />
                  <rect x="42" y="24" width="6" height="6" fill="black" />
                  <rect x="42" y="42" width="16" height="16" fill="black" />
                  <rect x="46" y="46" width="8" height="8" fill="white" />
                  <rect x="66" y="42" width="6" height="6" fill="black" />
                  <rect x="76" y="42" width="8" height="6" fill="black" />
                  <rect x="14" y="42" width="6" height="12" fill="black" />
                  <rect x="24" y="46" width="6" height="6" fill="black" />
                  <rect x="42" y="66" width="6" height="12" fill="black" />
                  <rect x="54" y="70" width="8" height="6" fill="black" />
                  <rect x="70" y="66" width="16" height="6" fill="black" />
                  <rect x="66" y="78" width="8" height="10" fill="black" />
                  <rect x="80" y="78" width="8" height="8" fill="black" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">Scan to Pay via Any UPI App</p>
                <p className="text-xs font-mono text-amber-400 mt-0.5">{settings.upiId}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Amount:{' '}
                  <strong className="text-white font-mono">
                    {formatCurrency(grandTotal, settings.currencySymbol)}
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* SPLIT MODE */}
          {paymentMethod === 'split' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[11px] text-neutral-400">Cash Portion</span>
                  <input
                    type="number"
                    step="0.01"
                    value={splitCash}
                    onChange={(e) =>
                      setSplitCash(
                        Math.max(0, Math.min(grandTotal, parseFloat(e.target.value) || 0))
                      )
                    }
                    className="w-full bg-neutral-900 border border-neutral-750 rounded px-2 py-1 text-sm font-mono text-white font-bold"
                  />
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[11px] text-neutral-400">Card / UPI Portion</span>
                  <div className="text-sm font-mono text-amber-400 font-bold py-1">
                    {formatCurrency(
                      Math.max(0, grandTotal - splitCash),
                      settings.currencySymbol
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Back
          </button>

          <button
            onClick={handleCompleteOrder}
            disabled={isSettling || (paymentMethod === 'cash' && !isCashSufficient)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 text-sm font-bold shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>{isSettling ? 'Saving…' : 'Complete Order & Print Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
