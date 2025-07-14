'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Bell, ChevronDown, LogOut, Menu, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

// Header.jsx
export function Header() {
  const { user, logout } = useUserStore();
  const { isMobileOpen, toggleCollapsed, toggleMobile } = useSidebarStore();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push(PUBLIC_ROUTES.LOGIN);
  };

  if (!user) return null;

  return (
    <header className="relative  z-30 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl border-b border-cyan-200/50 shadow-lg shadow-cyan-900/10">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Hamburger & Title */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu */}
          <button
            onClick={() =>
              window.innerWidth >= 768 ? toggleCollapsed() : toggleMobile()
            }
            className="p-2 rounded-xl bg-white/60 border border-cyan-200/50 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-sm"
          >
            {isMobileOpen && window.innerWidth < 768 ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

          <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-cyan-400 to-teal-500"></div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-xs text-cyan-600/80 font-medium">
              Panel de Administración
            </p>
          </div>
        </div>

        {/* Right side - Actions & User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-3 rounded-xl bg-white/60 border border-cyan-200/50 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-sm">
            <Bell size={20} />
            <div className="absolute top-1 right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse shadow-sm"></div>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/60 border border-cyan-200/50 hover:bg-cyan-50 hover:border-cyan-300/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-sm"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-cyan-400 ring-offset-2 ring-offset-white/80">
                  <AvatarImage src={user.image} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-semibold">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold text-cyan-800">
                  {user.name}
                </div>
                <div className="text-xs text-cyan-600 font-medium capitalize">
                  {user.role}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  'text-cyan-500 transition-transform duration-200',
                  showDropdown && 'rotate-180',
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-cyan-200/50 z-50 overflow-hidden">
                <div className="p-2">
                  <div className="px-4 py-3 border-b border-cyan-100">
                    <div className="text-sm font-semibold text-cyan-800">
                      {user.name}
                    </div>
                    <div className="text-xs text-cyan-600">
                      {user.email || 'admin@odinsys.com'}
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cyan-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 hover:text-cyan-800 rounded-xl transition-all duration-200"
                      onClick={() => router.push(PRIVATE_ROUTES.SETTINGS)}
                    >
                      <Settings size={16} />
                      <span>Configuración</span>
                    </button>

                    <div className="h-px bg-cyan-100 my-2"></div>

                    <button
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
