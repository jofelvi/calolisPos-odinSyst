import * as yup from 'yup';

export const categorySchema = yup.object().shape({
  name: yup.string().required('El nombre es requerido').defined(),
  description: yup.string().nullable().defined(),
  isActive: yup.boolean().required().defined(),
  imageUrl: yup.string().url('Debe ser una URL válida').nullable().defined(),
  isForSale: yup.boolean().required().defined(), // Nuevo campo
});

export type CategoryFormValues = yup.InferType<typeof categorySchema>;
