import { create } from 'zustand';

export interface ProductFiltersState {
  selectedCategory: string | null;
  stockFilter: 'all' | 'outOfStock' | 'lowStock';
  setSelectedCategory: (categoryId: string | null) => void;
  setStockFilter: (filter: 'all' | 'outOfStock' | 'lowStock') => void;
  clearFilters: () => void;
}

export const useProductFiltersStore = create<ProductFiltersState>((set) => ({
  selectedCategory: null,
  stockFilter: 'all',
  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
  setStockFilter: (filter) => set({ stockFilter: filter }),
  clearFilters: () => set({ selectedCategory: null, stockFilter: 'all' }),
}));
