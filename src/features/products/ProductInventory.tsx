import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { ProductFormData } from '@/features/types/schemaYup/productSchema';
import { Input } from '@/components/shared/input/input';

interface ProductInventoryProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
}

export default function ProductInventory({
  register,
  errors,
}: ProductInventoryProps) {
  return (
    <>
      {/* Stock */}
      <Input
        label="Stock *"
        id="stock"
        type="number"
        variant="numeric"
        {...register('stock')}
        error={errors.stock?.message}
        required
      />

      {/* Stock Mínimo */}
      <Input
        label="Stock Mínimo"
        id="minStock"
        type="number"
        variant="numeric"
        {...register('minStock')}
        error={errors.minStock?.message}
      />

      {/* SKU */}
      <Input
        label="SKU"
        id="sku"
        {...register('sku')}
        error={errors.sku?.message}
        placeholder="Código de producto único"
      />

      {/* Código de Barras */}
      <Input
        label="Código de Barras"
        id="barcode"
        {...register('barcode')}
        error={errors.barcode?.message}
        placeholder="Código de barras del producto"
      />
    </>
  );
}
