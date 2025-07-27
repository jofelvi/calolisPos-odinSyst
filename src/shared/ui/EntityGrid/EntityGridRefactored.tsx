// SOLID: Single Responsibility - Generic entity grid component focused on display
// DRY: Reusable grid component for all entity types
// KISS: Simple, composable grid structure
// Thinking React: Clear component hierarchy with configuration over implementation

import React from 'react';
import { EntityCard } from './EntityCard';
import { EmptyState } from '../EmptyState/EmptyState';

// SOLID: Interface Segregation - Clear, focused interfaces
export interface EntityGridConfig<T> {
  getDetailPath: (id: string) => string;
  imageField?: keyof T;
  nameField: keyof T;
  descriptionField?: keyof T;
  statusField?: keyof T;
  priceField?: keyof T;
  currencyField?: keyof T;
}

export interface EntityGridActions<T> {
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onCustomAction?: (item: T, action: string) => void;
}

export interface EntityGridProps<T extends { id: string }> {
  items: T[];
  config: EntityGridConfig<T>;
  actions?: EntityGridActions<T>;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  gridClassName?: string;
  cardClassName?: string;
}

// SOLID: Single Responsibility - Grid layout component
export function EntityGridRefactored<T extends { id: string }>({
  items,
  config,
  actions,
  loading = false,
  error,
  emptyMessage = 'No hay elementos para mostrar',
  emptyIcon,
  className = '',
  gridClassName = '',
  cardClassName = '',
}: EntityGridProps<T>) {
  // KISS: Early returns for different states
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <GridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <EmptyState
          icon="🚨"
          title="Error al cargar los datos"
          description={error}
          actionLabel={''}
          actionHref={''}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={emptyIcon || '📦'}
          title={emptyMessage || ''}
          description={error || ''}
          actionLabel={''}
          actionHref={''}
        />
      </div>
    );
  }

  // SOLID: Single Responsibility - Grid rendering
  return (
    <div className={className}>
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${gridClassName}`}
      >
        {items.map((item) => (
          <EntityCardWrapper
            key={item.id}
            item={item}
            config={config}
            actions={actions}
            className={cardClassName}
          />
        ))}
      </div>
    </div>
  );
}

// SOLID: Single Responsibility - Card wrapper for navigation and actions
interface EntityCardWrapperProps<T extends { id: string }> {
  item: T;
  config: EntityGridConfig<T>;
  actions?: EntityGridActions<T>;
  className?: string;
}

function EntityCardWrapper<T extends { id: string }>({
  item,
  config,
  actions,
  className,
}: EntityCardWrapperProps<T>) {
  const content = (
    <EntityCard
      item={item}
      config={config}
      actions={actions}
      className={className}
    />
  );

  return content;
}

// KISS: Simple skeleton component for loading state
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-64 bg-gray-200 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

// DRY: Predefined configurations for common entity types
export const entityGridConfigs = {
  products: {
    nameField: 'name' as const,
    descriptionField: 'description' as const,
    imageField: 'image' as const,
    statusField: 'isActive' as const,
    priceField: 'price' as const,
    currencyField: 'currency' as const,
    getDetailPath: (id: string) => `/private/products/${id}/details`,
  },

  customers: {
    nameField: 'name' as const,
    descriptionField: 'email' as const,
    statusField: 'isActive' as const,
    getDetailPath: (id: string) => `/private/customers/${id}`,
  },

  categories: {
    nameField: 'name' as const,
    descriptionField: 'description' as const,
    imageField: 'image' as const,
    statusField: 'isActive' as const,
    getDetailPath: (id: string) => `/private/categories/${id}/details`,
  },

  suppliers: {
    nameField: 'name' as const,
    descriptionField: 'email' as const,
    statusField: 'isActive' as const,
    getDetailPath: (id: string) => `/private/suppliers/${id}`,
  },

  employees: {
    nameField: 'firstName' as const,
    descriptionField: 'email' as const,
    statusField: 'isActive' as const,
    getDetailPath: (id: string) => `/private/employees/${id}`,
  },
};

// SOLID: Open/Closed - Extensible action presets
export const entityGridActions = {
  // Standard CRUD actions
  standard: <T extends { id: string }>(
    onEdit: (item: T) => void,
    onDelete: (item: T) => void,
  ): EntityGridActions<T> => ({
    onEdit,
    onDelete,
  }),

  // View-only actions
  viewOnly: <T extends { id: string }>(
    onView: (item: T) => void,
  ): EntityGridActions<T> => ({
    onView,
  }),

  // Custom actions
  custom: <T extends { id: string }>(
    customActions: EntityGridActions<T>,
  ): EntityGridActions<T> => customActions,
};
