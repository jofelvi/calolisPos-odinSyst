'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { OrderStatusEnum, UserRoleEnum } from '@/shared/types/enumShared';
import { EmptyState } from '@/shared/ui/EmptyState/EmptyState';
import { useToast } from '@/shared/hooks/useToast';
import { Loader } from '@/shared';
import { Order } from '@/modelTypes/order';
import { orderService } from '@/services/firebase/genericServices';

export default function SalesPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredOrdersCount, _setFilteredOrdersCount] = useState(0);
  const { error } = useToast();

  // Obtener órdenes al cargar el componente
  useEffect(() => {
    void loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await orderService.getAll();
      setOrders(ordersData);
    } catch {
      error({ title: 'Error al cargar las órdenes' });
    } finally {
      setLoading(false);
    }
  };
  // Verificar autenticación
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <EmptyState
        title="Acceso denegado"
        description="Debes iniciar sesión para ver esta página"
        icon="🔒"
        actionLabel={''}
        actionHref={''}
      />
    );
  }

  const userRole = session.user.role as UserRoleEnum;

  // Filtrar órdenes según el rol
  const getOrdersForRole = (role: UserRoleEnum, allOrders: Order[]) => {
    switch (role) {
      case UserRoleEnum.KITCHEN:
        // Para cocina: solo órdenes pendientes, en progreso y listas
        return allOrders.filter((order) =>
          [
            OrderStatusEnum.PENDING,
            OrderStatusEnum.IN_PROGRESS,
            OrderStatusEnum.READY,
          ].includes(order.status),
        );
      case UserRoleEnum.ADMIN:
      case UserRoleEnum.CASHIER:
      case UserRoleEnum.MANAGER:
        // Para admin/cajero: todas las órdenes
        return allOrders;
      default:
        return [];
    }
  };

  const filteredOrders = getOrdersForRole(userRole, orders);

  // Renderizar vista según el rol
  const renderOrdersView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader />
        </div>
      );
    }

    if (filteredOrders.length === 0 && !loading) {
      return (
        <EmptyState
          title="No hay órdenes"
          description="No se encontraron órdenes para mostrar"
          icon="📋"
          actionLabel={''}
          actionHref={''}
        />
      );
    }

    switch (userRole) {
      case UserRoleEnum.KITCHEN:
        return null; /* (
          //TODO:
          <KitchenOrdersView
            orders={filteredOrders}
            onOrderAction={handleKitchenOrderAction}
            loading={loading}
          />
        );*/

      case UserRoleEnum.ADMIN:
      case UserRoleEnum.CASHIER:
      case UserRoleEnum.MANAGER:
        return null;

      default:
        return (
          <EmptyState
            title="Acceso no autorizado"
            description="Tu rol no tiene permisos para ver las órdenes"
            icon="⚠️"
            actionLabel={''}
            actionHref={''}
          />
        );
    }
  };

  const getPageTitle = () => {
    switch (userRole) {
      case UserRoleEnum.KITCHEN:
        return 'Órdenes de Cocina';
      case UserRoleEnum.ADMIN:
      case UserRoleEnum.CASHIER:
      case UserRoleEnum.MANAGER:
        return 'Gestión de Ventas';
      default:
        return 'Ventas';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-gray-600">
                {userRole === UserRoleEnum.KITCHEN
                  ? 'Gestiona las órdenes de la cocina'
                  : 'Vista general de todas las órdenes'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {userRole === UserRoleEnum.KITCHEN
                  ? filteredOrders.length
                  : filteredOrdersCount || filteredOrders.length}{' '}
                orden
                {(userRole === UserRoleEnum.KITCHEN
                  ? filteredOrders.length
                  : filteredOrdersCount || filteredOrders.length) !== 1
                  ? 'es'
                  : ''}
              </span>
              <button
                onClick={loadOrders}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto">{renderOrdersView()}</main>
    </div>
  );
}
