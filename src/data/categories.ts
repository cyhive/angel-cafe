// Menu sections used by the Angel Cafe POS.
// Shared by the POS UI and menu validation in the API.
export const MENU_CATEGORIES = [
  { id: 'combos', label: 'Combo Offers', icon: '🎁', color: 'text-rose-400' },
  { id: 'lime', label: 'Lime', icon: '🍋', color: 'text-lime-400' },
  { id: 'juice', label: 'Fresh Juice', icon: '🍊', color: 'text-orange-400' },
  { id: 'mojito', label: 'Mojitos', icon: '🌿', color: 'text-emerald-400' },
  { id: 'mocktail', label: 'Mocktails', icon: '🍹', color: 'text-pink-400' },
  { id: 'falooda', label: 'Falooda & Salad', icon: '🍨', color: 'text-rose-400' },
  { id: 'sharjah', label: 'Sharjah', icon: '🥤', color: 'text-fuchsia-400' },
  { id: 'shake', label: 'Shakes', icon: '🥛', color: 'text-yellow-300' },
  { id: 'bubble-tea', label: 'Bubble Tea', icon: '🧋', color: 'text-purple-400' },
  { id: 'tea', label: 'Special Tea & Coffee', icon: '☕', color: 'text-amber-300' },
  { id: 'snacks', label: 'Snacks', icon: '🍗', color: 'text-orange-300' },
  { id: 'burgers', label: 'Burgers & Wraps', icon: '🍔', color: 'text-amber-400' },
] as const;

export type MenuCategoryId = (typeof MENU_CATEGORIES)[number]['id'];

export const getCategory = (id: string) => MENU_CATEGORIES.find((c) => c.id === id);
