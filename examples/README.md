# Claude Architecture Examples

This directory contains example projects demonstrating the **5-layer Claude configuration architecture**.

## Available Examples

### 1. Simple Project (Minimal Structure)

📁 [`simple-project/`](./simple-project/)

**Use case**: Small projects, prototypes, personal CLIs

**Structure**: Single file per layer (5 files total)
```
.claude/
├── rules.md
├── tools.md
├── methods.md
├── knowledge.md
└── goals.md
```

**Best for**:
- Solo developers
- Quick prototypes
- Simple applications
- Learning the architecture

---

### 2. Complex Project (Full Structure)

📁 [`complex-project/`](./complex-project/)

**Use case**: Large projects, teams, enterprise applications

**Structure**: Subdirectories per layer with organized files
```
.claude/
├── rules/
│   ├── security.md
│   ├── code-standards.md
│   └── process.md
├── tools/
│   ├── mcp.yaml
│   └── commands/
├── methods/
│   ├── workflows/
│   └── patterns/
├── knowledge/
│   ├── overview.md
│   ├── architecture.md
│   └── glossary.md
└── goals/
    ├── current.md
    └── backlog.md
```

**Best for**:
- Multi-person teams
- Complex architectures
- Extensive documentation needs
- Production applications

---

### 3. Migrated Project (Before/After)

📁 [`migrated-project/`](./migrated-project/)

**Use case**: Transitioning from old CLAUDE.md format

**Shows**:
- Original CLAUDE.md (everything in one file)
- After migration (organized into 5 layers)
- Classification of content
- Migration process

**Demonstrates**:
- How to migrate existing projects
- Content classification rules
- Benefits of new structure

---

## Quick Start

### View an Example

```bash
# Navigate to any example
cd examples/simple-project

# View the structure
tree .claude

# Validate the structure
claude-arch validate .
```

### Create Your Own

Start with the structure that fits your needs:

```bash
# Minimal structure (like simple-project)
cd your-project
claude-arch init --minimal

# Full structure (like complex-project)
cd your-project
claude-arch init
```

### Migrate Existing Project

```bash
# From old CLAUDE.md format
cd your-project
claude-arch migrate --from CLAUDE.md --to .claude/ --minimal
```

## The 5-Layer Architecture

### Layer 1: RULES
**Purpose**: Constraints and non-negotiable guidelines

**Contains**:
- Security requirements
- Code standards
- Process rules
- Forbidden actions

**Precedence**: Absolute (most strict)

---

### Layer 2: TOOLS
**Purpose**: Available capabilities and integrations

**Contains**:
- MCP server configurations
- Custom commands
- External APIs
- Available tools

**Precedence**: Additive (all layers combine)

---

### Layer 3: METHODS
**Purpose**: How to accomplish tasks

**Contains**:
- Workflows and processes
- Code patterns
- Best practices
- Step-by-step guides

**Precedence**: Override (more specific wins)

---

### Layer 4: KNOWLEDGE
**Purpose**: Context and understanding

**Contains**:
- Project overview
- Architecture documentation
- Domain knowledge
- Glossary and terminology

**Precedence**: Additive (all context combines)

---

### Layer 5: GOALS
**Purpose**: Current objectives

**Contains**:
- Active sprint goals
- Current tasks
- Success criteria
- Backlog items

**Precedence**: Override (current always wins)

---

## Validation

All examples are validated to ensure they follow the specification:

```bash
# Validate all examples
npm run validate:examples

# Validate specific example
claude-arch validate examples/simple-project
```

Expected output:
```
✓ Structure is valid
✓ All required layers present
✓ No schema violations
✓ No conflicting rules
```

## Common Patterns

### Starting Small

Start with minimal structure, expand as needed:
1. Begin with `claude-arch init --minimal`
2. Add content to single files
3. When files get large (>200 lines), migrate to full structure
4. Use `claude-arch migrate --to-full` to convert

### Team Collaboration

For teams, use the full structure:
1. Create `.claude/` in project root
2. Commit to version control
3. Team members get structure automatically
4. Use `claude-arch show` to debug merged config

### Multi-Scope Setup

Combine project and user scopes:

**User scope** (`~/.claude/`):
- Personal preferences
- API keys
- Common tools

**Project scope** (`project/.claude/`):
- Project-specific rules
- Team workflows
- Project architecture

The scopes merge automatically with project overriding user.

## Tips

### Organization

- Keep files focused (one topic per file)
- Use descriptive file names
- Add README.md in subdirectories with 3+ files
- Link between files using relative paths

### Maintenance

- Review and update quarterly
- Remove outdated content
- Keep examples current
- Validate after major changes

### Discovery

```bash
# See merged configuration
claude-arch show .

# Show precedence chain
claude-arch show --format precedence

# Check for conflicts
claude-arch doctor .
```

## Next Steps

1. **Choose an example** that matches your project size
2. **Explore the structure** to understand the organization
3. **Run validation** to see it passes
4. **Create your own** using `claude-arch init`
5. **Customize** for your project's needs

## Questions?

- See [User Guide](../docs/user-guide.md) for detailed documentation
- See [Migration Guide](../docs/migration-guide.md) for migration help
- See [Best Practices](../docs/best-practices.md) for recommendations
- Run `claude-arch --help` for CLI reference

---

**Remember**: Start simple, grow as needed. The architecture scales from single files to complex hierarchies.
