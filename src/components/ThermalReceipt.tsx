import React from 'react';
import { Bill, CafeSettings } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Printer, X, Share2, Check, Download } from 'lucide-react';

interface ThermalReceiptProps {
  bill: Bill | null;
  settings: CafeSettings;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ bill, settings, onClose }) => {
  // Close with Esc, as the hint under the receipt says
  React.useEffect(() => {
    if (!bill) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bill, onClose]);

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const itemsList = bill.items
      .map(
        (i) =>
          `• ${i.name}${i.selectedChoice ? ` (${i.selectedChoice.name})` : ''} x${i.quantity} = ${formatCurrency(
            i.unitPrice * i.quantity,
            settings.currencySymbol
          )}`
      )
      .join('\n');

    const text = `*${settings.cafeName}*\nToken #${bill.tokenNumber} | Bill #${bill.orderNumber}\n${bill.orderType.toUpperCase()}${bill.tableNumber ? ` - ${bill.tableNumber}` : ''}\n--------------------------\n${itemsList}\n--------------------------\n*Total: ${formatCurrency(
      bill.total,
      settings.currencySymbol
    )}*\nPayment: ${bill.paymentMethod.toUpperCase()}\nThank you for visiting!`;

    const encoded = encodeURIComponent(text);
    const phone = bill.customerPhone ? bill.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/85 backdrop-blur-md print:p-0 print:bg-white print:static animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm my-auto flex flex-col items-center">
        {/* Actions Bar (Hidden during print) */}
        <div className="w-full flex items-center justify-between mb-3 text-xs text-neutral-300 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Print Thermal Receipt</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
              title="Share receipt via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div
          id="printable-receipt"
          className="w-full bg-white text-black font-mono text-[11px] leading-tight p-5 rounded-md shadow-2xl border border-neutral-300 print:shadow-none print:border-none print:w-[80mm] print:m-0 print:p-2"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <img
              src="/brand/angel-cafe-logo.png"
              alt=""
              className="w-14 h-14 mx-auto rounded-full grayscale"
            />
            <h1 className="text-base font-extrabold tracking-tight uppercase">
              {settings.cafeName}
            </h1>
            <p className="text-[10px] text-neutral-700">{settings.tagline}</p>
            {settings.address && (
              <p className="text-[10px] text-neutral-600">{settings.address}</p>
            )}
            {settings.phone && <p className="text-[10px] text-neutral-600">Ph: {settings.phone}</p>}
            {settings.gstin && (
              <p className="text-[9px] text-neutral-600">GSTIN: {settings.gstin}</p>
            )}
          </div>

          <div className="my-2 border-t border-dashed border-neutral-400"></div>

          {/* Token & Order Banner */}
          <div className="text-center py-1 bg-neutral-100 rounded my-1 border border-neutral-300">
            <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-600">
              Token Number
            </div>
            <div className="text-2xl font-black text-black">T-{bill.tokenNumber}</div>
            <div className="text-[10px] font-bold uppercase mt-0.5">
              {bill.orderType}
              {bill.tableNumber ? ` · ${bill.tableNumber}` : ''}
            </div>
          </div>

          {/* Bill Meta */}
          <div className="text-[10px] space-y-0.5 pt-1 text-neutral-700">
            <div className="flex justify-between">
              <span>Bill No: #{bill.orderNumber}</span>
              <span>{formatDateTime(bill.createdAt)}</span>
            </div>
            {bill.customerName && (
              <div className="flex justify-between">
                <span>Customer: {bill.customerName}</span>
                {bill.customerPhone && <span>Ph: {bill.customerPhone}</span>}
              </div>
            )}
            <div className="flex justify-between">
              <span>Cashier: Counter 01</span>
              <span>Status: PAID</span>
            </div>
          </div>

          <div className="my-2 border-t border-dashed border-neutral-400"></div>

          {/* Items Table */}
          <div className="space-y-1">
            <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-neutral-300">
              <span className="col-span-7">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>

            {bill.items.map((item, idx) => (
              <div key={idx} className="py-0.5">
                <div className="grid grid-cols-12 text-[10px]">
                  <span className="col-span-7 font-bold text-neutral-900 leading-tight">
                    {item.name}
                  </span>
                  <span className="col-span-2 text-center text-neutral-800">
                    {item.quantity}
                  </span>
                  <span className="col-span-3 text-right font-bold text-neutral-900">
                    {formatCurrency(item.unitPrice * item.quantity, settings.currencySymbol)}
                  </span>
                </div>
                {item.includes?.map((part) => (
                  <div key={part} className="text-[9px] text-neutral-600 pl-2">
                    - {part}
                  </div>
                ))}
                {item.selectedChoice && (
                  <div className="text-[9px] text-neutral-600 pl-2">
                    + {item.selectedChoice.name}
                  </div>
                )}
                {item.note && (
                  <div className="text-[9px] text-neutral-500 italic pl-2">
                    "{item.note}"
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="my-2 border-t border-dashed border-neutral-400"></div>

          {/* Calculation Summary */}
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold">
                {formatCurrency(bill.subtotal, settings.currencySymbol)}
              </span>
            </div>

            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-neutral-700">
                <span>
                  Discount ({bill.discountType === 'percentage' ? `${bill.discountValue}%` : 'Flat'}
                  ):
                </span>
                <span>-{formatCurrency(bill.discountAmount, settings.currencySymbol)}</span>
              </div>
            )}

            {bill.taxAmount > 0 && (
              <div className="flex justify-between text-neutral-700">
                <span>Tax / GST ({bill.taxPercent}%):</span>
                <span>{formatCurrency(bill.taxAmount, settings.currencySymbol)}</span>
              </div>
            )}

            <div className="my-1 border-t-2 border-black"></div>

            <div className="flex justify-between text-xs font-black">
              <span>GRAND TOTAL:</span>
              <span className="text-sm">
                {formatCurrency(bill.total, settings.currencySymbol)}
              </span>
            </div>

            <div className="my-1 border-b border-black"></div>

            <div className="flex justify-between text-[10px] pt-0.5">
              <span>Payment Mode:</span>
              <span className="font-bold uppercase">{bill.paymentMethod}</span>
            </div>

            {bill.cashReceived !== undefined && bill.cashReceived > 0 && (
              <>
                <div className="flex justify-between text-[10px]">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(bill.cashReceived, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Change Given:</span>
                  <span className="font-bold">
                    {formatCurrency(bill.changeDue || 0, settings.currencySymbol)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="my-2 border-t border-dashed border-neutral-400"></div>

          {/* Barcode & Footer Note */}
          <div className="text-center space-y-1 pt-1">
            {/* Barcode simulation */}
            <div className="flex justify-center items-center gap-[2px] h-7 my-1 overflow-hidden">
              {[4, 2, 6, 1, 3, 5, 2, 7, 2, 4, 1, 6, 3, 5, 2, 6, 2, 4, 3, 1, 5, 6, 2, 3, 5].map(
                (w, i) => (
                  <div
                    key={i}
                    className="bg-black h-full"
                    style={{ width: `${w * 1.5}px` }}
                  />
                )
              )}
            </div>
            <p className="text-[9px] tracking-widest text-neutral-600 font-mono">
              *{bill.orderNumber}-{bill.tokenNumber}*
            </p>

            <p className="text-[10px] font-bold text-neutral-800 pt-1">
              {settings.receiptFooterMessage}
            </p>
          </div>
        </div>

        {/* Dismiss instruction */}
        <p className="text-[11px] text-neutral-400 mt-3 print:hidden">
          Press Esc or click Close to return to counter
        </p>
      </div>
    </div>
  );
};
