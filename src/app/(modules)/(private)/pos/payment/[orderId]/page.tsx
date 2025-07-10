// app/pos/payment/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types/order';
import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '@/types/enumShared';
import {
  orderService,
  paymentService,
} from '@/services/firebase/genericServices';
import { Payment } from '@/types/payment';
import { MdAccountBalance, MdCreditCard } from 'react-icons/md';
import { ColumnDef } from '@tanstack/react-table';
import { OrderItem } from '@/types/orderItem';
import Table from '@/components/shared/Table';
import { IoMdCash } from 'react-icons/io';

interface PageProps {
  params: { orderId: string };
}

export default function PaymentPage({ params }: PageProps) {
  const { orderId } = params;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>(
    PaymentMethodEnum.CASH,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [serviceCharge, setServiceCharge] = useState(0);

  const handleUpdateQuantity = async (
    itemIndex: number,
    newQuantity: number,
  ) => {
    if (!order || newQuantity < 0) return;

    const updatedItems = [...order.items];
    if (newQuantity === 0) {
      updatedItems.splice(itemIndex, 1);
    } else {
      // Actualizar cantidad
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: newQuantity,
      };
    }

    // Recalcular totales
    const newSubtotal = updatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const newTax = newSubtotal * 0.1; // Asumiendo 10% de impuesto
    const newTotal = newSubtotal + newTax;

    try {
      await orderService.update(order.id, {
        items: updatedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
        updatedAt: new Date(),
      });

      // Actualizar estado local
      const updatedOrder = {
        ...order,
        items: updatedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      };
      setOrder(updatedOrder);
      setPaymentAmount(newTotal + tipAmount);
      setServiceCharge(newSubtotal * 0.1);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleRemoveItem = async (itemIndex: number) => {
    await handleUpdateQuantity(itemIndex, 0);
  };

  // Definir columnas para la tabla de items
  const columns: ColumnDef<OrderItem>[] = [
    {
      accessorKey: 'name',
      header: 'ITEM',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {row.original.name}
          {row.original.notes && (
            <div className="mt-1 text-xs text-gray-500">
              ({row.original.notes})
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'unitPrice',
      header: 'PRICE',
      cell: ({ row }) => (
        <span className="font-medium">
          ${row.original.unitPrice.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'QTY',
      cell: ({ row }) => {
        const itemIndex =
          order?.items.findIndex(
            (item) =>
              item.productId === row.original.productId &&
              item.unitPrice === row.original.unitPrice,
          ) ?? -1;

        return (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() =>
                handleUpdateQuantity(itemIndex, row.original.quantity - 1)
              }
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-bold hover:bg-gray-300"
              disabled={row.original.quantity <= 1}
            >
              -
            </button>
            <span className="text-center font-medium min-w-[2rem]">
              {row.original.quantity}
            </span>
            <button
              onClick={() =>
                handleUpdateQuantity(itemIndex, row.original.quantity + 1)
              }
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-bold hover:bg-gray-300"
            >
              +
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'subtotal',
      header: 'SUBTOTAL',
      cell: ({ row }) => {
        const itemIndex =
          order?.items.findIndex(
            (item) =>
              item.productId === row.original.productId &&
              item.unitPrice === row.original.unitPrice,
          ) ?? -1;

        return (
          <div className="flex items-center justify-end gap-2 text-right">
            <span className="font-semibold">
              ${(row.original.unitPrice * row.original.quantity).toFixed(2)}
            </span>
            <button
              onClick={() => handleRemoveItem(itemIndex)}
              className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
              title="Eliminar item"
            >
              🗑️
            </button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderData = await orderService.getById(orderId);
        if (!orderData) {
          router.push('/pos');
          return;
        }
        setOrder(orderData);
        setPaymentAmount(orderData.total);
        // Calcular service charge (10% ejemplo)
        setServiceCharge(orderData.subtotal * 0.1);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, router]);

  const handlePayment = async () => {
    if (!order) return;

    setIsProcessing(true);
    try {
      const paymentData: Omit<Payment, 'id'> = {
        orderId: order.id,
        amount: paymentAmount,
        method: paymentMethod,
        userId: 'current-user-id',
        createdAt: new Date(),
      };

      await paymentService.create(paymentData);

      const newStatus =
        paymentAmount >= order.total
          ? PaymentStatusEnum.PAID
          : PaymentStatusEnum.PARTIAL;
      await orderService.update(order.id, {
        paymentStatus: newStatus,
        status:
          newStatus === PaymentStatusEnum.PAID
            ? OrderStatusEnum.PAID
            : order.status,
        updatedAt: new Date(),
      });

      router.push(`/pos/receipt/${order.id}`);
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTipSelect = (amount: number) => {
    // Si ya está seleccionada la misma propina, la deseleccionamos
    if (selectedTip === amount) {
      setSelectedTip(null);
      setTipAmount(0);
      setPaymentAmount(order ? order.total : 0);
    } else {
      // Seleccionar nueva propina
      setSelectedTip(amount);
      setTipAmount(amount);
      setPaymentAmount(order ? order.total + amount : amount);
    }
  };

  const totalWithTip = order ? order.total + tipAmount : 0;
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (loading || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Panel Izquierdo - Detalles de la Orden */}
          <div className="space-y-6 lg:col-span-2">
            {/* Header */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    ORDER #: {orderId.slice(-8).toUpperCase()}
                  </h1>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      📋 TABLE: {order.tableId || 'TO GO'}
                    </span>
                    <span className="flex items-center gap-1">
                      🕒 TIME: {currentTime}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">GUESTS</div>
                  <div className="text-2xl font-bold">👥 2</div>
                </div>
              </div>
            </div>

            {/* Tabla de Items */}
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <Table
                data={order.items}
                columns={columns}
                pageSize={10}
                headerStyles="bg-gray-50 border-b"
                bodyStyles="bg-white divide-y divide-gray-200"
                rowStyles="hover:bg-gray-50 transition-colors"
              />
            </div>
          </div>

          {/* Panel Derecho - Pago */}
          <div className="space-y-6">
            {/* Resumen de Pago */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-center text-xl font-semibold">
                PAYABLE AMOUNT
              </h2>

              <div className="mb-6 text-center">
                <div className="text-4xl font-bold text-green-600">
                  ${totalWithTip.toFixed(2)}
                </div>
              </div>

              {/* Botones de Propina */}
              <div className="mb-6">
                <div className="mb-2 text-sm font-medium">ADD TIP</div>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => handleTipSelect(tip)}
                      className={`flex-1 py-2 px-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTip === tip
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ${tip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Métodos de Pago */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod(PaymentMethodEnum.CASH)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === PaymentMethodEnum.CASH
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <IoMdCash className="mx-auto mb-1 h-6 w-6" />
                  <div className="text-xs font-medium">CASH</div>
                </button>

                <button
                  onClick={() => setPaymentMethod(PaymentMethodEnum.CARD)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === PaymentMethodEnum.CARD
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MdCreditCard className="mx-auto mb-1 h-6 w-6" />
                  <div className="text-xs font-medium">ONLINE</div>
                </button>

                <button
                  onClick={() => setPaymentMethod(PaymentMethodEnum.TRANSFER)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === PaymentMethodEnum.TRANSFER
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MdAccountBalance className="mx-auto mb-1 h-6 w-6" />
                  <div className="text-xs font-medium">OTHERS</div>
                </button>
              </div>

              {/* Input de Efectivo Recibido */}
              {paymentMethod === PaymentMethodEnum.CASH && (
                <div className="mb-6">
                  <button className="w-full rounded-lg bg-gray-100 p-4 text-left transition-colors hover:bg-gray-200">
                    <div className="mb-1 text-sm text-gray-600">
                      ADD CASH RECEIVED
                    </div>
                    <div className="text-2xl font-bold">
                      ${paymentAmount.toFixed(2)}
                    </div>
                  </button>
                </div>
              )}

              {/* Resumen de Costos */}
              <div className="border-t pt-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TIPS</span>
                  <span>${tipAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SERVICE CHARGE 10%</span>
                  <span>${serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>TOTAL</span>
                  <span>${totalWithTip.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/pos/order/${orderId}`)}
                className="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-600"
              >
                CANCEL ORDER
              </button>

              <button
                onClick={handlePayment}
                disabled={isProcessing || paymentAmount <= 0}
                className="w-full rounded-lg bg-teal-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-teal-600 disabled:bg-gray-300"
              >
                {isProcessing ? 'PROCESSING...' : 'PAY NOW'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
