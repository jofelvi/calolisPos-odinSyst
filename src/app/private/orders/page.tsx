'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiFilter,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebase';
import { orderService } from '@/services/firebase/genericServices';
import {
  convertFirebaseDate,
  formatDate,
  getDateRange,
  filterOrdersByDateRange,
} from '@/shared/utils/dateHelpers';
import { Order } from '@/modelTypes/order';
import {
  OrderStatusEnum,
  PaymentStatusEnum,
  UserRoleEnum,
  DateFilterEnum,
} from '@/shared';
import { Button } from '@/components/shared/button/Button';
import { useUserStore } from '@/shared/store/useUserStore';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';
import { formatCurrency } from '@/shared/utils/currencyHelpers';
import { Badge } from '@/shared/ui/badge/badge';
import Modal from '@/shared/ui/modal';

// Función para obtener órdenes de las últimas 24 horas
const getOrdersLast24Hours = async (): Promise<Order[]> => {
  try {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const ordersCollection = collection(db, 'orders');
    const q = query(
      ordersCollection,
      where('createdAt', '>=', Timestamp.fromDate(yesterday)),
      orderBy('createdAt', 'desc'),
    );

    const ordersSnapshot = await getDocs(q);

    return ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirebaseDate(doc.data().createdAt),
      updatedAt: convertFirebaseDate(doc.data().updatedAt),
    })) as Order[];
  } catch (error) {
    console.error('Error fetching last 24h orders:', error);
    throw new Error('Failed to fetch recent orders');
  }
};

// Función para obtener órdenes de hoy (más eficiente que filtrar todo)
const getOrdersToday = async (): Promise<Order[]> => {
  try {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const ordersCollection = collection(db, 'orders');
    const q = query(
      ordersCollection,
      where('createdAt', '>=', Timestamp.fromDate(startOfToday)),
      orderBy('createdAt', 'desc'),
    );

    const ordersSnapshot = await getDocs(q);

    return ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirebaseDate(doc.data().createdAt),
      updatedAt: convertFirebaseDate(doc.data().updatedAt),
    })) as Order[];
  } catch (error) {
    console.error('Error fetching today orders:', error);
    throw new Error('Failed to fetch today orders');
  }
};

// Función para obtener órdenes de un cliente específico
const getCustomerOrders = async (customerId: string): Promise<Order[]> => {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(
      ordersCollection,
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
    );

    const ordersSnapshot = await getDocs(q);

    return ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertFirebaseDate(doc.data().createdAt),
      updatedAt: convertFirebaseDate(doc.data().updatedAt),
    })) as Order[];
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    throw new Error('Failed to fetch customer orders');
  }
};

export default function OrdersPage() {
  const { user } = useUserStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatusEnum | 'ALL'>(
    'ALL',
  );
  const [dateFilter, setDateFilter] = useState<DateFilterEnum>(
    DateFilterEnum.TODAY,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let fetchedOrders: Order[];

      // Filtrar por rol del usuario
      if (
        user.role === UserRoleEnum.ADMIN ||
        user.role === UserRoleEnum.MANAGER
      ) {
        // Admin/Manager: Para filtro de "hoy" usar consulta optimizada, sino cargar todo
        if (dateFilter === DateFilterEnum.TODAY) {
          fetchedOrders = await getOrdersToday();
        } else {
          fetchedOrders = await orderService.getAll();
        }
      } else if (user.role === UserRoleEnum.CUSTOMER) {
        // Cliente: Ver solo sus propias órdenes (historial personal)
        fetchedOrders = await getCustomerOrders(user.id);
      } else {
        // Cajeros y otros roles: Para filtro de "hoy" usar consulta optimizada, sino 24h
        if (dateFilter === DateFilterEnum.TODAY) {
          fetchedOrders = await getOrdersToday();
        } else {
          fetchedOrders = await getOrdersLast24Hours();
        }
      }

      // Ordenar por fecha de creación (más recientes primero)
      fetchedOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, [user, dateFilter]);

  // Obtener rango de fechas basado en el filtro seleccionado
  const dateRange = getDateRange(dateFilter);

  // Filtrar órdenes por fecha primero
  const dateFilteredOrders = filterOrdersByDateRange(
    orders,
    dateRange.startDate,
    dateRange.endDate,
  );

  // Luego filtrar por estado
  const statusFilteredOrders = dateFilteredOrders.filter(
    (order) => statusFilter === 'ALL' || order.status === statusFilter,
  );

  // Finalmente filtrar por término de búsqueda
  const filteredOrders = statusFilteredOrders.filter((order) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.tableId?.toString().toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.items.some((item: { name: string }) =>
        item.name.toLowerCase().includes(searchLower),
      )
    );
  });

  const handleOrderClick = (order: Order) => {
    // Si la orden está pagada, mostrar modal con resumen
    if (order.status === OrderStatusEnum.PAID) {
      setSelectedOrder(order);
      setShowOrderModal(true);
      return;
    }

    // Si tiene mesa asociada, ir a POS con tableId
    if (order.tableId) {
      router.push(
        `${PRIVATE_ROUTES.POS_ORDER}?tableId=${order.tableId}&orderId=${order.id}`,
      );
    } else {
      // Pedido para llevar/delivery - ir a POS con datos de la orden
      router.push(`${PRIVATE_ROUTES.POS_ORDER}?orderId=${order.id}`);
    }
  };

  const handleCloseModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
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
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case OrderStatusEnum.PAID:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case OrderStatusEnum.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatusEnum) => {
    switch (status) {
      case PaymentStatusEnum.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentStatusEnum.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatusEnum.PARTIAL:
        return 'bg-orange-100 text-orange-800';
      case PaymentStatusEnum.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OrderStatusEnum) => {
    const labels = {
      [OrderStatusEnum.PENDING]: 'Pendiente',
      [OrderStatusEnum.IN_PROGRESS]: 'En Progreso',
      [OrderStatusEnum.READY]: 'Lista',
      [OrderStatusEnum.DELIVERED]: 'Entregada',
      [OrderStatusEnum.PAID]: 'Pagada',
      [OrderStatusEnum.CANCELLED]: 'Cancelada',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: PaymentStatusEnum) => {
    const labels = {
      [PaymentStatusEnum.PAID]: 'Pagado',
      [PaymentStatusEnum.PENDING]: 'Pendiente',
      [PaymentStatusEnum.PARTIAL]: 'Parcial',
      [PaymentStatusEnum.CANCELLED]: 'Cancelado',
      [PaymentStatusEnum.REFUNDED]: 'Reembolsado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl shadow-sm">
                <FiShoppingCart className="text-cyan-600 w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {user?.role === UserRoleEnum.ADMIN ||
                  user?.role === UserRoleEnum.MANAGER
                    ? 'Gestión de Órdenes'
                    : user?.role === UserRoleEnum.CUSTOMER
                      ? 'Mi Historial de Órdenes'
                      : 'Órdenes Actuales'}
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {user?.role === UserRoleEnum.ADMIN ||
                  user?.role === UserRoleEnum.MANAGER
                    ? 'Vista completa y control total de todas las órdenes del sistema'
                    : user?.role === UserRoleEnum.CUSTOMER
                      ? 'Todas tus órdenes realizadas'
                      : 'Órdenes de las últimas 24 horas'}
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 mb-4">
                <FiFilter className="text-gray-500 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">
                  Filtros y Búsqueda:
                </span>
              </div>

              {/* Búsqueda */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
                <div className="relative flex-1 max-w-md">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por ID, mesa, cliente o producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Acciones Rápidas */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchOrders()}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <FiRefreshCw
                      className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                    />
                    Actualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Filtro de Tiempo */}
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <span className="text-sm text-gray-600 min-w-max">
                    Período:
                  </span>
                  <select
                    value={dateFilter}
                    onChange={(e) =>
                      setDateFilter(e.target.value as DateFilterEnum)
                    }
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value={DateFilterEnum.TODAY}>Hoy</option>
                    <option value={DateFilterEnum.YESTERDAY}>Ayer</option>
                    <option value={DateFilterEnum.LAST_WEEK}>
                      Última semana
                    </option>
                    <option value={DateFilterEnum.LAST_TWO_WEEKS}>
                      2 semanas
                    </option>
                    <option value={DateFilterEnum.THIS_MONTH}>Este mes</option>
                    <option value={DateFilterEnum.LAST_MONTH}>
                      Mes anterior
                    </option>
                  </select>
                </div>

                {/* Filtro de Estado */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-600 min-w-max">
                    Estado:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('ALL')}
                    >
                      Todas
                    </Button>
                    {Object.values(OrderStatusEnum).map((status) => (
                      <Button
                        key={status}
                        variant={
                          statusFilter === status ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                      >
                        {getStatusLabel(status)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Órdenes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredOrders.length}
                </p>
              </div>
              <FiShoppingCart className="text-cyan-600 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    dateFilteredOrders.filter(
                      (o) => o.status === OrderStatusEnum.PENDING,
                    ).length
                  }
                </p>
              </div>
              <FiClock className="text-yellow-600 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {
                    dateFilteredOrders.filter(
                      (o) => o.status === OrderStatusEnum.IN_PROGRESS,
                    ).length
                  }
                </p>
              </div>
              <FiClock className="text-blue-600 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    dateFilteredOrders.reduce(
                      (sum, order) => sum + order.total,
                      0,
                    ),
                  )}
                </p>
              </div>
              <FiDollarSign className="text-green-600 w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay órdenes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'ALL'
                  ? 'No se encontraron órdenes en el sistema'
                  : `No hay órdenes con estado "${getStatusLabel(statusFilter as OrderStatusEnum)}"`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesa/Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.items.length}{' '}
                              {order.items.length === 1 ? 'item' : 'items'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {order.tableId ? (
                            <>
                              <FiMapPin className="text-gray-400 w-4 h-4" />
                              <span className="text-sm text-gray-900">
                                Mesa {order.tableId}
                              </span>
                            </>
                          ) : (
                            <>
                              <FiUser className="text-gray-400 w-4 h-4" />
                              <span className="text-sm text-gray-900">
                                {order.orderType === 'takeaway'
                                  ? 'Para Llevar'
                                  : 'Delivery'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={getPaymentStatusColor(
                            order.paymentStatus || PaymentStatusEnum.PENDING,
                          )}
                        >
                          {getPaymentStatusLabel(
                            order.paymentStatus || PaymentStatusEnum.PENDING,
                          )}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(order.createdAt, {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString(
                            'es-ES',
                            { hour: '2-digit', minute: '2-digit' },
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOrderClick(order)}
                            className="flex items-center gap-1"
                          >
                            <FiEye className="w-3 h-3" />
                            Ver
                          </Button>
                          {order.status === OrderStatusEnum.PENDING &&
                            (user?.role === UserRoleEnum.ADMIN ||
                              user?.role === UserRoleEnum.MANAGER) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <FiCheck className="w-3 h-3" />
                                  Aprobar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <FiX className="w-3 h-3" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Resumen de Orden */}
      <Modal
        isOpen={showOrderModal}
        onClose={handleCloseModal}
        className="max-w-2xl"
      >
        {selectedOrder && (
          <div className="p-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Resumen de Orden
                </h3>
                <p className="text-sm text-gray-600">
                  Orden #{selectedOrder.id.slice(-8)}
                </p>
              </div>
              <Badge className={getStatusColor(selectedOrder.status)}>
                {getStatusLabel(selectedOrder.status)}
              </Badge>
            </div>

            {/* Información de la Orden */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Información General
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="text-gray-900">
                      {formatDate(selectedOrder.createdAt, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span className="text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleTimeString(
                        'es-ES',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="text-gray-900">
                      {selectedOrder.tableId
                        ? `Mesa ${selectedOrder.tableId}`
                        : selectedOrder.orderType === 'takeaway'
                          ? 'Para Llevar'
                          : 'Delivery'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Estado del Pago
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge
                      className={getPaymentStatusColor(
                        selectedOrder.paymentStatus ||
                          PaymentStatusEnum.PENDING,
                      )}
                    >
                      {getPaymentStatusLabel(
                        selectedOrder.paymentStatus ||
                          PaymentStatusEnum.PENDING,
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método:</span>
                    <span className="text-gray-900">
                      {selectedOrder.paymentMethod || 'No especificado'}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Elementos de la Orden */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Elementos del Pedido
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">
                          {item.name}
                        </h5>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity} x{' '}
                          {formatCurrency(item.unitPrice)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">
                  Total Final:
                </span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Botón de Cerrar */}
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={handleCloseModal}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
