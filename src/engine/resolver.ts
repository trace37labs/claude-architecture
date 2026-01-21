/**
 * Config Resolver - resolves final configuration
 */

import { ScopeConfig, MergedConfig, ConfigContext, MergeMetadata } from '../types/config.js';
import { LayerType } from '../types/layers.js';
import { ScopeLevel } from '../types/scope.js';
import { mergeRules, mergeTools, mergeMethods, mergeKnowledge, mergeGoals } from './merger.js';
import { sortByPrecedence, SCOPE_PRECEDENCE } from './precedence.js';

export function resolveConfig(configs: ScopeConfig[]): MergedConfig {
  const sorted = sortByPrecedence(configs).reverse();
  const scopes = sorted.map(c => c.scope);

  const rules = mergeRules(sorted.map(c => c.rules || {}));
  const tools = mergeTools(sorted.map(c => c.tools || {}));
  const methods = mergeMethods(sorted.map(c => c.methods || {}), scopes);
  const knowledge = mergeKnowledge(sorted.map(c => c.knowledge || {}));
  const goals = mergeGoals(sorted.map(c => c.goals || {}), scopes);

  const metadata: MergeMetadata = {
    mergedAt: new Date(),
    scopesIncluded: scopes.reverse(),
    layerSources: {
      [LayerType.Rules]: sorted.filter(c => c.rules).map(c => c.basePath),
      [LayerType.Tools]: sorted.filter(c => c.tools).map(c => c.basePath),
      [LayerType.Methods]: sorted.filter(c => c.methods).map(c => c.basePath),
      [LayerType.Knowledge]: sorted.filter(c => c.knowledge).map(c => c.basePath),
      [LayerType.Goals]: sorted.filter(c => c.goals).map(c => c.basePath),
    },
  };

  return { rules, tools, methods, knowledge, goals, metadata };
}

export function createConfigContext(configs: ScopeConfig[], taskId?: string): ConfigContext {
  const config = resolveConfig(configs);
  const scopes: ConfigContext['scopes'] = {};
  for (const c of configs) {
    scopes[c.scope] = c;
  }
  return { config, scopes, createdAt: new Date(), taskId };
}

export function resolveForTask(
  taskConfig?: ScopeConfig,
  projectConfig?: ScopeConfig,
  userConfig?: ScopeConfig,
  systemConfig?: ScopeConfig,
  taskId?: string
): ConfigContext {
  const configs: ScopeConfig[] = [];
  if (systemConfig) configs.push(systemConfig);
  if (userConfig) configs.push(userConfig);
  if (projectConfig) configs.push(projectConfig);
  if (taskConfig) configs.push(taskConfig);
  return createConfigContext(configs, taskId);
}

export function extractLayer(config: MergedConfig, layer: LayerType): any {
  return config[layer];
}

export function hasLayerContent(config: MergedConfig, layer: LayerType): boolean {
  const content = config[layer];
  if (!content) return false;
  return Object.values(content).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
    return v !== undefined && v !== null && v !== '';
  });
}

export function getScopeSummary(context: ConfigContext): Array<{
  layer: LayerType;
  scopes: ScopeLevel[];
  sources: string[];
}> {
  const summary: Array<{layer: LayerType; scopes: ScopeLevel[]; sources: string[]}> = [];

  for (const layer of Object.values(LayerType)) {
    const sources = context.config.metadata.layerSources[layer];
    const scopes: ScopeLevel[] = [];
    
    for (const scope of SCOPE_PRECEDENCE) {
      const cfg = context.scopes[scope];
      if (cfg && cfg[layer]) scopes.push(scope);
    }

    summary.push({ layer, scopes, sources });
  }

  return summary;
}
