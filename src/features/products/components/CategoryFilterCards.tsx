'use client';

import React from 'react';
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import { FiChevronLeft, FiChevronRight, FiPackage, FiX } from 'react-icons/fi';
import { Check } from 'lucide-react';
import { Category } from '@/modelTypes/category';
import { Product } from '@/modelTypes/product';
import { Button } from '@/components/shared/button/Button';
import 'react-horizontal-scrolling-menu/dist/styles.css';

// CSS para ocultar la barra de scroll
const scrollbarHideStyles = `
  .scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .react-horizontal-scrolling-menu--wrapper {
    overflow: hidden !important;
  }
  .react-horizontal-scrolling-menu--scroll-container {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .react-horizontal-scrolling-menu--scroll-container::-webkit-scrollbar {
    display: none;
  }
`;

interface CategoryFilterCardsProps {
  categories: Category[];
  products: Product[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  filteredProductsCount: number;
}

export const CategoryFilterCards = ({
  categories,
  products,
  selectedCategory,
  onCategorySelect,
  filteredProductsCount,
}: CategoryFilterCardsProps) => {
  // Inyectar estilos CSS personalizados
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollbarHideStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const allItems = [
    {
      id: 'all',
      name: 'Todas',
      count: products.length,
      description: 'Ver todos',
      imageUrl: null,
    },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      count: products.filter((p) => p.categoryId === category.id).length,
      description: `${products.filter((p) => p.categoryId === category.id).length} ${products.filter((p) => p.categoryId === category.id).length === 1 ? 'producto' : 'productos'}`,
      imageUrl: category.imageUrl,
    })),
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl shadow-sm">
            <FiPackage className="text-cyan-600 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Filtrar por categoría
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Selecciona una categoría para filtrar los productos
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Contador de productos */}
          <div className="flex items-center gap-3 order-2 sm:order-1">
            <span className="text-sm font-medium text-gray-600">
              {filteredProductsCount}{' '}
              {filteredProductsCount === 1 ? 'producto' : 'productos'}
            </span>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Actualizado</span>
            </div>
          </div>

          {selectedCategory && (
            <Button
              onClick={() => onCategorySelect(null)}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 w-fit order-1 sm:order-2"
            >
              <FiX className="w-4 h-4" />
              Limpiar filtro
            </Button>
          )}
        </div>
      </div>

      {/* Scroll Container */}
      <div className="category-scroll-menu overflow-hidden px-1">
        <ScrollMenu
          LeftArrow={LeftArrow}
          RightArrow={RightArrow}
          itemClassName="p-2"
          wrapperClassName="scrollbar-hide "
        >
          {allItems.map((item) => (
            <CategoryCard
              key={item.id}
              itemId={item.id}
              isSelected={
                selectedCategory === (item.id === 'all' ? null : item.id)
              }
              onClick={() =>
                onCategorySelect(item.id === 'all' ? null : item.id)
              }
              imageUrl={item.imageUrl}
              name={item.name}
              count={item.count}
              description={item.description}
            />
          ))}
        </ScrollMenu>
      </div>

      {/* Summary */}
      {selectedCategory && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-center">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-50 text-cyan-700">
              Mostrando productos de &#34;
              {categories.find((c) => c.id === selectedCategory)?.name}&#34;
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface CategoryCardProps {
  itemId: string;
  isSelected: boolean;
  onClick: () => void;
  imageUrl?: string | null;
  name: string;
  count: number;
  description?: string;
}

const CategoryCard = ({
  isSelected,
  onClick,
  imageUrl,
  name,
  count,
}: CategoryCardProps) => {
  // Base classes for the card container
  const cardClasses = [
    'group relative flex-shrink-0 w-32 h-36 p-4 rounded-xl',
    'flex flex-col items-center justify-center transition-all duration-200 ',
    'hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
  ].join(' ');

  // Dynamic classes based on selection state
  const dynamicClasses = isSelected
    ? 'bg-gradient-to-br from-cyan-50 to-teal-50 shadow-md ring-2 ring-cyan-500/30 border border-cyan-200'
    : 'bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-sm';

  // Icon container classes
  const iconContainerClasses = [
    'mb-3 p-2.5 rounded-lg transition-all duration-200',
    isSelected ? 'bg-white shadow-sm' : 'bg-white group-hover:shadow-sm',
  ].join(' ');

  // Title classes
  const titleClasses = [
    'font-semibold text-xs leading-tight transition-colors duration-200 line-clamp-1',
    isSelected ? 'text-cyan-900' : 'text-gray-700',
  ].join(' ');

  // Count badge classes
  const countBadgeClasses = [
    'inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium',
    'transition-all duration-200',
    isSelected
      ? 'bg-cyan-500 text-white'
      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300',
  ].join(' ');

  // Icon classes
  const iconClasses = `w-6 h-6 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`;

  return (
    <button onClick={onClick} className={`${cardClasses} ${dynamicClasses}`}>
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 bg-cyan-500 text-white p-1 rounded-lg shadow-sm">
          <Check className="w-3 h-3" />
        </div>
      )}

      {/* Image/Icon container */}
      <div className={iconContainerClasses}>
        {imageUrl ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={imageUrl}
              alt={name}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <FiPackage className={iconClasses} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="text-center space-y-1">
        <h3 className={titleClasses}>{name}</h3>
        <div className={countBadgeClasses}>{count}</div>
      </div>
    </button>
  );
};

// Arrow components
function LeftArrow() {
  const { isFirstItemVisible, scrollPrev } =
    React.useContext(VisibilityContext);

  return (
    <button
      disabled={isFirstItemVisible}
      onClick={() => scrollPrev()}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow mr-2"
    >
      <FiChevronLeft className="w-4 h-4 text-gray-600" />
    </button>
  );
}

function RightArrow() {
  const { isLastItemVisible, scrollNext } = React.useContext(VisibilityContext);

  return (
    <button
      disabled={isLastItemVisible}
      onClick={() => scrollNext()}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow ml-2"
    >
      <FiChevronRight className="w-4 h-4 text-gray-600" />
    </button>
  );
}
