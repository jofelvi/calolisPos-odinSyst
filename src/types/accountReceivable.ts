import { InvoiceStatusEnum } from '@/types/enumShared';

export interface AccountReceivable {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  status: InvoiceStatusEnum;
  description?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
}
