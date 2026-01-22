# Claude Unified Architecture

**Status: ✅ Production-Ready**

A CLI tool that organises Claude Code configuration into a clear, layered structure.

Answer "what's active?" in seconds: `claude-arch show --format unified`

## The Problem

Claude Code configuration is fragmented across **10+ locations**:

```
~/.claude.json                    # MCP servers (global)
~/.claude/settings.json           # User preferences
~/.claude/memory/*.md             # User memory
project/CLAUDE.md                 # Project instructions
project/AGENTS.md                 # Agent definitions
project/.claude/settings.json     # Project settings
project/.claude/skills/           # Skill packages
project/.claude/commands/         # Slash commands
project/.claude/hooks             # Lifecycle events (in settings)
project/.mcp.json                 # Project MCP servers
```

**Nobody knows what's active, what overrides what, or where to put things.**

Soon you're asking:
- "Should this go in CLAUDE.md or a skill?"
- "Do my user settings override project settings?"
- "How do I share project config without my personal preferences?"
- "Where did I put that MCP server definition?"
- "Why isn't my hook working?"

There's no unified view. Things overlap. Configuration is scattered everywhere.

## What This Tool Does

### 1. Universal Configuration Scanner

**Discovers ALL config sources** across the entire Claude Code ecosystem:

- ✅ **Legacy files** (CLAUDE.md, AGENTS.md)
- ✅ **MCP configuration** (~/.claude.json, .mcp.json)
- ✅ **Settings files** (settings.json with hooks & permissions)
- ✅ **Skills** (.claude/skills/*/SKILL.md)
- ✅ **Commands** (.claude/commands/*.md)
- ✅ **User memory** (~/.claude/memory/*.md)
- ✅ **New layered structure** (.claude/rules/, .claude/tools/, etc.)

### 2. Unified View

**Shows everything in one place**, organized by the **5-layer architecture**:

| Layer | Purpose | Sources It Reads From |
|-------|---------|----------------------|
| **RULES** | Constraints that must be followed | CLAUDE.md, AGENTS.md, settings.json (permissions), .claude/rules/ |
| **TOOLS** | Capabilities available to use | ~/.claude.json (MCP), .mcp.json, settings.json (hooks), skills/, commands/, .claude/tools/ |
| **METHODS** | How to do things | AGENTS.md, skills/workflows/, .claude/methods/ |
| **KNOWLEDGE** | Context and information | CLAUDE.md, AGENTS.md, ~/.claude/memory/, skills/references/, .claude/knowledge/ |
| **GOALS** | Current objectives | .claude/goals/ |

Run `claude-arch show --format unified` to see the **complete picture**.

### 3. Smart Precedence

**User vs Project is read-only context, not fragmentation:**

- **User-level** (~/.claude/) — Personal preferences, memory, global tools
- **Project-level** (project/.claude/) — Shared team configuration

User config provides context. Only project files can be migrated to new structure.

The tool will NEVER suggest migrating user files or flag user vs project as "duplicates" - that's normal precedence.

## Architecture Overview

### Configuration Sources (Discovered Automatically)

The tool scans **all 10+ possible config locations**:

| Source | Location | Layer(s) |
|--------|----------|----------|
| **User MCP** | ~/.claude.json | TOOLS |
| **User Settings** | ~/.claude/settings.json | RULES (permissions), TOOLS (hooks) |
| **User Memory** | ~/.claude/memory/*.md | KNOWLEDGE |
| **User Instructions** | ~/.claude/CLAUDE.md | RULES, KNOWLEDGE |
| **Project Instructions** | ./CLAUDE.md or ./.claude/CLAUDE.md | RULES, KNOWLEDGE |
| **Agent Definitions** | ./AGENTS.md | METHODS, KNOWLEDGE |
| **Project Settings** | ./.claude/settings.json | RULES (permissions), TOOLS (hooks) |
| **Skills** | ./.claude/skills/*/SKILL.md | TOOLS, METHODS, KNOWLEDGE |
| **Commands** | ./.claude/commands/*.md | TOOLS |
| **Project MCP** | ./.mcp.json | TOOLS |
| **New Structure** | ./.claude/{rules,tools,methods,knowledge,goals}/ | All layers |

### Precedence Rules

When the same thing is defined in multiple places:

```
Task Context    →  Highest priority (explicit user instruction)
Project         →  .claude/ in project (shared team config)
User            →  ~/.claude/ (personal preferences & memory)
System          →  Anthropic defaults (lowest priority)
```

**IMPORTANT:** User vs project is **normal precedence**, not fragmentation:
- User config is **read-only context** (personal memory, preferences)
- Only **project config** can have fragmentation (duplicates within project)
- Tool will **never** suggest migrating user files

Different layers merge differently:
- **RULES, TOOLS, KNOWLEDGE** — additive (everything applies)
- **METHODS, GOALS** — override (specific replaces general)

## Installation

```bash
npm install -g claude-arch
```

Or use directly:

```bash
npx claude-arch init
```

## Commands

### `init` — Start a new project

```bash
claude-arch init           # Minimal structure (one file per layer)
claude-arch init --full    # Full structure (subdirectories per layer)
```

### `migrate` — Convert existing config

```bash
# Migrate PROJECT files to new structure (recommended)
claude-arch migrate --all

# Preview migration without writing files
claude-arch migrate --all --dry-run

# Migrate specific sources
claude-arch migrate --source mcp      # MCP config → .claude/tools/mcp.yaml
claude-arch migrate --source hooks    # Hooks → .claude/tools/hooks.yaml
claude-arch migrate --source skills   # Flatten skills into layers
```

**What gets migrated:**

- ✅ CLAUDE.md → split across layers
- ✅ AGENTS.md → primarily methods & knowledge
- ✅ MCP config → .claude/tools/mcp.yaml
- ✅ Hooks → .claude/tools/hooks.yaml
- ✅ Skills → flattened into layer files

**IMPORTANT:** User-level config (~/.claude/) is **read-only** and won't be migrated. Only project files are consolidated.

### `validate` — Check your configuration

```bash
# Check .claude/ directory structure and schemas
claude-arch validate

# Check ALL configuration sources (recommended)
claude-arch validate --check-all-sources

# Detailed output with suggestions
claude-arch validate --check-all-sources --verbose
```

Validates:
- ✅ MCP config files (~/.claude.json, .mcp.json)
- ✅ Settings.json structure (hooks, permissions)
- ✅ Skill manifests (SKILL.md files)
- ✅ Hook script paths (warns if missing)
- ✅ Directory structure (.claude/ layout)
- ✅ Schema compliance (YAML/JSON validity)
- ⚠️ **Only flags PROJECT-level fragmentation** (user config is read-only context)

### `show` — See what's active

```bash
# Unified view of ALL configuration sources (recommended)
claude-arch show --format unified
# Shorthand:
claude-arch show --show-sources

# Traditional layered view
claude-arch show --format tree

# Precedence chain view
claude-arch show --format precedence

# JSON output for tools
claude-arch show --format json

# Show verbose details (skill names, workflows, memory categories)
claude-arch show --format unified --verbose
```

**Example output:**

```
=== Active Configuration ===

RULES (4 sources)
├─ [.claude/rules/] New layered structure
├─ [project/.claude/CLAUDE.md] Project rules
├─ [project/AGENTS.md] Agent constraints
└─ [~/.claude/CLAUDE.md] User-level rules

TOOLS (3 sources)
├─ [~/.claude.json] MCP: github, postgres, slack
├─ [.claude/skills/] Skill: build-iphone-apps
└─ [project/.claude/settings.json] Hooks: pre-commit, post-task

METHODS (2 sources)
├─ [.claude/skills/build-iphone-apps/workflows/] 6 workflows
└─ [project/AGENTS.md] VPS deployment procedure

KNOWLEDGE (3 sources)
├─ [project/.claude/CLAUDE.md] Project paths, app details
├─ [.claude/skills/*/references/] 19 reference docs
└─ [~/.claude/memory/] User context

GOALS
└─ (none defined)

⚠ Project Configuration Fragmentation
Legacy files: CLAUDE.md, AGENTS.md
Run 'claude-arch migrate --all' to consolidate

Summary:
• User-level sources: 3
• Project-level sources: 3
• New structure sources: 5
```

### `doctor` — Health check

```bash
# Complete health check with recommendations
claude-arch doctor --recommendations

# Verbose output with all details
claude-arch doctor --recommendations --verbose

# JSON output for automation
claude-arch doctor --format json
```

**What it checks:**

- Configuration fragmentation (PROJECT-level only)
- Duplicate definitions (within project scope)
- Legacy files that could be migrated
- Missing essential layers (rules, knowledge)
- Health score (0-100) with actionable recommendations

**Example output:**

```
🟡 HEALTH SCORE: 77/100 (NEEDS-ATTENTION)

📊 SUMMARY:
⚠️  2 warning(s)
ℹ️  2 info message(s)

⚠️  CONFIGURATION FRAGMENTATION DETECTED:

  🔄 Duplicate definitions:
     • "Agent definitions" defined in:
       - /project/AGENTS.md
       - .claude/methods/ (new structure)

  📜 Legacy files (consider migrating):
     • /project/.claude/CLAUDE.md
     • /project/AGENTS.md

  💡 Recommendation: Run `claude-arch migrate --all` to consolidate
  💡 Benefit: Clearer config, easier to maintain

💡 RECOMMENDATIONS:

🎯 QUICK WINS (High Impact, Easy to Fix):

  📌 Add security rules
     ✅ Action: Add security constraints to rules layer
     💎 Benefit: Establish clear security boundaries

  📌 Define current goals
     ✅ Action: Add goals to guide Claude's work
     💎 Benefit: Focus efforts on what matters most
```

**Note:** User-level config is NOT flagged as fragmentation - it's normal context.

### `export` — Generate portable manifest

Create a manifest of all requirements for deployment to another environment:

```bash
# Export manifest (auto-detect current platform)
claude-arch export --output manifest.yaml

# Export for specific target platform
claude-arch export --output manifest.yaml --platform linux

# Generate setup script alongside manifest
claude-arch export --output manifest.yaml --generate-setup

# JSON output
claude-arch export --output manifest.json --json
```

**What it exports:**
- MCP servers and their packages
- CLI tools (with platform-specific filtering)
- Environment variables
- Path requirements
- Skills with dependencies
- Hooks and scripts
- Cross-platform path mappings

**Platform-aware export:** When exporting with `--platform`, the tool:
- Filters out incompatible tools (e.g., excludes xcodebuild when targeting linux)
- Adjusts install commands for target platform
- Maps paths appropriately (e.g., `~/Desktop` → `/home/user/Desktop`)

### `gaps` — Analyze environment gaps

Compare current environment against a manifest to find missing dependencies:

```bash
# Check what's missing
claude-arch gaps --manifest manifest.yaml

# Show install commands
claude-arch gaps --manifest manifest.yaml --fix

# JSON output for automation
claude-arch gaps --manifest manifest.yaml --json
```

**What it checks:**
- MCP server installation (~/.claude.json)
- CLI tool availability (with version detection)
- Environment variables (set vs not set)
- Path existence
- Hook script availability

**Example output:**
```
Environment Gap Analysis
========================

MCP Servers
✗ github - NOT INSTALLED
  Install: claude mcp add github -- npx @anthropic/mcp-github
✓ postgres - installed

CLI Tools
✗ ffuf - NOT FOUND
  Install: go install github.com/ffuf/ffuf/v2@latest
✓ git - available (2.39.0)
⊘ xcodebuild - SKIPPED (darwin only, current: linux)

Environment Variables
✗ ANTHROPIC_API_KEY - NOT SET
✓ GITHUB_TOKEN - set

Summary
=======
Required: 2 missing, 5 available
Optional: 0 missing, 1 available
```

**Use cases:**
- **Mac → VPS migration:** Export on Mac, check gaps on VPS, install missing tools
- **Team onboarding:** New members run `gaps` to see exactly what they need
- **CI/CD validation:** Automated checks that environment has all required dependencies

## MCP Server

Integrate with Claude Code directly:

```bash
claude mcp add claude-arch -- npx -y claude-arch-mcp
```

This adds 4 tools Claude can use:
- `resolve-config` — Get the merged configuration
- `validate-structure` — Check if structure is valid
- `detect-conflicts` — Find conflicting settings
- `get-recommendations` — Get improvement suggestions

## Examples

The `examples/` directory contains:

- **simple-project** — Minimal setup with one file per layer
- **complex-project** — Full structure with subdirectories
- **migrated-project** — Before/after showing migration from CLAUDE.md

## Documentation

- [Full Specification](docs/spec.md) — Complete architecture details
- [User Guide](docs/user-guide.md) — How to use the CLI
- [Migration Guide](docs/migration-guide.md) — Moving from CLAUDE.md
- [Best Practices](docs/best-practices.md) — Recommended patterns
- [Troubleshooting](docs/troubleshooting.md) — Common issues

## Development

```bash
npm install      # Install dependencies
npm run build    # Build TypeScript
npm test         # Run tests
npm run dev      # Watch mode
```

## Status

v0.1.3 — Full feature set complete:
- 5-layer parser with precedence engine
- Portable architecture (export/gaps commands)
- Cross-platform support (darwin, linux, windows)
- All CLI commands working
- MCP server integration
- 332+ tests passing

## License

MIT
