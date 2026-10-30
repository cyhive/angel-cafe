import type { CafeSettings } from '../types/index.js';

// Fallback display values used until store settings are configured in MongoDB.
export const INITIAL_CAFE_SETTINGS: CafeSettings = {
  cafeName: 'Angel Cafe',
  tagline: '',
  address: '',
  phone: '',
  gstin: '',
  upiId: '',
  taxPercent: 0,
  currencySymbol: '₹',
  enableSound: true,
  receiptFooterMessage: 'Thank you for visiting Angel Cafe!',
};
