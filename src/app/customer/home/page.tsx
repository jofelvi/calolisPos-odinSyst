'use client';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useCustomerCartStore } from '@/store/useCustomerCartStore';
import { ShoppingBag, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { CUSTOMER_ROUTES } from '@/constants/routes';
import { orderService } from '@/services/firebase/genericServices';
import { Order } from '@/types/order';

export default function CustomerDashboard() {
  const { user } = useUserStore();
  const { items, getTotalPrice, getTotalItems } = useCustomerCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserOrders = async () => {
      if (user?.id) {
        try {
          const allOrders = await orderService.getAll();
          const userOrders = allOrders.filter(
            (order) => order.customerId === user.id,
          );
          setOrders(userOrders);
        } catch (error) {
          console.error('Error loading user orders:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    void loadUserOrders();
  }, [user?.id]);

  // Calculate real order statistics
  const pendingOrders = orders.filter(
    (order) => order.status === 'PENDING',
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === 'COMPLETED' || order.paymentStatus === 'paid',
  ).length;

  const stats = [
    {
      name: 'Carrito Actual',
      value: getTotalItems(),
      icon: ShoppingBag,
      color: 'bg-blue-500',
      href: CUSTOMER_ROUTES.CATALOG,
    },
    {
      name: 'Total en Carrito',
      value: `$${getTotalPrice().toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      href: CUSTOMER_ROUTES.CATALOG,
    },
    {
      name: 'Pedidos Pendientes',
      value: isLoading ? '...' : pendingOrders.toString(),
      icon: Clock,
      color: 'bg-yellow-500',
      href: CUSTOMER_ROUTES.CURRENT_ORDER,
    },
    {
      name: 'Pedidos Completados',
      value: isLoading ? '...' : completedOrders.toString(),
      icon: CheckCircle,
      color: 'bg-purple-500',
      href: CUSTOMER_ROUTES.HISTORY,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Hola, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Aquí puedes ver tu actividad y realizar nuevos pedidos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="space-y-3">
            <Link
              href={CUSTOMER_ROUTES.CATALOG}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 text-blue-500 mr-3" />
                <span className="font-medium">Ver Productos</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>

            <Link
              href={CUSTOMER_ROUTES.HISTORY}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-green-500 mr-3" />
                <span className="font-medium">Historial de Pedidos</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>

        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tu Carrito
            </h2>
            <div className="space-y-3">
              {items.slice(0, 3).map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm font-medium">
                    {item.product.name}
                  </span>
                  <div className="text-sm text-gray-600">
                    {item.quantity}x ${item.product.price.toFixed(2)}
                  </div>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-sm text-gray-500">
                  +{items.length - 3} productos más
                </p>
              )}
              <Link
                href={CUSTOMER_ROUTES.CATALOG}
                className="block w-full text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors mt-4"
              >
                Ver Carrito Completo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
