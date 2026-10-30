/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BillingProvider, useBilling } from './context/BillingContext';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { MenuCard } from './components/MenuCard';
import { CartSidebar } from './components/CartSidebar';
import { CustomizeItemModal } from './components/CustomizeItemModal';
import { PaymentModal } from './components/PaymentModal';
import { ThermalReceipt } from './components/ThermalReceipt';
import { HoldOrdersModal } from './components/HoldOrdersModal';
import { KitchenDisplay } from './components/KitchenDisplay';
import { PastBills } from './components/PastBills';
import { SalesReports } from './components/SalesReports';
import { MenuManagerModal } from './components/MenuManagerModal';
import { LoginPage } from './components/LoginPage';
import { ItemCategory } from './types';
import { MENU_CATEGORIES } from './data/categories';
import { ArrowRight, Loader2, RefreshCw } from 'lucide-react';

const POSMainView: React.FC = () => {
  const {
    menuItems,
    customizingItem,
    setCustomizingItem,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    activeBillForReceipt,
    setActiveBillForReceipt,
    settings,
    cart,
    subtotal,
  } = useBilling();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Compute category counts
  const counts = useMemo(() => {
    const res = { all: menuItems.length } as Record<ItemCategory, number>;
    MENU_CATEGORIES.forEach((cat) => {
      res[cat.id] = 0;
    });
    menuItems.forEach((item) => {
      if (res[item.category] !== undefined) {
        res[item.category]++;
      }
    });
    return res;
  }, [menuItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-[calc(100vh-61px)]">
      {/* Left Menu Section */}
      <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 overflow-y-auto space-y-4">
        {/* Category Navigation & Search */}
        <CategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <p className="text-base font-semibold text-neutral-400">No menu items found</p>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your search query or pick a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-4 pb-24 lg:pb-6">
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Right Desktop Cart Sidebar */}
      <div className="hidden lg:block">
        <CartSidebar />
      </div>

      {/* Mobile Sticky Cart Trigger Floating Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-md z-30">
        <button
          onClick={() => setMobileCartOpen(true)}
          className="w-full flex items-center justify-between p-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl font-bold text-sm shadow-xl active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-950 text-amber-400 text-xs flex items-center justify-center font-mono">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </div>
            <span>View Current Bill</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums font-bold">
              {settings.currencySymbol}
              {subtotal.toFixed(2)}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </button>
      </div>

      {/* Mobile Cart Drawer Modal */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-h-[90vh] bg-neutral-900 rounded-t-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-neutral-950 flex items-center justify-between border-b border-neutral-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Current Bill
              </span>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="text-xs font-semibold text-neutral-400 hover:text-white px-2 py-1"
              >
                Close ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <CartSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Customize Item Modal */}
      <CustomizeItemModal
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      {/* Thermal Receipt Preview & Printing */}
      <ThermalReceipt
        bill={activeBillForReceipt}
        settings={settings}
        onClose={() => setActiveBillForReceipt(null)}
      />

      {/* Held Orders Modal */}
      <HoldOrdersModal />
    </div>
  );
};

const LoadingScreen: React.FC = () => {
  const { loadState, loadError, reloadData } = useBilling();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <img src="/brand/angel-cafe-logo.png" alt="Angel Cafe" className="w-24 h-24 rounded-full" />
      {loadState === 'loading' ? (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Loading menu…</span>
        </div>
      ) : (
        <div className="space-y-3 max-w-sm">
          <p className="text-sm font-semibold text-rose-300">Could not connect to the server</p>
          <p className="text-xs text-neutral-500 break-words">{loadError}</p>
          <button
            onClick={reloadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab, activeBillForReceipt, setActiveBillForReceipt, settings, loadState } =
    useBilling();

  if (loadState !== 'ready') {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans overflow-x-clip">
      <Header onLogout={() => window.dispatchEvent(new Event('nu-cafe-logout'))} />

      <main className="flex-1 flex flex-col">
        {activeTab === 'pos' && <POSMainView />}
        {activeTab === 'kds' && <KitchenDisplay />}
        {activeTab === 'history' && <PastBills />}
        {activeTab === 'analytics' && <SalesReports />}
        {activeTab === 'menu' && <MenuManagerModal />}
      </main>

      {/* Thermal Receipt modal rendered globally if active */}
      {activeTab !== 'pos' && activeBillForReceipt && (
        <ThermalReceipt
          bill={activeBillForReceipt}
          settings={settings}
          onClose={() => setActiveBillForReceipt(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const checkSession = React.useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setAuthState(data.authenticated ? 'authenticated' : 'unauthenticated');
    } catch {
      setAuthError('Unable to connect to the login service. Please try again.');
      setAuthState('unauthenticated');
    }
  }, []);

  React.useEffect(() => {
    void checkSession();
    const logout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthError(null);
      setAuthState('unauthenticated');
    };
    window.addEventListener('nu-cafe-logout', logout);
    return () => window.removeEventListener('nu-cafe-logout', logout);
  }, [checkSession]);

  const login = async (username: string, password: string) => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not sign in');
      setAuthState('authenticated');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in');
    } finally {
      setAuthBusy(false);
    }
  };

  if (authState === 'checking') {
    return <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center text-sm">Checking your session…</div>;
  }
  if (authState !== 'authenticated') return <LoginPage onLogin={login} error={authError} busy={authBusy} />;
  return <BillingProvider><AppContent /></BillingProvider>;
}
