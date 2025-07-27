// features/pos/PaymentMethodSelector.tsx
'use client';
import { PaymentMethodEnum } from '@/modelTypes/enumShared';
import SelectCustom, {
  SelectOption,
} from '@/components/shared/selectCustom/SelectCustom';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodEnum;
  onSelectMethod: (method: PaymentMethodEnum) => void;
}

const paymentMethodLabels = {
  [PaymentMethodEnum.CASH_BS]: 'Efectivo Bs',
  [PaymentMethodEnum.CASH_USD]: 'Efectivo Usd',
  [PaymentMethodEnum.CARD]: 'Tarjeta',
  [PaymentMethodEnum.TRANSFER]: 'Transferencia',
  [PaymentMethodEnum.MIXED]: 'Mixto',
};

export default function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  const paymentMethodOptions: SelectOption[] = Object.entries(
    paymentMethodLabels,
  ).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <SelectCustom
      id="payment-method-selector"
      options={paymentMethodOptions}
      value={selectedMethod}
      onChange={(value) => onSelectMethod(value as PaymentMethodEnum)}
      placeholder="Seleccione método de pago"
    />
  );
}
