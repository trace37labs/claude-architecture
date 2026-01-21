/**
 * Layer Loader
 *
 * Loads and parses layer content from .claude/ directories.
 * Combines scanner (discovery) and reader (file I/O) to construct typed layer objects.
 */

import { LayerType, type LayerContent } from './types/layers.js';
import { ScopeLevel, type ScopeMetadata } from './types/scope.js';
import type { ScopeConfig, LayerWithScope } from './types/config.js';
import {
  scanForClaudeDirectories,
  discoverLayers,
} from './scanner.js';
import {
  combineMarkdownFiles,
} from './reader.js';

/**
 * Options for loading layers
 */
export interface LoadOptions {
  /** Working directory to start from */
  cwd?: string;
  /** Whether to include raw markdown content */
  includeRawContent?: boolean;
  /** Whether to parse structured content from markdown */
  parseMarkdown?: boolean;
}

/**
 * Load a single layer from a directory
 *
 * @param layerPath - Path to the layer directory
 * @param layerType - Type of layer to load
 * @param options - Load options
 * @returns Layer content object
 */
export function loadLayer(
  layerPath: string,
  _layerType: LayerType,
  options: LoadOptions = {}
): LayerContent {
  const includeRawContent = options.includeRawContent ?? true;
  const parseMarkdown = options.parseMarkdown ?? false;

  // Combine markdown content
  const rawContent = includeRawContent
    ? combineMarkdownFiles(layerPath)
    : undefined;

  // For now, return a basic layer with raw content
  // Later, we'll add markdown parsing to extract structured data
  const baseLayer: LayerContent = {
    rawContent,
  };

  // If parsing is enabled, we would extract structured content here
  // This will be implemented in Phase 1, Task 4 (Markdown Parser)
  if (parseMarkdown) {
    // TODO: Parse markdown to extract structured content
    // This would use the legacy parser we'll build next
  }

  return baseLayer;
}

/**
 * Load all layers from a .claude/ directory
 *
 * @param claudeDir - Path to .claude/ directory
 * @param scope - Scope level this directory belongs to
 * @param options - Load options
 * @returns Scope configuration with all layers
 */
export function loadScopeConfig(
  claudeDir: string,
  scope: ScopeLevel,
  options: LoadOptions = {}
): ScopeConfig {
  const layers = discoverLayers(claudeDir);

  const config: ScopeConfig = {
    scope,
    basePath: claudeDir,
  };

  // Load each layer if it exists
  if (layers.rules) {
    config.rules = loadLayer(layers.rules, LayerType.Rules, options);
  }

  if (layers.tools) {
    config.tools = loadLayer(layers.tools, LayerType.Tools, options);
  }

  if (layers.methods) {
    config.methods = loadLayer(layers.methods, LayerType.Methods, options);
  }

  if (layers.knowledge) {
    config.knowledge = loadLayer(layers.knowledge, LayerType.Knowledge, options);
  }

  if (layers.goals) {
    config.goals = loadLayer(layers.goals, LayerType.Goals, options);
  }

  return config;
}

/**
 * Load configurations from all discovered scopes
 *
 * @param options - Load options
 * @returns Map of scope levels to their configurations
 */
export function loadAllScopes(
  options: LoadOptions = {}
): Map<ScopeLevel, ScopeConfig> {
  const cwd = options.cwd || process.cwd();
  const scanResult = scanForClaudeDirectories({ cwd, includeNonExistent: false });

  const configs = new Map<ScopeLevel, ScopeConfig>();

  for (const dir of scanResult.directories) {
    if (!dir.exists || dir.scope === ScopeLevel.System) {
      continue;
    }

    const config = loadScopeConfig(dir.path, dir.scope, options);
    configs.set(dir.scope, config);
  }

  return configs;
}

/**
 * Load a specific layer across all scopes
 *
 * @param layerType - The layer to load
 * @param options - Load options
 * @returns Array of layers with scope metadata
 */
export function loadLayerAcrossScopes(
  layerType: LayerType,
  options: LoadOptions = {}
): LayerWithScope<LayerContent>[] {
  const configs = loadAllScopes(options);
  const layers: LayerWithScope<LayerContent>[] = [];

  for (const [scopeLevel, config] of configs) {
    const layerContent = getLayerFromConfig(config, layerType);
    if (layerContent) {
      const scope: ScopeMetadata = {
        level: scopeLevel,
        sourcePath: config.basePath,
        loadedAt: new Date(),
      };

      layers.push({
        layer: layerType,
        content: layerContent,
        scope,
      });
    }
  }

  // Sort by scope precedence (Task > Project > User > System)
  const scopeOrder = [
    ScopeLevel.Task,
    ScopeLevel.Project,
    ScopeLevel.User,
    ScopeLevel.System,
  ];
  layers.sort((a, b) => {
    return scopeOrder.indexOf(a.scope.level) - scopeOrder.indexOf(b.scope.level);
  });

  return layers;
}

/**
 * Get a specific layer from a scope config
 */
function getLayerFromConfig(
  config: ScopeConfig,
  layerType: LayerType
): LayerContent | null {
  switch (layerType) {
    case LayerType.Rules:
      return config.rules || null;
    case LayerType.Tools:
      return config.tools || null;
    case LayerType.Methods:
      return config.methods || null;
    case LayerType.Knowledge:
      return config.knowledge || null;
    case LayerType.Goals:
      return config.goals || null;
  }
}

/**
 * Load a specific scope configuration by scope level
 *
 * @param scope - The scope level to load
 * @param options - Load options
 * @returns Scope configuration, or null if not found
 */
export function loadScope(
  scope: ScopeLevel,
  options: LoadOptions = {}
): ScopeConfig | null {
  const cwd = options.cwd || process.cwd();
  const scanResult = scanForClaudeDirectories({ cwd, includeNonExistent: false });

  const dir = scanResult.directories.find((d) => d.scope === scope && d.exists);
  if (!dir) {
    return null;
  }

  return loadScopeConfig(dir.path, scope, options);
}

/**
 * Check if a scope has configuration available
 *
 * @param scope - Scope level to check
 * @param options - Load options
 * @returns True if scope has a .claude/ directory
 */
export function hasScopeConfig(
  scope: ScopeLevel,
  options: LoadOptions = {}
): boolean {
  const cwd = options.cwd || process.cwd();
  const scanResult = scanForClaudeDirectories({ cwd, includeNonExistent: false });

  return scanResult.directories.some((d) => d.scope === scope && d.exists);
}

/**
 * Get metadata about loaded configuration
 */
export interface LoadMetadata {
  /** Scopes that were found and loaded */
  loadedScopes: ScopeLevel[];
  /** Scopes that were checked but not found */
  missingScopes: ScopeLevel[];
  /** Total number of layers loaded */
  totalLayers: number;
  /** Layers by scope */
  layersByScope: Map<ScopeLevel, LayerType[]>;
  /** When the load operation completed */
  loadedAt: Date;
}

/**
 * Load all configurations and return with detailed metadata
 *
 * @param options - Load options
 * @returns Scope configurations and load metadata
 */
export function loadWithMetadata(options: LoadOptions = {}): {
  configs: Map<ScopeLevel, ScopeConfig>;
  metadata: LoadMetadata;
} {
  const configs = loadAllScopes(options);

  const allScopes = [
    ScopeLevel.Task,
    ScopeLevel.Project,
    ScopeLevel.User,
    ScopeLevel.System,
  ];

  const loadedScopes = Array.from(configs.keys());
  const missingScopes = allScopes.filter((s) => !loadedScopes.includes(s));

  const layersByScope = new Map<ScopeLevel, LayerType[]>();
  let totalLayers = 0;

  for (const [scope, config] of configs) {
    const layers: LayerType[] = [];
    if (config.rules) layers.push(LayerType.Rules);
    if (config.tools) layers.push(LayerType.Tools);
    if (config.methods) layers.push(LayerType.Methods);
    if (config.knowledge) layers.push(LayerType.Knowledge);
    if (config.goals) layers.push(LayerType.Goals);

    layersByScope.set(scope, layers);
    totalLayers += layers.length;
  }

  return {
    configs,
    metadata: {
      loadedScopes,
      missingScopes,
      totalLayers,
      layersByScope,
      loadedAt: new Date(),
    },
  };
}

/**
 * Preload all configurations for faster subsequent access
 * Useful for CLI tools that will make multiple queries
 *
 * @param options - Load options
 * @returns Cached configuration data
 */
export function preloadConfigurations(options: LoadOptions = {}): {
  configs: Map<ScopeLevel, ScopeConfig>;
  metadata: LoadMetadata;
} {
  return loadWithMetadata({
    ...options,
    includeRawContent: true,
    parseMarkdown: false, // Will enable after we implement the parser
  });
}
