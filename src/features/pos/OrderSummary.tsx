'use client';

import { OrderItem } from '@/modelTypes/orderItem';
import { Product } from '@/modelTypes/product';
import { Button } from '@/components/shared/button/Button';
import { Card } from '@/components/shared/card/card';
import { Input } from '@/components/shared/input/input';
import { MessageSquare, Minus, Package, Plus, X, Settings } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

interface OrderSummaryProps {
  items: OrderItem[];
  products: Product[];
  subtotal?: number;
  tax?: number;
  total: number;
  tableId?: string | null;
  onRemoveItemAction: (e: React.MouseEvent, index: number) => void;
  onQuantityChangeAction: (index: number, quantity: number) => void;
  onItemNotesChangeAction: (index: number, notes: string) => void;
}

export default function OrderSummary({
  items,
  products,
  subtotal,
  total,
  tableId,
  onRemoveItemAction,
  onQuantityChangeAction,
  onItemNotesChangeAction,
}: OrderSummaryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const handleQuantityDecrease = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQuantity = items[index].quantity;
    if (currentQuantity > 1) {
      onQuantityChangeAction(index, currentQuantity - 1);
    }
  };

  const handleQuantityIncrease = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQuantity = items[index].quantity;
    onQuantityChangeAction(index, currentQuantity + 1);
  };

  const toggleItemExpansion = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleNotesChange = (index: number, notes: string) => {
    onItemNotesChangeAction(index, notes);
  };

  // Generar número de orden único basado en timestamp - solo una vez
  const orderNumber = useMemo(() => Date.now().toString().slice(-8), []);
  const totalGuests = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-cyan-100/50 flex flex-col">
      {/* Header fijo */}
      <div className="p-6 border-b border-cyan-100">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
            ORDEN
          </h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-800">
              #{orderNumber}
            </div>
            <div className="flex items-center gap-2 text-sm text-cyan-600">
              <span>
                👥 {totalGuests} {totalGuests === 1 ? 'producto' : 'productos'}
              </span>
              {tableId ? (
                <span>🏠 MESA: {tableId.slice(-4)}</span>
              ) : (
                <span>📦 PARA LLEVAR</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos con scroll */}
      <div className="flex-1 overflow-y-auto max-h-[400px] p-6">
        <div className="space-y-3">
          {items.map((item, index) => {
            // Buscar el producto correspondiente para obtener la imagen
            const product = products.find((p) => p.id === item.productId);

            const isExpanded = expandedItems.has(index);

            return (
              <div
                key={`${item.productId}-${index}`}
                className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100"
              >
                {/* Main item row */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-200 to-teal-200 rounded-xl overflow-hidden">
                      {product?.imageUrl ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={product.imageUrl}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-cyan-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-cyan-900">
                          {item.name}
                        </h3>
                        {item.customizations && (
                          <div className="flex items-center gap-1">
                            <Settings className="w-3 h-3 text-amber-600" />
                            <span className="text-xs text-amber-600 font-medium">
                              Personalizado
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-lg font-bold text-cyan-700">
                        ${item.unitPrice.toFixed(2)}
                        {item.customizations &&
                          item.customizations.customizationPrice > 0 && (
                            <span className="text-xs text-amber-600 ml-1">
                              (+$
                              {item.customizations.customizationPrice.toFixed(
                                2,
                              )}
                              )
                            </span>
                          )}
                      </p>

                      {/* Mostrar personalizaciones resumidas */}
                      {item.customizations && !isExpanded && (
                        <div className="text-xs text-gray-600 mt-1">
                          {item.customizations.removedIngredients.length >
                            0 && (
                            <p className="text-red-600">
                              🚫 Sin:{' '}
                              {item.customizations.removedIngredients.length}{' '}
                              ingrediente(s)
                            </p>
                          )}
                          {item.customizations.addedExtras.length > 0 && (
                            <p className="text-amber-600">
                              ⭐ +{item.customizations.addedExtras.length}{' '}
                              extra(s)
                            </p>
                          )}
                        </div>
                      )}

                      {item.notes && !isExpanded && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          📝{' '}
                          {item.notes.length > 30
                            ? `${item.notes.substring(0, 30)}...`
                            : item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quantity controls */}
                    <div className="text-right">
                      <div className="text-xs text-cyan-600 font-medium uppercase">
                        Cantidad
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                          onClick={(e: React.MouseEvent) =>
                            handleQuantityDecrease(e, index)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="font-bold text-lg min-w-[24px] text-center text-cyan-800">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                          onClick={(e: React.MouseEvent) =>
                            handleQuantityIncrease(e, index)
                          }
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Notes button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`w-8 h-8 p-0 transition-colors ${
                        isExpanded
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'text-cyan-600 hover:bg-cyan-100'
                      } ${item.notes ? 'bg-amber-100 text-amber-700' : ''}`}
                      onClick={() => toggleItemExpansion(index)}
                      title="Agregar notas"
                    >
                      <MessageSquare size={16} />
                    </Button>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e: React.MouseEvent) =>
                        onRemoveItemAction(e, index)
                      }
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>

                {/* Expanded details section */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="border-t border-cyan-200 pt-3 space-y-3">
                      {/* Personalizaciones detalladas */}
                      {item.customizations && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-amber-700 flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            Personalizaciones:
                          </h4>

                          {/* Ingredientes removidos */}
                          {item.customizations.removedIngredients.length >
                            0 && (
                            <div className="pl-4">
                              <p className="text-xs font-medium text-red-600 mb-1">
                                🚫 Ingredientes removidos:
                              </p>
                              <ul className="text-xs text-red-600 space-y-0.5">
                                {item.customizations.removedIngredients.map(
                                  (ingredientId, idx) => {
                                    const ingredient = products.find(
                                      (p) => p.id === ingredientId,
                                    );
                                    return (
                                      <li
                                        key={idx}
                                        className="flex items-center gap-1"
                                      >
                                        <span>•</span>{' '}
                                        {ingredient?.name || ingredientId}
                                      </li>
                                    );
                                  },
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Adicionales agregados */}
                          {item.customizations.addedExtras.length > 0 && (
                            <div className="pl-4">
                              <p className="text-xs font-medium text-amber-600 mb-1">
                                ⭐ Adicionales:
                              </p>
                              <ul className="text-xs text-amber-600 space-y-0.5">
                                {item.customizations.addedExtras.map(
                                  (extra, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-center justify-between"
                                    >
                                      <span className="flex items-center gap-1">
                                        <span>•</span> {extra.name} x
                                        {extra.quantity}
                                      </span>
                                      <span>
                                        +$
                                        {(extra.price * extra.quantity).toFixed(
                                          2,
                                        )}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ul>
                              {item.customizations.customizationPrice > 0 && (
                                <div className="border-t border-amber-200 pt-1 mt-2">
                                  <p className="text-xs font-medium text-amber-700 flex justify-between">
                                    <span>Total personalizaciones:</span>
                                    <span>
                                      +$
                                      {item.customizations.customizationPrice.toFixed(
                                        2,
                                      )}
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notas para cocina */}
                      <div>
                        <label className="block text-sm font-medium text-cyan-700 mb-2">
                          Notas para cocina:
                        </label>
                        <Input
                          type="text"
                          placeholder="Ej: Sin cebolla, extra salsa, punto de carne..."
                          value={item.notes || ''}
                          onChange={(e) =>
                            handleNotesChange(index, e.target.value)
                          }
                          className="w-full border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Estas notas aparecerán en la orden para cocina
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-lg"></div>
            </div>
            <p className="text-cyan-600 font-medium">
              No hay productos agregados
            </p>
            <p className="text-sm text-cyan-500 mt-1">
              Selecciona productos para comenzar
            </p>
          </div>
        )}
      </div>

      {/* Footer fijo con totales */}
      <div className="border-t border-cyan-100 p-6 bg-gradient-to-r from-cyan-50 to-teal-50">
        {/* Estadísticas de la orden */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-700">
              {items.length}
            </div>
            <div className="text-xs text-cyan-600 uppercase tracking-wide">
              {items.length === 1 ? 'Producto' : 'Productos'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-700">
              {totalGuests}
            </div>
            <div className="text-xs text-teal-600 uppercase tracking-wide">
              {totalGuests === 1 ? 'Unidad' : 'Unidades'}
            </div>
          </div>
        </div>

        {/* Desglose de personalizaciones */}
        {items.some((item) => item.customizations) && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                Personalizaciones incluidas
              </span>
            </div>
            <div className="text-xs text-amber-600">
              {items.filter((item) => item.customizations).length} producto(s)
              personalizado(s)
            </div>
          </div>
        )}

        {/* Total simplificado */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-cyan-200">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold text-cyan-800">
                TOTAL A PAGAR
              </div>
              <div className="text-xs text-cyan-600">
                Sin cargos adicionales
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-cyan-800">
                ${total.toFixed(2)}
              </div>
              {subtotal !== total && subtotal !== undefined && (
                <div className="text-xs text-gray-500">
                  Subtotal: ${subtotal.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
