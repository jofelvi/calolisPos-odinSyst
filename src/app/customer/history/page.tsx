'use client';
import { useEffect, useState } from 'react';
import { Order } from '@/modelTypes/order';
import { useUserStore } from '@/shared/store/useUserStore';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase/firebase';
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  XCircle,
} from 'lucide-react';
import { OrderStatusEnum, PaymentStatusEnum } from '@/shared';
import { CUSTOMER_ROUTES } from '@/shared';
import Link from 'next/link';

const statusConfig = {
  [OrderStatusEnum.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    label: 'Pendiente',
  },
  [OrderStatusEnum.IN_PROGRESS]: {
    color: 'bg-blue-100 text-blue-800',
    icon: Package,
    label: 'En Progreso',
  },
  [OrderStatusEnum.READY]: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Listo',
  },
  [OrderStatusEnum.DELIVERED]: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Entregado',
  },
  [OrderStatusEnum.CANCELLED]: {
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    label: 'Cancelado',
  },
  [OrderStatusEnum.PAID]: {
    color: 'bg-purple-100 text-purple-800',
    icon: DollarSign,
    label: 'Pagado',
  },
};

const paymentStatusConfig = {
  [PaymentStatusEnum.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pendiente',
  },
  [PaymentStatusEnum.PARTIAL]: {
    color: 'bg-orange-100 text-orange-800',
    label: 'Parcial',
  },
  [PaymentStatusEnum.PAID]: {
    color: 'bg-green-100 text-green-800',
    label: 'Pagado',
  },
  [PaymentStatusEnum.REFUNDED]: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Reembolsado',
  },
  [PaymentStatusEnum.CANCELLED]: {
    color: 'bg-red-100 text-red-800',
    label: 'Cancelado',
  },
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    if (user?.id) {
      loadCustomerOrders();
    }
  }, [user]);

  const loadCustomerOrders = async () => {
    if (!user?.id) return;

    try {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', user.id),
        orderBy('createdAt', 'desc'),
      );

      const snapshot = await getDocs(q);
      const orderData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Order[];

      setOrders(orderData);
    } catch {
      // Error loading customer orders - handled by UI state
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Historial de Pedidos
        </h1>
        <p className="text-gray-600">Revisa todos tus pedidos anteriores</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes pedidos aún
          </h3>
          <p className="text-gray-600 mb-4">
            ¡Realiza tu primer pedido y aparecerá aquí!
          </p>
          <Link
            href={CUSTOMER_ROUTES.CATALOG}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all duration-200 shadow-lg"
          >
            Ver Productos
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status];
            const paymentInfo = order.paymentStatus
              ? paymentStatusConfig[order.paymentStatus]
              : null;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{order.id.slice(-8)}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </span>
                        {paymentInfo && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentInfo.color}`}
                          >
                            {paymentInfo.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {order.items.length} productos
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ${order.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.paymentMethod && `Pago: ${order.paymentMethod}`}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Productos:
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-gray-50 rounded p-3"
                        >
                          <div>
                            <span className="font-medium text-gray-900">
                              {item.name}
                            </span>
                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                Nota: {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {item.quantity}x ${item.unitPrice.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total: ${item.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Notas del pedido:
                      </h4>
                      <p className="text-gray-600 bg-gray-50 rounded p-3">
                        {order.notes}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        ${order.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-600">Impuestos:</span>
                      <span className="font-medium">
                        ${order.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
