# Best Practices

> Recommended patterns for organizing and maintaining your Claude configuration.

## Table of Contents

- [Organization](#organization)
- [Layer-Specific Guidance](#layer-specific-guidance)
- [Scope Management](#scope-management)
- [File Structure](#file-structure)
- [Content Guidelines](#content-guidelines)
- [Team Collaboration](#team-collaboration)
- [Maintenance](#maintenance)
- [Performance](#performance)

---

## Organization

### Start Simple, Grow as Needed

**Principle**: Don't over-engineer from day one.

**Recommended progression**:

1. **Start minimal** (solo projects, prototypes):
   ```
   .claude/
   ├── rules.md          # Single file
   ├── tools.md          # Single file
   ├── methods.md        # Single file
   ├── knowledge.md      # Single file
   └── goals.md          # Single file
   ```

2. **Expand when files grow** (>200 lines):
   ```
   .claude/
   ├── rules/
   │   ├── security.md
   │   └── code-standards.md
   ├── methods/
   │   ├── workflows.md
   │   └── patterns.md
   ...
   ```

3. **Fully structured** (large teams, complex projects):
   ```
   .claude/
   ├── rules/
   │   ├── security/
   │   ├── code-standards/
   │   └── process/
   ├── methods/
   │   ├── workflows/
   │   ├── patterns/
   │   └── templates/
   ...
   ```

**Why**: Avoid premature complexity. Structure should match project needs.

---

### One Topic Per File

**Good** (focused files):
```
.claude/methods/
├── deployment.md      # Only deployment workflow
├── testing.md         # Only testing patterns
└── code-review.md     # Only code review process
```

**Bad** (mixed concerns):
```
.claude/methods/
└── everything.md      # Deployment + testing + review + ... (500 lines)
```

**Why**: Easier to find, edit, and maintain specific topics.

---

### Use Descriptive Names

**Good**:
```
api-authentication-flow.md
database-migration-process.md
user-onboarding-workflow.md
```

**Bad**:
```
flow.md
process.md
workflow.md
```

**Why**: Names should be self-documenting. Avoid generic names.

---

### Keep Hierarchy Shallow

**Good** (2 levels):
```
.claude/methods/
├── workflows/
│   ├── feature-development.md
│   └── bug-fixing.md
└── patterns/
    ├── api-design.md
    └── error-handling.md
```

**Bad** (4 levels):
```
.claude/methods/
└── development/
    └── workflows/
        └── feature/
            └── development.md     # Too deep!
```

**Why**: Deep hierarchies are hard to navigate. Aim for 2-3 levels max.

---

## Layer-Specific Guidance

### Layer 1: RULES

**Purpose**: Constraints, limits, non-negotiables

**Best practices**:

1. **Be absolute**: Rules should be unambiguous
   - ✓ "Never commit API keys to git"
   - ✗ "Try not to commit API keys"

2. **Explain why**: Add context
   ```markdown
   ## No Hardcoded Secrets

   Never commit API keys, passwords, or tokens to the repository.

   **Why**: Prevents security breaches and credential leaks.

   **How**: Use environment variables or secret management tools.
   ```

3. **Keep rules minimal**: Only add rules that are truly non-negotiable
   - Too many rules → ignored
   - Too few rules → ambiguity

4. **Organize by category**:
   ```
   rules/
   ├── security.md        # Security constraints
   ├── code-standards.md  # Code quality rules
   ├── process.md         # Development process rules
   └── legal.md           # Legal/compliance rules
   ```

5. **Use checklists**:
   ```markdown
   ## Pre-Commit Checklist

   - [ ] No hardcoded secrets
   - [ ] Tests pass
   - [ ] Code is formatted
   - [ ] Commit message follows convention
   ```

---

### Layer 2: TOOLS

**Purpose**: Available capabilities (MCP servers, commands, APIs)

**Best practices**:

1. **Use structured format for MCP servers** (YAML):
   ```yaml
   # .claude/tools/mcp.yaml
   servers:
     - name: github
       description: GitHub repository operations
       command: npx
       args: ["-y", "@modelcontextprotocol/server-github"]

     - name: postgres
       description: Database operations
       command: docker
       args: ["run", "postgres-mcp-server"]
   ```

2. **Document tool usage**:
   ```markdown
   # .claude/tools/commands.md

   ## Deployment Command

   **Usage**: `npm run deploy`

   **What it does**:
   - Builds production bundle
   - Runs tests
   - Deploys to staging
   - Requires approval for production

   **Prerequisites**:
   - AWS credentials configured
   - Clean git working directory
   ```

3. **Group related tools**:
   ```
   tools/
   ├── mcp.yaml           # All MCP servers
   ├── deployment/        # Deployment tools
   ├── testing/           # Testing tools
   └── development/       # Dev environment tools
   ```

4. **Include examples**:
   ```markdown
   ## GitHub CLI

   **Example**: Create a PR
   ```bash
   gh pr create --title "feat: add authentication" --body "..."
   ```
   ```

---

### Layer 3: METHODS

**Purpose**: How to do things (workflows, patterns, processes)

**Best practices**:

1. **Use step-by-step format**:
   ```markdown
   ## Feature Development Workflow

   1. Create feature branch: `git checkout -b feature/name`
   2. Write failing tests first (TDD)
   3. Implement feature
   4. Ensure all tests pass
   5. Create PR with template
   6. Request review from 2 team members
   7. Address feedback
   8. Merge when approved
   ```

2. **Separate workflows and patterns**:
   ```
   methods/
   ├── workflows/         # Processes to follow
   │   ├── feature.md
   │   ├── bugfix.md
   │   └── hotfix.md
   └── patterns/          # Reusable code patterns
       ├── api-design.md
       ├── error-handling.md
       └── testing.md
   ```

3. **Include decision trees**:
   ```markdown
   ## When to Create a New Branch

   - New feature? → Create feature/name branch
   - Bug fix? → Create bugfix/issue-number branch
   - Hotfix? → Create hotfix/critical branch from main
   - Experiment? → Create experiment/name branch
   ```

4. **Link to tools**:
   ```markdown
   ## Deployment Workflow

   1. Run tests: `npm test` (see [tools/testing.md](../tools/testing.md))
   2. Build: `npm run build`
   3. Deploy: `npm run deploy` (see [tools/deployment.md](../tools/deployment.md))
   ```

5. **Show before/after examples**:
   ```markdown
   ## Error Handling Pattern

   **Before** (bad):
   ```javascript
   function getData() {
     return fetch('/api/data').json()  // No error handling
   }
   ```

   **After** (good):
   ```javascript
   async function getData() {
     try {
       const response = await fetch('/api/data')
       if (!response.ok) throw new Error('Failed to fetch')
       return await response.json()
     } catch (error) {
       console.error('Error fetching data:', error)
       return null
     }
   }
   ```
   ```

---

### Layer 4: KNOWLEDGE

**Purpose**: Context, documentation, domain information

**Best practices**:

1. **Start with overview**:
   ```markdown
   # .claude/knowledge/overview.md

   # Project Overview

   **What**: E-commerce platform for sustainable products
   **Why**: Help consumers find eco-friendly alternatives
   **Who**: Small businesses and conscious consumers
   **Tech**: React, Node.js, PostgreSQL
   ```

2. **Document architecture**:
   ```markdown
   # .claude/knowledge/architecture.md

   # System Architecture

   ## High-Level Design
   [Diagram or description]

   ## Components
   - Frontend: React SPA (port 3000)
   - Backend: Express API (port 4000)
   - Database: PostgreSQL (port 5432)
   - Cache: Redis (port 6379)

   ## Data Flow
   User → Frontend → API → Database → Cache
   ```

3. **Maintain glossary**:
   ```markdown
   # .claude/knowledge/glossary.md

   # Terminology

   **SKU**: Stock Keeping Unit, unique product identifier
   **Cart**: User's temporary product selection
   **Order**: Finalized purchase transaction
   ```

4. **Use Architecture Decision Records (ADRs)**:
   ```markdown
   # .claude/knowledge/decisions/001-use-postgresql.md

   # ADR 001: Use PostgreSQL for Database

   **Status**: Accepted
   **Date**: 2025-01-15
   **Deciders**: Engineering team

   ## Context
   We need a database for e-commerce transactions.

   ## Decision
   Use PostgreSQL over MongoDB.

   ## Rationale
   - ACID compliance for transactions
   - Strong relational data model
   - Mature ecosystem

   ## Consequences
   - Pros: Data integrity, SQL queries
   - Cons: Slightly slower for document storage
   ```

5. **Link to external docs**:
   ```markdown
   ## API Documentation

   Full API reference: https://api-docs.example.com

   Quick reference:
   - `/auth/login` - User authentication
   - `/products` - Product catalog
   - `/orders` - Order management
   ```

---

### Layer 5: GOALS

**Purpose**: Current objectives, tasks, success criteria

**Best practices**:

1. **Keep current goals active**:
   ```markdown
   # .claude/goals/current.md

   # Current Sprint (Jan 15-29, 2025)

   ## Objectives
   1. Implement user authentication
   2. Add password reset flow
   3. Write integration tests

   ## Success Criteria
   - [ ] Users can sign up and log in
   - [ ] Password reset email works
   - [ ] Test coverage >80%
   ```

2. **Archive completed goals**:
   ```
   goals/
   ├── current.md          # Active goals
   ├── backlog.md          # Future goals
   └── archive/
       ├── 2025-01-sprint1.md
       └── 2025-01-sprint2.md
   ```

3. **Use measurable criteria**:
   - ✓ "Reduce page load time to <2s"
   - ✗ "Make the site faster"

4. **Break down into tasks**:
   ```markdown
   ## Goal: User Authentication

   **Tasks**:
   1. Design database schema for users table
   2. Implement registration endpoint
   3. Implement login endpoint
   4. Add JWT token generation
   5. Create protected routes middleware
   6. Write integration tests
   7. Add error handling

   **Owner**: @alice
   **Due**: Jan 22, 2025
   ```

5. **Link to methods**:
   ```markdown
   ## Goal: Deploy to Production

   **Workflow**: See [methods/workflows/deployment.md](../methods/workflows/deployment.md)

   **Checklist**:
   - [ ] All tests passing
   - [ ] Code reviewed
   - [ ] Security scan passed
   - [ ] Staging validated
   ```

---

## Scope Management

### Project vs User Scope

**Project scope** (.claude/ in repository):
- Team-shared configuration
- Project-specific rules, workflows, architecture
- Committed to git

**User scope** (~/.claude/ in home directory):
- Personal preferences
- API keys (gitignored)
- Individual tools and workflows
- NOT committed to git

### What Goes in Each Scope

| Content Type | Project Scope | User Scope |
|--------------|---------------|------------|
| Security rules | ✓ Team rules | ✓ Personal additions |
| Code standards | ✓ Team standards | ✓ Personal style |
| MCP servers | ✓ Shared tools | ✓ Personal tools |
| API keys | ✗ NEVER | ✓ Personal credentials |
| Workflows | ✓ Team processes | ✓ Personal shortcuts |
| Architecture | ✓ Project docs | ✗ Not needed |
| Sprint goals | ✓ Team objectives | ✗ Not needed |
| Personal notes | ✗ Not shared | ✓ Private context |

### User Scope Best Practices

1. **Keep secrets in user scope** (never commit):
   ```
   ~/.claude/
   └── tools/
       └── credentials.yaml   # API keys, tokens
   ```

2. **Add to .gitignore**:
   ```gitignore
   # Never commit personal config
   ~/.claude/tools/credentials.yaml
   ```

3. **Use environment variables**:
   ```yaml
   # ~/.claude/tools/credentials.yaml
   api_keys:
     openai: ${OPENAI_API_KEY}
     github: ${GITHUB_TOKEN}
   ```

4. **Document what's personal**:
   ```markdown
   # ~/.claude/methods.md

   # Personal Workflow

   This is my personal workflow. Team workflow is in project config.
   ```

---

## File Structure

### File Naming

**Good**:
- kebab-case: `feature-development.md`
- Descriptive: `api-authentication-flow.md`
- Specific: `postgres-connection-pooling.md`

**Bad**:
- camelCase: `featureDevelopment.md`
- Generic: `process.md`
- Vague: `stuff.md`

### Directory Organization

**Good** (clear categories):
```
methods/
├── workflows/         # Processes
├── patterns/          # Code patterns
└── templates/         # Reusable templates
```

**Bad** (flat structure with many files):
```
methods/
├── workflow1.md
├── workflow2.md
├── pattern1.md
├── pattern2.md
├── template1.md
├── template2.md
... (20 more files)
```

### README Files

Add README.md in directories with 3+ files:

```markdown
# .claude/methods/workflows/README.md

# Development Workflows

Step-by-step processes for common development tasks.

## Available Workflows

- [Feature Development](./feature.md) — Adding new features
- [Bug Fixing](./bugfix.md) — Fixing reported bugs
- [Hotfix](./hotfix.md) — Critical production fixes
- [Code Review](./code-review.md) — Reviewing PRs
```

---

## Content Guidelines

### Writing Style

1. **Be concise**: Get to the point quickly
   - ✓ "Use `npm test` to run tests"
   - ✗ "When you want to run the test suite, you can use the command `npm test` which will execute all the tests in the project..."

2. **Use active voice**:
   - ✓ "Run tests before committing"
   - ✗ "Tests should be run before commits are made"

3. **Provide examples**:
   - Always show what you mean
   - Include code snippets
   - Show before/after

4. **Link liberally**:
   ```markdown
   See [deployment workflow](../methods/workflows/deployment.md)
   ```

### Markdown Formatting

1. **Use headings** for structure:
   ```markdown
   # Main Topic
   ## Subtopic
   ### Detail
   ```

2. **Use lists** for steps/items:
   ```markdown
   1. First step
   2. Second step
   3. Third step
   ```

3. **Use code blocks** with language:
   ```markdown
   ```javascript
   const result = await fetch('/api/data')
   ```
   ```

4. **Use tables** for comparisons:
   ```markdown
   | Option | Pros | Cons |
   |--------|------|------|
   | A | Fast | Complex |
   | B | Simple | Slow |
   ```

### Versioning Content

For content that changes over time:

```markdown
# API v2 Migration

**Status**: In Progress (as of Jan 2025)
**Deadline**: March 2025

## Migration Steps

1. Update endpoints to v2
2. Test in staging
3. Deploy to production
```

Or use separate files:
```
knowledge/
└── api/
    ├── v1.md         # Legacy
    ├── v2.md         # Current
    └── v3-draft.md   # Future
```

---

## Team Collaboration

### Ownership

Assign owners for different layers:

```markdown
# .claude/README.md

## Layer Ownership

- **Rules**: @security-team
- **Tools**: @devops-team
- **Methods**: @engineering-leads
- **Knowledge**: @tech-writers
- **Goals**: @product-managers
```

### Review Process

Treat .claude/ like code:

1. **Require reviews** for changes:
   ```yaml
   # .github/CODEOWNERS
   .claude/** @engineering-leads
   ```

2. **Use PRs** for updates:
   ```bash
   git checkout -b update-deployment-workflow
   # Make changes to .claude/methods/workflows/deployment.md
   git commit -m "docs: update deployment workflow"
   git push
   # Create PR for review
   ```

3. **Document changes** in commit messages:
   ```
   docs: update authentication workflow

   - Add 2FA requirement
   - Update OAuth2 flow diagram
   - Link to new identity provider docs
   ```

### Communication

1. **Announce major changes**:
   ```markdown
   # Slack announcement

   @channel We've updated the deployment workflow in .claude/methods/workflows/deployment.md

   Key changes:
   - Now requires security scan before deploy
   - Staging validation is mandatory
   - Rollback process documented

   Please review: https://github.com/org/repo/pull/123
   ```

2. **Hold training sessions**:
   - Onboard new team members to the structure
   - Review major updates together
   - Share best practices

3. **Create team wiki**:
   - Link to .claude/ from team wiki
   - Explain the architecture
   - Provide quick reference guides

---

## Maintenance

### Regular Reviews

**Quarterly review** (every 3 months):

```markdown
# Q1 2025 Config Review Checklist

- [ ] Remove outdated content
- [ ] Update deprecated tools
- [ ] Archive completed goals
- [ ] Refresh architecture docs
- [ ] Validate all examples still work
- [ ] Check for broken links
- [ ] Update version numbers
```

### Keep Content Fresh

1. **Archive old content**:
   ```
   knowledge/
   └── archive/
       ├── 2024-old-architecture.md
       └── 2024-deprecated-api.md
   ```

2. **Mark deprecated content**:
   ```markdown
   # Old API (DEPRECATED)

   **Status**: Deprecated as of Jan 2025
   **Replaced by**: [New API](./new-api.md)
   **Removal date**: June 2025
   ```

3. **Update examples**:
   - Run `claude-arch validate` regularly
   - Fix broken examples
   - Update version numbers

### Health Checks

Run `claude-arch doctor` monthly:

```bash
# Monthly health check
claude-arch doctor --json > health-report.json

# Review report
cat health-report.json
```

Fix issues proactively before they become problems.

---

## Performance

### Keep Files Small

**Guideline**: Max 200 lines per file

**Why**: Large files are slow to parse and hard to navigate.

**How**: Split into subdirectories when files grow.

### Use Caching

The CLI caches parsed configs:

```bash
# First run: parses all files (slow)
claude-arch show

# Subsequent runs: uses cache (fast)
claude-arch show
```

Cache invalidates automatically when files change.

### Optimize for Common Cases

Put frequently accessed content in top-level files:

```
.claude/
├── methods.md         # Common workflows (fast access)
└── methods/
    └── advanced/      # Rarely used (slower access)
        └── advanced-pattern.md
```

---

## Anti-Patterns (What NOT to Do)

### ❌ Don't Mix Layers

**Bad**:
```markdown
# .claude/rules.md

## Security Rules
Never commit API keys.

## Deployment Workflow
Run `npm run deploy`

## Architecture Overview
This is a 3-tier system...
```

**Why**: Breaks separation of concerns.

**Fix**: Move each section to appropriate layer.

---

### ❌ Don't Duplicate Content

**Bad**:
```
.claude/rules/security.md         # "Never commit API keys"
.claude/knowledge/overview.md     # "Never commit API keys"
.claude/methods/deployment.md     # "Never commit API keys"
```

**Why**: Leads to inconsistency and maintenance burden.

**Fix**: Keep in one place (rules/), link from others.

---

### ❌ Don't Use Generic Names

**Bad**:
```
.claude/methods/
├── process.md
├── workflow.md
└── pattern.md
```

**Why**: Impossible to know what each file contains.

**Fix**: Use specific names (`deployment-process.md`, `feature-workflow.md`, `api-pattern.md`).

---

### ❌ Don't Commit Secrets

**Bad**:
```yaml
# .claude/tools/mcp.yaml (COMMITTED TO GIT!)
api_keys:
  openai: sk-abc123secretkey
  github: ghp_xyz789token
```

**Why**: Security breach waiting to happen.

**Fix**: Use environment variables, keep in user scope.

---

### ❌ Don't Create Deep Hierarchies

**Bad**:
```
.claude/methods/
└── development/
    └── workflows/
        └── features/
            └── backend/
                └── api/
                    └── endpoints.md     # 6 levels deep!
```

**Why**: Hard to navigate and maintain.

**Fix**: Flatten to 2-3 levels max.

---

## Summary Checklist

**Organization**:
- [ ] Start simple, grow as needed
- [ ] One topic per file
- [ ] Descriptive names
- [ ] Shallow hierarchy (2-3 levels)

**Content**:
- [ ] Clear, concise writing
- [ ] Examples for everything
- [ ] Links between files
- [ ] Version/date important content

**Maintenance**:
- [ ] Quarterly reviews
- [ ] Archive old content
- [ ] Mark deprecated content
- [ ] Run `claude-arch doctor` monthly

**Team**:
- [ ] Assign layer ownership
- [ ] Require PR reviews
- [ ] Announce major changes
- [ ] Onboard new members

**Performance**:
- [ ] Keep files under 200 lines
- [ ] Split large files
- [ ] Use caching (automatic)

---

**Next Steps**:
- [User Guide](./user-guide.md) — Complete CLI reference
- [Migration Guide](./migration-guide.md) — Migrate existing projects
- [Troubleshooting](./troubleshooting.md) — Fix common issues
- [Examples](../examples/) — See it in action
