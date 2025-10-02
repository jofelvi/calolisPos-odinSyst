import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  productService,
  supplierService,
} from '@/services/firebase/genericServices';
import { Supplier } from '@/modelTypes/supplier';
import { Product } from '@/modelTypes/product';
import BackIcon from '@/components/shared/BackButton/BackButton';
import { PRIVATE_ROUTES, ProductTypeEnum } from '@/shared';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { Button } from '@/components/shared/button/Button';
import { calculateMixedProductCost } from '@/features/products/productsUtils';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Función para verificar y corregir el costo de productos MIXED
async function verifyAndFixProductCost(product: Product): Promise<Product> {
  // Solo verificar productos MIXED con ingredientes
  if (product.type !== ProductTypeEnum.MIXED || !product.ingredients?.length) {
    console.log('Product is not MIXED or has no ingredients:', {
      type: product.type,
      hasIngredients: !!product.ingredients?.length,
    });
    return product;
  }

  console.log('Verifying cost for MIXED product:', product.name);
  console.log('Current ingredients:', product.ingredients);

  // Obtener todos los productos para calcular el costo correcto
  const allProducts = await productService.getAll();
  console.log('Total products available for calculation:', allProducts.length);

  // Calcular el costo correcto basado en los ingredientes
  const correctCost = calculateMixedProductCost(
    product.ingredients,
    allProducts,
  );
  console.log('Calculated correct cost:', correctCost);

  // Verificar si el costo actual es diferente al calculado (con tolerancia de 0.01)
  const currentCost = product.cost || 0;
  const costDifference = Math.abs(currentCost - correctCost);

  console.log('Cost comparison:', {
    currentCost,
    correctCost,
    difference: costDifference,
    needsUpdate: costDifference > 0.01,
  });

  if (costDifference > 0.01) {
    console.log('Updating product cost from', currentCost, 'to', correctCost);

    // Actualizar el costo en la base de datos silenciosamente
    await productService.update(product.id, {
      cost: correctCost,
      updatedAt: new Date(),
    });

    console.log('Cost updated successfully in database');

    // Retornar el producto con el costo actualizado
    return {
      ...product,
      cost: correctCost,
    };
  }

  console.log('No cost update needed');
  return product;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  let product = await productService.getById(id);
  if (!product) return notFound();

  // Verificar y corregir el costo si es necesario (transparente para el usuario)
  product = await verifyAndFixProductCost(product);

  // Obtener proveedores de este producto
  const suppliers = product.supplierIds?.length
    ? await Promise.all(
        product.supplierIds.map((id) => supplierService.getById(id || '')),
      )
    : [];
  const validSuppliers = suppliers.filter((s) => s !== null) as Supplier[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <BackIcon
            href={PRIVATE_ROUTES.PRODUCTS}
            tooltip="Volver a Productos"
          />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
                Detalle del Producto
              </h1>
              <p className="text-cyan-600/80 mt-1">
                Información completa del producto
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href={PRIVATE_ROUTES.PRODUCTS_EDIT(product.id)}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Imagen del producto */}
          {product.imageUrl && (
            <div className="lg:col-span-1">
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
                <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-b border-cyan-100">
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Imagen
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Información principal */}
          <div className={product.imageUrl ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
              <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-b border-cyan-100">
                <CardTitle className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-800">
                    {product.name}
                  </span>
                  <Badge
                    variant={product.isActive ? 'default' : 'secondary'}
                    className={
                      product.isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm'
                        : 'bg-gradient-to-r from-gray-400 to-slate-400 text-white shadow-sm'
                    }
                  >
                    {product.isActive ? '✓ Disponible' : '⚪ Inactivo'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Información Básica */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Información Básica
                      </h3>
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Categoría:
                          </span>
                          <p className="text-gray-800 font-medium">
                            {product.category || 'Sin categoría'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            SKU:
                          </span>
                          <p className="text-gray-800 font-mono">
                            {product.sku || 'Sin SKU'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Código de Barras:
                          </span>
                          <p className="text-gray-800 font-mono">
                            {product.barcode || 'Sin código'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {product.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          Descripción
                        </h3>
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
                          <p className="text-gray-800 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Precios e Inventario */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Precios
                      </h3>
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200 space-y-3">
                        <div>
                          <span className="text-sm font-medium text-emerald-700">
                            Precio de Venta:
                          </span>
                          <p className="text-2xl font-bold text-emerald-800">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                        {product.cost && (
                          <div>
                            <span className="text-sm font-medium text-emerald-700">
                              Costo:
                            </span>
                            <p className="text-lg font-semibold text-emerald-800">
                              ${product.cost.toFixed(2)}
                            </p>
                          </div>
                        )}
                        {product.cost !== undefined &&
                          product.cost !== null && (
                            <div>
                              <span className="text-sm font-medium text-emerald-700">
                                Margen:
                              </span>
                              <p
                                className={`text-lg font-semibold ${
                                  product.price > product.cost
                                    ? 'text-emerald-800'
                                    : product.price < product.cost
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                }`}
                              >
                                {(() => {
                                  // Si el precio es 0, no se puede calcular margen
                                  if (product.price === 0) {
                                    return 'N/A';
                                  }
                                  // Si el costo es mayor que el precio, mostrar pérdida
                                  if (product.cost > product.price) {
                                    const loss =
                                      ((product.cost - product.price) /
                                        product.cost) *
                                      100;
                                    return `-${loss.toFixed(1)}% (Pérdida)`;
                                  }
                                  // Cálculo normal del margen de ganancia
                                  const margin =
                                    ((product.price - product.cost) /
                                      product.price) *
                                    100;
                                  return `${margin.toFixed(1)}%`;
                                })()}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Inventario
                      </h3>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200 space-y-3">
                        <div>
                          <span className="text-sm font-medium text-blue-700">
                            Stock Actual:
                          </span>
                          <p
                            className={`text-xl font-bold ${
                              product.minStock &&
                              product.stock <= product.minStock
                                ? 'text-red-600'
                                : 'text-blue-800'
                            }`}
                          >
                            {product.stock} unidades
                          </p>
                        </div>
                        {product.minStock && (
                          <div>
                            <span className="text-sm font-medium text-blue-700">
                              Stock Mínimo:
                            </span>
                            <p className="text-lg font-semibold text-blue-800">
                              {product.minStock} unidades
                            </p>
                          </div>
                        )}
                        {product.minStock &&
                          product.stock <= product.minStock && (
                            <div className="bg-red-100 border border-red-200 rounded-lg p-2">
                              <p className="text-red-700 text-sm font-medium">
                                ⚠️ Stock bajo - Considera reabastecer
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Proveedores */}
        <div className="mt-6">
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
            <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-b border-cyan-100">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {validSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {validSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold text-gray-800 mb-2">
                        <Link
                          href={PRIVATE_ROUTES.SUPPLIERS_EDIT(supplier.id)}
                          className="text-cyan-600 hover:text-cyan-800 transition-colors"
                        >
                          {supplier.name}
                        </Link>
                      </h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Contacto:</span>{' '}
                          {supplier.contactName || 'Sin contacto'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Email:</span>{' '}
                          {supplier.email || 'Sin email'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Teléfono:</span>{' '}
                          {supplier.phone || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-gray-200">
                    <p className="text-gray-500 text-lg">
                      Este producto no tiene proveedores asociados
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Puedes asociar proveedores editando el producto
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
