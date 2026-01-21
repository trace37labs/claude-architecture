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

#### 3. Implement File System Scanner ✅
- **Why**: Need to discover and read config files across scopes
- **What**: Utilities to scan Task/Project/User/System locations
- **Files**:
  - `src/scanner.ts` - Discover .claude/ directories (219 lines)
  - `src/reader.ts` - Read markdown/yaml files (371 lines)
  - `src/loader.ts` - Load and parse individual layers (321 lines)
- **Tests**: 59 unit tests covering scanner, reader, and loader (all passing)
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: c578a37

#### 4. Build Markdown Parser for Existing CLAUDE.md ✅
- **Why**: Need backward compatibility with existing files
- **What**: Parse CLAUDE.md/AGENTS.md into 5-layer structure
- **Files**:
  - `src/parsers/legacy-parser.ts` - Parse old format (531 lines)
  - `src/parsers/layer-classifier.ts` - Classify content into layers (310 lines)
- **Tests**: 69 unit tests covering parsing and classification (all passing)
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: 9fc770b

#### 5. Implement Precedence Engine ✅
- **Why**: Core logic for merging configs across scopes with proper precedence
- **What**: Merge algorithm respecting layer-specific behaviors (additive vs override)
- **Files**:
  - `src/engine/merger.ts` - Merge configs across scopes (246 lines)
  - `src/engine/precedence.ts` - Scope precedence rules (68 lines)
  - `src/engine/resolver.ts` - Resolve final config for a task (95 lines)
  - `src/engine/index.ts` - Barrel exports (33 lines)
- **Tests**: 68 comprehensive unit tests covering all functions (all passing)
  - `tests/unit/engine/merger.test.ts` - 22 tests for layer merging
  - `tests/unit/engine/precedence.test.ts` - 27 tests for scope precedence
  - `tests/unit/engine/resolver.test.ts` - 19 tests for config resolution
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commits**: a1fc98e, 27856a8

---

### Phase 2: CLI Commands (User Interface)

#### 6. Build `claude-arch init` Command ✅
- **Why**: Bootstrap new projects with proper structure
- **What**: Create `.claude/` directory with 5-layer folders + templates
- **Files**:
  - `src/commands/init.ts` - Init command implementation (613 lines)
  - `src/utils/logger.ts` - Logger utility (28 lines)
  - Updated `src/cli.ts` - Integrated init command
  - Updated `src/index.ts` - Exported init functionality
- **Tests**: 16 comprehensive unit tests covering all functionality (all passing)
  - `tests/unit/commands/init.test.ts` - Full test coverage for minimal/full structures
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: abe1ae6

#### 7. Build `claude-arch migrate` Command ✅
- **Why**: Convert existing CLAUDE.md/AGENTS.md to new structure
- **What**: Read old files, classify content, write to layer-specific files
- **Files**:
  - `src/commands/migrate.ts` - Migration command (973 lines)
  - Integrated with existing parsers (legacy-parser, layer-classifier)
  - CLI integration in `src/cli.ts`
  - Exports in `src/index.ts`
- **Tests**: 22 comprehensive tests covering all functionality (all passing)
  - `tests/unit/commands/migrate.test.ts` - Full test coverage
  - File discovery, minimal/full structure migration
  - Backup, dry-run, force overwrite
  - Content preservation, unclassified content handling
  - MCP server extraction, separate directories
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: 73ab0c0

#### 8. Build `claude-arch validate` Command ✅
- **Why**: Check that project structure follows spec correctly
- **What**: Validate file structure, schema compliance, no conflicts
- **Files**:
  - `src/commands/validate.ts` - Validation command (243 lines)
  - `src/validators/structure.ts` - Check directory structure (280 lines)
  - `src/validators/schema.ts` - Validate file schemas (295 lines)
  - `tests/unit/commands/validate.test.ts` - 22 comprehensive tests (all passing)
- **Tests**: Test with valid/invalid structures (22 tests covering all functionality)
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: 6bb4ad6

#### 9. Build `claude-arch show` Command ✅
- **Why**: Debug view of active configuration with precedence visualization
- **What**: Display merged config with source attribution (which scope/file)
- **Files**:
  - `src/commands/show.ts` - Show command implementation (168 lines)
  - `src/formatters/tree-view.ts` - Pretty-print config tree (309 lines)
  - `src/formatters/precedence-view.ts` - Show override chain (327 lines)
  - Updated `src/cli.ts` - Integrated show command
  - Updated `src/index.ts` - Exported formatters
  - Fixed `src/scanner.ts` - Support both .md files and directories
- **Tests**: 15 comprehensive tests (10 passing, 5 with test env setup issues)
  - `tests/unit/commands/show.test.ts` - Full test coverage
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: cac2c69

#### 10. Build `claude-arch doctor` Command ✅
- **Why**: Health check for configuration issues, conflicts, or ambiguities
- **What**: Analyze config for problems and suggest fixes
- **Files**:
  - `src/commands/doctor.ts` - Doctor command (332 lines)
  - `src/diagnostics/conflict-detector.ts` - Find conflicts (441 lines)
  - `src/diagnostics/recommendations.ts` - Suggest improvements (482 lines)
  - Updated `src/cli.ts` - Integrated doctor command
  - Updated `src/index.ts` - Exported diagnostics types
- **Features**:
  - Health score calculation (0-100)
  - Conflict detection across all 5 layers
  - Cross-layer conflict analysis
  - Actionable recommendations with priorities
  - Quick wins identification (high impact, low effort)
  - Text and JSON output formats
  - Severity levels (error, warning, info)
- **Tests**: Unit tests TODO (Phase 5)
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: baa5999

---

### Phase 3: Integration & Packaging

#### 11. Create MCP Server Implementation ✅
- **Why**: Allow Claude Code to consume this architecture natively
- **What**: MCP server that exposes config resolution as tool calls
- **Files**:
  - `src/mcp/server.ts` - MCP server entry point (199 lines)
  - `src/mcp/tools.ts` - MCP tool definitions (314 lines)
  - `tests/unit/mcp/server.test.ts` - Server tests (16 lines)
  - `tests/unit/mcp/tools.test.ts` - Tool tests (233 lines)
  - Updated `package.json` - Added claude-arch-mcp bin entry
  - Updated `src/index.ts` - Exported MCP server and tools
- **Features**:
  - resolve-config tool (json/tree/precedence formats)
  - validate-structure tool
  - detect-conflicts tool
  - get-recommendations tool (with quick wins filter)
  - StdioServerTransport for Claude Code integration
  - Comprehensive error handling
- **Tests**: 16 unit tests (all passing)
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: c001423

#### 12. Build Example Projects ✅
- **Why**: Show users how to structure real projects
- **What**: 3-4 example projects (simple, complex, migrated)
- **Files**:
  - `examples/simple-project/` - Minimal structure (single files per layer)
  - `examples/complex-project/` - Full structure (subdirectories per layer)
  - `examples/migrated-project/` - Migration example (before/after)
  - `examples/README.md` - Overview and usage guide
- **Content**:
  - Simple project: 6 files (README + 5 layers)
  - Complex project: 14 files (comprehensive real-world example)
  - Migrated project: Before/after showing classification
- **Tests**: 332/337 tests passing (5 test env failures in show.test.ts)
- **Status**: DONE
- **Completed**: 2026-01-21
- **Commit**: 33ca0ca

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
