# Custom Commands

This directory contains definitions for custom slash commands available in Claude Code.

## Available Commands

### `/test [filter]`
Run the test suite with optional filter

**Usage**:
```
/test                 # Run all tests
/test user            # Run tests matching "user"
/test --watch         # Run in watch mode
```

**Implementation**: Executes `npm test` with appropriate flags

---

### `/deploy [environment]`
Deploy to specified environment

**Usage**:
```
/deploy staging       # Deploy to staging
/deploy production    # Deploy to production (requires approval)
```

**Requirements**:
- All tests must pass
- Production deploys require manual approval
- Sends notification to #deployments Slack channel

---

### `/review`
Start an interactive code review session

**Usage**:
```
/review               # Review current changes
/review --full        # Review entire codebase
```

**Checks**:
- Code style compliance
- Test coverage
- Security vulnerabilities
- Performance issues
- Documentation completeness

---

### `/migrate [action]`
Database migration commands

**Usage**:
```
/migrate create name  # Create new migration
/migrate up           # Run pending migrations
/migrate down         # Rollback last migration
/migrate status       # Check migration status
```

---

### `/docs [topic]`
Search and display project documentation

**Usage**:
```
/docs api             # Show API documentation
/docs architecture    # Show architecture overview
/docs deploy          # Show deployment guide
```

---

### `/issue [action]`
GitHub issue management

**Usage**:
```
/issue create         # Create new issue
/issue list           # List open issues
/issue assign 123     # Assign issue to yourself
```

---

## Adding New Commands

To add a custom command:

1. Create a new file in this directory: `command-name.md`
2. Document the command syntax and behavior
3. Implement the command handler in `src/commands/`
4. Add tests in `tests/commands/`
5. Update this README

## Command Conventions

- Use imperative mood ("deploy", not "deploys")
- Include help text with `--help` flag
- Return meaningful exit codes (0 = success, 1 = error)
- Support both interactive and non-interactive modes
- Log all actions for audit trail
