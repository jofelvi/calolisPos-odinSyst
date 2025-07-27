# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

OdinSystem is a Next.js-based Point of Sale (POS) system with Firebase backend
integration. The application features a restaurant/retail management system with
modules for products, orders, customers, suppliers, purchase orders, categories,
and tables.

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI components, custom component library
- **Backend**: Firebase (Firestore, Auth, Storage)
- **State Management**: Zustand
- **Forms**: React Hook Form with Yup validation
- **Authentication**: NextAuth.js + Firebase Auth

### Directory Structure

- `src/app/(modules)/(private)/` - Protected routes requiring authentication
- `src/app/(modules)/(public)/` - Public routes (login, etc.)
- `src/components/` - Reusable UI components organized by feature
- `src/services/firebase/` - Firebase service layer for data operations
- `src/schemas/` - Yup validation schemas
- `src/types/` - TypeScript type definitions
- `src/store/` - Zustand state management
- `src/utils/` - Utility functions

### Key Features

- **POS System**: Order management, payment processing, receipt generation
- **Inventory Management**: Products, categories, suppliers, purchase orders
- **Customer Management**: Customer records and order history
- **Table Management**: Restaurant table assignments and orders
- **Authentication**: Role-based access with protected routes

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code with Prettier
npm run format

# Check code formatting
npm run check-format
```

## Key Architecture Patterns

### Authentication Flow

- Uses NextAuth.js middleware for route protection (`middleware.ts`)
- Protected routes are under `(private)` directory with `ProtectedLayout`
  wrapper
- User state managed via Zustand store (`useUserStore`)

### Data Layer

- Firebase services in `services/firebase/` provide CRUD operations
- Generic service pattern (`genericServices.ts`) for common operations
- Type-safe schemas using Yup for form validation

### Component Organization

- Feature-based component organization (products, orders, customers, etc.)
- Shared UI components in `components/shared/`
- Form components follow consistent patterns with error handling

### State Management

- Zustand for global state (user authentication)
- React Hook Form for form state management
- Custom hooks for data fetching patterns

## Important Files

- `src/services/firebase/firebase.ts` - Firebase configuration and
  initialization
- `src/middleware.ts` - NextAuth.js route protection
- `src/schemas/` - Form validation schemas
- `src/types/enumShared.ts` - Shared enums for status values
