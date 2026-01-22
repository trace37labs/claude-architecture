# Claude Unified Architecture

A CLI tool that organises Claude Code configuration into a clear, layered structure.

## Why This Exists

When you start using Claude Code, configuration is simple - maybe a `CLAUDE.md` file with some project notes.

Then it grows:

```
CLAUDE.md          ← project instructions
AGENTS.md          ← agent definitions
~/.claude/         ← user preferences
skills/            ← capability packages
hooks              ← lifecycle events
MCP servers        ← external tools
slash commands     ← custom commands
plugins            ← extended functionality
```

Soon you're asking:
- "Should this go in CLAUDE.md or a skill?"
- "Do my user settings override project settings, or the other way around?"
- "How do I share project config without sharing my personal preferences?"
- "Where did I put that instruction?"

There's no clear system. Things overlap. It's hard to know what's active.

## What This Tool Does

It reorganises everything into **5 layers**, each with a clear purpose:

| Layer | Purpose | Example |
|-------|---------|---------|
| **RULES** | Constraints that must be followed | "Never commit secrets", "Always use TypeScript strict mode" |
| **TOOLS** | Capabilities available to use | MCP servers, slash commands, scripts |
| **METHODS** | How to do things | Workflows, patterns, checklists |
| **KNOWLEDGE** | Context and information | Architecture docs, glossary, specs |
| **GOALS** | Current objectives | Sprint goals, success criteria, priorities |

Everything lives in a `.claude/` directory:

```
project/
└── .claude/
    ├── rules/        # What must be followed
    ├── tools/        # What can be used
    ├── methods/      # How to do things
    ├── knowledge/    # What to know
    └── goals/        # What to achieve
```

## How Precedence Works

When the same thing is defined in multiple places, the most specific wins:

```
Task Context    →  Highest priority (most specific)
Project         →  .claude/ in your project
User            →  ~/.claude/ (your personal config)
System          →  Anthropic defaults (lowest priority)
```

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
claude-arch migrate            # Convert CLAUDE.md and AGENTS.md
claude-arch migrate --dry-run  # Preview without writing files
```

### `validate` — Check your configuration

```bash
claude-arch validate           # Check structure and schemas
claude-arch validate --verbose # Detailed output
```

### `show` — See what's active

```bash
claude-arch show              # Show merged configuration
claude-arch show --precedence # Show where each setting comes from
claude-arch show --json       # JSON output
```

### `doctor` — Health check

```bash
claude-arch doctor            # Find issues and get recommendations
claude-arch doctor --quick-wins # Show easy improvements
```

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

v0.1.0 — Core functionality complete:
- 5-layer parser with precedence engine
- All CLI commands working
- MCP server integration
- 332+ tests passing

## License

MIT
