# Quick Start Guide

## Installation

```bash
npm install -g claude-arch
```

Or use directly:

```bash
npx claude-arch show --format unified
```

## First Time Usage

### 1. See What's Active

```bash
claude-arch show --format unified
```

This shows ALL your configuration sources in one view.

**Example output:**

```
RULES (2 sources)
├─ [project/.claude/CLAUDE.md] Project rules
└─ [~/.claude/CLAUDE.md] User-level rules

TOOLS (2 sources)
├─ [~/.claude.json] MCP: github, postgres
└─ [project/.claude/skills/] 1 skill(s)

METHODS (1 source)
└─ [project/AGENTS.md] Workflows

KNOWLEDGE (2 sources)
├─ [project/.claude/CLAUDE.md] Project context
└─ [~/.claude/memory/] User context

GOALS
└─ (none defined)

Summary:
• User-level sources: 3
• Project-level sources: 2
```

### 2. Check Health

```bash
claude-arch doctor --recommendations
```

Get a health score and recommendations for improvement.

### 3. Validate Configuration

```bash
claude-arch validate --check-all-sources
```

Check for issues across all config sources.

## Common Workflows

### Starting a New Project

```bash
# Create new structure
claude-arch init

# Or create full structure with subdirectories
claude-arch init --full
```

### Migrating Existing Project

```bash
# Preview what would be migrated
claude-arch migrate --all --dry-run

# Actually migrate
claude-arch migrate --all
```

**What gets migrated:**
- CLAUDE.md → split across layers
- AGENTS.md → primarily methods
- Only PROJECT files (user config untouched)

### Regular Health Checks

```bash
# Quick health check
claude-arch doctor

# With recommendations
claude-arch doctor --recommendations

# Verbose output
claude-arch doctor --recommendations --verbose
```

## Understanding Your Configuration

### User vs Project

**User Config** (~/.claude/)
- Personal to you
- Global MCP servers
- Your memory and preferences
- **Never migrated** (it's personal)

**Project Config** (project/.claude/)
- Shared with team
- Project-specific rules
- Can be migrated to new structure

### The 5 Layers

Every configuration item fits into one of 5 layers:

1. **RULES** - What must be followed (security, constraints)
2. **TOOLS** - What can be used (MCP servers, commands)
3. **METHODS** - How to do things (workflows, patterns)
4. **KNOWLEDGE** - What to know (architecture, context)
5. **GOALS** - What to achieve (current objectives)

### Configuration Sources

The tool automatically discovers:
- ✅ ~/.claude.json (MCP servers)
- ✅ ~/.claude/settings.json
- ✅ ~/.claude/memory/*.md
- ✅ ./CLAUDE.md
- ✅ ./AGENTS.md
- ✅ ./.claude/settings.json
- ✅ ./.claude/skills/
- ✅ ./.claude/commands/
- ✅ ./.mcp.json
- ✅ ./.claude/{rules,tools,methods,knowledge,goals}/

## Common Questions

### "Should I migrate my config?"

Check the doctor output:

```bash
claude-arch doctor
```

If you see "Legacy files", consider migrating for:
- ✅ Clearer organization
- ✅ Easier to maintain
- ✅ Less chance of conflicts

### "Will it migrate my ~/.claude/ files?"

**No.** User config is personal and stays in ~/.claude/

Only PROJECT files get migrated.

### "What if I have both CLAUDE.md and .claude/rules/?"

The tool will:
1. Show both in unified view
2. Flag as "fragmentation" in doctor
3. Suggest migrating to consolidate

But both will work - it's just cleaner to have one source.

### "How do I share config with my team?"

Project config (.claude/) is team-shared.
User config (~/.claude/) is personal.

Commit .claude/ to git, ignore ~/.claude/

## Next Steps

1. **Run show** to understand current state
2. **Run doctor** to get recommendations
3. **Consider migrating** if you have legacy files
4. **Check docs/** for detailed guides

## Getting Help

- `claude-arch --help` - Command help
- `docs/QUICK_REFERENCE.md` - Quick reference
- `docs/IMPLEMENTATION_STATUS.md` - Full capabilities
- `README.md` - Complete documentation

## Tips

- **Start with show** - Always good to see what's active
- **Doctor is your friend** - Regular health checks catch issues early
- **Use --dry-run** - Preview before making changes
- **Verbose mode** - When you need more details
- **User config is sacred** - It's never migrated or flagged as issues
