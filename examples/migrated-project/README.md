# Migrated Project Example

This example demonstrates migrating from the **old CLAUDE.md format** to the **new 5-layer architecture**.

## Structure

```
before/              # Original format
├── CLAUDE.md        # All config in one file
└── AGENTS.md        # Agent definitions

after/               # After migration
└── .claude/         # 5-layer structure
    ├── rules.md
    ├── tools.md
    ├── methods.md
    ├── knowledge.md
    └── goals.md
```

## Migration Process

### 1. Before Migration

The old format had everything in `CLAUDE.md`:
- Mix of rules, tools, and knowledge
- Hard to find specific information
- No clear precedence
- Difficult to maintain

### 2. Run Migration

```bash
cd migrated-project
claude-arch migrate --from before/CLAUDE.md --to .claude/ --minimal
```

### 3. After Migration

Content is automatically classified into the correct layers:
- **Rules**: Security constraints, code standards
- **Tools**: MCP server configs, commands
- **Methods**: Workflows and patterns
- **Knowledge**: Architecture docs, glossary
- **Goals**: Current objectives

## What Gets Migrated

The migration tool:
1. **Reads** old CLAUDE.md and AGENTS.md files
2. **Classifies** content using keyword analysis
3. **Writes** content to appropriate layer files
4. **Preserves** unclassified content in knowledge layer
5. **Creates** backup of original files

## Classification Rules

### Rules Layer
Triggered by keywords: security, constraint, forbidden, must not, rule, guideline

### Tools Layer
Triggered by keywords: MCP, server, command, capability, API key

### Methods Layer
Triggered by keywords: workflow, pattern, how-to, process, step

### Knowledge Layer
Triggered by keywords: architecture, overview, glossary, spec, technical

### Goals Layer
Triggered by keywords: goal, objective, task, sprint, milestone, TODO

## Validation

After migration, validate the structure:

```bash
claude-arch validate after/.claude
```

Check the classified content:

```bash
claude-arch show after/.claude
```

## Manual Review

After automatic migration:
1. Review each layer file for accuracy
2. Move any misclassified content
3. Add missing documentation
4. Update outdated information
5. Delete backup if satisfied

## Backup Safety

The migration tool:
- Creates `before/CLAUDE.md.backup`
- Never modifies original files
- Uses `--dry-run` to preview changes
- Can be rolled back safely

## Benefits After Migration

✅ Clear organization by purpose
✅ Easy to find relevant information
✅ Better precedence handling
✅ Scalable to large projects
✅ Works with `claude-arch` tools
