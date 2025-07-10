'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/public/login');
    }
  }, [status, router]);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Bienvenido, {session?.user?.name}</h1>
    </div>
  );
}
