// app/private/pos/order/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { OrderFormValues, orderSchema } from '@/schemas/orderSchema';
import {
  OrderStatusEnum,
  PaymentStatusEnum,
  TableStatusEnum,
} from '@/types/enumShared';
import {
  getActiveOrderByTable,
  orderService,
  productService,
  tableService,
} from '@/services/firebase/genericServices';
import { Order } from '@/types/order';
import { Card } from '@/components/shared/card/card';
import { Button } from '@/components/shared/button/Button';
import ProductSelector from '@/app/components/pos/ProductSelector';
import OrderSummary from '@/app/components/pos/OrderSummary';
import Loader from '@/components/shared/Loader/Loader';
import { useSession } from 'next-auth/react'; // Constantes para las tasas de impuestos y servicios para mejor legibilidad y mantenimiento

const TAX_RATE = 0.17;
const SERVICE_CHARGE_RATE = 0.1;

export default function OrderPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const tableId = searchParams.get('tableId');
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  const { handleSubmit, setValue, watch, reset } = useForm<OrderFormValues>({
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

  const items = watch('items');
  const subtotal = watch('subtotal');
  const tax = watch('tax');
  const total = watch('total');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const activeProducts = await productService.getAll();
        setProducts(activeProducts);
      } catch (error) {
        console.error('Error loading products:', error);
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
      } catch (error) {
        console.error('Error loading existing order:', error);
      } finally {
        setIsLoadingOrder(false);
      }
    };

    void loadExistingOrder();
  }, [orderId, tableId, reset]);

  // Recalcula los totales cada vez que el array de `items` cambia
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    const newTaxAmount = newSubtotal * TAX_RATE;
    const serviceCharge = newSubtotal * SERVICE_CHARGE_RATE;
    const newTotal = newSubtotal + newTaxAmount + serviceCharge;

    setValue('subtotal', newSubtotal);
    setValue('tax', TAX_RATE); // Almacena la tasa de impuesto
    setValue('total', newTotal);
  }, [items, setValue]);

  const handleAddProduct = useCallback(
    (product: Product) => {
      const currentItems = watch('items');
      const existingItemIndex = currentItems.findIndex(
        (item) => item.productId === product.id,
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += 1;
        updatedItems[existingItemIndex].total =
          updatedItems[existingItemIndex].quantity *
          updatedItems[existingItemIndex].unitPrice;
        setValue('items', updatedItems);
      } else {
        setValue('items', [
          ...currentItems,
          {
            productId: product.id,
            name: product.name,
            quantity: 1,
            unitPrice: product.price,
            total: product.price,
            notes: '',
          },
        ]);
      }
    },
    [watch, setValue],
  );

  const handleRemoveItem = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      const currentItems = watch('items');
      const newItems = currentItems.filter((_, i) => i !== index);
      setValue('items', newItems);
    },
    [watch, setValue],
  );

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
      setIsSubmitting(true);
      try {
        if (existingOrder) {
          const updateData = {
            ...data,
            customerId: selectedCustomer?.id || data.customerId,
            updatedAt: new Date(),
            notes: data.notes || null,
          };

          await orderService.update(existingOrder.id, updateData);
          router.push(`/private/pos/payment/${existingOrder.id}`);
        } else {
          const orderData: Omit<Order, 'id'> = {
            ...data,
            customerId: selectedCustomer?.id || null,
            userId: session?.user.id || '', // TODO: Reemplazar con el ID del usuario autenticado
            createdAt: new Date(),
            updatedAt: new Date(),
            notes: data.notes || null,
          };

          const createdOrder = await orderService.create(orderData);

          if (createdOrder.tableId) {
            await tableService.update(createdOrder.tableId, {
              orderId: createdOrder.id,
              status: TableStatusEnum.OCCUPIED,
              isAvailable: false,
            });
          }

          router.push(`/private/pos/payment/${createdOrder.id}`);
        }
      } catch (error) {
        console.error('Error saving order:', error);
        // TODO: Mostrar una notificación de error al usuario
      } finally {
        setIsSubmitting(false);
      }
    },
    [existingOrder, router, selectedCustomer],
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full h-screen flex flex-col"
      >
        <div className="flex-1 flex flex-col xl:flex-row gap-6 p-6 overflow-hidden">
          <div className="flex-1 space-y-6 overflow-auto">
            <ProductSelector
              products={products}
              onAddProduct={handleAddProduct}
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
              onRemoveItem={handleRemoveItem}
              onQuantityChange={handleQuantityChange}
              onItemNotesChange={handleItemNotesChange}
            />
            {/* Botones de Acción */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50 p-6">
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                  onClick={() => router.push('/private/pos')}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting || items.length === 0 || isLoadingOrder
                  }
                  className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-lg disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Procesando...'
                    : existingOrder
                      ? 'Actualizar Orden'
                      : 'Continuar a Pago'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
