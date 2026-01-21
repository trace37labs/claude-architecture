# Process Rules

## Git Workflow

### Branching Strategy
- `main` branch is always deployable
- Feature branches: `feature/ticket-123-description`
- Bugfix branches: `bugfix/ticket-456-description`
- Hotfix branches: `hotfix/critical-issue`
- Release branches: `release/v1.2.0`

### Commit Messages
Follow Conventional Commits format:
```
type(scope): subject

Body explaining what and why

Refs: #ticket-number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Requests
- Title: `[Ticket-123] Brief description`
- Description must include:
  - Problem being solved
  - Solution approach
  - Testing done
  - Screenshots (for UI changes)
- Link to ticket
- Request review from at least 2 team members
- All CI checks must pass before merge

## Code Review

### Reviewer Responsibilities
- Review within 24 hours
- Check for correctness, maintainability, security
- Test locally if uncertain
- Provide constructive feedback
- Approve only if you would merge it yourself

### Author Responsibilities
- Keep PRs small (< 400 lines changed)
- Self-review before requesting review
- Address all feedback or explain why not
- Resolve conflicts promptly
- Squash commits before merge

## Testing

### Before Commit
- Run full test suite locally
- Run linter and fix all warnings
- Check test coverage didn't decrease
- Manual smoke test for UI changes

### CI Pipeline
All PRs must pass:
1. Build (TypeScript compilation)
2. Lint (ESLint + Prettier)
3. Unit tests (Vitest)
4. Integration tests
5. E2E tests (Playwright)
6. Security scan (npm audit)

## Deployment

### Environments
- **Development**: Auto-deploy from `develop` branch
- **Staging**: Auto-deploy from `main` branch
- **Production**: Manual approval required

### Release Process
1. Create release branch from `main`
2. Update CHANGELOG.md
3. Bump version in package.json
4. Create GitHub release with notes
5. Tag release: `v1.2.0`
6. Deploy to production
7. Monitor for 1 hour post-deployment

### Rollback Procedure
If critical issue detected:
1. Revert to previous version (< 5 minutes)
2. Notify team in #incidents
3. Create hotfix branch
4. Fix and fast-track review
5. Deploy hotfix
6. Post-mortem within 48 hours

## Communication

### Daily Standup
- 15 minutes max
- What did I do yesterday?
- What will I do today?
- Any blockers?

### Sprint Planning
- Every 2 weeks
- Review backlog
- Estimate story points
- Commit to sprint goals

### Retrospectives
- End of each sprint
- What went well?
- What could improve?
- Action items assigned
