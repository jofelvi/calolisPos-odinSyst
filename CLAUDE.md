# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OdinSystem is a Next.js-based Point of Sale (POS) system focused on restaurant management with Firebase backend integration. The application features comprehensive modules for products, orders, customers, suppliers, purchase orders, categories, tables, employee management, and financial operations.

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI components, Lucide icons
- **Charts**: Recharts for data visualization
- **Backend**: Firebase (Firestore, Auth, Storage)
- **State Management**: Zustand
- **Forms**: React Hook Form with Yup validation
- **Authentication**: NextAuth.js + Firebase Auth
- **PDF Generation**: jsPDF, jsPDF-autotable
- **Date Handling**: date-fns, @formkit/tempo

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code (must pass before commits)
npm run lint

# Format code with Prettier
npm run format

# Check code formatting
npm run check-format
```

## Directory Structure

The project follows a feature-based architecture with clear separation of concerns:

```
src/
├── app/                      # Next.js App Router
│   ├── components/           # App-specific components (dashboard charts)
│   ├── private/             # Protected admin routes (/private/*)
│   ├── customer/            # Customer-facing interface (/customer/*)
│   ├── public/              # Public routes (/public/login)
│   └── api/                 # API routes (auth, external services)
├── shared/                  # Cross-cutting concerns
│   ├── ui/                  # Reusable UI components with public API
│   ├── hooks/               # Shared React hooks
│   ├── utils/               # Common utilities (date, currency, status)
│   ├── types/               # Shared TypeScript types and enums
│   ├── schemas/             # Yup validation schemas
│   ├── store/               # Zustand global state
│   ├── constantsRoutes/     # Centralized route definitions
│   └── index.ts             # Public API exports for shared resources
├── features/                # Business domain modules
├── components/              # Legacy components (being phased out)
├── services/                # Data access layer
│   └── firebase/            # Firebase services and configuration
├── modelTypes/              # Domain model TypeScript types
└── middleware.ts            # NextAuth route protection
```

### Feature Architecture

Each feature module follows a consistent, self-contained structure:

```
features/[domain]/
├── components/              # Domain-specific UI components
├── hooks/                   # Domain-specific React hooks
├── services/                # Business logic and data access
├── types/                   # Domain types and interfaces
│   └── schemas/             # Feature-specific validation schemas
├── utils/                   # Domain utilities
└── index.ts                 # Public API exports
```

Current feature domains: `supply-chain`, `accountsReceivable`, `attendance`, `categories`, `customer`, `employees`, `forms`, `invoices`, `payroll`, `pos`, `products`, `purchaseOrders`, `reports`, `suppliers`, `tables`.

## Key Architecture Patterns

### Authentication & Route Protection

- **Middleware**: `src/middleware.ts` protects `/private/*` and `/customer/*` routes
- **Role-based routing**: Centralized in `src/shared/constantsRoutes/routes.ts`
- **User roles**: `CUSTOMER`, `ADMIN`, `MANAGER` with different access levels
- **Route helpers**: `getDefaultRouteByRole()`, `isRouteAccessibleForRole()`

### Data Layer Architecture

- **Generic Services**: `src/services/firebase/genericServices.ts` provides CRUD operations for all entities
- **Specific Services**: Feature-specific services extend or complement generic operations
- **Firebase Integration**: All data access goes through Firebase Firestore with proper error handling
- **Type Safety**: All Firebase operations are typed with domain models from `src/modelTypes/`

### Component Organization Principles

- **Shared Components**: Available through `src/shared/index.ts` public API
- **Feature Components**: Self-contained within their respective feature modules
- **Legacy Migration**: Components in `src/components/` are being gradually moved to features
- **Public APIs**: Each feature exports only what other modules need through `index.ts`

### State Management Strategy

- **Global State**: Zustand stores in `src/shared/store/` (user auth, sidebar, customer cart)
- **Form State**: React Hook Form for all forms with Yup validation
- **Server State**: Custom hooks within features for data fetching and caching
- **Local State**: React hooks for component-specific state

## Code Quality Standards

### ESLint Configuration (Strict Enforcement)

The project enforces strict code quality through ESLint. **All code must pass lint checks before commits**.

Critical rules that must be followed:

- `@typescript-eslint/no-explicit-any`: "error" - Never use `any`, always provide proper types
- `@typescript-eslint/no-unused-vars`: "error" - Remove all unused variables
- `no-console`: "warn" - Use console only for debugging (warnings allowed)
- `no-debugger`: "error" - Never commit debugger statements
- `prefer-const`: "error" - Use const when variable isn't reassigned
- `prettier/prettier`: "error" - Code must be properly formatted

### Development Principles

The codebase emphasizes **SOLID**, **DRY**, **KISS** principles and "thinking React":

- **Single Responsibility**: Each feature, component, and service has one clear purpose
- **DRY Implementation**: Shared components in `/shared/ui/`, reusable services, common utilities
- **Component Reusability**: Extract similar logic into shared components
- **Type Safety**: Strict TypeScript throughout with proper interfaces

### Route Management

All routes are centralized in `src/shared/constantsRoutes/routes.ts`:

- **PUBLIC_ROUTES**: Accessible without authentication
- **CUSTOMER_ROUTES**: Customer-facing interface
- **PRIVATE_ROUTES**: Admin/staff interface
- **Route Functions**: Dynamic routes use functions like `PRODUCTS_DETAILS(id: string)`

Use these constants instead of hardcoded strings throughout the application.

## Important Implementation Notes

### POS Module Known Issues

The POS system has specific behavior requirements:

- Clicking or pressing Enter should NOT automatically proceed to the next screen
- Payment processing should only occur when explicitly confirmed through "Process Payment" or similar actions
- Navigation flow must be intentional, not accidental

### Firebase Services Pattern

- Use `genericServices.ts` for standard CRUD operations
- Create feature-specific services (like `orderServices.ts`) for complex business logic
- All services handle Firebase Timestamp conversion automatically
- Error handling should be graceful with user-friendly messages

### Chart and Analytics

- **Recharts**: Used for data visualization (weekly sales charts)
- **Sales Analytics**: Centralized in `salesAnalyticsService.ts`
- **Dashboard Components**: App-specific charts in `src/app/components/dashboard/`

### Migration Strategy

The project is actively migrating from a legacy structure to the current feature-based architecture:

- New development should use the feature-based structure
- Legacy components in `src/components/` are being gradually moved to appropriate features
- Both structures coexist during the transition period
