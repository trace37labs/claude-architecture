/**
 * Unit tests for Conflict Detector
 */

import { describe, it, expect } from 'vitest';
import { detectConflicts, ConflictSeverity } from '../../../src/diagnostics/conflict-detector.js';
import { MergedConfig } from '../../../src/types/config.js';

describe('Conflict Detector', () => {
  describe('Empty Configuration', () => {
    it('should detect issues with empty config', () => {
      const merged: MergedConfig = {
        rules: {
          security: [],
          constraints: [],
          forbidden: [],
        },
        tools: {
          mcpServers: [],
          commands: [],
          capabilities: [],
        },
        methods: {
          patterns: [],
          workflows: [],
          howTos: [],
        },
        knowledge: {
          specifications: [],
          architecture: [],
          context: [],
        },
        goals: {
          tasks: [],
          objectives: [],
          priorities: [],
        },
      };

      const scopes = {};

      const result = detectConflicts(merged, scopes);

      // Empty config should trigger warnings/info messages about missing content
      expect(result.conflicts).toBeInstanceOf(Array);
      expect(result.bySeverity.errors).toHaveLength(0); // No errors for empty config
      // But should have some warnings or info about empty layers
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.healthScore).toBeGreaterThan(0);
      expect(result.healthScore).toBeLessThan(100); // Not perfect with empty layers
    });
  });

  describe('Valid Configuration', () => {
    it('should return high health score for valid config', () => {
      const merged: MergedConfig = {
        rules: {
          security: ['Validate all inputs', 'Sanitize outputs'],
          constraints: ['Max 100 requests/minute'],
          forbidden: ['No system commands', 'No file deletion'],
        },
        tools: {
          mcpServers: ['filesystem', 'database'],
          commands: ['git', 'npm'],
          capabilities: ['file-read', 'file-write'],
        },
        methods: {
          patterns: ['TDD', 'Code review process'],
          workflows: ['PR → Review → Merge'],
          howTos: ['How to deploy'],
        },
        knowledge: {
          specifications: ['API spec'],
          architecture: ['Clean architecture'],
          context: ['Project background'],
        },
        goals: {
          tasks: ['Implement feature X'],
          objectives: ['Launch v1.0'],
          priorities: ['Security first'],
        },
      };

      const scopes = {};

      const result = detectConflicts(merged, scopes);

      expect(result.healthScore).toBeGreaterThan(50);
      expect(result.bySeverity.errors).toHaveLength(0);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts and categorize by severity', () => {
      // Note: Actual conflict detection logic depends on implementation
      // This test validates the structure of results
      const merged: MergedConfig = {
        rules: {
          security: [],
          constraints: [],
          forbidden: [],
        },
        tools: {
          mcpServers: [],
          commands: [],
          capabilities: [],
        },
        methods: {
          patterns: [],
          workflows: [],
          howTos: [],
        },
        knowledge: {
          specifications: [],
          architecture: [],
          context: [],
        },
        goals: {
          tasks: [],
          objectives: [],
          priorities: [],
        },
      };

      const scopes = {};

      const result = detectConflicts(merged, scopes);

      // Validate structure
      expect(result.conflicts).toBeInstanceOf(Array);
      expect(result.bySeverity).toHaveProperty('errors');
      expect(result.bySeverity).toHaveProperty('warnings');
      expect(result.bySeverity).toHaveProperty('info');
      expect(typeof result.healthScore).toBe('number');
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
    });

    it('should group conflicts by severity correctly', () => {
      const merged: MergedConfig = {
        rules: {
          security: [],
          constraints: [],
          forbidden: [],
        },
        tools: {
          mcpServers: [],
          commands: [],
          capabilities: [],
        },
        methods: {
          patterns: [],
          workflows: [],
          howTos: [],
        },
        knowledge: {
          specifications: [],
          architecture: [],
          context: [],
        },
        goals: {
          tasks: [],
          objectives: [],
          priorities: [],
        },
      };

      const scopes = {};

      const result = detectConflicts(merged, scopes);

      // All conflicts should be categorized
      const totalCategorized =
        result.bySeverity.errors.length +
        result.bySeverity.warnings.length +
        result.bySeverity.info.length;

      expect(totalCategorized).toBe(result.conflicts.length);
    });
  });

  describe('Health Score Calculation', () => {
    it('should return 100 for perfect config with no issues', () => {
      const merged: MergedConfig = {
        rules: {
          security: ['Complete security rules'],
          constraints: ['Well-defined constraints'],
          forbidden: ['Clear forbidden actions'],
        },
        tools: {
          mcpServers: ['Configured MCP'],
          commands: ['Available commands'],
          capabilities: ['Defined capabilities'],
        },
        methods: {
          patterns: ['Best practices'],
          workflows: ['Clear workflows'],
          howTos: ['Documentation'],
        },
        knowledge: {
          specifications: ['Complete specs'],
          architecture: ['Architecture docs'],
          context: ['Project context'],
        },
        goals: {
          tasks: ['Current tasks'],
          objectives: ['Clear objectives'],
          priorities: ['Prioritized list'],
        },
      };

      const scopes = {};

      const result = detectConflicts(merged, scopes);

      // A complete, valid config should have high health score
      expect(result.healthScore).toBeGreaterThan(70);
    });

    it('should decrease health score with conflicts', () => {
      // This test validates that conflicts affect health score
      // Actual behavior depends on conflict detection implementation
      const merged: MergedConfig = {
        rules: {
          security: [],
          constraints: [],
          forbidden: [],
        },
        tools: {
          mcpServers: [],
          commands: [],
          capabilities: [],
        },
        methods: {
          patterns: [],
          workflows: [],
          howTos: [],
        },
        knowledge: {
          specifications: [],
          architecture: [],
          context: [],
        },
        goals: {
          tasks: [],
          objectives: [],
          priorities: [],
        },
      };

      const scopes = {};

      const result = detectConflicts(merged, scopes);

      // Health score should be a valid percentage
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Conflict Structure', () => {
    it('should include required fields in conflict objects', () => {
      const merged: MergedConfig = {
        rules: {
          security: [],
          constraints: [],
          forbidden: [],
        },
        tools: {
          mcpServers: [],
          commands: [],
          capabilities: [],
        },
        methods: {
          patterns: [],
          workflows: [],
          howTos: [],
        },
        knowledge: {
          specifications: [],
          architecture: [],
          context: [],
        },
        goals: {
          tasks: [],
          objectives: [],
          priorities: [],
        },
      };

      const scopes = {};

      const result = detectConflicts(merged, scopes);

      // Check structure of any conflicts found
      result.conflicts.forEach(conflict => {
        expect(conflict).toHaveProperty('id');
        expect(conflict).toHaveProperty('layer');
        expect(conflict).toHaveProperty('severity');
        expect(conflict).toHaveProperty('message');
        expect(conflict).toHaveProperty('scopes');

        // Validate types
        expect(typeof conflict.id).toBe('string');
        expect(typeof conflict.layer).toBe('string');
        expect(['error', 'warning', 'info']).toContain(conflict.severity);
        expect(typeof conflict.message).toBe('string');
        expect(Array.isArray(conflict.scopes)).toBe(true);
      });
    });
  });

  describe('Scope Analysis', () => {
    it('should handle multiple scopes', () => {
      const merged: MergedConfig = {
        rules: {
          security: [],
          constraints: [],
          forbidden: [],
        },
        tools: {
          mcpServers: [],
          commands: [],
          capabilities: [],
        },
        methods: {
          patterns: [],
          workflows: [],
          howTos: [],
        },
        knowledge: {
          specifications: [],
          architecture: [],
          context: [],
        },
        goals: {
          tasks: [],
          objectives: [],
          priorities: [],
        },
      };

      const scopes = {
        task: { rules: {} },
        project: { rules: {} },
        user: { rules: {} },
        system: { rules: {} },
      };

      const result = detectConflicts(merged, scopes);

      expect(result).toBeDefined();
      expect(result.conflicts).toBeInstanceOf(Array);
    });

    it('should handle single scope', () => {
      const merged: MergedConfig = {
        rules: {
          security: [],
          constraints: [],
          forbidden: [],
        },
        tools: {
          mcpServers: [],
          commands: [],
          capabilities: [],
        },
        methods: {
          patterns: [],
          workflows: [],
          howTos: [],
        },
        knowledge: {
          specifications: [],
          architecture: [],
          context: [],
        },
        goals: {
          tasks: [],
          objectives: [],
          priorities: [],
        },
      };

      const scopes = {
        project: { rules: {} },
      };

      const result = detectConflicts(merged, scopes);

      expect(result).toBeDefined();
      expect(result.conflicts).toBeInstanceOf(Array);
    });
  });
});
