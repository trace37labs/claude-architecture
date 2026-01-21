# Rules Layer

> **Layer 1**: Constraints, security, and non-negotiable guidelines

## Security

- Never expose API keys or credentials in code
- Always validate user input before processing
- Use parameterized queries for database operations
- Follow OWASP Top 10 security guidelines

## Code Standards

- Use TypeScript for type safety
- Write tests for all public APIs
- Follow ESLint configuration
- Keep functions under 50 lines

## Process

- All changes require passing tests
- Code review required for main branch
- Commits must follow conventional commits format
- No force pushes to main branch

## Output Constraints

- Always provide clear error messages
- Include stack traces in development mode only
- Log all errors with appropriate severity levels
- Never log sensitive user data
