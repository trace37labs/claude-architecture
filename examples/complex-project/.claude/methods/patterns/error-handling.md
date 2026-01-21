# Error Handling Patterns

Consistent error handling patterns for our codebase.

## Core Principle

**Errors should be type-safe, informative, and actionable.**

## Pattern 1: Result Type (Recommended)

Use for operations that can fail predictably.

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Example: User lookup
async function findUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return {
        success: false,
        error: new Error(`User ${id} not found`),
      };
    }
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// Usage
const result = await findUser('123');
if (!result.success) {
  console.error('Failed to find user:', result.error.message);
  return;
}
const user = result.data; // TypeScript knows this is User
```

**Benefits**:
- No thrown exceptions to catch
- Type-safe error handling
- Compiler forces you to handle errors
- Clear success/failure paths

## Pattern 2: Custom Error Types

Define domain-specific errors.

```typescript
// Base error class
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain errors
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} ${id} not found`, 'NOT_FOUND', 404);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public fields: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

// Usage
if (!user) {
  throw new NotFoundError('User', userId);
}

if (!isValidEmail(email)) {
  throw new ValidationError('Invalid input', {
    email: 'Must be a valid email address',
  });
}
```

## Pattern 3: Error Boundaries (React)

Catch rendering errors in React components.

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('React error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Pattern 4: API Error Responses

Standardized error format for HTTP APIs.

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

// Express middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  const response: ApiError = {
    code: err instanceof AppError ? err.code : 'INTERNAL_ERROR',
    message: err.message,
    details: err instanceof ValidationError ? err.fields : undefined,
    timestamp: new Date().toISOString(),
    requestId: req.id, // From request ID middleware
  };

  // Log internal errors
  if (statusCode === 500) {
    console.error('Internal error:', err);
  }

  res.status(statusCode).json(response);
});
```

## Pattern 5: Async Error Handling

Handle promises safely.

```typescript
// Bad: Unhandled promise rejection
async function badExample() {
  const user = await fetchUser(); // Could throw
  return user;
}

// Good: Explicit error handling
async function goodExample(): Promise<Result<User>> {
  try {
    const user = await fetchUser();
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

// Alternative: Use wrapper
function wrapAsync<T>(
  promise: Promise<T>
): Promise<Result<T>> {
  return promise
    .then(data => ({ success: true, data }))
    .catch(error => ({
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    }));
}

// Usage
const result = await wrapAsync(fetchUser());
```

## Pattern 6: Input Validation

Validate early, fail fast.

```typescript
import { z } from 'zod';

// Define schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().min(13).max(120),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Validate in handler
async function createUser(input: unknown): Promise<Result<User>> {
  // Validate first
  const parsed = CreateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: new ValidationError(
        'Invalid input',
        Object.fromEntries(
          parsed.error.errors.map(e => [e.path.join('.'), e.message])
        )
      ),
    };
  }

  // Process valid input
  try {
    const user = await db.user.create({ data: parsed.data });
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}
```

## Anti-Patterns (Avoid These)

### ❌ Silent Failures
```typescript
// Bad: Error is swallowed
try {
  await saveUser(user);
} catch (err) {
  // Nothing happens!
}
```

### ❌ Generic Error Messages
```typescript
// Bad: Not helpful
throw new Error('Something went wrong');

// Good: Specific and actionable
throw new NotFoundError('User', userId);
```

### ❌ String Errors
```typescript
// Bad: Can't catch by type
throw 'User not found';

// Good: Use Error objects
throw new NotFoundError('User', userId);
```

### ❌ Catching Everything
```typescript
// Bad: Hides bugs
try {
  // 100 lines of code
} catch (err) {
  console.log('Error:', err);
}

// Good: Catch specific errors, let others bubble up
try {
  await fetchUser(id);
} catch (err) {
  if (err instanceof NotFoundError) {
    return null; // Expected error
  }
  throw err; // Unexpected error - let it bubble up
}
```

## Checklist

When implementing error handling:
- [ ] Use Result type for predictable failures
- [ ] Define custom error types for domain errors
- [ ] Validate input early with Zod
- [ ] Provide helpful error messages
- [ ] Include relevant context (IDs, values)
- [ ] Log errors with appropriate severity
- [ ] Handle errors at appropriate boundary
- [ ] Don't swallow errors silently
- [ ] Test error paths with unit tests
- [ ] Document error codes in API docs
