// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UserRoleEnum } from '@/types/enumShared';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: UserRoleEnum;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}
