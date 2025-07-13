'use client';
import { useUserStore } from '@/store/useUserStore';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Header } from '@/components/header/Header';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

function SyncSessionToZustand() {
  const { data: session } = useSession();
  const { setUser } = useUserStore();

  useEffect(() => {
    setUser(session?.user ?? null);
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
