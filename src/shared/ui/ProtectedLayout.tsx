'use client';
import { useUserStore } from '@/shared/store/useUserStore';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Header, Sidebar } from '@/shared';

function SyncSessionToZustand() {
  const { data: session } = useSession();
  const { setUser } = useUserStore();

  useEffect(() => {
    if (session?.user) {
      // Map NextAuth user to our User interface
      const user = {
        id: session.user.id || '1',
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || '',
        role: session.user.role,
        isActive: true,
      };
      setUser(user);
    } else {
      setUser(null);
    }
  }, [session, setUser]);

  return null;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SyncSessionToZustand />
      <div className="flex h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  );
}
