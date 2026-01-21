import { describe, it, expect } from 'vitest';
import {
  parseMarkdownSections,
  parseCLAUDEmd,
  parseAGENTSmd,
  parseLegacyFiles,
} from '../../src/parsers/legacy-parser.js';
import { LayerType } from '../../src/types/layers.js';

describe('Legacy Parser', () => {
  describe('parseMarkdownSections', () => {
    it('should parse simple markdown into sections', () => {
      const markdown = `# Rules
Never commit secrets

# Tools
Use MCP servers`;

      const sections = parseMarkdownSections(markdown);

      expect(sections).toHaveLength(2);
      expect(sections[0].heading).toBe('Rules');
      expect(sections[0].level).toBe(1);
      expect(sections[0].content).toContain('Never commit secrets');
      expect(sections[1].heading).toBe('Tools');
    });

    it('should handle nested headings', () => {
      const markdown = `# Layer 1
Content 1

## Subsection
Sub content

# Layer 2
Content 2`;

      const sections = parseMarkdownSections(markdown);

      expect(sections).toHaveLength(3);
      expect(sections[0].level).toBe(1);
      expect(sections[1].level).toBe(2);
      expect(sections[2].level).toBe(1);
    });

    it('should handle empty sections', () => {
      const markdown = `# Empty Section

# Another Section
With content`;

      const sections = parseMarkdownSections(markdown);

      expect(sections).toHaveLength(2);
      expect(sections[0].content.trim()).toBe('');
      expect(sections[1].content).toContain('With content');
    });

    it('should preserve line numbers', () => {
      const markdown = `Line 0
# Section 1
Line 2
Line 3
# Section 2
Line 5`;

      const sections = parseMarkdownSections(markdown);

      expect(sections[0].startLine).toBe(1);
      expect(sections[0].endLine).toBe(3);
      expect(sections[1].startLine).toBe(4);
    });

    it('should handle markdown with no headings', () => {
      const markdown = 'Just some text\nNo headings here';
      const sections = parseMarkdownSections(markdown);
      expect(sections).toHaveLength(0);
    });
  });

  describe('parseCLAUDEmd', () => {
    it('should parse a basic CLAUDE.md file', () => {
      const content = `# Security Rules
Never commit API keys or passwords

# Available Tools
- MCP server for database
- GitHub integration

# Development Workflow
1. Write tests first
2. Implement feature
3. Run CI pipeline`;

      const result = parseCLAUDEmd(content);

      expect(result.layers.rules).toBeDefined();
      expect(result.layers.rules?.rawContent).toContain('Never commit');
      expect(result.layers.tools).toBeDefined();
      expect(result.layers.methods).toBeDefined();
    });

    it('should extract forbidden items from rules', () => {
      const content = `# Rules
Forbidden:
- Never commit secrets
- Don't use deprecated APIs
- Must not expose credentials`;

      const result = parseCLAUDEmd(content);

      expect(result.layers.rules?.forbidden).toBeDefined();
      expect(result.layers.rules?.forbidden?.length).toBeGreaterThan(0);
    });

    it('should extract MCP servers from tools', () => {
      const content = `# Tools
\`\`\`bash
claude mcp add database -- npx db-server
claude mcp add github -- npx github-mcp
\`\`\``;

      const result = parseCLAUDEmd(content);

      expect(result.layers.tools?.mcpServers).toBeDefined();
      expect(result.layers.tools?.mcpServers?.length).toBe(2);
      expect(result.layers.tools?.mcpServers?.[0].name).toBe('database');
    });

    it('should handle unclassified sections', () => {
      const content = `# Random Section
This doesn't fit anywhere

# Clear Rules
Never do this`;

      const result = parseCLAUDEmd(content);

      expect(result.unclassified.length).toBeGreaterThan(0);
      expect(result.layers.rules).toBeDefined();
    });

    it('should preserve raw content', () => {
      const content = 'Original content here';
      const result = parseCLAUDEmd(content);
      expect(result.raw).toBe(content);
    });
  });

  describe('parseAGENTSmd', () => {
    it('should parse AGENTS.md as methods by default', () => {
      const content = `# Code Review Process
1. Check tests
2. Review security
3. Approve PR`;

      const result = parseAGENTSmd(content);

      expect(result.layers.methods).toBeDefined();
      expect(result.layers.methods?.rawContent).toContain('Check tests');
    });

    it('should extract workflows', () => {
      const content = `# Development Workflow
Steps:
1. Create branch
2. Write code
3. Submit PR`;

      const result = parseAGENTSmd(content);

      expect(result.layers.methods).toBeDefined();
      expect(result.layers.methods?.rawContent).toContain('Create branch');
    });

    it('should handle knowledge sections in AGENTS.md', () => {
      const content = `# Architecture Overview
This system uses microservices`;

      const result = parseAGENTSmd(content);

      expect(result.layers.knowledge).toBeDefined();
    });
  });

  describe('parseLegacyFiles', () => {
    it('should merge multiple files', () => {
      const files = new Map([
        [
          'CLAUDE.md',
          `# Rules
Never commit secrets`,
        ],
        [
          'AGENTS.md',
          `# Workflow
Follow TDD`,
        ],
      ]);

      const result = parseLegacyFiles(files);

      expect(result.layers.rules).toBeDefined();
      expect(result.layers.methods).toBeDefined();
    });

    it('should combine raw content from all files', () => {
      const files = new Map([
        ['CLAUDE.md', 'Content A'],
        ['AGENTS.md', 'Content B'],
      ]);

      const result = parseLegacyFiles(files);

      expect(result.raw).toContain('Content A');
      expect(result.raw).toContain('Content B');
      expect(result.raw).toContain('---');
    });

    it('should merge arrays from multiple files', () => {
      const files = new Map([
        [
          'CLAUDE.md',
          `# Rules
- Never commit secrets`,
        ],
        [
          'project-CLAUDE.md',
          `# Rules
- Always validate input`,
        ],
      ]);

      const result = parseLegacyFiles(files);

      expect(result.layers.rules).toBeDefined();
      // Both rules should be present in merged content
      expect(result.layers.rules?.rawContent).toContain('Never commit secrets');
      expect(result.layers.rules?.rawContent).toContain('Always validate input');
    });

    it('should handle empty file map', () => {
      const result = parseLegacyFiles(new Map());
      expect(result.layers).toEqual({});
      expect(result.unclassified).toEqual([]);
      expect(result.raw).toBe('');
    });

    it('should ignore non-CLAUDE/AGENTS files', () => {
      const files = new Map([
        ['README.md', '# Some other file'],
        ['CLAUDE.md', '# Rules\nActual config'],
      ]);

      const result = parseLegacyFiles(files);

      expect(result.layers.rules).toBeDefined();
      expect(result.raw).not.toContain('Some other file');
    });
  });

  describe('Complex real-world scenarios', () => {
    it('should parse a realistic CLAUDE.md', () => {
      const content = `# Claude Code Configuration

## Security Rules
Never commit:
- API keys
- Passwords
- Tokens

Always:
- Validate input
- Use HTTPS
- Scan for vulnerabilities

## Available Tools
\`\`\`bash
claude mcp add database -- npx @db/server
claude mcp add github -- npx @github/mcp
\`\`\`

## Development Workflow
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run full test suite
5. Submit PR for review

## Project Knowledge
This is a TypeScript project using Node.js 18+.
We follow the 5-layer architecture pattern.

## Current Goals
- Implement user authentication
- Achieve 80% test coverage
- Deploy to production by end of sprint`;

      const result = parseCLAUDEmd(content);

      // Should classify all major sections
      expect(result.layers.rules).toBeDefined();
      expect(result.layers.tools).toBeDefined();
      expect(result.layers.methods).toBeDefined();
      expect(result.layers.knowledge).toBeDefined();
      expect(result.layers.goals).toBeDefined();

      // Check specific extractions
      expect(result.layers.rules?.forbidden?.length).toBeGreaterThan(0);
      expect(result.layers.tools?.mcpServers?.length).toBe(2);
    });

    it('should handle mixed content types in one section', () => {
      const content = `# Configuration
This section has both rules and tools.

Never commit secrets.

Use these tools:
- Database MCP
- GitHub integration`;

      const result = parseCLAUDEmd(content);

      // Should classify based on strongest signals
      const hasContent = Boolean(result.layers.rules || result.layers.tools || result.unclassified.length > 0);
      expect(hasContent).toBe(true);
    });
  });
});
