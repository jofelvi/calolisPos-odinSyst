import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  productService,
  supplierService,
} from '@/services/firebase/genericServices';
import { Supplier } from '@/types/supplier';
import BackIcon from '@/components/shared/BackButton/BackButton';

interface PageProps {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = params;
  const product = await productService.getById(id);
  if (!product) return notFound();

  // Obtener proveedores de este producto
  const suppliers = product.supplierIds?.length
    ? await Promise.all(
        product.supplierIds.map((id) => supplierService.getById(id || '')),
      )
    : [];
  const validSuppliers = suppliers.filter((s) => s !== null) as Supplier[];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold">Detalles del Producto</h1>
        <BackIcon href="/products" />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Información Básica
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Nombre:</span> {product.name}
                </p>
                <p>
                  <span className="font-medium">Categoría:</span>{' '}
                  {product.category}
                </p>
                <p>
                  <span className="font-medium">Precio:</span> $
                  {product.price.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Costo:</span>{' '}
                  {product.cost ? `$${product.cost.toFixed(2)}` : '-'}
                </p>
                <p>
                  <span className="font-medium">SKU:</span> {product.sku || '-'}
                </p>
                <p>
                  <span className="font-medium">Estado:</span>
                  <span
                    className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Inventario
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Stock Actual:</span>{' '}
                  {product.stock}
                </p>
                <p>
                  <span className="font-medium">Stock Mínimo:</span>{' '}
                  {product.minStock || '-'}
                </p>
                <p>
                  <span className="font-medium">Código de Barras:</span>{' '}
                  {product.barcode || '-'}
                </p>
              </div>
            </div>

            {product.description && (
              <div className="md:col-span-2">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Descripción
                </h2>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Proveedores
          </h2>

          {validSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {validSuppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {supplier.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500">
                    {supplier.contactName || '-'}
                  </p>
                  <p className="text-sm">{supplier.email || '-'}</p>
                  <p className="text-sm">{supplier.phone || '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              Este producto no tiene proveedores asociados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
