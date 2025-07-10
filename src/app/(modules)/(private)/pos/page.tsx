// app/pos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@/types/table';
import { getAvailableTables } from '@/services/firebase/tableServices';
import { Button } from '@/components/shared/button/Button';
import { Card } from '@/components/shared/card/card';

export default function POSPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadTables = async () => {
      try {
        const availableTables = await getAvailableTables();
        setTables(availableTables);
      } catch (error) {
        console.error('Error loading tables:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTables();
  }, []);

  const handleCreateNewOrder = (tableId?: string) => {
    if (tableId) {
      router.push(`/pos/order?tableId=${tableId}`);
    } else {
      router.push('/pos/order');
    }
  };

  if (loading) {
    return <div>Loading tables...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Punto de Venta</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleCreateNewOrder()}>
            Orden Para Llevar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCreateNewOrder(table.id)}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold">Mesa {table.number}</h3>
              <p>Capacidad: {table.capacity} personas</p>
              <p className="capitalize">{table.status || 'Sin ubicación'}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
