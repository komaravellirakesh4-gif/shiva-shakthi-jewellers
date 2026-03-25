
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Purity = '24K' | 'Silver';
export type Language = 'en' | 'hi' | 'te';

export interface GoldPriceEntry {
  purity: Purity;
  livePrice: number;
  adminPrice: number;
  lastUpdated: string;
}

export interface CalculationResult {
  id: string;
  billNumber: string;
  timestamp: string;
  weight: number;
  purity: Purity;
  itemName: string;
  rate: number;
  ornamentValue?: number;
  makingCharges: number;
  kdmCharges?: number;
  wastageGrams: number;
  wastageCost: number;
  gstAmount: number;
  stonePrice: number;
  discount: number;
  finalTotal: number;
  amountPaid?: number;
  balance?: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  remarks?: string;
  oldWeight?: number;
  oldItemName?: string;
  oldItemValue?: number;
  oldRate?: number;
  meltingLoss?: number;
}

interface GoldStore {
  prices: Record<Purity, GoldPriceEntry>;
  language: Language;
  nextBillNumber: number;
  showCursorEffect: boolean;
  settings: {
    gstPercent: number;
    wastageDefaultPercent: number;
    makingChargeDefaultPerGram: number;
    shopName: string;
    adminProfilePicUrl?: string;
  };
  updatePrice: (purity: Purity, livePrice: number, adminPrice: number) => void;
  updateSettings: (settings: Partial<GoldStore['settings']>) => void;
  setLanguage: (lang: Language) => void;
  setCursorEffect: (show: boolean) => void;
  incrementBillNumber: () => void;
}

export const useGoldStore = create<GoldStore>()(
  persist(
    (set) => ({
      prices: {
        '24K': { purity: '24K', livePrice: 0, adminPrice: 0, lastUpdated: '' },
        'Silver': { purity: 'Silver', livePrice: 0, adminPrice: 0, lastUpdated: '' },
      },
      language: 'en',
      nextBillNumber: 1,
      showCursorEffect: true,
      settings: {
        gstPercent: 3,
        wastageDefaultPercent: 2,
        makingChargeDefaultPerGram: 0,
        shopName: 'SHIVA SHAKTHI Jewellers',
        adminProfilePicUrl: '',
      },
      updatePrice: (purity, livePrice, adminPrice) =>
        set((state) => ({
          prices: {
            ...state.prices,
            [purity]: {
              purity,
              livePrice,
              adminPrice,
              lastUpdated: new Date().toISOString(),
            },
          },
        })),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setLanguage: (language) => set({ language }),
      setCursorEffect: (showCursorEffect) => set({ showCursorEffect }),
      incrementBillNumber: () => set((state) => ({ nextBillNumber: state.nextBillNumber + 1 })),
    }),
    {
      name: 'shiva-shakthi-gold-store-v4',
    }
  )
);
