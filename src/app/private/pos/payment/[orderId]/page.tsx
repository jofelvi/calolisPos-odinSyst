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
  AlertTriangle,
  Banknote,
  Calculator,
  Clock,
  CreditCard,
  DollarSign,
  Edit3,
  Save,
  Smartphone,
  TrendingUp,
  X,
  XCircle,
  CheckCircle,
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
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRateValue, setTempRateValue] = useState<string>('');
  const [isUsingDefaultRate, setIsUsingDefaultRate] = useState(false);

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

  // Estados para pagos móviles verificados
  const [verifiedPagoMoviles, setVerifiedPagoMoviles] = useState<PagoMovil[]>(
    [],
  );
  const [_isVerifyingPayment, _setIsVerifyingPayment] = useState(false);
  const [_currentVerificationToast, _setCurrentVerificationToast] = useState<
    string | null
  >(null);

  // Estados para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    index: number;
    name: string;
  } | null>(null);

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

  const handleRemoveItem = (itemIndex: number) => {
    if (!order) return;

    const item = order.items[itemIndex];
    if (item) {
      setItemToDelete({ index: itemIndex, name: item.name });
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteItem = async () => {
    if (itemToDelete) {
      await handleUpdateQuantity(itemToDelete.index, 0);

      toast.success({
        title: 'Producto eliminado',
        description: `${itemToDelete.name} ha sido eliminado de la orden`,
      });
    }

    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const cancelDeleteItem = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
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

  // Función para cargar tasa BCV
  const loadBcvRate = async () => {
    setLoadingRate(true);
    try {
      console.log('🔄 Cargando tasa BCV...');
      const response = await fetch('/api/bcv-rate', {
        cache: 'no-store', // Evitar cache
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
      const data = await response.json();
      console.log('📊 Respuesta BCV:', data);
      setBcvRate(data.rate);

      if (data.source === 'default') {
        console.warn('⚠️ Usando tasa por defecto, servicio BCV falló');
        setIsUsingDefaultRate(true);
        toast.warning({
          title: 'Tasa BCV',
          description:
            'Usando tasa por defecto. Haz clic para editar manualmente.',
        });
      } else {
        console.log('✅ Tasa BCV actualizada:', data.rate);
        setIsUsingDefaultRate(false);
      }
    } catch (error) {
      console.error('❌ Error cargando tasa BCV:', error);
      setBcvRate(36.5);
      setIsUsingDefaultRate(true);
      toast.error({
        title: 'Error de conexión',
        description:
          'No se pudo obtener la tasa BCV. Usando valor por defecto.',
      });
    } finally {
      setLoadingRate(false);
    }
  };

  const handleEditRateStart = () => {
    setTempRateValue(bcvRate.toString());
    setIsEditingRate(true);
  };

  const handleEditRateCancel = () => {
    setIsEditingRate(false);
    setTempRateValue('');
  };

  const handleEditRateSave = () => {
    const numericValue = parseFloat(tempRateValue);
    if (!isNaN(numericValue) && numericValue > 0) {
      setBcvRate(numericValue);
      setIsUsingDefaultRate(false);
      setIsEditingRate(false);
      setTempRateValue('');
      toast.success({
        title: 'Tasa actualizada',
        description: `Nueva tasa BCV: ${numericValue.toFixed(2)}`,
      });
    } else {
      toast.error({
        title: 'Valor inválido',
        description: 'Ingrese un valor numérico válido mayor a 0',
      });
    }
  };

  // Cargar tasa BCV y pagos móviles verificados al montar el componente
  useEffect(() => {
    void loadBcvRate();
    void loadVerifiedPagoMoviles();
  }, [orderId]);

  // Cargar pagos móviles verificados para esta orden
  const loadVerifiedPagoMoviles = async () => {
    try {
      const pagoMoviles = await pagoMovilService.getAll();
      const orderPagoMoviles = pagoMoviles.filter(
        (pm) => pm.orderId === orderId && pm.status === 'verified',
      );
      setVerifiedPagoMoviles(orderPagoMoviles);

      // Si hay pagos móviles verificados, actualizar el monto total
      if (orderPagoMoviles.length > 0) {
        const totalPagoMovil = orderPagoMoviles.reduce(
          (sum, pm) => sum + pm.expectedAmount,
          0,
        );
        setPaymentAmounts((prev) => ({
          ...prev,
          [PaymentMethodEnum.PAGO_MOVIL]: totalPagoMovil.toString(),
        }));
        setSelectedPaymentMethods((prev) => {
          if (!prev.includes(PaymentMethodEnum.PAGO_MOVIL)) {
            return [...prev, PaymentMethodEnum.PAGO_MOVIL];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error loading verified pago moviles:', error);
    }
  };

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
          // Calcular monto restante por pagar en USD
          const totalPaid = calculateTotalPaid();
          const remainingUSD = totalWithTip - totalPaid;
          // Convertir a bolívares para el pago móvil
          const remainingBS =
            remainingUSD > 0 ? (remainingUSD * bcvRate).toFixed(0) : '0';

          // Establecer monto por defecto en bolívares
          setPagoMovilData((prev) => ({
            ...prev,
            amount: remainingBS,
          }));

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

  // Manejar modal de Pago Móvil con verificación asíncrona
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

    // Convertir monto de Bs a USD para la verificación
    const amountInUSD =
      bcvRate > 0 ? (parseFloat(amount) / bcvRate).toFixed(2) : '0';

    // Mostrar toast de inicio INMEDIATAMENTE antes de cualquier acción
    toast.info({
      title: '🔄 Procesando solicitud',
      description: `Iniciando verificación de Ref: ${reference}`,
      duration: 60000, // Toast largo que se reemplazará con actualizaciones
    });

    _setIsVerifyingPayment(true);

    try {
      // PRIMERO verificar si ya existe en la base de datos
      toast.info({
        title: '🔍 Consultando base de datos',
        description: 'Verificando si la referencia ya fue procesada...',
        duration: 3000,
      });

      const existingPagoMovil = await getPagoMovilByReference(reference);

      if (existingPagoMovil) {
        _setIsVerifyingPayment(false);

        if (existingPagoMovil.status === 'verified') {
          toast.error({
            title: '❌ Referencia duplicada',
            description: `Esta referencia ${reference} ya fue verificada y utilizada en otra orden`,
            duration: 8000,
          });
          return;
        }

        if (existingPagoMovil.status === 'pending') {
          toast.warning({
            title: '⚠️ Verificación en proceso',
            description:
              'Esta referencia ya está siendo verificada en otro proceso',
            duration: 6000,
          });
          return;
        }
      }

      // Cerrar modal solo después de verificar duplicados
      setShowPagoMovilModal(false);
      setPagoMovilData({ amount: '', reference: '', phone: '' });

      // Ejecutar verificación en segundo plano
      verifyPagoMovilInBackground(amountInUSD, reference, phone, amount);
    } catch (_error) {
      _setIsVerifyingPayment(false);
      toast.error({
        title: '❌ Error al verificar',
        description: 'No se pudo iniciar la verificación. Intente nuevamente.',
        duration: 5000,
      });
    }
  };

  // Función para verificar Pago Móvil en segundo plano
  const verifyPagoMovilInBackground = async (
    amountUSD: string,
    reference: string,
    phone: string,
    amountBS: string,
  ) => {
    try {
      // Toast de progreso durante la verificación automática
      toast.info({
        title: '🌐 Conectando al banco',
        description:
          'Iniciando sesión en el sistema bancario para verificar...',
        duration: 5000,
      });

      let verificationResult;
      try {
        // Configurar timeout para la request (60 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        // Toast adicional para indicar búsqueda activa
        setTimeout(() => {
          if (!controller.signal.aborted) {
            toast.info({
              title: '🔎 Buscando transacción',
              description: `Analizando movimientos bancarios para Ref: ${reference}...`,
              duration: 5000,
            });
          }
        }, 5000);

        // Toast de progreso más avanzado
        setTimeout(() => {
          if (!controller.signal.aborted) {
            toast.info({
              title: '⏳ Procesando datos',
              description: 'Validando monto y detalles de la transacción...',
              duration: 5000,
            });
          }
        }, 15000);

        const verificationResponse = await fetch('/api/verify-pago-movil', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referenceNumber: reference,
            expectedAmount: amountBS, // Enviar monto en Bolívares
            phoneNumber: phone,
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        verificationResult = await verificationResponse.json();
      } catch (error) {
        // Si el scraping falla, crear un resultado de error
        verificationResult = {
          success: false,
          found: false,
          amountMatches: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Error de conexión o timeout',
        };

        if (error instanceof Error && error.name === 'AbortError') {
          toast.warning({
            title: '⏰ Tiempo de espera agotado',
            description:
              'La verificación tardó más de lo esperado. El registro se guardó para revisión manual.',
            duration: 8000,
          });
        } else {
          toast.warning({
            title: '🔧 Error de conectividad',
            description:
              'No se pudo conectar al sistema bancario. Se guardará el registro para verificación manual.',
            duration: 8000,
          });
        }
      }

      // Toast de finalización del scraping
      toast.info({
        title: '💾 Guardando resultado',
        description: 'Registrando la verificación en el sistema...',
        duration: 2000,
      });

      if (!order) {
        toast.error({
          title: '❌ Error',
          description: 'No se encontró la orden.',
        });
        return;
      }

      // Crear registro de PagoMovil con ambos montos
      const pagoMovilData: Omit<PagoMovil, 'id'> = {
        orderId: order.id,
        referenceNumber: reference,
        expectedAmount: parseFloat(amountUSD), // Legacy field en USD
        expectedAmountBS: parseFloat(amountBS), // Monto en Bolívares
        expectedAmountUSD: parseFloat(amountUSD), // Monto en USD
        actualAmount: verificationResult.actualAmount
          ? parseFloat(verificationResult.actualAmount)
          : undefined,
        actualAmountUSD:
          verificationResult.actualAmount && bcvRate > 0
            ? parseFloat(verificationResult.actualAmount) / bcvRate
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
        bcvRate: bcvRate, // Guardar la tasa BCV del momento
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await pagoMovilService.create(pagoMovilData);

      if (
        verificationResult.success &&
        verificationResult.found &&
        verificationResult.amountMatches
      ) {
        // Verificación exitosa - agregar al listado y actualizar el total
        const createdPagoMovil = {
          ...pagoMovilData,
          id: Date.now().toString(),
        } as PagoMovil;
        setVerifiedPagoMoviles((prev) => [...prev, createdPagoMovil]);

        // Actualizar el monto total de pagos móviles en USD
        const currentTotal = parseFloat(
          paymentAmounts[PaymentMethodEnum.PAGO_MOVIL] || '0',
        );
        const newTotal = currentTotal + parseFloat(amountUSD);

        setPaymentAmounts((prev) => ({
          ...prev,
          [PaymentMethodEnum.PAGO_MOVIL]: newTotal.toString(),
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
          title: '🎉 ¡Verificación exitosa!',
          description: `Pago Móvil validado: Ref ${reference} por Bs.${amountBS} (${amountUSD} USD)`,
          duration: 6000,
        });

        // Recargar pagos móviles desde Firebase
        await loadVerifiedPagoMoviles();
      } else if (
        verificationResult.found &&
        !verificationResult.amountMatches
      ) {
        // Transacción encontrada pero monto no coincide
        toast.warning({
          title: '⚠️ Discrepancia en el monto',
          description: `Se encontró la transacción pero hay diferencias. Esperado: Bs.${amountBS}, Banco: Bs.${verificationResult.actualAmount || 'N/A'}. Contacte al administrador para revisar.`,
          duration: 10000,
        });
      } else if (!verificationResult.found) {
        // Transacción no encontrada
        const errorReasons = [
          'La transacción puede estar pendiente de procesamiento bancario',
          'Verifique que el número de referencia sea correcto',
          'Asegúrese de que la transferencia se realizó desde el teléfono indicado',
          'Puede tomar hasta 24 horas en aparecer en el sistema bancario',
        ];

        toast.error({
          title: '❌ Transacción no encontrada',
          description: `No se localizó la referencia ${reference}. ${errorReasons[Math.floor(Math.random() * errorReasons.length)]}`,
          duration: 10000,
        });
      } else {
        // Error en la verificación
        const specificError = verificationResult.errorMessage?.includes(
          'NO_MOVEMENTS',
        )
          ? 'No hay movimientos bancarios recientes en la cuenta asociada'
          : verificationResult.errorMessage ||
            'Error desconocido en el sistema de verificación';

        toast.error({
          title: '🔧 Error en la verificación',
          description: specificError,
          duration: 8000,
        });
      }
    } catch (_error) {
      toast.error({
        title: '💥 Error del sistema',
        description:
          'Error interno al procesar la verificación. Contacte al soporte técnico.',
        duration: 8000,
      });
    } finally {
      _setIsVerifyingPayment(false);
      _setCurrentVerificationToast(null);
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
  const _handleDirectCharge = async () => {
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
                      {loadingRate ? (
                        'Cargando...'
                      ) : isEditingRate ? (
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            value={tempRateValue}
                            onChange={(e) => setTempRateValue(e.target.value)}
                            className="w-16 h-6 text-xs px-1 border-amber-300 focus:border-amber-500"
                            step="0.01"
                            min="0"
                          />
                          <button
                            onClick={handleEditRateSave}
                            className="p-1 rounded hover:bg-green-100 text-green-600"
                            title="Guardar tasa"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleEditRateCancel}
                            className="p-1 rounded hover:bg-red-100 text-red-600"
                            title="Cancelar edición"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={
                              isUsingDefaultRate
                                ? 'text-amber-600 font-medium'
                                : ''
                            }
                          >
                            BCV: {bcvRate.toFixed(2)}
                            {isUsingDefaultRate && ' (manual)'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={loadBcvRate}
                              disabled={loadingRate}
                              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                              title="Actualizar tasa BCV"
                            >
                              <TrendingUp
                                className={`w-3 h-3 ${loadingRate ? 'animate-spin' : ''}`}
                              />
                            </button>
                            {(isUsingDefaultRate || bcvRate <= 50) && (
                              <button
                                onClick={handleEditRateStart}
                                className="p-1 rounded hover:bg-amber-100 text-amber-600"
                                title="Editar tasa manualmente"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
              <div className="mt-auto space-y-4">
                {/* Información del estado de pago */}
                <div className="text-center py-2">
                  <div className="text-sm text-gray-600 mb-1">
                    {calculateTotalPaid() <= 0
                      ? 'Selecciona método de pago o cobra directo'
                      : calculateTotalPaid() >= totalWithTip
                        ? `Pago completo - Cambio: $${(calculateTotalPaid() - totalWithTip).toFixed(2)}`
                        : `Pagado: $${calculateTotalPaid().toFixed(2)} - Falta: $${(totalWithTip - calculateTotalPaid()).toFixed(2)}`}
                  </div>
                </div>

                {/* Botones secundarios */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleCancelPayment}
                    variant="outline"
                    className="h-12 px-4 bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Volver</span>
                  </Button>

                  {selectedCustomer && (
                    <Button
                      onClick={handlePendingPayment}
                      disabled={isProcessing}
                      className="h-12 px-4 bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Dejar Pendiente</span>
                    </Button>
                  )}
                </div>

                {/* Botón principal unificado de COBRAR */}
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || calculateTotalPaid() < totalWithTip}
                  className="w-full h-14 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-bold"
                >
                  {isProcessing ? (
                    <span>Procesando pago...</span>
                  ) : calculateTotalPaid() < totalWithTip ? (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>
                        Pendiente: $
                        {(totalWithTip - calculateTotalPaid()).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Procesar Pago</span>
                    </>
                  )}
                </Button>

                {/* Texto explicativo */}
                <div className="text-xs text-center text-gray-500">
                  {calculateTotalPaid() <= 0
                    ? 'Ingrese el monto a pagar en cualquier método de pago'
                    : calculateTotalPaid() < totalWithTip
                      ? `Falta $${(totalWithTip - calculateTotalPaid()).toFixed(2)} para completar el pago`
                      : calculateTotalPaid() > totalWithTip
                        ? `Cambio: $${(calculateTotalPaid() - totalWithTip).toFixed(2)}`
                        : 'Pago completo - Presione para procesar'}
                </div>
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
                <div className="space-y-2">
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
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder={
                          verifiedPagoMoviles.length > 0
                            ? `${verifiedPagoMoviles.length} pago(s) - $${paymentAmounts[PaymentMethodEnum.PAGO_MOVIL]}`
                            : 'Clic para agregar'
                        }
                        value={
                          verifiedPagoMoviles.length > 0
                            ? `${verifiedPagoMoviles.length} verificado(s)`
                            : ''
                        }
                        disabled={true}
                        readOnly
                        className="flex-1 h-10 text-sm border-cyan-200 disabled:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          selectedPaymentMethods.includes(
                            PaymentMethodEnum.PAGO_MOVIL,
                          ) && setShowPagoMovilModal(true)
                        }
                      />
                      {selectedPaymentMethods.includes(
                        PaymentMethodEnum.PAGO_MOVIL,
                      ) && (
                        <button
                          onClick={() => setShowPagoMovilModal(true)}
                          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium"
                          title="Agregar otro pago móvil"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de pagos móviles verificados */}
                  {verifiedPagoMoviles.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {verifiedPagoMoviles.map((pm) => (
                        <div
                          key={pm.id}
                          className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            Ref: {pm.referenceNumber}
                          </span>
                          <span className="text-green-700">
                            ${pm.expectedAmount.toFixed(2)}
                          </span>
                          <span className="text-gray-500">
                            Tel: {pm.phoneNumber}
                          </span>
                          {pm.verificationDate && (
                            <span className="text-gray-400 ml-auto">
                              {new Date(pm.verificationDate).toLocaleTimeString(
                                'es-VE',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* Modal de confirmación de eliminación */}
      <Modal isOpen={showDeleteConfirm} onClose={cancelDeleteItem}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar eliminación
              </h3>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar{' '}
              <span className="font-semibold text-red-600">
                {itemToDelete?.name}
              </span>{' '}
              de la orden?
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteItem}
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteItem}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

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
                Monto (Bs)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={pagoMovilData.amount}
                onChange={(e) =>
                  setPagoMovilData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className="w-full h-12 text-lg border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                step="1"
                min="0"
              />
              <div className="text-xs text-gray-500 mt-1">
                Equivalente: $
                {bcvRate > 0
                  ? (parseFloat(pagoMovilData.amount || '0') / bcvRate).toFixed(
                      2,
                    )
                  : '0.00'}{' '}
                USD
              </div>
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
