import { IdentificationType } from '@/types/enumShared';

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  identificationId?: string | null;
  identificationType?: IdentificationType | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
}
