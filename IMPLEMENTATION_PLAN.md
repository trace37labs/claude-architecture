# Implementation Plan

## Project Overview

**Claude Unified Architecture** is a tooling project to implement a 5-layer configuration system for Claude Code that brings order to the current chaos of 10+ overlapping configuration mechanisms. The system proposes clear layers (RULES → TOOLS → METHODS → KNOWLEDGE → GOALS) with well-defined precedence, scope inheritance, and migration paths from existing CLAUDE.md/AGENTS.md patterns.

**Current Specification Status**: Complete ✅
- Architecture defined in `specs/architecture-spec.md` (15KB)
- Detailed specification in `docs/spec.md` (comprehensive)
- Five layers fully specified with merge behaviors
- Scope hierarchy established (Task → Project → User → System)

**What Needs Building**: The implementation tooling to make this architecture real.

---

## Current Status

**✅ COMPLETED:**
- Architecture specification written and reviewed
- File structure conventions defined
- Precedence rules established
- Design principles documented
- Example projects sketched

**🚧 NOT STARTED:**
- CLI tooling for init/migrate/validate/show
- Parser for new structure with precedence handling
- File system utilities for reading/writing layers
- Migration tools from existing CLAUDE.md/AGENTS.md
- Validation tools for checking structure compliance
- Integration with Claude Code (MCP server/plugin)
- Test suite
- Example project implementations
- Documentation for end users

**🚫 BLOCKERS:** None - ready to begin implementation

---

## Architecture Recap (For Context)

### Five Layers (Precedence Order)
1. **RULES** - Security, constraints, forbidden actions (absolute, additive)
2. **TOOLS** - MCP servers, commands, capabilities (additive)
3. **METHODS** - Patterns, workflows, how-tos (override, specific wins)
4. **KNOWLEDGE** - Specs, architecture, context (additive)
5. **GOALS** - Current tasks, objectives (override, current wins)

### Scope Hierarchy (Precedence Order)
1. **Task** - Current operation context (highest priority)
2. **Project** - `.claude/` in repository
3. **User** - `~/.claude/` in home directory
4. **System** - Anthropic defaults (lowest priority)

### File Structure
```
.claude/
├── rules/       # Layer 1: constraints
├── tools/       # Layer 2: capabilities
├── methods/     # Layer 3: workflows
├── knowledge/   # Layer 4: context
└── goals/       # Layer 5: objectives
```

---

## Task Queue (Priority Order)

### Phase 1: Core Parser & Data Model (Foundation)

#### 1. Create TypeScript Project Structure ✅
- **Why**: Need a proper Node.js/TypeScript foundation for building CLI tools
- **What**: Initialize package.json, tsconfig.json, directory structure
- **Files**:
  - `package.json` - Dependencies (commander, chalk, yaml, glob, zod)
  - `tsconfig.json` - TypeScript configuration
  - `src/` directory structure
  - `.gitignore` for node_modules
- **Tests**: Verify `npm install` and `tsc` compile works
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: 7329143

#### 2. Define Core Data Model (Zod Schemas) ✅
- **Why**: Type-safe representation of the 5-layer architecture
- **What**: Zod schemas for each layer + scope + merged config
- **Files**:
  - `src/types/layers.ts` - Layer type definitions (5 layers with merge strategies)
  - `src/types/config.ts` - Config structure types (merged config, context)
  - `src/types/scope.ts` - Scope hierarchy types (4 scope levels)
  - `src/types/index.ts` - Barrel file for exports
- **Tests**: 50 unit tests covering all schemas, all passing
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: e300ac9

#### 3. Implement File System Scanner
- **Why**: Need to discover and read config files across scopes
- **What**: Utilities to scan Task/Project/User/System locations
- **Files**:
  - `src/scanner.ts` - Discover .claude/ directories
  - `src/reader.ts` - Read markdown/yaml files
  - `src/loader.ts` - Load and parse individual layers
- **Tests**: Test scanning fixtures with various structures
- **Status**: TODO

#### 4. Build Markdown Parser for Existing CLAUDE.md
- **Why**: Need backward compatibility with existing files
- **What**: Parse CLAUDE.md/AGENTS.md into 5-layer structure
- **Files**:
  - `src/parsers/legacy-parser.ts` - Parse old format
  - `src/parsers/layer-classifier.ts` - Classify content into layers
- **Tests**: Parse real CLAUDE.md examples, verify classification
- **Status**: TODO

#### 5. Implement Precedence Engine
- **Why**: Core logic for merging configs across scopes with proper precedence
- **What**: Merge algorithm respecting layer-specific behaviors (additive vs override)
- **Files**:
  - `src/engine/merger.ts` - Merge configs across scopes
  - `src/engine/precedence.ts` - Layer-specific precedence rules
  - `src/engine/resolver.ts` - Resolve final config for a task
- **Tests**: Test complex merge scenarios, verify precedence works
- **Status**: TODO

---

### Phase 2: CLI Commands (User Interface)

#### 6. Build `claude-arch init` Command
- **Why**: Bootstrap new projects with proper structure
- **What**: Create `.claude/` directory with 5-layer folders + templates
- **Files**:
  - `src/commands/init.ts` - Init command implementation
  - `templates/` - Template files for each layer
- **Tests**: Run init, verify directory structure created
- **Status**: TODO

#### 7. Build `claude-arch migrate` Command
- **Why**: Convert existing CLAUDE.md/AGENTS.md to new structure
- **What**: Read old files, classify content, write to layer-specific files
- **Files**:
  - `src/commands/migrate.ts` - Migration command
  - `src/migrators/rules-extractor.ts` - Extract rules from CLAUDE.md
  - `src/migrators/methods-extractor.ts` - Extract methods from AGENTS.md
- **Tests**: Migrate real CLAUDE.md files, verify output correctness
- **Status**: TODO

#### 8. Build `claude-arch validate` Command
- **Why**: Check that project structure follows spec correctly
- **What**: Validate file structure, schema compliance, no conflicts
- **Files**:
  - `src/commands/validate.ts` - Validation command
  - `src/validators/structure.ts` - Check directory structure
  - `src/validators/schema.ts` - Validate file schemas
- **Tests**: Test with valid/invalid structures
- **Status**: TODO

#### 9. Build `claude-arch show` Command
- **Why**: Debug view of active configuration with precedence visualization
- **What**: Display merged config with source attribution (which scope/file)
- **Files**:
  - `src/commands/show.ts` - Show command
  - `src/formatters/tree-view.ts` - Pretty-print config tree
  - `src/formatters/precedence-view.ts` - Show override chain
- **Tests**: Verify output format and accuracy
- **Status**: TODO

#### 10. Build `claude-arch doctor` Command
- **Why**: Health check for configuration issues, conflicts, or ambiguities
- **What**: Analyze config for problems and suggest fixes
- **Files**:
  - `src/commands/doctor.ts` - Doctor command
  - `src/diagnostics/conflict-detector.ts` - Find conflicts
  - `src/diagnostics/recommendations.ts` - Suggest improvements
- **Tests**: Test with problematic configs
- **Status**: TODO

---

### Phase 3: Integration & Packaging

#### 11. Create MCP Server Implementation
- **Why**: Allow Claude Code to consume this architecture natively
- **What**: MCP server that exposes config resolution as tool calls
- **Files**:
  - `src/mcp/server.ts` - MCP server entry point
  - `src/mcp/tools.ts` - MCP tool definitions
- **Tests**: Test MCP protocol compliance
- **Status**: TODO

#### 12. Build Example Projects
- **Why**: Show users how to structure real projects
- **What**: 3-4 example projects (simple, complex, migrated)
- **Files**:
  - `examples/simple-project/` - Basic 5-layer setup
  - `examples/complex-project/` - Full-featured setup
  - `examples/migrated-project/` - From CLAUDE.md to new structure
- **Tests**: Validate all examples with `claude-arch validate`
- **Status**: TODO

#### 13. Package for npm Distribution
- **Why**: Make tool installable via `npm install -g claude-arch`
- **What**: Package configuration, bin scripts, version management
- **Files**:
  - Update `package.json` with bin field
  - `README.md` for npm package
  - `CHANGELOG.md`
- **Tests**: Test global install and CLI invocation
- **Status**: TODO

---

### Phase 4: Documentation & Community

#### 14. Write User Documentation
- **Why**: Users need to understand how to use the tool and architecture
- **What**: Complete user guide covering all commands and patterns
- **Files**:
  - `docs/user-guide.md` - How to use claude-arch CLI
  - `docs/migration-guide.md` - Step-by-step migration from CLAUDE.md
  - `docs/best-practices.md` - Recommended patterns
  - `docs/troubleshooting.md` - Common issues and solutions
- **Tests**: Docs review by external users
- **Status**: TODO

#### 15. Create Video/Tutorial Content
- **Why**: Visual learning aids adoption
- **What**: Screen recordings showing init, migrate, validate workflows
- **Files**:
  - `docs/videos/` - Links to video content
  - `docs/tutorials/` - Step-by-step written tutorials
- **Tests**: User feedback on clarity
- **Status**: TODO

#### 16. Propose to Anthropic for Standardization
- **Why**: Goal is official adoption in Claude Code
- **What**: Submit RFC/proposal to Anthropic team with evidence
- **Files**:
  - `PROPOSAL.md` - Formal proposal document
  - Evidence: working tool, examples, community feedback
- **Tests**: Community review before submission
- **Status**: TODO

---

### Phase 5: Testing & Quality (Parallel to All Phases)

#### 17. Unit Test Suite
- **Why**: Ensure correctness of all components
- **What**: Jest/Vitest tests for all functions
- **Files**:
  - `tests/unit/` - Unit tests mirroring src/ structure
  - `jest.config.js` or `vitest.config.ts`
- **Tests**: Achieve >80% code coverage
- **Status**: TODO

#### 18. Integration Test Suite
- **Why**: Verify end-to-end workflows work correctly
- **What**: Test complete CLI workflows (init → migrate → validate → show)
- **Files**:
  - `tests/integration/` - End-to-end test scenarios
  - `tests/fixtures/` - Sample projects for testing
- **Tests**: All example projects pass validation
- **Status**: TODO

#### 19. Performance Benchmarks
- **Why**: Ensure tool is fast enough for large projects
- **What**: Benchmark config resolution time at scale
- **Files**:
  - `tests/benchmarks/` - Performance tests
- **Tests**: Resolution under 100ms for typical projects
- **Status**: TODO

---

## Success Metrics

**Phase 1 Complete When:**
- Parser correctly merges configs from all scopes
- Precedence engine properly handles override/additive behaviors
- Backward compatibility with existing CLAUDE.md works

**Phase 2 Complete When:**
- All 5 CLI commands work correctly
- Migration from CLAUDE.md to new structure is automated
- Validation catches common mistakes

**Phase 3 Complete When:**
- MCP server allows Claude Code to consume configs
- Example projects demonstrate all patterns
- Tool is installable via npm

**Phase 4 Complete When:**
- Documentation is comprehensive and clear
- Video tutorials cover common workflows
- Anthropic receives formal proposal

**Phase 5 Complete When:**
- Test coverage >80%
- Integration tests pass for all workflows
- Performance benchmarks meet targets (<100ms resolution)

---

## Open Questions

1. **Language Choice**: TypeScript chosen for Node.js ecosystem fit, but could consider Rust for performance
2. **File Format**: Markdown chosen for human-readability, but YAML might be easier to parse
3. **MCP Protocol**: Need to verify latest MCP spec for tool implementation
4. **Anthropic Adoption**: Need to establish contact/process for proposal submission
5. **Naming**: "claude-arch" CLI name - need to verify availability on npm

---

## Next Step

**After committing this plan, run `./loop.sh` to enter build mode and begin Phase 1, Task 1: Create TypeScript Project Structure.**

This plan prioritizes the core engine first (parsing, merging, precedence), then builds user-facing tools, followed by integration and community efforts. Each phase is independently valuable and can ship incrementally.
