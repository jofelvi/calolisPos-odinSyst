import { Ingredient, Product } from '@/types/product';
import { ProductFormData } from '@/app/components/types/schemaYup/productSchema';
import { ProductPresentationEnum, ProductTypeEnum } from '@/types/enumShared';

export const calculateMixedProductCost = (
  ingredients: Ingredient[],
  products: Product[],
): number => {
  return ingredients.reduce((total, ingredient) => {
    const product = products.find((p) => p.id === ingredient.productId);
    if (product && product.cost) {
      return total + product.cost * ingredient.quantity;
    }
    return total;
  }, 0);
};

export const mapProductToFormData = (
  product: Product,
): Partial<ProductFormData> => {
  console.log({ product });
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    type: product.type,
    categoryId: product.categoryId,
    supplierIds: product.supplierIds || [],
    isActive: product.isActive,
    cost: product.cost,
    sku: product.sku,
    barcode: product.barcode,
    stock: product.stock,
    minStock: product.minStock,
    presentation: product.presentation as ProductPresentationEnum,
    presentationQuantity: product.presentationQuantity || 1,
    imageUrl: product.imageUrl,
    ingredients: product.ingredients || [],
  };
};

// 2. Función para mapear FormData a Product
export const mapFormDataToProduct = (
  formData: ProductFormData,
  id?: string,
): Omit<Product, 'id'> | Product => {
  const baseProduct = {
    name: formData.name,
    description: formData.description,
    price: formData.price,
    currency: formData.currency,
    type: formData.type,
    categoryId: formData.categoryId,
    supplierIds: formData.supplierIds,
    isActive: formData.isActive,
    cost: formData.cost,
    sku: formData.sku,
    barcode: formData.barcode,
    stock: formData.stock,
    minStock: formData.minStock,
    presentation: formData.presentation,
    presentationQuantity: formData.presentationQuantity,
    imageUrl: formData.imageUrl,
    ingredients:
      formData.type === ProductTypeEnum.MIXED ? formData.ingredients : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return id ? { ...baseProduct, id } : baseProduct;
};

export const defaultQuantities: Record<ProductPresentationEnum, number> = {
  [ProductPresentationEnum.UNIT]: 1,
  [ProductPresentationEnum.BOX]: 12,
  [ProductPresentationEnum.PACK]: 6,
  [ProductPresentationEnum.BAG]: 1,
  [ProductPresentationEnum.BOTTLE]: 1,
  [ProductPresentationEnum.CAN]: 1,
  [ProductPresentationEnum.CONTAINER]: 1,
  [ProductPresentationEnum.JAR]: 1,
  [ProductPresentationEnum.DOZEN]: 12,
  [ProductPresentationEnum.HALF_DOZEN]: 6,
  [ProductPresentationEnum.KILOGRAM]: 1,
  [ProductPresentationEnum.GRAM]: 100, // 100 gramos por defecto
  [ProductPresentationEnum.LITER]: 1,
  [ProductPresentationEnum.MILLILITER]: 500, // 500ml por defecto
  [ProductPresentationEnum.GALLON]: 1,
  [ProductPresentationEnum.BULK]: 1,
  [ProductPresentationEnum.ROLL]: 1,
  [ProductPresentationEnum.PLATE]: 1,
};

export const presentationLabels = {
  [ProductPresentationEnum.UNIT]: 'Unidad individual',
  [ProductPresentationEnum.BOX]: 'Caja con múltiples unidades',
  [ProductPresentationEnum.PACK]: 'Paquete con múltiples unidades',
  [ProductPresentationEnum.BAG]: 'Bolsa con contenido variable',
  [ProductPresentationEnum.BOTTLE]: 'Botella con líquido o contenido',
  [ProductPresentationEnum.CAN]: 'Lata con contenido preservado',
  [ProductPresentationEnum.CONTAINER]: 'Envase o recipiente',
  [ProductPresentationEnum.JAR]: 'Frasco de vidrio o plástico',
  [ProductPresentationEnum.DOZEN]: 'Agrupación de 12 unidades',
  [ProductPresentationEnum.HALF_DOZEN]: 'Agrupación de 6 unidades',
  [ProductPresentationEnum.KILOGRAM]: 'Peso en kilogramos',
  [ProductPresentationEnum.GRAM]: 'Peso en gramos',
  [ProductPresentationEnum.LITER]: 'Volumen en litros',
  [ProductPresentationEnum.MILLILITER]: 'Volumen en mililitros',
  [ProductPresentationEnum.GALLON]: 'Volumen en galones',
  [ProductPresentationEnum.BULK]: 'Bulto o paquete grande',
  [ProductPresentationEnum.ROLL]: 'Rollo de material continuo',
  [ProductPresentationEnum.PLATE]: 'Plato o placa individual',
};
