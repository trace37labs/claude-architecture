/**
 * Command Parser
 *
 * Parses .claude/commands/*.md files (slash commands) and classifies
 * them into the TOOLS layer.
 */

import { readFileSync } from 'fs';
import type { CommandDefinition } from '../types/sources.js';
import type { ToolsLayer, SlashCommand } from '../types/layers.js';

/**
 * Parse a command definition file into Tools layer
 *
 * @param commandPath - Path to command .md file
 * @returns Tools layer with command definition
 */
export function parseCommand(commandPath: string): ToolsLayer {
  try {
    const content = readFileSync(commandPath, 'utf-8');
    const definition = extractCommandDefinition(content, commandPath);

    const rawContent = buildCommandMarkdown(definition);

    return {
      rawContent,
      commands: [
        {
          name: definition.name,
          description: definition.description,
          implementation: definition.path, // Use path as implementation reference
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to parse command at ${commandPath}: ${error}`);
  }
}

/**
 * Extract command definition from markdown content
 */
function extractCommandDefinition(
  content: string,
  commandPath: string
): CommandDefinition {
  // Extract command name from heading (# /command-name) or filename
  const nameMatch = content.match(/^#\s+\/([a-z-]+)/m);
  const basename = commandPath.split('/').pop()?.replace('.md', '') || '';
  const name = nameMatch ? nameMatch[1] : basename;

  // Extract description from quote or first paragraph
  const descMatch = content.match(/^>\s+(.+)$/m);
  const firstParaMatch = content.match(/^([^#\n>].+)$/m);
  const description = descMatch
    ? descMatch[1]
    : firstParaMatch
    ? firstParaMatch[1]
    : '';

  // Extract usage syntax
  const usage = extractUsageSyntax(content);

  // Extract examples
  const examples = extractExamples(content);

  return {
    name,
    description,
    path: commandPath,
    usage,
    examples,
  };
}

/**
 * Extract usage syntax from markdown
 */
function extractUsageSyntax(content: string): string | undefined {
  // Look for "## Usage" section
  const usageMatch = content.match(/^##\s+Usage\s*\n+([\s\S]*?)(?=\n##|\n$)/im);
  if (usageMatch) {
    // Extract first code block or line after "Usage"
    const codeMatch = usageMatch[1].match(/```(?:bash|sh)?\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    // Or just take the first non-empty line
    const lines = usageMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      return lines[0];
    }
  }

  return undefined;
}

/**
 * Extract examples from markdown
 */
function extractExamples(content: string): string[] | undefined {
  const examples: string[] = [];

  // Look for "## Examples" section
  const examplesMatch = content.match(/^##\s+Examples?\s*\n+([\s\S]*?)(?=\n##|\n$)/im);
  if (!examplesMatch) {
    return undefined;
  }

  const section = examplesMatch[1];

  // Extract code blocks
  const codeBlocks = section.matchAll(/```(?:bash|sh)?\n([\s\S]*?)```/g);
  for (const match of codeBlocks) {
    examples.push(match[1].trim());
  }

  // Extract bullet point examples
  const bulletMatches = section.matchAll(/^[-*]\s+(.+)$/gm);
  for (const match of bulletMatches) {
    examples.push(match[1].trim());
  }

  return examples.length > 0 ? examples : undefined;
}

/**
 * Build markdown for command definition
 */
function buildCommandMarkdown(definition: CommandDefinition): string {
  const lines = [`## /${definition.name}\n`];

  if (definition.description) {
    lines.push(`${definition.description}\n`);
  }

  if (definition.usage) {
    lines.push('**Usage:**\n');
    lines.push('```bash');
    lines.push(definition.usage);
    lines.push('```\n');
  }

  if (definition.examples && definition.examples.length > 0) {
    lines.push('**Examples:**\n');
    for (const example of definition.examples) {
      lines.push('```bash');
      lines.push(example);
      lines.push('```\n');
    }
  }

  return lines.join('\n');
}

/**
 * Parse multiple commands and merge into single Tools layer
 *
 * @param commandPaths - Array of command file paths
 * @returns Merged tools layer
 */
export function parseCommands(commandPaths: string[]): ToolsLayer {
  const allCommands: SlashCommand[] = [];

  const rawParts: string[] = [];

  for (const path of commandPaths) {
    try {
      const layer = parseCommand(path);
      if (layer.commands) {
        allCommands.push(...layer.commands);
      }
      if (layer.rawContent) {
        rawParts.push(layer.rawContent);
      }
    } catch (error) {
      // Skip unparseable commands
      console.warn(`Warning: Could not parse command at ${path}: ${error}`);
    }
  }

  return {
    rawContent: rawParts.join('\n\n---\n\n'),
    commands: allCommands,
  };
}

/**
 * Validate command definition structure
 */
export function validateCommand(commandPath: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = readFileSync(commandPath, 'utf-8');

    // Check for heading
    if (!/^#\s+\/[a-z-]+/m.test(content)) {
      errors.push('Missing command heading (should be "# /command-name")');
    }

    // Check for description
    if (!/^>\s+.+$/m.test(content) && !/^([^#\n>].+)$/m.test(content)) {
      warnings.push('Missing description');
    }

    // Check for usage section
    if (!/^##\s+Usage/im.test(content)) {
      warnings.push('Missing "Usage" section');
    }

    // Check for examples
    if (!/^##\s+Examples?/im.test(content)) {
      warnings.push('Missing "Examples" section');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read file: ${error}`],
      warnings: [],
    };
  }
}
