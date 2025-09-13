'use client';

import Link from 'next/link';
import {
  Building2,
  Settings,
  CreditCard,
  MapPin,
  Users,
  Shield,
  Bell,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';

const settingsCategories = [
  {
    title: 'General',
    description: 'Configuración básica del sistema',
    icon: <Settings className="w-6 h-6" />,
    href: PRIVATE_ROUTES.SETTINGS_GENERAL,
    items: ['Moneda', 'Idioma', 'Zona horaria', 'Formato de fecha'],
  },
  {
    title: 'Sucursales',
    description: 'Gestión de ubicaciones y configuraciones por sucursal',
    icon: <Building2 className="w-6 h-6" />,
    href: PRIVATE_ROUTES.SETTINGS_BRANCHES,
    items: [
      'Lista de sucursales',
      'Configurar ubicaciones',
      'Ajustes por sucursal',
    ],
  },
  {
    title: 'Impuestos y Tarifas',
    description: 'Configuración de IVA, propinas y otros cargos',
    icon: <CreditCard className="w-6 h-6" />,
    href: '/private/settings/taxes',
    items: ['IVA', 'Propinas', 'Recargos', 'Descuentos'],
  },
  {
    title: 'Localización',
    description: 'Configuración de país, región y direcciones',
    icon: <MapPin className="w-6 h-6" />,
    href: '/private/settings/location',
    items: ['País', 'Región', 'Direcciones', 'Google Maps'],
  },
  {
    title: 'Usuarios y Roles',
    description: 'Gestión de permisos y accesos',
    icon: <Users className="w-6 h-6" />,
    href: '/private/settings/users',
    items: ['Roles', 'Permisos', 'Accesos por sucursal'],
  },
  {
    title: 'Seguridad',
    description: 'Configuración de seguridad y autenticación',
    icon: <Shield className="w-6 h-6" />,
    href: '/private/settings/security',
    items: ['Autenticación', 'Sesiones', 'Backup', 'Logs'],
  },
  {
    title: 'Notificaciones',
    description: 'Configuración de alertas y notificaciones',
    icon: <Bell className="w-6 h-6" />,
    href: '/private/settings/notifications',
    items: ['Email', 'SMS', 'Push', 'Alertas del sistema'],
  },
  {
    title: 'Reportes',
    description: 'Configuración de reportes y exportaciones',
    icon: <FileText className="w-6 h-6" />,
    href: '/private/settings/reports',
    items: ['Plantillas', 'Programación', 'Formatos', 'Distribución'],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Configuración del Sistema
          </h1>
          <p className="text-gray-600 text-lg">
            Gestiona todas las configuraciones de tu sistema POS
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {settingsCategories.map((category) => (
            <Card
              key={category.title}
              className="hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center text-white">
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {category.title}
                    </CardTitle>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {category.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  {category.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-500"
                    >
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                      {item}
                    </div>
                  ))}
                </div>

                <Link href={category.href}>
                  <Button
                    variant="outline"
                    className="w-full justify-center hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50"
                  >
                    Configurar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Building2 className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-lg">Nueva Sucursal</h3>
                    <p className="text-green-100">
                      Agregar una nueva ubicación
                    </p>
                  </div>
                </div>
                <Link
                  href={PRIVATE_ROUTES.SETTINGS_BRANCHES_NEW}
                  className="block mt-4"
                >
                  <Button
                    variant="ghost"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Crear Sucursal
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Settings className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-lg">
                      Configuración Rápida
                    </h3>
                    <p className="text-blue-100">Configurar lo básico</p>
                  </div>
                </div>
                <Link
                  href={PRIVATE_ROUTES.SETTINGS_GENERAL}
                  className="block mt-4"
                >
                  <Button
                    variant="ghost"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Configurar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-lg">Exportar Config</h3>
                    <p className="text-purple-100">Backup de configuración</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 mt-4"
                >
                  Exportar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
