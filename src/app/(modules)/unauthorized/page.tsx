export default function UnauthorizedPage() {
  return (
    <div className="text-center p-10">
      <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
      <p className="text-gray-500 mt-2">
        Tu cuenta no está autorizada para ingresar al sistema.
      </p>
    </div>
  );
}
