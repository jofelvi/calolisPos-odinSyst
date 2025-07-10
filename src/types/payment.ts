import { PaymentMethodEnum, PaymentStatusEnum } from '@/types/enumShared';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethodEnum;
  transactionId?: string;
  status?: PaymentStatusEnum;
  notes?: string;
  createdAt: Date;
  userId: string; // Quién registró el pago
}
