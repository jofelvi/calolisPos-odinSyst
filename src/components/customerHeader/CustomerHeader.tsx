'use client';
import { useUserStore } from '@/store/useUserStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { signOut } from 'next-auth/react';
import { User, LogOut, ShoppingCart, Menu, X } from 'lucide-react';
import { useCustomerCartStore } from '@/store/useCustomerCartStore';
import { AUTH_ROUTES } from '@/constants/routes';

export function CustomerHeader() {
  const { user } = useUserStore();
  const { items } = useCustomerCartStore();
  const { isMobileOpen, toggleMobile } = useSidebarStore();

  const handleSignOut = () => {
    signOut({ callbackUrl: AUTH_ROUTES.SIGNIN });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="relative bg-gradient-to-r from-white/90 to-teal-50/90 backdrop-blur-xl border-b border-teal-200/50 shadow-lg shadow-teal-900/5">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Hamburger & Welcome */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu for Mobile */}
          <button
            onClick={toggleMobile}
            className="md:hidden p-2 rounded-xl bg-white/60 border border-teal-200/50 text-teal-600 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-300/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 shadow-sm"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-cyan-400 to-teal-500"></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
              ¡Hola, {user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-teal-600 font-medium">¿Qué te gustaría ordenar hoy?</p>
          </div>
        </div>

        {/* Right side - Actions & User */}
        <div className="flex items-center gap-4">
          {/* Shopping Cart */}
          <div className="relative p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200/50 shadow-sm">
            <ShoppingCart className="h-6 w-6 text-teal-600" />
            {totalItems > 0 && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-pulse">
                {totalItems}
              </div>
            )}
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            {/* User Avatar & Info */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/80 border border-teal-200/50 shadow-sm">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-teal-800">
                  {user?.name}
                </div>
                <div className="text-xs text-teal-600">Cliente</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
