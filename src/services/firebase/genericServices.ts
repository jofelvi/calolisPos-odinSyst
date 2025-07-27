import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { convertFirebaseDate } from '@/shared/utils/dateHelpers';
import { db } from '@/services/firebase/firebase';
import { User } from '@/modelTypes/user';
import { Supplier } from '@/modelTypes/supplier';
import { Product } from '@/modelTypes/product';
import { Category } from '@/modelTypes/category';
import { Table } from '@/modelTypes/table';
import { PurchaseOrder } from '@/modelTypes/purchaseOrder';
import { Order } from '@/modelTypes/order';
import { Customer } from '@/modelTypes/customer';
import { Payment } from '@/modelTypes/payment';
import { AccountReceivable } from '@/modelTypes/accountReceivable';
import { PagoMovil } from '@/modelTypes/pagoMovil';
import { Invoice } from '@/modelTypes/invoice';
import { Employee } from '@/modelTypes/employee';
import { Payroll } from '@/modelTypes/payroll';
import { Attendance } from '@/modelTypes/attendance';

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
        return;
      }

      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, sanitizedItem);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
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
export const attendanceService = new FirestoreService<Attendance>(
  'attendances',
);

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
          } catch {
            return order;
          }
        }
        return order;
      }),
    );

    return ordersWithTables;
  } catch (error) {
    throw error;
  }
};

// Employee helper functions
export const getActiveEmployees = async (): Promise<Employee[]> => {
  try {
    const q = query(collection(db, 'employees'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Employee,
    );
  } catch (error) {
    throw error;
  }
};

export const getEmployeeByEmail = async (
  email: string,
): Promise<Employee | null> => {
  try {
    const q = query(
      collection(db, 'employees'),
      where('email', '==', email.toLowerCase().trim()),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Employee;
  } catch (error) {
    throw error;
  }
};

// Attendance helper functions
export const getEmployeeAttendanceByDate = async (
  employeeId: string,
  date: Date,
): Promise<Attendance | null> => {
  try {
    // Alternativa temporal: obtener todas las asistencias del empleado y filtrar en cliente
    const q = query(
      collection(db, 'attendances'),
      where('employeeId', '==', employeeId),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Filtrar en el cliente por fecha
    const attendances = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Attendance[];

    const todayAttendance = attendances.find((attendance) => {
      const attendanceDate = new Date(attendance.date);
      attendanceDate.setHours(0, 0, 0, 0);
      return attendanceDate.getTime() === targetDate.getTime();
    });

    return todayAttendance || null;
  } catch (error) {
    throw error;
  }
};

export const getEmployeeAttendanceByPeriod = async (
  employeeId: string,
  startDate: Date,
  endDate: Date,
): Promise<Attendance[]> => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('employeeId', '==', employeeId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Attendance,
    );
  } catch (error) {
    throw error;
  }
};

// Payroll helper functions
export const getEmployeePayrollByPeriod = async (
  employeeId: string,
  month: number,
  year: number,
): Promise<Payroll | null> => {
  try {
    const q = query(
      collection(db, 'payrolls'),
      where('employeeId', '==', employeeId),
      where('period.month', '==', month),
      where('period.year', '==', year),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Payroll;
  } catch (error) {
    throw error;
  }
};

export const fetchAllAttendancesByUserId = async (
  employeeId: string,
): Promise<Attendance[]> => {
  try {
    const q = query(
      collection(db, 'attendances'),
      where('employeeId', '==', employeeId),
    );
    const snapshot = await getDocs(q);
    const attendances = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('data', data);
      return {
        id: doc.id,
        ...data,
        // Convert date fields manually
        date: convertFirebaseDate(data.date),
        checkIn: convertFirebaseDate(data.checkIn),
        //checkOut: convertFirebaseDate(data.checkOut),
        createdAt: convertFirebaseDate(data.createdAt),
        updatedAt: convertFirebaseDate(data.updatedAt),
      } as Attendance;
    });

    // Sort by date descending (most recent first)
    return attendances.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    throw error;
  }
};
