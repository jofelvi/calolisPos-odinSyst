// app/pos/AccountReceivableForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { Resolver, SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/shared/button/Button';
import { Input } from '@/components/shared/input/input';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';

import {
  accountReceivableService,
  customerService,
} from '@/services/firebase/genericServices';
import { AccountReceivable } from '@/types/accountReceivable';
import { Customer } from '@/types/customer';
import { InvoiceStatusEnum } from '@/types/enumShared';

const accountReceivableSchema = yup.object({
  customerId: yup.string().required('Cliente es requerido'),
  invoiceNumber: yup.string().required('Número de factura es requerido'),
  amount: yup
    .number()
    .min(0.01, 'El monto debe ser mayor a 0')
    .required('Monto es requerido'),
  paidAmount: yup
    .number()
    .min(0, 'El monto pagado no puede ser negativo')
    .default(0),
  dueDate: yup
    .string()
    .required('Fecha de vencimiento es requerida')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  description: yup.string().optional(),
});

type AccountReceivableFormData = yup.InferType<typeof accountReceivableSchema>;

interface AccountReceivableFormProps {
  accountReceivable?: AccountReceivable;
  onSuccess?: () => void;
}

export default function AccountReceivableForm({
  accountReceivable,
  onSuccess,
}: AccountReceivableFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AccountReceivableFormData>({
    resolver: yupResolver(
      accountReceivableSchema,
    ) as Resolver<AccountReceivableFormData>,
    defaultValues: accountReceivable
      ? {
          customerId: accountReceivable.customerId,
          invoiceNumber: accountReceivable.invoiceNumber,
          amount: accountReceivable.amount,
          paidAmount: accountReceivable.paidAmount,
          dueDate: new Date(accountReceivable.dueDate)
            .toISOString()
            .split('T')[0],
          description: accountReceivable.description || '',
        }
      : {
          paidAmount: 0,
          dueDate: new Date().toISOString().split('T')[0],
        },
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  const watchedAmount = watch('amount');
  const watchedPaidAmount = watch('paidAmount');

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const all = await customerService.getAll();
        setCustomers(all.filter((c) => c.isActive));
      } catch {
        console.error('Error cargando clientes');
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  const calculateStatus = (amount: number, paid: number): InvoiceStatusEnum => {
    if (paid === 0) return InvoiceStatusEnum.PENDING;
    if (paid >= amount) return InvoiceStatusEnum.PAID;
    return InvoiceStatusEnum.PARTIALLY_PAID;
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(amt);

  const onSubmit: SubmitHandler<AccountReceivableFormData> = async (data) => {
    setIsLoading(true);
    try {
      const cust = customers.find((c) => c.id === data.customerId);
      const status = calculateStatus(data.amount, data.paidAmount);

      const payload = {
        customerId: data.customerId,
        customerName: cust?.name || '',
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        paidAmount: data.paidAmount,
        dueDate: new Date(data.dueDate),
        status,
        description: data.description || null,
        createdAt: accountReceivable?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (accountReceivable) {
        await accountReceivableService.update(accountReceivable.id, payload);
      } else {
        await accountReceivableService.create(payload);
      }

      if (onSuccess) onSuccess();
      else router.push('/private/accounts-receivable');
    } catch (err) {
      console.error('Error guardando cuenta por cobrar', err);
    } finally {
      setIsLoading(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="bg-white/95 backdrop-blur-sm border-cyan-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
          <CardTitle className="text-cyan-800">
            {accountReceivable
              ? 'Editar Cuenta por Cobrar'
              : 'Nueva Cuenta por Cobrar'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <SelectCustom
            id="customerId"
            label="Cliente"
            options={customerOptions}
            placeholder="Seleccionar cliente"
            register={register}
            name="customerId"
            required
            error={errors.customerId}
            disabled={isLoadingCustomers}
          />

          <Input
            {...register('invoiceNumber')}
            label="Número de Factura"
            placeholder="Ej: FAC-001"
            required
            error={errors.invoiceNumber}
          />

          <Input
            {...register('amount')}
            label="Monto Total"
            type="number"
            step="0.01"
            placeholder="0.00"
            variant="numeric"
            required
            error={errors.amount}
          />

          <Input
            {...register('paidAmount')}
            label="Monto Pagado"
            type="number"
            step="0.01"
            placeholder="0.00"
            variant="numeric"
            error={errors.paidAmount}
            textHelper="Cantidad ya pagada por el cliente"
          />

          <Input
            {...register('dueDate')}
            label="Fecha de Vencimiento"
            type="date"
            required
            error={errors.dueDate}
          />

          <div>
            <label className="block text-sm font-semibold mb-2 text-cyan-700">
              Descripción
            </label>
            <textarea
              {...register('description')}
              className="w-full rounded-xl border border-cyan-200 bg-white/90 backdrop-blur-sm p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              rows={3}
              placeholder="Descripción opcional..."
            />
          </div>

          {watchedAmount !== undefined && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100 shadow-sm">
              <h4 className="font-semibold mb-4 text-cyan-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                Resumen de la Cuenta
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Total:</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {formatCurrency(watchedAmount!)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Pagado:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(watchedPaidAmount!)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-cyan-200 pt-3">
                  <span className="font-medium text-gray-600">Pendiente:</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(watchedAmount! - watchedPaidAmount!)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estado:</span>
                  <span className="px-3 py-1 bg-cyan-100 rounded-lg font-semibold text-cyan-700">
                    {calculateStatus(watchedAmount!, watchedPaidAmount!) ===
                    InvoiceStatusEnum.PAID
                      ? 'Pagado'
                      : calculateStatus(watchedAmount!, watchedPaidAmount!) ===
                          InvoiceStatusEnum.PARTIALLY_PAID
                        ? 'Parcialmente Pagado'
                        : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        >
          {isLoading
            ? 'Guardando...'
            : accountReceivable
              ? 'Actualizar'
              : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
