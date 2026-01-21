# Methods Layer

> **Layer 3**: Workflows, patterns, and how-to guides

## Feature Development Workflow

1. **Plan**: Create issue with acceptance criteria
2. **Branch**: Create feature branch from main
3. **TDD**: Write tests first
4. **Implement**: Write minimal code to pass tests
5. **Review**: Self-review and refactor
6. **PR**: Create pull request with description
7. **Merge**: Squash and merge after approval

## Error Handling Pattern

```typescript
// Always use Result type for operations that can fail
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User, Error>> {
  try {
    const user = await db.users.findUnique({ where: { id } });
    if (!user) {
      return { success: false, error: new Error('User not found') };
    }
    return { success: true, value: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Testing Strategy

- **Unit tests**: All business logic
- **Integration tests**: API endpoints
- **E2E tests**: Critical user flows
- **Coverage target**: 80% minimum

## Code Review Checklist

- [ ] Tests pass locally
- [ ] Coverage maintained or improved
- [ ] No console.log statements
- [ ] Error handling in place
- [ ] TypeScript types correct
- [ ] Documentation updated
- [ ] No TODOs left unresolved
