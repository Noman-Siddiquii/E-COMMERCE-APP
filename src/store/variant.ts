"use client";

import { create } from "zustand";

export type VariantState = {
  selectedByProduct: Record<string, number>;
  setSelected: (productId: string, index: number) => void;
  getSelected: (productId: string, fallback?: number) => number;
};

export const useVariantStore = create<VariantState>((set, get) => ({
  selectedByProduct: {},
  setSelected: (productId, index) =>
    set((s) => ({
      selectedByProduct: { ...s.selectedByProduct, [productId]: index },
    })),
  getSelected: (productId, fallback = 0) => {
    const map = get().selectedByProduct;
    return map[productId] ?? fallback;
  },
}));
