'use client';
import { OrderList } from '@/app/components/purchaseOrders/order-list';
import { Input } from '@/components/shared/input/input';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/shared/button/Button';
import { PRIVATE_ROUTES } from '@/constants/routes';

export const dynamic = 'force-dynamic';

export default function PurchaseOrdersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
              Órdenes de Compra
            </h1>
            <p className="text-cyan-600/80 mt-1">
              Gestiona y revisa todas tus órdenes de compra.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link href={PRIVATE_ROUTES.PURCHASE_ORDERS_NEW}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Orden
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por proveedor o ID..."
              className="pl-10 w-full md:w-1/3"
            />
          </div>
        </div>

        <OrderList />
      </div>
    </div>
  );
}
