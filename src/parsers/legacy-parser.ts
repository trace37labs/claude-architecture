/**
 * Legacy Parser
 *
 * Parses existing CLAUDE.md and AGENTS.md files and classifies their content
 * into the 5-layer architecture (RULES > TOOLS > METHODS > KNOWLEDGE > GOALS).
 *
 * This provides backward compatibility with existing configuration formats.
 */

import { LayerType } from '../types/layers.js';
import type {
  RulesLayer,
  ToolsLayer,
  MethodsLayer,
  KnowledgeLayer,
  GoalsLayer,
  LayerContent,
} from '../types/layers.js';
import { classifyContent } from './layer-classifier.js';

/**
 * Parsed sections from a markdown file
 */
export interface MarkdownSection {
  /** Section heading (without # markers) */
  heading: string;
  /** Heading level (1-6) */
  level: number;
  /** Section content (markdown) */
  content: string;
  /** Line number where section starts */
  startLine: number;
  /** Line number where section ends */
  endLine: number;
}

/**
 * Result of parsing a legacy file
 */
export interface LegacyParseResult {
  /** Classified layers */
  layers: {
    rules?: RulesLayer;
    tools?: ToolsLayer;
    methods?: MethodsLayer;
    knowledge?: KnowledgeLayer;
    goals?: GoalsLayer;
  };
  /** Sections that couldn't be classified */
  unclassified: MarkdownSection[];
  /** Original file content */
  raw: string;
}

/**
 * Parse markdown into sections based on headings
 *
 * @param markdown - Raw markdown content
 * @returns Array of sections
 *
 * @example
 * ```typescript
 * const sections = parseMarkdownSections('# Rules\nNo secrets\n# Tools\nMCP');
 * // Returns sections for "Rules" and "Tools"
 * ```
 */
export function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split('\n');
  const sections: MarkdownSection[] = [];
  let currentSection: MarkdownSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Close previous section if exists
      if (currentSection) {
        currentSection.endLine = i - 1;
        sections.push(currentSection);
      }

      // Start new section
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();

      currentSection = {
        heading,
        level,
        content: '',
        startLine: i,
        endLine: i,
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }

  // Close last section
  if (currentSection) {
    currentSection.endLine = lines.length - 1;
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Parse a CLAUDE.md file and extract layer content
 *
 * @param content - Raw CLAUDE.md content
 * @returns Parsed layers and unclassified sections
 *
 * @example
 * ```typescript
 * const result = parseCLAUDEmd(fs.readFileSync('CLAUDE.md', 'utf-8'));
 * console.log(result.layers.rules);
 * ```
 */
export function parseCLAUDEmd(content: string): LegacyParseResult {
  const sections = parseMarkdownSections(content);
  const layers: LegacyParseResult['layers'] = {};
  const unclassified: MarkdownSection[] = [];

  // Classify each section
  for (const section of sections) {
    const classification = classifyContent(section.heading, section.content);

    if (classification.layer) {
      // Merge content into appropriate layer
      const layerContent = extractLayerContent(
        classification.layer,
        section.content
      );

      switch (classification.layer) {
        case LayerType.Rules:
          layers.rules = mergeLayers(layers.rules, layerContent as RulesLayer);
          break;
        case LayerType.Tools:
          layers.tools = mergeLayers(layers.tools, layerContent as ToolsLayer);
          break;
        case LayerType.Methods:
          layers.methods = mergeLayers(
            layers.methods,
            layerContent as MethodsLayer
          );
          break;
        case LayerType.Knowledge:
          layers.knowledge = mergeLayers(
            layers.knowledge,
            layerContent as KnowledgeLayer
          );
          break;
        case LayerType.Goals:
          layers.goals = mergeLayers(layers.goals, layerContent as GoalsLayer);
          break;
      }
    } else {
      unclassified.push(section);
    }
  }

  return {
    layers,
    unclassified,
    raw: content,
  };
}

/**
 * Parse an AGENTS.md file (primarily methods and workflows)
 *
 * @param content - Raw AGENTS.md content
 * @returns Parsed layers
 */
export function parseAGENTSmd(content: string): LegacyParseResult {
  // AGENTS.md is typically methods-focused
  const sections = parseMarkdownSections(content);
  const layers: LegacyParseResult['layers'] = {};
  const unclassified: MarkdownSection[] = [];

  // Most AGENTS.md content goes to methods layer
  for (const section of sections) {
    const classification = classifyContent(section.heading, section.content);

    // Default to methods if unclear
    const targetLayer = classification.layer || LayerType.Methods;
    const layerContent = extractLayerContent(targetLayer, section.content);

    switch (targetLayer) {
      case LayerType.Methods:
        layers.methods = mergeLayers(
          layers.methods,
          layerContent as MethodsLayer
        );
        break;
      case LayerType.Knowledge:
        layers.knowledge = mergeLayers(
          layers.knowledge,
          layerContent as KnowledgeLayer
        );
        break;
      default:
        unclassified.push(section);
    }
  }

  return {
    layers,
    unclassified,
    raw: content,
  };
}

/**
 * Extract structured content from markdown for a specific layer
 */
function extractLayerContent(
  layerType: LayerType,
  content: string
): LayerContent {
  const trimmed = content.trim();

  switch (layerType) {
    case LayerType.Rules:
      return {
        rawContent: trimmed,
        forbidden: extractListItems(content, /forbidden|don't|never|must not/i),
        required: extractListItems(content, /required|must|always/i),
        security: extractListItems(content, /security|auth|credential/i),
      };

    case LayerType.Tools:
      return {
        rawContent: trimmed,
        mcpServers: extractMCPServers(content),
        commands: extractCommands(content),
      };

    case LayerType.Methods:
      return {
        rawContent: trimmed,
        workflows: extractWorkflows(content),
        bestPractices: extractListItems(content, /best practice|pattern|how to/i),
      };

    case LayerType.Knowledge:
      return {
        rawContent: trimmed,
        overview: extractOverview(content),
        architecture: extractArchitecture(content),
      };

    case LayerType.Goals:
      return {
        rawContent: trimmed,
        current: extractCurrentGoal(content),
        priorities: extractListItems(content, /priority|important|critical/i),
      };
  }
}

/**
 * Extract list items from markdown matching a pattern
 */
function extractListItems(content: string, pattern: RegExp): string[] {
  const items: string[] = [];
  const lines = content.split('\n');

  let inRelevantSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if we're entering a relevant section
    if (pattern.test(trimmed)) {
      inRelevantSection = true;
    }

    // Extract bullet points
    if (inRelevantSection && /^[-*+]\s+(.+)$/.test(trimmed)) {
      const match = trimmed.match(/^[-*+]\s+(.+)$/);
      if (match) {
        items.push(match[1]);
      }
    }

    // Stop at next heading
    if (/^#+\s/.test(trimmed)) {
      inRelevantSection = false;
    }
  }

  return items;
}

/**
 * Extract MCP server configurations from content
 */
function extractMCPServers(content: string): any[] | undefined {
  const servers = [];
  const mcpPattern = /claude\s+mcp\s+add\s+(\S+)\s+--\s+(.+)/gi;

  let match;
  while ((match = mcpPattern.exec(content)) !== null) {
    servers.push({
      name: match[1],
      command: match[2].split(' ')[0],
      args: match[2].split(' ').slice(1),
    });
  }

  return servers.length > 0 ? servers : undefined;
}

/**
 * Extract command definitions
 */
function extractCommands(_content: string): any[] | undefined {
  // TODO: Implement command extraction logic
  return undefined;
}

/**
 * Extract workflow definitions
 */
function extractWorkflows(_content: string): Record<string, any> | undefined {
  // TODO: Implement workflow extraction logic
  return undefined;
}

/**
 * Extract project overview
 */
function extractOverview(content: string): string | undefined {
  const lines = content.split('\n');
  const firstParagraph = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^#+\s/.test(trimmed)) continue;

    firstParagraph.push(trimmed);

    // Stop after first paragraph (empty line or heading)
    if (firstParagraph.length > 0 && !trimmed) {
      break;
    }
  }

  return firstParagraph.length > 0 ? firstParagraph.join(' ') : undefined;
}

/**
 * Extract architecture description
 */
function extractArchitecture(content: string): string | undefined {
  if (/architecture|design|structure/i.test(content)) {
    return content.trim();
  }
  return undefined;
}

/**
 * Extract current goal
 */
function extractCurrentGoal(content: string): string | undefined {
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^current|^goal|^objective/i.test(trimmed)) {
      return trimmed;
    }
  }

  return undefined;
}

/**
 * Merge two layer objects (additive)
 */
function mergeLayers<T extends LayerContent>(
  existing: T | undefined,
  incoming: T | undefined
): T | undefined {
  if (!existing && !incoming) {
    return undefined;
  }

  if (!existing) {
    return incoming;
  }

  if (!incoming) {
    return existing;
  }

  // Merge rawContent
  const merged = { ...existing, ...incoming };

  if (existing.rawContent && incoming.rawContent) {
    merged.rawContent = `${existing.rawContent}\n\n${incoming.rawContent}`;
  }

  // Merge arrays
  for (const key of Object.keys(merged)) {
    const existingVal = existing[key as keyof LayerContent];
    const incomingVal = incoming[key as keyof LayerContent];
    if (Array.isArray(existingVal) && Array.isArray(incomingVal)) {
      (merged as any)[key] = [...existingVal, ...incomingVal];
    }
  }

  return merged;
}

/**
 * Parse multiple legacy files and merge the results
 *
 * @param files - Map of filenames to content
 * @returns Merged parse result
 */
export function parseLegacyFiles(
  files: Map<string, string>
): LegacyParseResult {
  const results: LegacyParseResult[] = [];

  for (const [filename, content] of files) {
    if (filename.toLowerCase().includes('claude')) {
      results.push(parseCLAUDEmd(content));
    } else if (filename.toLowerCase().includes('agents')) {
      results.push(parseAGENTSmd(content));
    }
  }

  // Merge all results
  return results.reduce(
    (acc, result) => ({
      layers: {
        rules: mergeLayers(acc.layers.rules, result.layers.rules),
        tools: mergeLayers(acc.layers.tools, result.layers.tools),
        methods: mergeLayers(acc.layers.methods, result.layers.methods),
        knowledge: mergeLayers(acc.layers.knowledge, result.layers.knowledge),
        goals: mergeLayers(acc.layers.goals, result.layers.goals),
      },
      unclassified: [...acc.unclassified, ...result.unclassified],
      raw: acc.raw + '\n\n---\n\n' + result.raw,
    }),
    { layers: {}, unclassified: [], raw: '' }
  );
}
