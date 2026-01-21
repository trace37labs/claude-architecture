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

## Documentation

- [Full Specification](docs/spec.md) — Complete architecture specification
- [Migration Guide](docs/migration.md) — Moving from current config *(coming soon)*
- [Examples](examples/) — Example configurations *(coming soon)*

## CLI Tool *(Coming Soon)*

```bash
# Scaffold new structure
claude-arch init

# Migrate existing config
claude-arch migrate

# Validate configuration
claude-arch validate

# Show active config
claude-arch show
```

## Status

🚧 **Draft** — This is an early proposal for community discussion.

## Contributing

This is an open proposal. Feedback welcome via issues and discussions.

## License

MIT

---

*A proposal to bring architectural clarity to the Claude ecosystem.*
