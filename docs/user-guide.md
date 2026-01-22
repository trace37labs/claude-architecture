# Claude Architecture User Guide

> Complete guide to using the claude-arch CLI tool and 5-layer architecture.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [CLI Commands](#cli-commands)
- [File Structure](#file-structure)
- [Scope Hierarchy](#scope-hierarchy)
- [MCP Integration](#mcp-integration)
- [Portable Environments (Export & Gaps)](#portable-environments-export--gaps)
- [Advanced Usage](#advanced-usage)

---

## Introduction

Claude Architecture provides a structured, layered approach to configuring Claude Code projects. Instead of sprawling CLAUDE.md files, content is organized into 5 semantic layers with clear precedence rules.

### Why This Architecture?

**Before**: Monolithic CLAUDE.md files with mixed concerns
- Hard to maintain
- No clear precedence
- Difficult to share/compose
- Scales poorly

**After**: 5-layer structure with separation of concerns
- Clear organization
- Explicit precedence
- Easy composition across scopes
- Scales from simple to complex

### The Five Layers

1. **RULES** — Constraints and non-negotiables
2. **TOOLS** — Available capabilities (MCP servers, commands)
3. **METHODS** — Workflows and patterns
4. **KNOWLEDGE** — Context and documentation
5. **GOALS** — Current objectives

Each layer has specific merge behavior and precedence rules.

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g claude-arch
```

After installation, the `claude-arch` command is available everywhere.

### Using with npx (No Installation)

```bash
npx claude-arch <command>
```

npx downloads and runs the latest version without global installation.

### Verify Installation

```bash
claude-arch --version
claude-arch --help
```

---

## Core Concepts

### Layers vs Scopes

**Layers** organize *what* type of content (rules, tools, methods, knowledge, goals).

**Scopes** organize *where* content comes from (task, project, user, system).

These are orthogonal dimensions that combine:

```
         ┌─────────────────────────────────────┐
         │  Task Scope (highest precedence)    │
         ├─────────────────────────────────────┤
         │  Project Scope (.claude/)           │
         ├─────────────────────────────────────┤
         │  User Scope (~/.claude/)            │
         ├─────────────────────────────────────┤
         │  System Scope (lowest precedence)   │
         └─────────────────────────────────────┘

Each scope contains 5 layers:
  ├── rules/
  ├── tools/
  ├── methods/
  ├── knowledge/
  └── goals/
```

### Merge Behavior by Layer

| Layer | Merge Strategy | Precedence | Example |
|-------|----------------|------------|---------|
| **RULES** | Additive | All accumulate | Security rules from all scopes apply |
| **TOOLS** | Additive | All accumulate | All MCP servers are available |
| **METHODS** | Override | More specific wins | Project workflow overrides user default |
| **KNOWLEDGE** | Additive | All accumulate | All context is available |
| **GOALS** | Override | Current wins | Task goal overrides project goal |

### Precedence Rules

**Scope precedence** (which scope wins):
```
Task > Project > User > System
```

**Layer precedence** (within a layer):
- **Additive layers** (rules, tools, knowledge): All merge together
- **Override layers** (methods, goals): More specific scope wins

---

## CLI Commands

### `claude-arch init`

Initialize a new project with the 5-layer structure.

```bash
# Minimal structure (single files per layer)
claude-arch init

# Full structure (subdirectories per layer)
claude-arch init --full

# Specify target directory
claude-arch init --path ./my-project

# Force overwrite existing .claude/ directory
claude-arch init --force
```

**Output**:
```
✓ Created .claude/ directory
✓ Created 5 layer files (or directories)
✓ Added example content
```

**When to use**:
- Starting a new project
- Adding Claude configuration to existing project
- Creating a user-level config (~/.claude/)

---

### `claude-arch migrate`

Convert existing CLAUDE.md/AGENTS.md files to the 5-layer structure.

```bash
# Auto-discover and migrate CLAUDE.md
claude-arch migrate

# Preview changes without writing files
claude-arch migrate --dry-run

# Specify source and target
claude-arch migrate --from ./CLAUDE.md --to ./.claude/

# Migrate to minimal structure
claude-arch migrate --minimal

# Force overwrite existing .claude/
claude-arch migrate --force

# Migrate from directory (scans for CLAUDE.md, AGENTS.md)
claude-arch migrate --from ./legacy-config/

# Preserve backups
claude-arch migrate --backup
```

**Migration process**:
1. Reads CLAUDE.md and AGENTS.md
2. Classifies content into 5 layers using heuristics
3. Creates .claude/ structure
4. Writes layer-specific files
5. Backs up original files (unless --no-backup)

**Classification heuristics**:
- Headers with "rule", "constraint", "security" → **rules/**
- MCP servers, commands, tools → **tools/**
- Workflows, patterns, "how to" → **methods/**
- Architecture, context, specs → **knowledge/**
- Tasks, goals, objectives → **goals/**
- Unclassified content → **knowledge/** (safe default)

---

### `claude-arch validate`

Check that your configuration follows the specification.

```bash
# Validate current directory
claude-arch validate

# Validate specific directory
claude-arch validate ./path/to/project

# Verbose output
claude-arch validate --verbose

# JSON output for tooling
claude-arch validate --json
```

**Validation checks**:
- ✓ Directory structure exists
- ✓ Required layers are present
- ✓ Files are valid markdown/YAML
- ✓ Schemas match specification
- ✓ No syntax errors

**Exit codes**:
- `0` — Validation passed
- `1` — Validation failed

---

### `claude-arch show`

Display the merged configuration with precedence information.

```bash
# Show merged config (tree format)
claude-arch show

# Show with precedence chain
claude-arch show --format precedence

# JSON output
claude-arch show --format json

# Show only specific layer
claude-arch show --layer rules
claude-arch show --layer tools
claude-arch show --layer methods
claude-arch show --layer knowledge
claude-arch show --layer goals

# Show specific scope
claude-arch show --scope project
claude-arch show --scope user
```

**Output formats**:

**Tree format** (default):
```
Configuration Tree
├── rules/
│   ├── security.md (project)
│   └── code-standards.md (user)
├── tools/
│   └── mcp.yaml (project)
...
```

**Precedence format**:
```
Layer: METHODS
Scope chain: Task → Project → User → System
Active: project/.claude/methods/workflow.md
  Overrides: user/.claude/methods.md
  Source: Project scope (line 15-42)
```

**JSON format**:
```json
{
  "rules": { ... },
  "tools": { ... },
  "methods": { ... },
  "knowledge": { ... },
  "goals": { ... },
  "meta": {
    "scopes": ["task", "project", "user"],
    "precedence": { ... }
  }
}
```

---

### `claude-arch tree`

Display the `.claude/` directory structure as a visual tree.

```bash
# Show .claude/ directory tree
claude-arch tree

# Limit depth
claude-arch tree --depth 2

# Show file sizes
claude-arch tree --size

# Show hidden files
claude-arch tree --all

# Disable color output
claude-arch tree --no-color

# Show tree for specific directory
claude-arch tree --target-dir ./my-project
```

**Example output**:
```
.claude/
├── rules/
│   ├── security.md (1.2K)
│   └── constraints.md (856B)
├── tools/
│   ├── mcp.yaml (542B)
│   └── hooks.yaml (1.1K)
├── methods/
│   ├── workflows/
│   │   ├── testing.md (2.3K)
│   │   └── deployment.md (1.8K)
│   └── patterns.md (3.4K)
├── knowledge/
│   ├── architecture.md (5.6K)
│   └── api-docs.md (4.2K)
└── goals/
    └── current-sprint.md (892B)

5 directories, 10 files
```

**Options**:
- `--depth N` — Limit tree traversal to N levels deep
- `--size` — Show file sizes in human-readable format (B, K, M)
- `--all` — Include hidden files and directories
- `--no-color` — Disable color output for piping to files
- `--target-dir PATH` — Show tree for directory other than current

**Features**:
- Color-coded files: directories (blue), markdown (green), YAML/JSON (yellow)
- Automatic sorting: directories first, then alphabetical
- Summary counts of directories and files
- Human-readable file sizes

**When to use**:
- Quick visual overview of project structure
- Verifying migration results
- Documentation and screenshots
- Understanding .claude/ organization

---

### `claude-arch doctor`

Health check for configuration issues and recommendations.

```bash
# Run full health check
claude-arch doctor

# Show only quick wins (high impact, low effort)
claude-arch doctor --quick-wins

# JSON output
claude-arch doctor --json

# Specific directory
claude-arch doctor ./path/to/project
```

**Health checks**:
- Conflicting rules across scopes
- Duplicate content in multiple layers
- Missing recommended structure
- Large files that should be split
- Outdated patterns
- Cross-layer conflicts

**Output**:
```
Health Score: 85/100

Issues Found:
⚠️  WARNING: Large methods file (450 lines)
    → Split into workflow.md and patterns.md
    Priority: Medium | Impact: High

ℹ️  INFO: Missing tools/mcp.yaml
    → Add MCP server configuration
    Priority: Low | Impact: Medium

Quick Wins (2):
1. Split methods.md → +10 health score
2. Add overview.md → +5 health score
```

---

## File Structure

### Minimal Structure

For small projects, use single files per layer:

```
.claude/
├── rules.md          # All rules in one file
├── tools.md          # All tools in one file
├── methods.md        # All methods in one file
├── knowledge.md      # All knowledge in one file
└── goals.md          # All goals in one file
```

**When to use**:
- Solo projects
- Prototypes
- Simple applications
- Learning the system

---

### Full Structure

For complex projects, use subdirectories:

```
.claude/
├── rules/
│   ├── security.md        # Security constraints
│   ├── code-standards.md  # Code quality rules
│   └── process.md         # Development process
├── tools/
│   ├── mcp.yaml           # MCP server configs
│   └── commands/
│       ├── deploy.md      # Deployment command
│       └── test.md        # Testing command
├── methods/
│   ├── workflows/
│   │   ├── feature.md     # Feature development workflow
│   │   └── bugfix.md      # Bug fix workflow
│   └── patterns/
│       ├── api.md         # API design patterns
│       └── testing.md     # Testing patterns
├── knowledge/
│   ├── overview.md        # Project overview
│   ├── architecture.md    # System architecture
│   ├── glossary.md        # Domain terminology
│   └── decisions/
│       └── adr-001.md     # Architecture decision record
└── goals/
    ├── current.md         # Active sprint goals
    └── backlog.md         # Future objectives
```

**When to use**:
- Team projects
- Complex applications
- Extensive documentation
- Production systems

---

### File Naming Conventions

**Files**:
- Use kebab-case: `code-standards.md`
- Be descriptive: `api-design-patterns.md` (not `patterns.md`)
- Use .md for markdown, .yaml for structured data

**Directories**:
- Use plural for collections: `workflows/`, `patterns/`, `decisions/`
- Keep hierarchy shallow (max 2-3 levels)

**Organization tips**:
- One topic per file (easier to maintain)
- Group related files in subdirectories
- Add README.md in directories with 3+ files
- Link between files using relative paths

---

## Scope Hierarchy

### Project Scope (.claude/)

Configuration specific to this project, committed to version control.

**Location**: `project-root/.claude/`

**Contains**:
- Project-specific rules
- Team workflows
- Project architecture
- Current sprint goals

**Shared with**: Entire team via git

**Example**:
```
my-app/
├── .claude/
│   ├── rules/
│   │   └── security.md      # "Never commit API keys"
│   ├── methods/
│   │   └── deployment.md    # "Deploy via npm run deploy"
│   └── knowledge/
│       └── architecture.md  # System design docs
└── src/
```

---

### User Scope (~/.claude/)

Personal configuration, not committed to version control.

**Location**: `~/.claude/` (user's home directory)

**Contains**:
- Personal preferences
- API keys (gitignored)
- Common tools
- Default workflows

**Shared with**: Only you

**Example**:
```
~/.claude/
├── rules/
│   └── style.md           # "I prefer functional style"
├── tools/
│   └── mcp.yaml           # Personal MCP servers
└── methods/
    └── workflow.md        # "I always write tests first"
```

---

### Task Scope (Runtime)

Provided at runtime for specific operations.

**Location**: Passed via CLI or MCP tools

**Contains**:
- Immediate objectives
- Current context
- Task-specific overrides

**Example**:
```bash
claude-arch show --task "Implement user authentication"
```

This adds task-level goals that override project/user goals.

---

### System Scope (Defaults)

Built-in defaults from Anthropic.

**Location**: Internal to Claude Code

**Contains**:
- Base system prompts
- Default capabilities
- Core behaviors

**User control**: None (read-only)

---

### Scope Precedence Example

Given these configurations:

**System** (implicit):
```yaml
methods:
  testing: "Use built-in test runner"
```

**User** (~/.claude/methods.md):
```markdown
# Testing

I prefer Jest for all projects.
```

**Project** (project/.claude/methods/testing.md):
```markdown
# Testing

Use Vitest for this project (faster).
```

**Task** (runtime):
```bash
--task "Use manual testing for this quick fix"
```

**Merged result**:
- Task wins: "Use manual testing for this quick fix"
- Without task: Project wins: "Use Vitest"
- Without project: User wins: "I prefer Jest"
- Without user: System wins: "Use built-in test runner"

---

## MCP Integration

### Setup

Add claude-arch as an MCP server in Claude Code:

```bash
claude mcp add claude-arch -- npx -y claude-arch-mcp
```

This exposes **10 tools** to Claude Code, giving Claude full access to configuration management.

### Available Tools

#### 1. `resolve-config`

Get the merged configuration for current context.

**Parameters**:
- `format` (optional): `json`, `tree`, or `precedence`
- `layer` (optional): Filter to specific layer

**Example**:
```json
{
  "name": "resolve-config",
  "arguments": {
    "format": "tree"
  }
}
```

**Use case**: Show Claude the active configuration.

---

#### 2. `validate-structure`

Check if configuration is valid.

**Parameters**:
- `verbose` (optional): Include detailed errors

**Example**:
```json
{
  "name": "validate-structure",
  "arguments": {
    "verbose": true
  }
}
```

**Use case**: Verify configuration before committing.

---

#### 3. `detect-conflicts`

Find conflicting rules or methods.

**Parameters**: None

**Example**:
```json
{
  "name": "detect-conflicts"
}
```

**Returns**:
```json
{
  "conflicts": [
    {
      "layer": "methods",
      "type": "override_conflict",
      "description": "Conflicting testing methods",
      "sources": ["user/.claude/methods.md", "project/.claude/methods/testing.md"]
    }
  ]
}
```

**Use case**: Debug unexpected behavior.

---

#### 4. `get-recommendations`

Get improvement suggestions.

**Parameters**:
- `quick_wins` (optional): Only show high-impact, low-effort items

**Example**:
```json
{
  "name": "get-recommendations",
  "arguments": {
    "quick_wins": true
  }
}
```

**Use case**: Find easy wins for better organization.

---

#### 5. `show-sources`

Show ALL configuration sources (CLAUDE.md, MCP, hooks, skills, memory) in unified view.

**Parameters**:
- `path` (optional): Project path
- `format` (optional): `unified` or `json`
- `scope` (optional): Filter to `user`, `project`, `task`, or `system`
- `layer` (optional): Filter to `rules`, `tools`, `methods`, `knowledge`, or `goals`

**Use case**: See everything that's active and where it comes from.

---

#### 6. `migrate`

Migrate legacy CLAUDE.md/AGENTS.md to organized .claude/ structure.

**Parameters**:
- `path` (optional): Source directory
- `dryRun` (optional, default: true): Preview changes without applying
- `all` (optional): Migrate all config sources (MCP, hooks, skills, memory)
- `source` (optional): Specific source to migrate (`mcp`, `hooks`, `skills`, `memory`)

**Use case**: Convert messy CLAUDE.md into organized layers.

---

#### 7. `init`

Initialize .claude/ directory structure for a project.

**Parameters**:
- `path` (optional): Target directory
- `minimal` (optional): Create minimal structure (single files instead of subdirs)
- `dryRun` (optional, default: true): Preview what would be created

**Use case**: Set up a new project with proper structure.

---

#### 8. `export-manifest`

Export portable requirements manifest for environment migration.

**Parameters**:
- `path` (optional): Project path
- `format` (optional): `yaml` or `json`
- `platform` (optional): Target platform (`darwin`, `linux`, `windows`)

**Use case**: Mac→VPS migration, team onboarding, CI/CD validation.

---

#### 9. `analyze-gaps`

Analyze what is missing in current environment compared to manifest.

**Parameters**:
- `manifest` (optional): Path to manifest file
- `path` (optional): Project path to compare against
- `format` (optional): `text` or `json`

**Use case**: Find missing tools, MCP servers, or environment variables.

---

#### 10. `show-tree`

Display .claude/ directory structure as visual tree.

**Parameters**:
- `path` (optional): Project path
- `depth` (optional): Maximum depth to display
- `showSize` (optional): Show file sizes

**Use case**: Visualize configuration structure.

---

### MCP Workflow Example

**Scenario**: Claude Code needs to understand project rules.

1. User asks: "What are the security rules for this project?"
2. Claude calls: `resolve-config` with `layer: "rules"`
3. Returns merged rules from all scopes
4. Claude answers based on configuration

**Benefit**: Configuration is machine-readable and queryable.

---

## Advanced Usage

### Multi-Project Workflow

For multiple projects sharing common config:

**User config** (~/.claude/):
```
~/.claude/
├── rules/
│   └── personal-style.md     # Shared across all projects
└── tools/
    └── mcp.yaml              # Personal MCP servers
```

**Project A**:
```
project-a/.claude/
├── knowledge/
│   └── architecture.md       # Project A specific
└── goals/
    └── current.md            # Project A goals
```

**Project B**:
```
project-b/.claude/
├── knowledge/
│   └── architecture.md       # Project B specific
└── goals/
    └── current.md            # Project B goals
```

Shared user config applies to both projects, but each has unique knowledge/goals.

---

### Team Collaboration

**Best practices**:

1. **Commit .claude/ to git**
   - Everyone gets the same structure
   - Version control for configuration
   - Team alignment

2. **Use project scope for shared config**
   - Team workflows in methods/
   - Project docs in knowledge/
   - Shared rules in rules/

3. **Use user scope for personal preferences**
   - Personal API keys (gitignored)
   - Individual tools
   - Personal workflow tweaks

4. **Document decisions**
   - Use knowledge/decisions/ for ADRs
   - Explain why rules exist
   - Link to relevant docs

---

### Migration Strategy

**For existing projects with CLAUDE.md**:

1. **Backup**: Copy CLAUDE.md before migrating
   ```bash
   cp CLAUDE.md CLAUDE.md.backup
   ```

2. **Dry run**: Preview migration
   ```bash
   claude-arch migrate --dry-run
   ```

3. **Review**: Check classification is correct
   ```bash
   less .claude/*/  # Preview generated files
   ```

4. **Migrate**: Run migration
   ```bash
   claude-arch migrate
   ```

5. **Validate**: Ensure structure is valid
   ```bash
   claude-arch validate
   ```

6. **Refine**: Manually adjust misclassified content
   ```bash
   # Move content between layers if needed
   mv .claude/knowledge/some-rule.md .claude/rules/
   ```

7. **Test**: Verify Claude Code works with new structure
   ```bash
   claude-arch show
   ```

8. **Commit**: Save to version control
   ```bash
   git add .claude/
   git commit -m "Migrate to 5-layer architecture"
   ```

---

## Portable Environments (Export & Gaps)

### Overview

The **export** and **gaps** commands enable seamless configuration portability across different environments.

**Use cases:**
- Mac → VPS (Linux) migration
- Team onboarding (new developer setup)
- CI/CD environment validation
- Multi-environment projects (dev/staging/prod)

### Export Command

Generate a portable configuration manifest that can be used to replicate your environment elsewhere.

#### Basic Usage

```bash
# Export current configuration
claude-arch export --output manifest.yaml

# Export with platform targeting (smart filtering)
claude-arch export --output manifest.yaml --platform linux

# Generate setup script alongside manifest
claude-arch export --output manifest.yaml --generate-setup

# Export as JSON
claude-arch export --output manifest.json --json
```

#### Platform-Aware Export

When exporting with `--platform`, the tool intelligently filters platform-specific tools:

```bash
# Export from Mac for Linux deployment
claude-arch export -o manifest.yaml --platform linux --generate-setup
```

**What happens:**
- Platform-specific tools excluded (e.g., xcodebuild only on darwin)
- Install commands adapted for target platform (apt-get vs brew vs winget)
- Paths automatically mapped (~/Library → ~/.config)
- Setup script uses target platform's package manager

**Example manifest.yaml:**
```yaml
metadata:
  generated_from: /Users/you/project
  date: 2026-01-22
  platform: darwin
  target_platform: linux

required:
  mcp_servers:
    - name: github
      package: "@anthropic/mcp-github"
      required: true

  cli_tools:
    - name: git
      required: true
      install_cmd: apt-get install -y git  # Platform-specific
    - name: ffuf
      required: true
      install_cmd: go install github.com/ffuf/ffuf/v2@latest
    # xcodebuild NOT included (darwin-only)

  environment_variables:
    - name: ANTHROPIC_API_KEY
      required: true
    - name: GITHUB_TOKEN
      required: true

  paths:
    - source: ./scripts
      description: Project scripts
      required: true

path_mappings:
  darwin_to_linux:
    "~": /home/$USER
    ~/Library/Application Support: ~/.config
```

#### Setup Script Generation

With `--generate-setup`, an executable bash script is created:

```bash
# Generate manifest + setup.sh
claude-arch export -o manifest.yaml --generate-setup

# Result: manifest.yaml + manifest.sh
```

**Setup script features:**
- Color-coded output (✓ available, ✗ missing, ⊘ skipped)
- `--check-only` flag for dry-run validation
- `--skip-optional` flag to skip non-required items
- Automatic MCP server installation
- CLI tool installation with platform commands
- Environment variable setup guidance
- Summary report

**Usage on target environment:**
```bash
# Copy to VPS
scp manifest.yaml manifest.sh vps:/projects/

# On VPS - check what's missing
./manifest.sh --check-only

# On VPS - install everything
./manifest.sh

# Skip optional dependencies
./manifest.sh --skip-optional
```

### Gaps Command

Analyze the current environment against a manifest to identify missing dependencies.

#### Basic Usage

```bash
# Analyze gaps against manifest
claude-arch gaps --manifest manifest.yaml

# Show install commands for missing items
claude-arch gaps --manifest manifest.yaml --fix

# Compare against another project
claude-arch gaps --from /path/to/source/project

# JSON output for automation
claude-arch gaps --manifest manifest.yaml --json
```

#### Example Output

```
Environment Gap Analysis
========================

MCP Servers
✗ github - NOT INSTALLED
  Install: npx @anthropic/mcp-github
✗ postgres - NOT INSTALLED
  Install: npx @anthropic/mcp-postgres
✓ slack - installed

CLI Tools
✗ ffuf - NOT FOUND
  Install: go install github.com/ffuf/ffuf/v2@latest
✗ nuclei - NOT FOUND
  Install: go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
✓ git - available (2.39.0)
✓ npm - available (10.2.0)
⊘ xcodebuild - SKIPPED (darwin only, current: linux)

Environment Variables
✗ ANTHROPIC_API_KEY - NOT SET
✗ GITHUB_TOKEN - NOT SET
✓ DATABASE_URL - set

Paths
✗ ~/Desktop/projects - NOT FOUND
✓ ./scripts - exists

Summary
=======
Required: 8 missing, 4 available
Optional: 2 missing, 1 available

Run 'claude-arch gaps --manifest manifest.yaml --fix' for install commands
```

#### With --fix Flag

Shows copy-pasteable install commands:

```bash
$ claude-arch gaps --manifest manifest.yaml --fix

To fix missing dependencies, run:

# MCP Servers
claude mcp add github -- npx @anthropic/mcp-github
claude mcp add postgres -- npx @anthropic/mcp-postgres

# CLI Tools
go install github.com/ffuf/ffuf/v2@latest
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Environment Variables (add to ~/.bashrc or ~/.zshrc)
export ANTHROPIC_API_KEY="your-key-here"
export GITHUB_TOKEN="your-token-here"
```

### Portable Workflow Example

**Scenario:** Moving iOS project from Mac to Linux VPS for CI/CD

```bash
# 1. On Mac - Export configuration for Linux
claude-arch export -o manifest.yaml --platform linux --generate-setup

# 2. Copy to VPS
scp manifest.yaml manifest.sh user@vps:/projects/myapp/

# 3. On VPS - Check requirements
./manifest.sh --check-only

# 4. On VPS - Install dependencies
./manifest.sh

# 5. Verify everything is ready
claude-arch gaps -m manifest.yaml

# 6. Deploy application
# (your deployment commands here)
```

**Result:** Platform-specific tools (xcodebuild) are excluded, Linux equivalents are used, and the setup script handles all the installation automatically.

---

### Performance Optimization

For large projects with many files:

**Problem**: Slow config resolution

**Solutions**:

1. **Use minimal structure** for small projects
   - Single files are faster to parse
   - Only use full structure when needed

2. **Limit file size** (keep under 200 lines)
   - Split large files into subdirectories
   - One topic per file

3. **Cache results** (CLI does this automatically)
   - First run: parses all files
   - Subsequent runs: uses cache
   - Cache invalidates on file changes

4. **Exclude unnecessary scopes**
   ```bash
   # Only resolve project scope (skip user)
   claude-arch show --scope project
   ```

---

### Extending with Custom Layers

**Not recommended**, but possible if you need domain-specific organization:

1. Fork the codebase
2. Modify `src/types/layers.ts` to add your layer
3. Update merge logic in `src/engine/merger.ts`
4. Rebuild and use your custom version

**Better approach**: Use subdirectories within existing layers.

Example: Instead of creating a "database" layer, use:
```
.claude/knowledge/database/
```

This works within the existing 5-layer structure.

---

## Next Steps

- **Getting started**: See [Quick Start](../README.md#quick-start)
- **Migration**: See [Migration Guide](./migration-guide.md)
- **Best practices**: See [Best Practices](./best-practices.md)
- **Troubleshooting**: See [Troubleshooting](./troubleshooting.md)
- **Examples**: Explore [examples/](../examples/)

---

**Questions?** Open an issue on GitHub or consult the [specification](./spec.md).
