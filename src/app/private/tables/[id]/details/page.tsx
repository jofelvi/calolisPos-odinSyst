import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { getStatusVariant } from '@/utils/getStatusTableOrder';
import { tableService } from '@/services/firebase/genericServices';

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const table = await tableService.getById(id);
  if (!table) return notFound();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalle de Mesa</h1>
        <div className="flex space-x-2">
          <Link href={`/tables/${table.id}/edit`}>
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
              Editar
            </button>
          </Link>
          <Link href="/tables">
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Volver
            </button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              Mesa {table.number} - {table.name}
            </span>
            <Badge variant={getStatusVariant(table.status)}>
              {table.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Capacidad</h3>
            <p className="mt-1 text-sm text-gray-900">
              {table.capacity} personas
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Disponibilidad
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {table.isAvailable ? 'Disponible' : 'No disponible'}
            </p>
          </div>
          {table.orderId && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">
                Orden asociada
              </h3>
              <p className="mt-1 text-sm text-gray-900">{table.orderId}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
