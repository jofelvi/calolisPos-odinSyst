'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRoleEnum } from '@/shared';
import { AUTH_ROUTES, PRIVATE_ROUTES } from '@/constants/routes';
import CustomerLayout from '@/components/customerLayout/CustomerLayout';

export default function CustomerDashboardLayout({
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

    // Check if user has customer role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session?.user as any)?.role;
    if (userRole && userRole !== UserRoleEnum.CUSTOMER) {
      router.push(PRIVATE_ROUTES.DASHBOARD);
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
  if (userRole && userRole !== UserRoleEnum.CUSTOMER) {
    return null;
  }

  return <CustomerLayout>{children}</CustomerLayout>;
}
