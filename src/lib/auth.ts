import { useUserStore } from '@/store/useUserStore';

export function isAuthenticated() {
  const { user } = useUserStore.getState();
  return !!user;
}
