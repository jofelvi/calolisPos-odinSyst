import { InvoiceStatusEnum } from '@/modelTypes/enumShared';

export interface AccountPayable {
  id: string;
  supplierId: string; // 🔗 relación con Supplier
  amount: number;
  dueDate: Date;
  status: InvoiceStatusEnum;
}
