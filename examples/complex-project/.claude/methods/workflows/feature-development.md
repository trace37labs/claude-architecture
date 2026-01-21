# Feature Development Workflow

This workflow covers the complete lifecycle of developing a new feature, from planning to deployment.

## Phase 1: Planning (Day 1)

### 1.1 Create Issue
- Title: Clear, specific description
- Labels: `feature`, priority level, component
- Milestone: Target release version
- Acceptance criteria: Specific, measurable, testable

### 1.2 Design Review
- Sketch UI mockups (Figma)
- Define API contracts (OpenAPI spec)
- Identify edge cases
- Estimate complexity (story points)

### 1.3 Technical Spike (if needed)
- Research unknowns
- Prototype complex parts
- Evaluate libraries/tools
- Document findings

## Phase 2: Development (Days 2-5)

### 2.1 Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/ticket-123-user-authentication
```

### 2.2 Test-Driven Development
For each component:
1. Write failing test
2. Write minimal code to pass
3. Refactor
4. Commit

**Example TDD cycle**:
```typescript
// 1. Write test
describe('UserAuth', () => {
  it('should validate email format', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('user@example.com')).toBe(true);
  });
});

// 2. Implement
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 3. Refactor if needed
```

### 2.3 Implementation Checklist
- [ ] Core functionality implemented
- [ ] Error handling added
- [ ] Input validation in place
- [ ] TypeScript types defined
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests for APIs
- [ ] Documentation updated
- [ ] No linter warnings

### 2.4 Local Testing
```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run type-check

# Build
npm run build
```

## Phase 3: Review (Day 6)

### 3.1 Self-Review
Before creating PR:
- Review every changed line
- Remove debug code
- Check for hardcoded values
- Verify comments are accurate
- Test manually in UI

### 3.2 Create Pull Request
**Title**: `[Ticket-123] Add user authentication`

**Description template**:
```markdown
## Problem
Users need to log in to access protected resources.

## Solution
- Implemented JWT-based authentication
- Added login/logout endpoints
- Created auth middleware for protected routes

## Testing
- ✅ Unit tests for auth service
- ✅ Integration tests for login flow
- ✅ Manual testing in dev environment

## Screenshots
[Attach login page screenshot]

## Checklist
- [x] Tests pass locally
- [x] Coverage maintained at 80%+
- [x] Documentation updated
- [x] No console.log statements
- [x] Types are correct

Refs: #123
```

### 3.3 Address Review Feedback
- Respond to all comments
- Make requested changes
- Re-request review
- Don't take feedback personally!

## Phase 4: Deployment (Day 7)

### 4.1 Merge
```bash
# Squash commits
git checkout feature/ticket-123-user-authentication
git rebase -i main  # Squash to 1-2 commits

# Merge via GitHub
# (GitHub will auto-deploy to staging)
```

### 4.2 Staging Verification
- Test in staging environment
- Verify with product owner
- Run smoke tests
- Check performance metrics

### 4.3 Production Deployment
1. Create release PR: `release/v1.2.0`
2. Update CHANGELOG.md
3. Bump version in package.json
4. Get approval from 2 reviewers
5. Deploy during low-traffic window
6. Monitor metrics for 1 hour

### 4.4 Post-Deployment
- Update ticket status to "Done"
- Notify stakeholders
- Document any issues
- Celebrate! 🎉

## Common Issues

### Merge Conflicts
```bash
git checkout main
git pull origin main
git checkout feature/ticket-123-user-authentication
git rebase main
# Resolve conflicts
git rebase --continue
```

### Failed CI Checks
- Read error message carefully
- Fix locally and test
- Push again
- Don't ignore warnings

### Scope Creep
- Stay focused on original acceptance criteria
- Create new tickets for additional features
- Discuss with PM before expanding scope

## Metrics

**Success criteria**:
- Feature completed within 7 days
- Zero bugs reported in first week
- Test coverage maintained above 80%
- Performance within SLA (<200ms API response)
