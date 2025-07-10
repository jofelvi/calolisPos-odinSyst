// components/pos/PaymentMethodSelector.tsx

import { PaymentMethodEnum } from '@/types/enumShared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/select/select';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodEnum;
  onSelectMethod: (method: PaymentMethodEnum) => void;
}

const paymentMethodLabels = {
  [PaymentMethodEnum.CASH]: 'Efectivo',
  [PaymentMethodEnum.CARD]: 'Tarjeta',
  [PaymentMethodEnum.TRANSFER]: 'Transferencia',
  [PaymentMethodEnum.MIXED]: 'Mixto',
};

export default function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <Select
      value={selectedMethod}
      onValueChange={(value: PaymentMethodEnum) => onSelectMethod(value)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Seleccione método de pago" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(PaymentMethodEnum).map((method) => (
          <SelectItem key={method} value={method}>
            {paymentMethodLabels[method]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
