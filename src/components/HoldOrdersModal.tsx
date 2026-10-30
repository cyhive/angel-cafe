import React from 'react';
import { useBilling } from '../context/BillingContext';
import { formatTime, formatCurrency } from '../utils/format';
import { X, Play, Trash2, PauseCircle, Clock } from 'lucide-react';

export const HoldOrdersModal: React.FC = () => {
  const {
    heldOrders,
    isHoldModalOpen,
    setIsHoldModalOpen,
    resumeHeldOrder,
    deleteHeldOrder,
    settings,
  } = useBilling();

  if (!isHoldModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white">Held Customer Bills</h2>
              <p className="text-xs text-neutral-400">
                Pick up a bill that was temporarily placed on hold
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsHoldModalOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Held Bills */}
        <div className="p-6 space-y-3 overflow-y-auto">
          {heldOrders.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <PauseCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-neutral-400">No Held Bills</p>
              <p className="text-xs text-neutral-500 mt-1">
                You can hold any active bill by clicking "Hold Bill" in the POS sidebar.
              </p>
            </div>
          ) : (
            heldOrders.map((held) => {
              const totalAmount = held.items.reduce(
                (sum, item) => sum + item.unitPrice * item.quantity,
                0
              );
              return (
                <div
                  key={held.id}
                  className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase">
                          {held.orderType}
                          {held.tableNumber ? ` · ${held.tableNumber}` : ''}
                        </span>
                        {held.customerName && (
                          <span className="text-xs text-amber-400 font-medium">
                            ({held.customerName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Held at {formatTime(held.timestamp)}</span>
                        <span>·</span>
                        <span>{held.items.length} items</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                        {formatCurrency(totalAmount, settings.currencySymbol)}
                      </div>
                    </div>
                  </div>

                  {/* Summary of items */}
                  <p className="text-xs text-neutral-400 truncate">
                    {held.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-850">
                    <button
                      onClick={() => deleteHeldOrder(held.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>
                    <button
                      onClick={() => resumeHeldOrder(held.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume to Counter</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
