'use client';
import { Payment } from '@/types/payment';
import { Order } from '@/types/order';

interface ReceiptProps {
  order: Order;
  payments: Payment[];
}

export default function Receipt({ order, payments }: ReceiptProps) {
  const paymentMethodNames = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    MIXED: 'Mixto',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border print:p-0 print:shadow-none print:border-0">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Restaurante Ejemplo</h2>
        <p className="text-sm">Dirección: Av. Principal 123</p>
        <p className="text-sm">Teléfono: 555-1234</p>
        <p className="text-sm">RIF: J-123456789</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between border-b py-2">
          <span className="font-medium">Orden #:</span>
          <span>{order.id.slice(0, 8)}</span>
        </div>
        <div className="flex justify-between border-b py-2">
          <span className="font-medium">Fecha:</span>
          {/*
                    <span>{format(order.createdAt, 'PPpp', { locale: es })}</span>
*/}
        </div>
        {order.tableId && (
          <div className="flex justify-between border-b py-2">
            <span className="font-medium">Mesa:</span>
            <span>{order.tableId}</span>
          </div>
        )}
        <div className="flex justify-between border-b py-2">
          <span className="font-medium">Atendido por:</span>
          <span>Mesero</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold border-b pb-1 mb-2">Detalle de la Orden</h3>
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div>
                <span>{item.quantity} x </span>
                <span>{item.name}</span>
              </div>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between border-t pt-2">
          <span className="font-medium">Subtotal:</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Impuestos (16%):</span>
          <span>${order.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total:</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold border-b pb-1 mb-2">Detalle de Pagos</h3>
          {payments.map((payment, index) => (
            <div key={index} className="flex justify-between mb-1">
              <div>
                <span>{paymentMethodNames[payment.method]}: </span>
              </div>
              <span>${payment.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-2 border-t pt-2">
            <span>Total Pagado:</span>
            <span>
              ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="text-center text-sm mt-8">
        <p>¡Gracias por su visita!</p>
        <p>Vuelva pronto</p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print,
          .receipt-print * {
            visibility: visible;
          }
          .receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
