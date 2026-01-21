# Complex Project Example

This example demonstrates the **full structure** of the 5-layer Claude architecture with subdirectories.

## Structure

```
.claude/
├── rules/
│   ├── security.md
│   ├── code-standards.md
│   └── process.md
├── tools/
│   ├── mcp.yaml
│   └── commands/
│       └── README.md
├── methods/
│   ├── workflows/
│   │   └── feature-development.md
│   └── patterns/
│       └── error-handling.md
├── knowledge/
│   ├── overview.md
│   ├── architecture.md
│   └── glossary.md
└── goals/
    ├── current.md
    └── backlog.md
```

## Use Case

This structure is ideal for:
- Large projects with multiple teams
- Complex architectures
- Projects with extensive documentation needs
- Enterprise applications

## How to Create

```bash
cd your-project
claude-arch init  # Full structure is the default
```

## What's Included

### Rules Layer
- **security.md**: Authentication, authorization, data protection
- **code-standards.md**: Style guides, naming conventions
- **process.md**: Git workflow, review process, deployment

### Tools Layer
- **mcp.yaml**: All MCP server configurations
- **commands/**: Custom command definitions

### Methods Layer
- **workflows/**: Step-by-step process guides
- **patterns/**: Reusable code patterns and best practices

### Knowledge Layer
- **overview.md**: High-level project description
- **architecture.md**: System design and technical decisions
- **glossary.md**: Domain-specific terminology

### Goals Layer
- **current.md**: Active sprint or milestone
- **backlog.md**: Future work and ideas

## Validation

Validate this structure:

```bash
claude-arch validate examples/complex-project
```

## Next Steps

1. Organize content into appropriate subdirectories
2. Create additional files as needed (e.g., `methods/patterns/caching.md`)
3. Use `claude-arch show` to visualize merged configuration
