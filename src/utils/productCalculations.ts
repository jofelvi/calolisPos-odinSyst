// utils/productCalculations.ts
import { Ingredient, Product } from '@/types/product';

export const calculateMixedProductCost = (
  ingredients: Ingredient[],
  baseProducts: Product[],
): number => {
  let totalCost = 0;

  ingredients.forEach((ingredient) => {
    const baseProduct = baseProducts.find((p) => p.id === ingredient.productId);

    if (!baseProduct || !baseProduct.cost || !baseProduct.presentationQuantity)
      return 0;

    // Convertir a unidades compatibles
    const convertedQuantity = convertUnits(
      ingredient.quantity,
      ingredient.unit,
      baseProduct.presentation!,
    );

    // Calcular cantidad con merma
    const quantityWithWaste =
      convertedQuantity * (1 + ingredient.wastePercentage / 100);

    // Calcular costo proporcional
    const unitCost = baseProduct.cost / baseProduct.presentationQuantity!;
    const ingredientCost = quantityWithWaste * unitCost;

    totalCost += ingredientCost;
  });

  return parseFloat(totalCost.toFixed(2));
};

// utils/unitConversions.ts
const UNIT_CONVERSIONS: Record<string, number> = {
  'kg-g': 1000,
  'g-kg': 0.001,
  'l-ml': 1000,
  'ml-l': 0.001,
  // Añadir más conversiones según necesidad
};

export const convertUnits = (
  quantity: number,
  fromUnit: string,
  toUnit: string,
): number => {
  if (fromUnit === toUnit) return quantity;

  const conversionKey = `${fromUnit.toLowerCase()}-${toUnit.toLowerCase()}`;
  const factor = UNIT_CONVERSIONS[conversionKey];

  return factor ? quantity * factor : quantity;
};
