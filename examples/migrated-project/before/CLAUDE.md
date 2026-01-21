# Claude Configuration (Old Format)

## Project Overview

This is a TypeScript CLI tool for processing data files. Built with Node.js 18+ and uses PostgreSQL for storage.

## Security Rules

- Never expose database credentials in code
- Validate all user input before processing
- Use parameterized queries to prevent SQL injection
- All API keys must be in environment variables

## MCP Servers

We use the following MCP servers:
- `filesystem` - for reading/writing files
- `database` - PostgreSQL connection
- `git` - version control operations

## Workflows

### Feature Development
1. Create branch from main
2. Write tests first (TDD)
3. Implement feature
4. Create pull request
5. Get approval
6. Merge to main

### Error Handling
Always use try/catch blocks and provide meaningful error messages. Log errors with appropriate severity.

## Architecture

### Tech Stack
- Language: TypeScript 5.x
- Runtime: Node.js 18 LTS
- Database: PostgreSQL 15
- ORM: Prisma

### Directory Structure
```
src/
├── commands/    # CLI commands
├── lib/         # Business logic
└── utils/       # Helpers
```

## Code Standards

- Use TypeScript for all code
- Follow ESLint configuration
- Max 50 lines per function
- 80% test coverage required
- Use meaningful variable names

## Current Goals

### This Week
- Add CSV export functionality
- Fix bug in validation logic
- Improve error messages
- Write documentation

### Next Sprint
- Add support for JSON input format
- Optimize database queries
- Set up CI/CD pipeline

## Commands

### /test
Run the test suite with coverage

### /build
Compile TypeScript to JavaScript

### /deploy
Deploy to production (staging first)

## Dependencies

Main dependencies:
- commander: CLI framework
- chalk: Terminal colors
- zod: Schema validation
- prisma: Database ORM

## Glossary

- **CLI**: Command-Line Interface
- **ORM**: Object-Relational Mapping
- **TDD**: Test-Driven Development

## Process

All code must be reviewed before merge. Commits should follow conventional commits format: `type(scope): message`

## Database

PostgreSQL connection details in `.env`:
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD

Never commit `.env` file!

## Testing

Run tests before every commit:
```bash
npm test
npm run test:coverage
```

All tests must pass. Coverage should not decrease.

## Deployment

Production deploys require approval. Always deploy to staging first and verify manually.

## TODO

- [ ] Add batch processing mode
- [ ] Implement progress indicators
- [ ] Add support for YAML config files
- [ ] Create Docker container
- [ ] Write API documentation
