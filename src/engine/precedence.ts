/**
 * Precedence Rules - manages scope hierarchy
 */

import { ScopeLevel } from '../types/scope.js';
import { ScopeConfig } from '../types/config.js';

export const SCOPE_PRECEDENCE: ScopeLevel[] = [
  ScopeLevel.Task,
  ScopeLevel.Project,
  ScopeLevel.User,
  ScopeLevel.System,
];

export function getScopePrecedence(scope: ScopeLevel): number {
  const idx = SCOPE_PRECEDENCE.indexOf(scope);
  if (idx === -1) throw new Error(`Unknown scope: ${scope}`);
  return SCOPE_PRECEDENCE.length - idx;
}

export function compareScopePrecedence(a: ScopeLevel, b: ScopeLevel): number {
  const precA = getScopePrecedence(a);
  const precB = getScopePrecedence(b);
  if (precA < precB) return -1;
  if (precA > precB) return 1;
  return 0;
}

export function sortByPrecedence(configs: ScopeConfig[]): ScopeConfig[] {
  return [...configs].sort((a, b) => compareScopePrecedence(b.scope, a.scope));
}

export function filterByMinimumScope(configs: ScopeConfig[], minScope: ScopeLevel): ScopeConfig[] {
  const minPrec = getScopePrecedence(minScope);
  return configs.filter(c => getScopePrecedence(c.scope) >= minPrec);
}

export function getHighestPrecedenceScope(configs: ScopeConfig[]): ScopeLevel | null {
  if (!configs.length) return null;
  return sortByPrecedence(configs)[0].scope;
}

export function isHigherPrecedence(a: ScopeLevel, b: ScopeLevel): boolean {
  return compareScopePrecedence(a, b) > 0;
}

export function getScopeResolutionPath(configs: ScopeConfig[]): {
  checked: ScopeLevel[];
  available: ScopeLevel[];
  missing: ScopeLevel[];
} {
  const availSet = new Set(configs.map(c => c.scope));
  const checked: ScopeLevel[] = [];
  const available: ScopeLevel[] = [];
  const missing: ScopeLevel[] = [];

  for (const scope of SCOPE_PRECEDENCE) {
    checked.push(scope);
    if (availSet.has(scope)) {
      available.push(scope);
    } else {
      missing.push(scope);
    }
  }

  return { checked, available, missing };
}
