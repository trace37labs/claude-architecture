# Rules Layer

> Automatically migrated from CLAUDE.md

## Security Rules

- Never expose database credentials in code
- Validate all user input before processing
- Use parameterized queries to prevent SQL injection
- All API keys must be in environment variables

## Code Standards

- Use TypeScript for all code
- Follow ESLint configuration
- Max 50 lines per function
- 80% test coverage required
- Use meaningful variable names

## Process

All code must be reviewed before merge. Commits should follow conventional commits format: `type(scope): message`

## Testing

Run tests before every commit:
```bash
npm test
npm run test:coverage
```

All tests must pass. Coverage should not decrease.

## Database Security

PostgreSQL connection details in `.env`:
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD

**Never commit `.env` file!**

## Deployment Rules

Production deploys require approval. Always deploy to staging first and verify manually.
