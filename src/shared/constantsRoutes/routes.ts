import { UserRoleEnum } from '@/shared/types/enumShared';

// Rutas públicas (accesibles sin autenticación)
export const PUBLIC_ROUTES = {
  LOGIN: '/public/login',
  ROOT: '/',
} as const;

// Rutas para usuarios CUSTOMER
export const CUSTOMER_ROUTES = {
  HOME: '/customer/home',
  CATALOG: '/customer/catalog',
  HISTORY: '/customer/history',
  CURRENT_ORDER: '/customer/current-order',
} as const;

// Rutas para usuarios STAFF/ADMIN (no customer)
export const PRIVATE_ROUTES = {
  DASHBOARD: '/private/dashboard',

  // Productos
  PRODUCTS: '/private/products',
  PRODUCTS_NEW: '/private/products/new',
  PRODUCTS_DETAILS: (id: string) => `/private/products/${id}/details`,
  PRODUCTS_EDIT: (id: string) => `/private/products/${id}`,

  // Categorías
  CATEGORIES: '/private/categories',
  CATEGORIES_NEW: '/private/categories/new',
  CATEGORIES_DETAILS: (id: string) => `/private/categories/${id}/details`,
  CATEGORIES_EDIT: (id: string) => `/private/categories/${id}`,

  // Clientes
  CUSTOMERS: '/private/customers',

  // Cuentas por Cobrar
  ACCOUNTS_RECEIVABLE: '/private/accounts-receivable',
  ACCOUNTS_RECEIVABLE_NEW: '/private/accounts-receivable/new',
  ACCOUNTS_RECEIVABLE_DETAILS: (id: string) =>
    `/private/accounts-receivable/${id}`,
  ACCOUNTS_RECEIVABLE_EDIT: (id: string) =>
    `/private/accounts-receivable/${id}/edit`,

  // Órdenes
  ORDERS: '/private/orders',
  ORDER_DETAILS: (orderId: string) => `/private/orders/${orderId}`,
  ORDER_EDIT: (orderId: string) => `/private/orders/${orderId}/edit`,

  // Ventas
  SALES: '/private/sales',

  // Facturas
  INVOICES: '/private/invoices',
  INVOICES_DETAILS: (id: string) => `/private/invoices/${id}/details`,

  // POS (Point of Sale)
  POS: '/private/pos',
  POS_ORDER: '/private/pos/order',
  POS_PAYMENT: (orderId: string) => `/private/pos/payment/${orderId}`,
  POS_RECEIPT: (orderId: string) => `/private/pos/receipt/${orderId}`,

  // Órdenes de compra
  PURCHASE_ORDERS: '/private/purchase-orders',
  PURCHASE_ORDERS_NEW: '/private/purchase-orders/new',
  PURCHASE_ORDERS_DETAILS: (id: string) =>
    `/private/purchase-orders/${id}/details`,
  PURCHASE_ORDERS_EDIT: (id: string) => `/private/purchase-orders/${id}`,

  // Proveedores
  SUPPLIERS: '/private/suppliers',
  SUPPLIERS_NEW: '/private/suppliers/new',
  SUPPLIERS_EDIT: (id: string) => `/private/suppliers/${id}`,

  // Mesas
  TABLES: '/private/tables',
  TABLES_NEW: '/private/tables/new',
  TABLES_DETAILS: (id: string) => `/private/tables/${id}/details`,
  TABLES_EDIT: (id: string) => `/private/tables/${id}`,

  // Empleados
  EMPLOYEES: '/private/employees',
  EMPLOYEES_NEW: '/private/employees/new',
  EMPLOYEES_DETAILS: (id: string) => `/private/employees/${id}`,
  EMPLOYEES_EDIT: (id: string) => `/private/employees/${id}/edit`,
  EMPLOYEES_ATTENDANCE: (id: string) => `/private/employees/${id}/attendance`,
  EMPLOYEES_PAYROLL: (id: string) => `/private/employees/${id}/payroll`,

  // Configuración
  SETTINGS: '/private/settings',
} as const;

// Rutas de autenticación
export const AUTH_ROUTES = {
  SIGNIN: '/public/login',
  SIGNOUT: '/api/auth/signout',
} as const;

// Función para obtener la ruta por defecto según el rol del usuario
export const getDefaultRouteByRole = (role: UserRoleEnum): string => {
  switch (role) {
    case UserRoleEnum.CUSTOMER:
      return CUSTOMER_ROUTES.HOME;
    case UserRoleEnum.ADMIN:
    case UserRoleEnum.MANAGER:
    default:
      return PRIVATE_ROUTES.DASHBOARD;
  }
};

// Función para verificar si una ruta es accesible para un rol específico
export const isRouteAccessibleForRole = (
  route: string,
  role: UserRoleEnum,
): boolean => {
  // Rutas públicas son accesibles para todos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (Object.values(PUBLIC_ROUTES).includes(route as any)) {
    return true;
  }

  // Rutas de customer solo para customers
  if (route.startsWith('/customer') && role === UserRoleEnum.CUSTOMER) {
    return true;
  }

  // Rutas privadas solo para no-customers
  if (route.startsWith('/private') && role !== UserRoleEnum.CUSTOMER) {
    return true;
  }

  return false;
};

// Función para redirigir a una ruta apropiada si la actual no es accesible
export const getRedirectRouteForRole = (
  currentRoute: string,
  role: UserRoleEnum,
): string | null => {
  if (isRouteAccessibleForRole(currentRoute, role)) {
    return null; // No necesita redirección
  }

  return getDefaultRouteByRole(role);
};

// Todas las rutas organizadas por tipo de acceso
export const ROUTES_BY_ACCESS = {
  PUBLIC: PUBLIC_ROUTES,
  CUSTOMER: CUSTOMER_ROUTES,
  PRIVATE: PRIVATE_ROUTES,
  AUTH: AUTH_ROUTES,
} as const;

// Rutas que requieren autenticación
export const PROTECTED_ROUTE_PATTERNS = ['/private/*', '/customer/*'] as const;

// Rutas que NO requieren autenticación
export const PUBLIC_ROUTE_PATTERNS = ['/public/*', '/', '/api/*'] as const;
