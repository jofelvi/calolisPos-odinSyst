'use client';

import Link from 'next/link';
import { Button } from '@/components/shared/button/Button';
import { categoryService } from '@/services/firebase/genericServices';
import { useEffect, useState } from 'react';
import { Category } from '@/modelTypes/category';
import { getProductsByCategory } from '@/services/firebase/productServices';
import Loader from '@/components/shared/Loader/Loader';
import { DeleteConfirmationModal } from '@/features/categories/DeleteConfirmationModal';
import { FiPlus } from 'react-icons/fi';
import { EmptyState } from '@/components/shared/EmptyState/EmptyState';
import { EntityGrid } from '@/components/shared/EntityGrid/EntityGrid';
import { PRIVATE_ROUTES } from '@/constants/routes';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [productsInCategory, setProductsInCategory] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const cats = await categoryService.getAll();
      setCategories(cats);
      setLoading(false);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (categoryToDelete) {
        const products = await getProductsByCategory(categoryToDelete.id);
        setProductsInCategory(products.map((p) => p.name));
      }
    };

    if (categoryToDelete) {
      fetchProducts();
    }
  }, [categoryToDelete]);

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      setDeleting(true);
      try {
        await categoryService.delete(categoryToDelete.id);
        setCategories(categories.filter((c) => c.id !== categoryToDelete.id));
        setDeleteModalOpen(false);
      } catch {
        // Error deleting category - handled by UI state
      } finally {
        setDeleting(false);
        setCategoryToDelete(null);
      }
    }
  };

  if (loading) {
    return <Loader fullScreen text="Cargando categorías..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={`¿Eliminar categoría ${categoryToDelete?.name}?`}
        description="Esta acción no se puede deshacer. Todos los productos asociados a esta categoría perderán su clasificación."
        isLoading={deleting}
        items={productsInCategory}
      />

      <div className="container mx-auto px-1 py-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent tracking-tight">
                Categorías
              </h1>
              <p className="text-cyan-600/80 mt-1">
                Gestiona las categorías de tu inventario
              </p>
            </div>
            <Link href={PRIVATE_ROUTES.CATEGORIES_NEW}>
              <Button size="md">
                <FiPlus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          </div>
        </div>

        {/* Categories Grid */}
        <EntityGrid<Category>
          items={categories}
          getDetailPath={(id) => PRIVATE_ROUTES.CATEGORIES_DETAILS(id)}
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
              title="No hay categorías"
              description="Comienza creando tu primera categoría para organizar mejor tu inventario."
              actionLabel="Crear Primera Categoría"
              actionHref={PRIVATE_ROUTES.CATEGORIES_NEW}
              actionIcon={<FiPlus className="w-4 h-4" />}
            />
          }
        />
      </div>
    </div>
  );
}
