import TableForm from '@/app/components/tables/TableForm';

export default function NewTablePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nueva Mesa</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <TableForm isNew />
      </div>
    </div>
  );
}
