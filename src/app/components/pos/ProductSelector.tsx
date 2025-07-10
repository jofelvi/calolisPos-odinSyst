'use client';
import { Product } from '@/types/product';
import { useEffect, useState } from 'react';
import { Input } from '@/components/shared/input/input';
import { categoryService } from '@/services/firebase/genericServices';
import Image from 'next/image';
import { Category } from '@/types/category';

interface ProductSelectorProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

export default function ProductSelector({
  products,
  onAddProduct,
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  useEffect(() => {
    let result = [...products];

    if (selectedCategoryId) {
      result = result.filter(
        (product) => product.categoryId === selectedCategoryId,
      );
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lower) ||
          product.category?.toLowerCase().includes(lower),
      );
    }

    setFilteredProducts(result);
  }, [products, selectedCategoryId, searchTerm]);

  const handleCategoryClick = (
    e: React.MouseEvent,
    categoryId: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <div className="space-y-6">
      {/* Categorías visuales */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={(e: React.MouseEvent) => handleCategoryClick(e, null)}
          className={`min-w-[100px] rounded-xl overflow-hidden border text-sm px-3 py-2 font-semibold transition ${
            selectedCategoryId === null
              ? 'border-blue-600 text-blue-600 bg-blue-50'
              : 'border-gray-300 text-gray-700 bg-white'
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={(e: React.MouseEvent) =>
              handleCategoryClick(e, category.id)
            }
            className={`w-[100px] h-[100px] rounded-xl overflow-hidden border flex flex-col items-center justify-center text-xs font-medium text-center transition ${
              selectedCategoryId === category.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="w-full h-[60px] bg-gray-100">
              {category.imageUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  IMG
                </div>
              )}
            </div>
            <span className="mt-1 px-2 truncate">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Buscador */}
      <Input
        type="text"
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border-gray-300 focus:ring-2 focus:ring-blue-500"
      />

      {/* Productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onAddProduct(product)}
            className="rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-all duration-200 flex flex-col items-center p-3 border border-gray-200 hover:border-blue-500"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
              <span className="text-sm text-gray-400">IMG</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">{product.name}</p>
              <p className="text-sm text-gray-500">
                ${product.price.toFixed(2)}
              </p>
              {product.category && (
                <span className="text-xs text-gray-400 mt-1 block">
                  {product.category}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
