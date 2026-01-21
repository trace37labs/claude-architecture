/**
 * Tests for precedence.ts
 */

import { describe, it, expect } from 'vitest';
import {
  SCOPE_PRECEDENCE,
  getScopePrecedence,
  compareScopePrecedence,
  sortByPrecedence,
  filterByMinimumScope,
  getHighestPrecedenceScope,
  isHigherPrecedence,
  getScopeResolutionPath,
} from '../../../src/engine/precedence.js';
import { ScopeLevel } from '../../../src/types/scope.js';
import { ScopeConfig } from '../../../src/types/config.js';

describe('SCOPE_PRECEDENCE', () => {
  it('should have Task as highest precedence', () => {
    expect(SCOPE_PRECEDENCE[0]).toBe(ScopeLevel.Task);
  });

  it('should have System as lowest precedence', () => {
    expect(SCOPE_PRECEDENCE[SCOPE_PRECEDENCE.length - 1]).toBe(ScopeLevel.System);
  });

  it('should have all four scope levels', () => {
    expect(SCOPE_PRECEDENCE).toHaveLength(4);
    expect(SCOPE_PRECEDENCE).toContain(ScopeLevel.Task);
    expect(SCOPE_PRECEDENCE).toContain(ScopeLevel.Project);
    expect(SCOPE_PRECEDENCE).toContain(ScopeLevel.User);
    expect(SCOPE_PRECEDENCE).toContain(ScopeLevel.System);
  });
});

describe('getScopePrecedence', () => {
  it('should return highest value for Task', () => {
    const taskPrec = getScopePrecedence(ScopeLevel.Task);
    const projectPrec = getScopePrecedence(ScopeLevel.Project);

    expect(taskPrec).toBeGreaterThan(projectPrec);
  });

  it('should return lowest value for System', () => {
    const systemPrec = getScopePrecedence(ScopeLevel.System);
    const userPrec = getScopePrecedence(ScopeLevel.User);

    expect(systemPrec).toBeLessThan(userPrec);
  });

  it('should return correct ordering', () => {
    const task = getScopePrecedence(ScopeLevel.Task);
    const project = getScopePrecedence(ScopeLevel.Project);
    const user = getScopePrecedence(ScopeLevel.User);
    const system = getScopePrecedence(ScopeLevel.System);

    expect(task).toBeGreaterThan(project);
    expect(project).toBeGreaterThan(user);
    expect(user).toBeGreaterThan(system);
  });

  it('should throw for invalid scope', () => {
    expect(() => getScopePrecedence('invalid' as ScopeLevel)).toThrow();
  });
});

describe('compareScopePrecedence', () => {
  it('should return 1 when first scope is higher', () => {
    const result = compareScopePrecedence(ScopeLevel.Task, ScopeLevel.System);
    expect(result).toBe(1);
  });

  it('should return -1 when first scope is lower', () => {
    const result = compareScopePrecedence(ScopeLevel.System, ScopeLevel.Task);
    expect(result).toBe(-1);
  });

  it('should return 0 when scopes are equal', () => {
    const result = compareScopePrecedence(ScopeLevel.Task, ScopeLevel.Task);
    expect(result).toBe(0);
  });

  it('should correctly compare Project and User', () => {
    const result = compareScopePrecedence(ScopeLevel.Project, ScopeLevel.User);
    expect(result).toBe(1);
  });
});

describe('sortByPrecedence', () => {
  it('should sort configs by precedence (highest first)', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.System, basePath: '/system' },
      { scope: ScopeLevel.Task, basePath: '/task' },
      { scope: ScopeLevel.User, basePath: '/user' },
      { scope: ScopeLevel.Project, basePath: '/project' },
    ];

    const sorted = sortByPrecedence(configs);

    expect(sorted[0].scope).toBe(ScopeLevel.Task);
    expect(sorted[1].scope).toBe(ScopeLevel.Project);
    expect(sorted[2].scope).toBe(ScopeLevel.User);
    expect(sorted[3].scope).toBe(ScopeLevel.System);
  });

  it('should handle empty array', () => {
    const sorted = sortByPrecedence([]);
    expect(sorted).toHaveLength(0);
  });

  it('should handle single config', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.Task, basePath: '/task' },
    ];

    const sorted = sortByPrecedence(configs);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].scope).toBe(ScopeLevel.Task);
  });
});

describe('filterByMinimumScope', () => {
  it('should filter configs at or above minimum scope', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.System, basePath: '/system' },
      { scope: ScopeLevel.User, basePath: '/user' },
      { scope: ScopeLevel.Project, basePath: '/project' },
      { scope: ScopeLevel.Task, basePath: '/task' },
    ];

    const filtered = filterByMinimumScope(configs, ScopeLevel.Project);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((c) => c.scope)).toContain(ScopeLevel.Task);
    expect(filtered.map((c) => c.scope)).toContain(ScopeLevel.Project);
  });

  it('should include the minimum scope itself', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.User, basePath: '/user' },
    ];

    const filtered = filterByMinimumScope(configs, ScopeLevel.User);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].scope).toBe(ScopeLevel.User);
  });

  it('should return empty for no matches', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.System, basePath: '/system' },
    ];

    const filtered = filterByMinimumScope(configs, ScopeLevel.Task);

    expect(filtered).toHaveLength(0);
  });
});

describe('getHighestPrecedenceScope', () => {
  it('should return highest precedence scope', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.System, basePath: '/system' },
      { scope: ScopeLevel.User, basePath: '/user' },
      { scope: ScopeLevel.Project, basePath: '/project' },
    ];

    const highest = getHighestPrecedenceScope(configs);

    expect(highest).toBe(ScopeLevel.Project);
  });

  it('should return null for empty array', () => {
    const highest = getHighestPrecedenceScope([]);
    expect(highest).toBeNull();
  });

  it('should work with single config', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.User, basePath: '/user' },
    ];

    const highest = getHighestPrecedenceScope(configs);

    expect(highest).toBe(ScopeLevel.User);
  });
});

describe('isHigherPrecedence', () => {
  it('should return true when first is higher', () => {
    expect(isHigherPrecedence(ScopeLevel.Task, ScopeLevel.System)).toBe(true);
  });

  it('should return false when first is lower', () => {
    expect(isHigherPrecedence(ScopeLevel.System, ScopeLevel.Task)).toBe(false);
  });

  it('should return false when equal', () => {
    expect(isHigherPrecedence(ScopeLevel.Task, ScopeLevel.Task)).toBe(false);
  });
});

describe('getScopeResolutionPath', () => {
  it('should list all scopes as checked', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.User, basePath: '/user' },
    ];

    const path = getScopeResolutionPath(configs);

    expect(path.checked).toHaveLength(4);
    expect(path.checked).toContain(ScopeLevel.Task);
    expect(path.checked).toContain(ScopeLevel.Project);
    expect(path.checked).toContain(ScopeLevel.User);
    expect(path.checked).toContain(ScopeLevel.System);
  });

  it('should identify available scopes', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.User, basePath: '/user' },
      { scope: ScopeLevel.Project, basePath: '/project' },
    ];

    const path = getScopeResolutionPath(configs);

    expect(path.available).toHaveLength(2);
    expect(path.available).toContain(ScopeLevel.User);
    expect(path.available).toContain(ScopeLevel.Project);
  });

  it('should identify missing scopes', () => {
    const configs: ScopeConfig[] = [
      { scope: ScopeLevel.User, basePath: '/user' },
    ];

    const path = getScopeResolutionPath(configs);

    expect(path.missing).toHaveLength(3);
    expect(path.missing).toContain(ScopeLevel.Task);
    expect(path.missing).toContain(ScopeLevel.Project);
    expect(path.missing).toContain(ScopeLevel.System);
  });

  it('should handle empty configs', () => {
    const path = getScopeResolutionPath([]);

    expect(path.checked).toHaveLength(4);
    expect(path.available).toHaveLength(0);
    expect(path.missing).toHaveLength(4);
  });
});
