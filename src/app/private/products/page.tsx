// app/products/page.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiFilter, FiPackage, FiPlus, FiX } from 'react-icons/fi';
import {
  categoryService,
  productService,
} from '@/services/firebase/genericServices';
import { Product } from '@/types/product';
import { DeleteConfirmationModal } from '@/app/components/categories/DeleteConfirmationModal';
import { Button } from '@/components/shared/button/Button';
import { EntityGrid } from '@/components/shared/EntityGrid/EntityGrid';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { Category } from '@/types/category';
import '../../components/products/producs.css';
import { Check } from 'lucide-react';
import { OrderGridSkeleton } from '@/app/components/purchaseOrders/order-skeleton';
import { PRIVATE_ROUTES } from '@/constants/routes';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [_isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  // Manejar scroll del filtro
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setIsScrolling(scrollRef.current.scrollLeft > 0);
      }
    };

    if (scrollRef.current) {
      scrollRef.current.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollRef.current) {
        scrollRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Filtrar productos por categoría
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.categoryId === selectedCategory)
    : products;

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
      } catch (error) {
        console.error('Error eliminando producto:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 hide-scrollbar">
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={`¿Eliminar producto ${productToDelete?.name}?`}
        description="Esta acción no se puede deshacer. Todos los datos relacionados con este producto se perderán permanentemente."
        isLoading={deleting}
      />

      <div className="container mx-auto px-1 py-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent tracking-tight">
                Productos
              </h1>
              <p className="text-cyan-600/80 mt-1">
                Gestiona los productos de tu inventario
              </p>
            </div>
            <Link href={PRIVATE_ROUTES.PRODUCTS_NEW}>
              <Button size="md">
                <FiPlus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtro de categorías */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FiFilter className="text-cyan-600 mr-2" />
            <h2 className="text-lg font-semibold text-cyan-800">
              Filtrar por categoría
            </h2>

            {selectedCategory && (
              <Button
                onClick={() => setSelectedCategory(null)}
                variant="ghost"
                className="ml-4 flex items-center text-sm"
              >
                <FiX className="mr-1" /> Limpiar filtro
              </Button>
            )}
          </div>

          <div
            ref={scrollRef}
            className="relative flex pb-4 overflow-x-auto hide-scrollbar"
          >
            <div className="flex space-x-4 min-w-max">
              {/* Opción "Todas" */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`
                  flex-shrink-0 w-28 h-32 rounded-xl border flex flex-col items-center justify-center transition-all duration-300
                  ${
                    !selectedCategory
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-lg ring-2 ring-cyan-200/50'
                      : 'border-cyan-200 bg-white/80 backdrop-blur-sm hover:bg-cyan-50 shadow-sm hover:shadow-lg hover:border-cyan-300'
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center mb-3">
                  <FiPackage className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="font-semibold text-cyan-900">Todas</div>
                <div className="text-sm text-cyan-600 mt-1">
                  {products.length} productos
                </div>
              </button>

              {/* Categorías */}
              {categories.map((category) => {
                const productCount = products.filter(
                  (p) => p.categoryId === category.id,
                ).length;
                const isSelected = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      flex-shrink-0 w-28 h-32 rounded-xl border flex flex-col items-center justify-center 
                      transition-all duration-300 overflow-hidden relative
                      ${
                        isSelected
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-lg ring-2 ring-cyan-200/50'
                          : 'border-cyan-200 bg-white/80 backdrop-blur-sm hover:bg-cyan-50 shadow-sm hover:shadow-lg hover:border-cyan-300'
                      }`}
                  >
                    {/* Efecto de selección - Mover arriba y ajustar tamaño */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-2 py-1 rounded-lg text-xs font-semibold z-10 shadow-sm">
                        <Check className="w-3 h-3 inline mr-1" />
                      </div>
                    )}

                    {/* Contenedor de imagen con efecto de elevación */}
                    <div
                      className={`mb-3 rounded-full p-2 ${isSelected ? 'bg-gradient-to-br from-cyan-100 to-teal-100' : 'bg-gradient-to-br from-gray-100 to-slate-100'} shadow-sm`}
                    >
                      {category.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-gray-200">
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="object-cover w-full h-full transition-transform duration-300 hover:scale-110"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200">
                          <FiPackage className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Nombre de categoría */}
                    <div className="font-semibold text-cyan-900 truncate w-24 px-1 text-center text-sm">
                      {category.name}
                    </div>

                    {/* Contador de productos con badge */}
                    <div
                      className={`mt-1 px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                          : 'bg-gradient-to-r from-gray-100 to-slate-100 text-cyan-700'
                      }`}
                    >
                      {productCount}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Encabezado de resultados */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-cyan-800">
            {selectedCategory
              ? `Productos en "${categories.find((c) => c.id === selectedCategory)?.name}"`
              : 'Todos los productos'}
          </h3>
          <span className="text-sm text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full font-medium">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {/* Products Grid */}
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
  );
}
