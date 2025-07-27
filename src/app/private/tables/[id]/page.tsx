import { notFound } from 'next/navigation';
import { tableService } from '@/services/firebase/genericServices';
import TableForm from '@/features/tables/TableForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTablePage({ params }: PageProps) {
  const { id } = await params;
  const table = await tableService.getById(id);
  if (!table) return notFound();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Mesa</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <TableForm initialData={table} />
      </div>
    </div>
  );
}
