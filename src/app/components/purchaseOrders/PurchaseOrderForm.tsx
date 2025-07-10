// components/purchase-orders/PurchaseOrderForm.tsx
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { Supplier } from '@/types/supplier';
import { Product } from '@/types/product';
import {
  PurchaseOrderFormValues,
  PurchaseOrderItemFormValues,
  purchaseOrderSchema,
} from '@/schemas/purchaseOrderSchema';
import { CurrencyEnum, PurchaseOrderStatusEnum } from '@/types/enumShared';
import {
  productService,
  purchaseOrderService,
  supplierService,
} from '@/services/firebase/genericServices';

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder | null;
  isNew?: boolean;
}

export default function PurchaseOrderForm({
  initialData = null,
  isNew = false,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormValues>({
    resolver: yupResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      items: [],
      totalAmount: 0,
      currency: CurrencyEnum.USD,
      status: PurchaseOrderStatusEnum.PENDING,
      expectedDeliveryDate: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch supplierId to keep selectedSupplier in sync
  const watchedSupplierId = watch('supplierId');

  // Sync selectedSupplier with form value
  useEffect(() => {
    setSelectedSupplier(watchedSupplierId || null);
  }, [watchedSupplierId]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      const [suppliersData, productsData] = await Promise.all([
        supplierService.getAll(),
        productService.getAll(),
      ]);

      setSuppliers(suppliersData);
      setProducts(productsData);

      if (initialData) {
        const itemsWithNames = initialData.items.map((item) => {
          const product = productsData.find((p) => p.id === item.productId);
          return {
            ...item,
            productName: product?.name || 'Producto no encontrado',
          };
        });

        // Reset the form with initial data
        reset({
          ...initialData,
          items: itemsWithNames,
          expectedDeliveryDate: initialData.expectedDeliveryDate
            ? new Date(initialData.expectedDeliveryDate)
            : null,
        });

        // selectedSupplier will be set automatically by the useEffect above
        // when watchedSupplierId changes after reset
      }
    };

    loadData();
  }, [initialData, reset]);

  // Calcular total cuando cambian los items
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.startsWith('items') || name === 'supplierId') {
        const items = value.items || [];
        const total = items.reduce(
          (sum, item) => sum + (item?.subtotal || 0),
          0,
        );
        setValue('totalAmount', total);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const handleAddItem = () => {
    append({
      productId: '',
      quantity: 1,
      unitCost: 0,
      subtotal: 0,
    } as PurchaseOrderItemFormValues);
  };

  const handleRemoveItem = (index: number) => {
    remove(index);
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItemFormValues,
    value: any,
  ) => {
    const items = watch('items');
    const newItems = [...items];

    if (field === 'quantity' || field === 'unitCost') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitCost = field === 'unitCost' ? value : newItems[index].unitCost;
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        subtotal: quantity * unitCost,
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
    }

    setValue('items', newItems);
  };

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    setIsSubmitting(true);
    try {
      const filteredSuppliers = suppliers.find(
        (item) => item.id === data.supplierId,
      );
      if (isNew) {
        const orderData: Omit<PurchaseOrder, 'id'> = {
          ...data,
          userId: 'current-user-id', // Reemplazar con el ID del usuario real
          createdAt: new Date(),
          supplierName: filteredSuppliers?.name || '',
        };
        await purchaseOrderService.create(orderData);
      } else if (initialData?.id) {
        const orderData: PurchaseOrder = {
          ...data,
          id: initialData.id,
          userId: 'current-user-id', // Reemplazar con el ID del usuario real
          createdAt: initialData.createdAt,
          supplierName: filteredSuppliers?.name || '',
        };
        await purchaseOrderService.update(initialData.id, orderData);
      }

      router.push('/purchase-orders');
    } catch (error) {
      console.error('Error saving purchase order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          <ul className="list-disc pl-5">
            {Object.entries(errors).map(([key, err]) => (
              <li key={key}>{(err as { message: string }).message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="supplierId"
            className="block text-sm font-medium text-gray-700"
          >
            Proveedor *
          </label>
          <Controller
            control={control}
            name="supplierId"
            render={({ field }) => (
              <select
                id="supplierId"
                {...field}
                className={`mt-1 block w-full border ${
                  errors.supplierId ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Seleccione un proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.supplierId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.supplierId.message}
            </p>
          )}
        </div>

        {/* Campo Moneda */}
        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium text-gray-700"
          >
            Moneda *
          </label>
          <select
            id="currency"
            {...register('currency')}
            className={`mt-1 block w-full border ${
              errors.currency ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="USD">Dólares (USD)</option>
            <option value="EUR">Euros (EUR)</option>
            <option value="COP">Pesos Colombianos (COP)</option>
            <option value="MXN">Pesos Mexicanos (MXN)</option>
          </select>
          {errors.currency && (
            <p className="mt-1 text-sm text-red-600">
              {errors.currency.message}
            </p>
          )}
        </div>

        {/* Campo Estado */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Estado *
          </label>
          <select
            id="status"
            {...register('status')}
            className={`mt-1 block w-full border ${
              errors.status ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value={PurchaseOrderStatusEnum.PENDING}>Pendiente</option>
            <option value={PurchaseOrderStatusEnum.APPROVED}>Aprobada</option>
            <option value={PurchaseOrderStatusEnum.RECEIVED}>Recibida</option>
            <option value={PurchaseOrderStatusEnum.CANCELED}>Cancelada</option>
            <option value={PurchaseOrderStatusEnum.PARTIALLY_RECEIVED}>
              Parcialmente Recibida
            </option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>

        {/* Campo Fecha de Entrega */}
        <div>
          <label
            htmlFor="expectedDeliveryDate"
            className="block text-sm font-medium text-gray-700"
          >
            Fecha Esperada de Entrega
          </label>
          <Controller
            control={control}
            name="expectedDeliveryDate"
            render={({ field }) => (
              <DatePicker
                selected={field.value ? new Date(field.value) : null}
                onChange={(date) => field.onChange(date)}
                className={`mt-1 block w-full border ${
                  errors.expectedDeliveryDate
                    ? 'border-red-500'
                    : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccione una fecha"
              />
            )}
          />
        </div>

        {/* Campo Total */}
        <div>
          <label
            htmlFor="totalAmount"
            className="block text-sm font-medium text-gray-700"
          >
            Total
          </label>
          <input
            id="totalAmount"
            type="number"
            {...register('totalAmount')}
            disabled
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Items de la Orden */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Items de la Orden</h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            + Agregar Item
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-gray-500">No hay items agregados</p>
        )}

        {fields.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 p-4 border rounded-lg"
          >
            {/* Producto */}
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700">
                Producto *
              </label>
              <select
                value={item.productId}
                onChange={(e) =>
                  handleItemChange(index, 'productId', e.target.value)
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione un producto</option>
                {products
                  .filter(
                    (p) =>
                      !selectedSupplier ||
                      p.supplierIds?.includes(selectedSupplier),
                  )
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.sku || 'Sin SKU'}
                    </option>
                  ))}
              </select>
            </div>

            {/* Cantidad */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Cantidad *
              </label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    'quantity',
                    parseInt(e.target.value) || 0,
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Costo Unitario */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Costo Unitario *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitCost}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    'unitCost',
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Subtotal */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Subtotal
              </label>
              <input
                type="number"
                value={item.subtotal}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Eliminar */}
            <div className="md:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/purchase-orders')}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isNew ? 'Creando...' : 'Actualizando...'}
            </span>
          ) : isNew ? (
            'Crear Orden'
          ) : (
            'Actualizar'
          )}
        </button>
      </div>
    </form>
  );
}
