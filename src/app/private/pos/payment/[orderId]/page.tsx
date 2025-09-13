// app/pos/payment/[orderId]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/modelTypes/order';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';
import {
  CurrencyEnum,
  InvoiceStatusEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PaymentTypeEnum,
  TableStatusEnum,
} from '@/shared';
import {
  accountReceivableService,
  getCustomerReceivables,
  getPagoMovilByReference,
  invoiceService,
  orderService,
  pagoMovilService,
  paymentService,
  tableService,
} from '@/services/firebase/genericServices';
import { Payment } from '@/modelTypes/payment';
import { Customer } from '@/modelTypes/customer';
import { AccountReceivable } from '@/modelTypes/accountReceivable';
import { PagoMovil } from '@/modelTypes/pagoMovil';
import { Invoice } from '@/modelTypes/invoice';
// BCV rate will be fetched from API route
import { Input } from '@/components/shared/input/input';
import { Card } from '@/components/shared/card/card';
import { Button } from '@/components/shared/button/Button';
import {
  AlertCircle,
  Banknote,
  Calculator,
  Clock,
  CreditCard,
  DollarSign,
  Smartphone,
  TrendingUp,
  X,
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { OrderItem } from '@/modelTypes/orderItem';
import Table from '@/components/shared/Table';
import CustomerSearch from '@/features/pos/CustomerSearch';
import Modal from '@/components/shared/modal';
import { useToast } from '@/components/hooks/useToast';
import { useUserStore } from '@/shared/store/useUserStore';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function PaymentPage({ params }: PageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { user } = useUserStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bcvRate, setBcvRate] = useState<number>(0);
  const [loadingRate, setLoadingRate] = useState(false);

  // Estados para propinas
  const [tipAmount, setTipAmount] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  // Estados para métodos de pago y montos
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
    PaymentMethodEnum[]
  >([]);
  const [paymentAmounts, setPaymentAmounts] = useState<
    Record<PaymentMethodEnum, string>
  >({
    [PaymentMethodEnum.CASH_BS]: '',
    [PaymentMethodEnum.CASH_USD]: '',
    [PaymentMethodEnum.CARD]: '',
    [PaymentMethodEnum.TRANSFER]: '',
    [PaymentMethodEnum.PAGO_MOVIL]: '',
    [PaymentMethodEnum.MIXED]: '',
    [PaymentMethodEnum.PENDING]: '',
  });

  // Estados para cliente y cuentas por cobrar
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerReceivables, setCustomerReceivables] = useState<
    AccountReceivable[]
  >([]);
  const [showReceivables, setShowReceivables] = useState(false);

  // Estados para modal de Pago Móvil
  const [showPagoMovilModal, setShowPagoMovilModal] = useState(false);
  const [pagoMovilData, setPagoMovilData] = useState({
    amount: '',
    reference: '',
    phone: '',
  });

  const handleUpdateQuantity = async (
    itemIndex: number,
    newQuantity: number,
  ) => {
    if (!order || newQuantity < 0) return;

    const updatedItems = [...order.items];
    if (newQuantity === 0) {
      updatedItems.splice(itemIndex, 1);
    } else {
      // Actualizar cantidad
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: newQuantity,
      };
    }

    // Recalcular totales
    const newSubtotal = updatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const newTax = newSubtotal * 0.1; // Asumiendo 10% de impuesto
    const newTotal = newSubtotal + newTax;

    try {
      await orderService.update(order.id, {
        items: updatedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
        updatedAt: new Date(),
      });

      // Actualizar estado local
      const updatedOrder = {
        ...order,
        items: updatedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      };
      setOrder(updatedOrder);
    } catch {
      // Error updating order
    }
  };

  const handleRemoveItem = async (itemIndex: number) => {
    await handleUpdateQuantity(itemIndex, 0);
  };

  // Definir columnas para la tabla de items
  const columns: ColumnDef<OrderItem>[] = [
    {
      accessorKey: 'name',
      header: 'PRODUCTO',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {row.original.name}
          {row.original.notes && (
            <div className="mt-1 text-xs text-gray-500">
              ({row.original.notes})
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'unitPrice',
      header: 'PRECIO',
      cell: ({ row }) => (
        <span className="font-medium">
          ${row.original.unitPrice.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'CANT',
      cell: ({ row }) => {
        const itemIndex =
          order?.items.findIndex(
            (item) =>
              item.productId === row.original.productId &&
              item.unitPrice === row.original.unitPrice,
          ) ?? -1;

        return (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() =>
                handleUpdateQuantity(itemIndex, row.original.quantity - 1)
              }
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-bold hover:bg-gray-300"
              disabled={row.original.quantity <= 1}
            >
              -
            </button>
            <span className="text-center font-medium min-w-[2rem]">
              {row.original.quantity}
            </span>
            <button
              onClick={() =>
                handleUpdateQuantity(itemIndex, row.original.quantity + 1)
              }
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-sm font-bold hover:bg-gray-300"
            >
              +
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'subtotal',
      header: 'SUBTOTAL',
      cell: ({ row }) => {
        const itemIndex =
          order?.items.findIndex(
            (item) =>
              item.productId === row.original.productId &&
              item.unitPrice === row.original.unitPrice,
          ) ?? -1;

        return (
          <div className="flex items-center justify-end gap-2 text-right">
            <span className="font-semibold">
              ${(row.original.unitPrice * row.original.quantity).toFixed(2)}
            </span>
            <button
              onClick={() => handleRemoveItem(itemIndex)}
              className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
              title="Eliminar item"
            >
              🗑️
            </button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderData = await orderService.getById(orderId);
        if (!orderData) {
          router.push('/private/pos');
          return;
        }
        setOrder(orderData);
      } catch {
        // console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, router]);

  // Cargar tasa BCV al montar el componente
  useEffect(() => {
    const loadBcvRate = async () => {
      setLoadingRate(true);
      try {
        const response = await fetch('/api/bcv-rate');
        const data = await response.json();
        setBcvRate(data.rate);
      } catch {
        setBcvRate(36.5);
      } finally {
        setLoadingRate(false);
      }
    };

    loadBcvRate();
  }, []);

  // Cargar cuentas por cobrar cuando se selecciona un cliente
  useEffect(() => {
    const loadCustomerReceivables = async () => {
      if (!selectedCustomer?.id) {
        setCustomerReceivables([]);
        setShowReceivables(false);
        return;
      }

      try {
        const receivables = await getCustomerReceivables(selectedCustomer.id);
        setCustomerReceivables(receivables);
        setShowReceivables(receivables.length > 0);
      } catch {
        setCustomerReceivables([]);
        setShowReceivables(false);
      }
    };

    loadCustomerReceivables();
  }, [selectedCustomer]);

  // Calcular el total en bolívares
  const totalInBs = order ? (order.total + tipAmount) * bcvRate : 0;
  const totalWithTip = order ? order.total + tipAmount : 0;

  // Función helper para crear factura automáticamente
  const createInvoiceForOrder = async (
    order: Order,
    paymentStatus: PaymentStatusEnum,
  ): Promise<void> => {
    try {
      // Determinar el tipo de pago principal
      let paymentType: PaymentTypeEnum = PaymentTypeEnum.CASH;
      if (selectedPaymentMethods.includes(PaymentMethodEnum.CARD)) {
        paymentType = PaymentTypeEnum.CARD;
      } else if (selectedPaymentMethods.includes(PaymentMethodEnum.TRANSFER)) {
        paymentType = PaymentTypeEnum.TRANSFER;
      } else if (
        selectedPaymentMethods.includes(PaymentMethodEnum.PAGO_MOVIL)
      ) {
        paymentType = PaymentTypeEnum.PAYMOBIL;
      }

      // Determinar el estado de la factura
      let invoiceStatus: InvoiceStatusEnum;
      let paidAt: Date | undefined;
      switch (paymentStatus) {
        case PaymentStatusEnum.PAID:
          invoiceStatus = InvoiceStatusEnum.PAID;
          paidAt = new Date();
          break;
        case PaymentStatusEnum.PARTIAL:
          invoiceStatus = InvoiceStatusEnum.PARTIALLY_PAID;
          break;
        case PaymentStatusEnum.PENDING:
          invoiceStatus = InvoiceStatusEnum.PENDING;
          break;
        default:
          invoiceStatus = InvoiceStatusEnum.PENDING;
      }

      // Generar número de factura único
      const invoiceNumber = `FAC-${Date.now().toString().slice(-8)}-${order.id.slice(-4).toUpperCase()}`;

      // Calcular totales
      const subtotal = order.subtotal || 0;
      const tax = order.tax || 0;
      const total = totalWithTip;

      // Crear items de la factura basados en los items de la orden
      const invoiceItems =
        order.items?.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.notes || item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          notes: item.notes || undefined,
        })) || [];

      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber,
        orderId: order.id,
        customerId: selectedCustomer?.id || order.customerId || '',
        customerName: selectedCustomer?.name || 'Cliente no especificado',
        subtotal,
        tax,
        total,
        totalAmount: totalWithTip, // Campo legacy, mantener por compatibilidad

        // Configuración
        paymentType,
        currency: CurrencyEnum.USD,
        status: invoiceStatus,

        // Fechas
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate:
          paymentStatus === PaymentStatusEnum.PENDING
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días para pagos pendientes
            : undefined,
        paidAt,

        // Información adicional
        notes:
          tipAmount > 0
            ? `Propina incluida: $${tipAmount.toFixed(2)}`
            : undefined,
        items: invoiceItems,
      };

      await invoiceService.create(invoiceData);
    } catch {
      // No lanzamos el error para no interrumpir el flujo de pago
    }
  };

  // Calcular el total pagado en USD equivalente
  const calculateTotalPaid = (): number => {
    const cashBs = parseFloat(paymentAmounts[PaymentMethodEnum.CASH_BS]) || 0;
    const cashUsd = parseFloat(paymentAmounts[PaymentMethodEnum.CASH_USD]) || 0;
    const card = parseFloat(paymentAmounts[PaymentMethodEnum.CARD]) || 0;
    const transfer =
      parseFloat(paymentAmounts[PaymentMethodEnum.TRANSFER]) || 0;
    const pagoMovil =
      parseFloat(paymentAmounts[PaymentMethodEnum.PAGO_MOVIL]) || 0;

    // Convertir bolívares a USD
    const cashBsInUsd = bcvRate > 0 ? cashBs / bcvRate : 0;

    return cashBsInUsd + cashUsd + card + transfer + pagoMovil;
  };

  // Manejar selección de métodos de pago
  const handlePaymentMethodToggle = (method: PaymentMethodEnum) => {
    setSelectedPaymentMethods((prev) => {
      if (prev.includes(method)) {
        // Remover método y limpiar su monto
        setPaymentAmounts((prevAmounts) => ({
          ...prevAmounts,
          [method]: '',
        }));
        return prev.filter((m) => m !== method);
      } else {
        // Agregar método
        if (method === PaymentMethodEnum.PAGO_MOVIL) {
          setShowPagoMovilModal(true);
        }
        return [...prev, method];
      }
    });
  };

  // Manejar cambio de monto para un método específico
  const handleAmountChange = (method: PaymentMethodEnum, value: string) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [method]: value,
    }));
  };

  // Manejar modal de Pago Móvil con verificación
  const handlePagoMovilSubmit = async () => {
    const { amount, reference, phone } = pagoMovilData;

    // Validaciones
    if (!amount || parseFloat(amount) <= 0) {
      toast.error({
        title: 'Error de validación',
        description: 'Debe ingresar un monto válido',
      });
      return;
    }

    if (!reference || reference.length !== 6) {
      toast.error({
        title: 'Error de validación',
        description: 'La referencia debe tener exactamente 6 dígitos',
      });
      return;
    }

    if (!phone || phone.length < 10) {
      toast.error({
        title: 'Error de validación',
        description: 'Debe ingresar un número de teléfono válido',
      });
      return;
    }

    if (!order) return;

    setIsProcessing(true);
    try {
      // Verificar si ya existe un registro de esta referencia
      const existingPagoMovil = await getPagoMovilByReference(reference);

      if (existingPagoMovil) {
        if (existingPagoMovil.status === 'verified') {
          toast.warning({
            title: 'Referencia duplicada',
            description: 'Esta referencia ya fue verificada y utilizada',
          });
          return;
        }

        if (existingPagoMovil.status === 'amount_mismatch') {
          // Verificar si ahora el monto coincide
          if (parseFloat(amount) === existingPagoMovil.expectedAmount) {
            // Actualizar status a verificado
            await pagoMovilService.update(existingPagoMovil.id, {
              status: 'verified',
              updatedAt: new Date(),
            });

            // Proceder con el pago
            setPaymentAmounts((prev) => ({
              ...prev,
              [PaymentMethodEnum.PAGO_MOVIL]: amount,
            }));

            setSelectedPaymentMethods((prev) => {
              if (!prev.includes(PaymentMethodEnum.PAGO_MOVIL)) {
                return [...prev, PaymentMethodEnum.PAGO_MOVIL];
              }
              return prev;
            });

            setShowPagoMovilModal(false);
            setPagoMovilData({ amount: '', reference: '', phone: '' });
            toast.success({
              title: 'Verificación exitosa',
              description: 'Pago Móvil verificado correctamente',
            });
            return;
          }
        }
      }

      // Realizar verificación usando el scraper
      toast.info({
        title: 'Verificando',
        description:
          'Verificando transacción, esto puede tomar unos momentos...',
      });

      const verificationResponse = await fetch('/api/verify-pago-movil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceNumber: reference,
          expectedAmount: amount,
          phoneNumber: phone,
        }),
      });

      const verificationResult = await verificationResponse.json();

      // Crear registro de PagoMovil
      const pagoMovilData: Omit<PagoMovil, 'id'> = {
        orderId: order.id,
        referenceNumber: reference,
        expectedAmount: parseFloat(amount),
        actualAmount: verificationResult.actualAmount
          ? parseFloat(verificationResult.actualAmount)
          : undefined,
        phoneNumber: phone,
        status:
          verificationResult.success &&
          verificationResult.found &&
          verificationResult.amountMatches
            ? 'verified'
            : verificationResult.found && !verificationResult.amountMatches
              ? 'amount_mismatch'
              : verificationResult.found
                ? 'not_found'
                : 'error',
        verificationDate: new Date(),
        errorMessage: verificationResult.errorMessage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await pagoMovilService.create(pagoMovilData);

      if (
        verificationResult.success &&
        verificationResult.found &&
        verificationResult.amountMatches
      ) {
        // Verificación exitosa
        setPaymentAmounts((prev) => ({
          ...prev,
          [PaymentMethodEnum.PAGO_MOVIL]: amount,
        }));

        setSelectedPaymentMethods((prev) => {
          if (!prev.includes(PaymentMethodEnum.PAGO_MOVIL)) {
            return [...prev, PaymentMethodEnum.PAGO_MOVIL];
          }
          return prev;
        });

        setShowPagoMovilModal(false);
        setPagoMovilData({ amount: '', reference: '', phone: '' });
        toast.success({
          title: 'Verificación exitosa',
          description: '¡Pago Móvil verificado exitosamente!',
        });
      } else if (
        verificationResult.found &&
        !verificationResult.amountMatches
      ) {
        // Transacción encontrada pero monto no coincide
        toast.warning({
          title: 'Monto no coincide',
          description: `Transacción encontrada pero el monto no coincide. Esperado: $${amount}, Encontrado: $${verificationResult.actualAmount || 'N/A'}. El registro se guardó para futuras verificaciones.`,
        });
      } else if (!verificationResult.found) {
        // Transacción no encontrada
        toast.error({
          title: 'Transacción no encontrada',
          description:
            'No se encontró una transacción con esa referencia. Verifique los datos e intente nuevamente.',
        });
      } else {
        // Error en la verificación
        toast.error({
          title: 'Error en la verificación',
          description: verificationResult.errorMessage || 'Error desconocido',
        });
      }
    } catch {
      toast.error({
        title: 'Error del sistema',
        description: 'Error al verificar el Pago Móvil. Intente nuevamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePagoMovilCancel = () => {
    setShowPagoMovilModal(false);
    setPagoMovilData({ amount: '', reference: '', phone: '' });

    // Si no hay monto, remover el método de los seleccionados
    if (!paymentAmounts[PaymentMethodEnum.PAGO_MOVIL]) {
      setSelectedPaymentMethods((prev) =>
        prev.filter((m) => m !== PaymentMethodEnum.PAGO_MOVIL),
      );
    }
  };

  // Crear cuenta por cobrar (pago pendiente)
  const handlePendingPayment = async () => {
    if (!order || !selectedCustomer) return;

    setIsProcessing(true);
    try {
      // Crear cuenta por cobrar
      const receivableData: Omit<AccountReceivable, 'id'> = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        invoiceNumber: `INV-${orderId.slice(-8).toUpperCase()}`,
        amount: totalWithTip,
        paidAmount: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        status: InvoiceStatusEnum.PENDING,
        description: `Orden #${orderId.slice(-8).toUpperCase()}`,
        createdAt: new Date(),
      };

      await accountReceivableService.create(receivableData);

      // Actualizar orden
      await orderService.update(order.id, {
        paymentStatus: PaymentStatusEnum.PENDING,
        status: OrderStatusEnum.DELIVERED,
        customerId: selectedCustomer.id,
        updatedAt: new Date(),
      });

      // Crear factura automáticamente para pagos pendientes
      await createInvoiceForOrder(order, PaymentStatusEnum.PENDING);

      router.push(`/private/pos/receipt/${order.id}`);
    } catch {
      // console.error('Error creating pending payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para cancelar y volver a la página anterior
  const handleCancelPayment = () => {
    toast.info({ title: 'Volviendo...', description: 'Pago cancelado' });
    if (order?.tableId) {
      router.push(
        `${PRIVATE_ROUTES.POS_ORDER}?tableId=${order.tableId}&orderId=${order.id}`,
      );
    } else {
      router.push(`${PRIVATE_ROUTES.POS_ORDER}?orderId=${order?.id}`);
    }
  };

  // Función para cobrar directamente (marcar como pagado y volver al POS)
  const handleDirectCharge = async () => {
    if (!order) return;

    setIsProcessing(true);
    try {
      // Marcar orden como pagada directamente
      await orderService.update(order.id, {
        paymentStatus: PaymentStatusEnum.PAID,
        status: OrderStatusEnum.PAID,
        updatedAt: new Date(),
      });

      // Si la orden tiene una mesa asociada, limpiar la asociación y restaurar status
      if (order.tableId) {
        await tableService.update(order.tableId, {
          orderId: null,
          status: TableStatusEnum.ISAVAILABLE,
          isAvailable: true,
        });
      }

      // Crear factura automáticamente
      await createInvoiceForOrder(order, PaymentStatusEnum.PAID);

      toast.success({
        title: 'Volviendo al POS...',
        description: 'Orden cobrada exitosamente',
      });
      router.push('/private/pos');
    } catch {
      toast.error({
        title: 'Error del sistema',
        description: 'Error al cobrar la orden',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    const totalPaid = calculateTotalPaid();
    const isPendingPayment =
      selectedCustomer &&
      selectedPaymentMethods.includes(PaymentMethodEnum.PENDING);

    if (totalPaid <= 0 && !isPendingPayment) {
      toast.error({
        title: 'Monto requerido',
        description: 'Debe ingresar al menos un monto de pago',
      });
      return;
    }

    setIsProcessing(true);
    try {
      toast.info({
        title: 'Por favor espere',
        description: 'Procesando pago...',
      });

      // Crear pagos por cada método usado
      const paymentPromises = selectedPaymentMethods
        .filter((method) => {
          const amountStr = paymentAmounts[method];
          return amountStr && parseFloat(amountStr) > 0;
        })
        .map((method) => {
          const amountStr = paymentAmounts[method];
          const amount = parseFloat(amountStr || '0');
          const paymentData: Omit<Payment, 'id'> = {
            orderId: order.id,
            amount:
              method === PaymentMethodEnum.CASH_BS ? amount / bcvRate : amount,
            method: method,
            userId: user?.id || 'unknown-user',
            createdAt: new Date(),
          };
          return paymentService.create(paymentData);
        });

      await Promise.all(paymentPromises);

      const newStatus =
        totalPaid >= totalWithTip
          ? PaymentStatusEnum.PAID
          : PaymentStatusEnum.PARTIAL;

      await orderService.update(order.id, {
        paymentStatus: newStatus,
        status:
          newStatus === PaymentStatusEnum.PAID
            ? OrderStatusEnum.PAID
            : order.status,
        customerId: selectedCustomer?.id || order.customerId,
        updatedAt: new Date(),
      });

      // Si la orden se pagó completamente y tiene una mesa asociada, limpiar la asociación y restaurar status
      if (newStatus === PaymentStatusEnum.PAID && order.tableId) {
        await tableService.update(order.tableId, {
          orderId: null,
          status: TableStatusEnum.ISAVAILABLE,
          isAvailable: true,
        });
      }

      // Crear factura automáticamente
      await createInvoiceForOrder(order, newStatus);

      toast.success({
        title: 'Redirigiendo al recibo...',
        description: '¡Pago procesado exitosamente!',
      });
      router.push(`/private/pos/receipt/${order.id}`);
    } catch {
      toast.error({
        title: 'Error del sistema',
        description: 'Error al procesar el pago. Intente nuevamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTipSelect = (amount: number) => {
    // Si ya está seleccionada la misma propina, la deseleccionamos
    if (selectedTip === amount) {
      setSelectedTip(null);
      setTipAmount(0);
    } else {
      // Seleccionar nueva propina
      setSelectedTip(amount);
      setTipAmount(amount);
    }
  };

  const currentTime = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (loading || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 p-4 overflow-x-hidden">
      <div className="mx-auto max-w-full">
        {/* Header Global */}
        <Card className="p-4 mb-4 bg-white/90 backdrop-blur-sm border-cyan-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                ORDEN #: {orderId.slice(-8).toUpperCase()}
              </h1>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  📋 MESA: {order.tableId || 'PARA LLEVAR'}
                </span>
                <span className="flex items-center gap-1">
                  🕒 HORA: {currentTime}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">COMENSALES</div>
              <div className="text-xl font-bold">👥 2</div>
            </div>
          </div>
        </Card>

        {/* Layout Principal en 3 Columnas */}
        <div className="grid grid-cols-12 gap-3 h-[calc(100vh-220px)] w-full max-w-none overflow-hidden">
          {/* Columna 1: Tabla de Items (5 columnas) */}
          <div className="col-span-5">
            <Card className="h-full overflow-hidden bg-white/90 backdrop-blur-sm border-cyan-100">
              <div className="h-full flex flex-col">
                <div className="p-3 bg-cyan-50 border-b border-cyan-200">
                  <h2 className="font-semibold text-gray-900">PRODUCTOS</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Table
                    data={order.items}
                    columns={columns}
                    pageSize={20}
                    headerStyles="bg-cyan-50 border-b border-cyan-200"
                    bodyStyles="bg-white divide-y divide-gray-200"
                    rowStyles="hover:bg-cyan-50 transition-colors"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Columna 2: Totales, Cliente y Botones (4 columnas) */}
          <div className="col-span-4">
            <div className="space-y-3 h-full flex flex-col">
              {/* Totales */}
              <Card className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 backdrop-blur-sm border-cyan-200">
                <h2 className="text-base font-bold text-gray-800 mb-4 text-center">
                  TOTAL A PAGAR
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Total en USD */}
                  <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-cyan-100">
                    <div className="text-2xl font-bold text-cyan-600 flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-6 w-6" />$
                      {totalWithTip.toFixed(2)}
                    </div>
                    <div className="text-xs font-medium text-gray-600 text-center">
                      DÓLARES USD
                    </div>
                  </div>

                  {/* Total en Bolívares */}
                  <div className="bg-white/80 rounded-lg p-3 shadow-sm border border-teal-100">
                    <div className="text-xl font-bold text-teal-600 flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-5 w-5" />
                      Bs. {totalInBs.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {loadingRate
                        ? 'Cargando...'
                        : `BCV: ${bcvRate.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                {/* Resumen de pago */}
                {calculateTotalPaid() > 0 && (
                  <div className="p-3 bg-white/90 rounded-lg border border-cyan-200 mb-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-700">
                          Pagado:
                        </span>
                        <span className="font-bold text-sm text-cyan-600">
                          ${calculateTotalPaid().toFixed(2)}
                        </span>
                      </div>

                      {calculateTotalPaid() > totalWithTip && (
                        <>
                          <div className="border-t pt-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-700">
                                Cambio $:
                              </span>
                              <span className="font-semibold text-xs text-green-600">
                                $
                                {(calculateTotalPaid() - totalWithTip).toFixed(
                                  2,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-700">
                                Cambio Bs:
                              </span>
                              <span className="font-semibold text-xs text-green-600">
                                Bs.{' '}
                                {(
                                  (calculateTotalPaid() - totalWithTip) *
                                  bcvRate
                                ).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {calculateTotalPaid() < totalWithTip && (
                        <div className="border-t pt-1">
                          <div className="flex justify-between items-center text-orange-600">
                            <span className="text-sm font-medium">
                              Falta USD:
                            </span>
                            <span className="font-bold text-sm">
                              $
                              {(totalWithTip - calculateTotalPaid()).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-orange-600">
                            <span className="text-sm font-medium">
                              Falta BS:
                            </span>
                            <span className="font-bold text-sm">
                              Bs.{' '}
                              {(
                                (totalWithTip - calculateTotalPaid()) *
                                bcvRate
                              ).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Propina */}
                <div className="mb-4">
                  <div className="mb-2 text-xs font-medium text-gray-700">
                    PROPINA
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 5].map((tip) => (
                      <button
                        key={tip}
                        onClick={() => handleTipSelect(tip)}
                        className={`py-2 px-2 border-2 rounded-lg text-xs font-medium transition-all touch-manipulation ${
                          selectedTip === tip
                            ? 'border-cyan-500 bg-cyan-500 text-white'
                            : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50'
                        }`}
                      >
                        ${tip}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Cliente */}
              <Card className="p-3 bg-white/90 backdrop-blur-sm border-cyan-100">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  CLIENTE
                </h3>
                <CustomerSearch
                  onSelectCustomerAction={setSelectedCustomer}
                  selectedCustomer={selectedCustomer}
                />

                {/* Cuentas por cobrar del cliente */}
                {showReceivables && customerReceivables.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <h3 className="font-medium text-xs text-amber-800">
                        Cuentas Pendientes
                      </h3>
                    </div>
                    <div className="text-xs text-amber-700">
                      {customerReceivables.length} cuenta(s) por $
                      {customerReceivables
                        .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0)
                        .toFixed(2)}
                    </div>
                  </div>
                )}
              </Card>

              {/* Botones de Acción */}
              <div className="mt-auto space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCancelPayment}
                    variant="outline"
                    className="h-12 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 text-sm"
                  >
                    CANCELAR
                  </Button>

                  {selectedCustomer && (
                    <Button
                      onClick={handlePendingPayment}
                      disabled={isProcessing}
                      className="h-12 bg-amber-500 hover:bg-amber-600 text-white text-sm"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      PENDIENTE
                    </Button>
                  )}
                </div>

                {/* Botón COBRAR directo */}
                <Button
                  onClick={handleDirectCharge}
                  disabled={isProcessing}
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-base"
                >
                  {isProcessing ? 'COBRANDO...' : 'COBRAR'}
                </Button>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || calculateTotalPaid() <= 0}
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-bold text-base"
                >
                  {isProcessing ? 'PROCESANDO...' : 'PROCESAR PAGO'}
                </Button>
              </div>
            </div>
          </div>

          {/* Columna 3: Métodos de Pago (3 columnas) */}
          <div className="col-span-3">
            <Card className="h-full p-4 bg-white/90 backdrop-blur-sm border-cyan-100">
              <h3 className="mb-4 text-base font-semibold text-gray-900">
                MÉTODOS DE PAGO
              </h3>

              <div className="space-y-3 h-full flex flex-col">
                {/* Efectivo BS */}
                <div className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-cyan-300 transition-colors">
                  <button
                    onClick={() =>
                      handlePaymentMethodToggle(PaymentMethodEnum.CASH_BS)
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[120px] ${
                      selectedPaymentMethods.includes(PaymentMethodEnum.CASH_BS)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Efectivo BS</span>
                  </button>
                  <Input
                    type="number"
                    placeholder="Monto Bs"
                    value={paymentAmounts[PaymentMethodEnum.CASH_BS]}
                    onChange={(e) =>
                      handleAmountChange(
                        PaymentMethodEnum.CASH_BS,
                        e.target.value,
                      )
                    }
                    disabled={
                      !selectedPaymentMethods.includes(
                        PaymentMethodEnum.CASH_BS,
                      )
                    }
                    className="flex-1 h-10 text-sm border-cyan-200 focus:border-cyan-500 disabled:bg-gray-50"
                  />
                </div>

                {/* Efectivo USD */}
                <div className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-cyan-300 transition-colors">
                  <button
                    onClick={() =>
                      handlePaymentMethodToggle(PaymentMethodEnum.CASH_USD)
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[120px] ${
                      selectedPaymentMethods.includes(
                        PaymentMethodEnum.CASH_USD,
                      )
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Efectivo $</span>
                  </button>
                  <Input
                    type="number"
                    placeholder="Monto USD"
                    value={paymentAmounts[PaymentMethodEnum.CASH_USD]}
                    onChange={(e) =>
                      handleAmountChange(
                        PaymentMethodEnum.CASH_USD,
                        e.target.value,
                      )
                    }
                    disabled={
                      !selectedPaymentMethods.includes(
                        PaymentMethodEnum.CASH_USD,
                      )
                    }
                    className="flex-1 h-10 text-sm border-cyan-200 focus:border-cyan-500 disabled:bg-gray-50"
                  />
                </div>

                {/* Pago Móvil */}
                <div className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-cyan-300 transition-colors">
                  <button
                    onClick={() =>
                      handlePaymentMethodToggle(PaymentMethodEnum.PAGO_MOVIL)
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[120px] ${
                      selectedPaymentMethods.includes(
                        PaymentMethodEnum.PAGO_MOVIL,
                      )
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Pago Móvil</span>
                  </button>
                  <Input
                    type="number"
                    placeholder="Clic para configurar"
                    value={paymentAmounts[PaymentMethodEnum.PAGO_MOVIL]}
                    disabled={true}
                    readOnly
                    className="flex-1 h-10 text-sm border-cyan-200 disabled:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      selectedPaymentMethods.includes(
                        PaymentMethodEnum.PAGO_MOVIL,
                      ) && setShowPagoMovilModal(true)
                    }
                  />
                </div>

                {/* Tarjeta */}
                <div className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-cyan-300 transition-colors">
                  <button
                    onClick={() =>
                      handlePaymentMethodToggle(PaymentMethodEnum.CARD)
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[120px] ${
                      selectedPaymentMethods.includes(PaymentMethodEnum.CARD)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Tarjeta</span>
                  </button>
                  <Input
                    type="number"
                    placeholder="Monto USD"
                    value={paymentAmounts[PaymentMethodEnum.CARD]}
                    onChange={(e) =>
                      handleAmountChange(PaymentMethodEnum.CARD, e.target.value)
                    }
                    disabled={
                      !selectedPaymentMethods.includes(PaymentMethodEnum.CARD)
                    }
                    className="flex-1 h-10 text-sm border-cyan-200 focus:border-cyan-500 disabled:bg-gray-50"
                  />
                </div>

                {/* Transferencia */}
                <div className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-cyan-300 transition-colors">
                  <button
                    onClick={() =>
                      handlePaymentMethodToggle(PaymentMethodEnum.TRANSFER)
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[120px] ${
                      selectedPaymentMethods.includes(
                        PaymentMethodEnum.TRANSFER,
                      )
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-cyan-100'
                    }`}
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Transferencia</span>
                  </button>
                  <Input
                    type="number"
                    placeholder="Monto USD"
                    value={paymentAmounts[PaymentMethodEnum.TRANSFER]}
                    onChange={(e) =>
                      handleAmountChange(
                        PaymentMethodEnum.TRANSFER,
                        e.target.value,
                      )
                    }
                    disabled={
                      !selectedPaymentMethods.includes(
                        PaymentMethodEnum.TRANSFER,
                      )
                    }
                    className="flex-1 h-10 text-sm border-cyan-200 focus:border-cyan-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Pago Móvil */}
      <Modal
        isOpen={showPagoMovilModal}
        onClose={handlePagoMovilCancel}
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-cyan-600" />
              Pago Móvil
            </h3>
            <button
              onClick={handlePagoMovilCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto (USD)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={pagoMovilData.amount}
                onChange={(e) =>
                  setPagoMovilData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className="w-full h-12 text-lg border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                step="0.01"
                min="0"
              />
            </div>

            {/* Número de Referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Referencia (6 dígitos)
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={pagoMovilData.reference}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPagoMovilData((prev) => ({ ...prev, reference: value }));
                }}
                className="w-full h-12 text-lg border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                maxLength={6}
              />
              <div className="text-xs text-gray-500 mt-1">
                {pagoMovilData.reference.length}/6 dígitos
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Teléfono
              </label>
              <Input
                type="tel"
                placeholder="04123456789"
                value={pagoMovilData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setPagoMovilData((prev) => ({ ...prev, phone: value }));
                }}
                className="w-full h-12 text-lg border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                maxLength={11}
              />
              <div className="text-xs text-gray-500 mt-1">
                Formato: 04123456789
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-8">
            <Button
              onClick={handlePagoMovilCancel}
              variant="outline"
              className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePagoMovilSubmit}
              className="flex-1 h-12 bg-cyan-500 hover:bg-cyan-600 text-white"
              disabled={
                !pagoMovilData.amount ||
                parseFloat(pagoMovilData.amount) <= 0 ||
                pagoMovilData.reference.length !== 6 ||
                pagoMovilData.phone.length < 10
              }
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Container para mostrar notificaciones - se renderiza automáticamente */}
    </div>
  );
}
