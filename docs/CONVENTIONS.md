# Coding Conventions

This document defines the coding standards and conventions for the template frontend project. The Allpro NextJS Boilerplate is intentionally domain-neutral and can be applied to any product vertical.

## File Naming

### Components

- **PascalCase** for component files: `UserProfile.tsx`
- **Tests** co-located with same name: `UserProfile.test.tsx`
- **Styles** (if separate): `UserProfile.module.css`

### Non-Components

- **camelCase** for utilities: `formatCurrency.ts`
- **camelCase** for hooks: `useAccountBalance.ts`
- **kebab-case** for config files: `tailwind.config.ts`
- **SCREAMING_SNAKE_CASE** for constants: `API_ENDPOINTS.ts`

### Directories

- **kebab-case** for all directories: `user-profile/`, `api-client/`

## TypeScript

### Type Definitions

```typescript
// ✅ Good: Infer types from Zod schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type User = z.infer<typeof userSchema>;

// ❌ Bad: Manual type definition without schema
export interface User {
  id: string;
  name: string;
}
```

### No Any Types

```typescript
// ❌ Bad
function processData(data: any) {
  return data;
}

// ✅ Good
function processData<T>(data: T): T {
  return data;
}

// ✅ Good: Use unknown for truly unknown types
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
}
```

### Explicit Return Types

```typescript
// ✅ Good: Explicit return type
export async function fetchUser(id: string): Promise<User> {
  const response = await apiClient(`/users/${id}`);
  return userSchema.parse(response);
}

// ❌ Bad: Inferred return type (less clear)
export async function fetchUser(id: string) {
  const response = await apiClient(`/users/${id}`);
  return userSchema.parse(response);
}
```

### Type Guards

```typescript
// ✅ Good: Type guard for runtime checks
function isUser(value: unknown): value is User {
  return userSchema.safeParse(value).success;
}

if (isUser(data)) {
  // TypeScript knows data is User here
  console.log(data.name);
}
```

## React Components

### Function Components

```typescript
// ✅ Good: Named export with explicit props type
interface UserCardProps {
  user: User;
  onEdit?: () => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div>
      <h2>{user.name}</h2>
      {onEdit && <button onClick={onEdit}>Edit</button>}
    </div>
  );
}
```

### Prop Naming

```typescript
// ✅ Good: Boolean props start with is/has/can
interface ButtonProps {
  isLoading?: boolean;
  isDisabled?: boolean;
  hasIcon?: boolean;
}

// ✅ Good: Event handlers start with on
interface FormProps {
  onSubmit: (data: FormData) => void;
  onChange?: (value: string) => void;
}
```

### Component Organization

```typescript
// 1. Imports (external first, then internal)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/hooks/useUser';

// 2. Types/Interfaces
interface ComponentProps {
  id: string;
}

// 3. Component
export function Component({ id }: ComponentProps) {
  // 3a. Hooks (React hooks first, then custom hooks)
  const [state, setState] = useState('');
  const { data } = useUser(id);

  // 3b. Derived values
  const fullName = `${data?.firstName} ${data?.lastName}`;

  // 3c. Event handlers
  const handleClick = () => {
    setState('clicked');
  };

  // 3d. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 3e. Render
  return <div>{fullName}</div>;
}

// 4. Exports (if additional)
export { type ComponentProps };
```

## Hooks

### Custom Hook Naming

```typescript
// ✅ Good: Always start with 'use'
export function useAccountBalance(accountId: string) {
  return useQuery({
    queryKey: ['account', accountId, 'balance'],
    queryFn: () => getAccountBalance(accountId),
  });
}

// ❌ Bad: Missing 'use' prefix
export function accountBalance(accountId: string) {
  // ...
}
```

### Hook Rules

1. Only call hooks at the top level
2. Only call hooks from React functions
3. Custom hooks must start with 'use'
4. Hooks should have a single responsibility

## State Management

### TanStack Query Keys

```typescript
// ✅ Good: Centralized query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage
useQuery({ queryKey: userKeys.detail(userId), ... });
```

### Zustand Stores

```typescript
// ✅ Good: Separate state and actions
interface Store {
  // State
  count: number;

  // Actions
  increment: () => void;
  reset: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

// ✅ Good: Selector hooks
export const useCount = () => useStore((state) => state.count);
```

## Schemas

### Schema Organization

```typescript
// ✅ Good: Schema first, then inferred type
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;

// ✅ Good: Reusable schemas
export const idSchema = z.string().uuid();
export const emailSchema = z.string().email();

export const userSchema = z.object({
  id: idSchema,
  email: emailSchema,
  name: z.string().min(1),
});
```

### Form Schemas

```typescript
// ✅ Good: Separate form schema from data schema
export const createUserFormSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be 8+ characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
```

## Testing

### Test Organization

```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should do something', () => {
      // Arrange
      const props = { id: '123' };

      // Act
      render(<Component {...props} />);

      // Assert
      expect(screen.getByText('Expected')).toBeInTheDocument();
    });
  });
});
```

### Test Naming

```typescript
// ✅ Good: Descriptive test names
it('should display error message when form submission fails', () => {});
it('should disable submit button when form is invalid', () => {});

// ❌ Bad: Vague test names
it('works correctly', () => {});
it('test form', () => {});
```

## Comments and Documentation

### JSDoc Comments

```typescript
/**
 * Fetches user data by ID with automatic caching
 * @param userId - UUID of the user to fetch
 * @returns Promise resolving to user data
 * @throws ApiError when request fails
 */
export async function getUser(userId: string): Promise<User> {
  // Implementation
}
```

### Inline Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Using setTimeout to avoid race condition with API
setTimeout(() => refetch(), 100);

// ❌ Bad: States the obvious
// Increment counter
counter++;
```

## Import Organization

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party imports (alphabetical)
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';

// 3. Internal imports (alphabetical, grouped by type)
// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Hooks
import { useUser } from '@/lib/hooks/useUser';

// Utils
import { formatCurrency } from '@/lib/utils/format';

// Types
import type { User } from '@/lib/schemas';
```

## Error Handling

### Try-Catch Usage

```typescript
// ✅ Good: Specific error handling
try {
  await submitForm(data);
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
    console.error('Unexpected error:', error);
  }
}

// ❌ Bad: Silent failures
try {
  await submitForm(data);
} catch (error) {
  // Nothing
}
```

## Styling

### Tailwind Classes

```typescript
// ✅ Good: Use cn() utility for conditional classes
<button
  className={cn(
    'px-4 py-2 rounded-md',
    isActive && 'bg-primary text-white',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Click me
</button>

// ❌ Bad: String concatenation
<button
  className={
    'px-4 py-2 rounded-md ' +
    (isActive ? 'bg-primary text-white ' : '') +
    (isDisabled ? 'opacity-50 cursor-not-allowed' : '')
  }
>
  Click me
</button>
```

### Class Organization

```typescript
// ✅ Good: Logical grouping
className="
  // Layout
  flex items-center justify-between
  // Spacing
  px-4 py-2 gap-2
  // Borders & Radius
  border border-gray-200 rounded-md
  // Colors
  bg-white text-gray-900
  // Interactive
  hover:bg-gray-50 focus:ring-2
"
```

## Git Commit Messages

```
feat: add user authentication flow
fix: resolve infinite loop in useEffect
docs: update API documentation
refactor: simplify error handling logic
test: add tests for UserCard component
chore: update dependencies
```

## Code Review Checklist

- [ ] No `any` types used
- [ ] All schemas validated with Zod
- [ ] Tests co-located with components
- [ ] JSDoc comments on public functions
- [ ] No console.log statements (use console.error for errors)
- [ ] No unused imports or variables
- [ ] Follows naming conventions
- [ ] Error handling implemented
- [ ] TypeScript strict mode passes
- [ ] ESLint warnings resolved
