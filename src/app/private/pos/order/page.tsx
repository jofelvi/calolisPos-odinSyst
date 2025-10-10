// app/private/pos/order/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Product } from '@/modelTypes/product';
import { Customer } from '@/modelTypes/customer';
import { OrderFormValues, orderSchema } from '@/shared/schemas/orderSchema';
import { OrderStatusEnum, PaymentStatusEnum, TableStatusEnum } from '@/shared';
import { ProductCustomization } from '@/modelTypes/orderItem';
import {
  getActiveOrderByTable,
  orderService,
  productService,
  tableService,
} from '@/services/firebase/genericServices';
import { Order } from '@/modelTypes/order';
import { Card } from '@/components/shared/card/card';
import { Button } from '@/components/shared/button/Button';
import ProductSelector from '@/features/pos/ProductSelector';
import OrderSummary from '@/features/pos/OrderSummary';
import Loader from '@/components/shared/Loader/Loader';
import { useSession } from 'next-auth/react';
import { ChevronLeft, AlertTriangle, Save, CreditCard } from 'lucide-react';
import Modal from '@/shared/ui/modal';
import { useToast } from '@/components/hooks/useToast'; // Constantes para las tasas de impuestos y servicios para mejor legibilidad y mantenimiento

export default function OrderPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const toast = useToast();
  const tableId = searchParams.get('tableId');
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [_selectedCustomer, _setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  // Estados para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    index: number;
    name: string;
  } | null>(null);

  const { handleSubmit, setValue, watch, reset, formState } =
    useForm<OrderFormValues>({
      resolver: yupResolver(orderSchema),
      defaultValues: {
        tableId: tableId || null,
        customerId: null,
        status: OrderStatusEnum.PENDING,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: null,
        paymentStatus: PaymentStatusEnum.PENDING,
        notes: '',
      },
    });

  // Log de errores de validación
  useEffect(() => {
    if (Object.keys(formState.errors).length > 0) {
      console.error('❌ Errores de validación del formulario:');
      console.error(
        '📋 Errores completos:',
        JSON.stringify(formState.errors, null, 2),
      );

      // Mostrar errores específicos por campo
      Object.entries(formState.errors).forEach(([field, error]) => {
        console.error(`  ⚠️ Campo "${field}":`, error);
      });

      // Mostrar los valores actuales del formulario
      console.log('📊 Valores actuales del formulario:', {
        tableId,
        items: watch('items'),
        subtotal: watch('subtotal'),
        tax: watch('tax'),
        total: watch('total'),
        status: watch('status'),
        paymentStatus: watch('paymentStatus'),
      });
    }
  }, [formState.errors, tableId, watch]);

  const items = watch('items');
  const subtotal = watch('subtotal');
  const tax = watch('tax');
  const total = watch('total');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const activeProducts = await productService.getAll();
        setProducts(activeProducts);
      } catch {
        // Considera mostrar una notificación de error al usuario
      }
    };
    void loadProducts();
  }, []);

  // Carga una orden existente si se provee orderId o si la mesa tiene una orden activa
  useEffect(() => {
    const loadExistingOrder = async () => {
      if (!orderId && !tableId) return;

      setIsLoadingOrder(true);
      try {
        let order: Order | null = null;

        if (orderId) {
          order = await orderService.getById(orderId);
        } else if (tableId) {
          order = await getActiveOrderByTable(tableId);
        }

        if (order) {
          setExistingOrder(order);
          reset({
            tableId: order.tableId || null,
            customerId: order.customerId || null,
            status: order.status,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            paymentMethod: order.paymentMethod || null,
            paymentStatus: order.paymentStatus || PaymentStatusEnum.PENDING,
            notes: order.notes || '',
          });
        }
      } catch {
        // console.error('Error loading existing order:', error);
      } finally {
        setIsLoadingOrder(false);
      }
    };

    void loadExistingOrder();
  }, [orderId, tableId, reset]);

  // Recalcula los totales cada vez que el array de `items` cambia
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    // Solo mostrar el subtotal como total final, sin cargos adicionales
    const newTotal = newSubtotal;

    setValue('subtotal', newSubtotal);
    setValue('tax', 0); // Sin impuestos
    setValue('total', newTotal);
  }, [items, setValue]);

  const handleAddProduct = useCallback(
    (product: Product, customization?: ProductCustomization) => {
      console.log('🛒 Agregando producto:', {
        productId: product.id,
        productName: product.name,
        hasCustomization: !!customization,
        customization,
      });

      const currentItems = watch('items');
      console.log('📦 Items actuales:', currentItems.length);

      // Calcular el precio final con personalizaciones
      const customizationPrice = customization?.customizationPrice || 0;
      const finalPrice = product.price + customizationPrice;

      console.log('💰 Precios:', {
        basePrice: product.price,
        customizationPrice,
        finalPrice,
      });

      // Si hay personalización, siempre crear un nuevo item (incluso si es el mismo producto)
      // porque las personalizaciones pueden ser diferentes
      if (customization) {
        console.log('✨ Producto con personalización, creando nuevo item');
        const newItem = {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: finalPrice,
          total: finalPrice,
          notes: '',
          customizations: customization,
        };
        console.log('📝 Nuevo item:', newItem);
        setValue('items', [...currentItems, newItem]);
      } else {
        // Sin personalización, mantener la lógica original de agregar cantidad
        const existingItemIndex = currentItems.findIndex(
          (item) => item.productId === product.id && !item.customizations,
        );

        if (existingItemIndex >= 0) {
          console.log(
            '🔄 Producto ya existe en posición',
            existingItemIndex,
            ', incrementando cantidad',
          );
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += 1;
          updatedItems[existingItemIndex].total =
            updatedItems[existingItemIndex].quantity *
            updatedItems[existingItemIndex].unitPrice;
          console.log('📝 Item actualizado:', updatedItems[existingItemIndex]);
          setValue('items', updatedItems);
        } else {
          console.log('✨ Producto nuevo, creando item');
          const newItem = {
            productId: product.id,
            name: product.name,
            quantity: 1,
            unitPrice: product.price,
            total: product.price,
            notes: '',
            customizations: null,
          };
          console.log('📝 Nuevo item:', newItem);
          setValue('items', [...currentItems, newItem]);
        }
      }

      console.log('✅ Producto agregado exitosamente');
    },
    [watch, setValue],
  );

  const handleRemoveItem = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      const currentItems = watch('items');
      const item = currentItems[index];

      if (item) {
        setItemToDelete({ index, name: item.name });
        setShowDeleteConfirm(true);
      }
    },
    [watch],
  );

  const confirmDeleteItem = useCallback(() => {
    if (itemToDelete) {
      const currentItems = watch('items');
      const newItems = currentItems.filter((_, i) => i !== itemToDelete.index);
      setValue('items', newItems);

      toast.success({
        title: 'Producto eliminado',
        description: `${itemToDelete.name} ha sido eliminado de la orden`,
      });
    }

    setShowDeleteConfirm(false);
    setItemToDelete(null);
  }, [itemToDelete, watch, setValue, toast]);

  const cancelDeleteItem = useCallback(() => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  }, []);

  const handleQuantityChange = useCallback(
    (index: number, newQuantity: number) => {
      if (newQuantity < 1) return;
      const currentItems = watch('items');
      const updatedItems = [...currentItems];
      updatedItems[index].quantity = newQuantity;
      updatedItems[index].total = newQuantity * updatedItems[index].unitPrice;
      setValue('items', updatedItems);
    },
    [watch, setValue],
  );

  const handleItemNotesChange = useCallback(
    (index: number, notes: string) => {
      const currentItems = watch('items');
      const updatedItems = [...currentItems];
      updatedItems[index].notes = notes;
      setValue('items', updatedItems);
    },
    [watch, setValue],
  );

  const onSubmit = useCallback(
    async (data: OrderFormValues) => {
      // Prevenir múltiples envíos
      if (isSubmitting) {
        console.log('⚠️ Ya hay un envío en proceso, ignorando...');
        return;
      }

      console.log('📦 Iniciando guardado de orden:', data);
      setIsSubmitting(true);

      try {
        if (existingOrder) {
          console.log('✏️ Actualizando orden existente:', existingOrder.id);
          const updateData = {
            ...data,
            customerId: _selectedCustomer?.id || data.customerId,
            updatedAt: new Date(),
            notes: data.notes || null,
          };

          console.log('📝 Datos de actualización:', updateData);
          await orderService.update(existingOrder.id, updateData);

          toast.success({
            title: '✅ Orden actualizada',
            description: 'Los cambios se guardaron correctamente',
          });

          // No resetear isSubmitting antes de navegar
          router.push(`/private/pos/payment/${existingOrder.id}`);
        } else {
          console.log('✨ Creando nueva orden');
          const orderData: Omit<Order, 'id'> = {
            ...data,
            customerId: _selectedCustomer?.id || null,
            userId: session?.user.id || '', // TODO: Reemplazar con el ID del usuario autenticado
            createdAt: new Date(),
            updatedAt: new Date(),
            notes: data.notes || null,
          };

          console.log('📝 Datos de nueva orden:', orderData);
          const createdOrder = await orderService.create(orderData);

          if (createdOrder.tableId) {
            await tableService.update(createdOrder.tableId, {
              orderId: createdOrder.id,
              status: TableStatusEnum.OCCUPIED,
              isAvailable: false,
            });
          }

          toast.success({
            title: '✅ Orden creada',
            description: 'La orden se creó correctamente',
          });

          // No resetear isSubmitting antes de navegar
          router.push(`/private/pos/payment/${createdOrder.id}`);
        }
      } catch (error) {
        console.error('❌ Error saving order:', error);

        // Mostrar el error específico si está disponible
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';

        toast.error({
          title: '❌ Error al guardar',
          description: `No se pudo guardar la orden: ${errorMessage}`,
          duration: 5000,
        });

        // Solo resetear isSubmitting si hay un error
        setIsSubmitting(false);
      }
    },
    [isSubmitting, existingOrder, router, _selectedCustomer, session, toast],
  );

  if (isLoadingOrder) {
    return (
      <Loader
        fullScreen
        text="Cargando orden existente..."
        size="lg"
        color="primary"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      {/* Header con botón volver */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-cyan-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50"
              onClick={() => router.push('/private/pos')}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Volver a Mesas</span>
            </Button>

            <div className="flex items-center gap-4">
              {tableId && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-100 text-cyan-800 rounded-lg">
                  <span className="text-sm font-medium">Mesa:</span>
                  <span className="font-bold">
                    {tableId.slice(-4).toUpperCase()}
                  </span>
                </div>
              )}
              {existingOrder && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <span className="text-sm font-medium">Orden:</span>
                  <span className="font-bold">
                    #{existingOrder.id.slice(-6).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          console.log('📋 Form onSubmit event triggered');
          console.log('📊 Estado actual:', {
            itemsCount: items.length,
            total,
            isSubmitting,
            isLoadingOrder,
          });
          handleSubmit(onSubmit)(e);
        }}
        onKeyDown={(e) => {
          // Prevenir que cualquier tecla envíe el formulario accidentalmente
          // Solo permitir el envío mediante el botón explícito
          if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (
              target.tagName !== 'BUTTON' ||
              target.getAttribute('type') !== 'submit'
            ) {
              e.preventDefault();
            }
          }
        }}
        className="w-full h-[calc(100vh-60px)] flex flex-col"
      >
        <div className="flex-1 flex flex-col xl:flex-row gap-6 p-6 overflow-hidden">
          <div className="flex-1 space-y-6 overflow-auto">
            <ProductSelector
              products={products}
              onAddProductAction={handleAddProduct}
            />
          </div>
          <div className="w-full xl:w-[400px] space-y-6 flex flex-col">
            <OrderSummary
              items={items}
              products={products}
              subtotal={subtotal}
              tax={tax}
              total={total}
              tableId={tableId}
              onRemoveItemAction={handleRemoveItem}
              onQuantityChangeAction={handleQuantityChange}
              onItemNotesChangeAction={handleItemNotesChange}
            />
            {/* Botones de Acción */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50 p-6">
              <div className="space-y-4">
                {/* Información del estado */}
                <div className="text-center py-2">
                  <div className="text-sm text-gray-600 mb-1">
                    {items.length === 0
                      ? 'Agrega productos para continuar'
                      : `${items.length} producto${items.length !== 1 ? 's' : ''} - Total: $${total.toFixed(2)}`}
                  </div>
                  {existingOrder && (
                    <div className="text-xs text-amber-600 font-medium">
                      ✏️ Editando orden existente
                    </div>
                  )}

                  {/* Mostrar errores de validación visualmente */}
                  {Object.keys(formState.errors).length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <div className="font-semibold mb-1">
                        ⚠️ Errores de validación:
                      </div>
                      {Object.entries(formState.errors).map(
                        ([field, error]) => (
                          <div key={field} className="text-left">
                            • {field}: {error?.message || 'Error desconocido'}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Botones principales */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium"
                    onClick={() => router.push('/private/pos')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Volver a Mesas</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={items.length === 0 || isLoadingOrder}
                    onClick={(e) => {
                      console.log('🖱️ Click en botón de guardar/pagar');
                      console.log('🔍 Verificación:', {
                        disabled: items.length === 0 || isLoadingOrder,
                        itemsLength: items.length,
                        isLoadingOrder,
                        isSubmitting,
                        buttonType: e.currentTarget.type,
                      });
                    }}
                    className="h-12 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium relative"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Guardando...</span>
                      </>
                    ) : existingOrder ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar Cambios</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Ir a Pagar</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Texto explicativo */}
                <div className="text-xs text-center text-gray-500 mt-2">
                  {existingOrder
                    ? 'Los cambios se guardarán y podrás continuar con el pago'
                    : 'La orden se guardará y serás dirigido a la página de pago'}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* Modal de confirmación de eliminación */}
      <Modal isOpen={showDeleteConfirm} onClose={cancelDeleteItem}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar eliminación
              </h3>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar{' '}
              <span className="font-semibold text-red-600">
                {itemToDelete?.name}
              </span>{' '}
              de la orden?
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteItem}
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteItem}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
