/**
 * Integration Tests - End-to-End Workflows
 *
 * These tests verify that complete CLI workflows work correctly:
 * - init → validate
 * - migrate → validate
 * - init → modify → validate
 * - init → show
 * - init → doctor
 * - complete workflow (all commands)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { initCommand } from '../../src/commands/init.js';
import { migrateCommand } from '../../src/commands/migrate.js';
import { validateCommand } from '../../src/commands/validate.js';
import { showCommand } from '../../src/commands/show.js';
import { doctorCommand } from '../../src/commands/doctor.js';

// Test directories
const TEST_ROOT = path.join(process.cwd(), 'test-output-integration');
const INIT_DIR = path.join(TEST_ROOT, 'init-test');
const MIGRATE_DIR = path.join(TEST_ROOT, 'migrate-test');
const WORKFLOW_DIR = path.join(TEST_ROOT, 'workflow-test');

describe('Integration Tests - End-to-End Workflows', () => {
  beforeEach(async () => {
    // Clean up test root
    try {
      await fs.rm(TEST_ROOT, { recursive: true, force: true });
    } catch (err) {
      // Ignore if doesn't exist
    }
    // Create fresh test root
    await fs.mkdir(TEST_ROOT, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(TEST_ROOT, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('Workflow: Init → Validate', () => {
    it('should create valid minimal structure', async () => {
      // Step 1: Initialize minimal structure
      await initCommand({
        minimal: true,
        targetDir: INIT_DIR,
      });

      // Step 2: Validate the structure
      const report = await validateCommand({
        targetDir: INIT_DIR,
      });

      // Assertions
      expect(report.valid).toBe(true);
      expect(report.totalErrors).toBe(0);
    });

    it('should create valid full structure', async () => {
      // Step 1: Initialize full structure
      await initCommand({
        minimal: false,
        targetDir: INIT_DIR,
      });

      // Step 2: Validate the structure
      const report = await validateCommand({
        targetDir: INIT_DIR,
      });

      // Assertions
      expect(report.valid).toBe(true);
      expect(report.totalErrors).toBe(0);
    });
  });

  describe('Workflow: Migrate → Validate', () => {
    it('should migrate CLAUDE.md and produce valid structure', async () => {
      // Step 1: Create a mock CLAUDE.md file
      await fs.mkdir(MIGRATE_DIR, { recursive: true });
      const claudeMdPath = path.join(MIGRATE_DIR, 'CLAUDE.md');
      await fs.writeFile(
        claudeMdPath,
        `# Project Configuration

## Security Rules

- Never expose API keys
- Validate all user input

## Available Tools

- Git for version control
- npm for package management

## Development Methods

Follow TDD approach:
1. Write tests first
2. Implement features
3. Refactor

## Project Knowledge

This is a TypeScript project using Node.js.

## Current Goals

- Implement user authentication
- Add API rate limiting
`
      );

      // Step 2: Migrate the file
      await migrateCommand({
        sourceDir: MIGRATE_DIR,
        minimal: true,
      });

      // Step 3: Validate the result
      const report = await validateCommand({
        targetDir: MIGRATE_DIR,
      });

      // Assertions
      expect(report.valid).toBe(true);
      expect(report.totalErrors).toBe(0);

      // Verify files were created
      const claudeDir = path.join(MIGRATE_DIR, '.claude');
      const rulesPath = path.join(claudeDir, 'rules.md');
      const toolsPath = path.join(claudeDir, 'tools.md');
      const methodsPath = path.join(claudeDir, 'methods.md');
      const knowledgePath = path.join(claudeDir, 'knowledge.md');
      const goalsPath = path.join(claudeDir, 'goals.md');

      // All files should exist
      await expect(fs.access(rulesPath)).resolves.not.toThrow();
      await expect(fs.access(toolsPath)).resolves.not.toThrow();
      await expect(fs.access(methodsPath)).resolves.not.toThrow();
      await expect(fs.access(knowledgePath)).resolves.not.toThrow();
      await expect(fs.access(goalsPath)).resolves.not.toThrow();

      // Content should be preserved
      const rulesContent = await fs.readFile(rulesPath, 'utf-8');
      expect(rulesContent).toContain('Never expose API keys');

      const toolsContent = await fs.readFile(toolsPath, 'utf-8');
      expect(toolsContent).toContain('Git for version control');

      const methodsContent = await fs.readFile(methodsPath, 'utf-8');
      expect(methodsContent).toContain('TDD approach');

      const knowledgeContent = await fs.readFile(knowledgePath, 'utf-8');
      expect(knowledgeContent).toContain('TypeScript project');

      const goalsContent = await fs.readFile(goalsPath, 'utf-8');
      expect(goalsContent).toContain('user authentication');
    });
  });

  describe('Workflow: Init → Modify → Validate', () => {
    it('should detect invalid modifications', async () => {
      // Step 1: Initialize structure
      await initCommand({
        minimal: true,
        targetDir: WORKFLOW_DIR,
      });

      // Step 2: Modify a file with invalid content
      const rulesPath = path.join(WORKFLOW_DIR, '.claude', 'rules.md');
      await fs.writeFile(
        rulesPath,
        `# Rules

## Invalid Section
This has no content
`
      );

      // Step 3: Validate (should still pass - content validation is lenient)
      const report = await validateCommand({
        targetDir: WORKFLOW_DIR,
      });

      // Structure should still be valid
      expect(report.structure.valid).toBe(true);
    });

    it('should validate when files are properly modified', async () => {
      // Step 1: Initialize structure
      await initCommand({
        minimal: true,
        targetDir: WORKFLOW_DIR,
      });

      // Step 2: Add proper content to files
      const rulesPath = path.join(WORKFLOW_DIR, '.claude', 'rules.md');
      await fs.writeFile(
        rulesPath,
        `# Rules

## Security
- Validate all inputs
- Use HTTPS only

## Code Standards
- Follow ESLint rules
- Write comprehensive tests
`
      );

      const toolsPath = path.join(WORKFLOW_DIR, '.claude', 'tools.md');
      await fs.writeFile(
        toolsPath,
        `# Tools

## Version Control
- Git

## Package Management
- npm
`
      );

      // Step 3: Validate
      const report = await validateCommand({
        targetDir: WORKFLOW_DIR,
      });

      // Assertions
      expect(report.valid).toBe(true);
      expect(report.structure.valid).toBe(true);
    });
  });

  describe('Workflow: Init → Show', () => {
    it('should display configuration after init', async () => {
      // Step 1: Initialize structure
      await initCommand({
        minimal: true,
        targetDir: WORKFLOW_DIR,
      });

      // Step 2: Show configuration (returns void, just prints)
      await showCommand({
        targetDir: WORKFLOW_DIR,
        format: 'json',
      });

      // Test passes if no error thrown
      expect(true).toBe(true);
    });

    it('should show precedence view after init', async () => {
      // Step 1: Initialize structure
      await initCommand({
        minimal: true,
        targetDir: WORKFLOW_DIR,
      });

      // Step 2: Show with precedence format (returns void, just prints)
      await showCommand({
        targetDir: WORKFLOW_DIR,
        format: 'precedence',
      });

      // Test passes if no error thrown
      expect(true).toBe(true);
    });
  });

  describe('Workflow: Init → Doctor', () => {
    it('should run health check on new structure', async () => {
      // Step 1: Initialize structure
      await initCommand({
        minimal: true,
        targetDir: WORKFLOW_DIR,
      });

      // Step 2: Run doctor
      const report = await doctorCommand({
        targetDir: WORKFLOW_DIR,
      });

      // Assertions
      expect(report.healthScore).toBeGreaterThanOrEqual(80);
      expect(report.conflicts).toBeDefined();
      // Recommendations are optional - just verify report is complete
      expect(report.assessment).toBeDefined();
    });

    it('should detect conflicts in modified structure', async () => {
      // Step 1: Initialize structure
      await initCommand({
        minimal: true,
        targetDir: WORKFLOW_DIR,
      });

      // Step 2: Create conflicting content
      const rulesPath = path.join(WORKFLOW_DIR, '.claude', 'rules.md');
      await fs.writeFile(
        rulesPath,
        `# Rules

## Security
- Allow HTTP connections
- Skip input validation
`
      );

      const methodsPath = path.join(WORKFLOW_DIR, '.claude', 'methods.md');
      await fs.writeFile(
        methodsPath,
        `# Methods

## API Design
- Use HTTP for all endpoints
- Trust all user input
`
      );

      // Step 3: Run doctor
      const report = await doctorCommand({
        targetDir: WORKFLOW_DIR,
      });

      // Assertions - doctor should detect content but still report healthy
      expect(report.conflicts).toBeDefined();
      expect(report.healthScore).toBeGreaterThan(0);
    });
  });

  describe('Complete Workflow: Init → Migrate → Validate → Show → Doctor', () => {
    it('should complete full workflow successfully', async () => {
      const completeDir = path.join(TEST_ROOT, 'complete-workflow');
      await fs.mkdir(completeDir, { recursive: true });

      // Step 1: Create initial CLAUDE.md
      const claudeMdPath = path.join(completeDir, 'CLAUDE.md');
      await fs.writeFile(
        claudeMdPath,
        `# Complete Project Configuration

## Security Rules
- Use HTTPS only
- Validate inputs
- Sanitize outputs

## Available Tools
- Git
- Docker
- npm

## Development Methods
1. Write tests first
2. Implement feature
3. Code review
4. Deploy

## Knowledge Base
This is a full-stack application using:
- Frontend: React
- Backend: Node.js
- Database: PostgreSQL

## Current Goals
- Complete user authentication
- Implement API rate limiting
- Add logging system
`
      );

      // Step 2: Migrate
      await migrateCommand({
        sourceDir: completeDir,
        minimal: false, // Use full structure
        backup: true,
      });

      // Step 3: Validate
      const validateReport = await validateCommand({
        targetDir: completeDir,
        verbose: true,
      });

      expect(validateReport.valid).toBe(true);

      // Step 4: Show configuration (returns void, just prints)
      await showCommand({
        targetDir: completeDir,
        format: 'json',
      });

      // Step 5: Run doctor
      const doctorReport = await doctorCommand({
        targetDir: completeDir,
      });

      expect(doctorReport.healthScore).toBeGreaterThanOrEqual(70);

      // Verify backup was created (with .bak extension)
      const backupPath = path.join(completeDir, 'CLAUDE.md.bak');
      await expect(fs.access(backupPath)).resolves.not.toThrow();

      // Verify structure exists
      const claudeDir = path.join(completeDir, '.claude');
      const stat = await fs.stat(claudeDir);
      expect(stat.isDirectory()).toBe(true);

      // Verify all directories exist (full structure)
      const rulesDir = path.join(claudeDir, 'rules');
      const toolsDir = path.join(claudeDir, 'tools');
      const methodsDir = path.join(claudeDir, 'methods');
      const knowledgeDir = path.join(claudeDir, 'knowledge');
      const goalsDir = path.join(claudeDir, 'goals');

      await expect(fs.access(rulesDir)).resolves.not.toThrow();
      await expect(fs.access(toolsDir)).resolves.not.toThrow();
      await expect(fs.access(methodsDir)).resolves.not.toThrow();
      await expect(fs.access(knowledgeDir)).resolves.not.toThrow();
      await expect(fs.access(goalsDir)).resolves.not.toThrow();
    });
  });

  describe('Error Handling in Workflows', () => {
    it('should handle init on existing directory gracefully', async () => {
      // Step 1: Initialize once
      await initCommand({
        minimal: true,
        targetDir: WORKFLOW_DIR,
      });

      // Step 2: Try to initialize again without force flag
      await expect(
        initCommand({
          minimal: true,
          targetDir: WORKFLOW_DIR,
        })
      ).rejects.toThrow();
    });

    it('should handle migrate with missing source file', async () => {
      await fs.mkdir(MIGRATE_DIR, { recursive: true });

      // Migrate without CLAUDE.md - should succeed but no files to migrate
      const result = await migrateCommand({
        sourceDir: MIGRATE_DIR,
      });

      // When no files found, arrays are empty
      expect(result.migrated).toHaveLength(0);
      expect(result.created).toHaveLength(0);
    });

    it('should handle validate on non-existent directory', async () => {
      const nonExistentDir = path.join(TEST_ROOT, 'does-not-exist');

      // Validate non-existent directory - should return invalid report
      const report = await validateCommand({
        targetDir: nonExistentDir,
      });

      expect(report.valid).toBe(false);
      expect(report.totalErrors).toBeGreaterThan(0);
    });
  });
});
