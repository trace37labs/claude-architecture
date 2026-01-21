# Knowledge Layer

> **Layer 4**: Project context, architecture, and domain knowledge

## Project Overview

**Name**: Simple CLI Tool
**Purpose**: Demonstrate minimal 5-layer architecture
**Stack**: Node.js, TypeScript, Commander.js

## Architecture

### Design Pattern
- **CLI Interface**: Commander.js for argument parsing
- **Business Logic**: Pure TypeScript modules
- **Data Layer**: File system operations

### Directory Structure
```
src/
├── commands/     # CLI command implementations
├── lib/          # Core business logic
├── utils/        # Helper functions
└── index.ts      # Entry point
```

### Dependencies
- `commander`: CLI framework
- `chalk`: Terminal colors
- `zod`: Schema validation

## Domain Concepts

### Command
A CLI operation that accepts arguments and returns results

### Validator
A pure function that checks input against rules

### Reporter
An output formatter that presents results to the user

## Technical Decisions

### Why TypeScript?
- Type safety catches errors at compile time
- Better IDE support and autocomplete
- Self-documenting code with types

### Why Commander.js?
- Industry standard for Node.js CLIs
- Great documentation
- Flexible and extensible

## Glossary

- **CLI**: Command-Line Interface
- **TSC**: TypeScript Compiler
- **ESLint**: JavaScript/TypeScript linter
- **Vitest**: Fast unit test framework
