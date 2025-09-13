'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { PurchaseOrder } from '@/features/supply-chain/types/purchaseOrderTypes';
import { Supplier } from '@/features/supply-chain/types/supplierTypes';
import {
  MerchandiseReceipt,
  PriceVarianceReport,
  ReceivedItem,
} from '@/features/supply-chain/types/merchandiseReceiptTypes';
import { merchandiseReceiptService } from '@/features/supply-chain/services/merchandiseReceiptService';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/ui/button/Button';
import { Input } from '@/shared/ui/input/input';
import { TextareaWithError } from '@/shared/ui/textarea/TextareaWithError';
import BackButton from '@/shared/ui/BackButton/BackButton';
import { Badge } from '@/shared/ui/badge/badge';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';
import { Loader } from '@/shared';
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState';
import { FormErrorSummary } from '@/shared/ui/formErrorSummary/FormErrorSummary';
import {
  productService,
  purchaseOrderService,
  supplierService,
} from '@/services/firebase/genericServices';

interface EnrichedPurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit: string;
}

interface ReceiptFormData {
  deliveryContactName: string;
  deliveryContactPhone: string;
  notes: string;
  items: {
    productId: string;
    productName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    orderedUnitPrice: number;
    receivedUnitPrice: number;
    unit: string;
    notes: string;
  }[];
}

export default function ReceiveMerchandisePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { success, error } = useToast();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [_enrichedItems, setEnrichedItems] = useState<
    EnrichedPurchaseOrderItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceVariances, setPriceVariances] = useState<PriceVarianceReport[]>(
    [],
  );
  const [showVariances, setShowVariances] = useState(false);

  const purchaseOrderId = params.id as string;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReceiptFormData>();

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  useEffect(() => {
    if (purchaseOrderId) {
      loadPurchaseOrderData();
    }
  }, [purchaseOrderId]);

  useEffect(() => {
    if (watchedItems && watchedItems.length > 0) {
      calculateVariances();
    }
  }, [watchedItems]);

  const loadPurchaseOrderData = async () => {
    try {
      setLoading(true);

      // Obtener la orden de compra
      const orderData = await purchaseOrderService.getById(purchaseOrderId);
      if (!orderData) {
        error({ title: 'Orden de compra no encontrada' });
        router.push('/private/purchase-orders');
        return;
      }

      // Verificar que la orden está en estado pendiente
      if (orderData.status !== 'pending') {
        error({ title: 'Solo se pueden recibir órdenes pendientes' });
        router.push(`/private/purchase-orders/${purchaseOrderId}/details`);
        return;
      }

      setPurchaseOrder(orderData);

      // Obtener información del proveedor
      const supplierData = await supplierService.getById(orderData.supplierId);
      setSupplier(supplierData);

      // Obtener todos los productos para enriquecer los items
      const allProducts = await productService.getAll();

      // Enriquecer items con nombres de productos
      const enriched = orderData.items.map((item) => {
        const product = allProducts.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name || 'Producto no encontrado',
          quantity: item.quantity,
          unitPrice: item.unitCost,
          subtotal: item.subtotal,
          unit: 'unidad', // Default unit since Product doesn't have this property
        };
      });

      setEnrichedItems(enriched);

      // Inicializar formulario con datos de la orden
      const formItems = enriched.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity, // Por defecto, recibir todo
        orderedUnitPrice: item.unitPrice,
        receivedUnitPrice: item.unitPrice, // Por defecto, mismo precio
        unit: item.unit,
        notes: '',
      }));

      setValue('items', formItems);
    } catch {
      error({ title: 'Error al cargar los datos' });
      router.push('/private/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateVariances = () => {
    if (!watchedItems) return;

    const receivedItems: ReceivedItem[] = watchedItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity || 0,
      orderedUnitPrice: item.orderedUnitPrice,
      receivedUnitPrice: item.receivedUnitPrice || item.orderedUnitPrice,
      unit: item.unit,
      notes: item.notes,
      isPartialDelivery: (item.receivedQuantity || 0) < item.orderedQuantity,
      priceVariance:
        (item.receivedUnitPrice || item.orderedUnitPrice) -
        item.orderedUnitPrice,
      priceVariancePercentage:
        item.orderedUnitPrice > 0
          ? (((item.receivedUnitPrice || item.orderedUnitPrice) -
              item.orderedUnitPrice) /
              item.orderedUnitPrice) *
            100
          : 0,
    }));

    const variances =
      merchandiseReceiptService.calculatePriceVariances(receivedItems);
    setPriceVariances(variances);
    setShowVariances(variances.some((v) => Math.abs(v.variance) > 0.01));
  };

  const onSubmit = async (data: ReceiptFormData) => {
    if (!purchaseOrder || !session?.user) return;

    try {
      setSaving(true);

      const receivedItems: ReceivedItem[] = data.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: item.receivedQuantity,
        orderedUnitPrice: item.orderedUnitPrice,
        receivedUnitPrice: item.receivedUnitPrice,
        unit: item.unit,
        notes: item.notes,
        isPartialDelivery: item.receivedQuantity < item.orderedQuantity,
        priceVariance: item.receivedUnitPrice - item.orderedUnitPrice,
        priceVariancePercentage:
          item.orderedUnitPrice > 0
            ? ((item.receivedUnitPrice - item.orderedUnitPrice) /
                item.orderedUnitPrice) *
              100
            : 0,
      }));

      const totalOrderedAmount = receivedItems.reduce(
        (sum, item) => sum + item.orderedQuantity * item.orderedUnitPrice,
        0,
      );
      const totalReceivedAmount = receivedItems.reduce(
        (sum, item) => sum + item.receivedQuantity * item.receivedUnitPrice,
        0,
      );

      const receiptData: Omit<
        MerchandiseReceipt,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        purchaseOrderId: purchaseOrder.id,
        supplierId: purchaseOrder.supplierId,
        supplierName: supplier?.name || purchaseOrder.supplierName,
        receivedBy: session.user.id,
        receivedByName: session.user.name || 'Usuario',
        receivedAt: new Date(),
        deliveryContactName: data.deliveryContactName,
        deliveryContactPhone: data.deliveryContactPhone,
        items: receivedItems,
        totalOrderedAmount,
        totalReceivedAmount,
        totalVariance: totalReceivedAmount - totalOrderedAmount,
        documents: [], // Por ahora vacío, se implementará subida de archivos
        notes: data.notes,
        isCompleteDelivery: receivedItems.every(
          (item) => item.receivedQuantity >= item.orderedQuantity,
        ),
      };

      // Crear la recepción
      const receiptId = await merchandiseReceiptService.create(receiptData);

      // Actualizar inventario
      await merchandiseReceiptService.updateInventory(receivedItems, receiptId);

      // Actualizar estado de la orden de compra
      await merchandiseReceiptService.updatePurchaseOrderStatus(
        purchaseOrder.id,
        receivedItems,
      );

      success({ title: 'Mercancía recibida correctamente' });
      router.push(`/private/purchase-orders/${purchaseOrder.id}/details`);
    } catch {
      error({ title: 'Error al registrar la recepción' });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600'; // Más caro
    if (variance < 0) return 'text-green-600'; // Más barato
    return 'text-gray-600'; // Sin cambio
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Orden de compra no encontrada"
            description="La orden de compra que buscas no existe o fue eliminada"
            icon="📦"
            actionLabel="Volver a Órdenes de Compra"
            actionHref="/private/purchase-orders"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton
            href={PRIVATE_ROUTES.PURCHASE_ORDERS_DETAILS(purchaseOrder.id)}
            className="mb-4"
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Recibir Mercancía
              </h1>
              <p className="text-gray-600 mt-1">
                Orden de Compra #{purchaseOrder.id.slice(-8)} -{' '}
                {supplier?.name || purchaseOrder.supplierName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                Total: {formatCurrency(purchaseOrder.totalAmount)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Alertas de Variación de Precios */}
        {showVariances && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-3">
              ⚠️ Variaciones de Precios Detectadas
            </h3>
            <div className="space-y-2">
              {priceVariances
                .filter((v) => Math.abs(v.variance) > 0.01)
                .map((variance, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-yellow-700">
                      {variance.productName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={getVarianceColor(variance.variance)}>
                        {variance.variance > 0 ? '+' : ''}
                        {formatCurrency(variance.variance)}
                      </span>
                      <span
                        className={`${getVarianceColor(variance.variance)} font-medium`}
                      >
                        ({variance.variancePercentage > 0 ? '+' : ''}
                        {variance.variancePercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Formulario Principal */}
            <div className="lg:col-span-3 space-y-6">
              {/* Información de Entrega */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Información de Entrega
                </h2>

                <FormErrorSummary errors={errors} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Nombre de quien entrega"
                      placeholder="Nombre del contacto de entrega"
                      {...register('deliveryContactName')}
                      error={errors.deliveryContactName}
                    />
                  </div>

                  <div>
                    <Input
                      label="Teléfono de contacto"
                      placeholder="Teléfono del contacto"
                      {...register('deliveryContactPhone')}
                      error={errors.deliveryContactPhone}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <TextareaWithError
                    label="Observaciones generales"
                    placeholder="Notas adicionales sobre la recepción..."
                    {...register('notes')}
                    error={errors.notes}
                    rows={3}
                  />
                </div>
              </div>

              {/* Items Recibidos */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Items Recibidos
                </h2>

                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {watchedItems?.[index]?.productName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Unidad: {watchedItems?.[index]?.unit}
                          </p>
                        </div>
                        {watchedItems?.[index] && (
                          <Badge
                            className={
                              (watchedItems[index].receivedQuantity || 0) <
                              watchedItems[index].orderedQuantity
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {(watchedItems[index].receivedQuantity || 0) <
                            watchedItems[index].orderedQuantity
                              ? 'Entrega Parcial'
                              : 'Completo'}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cant. Pedida
                          </label>
                          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
                            {watchedItems?.[index]?.orderedQuantity}
                          </div>
                        </div>

                        <div>
                          <Input
                            label="Cant. Recibida"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`items.${index}.receivedQuantity`, {
                              valueAsNumber: true,
                            })}
                            error={errors.items?.[index]?.receivedQuantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Pedido
                          </label>
                          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
                            {formatCurrency(
                              watchedItems?.[index]?.orderedUnitPrice || 0,
                            )}
                          </div>
                        </div>

                        <div>
                          <Input
                            label="Precio Recibido"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`items.${index}.receivedUnitPrice`, {
                              valueAsNumber: true,
                            })}
                            error={errors.items?.[index]?.receivedUnitPrice}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <TextareaWithError
                          label="Observaciones del item"
                          placeholder="Notas específicas de este producto..."
                          {...register(`items.${index}.notes`)}
                          error={errors.items?.[index]?.notes}
                          rows={2}
                        />
                      </div>

                      {/* Mostrar variación si existe */}
                      {watchedItems?.[index] &&
                        Math.abs(
                          (watchedItems[index].receivedUnitPrice ||
                            watchedItems[index].orderedUnitPrice) -
                            watchedItems[index].orderedUnitPrice,
                        ) > 0.01 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-yellow-700 font-medium">
                                Variación de precio:
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={getVarianceColor(
                                    (watchedItems[index].receivedUnitPrice ||
                                      watchedItems[index].orderedUnitPrice) -
                                      watchedItems[index].orderedUnitPrice,
                                  )}
                                >
                                  {(watchedItems[index].receivedUnitPrice ||
                                    watchedItems[index].orderedUnitPrice) -
                                    watchedItems[index].orderedUnitPrice >
                                  0
                                    ? '+'
                                    : ''}
                                  {formatCurrency(
                                    (watchedItems[index].receivedUnitPrice ||
                                      watchedItems[index].orderedUnitPrice) -
                                      watchedItems[index].orderedUnitPrice,
                                  )}
                                </span>
                                <span className="text-gray-500">
                                  (
                                  {watchedItems[index].orderedUnitPrice > 0
                                    ? (
                                        (((watchedItems[index]
                                          .receivedUnitPrice ||
                                          watchedItems[index]
                                            .orderedUnitPrice) -
                                          watchedItems[index]
                                            .orderedUnitPrice) /
                                          watchedItems[index]
                                            .orderedUnitPrice) *
                                        100
                                      ).toFixed(1) + '%'
                                    : 'N/A'}
                                  )
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Campos ocultos para mantener los datos */}
                      <input
                        type="hidden"
                        {...register(`items.${index}.productId`)}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.productName`)}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.orderedQuantity`)}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.orderedUnitPrice`)}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.unit`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resumen */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Resumen
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Items:</span>
                    <span>{fields.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total Pedido:</span>
                    <span>{formatCurrency(purchaseOrder.totalAmount)}</span>
                  </div>
                  {watchedItems && (
                    <div className="flex justify-between text-gray-600">
                      <span>Total Recibido:</span>
                      <span>
                        {formatCurrency(
                          watchedItems.reduce(
                            (sum, item) =>
                              sum +
                              (item.receivedQuantity || 0) *
                                (item.receivedUnitPrice ||
                                  item.orderedUnitPrice),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Acciones
                </h2>
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Registrando...' : 'Registrar Recepción'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(
                        `/private/purchase-orders/${purchaseOrder.id}/details`,
                      )
                    }
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
