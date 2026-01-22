# Claude Unified Architecture

A 5-layer configuration system for Claude Code.

## Project Structure

```
src/
├── cli.ts              # CLI entry point
├── commands/           # init, migrate, validate, show, doctor
├── engine/             # Precedence & merge logic
├── parsers/            # Legacy CLAUDE.md parser
├── types/              # Zod schemas for 5 layers
├── scanner.ts          # File system discovery
├── loader.ts           # Config loading & merging
├── reader.ts           # File reading utilities
├── validators/         # Structure validation
├── formatters/         # Output formatting
└── mcp/                # MCP server integration
```

## The 5 Layers

1. **RULES** - Constraints (absolute, additive)
2. **TOOLS** - Capabilities (additive)
3. **METHODS** - How-to patterns (override)
4. **KNOWLEDGE** - Context (additive)
5. **GOALS** - Current objectives (override)

## Development

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript
npm test             # Run tests
npm run dev          # Watch mode
```

## Key Files

- `docs/spec.md` - Full architecture specification
- `examples/` - Simple, complex, and migrated project examples
- `tests/` - Unit, integration, and benchmark tests
