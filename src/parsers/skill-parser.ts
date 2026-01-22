/**
 * Skill Parser
 *
 * Parses .claude/skills/[star]/SKILL.md files and classifies content into
 * METHODS (workflows), KNOWLEDGE (references), and TOOLS (commands) layers.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import type { SkillManifest } from '../types/sources.js';
import type { MethodsLayer, KnowledgeLayer, ToolsLayer } from '../types/layers.js';

/**
 * Parse result from a skill
 */
export interface SkillParseResult {
  methods?: MethodsLayer;
  knowledge?: KnowledgeLayer;
  tools?: ToolsLayer;
  manifest: SkillManifest;
}

/**
 * Parse a skill directory and extract layer content
 *
 * @param skillPath - Path to SKILL.md file
 * @param skillId - Skill identifier
 * @returns Parsed layers and manifest
 */
export function parseSkill(skillPath: string, skillId: string): SkillParseResult {
  try {
    const content = readFileSync(skillPath, 'utf-8');
    const skillDir = resolve(skillPath, '..');

    // Extract manifest info
    const manifest = extractManifest(content, skillPath, skillId, skillDir);

    // Parse methods (workflows)
    const methods = parseWorkflows(skillDir, content);

    // Parse knowledge (references)
    const knowledge = parseReferences(skillDir, content);

    // Parse tools (commands)
    const tools = parseCommands(content);

    return {
      manifest,
      methods,
      knowledge,
      tools,
    };
  } catch (error) {
    throw new Error(`Failed to parse skill at ${skillPath}: ${error}`);
  }
}

/**
 * Extract skill manifest from SKILL.md
 */
function extractManifest(
  content: string,
  skillPath: string,
  skillId: string,
  skillDir: string
): SkillManifest {
  // Extract name from first heading
  const nameMatch = content.match(/^#\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1] : skillId;

  // Extract description from quote or first paragraph
  const descMatch = content.match(/^>\s+(.+)$/m);
  const firstParaMatch = content.match(/^([^#\n].+)$/m);
  const description = descMatch
    ? descMatch[1]
    : firstParaMatch
    ? firstParaMatch[1]
    : '';

  // Discover workflows and references
  const workflows = discoverWorkflows(skillDir);
  const references = discoverReferences(skillDir);
  const commands = extractCommandNames(content);

  return {
    id: skillId,
    name,
    description,
    path: skillPath,
    workflows,
    references,
    commands,
  };
}

/**
 * Parse workflows from skill
 */
function parseWorkflows(skillDir: string, skillContent: string): MethodsLayer | undefined {
  const workflowsDir = join(skillDir, 'workflows');

  if (!existsSync(workflowsDir)) {
    return undefined;
  }

  const workflows: Record<string, any> = {};
  const workflowFiles = readdirSync(workflowsDir).filter(f => f.endsWith('.md'));

  for (const file of workflowFiles) {
    const name = file.replace('.md', '');
    const path = join(workflowsDir, file);
    const content = readFileSync(path, 'utf-8');

    workflows[name] = {
      name,
      description: extractDescription(content),
      steps: extractWorkflowSteps(content),
      content,
    };
  }

  // Also extract workflows from main SKILL.md
  const embeddedWorkflows = extractEmbeddedWorkflows(skillContent);
  Object.assign(workflows, embeddedWorkflows);

  if (Object.keys(workflows).length === 0) {
    return undefined;
  }

  return {
    rawContent: buildWorkflowsMarkdown(workflows),
    workflows,
  };
}

/**
 * Parse references from skill
 */
function parseReferences(skillDir: string, _skillContent: string): KnowledgeLayer | undefined {
  const referencesDir = join(skillDir, 'references');

  if (!existsSync(referencesDir)) {
    return undefined;
  }

  const references: string[] = [];
  const refFiles = readdirSync(referencesDir).filter(f => f.endsWith('.md'));

  let rawContent = '## References\n\n';

  for (const file of refFiles) {
    const name = file.replace('.md', '');
    const path = join(referencesDir, file);
    const content = readFileSync(path, 'utf-8');

    references.push(name);
    rawContent += `### ${name}\n\n${content}\n\n`;
  }

  if (references.length === 0) {
    return undefined;
  }

  return {
    rawContent,
    // specifications could be added to KnowledgeLayer type later
  };
}

/**
 * Parse commands from skill content
 */
function parseCommands(content: string): ToolsLayer | undefined {
  const commands = extractCommandNames(content);

  if (!commands || commands.length === 0) {
    return undefined;
  }

  return {
    rawContent: `## Commands\n\n${commands.map(c => `- \`${c}\``).join('\n')}`,
    commands: commands.map(c => ({
      name: c,
      description: '',
      implementation: 'skill-provided'
    })),
  };
}

/**
 * Extract workflow steps from markdown
 */
function extractWorkflowSteps(content: string): string[] {
  const steps: string[] = [];
  const lines = content.split('\n');

  let inSteps = false;
  for (const line of lines) {
    if (/^##\s+steps/i.test(line)) {
      inSteps = true;
      continue;
    }

    if (inSteps && /^##/.test(line)) {
      break;
    }

    if (inSteps && /^\d+\./.test(line.trim())) {
      steps.push(line.trim());
    }
  }

  return steps;
}

/**
 * Extract embedded workflows from SKILL.md
 */
function extractEmbeddedWorkflows(_content: string): Record<string, any> {
  const workflows: Record<string, any> = {};
  // TODO: Implement embedded workflow extraction
  return workflows;
}

/**
 * Extract description from markdown
 */
function extractDescription(content: string): string {
  const descMatch = content.match(/^>\s+(.+)$/m);
  if (descMatch) return descMatch[1];

  const firstPara = content.match(/^([^#\n].+)$/m);
  return firstPara ? firstPara[1] : '';
}

/**
 * Discover workflow files
 */
function discoverWorkflows(skillDir: string): string[] {
  const workflowsDir = join(skillDir, 'workflows');

  if (!existsSync(workflowsDir)) {
    return [];
  }

  return readdirSync(workflowsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

/**
 * Discover reference files
 */
function discoverReferences(skillDir: string): string[] {
  const referencesDir = join(skillDir, 'references');

  if (!existsSync(referencesDir)) {
    return [];
  }

  return readdirSync(referencesDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

/**
 * Extract command names from skill content
 */
function extractCommandNames(content: string): string[] | undefined {
  const commands: string[] = [];

  // Look for command patterns like `xcodebuild`, `ssh`, etc.
  const codeBlockMatches = content.matchAll(/```(?:bash|sh)\n([\s\S]*?)```/g);

  for (const match of codeBlockMatches) {
    const block = match[1];
    const lines = block.split('\n');

    for (const line of lines) {
      const cmdMatch = line.trim().match(/^([a-z][a-z0-9-]+)/);
      if (cmdMatch && !commands.includes(cmdMatch[1])) {
        commands.push(cmdMatch[1]);
      }
    }
  }

  return commands.length > 0 ? commands : undefined;
}

/**
 * Build markdown for workflows
 */
function buildWorkflowsMarkdown(workflows: Record<string, any>): string {
  const lines = ['## Workflows\n'];

  for (const [name, workflow] of Object.entries(workflows)) {
    lines.push(`### ${name}\n`);
    if (workflow.description) {
      lines.push(`${workflow.description}\n`);
    }
    if (workflow.steps && workflow.steps.length > 0) {
      lines.push('**Steps:**\n');
      for (const step of workflow.steps) {
        lines.push(step);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
