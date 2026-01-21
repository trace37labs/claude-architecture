/**
 * Precedence View Formatter
 *
 * Shows the override chain for configuration values,
 * making it clear which scope wins for each layer.
 */

import { MergedConfig, ScopeConfig } from '../types/config.js';
import { LayerType } from '../types/layers.js';
import { ScopeLevel } from '../types/scope.js';

export interface PrecedenceViewOptions {
  /** Show all scopes even if empty */
  showEmpty?: boolean;
  /** Layer to focus on (if undefined, show all) */
  layer?: LayerType;
  /** Use color output */
  color?: boolean;
  /** Compact format (one line per layer) */
  compact?: boolean;
}

/**
 * Format config showing precedence chain
 */
export function formatPrecedenceView(
  config: MergedConfig,
  scopes: Record<string, ScopeConfig>,
  options: PrecedenceViewOptions = {}
): string {
  const lines: string[] = [];
  const color = options.color ?? true;
  const showEmpty = options.showEmpty ?? false;
  const compact = options.compact ?? false;

  // Header
  lines.push(formatHeader('Precedence Chain', color));
  lines.push('');
  lines.push('Shows which scope provides each layer (highest precedence wins)');
  lines.push('');

  // Scope legend
  lines.push(formatSection('Scope Precedence', color));
  lines.push(indent('1. Task      (highest priority)'));
  lines.push(indent('2. Project'));
  lines.push(indent('3. User'));
  lines.push(indent('4. System    (lowest priority)'));
  lines.push('');

  // Layer precedence
  const layers = options.layer
    ? [{ type: options.layer, name: options.layer.toUpperCase(), icon: undefined }]
    : [
        { type: LayerType.Rules, name: 'RULES', icon: '🔒' },
        { type: LayerType.Tools, name: 'TOOLS', icon: '🔧' },
        { type: LayerType.Methods, name: 'METHODS', icon: '📋' },
        { type: LayerType.Knowledge, name: 'KNOWLEDGE', icon: '📚' },
        { type: LayerType.Goals, name: 'GOALS', icon: '🎯' },
      ];

  for (const layer of layers) {
    const chain = buildPrecedenceChain(layer.type, scopes);
    const hasContent = chain.some(c => c.hasContent === true);

    if (!hasContent && !showEmpty) {
      continue;
    }

    if (compact) {
      lines.push(formatCompactChain(layer, chain, color));
    } else {
      lines.push(formatDetailedChain(layer, chain, color, config));
    }
  }

  return lines.join('\n');
}

interface ChainLink {
  scope: ScopeLevel;
  path: string;
  hasContent: boolean;
  itemCount: number;
}

/**
 * Build precedence chain for a layer
 */
function buildPrecedenceChain(
  layerType: LayerType,
  scopes: Record<string, ScopeConfig>
): ChainLink[] {
  const chain: ChainLink[] = [];
  const scopeOrder: ScopeLevel[] = [
    ScopeLevel.Task,
    ScopeLevel.Project,
    ScopeLevel.User,
    ScopeLevel.System,
  ];

  for (const scopeLevel of scopeOrder) {
    const scope = scopes[scopeLevel];
    if (!scope) {
      continue;
    }

    const content = scope[layerType];
    const hasContent = !!(content && hasLayerContent(content));
    const itemCount = hasContent ? countItems(content) : 0;

    chain.push({
      scope: scopeLevel,
      path: scope.basePath,
      hasContent,
      itemCount,
    });
  }

  return chain;
}

/**
 * Format chain in compact mode (one line)
 */
function formatCompactChain(
  layer: { type: LayerType; name: string; icon?: string },
  chain: ChainLink[],
  useColor: boolean
): string {
  const icon = layer.icon ? `${layer.icon} ` : '';
  const name = formatLayerName(layer.name, useColor);
  const links = chain
    .map(link => formatCompactLink(link, useColor))
    .join(' → ');
  return `${icon}${name}: ${links}`;
}

/**
 * Format a single link in compact mode
 */
function formatCompactLink(link: ChainLink, useColor: boolean): string {
  const scopeName = link.scope.padEnd(7);
  if (!link.hasContent) {
    return useColor ? `\x1b[90m${scopeName}(empty)\x1b[0m` : `${scopeName}(empty)`;
  }
  const winner = isWinningScope(link);
  const count = `(${link.itemCount})`;
  if (useColor) {
    const color = winner ? '\x1b[32m' : '\x1b[37m';
    const marker = winner ? '✓ ' : '';
    return `${color}${marker}${scopeName}${count}\x1b[0m`;
  }
  const marker = winner ? '* ' : '';
  return `${marker}${scopeName}${count}`;
}

/**
 * Format chain in detailed mode (multiple lines)
 */
function formatDetailedChain(
  layer: { type: LayerType; name: string; icon?: string },
  chain: ChainLink[],
  useColor: boolean,
  config: MergedConfig
): string {
  const lines: string[] = [];
  const icon = layer.icon ? `${layer.icon} ` : '';
  const name = formatLayerName(layer.name, useColor);

  lines.push(formatSection(`${icon}Layer: ${name}`, useColor));

  const mergeStrategy = getMergeStrategy(layer.type);
  lines.push(indent(`Strategy: ${mergeStrategy}`));

  const sources = config.metadata.layerSources[layer.type];
  if (sources.length > 0) {
    lines.push(indent(`Active sources: ${sources.join(', ')}`));
  }

  lines.push('');
  lines.push(indent('Precedence chain:'));

  for (let i = 0; i < chain.length; i++) {
    const link = chain[i];
    const prefix = i === 0 ? '  1. ' : `  ${i + 1}. `;
    const scopeName = formatScopeName(link.scope, useColor);
    const status = link.hasContent
      ? `${link.itemCount} items`
      : useColor
      ? '\x1b[90m(empty)\x1b[0m'
      : '(empty)';

    const winner = link.hasContent && isWinningScope(link);
    const marker = winner
      ? useColor
        ? ' \x1b[32m← WINS\x1b[0m'
        : ' <- WINS'
      : '';

    lines.push(`${prefix}${scopeName}: ${status}${marker}`);

    if (link.hasContent) {
      lines.push(indent(`Path: ${link.path}`, 6));
    }
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Get merge strategy description for a layer
 */
function getMergeStrategy(layerType: LayerType): string {
  switch (layerType) {
    case LayerType.Rules:
      return 'Additive (all scopes combined)';
    case LayerType.Tools:
      return 'Additive (all scopes combined)';
    case LayerType.Methods:
      return 'Override (highest scope wins)';
    case LayerType.Knowledge:
      return 'Additive (all scopes combined)';
    case LayerType.Goals:
      return 'Override (highest scope wins)';
    default:
      return 'Unknown';
  }
}

/**
 * Check if this is the winning scope (has content and highest precedence)
 */
function isWinningScope(link: ChainLink): boolean {
  // For additive layers, all scopes with content "win"
  // For override layers, only the highest precedence scope wins
  return link.hasContent;
}

/**
 * Count items in layer content
 */
function countItems(content: any): number {
  if (!content || typeof content !== 'object') {
    return 0;
  }
  if (Array.isArray(content)) {
    return content.length;
  }
  // If only rawContent exists, count lines
  if (content.rawContent && typeof content.rawContent === 'string') {
    const hasOtherContent = Object.keys(content).some(k => k !== 'rawContent' && content[k]);
    if (!hasOtherContent) {
      return content.rawContent.split('\n').filter((l: string) => l.trim()).length;
    }
  }
  let count = 0;
  for (const [key, value] of Object.entries(content)) {
    if (key === 'rawContent') continue; // Skip rawContent in structured count
    if (Array.isArray(value)) {
      count += value.length;
    } else if (typeof value === 'object' && value !== null) {
      count += Object.keys(value).length;
    } else if (value !== undefined && value !== null && value !== '') {
      count += 1;
    }
  }
  return count;
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
 * Format layer name with color
 */
function formatLayerName(name: string, useColor: boolean): string {
  return useColor ? `\x1b[1m${name}\x1b[0m` : name;
}

/**
 * Format scope name with color
 */
function formatScopeName(scope: ScopeLevel, useColor: boolean): string {
  const colors = {
    [ScopeLevel.Task]: '\x1b[35m',      // Magenta
    [ScopeLevel.Project]: '\x1b[34m',   // Blue
    [ScopeLevel.User]: '\x1b[32m',      // Green
    [ScopeLevel.System]: '\x1b[90m',    // Gray
  };
  const reset = '\x1b[0m';
  const padded = scope.padEnd(8);
  return useColor ? `${colors[scope]}${padded}${reset}` : padded;
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
