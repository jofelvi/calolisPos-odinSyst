import { CategoryForm } from '@/features/categories/CategoryForm';
import BackIcon from '@/components/shared/BackButton/BackButton';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';

export default function NewCategoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <BackIcon href={PRIVATE_ROUTES.CATEGORIES} />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent mt-4">
            Nueva Categoría
          </h1>
          <p className="text-cyan-600/80 mt-1">
            Crea una nueva categoría para organizar tus productos
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-cyan-100/50">
          <CategoryForm isNew />
        </div>
      </div>
    </div>
  );
}
