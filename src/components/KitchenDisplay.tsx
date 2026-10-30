import React, { useState, useEffect } from 'react';
import { useBilling } from '../context/BillingContext';
import { getElapsedTimeMinutes, formatTime } from '../utils/format';
import { OrderStatus } from '../types';
import {
  Clock,
  CheckCircle,
  ChefHat,
  Utensils,
  ShoppingBag,
  Bike,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const { bills, updateOrderStatus } = useBilling();
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [, setTick] = useState(0);

  // Re-render every 30 seconds to update live minute counters
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const activeBills = bills.filter(
    (b) => filter === 'all' || (b.status === 'preparing' || b.status === 'ready')
  );

  const preparingCount = bills.filter((b) => b.status === 'preparing').length;
  const readyCount = bills.filter((b) => b.status === 'ready').length;

  return (
    <div className="w-full min-w-0 p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Kitchen Display Screen (KDS)</h1>
            <p className="text-xs text-neutral-400">
              Live order queue for the kitchen and juice counter
            </p>
          </div>
        </div>

        {/* Filter Controls & Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 text-xs">
            <span className="text-neutral-400">
              Cooking:{' '}
              <strong className="text-amber-400 font-mono font-bold tabular-nums">
                {preparingCount}
              </strong>
            </span>
            <span aria-hidden="true" className="text-neutral-600">
              ·
            </span>
            <span className="text-neutral-400">
              Ready for Pickup:{' '}
              <strong className="text-emerald-400 font-mono font-bold tabular-nums">
                {readyCount}
              </strong>
            </span>
          </div>

          <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                filter === 'active'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Active ({preparingCount + readyCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                filter === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Recent
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {activeBills.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-neutral-850">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-semibold text-white">All Kitchen Orders Cleared!</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            New orders from the billing counter will appear here immediately with cooking
            instructions and timer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeBills.map((bill) => {
            const elapsed = getElapsedTimeMinutes(bill.createdAt);
            const isDelayed = elapsed >= 12;

            return (
              <div
                key={bill.id}
                className={`flex flex-col justify-between bg-neutral-900 rounded-2xl border overflow-hidden transition-all ${
                  bill.status === 'ready'
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : isDelayed
                    ? 'border-rose-500/50 shadow-lg shadow-rose-950/30'
                    : 'border-neutral-800'
                }`}
              >
                {/* Ticket Top Header */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between ${
                    bill.status === 'ready'
                      ? 'bg-emerald-950/40 border-emerald-900/60'
                      : isDelayed
                      ? 'bg-rose-950/40 border-rose-900/60'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black font-mono text-white tabular-nums">
                      T-{bill.tokenNumber}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      #{bill.orderNumber}
                    </span>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
                      bill.status === 'ready'
                        ? 'text-emerald-400 bg-emerald-900/30'
                        : isDelayed
                        ? 'text-rose-400 bg-rose-900/40 animate-pulse'
                        : 'text-amber-400 bg-neutral-850'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsed}m</span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="px-3.5 py-2 bg-neutral-850/40 border-b border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-semibold text-neutral-300 uppercase">
                    {bill.orderType}
                    {bill.tableNumber ? ` · ${bill.tableNumber}` : ''}
                  </span>
                  <span>{formatTime(bill.createdAt)}</span>
                </div>

                {/* Items Ticket Body */}
                <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-64">
                  {bill.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="pb-2 border-b border-neutral-800/60 last:border-b-0 space-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-white leading-tight">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold font-mono text-amber-400 px-1.5 py-0.5 rounded bg-neutral-800 tabular-nums">
                          x{item.quantity}
                        </span>
                      </div>

                      {item.includes?.map((part) => (
                        <div key={part} className="text-[11px] text-neutral-300 pl-1">
                          ↳ {part}
                        </div>
                      ))}

                      {item.selectedChoice && (
                        <div className="text-[11px] text-amber-300 font-medium pl-1">
                          ↳ {item.selectedChoice.name}
                        </div>
                      )}

                      {item.note && (
                        <div className="text-[10px] text-amber-200/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded inline-block font-medium">
                          Note: {item.note}
                        </div>
                      )}
                    </div>
                  ))}

                  {bill.notes && (
                    <div className="p-2 rounded bg-neutral-850 text-[11px] text-amber-400 italic">
                      Special Order Note: {bill.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons for Kitchen */}
                <div className="p-3 bg-neutral-950 border-t border-neutral-800">
                  {bill.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(bill.id, 'ready')}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                      <span>Ready to Serve</span>
                    </button>
                  )}

                  {bill.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(bill.id, 'completed')}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                      <span>Complete & Handover</span>
                    </button>
                  )}

                  {bill.status === 'completed' && (
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Order Completed
                      </span>
                      <button
                        onClick={() => updateOrderStatus(bill.id, 'preparing')}
                        className="text-[10px] text-neutral-500 hover:text-white underline"
                      >
                        Re-open
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
