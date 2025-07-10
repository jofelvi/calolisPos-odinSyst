import {
  CurrencyEnum,
  InvoiceStatusEnum,
  PaymentTypeEnum,
} from '@/types/enumShared';

export interface Invoice {
  id: string;
  orderId: string; // 🔗 relación con Order
  totalAmount: number;
  paymentType: PaymentTypeEnum;
  currency: CurrencyEnum;
  status: InvoiceStatusEnum;
  createdAt: Date;
}
