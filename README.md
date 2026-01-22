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

### 3. Portable Environments (Shift & Lift)

**Export and deploy configurations across different environments:**

- 📦 **Export manifests** with `export` command
- 🔍 **Gap analysis** with `gaps` command
- 🖥️ **Platform-aware** (Mac → Linux → Windows)
- 🔧 **Auto-generate setup scripts** for new environments
- ✅ **Validate environments** before deployment

**Perfect for:**
- Mac → VPS migration
- Team onboarding
- CI/CD validation
- Multi-environment projects

### 4. Smart Precedence

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

# Filter by scope (user, project, task, system)
claude-arch show --show-sources --scope project

# Filter by layer (rules, tools, methods, knowledge, goals)
claude-arch show --show-sources --layer rules
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
```

### `export` — Portable Environment Manifest

**Generate a portable manifest for cross-environment deployment** (Mac → VPS, local → CI/CD):

```bash
# Export manifest for current platform
claude-arch export --output manifest.yaml

# Export targeting specific platform (smart filtering)
claude-arch export --output manifest.yaml --platform linux
claude-arch export --output manifest.yaml --platform darwin
claude-arch export --output manifest.yaml --platform windows

# Generate executable setup script alongside manifest
claude-arch export --output manifest.yaml --generate-setup

# JSON format
claude-arch export --output manifest.json --json
```

**Platform-aware export:**

When you specify `--platform <target>`, the tool intelligently:
- Excludes platform-specific tools (e.g., xcodebuild excluded on linux)
- Maps install commands (apt-get vs brew vs winget)
- Pre-maps paths (~/Desktop → /home/user)

**What gets exported:**

- ✅ MCP servers (required & optional)
- ✅ CLI tools with install commands
- ✅ Environment variables
- ✅ Required paths/directories
- ✅ Skills and dependencies
- ✅ Hooks and scripts
- ✅ Platform mappings (darwin ↔ linux ↔ windows)

**Example manifest:**

```yaml
metadata:
  generated_from: /Users/paul/project
  date: 2026-01-22
  platform: darwin
  target_platform: linux

required:
  mcp_servers:
    - name: github
      package: "@anthropic/mcp-github"
      required: true

  cli_tools:
    - name: ffuf
      required: true
      install_cmd: "apt-get install -y ffuf || go install github.com/ffuf/ffuf/v2@latest"
    # xcodebuild excluded - darwin-only

  environment_variables:
    - name: ANTHROPIC_API_KEY
      required: true

path_mappings:
  darwin_to_linux:
    "~/Desktop/projects": "/home/user/projects"
    "~/Library/Application Support": "~/.config"
```

**Generated setup script** (with `--generate-setup`):

```bash
#!/bin/bash
# Usage: ./setup.sh [--check-only] [--skip-optional]

# Checks environment and installs missing dependencies
./setup.sh                # Install everything
./setup.sh --check-only   # Just show what's missing
./setup.sh --skip-optional # Skip optional dependencies
```

### `gaps` — Environment Gap Analysis

**Compare current environment against a manifest to see what's missing:**

```bash
# Analyze gaps against manifest
claude-arch gaps --manifest manifest.yaml

# Show install commands for missing items
claude-arch gaps --manifest manifest.yaml --fix

# JSON output for automation
claude-arch gaps --manifest manifest.yaml --json
```

**Example output:**

```
Environment Gap Analysis
========================

MCP Servers
✗ github - NOT INSTALLED
  Install: npx @anthropic/mcp-github
✓ postgres - installed

CLI Tools
✗ ffuf - NOT FOUND
  Install: go install github.com/ffuf/ffuf/v2@latest
✓ git - available (2.39.0)
⊘ xcodebuild - SKIPPED (darwin only, current: linux)

Environment Variables
✗ ANTHROPIC_API_KEY - NOT SET
✓ DATABASE_URL - set

Summary
=======
Required: 2 missing, 3 available
Optional: 1 missing, 0 available

Run 'claude-arch gaps --manifest manifest.yaml --fix' for install commands
```

**Use cases:**

1. **Mac → VPS Migration**
   ```bash
   # On Mac - export for Linux
   claude-arch export -o manifest.yaml --platform linux --generate-setup
   scp manifest.yaml setup.sh vps:/projects/

   # On VPS - check and install
   ./setup.sh
   ```

2. **Team Onboarding**
   ```bash
   # New team member clones repo
   git clone project && cd project
   claude-arch gaps -m manifest.yaml
   # Shows exactly what they need to install
   ```

3. **CI/CD Validation**
   ```bash
   # In CI pipeline
   claude-arch gaps -m manifest.yaml --json | jq '.summary.required_missing'
   # Fail build if required items missing
  📌 Define current goals
     ✅ Action: Add goals to guide Claude's work
     💎 Benefit: Focus efforts on what matters most
```

**Note:** User-level config is NOT flagged as fragmentation - it's normal context.

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

v0.1.4 — Production-Ready:
- ✅ 5-layer parser with precedence engine
- ✅ Universal configuration scanner (10+ sources)
- ✅ Portable architecture (export/gaps commands)
- ✅ Platform-aware deployment (darwin, linux, windows)
- ✅ Automated setup script generation
- ✅ All CLI commands working and tested
- ✅ MCP server integration
- ✅ 332+ tests passing

## License

MIT
