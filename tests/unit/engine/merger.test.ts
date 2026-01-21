/**
 * Tests for merger.ts
 */

import { describe, it, expect } from 'vitest';
import {
  mergeRules,
  mergeTools,
  mergeMethods,
  mergeKnowledge,
  mergeGoals,
} from '../../../src/engine/merger.js';
import {
  RulesLayer,
  ToolsLayer,
  MethodsLayer,
  KnowledgeLayer,
  GoalsLayer,
} from '../../../src/types/layers.js';
import { ScopeLevel } from '../../../src/types/scope.js';

describe('mergeRules', () => {
  it('should merge security rules additively', () => {
    const rules: RulesLayer[] = [
      { security: ['rule1', 'rule2'] },
      { security: ['rule3'] },
    ];

    const merged = mergeRules(rules);

    expect(merged.security).toEqual(['rule1', 'rule2', 'rule3']);
  });

  it('should deduplicate security rules', () => {
    const rules: RulesLayer[] = [
      { security: ['rule1', 'rule2'] },
      { security: ['rule2', 'rule3'] },
    ];

    const merged = mergeRules(rules);

    expect(merged.security).toEqual(['rule1', 'rule2', 'rule3']);
  });

  it('should merge all rule categories', () => {
    const rules: RulesLayer[] = [
      {
        security: ['sec1'],
        forbidden: ['forbidden1'],
        required: ['required1'],
      },
      {
        security: ['sec2'],
        outputRequirements: ['out1'],
        compliance: ['comp1'],
      },
    ];

    const merged = mergeRules(rules);

    expect(merged.security).toEqual(['sec1', 'sec2']);
    expect(merged.forbidden).toEqual(['forbidden1']);
    expect(merged.required).toEqual(['required1']);
    expect(merged.outputRequirements).toEqual(['out1']);
    expect(merged.compliance).toEqual(['comp1']);
  });

  it('should concatenate raw content', () => {
    const rules: RulesLayer[] = [
      { rawContent: 'First rule' },
      { rawContent: 'Second rule' },
    ];

    const merged = mergeRules(rules);

    expect(merged.rawContent).toBe('First rule\n\nSecond rule');
  });

  it('should handle empty rules array', () => {
    const merged = mergeRules([]);

    expect(merged.security).toEqual([]);
    expect(merged.forbidden).toEqual([]);
  });
});

describe('mergeTools', () => {
  it('should merge MCP servers by name', () => {
    const tools: ToolsLayer[] = [
      {
        mcpServers: [
          { name: 'server1', command: 'cmd1' },
          { name: 'server2', command: 'cmd2' },
        ],
      },
      {
        mcpServers: [{ name: 'server1', command: 'cmd1-updated' }],
      },
    ];

    const merged = mergeTools(tools);

    expect(merged.mcpServers).toHaveLength(2);
    expect(merged.mcpServers?.find((s) => s.name === 'server1')?.command).toBe(
      'cmd1-updated'
    );
  });

  it('should merge slash commands by name', () => {
    const tools: ToolsLayer[] = [
      {
        commands: [
          { name: 'cmd1', description: 'desc1', implementation: 'impl1' },
        ],
      },
      {
        commands: [
          { name: 'cmd1', description: 'desc1-updated', implementation: 'impl1-updated' },
        ],
      },
    ];

    const merged = mergeTools(tools);

    expect(merged.commands).toHaveLength(1);
    expect(merged.commands?.[0].description).toBe('desc1-updated');
  });

  it('should merge scripts additively', () => {
    const tools: ToolsLayer[] = [
      { scripts: { script1: 'value1', script2: 'value2' } },
      { scripts: { script2: 'value2-updated', script3: 'value3' } },
    ];

    const merged = mergeTools(tools);

    expect(merged.scripts).toEqual({
      script1: 'value1',
      script2: 'value2-updated',
      script3: 'value3',
    });
  });

  it('should merge services and deduplicate', () => {
    const tools: ToolsLayer[] = [
      { services: ['service1', 'service2'] },
      { services: ['service2', 'service3'] },
    ];

    const merged = mergeTools(tools);

    expect(merged.services).toEqual(['service1', 'service2', 'service3']);
  });
});

describe('mergeMethods', () => {
  it('should use override when explicitly set', () => {
    const methods: MethodsLayer[] = [
      {
        patterns: [{ name: 'pattern1', when: 'when1', implementation: 'impl1' }],
      },
      {
        patterns: [{ name: 'pattern2', when: 'when2', implementation: 'impl2' }],
        override: true,
      },
    ];

    const merged = mergeMethods(methods, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.patterns).toHaveLength(1);
    expect(merged.patterns?.[0].name).toBe('pattern2');
  });

  it('should merge patterns by name when no override', () => {
    const methods: MethodsLayer[] = [
      {
        patterns: [{ name: 'pattern1', when: 'when1', implementation: 'impl1' }],
      },
      {
        patterns: [{ name: 'pattern2', when: 'when2', implementation: 'impl2' }],
      },
    ];

    const merged = mergeMethods(methods, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.patterns).toHaveLength(2);
  });

  it('should merge workflows by name', () => {
    const methods: MethodsLayer[] = [
      {
        workflows: {
          workflow1: [{ step: 1, description: 'Step 1' }],
        },
      },
      {
        workflows: {
          workflow2: [{ step: 1, description: 'Different step' }],
        },
      },
    ];

    const merged = mergeMethods(methods, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.workflows).toHaveProperty('workflow1');
    expect(merged.workflows).toHaveProperty('workflow2');
  });

  it('should deduplicate best practices', () => {
    const methods: MethodsLayer[] = [
      { bestPractices: ['practice1', 'practice2'] },
      { bestPractices: ['practice2', 'practice3'] },
    ];

    const merged = mergeMethods(methods, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.bestPractices).toEqual(['practice1', 'practice2', 'practice3']);
  });
});

describe('mergeKnowledge', () => {
  it('should concatenate overview text', () => {
    const knowledge: KnowledgeLayer[] = [
      { overview: 'First overview' },
      { overview: 'Second overview' },
    ];

    const merged = mergeKnowledge(knowledge);

    expect(merged.overview).toBe('First overview\n\nSecond overview');
  });

  it('should merge glossary by key', () => {
    const knowledge: KnowledgeLayer[] = [
      { glossary: { term1: 'def1', term2: 'def2' } },
      { glossary: { term2: 'def2-updated', term3: 'def3' } },
    ];

    const merged = mergeKnowledge(knowledge);

    expect(merged.glossary).toEqual({
      term1: 'def1',
      term2: 'def2-updated',
      term3: 'def3',
    });
  });

  it('should merge ADRs by number and sort', () => {
    const knowledge: KnowledgeLayer[] = [
      {
        adrs: [
          { number: 1, title: 'ADR 1', status: 'accepted', context: 'ctx1', decision: 'dec1' },
          { number: 3, title: 'ADR 3', status: 'accepted', context: 'ctx3', decision: 'dec3' },
        ],
      },
      {
        adrs: [
          { number: 2, title: 'ADR 2', status: 'proposed', context: 'ctx2', decision: 'dec2' },
        ],
      },
    ];

    const merged = mergeKnowledge(knowledge);

    expect(merged.adrs).toHaveLength(3);
    expect(merged.adrs?.[0].number).toBe(1);
    expect(merged.adrs?.[1].number).toBe(2);
    expect(merged.adrs?.[2].number).toBe(3);
  });

  it('should deduplicate business rules', () => {
    const knowledge: KnowledgeLayer[] = [
      { businessRules: ['rule1', 'rule2'] },
      { businessRules: ['rule2', 'rule3'] },
    ];

    const merged = mergeKnowledge(knowledge);

    expect(merged.businessRules).toEqual(['rule1', 'rule2', 'rule3']);
  });
});

describe('mergeGoals', () => {
  it('should use most specific current goal', () => {
    const goals: GoalsLayer[] = [
      { current: 'General goal' },
      { current: 'Specific goal' },
    ];

    const merged = mergeGoals(goals, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.current).toBe('General goal');
  });

  it('should use override when explicitly set', () => {
    const goals: GoalsLayer[] = [
      {
        current: 'General goal',
        priorities: ['priority1'],
      },
      {
        current: 'Specific goal',
        priorities: ['priority2'],
        override: true,
      },
    ];

    const merged = mergeGoals(goals, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.current).toBe('Specific goal');
    expect(merged.priorities).toEqual(['priority2']);
  });

  it('should merge success criteria and mark completed if any are', () => {
    const goals: GoalsLayer[] = [
      {
        successCriteria: [
          { description: 'Criterion 1', completed: false },
        ],
      },
      {
        successCriteria: [
          { description: 'Criterion 1', completed: true },
          { description: 'Criterion 2', completed: false },
        ],
      },
    ];

    const merged = mergeGoals(goals, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.successCriteria).toHaveLength(2);
    const criterion1 = merged.successCriteria?.find(c => c.description === 'Criterion 1');
    expect(criterion1?.completed).toBe(true);
  });

  it('should use most specific priorities list', () => {
    const goals: GoalsLayer[] = [
      { priorities: ['priority1', 'priority2'] },
      { priorities: ['priority3', 'priority4'] },
    ];

    const merged = mergeGoals(goals, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.priorities).toEqual(['priority3', 'priority4']);
  });

  it('should deduplicate non-goals', () => {
    const goals: GoalsLayer[] = [
      { nonGoals: ['nongoal1', 'nongoal2'] },
      { nonGoals: ['nongoal2', 'nongoal3'] },
    ];

    const merged = mergeGoals(goals, [ScopeLevel.System, ScopeLevel.Task]);

    expect(merged.nonGoals).toEqual(['nongoal1', 'nongoal2', 'nongoal3']);
  });
});
