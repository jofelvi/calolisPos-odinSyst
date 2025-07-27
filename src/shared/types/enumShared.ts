export enum UserRoleEnum {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  WAITER = 'waiter',
  KITCHEN = 'kitchen',
  CUSTOMER = 'customer',
}

export enum CurrencyEnum {
  USD = 'USD',
  EUR = 'EUR',
  VES = 'VES',
}

export enum ProductTypeEnum {
  BASE = 'BASE',
  MIXED = 'COMPUESTO',
}

export enum PaymentTypeEnum {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  PAYMOBIL = 'payMobil',
}

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
}

export enum PaymentMethodEnum {
  CASH_BS = 'CASH_BS',
  CASH_USD = 'CASH_USD',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  PAGO_MOVIL = 'PAGO_MOVIL',
  MIXED = 'MIXED',
  PENDING = 'PENDING',
}

export enum SupplierPaymentTermEnum {
  IMMEDIATE = 'immediate', // Pago inmediato
  CASH_ON_DELIVERY = 'cash_on_delivery', // Contra entrega
  NET_15 = 'net_15', // 15 días
  NET_30 = 'net_30', // 30 días
  NET_45 = 'net_45', // 45 días
  NET_60 = 'net_60', // 60 días
  NET_90 = 'net_90', // 90 días
}

export enum DocumentTypeEnum {
  INVOICE = 'invoice', // Factura
  DELIVERY_NOTE = 'delivery_note', // Guía de entrega
  RECEIPT = 'receipt', // Recibo
  CONTRACT = 'contract', // Contrato
  OTHER = 'other', // Otro
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum TableStatusEnum {
  PREPARING = 'preparing',
  ISAVAILABLE = 'isAvailable',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
}

export enum AttendanceStatusEnum {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EARLY_DEPARTURE = 'early_departure',
  HOLIDAY = 'holiday',
  SICK_LEAVE = 'sick_leave',
  VACATION = 'vacation',
  MEDICALREST = 'medicalRest', // Mantener por compatibilidad
}

export enum PurchaseOrderStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  RECEIVED = 'received',
  CANCELED = 'canceled',
  PARTIALLY_RECEIVED = 'partially_received',
}

// Tipos de unidades
export enum UnitType {
  WEIGHT = 'WEIGHT',
  VOLUME = 'VOLUME',
  UNIT = 'UNIT',
  UNKNOWN = 'UNKNOWN',
}

export enum ProductPresentationEnum {
  UNIT = 'Unidad',
  BOX = 'Caja',
  PACK = 'Paquete',
  BAG = 'Bolsa',
  BOTTLE = 'Botella',
  CAN = 'Lata',
  CONTAINER = 'Envase',
  JAR = 'Frasco',
  DOZEN = 'Docena',
  HALF_DOZEN = 'Media Docena',
  KILOGRAM = 'Kilogramo',
  GRAM = 'Gramo',
  LITER = 'Litro',
  MILLILITER = 'Mililitro',
  GALLON = 'Galón',
  // Agrupaciones comerciales
  BULK = 'Bulto',
  ROLL = 'Rollo',
  PLATE = 'Plato',
}

export enum IdentificationType {
  V = 'V', // Venezolano
  E = 'E', // Extranjero
  J = 'J', // Jurídico
  G = 'G', // Gubernamental
}

export enum InvoiceStatusEnum {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum OrderTypeEnum {
  DineIn = 'dine-in',
  Takeaway = 'takeaway',
}

export enum PayrollStatusEnum {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}
