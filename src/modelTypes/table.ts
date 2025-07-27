import { TableStatusEnum } from '@/modelTypes/enumShared';

export interface Table {
  id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatusEnum;
  isAvailable: boolean;
  orderId?: string | null;
}
