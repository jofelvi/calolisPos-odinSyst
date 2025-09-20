'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Clock, Home, ShoppingBag } from 'lucide-react';
import { CUSTOMER_ROUTES } from '@/shared';
import { useSidebarStore } from '@/shared/store/useSidebarStore';
import { useEffect } from 'react';
import { cn } from '@/shared/utils/utils';

const customerMenuItems = [
  {
    name: 'Inicio',
    href: CUSTOMER_ROUTES.HOME,
    icon: Home,
  },
  {
    name: 'Catálogo',
    href: CUSTOMER_ROUTES.CATALOG,
    icon: ShoppingBag,
  },
  {
    name: 'Mis Pedidos',
    href: CUSTOMER_ROUTES.HISTORY,
    icon: ClipboardList,
  },
  {
    name: 'Estado Actual',
    href: CUSTOMER_ROUTES.CURRENT_ORDER,
    icon: Clock,
  },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();

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
          'w-72 h-screen bg-gradient-to-b from-teal-900 via-teal-800 to-cyan-900 border-r border-teal-700/50 backdrop-blur-xl flex flex-col shadow-2xl',
          // Desktop behavior
          'hidden md:flex',
          // Mobile behavior
          'md:relative fixed top-0 left-0 z-50',
          isMobileOpen ? 'flex' : 'hidden md:flex',
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 shadow-lg shadow-cyan-500/25">
                <ShoppingBag size={24} className="text-white" />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-xl blur opacity-30"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                OdinSystem
              </span>
              <span className="text-xs text-teal-300 font-medium">
                Portal Cliente
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 mt-6 px-4 flex-grow">
          {customerMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-teal-500/15 text-cyan-300 shadow-lg shadow-cyan-500/10 border border-cyan-500/25'
                    : 'text-teal-200 hover:text-cyan-300 hover:bg-teal-800/50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl"></div>
                )}
                <div
                  className={`flex items-center justify-center relative z-10 ${
                    isActive
                      ? 'text-cyan-300'
                      : 'text-teal-300 group-hover:text-cyan-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="relative z-10 transition-colors duration-200">
                  {item.name}
                </span>
                {isActive && (
                  <div className="absolute right-0 w-1 h-8 bg-gradient-to-b from-cyan-400 to-teal-400 rounded-l-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-teal-700/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-800/50 border border-teal-700/50">
            <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full animate-pulse"></div>
            <div className="text-xs text-teal-300 font-medium">
              Cliente Conectado
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
