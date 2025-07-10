import Link from 'next/link';
import { productService } from '@/services/firebase/genericServices';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import Image from 'next/image';
import { Package, Plus } from 'lucide-react';
import { Badge } from '@/components/shared/badge/badge';
import { Button } from '@/components/shared/button/Button';

export default async function ProductsLists() {
  const products = await productService.getAll();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Link
          href="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nuevo Producto
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Categories Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
              >
                <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm">
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name || 'Imagen de categoría'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
                        <Package className="w-16 h-16 text-blue-400" />
                      </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={product.isActive ? 'default' : 'secondary'}
                        className={`
                                                    shadow-sm font-medium text-xs
                                                    ${
                                                      product.isActive
                                                        ? 'bg-green-100 text-green-800 border-green-200'
                                                        : 'bg-red-100 text-red-800 border-red-200'
                                                    }
                                                `}
                      >
                        {product.isActive ? 'Disponible' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Section */}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {product.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {product.description || 'Sin descripción disponible'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay categorías
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Comienza creando tu primera categoría para organizar mejor tu
              inventario.
            </p>
            <Link href="/categories/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Categoría
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
