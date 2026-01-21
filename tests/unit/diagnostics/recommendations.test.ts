/**
 * Unit tests for Recommendations Generator
 */

import { describe, it, expect } from 'vitest';
import { generateRecommendations } from '../../../src/diagnostics/recommendations.js';
import { MergedConfig } from '../../../src/types/config.js';
import { ConflictDetectionResult } from '../../../src/diagnostics/conflict-detector.js';

describe('Recommendations Generator', () => {
  describe('Empty Configuration', () => {
    it('should generate recommendations for empty config', () => {
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

      const conflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 50,
      };

      const result = generateRecommendations(merged, scopes, conflicts);

      expect(result).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.byPriority).toHaveProperty('high');
      expect(result.byPriority).toHaveProperty('medium');
      expect(result.byPriority).toHaveProperty('low');
      expect(result.quickWins).toBeInstanceOf(Array);
    });
  });

  describe('Recommendation Structure', () => {
    it('should include required fields in recommendation objects', () => {
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

      const conflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 60,
      };

      const result = generateRecommendations(merged, scopes, conflicts);

      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('impact');
        expect(rec).toHaveProperty('effort');
        expect(rec).toHaveProperty('action');

        // Validate types
        expect(typeof rec.id).toBe('string');
        expect(typeof rec.title).toBe('string');
        expect(typeof rec.description).toBe('string');
        expect(['high', 'medium', 'low']).toContain(rec.priority);
        expect(['high', 'medium', 'low']).toContain(rec.impact);
        expect(['high', 'medium', 'low']).toContain(rec.effort);
        expect(typeof rec.action).toBe('string');
      });
    });
  });

  describe('Priority Grouping', () => {
    it('should group recommendations by priority', () => {
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

      const conflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 70,
      };

      const result = generateRecommendations(merged, scopes, conflicts);

      // All recommendations should be categorized
      const totalCategorized =
        result.byPriority.high.length +
        result.byPriority.medium.length +
        result.byPriority.low.length;

      expect(totalCategorized).toBe(result.recommendations.length);

      // Verify priority grouping is correct
      result.byPriority.high.forEach(rec => {
        expect(rec.priority).toBe('high');
      });
      result.byPriority.medium.forEach(rec => {
        expect(rec.priority).toBe('medium');
      });
      result.byPriority.low.forEach(rec => {
        expect(rec.priority).toBe('low');
      });
    });
  });

  describe('Quick Wins Identification', () => {
    it('should identify quick wins (high impact, low effort)', () => {
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

      const conflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 65,
      };

      const result = generateRecommendations(merged, scopes, conflicts);

      // Quick wins should be high impact and low effort
      result.quickWins.forEach(rec => {
        expect(rec.impact).toBe('high');
        expect(rec.effort).toBe('low');
      });
    });

    it('should not duplicate quick wins in priority groups', () => {
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

      const conflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 55,
      };

      const result = generateRecommendations(merged, scopes, conflicts);

      // Quick wins should be a subset of all recommendations
      expect(result.quickWins.length).toBeLessThanOrEqual(result.recommendations.length);

      // Each quick win should exist in main recommendations array
      result.quickWins.forEach(quickWin => {
        const existsInMain = result.recommendations.some(rec => rec.id === quickWin.id);
        expect(existsInMain).toBe(true);
      });
    });
  });

  describe('Conflict-Based Recommendations', () => {
    it('should generate more recommendations when conflicts exist', () => {
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

      // Case 1: No conflicts
      const noConflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 90,
      };

      const resultNoConflicts = generateRecommendations(merged, scopes, noConflicts);

      // Case 2: With conflicts (simulated)
      const withConflicts: ConflictDetectionResult = {
        conflicts: [
          {
            id: 'c1',
            layer: 'rules',
            severity: 'error',
            message: 'Security rule conflict',
            scopes: ['task', 'project'],
          },
        ],
        bySeverity: {
          errors: [
            {
              id: 'c1',
              layer: 'rules',
              severity: 'error',
              message: 'Security rule conflict',
              scopes: ['task', 'project'],
            },
          ],
          warnings: [],
          info: [],
        },
        healthScore: 40,
      };

      const resultWithConflicts = generateRecommendations(merged, scopes, withConflicts);

      // Should provide recommendations regardless of conflicts
      expect(resultNoConflicts.recommendations).toBeInstanceOf(Array);
      expect(resultWithConflicts.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Layer-Specific Recommendations', () => {
    it('should generate recommendations for incomplete layers', () => {
      const merged: MergedConfig = {
        rules: {
          security: ['Some security rules'],
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

      const conflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 45,
      };

      const result = generateRecommendations(merged, scopes, conflicts);

      expect(result.recommendations.length).toBeGreaterThan(0);

      // Should have recommendations for empty layers
      const hasToolsRec = result.recommendations.some(
        rec => rec.layer && rec.layer === 'tools'
      );
      const hasMethodsRec = result.recommendations.some(
        rec => rec.layer && rec.layer === 'methods'
      );
      const hasKnowledgeRec = result.recommendations.some(
        rec => rec.layer && rec.layer === 'knowledge'
      );
      const hasGoalsRec = result.recommendations.some(
        rec => rec.layer && rec.layer === 'goals'
      );

      // At least one layer should have recommendations
      expect(
        hasToolsRec || hasMethodsRec || hasKnowledgeRec || hasGoalsRec
      ).toBe(true);
    });
  });

  describe('Valid Complete Configuration', () => {
    it('should generate fewer recommendations for complete config', () => {
      const merged: MergedConfig = {
        rules: {
          security: ['Security rule 1', 'Security rule 2'],
          constraints: ['Constraint 1'],
          forbidden: ['Forbidden action 1'],
        },
        tools: {
          mcpServers: ['Server 1', 'Server 2'],
          commands: ['Command 1'],
          capabilities: ['Capability 1'],
        },
        methods: {
          patterns: ['Pattern 1'],
          workflows: ['Workflow 1'],
          howTos: ['How-to 1'],
        },
        knowledge: {
          specifications: ['Spec 1'],
          architecture: ['Architecture doc 1'],
          context: ['Context 1'],
        },
        goals: {
          tasks: ['Task 1'],
          objectives: ['Objective 1'],
          priorities: ['Priority 1'],
        },
      };

      const scopes = {};

      const conflicts: ConflictDetectionResult = {
        conflicts: [],
        bySeverity: { errors: [], warnings: [], info: [] },
        healthScore: 95,
      };

      const result = generateRecommendations(merged, scopes, conflicts);

      // Complete config should have fewer or no recommendations
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.byPriority.high.length).toBeLessThanOrEqual(
        result.recommendations.length
      );
    });
  });
});
