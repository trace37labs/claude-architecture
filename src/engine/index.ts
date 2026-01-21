/**
 * Precedence Engine
 *
 * Core engine for resolving configuration with proper precedence.
 */

export {
  mergeRules,
  mergeTools,
  mergeMethods,
  mergeKnowledge,
  mergeGoals,
} from './merger.js';

export {
  SCOPE_PRECEDENCE,
  getScopePrecedence,
  compareScopePrecedence,
  sortByPrecedence,
  filterByMinimumScope,
  getHighestPrecedenceScope,
  isHigherPrecedence,
  getScopeResolutionPath,
} from './precedence.js';

export {
  resolveConfig,
  createConfigContext,
  resolveForTask,
  extractLayer,
  hasLayerContent,
  getScopeSummary,
} from './resolver.js';
