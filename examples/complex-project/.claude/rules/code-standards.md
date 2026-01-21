# Code Standards

## Language & Framework

- TypeScript 5.x required for all code
- Node.js 18+ LTS version
- React 18+ for frontend components
- Next.js 14+ for server-side rendering

## Code Style

### Formatting
- Use Prettier with project config
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in multiline
- Max line length: 100 characters

### Naming Conventions
- `camelCase` for variables and functions
- `PascalCase` for classes and components
- `UPPER_SNAKE_CASE` for constants
- `kebab-case` for file names
- Meaningful names (avoid single letters except loop counters)

### File Organization
```
src/
├── components/      # React components (one per file)
├── hooks/           # Custom React hooks
├── utils/           # Pure utility functions
├── services/        # API and external service clients
├── types/           # TypeScript type definitions
└── tests/           # Test files (*.test.ts)
```

## Code Quality

### Functions
- Single responsibility principle
- Max 50 lines per function
- Max 4 parameters (use options object if more)
- Pure functions when possible
- Document complex logic with comments

### Complexity
- Cyclomatic complexity < 10
- Nesting depth < 4 levels
- No duplicate code (DRY principle)
- Extract magic numbers to named constants

### Error Handling
- Never swallow errors silently
- Always provide context in error messages
- Use custom error types for domain errors
- Propagate errors up, handle at boundaries

## Documentation

### Code Comments
- JSDoc for all public APIs
- Explain WHY, not WHAT (code should be self-explanatory)
- TODO comments must include ticket number
- Keep comments up to date with code

### README Files
- Every directory with 3+ files needs README.md
- Include purpose, usage examples, and gotchas
- Link to relevant docs and tickets

## Testing

- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user paths
- Coverage minimum: 80% overall, 100% for core modules

## Performance

- Lazy load components where possible
- Debounce user input handlers
- Memoize expensive computations
- Optimize images (WebP format, max 500KB)
- Monitor bundle size (< 200KB gzipped)
