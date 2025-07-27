'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrderStatusEnum } from '@/shared/types/enumShared';
import { useToast } from '@/shared/hooks/useToast';
import { Button } from '@/shared/ui/button/Button';
import { Badge } from '@/shared/ui/badge/badge';
import BackButton from '@/shared/ui/BackButton/BackButton';
import { Loader } from '@/shared';
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState';
import { Order } from '@/modelTypes/order';
import { orderSpecificService } from '@/services/firebase/orderServices';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const orderId = params.orderId as string;

  useEffect(() => {
    if (orderId) {
      void loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await orderSpecificService.getById(orderId);

      if (!orderData) {
        error({ title: 'Orden no encontrada' });
        router.push('/private/sales');
        return;
      }

      setOrder(orderData);
    } catch {
      error({ title: 'Error al cargar la orden' });
      router.push('/private/sales');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatusEnum) => {
    if (!order) return;

    try {
      setUpdating(true);
      await orderSpecificService.updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus, updatedAt: new Date() });
      success({ title: `Orden ${getStatusText(newStatus).toLowerCase()}` });
    } catch {
      error({ title: 'Error al actualizar la orden' });
    } finally {
      setUpdating(false);
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

  const getAvailableActions = (currentStatus: OrderStatusEnum) => {
    const actions: {
      status: OrderStatusEnum;
      label: string;
      variant?: 'default' | 'outline' | 'destructive';
    }[] = [];

    switch (currentStatus) {
      case OrderStatusEnum.PENDING:
        actions.push(
          { status: OrderStatusEnum.IN_PROGRESS, label: 'Aceptar Orden' },
          {
            status: OrderStatusEnum.CANCELLED,
            label: 'Cancelar',
            variant: 'destructive',
          },
        );
        break;
      case OrderStatusEnum.IN_PROGRESS:
        actions.push(
          { status: OrderStatusEnum.READY, label: 'Marcar como Lista' },
          {
            status: OrderStatusEnum.CANCELLED,
            label: 'Cancelar',
            variant: 'destructive',
          },
        );
        break;
      case OrderStatusEnum.READY:
        actions.push({
          status: OrderStatusEnum.DELIVERED,
          label: 'Marcar como Entregada',
        });
        break;
    }

    return actions;
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton href="/private/sales" className="mb-4" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Orden #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Creada el {formatDateTime(order.createdAt)}
                {order.updatedAt &&
                  order.updatedAt.getTime() !== order.createdAt.getTime() && (
                    <span className="ml-2">
                      • Actualizada el {formatDateTime(order.updatedAt)}
                    </span>
                  )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(order.status)} border`}>
                {getStatusText(order.status)}
              </Badge>
              <Button
                onClick={() => router.push(`/private/orders/${order.id}/edit`)}
                variant="outline"
                disabled={
                  order.status === OrderStatusEnum.DELIVERED ||
                  order.status === OrderStatusEnum.CANCELLED
                }
              >
                Editar Orden
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles de la Orden */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detalles de la Orden
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Mesa
                  </label>
                  <p className="text-gray-900">
                    {order.tableId || 'Para llevar'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Estado
                  </label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Método de Pago
                  </label>
                  <p className="text-gray-900">
                    {order.paymentMethod || 'No especificado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Estado de Pago
                  </label>
                  <p className="text-gray-900">
                    {order.paymentStatus || 'Pendiente'}
                  </p>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">
                    Notas
                  </label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Items de la Orden */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
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
            {getAvailableActions(order.status).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Acciones
                </h2>
                <div className="space-y-3">
                  {getAvailableActions(order.status).map((action) => (
                    <Button
                      key={action.status}
                      onClick={() => handleStatusUpdate(action.status)}
                      variant={action.variant || 'default'}
                      className="w-full"
                      disabled={updating}
                    >
                      {updating ? 'Actualizando...' : action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
