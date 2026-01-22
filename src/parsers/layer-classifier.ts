/**
 * Layer Classifier
 *
 * Intelligently classifies markdown sections into the 5-layer architecture
 * based on heading text and content analysis.
 */

import { LayerType } from '../types/layers.js';

/**
 * Classification result
 */
export interface Classification {
  /** The layer this content belongs to (null if unclear) */
  layer: LayerType | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for classification */
  reason: string;
}

/**
 * Keywords and patterns for each layer
 */
const LAYER_PATTERNS = {
  [LayerType.Rules]: {
    headingKeywords: [
      'rule',
      'constraint',
      'forbidden',
      'required',
      'security',
      'compliance',
      'policy',
      'must',
      'prohibition',
      'critical',
      'checklist',
      'permission',
      'restriction',
    ],
    contentPatterns: [
      /\b(never|must not|forbidden|prohibited|don't|do not)\b/i,
      /\b(must|required|mandatory|always)\b/i,
      /\b(security|auth|credential|password)\b/i,
      /\b(compliance|regulation|legal)\b/i,
      /\bALWAYS\s+use\b/,
      /\bNEVER\s+/i,
      /\bCRITICAL:/i,
      /\b(before\s+any\s+commit|before\s+deployment)\b/i,
      /^-\s*\[\s*\]\s+/m, // Checkbox items (often rules/requirements)
      /\b(constraint|requirement|must follow)\b/i,
    ],
  },
  [LayerType.Tools]: {
    headingKeywords: [
      'tool',
      'mcp',
      'server',
      'command',
      'api',
      'service',
      'integration',
      'capability',
      'script',
      'access',
      'vps',
      'ssh',
      'hook',
      'slash command',
    ],
    contentPatterns: [
      /claude\s+mcp\s+add/i,
      /\b(api|endpoint|service)\b/i,
      /\b(command|script|executable|tool)\b/i,
      /\b(integration|plugin|extension|hook)\b/i,
      /```bash\s+/i, // Bash code blocks indicate tools/commands
      /```sh\s+/i,
      /^(ssh|curl|docker|git|npm|npx|xcodebuild)\s+/m, // Common command patterns
      /\b(mcp\s+server|slash\s+command)\b/i,
    ],
  },
  [LayerType.Methods]: {
    headingKeywords: [
      'method',
      'workflow',
      'practice',
      'how to',
      'procedure',
      'process',
      'guideline',
      'approach',
      'technique',
      'strategy',
      'when running',
      'testing',
      'pattern',
      'checklist',
      'protocol',
    ],
    contentPatterns: [
      /\b(workflow|process|procedure|protocol)\b/i,
      /\b(best practice|guideline|methodology)\b/i,
      /\b(how to|steps|instructions)\b/i,
      /step\s+\d+/i,
      /\b(pattern:\s*use|use.*pattern)\b/i,
      /\bWhen\s+(running|executing|deploying|testing)\b/i,
      /\b(testing|test|audit)\s+(strategy|approach|notes|checklist)\b/i,
      /\b(code\s+pattern|design\s+pattern|development\s+pattern)\b/i,
      /when\s+.*(do|run|execute)/i,
    ],
  },
  [LayerType.Knowledge]: {
    headingKeywords: [
      'knowledge',
      'architecture',
      'overview',
      'context',
      'background',
      'adr',
      'glossary',
      'domain',
      'structure',
      'directory',
      'details',
      'gotcha',
      'issue',
      'discovery',
    ],
    contentPatterns: [
      /\b(architecture|structure)\b/i,
      /\b(overview|background|context)\b/i,
      /\b(specification:\s*|spec:\s*|requirement)\b/i,
      /\b(glossary|terminology|definition)\b/i,
      /\b(adr|decision record)\b/i,
      /\b(directory\s+structure|project\s+structure)\b/i,
      /\b(bundle\s+id|deployment\s+target|framework)\b/i,
      /\b(known\s+(issues?|gotchas?|problems?))\b/i,
      /\b(useful\s+discover(y|ies))\b/i,
      /^\s*[A-Z_]+:\s+/m, // Path constants like "PROJECT_ROOT:"
    ],
  },
  [LayerType.Goals]: {
    headingKeywords: [
      'goal',
      'objective',
      'target',
      'current',
      'task',
      'todo',
      'priority',
      'milestone',
      'deliverable',
      'now',
    ],
    contentPatterns: [
      /\b(goal|objective|target)\b/i,
      /\b(current:\s*|now|today)\b/i,
      /\b(todo|task|action item)\b/i,
      /\b(priority|important|urgent)\b/i,
      /\b(milestone|deadline|due)\b/i,
    ],
  },
};

/**
 * Classify content into a layer based on heading and content
 *
 * @param heading - Section heading text
 * @param content - Section content
 * @returns Classification result
 *
 * @example
 * ```typescript
 * const result = classifyContent('Security Rules', 'Never commit secrets');
 * // result.layer === LayerType.Rules
 * // result.confidence === 0.9
 * ```
 */
export function classifyContent(
  heading: string,
  content: string
): Classification {
  const headingLower = heading.toLowerCase();
  const contentLower = content.toLowerCase();

  const scores: Record<LayerType, number> = {
    [LayerType.Rules]: 0,
    [LayerType.Tools]: 0,
    [LayerType.Methods]: 0,
    [LayerType.Knowledge]: 0,
    [LayerType.Goals]: 0,
  };

  // Score based on heading keywords
  for (const [layer, patterns] of Object.entries(LAYER_PATTERNS)) {
    const layerType = layer as LayerType;
    const { headingKeywords, contentPatterns } = patterns;

    // Check heading keywords (higher weight)
    for (const keyword of headingKeywords) {
      if (headingLower.includes(keyword)) {
        scores[layerType] += 2;
      }
    }

    // Check content patterns (lower weight)
    for (const pattern of contentPatterns) {
      if (pattern.test(contentLower)) {
        scores[layerType] += 1;
      }
    }
  }

  // Find highest scoring layer
  let maxScore = 0;
  let bestLayer: LayerType | null = null;

  for (const [layer, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestLayer = layer as LayerType;
    }
  }

  // Calculate confidence (normalize to 0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  // Only classify if confidence is reasonable
  if (confidence < 0.3) {
    return {
      layer: null,
      confidence: 0,
      reason: 'Content does not clearly match any layer pattern',
    };
  }

  return {
    layer: bestLayer,
    confidence,
    reason: `Matched ${maxScore} patterns for ${bestLayer} layer`,
  };
}

/**
 * Classify multiple sections and return a report
 *
 * @param sections - Array of section headings and content
 * @returns Classification report
 */
export function classifySections(
  sections: Array<{ heading: string; content: string }>
): Array<Classification & { heading: string }> {
  return sections.map(({ heading, content }) => ({
    heading,
    ...classifyContent(heading, content),
  }));
}

/**
 * Suggest which layer a piece of content should go into
 *
 * @param description - Description of the content
 * @returns Suggested layer with explanation
 */
export function suggestLayer(description: string): Classification {
  return classifyContent(description, description);
}

/**
 * Validate that content is appropriate for a specific layer
 *
 * @param layer - Target layer
 * @param content - Content to validate
 * @returns Validation result with suggestions
 */
export function validateLayerContent(
  layer: LayerType,
  content: string
): {
  valid: boolean;
  confidence: number;
  suggestions?: string[];
} {
  // Classify the content based on what it actually contains
  const classification = classifyContent('', content);

  if (classification.layer === layer) {
    return {
      valid: true,
      confidence: classification.confidence,
    };
  }

  const suggestions: string[] = [];

  if (classification.layer) {
    suggestions.push(
      `Content appears to be ${classification.layer} rather than ${layer}`
    );
    suggestions.push(
      `Consider moving this content to the ${classification.layer} layer`
    );
  } else {
    suggestions.push('Content does not clearly match any layer pattern');
    suggestions.push('Consider adding more specific keywords or structure');
  }

  return {
    valid: false,
    confidence: classification.confidence,
    suggestions,
  };
}

/**
 * Get layer-specific content guidelines
 *
 * @param layer - Layer type
 * @returns Guidelines for that layer
 */
export function getLayerGuidelines(layer: LayerType): {
  description: string;
  examples: string[];
  keywords: string[];
} {
  const patterns = LAYER_PATTERNS[layer];

  const descriptions = {
    [LayerType.Rules]:
      'Absolute constraints, security policies, and forbidden actions',
    [LayerType.Tools]: 'Available capabilities, MCP servers, commands, and APIs',
    [LayerType.Methods]: 'Workflow definitions, patterns, and best practices for how to work',
    [LayerType.Knowledge]:
      'Project context, architecture, specifications, and background',
    [LayerType.Goals]: 'Current objectives, tasks, priorities, and success criteria',
  };

  const examples = {
    [LayerType.Rules]: [
      'Never commit API keys or secrets',
      'Always validate user input',
      'Security scan required before deployment',
    ],
    [LayerType.Tools]: [
      'MCP server for database access',
      'Custom command for running tests',
      'GitHub API integration',
    ],
    [LayerType.Methods]: [
      'Feature development workflow',
      'Code review checklist',
      'Testing strategy pattern',
    ],
    [LayerType.Knowledge]: [
      'System architecture overview',
      'Domain glossary',
      'Architecture Decision Records',
    ],
    [LayerType.Goals]: [
      'Implement user authentication',
      'Achieve 80% test coverage',
      'Deploy to production by Friday',
    ],
  };

  return {
    description: descriptions[layer],
    examples: examples[layer],
    keywords: patterns.headingKeywords,
  };
}
