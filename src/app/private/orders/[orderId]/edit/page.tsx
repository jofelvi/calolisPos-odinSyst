'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '@/shared/types/enumShared';
import { useToast } from '@/components/hooks/useToast';
import { Button } from '@/shared/ui/button/Button';
import { Badge } from '@/shared/ui/badge/badge';
import BackButton from '@/shared/ui/BackButton/BackButton';
import { Input } from '@/shared/ui/input/input';
import SelectCustom from '@/shared/ui/selectCustom/SelectCustom';
import { Loader } from '@/shared';
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState';
import { FormErrorSummary } from '@/shared/ui/formErrorSummary/FormErrorSummary';
import { TextareaWithError } from '@/shared/ui/textarea/TextareaWithError';
import { Order } from '@/modelTypes/order';
import { orderService } from '@/services/firebase/genericServices';

interface OrderFormData {
  status: OrderStatusEnum;
  paymentMethod: PaymentMethodEnum | '';
  paymentStatus: PaymentStatusEnum | '';
  notes: string;
  tableId: string;
}

export default function OrderEditPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const orderId = params.orderId as string;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<OrderFormData>();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const orderData = await orderService.getById(orderId);

        if (!orderData) {
          error({
            title: 'Orden no encontrada',
            description: 'La orden solicitada no fue encontrada',
          });
          router.push('/private/sales');
          return;
        }

        if (
          orderData.status === OrderStatusEnum.DELIVERED ||
          orderData.status === OrderStatusEnum.CANCELLED
        ) {
          error({
            title: 'Acción no permitida',
            description:
              'No se puede editar una orden que ya fue entregada o cancelada',
          });
          router.push(`/private/orders/${orderId}`);
          return;
        }

        setOrder(orderData);

        // Establecer valores del formulario
        setValue('status', orderData.status);
        setValue('paymentMethod', orderData.paymentMethod || '');
        setValue('paymentStatus', orderData.paymentStatus || '');
        setValue('notes', orderData.notes || '');
        setValue('tableId', orderData.tableId || '');
      } catch {
        error({
          title: 'Error de conexión',
          description:
            'No se pudo cargar la información de la orden. Inténtelo nuevamente.',
        });
        router.push('/private/sales');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId, error, router, setValue]);

  const onSubmit = async (data: OrderFormData) => {
    if (!order) return;

    try {
      setSaving(true);

      const updateData: Partial<Order> = {
        status: data.status,
        paymentMethod:
          data.paymentMethod === ''
            ? null
            : (data.paymentMethod as PaymentMethodEnum),
        paymentStatus:
          data.paymentStatus === ''
            ? null
            : (data.paymentStatus as PaymentStatusEnum),
        notes: data.notes || null,
        tableId: data.tableId || null,
      };

      await orderService.update(order.id, updateData);
      success({
        title: 'Orden actualizada',
        description: 'La orden ha sido actualizada correctamente',
      });
      router.push(`/private/orders/${order.id}`);
    } catch {
      error({
        title: 'Error de actualización',
        description:
          'No se pudo actualizar la orden. Verifique los datos e inténtelo nuevamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: OrderStatusEnum) => {
    switch (status) {
      case OrderStatusEnum.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatusEnum.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatusEnum.READY:
        return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatusEnum.DELIVERED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case OrderStatusEnum.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: OrderStatusEnum) => {
    switch (status) {
      case OrderStatusEnum.PENDING:
        return 'Pendiente';
      case OrderStatusEnum.IN_PROGRESS:
        return 'En Preparación';
      case OrderStatusEnum.READY:
        return 'Lista';
      case OrderStatusEnum.DELIVERED:
        return 'Entregada';
      case OrderStatusEnum.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Opciones para los selects
  const statusOptions = [
    { value: OrderStatusEnum.PENDING, label: 'Pendiente' },
    { value: OrderStatusEnum.IN_PROGRESS, label: 'En Preparación' },
    { value: OrderStatusEnum.READY, label: 'Lista' },
    { value: OrderStatusEnum.DELIVERED, label: 'Entregada' },
    { value: OrderStatusEnum.CANCELLED, label: 'Cancelada' },
  ];

  const paymentMethodOptions = [
    { value: '', label: 'No especificado' },
    { value: PaymentMethodEnum.CASH_BS, label: 'Efectivo Bsf' },
    { value: PaymentMethodEnum.CASH_USD, label: 'Efectivo divisa' },
    { value: PaymentMethodEnum.CARD, label: 'Tarjeta' },
    { value: PaymentMethodEnum.TRANSFER, label: 'Transferencia' },
    { value: PaymentMethodEnum.PAGO_MOVIL, label: 'Pago Móvil' },
  ];

  const paymentStatusOptions = [
    { value: '', label: 'No especificado' },
    { value: PaymentStatusEnum.PENDING, label: 'Pendiente' },
    { value: PaymentStatusEnum.PAID, label: 'Pagado' },
    { value: PaymentStatusEnum.REFUNDED, label: 'Cancelado' },
    { value: PaymentStatusEnum.REFUNDED, label: 'Cancelado' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Orden no encontrada"
            description="La orden que buscas no existe o fue eliminada"
            icon="📋"
            actionLabel="Volver a Ventas"
            actionHref="/private/sales"
          />
        </div>
      </div>
    );
  }

  const currentStatus = watch('status');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton href={`/private/orders/${order.id}`} className="mb-4" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Editar Orden #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Creada el {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(currentStatus)} border`}>
                {getStatusText(currentStatus)}
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información de la Orden */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Información de la Orden
                </h2>

                <FormErrorSummary errors={errors} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SelectCustom
                      id="status"
                      label="Estado de la Orden"
                      options={statusOptions}
                      register={register}
                      name="status"
                      error={errors.status}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Mesa"
                      placeholder="Número de mesa (opcional)"
                      {...register('tableId')}
                      error={errors.tableId}
                    />
                  </div>

                  <div>
                    <SelectCustom
                      id="paymentMethod"
                      label="Método de Pago"
                      options={paymentMethodOptions}
                      register={register}
                      name="paymentMethod"
                      error={errors.paymentMethod}
                    />
                  </div>

                  <div>
                    <SelectCustom
                      id="paymentStatus"
                      label="Estado del Pago"
                      options={paymentStatusOptions}
                      register={register}
                      name="paymentStatus"
                      error={errors.paymentStatus}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <TextareaWithError
                    label="Notas"
                    placeholder="Notas adicionales sobre la orden..."
                    {...register('notes')}
                    error={errors.notes}
                    rows={3}
                  />
                </div>
              </div>

              {/* Items de la Orden (Solo lectura) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Items de la Orden ({order.items.length})
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Los items no se pueden modificar desde aquí. Para cambiar
                  items, cancela esta orden y crea una nueva.
                </p>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.unitPrice)} x {item.quantity}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1 italic">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resumen de Totales */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Resumen
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Impuestos:</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Acciones
                </h2>
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/private/orders/${order.id}`)}
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
