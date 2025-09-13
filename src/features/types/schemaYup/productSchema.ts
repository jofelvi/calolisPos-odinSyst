import * as yup from 'yup';
import {
  CurrencyEnum,
  ProductPresentationEnum,
  ProductTypeEnum,
} from '@/shared';

const ingredientSchema = yup.object({
  productId: yup.string().required('El producto es requerido'),
  quantity: yup
    .number()
    .positive('La cantidad debe ser positiva')
    .required('La cantidad es requerida'),
  unit: yup.string().required('La unidad es requerida'),
  wastePercentage: yup // Nuevo campo
    .number()
    .min(0, 'La merma no puede ser negativa')
    .max(100, 'La merma no puede ser mayor a 100%')
    .default(10)
    .required('La merma es requerida'),
});

export const productSchema = yup.object({
  name: yup.string().required('El nombre es requerido').defined(),
  description: yup.string().nullable().defined(),
  price: yup
    .number()
    .positive('El precio debe ser positivo')
    .required('El precio es requerido')
    .defined(),
  currency: yup
    .string()
    .oneOf(Object.values(CurrencyEnum))
    .required('La moneda es requerida')
    .defined(),
  type: yup
    .string()
    .oneOf(Object.values(ProductTypeEnum))
    .required('El tipo es requerido')
    .defined(),
  categoryId: yup.string().required('La categoría es requerida').defined(),
  supplierIds: yup.array().of(yup.string()).nullable().defined(),
  isActive: yup.boolean().default(true).defined(),
  isForSale: yup.boolean().default(true).defined(),
  cost: yup
    .number()
    .min(0, 'El costo no puede ser negativo') // Asegura que no sea negativo, permitiendo el cero
    .optional()
    .defined(),
  sku: yup.string().nullable().defined(),
  barcode: yup.string().nullable().defined(),
  stock: yup
    .number()
    .min(0, 'El stock no puede ser negativo')
    .required('El stock es requerido')
    .defined(),
  minStock: yup
    .number()
    .min(0, 'El stock mínimo no puede ser negativo')
    .nullable()
    .defined(),
  presentation: yup
    .string()
    .oneOf(Object.values(ProductPresentationEnum))
    .required('La presentación es requerida')
    .defined(),
  presentationQuantity: yup
    .number()
    .positive('La cantidad debe ser positiva')
    .nullable()
    .defined(),
  imageUrl: yup.string().nullable().defined(),
  ingredients: yup
    .array()
    .of(ingredientSchema)
    .when('type', {
      is: ProductTypeEnum.MIXED,
      then: (schema) =>
        schema.min(
          1,
          'Los productos MIXED deben tener al menos un ingrediente',
        ),
      otherwise: (schema) => schema.nullable(),
    })
    .nullable()
    .optional()
    .defined(),
});

export type ProductFormData = yup.InferType<typeof productSchema>;
