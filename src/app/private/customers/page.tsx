// app/customers/page.tsx
import { Button } from '@/components/shared/button/Button';
import { customerService } from '@/services/firebase/genericServices';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import { Input } from '@/components/shared/input/input';
import { PRIVATE_ROUTES } from '@/shared';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.query || '';
  let customers = await customerService.getAll();

  if (query) {
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query) ||
        c.identificationId?.includes(query),
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <Link href={`${PRIVATE_ROUTES.CUSTOMERS}/new`}>
            <Button>Nuevo Cliente</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Buscar clientes..."
          defaultValue={query}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`${PRIVATE_ROUTES.CUSTOMERS}/${customer.id}`}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{customer.name}</span>
                  <Badge
                    variant={customer.isActive ? 'success' : 'destructive'}
                  >
                    {customer.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {customer.phone || 'Sin teléfono'}
                </p>
                {customer.identificationType && customer.identificationId && (
                  <p className="text-sm text-gray-500 mt-1">
                    {customer.identificationType}-{customer.identificationId}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
