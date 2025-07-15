import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { convertFirebaseDate } from '@/utils/dateHelpers';
import { db } from '@/services/firebase/firebase';
import { User } from '@/types/user';
import { Supplier } from '@/types/supplier';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { Table } from '@/types/table';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';
import { Payment } from '@/types/payment';
import { AccountReceivable } from '@/types/accountReceivable';
import { PagoMovil } from '@/types/pagoMovil';
import { Invoice } from '@/types/invoice';
import { Employee } from '@/types/employee';
import { Payroll } from '@/types/payroll';
import { Attendance } from '@/types/attendance';

class FirestoreService<T extends { id: string }> {
  constructor(private collectionName: string) {}

  async getAll(): Promise<T[]> {
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...this.convertDocumentDates(doc.data()),
          }) as T,
      );
    } catch (error) {
      console.error(
        `Error al obtener documentos de ${this.collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists()
        ? ({
            id: docSnap.id,
            ...this.convertDocumentDates(docSnap.data()),
          } as T)
        : null;
    } catch (error) {
      console.error(
        `Error al obtener documento ${id} de ${this.collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    try {
      // Sanitizar los datos eliminando valores undefined
      const sanitizedItem = this.sanitizeData(item);

      const docRef = await addDoc(
        collection(db, this.collectionName),
        sanitizedItem,
      );
      return { id: docRef.id, ...sanitizedItem } as T;
    } catch (error) {
      console.error(
        `Error al crear documento en ${this.collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async createWithId(id: string, item: Omit<T, 'id'>): Promise<T> {
    try {
      // Sanitizar los datos eliminando valores undefined
      const sanitizedItem = this.sanitizeData(item);

      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, sanitizedItem);
      return { id, ...sanitizedItem } as T;
    } catch (error) {
      console.error(
        `Error al crear documento con ID ${id} en ${this.collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async update(id: string, item: Partial<Omit<T, 'id'>>): Promise<void> {
    try {
      if (!id) {
        throw new Error('ID no proporcionado para actualización');
      }

      // Sanitizar los datos eliminando valores undefined
      const sanitizedItem = this.sanitizeData(item);

      // Verificar que haya datos para actualizar
      if (Object.keys(sanitizedItem).length === 0) {
        console.warn(
          `No hay datos válidos para actualizar el documento ${id} en ${this.collectionName}`,
        );
        return;
      }

      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, sanitizedItem);
    } catch (error) {
      console.error(
        `Error al actualizar documento ${id} en ${this.collectionName}:`,
        error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(
        `Error al eliminar documento ${id} de ${this.collectionName}:`,
        error,
      );
      throw error;
    }
  }

  // Método auxiliar para sanitizar datos antes de enviarlos a Firestore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanitizeData<D extends Record<string, any>>(
    data: D | null | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    if (data === null || data === undefined) {
      return {};
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitized: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      // Omitir valores undefined y funciones
      if (value !== undefined && typeof value !== 'function') {
        // Convertir fechas a timestamps de Firestore si son objetos Date
        if (value instanceof Date) {
          sanitized[key] = value; // Firestore convertirá automáticamente Date a Timestamp
        }
        // Sanitizar objetos anidados
        else if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          sanitized[key] = this.sanitizeData(value);
        }
        // Convertir arrays con objetos anidados
        else if (Array.isArray(value)) {
          sanitized[key] = value.map((item) => {
            if (
              item !== null &&
              typeof item === 'object' &&
              !(item instanceof Date)
            ) {
              return this.sanitizeData(item);
            }
            return item;
          });
        }
        // Valores primitivos o null
        else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  // Método auxiliar para convertir fechas de Firestore a objetos Date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertDocumentDates(data: Record<string, any>): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converted: Record<string, any> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [key, value] of Object.entries(data)) {
      // Convertir campos de fecha comunes
      if (
        key === 'createdAt' ||
        key === 'updatedAt' ||
        key === 'dueDate' ||
        key === 'expectedDeliveryDate'
      ) {
        converted[key] = convertFirebaseDate(value);
      }
      // Manejar objetos anidados
      else if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        converted[key] = this.convertDocumentDates(value);
      }
      // Manejar arrays con objetos anidados
      else if (Array.isArray(value)) {
        converted[key] = value.map((item) => {
          if (item !== null && typeof item === 'object') {
            return this.convertDocumentDates(item);
          }
          return item;
        });
      }
      // Valores primitivos
      else {
        converted[key] = value;
      }
    }

    return converted;
  }
}

export const userService = new FirestoreService<User>('users');
export const supplierService = new FirestoreService<Supplier>('suppliers');
export const productService = new FirestoreService<Product>('products');
export const categoryService = new FirestoreService<Category>('categories');
export const tableService = new FirestoreService<Table>('tables');
export const purchaseOrderService = new FirestoreService<PurchaseOrder>(
  'purchaseOrders',
);
export const orderService = new FirestoreService<Order>('orders');
export const customerService = new FirestoreService<Customer>('customers');
export const paymentService = new FirestoreService<Payment>('payments');
export const accountReceivableService = new FirestoreService<AccountReceivable>(
  'accountReceivables',
);
export const pagoMovilService = new FirestoreService<PagoMovil>('pagoMoviles');
export const invoiceService = new FirestoreService<Invoice>('invoices');

// Employee, Payroll and Attendance services
export const employeeService = new FirestoreService<Employee>('employees');
export const payrollService = new FirestoreService<Payroll>('payrolls');
export const attendanceService = new FirestoreService<Attendance>('attendances');

// Helper function to get customer receivables
export const getCustomerReceivables = async (
  customerId: string,
): Promise<AccountReceivable[]> => {
  try {
    const q = query(
      collection(db, 'accountReceivables'),
      where('customerId', '==', customerId),
      where('status', 'in', ['pending', 'partially_paid']),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as AccountReceivable,
    );
  } catch (error) {
    console.error('Error getting customer receivables:', error);
    throw error;
  }
};

// Helper function to get pago movil by reference number
export const getPagoMovilByReference = async (
  referenceNumber: string,
): Promise<PagoMovil | null> => {
  try {
    const q = query(
      collection(db, 'pagoMoviles'),
      where('referenceNumber', '==', referenceNumber),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PagoMovil;
  } catch (error) {
    console.error('Error getting pago movil by reference:', error);
    throw error;
  }
};

// Helper function to get active order for a specific table
export const getActiveOrderByTable = async (
  tableId: string,
): Promise<Order | null> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('tableId', '==', tableId),
      where('status', 'in', ['pending', 'in_progress', 'ready']),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0]; // Solo debería haber una orden activa por mesa
    return { id: doc.id, ...doc.data() } as Order;
  } catch (error) {
    console.error('Error getting active order by table:', error);
    throw error;
  }
};

// Helper function to get all active takeaway orders
export const getActiveTakeawayOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('tableId', '==', null),
      where('status', 'in', ['pending', 'in_progress', 'ready']),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
  } catch (error) {
    console.error('Error getting active takeaway orders:', error);
    throw error;
  }
};

// Helper function to get all active orders with table info
export const getActiveOrdersWithTables = async (): Promise<
  (Order & { tableNumber?: number })[]
> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['pending', 'in_progress', 'ready']),
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Order,
    );

    // Get table info for orders that have tableId
    const ordersWithTables = await Promise.all(
      orders.map(async (order) => {
        if (order.tableId) {
          try {
            const table = await tableService.getById(order.tableId);
            return { ...order, tableNumber: table?.number };
          } catch (error) {
            console.error('Error getting table info for order:', error);
            return order;
          }
        }
        return order;
      }),
    );

    return ordersWithTables;
  } catch (error) {
    console.error('Error getting active orders with tables:', error);
    throw error;
  }
};

// Employee helper functions
export const getActiveEmployees = async (): Promise<Employee[]> => {
  try {
    const q = query(
      collection(db, 'employees'),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Employee);
  } catch (error) {
    console.error('Error getting active employees:', error);
    throw error;
  }
};

// Attendance helper functions
export const getEmployeeAttendanceByDate = async (
  employeeId: string,
  date: Date
): Promise<Attendance | null> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'attendances'),
      where('employeeId', '==', employeeId),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Attendance;
  } catch (error) {
    console.error('Error getting employee attendance by date:', error);
    throw error;
  }
};

export const getEmployeeAttendanceByPeriod = async (
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<Attendance[]> => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('employeeId', '==', employeeId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Attendance);
  } catch (error) {
    console.error('Error getting employee attendance by period:', error);
    throw error;
  }
};

// Payroll helper functions
export const getEmployeePayrollByPeriod = async (
  employeeId: string,
  month: number,
  year: number
): Promise<Payroll | null> => {
  try {
    const q = query(
      collection(db, 'payrolls'),
      where('employeeId', '==', employeeId),
      where('period.month', '==', month),
      where('period.year', '==', year)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Payroll;
  } catch (error) {
    console.error('Error getting employee payroll by period:', error);
    throw error;
  }
};
