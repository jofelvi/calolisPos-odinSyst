import { tableService } from '@/services/firebase/genericServices';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { getStatusVariant } from '@/shared/utils/getStatusTableOrder';
import { PRIVATE_ROUTES } from '@/shared';
import { Button } from '@/components/shared/button/Button';

export default async function TablesPage() {
  const tables = await tableService.getAll();
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mesas</h1>
        <Link href={PRIVATE_ROUTES.TABLES_NEW}>
          <Button>Nueva Mesa</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Link key={table.id} href={PRIVATE_ROUTES.TABLES_DETAILS(table.id)}>
            <Card className="hover:shadow-lg transition-shadow">
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
              <CardContent>
                <p className="text-gray-600">
                  Capacidad: {table.capacity} personas
                </p>
                <p className="text-gray-600 mt-2">
                  Disponible: {table.isAvailable ? 'Sí' : 'No'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
