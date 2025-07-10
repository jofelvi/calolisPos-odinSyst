'use client';

import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

// Header.jsx
export function Header() {
  const { user, logout } = useUserStore();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
          Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none">
          <Bell size={18} />
        </button>
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              <AvatarImage src={user.image} />
              <AvatarFallback className="bg-blue-600 text-white">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </div>
            </div>
            <ChevronDown
              size={16}
              className="text-gray-500 dark:text-gray-400"
            />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-800 z-10">
              <div className="py-1">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => router.push('/settings')}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
