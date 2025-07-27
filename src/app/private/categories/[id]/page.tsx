import { CategoryForm } from '@/features/categories/CategoryForm';
import { categoryService } from '@/services/firebase/genericServices';
import { notFound } from 'next/navigation';
import BackIcon from '@/components/shared/BackButton/BackButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryEditPage({ params }: PageProps) {
  const { id } = await params;
  const category = await categoryService.getById(id);
  if (!category) return notFound();

  const categoryData = {
    ...category,
    createdAt: category.createdAt ? new Date(category.createdAt) : null,
    updatedAt: category.updatedAt ? new Date(category.updatedAt) : null,
  };
  return (
    <div className="container mx-auto p-4">
      <BackIcon href="/categories" />
      <h1 className="text-2xl font-bold mb-6">Editar Categoría</h1>
      <CategoryForm initialData={categoryData} />
    </div>
  );
}
