/**
 * Recommendations Engine
 *
 * Generates actionable recommendations for improving configuration
 * based on detected conflicts and configuration analysis.
 */

import { MergedConfig } from '../types/config.js';
import { LayerType } from '../types/layers.js';
import { ConflictDetectionResult } from './conflict-detector.js';

/**
 * Recommendation priority
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Recommendation impact/effort
 */
export type RecommendationImpact = 'high' | 'medium' | 'low';
export type RecommendationEffort = 'high' | 'medium' | 'low';

/**
 * Actionable recommendation
 */
export interface Recommendation {
  /** Unique identifier */
  id: string;
  /** Recommendation title */
  title: string;
  /** Description of the issue */
  description: string;
  /** Suggested action */
  action: string;
  /** Expected benefit */
  benefit?: string;
  /** Priority level */
  priority: RecommendationPriority;
  /** Impact level */
  impact: RecommendationImpact;
  /** Effort required */
  effort: RecommendationEffort;
  /** Affected layer (optional) */
  layer?: LayerType;
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  /** All recommendations */
  recommendations: Recommendation[];
  /** Recommendations grouped by priority */
  byPriority: {
    high: Recommendation[];
    medium: Recommendation[];
    low: Recommendation[];
  };
  /** Quick wins (high impact, low effort) */
  quickWins: Recommendation[];
}

/**
 * Generate recommendations for configuration
 *
 * @param merged - Merged configuration
 * @param scopes - Individual scope configurations
 * @param conflicts - Detected conflicts
 * @returns Recommendations
 */
export function generateRecommendations(
  merged: MergedConfig,
  scopes: Record<string, any>,
  conflicts: ConflictDetectionResult
): RecommendationResult {
  const recommendations: Recommendation[] = [];

  // Generate recommendations based on conflicts
  generateConflictRecommendations(conflicts, recommendations);

  // Generate recommendations based on configuration analysis
  generateRulesRecommendations(merged, scopes, recommendations);
  generateToolsRecommendations(merged, scopes, recommendations);
  generateMethodsRecommendations(merged, scopes, recommendations);
  generateKnowledgeRecommendations(merged, scopes, recommendations);
  generateGoalsRecommendations(merged, scopes, recommendations);

  // Generate structural recommendations
  generateStructuralRecommendations(merged, scopes, recommendations);

  // Group by priority
  const byPriority = {
    high: recommendations.filter(r => r.priority === 'high'),
    medium: recommendations.filter(r => r.priority === 'medium'),
    low: recommendations.filter(r => r.priority === 'low'),
  };

  // Identify quick wins (high impact, low effort)
  const quickWins = recommendations.filter(
    r => r.impact === 'high' && r.effort === 'low'
  );

  return {
    recommendations,
    byPriority,
    quickWins,
  };
}

/**
 * Generate recommendations from conflicts
 */
function generateConflictRecommendations(
  conflicts: ConflictDetectionResult,
  recommendations: Recommendation[]
): void {
  // High priority: resolve errors
  if (conflicts.bySeverity.errors.length > 0) {
    recommendations.push({
      id: 'resolve-errors',
      title: 'Resolve configuration errors',
      description: `${conflicts.bySeverity.errors.length} error(s) detected in configuration`,
      action: 'Review and fix all errors listed in the doctor report',
      benefit: 'Prevent configuration failures and ensure system stability',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
    });
  }

  // Medium priority: address warnings
  if (conflicts.bySeverity.warnings.length > 0) {
    recommendations.push({
      id: 'address-warnings',
      title: 'Address configuration warnings',
      description: `${conflicts.bySeverity.warnings.length} warning(s) detected in configuration`,
      action: 'Review warnings and implement suggested fixes',
      benefit: 'Improve configuration quality and prevent future issues',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
    });
  }
}

/**
 * Generate recommendations for RULES layer
 */
function generateRulesRecommendations(
  merged: MergedConfig,
  _scopes: Record<string, any>,
  recommendations: Recommendation[]
): void {
  const rules = merged.rules;

  // Recommend adding security rules if missing
  if (!rules.security || rules.security.length === 0) {
    recommendations.push({
      id: 'add-security-rules',
      title: 'Add security rules',
      description: 'No security rules defined in configuration',
      action: 'Add security constraints to rules layer (e.g., forbidden file operations, API restrictions)',
      benefit: 'Establish clear security boundaries for AI operations',
      priority: 'high',
      impact: 'high',
      effort: 'low',
      layer: LayerType.Rules,
    });
  }

  // Recommend adding forbidden actions if missing
  if (!rules.forbidden || rules.forbidden.length === 0) {
    recommendations.push({
      id: 'add-forbidden-actions',
      title: 'Define forbidden actions',
      description: 'No forbidden actions specified',
      action: 'List actions that should never be performed (e.g., "delete production database", "modify critical files")',
      benefit: 'Prevent catastrophic mistakes through explicit constraints',
      priority: 'high',
      impact: 'high',
      effort: 'low',
      layer: LayerType.Rules,
    });
  }

  // Recommend adding required items if applicable
  if (!rules.required || rules.required.length === 0) {
    recommendations.push({
      id: 'consider-required-items',
      title: 'Consider required constraints',
      description: 'No required items specified',
      action: 'Define must-have requirements (e.g., "tests must pass", "code must be reviewed")',
      benefit: 'Ensure critical steps are never skipped',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      layer: LayerType.Rules,
    });
  }
}

/**
 * Generate recommendations for TOOLS layer
 */
function generateToolsRecommendations(
  merged: MergedConfig,
  _scopes: Record<string, any>,
  recommendations: Recommendation[]
): void {
  const tools = merged.tools;

  // Recommend adding MCP servers if missing
  if (!tools.mcpServers || tools.mcpServers.length === 0) {
    recommendations.push({
      id: 'add-mcp-servers',
      title: 'Configure MCP servers',
      description: 'No MCP servers configured',
      action: 'Add MCP server configurations to enable tool integrations',
      benefit: 'Unlock powerful integrations for database, filesystem, API access',
      priority: 'medium',
      impact: 'high',
      effort: 'medium',
      layer: LayerType.Tools,
    });
  }

  // Recommend adding commands/scripts if missing
  if (!tools.commands && !tools.scripts) {
    recommendations.push({
      id: 'add-commands-scripts',
      title: 'Define custom commands or scripts',
      description: 'No custom commands or scripts defined',
      action: 'Add project-specific commands or utility scripts',
      benefit: 'Streamline common tasks and workflows',
      priority: 'low',
      impact: 'medium',
      effort: 'low',
      layer: LayerType.Tools,
    });
  }

  // Check for MCP servers with missing descriptions
  if (tools.mcpServers) {
    const serversWithoutDesc = tools.mcpServers.filter(s => !s.description);
    if (serversWithoutDesc.length > 0) {
      recommendations.push({
        id: 'add-mcp-descriptions',
        title: 'Add descriptions to MCP servers',
        description: `${serversWithoutDesc.length} MCP server(s) lack descriptions`,
        action: `Add descriptions to: ${serversWithoutDesc.map(s => s.name).join(', ')}`,
        benefit: 'Help Claude understand when to use each tool',
        priority: 'low',
        impact: 'low',
        effort: 'low',
        layer: LayerType.Tools,
      });
    }
  }
}

/**
 * Generate recommendations for METHODS layer
 */
function generateMethodsRecommendations(
  merged: MergedConfig,
  _scopes: Record<string, any>,
  recommendations: Recommendation[]
): void {
  const methods = merged.methods;

  // Recommend adding workflows if missing
  if (!methods.workflows || Object.keys(methods.workflows).length === 0) {
    recommendations.push({
      id: 'add-workflows',
      title: 'Define workflows',
      description: 'No workflows defined',
      action: 'Add workflow definitions for common tasks (e.g., "code review", "deploy", "test")',
      benefit: 'Standardize processes and improve consistency',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
      layer: LayerType.Methods,
    });
  }

  // Recommend adding patterns if missing
  if (!methods.patterns || methods.patterns.length === 0) {
    recommendations.push({
      id: 'add-patterns',
      title: 'Document patterns',
      description: 'No patterns documented',
      action: 'Add common code patterns, architecture patterns, or design patterns',
      benefit: 'Guide Claude to follow project conventions',
      priority: 'medium',
      impact: 'medium',
      effort: 'medium',
      layer: LayerType.Methods,
    });
  }

  // Recommend adding best practices if missing
  if (!methods.bestPractices || methods.bestPractices.length === 0) {
    recommendations.push({
      id: 'add-best-practices',
      title: 'Document best practices',
      description: 'No best practices documented',
      action: 'Add project-specific best practices and coding guidelines',
      benefit: 'Ensure consistent code quality across the project',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      layer: LayerType.Methods,
    });
  }
}

/**
 * Generate recommendations for KNOWLEDGE layer
 */
function generateKnowledgeRecommendations(
  merged: MergedConfig,
  _scopes: Record<string, any>,
  recommendations: Recommendation[]
): void {
  const knowledge = merged.knowledge;

  // Recommend adding overview if missing
  if (!knowledge.overview) {
    recommendations.push({
      id: 'add-overview',
      title: 'Add project overview',
      description: 'No project overview in knowledge base',
      action: 'Write a high-level overview of the project (purpose, architecture, key concepts)',
      benefit: 'Help Claude understand project context quickly',
      priority: 'high',
      impact: 'high',
      effort: 'low',
      layer: LayerType.Knowledge,
    });
  }

  // Recommend adding architecture if missing
  if (!knowledge.architecture) {
    recommendations.push({
      id: 'add-architecture',
      title: 'Document architecture',
      description: 'No architecture documentation',
      action: 'Add architecture documentation (components, data flow, tech stack)',
      benefit: 'Enable Claude to make architecture-aware decisions',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
      layer: LayerType.Knowledge,
    });
  }

  // Recommend adding glossary if missing
  if (!knowledge.glossary || Object.keys(knowledge.glossary).length === 0) {
    recommendations.push({
      id: 'add-glossary',
      title: 'Create glossary',
      description: 'No project glossary defined',
      action: 'Add glossary of project-specific terms and acronyms',
      benefit: 'Ensure Claude uses correct terminology',
      priority: 'low',
      impact: 'medium',
      effort: 'low',
      layer: LayerType.Knowledge,
    });
  }
}

/**
 * Generate recommendations for GOALS layer
 */
function generateGoalsRecommendations(
  merged: MergedConfig,
  _scopes: Record<string, any>,
  recommendations: Recommendation[]
): void {
  const goals = merged.goals;

  // Recommend adding current goals if missing
  if (!goals.current || goals.current.trim().length === 0) {
    recommendations.push({
      id: 'add-current-goals',
      title: 'Define current goals',
      description: 'No current goals defined',
      action: 'Add current goals to guide Claude\'s work (e.g., "implement authentication", "fix performance issues")',
      benefit: 'Focus Claude\'s efforts on what matters most right now',
      priority: 'high',
      impact: 'high',
      effort: 'low',
      layer: LayerType.Goals,
    });
  }

  // Check for goals without success criteria
  if (goals.current && goals.current.trim().length > 0) {
    if (!goals.successCriteria || goals.successCriteria.length === 0) {
      recommendations.push({
        id: 'add-success-criteria',
        title: 'Add success criteria to goals',
        description: 'Current goals lack success criteria',
        action: 'Define measurable success criteria for current goals',
        benefit: 'Make goals trackable and know when they\'re complete',
        priority: 'high',
        impact: 'high',
        effort: 'low',
        layer: LayerType.Goals,
      });
    }
  }
}

/**
 * Generate structural recommendations
 */
function generateStructuralRecommendations(
  merged: MergedConfig,
  scopes: Record<string, any>,
  recommendations: Recommendation[]
): void {
  // Count populated layers
  const populatedLayers = [
    ((merged.rules.security?.length ?? 0) > 0) ||
      ((merged.rules.forbidden?.length ?? 0) > 0) ||
      ((merged.rules.required?.length ?? 0) > 0),
    ((merged.tools.mcpServers?.length ?? 0) > 0) ||
      ((merged.tools.commands?.length ?? 0) > 0) ||
      (merged.tools.scripts && Object.keys(merged.tools.scripts).length > 0),
    (merged.methods.workflows && Object.keys(merged.methods.workflows).length > 0) ||
      ((merged.methods.patterns?.length ?? 0) > 0) ||
      ((merged.methods.bestPractices?.length ?? 0) > 0),
    (merged.knowledge.overview !== undefined) ||
      (merged.knowledge.architecture !== undefined) ||
      (merged.knowledge.glossary !== undefined),
    (merged.goals.current !== undefined && merged.goals.current.trim().length > 0),
  ].filter(Boolean).length;

  // Recommend using more layers
  if (populatedLayers <= 2) {
    recommendations.push({
      id: 'use-more-layers',
      title: 'Utilize more configuration layers',
      description: `Only ${populatedLayers} out of 5 layers are populated`,
      action: 'Consider populating more layers for comprehensive configuration',
      benefit: 'Maximize the power of the 5-layer architecture',
      priority: 'low',
      impact: 'medium',
      effort: 'medium',
    });
  }

  // Count scopes in use
  const scopesInUse = Object.values(scopes).filter(s => s !== undefined).length;

  // Recommend using scope hierarchy
  if (scopesInUse <= 1) {
    recommendations.push({
      id: 'use-scope-hierarchy',
      title: 'Leverage scope hierarchy',
      description: 'Only one scope level in use',
      action: 'Consider using multiple scopes (User, Project, Task) for better organization',
      benefit: 'Share common config across projects, customize per project',
      priority: 'low',
      impact: 'medium',
      effort: 'medium',
    });
  }
}
