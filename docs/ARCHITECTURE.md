# Architecture Overview

This document outlines the architectural decisions and structure of the template frontend application. The architecture is domain-agnostic so you can adapt it to banking, ecommerce, internal tooling, or any other product vertical.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI**: Shadcn/ui + Tailwind CSS
- **State Management**:
  - Server State: TanStack Query
  - Client State: Zustand
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library

## Project Structure

```
src/
├── app/                    # Next.js App Router entry point
│   ├── (dashboard)/        # Admin route group
│   │   ├── layout.tsx      # Dashboard shell (sidebar, header)
│   │   └── dashboard/      # Dashboard routes
│   │       ├── page.tsx
│   │       ├── insights/page.tsx
│   │       ├── settings/page.tsx
│   │       └── users/page.tsx
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout & metadata
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # Root providers (QueryClient, etc.)
│
├── components/
│   ├── ui/                # Shadcn components (auto-generated)
│   ├── features/          # Feature-specific components
│   │   └── [feature]/
│   │       ├── Component.tsx
│   │       ├── Component.test.tsx
│   │       └── README.md
│   └── layouts/           # Layout components
│
├── lib/
│   ├── api/
│   │   ├── client.ts      # Base API client
│   │   └── endpoints/     # API endpoint functions
│   ├── hooks/             # Custom React hooks
│   ├── schemas/           # Zod schemas (single source of truth)
│   ├── store/             # Zustand stores
│   └── utils/             # Utility functions
│
├── config/
│   ├── env.ts             # Environment validation
│   ├── index.ts           # Central config exports
│   └── navigation.ts      # Dashboard navigation maps
└── types/                 # TypeScript type definitions
```

## Core Principles

### 1. Schema-Driven Development

All data structures are defined as Zod schemas first:

```typescript
// Define schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

// Infer TypeScript type
export type User = z.infer<typeof userSchema>;
```

**Benefits:**

- Single source of truth
- Runtime validation
- Type safety at compile and runtime
- Automatic form validation

### 2. Separation of Concerns

**Server State (TanStack Query)**

- API responses
- Cached data
- Background refetching
- Optimistic updates

**Client State (Zustand)**

- UI state (modals, dropdowns)
- User preferences
- Temporary form data
- Global app state

### 3. Co-located Tests

Tests live next to the code they test:

```
Component.tsx
Component.test.tsx
```

**Benefits:**

- Easy to find tests
- Encourages writing tests
- Clear test coverage
- Easier refactoring

### 4. Type Safety First

- No `any` types allowed
- Strict TypeScript configuration
- Runtime validation for external data
- Type guards for type narrowing

## Data Flow

```
┌─────────────────────────────────────────┐
│           User Action                    │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│     Component (React Hook Form)          │
│     - Validates with Zod schema          │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│     API Client (apiClient)               │
│     - Sends HTTP request                 │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│     TanStack Query                       │
│     - Caches response                    │
│     - Manages loading states             │
│     - Handles errors                     │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│     Schema Validation                    │
│     - Validates response with Zod        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│     Component Re-render                  │
│     - Displays validated data            │
└─────────────────────────────────────────┘
```

## API Layer

### Client Setup

```typescript
// lib/api/client.ts
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${config.api.baseUrl}${endpoint}`;
  const response = await fetch(url, options);
  // Error handling, parsing, etc.
  return response.json();
}
```

### Endpoint Functions

```typescript
// lib/api/endpoints/users.ts
export async function getUser(userId: string): Promise<User> {
  const response = await apiClient<ApiResponse<User>>(`/users/${userId}`);
  return userSchema.parse(response.data);
}
```

### React Hooks

```typescript
// lib/hooks/useUser.ts
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });
}
```

## State Management

### When to Use TanStack Query

- Fetching data from API
- Caching server responses
- Automatic refetching
- Optimistic updates
- Pagination/infinite scroll

### When to Use Zustand

- UI state (modals, sidebar open/closed)
- User preferences (theme, language)
- Temporary form data (multi-step forms)
- Client-only state

### Example Zustand Store

```typescript
interface AppStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
}));
```

## Error Handling

### API Errors

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
  }
}
```

### React Error Boundaries

Place error boundaries at route level:

```typescript
// app/dashboard/error.tsx
'use client';

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Performance Optimization

1. **Route-based Code Splitting** (automatic with App Router)
2. **Component Lazy Loading** (`next/dynamic`)
3. **Image Optimization** (`next/image`)
4. **TanStack Query Caching** (reduces API calls)
5. **Zustand Selectors** (prevents unnecessary re-renders)

## Security

1. **Environment Variable Validation** (Zod schema)
2. **Input Sanitization** (Zod validation)
3. **XSS Protection** (React auto-escaping)
4. **CSRF Protection** (implement if needed)
5. **Content Security Policy** (configure in next.config.ts)

## Deployment Considerations

- **Build Time Checks**: TypeScript + ESLint must pass
- **Environment Variables**: Validated on startup
- **Error Monitoring**: Integrate Sentry or similar
- **Analytics**: Integrate as needed
- **Performance Monitoring**: Use Next.js Analytics or similar
