'use client';
import { useEffect, useState } from 'react';
import { Order } from '@/modelTypes/order';
import { useUserStore } from '@/shared/store/useUserStore';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebase';
import { CheckCircle, ChefHat, Coffee, Package, XCircle } from 'lucide-react';
import { OrderStatusEnum } from '@/shared';
import { CUSTOMER_ROUTES } from '@/constants/routes';

const statusSteps = [
  {
    status: OrderStatusEnum.PENDING,
    label: 'Pedido Recibido',
    icon: Coffee,
    description: 'Tu pedido ha sido recibido y está en cola',
  },
  {
    status: OrderStatusEnum.IN_PROGRESS,
    label: 'Preparando',
    icon: ChefHat,
    description: 'Nuestro equipo está preparando tu pedido',
  },
  {
    status: OrderStatusEnum.READY,
    label: 'Listo',
    icon: Package,
    description: 'Tu pedido está listo para recoger',
  },
  {
    status: OrderStatusEnum.DELIVERED,
    label: 'Entregado',
    icon: CheckCircle,
    description: 'Tu pedido ha sido entregado',
  },
];

export default function CurrentOrder() {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    if (user?.id) {
      loadCurrentOrder();
      // Set up interval to refresh order status every 30 seconds
      const interval = setInterval(loadCurrentOrder, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadCurrentOrder = async () => {
    if (!user?.id) return;

    try {
      // Get the most recent order that's not delivered or cancelled
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', user.id),
        where('status', 'in', [
          OrderStatusEnum.PENDING,
          OrderStatusEnum.IN_PROGRESS,
          OrderStatusEnum.READY,
        ]),
        orderBy('createdAt', 'desc'),
        limit(1),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setCurrentOrder(null);
      } else {
        const orderData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
          createdAt: snapshot.docs[0].data().createdAt?.toDate(),
          updatedAt: snapshot.docs[0].data().updatedAt?.toDate(),
        } as Order;

        setCurrentOrder(orderData);
      }
    } catch {
      // Error loading current order - handled by UI state
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: OrderStatusEnum) => {
    return statusSteps.findIndex((step) => step.status === status);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getEstimatedTime = () => {
    if (!currentOrder) return '';

    const orderTime = currentOrder.createdAt.getTime();
    const now = Date.now();
    const elapsed = now - orderTime;

    // Estimate 15-20 minutes total preparation time
    const estimatedTotal = 20 * 60 * 1000; // 20 minutes in milliseconds
    const remaining = Math.max(0, estimatedTotal - elapsed);

    if (remaining === 0) return 'Muy pronto';

    const minutes = Math.ceil(remaining / (60 * 1000));
    return `${minutes} min aprox.`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Estado del Pedido
          </h1>
          <p className="text-gray-600">
            Seguimiento en tiempo real de tu pedido actual
          </p>
        </div>

        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes pedidos activos
          </h3>
          <p className="text-gray-600 mb-4">
            Realiza un pedido para ver su estado aquí.
          </p>
          <a
            href={CUSTOMER_ROUTES.CATALOG}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Ver Productos
          </a>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStatusStepIndex(currentOrder.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estado del Pedido</h1>
        <p className="text-gray-600">
          Seguimiento en tiempo real de tu pedido actual
        </p>
      </div>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Pedido #{currentOrder.id.slice(-8)}
            </h2>
            <p className="text-gray-600">
              Realizado el {formatDate(currentOrder.createdAt)} a las{' '}
              {formatTime(currentOrder.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              ${currentOrder.total.toFixed(2)}
            </div>
            <div className="text-sm text-green-600 font-medium">
              Tiempo estimado: {getEstimatedTime()}
            </div>
          </div>
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Progreso del Pedido
        </h3>

        <div className="relative">
          <div className="flex justify-between items-center">
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.status}
                  className="flex flex-col items-center relative"
                >
                  {/* Connector Line */}
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`absolute top-6 left-full w-full h-0.5 ${
                        index < currentStepIndex
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: 'calc(100% + 2rem)' }}
                    />
                  )}

                  {/* Step Circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                          ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>

                  {/* Step Label */}
                  <div className="mt-4 text-center max-w-24">
                    <div
                      className={`text-sm font-medium ${
                        isCompleted || isCurrent
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {currentOrder.status === OrderStatusEnum.CANCELLED && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">Pedido Cancelado</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Tu pedido ha sido cancelado. Si tienes alguna pregunta, por favor
              contáctanos.
            </p>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detalles del Pedido
        </h3>

        <div className="space-y-3">
          {currentOrder.items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-50 rounded p-3"
            >
              <div>
                <span className="font-medium text-gray-900">{item.name}</span>
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
                  ${item.total.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentOrder.notes && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-900 mb-1">
              Notas especiales:
            </h4>
            <p className="text-blue-800 text-sm">{currentOrder.notes}</p>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              ${currentOrder.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-gray-600">Impuestos:</span>
            <span className="font-medium">${currentOrder.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t">
            <span>Total:</span>
            <span className="text-blue-600">
              ${currentOrder.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ¿Necesitas ayuda?
        </h3>
        <p className="text-gray-600 mb-4">
          Si tienes alguna pregunta sobre tu pedido o necesitas hacer algún
          cambio, no dudes en contactarnos.
        </p>
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Contactar Soporte
          </button>
          <a
            href={CUSTOMER_ROUTES.HISTORY}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver Historial
          </a>
        </div>
      </div>
    </div>
  );
}
