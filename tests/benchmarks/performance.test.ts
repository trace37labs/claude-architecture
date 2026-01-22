/**
 * Performance Benchmarks for claude-arch
 *
 * Goal: Ensure config resolution is fast enough for large projects
 * Target: Resolution under 100ms for typical projects
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { resolveConfig, resolveForTask } from '../../src/engine/resolver.js';
import { ScopeConfig } from '../../src/types/config.js';
import { ScopeLevel } from '../../src/types/scope.js';
import { LayerType } from '../../src/types/layers.js';

/**
 * Helper to measure execution time
 */
function measure(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

/**
 * Helper to run multiple iterations and get stats
 */
function benchmark(fn: () => void, iterations = 100): {
  mean: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
} {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    times.push(measure(fn));
  }

  times.sort((a, b) => a - b);

  return {
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    min: times[0],
    max: times[times.length - 1],
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
  };
}

/**
 * Generate a small config (typical small project)
 */
function generateSmallConfig(scope: ScopeLevel): ScopeConfig {
  return {
    scope,
    basePath: `/${scope}`,
    rules: {
      security: ['rule1', 'rule2', 'rule3'],
      constraints: ['constraint1', 'constraint2'],
    },
    tools: {
      services: ['service1', 'service2'],
      commands: ['cmd1', 'cmd2'],
    },
    methods: {
      patterns: [
        { name: 'pattern1', when: 'when1', implementation: 'impl1' },
        { name: 'pattern2', when: 'when2', implementation: 'impl2' },
      ],
      bestPractices: ['practice1', 'practice2'],
    },
    knowledge: {
      specifications: ['spec1', 'spec2'],
      architecture: ['arch1', 'arch2'],
    },
    goals: {
      current: ['goal1', 'goal2'],
      objectives: ['objective1', 'objective2'],
    },
  };
}

/**
 * Generate a medium config (typical medium project with more content)
 */
function generateMediumConfig(scope: ScopeLevel): ScopeConfig {
  const rules = Array.from({ length: 20 }, (_, i) => `rule${i + 1}`);
  const tools = Array.from({ length: 15 }, (_, i) => `tool${i + 1}`);
  const patterns = Array.from({ length: 30 }, (_, i) => ({
    name: `pattern${i + 1}`,
    when: `when${i + 1}`,
    implementation: `impl${i + 1}`,
  }));
  const specs = Array.from({ length: 25 }, (_, i) => `spec${i + 1}`);
  const goals = Array.from({ length: 10 }, (_, i) => `goal${i + 1}`);

  return {
    scope,
    basePath: `/${scope}`,
    rules: {
      security: rules.slice(0, 10),
      constraints: rules.slice(10),
    },
    tools: {
      services: tools.slice(0, 8),
      commands: tools.slice(8),
    },
    methods: {
      patterns,
      bestPractices: Array.from({ length: 15 }, (_, i) => `practice${i + 1}`),
    },
    knowledge: {
      specifications: specs.slice(0, 15),
      architecture: specs.slice(15),
    },
    goals: {
      current: goals.slice(0, 5),
      objectives: goals.slice(5),
    },
  };
}

/**
 * Generate a large config (very large project with extensive config)
 */
function generateLargeConfig(scope: ScopeLevel): ScopeConfig {
  const rules = Array.from({ length: 100 }, (_, i) => `rule${i + 1}`);
  const tools = Array.from({ length: 80 }, (_, i) => `tool${i + 1}`);
  const patterns = Array.from({ length: 150 }, (_, i) => ({
    name: `pattern${i + 1}`,
    when: `when${i + 1}`,
    implementation: `impl${i + 1}`.repeat(10), // Longer strings
  }));
  const specs = Array.from({ length: 120 }, (_, i) => `spec${i + 1}`);
  const goals = Array.from({ length: 50 }, (_, i) => `goal${i + 1}`);

  return {
    scope,
    basePath: `/${scope}`,
    rules: {
      security: rules.slice(0, 50),
      constraints: rules.slice(50),
    },
    tools: {
      services: tools.slice(0, 40),
      commands: tools.slice(40),
    },
    methods: {
      patterns,
      bestPractices: Array.from({ length: 80 }, (_, i) => `practice${i + 1}`),
      workflows: Array.from({ length: 40 }, (_, i) => `workflow${i + 1}`),
    },
    knowledge: {
      specifications: specs.slice(0, 60),
      architecture: specs.slice(60),
    },
    goals: {
      current: goals.slice(0, 25),
      objectives: goals.slice(25),
    },
  };
}

describe('Performance Benchmarks', () => {
  describe('Small Project (Typical Simple Config)', () => {
    it('should resolve single scope config in < 10ms', () => {
      const config = generateSmallConfig(ScopeLevel.Project);

      const stats = benchmark(() => {
        resolveConfig([config]);
      }, 100);

      console.log('Small project (single scope):', stats);

      // Assert performance targets
      expect(stats.p95).toBeLessThan(10); // 95th percentile under 10ms
      expect(stats.mean).toBeLessThan(5);  // Mean under 5ms
    });

    it('should resolve four scope configs in < 50ms', () => {
      const configs = [
        generateSmallConfig(ScopeLevel.System),
        generateSmallConfig(ScopeLevel.User),
        generateSmallConfig(ScopeLevel.Project),
        generateSmallConfig(ScopeLevel.Task),
      ];

      const stats = benchmark(() => {
        resolveConfig(configs);
      }, 100);

      console.log('Small project (four scopes):', stats);

      expect(stats.p95).toBeLessThan(50);  // 95th percentile under 50ms
      expect(stats.mean).toBeLessThan(25); // Mean under 25ms
    });

    it('should resolve with resolveForTask in < 50ms', () => {
      const systemConfig = generateSmallConfig(ScopeLevel.System);
      const userConfig = generateSmallConfig(ScopeLevel.User);
      const projectConfig = generateSmallConfig(ScopeLevel.Project);
      const taskConfig = generateSmallConfig(ScopeLevel.Task);

      const stats = benchmark(() => {
        resolveForTask(taskConfig, projectConfig, userConfig, systemConfig, 'test-task');
      }, 100);

      console.log('Small project (resolveForTask):', stats);

      expect(stats.p95).toBeLessThan(50);  // 95th percentile under 50ms
      expect(stats.mean).toBeLessThan(25); // Mean under 25ms
    });
  });

  describe('Medium Project (Typical Real-World Config)', () => {
    it('should resolve single scope config in < 25ms', () => {
      const config = generateMediumConfig(ScopeLevel.Project);

      const stats = benchmark(() => {
        resolveConfig([config]);
      }, 100);

      console.log('Medium project (single scope):', stats);

      expect(stats.p95).toBeLessThan(25);  // 95th percentile under 25ms
      expect(stats.mean).toBeLessThan(15); // Mean under 15ms
    });

    it('should resolve four scope configs in < 100ms (TARGET)', () => {
      const configs = [
        generateMediumConfig(ScopeLevel.System),
        generateMediumConfig(ScopeLevel.User),
        generateMediumConfig(ScopeLevel.Project),
        generateMediumConfig(ScopeLevel.Task),
      ];

      const stats = benchmark(() => {
        resolveConfig(configs);
      }, 100);

      console.log('Medium project (four scopes) - PRIMARY TARGET:', stats);

      // This is the key target from the spec
      expect(stats.p95).toBeLessThan(100); // 95th percentile under 100ms
      expect(stats.mean).toBeLessThan(75);  // Mean under 75ms
    });

    it('should resolve with resolveForTask in < 100ms', () => {
      const systemConfig = generateMediumConfig(ScopeLevel.System);
      const userConfig = generateMediumConfig(ScopeLevel.User);
      const projectConfig = generateMediumConfig(ScopeLevel.Project);
      const taskConfig = generateMediumConfig(ScopeLevel.Task);

      const stats = benchmark(() => {
        resolveForTask(taskConfig, projectConfig, userConfig, systemConfig, 'test-task');
      }, 100);

      console.log('Medium project (resolveForTask) - PRIMARY TARGET:', stats);

      expect(stats.p95).toBeLessThan(100); // 95th percentile under 100ms
      expect(stats.mean).toBeLessThan(75);  // Mean under 75ms
    });
  });

  describe('Large Project (Extensive Config)', () => {
    it('should resolve single scope config in < 50ms', () => {
      const config = generateLargeConfig(ScopeLevel.Project);

      const stats = benchmark(() => {
        resolveConfig([config]);
      }, 100);

      console.log('Large project (single scope):', stats);

      expect(stats.p95).toBeLessThan(50);  // 95th percentile under 50ms
      expect(stats.mean).toBeLessThan(30); // Mean under 30ms
    });

    it('should resolve four scope configs in < 200ms', () => {
      const configs = [
        generateLargeConfig(ScopeLevel.System),
        generateLargeConfig(ScopeLevel.User),
        generateLargeConfig(ScopeLevel.Project),
        generateLargeConfig(ScopeLevel.Task),
      ];

      const stats = benchmark(() => {
        resolveConfig(configs);
      }, 100);

      console.log('Large project (four scopes):', stats);

      // Relaxed target for very large configs
      expect(stats.p95).toBeLessThan(200);  // 95th percentile under 200ms
      expect(stats.mean).toBeLessThan(150); // Mean under 150ms
    });

    it('should resolve with resolveForTask in < 200ms', () => {
      const systemConfig = generateLargeConfig(ScopeLevel.System);
      const userConfig = generateLargeConfig(ScopeLevel.User);
      const projectConfig = generateLargeConfig(ScopeLevel.Project);
      const taskConfig = generateLargeConfig(ScopeLevel.Task);

      const stats = benchmark(() => {
        resolveForTask(taskConfig, projectConfig, userConfig, systemConfig, 'test-task');
      }, 100);

      console.log('Large project (resolveForTask):', stats);

      expect(stats.p95).toBeLessThan(200);  // 95th percentile under 200ms
      expect(stats.mean).toBeLessThan(150); // Mean under 150ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty configs efficiently', () => {
      const stats = benchmark(() => {
        resolveConfig([]);
      }, 1000);

      console.log('Empty config:', stats);

      expect(stats.p95).toBeLessThan(1);   // Should be sub-millisecond
      expect(stats.mean).toBeLessThan(0.5);
    });

    it('should handle minimal config efficiently', () => {
      const config: ScopeConfig = {
        scope: ScopeLevel.Project,
        basePath: '/project',
        rules: { security: ['rule1'] },
      };

      const stats = benchmark(() => {
        resolveConfig([config]);
      }, 1000);

      console.log('Minimal config:', stats);

      expect(stats.p95).toBeLessThan(2);
      expect(stats.mean).toBeLessThan(1);
    });

    it('should handle many empty layers efficiently', () => {
      const configs = Array.from({ length: 10 }, (_, i) => ({
        scope: ScopeLevel.Project,
        basePath: `/project${i}`,
        rules: {},
        tools: {},
        methods: {},
        knowledge: {},
        goals: {},
      }));

      const stats = benchmark(() => {
        resolveConfig(configs);
      }, 100);

      console.log('Many empty layers:', stats);

      expect(stats.p95).toBeLessThan(10);
      expect(stats.mean).toBeLessThan(5);
    });
  });

  describe('Scaling Tests', () => {
    it('should scale linearly with config size', () => {
      const smallConfig = generateSmallConfig(ScopeLevel.Project);
      const mediumConfig = generateMediumConfig(ScopeLevel.Project);
      const largeConfig = generateLargeConfig(ScopeLevel.Project);

      const smallStats = benchmark(() => resolveConfig([smallConfig]), 100);
      const mediumStats = benchmark(() => resolveConfig([mediumConfig]), 100);
      const largeStats = benchmark(() => resolveConfig([largeConfig]), 100);

      console.log('Scaling test:');
      console.log('  Small:', smallStats.mean, 'ms');
      console.log('  Medium:', mediumStats.mean, 'ms');
      console.log('  Large:', largeStats.mean, 'ms');

      // Verify reasonable scaling (large should not be >20x slower than small)
      const scaleFactor = largeStats.mean / smallStats.mean;
      expect(scaleFactor).toBeLessThan(20);
    });

    it('should scale linearly with number of scopes', () => {
      const oneScope = [generateMediumConfig(ScopeLevel.Project)];
      const twoScopes = [
        generateMediumConfig(ScopeLevel.User),
        generateMediumConfig(ScopeLevel.Project),
      ];
      const fourScopes = [
        generateMediumConfig(ScopeLevel.System),
        generateMediumConfig(ScopeLevel.User),
        generateMediumConfig(ScopeLevel.Project),
        generateMediumConfig(ScopeLevel.Task),
      ];

      const oneStats = benchmark(() => resolveConfig(oneScope), 100);
      const twoStats = benchmark(() => resolveConfig(twoScopes), 100);
      const fourStats = benchmark(() => resolveConfig(fourScopes), 100);

      console.log('Scope scaling test:');
      console.log('  One scope:', oneStats.mean, 'ms');
      console.log('  Two scopes:', twoStats.mean, 'ms');
      console.log('  Four scopes:', fourStats.mean, 'ms');

      // Verify linear scaling (4 scopes should be roughly 4x slower than 1 scope)
      const scaleFactor = fourStats.mean / oneStats.mean;
      expect(scaleFactor).toBeLessThan(8); // Allow 2x overhead factor
      expect(scaleFactor).toBeGreaterThan(2); // Should scale at least somewhat
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated resolution', () => {
      const configs = [
        generateMediumConfig(ScopeLevel.System),
        generateMediumConfig(ScopeLevel.User),
        generateMediumConfig(ScopeLevel.Project),
        generateMediumConfig(ScopeLevel.Task),
      ];

      const memBefore = process.memoryUsage().heapUsed;

      // Run many iterations
      for (let i = 0; i < 1000; i++) {
        resolveConfig(configs);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memDelta = memAfter - memBefore;
      const memDeltaMB = memDelta / 1024 / 1024;

      console.log('Memory delta after 1000 iterations:', memDeltaMB.toFixed(2), 'MB');

      // Should not grow heap by more than 50MB after 1000 iterations
      expect(memDeltaMB).toBeLessThan(50);
    });
  });
});

describe('Performance Summary', () => {
  it('should print performance summary', () => {
    const configs = [
      generateMediumConfig(ScopeLevel.System),
      generateMediumConfig(ScopeLevel.User),
      generateMediumConfig(ScopeLevel.Project),
      generateMediumConfig(ScopeLevel.Task),
    ];

    const stats = benchmark(() => {
      resolveConfig(configs);
    }, 100);

    console.log('\n=== Performance Summary ===');
    console.log('Target: Resolution under 100ms for typical projects');
    console.log('Test: Medium project with 4 scopes (100 iterations)');
    console.log('Results:');
    console.log(`  Mean:   ${stats.mean.toFixed(2)} ms`);
    console.log(`  P50:    ${stats.p50.toFixed(2)} ms`);
    console.log(`  P95:    ${stats.p95.toFixed(2)} ms`);
    console.log(`  P99:    ${stats.p99.toFixed(2)} ms`);
    console.log(`  Min:    ${stats.min.toFixed(2)} ms`);
    console.log(`  Max:    ${stats.max.toFixed(2)} ms`);

    if (stats.p95 < 100) {
      console.log('✅ PASSED: P95 latency under 100ms target');
    } else {
      console.log('❌ FAILED: P95 latency exceeds 100ms target');
    }

    expect(stats.p95).toBeLessThan(100);
  });
});
