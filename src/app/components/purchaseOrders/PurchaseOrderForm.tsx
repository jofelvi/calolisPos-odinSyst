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
import { PRIVATE_ROUTES } from '@/constants/routes';
import { Button } from '@/components/shared/button/Button';
import { useToast } from '@/components/hooks/useToast';
import { Toaster } from 'react-hot-toast';

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
    formState: { errors, isValid, isDirty },
  } = useForm<PurchaseOrderFormValues>({
    resolver: yupResolver(purchaseOrderSchema),
    mode: 'onChange', // Validar en tiempo real
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
    if (!selectedSupplier) {
      toast.warning({
        title: 'Selecciona un Proveedor',
        description:
          'Primero debes seleccionar un proveedor antes de agregar productos.',
      });
      return;
    }

    append({
      productId: '',
      quantity: 1,
      unitCost: 0,
      subtotal: 0,
    } as PurchaseOrderItemFormValues);

    toast.success({
      title: 'Producto Agregado',
      description: 'Se ha agregado un nuevo producto a la orden.',
    });
  };

  const handleRemoveItem = (index: number) => {
    remove(index);
    toast.info({
      title: 'Producto Eliminado',
      description: 'El producto ha sido eliminado de la orden.',
    });
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

  const toast = useToast();

  // Función para determinar si el formulario puede ser enviado
  const canSubmit = () => {
    const hasErrors = Object.keys(errors).length > 0;
    const hasItems = watch('items')?.length > 0;
    const hasSupplier = watch('supplierId');

    return !hasErrors && hasItems && hasSupplier && !isSubmitting;
  };

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    setIsSubmitting(true);

    // Validaciones adicionales antes de enviar
    if (!data.items || data.items.length === 0) {
      toast.error({
        title: 'Error de Validación',
        description: 'Debe agregar al menos un producto a la orden.',
      });
      setIsSubmitting(false);
      return;
    }

    // Verificar que todos los productos tengan datos válidos
    const invalidItems = data.items.filter(
      (item) => !item.productId || item.quantity <= 0 || item.unitCost <= 0,
    );

    if (invalidItems.length > 0) {
      toast.error({
        title: 'Error de Validación',
        description:
          'Todos los productos deben tener cantidad y costo válidos.',
      });
      setIsSubmitting(false);
      return;
    }

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
        const newOrder = await purchaseOrderService.create(orderData);

        toast.success({
          title: '¡Órden Creada!',
          description: `La orden de compra ha sido creada exitosamente.`,
        });

        // Redirigir a la página de detalles de la nueva orden
        router.push(PRIVATE_ROUTES.PURCHASE_ORDERS_DETAILS(newOrder.id));
      } else if (initialData?.id) {
        const orderData: PurchaseOrder = {
          ...data,
          id: initialData.id,
          userId: 'current-user-id', // Reemplazar con el ID del usuario real
          createdAt: initialData.createdAt,
          supplierName: filteredSuppliers?.name || '',
        };
        await purchaseOrderService.update(initialData.id, orderData);

        toast.success({
          title: '¡Órden Actualizada!',
          description: `Los cambios han sido guardados exitosamente.`,
        });

        // Redirigir a la página de detalles de la orden editada
        router.push(PRIVATE_ROUTES.PURCHASE_ORDERS_DETAILS(initialData.id));
      }
    } catch (error: any) {
      console.error('Error saving purchase order:', error);

      // Mostrar mensaje de error específico
      const errorMessage = error?.message || 'Error desconocido';
      toast.error({
        title: isNew ? 'Error al Crear Órden' : 'Error al Actualizar Órden',
        description: `No se pudo ${isNew ? 'crear' : 'actualizar'} la orden: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            zIndex: 9999,
            marginTop: '60px',
          },
        }}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-300 text-red-800 px-4 py-3 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-2">
                  Se encontraron los siguientes errores:
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(errors).map(([key, err]) => {
                    let message = (err as { message: string }).message;
                    // Mejorar mensajes de error específicos
                    if (
                      key === 'items' &&
                      message.includes('al menos un item')
                    ) {
                      message = 'Debe agregar al menos un producto a la orden';
                    }
                    return (
                      <li key={key} className="text-sm">
                        {message}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
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
              <option value={PurchaseOrderStatusEnum.CANCELED}>
                Cancelada
              </option>
              <option value={PurchaseOrderStatusEnum.PARTIALLY_RECEIVED}>
                Parcialmente Recibida
              </option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status.message}
              </p>
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
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-sm"
            >
              + Agregar Item
            </button>
          </div>

          {fields.length === 0 && (
            <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">
                No hay productos agregados
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Comienza agregando productos a tu orden de compra
              </p>
              {!selectedSupplier && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block">
                  ⚠️ Primero selecciona un proveedor
                </p>
              )}
            </div>
          )}

          {fields.map((item, index) => {
            // Obtener errores específicos para este item
            const itemErrors = errors.items?.[index];
            const hasProductError = !item.productId;
            const hasQuantityError = !item.quantity || item.quantity <= 0;
            const hasUnitCostError = !item.unitCost || item.unitCost <= 0;

            return (
              <div
                key={item.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 p-4 border rounded-xl transition-all duration-200 ${
                  itemErrors ||
                  hasProductError ||
                  hasQuantityError ||
                  hasUnitCostError
                    ? 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50'
                    : 'border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50'
                }`}
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
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none transition-colors duration-200 ${
                      hasProductError || itemErrors?.productId
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
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
                  {(hasProductError || itemErrors?.productId) && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {itemErrors?.productId?.message ||
                        'Producto es requerido'}
                    </p>
                  )}
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
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none transition-colors duration-200 ${
                      hasQuantityError || itemErrors?.quantity
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {(hasQuantityError || itemErrors?.quantity) && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {itemErrors?.quantity?.message ||
                        'Cantidad debe ser mayor a 0'}
                    </p>
                  )}
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
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none transition-colors duration-200 ${
                      hasUnitCostError || itemErrors?.unitCost
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {(hasUnitCostError || itemErrors?.unitCost) && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {itemErrors?.unitCost?.message ||
                        'Costo debe ser mayor a 0'}
                    </p>
                  )}
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
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
                  >
                    ✕ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-cyan-100">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (initialData?.id) {
                // Si estamos editando, volver a los detalles
                router.push(
                  PRIVATE_ROUTES.PURCHASE_ORDERS_DETAILS(initialData.id),
                );
              } else {
                // Si estamos creando, volver a la lista
                router.push(PRIVATE_ROUTES.PURCHASE_ORDERS);
              }
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit()}
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? isNew
                ? 'Creando...'
                : 'Actualizando...'
              : isNew
                ? 'Crear Orden'
                : 'Actualizar Orden'}
          </Button>
        </div>
      </form>
    </>
  );
}
