// app/products/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPackage, FiPlus } from 'react-icons/fi';
import {
  categoryService,
  productService,
} from '@/services/firebase/genericServices';
import { Product } from '@/modelTypes/product';
import { DeleteConfirmationModal } from '@/features/categories/DeleteConfirmationModal';
import { Button } from '@/components/shared/button/Button';
import { EntityGrid } from '@/components/shared/EntityGrid/EntityGrid';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { Category } from '@/modelTypes/category';
import '@/features/products/producs.css';
import { OrderGridSkeleton } from '@/features/purchaseOrders/order-skeleton';
import { PRIVATE_ROUTES } from '@/constants/routes';
import { useProductFiltersStore } from '@/shared/store/useProductFiltersStore';
import { CategoryFilterCards } from '@/features/products/components/CategoryFilterCards';
import { StockFilters } from '@/features/products/components/StockFilters';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Zustand store para filtros
  const {
    selectedCategory,
    stockFilter,
    setSelectedCategory,
    setStockFilter,
    clearFilters,
  } = useProductFiltersStore();

  // Cargar productos y categorías
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch {
        // Error loading data - features will show empty state
        // Consider implementing a retry mechanism or user notification
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  // Filtrar productos por categoría y stock
  const filteredProducts = products.filter((product) => {
    // Filtro por categoría
    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;

    // Filtro por stock
    let matchesStock = true;
    if (stockFilter === 'outOfStock') {
      matchesStock = product.stock === 0;
    } else if (stockFilter === 'lowStock') {
      const minStock = product.minStock || 5; // Default mínimo de 5 si no está definido
      matchesStock = product.stock > 0 && product.stock <= minStock;
    }
    // 'all' no aplica ningún filtro de stock

    return matchesCategory && matchesStock;
  });

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      setDeleting(true);
      try {
        await productService.delete(productToDelete.id);
        setProducts(products.filter((p) => p.id !== productToDelete.id));
        setDeleteModalOpen(false);
      } catch {
        // Error deleting product - consider showing user feedback
        // The delete modal will remain open for user to retry
      } finally {
        setDeleting(false);
        setProductToDelete(null);
      }
    }
  };

  if (loading) {
    return <OrderGridSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={`¿Eliminar producto ${productToDelete?.name}?`}
        description="Esta acción no se puede deshacer. Todos los datos relacionados con este producto se perderán permanentemente."
        isLoading={deleting}
      />

      <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Productos
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Gestiona el inventario de tu negocio de forma eficiente
              </p>
            </div>
            <Link href={PRIVATE_ROUTES.PRODUCTS_NEW}>
              <Button
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 w-full lg:w-auto"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Nuevo Producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros de stock */}
        <StockFilters
          stockFilter={stockFilter}
          selectedCategory={selectedCategory}
          onStockFilterChange={setStockFilter}
          onClearFilters={clearFilters}
        />

        {/* Filtro de categorías */}
        <CategoryFilterCards
          categories={categories}
          products={products}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          filteredProductsCount={filteredProducts.length}
        />

        {/* Products Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <EntityGrid<Product>
            items={filteredProducts}
            getDetailPath={(id) => PRIVATE_ROUTES.PRODUCTS_DETAILS(id)}
            imageKey="imageUrl"
            nameKey="name"
            descriptionKey="description"
            statusKey="isActive"
            statusLabels={{
              true: 'Disponible',
              false: 'Inactivo',
            }}
            statusColors={{
              true: 'bg-green-100 text-green-800 border-green-200',
              false: 'bg-red-100 text-red-800 border-red-200',
            }}
            onDelete={handleDeleteClick}
            emptyState={
              <EmptyState
                title={
                  selectedCategory
                    ? 'No hay productos en esta categoría'
                    : 'No hay productos'
                }
                description={
                  selectedCategory
                    ? 'No se encontraron productos en esta categoría. Prueba con otra categoría o crea un nuevo producto.'
                    : 'Comienza creando tu primer producto para gestionar tu inventario.'
                }
                actionLabel={
                  selectedCategory
                    ? 'Ver todos los productos'
                    : 'Crear Primer Producto'
                }
                actionHref={
                  selectedCategory
                    ? PRIVATE_ROUTES.PRODUCTS
                    : PRIVATE_ROUTES.PRODUCTS_NEW
                }
                actionIcon={<FiPlus className="w-4 h-4" />}
                icon={<FiPackage className="w-12 h-12 text-gray-400" />}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
