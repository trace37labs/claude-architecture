# Simple Project Example

This example demonstrates the **minimal structure** of the 5-layer Claude architecture.

## Structure

```
.claude/
├── rules.md       # Layer 1: Security and constraints
├── tools.md       # Layer 2: MCP servers and tools
├── methods.md     # Layer 3: Workflows and patterns
├── knowledge.md   # Layer 4: Project context and specs
└── goals.md       # Layer 5: Current objectives
```

## Use Case

This structure is ideal for:
- Small projects
- Quick prototypes
- Personal projects
- Simple CLIs or scripts

## How to Create

```bash
cd your-project
claude-arch init --minimal
```

## What's Included

Each file contains starter templates showing how to use that layer:
- **rules.md**: Example security constraints
- **tools.md**: Sample MCP server configuration
- **methods.md**: Basic workflow patterns
- **knowledge.md**: Project overview and architecture
- **goals.md**: Current sprint goals

## Validation

Validate this structure:

```bash
claude-arch validate examples/simple-project
```

## Next Steps

1. Customize each layer for your project
2. Add more content as your project grows
3. Migrate to full structure if needed (`claude-arch migrate --to-full`)
