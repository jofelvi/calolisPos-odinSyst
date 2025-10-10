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

### Token Optimization Strategy

To maximize development efficiency and minimize token usage:

- **Delayed Formatting**: Write functional code first, fix formatting at the end of the session
- **Batch Formatting**: Run `npm run format` once after completing all code changes
- **Focus on Logic**: Prioritize implementing features and fixing bugs over formatting during development
- **End-of-Session Cleanup**: Always run linting and formatting before finalizing work

### Route Management

All routes are centralized in `src/shared/constantsRoutes/routes.ts`:

- **PUBLIC_ROUTES**: Accessible without authentication
- **CUSTOMER_ROUTES**: Customer-facing interface
- **PRIVATE_ROUTES**: Admin/staff interface
- **Route Functions**: Dynamic routes use functions like `PRODUCTS_DETAILS(id: string)`

Use these constants instead of hardcoded strings throughout the application.

## Important Implementation Notes

### Understanding the Domain Models (CRITICAL)

**Before working with any feature, you MUST read and understand the domain models and enums:**

#### Core Domain Types (`src/modelTypes/`)

- **REQUIRED READING**: Examine all TypeScript interfaces in this directory to understand data structures
- Key models include: `order.ts`, `product.ts`, `customer.ts`, `employee.ts`, `supplier.ts`, `attendance.ts`, `payroll.ts`
- Each model defines the shape of data used throughout the application
- Understanding these types is essential for proper TypeScript implementation

#### Business Enums (`src/modelTypes/enumShared.ts` and `src/shared/types/enumShared.ts`)

- **CRITICAL**: These enums define all business logic constants and status values
- Key enums include:
  - `UserRoleEnum`: ADMIN, MANAGER, CASHIER, WAITER, KITCHEN, CUSTOMER
  - `OrderStatusEnum`: PENDING, IN_PROGRESS, READY, DELIVERED, CANCELLED, PAID
  - `PaymentStatusEnum`: PENDING, PARTIAL, PAID, REFUNDED, CANCELLED
  - `PaymentMethodEnum`: CASH_BS, CASH_USD, CARD, TRANSFER, PAGO_MOVIL, MIXED
  - `TableStatusEnum`: PREPARING, ISAVAILABLE, OCCUPIED, RESERVED, CLEANING
  - `AttendanceStatusEnum`: PRESENT, ABSENT, LATE, EARLY_DEPARTURE, HOLIDAY, SICK_LEAVE, VACATION
  - `PurchaseOrderStatusEnum`: PENDING, APPROVED, RECEIVED, CANCELED, PARTIALLY_RECEIVED

**Why This Matters:**

- Ensures consistent use of status values across components
- Prevents hardcoded strings that can cause bugs
- Maintains business logic integrity
- Required for proper form validation and UI state management

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

#### Firebase Query Optimization (CRITICAL)

**Avoid Compound Index Requirements:**

- **Never combine multiple `where` clauses with date ranges** - this requires Firebase compound indexes
- **Use simple queries + memory filtering instead:**

  ```typescript
  // ❌ Avoid - requires compound index
  (where('createdAt', '>=', startDate),
    where('createdAt', '<=', endDate),
    where('paymentStatus', '==', 'PAID'));

  // ✅ Prefer - single condition + memory filter
  where('paymentStatus', '==', 'PAID');
  // Then filter by date in memory using convertFirebaseDate()
  ```

- **Always use `convertFirebaseDate()` from `@/shared/utils/dateHelpers`** for date conversions
- **Filter arrays in memory** rather than complex Firebase queries

### Chart and Analytics

- **Recharts**: Used for data visualization (weekly sales charts)
- **Sales Analytics**: Centralized in `salesAnalyticsService.ts`
- **Dashboard Components**: App-specific charts in `src/app/components/dashboard/`

### Migration Strategy

The project is actively migrating from a legacy structure to the current feature-based architecture:

- New development should use the feature-based structure
- Legacy components in `src/components/` are being gradually moved to appropriate features
- Both structures coexist during the transition period

---

## 🚀 CONTINUACIÓN DE SESIONES

### 📍 PUNTO DE PARTIDA (Última Actualización: 2025-10-02)

**ARCHIVOS DE DOCUMENTACIÓN COMPLETA:**
- `CLAUDE.md` - Este archivo (arquitectura y guías generales)
- `SESSION_NOTES.md` - Detalles de la última sesión de trabajo
- `DEPLOYMENT.md` - Guía completa de deployment a Vercel

**Al inicio de cada nueva sesión, LEER EN ORDEN:**
1. ✅ `SESSION_NOTES.md` - Para ver último trabajo realizado
2. ✅ `DEPLOYMENT.md` - Para deployment y comandos
3. ✅ Este archivo (`CLAUDE.md`) - Para arquitectura general

---

### 🎯 TRABAJO RECIENTE (Sesión 2025-10-02)

#### ✅ Problemas Resueltos

**1. Toast Duplicado de Tasa BCV**
- **Archivo:** `src/app/private/pos/payment/[orderId]/page.tsx`
- **Problema:** 2 toasts mostrándose al cargar la página
- **Solución:** Implementado `useRef` (`bcvToastShownRef`) para controlar que solo se muestre una vez
- **Commit:** `f000b8d`

**2. Scraping BCV Mejorado**
- **Archivo:** `src/shared/utils/getPriceDolar.ts`
- **Mejoras:**
  - Chrome instalado para Puppeteer: `C:\Users\jofel\.cache\puppeteer\chrome\win64-138.0.7204.49\`
  - Múltiples selectores de fallback implementados
  - Logging detallado agregado
  - Flags de seguridad para SSL/CSP
- **Commit:** `f000b8d`, `f4991d9`

**3. Documentación Completa**
- **Archivos creados:** `SESSION_NOTES.md`, `DEPLOYMENT.md`
- **Commit:** `f0ba6f4`

#### 🌐 Deployment Exitoso
- **URL Producción:** https://odinsystem-otr612i2g-jonathan-zambranos-projects.vercel.app
- **Usuario Vercel:** jonathan-zambranos-projects
- **Estado:** ✅ Funcionando correctamente

---

### 🛠️ COMANDOS ESENCIALES PARA CONTINUACIÓN

```bash
# RUTA CORRECTA DEL PROYECTO (SIEMPRE USAR)
cd /mnt/c/Users/jofel/RepositoriosPersonales/calolisPos-odinSyst

# Inicio de sesión
git log --oneline -10
cat SESSION_NOTES.md

# Desarrollo
cmd.exe /c "npm run dev"
cmd.exe /c "npm run build"

# Deployment a Vercel
cmd.exe /c "vercel --prod --yes"

# Ver deployments
cmd.exe /c "vercel list"
```

---

### ⚠️ PROBLEMAS CONOCIDOS

**Git Remote GitHub:**
- **Estado:** No resuelto
- **Error:** `ssh: Could not resolve hostname github-personal`
- **Workaround:** Deploy directo con Vercel CLI
- **Impacto:** Bajo (deployment funciona)

**Scraping BCV:**
- **Estado:** Mejorado pero puede fallar
- **Fallback:** Retorna tasa por defecto (36.5)
- **Logging:** Detallado para diagnóstico

---

### 📋 TAREAS PENDIENTES

- [ ] Resolver problema de Git remote
- [ ] Considerar API alternativa para tasa BCV
- [ ] Optimizar console.log para producción
- [ ] Verificar comportamiento de toast único en producción

---

### 🎓 LECCIONES APRENDIDAS RECIENTES

1. **`useRef` es útil para controlar side effects** que no deben repetirse en React Strict Mode
2. **Puppeteer requiere Chrome instalado:** `npx puppeteer browsers install chrome`
3. **Múltiples selectores de fallback** hacen el scraping más robusto
4. **Build en Windows (cmd.exe) más confiable** que WSL para dependencias nativas
5. **Vercel CLI permite deploy sin GitHub** - útil para problemas de autenticación
6. **ESLint requiere `_` prefix** para variables catch no utilizadas

---

### 📊 ÚLTIMA BUILD

- **Tiempo:** ~71 segundos
- **Advertencias ESLint:** ~100+ (permitidas)
- **Errores:** 0
- **Bundle size (payment page):** ~388 kB
- **pnpm version:** 10.17.1

---

**Para detalles completos de la última sesión, ver `SESSION_NOTES.md`**
**Para instrucciones de deployment, ver `DEPLOYMENT.md`**
