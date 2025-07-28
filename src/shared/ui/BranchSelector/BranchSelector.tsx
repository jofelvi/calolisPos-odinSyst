'use client';

import { useState } from 'react';
import {
  Check,
  ChevronDown,
  Plus,
  Building2,
  MapPin,
  Users,
} from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import { Card } from '@/shared/ui/card/card';
import { useBranch } from '@/shared/hooks/useBranch';
import { Branch } from '@/modelTypes/branch';

interface BranchSelectorProps {
  className?: string;
  showCreateButton?: boolean;
  onCreateBranch?: () => void;
}

export default function BranchSelector({
  className = '',
  showCreateButton = false,
  onCreateBranch,
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    currentBranch,
    availableBranches,
    isLoading,
    switchBranch,
    hasMultipleBranches,
  } = useBranch();

  if (!hasMultipleBranches() && !showCreateButton) {
    return null;
  }

  const handleBranchSwitch = async (branch: Branch) => {
    try {
      await switchBranch(branch.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching branch:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Current Branch Display */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-3 h-auto bg-white/5 hover:bg-white/10 border border-white/10"
        disabled={isLoading}
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate">
              {currentBranch?.name || 'Seleccionar Sucursal'}
            </div>
            <div className="text-xs text-gray-300 truncate flex items-center gap-1">
              {currentBranch ? (
                <>
                  <MapPin className="w-3 h-3" />
                  {currentBranch.city}, {currentBranch.country}
                </>
              ) : (
                'No hay sucursal seleccionada'
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-white border border-gray-200 shadow-xl max-h-80 overflow-y-auto">
            <div className="space-y-1">
              {/* Branch List */}
              {availableBranches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSwitch(branch)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {branch.name}
                      </span>
                      {branch.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Por defecto
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {branch.city}, {branch.country}
                    </div>
                    {branch.description && (
                      <div className="text-xs text-gray-400 truncate">
                        {branch.description}
                      </div>
                    )}
                  </div>

                  {currentBranch?.id === branch.id && (
                    <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                  )}
                </button>
              ))}

              {/* Create New Branch */}
              {showCreateButton && onCreateBranch && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  <button
                    onClick={() => {
                      onCreateBranch();
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 text-cyan-600"
                  >
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <div className="font-medium">Crear Nueva Sucursal</div>
                      <div className="text-sm text-gray-500">
                        Agregar una nueva ubicación
                      </div>
                    </div>
                  </button>
                </>
              )}

              {/* Empty State */}
              {availableBranches.length === 0 && (
                <div className="p-6 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay sucursales disponibles
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Necesitas ser agregado a una sucursal para continuar
                  </p>
                  {showCreateButton && onCreateBranch && (
                    <Button
                      onClick={() => {
                        onCreateBranch();
                        setIsOpen(false);
                      }}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Sucursal
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
