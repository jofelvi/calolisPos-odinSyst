// app/categories/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { categoryService } from '@/services/firebase/genericServices';
import { Button } from '@/components/shared/button/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';

interface PageProps {
  params: { id: string };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const categoryData = await categoryService.getById(id);
  if (!categoryData) return notFound();

  const category = {
    ...categoryData,
    createdAt: categoryData.createdAt ? new Date(categoryData.createdAt) : null,
    updatedAt: categoryData.updatedAt ? new Date(categoryData.updatedAt) : null,
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalle de Categoría</h1>
        <div className="flex space-x-2">
          <Link href={`/categories/${category.id}/edit`}>
            <Button variant="outline">Editar</Button>
          </Link>
          <Link href="/categories">
            <Button variant="ghost">Volver</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{category.name}</span>
            <Badge variant={category.isActive ? 'default' : 'secondary'}>
              {category.isActive ? 'Activa' : 'Inactiva'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
              <p className="mt-1 text-sm text-gray-900">
                {category.description || 'Sin descripción'}
              </p>
            </div>

            {category.imageUrl && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Imagen</h3>
                <div className="mt-2">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="h-64 w-full object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
