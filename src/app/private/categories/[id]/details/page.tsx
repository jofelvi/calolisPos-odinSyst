// app/categories/[id]/details/page.tsx
import { notFound } from 'next/navigation';
import { categoryService } from '@/services/firebase/genericServices';
import { Button } from '@/components/shared/button/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import BackIcon from '@/components/shared/BackButton/BackButton';
import { PRIVATE_ROUTES } from '@/shared';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const categoryData = await categoryService.getById(id);
  if (!categoryData) return notFound();

  const category = {
    ...categoryData,
    createdAt: categoryData.createdAt ? new Date(categoryData.createdAt) : null,
    updatedAt: categoryData.updatedAt ? new Date(categoryData.updatedAt) : null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <BackIcon
            href={PRIVATE_ROUTES.CATEGORIES}
            tooltip="Volver a Categorías"
          />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
                Detalle de Categoría
              </h1>
              <p className="text-cyan-600/80 mt-1">
                Información completa de la categoría
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href={PRIVATE_ROUTES.CATEGORIES_EDIT(category.id)}>
                <Button
                  variant="outline"
                  className="bg-white/80 border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                >
                  ✏️ Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
          <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-b border-cyan-100">
            <CardTitle className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-800">
                {category.name}
              </span>
              <Badge
                variant={category.isActive ? 'default' : 'secondary'}
                className={
                  category.isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm'
                    : 'bg-gradient-to-r from-gray-400 to-slate-400 text-white shadow-sm'
                }
              >
                {category.isActive ? '✓ Activa' : '⚪ Inactiva'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Descripción
                  </h3>
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-800 leading-relaxed">
                      {category.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Estado
                  </h3>
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-gray-800">
                      {category.isActive
                        ? 'Categoría activa y visible en el sistema'
                        : 'Categoría inactiva, no visible en el sistema'}
                    </p>
                  </div>
                </div>

                {(category.createdAt || category.updatedAt) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Fechas
                    </h3>
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                      {category.createdAt && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Creada:</span>{' '}
                          {category.createdAt.toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {category.updatedAt && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Actualizada:</span>{' '}
                          {category.updatedAt.toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {category.imageUrl && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Imagen
                  </h3>
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full h-64 object-contain rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
