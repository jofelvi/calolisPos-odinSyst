'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AttendanceReportDashboard from '@/features/reports/AttendanceReportDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3Icon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  DownloadIcon,
  FileTextIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();

  const reportCards = [
    {
      title: 'Reporte de Asistencias',
      description: 'Análisis detallado de asistencia de empleados',
      icon: <ClockIcon className="h-8 w-8 text-blue-600" />,
      stats: 'Últimos 30 días',
      action: 'Ver Dashboard',
      tabValue: 'attendance',
    },
    {
      title: 'Reporte de Nóminas',
      description: 'Resumen de costos de nómina por período',
      icon: <DollarSignIcon className="h-8 w-8 text-green-600" />,
      stats: 'Mes actual',
      action: 'Ver Nóminas',
      href: '/private/payroll',
    },
    {
      title: 'Reporte de Empleados',
      description: 'Estadísticas generales de recursos humanos',
      icon: <UsersIcon className="h-8 w-8 text-purple-600" />,
      stats: 'Todos los empleados',
      action: 'Ver Empleados',
      href: '/private/employees',
    },
    {
      title: 'Análisis de Productividad',
      description: 'Métricas de rendimiento y eficiencia',
      icon: <TrendingUpIcon className="h-8 w-8 text-orange-600" />,
      stats: 'Próximamente',
      action: 'Proximamente',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6 p-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Centro de Reportes</h1>
          <p className="text-gray-600">Análisis y estadísticas del sistema</p>
        </div>
        <Button className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          Exportar Todo
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Resumen General</TabsTrigger>
          <TabsTrigger value="attendance">Reportes de Asistencia</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3Icon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Reportes Disponibles
                    </p>
                    <p className="text-2xl font-bold text-blue-600">4</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Último Reporte
                    </p>
                    <p className="text-2xl font-bold text-green-600">Hoy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileTextIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Exportaciones
                    </p>
                    <p className="text-2xl font-bold text-purple-600">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUpIcon className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Tendencia
                    </p>
                    <p className="text-2xl font-bold text-orange-600">+15%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportCards.map((report, index) => (
              <Card
                key={index}
                className={`hover:shadow-lg transition-shadow ${report.disabled ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {report.icon}
                      <div>
                        <CardTitle className="text-lg">
                          {report.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Período:</p>
                      <p className="font-medium">{report.stats}</p>
                    </div>
                    {report.tabValue ? (
                      <Button
                        onClick={() => {
                          const _tabsList =
                            document.querySelector('[data-tabs-list]');
                          const tabTrigger = document.querySelector(
                            `[data-tabs-trigger="${report.tabValue}"]`,
                          ) as HTMLElement;
                          if (tabTrigger) {
                            tabTrigger.click();
                          }
                        }}
                        disabled={report.disabled}
                        variant={report.disabled ? 'outline' : 'default'}
                      >
                        {report.action}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => report.href && router.push(report.href)}
                        disabled={report.disabled}
                        variant={report.disabled ? 'outline' : 'default'}
                      >
                        {report.action}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">
                      Reporte de Asistencia Generado
                    </p>
                    <p className="text-sm text-gray-600">
                      Hace 2 horas - Período: Enero 2025
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <DollarSignIcon className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Nómina Procesada</p>
                    <p className="text-sm text-gray-600">
                      Hace 5 horas - 15 empleados
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <FileTextIcon className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-medium">Exportación Completada</p>
                    <p className="text-sm text-gray-600">
                      Ayer - Reporte PDF generado
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <AttendanceReportDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
