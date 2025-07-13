'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shared/card/card';
import { Badge } from '@/components/shared/badge/badge';
import Loader from '@/components/shared/Loader/Loader';
import {
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/public/login');
    }
  }, [status, router]);

  if (status === 'loading') return <Loader text="Cargando dashboard..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent mb-2">
          ¡Bienvenido, {session?.user?.name}!
        </h1>
        <p className="text-cyan-600/80 text-lg">
          Panel de administración de OdinSystem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-600">
                Ventas Hoy
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">$2,345</div>
            <Badge variant="success" className="mt-2">
              +12.3%
            </Badge>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-600">
                Órdenes
              </CardTitle>
              <ShoppingCart className="h-5 w-5 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">127</div>
            <Badge variant="info" className="mt-2">
              Activas: 8
            </Badge>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-600">
                Clientes
              </CardTitle>
              <Users className="h-5 w-5 text-teal-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">1,847</div>
            <Badge variant="default" className="mt-2">
              +23 nuevos
            </Badge>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-600">
                Productos
              </CardTitle>
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">89</div>
            <Badge variant="warning" className="mt-2">
              5 agotados
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Ventas de la Semana
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
                <p className="text-cyan-600 font-medium">Gráfico de ventas</p>
                <p className="text-cyan-500 text-sm">Próximamente disponible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Nueva orden #1234',
                  time: 'Hace 5 min',
                  type: 'order',
                },
                {
                  action: 'Cliente registrado',
                  time: 'Hace 12 min',
                  type: 'user',
                },
                {
                  action: 'Producto actualizado',
                  time: 'Hace 1 hora',
                  type: 'product',
                },
                {
                  action: 'Pago procesado',
                  time: 'Hace 2 horas',
                  type: 'payment',
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-50/50 to-teal-50/50 border border-cyan-100/50"
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full mt-2 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cyan-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-cyan-600">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-cyan-900 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Nueva Venta',
              icon: ShoppingCart,
              color: 'from-cyan-500 to-teal-500',
            },
            {
              label: 'Agregar Producto',
              icon: Package,
              color: 'from-teal-500 to-cyan-500',
            },
            {
              label: 'Ver Reportes',
              icon: BarChart3,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              label: 'Gestionar Mesas',
              icon: AlertCircle,
              color: 'from-cyan-500 to-blue-500',
            },
          ].map((action, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:scale-105 transition-all duration-300 group"
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium text-cyan-800">
                  {action.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
