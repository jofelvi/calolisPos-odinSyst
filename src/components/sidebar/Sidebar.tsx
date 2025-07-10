'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import logo from '../../../public/odinsys.webp';

import {
  FiClipboard,
  FiCreditCard,
  FiFolder,
  FiGrid,
  FiLayout,
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';

const menuItems = [
  { label: 'Panel', path: '/dashboard', icon: <FiLayout size={20} /> },
  { label: 'Categorías', path: '/categories', icon: <FiFolder size={20} /> },
  { label: 'Productos', path: '/products', icon: <FiPackage size={20} /> },
  { label: 'Ventas', path: '/orders', icon: <FiShoppingCart size={20} /> },
  { label: 'Proveedores', path: '/suppliers', icon: <FiTruck size={20} /> },
  { label: 'Mesas', path: '/tables', icon: <FiGrid size={20} /> },
  {
    label: 'Órdenes de Compra',
    path: '/purchase-orders',
    icon: <FiClipboard size={20} />,
  },
  { label: 'Clientes', path: '/customers', icon: <FiUsers size={20} /> },
  { label: 'Punto de Venta', path: '/pos', icon: <FiCreditCard size={20} /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white">
            <Image
              src={logo}
              alt="Logo"
              width={24}
              height={24}
              className="min-w-[24px]"
            />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              OdinSys
            </span>
          )}
        </div>
        <button
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex flex-col gap-1 mt-4 px-3 flex-grow">
        {menuItems.map(({ label, path, icon }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center min-w-[24px]',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400',
                )}
              >
                {icon}
              </div>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            OdinSys v1.2.0
          </div>
        )}
      </div>
    </aside>
  );
}
