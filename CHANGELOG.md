# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-01-22

### Added

- **Portable Architecture (Export & Gaps Commands)**
  - `claude-arch export` - Generate portable configuration manifests
  - `claude-arch gaps` - Analyze environment gaps against manifest
  - Cross-platform support (darwin, linux, windows)
  - Setup script generation (--generate-setup flag)
  - Platform-aware export with intelligent tool filtering
  - MCP server detection and validation
  - CLI tool detection with version checking
  - Environment variable validation
  - Path existence verification
  - Hook script validation

### Enhanced

- **Show Command**
  - `--scope` option now fully functional (user, project, task, system)
  - `--layer` option for filtering specific layers
  - Unified sources view with `--show-sources` flag
  - Better fragmentation detection (project-only, respects user context)
  - Improved cross-platform path handling

- **Migration Command**
  - Added `--all` flag for migrating all config sources
  - Added `--source` flag for selective migration (mcp, hooks, skills, memory)
  - Better handling of skills and MCP configurations

- **Platform Utilities**
  - Platform detection (darwin, linux, windows)
  - Tool-specific install commands per platform
  - Path mapping between platforms
  - Shell script generation (bash for Unix, PowerShell for Windows)

### Fixed

- User-level config properly treated as read-only context
- Fragmentation detection now project-scoped only
- Better handling of platform-specific tools (e.g., xcodebuild on macOS)

### Documentation

- Updated MISSING_FEATURES.md to reflect implemented features
- Clarified that export/gaps commands are production-ready
- Added portable architecture use cases and examples

## [0.1.2] - 2026-01-22

### Enhanced

- Improved scanner for detecting all configuration sources
- Better universal config source detection

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

## [0.1.1] - 2026-01-22

### Added

- **Universal Configuration Scanner**
  - Scan ALL configuration sources (MCP, hooks, skills, memory, legacy)
  - Unified view of fragmented configuration across 10+ locations
  - Project vs user-level configuration distinction
  - Fragmentation detection and analysis

- **Enhanced Show Command**
  - `--show-sources` flag for unified configuration view
  - `--scope` filter (user, project, task, system)
  - `--layer` filter (rules, tools, methods, knowledge, goals)
  - Multiple display formats (tree, precedence, json, unified)

- **Comprehensive Validation**
  - `--check-all-sources` flag to validate all config sources
  - `--json` output for automation and tooling
  - Source-level issue detection and suggestions
  - Schema validation across all layers

- **Health Diagnostics**
  - Fragmentation detection for project-level config
  - Quick wins identification (`--quick-wins` flag)
  - Configuration conflict detection across sources
  - User vs project config boundary awareness

- **Documentation**
  - Complete user guide with all command examples
  - Quick reference documentation
  - Implementation status tracking
  - Best practices and migration guide

### Fixed

- User-level config now properly treated as read-only context
- Fragmentation warnings only for project-level duplicates
- Improved CLI help output for all commands
- Consistent flag naming across all commands

### Improved

- Better classification heuristics for legacy content
- More informative validation error messages
- Clearer precedence chain display
- Enhanced conflict detection logic

## [0.1.2] - 2026-01-22

### Added

- **Portable Architecture System**
  - `export` command for generating portable configuration manifests
  - `gaps` command for analyzing environment differences
  - Platform-aware export with intelligent tool filtering (darwin, linux, windows)
  - Automatic path mapping for cross-platform compatibility
  - Setup script generation (`--generate-setup` flag)

- **Export Command Features**
  - `--platform` flag for target platform specification
  - `--generate-setup` creates executable setup.sh scripts
  - YAML and JSON output formats
  - Automatic MCP server detection and extraction
  - CLI tool dependency extraction from AGENTS.md
  - Environment variable requirement detection
  - Skills and hooks dependency tracking

- **Gaps Command Features**
  - Environment gap analysis against manifests
  - Real-time tool version detection
  - MCP server installation status checking
  - Environment variable presence validation
  - Path existence verification
  - `--fix` flag shows install commands
  - JSON output for automation

- **Platform Intelligence**
  - Platform-specific tool filtering (e.g., xcodebuild only on darwin)
  - Smart install command generation per platform
  - Path mapping between platform conventions
  - Separate setup scripts for Unix (bash) and Windows (PowerShell)

- **Generated Setup Scripts**
  - Executable bash scripts with color output
  - `--check-only` flag for dry-run validation
  - `--skip-optional` flag to skip non-required dependencies
  - Automatic MCP server installation
  - CLI tool installation with platform-specific commands
  - Environment variable setup guidance
  - Progress tracking and summary reporting

### Documentation

- Complete export/gaps command documentation
- Platform-aware export examples
- Cross-platform migration guide
- Setup script usage instructions

## [Unreleased]

### Planned

- Windows PowerShell setup script generation
- Enhanced MCP config parsing
- Automated dependency resolution
- Video tutorials and walkthroughs
- Extended performance benchmarks

---

[0.1.1]: https://github.com/trace37labs/claude-architecture/releases/tag/v0.1.1
[0.1.0]: https://github.com/trace37labs/claude-architecture/releases/tag/v0.1.0
