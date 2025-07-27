import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { convertFirebaseDate } from '@/shared/utils/dateHelpers';
import { Order } from '@/modelTypes/order';

export interface WeeklySalesData {
  day: string;
  sales: number;
  orders: number;
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

      // Query orders for the current week
      const ordersRef = collection(db, this.collectionName);
      const weekQuery = query(
        ordersRef,
        where('createdAt', '>=', Timestamp.fromDate(monday)),
        where('createdAt', '<=', Timestamp.fromDate(sunday)),
        where('paymentStatus', '==', 'paid'),
      );

      const snapshot = await getDocs(weekQuery);
      const orders: Order[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Order,
      );

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

      return weeklySalesData;
    } catch {
      return [];
    }
  }
}

export const salesAnalyticsService = new SalesAnalyticsService();
