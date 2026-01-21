# Claude Unified Architecture Specification

**Version**: 0.1.0-draft
**Author**: Paul Reed
**Date**: 2026-01-21
**Status**: Draft

---

## Executive Summary

The Claude Code ecosystem has evolved organically, resulting in overlapping configuration systems with no clear hierarchy, composition rules, or mental model. This specification proposes a **unified architecture** that brings clarity, predictability, and composability to Claude's configuration landscape.

---

## 1. Problem Statement

### 1.1 Current Chaos

Claude Code currently has **10+ overlapping systems** for configuration and behavior:

| System | Purpose | Location | Scope |
|--------|---------|----------|-------|
| CLAUDE.md | Project instructions | Root/`.claude/` | Project |
| AGENTS.md | Agent definitions | Root | Project |
| Skills | Capability packages | `/mnt/skills/`, `.claude/skills/` | Global/Project |
| Hooks | Lifecycle events | `.claude/settings.json` | Project |
| Plugins | Extended functionality | Various | Global |
| MCP Servers | External tool connections | `~/.claude.json` | Global/Project |
| Slash Commands | Custom commands | Skills, hardcoded | Mixed |
| System Prompts | Base behavior | Anthropic-controlled | Global |
| User Memory | Persistent context | `~/.claude/` | User |
| User Preferences | Settings | `~/.claude/settings.json` | User |

### 1.2 The Problems

1. **No clear hierarchy**: What overrides what?
2. **No composition model**: How do pieces combine?
3. **Scattered locations**: Files everywhere
4. **Overlapping purposes**: Skills vs Agents vs Hooks?
5. **No discoverability**: Hard to know what's active
6. **No mental model**: Developers are confused

### 1.3 Real-World Confusion

- "Should this go in CLAUDE.md or a skill?"
- "Do hooks override agent instructions?"
- "How do I share project config without sharing user preferences?"
- "What's the difference between a skill and a plugin?"

---

## 2. Design Principles

### 2.1 Core Principles

1. **Separation of Concerns**: Each layer has ONE job
2. **Clear Precedence**: Later/more-specific always wins
3. **Composability**: Pieces combine predictably
4. **Discoverability**: Easy to see what's active
5. **Portability**: Project config travels with project
6. **Backward Compatible**: Existing CLAUDE.md still works

### 2.2 Inspirations

- **OSI Model**: 7 layers, each with clear purpose
- **CSS Cascade**: Specificity determines winner
- **Unix Philosophy**: Small pieces, clear contracts
- **Terraform**: Layers that merge predictably

---

## 3. The Architecture: Five Layers

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

### 3.1 Layer 1: RULES (Foundation)

**Purpose**: Constraints that MUST be respected. Non-negotiable guardrails.

**Contains**:
- Security constraints
- Output format requirements
- Forbidden actions
- Required behaviors
- Compliance requirements

**Example**:
```markdown
# Rules

## Security
- Never commit secrets
- Never execute untrusted code without sandboxing

## Output
- Always use TypeScript strict mode
- Always include tests for new functions

## Forbidden
- Never modify production databases directly
- Never push to main without PR
```

**Precedence**: Rules are ABSOLUTE. Nothing overrides rules.

---

### 3.2 Layer 2: TOOLS (Capabilities)

**Purpose**: What capabilities are available. The toolbox.

**Contains**:
- MCP server configurations
- Available slash commands
- Custom tools/scripts
- API integrations
- External services

**Example**:
```markdown
# Tools

## MCP Servers
- `github` - Repository operations
- `postgres` - Database queries (read-only)
- `slack` - Notifications

## Commands
- `/deploy` - Deploy to staging
- `/test` - Run test suite
- `/lint` - Run linters

## Scripts
- `scripts/setup.sh` - Environment setup
- `scripts/seed.sh` - Seed test data
```

**Precedence**: Project tools extend (don't replace) global tools.

---

### 3.3 Layer 3: METHODS (How-To)

**Purpose**: Patterns and approaches for getting things done.

**Contains**:
- Coding patterns
- Workflow definitions
- Best practices
- Decision frameworks
- Troubleshooting guides

**Example**:
```markdown
# Methods

## Adding a New API Endpoint
1. Define types in `src/types/`
2. Create handler in `src/handlers/`
3. Add route in `src/routes/`
4. Write tests in `tests/`
5. Update OpenAPI spec

## Debugging Production Issues
1. Check logs in Datadog
2. Reproduce in staging
3. Never debug in production directly

## Code Review Checklist
- [ ] Tests pass
- [ ] Types are strict
- [ ] No console.logs
- [ ] Error handling present
```

**Precedence**: Task-specific methods override general methods.

---

### 3.4 Layer 4: KNOWLEDGE (Context)

**Purpose**: Domain information, specifications, and reference material.

**Contains**:
- Project specifications
- Architecture decisions (ADRs)
- Domain glossary
- API documentation
- Business rules
- Historical context

**Example**:
```markdown
# Knowledge

## Project Overview
This is a B2B SaaS for invoice processing. Key entities:
- **Invoice**: A billing document from vendor
- **LineItem**: Individual charge on invoice
- **Approval**: Sign-off from authorized user

## Architecture
- Frontend: Next.js 14 (App Router)
- Backend: Node.js + Hono
- Database: PostgreSQL 16
- Queue: Redis + BullMQ

## Key Decisions
- ADR-001: Chose Hono over Express for performance
- ADR-002: Multi-tenant via schema isolation
```

**Precedence**: More specific knowledge overrides general knowledge.

---

### 3.5 Layer 5: GOALS (What)

**Purpose**: Current objectives and success criteria.

**Contains**:
- Current task/sprint goals
- Acceptance criteria
- Definition of done
- Priorities
- Non-goals (explicitly out of scope)

**Example**:
```markdown
# Goals

## Current Sprint
Implement invoice OCR processing

### Success Criteria
- [ ] Upload PDF via API
- [ ] Extract vendor, amount, date, line items
- [ ] 95% accuracy on test set
- [ ] < 5 second processing time

### Non-Goals
- No manual correction UI this sprint
- No multi-page invoice support yet

### Priority
1. Basic extraction working
2. Accuracy improvements
3. Performance optimization
```

**Precedence**: Explicit goals override implicit assumptions.

---

## 4. File Structure Convention

### 4.1 Standard Layout

```
project/
├── .claude/                    # Claude configuration root
│   ├── config.yaml             # Main config (optional)
│   │
│   ├── rules/                  # Layer 1: Rules
│   │   ├── security.md
│   │   ├── code-standards.md
│   │   └── forbidden.md
│   │
│   ├── tools/                  # Layer 2: Tools
│   │   ├── mcp.yaml            # MCP server config
│   │   ├── commands/           # Custom slash commands
│   │   │   └── deploy.md
│   │   └── scripts.md          # Available scripts
│   │
│   ├── methods/                # Layer 3: Methods
│   │   ├── workflows/          # Standard workflows
│   │   │   ├── new-feature.md
│   │   │   └── bug-fix.md
│   │   ├── patterns/           # Code patterns
│   │   │   └── error-handling.md
│   │   └── checklists/         # Checklists
│   │       └── pr-review.md
│   │
│   ├── knowledge/              # Layer 4: Knowledge
│   │   ├── overview.md         # Project overview
│   │   ├── architecture.md     # System architecture
│   │   ├── glossary.md         # Domain terms
│   │   ├── adrs/               # Architecture decisions
│   │   │   └── 001-framework.md
│   │   └── specs/              # Specifications
│   │       └── api.md
│   │
│   └── goals/                  # Layer 5: Goals
│       ├── current.md          # Current sprint/task
│       └── backlog.md          # Future work
│
├── CLAUDE.md                   # Legacy support (merged into above)
└── ...
```

### 4.2 Minimal Layout

For simple projects:

```
project/
├── .claude/
│   ├── rules.md       # All rules in one file
│   ├── knowledge.md   # Project context
│   └── goals.md       # Current objectives
└── ...
```

### 4.3 Discovery Rules

Claude reads configuration in this order:

1. `~/.claude/` (user global)
2. `.claude/` (project)
3. `CLAUDE.md` (legacy, mapped to knowledge)
4. `AGENTS.md` (legacy, mapped to methods)

---

## 5. Precedence & Inheritance

### 5.1 Scope Hierarchy

```
┌─────────────────┐
│  Task Context   │  Most specific (highest priority)
├─────────────────┤
│  Project        │  .claude/ in project root
├─────────────────┤
│  User           │  ~/.claude/
├─────────────────┤
│  System         │  Anthropic defaults (lowest priority)
└─────────────────┘
```

### 5.2 Merge Behavior

| Layer | Merge Strategy |
|-------|----------------|
| RULES | Additive (all rules apply, strictest wins) |
| TOOLS | Additive (all tools available) |
| METHODS | Override (specific replaces general) |
| KNOWLEDGE | Additive (all context available) |
| GOALS | Override (current task goals win) |

### 5.3 Explicit Override

Use `@override` to explicitly replace rather than merge:

```markdown
# Methods

@override
## Deployment Process
This completely replaces any inherited deployment method.
```

---

## 6. Mapping Existing Primitives

### 6.1 Migration Table

| Current | New Location | Layer |
|---------|--------------|-------|
| `CLAUDE.md` (instructions) | `.claude/rules/` | RULES |
| `CLAUDE.md` (context) | `.claude/knowledge/` | KNOWLEDGE |
| `CLAUDE.md` (workflows) | `.claude/methods/` | METHODS |
| `AGENTS.md` | `.claude/methods/agents/` | METHODS |
| Skills | `.claude/methods/skills/` | METHODS |
| Hooks | `.claude/tools/hooks.yaml` | TOOLS |
| MCP Servers | `.claude/tools/mcp.yaml` | TOOLS |
| Slash Commands | `.claude/tools/commands/` | TOOLS |
| User Memory | `~/.claude/knowledge/` | KNOWLEDGE |

### 6.2 Backward Compatibility

- `CLAUDE.md` in root still works (parsed into layers)
- `AGENTS.md` still works (becomes methods)
- Existing hooks/MCP config still works

---

## 7. Implementation Phases

### Phase 1: Specification (This Document)
- [x] Define the architecture
- [x] Define file conventions
- [x] Define precedence rules
- [ ] Community review

### Phase 2: Tooling
- [ ] `claude-arch init` - Scaffold structure
- [ ] `claude-arch migrate` - Convert existing config
- [ ] `claude-arch validate` - Check configuration
- [ ] `claude-arch show` - Display active config

### Phase 3: Loader
- [ ] Build parser for new structure
- [ ] Compile into unified context
- [ ] Respect precedence rules
- [ ] Backward compatibility layer

### Phase 4: Integration
- [ ] Claude Code plugin/extension
- [ ] Documentation
- [ ] Example projects
- [ ] Community adoption

### Phase 5: Proposal
- [ ] Write up for Anthropic
- [ ] Gather community support
- [ ] Propose as standard

---

## 8. Examples

### 8.1 Simple Project

```
my-app/
├── .claude/
│   ├── knowledge.md    # "This is a React app using Vite..."
│   └── rules.md        # "Always use functional components..."
└── src/
```

### 8.2 Complex Enterprise Project

```
enterprise-app/
├── .claude/
│   ├── rules/
│   │   ├── security.md         # SOC2 compliance rules
│   │   ├── code-standards.md   # Strict TypeScript
│   │   └── process.md          # PR requirements
│   ├── tools/
│   │   ├── mcp.yaml            # GitHub, Jira, Datadog
│   │   └── commands/
│   │       ├── deploy.md
│   │       └── rollback.md
│   ├── methods/
│   │   ├── workflows/
│   │   │   ├── incident-response.md
│   │   │   └── feature-development.md
│   │   └── patterns/
│   │       └── error-handling.md
│   ├── knowledge/
│   │   ├── architecture.md
│   │   ├── glossary.md
│   │   └── adrs/
│   └── goals/
│       └── q1-2026.md
└── src/
```

---

## 9. Open Questions

1. **Skill packaging**: How do shareable skills map to this model?
2. **Dynamic context**: How do runtime discoveries (codebase analysis) fit?
3. **Versioning**: How to version configuration for teams?
4. **Validation**: Schema for each layer?
5. **Visualization**: How to show active configuration?

---

## 10. Next Steps

1. Review this specification
2. Build `claude-arch` CLI tool
3. Create migration utilities
4. Write documentation
5. Test with real projects
6. Gather feedback
7. Iterate

---

## Appendix A: Glossary

- **Layer**: One of the five levels of the architecture
- **Scope**: The context in which configuration applies (user, project, task)
- **Precedence**: Which configuration wins when there's a conflict
- **Merge**: How configurations combine across scopes

---

## Appendix B: Related Work

- [CLAUDE.md Convention](https://docs.anthropic.com/claude-code)
- [Claude Skills](https://github.com/anthropics/claude-code/tree/main/skills)
- [MCP Protocol](https://modelcontextprotocol.io)

---

*This specification is a draft proposal for community discussion.*
