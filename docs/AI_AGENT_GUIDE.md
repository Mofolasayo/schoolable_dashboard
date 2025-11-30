# AI Agent Development Guide

This guide helps AI agents (like GitHub Copilot, Claude Code, etc.) write correct, well-structured code for this project. Examples use a generic “account” domain to stay product-agnostic—you can substitute your own entities without changing the underlying patterns.

## Quick Start for AI Agents

When asked to implement a feature, follow this checklist:

1. **Check existing schemas** in `src/lib/schemas/` before creating new types
2. **Use schema-driven development**: Define Zod schema → Infer TypeScript type
3. **Co-locate tests**: Create `Component.test.tsx` alongside `Component.tsx`
4. **Use existing patterns**: Check `src/components/features/example/` for examples
5. **Validate all external data** with Zod schemas
6. **No `any` types allowed**: Use `unknown` or proper generics instead

## Live Browser QA with Chrome DevTools MCP

Use the bundled `chrome-devtools-mcp` server when you want the agent to inspect a real browser session.

1. Start the app locally with `pnpm dev`.
2. In a second terminal run `pnpm mcp:devtools`. The first run downloads a managed Chrome build; allow a few minutes.
3. Point your MCP client to the workspace command. Example Claude Code `.claude/config.json` entry:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "pnpm",
      "args": ["mcp:devtools"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

4. Once connected, ask the agent to open `http://localhost:3000`, click through flows, capture screenshots, or record traces.

> **Note:** `chrome-devtools-mcp` requires Node.js v20.19.0 or later and Google Chrome on your machine. Upgrade Node if the server refuses to start.

## Project Structure Reference

```
src/
├── app/                    → Next.js pages
├── components/
│   ├── ui/                → Shadcn components (don't edit)
│   ├── features/          → Feature components (add here)
│   └── layouts/           → Layout components
├── lib/
│   ├── api/              → API client & endpoints
│   ├── hooks/            → Custom hooks with TanStack Query
│   ├── schemas/          → Zod schemas (START HERE)
│   ├── store/            → Zustand stores
│   └── utils/            → Utilities
├── types/                → TypeScript types
└── config/               → Configuration
```

## Decision Trees for Common Tasks

### When Adding a New Feature

```
1. Do I need data from an API?
   YES → Go to "Adding API Integration"
   NO  → Go to step 2

2. Do I need a form?
   YES → Go to "Creating a Form"
   NO  → Go to step 3

3. Do I need to share state across components?
   YES → Go to "Adding State Management"
   NO  → Create a simple component
```

### Adding API Integration

**Step 1: Define Schema** (`src/lib/schemas/[feature].schema.ts`)

```typescript
import { z } from 'zod';

export const accountSchema = z.object({
  id: z.string().uuid(),
  balance: z.number(),
  currency: z.string(),
});

export type Account = z.infer<typeof accountSchema>;
```

**Step 2: Create API Endpoint** (`src/lib/api/endpoints/[feature].ts`)

```typescript
import { apiClient } from '../client';
import { accountSchema, type Account } from '@/lib/schemas';

export async function getAccount(id: string): Promise<Account> {
  const response = await apiClient<{ data: Account }>(`/accounts/${id}`);
  return accountSchema.parse(response.data);
}
```

**Step 3: Create Hook** (`src/lib/hooks/use[Feature].ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { getAccount } from '../api/endpoints/account';

export const accountKeys = {
  all: ['accounts'] as const,
  detail: (id: string) => [...accountKeys.all, id] as const,
};

export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => getAccount(id),
    enabled: !!id,
  });
}
```

**Step 4: Use in Component**

```typescript
'use client';

import { useAccount } from '@/lib/hooks/useAccount';

export function AccountDisplay({ id }: { id: string }) {
  const { data, isLoading, error } = useAccount(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>Balance: {data.balance}</div>;
}
```

### Creating a Form

**Step 1: Define Form Schema** (`src/lib/schemas/[feature].schema.ts`)

```typescript
export const createAccountFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  currency: z.enum(['USD', 'EUR', 'GBP'], {
    errorMap: () => ({ message: 'Please select a currency' }),
  }),
});

export type CreateAccountForm = z.infer<typeof createAccountFormSchema>;
```

**Step 2: Create Form Component** (`src/components/features/account/CreateAccountForm.tsx`)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountFormSchema, type CreateAccountForm } from '@/lib/schemas';

export function CreateAccountForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountFormSchema),
  });

  const onSubmit = async (data: CreateAccountForm) => {
    // Handle submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Name</label>
        <input {...register('name')} id="name" />
        {errors.name && <p>{errors.name.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

**Step 3: Create Test** (`CreateAccountForm.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { CreateAccountForm } from './CreateAccountForm';

describe('CreateAccountForm', () => {
  it('should show validation error for short name', async () => {
    const user = userEvent.setup();
    render(<CreateAccountForm />);

    await user.type(screen.getByLabelText(/name/i), 'A');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(
      await screen.findByText(/name must be at least 2 characters/i)
    ).toBeInTheDocument();
  });
});
```

### Adding State Management

**For Server State (API data)** → Use TanStack Query (see "Adding API Integration")

**For Client State (UI state, preferences)** → Use Zustand:

**Step 1: Create Store** (`src/lib/store/[feature]Store.ts`)

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AccountStore {
  selectedAccountId: string | null;
  setSelectedAccount: (id: string | null) => void;
}

export const useAccountStore = create<AccountStore>()(
  devtools(
    (set) => ({
      selectedAccountId: null,
      setSelectedAccount: (id) => set({ selectedAccountId: id }),
    }),
    { name: 'AccountStore' }
  )
);
```

**Step 2: Use in Component**

```typescript
import { useAccountStore } from '@/lib/store/accountStore';

export function AccountSelector() {
  const selectedId = useAccountStore((state) => state.selectedAccountId);
  const setSelected = useAccountStore((state) => state.setSelectedAccount);

  return (
    <button onClick={() => setSelected('account-123')}>
      Select Account
    </button>
  );
}
```

## Common Patterns & Anti-Patterns

### ✅ DO: Use Schema-Driven Development

```typescript
// 1. Define schema
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

// 2. Infer type
export type User = z.infer<typeof userSchema>;

// 3. Validate at runtime
const user = userSchema.parse(apiResponse);
```

### ❌ DON'T: Define types separately

```typescript
// ❌ Bad: Duplicate source of truth
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export interface User {
  id: string;
  name: string;
}
```

### ✅ DO: Validate External Data

```typescript
export async function getUser(id: string): Promise<User> {
  const response = await apiClient(`/users/${id}`);
  return userSchema.parse(response.data); // ✅ Validates!
}
```

### ❌ DON'T: Trust external data

```typescript
export async function getUser(id: string): Promise<User> {
  const response = await apiClient(`/users/${id}`);
  return response.data as User; // ❌ No validation!
}
```

### ✅ DO: Co-locate tests

```
components/features/account/
├── AccountCard.tsx
├── AccountCard.test.tsx  ✅
└── README.md
```

### ❌ DON'T: Separate test directories

```
src/components/AccountCard.tsx
tests/components/AccountCard.test.tsx  ❌
```

### ✅ DO: Use explicit types

```typescript
function processUser(user: User): string {
  return user.name;
}
```

### ❌ DON'T: Use any

```typescript
function processUser(user: any): string {
  // ❌
  return user.name;
}
```

## Error Prevention Checklist

Before generating code, verify:

- [ ] **Schema exists**: Check `src/lib/schemas/` for existing schemas
- [ ] **Types are inferred**: Use `z.infer<typeof schema>`, not manual types
- [ ] **Data is validated**: All API responses validated with `.parse()`
- [ ] **No any types**: Use `unknown` or generics instead
- [ ] **Tests co-located**: Create `.test.tsx` next to component
- [ ] **Imports are correct**: Use `@/` aliases, not relative paths
- [ ] **Props are typed**: Define interface for component props
- [ ] **Hooks follow rules**: Start with `use`, call at top level only

## File Templates

### New Feature Component

```typescript
// src/components/features/[feature]/[Component].tsx
'use client';

import { useState } from 'react';
import type { Feature } from '@/lib/schemas';

interface ComponentProps {
  feature: Feature;
  onAction?: () => void;
}

/**
 * [Component description]
 * @param feature - [Description]
 * @param onAction - [Description]
 */
export function Component({ feature, onAction }: ComponentProps) {
  const [state, setState] = useState('');

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### New API Endpoint

```typescript
// src/lib/api/endpoints/[feature].ts
import { apiClient } from '../client';
import { featureSchema, type Feature } from '@/lib/schemas';
import type { ApiResponse } from '@/types';

/**
 * Fetches feature by ID
 * @param id - Feature ID
 * @returns Promise with validated feature data
 * @throws ApiError on request failure
 */
export async function getFeature(id: string): Promise<Feature> {
  const response = await apiClient<ApiResponse<Feature>>(`/features/${id}`);
  return featureSchema.parse(response.data);
}
```

### New Hook

```typescript
// src/lib/hooks/use[Feature].ts
import { useQuery } from '@tanstack/react-query';
import { getFeature } from '../api/endpoints/feature';

export const featureKeys = {
  all: ['features'] as const,
  detail: (id: string) => [...featureKeys.all, id] as const,
};

/**
 * Hook to fetch feature data with automatic caching
 * @param id - Feature ID to fetch
 * @returns TanStack Query result with feature data
 */
export function useFeature(id: string) {
  return useQuery({
    queryKey: featureKeys.detail(id),
    queryFn: () => getFeature(id),
    enabled: !!id,
  });
}
```

## Testing Guidelines

### What to Test

1. **Component Rendering**: Does it render correctly?
2. **User Interactions**: Do click/type events work?
3. **Validation**: Are forms validated correctly?
4. **Error States**: Are errors displayed properly?
5. **Loading States**: Do loading indicators show?

### What NOT to Test

1. **Shadcn UI components**: Already tested
2. **Third-party libraries**: Already tested
3. **Implementation details**: Test behavior, not implementation

### Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Component } from './Component';

describe('Component', () => {
  it('should render successfully', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<Component />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

## When in Doubt

1. **Check examples**: Look at `src/components/features/example/`
2. **Read conventions**: See `docs/CONVENTIONS.md`
3. **Follow architecture**: See `docs/ARCHITECTURE.md`
4. **Ask for clarification**: Better to ask than to guess

## Summary: The Golden Rules

1. **Schema First**: Always define Zod schemas before types
2. **Validate Everything**: Never trust external data
3. **No Any**: Use proper types or `unknown`
4. **Co-locate Tests**: Tests live next to code
5. **Use Examples**: Follow existing patterns
6. **Document Public APIs**: Add JSDoc comments
7. **Type Everything**: Explicit is better than implicit
8. **Handle Errors**: Never fail silently
