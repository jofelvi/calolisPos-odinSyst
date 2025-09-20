// SOLID: Single Responsibility - Individual entity card component
// KISS: Simple card display with clear interface
// DRY: Reusable card component for all entity types

import React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card/card';
import { Badge } from '@/shared/ui/badge/badge';
import { Button } from '@/shared/ui/button/Button';
import { Edit, Eye, Package, Trash2 } from 'lucide-react';
import { EntityGridActions, EntityGridConfig } from './EntityGridRefactored';
import { formatCurrency } from '@/shared/utils/currencyHelpers';

interface EntityCardProps<T extends { id: string }> {
  item: T;
  config: EntityGridConfig<T>;
  actions?: EntityGridActions<T>;
  className?: string;
}

// SOLID: Single Responsibility - Entity card display
export function EntityCard<T extends { id: string }>({
  item,
  config,
  actions,
  className = '',
}: EntityCardProps<T>) {
  // DRY: Extract field values using config
  const name = String(item[config.nameField] || 'Sin nombre');
  const description = config.descriptionField
    ? String(item[config.descriptionField] || '')
    : '';
  const imageUrl = config.imageField
    ? String(item[config.imageField] || '')
    : '';
  const status = config.statusField ? item[config.statusField] : null;
  const price = config.priceField ? Number(item[config.priceField] || 0) : null;
  const currency = config.currencyField
    ? String(item[config.currencyField] || 'USD')
    : 'USD';

  // SOLID: Single Responsibility - Action handlers
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    actions?.onEdit?.(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    actions?.onDelete?.(item);
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    actions?.onView?.(item);
  };

  return (
    <Card
      className={`h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm ${className}`}
    >
      {/* Image Section */}
      {imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      )}

      {/* Content Section */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium truncate flex-1">
            {name}
          </CardTitle>

          {/* Actions Menu */}
          {actions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {actions.onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleView}
                  className="w-6 h-6 p-0"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              )}

              {actions.onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="w-6 h-6 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}

              {actions.onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="w-6 h-6 p-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {description}
          </p>
        )}

        {/* Price */}
        {price !== null && (
          <div className="text-sm font-semibold text-blue-600 mb-2">
            {formatCurrency(price, { currency })}
          </div>
        )}

        {/* Status Badge */}
        {status !== null && (
          <div className="flex justify-end">
            <StatusBadge status={status} />
          </div>
        )}

        {/* Fallback icon when no image */}
        {!imageUrl && (
          <div className="flex justify-center py-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// SOLID: Single Responsibility - Status badge component
interface StatusBadgeProps {
  status: unknown;
}

function StatusBadge({ status }: StatusBadgeProps) {
  // KISS: Simple status mapping
  const getStatusDisplay = (status: unknown) => {
    if (typeof status === 'boolean') {
      return {
        label: status ? 'Activo' : 'Inactivo',
        variant: status ? 'success' : 'secondary',
      };
    }

    if (typeof status === 'string') {
      const statusMap: Record<string, { label: string; variant: string }> = {
        active: { label: 'Activo', variant: 'success' },
        inactive: { label: 'Inactivo', variant: 'secondary' },
        pending: { label: 'Pendiente', variant: 'warning' },
        completed: { label: 'Completado', variant: 'success' },
        cancelled: { label: 'Cancelado', variant: 'destructive' },
      };

      return (
        statusMap[status.toLowerCase()] || {
          label: String(status),
          variant: 'secondary',
        }
      );
    }

    return { label: 'N/A', variant: 'secondary' };
  };

  const { label, variant } = getStatusDisplay(status);

  return (
    <Badge
      variant={variant as 'default' | 'secondary' | 'destructive' | 'outline'}
      className="text-xs"
    >
      {label}
    </Badge>
  );
}
