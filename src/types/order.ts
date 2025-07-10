import {
  OrderStatusEnum,
  OrderTypeEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '@/types/enumShared';
import { OrderItem } from '@/types/orderItem';

export interface Order {
  id: string;
  tableId?: string | null; // Null para órdenes para llevar
  customerId?: string | null;
  userId: string; // Mesero que tomó la orden
  status: OrderStatusEnum;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: PaymentMethodEnum | null;
  orderType?: OrderTypeEnum | null;
  paymentStatus: PaymentStatusEnum | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}
