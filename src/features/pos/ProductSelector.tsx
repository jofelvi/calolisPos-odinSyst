'use client';
import { Product } from '@/modelTypes/product';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/shared/input/input';
import { categoryService } from '@/services/firebase/genericServices';
import Image from 'next/image';
import { Category } from '@/modelTypes/category';
import { ChevronLeft, ChevronRight, Package, Search, Settings } from 'lucide-react';
import { Button } from '@/components/shared/button/Button';
import ProductCustomizationModal from './ProductCustomizationModal';
import { ProductCustomization } from '@/modelTypes/orderItem';

interface ProductSelectorProps {
  products: Product[];
  onAddProductAction: (product: Product, customization?: ProductCustomization) => void;
}

export default function ProductSelector({
  products,
  onAddProductAction,
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<Product | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      const allCategories = await categoryService.getAll();
      // Filter only categories that are for sale
      const categoriesForSale = allCategories.filter(
        (category) => category.isForSale === true,
      );
      setCategories(categoriesForSale);
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    let result = [...products];

    // Filter only products that are for sale
    result = result.filter((product) => product.isForSale === true);

    if (selectedCategoryId) {
      result = result.filter(
        (product) => product.categoryId === selectedCategoryId,
      );
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((product) => {
        const productNameMatch = product.name.toLowerCase().includes(lower);
        const categoryMatch =
          categories
            .find((cat) => cat.id === product.categoryId)
            ?.name.toLowerCase()
            .includes(lower) || false;
        const descriptionMatch =
          product.description?.toLowerCase().includes(lower) || false;

        return productNameMatch || categoryMatch || descriptionMatch;
      });
    }

    setFilteredProducts(result);
  }, [products, selectedCategoryId, searchTerm, categories]);

  // Función para verificar si necesita scroll
  const checkScrollButtons = () => {
    if (categoriesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        categoriesScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // Función para scroll hacia la izquierda
  const scrollLeft = () => {
    if (categoriesScrollRef.current) {
      categoriesScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  // Función para scroll hacia la derecha
  const scrollRight = () => {
    if (categoriesScrollRef.current) {
      categoriesScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // useEffect para comprobar scroll cuando cambien las categorías
  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);

  const handleCategoryClick = (
    e: React.MouseEvent,
    categoryId: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleProductClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    onAddProductAction(product);
  };

  const handleCustomizeClick = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProductForCustomization(product);
    setShowCustomizationModal(true);
  };

  const handleCustomizationConfirm = (customization: ProductCustomization) => {
    if (selectedProductForCustomization) {
      onAddProductAction(selectedProductForCustomization, customization);
    }
    setShowCustomizationModal(false);
    setSelectedProductForCustomization(null);
  };

  const handleCustomizationClose = () => {
    setShowCustomizationModal(false);
    setSelectedProductForCustomization(null);
  };

  // Verificar si un producto puede ser personalizado
  const canBeCustomized = (product: Product): boolean => {
    return Boolean(product.ingredients && product.ingredients.length > 0);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header con título */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
          Seleccionar Productos
        </h1>
        <div className="text-sm text-cyan-600">
          {filteredProducts.length}{' '}
          {filteredProducts.length === 1 ? 'producto' : 'productos'}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500/30 bg-white/90 backdrop-blur-sm"
        />
      </div>

      {/* Categorías con slider */}
      <div className="relative">
        <h3 className="text-lg font-semibold text-cyan-800 mb-4">Categorías</h3>
        <div className="relative">
          {/* Botón scroll izquierda */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full border border-cyan-200 flex items-center justify-center text-cyan-600 hover:bg-cyan-50 transition-all shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Contenedor de categorías con scroll */}
          <div
            ref={categoriesScrollRef}
            onScroll={checkScrollButtons}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Botón "Todas" */}
            <button
              onClick={(e: React.MouseEvent) => handleCategoryClick(e, null)}
              className={`flex-shrink-0 w-[120px] h-[100px] rounded-2xl overflow-hidden border-2 text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center shadow-sm hover:shadow-lg transform hover:scale-105 ${
                selectedCategoryId === null
                  ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50 text-cyan-700 shadow-cyan-200'
                  : 'border-gray-200 bg-white/90 backdrop-blur-sm text-gray-700 hover:border-cyan-300'
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span>Todas</span>
            </button>

            {/* Categorías */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={(e: React.MouseEvent) =>
                  handleCategoryClick(e, category.id)
                }
                className={`flex-shrink-0 w-[120px] h-[100px] rounded-2xl overflow-hidden border-2 text-xs font-medium text-center transition-all duration-200 flex flex-col items-center justify-center shadow-sm hover:shadow-lg transform hover:scale-105 ${
                  selectedCategoryId === category.id
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-cyan-200'
                    : 'border-gray-200 bg-white/90 backdrop-blur-sm hover:border-cyan-300'
                }`}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl mb-2 overflow-hidden">
                  {category.imageUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <span
                  className={`px-2 truncate ${selectedCategoryId === category.id ? 'text-cyan-700' : 'text-gray-700'}`}
                >
                  {category.name}
                </span>
              </button>
            ))}
          </div>

          {/* Botón scroll derecha */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full border border-cyan-200 flex items-center justify-center text-cyan-600 hover:bg-cyan-50 transition-all shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="flex-1 overflow-auto">
        <h3 className="text-lg font-semibold text-cyan-800 mb-4">
          {selectedCategoryId
            ? `Productos - ${categories.find((c) => c.id === selectedCategoryId)?.name}`
            : 'Todos los Productos'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="relative rounded-2xl overflow-hidden shadow-sm bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-200 border border-cyan-100 hover:border-cyan-300 transform hover:scale-105 hover:-translate-y-1 group"
            >
              {/* Indicador de personalizable */}
              {canBeCustomized(product) && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <Settings className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {/* Imagen y info del producto */}
              <div className="p-4 pb-2">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-xl mb-3 overflow-hidden mx-auto">
                  {product.imageUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-cyan-500" />
                    </div>
                  )}
                </div>
                <div className="text-center w-full">
                  <p className="font-semibold text-cyan-900 text-sm mb-1 truncate">
                    {product.name}
                  </p>
                  <p className="text-lg font-bold text-cyan-700">
                    ${product.price.toFixed(2)}
                  </p>
                  {product.category && (
                    <span className="text-xs text-cyan-500 mt-1 block truncate">
                      {product.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="px-4 pb-4 space-y-2">
                <Button
                  type="button"
                  onClick={(e) => handleProductClick(e, product)}
                  className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-sm py-2"
                  size="sm"
                >
                  Agregar
                </Button>

                {canBeCustomized(product) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleCustomizeClick(e, product)}
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 text-sm py-2 flex items-center justify-center gap-2"
                    size="sm"
                  >
                    <Settings className="w-3 h-3" />
                    Personalizar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="text-lg font-medium text-cyan-800 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-cyan-600">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'No hay productos en esta categoría'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de personalización */}
      {selectedProductForCustomization && (
        <ProductCustomizationModal
          isOpen={showCustomizationModal}
          onClose={handleCustomizationClose}
          product={selectedProductForCustomization}
          onConfirm={handleCustomizationConfirm}
        />
      )}
    </div>
  );
}
