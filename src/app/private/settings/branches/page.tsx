'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Edit,
  Eye,
  MapPin,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import {
  BackButton,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
} from '@/shared';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';
import { useBranch } from '@/shared/hooks/useBranch';
import { useToast } from '@/shared/hooks/useToast';

export default function BranchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { availableBranches, currentBranch, isLoading } = useBranch();
  const toast = useToast();

  const filteredBranches = availableBranches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.country.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar la sucursal "${branchName}"? Esta acción no se puede deshacer.`,
    );

    if (confirmed) {
      try {
        // TODO: Implement delete branch functionality
        toast.info({
          title: 'Funcionalidad pendiente',
          description:
            'La eliminación de sucursales estará disponible próximamente',
        });
      } catch {
        toast.error({
          title: 'Error',
          description: 'No se pudo eliminar la sucursal',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton href={PRIVATE_ROUTES.SETTINGS} />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Gestión de Sucursales
              </h1>
              <p className="text-gray-600 text-lg">
                Administra todas las ubicaciones de tu negocio
              </p>
            </div>
          </div>

          <Link href={PRIVATE_ROUTES.SETTINGS_BRANCHES_NEW}>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Sucursal
            </Button>
          </Link>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar sucursales por nombre, ciudad o país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <Card className="border-0 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm">Total Sucursales</p>
                  <p className="text-2xl font-bold">
                    {availableBranches.length}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-cyan-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Sucursal Activa</p>
                  <p className="text-lg font-semibold truncate">
                    {currentBranch?.name || 'Ninguna'}
                  </p>
                </div>
                <Settings className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Branches Grid */}
        {filteredBranches.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-16 h-16 text-gray-300" />}
            title="No hay sucursales"
            description={
              searchTerm
                ? `No se encontraron sucursales que coincidan con "${searchTerm}"`
                : 'Aún no has creado ninguna sucursal. Crea tu primera sucursal para comenzar.'
            }
            actionLabel="Crear Primera Sucursal"
            actionHref={PRIVATE_ROUTES.SETTINGS_BRANCHES_NEW}
            actionIcon={<Plus className="w-4 h-4" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch) => (
              <Card
                key={branch.id}
                className={`border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200 ${
                  currentBranch?.id === branch.id ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center text-white">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {branch.name}
                          {currentBranch?.id === branch.id && (
                            <Badge variant="default" className="text-xs">
                              Activa
                            </Badge>
                          )}
                          {branch.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Por defecto
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {branch.city}, {branch.country}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {branch.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {branch.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Dirección:</span>
                      <span className="text-gray-900 truncate ml-2">
                        {branch.location?.address || 'No especificada'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Teléfono:</span>
                      <span className="text-gray-900">
                        {branch.phone || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        toast.info({
                          title: 'Funcionalidad pendiente',
                          description:
                            'La vista de detalles estará disponible próximamente',
                        });
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Link
                      href={PRIVATE_ROUTES.SETTINGS_BRANCHES_EDIT(branch.id)}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBranch(branch.id, branch.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
