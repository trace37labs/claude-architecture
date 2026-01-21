/**
 * Tests for resolver.ts
 */

import { describe, it, expect } from 'vitest';
import {
  resolveConfig,
  createConfigContext,
  resolveForTask,
  extractLayer,
  hasLayerContent,
  getScopeSummary,
} from '../../../src/engine/resolver.js';
import { ScopeConfig } from '../../../src/types/config.js';
import { ScopeLevel } from '../../../src/types/scope.js';
import { LayerType } from '../../../src/types/layers.js';

describe('resolveConfig', () => {
  it('should merge configs with proper precedence', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: { security: ['system-rule'] },
      },
      {
        scope: ScopeLevel.Task,
        basePath: '/task',
        rules: { security: ['task-rule'] },
      },
    ];

    const resolved = resolveConfig(configs);

    expect(resolved.rules.security).toContain('system-rule');
    expect(resolved.rules.security).toContain('task-rule');
  });

  it('should include metadata about merge', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.User,
        basePath: '/user',
        rules: { security: ['rule1'] },
      },
    ];

    const resolved = resolveConfig(configs);

    expect(resolved.metadata.scopesIncluded).toContain(ScopeLevel.User);
    expect(resolved.metadata.layerSources[LayerType.Rules]).toContain('/user');
    expect(resolved.metadata.mergedAt).toBeInstanceOf(Date);
  });

  it('should handle empty configs array', () => {
    const resolved = resolveConfig([]);

    expect(resolved.rules.security).toEqual([]);
    expect(resolved.metadata.scopesIncluded).toHaveLength(0);
  });

  it('should apply override correctly for methods', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        methods: {
          patterns: [{ name: 'pattern1', when: 'when1', implementation: 'impl1' }],
        },
      },
      {
        scope: ScopeLevel.Task,
        basePath: '/task',
        methods: {
          patterns: [{ name: 'pattern2', when: 'when2', implementation: 'impl2' }],
          override: true,
        },
      },
    ];

    const resolved = resolveConfig(configs);

    expect(resolved.methods.patterns).toHaveLength(1);
    expect(resolved.methods.patterns?.[0].name).toBe('pattern2');
  });
});

describe('createConfigContext', () => {
  it('should create full context with merged config', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.Project,
        basePath: '/project',
        rules: { security: ['rule1'] },
      },
    ];

    const context = createConfigContext(configs, 'task-123');

    expect(context.config).toBeDefined();
    expect(context.scopes.project).toBeDefined();
    expect(context.createdAt).toBeInstanceOf(Date);
    expect(context.taskId).toBe('task-123');
  });

  it('should organize configs by scope level', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: { security: ['rule1'] },
      },
      {
        scope: ScopeLevel.User,
        basePath: '/user',
        rules: { security: ['rule2'] },
      },
    ];

    const context = createConfigContext(configs);

    expect(context.scopes.system).toBeDefined();
    expect(context.scopes.user).toBeDefined();
    expect(context.scopes.project).toBeUndefined();
  });
});

describe('resolveForTask', () => {
  it('should resolve with only task config', () => {
    const taskConfig: ScopeConfig = {
      scope: ScopeLevel.Task,
      basePath: '/task',
      rules: { security: ['task-rule'] },
    };

    const context = resolveForTask(taskConfig);

    expect(context.config.rules.security).toContain('task-rule');
    expect(context.scopes.task).toBeDefined();
  });

  it('should apply correct precedence order', () => {
    const systemConfig: ScopeConfig = {
      scope: ScopeLevel.System,
      basePath: '/system',
      methods: {
        patterns: [{ name: 'system-pattern', when: 'when1', implementation: 'impl1' }],
      },
    };

    const taskConfig: ScopeConfig = {
      scope: ScopeLevel.Task,
      basePath: '/task',
      methods: {
        patterns: [{ name: 'task-pattern', when: 'when2', implementation: 'impl2' }],
        override: true,
      },
    };

    const context = resolveForTask(taskConfig, undefined, undefined, systemConfig);

    expect(context.config.methods.patterns).toHaveLength(1);
    expect(context.config.methods.patterns?.[0].name).toBe('task-pattern');
  });

  it('should handle all scope levels', () => {
    const systemConfig: ScopeConfig = {
      scope: ScopeLevel.System,
      basePath: '/system',
    };
    const userConfig: ScopeConfig = {
      scope: ScopeLevel.User,
      basePath: '/user',
    };
    const projectConfig: ScopeConfig = {
      scope: ScopeLevel.Project,
      basePath: '/project',
    };
    const taskConfig: ScopeConfig = {
      scope: ScopeLevel.Task,
      basePath: '/task',
    };

    const context = resolveForTask(
      taskConfig,
      projectConfig,
      userConfig,
      systemConfig,
      'test-task'
    );

    expect(context.scopes.system).toBeDefined();
    expect(context.scopes.user).toBeDefined();
    expect(context.scopes.project).toBeDefined();
    expect(context.scopes.task).toBeDefined();
    expect(context.taskId).toBe('test-task');
  });

  it('should handle undefined configs', () => {
    const context = resolveForTask();

    expect(context.config).toBeDefined();
    expect(context.scopes.system).toBeUndefined();
  });
});

describe('extractLayer', () => {
  it('should extract rules layer', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: { security: ['rule1'] },
      },
    ];

    const resolved = resolveConfig(configs);
    const rules = extractLayer(resolved, LayerType.Rules);

    expect(rules.security).toContain('rule1');
  });

  it('should extract tools layer', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        tools: { services: ['service1'] },
      },
    ];

    const resolved = resolveConfig(configs);
    const tools = extractLayer(resolved, LayerType.Tools);

    expect(tools.services).toContain('service1');
  });

  it('should extract methods layer', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        methods: { bestPractices: ['practice1'] },
      },
    ];

    const resolved = resolveConfig(configs);
    const methods = extractLayer(resolved, LayerType.Methods);

    expect(methods.bestPractices).toContain('practice1');
  });
});

describe('hasLayerContent', () => {
  it('should return true for layer with content', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: { security: ['rule1'] },
      },
    ];

    const resolved = resolveConfig(configs);

    expect(hasLayerContent(resolved, LayerType.Rules)).toBe(true);
  });

  it('should return false for empty layer', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: {},
      },
    ];

    const resolved = resolveConfig(configs);

    expect(hasLayerContent(resolved, LayerType.Rules)).toBe(false);
  });

  it('should return false for layer with empty arrays', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: { security: [] },
      },
    ];

    const resolved = resolveConfig(configs);

    expect(hasLayerContent(resolved, LayerType.Rules)).toBe(false);
  });
});

describe('getScopeSummary', () => {
  it('should return summary for all layers', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: { security: ['rule1'] },
        tools: { services: ['service1'] },
      },
    ];

    const context = createConfigContext(configs);
    const summary = getScopeSummary(context);

    expect(summary).toHaveLength(5);
    expect(summary.map((s) => s.layer)).toContain(LayerType.Rules);
    expect(summary.map((s) => s.layer)).toContain(LayerType.Tools);
  });

  it('should identify which scopes contributed to each layer', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.System,
        basePath: '/system',
        rules: { security: ['rule1'] },
      },
      {
        scope: ScopeLevel.User,
        basePath: '/user',
        rules: { security: ['rule2'] },
      },
    ];

    const context = createConfigContext(configs);
    const summary = getScopeSummary(context);

    const rulesSummary = summary.find((s) => s.layer === LayerType.Rules);
    expect(rulesSummary?.scopes).toContain(ScopeLevel.System);
    expect(rulesSummary?.scopes).toContain(ScopeLevel.User);
  });

  it('should include source paths', () => {
    const configs: ScopeConfig[] = [
      {
        scope: ScopeLevel.Project,
        basePath: '/project',
        methods: { bestPractices: ['practice1'] },
      },
    ];

    const context = createConfigContext(configs);
    const summary = getScopeSummary(context);

    const methodsSummary = summary.find((s) => s.layer === LayerType.Methods);
    expect(methodsSummary?.sources).toContain('/project');
  });
});
