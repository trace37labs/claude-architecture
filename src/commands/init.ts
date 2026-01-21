/**
 * Init Command
 *
 * Scaffolds the .claude/ directory structure for a new project.
 * Supports both minimal (single files) and full (subdirectories) layouts.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface InitOptions {
  /** Create minimal structure (single files) instead of full structure */
  minimal?: boolean;
  /** Target directory (default: current directory) */
  targetDir?: string;
  /** Force overwrite if .claude/ already exists */
  force?: boolean;
  /** Dry run - show what would be created without creating */
  dryRun?: boolean;
}

/**
 * Initialize a new Claude architecture project
 */
export async function initCommand(options: InitOptions = {}): Promise<void> {
  const targetDir = options.targetDir || process.cwd();
  const claudeDir = path.join(targetDir, '.claude');

  // Check if .claude/ already exists
  try {
    await fs.access(claudeDir);
    if (!options.force) {
      throw new Error(
        `.claude/ directory already exists at ${claudeDir}\n` +
        'Use --force to overwrite'
      );
    }
    logger.warn('Overwriting existing .claude/ directory');
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    // Directory doesn't exist - good to proceed
  }

  if (options.minimal) {
    await createMinimalStructure(claudeDir, options.dryRun);
  } else {
    await createFullStructure(claudeDir, options.dryRun);
  }

  if (!options.dryRun) {
    logger.success(`Initialized Claude architecture at ${claudeDir}`);
    logger.info(
      options.minimal
        ? 'Created minimal structure (single files per layer)'
        : 'Created full structure (subdirectories per layer)'
    );
  } else {
    logger.info('Dry run - no files created');
  }
}

/**
 * Create minimal structure (single file per layer)
 */
async function createMinimalStructure(
  claudeDir: string,
  dryRun?: boolean
): Promise<void> {
  const files = [
    { path: 'rules.md', content: getRulesTemplate() },
    { path: 'tools.md', content: getToolsTemplate() },
    { path: 'methods.md', content: getMethodsTemplate() },
    { path: 'knowledge.md', content: getKnowledgeTemplate() },
    { path: 'goals.md', content: getGoalsTemplate() },
  ];

  if (dryRun) {
    logger.info('Would create minimal structure:');
    logger.info(`.claude/`);
    files.forEach((f) => logger.info(`  ├── ${f.path}`));
    return;
  }

  await fs.mkdir(claudeDir, { recursive: true });

  for (const file of files) {
    const filePath = path.join(claudeDir, file.path);
    await fs.writeFile(filePath, file.content, 'utf-8');
    logger.debug(`Created ${file.path}`);
  }
}

/**
 * Create full structure (subdirectories per layer)
 */
async function createFullStructure(
  claudeDir: string,
  dryRun?: boolean
): Promise<void> {
  const structure = [
    // Layer 1: Rules
    { path: 'rules/security.md', content: getSecurityRulesTemplate() },
    { path: 'rules/code-standards.md', content: getCodeStandardsTemplate() },
    { path: 'rules/process.md', content: getProcessRulesTemplate() },

    // Layer 2: Tools
    { path: 'tools/mcp.yaml', content: getMcpToolsTemplate() },
    { path: 'tools/commands/README.md', content: getCommandsReadmeTemplate() },

    // Layer 3: Methods
    {
      path: 'methods/workflows/feature-development.md',
      content: getFeatureWorkflowTemplate(),
    },
    {
      path: 'methods/patterns/error-handling.md',
      content: getErrorHandlingPatternTemplate(),
    },

    // Layer 4: Knowledge
    { path: 'knowledge/overview.md', content: getOverviewTemplate() },
    { path: 'knowledge/architecture.md', content: getArchitectureTemplate() },
    { path: 'knowledge/glossary.md', content: getGlossaryTemplate() },

    // Layer 5: Goals
    { path: 'goals/current.md', content: getCurrentGoalsTemplate() },
    { path: 'goals/backlog.md', content: getBacklogTemplate() },
  ];

  if (dryRun) {
    logger.info('Would create full structure:');
    logger.info(`.claude/`);
    const dirs = new Set<string>();
    structure.forEach((f) => {
      const dir = path.dirname(f.path);
      if (dir !== '.') dirs.add(dir);
    });
    Array.from(dirs)
      .sort()
      .forEach((dir) => logger.info(`  ├── ${dir}/`));
    structure.forEach((f) => logger.info(`  │   ├── ${path.basename(f.path)}`));
    return;
  }

  // Create all directories first
  const dirs = new Set<string>();
  structure.forEach((f) => {
    const dir = path.dirname(path.join(claudeDir, f.path));
    dirs.add(dir);
  });

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
    logger.debug(`Created directory ${path.relative(claudeDir, dir)}`);
  }

  // Create all files
  for (const file of structure) {
    const filePath = path.join(claudeDir, file.path);
    await fs.writeFile(filePath, file.content, 'utf-8');
    logger.debug(`Created ${file.path}`);
  }
}

// Template functions - Layer 1: Rules
function getRulesTemplate(): string {
  return `# Rules

## Security
- Never commit secrets or API keys
- Always validate user input
- Never execute untrusted code without sandboxing

## Code Standards
- Use TypeScript strict mode
- Include tests for new functions
- Follow the existing code style

## Process
- Never push directly to main branch
- Require code review for all changes
- Run tests before committing

---

*Rules are absolute and cannot be overridden by other layers.*
`;
}

function getSecurityRulesTemplate(): string {
  return `# Security Rules

## Authentication & Authorization
- Always validate user authentication before accessing protected resources
- Implement proper authorization checks
- Never hardcode credentials

## Data Protection
- Encrypt sensitive data at rest and in transit
- Sanitize all user input
- Follow principle of least privilege

## Code Security
- Never execute untrusted code
- Validate all external dependencies
- Keep dependencies updated

---

*These rules must be followed in all contexts.*
`;
}

function getCodeStandardsTemplate(): string {
  return `# Code Standards

## TypeScript
- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Avoid \`any\` types

## Testing
- Write unit tests for all business logic
- Achieve at least 80% code coverage
- Include integration tests for critical paths

## Style
- Use functional programming patterns where appropriate
- Keep functions small and focused
- Write self-documenting code with clear names

---

*These standards apply to all code in this project.*
`;
}

function getProcessRulesTemplate(): string {
  return `# Process Rules

## Version Control
- Never push directly to main/master branch
- Create feature branches for all changes
- Write meaningful commit messages

## Code Review
- All changes must be reviewed before merging
- Address all review comments
- Ensure CI passes before merging

## Deployment
- Never deploy without tests passing
- Use staging environment for testing
- Have rollback plan ready

---

*These process rules ensure quality and collaboration.*
`;
}

// Template functions - Layer 2: Tools
function getToolsTemplate(): string {
  return `# Tools

## Available Tools

### MCP Servers
- List any MCP servers configured for this project

### Commands
- List custom slash commands available

### Scripts
- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`

---

*Tools extend what capabilities are available in this project.*
`;
}

function getMcpToolsTemplate(): string {
  return `# MCP Servers Configuration

# Example MCP server configurations
# Uncomment and configure as needed

# servers:
#   github:
#     command: npx
#     args: [-y, @modelcontextprotocol/server-github]
#     env:
#       GITHUB_TOKEN: YOUR_TOKEN_HERE
#
#   filesystem:
#     command: npx
#     args: [-y, @modelcontextprotocol/server-filesystem, /path/to/allowed/directory]
`;
}

function getCommandsReadmeTemplate(): string {
  return `# Custom Commands

This directory contains custom slash commands for this project.

## Creating a Command

Create a markdown file describing the command:

\`\`\`markdown
# /deploy

Deploys the application to staging environment.

## Usage
/deploy [environment]

## Steps
1. Run tests
2. Build production bundle
3. Deploy to specified environment
4. Verify deployment

## Environment
- \`staging\` (default)
- \`production\`
\`\`\`

Commands become available as \`/command-name\` in Claude Code.
`;
}

// Template functions - Layer 3: Methods
function getMethodsTemplate(): string {
  return `# Methods

## Workflows

### Feature Development
1. Create feature branch
2. Write failing tests
3. Implement feature
4. Ensure all tests pass
5. Submit pull request
6. Address review feedback
7. Merge when approved

## Patterns

### Error Handling
- Use typed errors
- Provide helpful error messages
- Log errors appropriately
- Handle errors at the right level

---

*Methods describe how to approach common tasks in this project.*
`;
}

function getFeatureWorkflowTemplate(): string {
  return `# Feature Development Workflow

## Overview
Standard process for developing new features in this project.

## Steps

### 1. Planning
- Understand requirements thoroughly
- Break down into smaller tasks
- Identify potential risks

### 2. Design
- Consider architectural implications
- Review with team if needed
- Document key decisions

### 3. Implementation
- Create feature branch
- Write tests first (TDD)
- Implement incrementally
- Commit frequently with clear messages

### 4. Testing
- Ensure all tests pass
- Add integration tests
- Test edge cases
- Manual testing if needed

### 5. Review
- Create pull request
- Add description and context
- Address review comments
- Update based on feedback

### 6. Deployment
- Merge to main
- Verify in staging
- Monitor deployment
- Document any issues

---

*Follow this workflow for consistency and quality.*
`;
}

function getErrorHandlingPatternTemplate(): string {
  return `# Error Handling Pattern

## Principles

1. **Fail Fast**: Detect errors early
2. **Be Specific**: Use typed errors
3. **Be Helpful**: Provide context in error messages
4. **Be Consistent**: Handle similar errors similarly

## Implementation

### Custom Error Types
\`\`\`typescript
class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(\`Validation failed for \${field}: \${message}\`);
    this.name = 'ValidationError';
  }
}
\`\`\`

### Error Boundaries
- Catch errors at appropriate levels
- Don't catch errors you can't handle
- Propagate errors with context

### Logging
- Log all errors with context
- Include stack traces in development
- Use appropriate log levels

---

*Apply this pattern consistently across the codebase.*
`;
}

// Template functions - Layer 4: Knowledge
function getKnowledgeTemplate(): string {
  return `# Knowledge

## Project Overview
Brief description of what this project does and why it exists.

## Architecture
High-level architecture overview, key technologies, design patterns used.

## Domain Concepts
Key concepts and terminology specific to this project's domain.

---

*Knowledge provides context for understanding this project.*
`;
}

function getOverviewTemplate(): string {
  return `# Project Overview

## What This Project Does
[Describe the purpose and functionality of this project]

## Why It Exists
[Explain the problem this project solves]

## Key Features
- Feature 1
- Feature 2
- Feature 3

## Target Users
[Who will use this project]

## Success Metrics
[How do we measure if this project is successful]

---

*This overview helps new contributors understand the project quickly.*
`;
}

function getArchitectureTemplate(): string {
  return `# Architecture

## System Design

### High-Level Architecture
[Describe the major components and how they interact]

### Technology Stack
- Language: [e.g., TypeScript]
- Framework: [e.g., Express, React]
- Database: [e.g., PostgreSQL]
- Infrastructure: [e.g., AWS, Docker]

### Key Design Decisions

#### Decision 1
- **Context**: Why this decision was needed
- **Decision**: What was chosen
- **Rationale**: Why this choice was made
- **Consequences**: What this means for the project

### Data Flow
[Describe how data moves through the system]

### Security Architecture
[Describe security measures and architecture]

---

*This document captures key architectural decisions and designs.*
`;
}

function getGlossaryTemplate(): string {
  return `# Glossary

## Domain Terms

### Term 1
Definition and context for Term 1

### Term 2
Definition and context for Term 2

## Technical Terms

### Component A
Description of what Component A does and where it's used

### Pattern B
Explanation of Pattern B and when to use it

---

*Use consistent terminology as defined in this glossary.*
`;
}

// Template functions - Layer 5: Goals
function getGoalsTemplate(): string {
  return `# Goals

## Current Sprint/Task
What we're working on right now and what success looks like.

## Backlog
What we plan to work on next.

---

*Goals are short-lived and change frequently as work progresses.*
`;
}

function getCurrentGoalsTemplate(): string {
  return `# Current Goals

## Active Sprint
[Current sprint or iteration period]

## Primary Objectives
1. [Objective 1 with success criteria]
2. [Objective 2 with success criteria]
3. [Objective 3 with success criteria]

## Tasks in Progress
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Definition of Done
- All tests passing
- Code reviewed and approved
- Documentation updated
- Deployed to staging

---

*Update this file as work progresses.*
`;
}

function getBacklogTemplate(): string {
  return `# Backlog

## Upcoming Work

### High Priority
- [ ] Item 1
- [ ] Item 2

### Medium Priority
- [ ] Item 3
- [ ] Item 4

### Low Priority
- [ ] Item 5
- [ ] Item 6

## Ideas for Future
- Idea 1: [Description]
- Idea 2: [Description]

---

*This backlog is prioritized based on project needs.*
`;
}
