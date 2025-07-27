import { InvoiceStatusEnum } from '@/modelTypes/enumShared';

export interface AccountReceivable {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string | null;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  status: InvoiceStatusEnum;
  description?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
}
