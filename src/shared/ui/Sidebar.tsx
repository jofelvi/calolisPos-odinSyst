'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/shared/utils/utils';
import { useSidebarStore } from '@/shared/store/useSidebarStore';
import { BranchSelector } from '@/shared/ui/BranchSelector';
import Image from 'next/image';
import logo from '../../../public/odinsys.webp';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  FiBarChart,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiFolder,
  FiGrid,
  FiLayout,
  FiLogIn,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiShoppingCart,
  FiTruck,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { PRIVATE_ROUTES } from '@/shared/constantsRoutes/routes';

const menuItems = [
  {
    label: 'Panel',
    path: PRIVATE_ROUTES.DASHBOARD,
    icon: <FiLayout size={20} />,
  },
  {
    label: 'Categorías',
    path: PRIVATE_ROUTES.CATEGORIES,
    icon: <FiFolder size={20} />,
  },
  {
    label: 'Productos',
    path: PRIVATE_ROUTES.PRODUCTS,
    icon: <FiPackage size={20} />,
  },
  {
    label: 'Ventas',
    path: PRIVATE_ROUTES.ORDERS,
    icon: <FiShoppingCart size={20} />,
  },
  {
    label: 'Facturas',
    path: PRIVATE_ROUTES.INVOICES,
    icon: <FiFileText size={20} />,
  },
  {
    label: 'Proveedores',
    path: PRIVATE_ROUTES.SUPPLIERS,
    icon: <FiTruck size={20} />,
  },
  { label: 'Mesas', path: PRIVATE_ROUTES.TABLES, icon: <FiGrid size={20} /> },
  {
    label: 'Órdenes de Compra',
    path: PRIVATE_ROUTES.PURCHASE_ORDERS,
    icon: <FiClipboard size={20} />,
  },
  {
    label: 'Clientes',
    path: PRIVATE_ROUTES.CUSTOMERS,
    icon: <FiUsers size={20} />,
  },
  {
    label: 'Empleados',
    path: PRIVATE_ROUTES.EMPLOYEES,
    icon: <FiUserCheck size={20} />,
  },
  {
    label: 'Nóminas',
    path: PRIVATE_ROUTES.PAYROLL,
    icon: <FiCalendar size={20} />,
  },
  {
    label: 'Reportes',
    path: PRIVATE_ROUTES.REPORTS,
    icon: <FiBarChart size={20} />,
  },
  {
    label: 'Cuentas por Cobrar',
    path: PRIVATE_ROUTES.ACCOUNTS_RECEIVABLE,
    icon: <FiDollarSign size={20} />,
  },
  {
    label: 'Punto de Venta',
    path: PRIVATE_ROUTES.POS,
    icon: <FiCreditCard size={20} />,
  },
  {
    label: 'Configuración',
    path: PRIVATE_ROUTES.SETTINGS,
    icon: <FiSettings size={20} />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebarStore();

  // Close mobile sidebar when clicking outside or changing route
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileOpen]);

  useEffect(() => {
    if (isMobileOpen) {
      setMobileOpen(false);
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 backdrop-blur-xl transition-all duration-300 flex flex-col shadow-2xl h-screen',
          // Desktop behavior
          'hidden md:flex md:relative',
          isCollapsed ? 'md:w-20' : 'md:w-72',
          // Mobile behavior
          'fixed top-0 left-0 z-50',
          isMobileOpen ? 'flex w-72' : 'hidden md:flex',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center p-6 border-b border-slate-700/50',
            isCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/25">
                <Image
                  src={logo}
                  alt="Logo"
                  width={24}
                  height={24}
                  className="min-w-[24px]"
                />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl blur opacity-30"></div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  OdinSys
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Admin Panel
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll">
          {/* Branch Selector */}
          {!isCollapsed && (
            <div className="px-4 mt-4">
              <BranchSelector
                showCreateButton={true}
                onCreateBranch={() => {
                  router.push(PRIVATE_ROUTES.SETTINGS_BRANCHES_NEW);
                }}
              />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex flex-col gap-2 mt-6 px-4 pb-4">
          {menuItems.map(({ label, path, icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  'group flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                  isCollapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-4 py-3',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10 border border-cyan-500/20'
                    : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50',
                )}
                title={isCollapsed ? label : undefined}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-teal-500/5 rounded-xl"></div>
                )}
                <div
                  className={cn(
                    'flex items-center justify-center relative z-10',
                    isCollapsed ? 'w-full' : 'min-w-[24px]',
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-cyan-400',
                  )}
                >
                  {icon}
                </div>
                {!isCollapsed && (
                  <span className="relative z-10 transition-colors duration-200">
                    {label}
                  </span>
                )}
                {isActive && (
                  <div className="absolute right-0 w-1 h-8 bg-gradient-to-b from-cyan-400 to-teal-500 rounded-l-full"></div>
                )}
              </Link>
            );
          })}
          </nav>

          {/* Attendance Actions */}
          <div className="p-4 border-t border-slate-700/50 mt-4">
          {!isCollapsed && (
            <div className="space-y-2">
              <Link
                href={PRIVATE_ROUTES.ATTENDANCE_CHECKIN}
                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 transition-all duration-200"
              >
                <FiLogIn className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  Registrar Entrada
                </span>
              </Link>
              <Link
                href={PRIVATE_ROUTES.ATTENDANCE_CHECKOUT}
                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 border border-orange-500/30 transition-all duration-200"
              >
                <FiLogOut className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">
                  Registrar Salida
                </span>
              </Link>
            </div>
          )}
          {isCollapsed && (
            <div className="space-y-2">
              <Link
                href={PRIVATE_ROUTES.ATTENDANCE_CHECKIN}
                className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 transition-all duration-200"
                title="Registrar Entrada"
              >
                <FiLogIn className="h-4 w-4 text-green-400" />
              </Link>
              <Link
                href={PRIVATE_ROUTES.ATTENDANCE_CHECKOUT}
                className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 border border-orange-500/30 transition-all duration-200"
                title="Registrar Salida"
              >
                <FiLogOut className="h-4 w-4 text-orange-400" />
              </Link>
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
          {!isCollapsed && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full animate-pulse"></div>
              <div className="text-xs text-slate-400 font-medium">
                OdinSys v1.2.0
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full animate-pulse"></div>
            </div>
          )}
          </div>
        </div>
      </aside>
    </>
  );
}
