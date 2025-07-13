import ProductForm from '@/app/components/products/ProductForm';
import BackIcon from '@/components/shared/BackButton/BackButton';
import { PRIVATE_ROUTES } from '@/constants/routes';

export default function NewSupplierPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <BackIcon
            href={PRIVATE_ROUTES.PRODUCTS}
            tooltip="Volver a Productos"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent mt-4">
            Nuevo Producto
          </h1>
          <p className="text-cyan-600/80 mt-1">
            Agrega un nuevo producto a tu inventario
          </p>
        </div>
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-cyan-100/50">
          <ProductForm isNew />
        </div>
      </div>
    </div>
  );
}
