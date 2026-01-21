/**
 * Conflict Detector
 *
 * Detects conflicts, ambiguities, and issues in merged configuration.
 * Analyzes layer-specific conflicts and scope interactions.
 */

import { MergedConfig } from '../types/config.js';
import { LayerType } from '../types/layers.js';
import { ScopeLevel } from '../types/scope.js';

/**
 * Conflict severity levels
 */
export type ConflictSeverity = 'error' | 'warning' | 'info';

/**
 * Detected conflict
 */
export interface Conflict {
  /** Unique identifier */
  id: string;
  /** Affected layer */
  layer: LayerType;
  /** Severity level */
  severity: ConflictSeverity;
  /** Human-readable message */
  message: string;
  /** Additional details */
  details?: string;
  /** Suggestion for resolution */
  suggestion?: string;
  /** Affected scopes */
  scopes: ScopeLevel[];
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  /** All detected conflicts */
  conflicts: Conflict[];
  /** Conflicts grouped by severity */
  bySeverity: {
    errors: Conflict[];
    warnings: Conflict[];
    info: Conflict[];
  };
  /** Health score (0-100) */
  healthScore: number;
}

/**
 * Detect conflicts in merged configuration
 *
 * @param merged - Merged configuration
 * @param scopes - Individual scope configurations
 * @returns Detection results
 */
export function detectConflicts(
  merged: MergedConfig,
  scopes: Record<string, any>
): ConflictDetectionResult {
  const conflicts: Conflict[] = [];

  // Detect layer-specific conflicts
  detectRulesConflicts(merged, scopes, conflicts);
  detectToolsConflicts(merged, scopes, conflicts);
  detectMethodsConflicts(merged, scopes, conflicts);
  detectKnowledgeConflicts(merged, scopes, conflicts);
  detectGoalsConflicts(merged, scopes, conflicts);

  // Detect cross-layer conflicts
  detectCrossLayerConflicts(merged, scopes, conflicts);

  // Group by severity
  const bySeverity = {
    errors: conflicts.filter(c => c.severity === 'error'),
    warnings: conflicts.filter(c => c.severity === 'warning'),
    info: conflicts.filter(c => c.severity === 'info'),
  };

  // Calculate health score
  const healthScore = calculateHealthScore(bySeverity);

  return {
    conflicts,
    bySeverity,
    healthScore,
  };
}

/**
 * Detect conflicts in RULES layer
 */
function detectRulesConflicts(
  merged: MergedConfig,
  scopes: Record<string, any>,
  conflicts: Conflict[]
): void {
  const rules = merged.rules;

  // Check for conflicting security rules
  const securityRules = new Set<string>();
  for (const [scopeName, scopeConfig] of Object.entries(scopes)) {
    if (scopeConfig?.rules?.security) {
      for (const rule of scopeConfig.rules.security) {
        if (securityRules.has(rule)) {
          conflicts.push({
            id: `rules-security-duplicate-${rule}`,
            layer: LayerType.Rules,
            severity: 'warning',
            message: `Duplicate security rule: "${rule}"`,
            details: `Rule appears in multiple scopes`,
            suggestion: 'Remove duplicate rules or consolidate into higher-precedence scope',
            scopes: [scopeName as ScopeLevel],
          });
        }
        securityRules.add(rule);
      }
    }
  }

  // Check for contradictory forbidden/required items
  if (rules.forbidden && rules.required) {
    const forbiddenSet = new Set(rules.forbidden);
    const requiredSet = new Set(rules.required);

    for (const item of Array.from(forbiddenSet)) {
      if (requiredSet.has(item)) {
        conflicts.push({
          id: `rules-contradiction-${item}`,
          layer: LayerType.Rules,
          severity: 'error',
          message: `Contradiction: "${item}" is both forbidden and required`,
          details: 'Same item appears in both forbidden and required lists',
          suggestion: 'Remove from one list or resolve the contradiction',
          scopes: Object.keys(scopes) as ScopeLevel[],
        });
      }
    }
  }

  // Check for empty rules
  if (!rules.security && !rules.forbidden && !rules.required) {
    conflicts.push({
      id: 'rules-empty',
      layer: LayerType.Rules,
      severity: 'info',
      message: 'No rules defined',
      suggestion: 'Consider adding security rules, forbidden actions, or required constraints',
      scopes: [],
    });
  }
}

/**
 * Detect conflicts in TOOLS layer
 */
function detectToolsConflicts(
  merged: MergedConfig,
  scopes: Record<string, any>,
  conflicts: Conflict[]
): void {
  const tools = merged.tools;

  // Check for duplicate MCP server definitions across scopes
  const mcpServers = new Map<string, ScopeLevel[]>();

  for (const [scopeName, scopeConfig] of Object.entries(scopes)) {
    if (scopeConfig?.tools?.mcpServers) {
      for (const server of scopeConfig.tools.mcpServers) {
        const serverName = server.name;
        if (!mcpServers.has(serverName)) {
          mcpServers.set(serverName, []);
        }
        mcpServers.get(serverName)!.push(scopeName as ScopeLevel);
      }
    }
  }

  // Report duplicate servers across scopes
  for (const [serverName, serverScopes] of Array.from(mcpServers.entries())) {
    if (serverScopes.length > 1) {
      conflicts.push({
        id: `tools-mcp-duplicate-${serverName}`,
        layer: LayerType.Tools,
        severity: 'warning',
        message: `MCP server "${serverName}" defined in multiple scopes`,
        details: `Defined in: ${serverScopes.join(', ')}`,
        suggestion: 'Keep the most specific scope and remove duplicates',
        scopes: serverScopes,
      });
    }
  }

  // Check for empty tools
  if (!tools.mcpServers && !tools.commands && !tools.scripts) {
    conflicts.push({
      id: 'tools-empty',
      layer: LayerType.Tools,
      severity: 'info',
      message: 'No tools defined',
      suggestion: 'Consider adding MCP servers, commands, or scripts',
      scopes: [],
    });
  }
}

/**
 * Detect conflicts in METHODS layer
 */
function detectMethodsConflicts(
  merged: MergedConfig,
  scopes: Record<string, any>,
  conflicts: Conflict[]
): void {
  const methods = merged.methods;

  // Check for conflicting workflow definitions across scopes
  const workflowsByName = new Map<string, ScopeLevel[]>();

  for (const [scopeName, scopeConfig] of Object.entries(scopes)) {
    if (scopeConfig?.methods?.workflows) {
      const workflows = scopeConfig.methods.workflows;
      for (const workflowName of Object.keys(workflows)) {
        if (!workflowsByName.has(workflowName)) {
          workflowsByName.set(workflowName, []);
        }
        workflowsByName.get(workflowName)!.push(scopeName as ScopeLevel);
      }
    }
  }

  // Report duplicate workflows (may be intentional override, so just info)
  for (const [workflowName, workflowScopes] of Array.from(workflowsByName.entries())) {
    if (workflowScopes.length > 1) {
      conflicts.push({
        id: `methods-workflow-override-${workflowName}`,
        layer: LayerType.Methods,
        severity: 'info',
        message: `Workflow "${workflowName}" defined in multiple scopes`,
        details: `Defined in: ${workflowScopes.join(', ')}. More specific scope will take precedence.`,
        suggestion: 'Verify the intended workflow is being used',
        scopes: workflowScopes,
      });
    }
  }

  // Check for patterns without workflows
  if (methods.patterns && methods.patterns.length > 0 && !methods.workflows) {
    conflicts.push({
      id: 'methods-patterns-no-workflows',
      layer: LayerType.Methods,
      severity: 'info',
      message: 'Patterns defined but no workflows',
      suggestion: 'Consider adding workflows that use these patterns',
      scopes: [],
    });
  }

  // Check for empty methods
  if (!methods.workflows && !methods.patterns && !methods.bestPractices) {
    conflicts.push({
      id: 'methods-empty',
      layer: LayerType.Methods,
      severity: 'info',
      message: 'No methods defined',
      suggestion: 'Consider adding workflows, patterns, or best practices',
      scopes: [],
    });
  }
}

/**
 * Detect conflicts in KNOWLEDGE layer
 */
function detectKnowledgeConflicts(
  merged: MergedConfig,
  scopes: Record<string, any>,
  conflicts: Conflict[]
): void {
  const knowledge = merged.knowledge;

  // Check for duplicate architecture documentation across scopes
  const architectureScopes: ScopeLevel[] = [];

  for (const [scopeName, scopeConfig] of Object.entries(scopes)) {
    if (scopeConfig?.knowledge?.architecture) {
      architectureScopes.push(scopeName as ScopeLevel);
    }
  }

  // Report duplicate architecture docs (should merge, not conflict)
  if (architectureScopes.length > 1) {
    conflicts.push({
      id: 'knowledge-arch-duplicate',
      layer: LayerType.Knowledge,
      severity: 'info',
      message: 'Architecture documented in multiple scopes',
      details: `Found in: ${architectureScopes.join(', ')}. All definitions will be merged.`,
      suggestion: 'Verify all architecture documentation is consistent',
      scopes: architectureScopes,
    });
  }

  // Check for empty knowledge
  if (!knowledge.overview && !knowledge.architecture && !knowledge.glossary) {
    conflicts.push({
      id: 'knowledge-empty',
      layer: LayerType.Knowledge,
      severity: 'warning',
      message: 'No knowledge base defined',
      suggestion: 'Add project overview, architecture docs, or glossary to help Claude understand context',
      scopes: [],
    });
  }
}

/**
 * Detect conflicts in GOALS layer
 */
function detectGoalsConflicts(
  merged: MergedConfig,
  scopes: Record<string, any>,
  conflicts: Conflict[]
): void {
  const goals = merged.goals;

  // Check for conflicting current goals across scopes
  const currentGoalScopes: ScopeLevel[] = [];

  for (const [scopeName, scopeConfig] of Object.entries(scopes)) {
    if (scopeConfig?.goals?.current) {
      currentGoalScopes.push(scopeName as ScopeLevel);
    }
  }

  // Report overlapping goals (should override, most specific wins)
  if (currentGoalScopes.length > 1) {
    conflicts.push({
      id: 'goals-override',
      layer: LayerType.Goals,
      severity: 'info',
      message: 'Current goals defined in multiple scopes',
      details: `Defined in: ${currentGoalScopes.join(', ')}. Most specific scope will take precedence.`,
      suggestion: 'Remove from less specific scopes if override is unintentional',
      scopes: currentGoalScopes,
    });
  }

  // Check for empty current goals
  if (!goals.current || goals.current.trim().length === 0) {
    conflicts.push({
      id: 'goals-no-current',
      layer: LayerType.Goals,
      severity: 'warning',
      message: 'No current goals defined',
      suggestion: 'Add current goals to guide Claude\'s work',
      scopes: [],
    });
  }

  // Check for goals without success criteria
  if (goals.current && (!goals.successCriteria || goals.successCriteria.length === 0)) {
    conflicts.push({
      id: 'goals-no-criteria',
      layer: LayerType.Goals,
      severity: 'warning',
      message: 'Current goals have no success criteria',
      suggestion: 'Add measurable success criteria to track progress',
      scopes: [],
    });
  }
}

/**
 * Detect cross-layer conflicts
 */
function detectCrossLayerConflicts(
  merged: MergedConfig,
  _scopes: Record<string, any>,
  conflicts: Conflict[]
): void {
  // Check if goals reference tools that don't exist
  if (merged.goals.current && merged.tools.mcpServers) {
    const availableTools = new Set(merged.tools.mcpServers.map(s => s.name));
    const currentGoal = merged.goals.current.toLowerCase();

    for (const server of merged.tools.mcpServers) {
      const serverName = server.name.toLowerCase();
      if (currentGoal.includes(serverName) && !availableTools.has(server.name)) {
        conflicts.push({
          id: `cross-goal-tool-missing-${server.name}`,
          layer: LayerType.Goals,
          severity: 'warning',
          message: `Current goals may reference unavailable tool "${server.name}"`,
          suggestion: 'Verify tool is available or update goal description',
          scopes: [],
        });
      }
    }
  }

  // Check if goals reference workflows that don't exist
  if (merged.methods.workflows && merged.goals.current) {
    const availableWorkflows = new Set(Object.keys(merged.methods.workflows));
    const currentGoal = merged.goals.current.toLowerCase();

    for (const workflowName of Array.from(availableWorkflows)) {
      if (currentGoal.includes(workflowName.toLowerCase())) {
        conflicts.push({
          id: `cross-goal-workflow-reference-${workflowName}`,
          layer: LayerType.Goals,
          severity: 'info',
          message: `Current goals may reference workflow "${workflowName}"`,
          suggestion: 'Verify workflow exists in methods layer',
          scopes: [],
        });
      }
    }
  }
}

/**
 * Calculate overall health score
 *
 * Score ranges:
 * - 100: Perfect, no issues
 * - 80-99: Healthy, minor info messages
 * - 50-79: Needs attention, warnings present
 * - 0-49: Critical, errors present
 */
function calculateHealthScore(bySeverity: {
  errors: Conflict[];
  warnings: Conflict[];
  info: Conflict[];
}): number {
  const { errors, warnings, info } = bySeverity;

  // Start with perfect score
  let score = 100;

  // Deduct for each issue (errors are weighted more heavily)
  score -= errors.length * 15; // Errors: -15 points each
  score -= warnings.length * 5; // Warnings: -5 points each
  score -= info.length * 1; // Info: -1 point each

  // Floor at 0
  return Math.max(0, score);
}
