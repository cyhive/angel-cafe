import React from 'react';
import { useBilling } from '../context/BillingContext';
import { Volume2, VolumeX, Clock, PauseCircle, ShoppingBag, Menu, X, LogOut } from 'lucide-react';
import { ActiveTab } from '../types';

export const Header: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const {
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    heldOrders,
    setIsHoldModalOpen,
    cart,
    todayStats,
  } = useBilling();

  const [currentTime, setCurrentTime] = React.useState<string>('');
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Close the mobile menu on Escape
  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  const goToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const navLinks: { id: ActiveTab; label: string; badge?: number }[] = [
    { id: 'pos', label: 'POS Billing' },
    { id: 'kds', label: 'Kitchen KDS' },
    { id: 'history', label: 'Past Bills' },
    { id: 'analytics', label: 'Shift Sales' },
    { id: 'menu', label: 'Menu & Stock' },
  ];

  return (
    <header className="relative flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-6 py-2.5 md:py-3 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => goToTab('pos')}
          className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity"
        >
          <img
            src="/brand/angel-cafe-logo.png"
            alt=""
            className="w-8 h-8 md:w-9 md:h-9 rounded-full shrink-0"
          />
          <span className="truncate">{settings.cafeName}</span>
        </button>
        <span className="hidden lg:inline-block whitespace-nowrap text-xs font-mono text-neutral-500 tabular-nums border-l border-neutral-800 pl-3">
          <Clock className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
          {currentTime}
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 lg:gap-2">
        {navLinks.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => goToTab(item.id)}
              className={`shrink-0 px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors rounded-lg whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-neutral-800 px-2.5 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-white" title="Sign out">
          <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span>
        </button>
        {/* Held Orders Quick Access */}
        {heldOrders.length > 0 && (
          <button
            onClick={() => setIsHoldModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-700/50 rounded-lg hover:bg-amber-900/60 transition-colors"
            title="View Held Orders"
          >
            <PauseCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Held Bills</span>
            <span className="w-4 h-4 rounded-full bg-amber-500 text-neutral-950 font-bold text-[10px] flex items-center justify-center">
              {heldOrders.length}
            </span>
          </button>
        )}

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => updateSettings({ enableSound: !settings.enableSound })}
          className={`p-2 rounded-lg text-xs transition-colors border ${
            settings.enableSound
              ? 'text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              : 'text-neutral-500 border-neutral-800 bg-neutral-900'
          }`}
          title={settings.enableSound ? 'Mute Audio Chimes' : 'Unmute Audio Chimes'}
        >
          {settings.enableSound ? (
            <Volume2 className="w-4 h-4 text-amber-400" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Cart Item Indicator for smaller screens */}
        {activeTab === 'pos' && cart.length > 0 && (
          <div className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 rounded-lg text-xs font-medium text-white border border-neutral-700">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums font-mono">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileNavOpen((open) => !open)}
          className="md:hidden flex items-center gap-2 px-2.5 py-2 rounded-lg border border-neutral-800 text-neutral-200 hover:bg-neutral-800 transition-colors"
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileNavOpen}
        >
          <span className="hidden min-[400px]:inline text-xs font-medium text-amber-400">
            {navLinks.find((l) => l.id === activeTab)?.label}
          </span>
          {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileNavOpen && (
        <>
          <div
            className="md:hidden absolute top-full left-0 right-0 h-screen bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <nav className="md:hidden absolute top-full left-0 right-0 bg-neutral-900 border-b border-neutral-800 shadow-2xl p-2 flex flex-col gap-1">
            {navLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goToTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="px-4 pt-2 pb-1 mt-1 border-t border-neutral-800 text-xs font-mono text-neutral-500 tabular-nums">
              <Clock className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
              {currentTime}
            </div>
          </nav>
        </>
      )}
    </header>
  );
};
