import ProtectedLayout from '@/components/protectedLayout/ProtectedLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
