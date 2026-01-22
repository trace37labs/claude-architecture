# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-21

### Added

- **Core Architecture**
  - 5-layer configuration system (RULES → TOOLS → METHODS → KNOWLEDGE → GOALS)
  - 4-scope hierarchy (Task → Project → User → System)
  - TypeScript type definitions with Zod schemas for all layers
  - Layer-specific merge strategies (additive vs override)

- **File System Scanner**
  - Discover `.claude/` directories across all scopes
  - Read markdown and YAML configuration files
  - Load and parse individual layer files

- **Legacy Parser**
  - Parse existing CLAUDE.md/AGENTS.md files
  - Classify content into appropriate layers
  - Backward compatibility with current configuration format

- **Precedence Engine**
  - Merge configurations across scopes with proper precedence
  - Handle layer-specific merge behaviors
  - Resolve final configuration for any task context

- **CLI Commands**
  - `claude-arch init` - Bootstrap new projects with 5-layer structure
  - `claude-arch migrate` - Convert legacy CLAUDE.md/AGENTS.md to new format
  - `claude-arch validate` - Check structure compliance and schema validation
  - `claude-arch show` - Display merged configuration with source attribution
  - `claude-arch doctor` - Health check with conflict detection and recommendations

- **MCP Server Integration**
  - MCP server implementation for Claude Code integration
  - 4 MCP tools: resolve-config, validate-structure, detect-conflicts, get-recommendations
  - StdioServerTransport for seamless Claude Code consumption

- **Example Projects**
  - Simple project example (minimal structure)
  - Complex project example (full structure with subdirectories)
  - Migrated project example (before/after comparison)

- **Testing**
  - 332+ unit tests with Vitest
  - Comprehensive test coverage for all components
  - Integration test scenarios

### Documentation

- Complete architecture specification
- User guide and migration instructions (in progress)
- API documentation for all public interfaces
- Example configurations and best practices

## [Unreleased]

### Planned

- User documentation (migration guide, best practices, troubleshooting)
- Video tutorials and walkthroughs
- Performance benchmarks
- npm package distribution

---

[0.1.0]: https://github.com/yourusername/claude-arch/releases/tag/v0.1.0
