'use client';

import { OrderItem } from '@/types/orderItem';
import { Button } from '@/components/shared/button/Button';
import { Card } from '@/components/shared/card/card';
import { Minus, Plus, X } from 'lucide-react';

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  onRemoveItem: (e: React.MouseEvent, index: number) => void;
  onQuantityChange: (index: number, quantity: number) => void;
}

export default function OrderSummary({
  items,
  total,
  onRemoveItem,
  onQuantityChange,
}: OrderSummaryProps) {
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

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">ORDER #</h2>
        <div className="text-right">
          <div className="text-2xl font-bold">12564878</div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              👥 GUESTS: {items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            <span>🏠 TABLE: 1</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item, index) => (
          <div
            key={`${item.productId}-${index}`}
            className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                {/* Placeholder para imagen del producto */}
                <div className="w-8 h-8 bg-orange-400 rounded"></div>
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-lg font-semibold text-gray-900">
                  ${item.unitPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">QUANTITY</div>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={(e: React.MouseEvent) =>
                      handleQuantityDecrease(e, index)
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="font-semibold text-lg min-w-[24px] text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={(e: React.MouseEvent) =>
                      handleQuantityIncrease(e, index)
                    }
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

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
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay productos agregados</p>
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        {/*                <div className="flex justify-between text-gray-600">
                    <span>SUBTOTAL</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>SERVICE CHARGE 10%</span>
                    <span>+${(subtotal * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Impuestos 17%</span>
                    <span>+${(subtotal * tax).toFixed(2)}</span>
                </div>*/}
        <div className="flex justify-between text-xl font-bold pt-2">
          <span>TOTAL</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
