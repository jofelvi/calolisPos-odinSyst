// services/firebase/invoiceDetailService.ts
import {
  customerService,
  invoiceService,
  orderService,
  paymentService,
  productService,
  userService,
} from './genericServices';
import { Invoice } from '@/types/invoice';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';
import { User } from '@/types/user';
import { Product } from '@/types/product';
import { Payment } from '@/types/payment';
import { OrderItem } from '@/types/orderItem';

export interface EnrichedOrderItem extends OrderItem {
  product?: Product;
}
export interface InvoiceDetailData {
  invoice: Invoice;
  order?: Order | null;
  customer?: Customer | null;
  user?: User | null;
  enrichedItems: EnrichedOrderItem[];
  payments: Payment[];
  totalPaid: number;
}

export class InvoiceDetailService {
  async getInvoiceWithFullDetails(
    invoiceId: string,
  ): Promise<InvoiceDetailData | null> {
    try {
      // 1. Obtener la factura
      const invoice = await invoiceService.getById(invoiceId);
      if (!invoice) {
        return null;
      }

      // 2. Obtener la orden relacionada y otras entidades
      let order: Order | null = null;
      let customer: Customer | null = null;
      let user: User | null = null;
      // --------------------------------------------------
      let enrichedItems: EnrichedOrderItem[] = [];
      let payments: Payment[] = [];

      if (invoice.orderId) {
        order = await orderService.getById(invoice.orderId);

        if (order) {
          // 3. Obtener los productos de la orden y enriquecer los items
          const productIds =
            order.items?.map((item) => item.productId).filter(Boolean) || [];
          const products = await Promise.all(
            productIds.map((id) => productService.getById(id)),
          );

          // Crear un mapa de productos para búsqueda rápida
          const productMap = new Map<string, Product>();
          products.forEach((product) => {
            if (product) {
              productMap.set(product.id, product);
            }
          });

          // Enriquecer los items con datos del producto
          enrichedItems = (order.items || []).map((item) => ({
            ...item,
            product: productMap.get(item.productId),
          }));

          // 4. Obtener los pagos relacionados con la orden
          try {
            const allPayments = await paymentService.getAll();
            payments = allPayments.filter(
              (payment) => payment.orderId === order?.id,
            );
          } catch {
            payments = [];
          }

          // 5. Obtener datos del cliente
          if (order.customerId) {
            try {
              customer = await customerService.getById(order.customerId);
            } catch {
              // error
            }
          }

          // 6. Obtener datos del usuario que creó la orden
          if (order.userId) {
            try {
              user = await userService.getById(order.userId);
            } catch (error) {
              console.warn('No se pudo cargar el usuario:', error);
            }
          }
        }
      } else {
        // Si no hay orden, pero la factura tiene customerId, intentar obtener el cliente
        if (invoice.customerId) {
          try {
            customer = await customerService.getById(invoice.customerId);
          } catch (error) {
            console.warn('No se pudo cargar el cliente de la factura:', error);
          }
        }
      }

      // 7. Calcular total pagado
      const totalPaid = payments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0,
      );

      return {
        invoice,
        order,
        customer,
        user,
        enrichedItems,
        payments,
        totalPaid,
      };
    } catch (error) {
      // Es una buena práctica registrar el error antes de lanzarlo
      throw error;
    }
  }

  /**
   * Obtiene un resumen de los métodos de pago utilizados
   */
  getPaymentMethodsSummary(payments: Payment[]) {
    const summary = new Map<string, { amount: number; count: number }>();

    payments.forEach((payment) => {
      const method = payment.method || 'No especificado';
      const existing = summary.get(method) || { amount: 0, count: 0 };
      summary.set(method, {
        amount: existing.amount + (payment.amount || 0),
        count: existing.count + 1,
      });
    });

    return Array.from(summary.entries()).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
    }));
  }

  /**
   * Verifica si una factura está completamente pagada
   */
  isInvoiceFullyPaid(invoice: Invoice, totalPaid: number): boolean {
    const invoiceTotal = invoice.total || 0;
    return totalPaid >= invoiceTotal;
  }

  /**
   * Calcula el saldo pendiente de una factura
   */
  getPendingBalance(invoice: Invoice, totalPaid: number): number {
    const invoiceTotal = invoice.total || 0;
    return Math.max(0, invoiceTotal - totalPaid);
  }
}

// Exportar una instancia del servicio
export const invoiceDetailService = new InvoiceDetailService();
