import {
  CurrencyEnum,
  InvoiceStatusEnum,
  PaymentTypeEnum,
} from '@/modelTypes/enumShared';

export interface Invoice {
  id: string;
  invoiceNumber: string; // Número único de factura
  orderId?: string; // 🔗 relación con Order (opcional)
  customerId?: string; // 🔗 relación con Customer (opcional)
  customerName?: string; // Nombre del cliente si no hay customerId

  // Montos y cálculos
  subtotal: number; // Subtotal antes de impuestos
  tax: number; // Monto de impuestos
  total: number; // Total final
  totalAmount: number; // Campo legacy, mantener por compatibilidad

  // Configuración
  paymentType: PaymentTypeEnum;
  currency: CurrencyEnum;
  status: InvoiceStatusEnum;

  // Fechas
  createdAt: Date;
  updatedAt?: Date;
  dueDate?: Date; // Fecha de vencimiento
  paidAt?: Date; // Fecha de pago completo

  // Información adicional
  notes?: string; // Notas adicionales
  items?: InvoiceItem[]; // Items de la factura
}

export interface InvoiceItem {
  id?: string;
  productId?: string;
  name?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}
