'use client';

import React from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import { Button } from '@/components/shared/button/Button';
import SelectCustom from '@/shared/ui/selectCustom/SelectCustom';

interface StockFiltersProps {
  stockFilter: 'all' | 'outOfStock' | 'lowStock';
  selectedCategory: string | null;
  onStockFilterChange: (filter: 'all' | 'outOfStock' | 'lowStock') => void;
  onClearFilters: () => void;
}

export const StockFilters = ({
  stockFilter,
  selectedCategory,
  onStockFilterChange,
  onClearFilters,
}: StockFiltersProps) => {
  const stockFilterOptions = [
    { value: 'all', label: 'Todos los productos' },
    { value: 'outOfStock', label: 'Sin stock' },
    { value: 'lowStock', label: 'Bajo stock' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
              <FiFilter className="text-gray-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                Filtros de stock
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Filtra productos por disponibilidad
              </p>
            </div>
          </div>
          {(selectedCategory || stockFilter !== 'all') && (
            <Button
              onClick={onClearFilters}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-fit"
            >
              <FiX className="w-4 h-4" />
              Limpiar todos
            </Button>
          )}
        </div>

        <div className="w-full lg:w-80 xl:w-96">
          <SelectCustom
            id="stock-filter"
            options={stockFilterOptions}
            value={stockFilter}
            onChange={(value) =>
              onStockFilterChange(value as 'all' | 'outOfStock' | 'lowStock')
            }
            placeholder="Filtrar por stock..."
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
