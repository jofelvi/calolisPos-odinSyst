// app/pos/order/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { OrderFormValues, orderSchema } from '@/schemas/orderSchema';
import { OrderStatusEnum, PaymentStatusEnum } from '@/types/enumShared';
import {
  orderService,
  productService,
} from '@/services/firebase/genericServices';
import { Order } from '@/types/order';
import { Card } from '@/components/shared/card/card';
import { Button } from '@/components/shared/button/Button';
import CustomerSearch from '@/app/components/pos/CustomerSearch';
import ProductSelector from '@/app/components/pos/ProductSelector';
import OrderSummary from '@/app/components/pos/OrderSummary';

export default function OrderPage() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      const orderData: Omit<Order, 'id'> = {
        ...data,
        customerId: selectedCustomer?.id || null,
        userId: 'current-user-id', // TODO: Reemplazar
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: data.notes || null,
      };

      const createdOrder = await orderService.create(orderData);
      router.push(`/pos/payment/${createdOrder.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full h-full">
      <div className="flex flex-col xl:flex-row gap-6 p-6">
        <div className="flex-1 space-y-6">
          <ProductSelector
            products={products}
            onAddProduct={handleAddProduct}
          />
        </div>
        {/* Resumen + Cliente */}
        <div className="w-full xl:w-[400px] space-y-6">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onRemoveItem={handleRemoveItem}
            onQuantityChange={handleQuantityChange}
          />
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Cliente</h2>
            <CustomerSearch
              onSelectCustomer={setSelectedCustomer}
              selectedCustomer={selectedCustomer}
            />
          </Card>
        </div>
      </div>
      <div className="flex justify-end gap-4 px-6 pb-6">
        <Card className="p-4 w-1/3 flex items-center">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => router.push('/pos')}
          >
            Cancelar
          </Button>

          <Button type="submit" disabled={isSubmitting || items.length === 0}>
            {isSubmitting ? 'Procesando...' : 'Continuar a Pago'}
          </Button>
        </Card>
      </div>
    </form>
  );
}
