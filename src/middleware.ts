import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/public/login',
  },
});

export const config = {
  matcher: ['/private/:path*'],
};
