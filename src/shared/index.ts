// Shared Resources Public API
// Cross-cutting concerns available to all features

// UI Components
export { Badge } from '@/shared/ui/badge/badge';
export { Button } from '@/shared/ui/button/Button';
export {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card/card';
export { Input } from '@/shared/ui/input/input';
export { Label } from '@/shared/ui/label/label';
export { Select } from '@/shared/ui/select/select';
export { default as SelectCustom } from '@/shared/ui/selectCustom/SelectCustom';
export { Skeleton } from '@/shared/ui/skeleton/skeleton';
export { Textarea } from '@/shared/ui/textarea/textarea';
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/tabs/tabs';
export { default as Loader } from '@/shared/ui/Loader/Loader';
export { EmptyState } from '@/shared/ui/EmptyState/EmptyState';
export { EntityGrid } from '@/shared/ui/EntityGrid/EntityGrid';
export { default as BackButton } from '@/shared/ui/BackButton/BackButton';
export { default as Modal } from '@/shared/ui/modal';
export { default as Table } from '@/shared/ui/Table';

// Layout Components
export { default as ProtectedLayout } from '@/shared/ui/ProtectedLayout';
export { Providers } from '@/shared/ui/Providers';
export { Header } from '@/shared/ui/Header';
export { Sidebar } from '@/shared/ui/Sidebar';

// Form Components
export { FormErrorSummary } from '@/shared/ui/formErrorSummary/FormErrorSummary';
export { default as FormFieldError } from '@/shared/ui/formFieldError/FormFieldError';

// Toast Components
export * from '@/shared/ui/toast';

// Hooks
export * from './hooks/useFormState';
export * from './hooks/useFormValidation';
export * from './hooks/useToast';

// Types
export * from '@/shared/types/enumShared';
export * from '@/shared/types/userTypes';
export * from '@/shared/types/schemas/authSchema';

// Utils
export * from './utils/currencyHelpers';
export * from './utils/dateHelpers';
export * from './utils/statusHelpers';

// Constants
export * from '@/shared/constantsRoutes/routes';
