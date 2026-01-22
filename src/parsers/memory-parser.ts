/**
 * Memory Parser
 *
 * Parses ~/.claude/memory/*.md files and classifies them into
 * the KNOWLEDGE layer.
 */

// import { readFileSync } from 'fs'; // Unused import
import type { UserMemoryFile } from '../types/sources.js';
import type { KnowledgeLayer } from '../types/layers.js';
import { classifyContent } from './layer-classifier.js';
import { LayerType } from '../types/layers.js';

/**
 * Parse memory files into Knowledge layer
 *
 * @param memoryFiles - Array of memory file metadata
 * @returns Knowledge layer with memory content
 */
export function parseMemoryFiles(memoryFiles: UserMemoryFile[]): KnowledgeLayer {
  if (memoryFiles.length === 0) {
    return {
      rawContent: '',
    };
  }

  const rawParts: string[] = ['## User Memory\n'];
  const byCategory: Record<string, UserMemoryFile[]> = {};

  // Group by category
  for (const file of memoryFiles) {
    const category = file.category || 'general';
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(file);
  }

  // Build markdown organized by category
  for (const [category, files] of Object.entries(byCategory)) {
    rawParts.push(`\n### ${capitalizeFirst(category)}\n`);

    for (const file of files) {
      rawParts.push(`#### ${file.name.replace('.md', '')}\n`);
      rawParts.push(file.content);
      rawParts.push('');
    }
  }

  const rawContent = rawParts.join('\n');

  // Extract structured information (for future use)
  // const context = extractContextualKnowledge(memoryFiles);
  // const userPreferences = extractUserPreferences(memoryFiles);

  return {
    rawContent,
  };
}

/**
 * Parse a single memory file and classify it
 *
 * @param memoryFile - Memory file metadata
 * @returns Layer type and parsed content
 */
export function classifyMemoryFile(memoryFile: UserMemoryFile): {
  layer: LayerType | null;
  confidence: number;
  content: string;
} {
  // Use layer classifier to determine best layer
  const classification = classifyContent(
    memoryFile.name.replace('.md', ''),
    memoryFile.content
  );

  return {
    layer: classification.layer,
    confidence: classification.confidence,
    content: memoryFile.content,
  };
}

/**
 * Extract contextual knowledge from memory files
 * @internal Reserved for future use
 */
// @ts-ignore - Reserved for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractContextualKnowledge(memoryFiles: UserMemoryFile[]): string[] {
  const knowledge: string[] = [];

  for (const file of memoryFiles) {
    // Look for fact-like statements
    const lines = file.content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      // Bullet points or numbered lists
      if (/^[-*\d]+\.?\s+(.+)$/.test(trimmed)) {
        const match = trimmed.match(/^[-*\d]+\.?\s+(.+)$/);
        if (match) {
          knowledge.push(match[1]);
        }
      }

      // Direct statements (sentences that aren't questions or commands)
      if (/^[A-Z][^?!]*\.$/.test(trimmed) && trimmed.length > 20) {
        knowledge.push(trimmed);
      }
    }
  }

  return knowledge;
}

/**
 * Extract user preferences from memory files
 * @internal Reserved for future use
 */
// @ts-ignore - Reserved for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractUserPreferences(memoryFiles: UserMemoryFile[]): Record<string, string> | undefined {
  const preferences: Record<string, string> = {};

  for (const file of memoryFiles) {
    // Look for preference patterns like "I prefer X", "I like Y", "I always Z"
    const prefPatterns = [
      /I prefer ([^.]+)/gi,
      /I like ([^.]+)/gi,
      /I always ([^.]+)/gi,
      /I want ([^.]+)/gi,
      /I need ([^.]+)/gi,
    ];

    for (const pattern of prefPatterns) {
      const matches = file.content.matchAll(pattern);
      for (const match of matches) {
        const key = match[0].split(' ')[1]; // "prefer", "like", etc.
        preferences[key] = match[1].trim();
      }
    }
  }

  return Object.keys(preferences).length > 0 ? preferences : undefined;
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Validate memory file structure
 */
export function validateMemoryFile(memoryFile: UserMemoryFile): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check if content is empty
  if (!memoryFile.content.trim()) {
    warnings.push('Memory file is empty');
  }

  // Check if content is too short to be useful
  if (memoryFile.content.trim().length < 20) {
    warnings.push('Memory file content is very short (less than 20 characters)');
  }

  // Check if file has a clear category
  if (!memoryFile.category || memoryFile.category === 'general') {
    warnings.push('Consider organizing memory file into a specific category (use filename prefix)');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Suggest better organization for memory files
 */
export function suggestMemoryOrganization(memoryFiles: UserMemoryFile[]): string[] {
  const suggestions: string[] = [];

  // Check for files that should be categorized
  const uncategorized = memoryFiles.filter(f => !f.category || f.category === 'general');
  if (uncategorized.length > 3) {
    suggestions.push(
      `Consider organizing ${uncategorized.length} general memory files into categories (e.g., preferences-, context-, learnings-)`
    );
  }

  // Check for files that might be better as project config
  for (const file of memoryFiles) {
    if (/project|workflow|procedure/i.test(file.content)) {
      suggestions.push(
        `"${file.name}" contains project-specific information - consider moving to project's .claude/knowledge/`
      );
    }
  }

  return suggestions;
}
