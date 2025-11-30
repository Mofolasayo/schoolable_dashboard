# Example Feature

This directory contains an example implementation demonstrating best practices for organizing feature components.

## Structure

```
example/
├── ExampleForm.tsx       # Main component
├── ExampleForm.test.tsx  # Component tests
└── README.md            # This file
```

## Patterns Demonstrated

### 1. Schema-Driven Forms

- Uses Zod schema from `@/lib/schemas`
- Type-safe form validation with React Hook Form
- Single source of truth for validation rules

### 2. Co-located Tests

- Tests live next to the components they test
- Easy to find and maintain
- Encourages test-driven development

### 3. Component Documentation

- JSDoc comments for props and functions
- Clear naming conventions
- Self-documenting code

## Usage

```tsx
import { ExampleForm } from '@/components/features/example/ExampleForm';

export default function Page() {
  return <ExampleForm />;
}
```

## Testing

```bash
# Run tests for this feature
pnpm test ExampleForm

# Run tests in watch mode
pnpm test ExampleForm --watch

# Run with coverage
pnpm test ExampleForm --coverage
```

## When to Create a New Feature

Create a new feature directory when:

- The component is tied to a specific business feature
- It has multiple related components
- It requires its own state management
- It has complex business logic

Keep it simple - not every component needs to be a "feature".
