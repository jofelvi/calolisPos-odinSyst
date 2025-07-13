import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { AUTH_ROUTES, PROTECTED_ROUTE_PATTERNS } from '@/constants/routes';

export default withAuth(
  function middleware(req) {
    // Just pass through - let pages handle their own logic
    return NextResponse.next();
  },
  {
    pages: {
      signIn: AUTH_ROUTES.SIGNIN,
    },
  },
);

export const config = {
  matcher: PROTECTED_ROUTE_PATTERNS,
};
