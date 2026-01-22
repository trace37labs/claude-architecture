# Claude Unified Architecture

> Bringing order to the chaos of Claude Code configuration.

## The Problem

Claude Code has evolved organically, resulting in **10+ overlapping systems** for configuration:

- `CLAUDE.md` — project instructions
- `AGENTS.md` — agent definitions
- Skills — capability packages
- Hooks — lifecycle events
- Plugins — extended functionality
- MCP Servers — external tools
- Slash Commands — custom commands
- System Prompts — base behavior
- User Memory — persistent context
- User Preferences — settings

**No clear hierarchy. No composition model. No mental model.**

## The Solution

A 5-layer architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: GOALS                                         │
│  What to achieve. Tasks, objectives, success criteria.  │
├─────────────────────────────────────────────────────────┤
│  LAYER 4: KNOWLEDGE                                     │
│  What I know. Context, specs, domain information.       │
├─────────────────────────────────────────────────────────┤
│  LAYER 3: METHODS                                       │
│  How to do it. Patterns, approaches, workflows.         │
├─────────────────────────────────────────────────────────┤
│  LAYER 2: TOOLS                                         │
│  What I use. MCP servers, commands, capabilities.       │
├─────────────────────────────────────────────────────────┤
│  LAYER 1: RULES                                         │
│  Constraints. Limits, guardrails, non-negotiables.      │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
project/
├── .claude/
│   ├── rules/        # Layer 1: Constraints
│   ├── tools/        # Layer 2: Capabilities
│   ├── methods/      # Layer 3: How-to
│   ├── knowledge/    # Layer 4: Context
│   └── goals/        # Layer 5: Objectives
└── ...
```

## Precedence

```
Task Context    →  Most specific (wins)
Project         →  .claude/ in project
User            →  ~/.claude/
System          →  Anthropic defaults (lowest)
```

## Installation

Install globally via npm:

```bash
npm install -g claude-arch
```

Or use directly with npx:

```bash
npx claude-arch init
```

## Quick Start

### 1. Initialize a New Project

```bash
# Create minimal structure (single files per layer)
claude-arch init

# Create full structure (subdirectories per layer)
claude-arch init --full
```

### 2. Migrate Existing Configuration

```bash
# Migrate CLAUDE.md and AGENTS.md to new structure
claude-arch migrate

# Preview migration without writing files
claude-arch migrate --dry-run

# Force overwrite existing .claude/ directory
claude-arch migrate --force
```

### 3. Validate Your Configuration

```bash
# Validate structure and schemas
claude-arch validate

# Detailed output
claude-arch validate --verbose
```

### 4. View Active Configuration

```bash
# Show merged configuration
claude-arch show

# Show with precedence chain
claude-arch show --precedence

# JSON output
claude-arch show --json
```

### 5. Health Check

```bash
# Run health check with recommendations
claude-arch doctor

# Show quick wins only
claude-arch doctor --quick-wins

# JSON output for tooling
claude-arch doctor --json
```

## MCP Server Integration

Add to your Claude Code MCP configuration:

```bash
claude mcp add claude-arch -- npx -y claude-arch-mcp
```

This exposes 4 tools:
- `resolve-config` - Get merged configuration
- `validate-structure` - Check structure compliance
- `detect-conflicts` - Find configuration conflicts
- `get-recommendations` - Get improvement suggestions

## Documentation

- [Full Specification](docs/spec.md) — Complete architecture specification
- [Examples](examples/) — Example projects demonstrating different patterns
- [Migration Guide](docs/migration.md) — Moving from current config *(coming soon)*

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Watch mode for development
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Project Status

✅ **Phase 1-3 Complete** — Core implementation finished (v0.1.0)

**Completed:**
- ✅ 5-layer parser and precedence engine
- ✅ CLI commands (init, migrate, validate, show, doctor)
- ✅ MCP server integration
- ✅ 332+ unit tests (all passing)
- ✅ Example projects
- ✅ npm package ready

**In Progress:**
- 📝 Video tutorials

## Contributing

Feedback welcome via issues and discussions.

## License

MIT

---

*Bringing clarity to Claude Code configuration.*
