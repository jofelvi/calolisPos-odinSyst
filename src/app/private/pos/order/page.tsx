// app/pos/order/page.tsx
'use client';

import { useEffect, useState } from 'react';
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

export default function OrderPage() {
  const searchParams = useSearchParams();
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

  const { handleSubmit, setValue, watch } = useForm<OrderFormValues>({
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
      const activeProducts = await productService.getAll();
      setProducts(activeProducts);
    };
    void loadProducts();
  }, []);

  // Load existing order if orderId or tableId with active order
  useEffect(() => {
    const loadExistingOrder = async () => {
      if (!orderId && !tableId) return;

      setIsLoadingOrder(true);
      try {
        let order: Order | null = null;

        if (orderId) {
          // Load specific order by ID
          order = await orderService.getById(orderId);
        } else if (tableId) {
          // Check if table has active order
          order = await getActiveOrderByTable(tableId);
        }

        if (order) {
          setExistingOrder(order);

          // Populate form with existing order data
          setValue('tableId', order.tableId || '');
          setValue('customerId', order.customerId || '');
          setValue('status', order.status || '');
          setValue('items', order.items);
          setValue('subtotal', order.subtotal);
          setValue('tax', order.tax);
          setValue('total', order.total);
          setValue('paymentMethod', order.paymentMethod);
          setValue('paymentStatus', order.paymentStatus);
          setValue('notes', order.notes || '');

          // Set customer if exists
          if (order.customerId) {
            // TODO: Load customer data if needed
          }
        }
      } catch (error) {
        console.error('Error loading existing order:', error);
      } finally {
        setIsLoadingOrder(false);
      }
    };

    void loadExistingOrder();
  }, [orderId, tableId, setValue]);

  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    const newTax = newSubtotal * 0.17; // impuestos 17%
    const newTotal = newSubtotal + newTax + newSubtotal * 0.1; // +10% service charge

    setValue('subtotal', newSubtotal);
    setValue('tax', 0.17); // solo almacenamos porcentaje
    setValue('total', newTotal);
  }, [items, setValue]);

  const handleAddProduct = (product: Product) => {
    const existingItemIndex = items.findIndex(
      (item) => item.productId === product.id,
    );
    if (existingItemIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total =
        updatedItems[existingItemIndex].quantity *
        updatedItems[existingItemIndex].unitPrice;
      setValue('items', updatedItems);
    } else {
      setValue('items', [
        ...items,
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
  };

  const handleRemoveItem = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const newItems = items.filter((_, i) => i !== index);
    setValue('items', newItems);
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = [...items];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = newQuantity * updatedItems[index].unitPrice;
    setValue('items', updatedItems);
  };

  const handleItemNotesChange = (index: number, notes: string) => {
    const updatedItems = [...items];
    updatedItems[index].notes = notes;
    setValue('items', updatedItems);
  };

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      if (existingOrder) {
        // Update existing order
        const updateData = {
          ...data,
          customerId: selectedCustomer?.id || data.customerId,
          updatedAt: new Date(),
          notes: data.notes || null,
        };

        await orderService.update(existingOrder.id, updateData);
        router.push(`/private/pos/payment/${existingOrder.id}`);
      } else {
        // Create new order
        const orderData: Omit<Order, 'id'> = {
          ...data,
          customerId: selectedCustomer?.id || null,
          userId: 'current-user-id', // TODO: Reemplazar
          createdAt: new Date(),
          updatedAt: new Date(),
          notes: data.notes || null,
        };

        const createdOrder = await orderService.create(orderData);

        // Si la orden tiene una mesa asociada, asignar el orderId y cambiar status
        if (createdOrder.tableId) {
          console.log(
            'entro a aquiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
          );
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
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {/* Resumen + Botones */}
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
            {/* Botones */}
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
