/**
 * Tree View Formatter
 *
 * Pretty-prints configuration as a tree structure showing
 * the merged values and their sources.
 */

import { MergedConfig, ScopeConfig } from '../types/config.js';
import { LayerType } from '../types/layers.js';
import { ScopeLevel } from '../types/scope.js';

export interface TreeViewOptions {
  /** Show full details for each value */
  verbose?: boolean;
  /** Maximum depth to display (0 = unlimited) */
  maxDepth?: number;
  /** Show empty layers */
  showEmpty?: boolean;
  /** Use color output */
  color?: boolean;
  /** Show specific layer only */
  layer?: LayerType;
}

interface TreeNode {
  label: string;
  value?: any;
  children?: TreeNode[];
  metadata?: {
    source?: string;
    scope?: ScopeLevel;
  };
}

/**
 * Format merged config as a tree structure
 */
export function formatTreeView(
  config: MergedConfig,
  scopes: Record<string, ScopeConfig>,
  options: TreeViewOptions = {}
): string {
  const lines: string[] = [];
  const showEmpty = options.showEmpty ?? false;
  const color = options.color ?? true;

  // Header
  lines.push(formatHeader('Configuration Tree', color));
  lines.push('');

  // Metadata section
  lines.push(formatSection('Metadata', color));
  lines.push(indent(`Merged at: ${config.metadata.mergedAt.toISOString()}`));
  lines.push(indent(`Scopes: ${config.metadata.scopesIncluded.join(' → ')}`));
  lines.push('');

  // Each layer - filter to specific layer if requested
  const allLayers = [
    { type: LayerType.Rules, name: 'RULES', icon: '🔒' },
    { type: LayerType.Tools, name: 'TOOLS', icon: '🔧' },
    { type: LayerType.Methods, name: 'METHODS', icon: '📋' },
    { type: LayerType.Knowledge, name: 'KNOWLEDGE', icon: '📚' },
    { type: LayerType.Goals, name: 'GOALS', icon: '🎯' },
  ];

  const layers = options.layer
    ? allLayers.filter(l => l.type === options.layer)
    : allLayers;

  for (const layer of layers) {
    const content = config[layer.type];
    const hasContent = hasLayerContent(content);

    if (!hasContent && !showEmpty) {
      continue;
    }

    lines.push(formatSection(`${layer.icon} Layer ${layer.name}`, color));

    if (!hasContent) {
      lines.push(indent('(empty)', 2));
    } else {
      const sources = config.metadata.layerSources[layer.type];
      if (sources.length > 0) {
        lines.push(indent(`Sources: ${sources.join(', ')}`, 2));
      }

      const tree = buildLayerTree(content, layer.type, scopes);
      lines.push(...formatTree(tree, 2, options));
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build a tree structure for a layer
 */
function buildLayerTree(
  content: any,
  layerType: LayerType,
  scopes: Record<string, ScopeConfig>
): TreeNode {
  const root: TreeNode = {
    label: layerType,
    children: [],
  };

  if (!content || typeof content !== 'object') {
    return root;
  }

  for (const [key, value] of Object.entries(content)) {
    if (value === undefined || value === null) {
      continue;
    }

    const node: TreeNode = {
      label: key,
      value: formatValue(value),
      metadata: findSourceScope(key, value, layerType, scopes),
    };

    if (typeof value === 'object' && !Array.isArray(value)) {
      node.children = Object.entries(value).map(([k, v]) => ({
        label: k,
        value: formatValue(v),
      }));
    }

    root.children!.push(node);
  }

  return root;
}

/**
 * Format a tree node and its children
 */
function formatTree(
  node: TreeNode,
  depth: number,
  options: TreeViewOptions
): string[] {
  const lines: string[] = [];
  const maxDepth = options.maxDepth ?? 0;
  const verbose = options.verbose ?? false;
  const color = options.color ?? true;

  if (maxDepth > 0 && depth > maxDepth) {
    return lines;
  }

  if (!node.children || node.children.length === 0) {
    return lines;
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const isLast = i === node.children.length - 1;
    const prefix = isLast ? '└─ ' : '├─ ';
    const childPrefix = isLast ? '   ' : '│  ';

    let line = indent(prefix + child.label, depth);

    if (child.value !== undefined) {
      line += `: ${formatDisplayValue(child.value, color)}`;
    }

    if (verbose && child.metadata?.scope) {
      line += ` ${formatScope(child.metadata.scope, color)}`;
    }

    lines.push(line);

    // Recursively format children
    if (child.children && child.children.length > 0) {
      const childTree = formatTree(
        child,
        depth + childPrefix.length,
        options
      );
      lines.push(...childTree.map(l => indent(childPrefix, depth) + l.slice(depth)));
    }
  }

  return lines;
}

/**
 * Format a value for display
 */
function formatValue(value: any): any {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length;
  }
  return value;
}

/**
 * Format value for colorized display
 */
function formatDisplayValue(value: any, useColor: boolean): string {
  if (Array.isArray(value)) {
    const preview = value.length > 3
      ? `[${value.slice(0, 3).join(', ')}, ...]`
      : `[${value.join(', ')}]`;
    return useColor ? `\x1b[36m${preview}\x1b[0m` : preview;
  }
  if (typeof value === 'number') {
    const str = `${value} items`;
    return useColor ? `\x1b[33m${str}\x1b[0m` : str;
  }
  if (typeof value === 'boolean') {
    const str = value.toString();
    return useColor ? `\x1b[32m${str}\x1b[0m` : str;
  }
  if (typeof value === 'string') {
    return useColor ? `\x1b[37m"${value}"\x1b[0m` : `"${value}"`;
  }
  return String(value);
}

/**
 * Format scope label with color
 */
function formatScope(scope: ScopeLevel, useColor: boolean): string {
  const colors = {
    [ScopeLevel.Task]: '\x1b[35m',      // Magenta
    [ScopeLevel.Project]: '\x1b[34m',   // Blue
    [ScopeLevel.User]: '\x1b[32m',      // Green
    [ScopeLevel.System]: '\x1b[90m',    // Gray
  };
  const reset = '\x1b[0m';
  const label = `(${scope})`;
  return useColor ? `${colors[scope]}${label}${reset}` : label;
}

/**
 * Find which scope provided a specific value
 */
function findSourceScope(
  _key: string,
  _value: any,
  layerType: LayerType,
  scopes: Record<string, ScopeConfig>
): { source?: string; scope?: ScopeLevel } | undefined {
  // Check scopes in reverse precedence order (highest to lowest)
  const scopeOrder: ScopeLevel[] = [
    ScopeLevel.Task,
    ScopeLevel.Project,
    ScopeLevel.User,
    ScopeLevel.System,
  ];

  for (const scopeLevel of scopeOrder) {
    const scope = scopes[scopeLevel];
    if (scope && scope[layerType]) {
      return {
        scope: scopeLevel,
        source: scope.basePath,
      };
    }
  }

  return undefined;
}

/**
 * Check if a layer has content
 */
function hasLayerContent(content: any): boolean {
  if (!content || typeof content !== 'object') {
    return false;
  }
  // Check for rawContent first (unparsed markdown)
  if (content.rawContent && typeof content.rawContent === 'string' && content.rawContent.trim().length > 0) {
    return true;
  }
  // Check for structured content
  return Object.values(content).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
    return v !== undefined && v !== null && v !== '';
  });
}

/**
 * Format a section header
 */
function formatHeader(text: string, useColor: boolean): string {
  const border = '='.repeat(text.length + 4);
  if (useColor) {
    return `\x1b[1m${border}\n  ${text}\n${border}\x1b[0m`;
  }
  return `${border}\n  ${text}\n${border}`;
}

/**
 * Format a section title
 */
function formatSection(text: string, useColor: boolean): string {
  if (useColor) {
    return `\x1b[1m${text}\x1b[0m`;
  }
  return text;
}

/**
 * Indent a string by a number of spaces
 */
function indent(text: string, spaces: number = 2): string {
  return ' '.repeat(spaces) + text;
}
