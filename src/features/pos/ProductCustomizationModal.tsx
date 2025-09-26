'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/modelTypes/product';
import { ProductCustomization, AddedExtra } from '@/modelTypes/orderItem';
import { Button } from '@/components/shared/button/Button';
import Modal from '@/shared/ui/modal';
import { Input } from '@/components/shared/input/input';
import {
  Package,
  Plus,
  Minus,
  ChefHat,
  Star,
  X
} from 'lucide-react';
import Image from 'next/image';
import { categoryService, productService } from '@/services/firebase/genericServices';

interface ProductCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (customization: ProductCustomization) => void;
  initialCustomization?: ProductCustomization;
}

export default function ProductCustomizationModal({
  isOpen,
  onClose,
  product,
  onConfirm,
  initialCustomization,
}: ProductCustomizationModalProps) {
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(
    initialCustomization?.removedIngredients || []
  );
  const [addedExtras, setAddedExtras] = useState<AddedExtra[]>(
    initialCustomization?.addedExtras || []
  );
  const [additionalProducts, setAdditionalProducts] = useState<Product[]>([]);
  const [ingredientProducts, setIngredientProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos adicionales y información de ingredientes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar categoría "Adicionales"
        const categories = await categoryService.getAll();
        const additionalCategory = categories.find(cat =>
          cat.name.toLowerCase().includes('adicional') ||
          cat.name.toLowerCase().includes('extra')
        );

        if (additionalCategory) {
          const allProducts = await productService.getAll();
          const extras = allProducts.filter(p =>
            p.categoryId === additionalCategory.id && p.isForSale
          );
          setAdditionalProducts(extras);
        }

        // Cargar información de los productos que son ingredientes
        if (product.ingredients && product.ingredients.length > 0) {
          const allProducts = await productService.getAll();
          const ingredients = product.ingredients
            .map(ing => allProducts.find(p => p.id === ing.productId))
            .filter(Boolean) as Product[];
          setIngredientProducts(ingredients);
        }
      } catch (error) {
        console.error('Error loading customization data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      void loadData();
    }
  }, [isOpen, product]);

  const handleIngredientToggle = (ingredientId: string) => {
    setRemovedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const handleExtraQuantityChange = (extraProduct: Product, change: number) => {
    setAddedExtras(prev => {
      const existing = prev.find(e => e.productId === extraProduct.id);

      if (!existing && change > 0) {
        return [...prev, {
          productId: extraProduct.id,
          name: extraProduct.name,
          price: extraProduct.price,
          quantity: 1
        }];
      }

      if (existing) {
        const newQuantity = existing.quantity + change;
        if (newQuantity <= 0) {
          return prev.filter(e => e.productId !== extraProduct.id);
        }

        return prev.map(e =>
          e.productId === extraProduct.id
            ? { ...e, quantity: newQuantity }
            : e
        );
      }

      return prev;
    });
  };

  const getExtraQuantity = (productId: string): number => {
    return addedExtras.find(e => e.productId === productId)?.quantity || 0;
  };

  const calculateCustomizationPrice = (): number => {
    return addedExtras.reduce((total, extra) =>
      total + (extra.price * extra.quantity), 0
    );
  };

  const handleConfirm = () => {
    const customization: ProductCustomization = {
      removedIngredients,
      addedExtras,
      customizationPrice: calculateCustomizationPrice()
    };

    onConfirm(customization);
    onClose();
  };

  const handleReset = () => {
    setRemovedIngredients([]);
    setAddedExtras([]);
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando opciones de personalización...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-cyan-500" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Personalizar {product.name}
              </h2>
              <p className="text-gray-600">
                Precio base: <span className="font-semibold">${product.price.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingredientes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="w-5 h-5 text-cyan-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Ingredientes
              </h3>
            </div>

            {ingredientProducts.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {ingredientProducts.map((ingredient) => {
                  const isRemoved = removedIngredients.includes(ingredient.id);
                  const ingredientInfo = product.ingredients?.find(
                    ing => ing.productId === ingredient.id
                  );

                  return (
                    <div
                      key={ingredient.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isRemoved
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                          {ingredient.imageUrl ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={ingredient.imageUrl}
                                alt={ingredient.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${
                            isRemoved ? 'text-red-700 line-through' : 'text-gray-900'
                          }`}>
                            {ingredient.name}
                          </p>
                          {ingredientInfo && (
                            <p className="text-xs text-gray-500">
                              {ingredientInfo.quantity} {ingredientInfo.unit}
                            </p>
                          )}
                        </div>
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isRemoved}
                          onChange={() => handleIngredientToggle(ingredient.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isRemoved
                            ? 'bg-red-500 border-red-500'
                            : 'border-gray-300 hover:border-red-400'
                        }`}>
                          {isRemoved && <X className="w-3 h-3 text-white" />}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  Este producto no tiene ingredientes configurados
                </p>
              </div>
            )}
          </div>

          {/* Adicionales */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Adicionales
              </h3>
            </div>

            {additionalProducts.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {additionalProducts.map((extra) => {
                  const quantity = getExtraQuantity(extra.id);

                  return (
                    <div
                      key={extra.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg overflow-hidden">
                          {extra.imageUrl ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={extra.imageUrl}
                                alt={extra.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Star className="w-4 h-4 text-amber-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{extra.name}</p>
                          <p className="text-sm text-amber-600 font-semibold">
                            +${extra.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handleExtraQuantityChange(extra, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>

                        <span className="w-8 text-center font-semibold text-gray-900">
                          {quantity}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handleExtraQuantityChange(extra, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No hay adicionales disponibles
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de precio */}
        <div className="mt-6 p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg border border-cyan-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Precio base:</span>
            <span className="font-semibold">${product.price.toFixed(2)}</span>
          </div>

          {addedExtras.length > 0 && (
            <div className="space-y-1 mb-2">
              {addedExtras.map((extra, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {extra.name} x{extra.quantity}
                  </span>
                  <span className="text-amber-600">
                    +${(extra.price * extra.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-cyan-200 pt-2 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-cyan-700">
              ${(product.price + calculateCustomizationPrice()).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Resetear
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
          >
            Confirmar Personalización
          </Button>
        </div>
      </div>
    </Modal>
  );
}