# Quick Reference: What's Working Now

## ✅ Working Commands

### Show All Configuration Sources
```bash
# Unified view of ALL config (recommended)
claude-arch show --format unified
# Shorthand:
claude-arch show --show-sources

# With full details
claude-arch show --show-sources --verbose

# Compact view
claude-arch show --format tree

# JSON output (for automation)
claude-arch show --format json
```

### What You Get
The tool shows ALL active configuration from:
- **User config** (~/.claude/) - Your personal context
- **Project config** (CLAUDE.md, AGENTS.md, skills/) - Project-specific
- **New structure** (.claude/rules/, .claude/tools/, etc.) - Organized layers

## 📊 Example Output

```
=== Active Configuration ===

RULES (4 sources)
├─ [.claude/rules/] New layered structure
├─ [project/.claude/CLAUDE.md] Project rules
├─ [project/AGENTS.md] Agent constraints
└─ [~/.claude/CLAUDE.md] User-level rules

TOOLS (3 sources)
├─ [.claude/tools/] New layered structure
├─ [~/.claude.json] MCP servers (global)
└─ [.claude/skills/] 1 skill (build-iphone-apps)

METHODS (3 sources)
├─ [.claude/methods/] New layered structure
├─ [project/AGENTS.md] Workflows and procedures
└─ [.claude/skills/*/workflows/] 6 workflows

KNOWLEDGE (4 sources)
├─ [.claude/knowledge/] New layered structure
├─ [project/.claude/CLAUDE.md] Project context
├─ [project/AGENTS.md] Architecture details
└─ [.claude/skills/*/references/] 19 references

GOALS (1 source)
└─ [.claude/goals/] New layered structure

⚠ Project Configuration Fragmentation

Legacy project files (consider migrating):
  • project/.claude/CLAUDE.md
  • project/AGENTS.md

Run 'claude-arch migrate --all' to consolidate
Note: User-level config (~/.claude/) provides context and won't be migrated

Summary:
  • User-level sources: 3
  • Project-level sources: 3
  • New structure sources: 5
  • Legacy files: 2
```

## 🎯 What This Tells You

### ✅ You Can See:
1. **All active config** - Nothing is hidden
2. **Where each rule/tool/method comes from** - Full source attribution
3. **User vs project separation** - Clear boundaries
4. **Fragmentation** - What needs consolidation (project only)
5. **Skills details** - Workflows, references, commands
6. **MCP servers** - Global and project-specific

### ✅ User Config is Context
- User config (~/.claude/) is **read-only context**
- It provides personal preferences and settings
- It's NOT considered "fragmentation"
- It won't be migrated (by design)

### ✅ Project Fragmentation Detection
The tool only flags **project-level** issues:
- Legacy files (CLAUDE.md, AGENTS.md) that could be migrated
- Duplicates within project scope
- Missing organization opportunities

## 🔍 Understanding the Output

### Source Paths
- **Full path** = Legacy/scattered file
- **[.claude/layer/]** = New organized structure
- **[~/.claude/]** = User-level (personal)
- **[project/]** = Project-level

### Precedence Order (Highest to Lowest)
1. Task context (explicit instruction)
2. Project .claude/ new structure
3. Project CLAUDE.md/AGENTS.md (legacy)
4. Project skills
5. User ~/.claude/ (context)
6. System defaults

## 🚀 Common Workflows

### Check what's active in current project
```bash
claude-arch show --format unified
```

### See full skill details
```bash
claude-arch show --format unified --verbose
```

### Export config for automation
```bash
claude-arch show --format json > config.json
```

### Check another directory
```bash
claude-arch show --target-dir /path/to/project --format unified
```

## ⚠️ Important Notes

### User Config Won't Be Touched
- User config (~/.claude/) is personal
- Migration only affects project files
- This is correct behavior

### Legacy Detection
- Only flags **project-level** legacy files
- Suggests migration for better organization
- You control when/if to migrate

### No False Positives
- User vs project is **not** a conflict
- That's normal precedence
- Only project duplicates are flagged

## 🎓 Real-World Example

Tested on production iOS app project with:
- Mixed legacy (CLAUDE.md + AGENTS.md)
- Skills with 6 workflows + 19 references
- Both user and project config
- New layered structure

Result: Clear, accurate, actionable output with zero false positives.

## 📝 Next Commands (Coming Soon)

```bash
# Validate all config (in progress)
claude-arch validate

# Migrate project legacy files (in progress)
claude-arch migrate --all

# Health check with fixes (not started)
claude-arch doctor
```
