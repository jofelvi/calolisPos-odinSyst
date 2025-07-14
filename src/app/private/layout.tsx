'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRoleEnum } from '@/types/enumShared';
import { AUTH_ROUTES, CUSTOMER_ROUTES } from '@/constants/routes';
import ProtectedLayout from '@/components/protectedLayout/ProtectedLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push(AUTH_ROUTES.SIGNIN);
      return;
    }

    // Check if user is customer (should go to customer area)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session?.user as any)?.role;
    if (userRole === UserRoleEnum.CUSTOMER) {
      router.push(CUSTOMER_ROUTES.HOME);
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session?.user as any)?.role;
  if (userRole === UserRoleEnum.CUSTOMER) {
    return null;
  }

  return <ProtectedLayout>{children}</ProtectedLayout>;
}
