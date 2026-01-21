# Tools Layer

> Automatically migrated from CLAUDE.md

## MCP Servers

We use the following MCP servers:
- `filesystem` - for reading/writing files
- `database` - PostgreSQL connection
- `git` - version control operations

## Commands

### /test
Run the test suite with coverage

### /build
Compile TypeScript to JavaScript

### /deploy
Deploy to production (staging first)

## Dependencies

Main dependencies:
- commander: CLI framework
- chalk: Terminal colors
- zod: Schema validation
- prisma: Database ORM
