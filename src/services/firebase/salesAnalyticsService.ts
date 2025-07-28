import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { convertFirebaseDate } from '@/shared/utils/dateHelpers';
import { Order } from '@/modelTypes/order';
import { PaymentStatusEnum } from '@/modelTypes/enumShared';

export interface WeeklySalesData {
  day: string;
  sales: number;
  orders: number;
}

export interface SalesInterval {
  total: number;
  orders: number;
  period: string;
}

export enum SalesIntervalEnum {
  TODAY = 'today',
  CURRENT_MONTH = 'currentMonth',
  PREVIOUS_MONTH = 'previousMonth',
}

class SalesAnalyticsService {
  private collectionName = 'orders';

  async getWeeklySalesData(): Promise<WeeklySalesData[]> {
    try {
      // Get the start of the current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      // Get the end of the current week (Sunday)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      console.log('📅 Weekly Sales Debug:', {
        currentDate: now.toISOString(),
        monday: monday.toISOString(),
        sunday: sunday.toISOString(),
        paymentStatus: PaymentStatusEnum.PAID,
      });

      // Query paid orders only (avoid compound index requirement)
      const ordersRef = collection(db, this.collectionName);
      const weekQuery = query(
        ordersRef,
        where('paymentStatus', '==', PaymentStatusEnum.PAID),
      );

      const snapshot = await getDocs(weekQuery);

      // Filter by date range in memory to avoid Firebase index requirements
      const allOrders: Order[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Order,
      );

      // Filter orders within the current week
      const orders = allOrders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = convertFirebaseDate(order.createdAt);
        return orderDate >= monday && orderDate <= sunday;
      });

      console.log('📈 Weekly Query Results:', {
        totalDocs: snapshot.size,
        filteredOrders: orders.length,
        dateRange: {
          monday: monday.toISOString(),
          sunday: sunday.toISOString(),
        },
      });

      // Initialize data for all days of the week
      const daysOfWeek = [
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
        'Domingo',
      ];

      const weeklySalesData: WeeklySalesData[] = daysOfWeek.map((day) => ({
        day,
        sales: 0,
        orders: 0,
      }));

      // Process orders and group by day of week
      orders.forEach((order) => {
        if (order.createdAt && order.total) {
          const orderDate = convertFirebaseDate(order.createdAt);
          const dayIndex = orderDate.getDay();
          // Convert Sunday (0) to index 6, Monday (1) to index 0, etc.
          const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;

          weeklySalesData[adjustedDayIndex].sales += order.total;
          weeklySalesData[adjustedDayIndex].orders += 1;
        }
      });

      console.log('📊 Final Weekly Data:', weeklySalesData);

      return weeklySalesData;
    } catch (error) {
      console.error('❌ Error in getWeeklySalesData:', error);
      return [];
    }
  }

  async getSalesDataByInterval(
    interval: SalesIntervalEnum,
  ): Promise<SalesInterval> {
    try {
      let startDate: Date;
      let endDate: Date;
      let period: string;

      const now = new Date();

      switch (interval) {
        case SalesIntervalEnum.TODAY:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          period = 'Hoy';
          break;

        case SalesIntervalEnum.CURRENT_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          period = now.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric',
          });
          break;

        case SalesIntervalEnum.PREVIOUS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          endDate.setHours(23, 59, 59, 999);
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          period = prevMonth.toLocaleDateString('es-ES', {
            month: 'long',
            year: 'numeric',
          });
          break;

        default:
          throw new Error('Invalid interval');
      }

      console.log('🔍 Sales Analytics Debug:', {
        interval,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period,
        paymentStatus: PaymentStatusEnum.PAID,
      });

      // Query paid orders only (avoid compound index requirement)
      const ordersRef = collection(db, this.collectionName);
      const intervalQuery = query(
        ordersRef,
        where('paymentStatus', '==', PaymentStatusEnum.PAID),
      );

      const snapshot = await getDocs(intervalQuery);

      // Filter by date range in memory to avoid Firebase index requirements
      const allOrders: Order[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Order,
      );

      // Filter orders within the specified interval
      const orders = allOrders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = convertFirebaseDate(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      console.log('📊 Query Results:', {
        totalDocs: snapshot.size,
        filteredOrders: orders.length,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      // Calculate totals
      const total = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const orderCount = orders.length;

      console.log('💰 Calculated Totals:', {
        total,
        orderCount,
        orders: orders.length,
      });

      return {
        total,
        orders: orderCount,
        period,
      };
    } catch (error) {
      console.error('❌ Error in getSalesDataByInterval:', error);
      return {
        total: 0,
        orders: 0,
        period: 'Error',
      };
    }
  }
}

export const salesAnalyticsService = new SalesAnalyticsService();
