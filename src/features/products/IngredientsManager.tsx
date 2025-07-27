import { ProductFormData } from '@/features/types/schemaYup/productSchema';
import {
  Control,
  FieldErrors,
  useFieldArray,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { Ingredient, Product } from '@/modelTypes/product';
import { Input } from '@/components/shared/input/input';
import SelectCustom from '@/components/shared/selectCustom/SelectCustom';
import { arrayToSelectOptions } from '@/shared/utils/enumToSelectOptions';
import { Button } from '@/components/shared/button/Button';
import {
  AlertCircle,
  Check,
  Info,
  Package,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  areUnitsCompatible,
  calculateIngredientCost,
} from '@/shared/utils/unitConversions';
import { ProductPresentationEnum, ProductTypeEnum } from '@/shared';

export interface IngredientsManagerProps {
  control: Control<ProductFormData>;
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  products: Product[];
  isNew?: boolean; // Agregar esta prop
}

const presentationLabels: Record<ProductPresentationEnum, string> = {
  [ProductPresentationEnum.UNIT]: 'Unidad',
  [ProductPresentationEnum.BOX]: 'Caja',
  [ProductPresentationEnum.PACK]: 'Paquete',
  [ProductPresentationEnum.BAG]: 'Bolsa',
  [ProductPresentationEnum.BOTTLE]: 'Botella',
  [ProductPresentationEnum.CAN]: 'Lata',
  [ProductPresentationEnum.CONTAINER]: 'Envase',
  [ProductPresentationEnum.JAR]: 'Frasco',
  [ProductPresentationEnum.DOZEN]: 'Docena',
  [ProductPresentationEnum.HALF_DOZEN]: 'Media Docena',
  [ProductPresentationEnum.KILOGRAM]: 'Kilogramo',
  [ProductPresentationEnum.GRAM]: 'Gramo',
  [ProductPresentationEnum.LITER]: 'Litro',
  [ProductPresentationEnum.MILLILITER]: 'Mililitro',
  [ProductPresentationEnum.GALLON]: 'Galón',
  [ProductPresentationEnum.BULK]: 'Bulto',
  [ProductPresentationEnum.ROLL]: 'Rollo',
  [ProductPresentationEnum.PLATE]: 'Plato',
};

export default function IngredientsManager({
  control,
  register,
  errors,
  watch,
  setValue,
  products,
  isNew = false, // Agregar esta prop
}: IngredientsManagerProps) {
  const productType = watch('type');
  const ingredients = watch('ingredients');
  const [savedIngredients, setSavedIngredients] = useState<Set<number>>(
    new Set(),
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const baseProducts = useMemo(
    () => products.filter((p) => p.type === ProductTypeEnum.BASE),
    [products],
  );

  // Inicializar ingredientes guardados cuando se carga data existente
  useEffect(() => {
    if (
      !isNew &&
      ingredients &&
      ingredients.length > 0 &&
      savedIngredients.size === 0
    ) {
      // Si no es nuevo (editando) y aún no se han inicializado los ingredientes guardados
      // marcar todos los ingredientes existentes como guardados
      const allIndices = new Set(
        Array.from({ length: ingredients.length }, (_, i) => i),
      );
      setSavedIngredients(allIndices);
    }
  }, [isNew, ingredients?.length, savedIngredients.size]); // Dependencias ajustadas

  const addIngredient = () => {
    append({
      productId: '',
      quantity: 1,
      unit: ProductPresentationEnum.UNIT,
      wastePercentage: 10,
    });
    // No agregamos el nuevo ingrediente como guardado automáticamente
  };

  // Calcular costo de un ingrediente individual
  const getIngredientCost = (ingredient: Ingredient) => {
    const product = baseProducts.find(
      (p: Product) => p.id === ingredient.productId,
    );

    if (!product || product.cost === undefined || !ingredient.quantity)
      return 0;

    try {
      return calculateIngredientCost(
        ingredient.quantity,
        ingredient.unit as ProductPresentationEnum,
        product.price,
        product.presentation as ProductPresentationEnum,
        product.presentationQuantity || 1,
        ingredient.wastePercentage || 0,
      );
    } catch {
      // Error calculating ingredient cost, returning 0 as fallback
      return 0;
    }
  };

  // Calcular costo total de todos los ingredientes guardados
  const calculateTotalCost = useMemo(() => {
    if (!ingredients || ingredients.length === 0) return 0;

    return ingredients.reduce((total, ingredient, index) => {
      // Solo incluir ingredientes que han sido guardados
      if (savedIngredients.has(index)) {
        return total + getIngredientCost(ingredient);
      }
      return total;
    }, 0);
  }, [ingredients, baseProducts, savedIngredients]);

  // Actualizar el costo total del producto cuando cambien los ingredientes
  useEffect(() => {
    if (productType === ProductTypeEnum.MIXED) {
      setValue('cost', calculateTotalCost);
    }
  }, [calculateTotalCost, productType, setValue]);

  // Función para guardar un ingrediente
  const handleSaveIngredient = (index: number) => {
    if (!ingredients) return;
    const ingredient = ingredients[index];

    // Validar que el ingrediente esté completo
    if (!ingredient.productId || !ingredient.quantity || !ingredient.unit) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Verificar compatibilidad de unidades
    const selectedProduct = baseProducts.find(
      (p) => p.id === ingredient.productId,
    );
    if (selectedProduct) {
      const isCompatible = areUnitsCompatible(
        ingredient.unit as ProductPresentationEnum,
        selectedProduct.presentation as ProductPresentationEnum,
      );

      if (!isCompatible) {
        alert('Las unidades seleccionadas no son compatibles');
        return;
      }
    }

    setSavedIngredients((prev) => new Set([...prev, index]));
  };

  // Función mejorada para remover ingrediente
  const handleRemoveIngredient = (index: number) => {
    remove(index);
    // Actualizar el set de ingredientes guardados
    setSavedIngredients((prev) => {
      const newSet = new Set<number>();
      prev.forEach((savedIndex) => {
        if (savedIndex < index) {
          newSet.add(savedIndex);
        } else if (savedIndex > index) {
          newSet.add(savedIndex - 1);
        }
        // No agregamos el índice que se está eliminando
      });
      return newSet;
    });
  };

  // Verificar si un ingrediente puede ser guardado
  const canSaveIngredient = (
    ingredient: Ingredient,
    selectedProduct: Product | undefined,
    index: number,
  ) => {
    // Si el ingrediente ya está guardado, no mostrar el botón de guardar
    if (savedIngredients.has(index)) {
      return false;
    }

    // Para ingredientes nuevos, siempre habilitar el botón
    // La validación se hará en handleSaveIngredient
    return true;
  };

  if (productType !== ProductTypeEnum.MIXED) {
    return null;
  }

  return (
    <div className="md:col-span-2">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border-b border-cyan-100 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-cyan-100 rounded-lg">
                <Package className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ingredientes
                </h3>
                <p className="text-sm text-gray-600">
                  Configura los ingredientes para tu producto mixto
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm bg-white px-3 py-1.5 rounded-md border border-gray-200">
                <span className="text-gray-600">Guardados: </span>
                <span className="font-semibold text-cyan-600">
                  {savedIngredients.size}/{fields.length}
                </span>
              </div>

              <div className="text-sm bg-white px-3 py-1.5 rounded-md border border-gray-200">
                <span className="text-gray-600">Costo: </span>
                <span className="font-semibold text-green-600">
                  ${calculateTotalCost.toFixed(2)}
                </span>
              </div>

              <Button
                type="button"
                onClick={addIngredient}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Agregar Ingrediente
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {fields.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No hay ingredientes
              </h4>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Los productos mixtos necesitan al menos un ingrediente para ser
                creados
              </p>
              <Button
                type="button"
                onClick={addIngredient}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Agregar primer ingrediente
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {fields.map((field, index) => {
                const ingredient = watch(`ingredients.${index}`);
                const selectedProduct = baseProducts.find(
                  (p) => p.id === ingredient?.productId,
                );
                const ingredientCost = getIngredientCost(ingredient || {});
                const isCompatible =
                  selectedProduct &&
                  ingredient?.unit &&
                  areUnitsCompatible(
                    ingredient.unit as ProductPresentationEnum,
                    selectedProduct.presentation as ProductPresentationEnum,
                  );

                return (
                  <div
                    key={field.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-start">
                      {/* Producto Base */}
                      <div className="md:col-span-2">
                        <SelectCustom
                          id={`ingredients.${index}.productId`}
                          name={`ingredients.${index}.productId`}
                          label="Producto Base *"
                          options={arrayToSelectOptions(
                            baseProducts,
                            'id',
                            'name',
                          )}
                          error={
                            errors.ingredients?.[index]?.productId?.message
                          }
                          placeholder="Seleccionar producto..."
                          register={register}
                        />
                        {selectedProduct && (
                          <div className="text-xs text-gray-500 mt-1 grid grid-cols-2 gap-1">
                            <div>
                              <span className="font-medium">Presentación:</span>{' '}
                              {
                                presentationLabels[
                                  selectedProduct.presentation as ProductPresentationEnum
                                ]
                              }
                            </div>
                            <div>
                              <span className="font-medium">Costo:</span> $
                              {selectedProduct.price?.toFixed(2) || '0.0000'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cantidad */}
                      <div>
                        <Input
                          type="number"
                          step="0.001"
                          min={0.001}
                          label="Cantidad *"
                          {...register(`ingredients.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          error={errors.ingredients?.[index]?.quantity?.message}
                        />
                      </div>

                      {/* Unidad */}
                      <div>
                        <SelectCustom
                          id={`ingredients.${index}.unit`}
                          name={`ingredients.${index}.unit`}
                          label="Unidad *"
                          options={Object.values(ProductPresentationEnum).map(
                            (value) => ({
                              value,
                              label: presentationLabels[value],
                            }),
                          )}
                          error={errors.ingredients?.[index]?.unit?.message}
                          register={register}
                        />
                        {selectedProduct &&
                          ingredient?.unit &&
                          !isCompatible && (
                            <div className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Unidad incompatible
                            </div>
                          )}
                      </div>

                      {/* Grupo Costo y Acciones */}
                      <div className="flex flex-col gap-3">
                        {/* Merma */}
                        <div>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            label="Merma (%)"
                            defaultValue={10}
                            {...register(
                              `ingredients.${index}.wastePercentage`,
                              {
                                valueAsNumber: true,
                              },
                            )}
                            error={
                              errors.ingredients?.[index]?.wastePercentage
                                ?.message
                            }
                          />
                        </div>

                        {/* Costo */}
                        <div className="text-sm bg-white px-3 py-1.5 rounded border border-gray-200">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Costo:</span>
                            <span
                              className={`font-semibold ${
                                savedIngredients.has(index)
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              ${ingredientCost.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-2">
                          {savedIngredients.has(index) ? (
                            <div className="flex items-center justify-center bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded text-xs font-medium flex-1">
                              <Check className="w-4 h-4 mr-1" />
                              Guardado
                            </div>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleSaveIngredient(index)}
                              disabled={
                                !canSaveIngredient(
                                  ingredient,
                                  selectedProduct,
                                  index,
                                )
                              }
                              className="flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border border-green-200 hover:border-green-300 px-3 py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Guardar
                            </Button>
                          )}

                          <Button
                            type="button"
                            onClick={() => handleRemoveIngredient(index)}
                            className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded text-xs font-medium transition-all flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-start">
                      <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-500">
                        {savedIngredients.has(index) ? (
                          <>
                            Costo calculado incluyendo{' '}
                            {ingredient?.wastePercentage || 10}% de merma
                            {selectedProduct && ingredient?.unit && (
                              <>
                                {' '}
                                y conversión de{' '}
                                {
                                  presentationLabels[
                                    ingredient.unit as ProductPresentationEnum
                                  ]
                                }{' '}
                                a{' '}
                                {
                                  presentationLabels[
                                    selectedProduct.presentation as ProductPresentationEnum
                                  ]
                                }
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            Completa todos los campos y guarda para incluir este
                            ingrediente en el costo total
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
