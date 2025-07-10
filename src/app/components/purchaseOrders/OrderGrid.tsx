'use client';
import { OrderCard } from '@/app/components/purchaseOrders/order-card';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { useState } from 'react';
import { cn, statusTabs } from '@/lib/utils';

interface OrderGridProps {
  orders: PurchaseOrder[];
}
export default function OrderGrid({ orders }: OrderGridProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No se encontraron órdenes.</div>
      </div>
    );
  }

  // Filtrar órdenes por status
  const filteredOrders =
    activeTab === 'all'
      ? orders
      : orders.filter((order) => order.status === activeTab);

  // Mostrar mensaje si no hay órdenes filtradas

  return (
    <>
      {/* Tabs de Filtro por Status */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200',
                  activeTab === tab.value
                    ? tab.activeColor
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Grid de Órdenes */}
      {filteredOrders.length === 0 ? (
        // Si es verdadero (no hay órdenes), muestra este mensaje
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-gray-800">
            No hay órdenes para este filtro
          </h3>
          <p className="text-muted-foreground mt-2">
            Por favor, selecciona otro estado.
          </p>
        </div>
      ) : (
        // Si es falso (sí hay órdenes), muestra la cuadrícula
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </>
  );
}
