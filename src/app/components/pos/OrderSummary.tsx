'use client';

import { OrderItem } from '@/types/orderItem';
import { Product } from '@/types/product';
import { Button } from '@/components/shared/button/Button';
import { Card } from '@/components/shared/card/card';
import { Input } from '@/components/shared/input/input';
import { Minus, Plus, X, Package, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface OrderSummaryProps {
  items: OrderItem[];
  products: Product[];
  subtotal?: number;
  tax?: number;
  total: number;
  tableId?: string | null;
  onRemoveItem: (e: React.MouseEvent, index: number) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onItemNotesChange: (index: number, notes: string) => void;
}

export default function OrderSummary({
  items,
  products,
  subtotal,
  tax,
  total,
  tableId,
  onRemoveItem,
  onQuantityChange,
  onItemNotesChange,
}: OrderSummaryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const handleQuantityDecrease = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQuantity = items[index].quantity;
    if (currentQuantity > 1) {
      onQuantityChange(index, currentQuantity - 1);
    }
  };

  const handleQuantityIncrease = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQuantity = items[index].quantity;
    onQuantityChange(index, currentQuantity + 1);
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
    onItemNotesChange(index, notes);
  };

  // Generar número de orden único basado en timestamp
  const orderNumber = Date.now().toString().slice(-8);
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
            <div className="text-2xl font-bold text-cyan-800">#{orderNumber}</div>
            <div className="flex items-center gap-2 text-sm text-cyan-600">
              <span>👥 {totalGuests} {totalGuests === 1 ? 'producto' : 'productos'}</span>
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
            const product = products.find(p => p.id === item.productId);
            
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
                      <h3 className="font-semibold text-cyan-900">{item.name}</h3>
                      <p className="text-lg font-bold text-cyan-700">
                        ${item.unitPrice.toFixed(2)}
                      </p>
                      {item.notes && !isExpanded && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          📝 {item.notes.length > 30 ? `${item.notes.substring(0, 30)}...` : item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quantity controls */}
                    <div className="text-right">
                      <div className="text-xs text-cyan-600 font-medium uppercase">Cantidad</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
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
                      variant="ghost"
                      size="sm"
                      className={`w-8 h-8 p-0 transition-colors ${
                        isExpanded ? 'bg-cyan-100 text-cyan-700' : 'text-cyan-600 hover:bg-cyan-100'
                      } ${item.notes ? 'bg-amber-100 text-amber-700' : ''}`}
                      onClick={() => toggleItemExpansion(index)}
                      title="Agregar notas"
                    >
                      <MessageSquare size={16} />
                    </Button>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e: React.MouseEvent) => onRemoveItem(e, index)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>

                {/* Expanded notes section */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="border-t border-cyan-200 pt-3">
                      <label className="block text-sm font-medium text-cyan-700 mb-2">
                        Notas para cocina:
                      </label>
                      <Input
                        type="text"
                        placeholder="Ej: Sin cebolla, extra salsa, punto de carne..."
                        value={item.notes || ''}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        className="w-full border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Estas notas aparecerán en la orden para cocina
                      </p>
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
            <p className="text-cyan-600 font-medium">No hay productos agregados</p>
            <p className="text-sm text-cyan-500 mt-1">Selecciona productos para comenzar</p>
          </div>
        )}
      </div>

      {/* Footer fijo con totales */}
      <div className="border-t border-cyan-100 p-6 bg-gradient-to-r from-cyan-50 to-teal-50">
        {subtotal && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-cyan-700">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-cyan-700">
              <span>Cargo por servicio (10%)</span>
              <span>+${(subtotal * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-cyan-700">
              <span>Impuestos (17%)</span>
              <span>+${(subtotal * 0.17).toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between text-2xl font-bold pt-2 border-t border-cyan-200">
          <span className="text-cyan-800">TOTAL</span>
          <span className="text-cyan-800">${total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
