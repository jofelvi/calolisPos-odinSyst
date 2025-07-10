import { CategoryForm } from '@/app/components/categories/CategoryForm';
import BackIcon from '@/components/shared/BackButton/BackButton';

export default function NewCategoryPage() {
  return (
    <div className="container mx-auto p-4">
      <BackIcon href="/categories" />
      <h1 className="text-2xl font-bold mb-6">Nueva Categoría</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <CategoryForm isNew />
      </div>
    </div>
  );
}
