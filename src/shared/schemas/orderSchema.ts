import * as yup from 'yup';
import {
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '@/modelTypes/enumShared';

export const orderItemSchema = yup.object().shape({
  productId: yup.string().required().defined(),
  name: yup.string().required().defined(),
  quantity: yup.number().required().positive().integer().defined(),
  unitPrice: yup.number().required().positive().defined(),
  total: yup.number().required().positive().defined(),
  notes: yup.string().nullable().defined(),
});

export const orderSchema = yup.object().shape({
  tableId: yup.string().nullable().defined(),
  customerId: yup.string().nullable().defined(),
  status: yup
    .mixed<OrderStatusEnum>()
    .oneOf(Object.values(OrderStatusEnum))
    .required()
    .defined(),
  items: yup.array().of(orderItemSchema).required().min(1).defined(),
  subtotal: yup.number().required().positive().defined(),
  tax: yup.number().required().min(0).defined(),
  total: yup.number().required().positive().defined(),
  // Cambia esta línea - elimina .defined() para hacer el campo opcional
  paymentMethod: yup
    .mixed<PaymentMethodEnum>()
    .oneOf(Object.values(PaymentMethodEnum))
    .nullable()
    .defined(),
  paymentStatus: yup
    .string<PaymentStatusEnum>()
    .oneOf(Object.values(PaymentStatusEnum))
    .required()
    .defined(),
  notes: yup.string().nullable().defined(),
});

export type OrderFormValues = yup.InferType<typeof orderSchema>;
