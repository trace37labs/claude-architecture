# Migration Guide

> Step-by-step guide for migrating from CLAUDE.md/AGENTS.md to the 5-layer architecture.

## Table of Contents

- [Overview](#overview)
- [Before You Begin](#before-you-begin)
- [Migration Workflow](#migration-workflow)
- [Content Classification](#content-classification)
- [Manual Refinement](#manual-refinement)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide helps you transition from the old CLAUDE.md format to the new 5-layer structure.

### What Changes?

**Before** (Single file):
```
project/
└── CLAUDE.md    # Everything in one file (500+ lines)
```

**After** (Organized structure):
```
project/
├── .claude/
│   ├── rules/       # Constraints extracted
│   ├── tools/       # MCP servers extracted
│   ├── methods/     # Workflows extracted
│   ├── knowledge/   # Context extracted
│   └── goals/       # Objectives extracted
└── CLAUDE.md.backup # Original preserved
```

### Why Migrate?

- **Better organization**: Clear separation of concerns
- **Easier maintenance**: Edit specific layers without hunting through one big file
- **Team collaboration**: Different people can own different layers
- **Composability**: Merge configs across project/user scopes
- **Tooling support**: Validation, conflict detection, recommendations

---

## Before You Begin

### Prerequisites

1. **Install claude-arch**:
   ```bash
   npm install -g claude-arch
   ```

2. **Backup your files**:
   ```bash
   cp CLAUDE.md CLAUDE.md.backup
   cp AGENTS.md AGENTS.md.backup  # if you have it
   ```

3. **Commit to git** (if using version control):
   ```bash
   git add .
   git commit -m "Backup before migration"
   ```

### What Gets Migrated?

The tool migrates:
- ✓ CLAUDE.md content
- ✓ AGENTS.md content (if present)
- ✓ Markdown headings and sections
- ✓ Code blocks and examples
- ✓ MCP server configurations

The tool does NOT migrate:
- ✗ Comments (will be classified as knowledge)
- ✗ Random notes (will be classified as knowledge)
- ✗ External files (you need to move these manually)

---

## Migration Workflow

### Step 1: Dry Run

Preview what the migration will do without writing files:

```bash
claude-arch migrate --dry-run
```

**Output shows**:
- Files that will be created
- Content classification
- Potential issues

**Review carefully**: Check if content is classified correctly.

---

### Step 2: Run Migration

Execute the migration:

```bash
# Minimal structure (single files per layer)
claude-arch migrate

# Full structure (subdirectories per layer)
claude-arch migrate --full

# Specify custom paths
claude-arch migrate --from ./old-config/CLAUDE.md --to ./.claude/
```

**What happens**:
1. Reads CLAUDE.md and AGENTS.md
2. Analyzes content and classifies into layers
3. Creates .claude/ directory structure
4. Writes layer-specific files
5. Backs up original files (CLAUDE.md → CLAUDE.md.backup)

---

### Step 3: Validate

Check that the migration produced valid structure:

```bash
claude-arch validate
```

**Expected output**:
```
✓ Structure is valid
✓ All required layers present
✓ Files are valid markdown
✓ No schema violations
```

**If validation fails**: See [Troubleshooting](#troubleshooting)

---

### Step 4: Review and Refine

Manually review the generated files:

```bash
# View the structure
tree .claude/

# Show merged configuration
claude-arch show

# Check for conflicts
claude-arch doctor
```

**Common refinements needed**:
- Move misclassified content between layers
- Split large files into smaller topics
- Add missing context or documentation
- Remove duplicate content

See [Manual Refinement](#manual-refinement) for details.

---

### Step 5: Test

Verify that Claude Code works with the new structure:

1. **Load project in Claude Code**
2. **Check configuration is read**:
   ```bash
   claude-arch show
   ```
3. **Test functionality**: Run a few commands to ensure behavior is correct

---

### Step 6: Commit

Save the new structure to version control:

```bash
git add .claude/
git commit -m "feat: migrate to 5-layer architecture"
```

---

## Content Classification

The migration tool uses heuristics to classify content into layers.

### Classification Rules

| Content Type | Indicators | Target Layer |
|--------------|-----------|--------------|
| **Security rules** | "security", "auth", "credentials", "forbidden" | `rules/` |
| **Code standards** | "code style", "linting", "formatting", "standards" | `rules/` |
| **Constraints** | "must not", "never", "always", "required" | `rules/` |
| **MCP servers** | "mcp", "server", "tool", "command" | `tools/` |
| **Commands** | "slash command", "/command", "usage:" | `tools/` |
| **Workflows** | "workflow", "process", "step-by-step", "how to" | `methods/` |
| **Patterns** | "pattern", "best practice", "approach" | `methods/` |
| **Architecture** | "architecture", "design", "system", "overview" | `knowledge/` |
| **Context** | "background", "context", "about", "domain" | `knowledge/` |
| **Documentation** | "specification", "API docs", "reference" | `knowledge/` |
| **Goals** | "goal", "objective", "task", "sprint", "backlog" | `goals/` |
| **Success criteria** | "success criteria", "acceptance", "definition of done" | `goals/` |

### Unclassified Content

Content that doesn't match any heuristic goes to `knowledge/` by default (safe fallback).

**Example**:
```markdown
# Random Notes

Some thoughts about the project...
```

**Migration result**: `knowledge/notes.md`

---

### Examples

#### Example 1: Security Rule

**Input (CLAUDE.md)**:
```markdown
## Security

Never commit API keys to the repository.
```

**Output (.claude/rules/security.md)**:
```markdown
# Security

Never commit API keys to the repository.
```

**Why**: Contains "security" keyword → classified as RULES

---

#### Example 2: MCP Server

**Input (CLAUDE.md)**:
```markdown
## Tools

MCP servers available:
- github: For repository operations
- slack: For team communication
```

**Output (.claude/tools/mcp.yaml)**:
```yaml
servers:
  - name: github
    description: For repository operations
  - name: slack
    description: For team communication
```

**Why**: Contains "MCP server" → classified as TOOLS, structured as YAML

---

#### Example 3: Workflow

**Input (CLAUDE.md)**:
```markdown
## Development Workflow

1. Create feature branch
2. Write tests
3. Implement feature
4. Run tests
5. Create PR
```

**Output (.claude/methods/workflow.md)**:
```markdown
# Development Workflow

1. Create feature branch
2. Write tests
3. Implement feature
4. Run tests
5. Create PR
```

**Why**: Contains "workflow" keyword → classified as METHODS

---

#### Example 4: Architecture

**Input (CLAUDE.md)**:
```markdown
## System Architecture

The system uses a 3-tier architecture:
- Frontend: React SPA
- Backend: Node.js API
- Database: PostgreSQL
```

**Output (.claude/knowledge/architecture.md)**:
```markdown
# System Architecture

The system uses a 3-tier architecture:
- Frontend: React SPA
- Backend: Node.js API
- Database: PostgreSQL
```

**Why**: Contains "architecture" keyword → classified as KNOWLEDGE

---

#### Example 5: Sprint Goals

**Input (CLAUDE.md)**:
```markdown
## Current Sprint

Goals:
- Implement user authentication
- Add password reset flow
- Write integration tests
```

**Output (.claude/goals/current.md)**:
```markdown
# Current Sprint

Goals:
- Implement user authentication
- Add password reset flow
- Write integration tests
```

**Why**: Contains "goals" keyword → classified as GOALS

---

## Manual Refinement

After migration, you'll likely need to refine the classification.

### Moving Content Between Layers

If content was misclassified:

```bash
# Move a file to correct layer
mv .claude/knowledge/security-rule.md .claude/rules/security.md

# Edit and merge content
cat .claude/knowledge/workflow.md >> .claude/methods/workflow.md
rm .claude/knowledge/workflow.md
```

**Validate after changes**:
```bash
claude-arch validate
```

---

### Splitting Large Files

If a layer file is too large (>200 lines):

**Before** (single large file):
```
.claude/methods.md    # 500 lines
```

**After** (organized subdirectories):
```
.claude/methods/
├── workflows/
│   ├── feature.md
│   └── bugfix.md
└── patterns/
    ├── api-design.md
    └── testing.md
```

**How**:
1. Create subdirectories: `mkdir -p .claude/methods/workflows .claude/methods/patterns`
2. Extract sections: Copy relevant sections to new files
3. Delete original: `rm .claude/methods.md`
4. Validate: `claude-arch validate`

---

### Removing Duplicate Content

If content appears in multiple layers:

```bash
# Check for duplicates
claude-arch doctor
```

**Output**:
```
⚠️  WARNING: Duplicate content detected
    "Security rules" appears in:
    - .claude/rules/security.md
    - .claude/knowledge/overview.md
    → Remove from knowledge/overview.md
```

**Fix**: Remove duplicate content from one location.

---

### Adding Missing Context

Migration extracts content but might miss context:

**Add README files**:
```markdown
# .claude/methods/README.md

This directory contains development workflows and patterns.

- `workflows/` — Step-by-step processes
- `patterns/` — Reusable code patterns
```

**Add overview**:
```markdown
# .claude/knowledge/overview.md

Project overview and architecture summary.
```

---

## Common Scenarios

### Scenario 1: Simple Project (Single CLAUDE.md)

**Before**:
```
my-app/
├── CLAUDE.md         # 200 lines
└── src/
```

**Migration**:
```bash
cd my-app
claude-arch migrate
```

**After**:
```
my-app/
├── .claude/
│   ├── rules.md
│   ├── tools.md
│   ├── methods.md
│   ├── knowledge.md
│   └── goals.md
├── CLAUDE.md.backup
└── src/
```

**Time**: 2 minutes

---

### Scenario 2: Complex Project (CLAUDE.md + AGENTS.md)

**Before**:
```
enterprise-app/
├── CLAUDE.md         # 800 lines
├── AGENTS.md         # 300 lines
└── src/
```

**Migration**:
```bash
cd enterprise-app
claude-arch migrate --full
```

**After**:
```
enterprise-app/
├── .claude/
│   ├── rules/
│   │   ├── security.md
│   │   └── code-standards.md
│   ├── tools/
│   │   └── mcp.yaml
│   ├── methods/
│   │   ├── workflows/
│   │   └── patterns/
│   ├── knowledge/
│   │   ├── overview.md
│   │   └── architecture.md
│   └── goals/
│       └── current.md
├── CLAUDE.md.backup
├── AGENTS.md.backup
└── src/
```

**Time**: 10 minutes (including manual refinement)

---

### Scenario 3: Multi-Scope Setup (User + Project)

**Before**:
```
~/.claude.md          # Personal config
project/.claude.md    # Project config
```

**Migration**:
```bash
# Migrate user config
cd ~
claude-arch migrate --from .claude.md --to .claude/

# Migrate project config
cd ~/projects/my-app
claude-arch migrate
```

**After**:
```
~/.claude/            # User scope
  ├── rules.md
  ├── tools.md
  └── methods.md

project/.claude/      # Project scope
  ├── rules.md
  ├── methods.md
  ├── knowledge.md
  └── goals.md
```

**Merged result**: Project overrides user for methods/goals, both combine for rules

---

### Scenario 4: Team with Separate AGENTS.md

**Before**:
```
team-project/
├── CLAUDE.md         # Shared config
├── AGENTS.md         # Agent definitions
└── src/
```

**Migration**:
```bash
claude-arch migrate --full
```

**After**:
```
team-project/
├── .claude/
│   ├── rules/
│   │   └── team-standards.md    # From CLAUDE.md
│   ├── tools/
│   │   ├── mcp.yaml              # From AGENTS.md
│   │   └── agents/
│   │       ├── coder.md          # From AGENTS.md
│   │       └── reviewer.md       # From AGENTS.md
│   ├── methods/
│   │   └── workflow.md           # From CLAUDE.md
│   └── knowledge/
│       └── architecture.md       # From CLAUDE.md
└── src/
```

**Special handling**: AGENTS.md content is classified into tools/ automatically

---

## Troubleshooting

### Issue: Migration fails with "File not found"

**Cause**: CLAUDE.md doesn't exist in current directory

**Solution**:
```bash
# Specify path explicitly
claude-arch migrate --from /path/to/CLAUDE.md
```

---

### Issue: Validation fails after migration

**Cause**: Generated files have syntax errors

**Solution**:
```bash
# Check specific errors
claude-arch validate --verbose

# Common fixes:
# 1. Fix markdown syntax errors
# 2. Remove invalid characters
# 3. Ensure files are UTF-8 encoded
```

---

### Issue: Content misclassified

**Cause**: Heuristics are imperfect

**Solution**:
```bash
# Move content manually
mv .claude/knowledge/rule.md .claude/rules/rule.md

# Or edit classification in source CLAUDE.md and re-migrate
# Add hints like "# RULES:" before sections
```

---

### Issue: Duplicate content in multiple layers

**Cause**: Same content mentioned in multiple contexts

**Solution**:
```bash
# Check for duplicates
claude-arch doctor

# Remove duplicates manually
# Keep content in most appropriate layer
```

---

### Issue: Large files after migration

**Cause**: All content of one type in a single file

**Solution**:
```bash
# Split manually into subdirectories
mkdir -p .claude/methods/workflows
# Move sections to separate files
# See "Splitting Large Files" section above
```

---

### Issue: Lost formatting/code blocks

**Cause**: Markdown parser edge cases

**Solution**:
```bash
# Compare before/after
diff CLAUDE.md.backup .claude/methods/workflow.md

# Manually restore formatting if needed
```

---

### Issue: MCP servers not extracted to YAML

**Cause**: Didn't use structured format in CLAUDE.md

**Solution**:
```bash
# Manually create .claude/tools/mcp.yaml
# See examples/ for format
```

---

### Issue: Want to undo migration

**Cause**: Migration didn't work as expected

**Solution**:
```bash
# Restore from backup
rm -rf .claude/
mv CLAUDE.md.backup CLAUDE.md
mv AGENTS.md.backup AGENTS.md  # if present

# Or restore from git
git checkout -- .
```

---

## Advanced Migration

### Custom Classification

To override automatic classification, add layer hints in your CLAUDE.md:

```markdown
<!-- LAYER: RULES -->
## Security Guidelines
Never commit secrets.

<!-- LAYER: METHODS -->
## Deployment Process
Run `npm run deploy`

<!-- LAYER: KNOWLEDGE -->
## System Overview
This is a web application...
```

The migration tool respects these hints.

---

### Incremental Migration

For very large projects, migrate incrementally:

1. **Migrate rules first**:
   ```bash
   claude-arch migrate --layers rules
   ```

2. **Test**: Verify rules work

3. **Migrate tools**:
   ```bash
   claude-arch migrate --layers tools
   ```

4. **Continue layer by layer**

(Note: `--layers` flag is planned for future versions)

---

### Team Coordination

For team migration:

1. **Announce migration**: Inform team
2. **Create migration branch**: Don't migrate on main
   ```bash
   git checkout -b migrate-to-5-layer
   ```
3. **Run migration**: Execute migration
4. **Team review**: Get feedback on classification
5. **Refine**: Adjust based on team input
6. **Merge**: Merge to main when ready
7. **Update docs**: Document new structure for team

---

## Next Steps

After successful migration:

1. **Commit changes**:
   ```bash
   git add .claude/
   git commit -m "feat: migrate to 5-layer architecture"
   ```

2. **Read best practices**: [Best Practices](./best-practices.md)

3. **Set up MCP integration**: [User Guide - MCP Integration](./user-guide.md#mcp-integration)

4. **Explore examples**: [examples/](../examples/)

5. **Share with team**: Document the new structure

---

**Questions?** See [Troubleshooting Guide](./troubleshooting.md) or [User Guide](./user-guide.md).
