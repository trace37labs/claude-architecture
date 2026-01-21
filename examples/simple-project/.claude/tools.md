# Tools Layer

> **Layer 2**: MCP servers, commands, and available capabilities

## MCP Servers

### File System
```yaml
server: filesystem
purpose: Read/write project files
permissions: read, write
paths:
  - ./src
  - ./tests
```

### Git
```yaml
server: git
purpose: Version control operations
capabilities:
  - commit
  - branch
  - status
  - diff
```

### Test Runner
```yaml
server: test-runner
purpose: Execute test suites
commands:
  - npm test
  - npm run test:watch
  - npm run test:coverage
```

## Custom Commands

### /test
Run the test suite and report coverage

### /lint
Check code style and fix issues

### /build
Compile TypeScript and bundle for production

## Available Skills

- **code-review**: Automated code review with best practices
- **refactor**: Safe refactoring with tests
- **debug**: Interactive debugging assistance
