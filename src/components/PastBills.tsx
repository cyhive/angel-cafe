import React, { useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Bill } from '../types';
import {
  Search,
  Printer,
  Receipt,
  FileText,
  Calendar,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Split,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';

export const PastBills: React.FC = () => {
  const { bills, setActiveBillForReceipt, settings, updateBill, deleteBill } = useBilling();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editCustomer, setEditCustomer] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<Bill['items']>([]);
  const beginEdit = (bill: Bill) => {
    setEditingBill(bill);
    setEditDate(new Date(bill.createdAt).toLocaleDateString('en-CA'));
    setEditCustomer(bill.customerName || ''); setEditPhone(bill.customerPhone || ''); setEditNotes(bill.notes || '');
    setEditItems(bill.items.map((item) => ({ ...item })));
  };

  const filteredBills = bills.filter((bill) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      bill.orderNumber.toString().includes(q) ||
      bill.tokenNumber.toString().includes(q) ||
      (bill.customerName && bill.customerName.toLowerCase().includes(q)) ||
      (bill.customerPhone && bill.customerPhone.includes(q)) ||
      (bill.tableNumber && bill.tableNumber.toLowerCase().includes(q)) ||
      bill.items.some((item) => item.name.toLowerCase().includes(q));

    const matchesType = filterType === 'all' || bill.orderType === filterType;
    return matchesQuery && matchesType;
  });

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Banknote className="w-3.5 h-3.5" /> Cash
          </span>
        );
      case 'card':
        return (
          <span className="flex items-center gap-1 text-blue-400 font-medium">
            <CreditCard className="w-3.5 h-3.5" /> Card
          </span>
        );
      case 'upi':
        return (
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <QrCode className="w-3.5 h-3.5" /> UPI
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-purple-400 font-medium">
            <Split className="w-3.5 h-3.5" /> Split
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-lg font-bold text-white">Billing History & Receipts</h1>
          <p className="text-xs text-neutral-400">
            View, search, audit and re-print receipts from current and past shifts
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span>Total Records:</span>
          <span className="text-white font-bold">{bills.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Bill #, Token #, Customer, Table or Item..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs shrink-0">
          {['all', 'dine-in', 'takeaway', 'delivery'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-medium ${
                filterType === type
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/70 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Token & Bill #</th>
                <th className="hidden md:table-cell py-3 px-4">Date / Time</th>
                <th className="hidden sm:table-cell py-3 px-4">Type / Table</th>
                <th className="hidden lg:table-cell py-3 px-4">Customer</th>
                <th className="hidden lg:table-cell py-3 px-4">Items Summary</th>
                <th className="hidden sm:table-cell py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 font-sans">
                    No matching billing records found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-neutral-850/50 transition-colors group text-neutral-300"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-amber-400 text-sm">
                        T-{bill.tokenNumber}
                      </span>
                      <span className="text-neutral-500 ml-1.5">#{bill.orderNumber}</span>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4 whitespace-nowrap text-neutral-400 font-sans">
                      {formatDateTime(bill.createdAt)}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 whitespace-nowrap font-sans">
                      <span className="capitalize font-medium text-white">{bill.orderType}</span>
                      {bill.tableNumber && (
                        <span className="text-neutral-500 ml-1">({bill.tableNumber})</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell py-3 px-4 whitespace-nowrap font-sans">
                      {bill.customerName ? (
                        <div>
                          <span className="text-white font-medium">{bill.customerName}</span>
                          {bill.customerPhone && (
                            <span className="text-neutral-500 text-[10px] block font-mono">
                              {bill.customerPhone}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell py-3 px-4 max-w-xs truncate font-sans text-neutral-300">
                      {bill.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 whitespace-nowrap font-sans">
                      {getPaymentBadge(bill.paymentMethod)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-white text-sm tabular-nums">
                      {formatCurrency(bill.total, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setActiveBillForReceipt(bill)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-300 rounded-lg transition-colors font-sans text-xs font-semibold"
                        title="View & Re-print Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                      <button onClick={() => beginEdit(bill)} className="ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-blue-500 hover:text-neutral-950 text-neutral-300 rounded-lg font-sans text-xs font-semibold" title="Edit bill"><Pencil className="w-3.5 h-3.5"/><span>Edit</span></button>
                      <button onClick={async () => { if (window.confirm(`Delete bill #${bill.orderNumber}?`)) { try { await deleteBill(bill.id); } catch (e) { alert(e instanceof Error ? e.message : 'Could not delete bill'); } } }} className="ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-rose-600 text-neutral-300 rounded-lg font-sans text-xs font-semibold" title="Delete bill"><Trash2 className="w-3.5 h-3.5"/><span>Delete</span></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editingBill && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingBill(null); }}>
        <form className="w-full max-w-md rounded-2xl border border-neutral-700 bg-neutral-900 p-5 space-y-4 max-h-[90vh] overflow-y-auto" onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { const subtotal=editItems.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0); const discountAmount=editingBill.discountType==='percentage'?subtotal*Math.min(100,Math.max(0,editingBill.discountValue))/100:Math.min(subtotal,Math.max(0,editingBill.discountValue)); const taxAmount=Math.max(0,subtotal-discountAmount)*editingBill.taxPercent/100; await updateBill({...editingBill, items:editItems, subtotal, discountAmount, taxAmount, total:Math.max(0,subtotal-discountAmount+taxAmount), createdAt:new Date(`${editDate}T12:00:00`).toISOString(), customerName:editCustomer.trim() || undefined, customerPhone:editPhone.trim() || undefined, notes:editNotes.trim() || undefined}); setEditingBill(null); } catch(err) { alert(err instanceof Error ? err.message : 'Could not update bill'); } finally { setSaving(false); } }}>
          <h2 className="text-white font-bold">Edit bill #{editingBill.orderNumber}</h2>
          <label className="block text-xs text-neutral-400">Bill date<input type="date" required value={editDate} onChange={e=>setEditDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"/></label>
          <div className="space-y-2"><p className="text-xs text-neutral-400">Items and quantities</p>{editItems.map((item,index)=><div key={item.cartItemId} className="flex items-center justify-between gap-3 text-sm"><span className="text-neutral-200">{item.name} · {formatCurrency(item.unitPrice,settings.currencySymbol)}</span><input aria-label={`Quantity for ${item.name}`} type="number" min="1" step="1" value={item.quantity} onChange={e=>setEditItems(prev=>prev.map((line,i)=>i===index?{...line,quantity:Math.max(1,Number(e.target.value)||1)}:line))} className="w-20 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-right text-white"/></div>)}</div>
          <label className="block text-xs text-neutral-400">Customer name<input value={editCustomer} onChange={e=>setEditCustomer(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"/></label>
          <label className="block text-xs text-neutral-400">Phone<input value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"/></label>
          <label className="block text-xs text-neutral-400">Notes<input value={editNotes} onChange={e=>setEditNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-white"/></label>
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setEditingBill(null)} className="rounded-lg px-3 py-2 text-sm text-neutral-300">Cancel</button><button disabled={saving} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-neutral-950">{saving?'Saving…':'Save changes'}</button></div>
        </form>
      </div>}
    </div>
  );
};
