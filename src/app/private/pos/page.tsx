// app/pos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types/order';
import {
  getActiveOrdersWithTables,
  getActiveTakeawayOrders,
  tableService,
} from '@/services/firebase/genericServices';
import { Button } from '@/components/shared/button/Button';
import { Card } from '@/components/shared/card/card';
import { PRIVATE_ROUTES } from '@/constants/routes';
import {
  AlertCircle,
  ChefHat,
  Clock,
  Coffee,
  MapPin,
  Package,
  Plus,
  ShoppingBag,
  Users,
  Utensils,
} from 'lucide-react';
import Loader from '@/components/shared/Loader/Loader';
import { Table } from '@/types/table';
import { formatTime } from '@/utils/dateHelpers';

interface TableWithOrder extends Table {
  currentOrder?: Order | null;
}

export default function POSPage() {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [takeawayOrders, setTakeawayOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Obtener TODAS las mesas, no solo las disponibles
        const [allTables, takeawayOrdersData, allActiveOrders] =
          await Promise.all([
            tableService.getAll(),
            getActiveTakeawayOrders(),
            getActiveOrdersWithTables(),
          ]);

        // Crear mapa de órdenes activas por mesa
        const ordersMap = new Map<string, Order>();
        allActiveOrders.forEach((order) => {
          if (order.tableId && order.paymentStatus !== 'paid') {
            ordersMap.set(order.tableId, order);
          }
        });

        // Enriquecer las mesas con información de órdenes
        const enrichedTables: TableWithOrder[] = allTables.map((table) => ({
          ...table,
          currentOrder: ordersMap.get(table.id) || null,
        }));

        setTables(enrichedTables);
        setTakeawayOrders(takeawayOrdersData);
      } catch {
        // Handle error silently - user will see empty state if no data loads
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleTableClick = async (table: TableWithOrder) => {
    if (table.orderId) {
      router.push(
        `${PRIVATE_ROUTES.POS_ORDER}?tableId=${table.id}&orderId=${table.orderId}`,
      );
    } else {
      // Mesa libre: crear nueva orden
      router.push(`${PRIVATE_ROUTES.POS_ORDER}?tableId=${table.id}`);
    }
  };
  const handleCreateNewOrder = async (tableId?: string) => {
    if (tableId) {
      router.push(`${PRIVATE_ROUTES.POS_ORDER}?tableId=${tableId}`);
    } else {
      router.push(PRIVATE_ROUTES.POS_ORDER);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`${PRIVATE_ROUTES.POS_ORDER}/${orderId}`);
  };

  // Funciones helper para el estado de las mesas
  const getTableStatus = (table: TableWithOrder): 'free' | 'occupied' => {
    // Verificar currentOrder primero
    if (table.currentOrder) return 'occupied';

    // Si no hay currentOrder, verificar otros campos
    if (table.status === 'occupied') return 'occupied';
    if (!table.isAvailable) return 'occupied';
    if (table.orderId) return 'occupied';

    return 'free';
  };

  const getTableStatusColors = (status: 'free' | 'occupied') => {
    return status === 'occupied'
      ? {
          gradient: 'from-red-50 to-rose-50 border-red-200',
          badge: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
          text: 'Ocupada',
        }
      : {
          gradient: 'from-emerald-50 to-green-50 border-emerald-200',
          badge: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
          text: 'Disponible',
        };
  };

  const getAvailableTablesCount = (): number => {
    return tables.filter((table) => !table.orderId).length;
  };

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Preparación';
      case 'ready':
        return 'Listo';
      default:
        return status;
    }
  };

  const getTableIcon = (capacity: number) => {
    if (capacity <= 2) return Users;
    if (capacity <= 4) return Coffee;
    if (capacity <= 6) return Utensils;
    return ChefHat;
  };

  if (loading) {
    return (
      <Loader fullScreen text="Cargando mesas..." size="lg" color="primary" />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent tracking-tight">
                Punto de Venta
              </h1>
              <p className="text-cyan-600/80 mt-2 text-lg">
                Selecciona una mesa o crea una orden para llevar
              </p>
            </div>

            {/* Takeaway Order Button */}
            <div className="flex-shrink-0">
              <Button
                onClick={() => handleCreateNewOrder()}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Orden Para Llevar
                <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section - Actualizada */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-600">
                    Total de Mesas
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {tables.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Utensils className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-emerald-100/50">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">
                    Mesas Disponibles
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {getAvailableTablesCount()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-amber-100/50">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">
                    Capacidad Total
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {tables.reduce((sum, table) => sum + table.capacity, 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tables Grid - Mejorada */}
        <div>
          <h2 className="text-2xl font-bold text-cyan-800 mb-6 flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-cyan-600" />
            Todas las Mesas
            <span className="ml-3 text-sm font-normal text-gray-600">
              ({getAvailableTablesCount()}/{tables.length} disponibles)
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {tables.map((table) => {
              const TableIcon = getTableIcon(table.capacity);
              const tableStatus = getTableStatus(table);
              const statusConfig = getTableStatusColors(tableStatus);
              const isOccupied = tableStatus === 'occupied';

              return (
                <Card
                  key={table.id}
                  className={`cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br ${statusConfig.gradient} border-2 hover:border-cyan-300 group relative overflow-hidden`}
                  onClick={() => handleTableClick(table)}
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-6">
                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge} shadow-sm`}
                      >
                        {statusConfig.text}
                      </span>
                    </div>

                    {/* Active order indicator */}
                    {isOccupied && (
                      <div className="absolute top-3 left-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full animate-pulse">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Table icon and number */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <TableIcon className="w-8 h-8 text-white" />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-cyan-700 transition-colors duration-200">
                          Mesa {table.number}
                        </h3>
                        <div className="flex items-center justify-center mt-2 text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">
                            {table.capacity}{' '}
                            {table.capacity === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>

                        {/* Order info */}
                        {isOccupied && table.currentOrder && (
                          <div className="mt-2">
                            <div
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(table.currentOrder.status)}`}
                            >
                              {getOrderStatusText(table.currentOrder.status)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ${table.currentOrder.total.toFixed(2)} •{' '}
                              {table.currentOrder.items.length} items
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action hint */}
                    <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-cyan-600 font-medium">
                        {isOccupied
                          ? 'Click para ver orden'
                          : 'Click para crear orden'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Takeaway Orders Section */}
        {takeawayOrders.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-cyan-800 mb-6 flex items-center">
              <Package className="w-6 h-6 mr-2 text-cyan-600" />
              Órdenes Para Llevar
              <span className="ml-3 px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                {takeawayOrders.length}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {takeawayOrders.map((order) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-cyan-300 group relative overflow-hidden"
                  onClick={() => handleViewOrder(order.id)}
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative p-6">
                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getOrderStatusColor(order.status)}`}
                      >
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>

                    {/* Order info */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <ShoppingBag className="w-8 h-8 text-white" />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-cyan-700 transition-colors duration-200">
                          Orden #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <div className="text-lg font-bold text-amber-600">
                            ${order.total.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.items.length}{' '}
                            {order.items.length === 1 ? 'item' : 'items'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action hint */}
                    <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-cyan-600 font-medium">
                        Click para ver orden
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tables.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay mesas configuradas
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No se encontraron mesas en el sistema. Puedes crear una orden para
              llevar mientras tanto.
            </p>
            <Button
              onClick={() => handleCreateNewOrder()}
              className="mt-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Crear Orden Para Llevar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
